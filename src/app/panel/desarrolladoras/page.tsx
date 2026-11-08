"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SealCheck, Copy, Leaf } from "@phosphor-icons/react";
import type { Org, TrustCriterion } from "@/lib/types";
import { createUser, saveOrg, uid, useDB, useSessionUser } from "@/lib/db";
import { orgHref } from "@/lib/queries";
import { SITE } from "@/lib/format";
import { Badge, Button, Dialog, Field, Input, OrgLogo } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Desarrolladoras() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", adminName: "", adminEmail: "", adminPhone: "" });
  const [trustOrg, setTrustOrg] = useState<Org | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ email: string; password: string; org: string } | null>(null);
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("nueva");
    if (n) { setF((x) => ({ ...x, name: n })); setOpen(true); }
  }, []);
  if (!me) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = "Escribe el nombre comercial.";
    if (f.adminName.trim().length < 3) er.adminName = "Escribe el nombre del administrador.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.adminEmail)) er.adminEmail = "Escribe un correo válido.";
    if (db.users.some((u) => u.email === f.adminEmail.trim().toLowerCase())) er.adminEmail = "Ese correo ya tiene cuenta.";
    setErr(er);
    if (Object.keys(er).length) return;
    const org = saveOrg(me!, { name: f.name.trim(), trust: DEFAULT_TRUST(), color: ["#2E3A45", "#3F5A3C", "#8A4B2A", "#5B4A6B", "#1F4E5F"][db.orgs.length % 5] });
    if (!org) return;
    const r = createUser(me!, { name: f.adminName, email: f.adminEmail, phone: f.adminPhone || "33 0000 0000", title: "Dirección comercial", role: "desarrolladora", orgId: org.id });
    if (r.ok) setDone({ email: r.user.email, password: r.password, org: org.name });
  }

  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Desarrolladoras" sub="Alta, verificación, sello verde y suspensión de las desarrolladoras que publican en Umbral." actions={<Button onClick={() => { setDone(null); setOpen(true); }}>Nueva desarrolladora</Button>} />
      <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-ink-3"><tr>{["Desarrolladora", "Inmuebles", "Usuarios", "Prospectos", "Verificación", "Confianza", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {db.orgs.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3"><Link href={orgHref(o)} className="flex items-center gap-3 font-semibold hover:underline"><OrgLogo org={o} size={36} /> {o.name}</Link></td>
                <td className="px-4 py-3 tabular">{db.listings.filter((l) => l.orgId === o.id && l.status === "publicado").length}</td>
                <td className="px-4 py-3 tabular">{db.users.filter((u) => u.orgId === o.id).length}</td>
                <td className="px-4 py-3 tabular">{db.leads.filter((l) => l.orgId === o.id).length}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { saveOrg(me, { id: o.id, name: o.name, verified: !o.verified }); toast(o.verified ? "Verificación retirada" : "Desarrolladora verificada"); }} className="press inline-flex items-center gap-1.5">
                    {o.verified ? <Badge tone="ok"><SealCheck size={13} weight="fill" /> Verificada</Badge> : <Badge tone="warn">Pendiente</Badge>}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setTrustOrg(o)} className="press inline-flex items-center gap-1.5 text-left">
                    {o.seal ? <Badge tone="ok"><Leaf size={13} weight="fill" /> Sello verde</Badge> : <Badge>{o.trust.filter((t) => t.ok).length}/{o.trust.length} criterios</Badge>}
                  </button>
                </td>
                <td className="px-4 py-3">{o.status === "activa" ? <Badge tone="ok">Activa</Badge> : <Badge tone="bad">Suspendida</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { saveOrg(me, { id: o.id, name: o.name, status: o.status === "activa" ? "suspendida" : "activa" }); toast(o.status === "activa" ? "Suspendida: su perfil e inventario dejan de verse" : "Reactivada"); }}>{o.status === "activa" ? "Suspender" : "Reactivar"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-3">Toca la etiqueta de verificación para otorgarla o retirarla, y la de confianza para revisar criterios y el sello verde. Suspender oculta el perfil, su inventario y bloquea el acceso de su equipo.</p>

      <Dialog open={open} onClose={() => setOpen(false)} title={done ? "Desarrolladora creada" : "Nueva desarrolladora"}>
        {done ? (
          <div className="grid gap-4">
            <p>Se creó <strong>{done.org}</strong> con su usuario. Desde su panel completa el perfil, sus desarrollos, el inventario y el material para asesores.</p>
            <dl className="grid gap-2 rounded-[12px] bg-sunk p-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Usuario</dt><dd className="font-semibold">{done.email}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-3">Contraseña temporal</dt><dd className="font-mono font-semibold">{done.password}</dd></div>
            </dl>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(`Ya tienes acceso a Umbral como ${done.org}.\n${SITE}/acceso/\nUsuario: ${done.email}\nContraseña temporal: ${done.password}`); toast.success("Invitación copiada"); }}><Copy size={17} /> Copiar invitación</Button>
            <Button onClick={() => setOpen(false)}>Listo</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Nombre comercial" htmlFor="o-n" error={err.name}><Input id="o-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} /></Field>
            <p className="pt-2 font-semibold">Responsable de la cuenta</p>
            <Field label="Nombre" htmlFor="o-an" error={err.adminName}><Input id="o-an" value={f.adminName} onChange={(e) => setF({ ...f, adminName: e.target.value })} aria-invalid={!!err.adminName} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Correo" htmlFor="o-ae" error={err.adminEmail}><Input id="o-ae" type="email" value={f.adminEmail} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} aria-invalid={!!err.adminEmail} /></Field>
              <Field label="Teléfono" htmlFor="o-ap"><Input id="o-ap" type="tel" value={f.adminPhone} onChange={(e) => setF({ ...f, adminPhone: e.target.value })} /></Field>
            </div>
            <Button type="submit" size="lg">Crear desarrolladora y su usuario</Button>
          </form>
        )}
      </Dialog>
      <TrustDialog org={trustOrg && db.orgs.find((o) => o.id === trustOrg.id)} onClose={() => setTrustOrg(null)} />
    </Guard>
  );
}

const DEFAULT_TRUST = (): TrustCriterion[] => [
  "Identidad y razón social verificadas",
  "Más de 10 años de trayectoria",
  "Proyectos entregados comprobables",
  "Permisos de construcción vigentes por proyecto",
  "Avance de obra publicado cada mes",
].map((label) => ({ id: uid("t"), label, ok: false }));

function TrustDialog({ org, onClose }: { org: Org | null | undefined; onClose: () => void }) {
  const me = useSessionUser();
  const [label, setLabel] = useState("");
  if (!me || !org) return <Dialog open={false} onClose={onClose} title="">{null}</Dialog>;
  const set = (trust: TrustCriterion[], seal = org.seal) => saveOrg(me, { id: org.id, name: org.name, trust, seal });
  const okCount = org.trust.filter((t) => t.ok).length;
  return (
    <Dialog open onClose={onClose} title={`Confianza: ${org.name}`}>
      <div className="grid gap-4">
        <p className="text-sm text-ink-2">La calificación que ve el comprador es la cantidad de criterios cumplidos. El sello verde lo otorgas tú cuando la desarrolladora cumple lo que la plataforma exige.</p>
        <ul className="grid gap-2">
          {org.trust.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 text-sm">
              <input type="checkbox" checked={t.ok} onChange={() => set(org.trust.map((x) => (x.id === t.id ? { ...x, ok: !x.ok } : x)))} className="size-4 accent-[var(--color-ink)]" aria-label={t.label} />
              <span className="flex-1">{t.label}</span>
              <button onClick={() => set(org.trust.filter((x) => x.id !== t.id))} className="text-ink-3 hover:text-bad" aria-label={`Quitar ${t.label}`}>Quitar</button>
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) { set([...org.trust, { id: uid("t"), label: label.trim(), ok: false }]); setLabel(""); } }} className="flex gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Agregar criterio" aria-label="Nuevo criterio" />
          <Button type="submit" variant="outline">Agregar</Button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-sunk p-4">
          <p className="text-sm"><strong>{okCount} de {org.trust.length}</strong> criterios cumplidos</p>
          <Button variant={org.seal ? "outline" : "dark"} onClick={() => { set(org.trust, !org.seal); toast(org.seal ? "Sello verde retirado" : "Sello verde otorgado"); }}>
            <Leaf size={17} weight="fill" /> {org.seal ? "Retirar sello verde" : "Otorgar sello verde"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
