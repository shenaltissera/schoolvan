-- SchoolVan — initial schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent).

-- ─────────────────────────────────────────────────────────────────────────
-- Drivers: one profile row per authenticated driver, keyed to the auth user.
-- Mirrors the sign-up form (driver name, vehicle no., photo, association
-- reg. no., optional assistant name + photo).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.drivers (
  id                 uuid primary key references auth.users (id) on delete cascade,
  driver_name        text        not null,
  vehicle_number     text        not null,
  driver_photo_url   text,
  association_reg_no text        not null,
  assistant_name     text,
  assistant_photo_url text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.drivers enable row level security;

-- A driver may read and manage only their own profile row.
drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own"
  on public.drivers for select
  using (auth.uid() = id);

drop policy if exists "drivers_insert_own" on public.drivers;
create policy "drivers_insert_own"
  on public.drivers for insert
  with check (auth.uid() = id);

drop policy if exists "drivers_update_own" on public.drivers;
create policy "drivers_update_own"
  on public.drivers for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at
  before update on public.drivers
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Storage bucket for driver / assistant photos.
-- Public read (parents can see the driver photo); writes restricted to the
-- owner's own folder: driver-photos/<auth.uid>/...
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('driver-photos', 'driver-photos', true)
on conflict (id) do nothing;

drop policy if exists "driver_photos_read" on storage.objects;
create policy "driver_photos_read"
  on storage.objects for select
  using (bucket_id = 'driver-photos');

drop policy if exists "driver_photos_write_own" on storage.objects;
create policy "driver_photos_write_own"
  on storage.objects for insert
  with check (
    bucket_id = 'driver-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "driver_photos_update_own" on storage.objects;
create policy "driver_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'driver-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Students: the children a driver carries. One row per child, owned by the
-- driver. (Parent linkage is added later via invites / acceptance.)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  driver_id    uuid not null references public.drivers (id) on delete cascade,
  name         text not null,
  grade        text,
  home_address text,
  created_at   timestamptz not null default now()
);

alter table public.students enable row level security;

drop policy if exists "students_own" on public.students;
create policy "students_own"
  on public.students for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Invites: a shareable token linking a parent to one of the driver's
-- students. The driver creates it; a parent later accepts it (future work).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default replace(gen_random_uuid()::text, '-', ''),
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  status      text not null default 'pending',
  accepted_by uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

alter table public.invites enable row level security;

drop policy if exists "invites_own" on public.invites;
create policy "invites_own"
  on public.invites for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);
