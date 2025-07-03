const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const upload = require("../config/multer.config");

router.post("/upload", upload.single("file"), uploadController.uploadFile);
router.get("/files/:filename", uploadController.getFile);
router.get("/files", uploadController.listFiles);
router.delete("/files/:filename", uploadController.deleteFile);
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

module.exports = router;
