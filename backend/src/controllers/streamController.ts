import type { Request, Response, NextFunction } from "express";
import { getAuth } from "../lib/auth.js";
import { getLocalUser } from "../lib/users.js";
import { getStreamChatServer, streamChatDisplayName, streamUserId } from "../lib/stream.js";
import { getEnv } from "../lib/env.js";

const env = getEnv();

export async function createStreamToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const server = getStreamChatServer(env);
    if (!server || !env.STREAM_API_KEY) {
      res.status(503).json({ error: "Chat is not configured" });
      return;
    }

    const name = streamChatDisplayName(localUser.role, localUser.displayName, localUser.email);
    const sid = streamUserId(userId);

    await server.upsertUser({ id: sid, name });

    const token = server.createToken(sid);

    res.json({ token, apiKey: env.STREAM_API_KEY, userId: sid, name });
  } catch (e) {
    next(e);
  }
}
