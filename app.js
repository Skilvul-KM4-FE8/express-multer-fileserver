const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const uploadRouter = require("./routes/upload.route");
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

// Static files
app.use("/storage", express.static(path.join(__dirname, "storage")));

// Routes
app.use("/api", uploadRouter);

// //files
// app.use("/files", express.static(path.join(__dirname, "storage/uploads")));

// Error handling
app.use(errorHandler);

module.exports = app;
