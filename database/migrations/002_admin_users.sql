-- 002_admin_users.sql
-- M0 - tabella minima amministratori applicativi e RLS iniziale.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('super_admin', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);

drop trigger if exists set_admin_users_updated_at on public.admin_users;

create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;

create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = auth.uid()
      and status = 'active'
      and archived_at is null
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

drop policy if exists "admin_users_select_self_or_active_admin" on public.admin_users;

create policy "admin_users_select_self_or_active_admin"
on public.admin_users
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_active_admin()
);

-- Insert/update/delete sono intenzionalmente senza policy in M0.
-- Il bootstrap del primo super_admin deve essere eseguito con privilegi owner/service role.
