-- Seed ruoli base M1.
-- Idempotente: riallinea i ruoli base e li rende nuovamente assegnabili.

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
