-- Equipos de las desarrolladoras y portal de asesores para todos los roles.
-- 1. La desarrolladora pide altas de asesores para su equipo; el administrador las aprueba asignando un acceso.
-- 2. El portal de asesores (inventario, descargas, academia) lo usan asesores, desarrolladoras y el administrador.
-- 3. org_team() expone en la página pública solo nombre, puesto y foto de los asesores activos de cada desarrolladora.

alter table applications add column if not exists org_id text generated always as (data->>'orgId') stored;

drop policy if exists applications_org_read on applications;
create policy applications_org_read on applications for select using (org_id is not null and owns_org(org_id));

drop policy if exists applications_org_insert on applications;
create policy applications_org_insert on applications for insert with check (
  me_role() = 'desarrolladora' and org_id = me_org()
  and data->>'status' = 'pendiente'
  and data->>'requestedBy' = auth.uid()::text
  and not exists (select 1 from profiles p where lower(p.data->>'email') = lower(applications.data->>'email'))
);

drop policy if exists materials_read on materials;
create policy materials_read on materials for select using (me_role() in ('asesor', 'desarrolladora', 'superadmin'));

drop policy if exists courses_read on courses;
create policy courses_read on courses for select using (
  (published and me_role() in ('asesor', 'desarrolladora')) or is_admin() or (org_id is not null and owns_org(org_id))
);

create or replace function org_team(org text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', data->>'name', 'title', coalesce(data->>'title', ''), 'photo', data->>'photo') order by data->>'createdAt'), '[]'::jsonb)
  from profiles where role = 'asesor' and org_id = org and active
    and exists (select 1 from orgs o where o.id = org and o.status = 'activa')
$$;
grant execute on function org_team(text) to anon, authenticated;
