// Edge Function de Supabase: alta de usuarios y aprobación de asesores.
// Crear cuentas de Auth necesita la llave de servicio, que nunca va en el navegador.
// Solo responde si quien llama es un administrador general activo.
// Despliegue: supabase functions deploy admin-users
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

// ALLOWED_ORIGIN: lista separada por comas con los dominios del sitio (ej. "https://umbral.mx,https://www.umbral.mx").
// Sin la variable solo se aceptan llamadas desde localhost (desarrollo).
const ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4322").split(",").map((s) => s.trim()).filter(Boolean);
const corsFor = (origin: string) => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "X-Content-Type-Options": "nosniff",
});


// Validación de entrada: el administrador también puede equivocarse o tener la sesión robada.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const line = (v: unknown, max: number) => (typeof v === "string" ? v.normalize("NFC").replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, max) : "");
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const ID = /^[A-Za-z0-9_-]{1,80}$/;

const words = ["casa", "patio", "llave", "nogal", "teja", "jardin", "cantera", "roble", "torre", "plaza"];
const tempPassword = () => `${words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length]}-${1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000)}-${crypto.randomUUID().slice(0, 4)}`;

type NewUser = { name: string; email: string; phone?: string; title?: string; role: "superadmin" | "desarrolladora" | "asesor"; orgId?: string; asesorTipo?: "interno" | "externo"; company?: string };

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get("Origin") ?? "");
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1] ?? "";
  if (!jwt) return json({ ok: false, error: "Sesión no válida" }, 401);
  const { data: who } = await service.auth.getUser(jwt);
  if (!who.user) return json({ ok: false, error: "Sesión no válida" }, 401);
  const { data: me } = await service.from("profiles").select("role, active").eq("id", who.user.id).single();
  if (!me || me.role !== "superadmin" || !me.active) return json({ ok: false, error: "Solo el administrador general da de alta usuarios." }, 403);

  let body: { action: string; user?: NewUser; applicationId?: string; tipo?: "interno" | "externo"; email?: string };
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return json({ ok: false, error: "Solicitud demasiado grande" }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error();
  } catch {
    return json({ ok: false, error: "Solicitud inválida" }, 400);
  }

  async function create(input: NewUser) {
    if (!input || typeof input !== "object") return { ok: false as const, error: "Datos inválidos." };
    const u: NewUser = {
      name: line(input.name, 120),
      email: line(input.email, 160).toLowerCase(),
      phone: line(input.phone, 40).replace(/[^\d+()\s-]/g, ""),
      title: line(input.title, 120),
      role: input.role,
      orgId: input.orgId ? line(input.orgId, 80) : undefined,
      asesorTipo: input.asesorTipo,
      company: line(input.company, 120) || undefined,
    };
    const email = u.email;
    if (u.name.length < 3) return { ok: false as const, error: "Escribe nombre y apellido." };
    if (!EMAIL.test(email)) return { ok: false as const, error: "Correo inválido." };
    if (!["superadmin", "desarrolladora", "asesor"].includes(u.role)) return { ok: false as const, error: "Rol inválido." };
    if (u.asesorTipo && !["interno", "externo"].includes(u.asesorTipo)) return { ok: false as const, error: "Tipo de asesor inválido." };
    if (u.orgId && !ID.test(u.orgId)) return { ok: false as const, error: "La desarrolladora no existe." };
    if (u.role === "desarrolladora" && !u.orgId) return { ok: false as const, error: "Elige la desarrolladora." };
    if (u.orgId) {
      const { data: org } = await service.from("orgs").select("id").eq("id", u.orgId).maybeSingle();
      if (!org) return { ok: false as const, error: "La desarrolladora no existe." };
    }
    const password = tempPassword();
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return { ok: false as const, error: error?.message.includes("already") ? "Ya existe un usuario con ese correo." : "No se pudo crear el usuario." };
    const profile = {
      id: data.user.id,
      name: u.name.trim(),
      email,
      role: u.role,
      ...(u.role !== "superadmin" && u.orgId ? { orgId: u.orgId } : {}),
      ...(u.role === "asesor" ? { asesorTipo: u.asesorTipo ?? "externo" } : {}),
      ...(u.company ? { company: u.company } : {}),
      phone: u.phone ?? "",
      mobile: u.phone ?? "",
      title: u.title ?? "",
      active: true,
      createdBy: who.user!.id,
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
    };
    const { error: e2 } = await service.from("profiles").insert({ id: data.user.id, data: profile });
    if (e2) {
      await service.auth.admin.deleteUser(data.user.id);
      return { ok: false as const, error: "No se pudo guardar el perfil." };
    }
    return { ok: true as const, user: profile, password };
  }

  if (body.action === "create" && body.user) return json(await create(body.user));

  if (body.action === "approve" && typeof body.applicationId === "string" && ID.test(body.applicationId)) {
    if (body.tipo !== undefined && body.tipo !== "interno" && body.tipo !== "externo") return json({ ok: false, error: "Tipo de acceso inválido." });
    const { data: ap } = await service.from("applications").select("data").eq("id", body.applicationId).single();
    if (!ap || ap.data.status !== "pendiente") return json({ ok: false, error: "La solicitud ya no está pendiente." });
    // Aprobar = asignar acceso: sin correo de acceso no se aprueba.
    const email = line(body.email, 160).toLowerCase();
    if (!EMAIL.test(email)) return json({ ok: false, error: "Asigna un correo de acceso válido." });
    const orgId: string | undefined = ap.data.orgId || undefined;
    const r = await create({ name: ap.data.name, email, phone: ap.data.phone, title: ap.data.title || "Asesor inmobiliario", role: "asesor", asesorTipo: orgId ? "externo" : (body.tipo ?? "externo"), orgId, company: ap.data.company || undefined });
    if (!r.ok) return json(r);
    await service.from("applications").update({ data: { ...ap.data, status: "aprobada", reviewedBy: who.user.id, reviewedAt: new Date().toISOString(), userId: r.user.id } }).eq("id", body.applicationId);
    return json(r);
  }

  return json({ ok: false, error: "Acción desconocida" }, 400);
});
