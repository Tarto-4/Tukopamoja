-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Fix Branding Feature — RLS Policies                       ║
-- ║  1. Allow any authenticated host/admin to update org       ║
-- ║  2. Add storage UPDATE policy for logo upsert              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Replace restrictive admin-only org_update policy
--    with one that allows any authenticated host or admin.
drop policy if exists "org_update" on public.organization;

create policy "org_update" on public.organization
  for update using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'host')
    )
  );

-- 2. Add storage UPDATE policy so logo upsert works
--    (upsert = insert OR update; insert policy already exists)
create policy "media_update" on storage.objects
  for update using (
    bucket_id = 'media' and auth.uid() is not null
  );
