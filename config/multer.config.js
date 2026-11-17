const multer = require("multer");
const path = require("path");

// Buffer di memori: maksimal 5MB, lalu FileService yang menentukan tujuan
// (disk lokal atau S3). Satu jalur kode untuk dua backend.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf|ico|svg|doc|docx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file dengan ekstensi berikut yang diperbolehkan: " + filetypes));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
