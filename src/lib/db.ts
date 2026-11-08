"use client";
// Capa de datos de la plataforma. Las pantallas solo usan estas funciones.
// - Modo local (sin variables de Supabase): todo vive en localStorage, para desarrollar sin backend.
// - Modo Supabase: se hidrata con lo que el usuario puede ver (RLS) y cada cambio sube solo la diferencia.
import { useSyncExternalStore } from "react";
import { SEED, seedDB } from "./seed";
import { REMOTE } from "./backend";
import { adminUsers, loadAll, pushDiff, rpc, sb } from "./supabase";
import type { Activity, AdvisorApplication, Article, AsesorTipo, BankRate, Course, DB, Development, Lead, Listing, Material, Org, PlatformRequest, Role, User } from "./types";

const KEY = "umbral-db";
const SESSION = "umbral-session";

const EMPTY: DB = { version: SEED.version, orgs: [], developments: [], listings: [], users: [], leads: [], activity: [], requests: [], applications: [], banks: [], articles: [], materials: [], courses: [], amenities: [], rr: 0 };

let cache: DB | null = null;
let hydrated = !REMOTE;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function load(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return REMOTE ? EMPTY : SEED;
  if (REMOTE) {
    void hydrate();
    return EMPTY;
  }
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
  if (!REMOTE) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* sin espacio o en modo privado: sigue en memoria */
    }
  }
  notify();
}

/* ─── Supabase: hidratación ─────────────────────────────────── */
let hydrating: Promise<void> | null = null;
let authWired = false;

function hydrate(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    if (!authWired) {
      authWired = true;
      sb().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          hydrating = null;
          void hydrate();
        }
      });
    }
    const { data } = await sb().auth.getSession();
    const uidNow = data.session?.user.id ?? null;
    try {
      const rows = await loadAll();
      cache = { ...EMPTY, ...rows };
    } catch {
      cache = cache ?? EMPTY;
    }
    sessionCache = uidNow;
    hydrated = true;
    notify();
  })();
  return hydrating;
}

/** Recarga desde Supabase (después de un error de escritura, o para traer cambios de otros). */
export function refresh() {
  if (!REMOTE) return Promise.resolve();
  hydrating = null;
  return hydrate();
}

/** En modo Supabase, falso mientras llegan los datos. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => !REMOTE);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (!REMOTE && (e.key === KEY || e.key === SESSION)) {
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
  return useSyncExternalStore(subscribe, load, () => (REMOTE ? EMPTY : SEED));
}

export function getDB(): DB {
  return load();
}

export function resetDemo() {
  if (REMOTE) return;
  save(seedDB());
  setSession(null);
}

let onSyncError: ((msg: string) => void) | null = null;
/** Para avisar en pantalla cuando Supabase rechaza un cambio. */
export function setSyncErrorHandler(fn: (msg: string) => void) {
  onSyncError = fn;
}

function mutate(fn: (db: DB) => void) {
  const prev = load();
  const next = structuredClone(prev);
  fn(next);
  save(next);
  if (REMOTE)
    void pushDiff(prev, next).then((err) => {
      if (err) {
        onSyncError?.("No se pudo guardar el cambio. Se recargaron los datos.");
        void refresh();
      }
    });
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
  if (REMOTE) {
    if (!hydrated) void hydrate();
    return sessionCache ?? null;
  }
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
  if (!REMOTE) {
    try {
      if (id) localStorage.setItem(SESSION, id);
      else localStorage.removeItem(SESSION);
    } catch {}
  }
  notify();
}

export function useSessionUser(): User | null {
  const id = useSyncExternalStore(subscribe, readSession, () => null);
  const db = useDB();
  if (!id) return null;
  const u = db.users.find((x) => x.id === id);
  return u && u.active ? u : null;
}

type LoginResult = { ok: true; user: User } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  if (REMOTE) {
    const { data, error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return { ok: false, error: "El correo o la contraseña no coinciden." };
    await refresh();
    const u = load().users.find((x) => x.id === data.user.id);
    if (!u || !u.active) {
      await sb().auth.signOut();
      return { ok: false, error: "Esta cuenta está desactivada o no tiene perfil. Pide ayuda al administrador." };
    }
    const org = u.orgId ? load().orgs.find((o) => o.id === u.orgId) : null;
    if (org && org.status === "suspendida") {
      await sb().auth.signOut();
      return { ok: false, error: `${org.name} está suspendida en la plataforma.` };
    }
    return { ok: true, user: u };
  }
  const u = load().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) return { ok: false, error: "El correo o la contraseña no coinciden." };
  if (!u.active) return { ok: false, error: "Esta cuenta está desactivada. Pide a tu administrador que la reactive." };
  const org = u.orgId ? load().orgs.find((o) => o.id === u.orgId) : null;
  if (org && org.status === "suspendida") return { ok: false, error: `${org.name} está suspendida en la plataforma.` };
  setSession(u.id);
  return { ok: true, user: u };
}

/** Solo modo local: entrar con una cuenta de prueba sin contraseña. */
export function loginAs(userId: string) {
  if (REMOTE) return;
  setSession(userId);
}

export async function logout() {
  if (REMOTE) {
    await sb().auth.signOut();
    sessionCache = null;
    await refresh();
    return;
  }
  setSession(null);
}

export async function resetPassword(email: string) {
  if (!REMOTE) return { ok: false as const, error: "Solo disponible con Supabase." };
  const { error } = await sb().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/panel/cuenta/` });
  return error ? { ok: false as const, error: "No se pudo enviar el correo." } : { ok: true as const };
}

/* ─── Permisos ───────────────────────────────────────────────── */
export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Administrador general",
  desarrolladora: "Desarrolladora",
  asesor: "Asesor",
};

export const roleLabel = (u: Pick<User, "role" | "asesorTipo">) =>
  u.role === "asesor" ? (u.asesorTipo === "interno" ? "Asesor interno" : "Asesor externo") : ROLE_LABEL[u.role];

const ownsOrg = (u: User, orgId?: string) => u.role === "superadmin" || (u.role === "desarrolladora" && !!orgId && u.orgId === orgId);

// Ningún asesor da de alta ni modifica inventario, desarrollos ni información.
export const can = {
  manageOrgs: (u: User) => u.role === "superadmin",
  manageCatalogs: (u: User) => u.role === "superadmin",
  manageAdvisors: (u: User) => u.role === "superadmin",
  manageContent: (u: User) => u.role === "superadmin",
  editOrgProfile: (u: User, orgId: string) => ownsOrg(u, orgId),
  manageDevelopments: (u: User, orgId: string) => ownsOrg(u, orgId),
  editListing: (u: User, l: Pick<Listing, "orgId">) => ownsOrg(u, l.orgId),
  manageMaterials: (u: User, orgId: string) => ownsOrg(u, orgId),
  postForOrg: (u: User, orgId?: string) => u.role === "superadmin" || (u.role === "desarrolladora" && !!orgId && u.orgId === orgId),
  seeLead: (u: User, l: Lead) =>
    u.role === "superadmin" || (u.role === "desarrolladora" && !!l.orgId && u.orgId === l.orgId) || (u.role === "asesor" && u.asesorTipo === "interno" && l.asesorId === u.id),
  reassignLead: (u: User) => u.role === "superadmin",
  manageAgent: (u: User, orgId: string) => ownsOrg(u, orgId),
  usePortal: (u: User) => u.role === "asesor" || u.role === "superadmin",
  receiveLeads: (u: User) => u.role === "superadmin" || u.role === "desarrolladora" || (u.role === "asesor" && u.asesorTipo === "interno"),
};

export function visibleListings(db: DB, u: User) {
  if (u.role === "superadmin") return db.listings;
  if (u.role === "desarrolladora") return db.listings.filter((l) => l.orgId === u.orgId);
  return db.listings.filter((l) => l.status === "publicado" || l.status === "vendido");
}

export function visibleLeads(db: DB, u: User) {
  return db.leads.filter((l) => can.seeLead(u, l));
}

export function visibleUsers(db: DB, u: User) {
  if (u.role === "superadmin") return db.users;
  if (u.role === "desarrolladora") return db.users.filter((x) => x.orgId === u.orgId);
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

export type NewUser = { name: string; email: string; phone: string; title: string; role: Role; orgId?: string; asesorTipo?: AsesorTipo; company?: string };

type Created = { ok: true; user: User; password: string } | { ok: false; error: string };

export async function createUser(actor: User, data: NewUser): Promise<Created> {
  if (REMOTE) {
    if (actor.role !== "superadmin") return { ok: false, error: "Solo el administrador general da de alta usuarios." };
    const r = await adminUsers<Created>({ action: "create", user: { ...data, title: data.title.trim() || roleLabel(data) } });
    if (r.ok) await refresh();
    return r;
  }
  const db = load();
  if (actor.role !== "superadmin") return { ok: false, error: "Solo el administrador general da de alta usuarios." };
  if (db.users.some((x) => x.email.toLowerCase() === data.email.trim().toLowerCase())) return { ok: false, error: "Ya existe un usuario con ese correo." };
  if (data.role === "desarrolladora" && !data.orgId) return { ok: false, error: "Elige la desarrolladora a la que pertenece." };
  const password = tempPassword();
  const user: User = {
    id: uid("u"),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password,
    role: data.role,
    orgId: data.role === "desarrolladora" ? data.orgId : undefined,
    asesorTipo: data.role === "asesor" ? (data.asesorTipo ?? "externo") : undefined,
    company: data.company?.trim() || undefined,
    phone: data.phone.trim(),
    mobile: data.phone.trim(),
    title: data.title.trim() || roleLabel(data),
    active: true,
    createdBy: actor.id,
    createdAt: now(),
    mustChangePassword: true,
  };
  mutate((d) => {
    d.users.push(user);
    log(d, actor, `dio de alta a ${user.name} como ${roleLabel(user).toLowerCase()}`, user.orgId);
  });
  return { ok: true, user, password };
}

export function updateUser(actor: User, id: string, patch: Partial<User>) {
  if (actor.role !== "superadmin" && actor.id !== id) return;
  // Nadie cambia su propio rol ni su tipo de asesor desde su perfil.
  if (actor.role !== "superadmin") {
    delete patch.role;
    delete patch.asesorTipo;
    delete patch.orgId;
    delete patch.active;
  }
  mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (!u) return;
    Object.assign(u, patch);
    if (patch.active !== undefined) log(d, actor, `${patch.active ? "reactivó" : "desactivó"} la cuenta de ${u.name}`, u.orgId);
  });
}

export async function changePassword(userId: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (REMOTE) {
    const { error } = await sb().auth.updateUser({ password });
    if (error) return { ok: false, error: error.message.includes("different") ? "Usa una contraseña distinta a la anterior." : "No se pudo cambiar la contraseña." };
  }
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (u) {
      if (!REMOTE) u.password = password;
      u.mustChangePassword = false;
    }
  });
  return { ok: true };
}

/* ─── Inmuebles ──────────────────────────────────────────────── */
export function saveListing(actor: User, data: Omit<Listing, "id" | "slug" | "views" | "createdAt" | "updatedAt" | "createdBy"> & { id?: string }) {
  if (!can.editListing(actor, data)) return null;
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
      log(d, actor, `creó ${l.title}`, l.orgId);
    }
  });
  return saved as Listing | null;
}

export function setListingStatus(actor: User, id: string, status: Listing["status"]) {
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id);
    if (!l || !can.editListing(actor, l)) return;
    l.status = status;
    l.updatedAt = now();
    const verb: Record<string, string> = { publicado: "publicó", borrador: "regresó a borrador", pausado: "pausó", vendido: "marcó como vendido" };
    log(d, actor, `${verb[status]} ${l.title}`, l.orgId);
  });
}

export function deleteListing(actor: User, id: string) {
  mutate((d) => {
    const l = d.listings.find((x) => x.id === id);
    if (!l || !can.editListing(actor, l)) return;
    d.listings = d.listings.filter((x) => x.id !== id);
    if (l) log(d, actor, `eliminó ${l.title}`, l.orgId);
  });
}

export function addView(id: string) {
  if (REMOTE) {
    void rpc("add_view", { listing: id }).catch(() => {});
    return;
  }
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
  if (!can.manageDevelopments(actor, data.orgId)) return;
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
  if (data.id ? !can.editOrgProfile(actor, data.id) : !can.manageOrgs(actor)) return null;
  // Solo el administrador otorga el sello y la verificación.
  if (actor.role !== "superadmin") {
    delete data.seal;
    delete data.verified;
    delete data.trust;
    delete data.status;
  }
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
        verified: false,
        status: "activa",
        initials: data.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        color: data.color ?? "#2E3A45",
        tagline: data.tagline ?? "",
        description: data.description ?? "",
        history: data.history ?? "",
        paymentTerms: data.paymentTerms ?? "",
        seal: false,
        trust: [],
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
      log(d, actor, `dio de alta la desarrolladora ${o.name}`, o.id);
    }
  });
  return created as Org | null;
}

/* ─── Prospectos ─────────────────────────────────────────────── */
/** La plataforma reparte los prospectos por turnos entre los asesores internos activos. */
function nextInterno(d: DB): string | undefined {
  const pool = d.users.filter((x) => x.role === "asesor" && x.asesorTipo === "interno" && x.active).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!pool.length) return undefined;
  const pick = pool[d.rr % pool.length];
  d.rr = (d.rr + 1) % 1_000_000;
  return pick.id;
}

export async function createLead(data: Omit<Lead, "id" | "status" | "notes" | "createdAt" | "asesorId">): Promise<boolean> {
  if (REMOTE) {
    try {
      await rpc("create_lead", { payload: data });
      return true;
    } catch {
      return false;
    }
  }
  let lead: Lead | null = null;
  mutate((d) => {
    lead = { ...data, id: uid("ld"), asesorId: nextInterno(d), status: "nuevo", notes: [], createdAt: now() };
    d.leads.unshift(lead);
  });
  return !!lead;
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

export async function addPlatformRequest(r: Omit<PlatformRequest, "id" | "createdAt">) {
  if (REMOTE) {
    const id = uid("rq");
    await sb().from("requests").insert({ id, data: { ...r, id, createdAt: now() } });
    return;
  }
  mutate((d) => {
    d.requests.unshift({ ...r, id: uid("rq"), createdAt: now() });
  });
}

export function addAmenity(actor: User, name: string) {
  if (!can.manageCatalogs(actor)) return;
  mutate((d) => {
    if (!d.amenities.includes(name)) d.amenities.push(name);
    log(d, actor, `agregó la amenidad ${name} al catálogo`);
  });
}

/* ─── Asesores: solicitudes ──────────────────────────────────── */
export async function submitApplication(a: Omit<AdvisorApplication, "id" | "status" | "createdAt">): Promise<{ ok: true } | { ok: false; error: string }> {
  if (REMOTE) {
    try {
      return await rpc<{ ok: true } | { ok: false; error: string }>("submit_application", { payload: a });
    } catch {
      return { ok: false, error: "No se pudo enviar. Intenta de nuevo en un momento." };
    }
  }
  const db = load();
  const email = a.email.trim().toLowerCase();
  if (db.users.some((x) => x.email === email)) return { ok: false, error: "Ese correo ya tiene acceso. Entra desde Acceso." };
  if (db.applications.some((x) => x.email === email && x.status === "pendiente")) return { ok: false, error: "Ya hay una solicitud pendiente con ese correo." };
  mutate((d) => {
    d.applications.unshift({ ...a, email, id: uid("ap"), status: "pendiente", createdAt: now() });
  });
  return { ok: true };
}

export async function approveApplication(actor: User, id: string, tipo: AsesorTipo): Promise<Created> {
  if (REMOTE) {
    const r = await adminUsers<Created>({ action: "approve", applicationId: id, tipo });
    if (r.ok) await refresh();
    return r;
  }
  const ap = load().applications.find((x) => x.id === id);
  if (!ap || actor.role !== "superadmin") return { ok: false as const, error: "No se encontró la solicitud." };
  const r = await createUser(actor, { name: ap.name, email: ap.email, phone: ap.phone, title: "Asesor inmobiliario", role: "asesor", asesorTipo: tipo, company: ap.company });
  if (!r.ok) return r;
  mutate((d) => {
    const x = d.applications.find((y) => y.id === id);
    if (x) Object.assign(x, { status: "aprobada", reviewedBy: actor.id, userId: r.user.id });
    log(d, actor, `aprobó la solicitud de ${ap.name} como asesor ${tipo}`);
  });
  return r;
}

export function rejectApplication(actor: User, id: string, note: string) {
  if (actor.role !== "superadmin") return;
  mutate((d) => {
    const x = d.applications.find((y) => y.id === id);
    if (!x) return;
    Object.assign(x, { status: "rechazada", reviewedBy: actor.id, reviewNote: note });
    log(d, actor, `rechazó la solicitud de ${x.name}`);
  });
}

/* ─── Tasas bancarias ────────────────────────────────────────── */
export function saveBank(actor: User, b: Omit<BankRate, "id" | "updatedAt"> & { id?: string }) {
  if (actor.role !== "superadmin") return;
  mutate((d) => {
    if (b.id) {
      const x = d.banks.find((y) => y.id === b.id);
      if (x) Object.assign(x, b, { updatedAt: now() });
    } else d.banks.push({ ...b, id: uid("bk"), updatedAt: now() });
    log(d, actor, `actualizó la tasa de ${b.bank}`);
  });
}

export function deleteBank(actor: User, id: string) {
  if (actor.role !== "superadmin") return;
  mutate((d) => {
    d.banks = d.banks.filter((x) => x.id !== id);
  });
}

/* ─── Noticias y publicaciones ───────────────────────────────── */
export function saveArticle(actor: User, a: Omit<Article, "id" | "slug" | "createdBy"> & { id?: string }) {
  if (!can.postForOrg(actor, a.orgId) && !(actor.role === "superadmin")) return null;
  let saved: Article | null = null;
  mutate((d) => {
    if (a.id) {
      const x = d.articles.find((y) => y.id === a.id);
      if (!x) return;
      Object.assign(x, a);
      saved = x;
      log(d, actor, `editó la publicación ${a.title}`, a.orgId);
    } else {
      const x: Article = { ...a, id: uid("ar"), slug: uniqueSlug(a.title, d.articles.map((y) => y.slug)), createdBy: actor.id };
      d.articles.unshift(x);
      saved = x;
      log(d, actor, `publicó ${a.title}`, a.orgId);
    }
  });
  return saved as Article | null;
}

export function deleteArticle(actor: User, id: string) {
  mutate((d) => {
    const x = d.articles.find((y) => y.id === id);
    if (!x || !(actor.role === "superadmin" || can.postForOrg(actor, x.orgId))) return;
    d.articles = d.articles.filter((y) => y.id !== id);
  });
}

/* ─── Material descargable ───────────────────────────────────── */
export function saveMaterial(actor: User, m: Omit<Material, "id" | "createdAt"> & { id?: string }) {
  if (!can.manageMaterials(actor, m.orgId)) return;
  mutate((d) => {
    if (m.id) {
      const x = d.materials.find((y) => y.id === m.id);
      if (x) Object.assign(x, m);
    } else d.materials.unshift({ ...m, id: uid("m"), createdAt: now() });
    log(d, actor, `subió material: ${m.title}`, m.orgId);
  });
}

export function deleteMaterial(actor: User, id: string) {
  mutate((d) => {
    const x = d.materials.find((y) => y.id === id);
    if (!x || !can.manageMaterials(actor, x.orgId)) return;
    d.materials = d.materials.filter((y) => y.id !== id);
  });
}

/* ─── Academia ───────────────────────────────────────────────── */
export function saveCourse(actor: User, c: Omit<Course, "id" | "createdAt"> & { id?: string }) {
  if (!(actor.role === "superadmin" || (c.orgId && can.postForOrg(actor, c.orgId)))) return;
  mutate((d) => {
    if (c.id) {
      const x = d.courses.find((y) => y.id === c.id);
      if (x) Object.assign(x, c);
    } else d.courses.unshift({ ...c, id: uid("c"), createdAt: now() });
    log(d, actor, `guardó en academia: ${c.title}`, c.orgId);
  });
}

export function deleteCourse(actor: User, id: string) {
  mutate((d) => {
    const x = d.courses.find((y) => y.id === id);
    if (!x || !(actor.role === "superadmin" || (x.orgId && can.postForOrg(actor, x.orgId)))) return;
    d.courses = d.courses.filter((y) => y.id !== id);
  });
}

/* ─── Carga inicial en Supabase ──────────────────────────────── */
/** Sube a una base vacía los datos de arranque (Grupo Casillas, tasas, noticias, material, academia). No toca usuarios. */
export async function importSeed(actor: User): Promise<{ ok: boolean; error?: string }> {
  if (!REMOTE || actor.role !== "superadmin") return { ok: false, error: "Solo el administrador, con Supabase conectado." };
  const s = seedDB();
  const tables: [string, { id: string }[]][] = [
    ["orgs", s.orgs], ["developments", s.developments], ["listings", s.listings.map((l) => ({ ...l, createdBy: actor.id }))],
    ["banks", s.banks], ["articles", s.articles.map((a) => ({ ...a, createdBy: actor.id }))], ["materials", s.materials], ["courses", s.courses],
  ];
  for (const [table, rows] of tables) {
    const { error } = await sb().from(table).upsert(rows.map((d) => ({ id: d.id, data: d })), { onConflict: "id", ignoreDuplicates: true });
    if (error) return { ok: false, error: `${table}: ${error.message}` };
  }
  await sb().from("settings").upsert([{ id: "amenities", data: s.amenities }, { id: "rr", data: 0 }], { onConflict: "id", ignoreDuplicates: true });
  await refresh();
  return { ok: true };
}
