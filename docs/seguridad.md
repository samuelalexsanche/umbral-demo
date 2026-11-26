# Seguridad de Umbral

Revisión del 25-nov-2026, antes de pasar a producción. La regla de fondo: **el navegador valida para ayudar al usuario; la base de datos valida para defenderse.** Todo lo que importa está en las dos capas.

## Inyección de código (XSS)

| Riesgo | Defensa |
|---|---|
| HTML o `<script>` escrito en un campo | React escapa todo el texto. No hay `dangerouslySetInnerHTML` salvo el JSON-LD, que escapa `<`. |
| Enlaces `javascript:`, `data:text/html` en imágenes, logos, material, fuentes de noticias, sitio web, academia | `safeUrl()` (`src/lib/sanitize.ts`) al **pintar**: `asset()` y los botones externos la usan, así que un enlace malo se queda sin `href`/`src`. `cleanUrl()` al **guardar**. En la base, `check_doc()` rechaza cualquier documento con una URL que no sea `https://`, `http://`, ruta del sitio o imagen `data:` en base64. |
| Archivos HTML/SVG subidos al bucket (página maliciosa con nuestra URL) | El bucket `material` solo acepta imágenes, PDF, video y documentos de Office, hasta 50 MB. Lo revisa el navegador y lo exige Supabase Storage. |
| Caracteres invisibles o bidi para disfrazar texto (`U+202E`…) | `cleanText()` los quita antes de guardar. |
| Scripts de otros dominios | CSP en `<meta>` de cada página (`src/lib/csp.ts`): solo scripts propios, conexiones solo a Supabase, Coinbase, er-api y el Worker; sin `<object>`, sin `<base>` ajeno, formularios solo al propio sitio. |
| Clickjacking | `X-Frame-Options: DENY` y `frame-ancestors 'none'` en `public/_headers` (funciona en Cloudflare Pages o Netlify; GitHub Pages no manda cabeceras). |

`'unsafe-inline'` en scripts es obligatorio con la exportación estática de Next. Se compensa con lo de arriba: no hay forma de meter HTML en la página.

## Inyección SQL

No hay SQL armado con texto. El navegador usa el cliente de Supabase (consultas parametrizadas por PostgREST), y las funciones (`create_lead`, `submit_application`, `submit_request`, `org_team`) son plpgsql con parámetros, sin `execute` dinámico con datos del usuario.

## Inyección de instrucciones en el agente de IA

- El *prompt* marca los datos de la desarrolladora entre `<datos>…</datos>` y le ordena tratarlos como información, nunca como instrucciones.
- Se quitan del texto los delimitadores y la etiqueta `[ASESOR]` para que nadie los falsifique.
- **Con Supabase conectado al Worker** (variables `SUPABASE_URL` y `SUPABASE_ANON_KEY`), el Worker lee él mismo los datos públicos de la desarrolladora y **ignora** lo que manda el navegador. Así nadie puede usarlo como chat gratis con otro *prompt*.
- Freno de 20 preguntas por minuto por IP y tope de 60 KB por solicitud. Ya no devuelve detalles internos de error.

## Permisos (RLS) y campos protegidos

Además de lo que ya estaba (nadie cambia su rol, ni se da el sello, ni se reasigna prospectos):

- **Perfil:** nadie cambia su correo, ni la fecha y el autor de su alta.
- **Inmuebles:** las vistas, el autor y las fechas los pone el sistema; el estado solo puede ser publicado, borrador, pausado o vendido.
- **Prospectos:** quien los atiende solo cambia la etapa y agrega notas. Nombre, teléfono y asignación quedan fijos.
- **Desarrolladoras y desarrollos:** el dueño no cambia el slug ni la fecha de alta; el avance de obra va de 0 a 100.
- **Bitácora:** cada quien escribe solo a su nombre y en su propia desarrolladora.
- **Archivos:** cada desarrolladora sube y borra solo en su carpeta (`<orgId>/…`).
- **Documentos:** id con caracteres seguros, igual al de la fila, y máximo 512 KB.

## Formularios públicos

| Formulario | Validación | Freno |
|---|---|---|
| Contacto e intención de crédito (`create_lead`) | Nombre, teléfono de 10 a 15 dígitos, correo opcional válido, desarrolladora activa, crédito y origen de una lista; la conversación del agente se recorta a 40 mensajes de 2,000 caracteres. | 3 por teléfono cada 10 min; 60 por minuto en todo el sitio. |
| Solicitud de asesor (`submit_application`) | Nombre, correo y teléfono; un asesor no se puede colar al equipo de una desarrolladora. | 30 cada 10 min. Duplicados por correo. |
| Publica tus desarrollos (`submit_request`) | Empresa, contacto, teléfono y correo. Antes era un `insert` abierto: ya no. | 3 por correo por hora; 30 cada 10 min. |

Los formularios de solicitud tienen un campo trampa invisible: si un bot lo llena, la pantalla dice "recibido" y no se guarda nada.

## Sesión y contraseñas

- Contraseñas de 10 caracteres como mínimo, con letras y números (la misma regla en el panel y en Supabase Auth). Las temporales se generan con azar criptográfico.
- Tras 5 intentos fallidos el panel espera 1 minuto. El freno real es el límite por IP de Supabase Auth.
- Registro abierto desactivado: las cuentas solo las crea el administrador desde la Edge Function, que valida rol, correo, nombre y desarrolladora, y no devuelve errores internos.
- Los botones de "entrar como rol de prueba" solo existen en modo local. Con Supabase desaparecen.
- La llave de servicio vive solo en la Edge Function. El navegador solo tiene la llave pública (`anon`), que no da permisos por sí misma.

## Cómo comprobarlo

```bash
SUPABASE_URL=... ANON=... SERVICE=... node scripts/probar-permisos.mjs
```

51 pruebas: lo de cada rol más los ataques de arriba (URLs maliciosas, documentos gigantes, ids raros, falsificar vistas, cambiar correo, colarse a un equipo, spam de prospectos, subir HTML o SVG, subir a la carpeta de otra desarrolladora). En el Supabase local pasaron 51 de 51 el 25-nov-2026.

## Lo que falta y no depende del código

Ver `docs/pendientes.md`.
