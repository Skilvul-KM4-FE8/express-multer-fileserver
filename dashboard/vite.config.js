import { defineConfig } from "vite";

// API_PROXY dipakai saat dashboard jalan di container (target: nama service app).
const apiTarget = process.env.API_PROXY || "http://localhost:6969";
const proxy = { "/api": { target: apiTarget, changeOrigin: true } };

export default defineConfig({
  base: "./",
  server: { port: 5173, strictPort: true, host: true, proxy },
  preview: { port: 4173, strictPort: true, host: true, proxy },
});
