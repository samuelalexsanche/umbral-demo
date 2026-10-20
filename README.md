# Umbral · demo

Escaparate de vivienda nueva para desarrolladoras e inmobiliarias de la zona metropolitana de Guadalajara, con panel por roles y un agente de IA por inmobiliaria.

**Demo en vivo:** https://samuelalexsanche.github.io/umbral-demo/

> Versión de demostración: empresas, personas, teléfonos y precios son ficticios. Los datos que se crean en el panel se guardan en el navegador (localStorage); el botón "Restablecer" de la barra superior regresa todo al estado inicial.

## Cuentas de prueba

Todas usan la contraseña `demo1234` (también hay botones de acceso rápido en `/acceso/`).

| Rol | Correo |
|---|---|
| Administrador general | admin@umbral.example |
| Administrador de inmobiliaria (Arcada) | rodrigo@arcada.example |
| Asesora (Arcada) | mariana@arcada.example |
| Colaboradora (Arcada) | fernanda@arcada.example |
| Admin / asesores de Nativa, Cantera y Mezquite | lucia@nativa.example, oscar@nativa.example, ernesto@cantera.example, paola@cantera.example, claudia@mezquite.example, hector@mezquite.example |

## Stack

- Next.js 16 (App Router) con exportación estática para GitHub Pages, TypeScript, Tailwind CSS v4.
- Motion para microinteracciones, Leaflet para mapas (base Esri Light Gray), Phosphor para íconos, Sonner para avisos.
- Agente de IA: Cloudflare Worker (`worker/`) con Workers AI (Llama 3.3 70B). Recibe la base de conocimiento y el inventario de una sola inmobiliaria y responde solo con eso.
- Imágenes generadas con Kie AI (nano-banana-pro).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000/umbral-demo/
npm run build      # genera out/
```

Agente de IA: `cd worker && npx wrangler deploy`.

## Estructura

- `src/lib/seed.ts` datos de demostración · `src/lib/db.ts` capa de datos, sesión y permisos (la única pieza que cambia al conectar un backend real) · `src/lib/agent.ts` cliente del agente.
- `src/app/(sitio)/` páginas públicas · `src/app/panel/` panel por roles.
