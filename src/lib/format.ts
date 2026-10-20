import type { CreditId, Delivery, Listing, PropertyType } from "./types";
import { CREDITS } from "./seed";

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE = "https://samuelalexsanche.github.io" + BASE;

/** Ruta de un archivo en /public respetando el basePath de GitHub Pages. Deja pasar data: y http(s). */
export const asset = (p: string) => (p.startsWith("/") ? BASE + p : p);

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
export const money = (n: number) => mxn.format(n);
export const moneyShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} M` : `$${Math.round(n / 1000)} mil`;

export const creditName = (id: CreditId) => CREDITS.find((c) => c.id === id)?.name ?? id;

export const TYPE_LABEL: Record<PropertyType, string> = { casa: "Casa", departamento: "Departamento", townhouse: "Townhouse", terreno: "Terreno" };

export const deliveryLabel = (d: Delivery, date?: string) =>
  d === "preventa" ? `Preventa${date ? `, entrega ${monthYear(date)}` : ""}` : "Entrega inmediata";

export function monthYear(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export const baths = (n: number) => (Number.isInteger(n) ? `${n}` : `${Math.floor(n)} ½`);

export function specLine(l: Pick<Listing, "bedrooms" | "bathrooms" | "parking" | "m2Built">) {
  return `${l.bedrooms} rec · ${baths(l.bathrooms)} baños · ${l.m2Built} m²`;
}

/** Mensualidad estimada de una hipoteca a tasa fija. */
export function monthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function waLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
