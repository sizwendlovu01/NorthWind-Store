import "dotenv/config";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

// app traffic uses the pooled DATABASE_URL (Neon "-pooler" host in production)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// on Vercel Fluid compute, closes idle clients before an instance is suspended; no-op elsewhere
attachDatabasePool(pool);

export const db = drizzle(pool, { schema });
