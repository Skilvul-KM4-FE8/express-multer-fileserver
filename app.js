const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const uploadRouter = require("./routes/upload.route");
const FileService = require("./services/file.service");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Mengizinkan semua domain
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Semua method yang diizinkan
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"], // Semua headers yang diizinkan
    credentials: false, // Izinkan credentials jika diperlukan
    optionsSuccessStatus: 200, // Untuk browser yang kompatibel
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Static files. Akses file lokal juga dicatat, supaya cron tidak menghapus
// file yang masih dipanggil lewat <img src>/<video>/PDF viewer.
const storageDir = path.join(__dirname, "storage");
const storageStatic = express.static(storageDir);

app.use("/storage", (req, res, next) => {
  if (req.method === "GET") {
    res.on("finish", () => {
      if (res.statusCode !== 200) return;
      const match = /^\/uploads\/([^/?]+)/.exec(req.url);
      if (match && !res.locals.accessTracked) {
        FileService.recordAccess(decodeURIComponent(match[1]));
      }
    });
  }
  storageStatic(req, res, next);
});

// File di S3 dilewatkan lewat URL yang sama saat tidak ada di disk.
app.get("/storage/uploads/:filename", async (req, res, next) => {
  try {
    const file = await FileService.getFile(req.params.filename);
    if (!file) {
      return res.status(404).json({ success: false, message: "File tidak ditemukan" });
    }
    if (file.mimetype) res.type(file.mimetype);
    res.locals.accessTracked = true;
    FileService.recordAccess(req.params.filename, file.size);
    file.stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Routes
app.use("/api", uploadRouter);

// Docs: Scalar UI + OpenAPI spec
app.get("/api/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "docs/index.html"));
});
app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "docs/openapi.json"));
});

// //files
// app.use("/files", express.static(path.join(__dirname, "storage/uploads")));

// Error handling
app.use(errorHandler);

module.exports = app;
