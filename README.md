# Bravo World Records — Full-Stack Redesign

Next.js 15 (App Router) · TypeScript · Tailwind · Drizzle ORM · Supabase (Auth + Postgres + Storage) · Upstash rate-limiting.

Brand palette sampled from the official logo: antique gold `#C89854` on deep teal-black `#0C2428`.

## Live infrastructure (provisioned 2026-09-26)

- **Supabase project**: `bravo-world-records` (ref `rgqtuucwqqlpqoupdqri`, region `ap-south-1`).
  Schema, RLS policies, auth trigger, and seed data are already applied.
- API URL: `https://rgqtuucwqqlpqoupdqri.supabase.co`

## Getting started

```bash
npm install
# .env.local is already populated with the Supabase URL + anon key.
# Add your DB password to DATABASE_URL (Supabase dashboard → Settings → Database).
npm run dev
```

Open http://localhost:3000 — the homepage, records list, and record detail pages
render live data from the seeded database.

## Structure

- `src/app` — routes (public portal, `/apply`, `/admin`, SEO routes, `llms.txt`)
- `src/server/db` — Drizzle schema, client, query helpers
- `src/server/auth` — Supabase server client + session helpers
- `src/server/actions` — Server Actions (submit, review) with Zod + rate-limit
- `src/components` — RecordCard, admin SubmissionsTable
- `supabase/policies.sql` — final applied RLS policies + auth trigger

## Security

- WCAG 2.2 **AA** target (not AAA — AAA is not a valid whole-site goal).
- CSP, HSTS, X-Frame-Options, nosniff in `middleware.ts`.
- RLS enabled on every table; `payments` + `audit_logs` are deny-all over the API.
- `SECURITY DEFINER` helpers revoked from `anon`; role helper kept for RLS only.
- Money stored as integer minor units; GST/refund fields on `payments`.
- Next `15.5.26` (patched; 15.1.0 carried CVE-2025-66478).

## Next steps

- Deploy to Vercel (project `fitnessbeyondforty-4057`).
- Razorpay review-fee flow (Indian GST + refund terms).
- Supabase Storage media upload + signed URLs.
- Auth UI (sign-in/up) + wire the admin role gate to `current_app_role()`.
- Add `framer-motion` (React-19 build) for hero/route animations.
