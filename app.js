const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const uploadRouter = require("./routes/upload.route");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(cors());
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
