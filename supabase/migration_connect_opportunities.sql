-- Run this in Supabase: SQL Editor → New query → Run
-- (Run this AFTER migration.sql, which creates molla_state)

-- Collaborators directory — read-only for artists, managed by you for now
create table if not exists collaborators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  location text,
  genres text,
  skills text,
  created_at timestamptz not null default now()
);

alter table collaborators enable row level security;

create policy "Authenticated users can view collaborators"
  on collaborators for select
  using (auth.role() = 'authenticated');

-- Opportunities feed — read-only for artists, managed by you for now
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  title text not null,
  meta text,
  created_at timestamptz not null default now()
);

alter table opportunities enable row level security;

create policy "Authenticated users can view opportunities"
  on opportunities for select
  using (auth.role() = 'authenticated');

-- Connection requests: an artist tapping "Connect" on a collaborator
create table if not exists connection_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references collaborators(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, collaborator_id)
);

alter table connection_requests enable row level security;

create policy "Users can view their own connection requests"
  on connection_requests for select
  using (auth.uid() = user_id);

create policy "Users can create their own connection requests"
  on connection_requests for insert
  with check (auth.uid() = user_id);

-- Opportunity applications: an artist tapping "Apply"
create table if not exists opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

alter table opportunity_applications enable row level security;

create policy "Users can view their own applications"
  on opportunity_applications for select
  using (auth.uid() = user_id);

create policy "Users can create their own applications"
  on opportunity_applications for insert
  with check (auth.uid() = user_id);

-- Seed data so Connect and Opportunities aren't empty
insert into collaborators (name, role, location, genres, skills) values
  ('Marcus Reed', 'Producer', 'Atlanta, USA', 'Hip-Hop · R&B · Trap', null),
  ('Lina Gomez', 'Mixing Engineer', 'Miami, USA', 'Pop · R&B · Hip-Hop', null),
  ('Devon Cole', 'Videographer', 'Austin, USA', null, 'Music videos · Reels'),
  ('Priya Shah', 'Designer', 'Remote', null, 'Artwork · Branding');

insert into opportunities (tag, title, meta) values
  ('SHOWCASE', 'Rising Stars Showcase', 'New York, NY (Online) · Deadline Nov 15'),
  ('PLAYLIST', 'Playlist Submission', 'Spotify Curated Playlist · Rolling'),
  ('PRODUCER CALL', 'Beat placement opportunity', 'Online · Deadline Dec 1');
