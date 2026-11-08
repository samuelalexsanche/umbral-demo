# Umbral: paso de demo a sistema en producción

Proyecto aprobado el 8-nov-2026. Este documento resume el modelo nuevo y el orden de trabajo. La lista de lo que no venía en la cotización está en `umbral-demo-assets/cotizacion-adicional/alcance-adicional.md`.

## Cambios del cliente (notas del 8-nov)

- Ya no hay inmobiliarias. Solo **desarrolladoras** y **asesores**.
- Plataforma privada: el público solo tiene vista de comprador. Nadie se da de alta solo.
- Los asesores **solicitan** acceso y un administrador los aprueba.
- Créditos: se quitan Infonavit, Fovissste, Cofinavit y Unamos. Quedan **bancario** y **contado**, más tasas por banco, simulador y "Tramita con nosotros".
- Primera desarrolladora: **Grupo Casillas** (Alcalde Mil, Argentina 824, Cedros 1180, Punta Patria, Ávila & León).

## Roles

| Rol | Qué hace |
|---|---|
| Comprador (sin cuenta) | Ve catálogo, fichas, desarrolladoras, noticias, tasas y simulador. Contacta o pide trámite de crédito. |
| Administrador general | Todo. Da de alta desarrolladoras, aprueba asesores, publica noticias, academia y tasas. |
| Desarrolladora | Su perfil (historia, noticias, avances, lanzamientos), sus desarrollos e inventario (precios, disponibilidad, condiciones de pago, créditos) y su material descargable. Ve los prospectos de sus desarrollos. |
| Asesor interno | Portal de asesores + recibe los prospectos que la plataforma le asigna (tablero). |
| Asesor externo | Portal de asesores: inventario en tiempo real, cotización personalizada, descargas, academia y perfil. |

Ningún asesor da de alta ni modifica inventario, desarrollos ni información.

Las notas dicen a la vez "solo el administrador modifica inventario" y "los desarrolladores podrán actualizar inventario, precios, condiciones de pago, créditos". Se resolvió así: pueden el administrador y la desarrolladora dueña; los asesores nunca. **Confirmar con el cliente.**

## Backend

Supabase (Postgres + Auth + Storage) con Row Level Security por rol. El sitio sigue siendo estático: el navegador habla directo con Supabase y la seguridad la ponen las políticas RLS, no el código del navegador.

- `src/lib/db.ts` conserva la misma interfaz para las pantallas. Si existen `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` usa Supabase; si no, usa el modo local (localStorage) para desarrollo.
- Esquema y políticas: `supabase/schema.sql`.
- Hosting mientras está en desarrollo: gratuito (GitHub Pages en esta rama o Cloudflare Pages). Producción se decide después.

## Orden de trabajo

1. Modelo nuevo (roles, créditos, sin inmobiliarias) y datos de Grupo Casillas. Modo local.
2. Registro y aprobación de asesores. Portal de asesores (inventario, cotización PDF, descargas, academia, perfil).
3. Tasas bancarias, simulador y "Tramita con nosotros". Noticias con tipo de cambio.
4. Perfil de desarrolladora con historia, noticias, avances, lanzamientos y sello de confianza.
5. Supabase: esquema, RLS, autenticación real, archivos en Storage; conectar `db.ts`.
6. Agente de IA por desarrolladora (Worker actual, con CORS del dominio nuevo).

## Datos de Grupo Casillas pendientes de confirmar

Lo cargado viene de sus artes de redes sociales (carpeta de Drive). Falta confirmar con el panel o con la desarrolladora:

- Precios "desde" vigentes por proyecto y por tipología (los artes cambian de mes a mes).
- Inventario real: unidades, m², recámaras, baños, cajones, disponibilidad.
- Direcciones exactas y coordenadas.
- Fechas de entrega de las preventas y avance de obra actual.
- Teléfono, correo, horario y oficina de ventas de Grupo Casillas.
- Logo en vector y renders limpios, sin textos encima.
- Brochures en PDF.
- Historia de la empresa. Los artes dicen "23 años" y "34 proyectos realizados".
- Criterios del Sello verde: qué tiene que cumplir una desarrolladora para obtenerlo.
- Tasas bancarias reales y bancos con los que trabajan. Las cargadas son de referencia.
