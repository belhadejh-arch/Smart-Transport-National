# Deploy NQL DZ on Render

This project is configured for one-click deployment on [Render](https://render.com).

## Quick Deploy

1. Push this repo to GitHub.
2. On Render, click **New → Blueprint**.
3. Connect your GitHub repo. Render auto-detects `render.yaml`.
4. Set the secrets when prompted:
   - `DATABASE_URL` — PostgreSQL connection string
   - `SESSION_SECRET` — any long random string
   - `JWT_SECRET` — any long random string
5. Click **Apply**. Render builds and deploys in ~5 minutes.

## What `render.yaml` does

- Installs pnpm via corepack (Node 24)
- Installs all monorepo dependencies (frozen lockfile)
- Runs OpenAPI codegen
- Builds the API server (esbuild → `artifacts/api-server/dist/`)
- Builds the Expo web app (`artifacts/mobile/dist/`)
- Starts the API server, which **also serves the static web app** from a single port

## How it works

The API server (`artifacts/api-server`) handles:
- `/api/*` → REST API
- everything else → serves the Expo web build (`artifacts/mobile/dist/index.html`) with SPA fallback

This means **one service** on Render serves both the frontend and the API. No CORS issues, simpler config.

## Custom domain

After deploy, in the Render dashboard:
1. Go to your service → **Settings → Custom Domains**
2. Add `nqldz.xyz`
3. Update your DNS as Render instructs (one CNAME record)

## Local notes

The `preinstall` script in root `package.json` blocks non-pnpm installs locally but skips that check on Render, Railway, and Vercel automatically.
