"use client";
// Base de datos de la demo: vive en localStorage del navegador.
// Todas las escrituras pasan por estas funciones para que la versión de producción
// solo tenga que cambiar la implementación (API + base de datos) y no las pantallas.
import { useSyncExternalStore } from "react";
import { SEED, seedDB } from "./seed";
import type { Activity, DB, Lead, Listing, Org, Development, User, Role, PlatformRequest } from "./types";

const KEY = "umbral-db";
const SESSION = "umbral-session";

let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DB) : null;
    cache = parsed && parsed.version === SEED.version ? parsed : seedDB();
  } catch {
    cache = seedDB();
  }
  return cache;
}

function save(next: DB) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* sin espacio o en modo privado: la demo sigue en memoria */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === SESSION) {
      cache = null;
      sessionCache = undefined;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, load, () => SEED);
}

export function getDB(): DB {
  return load();
}

export function resetDemo() {
  save(seedDB());
  setSession(null);
}

function mutate(fn: (db: DB) => void) {
  const next = structuredClone(load());
  fn(next);
  save(next);
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
export const now = () => new Date().toISOString();

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function uniqueSlug(base: string, taken: string[]) {
  let s = slugify(base) || "inmueble";
  let n = 2;
  while (taken.includes(s)) s = `${slugify(base)}-${n++}`;
  return s;
}

/* ─── Sesión ─────────────────────────────────────────────────── */
let sessionCache: string | null | undefined;
function readSession(): string | null {
  if (sessionCache !== undefined) return sessionCache;
  if (typeof window === "undefined") return null;
  try {
    sessionCache = localStorage.getItem(SESSION);
  } catch {
    sessionCache = null;
  }
  return sessionCache;
}
function setSession(id: string | null) {
  sessionCache = id;
  try {
    if (id) localStorage.setItem(SESSION, id);
    else localStorage.removeItem(SESSION);
  } catch {}
  listeners.forEach((l) => l());
}

export function useSessionUser(): User | null {
  const id = useSyncExternalStore(subscribe, readSession, () => null);
  const db = useDB();
  if (!id) return null;
  const u = db.users.find((x) => x.id === id);
  return u && u.active ? u : null;
}

export function login(email: string, password: string): { ok: true; user: User } | { ok: false; error: string } {
  const u = load().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) return { ok: false, error: "El correo o la contraseña no coinciden." };
  if (!u.active) return { ok: false, error: "Esta cuenta está desactivada. Pide a tu administrador que la reactive." };
  const org = u.orgId ? load().orgs.find((o) => o.id === u.orgId) : null;
  if (org && org.status === "suspendida") return { ok: false, error: `${org.name} está suspendida en la plataforma.` };
  setSession(u.id);
  return { ok: true, user: u };
}

export function loginAs(userId: string) {
  setSession(userId);
}

export function logout() {
  setSession(null);
}

/* ─── Permisos ───────────────────────────────────────────────── */
export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Administrador general",
  org_admin: "Administrador de inmobiliaria",
  asesor: "Asesor",
  colaborador: "Colaborador",
};

export const can = {
  manageOrgs: (u: User) => u.role === "superadmin",
  manageCatalogs: (u: User) => u.role === "superadmin",
  editOrgProfile: (u: User, orgId: string) => u.role === "superadmin" || (u.role === "org_admin" && u.orgId === orgId),
  manageDevelopments: (u: User, orgId: string) => u.role === "superadmin" || (u.role === "org_admin" && u.orgId === orgId),
  createUser: (u: User, role: Role) =>
    u.role === "superadmin" ||
    (u.role === "org_admin" && (role === "asesor" || role === "colaborador")) ||
    (u.role === "asesor" && role === "colaborador"),
  publishDirectly: (u: User) => u.role !== "colaborador",
  review: (u: User, l: Listing) =>
    u.role === "superadmin" ||
    (u.role === "org_admin" && u.orgId === l.orgId) ||
    (u.role === "asesor" && l.asesorId === u.id),
  editListing: (u: User, l: Listing) =>
    u.role === "superadmin" ||
    (u.role === "org_admin" && u.orgId === l.orgId) ||
    (u.role === "asesor" && l.orgId === u.orgId && (l.asesorId === u.id || l.createdBy === u.id)) ||
    (u.role === "colaborador" && l.createdBy === u.id && (l.status === "borrador" || l.status === "revision")),
  seeLead: (u: User, l: Lead) =>
    u.role === "superadmin" || (u.role === "org_admin" && u.orgId === l.orgId) || (u.role === "asesor" && l.asesorId === u.id),
  reassignLead: (u: User) => u.role === "superadmin" || u.role === "org_admin",
  manageAgent: (u: User, orgId: string) => u.role === "superadmin" || (u.role === "org_admin" && u.orgId === orgId),
};

export function visibleListings(db: DB, u: User) {
  if (u.role === "superadmin") return db.listings;
  if (u.role === "org_admin") return db.listings.filter((l) => l.orgId === u.orgId);
  if (u.role === "asesor") return db.listings.filter((l) => l.orgId === u.orgId && (l.asesorId === u.id || l.createdBy === u.id || db.users.find((x) => x.id === l.createdBy)?.managerId === u.id));
  return db.listings.filter((l) => l.createdBy === u.id);
}

export function visibleLeads(db: DB, u: User) {
  return db.leads.filter((l) => can.seeLead(u, l));
}

export function visibleUsers(db: DB, u: User) {
  if (u.role === "superadmin") return db.users;
  if (u.role === "org_admin") return db.users.filter((x) => x.orgId === u.orgId);
  if (u.role === "asesor") return db.users.filter((x) => x.managerId === u.id || x.id === u.id);
  return db.users.filter((x) => x.id === u.id);
}

/* ─── Bitácora ───────────────────────────────────────────────── */
function log(db: DB, actor: User, text: string, orgId?: string) {
  const a: Activity = { id: uid("ac"), at: now(), userId: actor.id, orgId: orgId ?? actor.orgId, text };
  db.activity.unshift(a);
  db.activity = db.activity.slice(0, 200);
}

/* ─── Usuarios ───────────────────────────────────────────────── */
export function tempPassword() {
  const w = ["casa", "patio", "llave", "nogal", "teja", "jardin", "cantera", "roble"];
  return `${w[Math.floor(Math.random() * w.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createUser(actor: User, data: { name: string; email: string; phone: string; title: string; role: Role; orgId?: string }): { ok: true; user: User; password: string } | { ok: false; error: string } {
  const db = load();
  if (!can.createUser(actor, data.role)) return { ok: false, error: "Tu rol no puede dar de alta este tipo de usuario." };
  if (db.users.some((x) => x.email.toLowerCase() === data.email.trim().toLowerCase())) return { ok: false, error: "Ya existe un usuario con ese correo." };
  const password = tempPassword();
  const user: User = {
    id: uid("u"),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password,
    role: data.role,
    orgId: actor.role === "superadmin" ? data.orgId : actor.orgId,
    managerId: data.role === "colaborador" ? (actor.role === "asesor" ? actor.id : undefined) : undefined,
    phone: data.phone.trim(),
    title: data.title.trim() || ROLE_LABEL[data.role],
    active: true,
    createdBy: actor.id,
    createdAt: now(),
    mustChangePassword: true,
  };
  mutate((d) => {
    d.users.push(user);
    log(d, actor, `dio de alta a ${user.name} como ${ROLE_LABEL[user.role].toLowerCase()}`, user.orgId);
  });
  return { ok: true, user, password };
}

export function updateUser(actor: User, id: string, patch: Partial<User>) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (!u) return;
    Object.assign(u, patch);
    if (patch.active !== undefined) log(d, actor, `${patch.active ? "reactivó" : "desactivó"} la cuenta de ${u.name}`, u.orgId);
  });
}

export function changePassword(userId: string, password: string) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (u) {
      u.password = password;
      u.mustChangePassword = false;
    }
  });
}

/* ─── Inmuebles ──────────────────────────────────────────────── */
export function saveListing(actor: User, data: Omit<Listing, "id" | "slug" | "views" | "createdAt" | "updatedAt" | "createdBy"> & { id?: string }) {
  let saved: Listing | null = null;
  mutate((d) => {
    if (data.id) {
      const l = d.listings.find((x) => x.id === data.id);
      if (!l) return;
      const prevStatus = l.status;
      Object.assign(l, data, { updatedAt: now() });
      saved = l;
      log(d, actor, prevStatus !== l.status ? `cambió ${l.title} a ${l.status}` : `editó ${l.title}`, l.orgId);
    } else {
      const l: Listing = {
        ...data,
        id: uid("l"),
        slug: uniqueSlug(data.title, d.listings.map((x) => x.slug)),
        createdBy: actor.id,
        views: 0,
        createdAt: now(),
        updatedAt: now(),
      };
      d.listings.unshift(l);
      saved = l;
      log(d, actor, l.status === "revision" ? `envió a revisión ${l.title}` : `creó ${l.title}`, l.orgId);
    }
  });
  return saved as Listing | null;
}

export function setListingStatus(actor: User, id: string, status: Listing["status"], note?: string) {
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id);
    if (!l) return;
    l.status = status;
    l.reviewNote = note;
    l.updatedAt = now();
    const verb: Record<string, string> = { publicado: "publicó", borrador: "regresó a borrador", pausado: "pausó", vendido: "marcó como vendido", revision: "envió a revisión" };
    log(d, actor, `${verb[status]} ${l.title}${note ? ` con la nota: ${note}` : ""}`, l.orgId);
  });
}

export function deleteListing(actor: User, id: string) {
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id);
    d.listings = d.listings.filter((x) => x.id !== id);
    if (l) log(d, actor, `eliminó ${l.title}`, l.orgId);
  });
}

export function addView(id: string) {
  const db = load();
  const l = db.listings.find((x) => x.id === id);
  if (!l) return;
  mutate((d) => {
    const x = d.listings.find((y) => y.id === id);
    if (x) x.views += 1;
  });
}

/* ─── Desarrollos y organizaciones ───────────────────────────── */
export function saveDevelopment(actor: User, data: Omit<Development, "id" | "slug" | "createdAt"> & { id?: string }) {
  mutate((d) => {
    if (data.id) {
      const dev = d.developments.find((x) => x.id === data.id);
      if (dev) Object.assign(dev, data);
      log(d, actor, `editó el desarrollo ${data.name}`, data.orgId);
    } else {
      d.developments.push({ ...data, id: uid("dev"), slug: uniqueSlug(data.name, d.developments.map((x) => x.slug)), createdAt: now() });
      log(d, actor, `creó el desarrollo ${data.name}`, data.orgId);
    }
  });
}

export function saveOrg(actor: User, data: Partial<Org> & { id?: string; name: string }) {
  let created: Org | null = null;
  mutate((d) => {
    if (data.id) {
      const o = d.orgs.find((x) => x.id === data.id);
      if (o) Object.assign(o, data);
      log(d, actor, `actualizó el perfil de ${data.name}`, data.id);
    } else {
      const o: Org = {
        id: uid("org"),
        slug: uniqueSlug(data.name, d.orgs.map((x) => x.slug)),
        name: data.name,
        kind: data.kind ?? "inmobiliaria",
        verified: false,
        status: "activa",
        initials: data.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        color: data.color ?? "#2E3A45",
        tagline: data.tagline ?? "",
        description: data.description ?? "",
        since: data.since ?? new Date().getFullYear(),
        municipios: data.municipios ?? [],
        phone: data.phone ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
        hours: data.hours ?? "",
        credits: data.credits ?? ["bancario", "contado"],
        responseMinutes: 30,
        agent: { enabled: false, name: `Asistente ${data.name}`, greeting: `Hola, soy el asistente de ${data.name}. ¿En qué te ayudo?`, suggested: [], kb: [], notes: "" },
        createdAt: now(),
      };
      d.orgs.push(o);
      created = o;
      log(d, actor, `dio de alta la inmobiliaria ${o.name}`, o.id);
    }
  });
  return created as Org | null;
}

/* ─── Prospectos ─────────────────────────────────────────────── */
export function createLead(data: Omit<Lead, "id" | "status" | "notes" | "createdAt">) {
  const lead: Lead = { ...data, id: uid("ld"), status: "nuevo", notes: [], createdAt: now() };
  mutate((d) => {
    d.leads.unshift(lead);
  });
  return lead;
}

export function updateLead(actor: User, id: string, patch: Partial<Lead>, note?: string) {
  mutate((d) => {
    const l = d.leads.find((x) => x.id === id);
    if (!l) return;
    Object.assign(l, patch);
    if (note) l.notes.push({ at: now(), by: actor.id, text: note });
    if (patch.status) log(d, actor, `movió el prospecto de ${l.name} a ${patch.status}`, l.orgId);
    if (patch.asesorId) log(d, actor, `reasignó el prospecto de ${l.name}`, l.orgId);
  });
}

export function addPlatformRequest(r: Omit<PlatformRequest, "id" | "createdAt">) {
  mutate((d) => {
    d.requests.unshift({ ...r, id: uid("rq"), createdAt: now() });
  });
}

export function addAmenity(actor: User, name: string) {
  mutate((d) => {
    if (!d.amenities.includes(name)) d.amenities.push(name);
    log(d, actor, `agregó la amenidad ${name} al catálogo`);
  });
}
