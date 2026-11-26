// Política de seguridad de contenido (CSP): de dónde puede cargar cosas la página.
// Bloquea scripts de otros dominios, plugins, <base> inyectado y envíos de formularios a terceros,
// y limita las conexiones a los servicios que usa el sitio.
// 'unsafe-inline' en scripts es obligatorio con exportación estática de Next (los datos de la página van en <script> en línea);
// el riesgo se compensa porque React escapa todo el texto y las URLs pasan por safeUrl().
const supa = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supaWs = supa.replace(/^http/, "ws");

export const CONNECT = [
  "'self'",
  "https://api.coinbase.com",
  "https://open.er-api.com",
  "https://umbral-agente.mattera.workers.dev",
  supa,
  supaWs,
].filter(Boolean);

export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${CONNECT.join(" ")}`,
  "media-src 'self' https: blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");
