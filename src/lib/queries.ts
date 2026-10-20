import type { DB, Listing } from "./types";
import { SEED } from "./seed";

const seededListing = new Set(SEED.listings.map((l) => l.id));
const seededOrg = new Set(SEED.orgs.map((o) => o.id));
const seededDev = new Set(SEED.developments.map((d) => d.id));

export const isSeededListing = (id: string) => seededListing.has(id);
export const orgHref = (o: { id: string; slug: string }) => (seededOrg.has(o.id) ? `/inmobiliaria/${o.slug}/` : `/inmobiliaria/ver/?id=${o.id}`);
export const devHref = (d: { id: string; slug: string }) => (seededDev.has(d.id) ? `/desarrollo/${d.slug}/` : `/desarrollo/ver/?id=${d.id}`);
export const listingHref = (l: { id: string; slug: string }) => (seededListing.has(l.id) ? `/inmueble/${l.slug}/` : `/inmueble/ver/?id=${l.id}`);

export function published(db: DB): Listing[] {
  const activeOrgs = new Set(db.orgs.filter((o) => o.status === "activa").map((o) => o.id));
  return db.listings.filter((l) => (l.status === "publicado" || l.status === "vendido") && activeOrgs.has(l.orgId));
}

export const available = (db: DB) => published(db).filter((l) => l.status === "publicado");

export const orgOf = (db: DB, id: string) => db.orgs.find((o) => o.id === id);
export const devOf = (db: DB, id?: string) => (id ? db.developments.find((d) => d.id === id) : undefined);
export const userOf = (db: DB, id?: string) => (id ? db.users.find((u) => u.id === id) : undefined);

export const MUNICIPIOS = ["Guadalajara", "Zapopan", "San Pedro Tlaquepaque", "Tlajomulco de Zúñiga", "Tonalá", "El Salto"];
