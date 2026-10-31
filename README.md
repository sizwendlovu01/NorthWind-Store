# 🛒 PERN Stack E-Commerce Platform 🚀

![Demo App](/frontend/public/screenshot-for-readme.png)

---

## ✨ Highlights:

- 🛒 Full Stack E-Commerce App built from scratch
- ⚛️ Frontend with React, TanStack Query, Tailwind CSS & DaisyUI
- 🚀 Backend with Express.js & TypeScript
- 🔐 Email/password authentication with JWT (bcrypt-hashed passwords)
- 🗄️ PostgreSQL database (bundled local server for development, Neon-ready for production)
- 💳 Payments integration with Polar
- 📦 Product, Cart & Order Management
- 📊 Admin Dashboard to manage products
- 💬 Real-time Customer Support Chat with Stream
- 📹 Video Calling powered by Stream
- ⌨️ Typing Indicators in chat
- 😀 Message Reactions
- 🧵 Threaded Conversations
- 📁 File Uploads in chat
- 🎞️ GIF Support inside messages
- 🔔 Payment webhooks (Polar)
- 📤 Image Uploads & Optimization with ImageKit
- 🚨 Monitoring, Error Tracking & Performance Tracking with Sentry
- 📋 Structured Logs for debugging and analysis
- ⚡ Modern SaaS / E-Commerce Architecture
- 🌐 Deploy your app with a live URL
- 🆓 100% Free Setup to get started
- 📂 Full Source Code Provided
- 🎯 Resume-ready production-style project

---

## Run locally

Requirements: Node.js 22+. No PostgreSQL install is needed.

```bash
npm run setup     # installs root, backend and frontend dependencies
cp backend/.env.example backend/.env   # then set JWT_SECRET and SEED_ADMIN_PASSWORD
npm run dev       # starts Postgres (:5433), the API (:3001) and the web app (:5173)
```

Open http://localhost:5173. `npm run dev` runs three processes:

- **db**: `backend/scripts/db.mts` starts a real PostgreSQL 17 server (via `embedded-postgres`) using the host, port, user, password and database name in `DATABASE_URL`. Data lives in `~/.northwind/pgdata` (override with `LOCAL_PG_DIR`), outside the project so OneDrive/Dropbox sync cannot lock it. On every start it pushes the Drizzle schema; on first start it seeds 18 products and the admin account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- **api**: Express + TypeScript with `tsx watch`.
- **web**: Vite, which proxies `/api` to the API so the browser stays same-origin.

To use a hosted database such as Neon instead, put its URL in `DATABASE_URL`, run `npm --prefix backend run db:push` and `npm --prefix backend run db:seed`, and start only the api and web processes.

### Accounts and roles

Anyone can create a customer account at `/sign-up`. Roles are `customer`, `support` and `admin`; change one with:

```bash
npm --prefix backend run user:role -- someone@example.com support
```

Admins get the `/admin` product manager. Support and admin users see every order and can send video-call invites in order chat.

### Optional integrations

Payments (Polar), chat and video (Stream), image uploads (ImageKit) and monitoring (Sentry) are optional. Until their keys are set, the endpoints that need them return `503` and the rest of the app works normally.

---

## Deploy to Vercel (one project)

The repo deploys as a single Vercel project, configured by [`vercel.json`](vercel.json):

- The React app is built to `frontend/dist` and served as static files.
- [`api/index.ts`](api/index.ts) wraps the Express app (`backend/src/app.ts`) as one serverless function. `/api/*`, `/webhooks/*` and `/health` are rewritten to it, so the frontend calls the API on the same domain and needs no `VITE_API_URL`.
- Every other path falls back to `index.html` for client-side routing.
- `npm run build` first runs `backend/scripts/migrate.ts`, which applies the SQL migrations in `backend/drizzle/`, seeds the catalog when it is empty and creates the admin account if it is missing. The build stops with a clear message if `DATABASE_URL` or `JWT_SECRET` is missing.

Steps:

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its **pooled** connection string (it ends in `?sslmode=require`).
2. In Vercel, choose **Add New > Project** and import this GitHub repo. Keep the Root Directory as the repo root and leave the framework, build and output settings alone; `vercel.json` supplies them.
3. Under **Environment Variables**, add at least:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon connection string |
   | `JWT_SECRET` | a random string of 32+ characters |
   | `SEED_ADMIN_EMAIL` | the admin login email |
   | `SEED_ADMIN_PASSWORD` | the admin password |

   Optional: `SENTRY_DSN`, the Stream, ImageKit and Polar keys from the list below, and `VITE_SENTRY_DSN` / `VITE_IMAGEKIT_URL_ENDPOINT` for the frontend. `FRONTEND_URL` defaults to your production domain.
4. Click **Deploy**. Later pushes to `main` redeploy automatically and apply any new migrations.

After changing `backend/src/db/schema.ts`, run `npm --prefix backend run db:generate` and commit the new file in `backend/drizzle/` so the next deploy applies it. For Polar payments, point its webhook at `https://<your-domain>/webhooks/polar`.

---

## 🧪 Environment Variables

### Backend (`/backend`)

```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/northwind

JWT_SECRET=<long_random_string_at_least_32_chars>
JWT_EXPIRES_IN=7d

SEED_ADMIN_EMAIL=<admin_email_for_seed>
SEED_ADMIN_PASSWORD=<admin_password_for_seed>

# optional
SENTRY_DSN=<your_sentry_dsn>

STREAM_API_KEY=<your_stream_api_key>
STREAM_API_SECRET=<your_stream_api_secret>

IMAGEKIT_PUBLIC_KEY=<your_imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<your_imagekit_private_key>
IMAGEKIT_URL_ENDPOINT=<your_imagekit_url_endpoint>

POLAR_ACCESS_TOKEN=<your_polar_access_token>
POLAR_WEBHOOK_SECRET=<your_polar_webhook_secret>
POLAR_API_BASE=<your_polar_api_base_url>
POLAR_CHECKOUT_PRODUCT_ID=<your_product_id>
```

### Frontend (`/frontend`, all optional)

```bash
VITE_SENTRY_DSN=<your_sentry_dsn>
VITE_API_URL=<backend_url_if_not_same_origin>
VITE_IMAGEKIT_URL_ENDPOINT=<your_imagekit_url_endpoint>
```
