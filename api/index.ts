// Vercel serverless entry: every /api/*, /webhooks/* and /health request is rewritten here
// (see vercel.json) and handled by the same Express app used in local development.
// instrument must load first so Sentry (when SENTRY_DSN is set) can wrap Express.
import "../backend/src/instrument";
import app from "../backend/src/app";

export default app;
