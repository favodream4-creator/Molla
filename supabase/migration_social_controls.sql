-- Add once in Supabase SQL Editor after migration_feed.sql.
-- Post deletion is already restricted to the owner by the existing posts RLS policy.
create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.post_reports enable row level security;

create policy "Users can report other users posts once"
  on public.post_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.posts
      where posts.id = post_reports.post_id
        and posts.user_id <> auth.uid()
    )
  );
