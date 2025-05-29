const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 1234;

// Storage config: simpan ke /var/www/files (folder Nginx public)
const storage = multer.diskStorage({
  destination: "/var/www/files",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const server = process.env.PUBLIC_URL || "http://localhost";
  const fileUrl = `${server}/files/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Upload server listening on port ${PORT}`);
});
