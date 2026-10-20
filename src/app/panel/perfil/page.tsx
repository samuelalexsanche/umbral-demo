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
    <Guard roles={["org_admin"]}>
      <PageHead title="Perfil de la inmobiliaria" sub="Lo que ve el comprador en tu página pública y lo que usa tu agente de IA." actions={<Button variant="outline" href={orgHref(org)}>Ver perfil público</Button>} />
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
        </section>
        <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Teléfono" htmlFor="p-ph"><Input id="p-ph" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Correo" htmlFor="p-em"><Input id="p-em" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Dirección de la oficina de ventas" htmlFor="p-ad"><Input id="p-ad" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Horario" htmlFor="p-h"><Input id="p-h" value={f.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
        </section>
        <section className="grid gap-3 rounded-[14px] border border-line bg-card p-5">
          <p className="font-semibold">Créditos que acepta la empresa</p>
          <div className="flex flex-wrap gap-2">
            {CREDITS.map((c) => {
              const on = f.credits.includes(c.id);
              return <button key={c.id} type="button" aria-pressed={on} onClick={() => set("credits", on ? f.credits.filter((x) => x !== c.id) : [...f.credits, c.id])} className={cx("press h-10 rounded-full px-4 text-sm font-semibold", on ? "bg-ink text-paper" : "border border-line text-ink-2")}>{c.name}</button>;
            })}
          </div>
        </section>
        <div className="flex justify-end"><Button onClick={() => { saveOrg(me, f); toast.success("Perfil actualizado"); }}>Guardar perfil</Button></div>
      </div>
    </Guard>
  );
}
