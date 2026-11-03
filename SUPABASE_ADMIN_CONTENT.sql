
-- FARMING SIMULATOR GUIDE PRO
-- Admin content + image storage
-- Rulează tot în Supabase SQL Editor.

create table if not exists public.fs_public_content (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'info',
  slug text,
  title text not null,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilitate pentru tabela deja creată
alter table public.fs_public_content
  add column if not exists slug text;

alter table public.fs_public_content
  add column if not exists image_url text;

alter table public.fs_public_content
  add column if not exists updated_at timestamptz default now();

-- Activare securitate
alter table public.fs_public_content enable row level security;

-- Citire publică
drop policy if exists "fs content public read"
on public.fs_public_content;

create policy "fs content public read"
on public.fs_public_content
for select
to anon, authenticated
using (true);

-- INSERT doar admin
drop policy if exists "fs content admin insert"
on public.fs_public_content;

create policy "fs content admin insert"
on public.fs_public_content
for insert
to authenticated
with check (
  lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- UPDATE doar admin
drop policy if exists "fs content admin update"
on public.fs_public_content;

create policy "fs content admin update"
on public.fs_public_content
for update
to authenticated
using (
  lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
)
with check (
  lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- DELETE doar admin
drop policy if exists "fs content admin delete"
on public.fs_public_content;

create policy "fs content admin delete"
on public.fs_public_content
for delete
to authenticated
using (
  lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- BUCKET IMAGINI
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'fs-admin-images',
  'fs-admin-images',
  true,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

-- Upload numai admin
drop policy if exists "fs images admin insert"
on storage.objects;

create policy "fs images admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fs-admin-images'
  and lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- Update imagini numai admin
drop policy if exists "fs images admin update"
on storage.objects;

create policy "fs images admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fs-admin-images'
  and lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
)
with check (
  bucket_id = 'fs-admin-images'
  and lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- Delete imagini numai admin
drop policy if exists "fs images admin delete"
on storage.objects;

create policy "fs images admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fs-admin-images'
  and lower(auth.jwt() ->> 'email') =
  'alexandrujoanta6@gmail.com'
);

-- Citire publică imagini
drop policy if exists "fs images public read"
on storage.objects;

create policy "fs images public read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'fs-admin-images'
);
