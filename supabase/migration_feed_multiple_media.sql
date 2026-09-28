-- Run this once in Supabase SQL Editor after migration_feed.sql.
-- Keep image_url for compatibility with existing clients and old posts.
alter table public.posts
  add column if not exists media_urls text[] not null default '{}';

update public.posts
set media_urls = array[image_url]
where image_url is not null
  and cardinality(media_urls) = 0;
