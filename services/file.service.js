const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const prisma = require("../config/prisma");
const s3 = require("../config/s3.config");

const DAY_MS = 24 * 60 * 60 * 1000;

// Tracking tidak boleh menggagalkan upload/download: DB error hanya di-log.
// ponytail: fire-and-forget, kalau butuh audit kuat ganti ke await + retry queue.
const track = (promise) =>
  promise.catch((err) => console.error("[track]", err.message));

const isNotFound = (err) =>
  err?.name === "NoSuchKey" || err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404;

class FileService {
  constructor() {
    this.uploadPath = path.join(__dirname, "../storage/uploads");
  }

  // Tolak nama yang bisa keluar dari storage/uploads (path traversal).
  safeName(filename) {
    return typeof filename === "string" && filename && path.basename(filename) === filename
      ? filename
      : null;
  }

  localPath(filename) {
    return path.join(this.uploadPath, filename);
  }

  // Nama file sama untuk kedua backend, supaya URL /storage/uploads/<filename> stabil.
  static makeFilename(file) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    return file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
  }

  async saveFile(file) {
    const filename = FileService.makeFilename(file);

    if (s3.enabled) {
      await s3.client.send(
        new PutObjectCommand({
          Bucket: s3.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      return { filename, storage: "s3" };
    }

    fs.mkdirSync(this.uploadPath, { recursive: true });
    fs.writeFileSync(this.localPath(filename), file.buffer);
    return { filename, storage: "local" };
  }

  async getFile(filename) {
    const name = this.safeName(filename);
    if (!name) return null;

    const filePath = this.localPath(name);
    if (fs.existsSync(filePath)) {
      return {
        stream: fs.createReadStream(filePath),
        size: fs.statSync(filePath).size,
        storage: "local",
      };
    }

    if (!s3.enabled) return null;

    try {
      const object = await s3.client.send(
        new GetObjectCommand({ Bucket: s3.bucket, Key: name })
      );
      return {
        stream: object.Body,
        size: object.ContentLength,
        mimetype: object.ContentType,
        storage: "s3",
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async remoteExists(filename) {
    if (!s3.enabled) return false;
    try {
      await s3.client.send(
        new HeadObjectCommand({ Bucket: s3.bucket, Key: filename })
      );
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  }

  async deleteFile(filename) {
    const name = this.safeName(filename);
    if (!name) return false;

    const filePath = this.localPath(name);
    const localExists = fs.existsSync(filePath);
    const remoteExists = await this.remoteExists(name);
    if (!localExists && !remoteExists) return false;

    if (localExists) fs.unlinkSync(filePath);
    if (remoteExists) {
      await s3.client.send(
        new DeleteObjectCommand({ Bucket: s3.bucket, Key: name })
      );
    }

    // Tunggu row DB ikut terhapus supaya cron langsung melihat state konsisten.
    await prisma.fileRecord
      .deleteMany({ where: { filename: name } })
      .catch((err) => console.error("[track]", err.message));
    return true;
  }

  listLocal() {
    if (!fs.existsSync(this.uploadPath)) return [];
    return fs.readdirSync(this.uploadPath);
  }

  // Semua objek di bucket (paginasi), dipakai listFiles() dan stats().
  async listRemote() {
    if (!s3.enabled) return [];

    const objects = [];
    let token;
    do {
      const page = await s3.client.send(
        new ListObjectsV2Command({ Bucket: s3.bucket, ContinuationToken: token })
      );
      for (const item of page.Contents || []) {
        if (!item.Key || item.Key.endsWith("/")) continue; // folder marker, bukan file
        objects.push({
          filename: item.Key,
          size: item.Size ?? 0,
          uploadedAt: item.LastModified ?? null,
        });
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);

    return objects;
  }

  // Gabungan file lokal (termasuk upload lama) dan objek S3. Lokal menang saat nama sama.
  async listFiles() {
    const names = new Set(this.listLocal());
    for (const object of await this.listRemote()) names.add(object.filename);
    return [...names];
  }

  recordUpload(file) {
    return track(
      prisma.fileRecord.upsert({
        where: { filename: file.filename },
        create: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        update: { originalName: file.originalname, mimetype: file.mimetype, size: file.size },
      })
    );
  }

  recordAccess(filename, knownSize) {
    let size = knownSize ?? 0;
    if (knownSize == null) {
      try {
        size = fs.statSync(this.localPath(filename)).size;
      } catch {
        // File di S3 saja: ukuran diisi ulang saat upsert berikutnya.
      }
    }
    const now = new Date();
    return track(
      prisma.fileRecord.upsert({
        where: { filename },
        create: { filename, size, lastAccessedAt: now, accessCount: 1 },
        update: { lastAccessedAt: now, accessCount: { increment: 1 } },
      })
    );
  }

  // Disk + S3 = sumber kebenaran daftar file; DB hanya metadata akses.
  async listAssets() {
    const assets = new Map();

    for (const filename of this.listLocal()) {
      const st = fs.statSync(this.localPath(filename));
      assets.set(filename, { size: st.size, uploadedAt: st.mtime });
    }
    for (const object of await this.listRemote()) {
      if (assets.has(object.filename)) continue; // duplikat: hitung yang lokal
      assets.set(object.filename, {
        size: object.size,
        uploadedAt: object.uploadedAt ?? new Date(),
      });
    }

    return assets;
  }

  async recordsFor(names) {
    if (!names.length) return new Map();
    const records = await prisma.fileRecord.findMany({
      where: { filename: { in: names } },
    });
    return new Map(records.map((r) => [r.filename, r]));
  }

  // File yang tidak disentuh (bukan diakses, bukan baru diupload) selama `days`.
  // ponytail: akses = lastAccessedAt, fallback createdAt/mtime; tanpa audit per-user.
  async listStale(days = 60) {
    const assets = await this.listAssets();
    const byName = await this.recordsFor([...assets.keys()]);
    const localNames = new Set(this.listLocal());
    const cutoff = Date.now() - days * DAY_MS;

    return [...assets.entries()]
      .filter(([filename, asset]) => {
        const rec = byName.get(filename);
        // Objek bucket yang tidak pernah lewat aplikasi ini (tanpa row DB dan
        // bukan file lokal) jangan dihapus cron.
        if (s3.enabled && !localNames.has(filename) && !rec) return false;
        const lastSeen = rec?.lastAccessedAt ?? rec?.createdAt ?? asset.uploadedAt;
        return new Date(lastSeen).getTime() < cutoff;
      })
      .map(([filename]) => filename);
  }

  async stats(days = 60) {
    const assets = await this.listAssets();
    const byName = await this.recordsFor([...assets.keys()]);
    const cutoff = new Date(Date.now() - days * DAY_MS);

    const files = [...assets.keys()].map((filename) => {
      const asset = assets.get(filename);
      const rec = byName.get(filename);
      const lastAccessedAt = rec?.lastAccessedAt ?? null;
      return {
        filename,
        size: asset.size,
        uploadedAt: (rec?.createdAt ?? asset.uploadedAt).toISOString(),
        lastAccessedAt: lastAccessedAt ? lastAccessedAt.toISOString() : null,
        accessCount: rec?.accessCount ?? 0,
        unused: !lastAccessedAt || lastAccessedAt < cutoff,
      };
    });

    files.sort(
      (a, b) =>
        Number(b.unused) - Number(a.unused) ||
        (a.lastAccessedAt ?? "").localeCompare(b.lastAccessedAt ?? "")
    );

    const unused = files.filter((f) => f.unused);
    return {
      days,
      summary: {
        totalFiles: files.length,
        totalSize: files.reduce((s, f) => s + f.size, 0),
        unusedFiles: unused.length,
        unusedSize: unused.reduce((s, f) => s + f.size, 0),
        neverAccessed: files.filter((f) => f.accessCount === 0).length,
      },
      files,
    };
  }
}

module.exports = new FileService();
