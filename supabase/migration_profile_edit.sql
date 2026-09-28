-- Run after migration_feed.sql to allow users to create their own missing profile row.
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
