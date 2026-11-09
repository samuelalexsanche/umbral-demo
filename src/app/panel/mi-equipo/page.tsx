"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { requestTeamMember, roleLabel, useDB, useSessionUser } from "@/lib/db";
import { orgHref } from "@/lib/queries";
import { relTime } from "@/lib/format";
import { Avatar, Badge, Button, Dialog, Empty, Field, Input, Textarea } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

const TONE = { pendiente: "warn", aprobada: "ok", rechazada: "bad" } as const;
const LABEL = { pendiente: "En revisión", aprobada: "Aprobada", rechazada: "Rechazada" } as const;

export default function MiEquipo() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", title: "", message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!me) return null;
  const org = db.orgs.find((o) => o.id === me.orgId);
  const members = db.users.filter((u) => u.orgId === me.orgId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const requests = db.applications.filter((a) => a.orgId === me.orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Escribe nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = "Escribe un correo válido.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const r = await requestTeamMember(me!, f);
    setBusy(false);
    if (!r.ok) return setErr({ email: r.error });
    toast.success("Solicitud enviada al administrador");
    setOpen(false);
  }

  return (
    <Guard roles={["desarrolladora"]}>
      <PageHead
        title="Mi equipo"
        sub={`Asesores de ${org?.name ?? "tu desarrolladora"}. Para sumar a alguien, envía la solicitud: el administrador general la revisa y le asigna su acceso. Al aprobarse aparece en tu perfil público.`}
        actions={<Button onClick={() => { setF({ name: "", email: "", phone: "", title: "", message: "" }); setErr({}); setOpen(true); }}>Solicitar alta de asesor</Button>}
      />

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-semibold">Miembros <span className="tabular text-ink-3">{members.length}</span></h2>
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Persona", "Rol", "Alta", "Estado"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold">{u.name}{u.id === me.id && " (tú)"}</p><p className="text-ink-3">{u.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge tone={u.role === "desarrolladora" ? "brick" : "neutral"}>{roleLabel(u)}</Badge></td>
                  <td className="px-4 py-3 text-ink-3">{relTime(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.active ? <Badge tone="ok">Activo</Badge> : <Badge tone="bad">Sin acceso</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {org && <p className="mt-2 text-xs text-ink-3">Los asesores activos se muestran en <Link className="font-semibold underline" href={orgHref(org)}>tu perfil público</Link>.</p>}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Solicitudes</h2>
        {requests.length === 0 ? (
          <Empty title="Aún no has enviado solicitudes" />
        ) : (
          <ul className="grid gap-3">
            {requests.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-card p-4 text-sm">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.name} <span className="font-normal text-ink-3">· {a.title}</span></p>
                  <p className="text-ink-3">{a.email} · enviada {relTime(a.createdAt)}{a.reviewedAt ? ` · revisada ${relTime(a.reviewedAt)}` : ""}</p>
                  {a.status === "rechazada" && a.reviewNote && <p className="text-bad">Motivo: {a.reviewNote}</p>}
                </div>
                <Badge tone={TONE[a.status]}>{LABEL[a.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={open} onClose={() => setOpen(false)} title="Solicitar alta de asesor">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field label="Nombre completo" htmlFor="t-n" error={err.name}><Input id="t-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} /></Field>
          <Field label="Correo" htmlFor="t-e" error={err.email} hint="El administrador lo usará para asignarle su acceso."><Input id="t-e" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-invalid={!!err.email} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" htmlFor="t-p" error={err.phone}><Input id="t-p" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} aria-invalid={!!err.phone} /></Field>
            <Field label="Puesto (opcional)" htmlFor="t-t"><Input id="t-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Asesor inmobiliario" /></Field>
          </div>
          <Field label="Nota para el administrador (opcional)" htmlFor="t-m"><Textarea id="t-m" rows={2} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          <Button type="submit" size="lg" disabled={busy}>Enviar solicitud</Button>
        </form>
      </Dialog>
    </Guard>
  );
}
