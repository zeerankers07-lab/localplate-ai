# LocalPlate AI — Security & Supabase Setup

This build hardens the existing app without changing the meal-planning UI/business flow.

## 1. Install and verify locally

```bash
npm install
npm run build
npm run dev
```

Do not commit `.env.local`.

## 2. Environment variables

Create `.env.local` from `.env.example` and fill in your own values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GROQ_API_KEY` (server-only)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, admin dashboard only)
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAILS` (comma-separated admin email addresses)

Never expose `GROQ_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.

## 3. Run the Supabase migration

Open Supabase Dashboard → SQL Editor and run:

`supabase/migrations/001_security_hardening.sql`

This migration:

- enables RLS on `saved_plans` and `shopping_lists`;
- replaces existing policies on those two private tables with explicit owner-only policies;
- enforces `WITH CHECK (auth.uid() = user_id)` for inserts/updates;
- creates a database-backed rate limiter shared across server instances;
- prevents direct client access to the rate-limit table;
- adds a useful saved-plan owner/date index.

## 4. Admin dashboard

Set `ADMIN_EMAILS` to the email address of the admin account.

Then open:

`/admin`

The dashboard uses the Supabase service-role key only on the server. It shows high-level user, saved-plan, and shopping-list metrics plus a small recent-user table. It does not expose passwords, service keys, or database secrets to the browser.

## 5. AI API protection

`/api/chat`:

- authenticated users only;
- same-origin browser request check;
- 10 requests per 10 minutes per user;
- request validation;
- 90-second upstream timeout;
- sanitized provider errors;
- no-store responses.

`/api/generate-meal-plan`:

- authenticated users only;
- same-origin browser request check;
- 5 requests per 10 minutes per user;
- request validation;
- 90-second upstream timeout;
- sanitized provider errors;
- no-store responses.

## 6. Private routes

The proxy protects:

- `/planner`
- `/weekly-plan`
- `/saved-plans`
- `/shopping-list`
- `/profile`
- `/admin`

The existing Supabase session refresh behavior is preserved.

## 7. Important security limitation

No web application can honestly be guaranteed to be impossible to hack. This build adds database-level isolation, server-side secret handling, authentication checks, route protection, origin checks, rate limiting, timeout protection, and security headers to reduce common attack paths.

Before production, also enable appropriate Supabase Auth email/redirect settings, use HTTPS, keep dependencies updated, and review Supabase logs and provider usage regularly.
