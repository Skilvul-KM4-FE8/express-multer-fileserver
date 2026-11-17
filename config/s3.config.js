const { S3Client } = require("@aws-sdk/client-s3");

// S3-compatible storage (Cloudflare R2, MinIO, AWS S3) — opt-in.
// Tanpa keempat env ini, semua operasi tetap di disk lokal (storage/uploads).
const required = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
const configured = required.every((key) => process.env[key]);

const client = configured
  ? new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    })
  : null;

module.exports = {
  enabled: Boolean(client),
  client,
  bucket: process.env.S3_BUCKET,
};
