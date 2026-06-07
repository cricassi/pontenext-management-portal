-- 007_sponsors.sql
-- M5 - anagrafica sponsor e contributi sponsor.

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text null,
  email text null,
  phone text null,
  website text null,
  address text null,
  city text null,
  vat_number text null,
  fiscal_code text null,
  notes text null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint sponsors_company_name_not_blank check (
    length(btrim(company_name)) > 0
  ),
  constraint sponsors_status_check check (
    status in ('active', 'inactive', 'archived')
  ),
  constraint sponsors_email_not_blank check (
    email is null or length(btrim(email)) > 0
  ),
  constraint sponsors_website_not_blank check (
    website is null or length(btrim(website)) > 0
  ),
  constraint sponsors_vat_number_not_blank check (
    vat_number is null or length(btrim(vat_number)) > 0
  ),
  constraint sponsors_fiscal_code_not_blank check (
    fiscal_code is null or length(btrim(fiscal_code)) > 0
  )
);

create table if not exists public.sponsor_contributions (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete restrict,
  contribution_date date not null,
  amount numeric(10,2) not null default 0,
  contribution_type text not null,
  description text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint sponsor_contributions_amount_check check (amount >= 0),
  constraint sponsor_contributions_type_check check (
    contribution_type in ('money', 'goods', 'service', 'other')
  ),
  constraint sponsor_contributions_money_amount_check check (
    contribution_type <> 'money' or amount > 0
  ),
  constraint sponsor_contributions_non_money_description_check check (
    contribution_type = 'money'
    or length(btrim(coalesce(description, ''))) > 0
  )
);

create index if not exists sponsors_status_archived_at_idx
on public.sponsors (status, archived_at);

create index if not exists sponsors_company_name_idx
on public.sponsors (company_name);

create index if not exists sponsors_email_idx
on public.sponsors (email)
where email is not null;

create index if not exists sponsors_city_idx
on public.sponsors (city)
where city is not null;

create index if not exists sponsors_archived_at_idx
on public.sponsors (archived_at);

create index if not exists sponsor_contributions_sponsor_id_idx
on public.sponsor_contributions (sponsor_id);

create index if not exists sponsor_contributions_date_idx
on public.sponsor_contributions (contribution_date);

create index if not exists sponsor_contributions_type_idx
on public.sponsor_contributions (contribution_type);

create index if not exists sponsor_contributions_archived_at_idx
on public.sponsor_contributions (archived_at);

drop trigger if exists set_sponsors_updated_at on public.sponsors;

create trigger set_sponsors_updated_at
before update on public.sponsors
for each row
execute function public.set_updated_at();

drop trigger if exists set_sponsor_contributions_updated_at
on public.sponsor_contributions;

create trigger set_sponsor_contributions_updated_at
before update on public.sponsor_contributions
for each row
execute function public.set_updated_at();

alter table public.sponsors enable row level security;
alter table public.sponsor_contributions enable row level security;

revoke all on table public.sponsors from anon;
revoke all on table public.sponsor_contributions from anon;

grant select, insert, update on table public.sponsors to authenticated;
grant select, insert, update on table public.sponsor_contributions to authenticated;

drop policy if exists "sponsors_select_active_admin" on public.sponsors;

create policy "sponsors_select_active_admin"
on public.sponsors
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "sponsors_insert_active_admin" on public.sponsors;

create policy "sponsors_insert_active_admin"
on public.sponsors
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "sponsors_update_active_admin" on public.sponsors;

create policy "sponsors_update_active_admin"
on public.sponsors
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "sponsor_contributions_select_active_admin"
on public.sponsor_contributions;

create policy "sponsor_contributions_select_active_admin"
on public.sponsor_contributions
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "sponsor_contributions_insert_active_admin"
on public.sponsor_contributions;

create policy "sponsor_contributions_insert_active_admin"
on public.sponsor_contributions
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "sponsor_contributions_update_active_admin"
on public.sponsor_contributions;

create policy "sponsor_contributions_update_active_admin"
on public.sponsor_contributions
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));
