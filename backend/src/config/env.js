require("dotenv").config();

function bool(v, def = false) {
  if (v === undefined) return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:4000",

  DATABASE_URL: process.env.DATABASE_URL || "",
  PGHOST: process.env.PGHOST || "localhost",
  PGPORT: parseInt(process.env.PGPORT || "5432", 10),
  PGUSER: process.env.PGUSER || "postgres",
  PGPASSWORD: process.env.PGPASSWORD || "postgres",
  PGDATABASE: process.env.PGDATABASE || "ticketing",
  PGSSL: bool(process.env.PGSSL, false),

  JWT_SECRET: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || "",
  CHAPA_BASE_URL: process.env.CHAPA_BASE_URL || "https://api.chapa.co/v1",

  TELEBIRR_APP_ID: process.env.TELEBIRR_APP_ID || "",
  TELEBIRR_APP_KEY: process.env.TELEBIRR_APP_KEY || "",
  CBE_BIRR_MERCHANT_ID: process.env.CBE_BIRR_MERCHANT_ID || "",
  CBE_BIRR_API_KEY: process.env.CBE_BIRR_API_KEY || "",

  CHECKIN_RATE_WINDOW_MS: parseInt(process.env.CHECKIN_RATE_WINDOW_MS || "10000", 10),
  CHECKIN_RATE_MAX: parseInt(process.env.CHECKIN_RATE_MAX || "30", 10),
};

module.exports = { env };
