-- 003_harden_admin_functions.sql
-- M0.8 - hardening funzioni amministrative e RLS helper.

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
grant usage on schema app_private to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

create or replace function app_private.is_active_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = (select auth.uid())
      and status = 'active'
      and archived_at is null
  );
$$;

revoke all on function app_private.is_active_admin() from public;
revoke all on function app_private.is_active_admin() from anon;
revoke all on function app_private.is_active_admin() from authenticated;
grant execute on function app_private.is_active_admin() to authenticated;

drop policy if exists "admin_users_select_self_or_active_admin" on public.admin_users;

create policy "admin_users_select_self_or_active_admin"
on public.admin_users
for select
to authenticated
using (
  (select auth.uid()) = auth_user_id
  or (select app_private.is_active_admin())
);

drop function if exists public.is_active_admin();
