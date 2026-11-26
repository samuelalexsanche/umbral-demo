// Validación y limpieza de todo lo que escriben los usuarios antes de guardarlo o pintarlo.
// React ya escapa el texto (no hay inyección de HTML), pero NO bloquea enlaces "javascript:",
// así que toda URL que venga de datos pasa por safeUrl() al pintarse y por cleanUrl() al guardarse.
// Estas reglas se repiten en la base de datos (supabase/migrations/*_seguridad.sql): el navegador
// se puede saltar, la base no.

/** Caracteres de control (menos salto de línea y tabulador) y marcas bidi que sirven para disfrazar texto. */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;

/** Texto limpio: sin caracteres de control, normalizado, recortado y con tope de longitud. */
export function cleanText(v: unknown, max = 2000): string {
  if (v === null || v === undefined) return "";
  return String(v).normalize("NFC").replace(CONTROL, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/** Una sola línea (nombres, títulos, teléfonos). */
export const cleanLine = (v: unknown, max = 200) => cleanText(v, max * 2).replace(/\s+/g, " ").slice(0, max);

const SAFE_DATA = /^data:(image\/(png|jpe?g|webp|gif|avif)|application\/(pdf|zip|msword|vnd\.[a-z0-9.+-]+));base64,[a-z0-9+/=\s]+$/i;

/**
 * URL segura para pintar en href/src. Acepta rutas del propio sitio ("/..."), http(s), mailto, tel
 * y data: solo de imágenes o PDF (modo local). Cualquier otra cosa (javascript:, vbscript:, data:text/html…) se vuelve "".
 */
export function safeUrl(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  if (/^\s*data:/i.test(v)) return v.length < 8_000_000 && SAFE_DATA.test(v.trim()) ? v.trim() : "";
  const s = cleanText(v, 4000).replace(/\s/g, (c) => (c === " " ? "%20" : ""));
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    if (u.protocol === "https:" || u.protocol === "http:") return u.href;
    if (u.protocol === "mailto:" || u.protocol === "tel:") return s;
  } catch {
    /* no es URL absoluta */
  }
  return "";
}

/** URL que escribe un usuario en un formulario: solo http(s). Regresa "" si no es válida. */
export function cleanUrl(v: unknown): string {
  if (typeof v === "string" && /^\s*data:/i.test(v)) return safeUrl(v);
  const s = cleanLine(v, 2000);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
    if ((u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".")) return u.href;
  } catch {}
  return "";
}

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
export const isEmail = (v: string) => v.length <= 160 && EMAIL_RE.test(v.trim());
export const cleanEmail = (v: unknown) => cleanLine(v, 160).toLowerCase();
/** Teléfono: solo dígitos, espacios, +, guiones y paréntesis. */
export const cleanPhone = (v: unknown) => cleanLine(v, 40).replace(/[^\d+()\s-]/g, "");
export const isPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 15;
};

/** Número finito dentro de un rango; si no, el valor por defecto. */
export function cleanNumber(v: unknown, min: number, max: number, dflt = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

/** Campos que guardan URLs, por nombre. Se validan en cualquier documento. */
const URL_KEYS = new Set(["url", "thumb", "image", "images", "logo", "logoWide", "photo", "website", "sourceUrl", "brochure", "video", "tour"]);
/** Campos de texto largo. El resto de strings se trata como una línea corta. */
const LONG_KEYS = new Set(["description", "history", "body", "message", "notes", "paymentTerms", "text", "a", "greeting", "excerpt", "content", "reviewNote", "summary", "conditions"]);
/** Campos que no se tocan (identificadores y fechas los pone el sistema). */
const KEEP_KEYS = new Set(["password"]);

/**
 * Limpia en profundidad un documento antes de guardarlo: textos sin caracteres de control y con tope,
 * URLs validadas (las inválidas se quitan), números no finitos a 0, y nada de claves raras como "__proto__".
 */
export function scrub<T>(doc: T, depth = 0): T {
  if (depth > 8) return doc;
  if (Array.isArray(doc)) return doc.slice(0, 500).map((x) => scrub(x, depth + 1)) as T;
  if (!doc || typeof doc !== "object") return doc;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    if (KEEP_KEYS.has(k)) {
      out[k] = v;
    } else if (URL_KEYS.has(k)) {
      if (Array.isArray(v)) out[k] = v.slice(0, 60).map(cleanUrl).filter(Boolean);
      else if (typeof v === "string") out[k] = cleanUrl(v) || undefined;
      else out[k] = v;
    } else if (typeof v === "string") {
      out[k] = LONG_KEYS.has(k) ? cleanText(v, 20000) : cleanText(v, 600);
    } else if (typeof v === "number") {
      out[k] = Number.isFinite(v) ? v : 0;
    } else {
      out[k] = scrub(v, depth + 1);
    }
  }
  return out as T;
}
