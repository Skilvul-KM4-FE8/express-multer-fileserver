const fs = require("fs");
const path = require("path");

class FileService {
  constructor() {
    this.uploadPath = path.join(__dirname, "../storage/uploads");
  }

  getFile(filename) {
    const filePath = path.join(this.uploadPath, filename);
    if (fs.existsSync(filePath)) {
      return {
        path: filePath,
        stream: fs.createReadStream(filePath),
      };
    }
    return null;
  }

  deleteFile(filename) {
    const filePath = path.join(this.uploadPath, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  listFiles() {
    return fs.readdirSync(this.uploadPath);
  }
}

module.exports = new FileService();
