const FileService = require("./file.service");

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PURGE_DAYS = Math.max(1, Number.parseInt(process.env.PURGE_DAYS, 10) || 60);

// Hapus file yang tidak dipanggil lebih dari PURGE_DAYS (default 60 hari).
async function purgeStaleFiles(days = PURGE_DAYS) {
  const stale = await FileService.listStale(days);
  for (const filename of stale) {
    await FileService.deleteFile(filename);
  }
  if (stale.length) {
    console.log(`[cleanup] ${stale.length} file tidak dipakai > ${days} hari dihapus:`, stale);
  }
  return stale;
}

// Aktif otomatis saat server start: jalan sekali, lalu tiap minggu.
function startCleanupSchedule() {
  const tick = () =>
    purgeStaleFiles().catch((err) => console.error("[cleanup]", err.message));

  tick();
  const timer = setInterval(tick, WEEK_MS);
  timer.unref(); // jangan tahan proses tetap hidup
  return timer;
}

module.exports = { purgeStaleFiles, startCleanupSchedule };
