// Local PostgreSQL for development. Runs a real Postgres server (via embedded-postgres)
// using the host/port/user/password/database from DATABASE_URL, then pushes the schema
// and seeds an empty database. Keeps running until Ctrl+C.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL ?? "");
const port = Number(url.port || 5432);
const user = decodeURIComponent(url.username || "postgres");
const password = decodeURIComponent(url.password || "postgres");
const database = url.pathname.replace(/^\//, "") || "postgres";

if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  console.error(`[db] DATABASE_URL points at ${url.hostname}; the local server only runs for localhost.`);
  process.exit(1);
}

// kept outside the project folder: OneDrive/Dropbox sync locks Postgres data files
const databaseDir = path.resolve(
  process.env.LOCAL_PG_DIR ?? path.join(os.homedir(), ".northwind", "pgdata"),
);

async function canConnect(db: string) {
  const client = new pg.Client({ host: "localhost", port, user, password, database: db });
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

function run(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`);
}

async function main() {
  let server: EmbeddedPostgres | null = null;

  if (await canConnect("postgres")) {
    console.log(`[db] Postgres already running on port ${port}, reusing it.`);
  } else {
    server = new EmbeddedPostgres({
      databaseDir,
      port,
      user,
      password,
      persistent: true,
      // Windows initdb otherwise defaults to WIN1252, which rejects non-Latin characters
      initdbFlags: ["--encoding=UTF8", "--locale=C"],
      onLog: () => {},
    });

    if (!fs.existsSync(path.join(databaseDir, "PG_VERSION"))) {
      console.log(`[db] Initialising new cluster in ${databaseDir}`);
      await server.initialise();
    }
    await server.start();
    console.log(`[db] Postgres started on port ${port}`);
  }

  const admin = new pg.Client({ host: "localhost", port, user, password, database: "postgres" });
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
    console.log(`[db] Created database ${database}`);
  }
  await admin.end();

  console.log("[db] Syncing schema (drizzle-kit push)");
  run("npx", ["drizzle-kit", "push", "--force"]);

  const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await app.connect();
  const { rows } = await app.query<{ n: number }>("SELECT count(*)::int AS n FROM products");
  await app.end();
  if (rows[0].n === 0) {
    console.log("[db] Empty catalog, seeding");
    run("npx", ["tsx", "scripts/seed.ts"]);
  }

  console.log(`[db] Ready: postgresql://${user}@localhost:${port}/${database}`);

  if (!server) return;

  const stop = async () => {
    console.log("[db] Stopping Postgres");
    await server.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error("[db]", e);
  process.exit(1);
});
