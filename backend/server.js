const app = require("./app");
const { env } = require("./src/config/env");
const { pool } = require("./src/config/db");

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🎟  Ticketing backend listening on http://localhost:${env.PORT}`);
  console.log(`    Public UI:   http://localhost:${env.PORT}/`);
  console.log(`    Scanner:     http://localhost:${env.PORT}/scanner.html`);
  console.log(`    Dashboard:   http://localhost:${env.PORT}/dashboard.html`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
