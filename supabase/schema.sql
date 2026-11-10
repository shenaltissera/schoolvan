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

-- ─────────────────────────────────────────────────────────────────────────
-- Parent linkage: a parent (auth user) is bound to a student when they
-- accept an invite. Parents get their own profile row + read access to
-- their linked children.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.students add column if not exists parent_id uuid references auth.users (id);

drop policy if exists "students_parent_read" on public.students;
create policy "students_parent_read"
  on public.students for select
  using (auth.uid() = parent_id);

-- A parent may read the driver profile of their linked child's driver.
drop policy if exists "drivers_parent_read" on public.drivers;
create policy "drivers_parent_read"
  on public.drivers for select
  using (exists (
    select 1 from public.students s
    where s.driver_id = drivers.id and s.parent_id = auth.uid()
  ));

create table if not exists public.parents (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  phone      text,
  created_at timestamptz not null default now()
);

alter table public.parents enable row level security;

drop policy if exists "parents_own" on public.parents;
create policy "parents_own"
  on public.parents for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Accept an invite: binds the calling parent to the student. SECURITY DEFINER
-- so a parent (who can't normally write the invite/student rows) can accept.
create or replace function public.accept_invite(invite_token text)
returns table (student_id uuid, student_name text)
language plpgsql security definer set search_path = public as $$
declare
  inv public.invites;
begin
  select * into inv from public.invites where token = invite_token;
  if inv.id is null then
    raise exception 'Invite not found';
  end if;
  if inv.status = 'accepted' and inv.accepted_by is distinct from auth.uid() then
    raise exception 'Invite already used';
  end if;
  update public.invites set status = 'accepted', accepted_by = auth.uid() where id = inv.id;
  update public.students set parent_id = auth.uid() where id = inv.student_id;
  return query select s.id, s.name from public.students s where s.id = inv.student_id;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Live van location: one row per driver, upserted while a shift is online.
-- The driver writes it; a parent may read the location of their child's
-- driver. Added to the realtime publication so parents get live updates.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.van_locations (
  driver_id  uuid primary key references public.drivers (id) on delete cascade,
  lat        double precision,
  lng        double precision,
  heading    double precision,
  speed_kmh  double precision,
  online     boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.van_locations enable row level security;

drop policy if exists "van_loc_driver" on public.van_locations;
create policy "van_loc_driver"
  on public.van_locations for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

drop policy if exists "van_loc_parent_read" on public.van_locations;
create policy "van_loc_parent_read"
  on public.van_locations for select
  using (exists (
    select 1 from public.students s
    where s.driver_id = van_locations.driver_id and s.parent_id = auth.uid()
  ));

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'van_locations'
  ) then
    alter publication supabase_realtime add table public.van_locations;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Ride status: per student, per window (morning/afternoon), per day. The
-- driver writes it; the linked parent may read it.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ride_status (
  id         uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  ride_window text not null,
  ride_date   date not null default current_date,
  status      text not null default 'waiting',
  updated_at  timestamptz not null default now(),
  unique (student_id, ride_window, ride_date)
);

alter table public.ride_status enable row level security;

drop policy if exists "ride_status_driver" on public.ride_status;
create policy "ride_status_driver" on public.ride_status for all
  using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

drop policy if exists "ride_status_parent_read" on public.ride_status;
create policy "ride_status_parent_read" on public.ride_status for select
  using (exists (
    select 1 from public.students s
    where s.id = ride_status.student_id and s.parent_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────────
-- Alerts: a notification about a student (pickup / drop-off / trip events).
-- The driver inserts them; the linked parent reads and marks them read.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;

drop policy if exists "alerts_driver_insert" on public.alerts;
create policy "alerts_driver_insert" on public.alerts for insert
  with check (exists (
    select 1 from public.students s where s.id = alerts.student_id and s.driver_id = auth.uid()
  ));

drop policy if exists "alerts_driver_read" on public.alerts;
create policy "alerts_driver_read" on public.alerts for select
  using (exists (
    select 1 from public.students s where s.id = alerts.student_id and s.driver_id = auth.uid()
  ));

drop policy if exists "alerts_parent_read" on public.alerts;
create policy "alerts_parent_read" on public.alerts for select
  using (exists (
    select 1 from public.students s where s.id = alerts.student_id and s.parent_id = auth.uid()
  ));

drop policy if exists "alerts_parent_update" on public.alerts;
create policy "alerts_parent_update" on public.alerts for update
  using (exists (
    select 1 from public.students s where s.id = alerts.student_id and s.parent_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────────
-- Push notifications: store each user's Expo push token, and send a push to
-- the parent's device whenever an alert is inserted (via pg_net, no server).
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists pg_net;

create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  token      text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_own" on public.push_tokens;
create policy "push_tokens_own" on public.push_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_parent_push()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  parent uuid;
  tok    record;
begin
  select s.parent_id into parent from public.students s where s.id = new.student_id;
  if parent is null then
    return new;
  end if;
  for tok in select token from public.push_tokens where user_id = parent loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'to', tok.token,
        'title', new.title,
        'body', new.body,
        'sound', 'default'
      )
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists alerts_push on public.alerts;
create trigger alerts_push after insert on public.alerts
  for each row execute function public.notify_parent_push();
