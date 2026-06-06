-- 006_memberships_payments.sql
-- M2 - iscrizioni storiche e pagamenti non contabili.

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  membership_plan_id uuid null references public.membership_plans(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  minimum_fee numeric(10,2) not null,
  expected_fee numeric(10,2) not null,
  paid_amount numeric(10,2) not null default 0,
  payment_status text not null default 'unpaid',
  status text not null default 'active',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint memberships_date_range_check check (end_date >= start_date),
  constraint memberships_minimum_fee_check check (minimum_fee >= 0),
  constraint memberships_expected_fee_check check (expected_fee >= 0),
  constraint memberships_paid_amount_check check (paid_amount >= 0),
  constraint memberships_payment_status_check check (
    payment_status in ('unpaid', 'partial', 'paid', 'overpaid')
  ),
  constraint memberships_status_check check (
    status in ('active', 'expired', 'cancelled')
  )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  payment_date date not null,
  amount numeric(10,2) not null,
  method text not null,
  reference text null,
  notes text null,
  created_by uuid null references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint payments_amount_check check (amount > 0),
  constraint payments_method_check check (
    method in ('cash', 'bank_transfer', 'pos', 'other')
  )
);

create index if not exists memberships_member_id_idx
on public.memberships (member_id);

create index if not exists memberships_membership_plan_id_idx
on public.memberships (membership_plan_id);

create index if not exists memberships_member_period_idx
on public.memberships (member_id, start_date, end_date);

create index if not exists memberships_status_end_date_idx
on public.memberships (status, end_date);

create index if not exists memberships_payment_status_idx
on public.memberships (payment_status);

create index if not exists memberships_archived_at_idx
on public.memberships (archived_at);

create index if not exists payments_membership_id_idx
on public.payments (membership_id);

create index if not exists payments_payment_date_idx
on public.payments (payment_date);

create index if not exists payments_created_by_idx
on public.payments (created_by);

create index if not exists payments_archived_at_idx
on public.payments (archived_at);

drop trigger if exists set_memberships_updated_at on public.memberships;

create trigger set_memberships_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

create or replace function public.set_membership_payment_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.payment_status := case
    when new.expected_fee = 0 and new.paid_amount = 0 then 'paid'
    when new.paid_amount = 0 then 'unpaid'
    when new.paid_amount < new.expected_fee then 'partial'
    when new.paid_amount = new.expected_fee then 'paid'
    else 'overpaid'
  end;

  return new;
end;
$$;

revoke all on function public.set_membership_payment_status() from public;
revoke all on function public.set_membership_payment_status() from anon;
revoke all on function public.set_membership_payment_status() from authenticated;

drop trigger if exists set_membership_payment_status
on public.memberships;

create trigger set_membership_payment_status
before insert or update of expected_fee, paid_amount, payment_status
on public.memberships
for each row
execute function public.set_membership_payment_status();

create or replace function public.refresh_membership_payment_totals()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_membership_id uuid;
begin
  if tg_op = 'UPDATE' and old.membership_id is distinct from new.membership_id then
    update public.memberships as memberships
    set paid_amount = totals.paid_amount
    from (
      select coalesce(sum(payments.amount), 0)::numeric(10,2) as paid_amount
      from public.payments as payments
      where payments.membership_id = old.membership_id
        and payments.archived_at is null
    ) as totals
    where memberships.id = old.membership_id;
  end if;

  target_membership_id := case
    when tg_op = 'DELETE' then old.membership_id
    else new.membership_id
  end;

  update public.memberships as memberships
  set paid_amount = totals.paid_amount
  from (
    select coalesce(sum(payments.amount), 0)::numeric(10,2) as paid_amount
    from public.payments as payments
    where payments.membership_id = target_membership_id
      and payments.archived_at is null
  ) as totals
  where memberships.id = target_membership_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.refresh_membership_payment_totals() from public;
revoke all on function public.refresh_membership_payment_totals() from anon;
revoke all on function public.refresh_membership_payment_totals() from authenticated;

drop trigger if exists refresh_membership_payment_totals
on public.payments;

create trigger refresh_membership_payment_totals
after insert or update or delete
on public.payments
for each row
execute function public.refresh_membership_payment_totals();

alter table public.memberships enable row level security;
alter table public.payments enable row level security;

revoke all on table public.memberships from anon;
revoke all on table public.payments from anon;

grant select, insert, update on table public.memberships to authenticated;
grant select, insert, update on table public.payments to authenticated;

drop policy if exists "memberships_select_active_admin" on public.memberships;

create policy "memberships_select_active_admin"
on public.memberships
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "memberships_insert_active_admin" on public.memberships;

create policy "memberships_insert_active_admin"
on public.memberships
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "memberships_update_active_admin" on public.memberships;

create policy "memberships_update_active_admin"
on public.memberships
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));

drop policy if exists "payments_select_active_admin" on public.payments;

create policy "payments_select_active_admin"
on public.payments
for select
to authenticated
using ((select app_private.is_active_admin()));

drop policy if exists "payments_insert_active_admin" on public.payments;

create policy "payments_insert_active_admin"
on public.payments
for insert
to authenticated
with check ((select app_private.is_active_admin()));

drop policy if exists "payments_update_active_admin" on public.payments;

create policy "payments_update_active_admin"
on public.payments
for update
to authenticated
using ((select app_private.is_active_admin()))
with check ((select app_private.is_active_admin()));
