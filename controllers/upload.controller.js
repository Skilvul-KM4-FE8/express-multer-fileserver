const { create } = require("domain");
const FileService = require("../services/file.service");
const path = require("path");

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("Tidak ada file yang diunggah");
    }

    // Membuat URL lengkap yang bisa diakses dari frontend
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/storage/uploads/${req.file.filename}`;

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      message: "File berhasil diunggah",
      data: fileInfo,
      fileUrl: fileUrl,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const file = FileService.getFile(filename);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    file.stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

exports.listFiles = async (req, res, next) => {
  try {
    const files = FileService.listFiles();
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const result = FileService.deleteFile(filename);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "File berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};
