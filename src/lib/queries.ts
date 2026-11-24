import type { DB, Listing } from "./types";
import { SEED } from "./seed";

const seededListing = new Set(SEED.listings.map((l) => l.id));
const seededOrg = new Set(SEED.orgs.map((o) => o.id));
const seededDev = new Set(SEED.developments.map((d) => d.id));

export const isSeededListing = (id: string) => seededListing.has(id);
export const orgHref = (o: { id: string; slug: string }) => (seededOrg.has(o.id) ? `/desarrolladora/${o.slug}/` : `/desarrolladora/ver/?id=${o.id}`);
export const devHref = (d: { id: string; slug: string }) => (seededDev.has(d.id) ? `/desarrollo/${d.slug}/` : `/desarrollo/ver/?id=${d.id}`);
export const listingHref = (l: { id: string; slug: string }) => (seededListing.has(l.id) ? `/inmueble/${l.slug}/` : `/inmueble/ver/?id=${l.id}`);

export function published(db: DB): Listing[] {
  const activeOrgs = new Set(db.orgs.filter((o) => o.status === "activa").map((o) => o.id));
  return db.listings.filter((l) => (l.status === "publicado" || l.status === "vendido") && activeOrgs.has(l.orgId) && l.price > 0);
}

export const available = (db: DB) => published(db).filter((l) => l.status === "publicado");

export const orgOf = (db: DB, id?: string) => (id ? db.orgs.find((o) => o.id === id) : undefined);
export const devOf = (db: DB, id?: string) => (id ? db.developments.find((d) => d.id === id) : undefined);
export const userOf = (db: DB, id?: string) => (id ? db.users.find((u) => u.id === id) : undefined);

/** Municipios que una desarrolladora puede elegir al dar de alta un desarrollo o una ficha. */
export const MUNICIPIOS = ["Guadalajara", "Zapopan", "San Pedro Tlaquepaque", "Tlajomulco de Zúñiga", "Tonalá", "El Salto", "Puerto Vallarta", "Nuevo Vallarta", "Punta de Mita"];

/** Plazas que ve el comprador en la búsqueda. Nuevo Vallarta y Punta de Mita (Nayarit) van aparte para no confundir el mercado de Puerto Vallarta. */
export const ZONAS: { group: string; items: string[] }[] = [
  { group: "Jalisco", items: ["Guadalajara", "Zapopan", "Puerto Vallarta"] },
  { group: "Riviera Nayarit", items: ["Nuevo Vallarta", "Punta de Mita"] },
];

/** Unidades disponibles de una ficha: si trae inventario real, se cuentan sus unidades; si no, el dato capturado. */
export const unitsOf = (l: Listing) => (l.units?.length ? l.units.filter((u) => u.status === "disponible").length : l.unitsAvailable ?? 1);

/**
 * Números de una desarrolladora. Los usan la página pública y el panel, para que siempre coincidan:
 * - inmuebles: fichas publicadas con precio (las que se ven en el sitio).
 * - unidades: departamentos disponibles dentro de esas fichas.
 * - desarrollosEnVenta: desarrollos con al menos una ficha publicada.
 */
export function orgStats(db: DB, orgId: string) {
  const listings = available(db).filter((l) => l.orgId === orgId);
  const devIds = new Set(listings.map((l) => l.developmentId).filter(Boolean));
  return {
    listings,
    inmuebles: listings.length,
    unidades: listings.reduce((s, l) => s + unitsOf(l), 0),
    desarrollos: db.developments.filter((d) => d.orgId === orgId).length,
    desarrollosEnVenta: db.developments.filter((d) => d.orgId === orgId && devIds.has(d.id)).length,
  };
}

/** "Estudio, 1, 2 y 3 recámaras" a partir de las tipologías de un proyecto. */
export function bedroomsLabel(listings: Pick<Listing, "title" | "bedrooms">[]) {
  const keys = [...new Set(listings.map((l) => (/^Estudio/i.test(l.title) ? 0 : l.bedrooms)))].sort((a, b) => a - b);
  if (!keys.length) return "";
  const studio = keys[0] === 0;
  const nums = keys.filter((k) => k > 0).map((k) => (k >= 4 ? "4 o más" : String(k)));
  const join = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} y ${a[a.length - 1]}` : a[0]);
  if (!nums.length) return "Estudios";
  const rec = `${join(nums)} ${nums.length === 1 && nums[0] === "1" ? "recámara" : "recámaras"}`;
  return studio ? `Estudios, ${rec}` : rec;
}
