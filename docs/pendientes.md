# Pendientes para salir a producción

Actualizado el 25-nov-2026. Lo que se puede hacer sin decisiones de Alex o del cliente ya está hecho (ver `docs/seguridad.md`). Esto es lo que falta, ordenado por quién lo resuelve.

## Alex (cuentas y llaves: Claude no inicia sesión ni teclea llaves)

1. **Crear el proyecto de Supabase de producción** y seguir `docs/supabase.md`: desactivar registro, reglas de contraseña (10 caracteres, letras y números), `db push` de las 3 migraciones, `functions deploy admin-users`, `ALLOWED_ORIGIN` con el dominio y el primer administrador.
2. **Correr la prueba de permisos** contra ese proyecto antes de cargar datos reales. Debe dar 51 de 51.
3. **Variables del sitio en GitHub** (Settings → Secrets and variables → Actions → *Variables*): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL`. El workflow ya las lee; en cuanto existan, el sitio usa la base real y desaparecen los botones de prueba.
4. **Worker del agente** (ya desplegado con la versión endurecida). Para que lea los datos de Supabase y no los del navegador, agrégale dos variables en Cloudflare (Workers → umbral-agente → Settings → Variables): `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Cuando haya dominio, también `ALLOWED_ORIGINS` (por ejemplo `https://umbral.mx,https://www.umbral.mx`).
5. **Recomendado:** una regla de *Rate Limiting* de Cloudflare sobre `umbral-agente.mattera.workers.dev/chat` (por ejemplo, 30 por minuto por IP). El freno actual vive en la memoria del Worker y se reinicia.
6. **Recomendado:** activar MFA (TOTP) para las cuentas de administrador en Supabase Auth.

## César / Umbral (decisiones del cliente)

1. **Dominio** del sitio. De ahí salen `ALLOWED_ORIGIN`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_SITE_URL`, `BASE_PATH` vacío y el `robots` (hoy el sitio está en `noindex` a propósito).
2. **Hosting de producción.** Recomendado: Cloudflare Pages, porque respeta `public/_headers` (HSTS, anti-clickjacking, Permissions-Policy). GitHub Pages no manda cabeceras de seguridad.
3. **Quién edita inventario:** hoy pueden el administrador y la desarrolladora dueña; los asesores nunca. Confirmar.
4. **Crédito directo:** en qué proyectos de Grupo Casillas aplica. No se marcó ninguno para no inventar.
5. **Datos de Grupo Casillas** pendientes (lista completa en `docs/produccion.md`): precios vigentes, inventario real, direcciones, fechas de entrega, contacto, logo en vector, brochures, historia, criterios del Sello verde y tasas bancarias reales.
6. **Aviso de privacidad** (LFPDPPP): los formularios guardan nombre, teléfono y correo. Hace falta el texto del aviso y quién es el responsable de los datos; la liga se agrega al pie y junto a cada formulario.
7. **Fotos propias de las ciudades**, si las tienen, para quitar las de Wikimedia y su crédito.
8. **Los 4 desarrollos extra** (Punta Norte, Altos del Parque, Altos Las Praderas, Punta Foresta) y la sincronización del inventario (hoy es una foto del 9-nov).

## Sabido y aceptado

- En Supabase local, Kong responde CORS `*` para las funciones; en Supabase en la nube manda el que pone la función (`ALLOWED_ORIGIN`). Como la función exige la sesión del administrador en el encabezado `Authorization`, CORS no es la defensa principal.
- `'unsafe-inline'` en la CSP de scripts es obligatorio con la exportación estática de Next.
- La desarrolladora ve nombre, correo y teléfono de los asesores (para saber quién atiende sus prospectos). Si el cliente quiere restringirlo, se cambia la política `profiles_read`.
