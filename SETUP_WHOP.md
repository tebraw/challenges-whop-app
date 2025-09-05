# Setup (Whop + Vercel + Prisma/Postgres)

1) Copy `.env.example` to `.env.local` and fill values:
   - `DATABASE_URL`, `DIRECT_URL` (Vercel Postgres / Neon)
   - `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_WHOP_APP_ID`, `NEXT_PUBLIC_WHOP_COMPANY_ID` (and optional `NEXT_PUBLIC_WHOP_AGENT_USER_ID`)

2) Install & migrate:
   ```bash
   pnpm install
   npx prisma generate
   npx prisma migrate dev --name init_pg
   ```

3) Dev (with Whop Dev-Proxy):
   ```bash
   pnpm dev
   ```

4) Create Whop App, configure Webhook to:
   ```
   https://<your-vercel-project>.vercel.app/api/whop/webhook
   ```
   and set `WHOP_WEBHOOK_SECRET`.

5) Vercel:
   - Import GitHub repo
   - Add env vars from step 1
   - Deploy
