const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");

async function waitForDatabase(pool, attempts = 30) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  }
  throw lastError;
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurada");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
  });
  await waitForDatabase(pool);
  await pool.query(`
    create table if not exists schema_migrations (
      version text primary key,
      checksum text not null default '',
      applied_at timestamptz not null default now()
    )
  `);
  await pool.query(
    "alter table schema_migrations add column if not exists checksum text not null default ''"
  );

  const migrationsDirectory =
    process.env.MIGRATIONS_DIR || path.resolve(process.cwd(), "../db/migrations");
  const files = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDirectory, file), "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");
      const existing = await pool.query(
        "select checksum from schema_migrations where version = $1",
        [file]
      );

      if (existing.rows[0]) {
        if (
          existing.rows[0].checksum &&
          existing.rows[0].checksum !== checksum
        ) {
          throw new Error(`A migração já aplicada ${file} foi modificada`);
        }
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query(
          "insert into schema_migrations (version, checksum) values ($1, $2)",
          [file, checksum]
        );
        await client.query("commit");
        console.log(`Migração aplicada: ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    console.error("Falha ao aplicar migrações", error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
