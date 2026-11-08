// Prueba de permisos (RLS) contra un Supabase local o de pruebas.
// Uso: SUPABASE_URL=... ANON=... SERVICE=... node scripts/probar-permisos.mjs
// Crea usuarios de prueba, revisa qué ve y qué puede escribir cada rol, y los borra al final.
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL: url, ANON: anon, SERVICE: service } = process.env;
if (!url || !anon || !service) throw new Error("Faltan SUPABASE_URL, ANON o SERVICE");
const admin = createClient(url, service, { auth: { persistSession: false } });
const results = [];
const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "OK  " : "FALLA"} ${name}${extra ? ` (${extra})` : ""}`); };

const now = new Date().toISOString();
const ids = [];
async function mkUser(email, profile) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Prueba-12345", email_confirm: true });
  if (error) throw error;
  ids.push(data.user.id);
  const { error: e2 } = await admin.from("profiles").insert({ id: data.user.id, data: { id: data.user.id, email, name: email, active: true, createdAt: now, phone: "", title: "", mustChangePassword: false, ...profile } });
  if (e2) throw e2;
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const { error: e3 } = await c.auth.signInWithPassword({ email, password: "Prueba-12345" });
  if (e3) throw e3;
  return { id: data.user.id, c };
}

// Datos base
await admin.from("orgs").upsert([
  { id: "t-org-a", data: { id: "t-org-a", name: "Org A", status: "activa", verified: false, seal: false, trust: [] } },
  { id: "t-org-b", data: { id: "t-org-b", name: "Org B", status: "activa", verified: false, seal: false, trust: [] } },
]);
await admin.from("listings").upsert([
  { id: "t-l-pub", data: { id: "t-l-pub", orgId: "t-org-a", status: "publicado", title: "Pub", views: 0 } },
  { id: "t-l-bor", data: { id: "t-l-bor", orgId: "t-org-a", status: "borrador", title: "Borrador" } },
]);
await admin.from("materials").upsert([{ id: "t-m", data: { id: "t-m", orgId: "t-org-a", title: "Brochure" } }]);

const sa = await mkUser("t-admin@umbral.test", { role: "superadmin" });
const devA = await mkUser("t-deva@umbral.test", { role: "desarrolladora", orgId: "t-org-a" });
const int1 = await mkUser("t-int1@umbral.test", { role: "asesor", asesorTipo: "interno", createdAt: "2026-01-01T00:00:00Z" });
const int2 = await mkUser("t-int2@umbral.test", { role: "asesor", asesorTipo: "interno", createdAt: "2026-01-02T00:00:00Z" });
const ext = await mkUser("t-ext@umbral.test", { role: "asesor", asesorTipo: "externo" });
const pub = createClient(url, anon, { auth: { persistSession: false } });

// Público
let r = await pub.from("listings").select("id").in("id", ["t-l-pub", "t-l-bor"]);
check("Público ve solo lo publicado", r.data?.length === 1 && r.data[0].id === "t-l-pub");
r = await pub.from("materials").select("id").eq("id", "t-m");
check("Público no ve material de asesores", (r.data ?? []).length === 0);
r = await pub.from("listings").insert({ id: "t-x", data: { orgId: "t-org-a", status: "publicado" } });
check("Público no puede publicar inmuebles", !!r.error);
r = await pub.from("profiles").select("id");
check("Público no ve usuarios", (r.data ?? []).length === 0);
r = await pub.rpc("create_lead", { payload: { name: "Comprador", phone: "3300000000", orgId: "t-org-a", source: "ficha" } });
check("Público puede dejar un prospecto", !r.error, r.error?.message);
const lead1 = r.data?.id;
r = await pub.rpc("create_lead", { payload: { name: "Comprador 2", phone: "3300000001", orgId: "t-org-b", source: "credito" } });
const lead2 = r.data?.id;
r = await pub.from("leads").select("id");
check("Público no ve prospectos", (r.data ?? []).length === 0);
r = await pub.rpc("submit_application", { payload: { name: "Asesor Nuevo", email: "nuevo@umbral.test", phone: "3300000002", experience: "1 a 3 años" } });
check("Público puede solicitar acceso de asesor", r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await pub.rpc("submit_application", { payload: { name: "Asesor Nuevo", email: "nuevo@umbral.test", phone: "3300000002" } });
check("Solicitud duplicada rechazada", r.data?.ok === false);
r = await pub.auth.signUp({ email: "intruso@umbral.test", password: "Prueba-12345" });
check("Nadie se registra solo", !!r.error, r.error?.message);

// Reparto por turnos
const { data: leads } = await admin.from("leads").select("id, asesor_id").in("id", [lead1, lead2]);
const a1 = leads.find((l) => l.id === lead1)?.asesor_id, a2 = leads.find((l) => l.id === lead2)?.asesor_id;
check("Prospectos repartidos por turnos entre internos", !!a1 && !!a2 && a1 !== a2 && [int1.id, int2.id].includes(a1) && [int1.id, int2.id].includes(a2));

// Asesor externo
r = await ext.c.from("listings").select("id").in("id", ["t-l-pub", "t-l-bor"]);
check("Externo ve inventario publicado, no borradores", r.data?.length === 1);
r = await ext.c.from("materials").select("id").eq("id", "t-m");
check("Externo ve material", r.data?.length === 1);
r = await ext.c.from("listings").update({ data: { orgId: "t-org-a", status: "publicado", title: "Hackeado" } }).eq("id", "t-l-pub").select();
check("Externo no modifica inventario", (r.data ?? []).length === 0);
r = await ext.c.from("leads").select("id");
check("Externo no ve prospectos", (r.data ?? []).length === 0);
r = await ext.c.from("profiles").update({ data: { id: ext.id, role: "superadmin", name: "x", email: "t-ext@umbral.test", active: true } }).eq("id", ext.id);
const { data: extNow } = await admin.from("profiles").select("role").eq("id", ext.id).single();
check("Asesor no se sube de rol", extNow.role === "asesor");

// Asesor interno
const mine = [a1, a2].includes(int1.id) ? (a1 === int1.id ? lead1 : lead2) : null;
r = await int1.c.from("leads").select("id");
check("Interno ve solo sus prospectos", r.data?.length === 1 && r.data[0].id === mine);
r = await int1.c.from("leads").update({ data: { id: mine, name: "x", phone: "1", status: "contactado", asesorId: int2.id, notes: [] } }).eq("id", mine).select("asesor_id");
check("Interno no se reasigna prospectos", r.data?.[0]?.asesor_id === int1.id);

// Desarrolladora
r = await devA.c.from("listings").select("id").in("id", ["t-l-pub", "t-l-bor"]);
check("Desarrolladora ve sus borradores", r.data?.length === 2);
r = await devA.c.from("listings").update({ data: { id: "t-l-pub", orgId: "t-org-a", status: "publicado", title: "Nuevo precio", views: 0 } }).eq("id", "t-l-pub").select();
check("Desarrolladora edita su inventario", r.data?.length === 1);
r = await devA.c.from("listings").insert({ id: "t-l-b", data: { id: "t-l-b", orgId: "t-org-b", status: "publicado" } });
check("Desarrolladora no publica para otra", !!r.error);
r = await devA.c.from("orgs").update({ data: { id: "t-org-a", name: "Org A", status: "activa", verified: true, seal: true, trust: [] } }).eq("id", "t-org-a").select("data");
check("Desarrolladora no se otorga el sello", r.data?.[0]?.data?.seal === false);
r = await devA.c.from("leads").select("id");
check("Desarrolladora ve prospectos de lo suyo", r.data?.length === 1 && r.data[0].id === lead1);

// Administrador
r = await sa.c.from("applications").select("id").eq("email", "nuevo@umbral.test");
check("Administrador ve solicitudes", r.data?.length === 1);
r = await sa.c.from("leads").select("id").in("id", [lead1, lead2]);
check("Administrador ve todos los prospectos", r.data?.length === 2);

// Limpieza
await admin.from("leads").delete().in("id", [lead1, lead2]);
await admin.from("applications").delete().eq("email", "nuevo@umbral.test");
await admin.from("listings").delete().like("id", "t-%");
await admin.from("materials").delete().eq("id", "t-m");
await admin.from("orgs").delete().like("id", "t-org-%");
await admin.from("activity").delete().like("id", "t-%");
for (const id of ids) { await admin.from("profiles").delete().eq("id", id); await admin.auth.admin.deleteUser(id); }
await admin.from("settings").delete().eq("id", "rr");

const bad = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - bad} de ${results.length} pruebas pasaron`);
process.exit(bad ? 1 : 0);
