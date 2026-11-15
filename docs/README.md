# File Server — Integration Docs

Server upload/download file berbasis Express 5 + Multer disk storage.
Satu-satunya hal yang perlu kamu tahu untuk integrasi ada di file ini.

- Runtime: Node 20+ (`node server.js`)
- Port default: `6969` (env `PORT`)
- Base URL dev: `http://localhost:6969`
- Auth: **tidak ada**. Semua endpoint publik.
- Storage fisik: `<repo>/storage/uploads/` (di-override volume docker)

## Jalankan

```bash
npm install
npm start          # atau: npm run dev
curl localhost:6969/api/health
# {"success":true,"message":"Server is healthy"}
```

Docker:

```bash
docker compose up -d --build      # dev, ./storage di-mount ke host
docker compose -f docker-compose.prod.yml up -d --build   # prod, named volume
```

## Ngobrol sama server

Semua response JSON pakai envelope:

```json
{ "success": true, "message": "...", "data": ... }
```

| Method | Path | Fungsi | Sukses |
|---|---|---|---|
| `POST` | `/api/upload` | Upload 1 file, field name **`file`** | `201` |
| `GET` | `/api/files` | List nama file (array of string) | `200` |
| `GET` | `/api/files/:filename` | Download paksa (`Content-Disposition: attachment`) | `200` (binary) |
| `DELETE` | `/api/files/:filename` | Hapus file | `200` |
| `GET` | `/api/health` | Cek hidup | `200` |
| `GET` | `/storage/uploads/:filename` | Serve file inline (bisa dipakai `<img src>`) | `200` (binary) |

Prefix wajib `/api`. `POST /upload` (tanpa `/api`) → 404.

### Upload

```bash
curl -F "file=@invoice.pdf" http://localhost:6969/api/upload
```

Response `201`:

```json
{
  "success": true,
  "message": "File berhasil diunggah",
  "data": {
    "filename": "file-1794744007965-187349859.png",
    "originalname": "t.png",
    "mimetype": "image/png",
    "size": 2056,
    "path": "/srv/app/storage/uploads/file-1794744007965-187349859.png",
    "createdAt": "2026-11-15T12:00:07.977Z"
  },
  "fileUrl": "http://localhost:6969/storage/uploads/file-1794744007965-187349859.png"
}
```

Yang disimpan di DB kamu: **`data.filename`** (bukan `originalname`, bukan `fileUrl`).
`fileUrl` dihitung dari request (`req.protocol` + `Host`), jadi berubah sesuai domain yang dipakai akses — jangan di-hardcode.

### List

```bash
curl http://localhost:6969/api/files
# {"success":true,"data":["file-1794744007965-187349859.png", "file-1794744027117-2640683.jpg"]}
```

Isinya **hanya nama file** (flat array string). Tidak ada ukuran, tanggal, atau mimetype.
Kalau butuh metadata → simpan sendiri saat upload.

### Download

```bash
curl -OJ http://localhost:6969/api/files/file-1794744007965-187349859.png
```

Selalu `application/octet-stream` + attachment. Untuk preview di browser (`<img>`, `<video>`, PDF viewer) pakai `/storage/uploads/<filename>` yang mengirim content-type asli.

### Delete

```bash
curl -X DELETE http://localhost:6969/api/files/file-1794744007965-187349859.png
# {"success":true,"message":"File berhasil dihapus"}
```

`404` kalau tidak ada. Tidak bisa hapus banyak sekaligus.

## Batasan file

- Maks **5 MB** (`limits.fileSize`) → `400` `"Ukuran file terlalu besar. Maksimal 5MB"`
- Field name wajib `file` (kalau beda → dianggap tidak ada file → `500`).
- Filter: ekstensi **dan** mimetype harus match regex `/jpeg|jpg|png|gif|pdf|ico|svg|doc|docx|txt/`.

Hasil tes (curl default mimetype):

| Ext | Diterima |
|---|---|
| `jpg` `jpeg` `png` `gif` `svg` `pdf` | ✅ |
| `ico` `doc` `docx` `txt` `webp` | ❌ `400` |

Regex-nya tidak di-anchor dan mimetype `text/plain` tidak match → `txt` ikut ditolak meskipun ada di daftar. Jangan percaya daftar ekstensi; **tes ext yang kamu butuhkan** sebelum dipakai produksi. Kalau butuh type lain (webp, heic, xlsx, mp4), ubah satu tempat: `config/multer.config.js` (`filetypes` + `limits`).

Validasi ini **tidak aman**: mimetype bisa dipalsukan klien (`-F "file=@evil.txt;type=image/png"` → `201`). Untuk file publik, jangan andalkan filter ini sebagai security boundary.

Nama file hasil: `<fieldname>-<Date.now()>-<random9digit><ext>`, contoh `file-1794744007965-187349859.png`. Unik, bukan nama asli.

## Contoh integrasi

### Browser / fetch

```js
async function uploadFile(file, name = file.name) {
  const fd = new FormData();
  fd.append("file", file, name);

  const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  return { filename: json.data.filename, url: `${API_BASE}/storage/uploads/${json.data.filename}` };
}

async function listFiles() {
  const res = await fetch(`${API_BASE}/api/files`);
  return (await res.json()).data; // string[]
}

async function deleteFile(filename) {
  const res = await fetch(`${API_BASE}/api/files/${encodeURIComponent(filename)}`, { method: "DELETE" });
  return res.ok;
}
```

Catatan: **jangan** set header `Content-Type` manual saat kirim `FormData` — browser mengisi boundary sendiri.

Kalau yang dikirim bukan `File` (mis. `Blob` hasil `fetch`/`canvas.toBlob`), wajib isi argumen ketiga `FormData.append("file", blob, "nama.png")`. Tanpa itu nama jadi `blob` tanpa ekstensi → `400` filter ekstensi.

### React input

```jsx
<input
  type="file"
  accept=".jpg,.jpeg,.png,.gif,.svg,.pdf"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { filename } = await uploadFile(file);
      setFilename(filename);
    } catch (err) {
      alert(err.message); // mis. "Ukuran file terlalu besar. Maksimal 5MB"
    }
  }}
/>
```

### Node / axios

```js
const fd = new FormData();
fd.append("file", new Blob([await fs.promises.readFile(localPath)]), "invoice.pdf");
const { data } = await axios.post(`${API_BASE}/api/upload`, fd);
console.log(data.data.filename);
```

## Error contract

| Status | Kapan | Body `message` |
|---|---|---|
| `400` | file > 5 MB | `"Ukuran file terlalu besar. Maksimal 5MB"` |
| `400` | ext/mime ditolak | `"Hanya file dengan ekstensi berikut yang diperbolehkan: /jpeg\|jpg\|png\|gif\|pdf\|ico\|svg\|doc\|docx\|txt/"` |
| `404` | filename tidak ada | `"File tidak ditemukan"` |
| `500` | error lain, termasuk **tidak ada file** di request | `"Terjadi kesalahan pada server"` |
| `500` | error lain, `NODE_ENV=development` | + field `error` berisi pesan asli |

Tidak ada file → `500`, bukan `400`. Perlakukan `500` di upload sebagai "kemungkinan besar user lupa lampirkan file", jangan auto-retry.

## Jebakan yang sudah terverifikasi

1. **Path traversal** — `GET /api/files/..%2F..%2Fpackage.json` membocorkan file di luar `storage/uploads` (`FileService` tidak memvalidasi `filename`). Wajib taruh di belakang auth/reverse proxy, atau patch dulu:

   ```js
   // services/file.service.js — sebelum path.join
   if (path.basename(filename) !== filename) return null; // deleteFile(): return false
   ```

2. **Full disk path bocor** di response upload (`data.path`). Jangan diteruskan ke client publik.
3. **`fileUrl` selalu `http`** di belakang reverse proxy TLS (`req.protocol` tanpa `trust proxy`). Tambah `app.set("trust proxy", 1)` di `app.js` kalau butuh URL `https`.
4. **Tanpa auth / rate limit / validasi magic bytes.** Siapa pun yang bisa reach port ini bisa upload, list, dan hapus semua file.
5. **`/storage` men-serve seluruh folder `storage/`**, bukan cuma `uploads/`. Jangan taruh file sensitif di sana.
6. **Tidak ada metadata di server** — list cuma nama file. Relasi file↔user harus kamu simpan di DB aplikasi.
7. **Tidak ada backup / cleanup.** File menumpuk selamanya sampai dihapus manual via API.
8. CORS `origin: "*"`, credentials `false`. Kalau integrasi butuh cookie/auth header lintas origin → ubah `app.js`.

## Kapan harus ubah kode, bukan docs

| Butuh | Ubah |
|---|---|
| Tipe file lain / limit lebih besar | `config/multer.config.js` |
| Multi file per request (`files[]`) | `upload.array("files", n)` di `routes/upload.route.js` |
| Metadata (ukuran, tanggal, uploader) | simpan di DB aplikasi, atau tambah index JSON di `services/file.service.js` |
| Auth | middleware sebelum `uploadRouter` di `app.js` |
| Upload ke S3 / object storage | ganti `multer.diskStorage` di `config/multer.config.js` jadi `multer.memoryStorage` + SDK |

Semua fakta di atas dicek langsung ke server berjalan pada 2026-11-15 (health, upload tiap ekstensi, spoof mimetype, limit 5 MB, 404, traversal, delete).
