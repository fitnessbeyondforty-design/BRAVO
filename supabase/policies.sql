-- Final applied security state for bravo-world-records.
-- (Schema DDL lives in the drizzle migrations under ./migrations.)

-- Role lookup helper. Renamed from current_role() to avoid the reserved word.
create or replace function public.current_app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

-- RLS on every table (PostgREST exposes all public tables to the anon key).
alter table public.users        enable row level security;
alter table public.categories   enable row level security;
alter table public.records      enable row level security;
alter table public.submissions  enable row level security;
alter table public.media        enable row level security;
alter table public.payments     enable row level security;
alter table public.audit_logs   enable row level security;

-- Users: read only your own row.
create policy users_self on public.users for select using (id = auth.uid());

-- Categories: public read.
create policy cat_public_read on public.categories for select using (true);

-- Records: anon reads published (no helper call); staff read all.
create policy rec_public_read on public.records for select using (published_at is not null);
create policy rec_staff_read  on public.records for select to authenticated
  using (public.current_app_role() in ('MODERATOR','SUPER_ADMIN'));

-- Submissions: READ-ONLY over the API (changed 2026-09-27 s7 — the old FOR ALL owner policy let an
-- applicant PATCH their own row, e.g. status='APPROVED'). All writes go through the server-side
-- postgres connection, which also writes the audit log.
create policy sub_owner_read on public.submissions for select to authenticated
  using (applicant_id = (select auth.uid()));
create policy sub_staff_read on public.submissions for select to authenticated
  using ((select public.current_app_role()) in ('MODERATOR','SUPER_ADMIN'));
revoke insert, update, delete, truncate on public.submissions from anon, authenticated;
revoke insert, update, delete, truncate on public.users       from anon, authenticated;
revoke insert, update, delete, truncate on public.payments    from anon, authenticated;
revoke insert, update, delete, truncate on public.audit_logs  from anon, authenticated;

-- Guardian consent (migration submissions_guardian_consent_and_rls_readonly, s7) — check constraints:
--   sub_guardian_consistency          adult => no guardian data; minor => name, relationship, consent_at, version, status PENDING_VERIFICATION|VERIFIED
--   sub_guardian_verified             status VERIFIED <=> guardian_verified_by + guardian_verified_at set
--   sub_minor_needs_verified_consent  minor + status APPROVED|PUBLISHED => consent VERIFIED

-- Media: public read of published records' media only (tightened s5). Submission evidence (record_id
-- NULL, submission_id set) is therefore NOT exposed over the REST API — reviewers read it via the
-- server-side postgres connection; the image bytes themselves are served from the public Storage
-- bucket by unguessable (random-UUID) key.
create policy media_public_read on public.media for select
  using (record_id is not null and exists (select 1 from public.records r where r.id = media.record_id and r.published_at is not null));

-- payments + audit_logs: RLS on, NO policy = deny-all over the API. Reached
-- only by the server-side postgres connection (which bypasses RLS).

-- Signup mirror: auth.users -> public.users.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the SECURITY DEFINER helpers off the public API surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.current_app_role() from public, anon;
grant  execute on function public.current_app_role() to authenticated; -- RLS needs it

-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Storage: submission evidence uploads (migration submission_media_upload_storage_policy, s18 — §8.3)
-- ──────────────────────────────────────────────────────────────────────────────────────────────
-- Applicants upload evidence straight to the public `record-media` bucket via a server-minted signed
-- upload URL (src/server/actions/upload.ts chooses the key: submissions/<uid>/<uuid>.<ext>). This
-- INSERT policy is defence-in-depth: a signed-in user can only CREATE objects under their OWN
-- submissions/<uid>/ folder. No update/delete grant. Reads stay public (bucket.public = true).
drop policy if exists "submission_evidence_insert" on storage.objects;
create policy "submission_evidence_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'record-media'
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- Bucket limits are the hard server-side guarantee for the direct (signed-URL) upload path, since the
-- bytes never pass through the Node layer. PDFs + avif added alongside the existing image types; the
-- 15 MiB cap is kept (free-tier Storage ~1 GB total — video deferred to a paid-plan iteration).
update storage.buckets
  set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif','application/pdf'],
      file_size_limit = 15728640
  where id = 'record-media';
