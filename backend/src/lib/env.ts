import { z } from "zod";

// .coerce.number() means it will convert the string to a number if it's a string

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_API_BASE: z.string().url().default("https://api.polar.sh"),

  // payments, chat/video and image uploads are optional: their endpoints return 503 until configured
  POLAR_CHECKOUT_PRODUCT_ID: z.string().uuid().optional(),

  STREAM_API_KEY: z.string().min(1).optional(),
  STREAM_API_SECRET: z.string().min(1).optional(),

  IMAGEKIT_PUBLIC_KEY: z.string().min(1).optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1).optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),

  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv() {
  // blank entries in .env (e.g. `STREAM_API_KEY=`) count as unset
  const defined = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));

  // on Vercel, default to the project's production domain (a system env var Vercel provides)
  if (!defined.FRONTEND_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    defined.FRONTEND_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const parsed = envSchema.safeParse(defined);

  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

let cachedEnv: Env | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }

  return cachedEnv;
}
