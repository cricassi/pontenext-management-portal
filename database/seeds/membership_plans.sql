-- Seed piani iscrizione base M2.
-- Idempotente: riallinea i piani base e li rende nuovamente selezionabili.

insert into public.membership_plans (
  name,
  description,
  minimum_fee,
  default_duration_months,
  is_active,
  sort_order
)
values
  ('Ordinaria', 'Iscrizione ordinaria annuale', 30.00, 12, true, 10),
  ('Agevolata', 'Iscrizione agevolata semestrale', 15.00, 6, true, 20),
  ('Sostenitore', 'Iscrizione sostenitore annuale', 30.00, 12, true, 30)
on conflict (name) do update
set
  description = excluded.description,
  minimum_fee = excluded.minimum_fee,
  default_duration_months = excluded.default_duration_months,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  archived_at = null;
