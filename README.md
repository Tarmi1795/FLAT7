# FLAT7 HomeCare

A responsive, installable household PWA for plant care, AC maintenance, and recurring bill tracking.

## Features

- Shared six-digit household PIN with a one-time recovery code
- Remembered person profile on each device
- Rooms with required primary people
- Multiple plants with independent watering and trimming schedules
- Multiple AC units with recurring maintenance reminders
- Monthly Internet and Rent occurrences in QAR
- Push notifications routed to assigned people
- Offline quick-entry queue with idempotent synchronization
- Private plant photos, bill receipts, audit history, and ZIP/CSV export
- Responsive bottom navigation and desktop sidebar

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase Postgres/Auth/Realtime/Storage/Cron, TanStack Query, Zod, Vitest, and Playwright.

## Local development

1. Install Node.js 22 and dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and configure the Supabase/VAPID values. Never commit `.env.local`.

3. Start the app:

   ```bash
   npm run dev
   ```

Without Supabase environment variables the app intentionally runs with interactive demonstration data for UI development.

## Supabase

The target project reference is `zqqmxzunmxmnngeyosiv`.

1. Authenticate the project-scoped Supabase MCP server.
2. Apply `supabase/migrations/202606290001_initial_homecare.sql`.
3. Confirm anonymous authentication is enabled.
4. Confirm `plant-photos` and `bill-receipts` are private buckets.
5. Generate VAPID keys and set the public/private values in Vercel.
6. Configure a Supabase Cron HTTP job to call `/api/internal/notifications/run` every 15 minutes with `x-cron-secret`.

The migration creates the core tables, RLS policies, storage policies, recurrence functions, audit triggers, and the nightly bill-generation job.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Deployment

- GitHub: `Tarmi1795/FLAT7`
- Vercel production domain: `flat7.onesmartbiz.pro`
- Connect GitHub to Vercel and attach the existing domain.
- Use the official Supabase–Vercel integration to synchronize Supabase environment variables.
- Keep `SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`, and `CRON_SECRET` production-only.
- Revoke any credential that has ever appeared in chat or logs before deployment.
