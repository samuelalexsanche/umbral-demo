"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadSimple, X, ImageSquare } from "@phosphor-icons/react";
import type { CreditId, Delivery, Listing, PropertyType } from "@/lib/types";
import { can, saveListing, useDB, useSessionUser } from "@/lib/db";
import { CREDITS } from "@/lib/seed";
import { MUNICIPIOS } from "@/lib/queries";
import { asset, TYPE_LABEL } from "@/lib/format";
import { Button, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { PageHead } from "@/components/panel/Shell";

const CENTER: Record<string, [number, number]> = {
  Guadalajara: [20.6737, -103.3474],
  Zapopan: [20.7214, -103.3918],
  "San Pedro Tlaquepaque": [20.6253, -103.3123],
  "Tlajomulco de Zúñiga": [20.4736, -103.4446],
  Tonalá: [20.6241, -103.2343],
  "El Salto": [20.5194, -103.1811],
};

type Form = {
  title: string; type: PropertyType; developmentId: string; description: string; price: string; delivery: Delivery; deliveryDate: string;
  unitsAvailable: string; unitsTotal: string; bedrooms: string; bathrooms: string; parking: string; m2Built: string; m2Land: string; levels: string;
  features: string; credits: CreditId[]; colonia: string; municipio: string; images: string[]; asesorId: string; orgId: string; featured: boolean;
};

const blank: Form = {
  title: "", type: "casa", developmentId: "", description: "", price: "", delivery: "entrega-inmediata", deliveryDate: "", unitsAvailable: "", unitsTotal: "",
  bedrooms: "3", bathrooms: "2", parking: "1", m2Built: "", m2Land: "", levels: "2", features: "", credits: ["bancario", "contado"], colonia: "", municipio: "Zapopan",
  images: [], asesorId: "", orgId: "", featured: false,
};

/** Redimensiona una foto en el navegador para no llenar el almacenamiento de la demo. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(1280, img.width);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = Math.round((img.height * w) / img.width);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.72));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function Editor() {
  const db = useDB();
  const me = useSessionUser();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [f, setF] = useState<Form>(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!me || loaded) return;
    const qid = new URLSearchParams(window.location.search).get("id");
    setId(qid);
    const l = qid ? db.listings.find((x) => x.id === qid) : null;
    if (l) {
      setF({
        title: l.title, type: l.type, developmentId: l.developmentId ?? "", description: l.description, price: String(l.price), delivery: l.delivery,
        deliveryDate: l.deliveryDate ?? "", unitsAvailable: l.unitsAvailable?.toString() ?? "", unitsTotal: l.unitsTotal?.toString() ?? "",
        bedrooms: String(l.bedrooms), bathrooms: String(l.bathrooms), parking: String(l.parking), m2Built: String(l.m2Built), m2Land: l.m2Land?.toString() ?? "",
        levels: String(l.levels), features: l.features.join(", "), credits: l.credits, colonia: l.colonia, municipio: l.municipio, images: l.images,
        asesorId: l.asesorId, orgId: l.orgId, featured: l.featured,
      });
    } else {
      const orgId = me.orgId ?? db.orgs[0].id;
      const asesorId = me.role === "asesor" ? me.id : me.role === "colaborador" ? me.managerId ?? "" : db.users.find((u) => u.orgId === orgId && u.role === "asesor")?.id ?? "";
      setF({ ...blank, orgId, asesorId, credits: db.orgs.find((o) => o.id === orgId)?.credits ?? blank.credits });
    }
    setLoaded(true);
  }, [me, db, loaded]);

  const org = db.orgs.find((o) => o.id === f.orgId);
  const devs = db.developments.filter((d) => d.orgId === f.orgId);
  const asesores = db.users.filter((u) => u.orgId === f.orgId && u.role === "asesor" && u.active);
  const library = useMemo(() => Array.from(new Set(db.developments.filter((d) => d.orgId === f.orgId).flatMap((d) => d.images))), [db, f.orgId]);
  const existing = id ? db.listings.find((x) => x.id === id) : undefined;

  if (!me || !loaded) return null;
  if (existing && !can.editListing(me, existing)) return <p className="text-ink-2">No puedes editar este inmueble.</p>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const inp = (k: keyof Form) => ({ value: f[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), "aria-invalid": !!err[k] });

  function pickDev(devId: string) {
    const d = db.developments.find((x) => x.id === devId);
    setF((x) => ({ ...x, developmentId: devId, ...(d ? { colonia: d.colonia, municipio: d.municipio, delivery: d.delivery, deliveryDate: d.deliveryDate ?? "", images: x.images.length ? x.images : d.images.slice(0, 3) } : {}) }));
  }

  async function upload(files: FileList | null) {
    if (!files) return;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      if (!file.type.startsWith("image/")) continue;
      try { urls.push(await shrink(file)); } catch { toast.error(`No se pudo leer ${file.name}`); }
    }
    setF((x) => ({ ...x, images: [...x.images, ...urls].slice(0, 12) }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 8) e.title = "Usa un título descriptivo de al menos 8 caracteres, por ejemplo 'Casa Encino en Bosque Arcada'.";
    if (!(Number(f.price) > 100000)) e.price = "Escribe el precio en pesos, sin puntos ni comas.";
    if (!(Number(f.m2Built) > 10)) e.m2Built = "Escribe los metros construidos.";
    if (f.description.trim().length < 40) e.description = "Describe el inmueble en al menos 40 caracteres: distribución, acabados y lo que lo hace distinto.";
    if (!f.colonia.trim()) e.colonia = "Escribe la colonia.";
    if (!f.credits.length) e.credits = "Elige al menos una forma de pago.";
    if (!f.images.length) e.images = "Agrega al menos una foto.";
    if (!f.asesorId) e.asesorId = "Asigna un asesor responsable.";
    if (f.delivery === "preventa" && !f.deliveryDate) e.deliveryDate = "Indica el mes estimado de entrega.";
    if (f.unitsAvailable && f.unitsTotal && Number(f.unitsAvailable) > Number(f.unitsTotal)) e.unitsAvailable = "No puede haber más disponibles que el total.";
    setErr(e);
    if (Object.keys(e).length) {
      toast.error("Revisa los campos marcados");
      document.querySelector("[aria-invalid=true]")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return !Object.keys(e).length;
  }

  function submit(status: Listing["status"]) {
    if (status !== "borrador" && !validate()) return;
    if (status === "borrador" && f.title.trim().length < 3) return setErr({ title: "Ponle al menos un nombre al borrador." });
    const d = db.developments.find((x) => x.id === f.developmentId);
    const c = d ? [d.lat, d.lng] : CENTER[f.municipio] ?? CENTER.Guadalajara;
    const jitter = () => (Math.random() - 0.5) * 0.004;
    const saved = saveListing(me!, {
      id: id ?? undefined,
      title: f.title.trim(), orgId: f.orgId, developmentId: f.developmentId || undefined, asesorId: f.asesorId, status,
      reviewNote: undefined, type: f.type, price: Number(f.price) || 0, bedrooms: Number(f.bedrooms), bathrooms: Number(f.bathrooms), parking: Number(f.parking),
      m2Built: Number(f.m2Built) || 0, m2Land: f.m2Land ? Number(f.m2Land) : undefined, levels: Number(f.levels) || 1, delivery: f.delivery,
      deliveryDate: f.delivery === "preventa" ? f.deliveryDate : undefined, unitsAvailable: f.unitsAvailable ? Number(f.unitsAvailable) : undefined,
      unitsTotal: f.unitsTotal ? Number(f.unitsTotal) : undefined, credits: f.credits, amenities: d?.amenities ?? [],
      features: f.features.split(",").map((s) => s.trim()).filter(Boolean), description: f.description.trim(), colonia: f.colonia.trim(), municipio: f.municipio,
      lat: existing?.lat ?? c[0] + jitter(), lng: existing?.lng ?? c[1] + jitter(), images: f.images, featured: f.featured,
    });
    if (!saved) return toast.error("No se pudo guardar. Puede que el navegador no tenga espacio para más fotos.");
    toast.success(status === "publicado" ? "Inmueble publicado" : status === "revision" ? "Enviado a revisión" : "Borrador guardado");
    router.push("/panel/inmuebles/");
  }

  const colab = me.role === "colaborador";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title={id ? "Editar inmueble" : colab ? "Nuevo borrador" : "Publicar inmueble"} sub={colab ? "Cuando lo envíes, tu asesor lo revisa y lo publica." : `Se publica en el perfil de ${org?.name ?? "la inmobiliaria"} y en el buscador.`} />
      <div className="grid gap-8">
        <Section title="Datos principales">
          {me.role === "superadmin" && (
            <Field label="Inmobiliaria" htmlFor="f-org">
              <Select id="f-org" value={f.orgId} onChange={(e) => setF((x) => ({ ...x, orgId: e.target.value, developmentId: "", asesorId: "" }))}>
                {db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Título" htmlFor="f-title" error={err.title} hint="Lo que verá el comprador en el buscador.">
            <Input id="f-title" {...inp("title")} maxLength={90} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="f-type">
              <Select id="f-type" value={f.type} onChange={(e) => set("type", e.target.value as PropertyType)}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Desarrollo" htmlFor="f-dev" hint="Al elegirlo se copian ubicación, entrega y amenidades.">
              <Select id="f-dev" value={f.developmentId} onChange={(e) => pickDev(e.target.value)}>
                <option value="">Inmueble independiente</option>
                {devs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Descripción" htmlFor="f-desc" error={err.description}>
            <Textarea id="f-desc" rows={5} {...inp("description")} maxLength={1500} />
          </Field>
        </Section>

        <Section title="Precio y disponibilidad">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio (MXN)" htmlFor="f-price" error={err.price}><Input id="f-price" inputMode="numeric" {...inp("price")} /></Field>
            <Field label="Unidades disponibles" htmlFor="f-ua" error={err.unitsAvailable} hint="Solo si es un modelo con varias unidades."><Input id="f-ua" inputMode="numeric" {...inp("unitsAvailable")} /></Field>
            <Field label="Unidades totales" htmlFor="f-ut"><Input id="f-ut" inputMode="numeric" {...inp("unitsTotal")} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entrega" htmlFor="f-del">
              <Select id="f-del" value={f.delivery} onChange={(e) => set("delivery", e.target.value as Delivery)}>
                <option value="entrega-inmediata">Entrega inmediata</option>
                <option value="preventa">Preventa</option>
              </Select>
            </Field>
            {f.delivery === "preventa" && <Field label="Mes estimado de entrega" htmlFor="f-dd" error={err.deliveryDate}><Input id="f-dd" type="month" {...inp("deliveryDate")} /></Field>}
          </div>
        </Section>

        <Section title="Características">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Recámaras" htmlFor="f-b"><Select id="f-b" {...inp("bedrooms")}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
            <Field label="Baños" htmlFor="f-ba"><Select id="f-ba" {...inp("bathrooms")}>{[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => <option key={n}>{n}</option>)}</Select></Field>
            <Field label="Estacionamientos" htmlFor="f-p"><Select id="f-p" {...inp("parking")}>{[0, 1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</Select></Field>
            <Field label="m² construidos" htmlFor="f-m2" error={err.m2Built}><Input id="f-m2" inputMode="numeric" {...inp("m2Built")} /></Field>
            <Field label="m² de terreno" htmlFor="f-m2l"><Input id="f-m2l" inputMode="numeric" {...inp("m2Land")} /></Field>
            <Field label="Niveles" htmlFor="f-lv"><Select id="f-lv" {...inp("levels")}>{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</Select></Field>
          </div>
          <Field label="Características destacadas" htmlFor="f-feat" hint="Separadas por coma: Jardín, Cocina con isla, Estudio"><Input id="f-feat" {...inp("features")} /></Field>
        </Section>

        <Section title="Formas de pago aceptadas">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Créditos">
            {CREDITS.map((c) => {
              const on = f.credits.includes(c.id);
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => set("credits", on ? f.credits.filter((x) => x !== c.id) : [...f.credits, c.id])} className={cx("press h-10 rounded-full px-4 text-sm font-semibold", on ? "bg-ink text-paper" : "border border-line bg-card text-ink-2")}>
                  {c.name}
                </button>
              );
            })}
          </div>
          {err.credits && <p className="text-xs font-medium text-bad">{err.credits}</p>}
        </Section>

        <Section title="Ubicación">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Colonia" htmlFor="f-col" error={err.colonia}><Input id="f-col" {...inp("colonia")} /></Field>
            <Field label="Municipio" htmlFor="f-mun"><Select id="f-mun" {...inp("municipio")}>{MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
          </div>
          <p className="text-xs text-ink-3">El mapa público muestra una ubicación aproximada. La dirección exacta la comparte el asesor.</p>
        </Section>

        <Section title="Fotos">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {f.images.map((src, i) => (
              <div key={src.slice(-40) + i} className="group relative overflow-hidden rounded-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(src)} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Portada</span>}
                <button type="button" onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="press absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card/95 shadow" aria-label="Quitar foto"><X size={14} /></button>
                {i > 0 && <button type="button" onClick={() => set("images", [src, ...f.images.filter((_, j) => j !== i)])} className="absolute inset-x-2 bottom-2 rounded-full bg-card/95 py-1 text-xs font-semibold opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100">Usar de portada</button>}
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="press grid aspect-[4/3] place-items-center rounded-[10px] border-2 border-dashed border-line text-sm font-semibold text-ink-2 hover:border-ink-3">
              <span className="grid place-items-center gap-1"><UploadSimple size={22} /> Subir fotos</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          {err.images && <p className="text-xs font-medium text-bad">{err.images}</p>}
          {library.length > 0 && (
            <div className="grid gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-2"><ImageSquare size={16} /> Biblioteca de {org?.name}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {library.map((src) => (
                  <button key={src} type="button" disabled={f.images.includes(src)} onClick={() => set("images", [...f.images, src])} className="press shrink-0 overflow-hidden rounded-[8px] disabled:opacity-30" aria-label="Agregar foto de la biblioteca">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset(src)} alt="" className="h-16 w-24 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Asignación">
          {me.role === "org_admin" || me.role === "superadmin" ? (
            <Field label="Asesor responsable" htmlFor="f-as" error={err.asesorId} hint="Recibe los prospectos de este inmueble.">
              <Select id="f-as" {...inp("asesorId")}>
                <option value="">Selecciona</option>
                {asesores.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
          ) : (
            <p className="text-ink-2">Asesor responsable: <strong className="text-ink">{db.users.find((u) => u.id === f.asesorId)?.name ?? "Sin asignar"}</strong></p>
          )}
          {(me.role === "org_admin" || me.role === "superadmin") && (
            <label className="flex items-center gap-2.5 text-sm font-medium"><input type="checkbox" className="size-4" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Destacar en la portada de Umbral</label>
          )}
        </Section>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <Button variant="ghost" onClick={() => router.push("/panel/inmuebles/")}>Cancelar</Button>
          <Button variant="outline" onClick={() => submit("borrador")}>Guardar borrador</Button>
          {colab ? <Button onClick={() => submit("revision")}>Enviar a revisión</Button> : <Button onClick={() => submit("publicado")}>Publicar</Button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
