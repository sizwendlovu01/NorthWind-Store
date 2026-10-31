import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { signAuthToken } from "../lib/auth";
import { getUserWithPasswordByEmail, publicUserColumns } from "../lib/users";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  displayName: z.string().trim().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      res.status(400).json({ error: first ?? "Invalid details" });
      return;
    }

    const { email, password, displayName } = parsed.data;

    if (await getUserWithPasswordByEmail(email)) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // new accounts are customers; promote with `npm run user:role -- <email> <role>`
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName: displayName || null })
      .returning(publicUserColumns);

    res.status(201).json({ token: signAuthToken(user.id), user });
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const row = await getUserWithPasswordByEmail(parsed.data.email);
    const valid = row ? await bcrypt.compare(parsed.data.password, row.passwordHash) : false;

    if (!row || !valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const { passwordHash: _passwordHash, ...user } = row;
    res.json({ token: signAuthToken(user.id), user });
  } catch (e) {
    next(e);
  }
}
