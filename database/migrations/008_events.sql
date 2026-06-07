-- 008_events.sql
-- M6 - eventi e collegamento sponsor/eventi.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  start_datetime timestamptz not null,
  end_datetime timestamptz null,
  location text null,
  status text not null default 'planned',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint events_name_not_blank check (
    length(btrim(name)) > 0
  ),
  constraint events_status_check check (
    status in ('planned', 'confirmed', 'completed', 'cancelled')
  ),
  constraint events_end_datetime_check check (
    end_datetime is null or end_datetime >= start_datetime
  )
);

create table if not exists public.event_sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  sponsor_id uuid not null references public.sponsors(id) on delete restrict,
  sponsorship_level text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint event_sponsors_sponsorship_level_not_blank check (
    sponsorship_level is null or length(btrim(sponsorship_level)) > 0
  )
);

create index if not exists events_status_archived_at_idx
on public.events (status, archived_at);

create index if not exists events_start_datetime_idx
on public.events (start_datetime);

create index if not exists events_name_idx
on public.events (name);

create index if not exists events_archived_at_idx
on public.events (archived_at);

create index if not exists event_sponsors_event_id_idx
on public.event_sponsors (event_id);

create index if not exists event_sponsors_sponsor_id_idx
on public.event_sponsors (sponsor_id);

create index if not exists event_sponsors_archived_at_idx
on public.event_sponsors (archived_at);

create unique index if not exists event_sponsors_event_sponsor_active_unique_idx
on public.event_sponsors (event_id, sponsor_id)
where archived_at is null;

drop trigger if exists set_events_updated_at on public.events;

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

drop trigger if exists set_event_sponsors_updated_at on public.event_sponsors;

create trigger set_event_sponsors_updated_at
before update on public.event_sponsors
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.event_sponsors enable row level security;

revoke all on table public.events from anon;
revoke all on table public.event_sponsors from anon;

grant select, insert, update on table public.events to authenticated;
grant select, insert, update on table public.event_sponsors to authenticated;

drop policy if exists "events_select_active_admin" on public.events;

create policy "events_select_active_admin"
on public.events
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "events_insert_active_admin" on public.events;

create policy "events_insert_active_admin"
on public.events
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "events_update_active_admin" on public.events;

create policy "events_update_active_admin"
on public.events
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "event_sponsors_select_active_admin"
on public.event_sponsors;

create policy "event_sponsors_select_active_admin"
on public.event_sponsors
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "event_sponsors_insert_active_admin"
on public.event_sponsors;

create policy "event_sponsors_insert_active_admin"
on public.event_sponsors
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "event_sponsors_update_active_admin"
on public.event_sponsors;

create policy "event_sponsors_update_active_admin"
on public.event_sponsors
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));
