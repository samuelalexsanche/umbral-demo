"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy } from "@phosphor-icons/react";
import type { AdvisorApplication, AsesorTipo, ApplicationStatus } from "@/lib/types";
import { approveApplication, rejectApplication, roleLabel, updateUser, useDB, useSessionUser } from "@/lib/db";
import { relTime, SITE } from "@/lib/format";
import { Avatar, Badge, Button, Dialog, Empty, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

const TABS: { id: ApplicationStatus | "activos"; label: string }[] = [
  { id: "pendiente", label: "Por aprobar" },
  { id: "activos", label: "Asesores" },
  { id: "aprobada", label: "Aprobadas" },
  { id: "rechazada", label: "Rechazadas" },
];

export default function Asesores() {
  const db = useDB();
  const me = useSessionUser();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pendiente");
  const [open, setOpen] = useState<AdvisorApplication | null>(null);
  const [tipo, setTipo] = useState<AsesorTipo | "">("");
  const [access, setAccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<{ email: string; password: string; name: string } | null>(null);
  if (!me) return null;
  const apps = db.applications.filter((a) => a.status === tab);
  const advisors = db.users.filter((u) => u.role === "asesor");

  async function approve() {
    if (!open!.orgId && !tipo) return toast.error("Elige el tipo de acceso.");
    setBusy(true);
    const r = await approveApplication(me!, open!.id, (tipo || "externo") as AsesorTipo, access);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setDone({ email: r.user.email, password: r.password, name: r.user.name });
  }

  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Asesores" sub="Aquí llegan dos tipos de solicitud: asesores independientes que la mandan desde /asesores, y desarrolladoras que piden dar de alta a asesores de su equipo. Para aprobar se asigna un acceso; sin acceso nadie entra." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => {
          const n = t.id === "activos" ? advisors.length : db.applications.filter((a) => a.status === t.id).length;
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cx("press h-9 rounded-full px-4 text-sm font-semibold", tab === t.id ? "bg-ink text-paper" : "border border-line bg-card text-ink-2")}>
              {t.label} <span className="tabular opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {tab === "activos" ? (
        advisors.length === 0 ? <Empty title="Aún no hay asesores" /> : (
          <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-ink-3"><tr>{["Asesor", "Pertenece a", "Tipo", "Prospectos", "Alta", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {advisors.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold">{u.name}</p><p className="text-ink-3">{u.email} · {u.mobile || u.phone}</p></div></div></td>
                    <td className="px-4 py-3 text-ink-2">{u.orgId ? db.orgs.find((o) => o.id === u.orgId)?.name : "Independiente"}</td>
                    <td className="px-4 py-3">
                      {u.orgId ? <Badge>De la desarrolladora</Badge> : <Select aria-label={`Tipo de ${u.name}`} value={u.asesorTipo ?? "externo"} onChange={(e) => { updateUser(me, u.id, { asesorTipo: e.target.value as AsesorTipo }); toast(`${u.name} ahora es asesor ${e.target.value}`); }} className="h-9 w-auto">
                        <option value="interno">Interno</option>
                        <option value="externo">Independiente</option>
                      </Select>}
                    </td>
                    <td className="px-4 py-3 tabular">{db.leads.filter((l) => l.asesorId === u.id).length}</td>
                    <td className="px-4 py-3 text-ink-3">{relTime(u.createdAt)}</td>
                    <td className="px-4 py-3">{u.active ? <Badge tone="ok">Activo</Badge> : <Badge tone="bad">Desactivado</Badge>}</td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => { updateUser(me, u.id, { active: !u.active }); toast(u.active ? "Acceso retirado" : "Acceso devuelto"); }}>{u.active ? "Retirar acceso" : "Devolver acceso"}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line px-4 py-3 text-xs text-ink-3">Internos: equipo de la plataforma, reciben prospectos por turnos. Externos: consultan inventario, cotizan, descargan material y toman la academia.</p>
          </div>
        )
      ) : apps.length === 0 ? (
        <Empty title={tab === "pendiente" ? "No hay solicitudes por aprobar" : "Sin solicitudes en esta lista"}>Las solicitudes llegan desde la página pública de asesores.</Empty>
      ) : (
        <div className="grid gap-3">
          {apps.map((a) => (
            <div key={a.id} className="grid gap-3 rounded-[14px] border border-line bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex items-start gap-3">
                <Avatar name={a.name} size={44} />
                <div className="grid gap-1 text-sm">
                  <p className="font-semibold">{a.name} <span className="font-normal text-ink-3">· {relTime(a.createdAt)}</span></p>
                  <p className="text-ink-2">{a.email} · {a.phone}</p>
                  {a.orgId ? (
                    <p><Badge tone="brick">Equipo de {db.orgs.find((o) => o.id === a.orgId)?.name ?? "una desarrolladora"}</Badge> <span className="text-ink-3">Pedido por {db.users.find((u) => u.id === a.requestedBy)?.name ?? "la desarrolladora"} · {a.title}</span></p>
                  ) : (
                    <p className="text-ink-2"><Badge>Independiente</Badge> {[a.company, a.experience, a.zone].filter(Boolean).join(" · ")}</p>
                  )}
                  {a.message && <p className="text-ink-2">“{a.message}”</p>}
                  {a.reviewNote && <p className="text-bad">Motivo: {a.reviewNote}</p>}
                  {a.status === "aprobada" && (() => { const u = db.users.find((x) => x.id === a.userId); return <p className="text-ok">Aprobada{u ? ` como ${roleLabel(u).toLowerCase()}, acceso ${u.email}` : ""}</p>; })()}
                </div>
              </div>
              {a.status === "pendiente" && <Button onClick={() => { setOpen(a); setTipo(""); setAccess(a.email); setNote(""); setDone(null); }}>Revisar</Button>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!open} onClose={() => setOpen(null)} title={done ? "Asesor aprobado" : `Solicitud de ${open?.name ?? ""}`}>
        {done ? (
          <div className="grid gap-4">
            <p>{done.name} ya tiene acceso al portal de asesores.</p>
            <dl className="grid gap-2 rounded-[12px] bg-sunk p-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Usuario</dt><dd className="font-semibold">{done.email}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Contraseña temporal</dt><dd className="font-mono font-semibold">{done.password}</dd></div>
            </dl>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(`Hola ${done.name.split(" ")[0]}, tu solicitud para el portal de asesores de Umbral fue aprobada.\nEntra en ${SITE}/acceso/\nUsuario: ${done.email}\nContraseña temporal: ${done.password}\nTe pedirá cambiarla al entrar.`); toast.success("Invitación copiada"); }}><Copy size={17} /> Copiar invitación</Button>
            <Button onClick={() => setOpen(null)}>Listo</Button>
          </div>
        ) : open && (
          <div className="grid gap-4">
            {open.orgId && <p className="rounded-[12px] bg-sunk p-3 text-sm">Entrará como asesor de <strong>{db.orgs.find((o) => o.id === open.orgId)?.name}</strong> y aparecerá en su equipo en la página.</p>}
            <Field label="Correo de acceso" htmlFor="ap-e" hint="Será su usuario para entrar. Se genera una contraseña temporal que cambia al primer acceso.">
              <Input id="ap-e" type="email" required value={access} onChange={(e) => setAccess(e.target.value)} />
            </Field>
            {!open.orgId && (
              <Field label="Tipo de acceso" htmlFor="ap-t" hint={tipo === "interno" ? "Equipo de la plataforma: recibe prospectos por turnos." : tipo === "externo" ? "Consulta inventario, cotiza, descarga material y toma la academia." : "Obligatorio para aprobar."}>
                <Select id="ap-t" required value={tipo} onChange={(e) => setTipo(e.target.value as AsesorTipo)}>
                  <option value="">Elige el tipo de acceso</option>
                  <option value="externo">Asesor independiente</option>
                  <option value="interno">Asesor interno de Umbral</option>
                </Select>
              </Field>
            )}
            <Button onClick={approve} disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(access.trim()) || (!open.orgId && !tipo)}>Asignar acceso y aprobar</Button>
            <div className="grid gap-2 border-t border-line pt-4">
              <Field label="Motivo del rechazo (uso interno)" htmlFor="ap-n"><Textarea id="ap-n" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <Button variant="outline" onClick={() => { rejectApplication(me, open.id, note.trim()); setOpen(null); toast("Solicitud rechazada"); }}>Rechazar</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Guard>
  );
}
