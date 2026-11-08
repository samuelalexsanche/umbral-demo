"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Org } from "@/lib/types";
import { saveOrg, useDB, useSessionUser } from "@/lib/db";
import { CREDITS } from "@/lib/seed";
import { orgHref } from "@/lib/queries";
import { Button, Field, Input, OrgLogo, Textarea, cx } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

const COLORS = ["#2E3A45", "#3F5A3C", "#8A4B2A", "#5B4A6B", "#1F4E5F", "#6B3A3A", "#4A4A3A"];

export default function Perfil() {
  const db = useDB();
  const me = useSessionUser();
  const org = db.orgs.find((o) => o.id === me?.orgId);
  const [f, setF] = useState<Org | null>(null);
  useEffect(() => { if (org && !f) setF(structuredClone(org)); }, [org, f]);
  if (!me || !org || !f) return null;
  const set = <K extends keyof Org>(k: K, v: Org[K]) => setF({ ...f, [k]: v });
  return (
    <Guard roles={["desarrolladora"]}>
      <PageHead title="Perfil de la desarrolladora" sub="Lo que ve el comprador en tu página pública, lo que consultan los asesores y lo que usa tu agente de IA." actions={<Button variant="outline" href={orgHref(org)}>Ver perfil público</Button>} />
      <div className="mx-auto grid max-w-3xl gap-6 [&>*]:min-w-0">
        <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <OrgLogo org={f} size={64} />
            <div className="grid min-w-0 gap-2">
              <p className="text-sm font-semibold text-ink-2">Color de marca</p>
              <div className="flex flex-wrap gap-2">{COLORS.map((c) => <button key={c} aria-label={`Color ${c}`} aria-pressed={f.color === c} onClick={() => set("color", c)} className={cx("press size-8 rounded-full ring-offset-2", f.color === c && "ring-2 ring-ink")} style={{ background: c }} />)}</div>
            </div>
          </div>
          <Field label="Frase principal" htmlFor="p-t"><Input id="p-t" value={f.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={120} /></Field>
          <Field label="Descripción" htmlFor="p-d"><Textarea id="p-d" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Historia (currículum de la empresa)" htmlFor="p-hi" hint="Trayectoria, proyectos entregados, reconocimientos. Se publica en tu perfil."><Textarea id="p-hi" rows={6} value={f.history} onChange={(e) => set("history", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Desarrolla desde (año)" htmlFor="p-s"><Input id="p-s" inputMode="numeric" value={String(f.since)} onChange={(e) => set("since", Number(e.target.value.replace(/\D/g, "")) || f.since)} /></Field>
            <Field label="Proyectos realizados" htmlFor="p-pd"><Input id="p-pd" inputMode="numeric" value={f.projectsDone?.toString() ?? ""} onChange={(e) => set("projectsDone", Number(e.target.value.replace(/\D/g, "")) || undefined)} /></Field>
            <Field label="Sitio web" htmlFor="p-w"><Input id="p-w" value={f.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
          </div>
        </section>
        <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Teléfono" htmlFor="p-ph"><Input id="p-ph" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Correo" htmlFor="p-em"><Input id="p-em" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Dirección de la oficina de ventas" htmlFor="p-ad"><Input id="p-ad" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Horario" htmlFor="p-h"><Input id="p-h" value={f.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
        </section>
        <section className="grid gap-3 rounded-[14px] border border-line bg-card p-5">
          <p className="font-semibold">Formas de pago que acepta la empresa</p>
          <div className="flex flex-wrap gap-2">
            {CREDITS.map((c) => {
              const on = f.credits.includes(c.id);
              return <button key={c.id} type="button" aria-pressed={on} onClick={() => set("credits", on ? f.credits.filter((x) => x !== c.id) : [...f.credits, c.id])} className={cx("press h-10 rounded-full px-4 text-sm font-semibold", on ? "bg-ink text-paper" : "border border-line text-ink-2")}>{c.name}</button>;
            })}
          </div>
          <Field label="Condiciones de pago generales" htmlFor="p-pt" hint="Enganche, apartado, mensualidades durante obra. Cada desarrollo e inmueble puede tener las suyas."><Textarea id="p-pt" rows={3} value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></Field>
        </section>
        <section className="grid gap-2 rounded-[14px] border border-line bg-card p-5 text-sm">
          <p className="font-semibold">Verificación y sello verde</p>
          <p className="text-ink-2">{f.seal ? "Tu desarrolladora tiene el sello verde." : "Aún no tienes el sello verde."} Cumples {f.trust.filter((t) => t.ok).length} de {f.trust.length} criterios de confianza. Los revisa el administrador de Umbral con tus documentos.</p>
        </section>
        <div className="flex justify-end"><Button onClick={() => { saveOrg(me, f); toast.success("Perfil actualizado"); }}>Guardar perfil</Button></div>
      </div>
    </Guard>
  );
}
