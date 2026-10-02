-- Run this in Supabase: SQL Editor → New query → Run
-- (Run this after your existing migrations — safe to run even if you've since
-- added your own columns to `profiles`, it only adds what's missing.)

-- Social links, stored as { instagram, spotify, tiktok, website } — all optional.
alter table profiles add column if not exists social_links jsonb not null default '{}'::jsonb;

-- One-directional follows, like Twitter/Instagram — no approval needed.
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table follows enable row level security;

create policy "Authenticated users can view follows"
  on follows for select
  using (auth.role() = 'authenticated');

create policy "Users can follow as themselves"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow their own follow"
  on follows for delete
  using (auth.uid() = follower_id);

-- Connect requests between real artists (separate from connection_requests,
-- which is for the static collaborators directory).
create table if not exists artist_connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (requester_id, target_id),
  check (requester_id <> target_id)
);

alter table artist_connection_requests enable row level security;

create policy "Authenticated users can view artist connection requests"
  on artist_connection_requests for select
  using (auth.role() = 'authenticated');

create policy "Users can send their own connection requests"
  on artist_connection_requests for insert
  with check (auth.uid() = requester_id);
