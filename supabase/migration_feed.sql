-- Run this in Supabase: SQL Editor → New query → Run
-- (Run this AFTER migration.sql and migration_connect_opportunities.sql)

-- Profiles: minimal public identity so posts can show a real name.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Authenticated users can view profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile (using the email's local part as the name) on signup.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for anyone who signed up before this migration existed.
insert into profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "Authenticated users can view posts"
  on posts for select
  using (auth.role() = 'authenticated');

create policy "Users can create their own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- Likes
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Authenticated users can view likes"
  on post_likes for select
  using (auth.role() = 'authenticated');

create policy "Users can like as themselves"
  on post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own like"
  on post_likes for delete
  using (auth.uid() = user_id);

-- Comments
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table post_comments enable row level security;

create policy "Authenticated users can view comments"
  on post_comments for select
  using (auth.role() = 'authenticated');

create policy "Users can comment as themselves"
  on post_comments for insert
  with check (auth.uid() = user_id);

-- Storage bucket for post photos (public read, authenticated upload)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public read access to post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
