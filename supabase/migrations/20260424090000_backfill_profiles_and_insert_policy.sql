-- Backfill missing profile rows for existing auth users.
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Allow authenticated users to insert their own profile row if it is ever missing.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
      on public.profiles
      for insert
      with check (id = auth.uid());
  end if;
end
$$;