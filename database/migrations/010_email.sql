-- 010_email.sql
-- M7 - template email, campagne e destinatari campagna.

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  audience text not null default 'both',
  is_active boolean not null default true,
  created_by uuid null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint email_templates_name_not_blank check (
    length(btrim(name)) > 0
  ),
  constraint email_templates_subject_not_blank check (
    length(btrim(subject)) > 0
  ),
  constraint email_templates_body_not_blank check (
    length(btrim(body)) > 0
  ),
  constraint email_templates_audience_check check (
    audience in ('members', 'sponsors', 'both')
  )
);

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  template_id uuid null references public.email_templates(id) on delete restrict,
  subject text not null,
  body text not null,
  audience_type text not null,
  status text not null default 'draft',
  provider text not null default 'resend',
  recipient_snapshot_generated_at timestamptz null,
  send_confirmed_at timestamptz null,
  sent_at timestamptz null,
  failed_at timestamptz null,
  error_message text null,
  created_by uuid null references public.admin_users(id) on delete restrict,
  sent_by uuid null references public.admin_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint email_campaigns_subject_not_blank check (
    length(btrim(subject)) > 0
  ),
  constraint email_campaigns_body_not_blank check (
    length(btrim(body)) > 0
  ),
  constraint email_campaigns_audience_type_check check (
    audience_type in (
      'all_members',
      'active_members',
      'expired_members',
      'sponsors',
      'custom'
    )
  ),
  constraint email_campaigns_status_check check (
    status in ('draft', 'sent', 'failed')
  ),
  constraint email_campaigns_provider_check check (
    provider = 'resend'
  ),
  constraint email_campaigns_sent_dates_check check (
    (status = 'sent' and sent_at is not null)
    or status <> 'sent'
  ),
  constraint email_campaigns_failed_dates_check check (
    (status = 'failed' and failed_at is not null)
    or status <> 'failed'
  )
);

create table if not exists public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete restrict,
  recipient_type text not null,
  member_id uuid null references public.members(id) on delete restrict,
  sponsor_id uuid null references public.sponsors(id) on delete restrict,
  email text not null,
  recipient_name text null,
  status text not null default 'pending',
  skip_reason text null,
  provider_message_id text null,
  error_message text null,
  sent_at timestamptz null,
  opt_out_token_hash text null,
  opted_out_at timestamptz null,
  consent_basis_snapshot text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_campaign_recipients_email_not_blank check (
    length(btrim(email)) > 0
  ),
  constraint email_campaign_recipients_email_format_check check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint email_campaign_recipients_recipient_type_check check (
    recipient_type in ('member', 'sponsor', 'custom')
  ),
  constraint email_campaign_recipients_status_check check (
    status in ('pending', 'sent', 'failed', 'skipped')
  ),
  constraint email_campaign_recipients_skip_reason_check check (
    skip_reason is null
    or skip_reason in (
      'missing_email',
      'invalid_email',
      'duplicate',
      'opted_out',
      'missing_consent'
    )
  ),
  constraint email_campaign_recipients_reference_check check (
    (
      recipient_type = 'member'
      and member_id is not null
      and sponsor_id is null
    )
    or (
      recipient_type = 'sponsor'
      and sponsor_id is not null
      and member_id is null
    )
    or (
      recipient_type = 'custom'
      and member_id is null
      and sponsor_id is null
    )
  ),
  constraint email_campaign_recipients_sent_state_check check (
    (status = 'sent' and sent_at is not null)
    or status <> 'sent'
  )
);

create index if not exists email_templates_audience_active_idx
on public.email_templates (audience, is_active, archived_at);

create index if not exists email_templates_name_idx
on public.email_templates (name);

create index if not exists email_templates_archived_at_idx
on public.email_templates (archived_at);

create index if not exists email_campaigns_template_id_idx
on public.email_campaigns (template_id);

create index if not exists email_campaigns_audience_status_idx
on public.email_campaigns (audience_type, status, archived_at);

create index if not exists email_campaigns_created_at_idx
on public.email_campaigns (created_at desc);

create index if not exists email_campaigns_archived_at_idx
on public.email_campaigns (archived_at);

create index if not exists email_campaign_recipients_campaign_id_idx
on public.email_campaign_recipients (campaign_id);

create index if not exists email_campaign_recipients_status_idx
on public.email_campaign_recipients (campaign_id, status);

create index if not exists email_campaign_recipients_member_id_idx
on public.email_campaign_recipients (member_id)
where member_id is not null;

create index if not exists email_campaign_recipients_sponsor_id_idx
on public.email_campaign_recipients (sponsor_id)
where sponsor_id is not null;

create index if not exists email_campaign_recipients_opt_out_idx
on public.email_campaign_recipients (lower(email), opted_out_at)
where opted_out_at is not null;

create unique index if not exists email_campaign_recipients_campaign_email_unique_idx
on public.email_campaign_recipients (campaign_id, lower(email));

drop trigger if exists set_email_templates_updated_at on public.email_templates;

create trigger set_email_templates_updated_at
before update on public.email_templates
for each row
execute function public.set_updated_at();

drop trigger if exists set_email_campaigns_updated_at on public.email_campaigns;

create trigger set_email_campaigns_updated_at
before update on public.email_campaigns
for each row
execute function public.set_updated_at();

drop trigger if exists set_email_campaign_recipients_updated_at
on public.email_campaign_recipients;

create trigger set_email_campaign_recipients_updated_at
before update on public.email_campaign_recipients
for each row
execute function public.set_updated_at();

alter table public.email_templates enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;

revoke all on table public.email_templates from anon;
revoke all on table public.email_campaigns from anon;
revoke all on table public.email_campaign_recipients from anon;

grant select, insert, update on table public.email_templates to authenticated;
grant select, insert, update on table public.email_campaigns to authenticated;
grant select, insert, update on table public.email_campaign_recipients to authenticated;

drop policy if exists "email_templates_select_active_admin"
on public.email_templates;

create policy "email_templates_select_active_admin"
on public.email_templates
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "email_templates_insert_active_admin"
on public.email_templates;

create policy "email_templates_insert_active_admin"
on public.email_templates
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "email_templates_update_active_admin"
on public.email_templates;

create policy "email_templates_update_active_admin"
on public.email_templates
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "email_campaigns_select_active_admin"
on public.email_campaigns;

create policy "email_campaigns_select_active_admin"
on public.email_campaigns
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "email_campaigns_insert_active_admin"
on public.email_campaigns;

create policy "email_campaigns_insert_active_admin"
on public.email_campaigns
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "email_campaigns_update_active_admin"
on public.email_campaigns;

create policy "email_campaigns_update_active_admin"
on public.email_campaigns
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "email_campaign_recipients_select_active_admin"
on public.email_campaign_recipients;

create policy "email_campaign_recipients_select_active_admin"
on public.email_campaign_recipients
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "email_campaign_recipients_insert_active_admin"
on public.email_campaign_recipients;

create policy "email_campaign_recipients_insert_active_admin"
on public.email_campaign_recipients
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "email_campaign_recipients_update_active_admin"
on public.email_campaign_recipients;

create policy "email_campaign_recipients_update_active_admin"
on public.email_campaign_recipients
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));
