-- Umbral: endurecimiento de seguridad antes de producción (25-nov-2026).
-- El navegador valida, pero se puede saltar: estas reglas son las que valen.
--  1. Cada documento: id válido y igual al de la fila, tamaño máximo y URLs seguras (nada de javascript:).
--  2. Campos que solo pone el sistema o el administrador no se pueden cambiar desde el navegador.
--  3. Formularios públicos (prospectos, solicitudes) validados y con freno contra spam.
--  4. Archivos: tipos permitidos, tamaño máximo y cada desarrolladora solo en su carpeta.
-- Idempotente: se puede correr más de una vez.

-- ─── 1. Validación genérica de documentos ────────────────────────────────
create or replace function safe_url(u text) returns boolean language sql immutable set search_path = public as $$
  select u is null or u = ''
    or u ~* '^https?://[^\s<>"''`\\]+$'
    or u ~ '^/[^/\\]'
    or u ~* '^data:image/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$'
$$;

create or replace function doc_urls_ok(d jsonb) returns boolean language sql immutable set search_path = public as $$
  select coalesce(bool_and(jsonb_typeof(v) <> 'string' or safe_url(v #>> '{}')), true)
  from (
    select v from unnest(array['url', 'thumb', 'image', 'logo', 'logoWide', 'photo', 'website', 'sourceUrl', 'brochure', 'video', 'tour']) k,
      lateral jsonb_path_query(d, ('lax $.**.' || k)::jsonpath) v
    union all
    select v from jsonb_path_query(d, 'lax $.**.images[*]') v
  ) s
$$;

create or replace function check_doc() returns trigger language plpgsql set search_path = public as $$
begin
  if new.id !~ '^[A-Za-z0-9_-]{1,80}$' then
    raise exception 'Identificador inválido' using errcode = '22023';
  end if;
  if jsonb_typeof(new.data) <> 'object' then
    raise exception 'Documento inválido' using errcode = '22023';
  end if;
  -- El id del documento siempre es el de la fila.
  new.data := jsonb_set(new.data, '{id}', to_jsonb(new.id));
  if pg_column_size(new.data) > 512 * 1024 then
    raise exception 'Documento demasiado grande' using errcode = '22023';
  end if;
  if not doc_urls_ok(new.data) then
    raise exception 'Hay un enlace no permitido' using errcode = '22023';
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles', 'orgs', 'developments', 'listings', 'leads', 'activity', 'requests', 'applications', 'banks', 'articles', 'materials', 'courses'] loop
    execute format('drop trigger if exists a_check_doc on %I', t);
    -- "a_" para que corra antes que los protect_* (los triggers corren en orden alfabético).
    execute format('create trigger a_check_doc before insert or update on %I for each row execute function check_doc()', t);
  end loop;
end $$;

-- settings: solo valores chicos.
create or replace function check_setting() returns trigger language plpgsql set search_path = public as $$
begin
  if pg_column_size(new.data) > 64 * 1024 then raise exception 'Valor demasiado grande' using errcode = '22023'; end if;
  return new;
end $$;
drop trigger if exists a_check_setting on settings;
create trigger a_check_setting before insert or update on settings for each row execute function check_setting();

-- ─── 2. Campos protegidos ────────────────────────────────────────────────
-- Perfiles: además de rol, tipo, desarrolladora y estado, nadie cambia su correo (lo manda Auth) ni sus fechas de alta.
create or replace function protect_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := jsonb_set(new.data, '{role}', old.data->'role');
    new.data := jsonb_set(new.data, '{active}', coalesce(old.data->'active', 'true'::jsonb));
    new.data := case when old.data ? 'orgId' then jsonb_set(new.data, '{orgId}', old.data->'orgId') else new.data - 'orgId' end;
    new.data := case when old.data ? 'asesorTipo' then jsonb_set(new.data, '{asesorTipo}', old.data->'asesorTipo') else new.data - 'asesorTipo' end;
    new.data := new.data || jsonb_build_object('email', old.data->'email', 'createdAt', old.data->'createdAt', 'createdBy', old.data->'createdBy');
  end if;
  new.data := jsonb_strip_nulls(new.data - 'password');
  return new;
end $$;

-- Desarrolladoras: el dueño tampoco cambia su slug ni su fecha de alta.
create or replace function protect_org() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := new.data || jsonb_build_object(
      'verified', old.data->'verified', 'seal', old.data->'seal', 'trust', old.data->'trust', 'status', old.data->'status',
      'slug', old.data->'slug', 'createdAt', old.data->'createdAt');
  end if;
  return new;
end $$;

-- Inmuebles: vistas, autor y fechas las pone el sistema; el estado solo toma valores válidos.
create or replace function protect_listing() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.data->>'status', '') not in ('publicado', 'borrador', 'pausado', 'vendido') then
    raise exception 'Estado inválido' using errcode = '22023';
  end if;
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'UPDATE' then
      new.data := new.data || jsonb_build_object('views', coalesce(old.data->'views', '0'::jsonb), 'createdBy', old.data->'createdBy', 'createdAt', old.data->'createdAt', 'slug', old.data->'slug');
    else
      new.data := new.data || jsonb_build_object('views', 0, 'createdBy', auth.uid()::text, 'createdAt', to_jsonb(now()));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_listing on listings;
create trigger protect_listing before insert or update on listings for each row execute function protect_listing();

-- Prospectos: quien lo atiende solo cambia la etapa y agrega notas; los datos del cliente y la asignación no se tocan.
create or replace function protect_lead() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.data->>'status', '') not in ('nuevo', 'contactado', 'cita', 'apartado', 'cerrado', 'descartado') then
    raise exception 'Etapa inválida' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(new.data->'notes', '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(new.data->'notes', '[]'::jsonb)) > 300 then
    raise exception 'Notas inválidas' using errcode = '22023';
  end if;
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := old.data || jsonb_build_object('status', new.data->'status', 'notes', coalesce(new.data->'notes', '[]'::jsonb));
  end if;
  return new;
end $$;

-- Desarrollos: el avance de obra es un porcentaje.
create or replace function protect_development() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.data ? 'progress' and (jsonb_typeof(new.data->'progress') <> 'number' or (new.data->>'progress')::numeric not between 0 and 100) then
    raise exception 'Avance de obra inválido' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' and not is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    new.data := new.data || jsonb_build_object('slug', old.data->'slug', 'createdAt', old.data->'createdAt');
  end if;
  return new;
end $$;
drop trigger if exists protect_development on developments;
create trigger protect_development before insert or update on developments for each row execute function protect_development();

-- Bitácora: cada quien escribe solo a su nombre, en su propia desarrolladora y con texto corto.
drop policy if exists activity_insert on activity;
create policy activity_insert on activity for insert with check (
  auth.uid() is not null and user_id = auth.uid()::text
  and (org_id is null or is_admin() or org_id = me_org())
  and length(coalesce(data->>'text', '')) <= 500
);

-- ─── 3. Formularios públicos con validación y freno ──────────────────────
-- Prospecto desde el sitio: tipos y tamaños revisados, la desarrolladora tiene que existir y estar activa,
-- y el mismo teléfono no puede mandar más de 3 en 10 minutos (ni el sitio más de 60 por minuto).
create or replace function create_lead(payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pool text[];
  turn int;
  pick text;
  lead jsonb;
  new_id text := 'ld-' || substr(md5(gen_random_uuid()::text), 1, 12);
  digits text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  em text := lower(trim(coalesce(payload->>'email', '')));
  org text := nullif(payload->>'orgId', '');
  tr jsonb;
begin
  if jsonb_typeof(payload) <> 'object' then raise exception 'Datos incompletos'; end if;
  if length(trim(coalesce(payload->>'name', ''))) < 2 or length(digits) not between 10 and 15 then
    raise exception 'Datos incompletos';
  end if;
  if em <> '' and (em !~ '^[^@\s<>]+@[^@\s<>]+\.[a-z]{2,}$' or length(em) > 160) then raise exception 'Correo inválido'; end if;
  if org is not null and not org_active(org) then raise exception 'Desarrolladora no disponible'; end if;
  if coalesce(payload->>'credit', 'contado') not in ('contado', 'bancario', 'directo') then raise exception 'Crédito inválido'; end if;
  if coalesce(payload->>'source', 'ficha') not in ('ficha', 'agente', 'perfil', 'desarrollo', 'credito') then raise exception 'Origen inválido'; end if;
  if (select count(*) from leads where created_at > now() - interval '10 minutes'
        and regexp_replace(coalesce(data->>'phone', ''), '\D', '', 'g') = digits) >= 3
     or (select count(*) from leads where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Demasiadas solicitudes. Intenta en unos minutos.';
  end if;
  -- Conversación del agente: solo los últimos 40 mensajes, con rol válido y texto recortado.
  if jsonb_typeof(payload->'transcript') = 'array' then
    select jsonb_agg(jsonb_build_object('role', case when m->>'role' = 'assistant' then 'assistant' else 'user' end, 'text', left(coalesce(m->>'text', ''), 2000)) order by i)
      into tr
      from jsonb_array_elements(payload->'transcript') with ordinality as x(m, i)
      where i > jsonb_array_length(payload->'transcript') - 40;
  end if;

  select array_agg(id order by data->>'createdAt') into pool from profiles where role = 'asesor' and asesor_tipo = 'interno' and active;
  insert into settings (id, data) values ('rr', '0'::jsonb) on conflict (id) do nothing;
  select (data #>> '{}')::int into turn from settings where id = 'rr' for update;
  if pool is not null and array_length(pool, 1) > 0 then
    pick := pool[(turn % array_length(pool, 1)) + 1];
    update settings set data = to_jsonb((turn + 1) % 1000000) where id = 'rr';
  end if;
  lead := jsonb_build_object(
    'id', new_id,
    'orgId', org,
    'asesorId', pick,
    'listingId', left(nullif(payload->>'listingId', ''), 80),
    'developmentId', left(nullif(payload->>'developmentId', ''), 80),
    'name', left(trim(payload->>'name'), 120),
    'phone', left(regexp_replace(payload->>'phone', '[^0-9+()\s-]', '', 'g'), 40),
    'email', em,
    'credit', nullif(payload->>'credit', ''),
    'bankId', left(nullif(payload->>'bankId', ''), 80),
    'message', left(coalesce(payload->>'message', ''), 2000),
    'source', coalesce(payload->>'source', 'ficha'),
    'status', 'nuevo',
    'notes', '[]'::jsonb,
    'transcript', tr,
    'createdAt', to_jsonb(now())
  );
  insert into leads (id, data) values (new_id, jsonb_strip_nulls(lead));
  return jsonb_build_object('id', new_id);
end $$;
grant execute on function create_lead(jsonb) to anon, authenticated;

-- Solicitud de asesor independiente: validada, sin colarse a un equipo y con freno por correo y global.
create or replace function submit_application(payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  em text := lower(trim(coalesce(payload->>'email', '')));
  digits text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  new_id text := 'ap-' || substr(md5(gen_random_uuid()::text), 1, 12);
begin
  if jsonb_typeof(payload) <> 'object' or em !~ '^[^@\s<>]+@[^@\s<>]+\.[a-z]{2,}$' or length(em) > 160
     or length(trim(coalesce(payload->>'name', ''))) < 5 or length(digits) not between 10 and 15 then
    return jsonb_build_object('ok', false, 'error', 'Revisa tu nombre, correo y teléfono.');
  end if;
  if (select count(*) from applications where (data->>'createdAt')::timestamptz > now() - interval '10 minutes') >= 30 then
    return jsonb_build_object('ok', false, 'error', 'Hay muchas solicitudes en este momento. Intenta en unos minutos.');
  end if;
  if exists (select 1 from auth.users where lower(email) = em)
     or exists (select 1 from applications where email = em and status = 'pendiente') then
    return jsonb_build_object('ok', false, 'error', 'Ese correo ya tiene una solicitud o un acceso. Si ya tienes cuenta, entra desde Acceso.');
  end if;
  insert into applications (id, data) values (new_id, jsonb_build_object(
    'id', new_id, 'name', left(trim(payload->>'name'), 120), 'email', em, 'phone', left(regexp_replace(payload->>'phone', '[^0-9+()\s-]', '', 'g'), 40),
    'company', left(coalesce(payload->>'company', ''), 120), 'experience', left(coalesce(payload->>'experience', ''), 60),
    'zone', left(coalesce(payload->>'zone', ''), 200), 'message', left(coalesce(payload->>'message', ''), 1500),
    'status', 'pendiente', 'createdAt', to_jsonb(now())
  ));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function submit_application(jsonb) to anon, authenticated;

-- Solicitud de desarrolladora ("Publica tus desarrollos"): antes era un insert abierto; ahora pasa por aquí.
drop policy if exists requests_insert on requests;
create or replace function submit_request(payload jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  em text := lower(trim(coalesce(payload->>'email', '')));
  digits text := regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g');
  new_id text := 'rq-' || substr(md5(gen_random_uuid()::text), 1, 12);
begin
  if jsonb_typeof(payload) <> 'object' or em !~ '^[^@\s<>]+@[^@\s<>]+\.[a-z]{2,}$' or length(em) > 160
     or length(trim(coalesce(payload->>'company', ''))) < 2 or length(trim(coalesce(payload->>'name', ''))) < 2
     or length(digits) not between 10 and 15 then
    raise exception 'Datos incompletos';
  end if;
  if (select count(*) from requests where lower(data->>'email') = em and (data->>'createdAt')::timestamptz > now() - interval '1 hour') >= 3
     or (select count(*) from requests where (data->>'createdAt')::timestamptz > now() - interval '10 minutes') >= 30 then
    raise exception 'Demasiadas solicitudes. Intenta más tarde.';
  end if;
  insert into requests (id, data) values (new_id, jsonb_build_object(
    'id', new_id, 'company', left(trim(payload->>'company'), 120), 'name', left(trim(payload->>'name'), 120),
    'phone', left(regexp_replace(payload->>'phone', '[^0-9+()\s-]', '', 'g'), 40), 'email', em,
    'units', left(coalesce(payload->>'units', ''), 60), 'createdAt', to_jsonb(now())
  ));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function submit_request(jsonb) to anon, authenticated;

-- Las funciones que no son para el público no se exponen a anon.
revoke execute on function check_doc() from public, anon, authenticated;
revoke execute on function doc_urls_ok(jsonb) from public, anon;
revoke execute on function safe_url(text) from public, anon;

-- ─── 4. Archivos ─────────────────────────────────────────────────────────
-- Solo imágenes, PDF, video y documentos de oficina; nada de HTML, SVG ni scripts (evita páginas maliciosas en el bucket).
update storage.buckets set
  file_size_limit = 50 * 1024 * 1024,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/msword', 'application/vnd.ms-excel'
  ]
where id = 'material';

-- Cada desarrolladora sube y borra solo dentro de su carpeta (<orgId>/...). El administrador, en cualquiera.
drop policy if exists material_upload on storage.objects;
drop policy if exists material_delete on storage.objects;
drop policy if exists material_update on storage.objects;
create policy material_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'material' and (is_admin() or (me_role() = 'desarrolladora' and (storage.foldername(name))[1] = me_org()))
);
create policy material_delete on storage.objects for delete to authenticated using (
  bucket_id = 'material' and (is_admin() or (me_role() = 'desarrolladora' and (storage.foldername(name))[1] = me_org()))
);
