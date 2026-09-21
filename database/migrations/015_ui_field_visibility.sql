-- 015_ui_field_visibility.sql
-- M10-A1 foundation only. Apply live only after the documented approval gate.
-- Supported configurable pairs match field-visibility-registry.ts version 1.
begin;

create function app_private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = (select auth.uid())
      and role = 'super_admin'
      and status = 'active'
      and archived_at is null
  );
$$;

revoke all on function app_private.is_super_admin() from public, anon, authenticated;
grant execute on function app_private.is_super_admin() to authenticated;

create table public.ui_field_visibility (
  id uuid primary key default gen_random_uuid(),
  screen_key text not null,
  field_key text not null,
  is_visible boolean not null default true,
  updated_by uuid not null references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint ui_field_visibility_supported_pair check (
    (screen_key, field_key) in (
      ('members.list', 'email'),
      ('members.list', 'phone'),
      ('members.list', 'city'),
      ('members.create', 'email'),
      ('members.create', 'phone'),
      ('members.create', 'city'),
      ('members.create', 'address'),
      ('members.create', 'postal_code'),
      ('members.create', 'province'),
      ('members.create', 'birth_date'),
      ('members.create', 'fiscal_code'),
      ('members.create', 'profession'),
      ('members.create', 'notes'),
      ('members.edit', 'email'),
      ('members.edit', 'phone'),
      ('members.edit', 'city'),
      ('members.edit', 'address'),
      ('members.edit', 'postal_code'),
      ('members.edit', 'province'),
      ('members.edit', 'birth_date'),
      ('members.edit', 'fiscal_code'),
      ('members.edit', 'profession'),
      ('members.edit', 'notes'),
      ('members.detail', 'email'),
      ('members.detail', 'phone'),
      ('members.detail', 'city'),
      ('members.detail', 'address'),
      ('members.detail', 'postal_code'),
      ('members.detail', 'province'),
      ('members.detail', 'birth_date'),
      ('members.detail', 'fiscal_code'),
      ('members.detail', 'profession'),
      ('members.detail', 'notes'),
      ('roles.list', 'description'),
      ('roles.list', 'is_default'),
      ('roles.create', 'description'),
      ('roles.create', 'is_default'),
      ('roles.edit', 'description'),
      ('roles.edit', 'is_default'),
      ('member_roles.create', 'notes'),
      ('member_roles.list', 'notes'),
      ('membership_plans.list', 'description'),
      ('membership_plans.create', 'description'),
      ('membership_plans.edit', 'description'),
      ('memberships.list', 'membership_plan_id'),
      ('memberships.detail', 'membership_plan_id'),
      ('memberships.history', 'membership_plan_id'),
      ('payments.create', 'reference'),
      ('payments.create', 'notes'),
      ('payments.list', 'reference'),
      ('payments.list', 'notes'),
      ('sponsors.list', 'contact_name'),
      ('sponsors.list', 'email'),
      ('sponsors.list', 'phone'),
      ('sponsors.list', 'city'),
      ('sponsors.create', 'contact_name'),
      ('sponsors.create', 'email'),
      ('sponsors.create', 'phone'),
      ('sponsors.create', 'city'),
      ('sponsors.create', 'website'),
      ('sponsors.create', 'address'),
      ('sponsors.create', 'vat_number'),
      ('sponsors.create', 'fiscal_code'),
      ('sponsors.create', 'notes'),
      ('sponsors.edit', 'contact_name'),
      ('sponsors.edit', 'email'),
      ('sponsors.edit', 'phone'),
      ('sponsors.edit', 'city'),
      ('sponsors.edit', 'website'),
      ('sponsors.edit', 'address'),
      ('sponsors.edit', 'vat_number'),
      ('sponsors.edit', 'fiscal_code'),
      ('sponsors.edit', 'notes'),
      ('sponsors.detail', 'contact_name'),
      ('sponsors.detail', 'email'),
      ('sponsors.detail', 'phone'),
      ('sponsors.detail', 'city'),
      ('sponsors.detail', 'website'),
      ('sponsors.detail', 'address'),
      ('sponsors.detail', 'vat_number'),
      ('sponsors.detail', 'fiscal_code'),
      ('sponsors.detail', 'notes'),
      ('sponsor_contributions.create', 'event_id'),
      ('sponsor_contributions.create', 'notes'),
      ('sponsor_contributions.edit', 'event_id'),
      ('sponsor_contributions.edit', 'notes'),
      ('sponsor_contributions.list', 'event_id'),
      ('sponsor_contributions.list', 'notes'),
      ('events.list', 'location'),
      ('events.create', 'description'),
      ('events.create', 'location'),
      ('events.create', 'notes'),
      ('events.edit', 'description'),
      ('events.edit', 'location'),
      ('events.edit', 'notes'),
      ('events.detail', 'description'),
      ('events.detail', 'location'),
      ('events.detail', 'notes'),
      ('events.sponsor_list', 'location'),
      ('event_sponsors.create', 'sponsorship_level'),
      ('event_sponsors.create', 'notes'),
      ('event_sponsors.edit', 'sponsorship_level'),
      ('event_sponsors.edit', 'notes'),
      ('event_sponsors.list', 'sponsorship_level'),
      ('event_sponsors.list', 'notes'),
      ('email_campaigns.list', 'template_id'),
      ('email_campaigns.create', 'template_id'),
      ('email_campaigns.edit', 'template_id'),
      ('email_campaigns.detail', 'template_id'),
      ('reports.filters', 'query'),
      ('reports.filters', 'status'),
      ('reports.filters', 'membership_status'),
      ('reports.filters', 'payment_status'),
      ('reports.filters', 'payment_method'),
      ('reports.filters', 'contribution_type'),
      ('reports.filters', 'audience_type')
    )
  )
);

create unique index ui_field_visibility_active_pair_idx
  on public.ui_field_visibility (screen_key, field_key)
  where archived_at is null;

create index ui_field_visibility_updated_by_idx
  on public.ui_field_visibility (updated_by);

create trigger set_ui_field_visibility_updated_at
before update on public.ui_field_visibility
for each row execute function public.set_updated_at();

alter table public.ui_field_visibility enable row level security;

-- Explicitly remove Supabase default privileges, including TRUNCATE/DELETE.
revoke all on table public.ui_field_visibility from public, anon, authenticated;
grant select, insert, update on table public.ui_field_visibility to authenticated;

create policy ui_field_visibility_select_active_admin
on public.ui_field_visibility for select to authenticated
using ((select app_private.is_active_admin()));

create policy ui_field_visibility_insert_super_admin
on public.ui_field_visibility for insert to authenticated
with check (
  (select app_private.is_super_admin())
  and archived_at is null
  and updated_by = (
    select id from public.admin_users
    where auth_user_id = (select auth.uid())
      and role = 'super_admin' and status = 'active' and archived_at is null
  )
);

create policy ui_field_visibility_update_super_admin
on public.ui_field_visibility for update to authenticated
using (
  (select app_private.is_super_admin())
  and archived_at is null
)
with check (
  (select app_private.is_super_admin())
  and updated_by = (
    select id from public.admin_users
    where auth_user_id = (select auth.uid())
      and role = 'super_admin' and status = 'active' and archived_at is null
  )
);

commit;
