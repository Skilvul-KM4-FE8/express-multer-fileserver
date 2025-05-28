const express = require("express");
const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
const app = express();

const PORT = 7878; // bebas, bisa disesuaikan

// Storage config: simpan file ke /var/www/files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/var/www/files");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `http://YOUR_SERVER_IP/files/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Upload server listening on port ${PORT}`);
});
