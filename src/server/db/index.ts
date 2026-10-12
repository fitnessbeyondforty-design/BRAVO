import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL

// Serverless-safe settings. DATABASE_URL points at Supavisor's SESSION pooler (:5432), which has
// only 15 server connections shared by every Vercel instance. postgres.js defaults (10 conns per
// instance, never idle-closed) exhausted it on 2026-09-27 (sitemap 500s). So: one connection per
// instance, closed after 20 s idle. (Transaction pooler :6543 was tried the same day and hung
// mid-query with postgres.js — don't switch without testing on a preview first.)
// When DATABASE_URL is absent (e.g. first build before env is set) `db` is null and query
// helpers fall back to empty results.
const client = url ? postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 }) : null
export const db = client ? drizzle(client, { schema }) : null
export type DB = NonNullable<typeof db>
