"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle } from "@phosphor-icons/react";
import type { Role, User } from "@/lib/types";
import { can, createUser, ROLE_LABEL, updateUser, useDB, useSessionUser, visibleUsers } from "@/lib/db";
import { SITE, relTime } from "@/lib/format";
import { Avatar, Badge, Button, Dialog, Field, Input, Select } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Equipo() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<{ user: User; password: string } | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", title: "", role: "asesor" as Role, orgId: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!me) return null;
  const users = visibleUsers(db, me);
  const roles = (["org_admin", "asesor", "colaborador"] as Role[]).filter((r) => can.createUser(me, r));

  function start() {
    setF({ name: "", email: "", phone: "", title: "", role: roles.includes("asesor") ? "asesor" : roles[0], orgId: me!.orgId ?? db.orgs[0].id });
    setErr({});
    setDone(null);
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Escribe nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = "Escribe un correo válido; será su usuario.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = createUser(me!, f);
    if (!r.ok) return setErr({ email: r.error });
    setDone({ user: r.user, password: r.password });
  }
  const invite = done ? `Hola ${done.user.name.split(" ")[0]}, ya tienes acceso a Umbral como ${ROLE_LABEL[done.user.role].toLowerCase()}.\nEntra en ${SITE}/acceso/\nUsuario: ${done.user.email}\nContraseña temporal: ${done.password}\nTe pedirá cambiarla al entrar.` : "";

  const sub = me.role === "asesor"
    ? "Tus colaboradores crean borradores que tú revisas y publicas."
    : me.role === "org_admin"
      ? "Da de alta asesores y colaboradores. Cada alta genera su perfil con rol y una contraseña temporal."
      : "Todos los usuarios de la plataforma.";

  return (
    <Guard roles={["superadmin", "org_admin", "asesor"]}>
      <PageHead title={me.role === "asesor" ? "Mis colaboradores" : "Equipo"} sub={sub} actions={roles.length ? <Button onClick={start}>Dar de alta</Button> : undefined} />
      <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-ink-3"><tr>{["Persona", "Rol", ...(me.role === "superadmin" ? ["Inmobiliaria"] : []), "Reporta a", "Alta", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u) => {
              const editable = u.id !== me.id && (me.role === "superadmin" || (me.role === "org_admin" && u.role !== "org_admin") || (me.role === "asesor" && u.managerId === me.id));
              return (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold">{u.name}{u.id === me.id && " (tú)"}</p><p className="text-ink-3">{u.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge tone={u.role === "superadmin" ? "dark" : u.role === "org_admin" ? "brick" : "neutral"}>{ROLE_LABEL[u.role]}</Badge></td>
                  {me.role === "superadmin" && <td className="px-4 py-3 text-ink-2">{db.orgs.find((o) => o.id === u.orgId)?.name ?? "Umbral"}</td>}
                  <td className="px-4 py-3 text-ink-2">{db.users.find((x) => x.id === u.managerId)?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink-3">{relTime(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.active ? <Badge tone="ok">Activo</Badge> : <Badge tone="bad">Desactivado</Badge>}{u.mustChangePassword && <span className="ml-2 text-xs text-warn">Contraseña temporal</span>}</td>
                  <td className="px-4 py-3 text-right">{editable && <Button size="sm" variant="ghost" onClick={() => { updateUser(me, u.id, { active: !u.active }); toast(u.active ? "Cuenta desactivada" : "Cuenta reactivada"); }}>{u.active ? "Desactivar" : "Reactivar"}</Button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={done ? "Perfil creado" : "Dar de alta"}>
        {done ? (
          <div className="grid gap-4">
            <p className="flex items-center gap-2 text-ok"><CheckCircle size={22} weight="fill" /> Se creó el perfil de {done.user.name} como {ROLE_LABEL[done.user.role].toLowerCase()}.</p>
            <dl className="grid gap-2 rounded-[12px] bg-sunk p-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Usuario</dt><dd className="font-semibold">{done.user.email}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Contraseña temporal</dt><dd className="font-mono font-semibold">{done.password}</dd></div>
            </dl>
            <p className="text-sm text-ink-2">En producción esta invitación se envía por correo o WhatsApp. En la demo, cópiala y entra con esos datos para probar el rol.</p>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(invite); toast.success("Invitación copiada"); }}><Copy size={17} /> Copiar invitación</Button>
            <Button onClick={() => setOpen(false)}>Listo</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Rol" htmlFor="u-r" hint={f.role === "colaborador" ? "Crea borradores; necesita revisión para publicar." : f.role === "asesor" ? "Publica inmuebles y atiende sus prospectos." : "Administra la inmobiliaria completa."}>
              <Select id="u-r" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>
            </Field>
            {me.role === "superadmin" && (
              <Field label="Inmobiliaria" htmlFor="u-o"><Select id="u-o" value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })}>{db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
            )}
            <Field label="Nombre completo" htmlFor="u-n" error={err.name}><Input id="u-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} /></Field>
            <Field label="Correo" htmlFor="u-e" error={err.email}><Input id="u-e" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-invalid={!!err.email} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="u-p" error={err.phone}><Input id="u-p" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} aria-invalid={!!err.phone} /></Field>
              <Field label="Puesto (opcional)" htmlFor="u-t"><Input id="u-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={ROLE_LABEL[f.role]} /></Field>
            </div>
            <Button type="submit" size="lg">Crear perfil</Button>
          </form>
        )}
      </Dialog>
    </Guard>
  );
}
