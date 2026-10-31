import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

// every column except the password hash, so user rows are safe to send to the client
export const { passwordHash: _passwordHash, ...publicUserColumns } = getTableColumns(users);

export async function getLocalUser(userId: string) {
  const [row] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

export async function getUserWithPasswordByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row;
}
