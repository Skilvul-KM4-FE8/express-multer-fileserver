require("dotenv").config();
const app = require("./app");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { startCleanupSchedule } = require("./services/cleanup.service");

// Pastikan direktori upload ada
const uploadDir = path.join(__dirname, "storage/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Docker --env-file menyimpan tanda kutip apa adanya; parseInt menjaga PORT tetap angka.
const port = Number.parseInt(process.env.PORT, 10) || 6969;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
  startCleanupSchedule();
});
