# Conectar Umbral a Supabase

Pasos para Alex. Los que dicen "tú" requieren tu cuenta de Supabase: Claude no inicia sesión ni teclea llaves.

## 1. Crear el proyecto (tú)

1. En supabase.com crea un proyecto nuevo, región **East US** o la más cercana disponible. Plan Free mientras está en desarrollo.
2. Guarda la contraseña de la base en tu gestor de contraseñas.
3. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**. La plataforma es privada: las cuentas solo se crean desde el panel.
4. En **Authentication → URL Configuration**, pon el dominio del sitio en *Site URL* y agrega `https://TU-DOMINIO/panel/cuenta/` en *Redirect URLs* (para recuperar contraseña).
5. En **Authentication → Providers → Email**: *Minimum password length* = **10**, *Password requirements* = **Letters and digits**, y activa **Secure password change**. Es la misma regla que pide el panel.
6. En **Authentication → Rate Limits** deja los límites por defecto (o más bajos). Son el freno real contra quien intente adivinar contraseñas.

## 2. Esquema y seguridad (tú, en la terminal)

Desde `umbral-demo/`:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref TU_PROJECT_REF
```

```bash
npx supabase db push
```

Eso aplica las tres migraciones de `supabase/migrations/`:

- `20261108000000_umbral.sql`: tablas, políticas RLS por rol, triggers que protegen roles y sello verde, `create_lead`, `submit_application`, `add_view` y el bucket `material`.
- `20261109000000_equipos.sql`: equipos de las desarrolladoras y `org_team()`.
- `20261125000000_seguridad.sql`: validación de documentos (URLs seguras, tamaño, ids), campos protegidos, formularios públicos con freno anti-spam (`submit_request` incluida) y tipos y carpetas de archivos. Detalle en `docs/seguridad.md`.

Después comprueba los permisos con la prueba automática (usa usuarios temporales `t-*@umbral.test` y los borra al final; córrela contra un proyecto de pruebas o antes de cargar datos reales). Necesita Node 22:

```bash
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co ANON=TU_ANON_KEY SERVICE=TU_SERVICE_ROLE_KEY node scripts/probar-permisos.mjs
```

Debe terminar en "51 de 51 pruebas pasaron".

## 3. Función de usuarios (tú, en la terminal)

```bash
npx supabase functions deploy admin-users
```

Limita qué sitio la puede llamar desde el navegador (sin esto solo acepta localhost). Si hay varios dominios, sepáralos con comas:

```bash
npx supabase secrets set ALLOWED_ORIGIN=https://TU-DOMINIO,https://www.TU-DOMINIO
```

## 4. Primer administrador (tú)

1. **Authentication → Users → Add user → Create new user**, con tu correo y una contraseña. Marca *Auto Confirm User*.
2. Copia el **UID** del usuario y corre en **SQL Editor** (cambia los tres valores):

```sql
insert into profiles (id, data) values (
  'UID-DEL-USUARIO',
  jsonb_build_object('id', 'UID-DEL-USUARIO', 'name', 'Tu nombre', 'email', 'tu@correo.com',
    'role', 'superadmin', 'phone', '', 'title', 'Administración', 'active', true,
    'createdAt', now(), 'mustChangePassword', false)
);
```

## 5. Variables del sitio (tú)

Copia `.env.example` a `.env.local` y llena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API). Para el hosting, configura las mismas variables en GitHub (Settings → Secrets and variables → Actions → Variables) o en Cloudflare Pages.

## 6. Datos iniciales

Entra al panel con tu cuenta de administrador. En Resumen aparece **Cargar datos iniciales**: sube Grupo Casillas con sus 5 proyectos, tasas, noticias, material y academia. Después da de alta el usuario de Grupo Casillas desde **Desarrolladoras** o **Usuarios**.

## Cómo funciona

- El sitio sigue siendo estático. El navegador habla directo con Supabase usando la llave pública; lo que cada quien puede leer o escribir lo deciden las políticas RLS en la base, no el código del navegador.
- `src/lib/db.ts` es la única capa de datos. Sin variables de Supabase corre en modo local (localStorage) para desarrollar.
- Crear cuentas necesita la llave de servicio, que vive solo en la Edge Function `admin-users` y verifica que quien llama sea administrador.
- Los prospectos se crean con `create_lead()`, que los asigna por turnos al siguiente asesor interno activo.

## Probar todo en local

Con Docker abierto:

```bash
npx supabase start -x studio,imgproxy,vector,logflare,realtime,supavisor
```

```bash
npx supabase functions serve admin-users --no-verify-jwt
```

`npx supabase status` muestra la URL y la llave pública locales para `.env.local`.
