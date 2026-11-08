-- Umbral: esquema de producción en Supabase.
-- Cada colección guarda el documento completo en `data` (jsonb), igual que la capa
-- de datos del sitio. Las columnas que usa la seguridad (RLS) se generan del documento.
-- Ejecutar completo en el SQL Editor de Supabase. Es idempotente.

create extension if not exists pgcrypto;

-- ─── Tablas ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id text primary key,                                   -- = auth.users.id
  data jsonb not null,
  role text generated always as (data->>'role') stored,
  org_id text generated always as (data->>'orgId') stored,
  asesor_tipo text generated always as (data->>'asesorTipo') stored,
  active boolean generated always as (coalesce((data->>'active')::boolean, true)) stored
);

create table if not exists orgs (
  id text primary key,
  data jsonb not null,
  status text generated always as (data->>'status') stored
);

create table if not exists developments (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored
);

create table if not exists listings (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored,
  status text generated always as (data->>'status') stored
);

create table if not exists leads (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored,
  asesor_id text generated always as (data->>'asesorId') stored,
  created_at timestamptz not null default now()
);

create table if not exists activity (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored,
  user_id text generated always as (data->>'userId') stored,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id text primary key,
  data jsonb not null
);

create table if not exists applications (
  id text primary key,
  data jsonb not null,
  status text generated always as (data->>'status') stored,
  email text generated always as (lower(data->>'email')) stored
);

create table if not exists banks (
  id text primary key,
  data jsonb not null
);

create table if not exists articles (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored,
  published boolean generated always as (coalesce((data->>'published')::boolean, false)) stored
);

create table if not exists materials (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored
);

create table if not exists courses (
  id text primary key,
  data jsonb not null,
  org_id text generated always as (data->>'orgId') stored,
  published boolean generated always as (coalesce((data->>'published')::boolean, false)) stored
);

-- Valores sueltos: catálogo de amenidades ("amenities") y turno del reparto ("rr").
create table if not exists settings (
  id text primary key,
  data jsonb not null
);

-- ─── Quién es el usuario actual ──────────────────────────────────────────
create or replace function me_role() returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()::text and active
$$;
create or replace function me_org() returns text language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid()::text and active
$$;
create or replace function me_tipo() returns text language sql stable security definer set search_path = public as $$
  select asesor_tipo from profiles where id = auth.uid()::text and active
$$;
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(me_role() = 'superadmin', false)
$$;
create or replace function owns_org(o text) returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or (me_role() = 'desarrolladora' and me_org() = o)
$$;
create or replace function org_active(o text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from orgs where id = o and status = 'activa')
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table orgs enable row level security;
alter table developments enable row level security;
alter table listings enable row level security;
alter table leads enable row level security;
alter table activity enable row level security;
alter table requests enable row level security;
alter table applications enable row level security;
alter table banks enable row level security;
alter table articles enable row level security;
alter table materials enable row level security;
alter table courses enable row level security;
alter table settings enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- Perfiles: cada quien ve el suyo; la desarrolladora ve a su equipo; el administrador ve todo.
-- Los nombres de asesores que aparecen en prospectos y notas los ve quien ve ese prospecto.
create policy profiles_read on profiles for select using (
  is_admin() or id = auth.uid()::text
  or (me_role() = 'desarrolladora' and org_id = me_org())
  or (role = 'asesor' and me_role() in ('desarrolladora'))
);
create policy profiles_update on profiles for update using (is_admin() or id = auth.uid()::text);
create policy profiles_admin_write on profiles for insert with check (is_admin());
create policy profiles_admin_delete on profiles for delete using (is_admin());

-- Nadie cambia su propio rol, tipo, desarrolladora ni estado desde su perfil.
create or replace function protect_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := jsonb_set(new.data, '{role}', old.data->'role');
    new.data := jsonb_set(new.data, '{active}', coalesce(old.data->'active', 'true'::jsonb));
    new.data := case when old.data ? 'orgId' then jsonb_set(new.data, '{orgId}', old.data->'orgId') else new.data - 'orgId' end;
    new.data := case when old.data ? 'asesorTipo' then jsonb_set(new.data, '{asesorTipo}', old.data->'asesorTipo') else new.data - 'asesorTipo' end;
  end if;
  new.data := new.data - 'password';
  return new;
end $$;
drop trigger if exists protect_profile on profiles;
create trigger protect_profile before insert or update on profiles for each row execute function protect_profile();

-- Desarrolladoras
create policy orgs_read on orgs for select using (status = 'activa' or owns_org(id));
create policy orgs_update on orgs for update using (owns_org(id));
create policy orgs_insert on orgs for insert with check (is_admin());
create policy orgs_delete on orgs for delete using (is_admin());

-- Solo el administrador otorga verificación, sello verde, criterios de confianza y suspensión.
create or replace function protect_org() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := new.data
      || jsonb_build_object('verified', old.data->'verified', 'seal', old.data->'seal', 'trust', old.data->'trust', 'status', old.data->'status');
  end if;
  return new;
end $$;
drop trigger if exists protect_org on orgs;
create trigger protect_org before update on orgs for each row execute function protect_org();

-- Desarrollos
create policy developments_read on developments for select using (org_active(org_id) or owns_org(org_id));
create policy developments_write on developments for all using (owns_org(org_id)) with check (owns_org(org_id));

-- Inmuebles: el público ve lo publicado o vendido; la desarrolladora dueña y el administrador ven y editan todo lo suyo.
create policy listings_read on listings for select using (
  (status in ('publicado', 'vendido') and org_active(org_id)) or owns_org(org_id)
);
create policy listings_write on listings for all using (owns_org(org_id)) with check (owns_org(org_id));

-- Prospectos: se crean solo con create_lead(); los ve el administrador, la desarrolladora dueña y el asesor interno asignado.
create policy leads_read on leads for select using (
  is_admin() or (me_role() = 'desarrolladora' and org_id = me_org())
  or (me_role() = 'asesor' and me_tipo() = 'interno' and asesor_id = auth.uid()::text)
);
create policy leads_update on leads for update using (
  is_admin() or (me_role() = 'desarrolladora' and org_id = me_org())
  or (me_role() = 'asesor' and me_tipo() = 'interno' and asesor_id = auth.uid()::text)
);
create policy leads_delete on leads for delete using (is_admin());

-- Solo el administrador reasigna prospectos.
create or replace function protect_lead() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := jsonb_set(new.data, '{asesorId}', coalesce(old.data->'asesorId', 'null'::jsonb));
    new.data := jsonb_set(new.data, '{orgId}', coalesce(old.data->'orgId', 'null'::jsonb));
  end if;
  return new;
end $$;
drop trigger if exists protect_lead on leads;
create trigger protect_lead before update on leads for each row execute function protect_lead();

-- Bitácora
create policy activity_read on activity for select using (is_admin() or (me_role() = 'desarrolladora' and org_id = me_org()));
create policy activity_insert on activity for insert with check (auth.uid() is not null and user_id = auth.uid()::text);
create policy activity_delete on activity for delete using (is_admin());

-- Solicitudes de desarrolladoras: cualquiera envía, solo el administrador lee.
create policy requests_insert on requests for insert with check (true);
create policy requests_admin on requests for select using (is_admin());
create policy requests_delete on requests for delete using (is_admin());

-- Solicitudes de asesores: se envían con submit_application(); solo el administrador las ve y resuelve.
create policy applications_admin on applications for select using (is_admin());
create policy applications_update on applications for update using (is_admin());
create policy applications_delete on applications for delete using (is_admin());

-- Tasas bancarias: públicas; las edita el administrador.
create policy banks_read on banks for select using (true);
create policy banks_write on banks for all using (is_admin()) with check (is_admin());

-- Noticias y publicaciones
create policy articles_read on articles for select using (published or is_admin() or owns_org(org_id));
create policy articles_write on articles for all using (is_admin() or (org_id is not null and owns_org(org_id)))
  with check (is_admin() or (org_id is not null and owns_org(org_id)));

-- Material descargable: lo ven asesores aprobados, la desarrolladora dueña y el administrador.
create policy materials_read on materials for select using (me_role() = 'asesor' or owns_org(org_id));
create policy materials_write on materials for all using (owns_org(org_id)) with check (owns_org(org_id));

-- Academia: solo asesores y administrador.
create policy courses_read on courses for select using ((published and me_role() = 'asesor') or is_admin() or (org_id is not null and owns_org(org_id)));
create policy courses_write on courses for all using (is_admin()) with check (is_admin());

-- Ajustes
create policy settings_read on settings for select using (true);
create policy settings_write on settings for all using (is_admin()) with check (is_admin());

-- ─── Funciones públicas ──────────────────────────────────────────────────
-- Prospecto desde el sitio: valida, lo asigna por turnos al siguiente asesor interno activo y lo guarda.
create or replace function create_lead(payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pool text[];
  turn int;
  pick text;
  lead jsonb;
  new_id text := 'ld-' || substr(md5(random()::text), 1, 9);
begin
  if length(coalesce(payload->>'name', '')) < 2 or length(regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g')) < 10 then
    raise exception 'Datos incompletos';
  end if;
  select array_agg(id order by data->>'createdAt') into pool from profiles where role = 'asesor' and asesor_tipo = 'interno' and active;
  insert into settings (id, data) values ('rr', '0'::jsonb) on conflict (id) do nothing;
  select (data #>> '{}')::int into turn from settings where id = 'rr' for update;
  if pool is not null and array_length(pool, 1) > 0 then
    pick := pool[(turn % array_length(pool, 1)) + 1];
    update settings set data = to_jsonb(turn + 1) where id = 'rr';
  end if;
  lead := jsonb_build_object(
    'id', new_id,
    'orgId', payload->'orgId',
    'asesorId', to_jsonb(pick),
    'listingId', payload->'listingId',
    'developmentId', payload->'developmentId',
    'name', left(payload->>'name', 120),
    'phone', left(payload->>'phone', 40),
    'email', left(coalesce(payload->>'email', ''), 160),
    'credit', payload->'credit',
    'bankId', payload->'bankId',
    'message', left(coalesce(payload->>'message', ''), 2000),
    'source', coalesce(payload->>'source', 'ficha'),
    'status', 'nuevo',
    'notes', '[]'::jsonb,
    'transcript', coalesce(payload->'transcript', 'null'::jsonb),
    'createdAt', to_jsonb(now())
  );
  insert into leads (id, data) values (new_id, jsonb_strip_nulls(lead));
  return jsonb_build_object('id', new_id);
end $$;
grant execute on function create_lead(jsonb) to anon, authenticated;

-- Solicitud de asesor: evita duplicados por correo.
create or replace function submit_application(payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  em text := lower(trim(payload->>'email'));
  new_id text := 'ap-' || substr(md5(random()::text), 1, 9);
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or length(coalesce(payload->>'name', '')) < 5 then
    return jsonb_build_object('ok', false, 'error', 'Revisa tu nombre y correo.');
  end if;
  if exists (select 1 from auth.users where lower(email) = em) then
    return jsonb_build_object('ok', false, 'error', 'Ese correo ya tiene acceso. Entra desde Acceso.');
  end if;
  if exists (select 1 from applications where email = em and status = 'pendiente') then
    return jsonb_build_object('ok', false, 'error', 'Ya hay una solicitud pendiente con ese correo.');
  end if;
  insert into applications (id, data) values (new_id, jsonb_build_object(
    'id', new_id, 'name', left(payload->>'name', 120), 'email', em, 'phone', left(payload->>'phone', 40),
    'company', left(coalesce(payload->>'company', ''), 120), 'experience', left(coalesce(payload->>'experience', ''), 60),
    'zone', left(coalesce(payload->>'zone', ''), 200), 'message', left(coalesce(payload->>'message', ''), 1500),
    'status', 'pendiente', 'createdAt', to_jsonb(now())
  ));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function submit_application(jsonb) to anon, authenticated;

-- Vista de una ficha publicada.
create or replace function add_view(listing text) returns void language sql security definer set search_path = public as $$
  update listings set data = jsonb_set(data, '{views}', to_jsonb(coalesce((data->>'views')::int, 0) + 1))
  where id = listing and status = 'publicado';
$$;
grant execute on function add_view(text) to anon, authenticated;

-- ─── Archivos ────────────────────────────────────────────────────────────
-- Bucket público "material": fotos de desarrollos, noticias y material para asesores.
-- Las URLs son públicas (como cualquier imagen del sitio); subir y borrar solo lo hacen desarrolladoras y administrador.
insert into storage.buckets (id, name, public) values ('material', 'material', true) on conflict (id) do nothing;
drop policy if exists material_upload on storage.objects;
drop policy if exists material_delete on storage.objects;
create policy material_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'material' and me_role() in ('superadmin', 'desarrolladora'));
create policy material_delete on storage.objects for delete to authenticated
  using (bucket_id = 'material' and me_role() in ('superadmin', 'desarrolladora'));
