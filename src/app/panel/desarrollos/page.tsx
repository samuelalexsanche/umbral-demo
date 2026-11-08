"use client";

import { useRef, useState } from "react";
import { UploadSimple, X } from "@phosphor-icons/react";
import { uploadFile } from "@/lib/files";
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
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!me) return null;
  const orgId = me.orgId ?? db.orgs[0]?.id ?? "";
  const devs = db.developments.filter((d) => me.role === "superadmin" || d.orgId === me.orgId);

  function edit(d?: Development) {
    setErr({});
    setF(d ? { ...d } : { name: "", orgId, kind: "torre", colonia: "", municipio: "Guadalajara", description: "", typologies: "", amenities: [], delivery: "preventa", deliveryDate: "", progress: 0, totalUnits: 0, images: [] });
  }
  function save() {
    if (!f) return;
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Escribe el nombre del desarrollo.";
    if (!f.colonia.trim()) e.colonia = "Escribe la colonia.";
    if (f.description.trim().length < 30) e.description = "Describe el desarrollo en al menos 30 caracteres.";
    if (!f.images.length) e.images = "Agrega al menos una imagen.";
    setErr(e);
    if (Object.keys(e).length) return;
    const prev = f.id ? db.developments.find((d) => d.id === f.id) : undefined;
    const c = CENTER[f.municipio];
    saveDevelopment(me!, { ...f, lat: prev?.lat ?? c[0], lng: prev?.lng ?? c[1], images: f.images });
    toast.success(f.id ? "Desarrollo actualizado" : "Desarrollo creado");
    setF(null);
  }

  return (
    <Guard roles={["superadmin", "desarrolladora"]}>
      <PageHead title="Desarrollos" sub="Torres, privadas y fraccionamientos. Lo que cambies aquí (precio desde, avance, condiciones) se ve al momento en el sitio y en el portal de asesores." actions={<Button onClick={() => edit()}>Nuevo desarrollo</Button>} />
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
                <p className="text-sm text-ink-2">{db.listings.filter((l) => l.developmentId === d.id && l.status === "publicado").length} fichas publicadas{d.totalUnits ? ` · ${d.totalUnits} unidades` : ""}</p>
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
              <Field label="Precio desde (MXN)" htmlFor="d-pf"><Input id="d-pf" inputMode="numeric" value={f.priceFrom ? String(f.priceFrom) : ""} onChange={(e) => setF({ ...f, priceFrom: Number(e.target.value.replace(/\D/g, "")) || undefined })} /></Field>
              <Field label="Tipologías" htmlFor="d-ty"><Input id="d-ty" value={f.typologies ?? ""} onChange={(e) => setF({ ...f, typologies: e.target.value })} placeholder="Estudio, 1 y 2 recámaras" /></Field>
              <Field label="Dirección" htmlFor="d-ad"><Input id="d-ad" value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
              <Field label="Condiciones de pago" htmlFor="d-pt"><Input id="d-pt" value={f.paymentTerms ?? ""} onChange={(e) => setF({ ...f, paymentTerms: e.target.value })} placeholder="Enganche desde 10%" /></Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm font-medium"><input type="checkbox" className="size-4" checked={!!f.launch} onChange={(e) => setF({ ...f, launch: e.target.checked })} /> Mostrar como nuevo lanzamiento en el perfil</label>
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
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-ink-2">Imágenes (la primera es la portada)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {f.images.map((src, i) => (
                  <div key={src.slice(-30) + i} className="relative overflow-hidden rounded-[8px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset(src)} alt={`Imagen ${i + 1}`} className="aspect-square w-full object-cover" />
                    <button type="button" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} className="press absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-card/95 shadow" aria-label="Quitar imagen"><X size={13} /></button>
                  </div>
                ))}
                <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="press grid aspect-square place-items-center rounded-[8px] border-2 border-dashed border-line text-xs font-semibold text-ink-2"><span className="grid place-items-center gap-1"><UploadSimple size={20} />{busy ? "Subiendo…" : "Subir"}</span></button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 10);
                setBusy(true);
                const urls: string[] = [];
                for (const x of files) { const r = await uploadFile(x, "desarrollos"); if (r.ok) urls.push(r.url); else toast.error(r.error); }
                setBusy(false);
                setF((v) => (v ? { ...v, images: [...v.images, ...urls] } : v));
              }} />
              {err.images && <p className="text-xs font-medium text-bad">{err.images}</p>}
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setF(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></div>
          </div>
        )}
      </Dialog>
    </Guard>
  );
}
