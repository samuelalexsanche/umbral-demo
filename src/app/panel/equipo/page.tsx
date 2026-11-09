"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, CheckCircle } from "@phosphor-icons/react";
import type { AsesorTipo, Role, User } from "@/lib/types";
import { createUser, roleLabel, updateUser, useDB, useSessionUser, visibleUsers } from "@/lib/db";
import { SITE, relTime } from "@/lib/format";
import { Avatar, Badge, Button, Dialog, Field, Input, Select } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Equipo() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<{ user: User; password: string } | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", title: "", role: "asesor" as Role, orgId: "", asesorTipo: "interno" as AsesorTipo, company: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!me) return null;
  const users = visibleUsers(db, me);
  const roles: Role[] = ["asesor", "desarrolladora", "superadmin"];

  function start() {
    setF({ name: "", email: "", phone: "", title: "", role: "asesor", orgId: "", asesorTipo: "externo", company: "" });
    setErr({});
    setDone(null);
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Escribe nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = "Escribe un correo válido; será su usuario.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    setErr(er);
    if (Object.keys(er).length) return;
    if (f.role === "desarrolladora" && !f.orgId) return setErr({ name: "Elige la desarrolladora." });
    const r = await createUser(me!, { ...f, orgId: f.role === "desarrolladora" || (f.role === "asesor" && f.asesorTipo === "externo") ? f.orgId : undefined });
    if (!r.ok) return setErr({ email: r.error });
    setDone({ user: r.user, password: r.password });
  }
  const invite = done ? `Hola ${done.user.name.split(" ")[0]}, ya tienes acceso a Umbral como ${roleLabel(done.user).toLowerCase()}.\nEntra en ${SITE}/acceso/\nUsuario: ${done.user.email}\nContraseña temporal: ${done.password}\nTe pedirá cambiarla al entrar.` : "";

  const sub = "Todas las cuentas de la plataforma. Los asesores externos normalmente entran por solicitud; aquí puedes dar de alta directamente a asesores internos, usuarios de una desarrolladora u otros administradores.";

  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Usuarios" sub={sub} actions={<Button onClick={start}>Dar de alta</Button>} />
      <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-ink-3"><tr>{["Persona", "Rol", "Desarrolladora o empresa", "Alta", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u) => {
              const editable = u.id !== me.id;
              return (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold">{u.name}{u.id === me.id && " (tú)"}</p><p className="text-ink-3">{u.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge tone={u.role === "superadmin" ? "dark" : u.role === "desarrolladora" ? "brick" : "neutral"}>{roleLabel(u)}</Badge></td>
                  <td className="px-4 py-3 text-ink-2">{db.orgs.find((o) => o.id === u.orgId)?.name ?? u.company ?? "Umbral"}</td>
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
            <p className="flex items-center gap-2 text-ok"><CheckCircle size={22} weight="fill" /> Se creó el perfil de {done.user.name} como {roleLabel(done.user).toLowerCase()}.</p>
            <dl className="grid gap-2 rounded-[12px] bg-sunk p-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Usuario</dt><dd className="font-semibold">{done.user.email}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Contraseña temporal</dt><dd className="font-mono font-semibold">{done.password}</dd></div>
            </dl>
            <p className="text-sm text-ink-2">Envía la invitación por correo o WhatsApp. La contraseña temporal se cambia en el primer acceso.</p>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(invite); toast.success("Invitación copiada"); }}><Copy size={17} /> Copiar invitación</Button>
            <Button onClick={() => setOpen(false)}>Listo</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Rol" htmlFor="u-r" hint={f.role === "asesor" ? "Entra al portal de asesores. No da de alta ni modifica inventario." : f.role === "desarrolladora" ? "Administra el perfil, los desarrollos, el inventario y el material de su desarrolladora." : "Control total de la plataforma."}>
              <Select id="u-r" value={f.role} onChange={(e) => { const role = e.target.value as Role; setF({ ...f, role, orgId: role === "desarrolladora" ? db.orgs[0]?.id ?? "" : "" }); }}>{roles.map((r) => <option key={r} value={r}>{r === "asesor" ? "Asesor" : roleLabel({ role: r })}</option>)}</Select>
            </Field>
            {f.role === "asesor" && (
              <Field label="Tipo de asesor" htmlFor="u-t2" hint={f.asesorTipo === "interno" ? "Equipo de la plataforma: recibe prospectos." : "Asesor externo aprobado: consulta inventario, cotiza y descarga material."}>
                <Select id="u-t2" value={f.asesorTipo} onChange={(e) => setF({ ...f, asesorTipo: e.target.value as AsesorTipo })}><option value="interno">Interno de Umbral</option><option value="externo">De desarrolladora o independiente</option></Select>
              </Field>
            )}
            {f.role === "asesor" && f.asesorTipo === "externo" && (
              <Field label="Pertenece a" htmlFor="u-o2" hint={f.orgId ? "Queda como miembro de esa desarrolladora y aparece en su equipo." : "Asesor independiente, sin desarrolladora."}>
                <Select id="u-o2" value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })}><option value="">Independiente</option>{db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
              </Field>
            )}
            {f.role === "desarrolladora" && (
              <Field label="Desarrolladora" htmlFor="u-o"><Select id="u-o" value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })}>{db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
            )}
            <Field label="Nombre completo" htmlFor="u-n" error={err.name}><Input id="u-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} /></Field>
            <Field label="Correo" htmlFor="u-e" error={err.email}><Input id="u-e" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-invalid={!!err.email} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="u-p" error={err.phone}><Input id="u-p" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} aria-invalid={!!err.phone} /></Field>
              <Field label="Puesto (opcional)" htmlFor="u-t"><Input id="u-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={roleLabel(f)} /></Field>
            </div>
            <Button type="submit" size="lg">Crear perfil</Button>
          </form>
        )}
      </Dialog>
    </Guard>
  );
}
