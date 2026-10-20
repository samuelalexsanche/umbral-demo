"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Delivery, Development } from "@/lib/types";
import { can, saveDevelopment, useDB, useSessionUser } from "@/lib/db";
import { devHref, MUNICIPIOS } from "@/lib/queries";
import { asset, deliveryLabel } from "@/lib/format";
import { Button, Dialog, Empty, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

const CENTER: Record<string, [number, number]> = { Guadalajara: [20.6737, -103.3474], Zapopan: [20.7214, -103.3918], "San Pedro Tlaquepaque": [20.6253, -103.3123], "Tlajomulco de Zúñiga": [20.4736, -103.4446], Tonalá: [20.6241, -103.2343], "El Salto": [20.5194, -103.1811] };
type F = Omit<Development, "id" | "slug" | "createdAt" | "lat" | "lng"> & { id?: string };

export default function Desarrollos() {
  const db = useDB();
  const me = useSessionUser();
  const [f, setF] = useState<F | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  if (!me) return null;
  const orgId = me.orgId ?? db.orgs[0].id;
  const devs = db.developments.filter((d) => me.role === "superadmin" || d.orgId === me.orgId);

  function edit(d?: Development) {
    setErr({});
    setF(d ? { ...d } : { name: "", orgId, kind: "fraccionamiento", colonia: "", municipio: "Zapopan", description: "", amenities: [], delivery: "preventa", deliveryDate: "", progress: 0, totalUnits: 0, images: [] });
  }
  function save() {
    if (!f) return;
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Escribe el nombre del desarrollo.";
    if (!f.colonia.trim()) e.colonia = "Escribe la colonia.";
    if (f.description.trim().length < 30) e.description = "Describe el desarrollo en al menos 30 caracteres.";
    setErr(e);
    if (Object.keys(e).length) return;
    const prev = f.id ? db.developments.find((d) => d.id === f.id) : undefined;
    const c = CENTER[f.municipio];
    saveDevelopment(me!, { ...f, lat: prev?.lat ?? c[0], lng: prev?.lng ?? c[1], images: f.images.length ? f.images : ["/img/desarrolladores-maqueta.jpg"] });
    toast.success(f.id ? "Desarrollo actualizado" : "Desarrollo creado");
    setF(null);
  }

  return (
    <Guard roles={["superadmin", "org_admin"]}>
      <PageHead title="Desarrollos" sub="Fraccionamientos, torres y privadas. Los inmuebles se publican como modelos dentro de cada desarrollo." actions={<Button onClick={() => edit()}>Nuevo desarrollo</Button>} />
      {devs.length === 0 ? <Empty title="Aún no hay desarrollos" /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {devs.map((d) => (
            <article key={d.id} className="overflow-hidden rounded-[14px] border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(d.images[0])} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="grid gap-2 p-5">
                <p className="font-display text-xl font-semibold">{d.name}</p>
                <p className="text-sm text-ink-2">{d.colonia}, {d.municipio} · {deliveryLabel(d.delivery, d.deliveryDate)}</p>
                <div className="grid gap-1"><div className="flex justify-between text-sm"><span className="text-ink-3">Avance de obra</span><span className="font-semibold tabular">{d.progress}%</span></div><div className="h-1.5 rounded-full bg-sunk"><div className="h-full rounded-full bg-ink" style={{ width: `${d.progress}%` }} /></div></div>
                <p className="text-sm text-ink-2">{db.listings.filter((l) => l.developmentId === d.id).length} modelos publicados · {d.totalUnits} unidades</p>
                <div className="mt-2 flex gap-2">
                  {can.manageDevelopments(me, d.orgId) && <Button size="sm" variant="outline" onClick={() => edit(d)}>Editar</Button>}
                  <Button size="sm" variant="ghost" href={devHref(d)}>Ver página</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!f} onClose={() => setF(null)} title={f?.id ? "Editar desarrollo" : "Nuevo desarrollo"} wide>
        {f && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="d-n" error={err.name}><Input id="d-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-invalid={!!err.name} /></Field>
              <Field label="Tipo" htmlFor="d-k"><Select id="d-k" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Development["kind"] })}><option value="fraccionamiento">Fraccionamiento</option><option value="torre">Torre de departamentos</option><option value="privada">Privada</option></Select></Field>
              <Field label="Colonia" htmlFor="d-c" error={err.colonia}><Input id="d-c" value={f.colonia} onChange={(e) => setF({ ...f, colonia: e.target.value })} aria-invalid={!!err.colonia} /></Field>
              <Field label="Municipio" htmlFor="d-m"><Select id="d-m" value={f.municipio} onChange={(e) => setF({ ...f, municipio: e.target.value })}>{MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <Field label="Entrega" htmlFor="d-e"><Select id="d-e" value={f.delivery} onChange={(e) => setF({ ...f, delivery: e.target.value as Delivery })}><option value="preventa">Preventa</option><option value="entrega-inmediata">Entrega inmediata</option></Select></Field>
              {f.delivery === "preventa" && <Field label="Mes de entrega" htmlFor="d-dd"><Input id="d-dd" type="month" value={f.deliveryDate ?? ""} onChange={(e) => setF({ ...f, deliveryDate: e.target.value })} /></Field>}
              <Field label={`Avance de obra: ${f.progress}%`} htmlFor="d-p"><input id="d-p" type="range" min={0} max={100} step={5} value={f.progress} onChange={(e) => setF({ ...f, progress: Number(e.target.value) })} /></Field>
              <Field label="Unidades totales" htmlFor="d-u"><Input id="d-u" inputMode="numeric" value={f.totalUnits || ""} onChange={(e) => setF({ ...f, totalUnits: Number(e.target.value) || 0 })} /></Field>
            </div>
            <Field label="Descripción" htmlFor="d-de" error={err.description}><Textarea id="d-de" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} aria-invalid={!!err.description} /></Field>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-ink-2">Amenidades</p>
              <div className="flex flex-wrap gap-2">
                {db.amenities.map((a) => {
                  const on = f.amenities.includes(a);
                  return <button key={a} type="button" aria-pressed={on} onClick={() => setF({ ...f, amenities: on ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] })} className={cx("press h-9 rounded-full px-3.5 text-sm", on ? "bg-ink text-paper" : "border border-line text-ink-2")}>{a}</button>;
                })}
              </div>
            </div>
            <p className="text-sm text-ink-3">Las fotos del desarrollo se agregan desde sus modelos o, en producción, desde una galería propia.</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setF(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></div>
          </div>
        )}
      </Dialog>
    </Guard>
  );
}
