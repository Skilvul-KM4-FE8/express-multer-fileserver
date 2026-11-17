const { PrismaClient } = require("@prisma/client");

// Satu instance per proses; module cache Node yang menjamin singleton.
module.exports = new PrismaClient();
