const FileService = require("../services/file.service");

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("Tidak ada file yang diunggah");
    }

    const { filename, storage } = await FileService.saveFile(req.file);

    // Membuat URL lengkap yang bisa diakses dari frontend
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/storage/uploads/${filename}`;

    const fileInfo = {
      filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      storage,
      path: storage === "local" ? FileService.localPath(filename) : null,
      createdAt: new Date(),
    };

    FileService.recordUpload({ ...req.file, filename });

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
    const file = await FileService.getFile(filename);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    FileService.recordAccess(filename, file.size);
    file.stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const days = Number.parseInt(req.query.days, 10) || 60;
    const data = await FileService.stats(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.listFiles = async (req, res, next) => {
  try {
    const files = await FileService.listFiles();
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
    const result = await FileService.deleteFile(filename);

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
