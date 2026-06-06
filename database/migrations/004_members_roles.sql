-- 004_members_roles.sql
-- M1 - anagrafica soci, ruoli associativi e assegnazioni ruolo.

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text null,
  phone text null,
  address text null,
  city text null,
  postal_code text null,
  province text null,
  country text not null default 'Italia',
  birth_date date null,
  fiscal_code text null,
  profession text null,
  notes text null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint members_first_name_not_blank check (length(btrim(first_name)) > 0),
  constraint members_last_name_not_blank check (length(btrim(last_name)) > 0),
  constraint members_status_check check (status in ('active', 'inactive', 'archived')),
  constraint members_email_not_blank check (email is null or length(btrim(email)) > 0),
  constraint members_fiscal_code_not_blank check (
    fiscal_code is null or length(btrim(fiscal_code)) > 0
  )
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint roles_name_not_blank check (length(btrim(name)) > 0),
  constraint roles_sort_order_check check (sort_order >= 0)
);

create table if not exists public.member_roles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  start_date date not null,
  end_date date null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint member_roles_date_range_check check (
    end_date is null or end_date >= start_date
  )
);

create index if not exists members_status_archived_at_idx
on public.members (status, archived_at);

create index if not exists members_name_idx
on public.members (last_name, first_name);

create index if not exists members_email_idx
on public.members (email)
where email is not null;

create index if not exists members_fiscal_code_idx
on public.members (fiscal_code)
where fiscal_code is not null;

create index if not exists roles_sort_order_name_idx
on public.roles (sort_order, name);

create index if not exists roles_archived_at_idx
on public.roles (archived_at);

create index if not exists member_roles_member_id_idx
on public.member_roles (member_id);

create index if not exists member_roles_role_id_idx
on public.member_roles (role_id);

create index if not exists member_roles_member_role_idx
on public.member_roles (member_id, role_id);

create index if not exists member_roles_member_archived_at_idx
on public.member_roles (member_id, archived_at);

create unique index if not exists member_roles_active_open_unique_idx
on public.member_roles (member_id, role_id)
where archived_at is null and end_date is null;

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row
execute function public.set_updated_at();

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

drop trigger if exists set_member_roles_updated_at on public.member_roles;
create trigger set_member_roles_updated_at
before update on public.member_roles
for each row
execute function public.set_updated_at();

alter table public.members enable row level security;
alter table public.roles enable row level security;
alter table public.member_roles enable row level security;

revoke all on table public.members from anon;
revoke all on table public.roles from anon;
revoke all on table public.member_roles from anon;

grant select, insert, update on table public.members to authenticated;
grant select, insert, update on table public.roles to authenticated;
grant select, insert, update on table public.member_roles to authenticated;

drop policy if exists "members_select_active_admin" on public.members;
create policy "members_select_active_admin"
on public.members
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "members_insert_active_admin" on public.members;
create policy "members_insert_active_admin"
on public.members
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "members_update_active_admin" on public.members;
create policy "members_update_active_admin"
on public.members
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "roles_select_active_admin" on public.roles;
create policy "roles_select_active_admin"
on public.roles
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "roles_insert_active_admin" on public.roles;
create policy "roles_insert_active_admin"
on public.roles
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "roles_update_active_admin" on public.roles;
create policy "roles_update_active_admin"
on public.roles
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "member_roles_select_active_admin" on public.member_roles;
create policy "member_roles_select_active_admin"
on public.member_roles
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "member_roles_insert_active_admin" on public.member_roles;
create policy "member_roles_insert_active_admin"
on public.member_roles
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "member_roles_update_active_admin" on public.member_roles;
create policy "member_roles_update_active_admin"
on public.member_roles
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

insert into public.roles (name, description, is_default, sort_order)
values
  ('Presidente', 'Ruolo associativo Presidente', true, 10),
  ('Vicepresidente', 'Ruolo associativo Vicepresidente', true, 20),
  ('Segretario', 'Ruolo associativo Segretario', true, 30),
  ('Tesoriere', 'Ruolo associativo Tesoriere', true, 40),
  ('Consigliere', 'Ruolo associativo Consigliere', true, 50),
  ('Socio Ordinario', 'Ruolo associativo Socio Ordinario', true, 60),
  ('Socio Sostenitore', 'Ruolo associativo Socio Sostenitore', true, 70)
on conflict (name) do update
set
  description = excluded.description,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order,
  archived_at = null;
