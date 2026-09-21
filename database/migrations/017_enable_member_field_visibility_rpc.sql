begin;

-- The privileged writer is private. The public RPC is an invoker-only wrapper.
create function app_private.set_member_field_visibility(
  p_screen_key text, p_values jsonb, p_expected jsonb, p_reset boolean
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_keys text[];
  v_screen integer;
  v_current jsonb;
begin
  if auth.uid() is null or not app_private.is_super_admin() then
    raise exception using errcode = '42501', message = 'Visibility configuration denied';
  end if;

  select a.id into v_admin_id from public.admin_users a
  where a.auth_user_id = auth.uid() and a.role = 'super_admin'
    and a.status = 'active' and a.archived_at is null;
  if v_admin_id is null then
    raise exception using errcode = '42501', message = 'Visibility configuration denied';
  end if;

  v_screen := case p_screen_key
    when 'members.list' then 1 when 'members.create' then 2
    when 'members.edit' then 3 when 'members.detail' then 4 else null end;
  if v_screen is null or p_reset is null then
    raise exception using errcode = '22023', message = 'Invalid visibility configuration';
  end if;
  v_keys := case when v_screen = 1 then array['email', 'phone', 'city']
    else array['email', 'phone', 'city', 'address', 'postal_code', 'province',
      'birth_date', 'fiscal_code', 'profession', 'notes'] end;

  if p_expected is null or pg_catalog.jsonb_typeof(p_expected) <> 'object'
    or p_values is null or pg_catalog.jsonb_typeof(p_values) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid visibility configuration';
  end if;
  if (select count(*) from pg_catalog.jsonb_object_keys(p_expected)) <> cardinality(v_keys)
    or exists (select 1 from pg_catalog.unnest(v_keys) k
      where not (p_expected ? k) or pg_catalog.jsonb_typeof(p_expected -> k) <> 'boolean') then
    raise exception using errcode = '22023', message = 'Invalid expected visibility';
  end if;
  if p_reset then
    if p_values <> '{}'::jsonb then
      raise exception using errcode = '22023', message = 'Reset cannot contain values';
    end if;
  elsif (select count(*) from pg_catalog.jsonb_object_keys(p_values)) <> cardinality(v_keys)
    or exists (select 1 from pg_catalog.unnest(v_keys) k
      where not (p_values ? k) or pg_catalog.jsonb_typeof(p_values -> k) <> 'boolean') then
    raise exception using errcode = '22023', message = 'Invalid visibility fields';
  end if;

  -- Serialize this screen only. A concurrent writer fails without retry/partial work.
  if not pg_catalog.pg_try_advisory_xact_lock(101021, v_screen) then
    raise exception using errcode = '40001', message = 'Visibility configuration conflict';
  end if;
  select pg_catalog.jsonb_object_agg(k, coalesce(v.is_visible, true)) into v_current
  from pg_catalog.unnest(v_keys) k
  left join public.ui_field_visibility v on v.screen_key = p_screen_key
    and v.field_key = k and v.archived_at is null;
  if v_current is distinct from p_expected then
    raise exception using errcode = '40001', message = 'Visibility configuration conflict';
  end if;

  if p_reset then
    update public.ui_field_visibility set archived_at = now(), updated_by = v_admin_id
    where screen_key = p_screen_key and field_key = any(v_keys) and archived_at is null;
  else
    insert into public.ui_field_visibility (screen_key, field_key, is_visible, updated_by)
    select p_screen_key, k, (p_values ->> k)::boolean, v_admin_id
    from pg_catalog.unnest(v_keys) k
    on conflict (screen_key, field_key) where archived_at is null
    do update set is_visible = excluded.is_visible, updated_by = excluded.updated_by;
  end if;
end;
$$;

alter function app_private.set_member_field_visibility(text, jsonb, jsonb, boolean) owner to postgres;
revoke all on function app_private.set_member_field_visibility(text, jsonb, jsonb, boolean) from public, anon, authenticated, service_role;
grant execute on function app_private.set_member_field_visibility(text, jsonb, jsonb, boolean) to authenticated;

create function public.set_member_field_visibility(
  p_screen_key text, p_values jsonb, p_expected jsonb, p_reset boolean
) returns void
language sql
security invoker
set search_path = ''
as $$
  select app_private.set_member_field_visibility(p_screen_key, p_values, p_expected, p_reset);
$$;

alter function public.set_member_field_visibility(text, jsonb, jsonb, boolean) owner to postgres;
revoke all on function public.set_member_field_visibility(text, jsonb, jsonb, boolean) from public, anon, authenticated, service_role;
grant execute on function public.set_member_field_visibility(text, jsonb, jsonb, boolean) to authenticated;

-- No table grants or write policies: the 016 direct-write lock stays unchanged.
commit;
