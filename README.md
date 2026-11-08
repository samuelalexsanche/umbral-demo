# Umbral

Plataforma privada de vivienda nueva en el área metropolitana de Guadalajara. Publican solo desarrolladoras aprobadas y atienden asesores aprobados por el administrador.

- **Público:** catálogo, fichas, perfiles de desarrolladoras (historia, avances, lanzamientos, calificación de confianza y sello verde), noticias con tipo de cambio, tasas bancarias, simulador y "Tramita con nosotros".
- **Desarrolladora:** perfil, desarrollos, inventario, precios, condiciones de pago, material para asesores y publicaciones.
- **Asesor (interno o externo):** portal con inventario en tiempo real, cotización en PDF con sus datos, descargas y academia. Los internos reciben prospectos por turnos.
- **Administrador general:** todo, más aprobación de asesores, tasas, noticias y academia.

Detalle del modelo: `docs/produccion.md`. Conexión a Supabase: `docs/supabase.md`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000/umbral-demo/
npm run build      # genera out/
```

Sin `.env.local` corre en modo local (datos en el navegador, cuentas de prueba con contraseña `demo1234`). Con las variables de Supabase usa la base real.

## Stack

Next.js 16 (export estático), TypeScript, Tailwind v4, Supabase (Postgres + Auth + Storage + Edge Function), Leaflet, Motion, Phosphor. Agente de IA en Cloudflare Worker (`worker/`).
