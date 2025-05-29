const app = require("./app");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Pastikan direktori upload ada
const uploadDir = path.join(__dirname, "storage/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const port = process.env.PORT || 6969;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
