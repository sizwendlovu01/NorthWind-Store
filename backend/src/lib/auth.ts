import jwt from "jsonwebtoken";
import type { Request, RequestHandler } from "express";
import { getEnv } from "./env";

type AuthState = { userId: string | null; isAuthenticated: boolean };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthState;
    }
  }
}

const env = getEnv();

/** issues a signed JWT whose `sub` is our users.id */
export function signAuthToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/** reads `Authorization: Bearer <jwt>`; invalid or missing tokens leave the request signed out */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  req.auth = { userId: null, isAuthenticated: false };

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), env.JWT_SECRET);
      if (typeof payload === "object" && typeof payload.sub === "string") {
        req.auth = { userId: payload.sub, isAuthenticated: true };
      }
    } catch {
      // expired or tampered token: treat as signed out
    }
  }

  next();
};

export function getAuth(req: Request): AuthState {
  return req.auth ?? { userId: null, isAuthenticated: false };
}
