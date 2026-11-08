"use client";
// Conexión con Supabase. Solo se usa cuando existen las variables de entorno (ver backend.ts).
// La seguridad la ponen las políticas RLS de supabase/schema.sql: aquí solo se lee y escribe
// lo que el usuario actual tiene permitido.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REMOTE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./backend";
import type { DB, User } from "./types";

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

/** Colección del DB local → tabla en Supabase. */
export const TABLES = {
  orgs: "orgs",
  developments: "developments",
  listings: "listings",
  users: "profiles",
  leads: "leads",
  activity: "activity",
  requests: "requests",
  applications: "applications",
  banks: "banks",
  articles: "articles",
  materials: "materials",
  courses: "courses",
} as const satisfies Partial<Record<keyof DB, string>>;
export type Coll = keyof typeof TABLES;

async function all(table: string) {
  const out: { id: string; data: unknown }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb().from(table).select("id, data").range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out.map((r) => ({ ...(r.data as object), id: r.id }));
}

/** Trae todo lo que el usuario actual puede ver. */
export async function loadAll(): Promise<Omit<DB, "version" | "rr">> {
  const keys = Object.keys(TABLES) as Coll[];
  const rows = await Promise.all(keys.map((k) => all(TABLES[k]).catch(() => [])));
  const { data: am } = await sb().from("settings").select("data").eq("id", "amenities").maybeSingle();
  const db = Object.fromEntries(keys.map((k, i) => [k, rows[i]])) as unknown as Omit<DB, "version" | "rr" | "amenities">;
  db.activity.sort((a, b) => b.at.localeCompare(a.at));
  db.leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...db, amenities: Array.isArray(am?.data) ? (am!.data as string[]) : [] };
}

const strip = (coll: Coll, doc: { id: string }) => {
  if (coll !== "users") return doc;
  const { password, ...rest } = doc as User;
  void password;
  return rest;
};

/** Sube a Supabase lo que cambió entre dos versiones del DB. */
export async function pushDiff(prev: DB, next: DB): Promise<string | null> {
  const jobs: PromiseLike<{ error: { message: string } | null }>[] = [];
  for (const coll of Object.keys(TABLES) as Coll[]) {
    const table = TABLES[coll];
    const before = new Map((prev[coll] as { id: string }[]).map((d) => [d.id, d]));
    const after = new Map((next[coll] as { id: string }[]).map((d) => [d.id, d]));
    for (const [id, doc] of after) {
      const old = before.get(id);
      if (!old) jobs.push(sb().from(table).insert({ id, data: strip(coll, doc) }));
      else if (old !== doc && JSON.stringify(old) !== JSON.stringify(doc)) jobs.push(sb().from(table).update({ data: strip(coll, doc) }).eq("id", id));
    }
    // La bitácora solo crece: lo que se recorta en pantalla se queda en la base.
    if (coll !== "activity") for (const id of before.keys()) if (!after.has(id)) jobs.push(sb().from(table).delete().eq("id", id));
  }
  if (JSON.stringify(prev.amenities) !== JSON.stringify(next.amenities)) jobs.push(sb().from("settings").upsert({ id: "amenities", data: next.amenities }));
  const res = await Promise.all(jobs);
  return res.find((r) => r.error)?.error?.message ?? null;
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

/** Llama a la Edge Function admin-users (alta de usuarios y aprobación de asesores). */
export async function adminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb().functions.invoke("admin-users", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    try {
      const j = await ctx?.json();
      if (j?.error) return { ok: false, error: j.error } as T;
    } catch {}
    return { ok: false, error: "No se pudo contactar al servidor." } as T;
  }
  return data as T;
}

const safeName = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9.]+/g, "-").slice(-80);

export async function uploadToStorage(file: File, folder: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!REMOTE) return { ok: false, error: "Supabase no está configurado." };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "El archivo pesa más de 50 MB. Para videos, pega un enlace de YouTube o Drive." };
  const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await sb().storage.from("material").upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) return { ok: false, error: "No se pudo subir el archivo." };
  return { ok: true, url: sb().storage.from("material").getPublicUrl(path).data.publicUrl };
}
