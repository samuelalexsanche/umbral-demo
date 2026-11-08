// Edge Function de Supabase: alta de usuarios y aprobación de asesores.
// Crear cuentas de Auth necesita la llave de servicio, que nunca va en el navegador.
// Solo responde si quien llama es un administrador general activo.
// Despliegue: supabase functions deploy admin-users
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const words = ["casa", "patio", "llave", "nogal", "teja", "jardin", "cantera", "roble", "torre", "plaza"];
const tempPassword = () => `${words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length]}-${1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000)}-${crypto.randomUUID().slice(0, 4)}`;

type NewUser = { name: string; email: string; phone?: string; title?: string; role: "superadmin" | "desarrolladora" | "asesor"; orgId?: string; asesorTipo?: "interno" | "externo"; company?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: who } = await service.auth.getUser(jwt);
  if (!who.user) return json({ ok: false, error: "Sesión no válida" }, 401);
  const { data: me } = await service.from("profiles").select("role, active").eq("id", who.user.id).single();
  if (!me || me.role !== "superadmin" || !me.active) return json({ ok: false, error: "Solo el administrador general da de alta usuarios." }, 403);

  let body: { action: string; user?: NewUser; applicationId?: string; tipo?: "interno" | "externo" };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Solicitud inválida" }, 400);
  }

  async function create(u: NewUser) {
    const email = u.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false as const, error: "Correo inválido." };
    if (u.role === "desarrolladora" && !u.orgId) return { ok: false as const, error: "Elige la desarrolladora." };
    const password = tempPassword();
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return { ok: false as const, error: error?.message.includes("already") ? "Ya existe un usuario con ese correo." : error?.message ?? "No se pudo crear el usuario." };
    const profile = {
      id: data.user.id,
      name: u.name.trim(),
      email,
      role: u.role,
      ...(u.role === "desarrolladora" ? { orgId: u.orgId } : {}),
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

  if (body.action === "approve" && body.applicationId) {
    const { data: ap } = await service.from("applications").select("data").eq("id", body.applicationId).single();
    if (!ap || ap.data.status !== "pendiente") return json({ ok: false, error: "La solicitud ya no está pendiente." });
    const r = await create({ name: ap.data.name, email: ap.data.email, phone: ap.data.phone, title: "Asesor inmobiliario", role: "asesor", asesorTipo: body.tipo ?? "externo", company: ap.data.company || undefined });
    if (!r.ok) return json(r);
    await service.from("applications").update({ data: { ...ap.data, status: "aprobada", reviewedBy: who.user.id, userId: r.user.id } }).eq("id", body.applicationId);
    return json(r);
  }

  return json({ ok: false, error: "Acción desconocida" }, 400);
});
