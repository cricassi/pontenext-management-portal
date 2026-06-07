-- 009_sponsor_contributions.sql
-- M6 - collegamento opzionale contributi sponsor/eventi.

alter table public.sponsor_contributions
add column if not exists event_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sponsor_contributions_event_id_fkey'
      and conrelid = 'public.sponsor_contributions'::regclass
  ) then
    alter table public.sponsor_contributions
    add constraint sponsor_contributions_event_id_fkey
    foreign key (event_id)
    references public.events(id)
    on delete restrict;
  end if;
end
$$;

create index if not exists sponsor_contributions_event_id_idx
on public.sponsor_contributions (event_id)
where event_id is not null;

create index if not exists sponsor_contributions_event_sponsor_idx
on public.sponsor_contributions (event_id, sponsor_id)
where event_id is not null;

create or replace function public.validate_sponsor_contribution_event_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.events
    where id = new.event_id
      and archived_at is null
  ) then
    raise exception 'Evento collegato al contributo non valido.';
  end if;

  if not exists (
    select 1
    from public.sponsors
    where id = new.sponsor_id
      and archived_at is null
  ) then
    raise exception 'Sponsor collegato al contributo non valido.';
  end if;

  if not exists (
    select 1
    from public.event_sponsors
    where event_id = new.event_id
      and sponsor_id = new.sponsor_id
      and archived_at is null
  ) then
    raise exception 'Lo sponsor non e'' collegato all''evento indicato.';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_sponsor_contribution_event_link()
from public;
revoke all on function public.validate_sponsor_contribution_event_link()
from anon;
revoke all on function public.validate_sponsor_contribution_event_link()
from authenticated;

drop trigger if exists validate_sponsor_contribution_event_link
on public.sponsor_contributions;

create trigger validate_sponsor_contribution_event_link
before insert or update of sponsor_id, event_id
on public.sponsor_contributions
for each row
execute function public.validate_sponsor_contribution_event_link();
