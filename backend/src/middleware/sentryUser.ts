import type { RequestHandler } from "express";
import * as Sentry from "@sentry/node";
import { getAuth } from "../lib/auth";

/** attach the signed-in user id to the request isolation scope so errors include who was signed in */
export const sentryUserMiddleware: RequestHandler = (req, _res, next) => {
  const { userId } = getAuth(req);
  Sentry.getIsolationScope().setUser(userId ? { id: userId } : null);
  next();
};
