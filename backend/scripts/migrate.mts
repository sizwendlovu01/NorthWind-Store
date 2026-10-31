// Production database setup, run by the root `npm run build` (and so on every Vercel deploy):
// checks required env, applies SQL migrations from ./drizzle, seeds the catalog when empty
// and creates the admin account from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD when missing.
// Local development uses `npm run db:start` (schema push) instead.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

// explicit ES module (.mts) so it runs the same whether Node or tsx strips the types
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(message: string): never {
  console.error(`\n[migrate] ${message}\n`);
  process.exit(1);
}

function runSeed(args: string[] = []) {
  const result = spawnSync("npx", ["tsx", "scripts/seed.ts", ...args], {
    stdio: "inherit",
    shell: true,
    cwd: backendDir,
  });
  if (result.status !== 0) fail("Seeding failed");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL is not set. Add your Postgres (e.g. Neon) connection string in Vercel > Settings > Environment Variables.");
  }
  if (process.env.VERCEL && /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) {
    fail("DATABASE_URL points at localhost, which Vercel cannot reach. Use a hosted database such as Neon.");
  }
  if ((process.env.JWT_SECRET ?? "").length < 32) {
    fail("JWT_SECRET must be set to a random string of at least 32 characters.");
  }

  // migrations need a direct (non-pooled) connection; Neon provides it as DATABASE_URL_UNPOOLED
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || databaseUrl });
  const db = drizzle(pool);

  console.log("[migrate] Applying migrations");
  await migrate(db, { migrationsFolder: path.join(backendDir, "drizzle") });

  const { rows } = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM products");
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminMissing =
    adminEmail && process.env.SEED_ADMIN_PASSWORD
      ? (await pool.query("SELECT 1 FROM users WHERE email = $1", [adminEmail])).rowCount === 0
      : false;
  await pool.end();

  if (rows[0].n === 0) {
    console.log("[migrate] Empty catalog, seeding");
    runSeed();
  } else if (adminMissing) {
    runSeed(["--admin-only"]);
  }

  console.log("[migrate] Database ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
