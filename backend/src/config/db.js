const { Pool } = require("pg");
const { env } = require("./env");

const pool = env.DATABASE_URL
  ? new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
    });

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unexpected PG pool error", err);
});

/** Simple query helper. */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a function inside a transaction. The callback receives a dedicated
 * client; BEGIN/COMMIT/ROLLBACK are handled automatically.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
