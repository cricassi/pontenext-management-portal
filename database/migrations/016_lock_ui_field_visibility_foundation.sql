-- M10-A1: lock configuration writes until a separately approved A2 RPC exists.
-- Only policies and privileges of public.ui_field_visibility are changed.
begin;

drop policy if exists ui_field_visibility_insert_super_admin
  on public.ui_field_visibility;
drop policy if exists ui_field_visibility_update_super_admin
  on public.ui_field_visibility;

revoke insert, update, delete, truncate, references, trigger
  on table public.ui_field_visibility from authenticated;
revoke all on table public.ui_field_visibility from public, anon;
grant select on table public.ui_field_visibility to authenticated;

commit;
