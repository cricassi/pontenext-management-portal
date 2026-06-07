-- 005_membership_plans.sql
-- M2 - piani iscrizione configurabili.

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text null,
  minimum_fee numeric(10,2) not null,
  default_duration_months integer not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint membership_plans_name_not_blank check (length(btrim(name)) > 0),
  constraint membership_plans_minimum_fee_check check (minimum_fee >= 0),
  constraint membership_plans_default_duration_check check (
    default_duration_months > 0
  ),
  constraint membership_plans_sort_order_check check (sort_order >= 0)
);

create index if not exists membership_plans_active_sort_idx
on public.membership_plans (is_active, archived_at, sort_order, name);

create index if not exists membership_plans_archived_at_idx
on public.membership_plans (archived_at);

drop trigger if exists set_membership_plans_updated_at
on public.membership_plans;

create trigger set_membership_plans_updated_at
before update on public.membership_plans
for each row
execute function public.set_updated_at();

alter table public.membership_plans enable row level security;

revoke all on table public.membership_plans from anon;

grant select, insert, update on table public.membership_plans to authenticated;

drop policy if exists "membership_plans_select_active_admin"
on public.membership_plans;

create policy "membership_plans_select_active_admin"
on public.membership_plans
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "membership_plans_insert_active_admin"
on public.membership_plans;

create policy "membership_plans_insert_active_admin"
on public.membership_plans
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "membership_plans_update_active_admin"
on public.membership_plans;

create policy "membership_plans_update_active_admin"
on public.membership_plans
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));
