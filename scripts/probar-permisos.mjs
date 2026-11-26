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

// ─── Seguridad: validación e inyección (migración 20261125000000_seguridad.sql) ───
r = await devA.c.from("listings").insert({ id: "t-l-js", data: { orgId: "t-org-a", status: "borrador", title: "x", images: ["javascript:alert(1)"] } });
check("Rechaza enlaces javascript: en imágenes", !!r.error, r.error?.message);
r = await devA.c.from("orgs").update({ data: { id: "t-org-a", name: "Org A", status: "activa", verified: false, seal: false, trust: [], website: "javascript:alert(document.cookie)" } }).eq("id", "t-org-a");
check("Rechaza enlaces javascript: en el sitio web", !!r.error, r.error?.message);
r = await devA.c.from("orgs").update({ data: { id: "t-org-a", name: "Org A", status: "activa", verified: false, seal: false, trust: [], logo: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" } }).eq("id", "t-org-a");
check("Rechaza data:text/html", !!r.error, r.error?.message);
r = await devA.c.from("listings").insert({ id: "t-l-ok", data: { orgId: "t-org-a", status: "borrador", title: "Ok", images: ["https://ejemplo.com/a.jpg", "/img/b.jpg"], views: 9999, createdBy: "otro" } }).select("data");
check("Acepta enlaces https y rutas del sitio", !r.error, r.error?.message);
check("Las vistas y el autor no se falsifican al crear", r.data?.[0]?.data?.views === 0 && r.data?.[0]?.data?.createdBy === devA.id);
r = await devA.c.from("listings").update({ data: { orgId: "t-org-a", status: "publicado", title: "Pub", views: 1000000 } }).eq("id", "t-l-pub").select("data");
check("Las vistas no se inflan editando", r.data?.[0]?.data?.views === 0, JSON.stringify(r.data?.[0]?.data?.views));
r = await devA.c.from("listings").update({ data: { orgId: "t-org-a", status: "hackeado", title: "Pub" } }).eq("id", "t-l-pub");
check("Rechaza estados inventados", !!r.error);
r = await devA.c.from("listings").insert({ id: "t-l-big", data: { orgId: "t-org-a", status: "borrador", title: "x".repeat(600000) } });
check("Rechaza documentos gigantes", !!r.error);
r = await devA.c.from("listings").insert({ id: "../../etc", data: { orgId: "t-org-a", status: "borrador", title: "x" } });
check("Rechaza identificadores raros", !!r.error);
r = await devA.c.from("listings").insert({ id: "t-l-id", data: { id: "t-l-pub", orgId: "t-org-a", status: "borrador", title: "x" } }).select("data");
check("El id del documento es siempre el de la fila", r.data?.[0]?.data?.id === "t-l-id");
r = await ext.c.from("profiles").update({ data: { id: ext.id, role: "asesor", name: "Ext", email: "otro@correo.com", active: true } }).eq("id", ext.id);
const { data: extMail } = await admin.from("profiles").select("data").eq("id", ext.id).single();
check("Nadie cambia su correo desde el perfil", extMail.data.email === "t-ext@umbral.test");
r = await int1.c.from("leads").update({ data: { id: mine, name: "Nombre cambiado", phone: "1", status: "contactado", notes: [{ at: now, by: int1.id, text: "llamé" }] } }).eq("id", mine).select("data");
check("Interno cambia etapa y notas, no los datos del cliente", r.data?.[0]?.data?.status === "contactado" && r.data?.[0]?.data?.name !== "Nombre cambiado" && r.data?.[0]?.data?.notes?.length === 1, JSON.stringify(r.error ?? ""));
r = await int1.c.from("activity").insert({ id: "t-ac-1", data: { userId: int1.id, orgId: "t-org-a", text: "falso" } });
check("Nadie escribe en la bitácora de otra desarrolladora", !!r.error);
r = await pub.from("requests").insert({ id: "t-rq-1", data: { company: "Spam" } });
check("Solicitudes de desarrolladora ya no se insertan directo", !!r.error);
r = await pub.rpc("submit_request", { payload: { company: "Desarrolladora Uno", name: "Contacto", phone: "33 1234 5678", email: "rq@umbral.test", units: "20" } });
check("Solicitud de desarrolladora por la función validada", !r.error, r.error?.message);
r = await pub.rpc("submit_request", { payload: { company: "X", name: "Y", phone: "1", email: "nada" } });
check("Solicitud de desarrolladora con datos malos rechazada", !!r.error);
r = await pub.rpc("create_lead", { payload: { name: "Ataque", phone: "3300000000", orgId: "t-org-a", credit: "<script>", source: "ficha" } });
check("Prospecto con crédito inventado rechazado", !!r.error);
r = await pub.rpc("create_lead", { payload: { name: "Otra", phone: "3311111111", orgId: "org-que-no-existe" } });
check("Prospecto a desarrolladora inexistente rechazado", !!r.error);
const flood = [];
for (let i = 0; i < 4; i++) flood.push((await pub.rpc("create_lead", { payload: { name: "Spam", phone: "3399999999", orgId: "t-org-a" } })).error);
check("Freno: el mismo teléfono no manda más de 3 prospectos en 10 minutos", !flood[0] && !flood[2] && !!flood[3], flood.map((e) => (e ? "x" : "ok")).join(","));
const big = Array.from({ length: 100 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: "hola ".repeat(1000), extra: "<img src=x onerror=alert(1)>" }));
r = await pub.rpc("create_lead", { payload: { name: "Chat", phone: "3322222222", orgId: "t-org-a", source: "agente", transcript: big } });
const { data: chatLead } = await admin.from("leads").select("data").eq("id", r.data?.id).single();
check("La conversación del agente se recorta y se limpia", chatLead?.data?.transcript?.length === 40 && chatLead.data.transcript[0].text.length <= 2000 && !("extra" in chatLead.data.transcript[0]));
r = await pub.rpc("submit_application", { payload: { name: "Asesor Raro", email: "raro@umbral.test", phone: "123", orgId: "t-org-a" } });
check("Solicitud de asesor con teléfono malo rechazada", r.data?.ok === false);
r = await pub.rpc("submit_application", { payload: { name: "Asesor Colado", email: "colado@umbral.test", phone: "3312345678", orgId: "t-org-a" } });
const { data: colado } = await admin.from("applications").select("data").eq("email", "colado@umbral.test").maybeSingle();
check("Un asesor no se cuela al equipo de una desarrolladora", r.data?.ok === true && !colado?.data?.orgId);

// Archivos: tipos y carpetas
const png = new Blob([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0))], { type: "image/png" });
r = await devA.c.storage.from("material").upload(`t-org-a/prueba/${Date.now()}.png`, png, { contentType: "image/png" });
check("Desarrolladora sube a su carpeta", !r.error, r.error?.message);
const okPath = r.data?.path;
r = await devA.c.storage.from("material").upload(`t-org-b/prueba/${Date.now()}.png`, png, { contentType: "image/png" });
check("Desarrolladora no sube a la carpeta de otra", !!r.error);
r = await devA.c.storage.from("material").upload(`t-org-a/prueba/${Date.now()}.html`, new Blob(["<script>alert(1)</script>"], { type: "text/html" }), { contentType: "text/html" });
check("No se pueden subir páginas HTML", !!r.error);
r = await devA.c.storage.from("material").upload(`t-org-a/prueba/${Date.now()}.svg`, new Blob(["<svg onload=alert(1)>"], { type: "image/svg+xml" }), { contentType: "image/svg+xml" });
check("No se pueden subir SVG", !!r.error);
r = await ext.c.storage.from("material").upload(`t-org-a/prueba/${Date.now()}.png`, png, { contentType: "image/png" });
check("Un asesor no sube archivos", !!r.error);
if (okPath) await admin.storage.from("material").remove([okPath]);

// Limpieza
await admin.from("requests").delete().eq("data->>email", "rq@umbral.test");
await admin.from("leads").delete().in("data->>phone", ["3399999999", "3322222222"]);
await admin.from("applications").delete().eq("email", "colado@umbral.test");
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
