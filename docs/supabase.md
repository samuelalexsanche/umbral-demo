# Conectar Umbral a Supabase

Pasos para Alex. Los que dicen "tú" requieren tu cuenta de Supabase: Claude no inicia sesión ni teclea llaves.

## 1. Crear el proyecto (tú)

1. En supabase.com crea un proyecto nuevo, región **East US** o la más cercana disponible. Plan Free mientras está en desarrollo.
2. Guarda la contraseña de la base en tu gestor de contraseñas.
3. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**. La plataforma es privada: las cuentas solo se crean desde el panel.
4. En **Authentication → URL Configuration**, pon el dominio del sitio en *Site URL* y agrega `https://TU-DOMINIO/panel/cuenta/` en *Redirect URLs* (para recuperar contraseña).

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

Eso aplica `supabase/migrations/20261108000000_umbral.sql`: tablas, políticas RLS por rol, triggers que protegen roles y sello verde, las funciones `create_lead`, `submit_application` y `add_view`, y el bucket `material`.

## 3. Función de usuarios (tú, en la terminal)

```bash
npx supabase functions deploy admin-users
```

Opcional: limita quién la puede llamar desde el navegador.

```bash
npx supabase secrets set ALLOWED_ORIGIN=https://TU-DOMINIO
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
