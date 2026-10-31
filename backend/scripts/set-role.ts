// usage: npm run user:role -- <email> <customer|support|admin>
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, type UserRole } from "../src/db/schema.js";

const ROLES: UserRole[] = ["customer", "support", "admin"];

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !ROLES.includes(role as UserRole)) {
    console.error("usage: npm run user:role -- <email> <customer|support|admin>");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const updated = await db
    .update(users)
    .set({ role: role as UserRole, updatedAt: new Date() })
    .where(eq(users.email, email.trim().toLowerCase()))
    .returning({ email: users.email });

  console.log(updated.length ? `${updated[0].email} is now ${role}` : `No user with email ${email}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
