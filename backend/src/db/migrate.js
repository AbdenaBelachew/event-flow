const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function migrate() {
  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }
  // eslint-disable-next-line no-console
  console.log("✅ Migrations complete");
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = { migrate };
