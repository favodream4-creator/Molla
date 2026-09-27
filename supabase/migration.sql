-- Run this in Supabase: SQL Editor → New query → Run

create table if not exists molla_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarded boolean not null default false,
  goal text default '',
  where_now text default '',
  blocker text default '',
  daily_time text default '',
  streak int not null default 4,
  progress int not null default 72,
  artwork_done boolean not null default false,
  next_move_title text not null default 'Finish the second verse of your single',
  next_move_minutes int not null default 45,
  updated_at timestamptz not null default now()
);

alter table molla_state enable row level security;

create policy "Users can view their own state"
  on molla_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own state"
  on molla_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own state"
  on molla_state for update
  using (auth.uid() = user_id);
