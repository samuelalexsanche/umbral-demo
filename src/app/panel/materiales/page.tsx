"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash, UploadSimple } from "@phosphor-icons/react";
import type { MaterialKind } from "@/lib/types";
import { deleteMaterial, saveMaterial, useDB, useSessionUser } from "@/lib/db";
import { uploadFile } from "@/lib/files";
import { asset } from "@/lib/format";
import { Badge, Button, Dialog, Empty, Field, Input, Select } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";
import { KIND } from "@/components/panel/labels";

export default function Materiales() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", kind: "brochure" as MaterialKind, developmentId: "", url: "", thumb: "", orgId: "" });
  const file = useRef<HTMLInputElement>(null);
  if (!me) return null;
  const orgs = me.role === "superadmin" ? db.orgs : db.orgs.filter((o) => o.id === me.orgId);
  const list = db.materials.filter((m) => me.role === "superadmin" || m.orgId === me.orgId);

  async function onFile(fl: FileList | null) {
    const x = fl?.[0];
    if (!x) return;
    setBusy(true);
    const r = await uploadFile(x, "material");
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setF((v) => ({ ...v, url: r.url, thumb: x.type.startsWith("image/") ? r.url : v.thumb, title: v.title || x.name.replace(/\.[^.]+$/, "") }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3) return toast.error("Escribe un título.");
    if (!f.url.trim()) return toast.error("Sube un archivo o pega un enlace.");
    saveMaterial(me!, { orgId: f.orgId || orgs[0]?.id, developmentId: f.developmentId || undefined, kind: f.kind, title: f.title.trim(), url: f.url.trim(), thumb: f.thumb || undefined });
    toast.success("Material publicado para los asesores");
    setOpen(false);
  }

  return (
    <Guard roles={["superadmin", "desarrolladora"]}>
      <PageHead title="Material descargable" sub="Lo que suba aquí aparece en Descargas del portal de asesores." actions={<Button onClick={() => { setF({ title: "", kind: "brochure", developmentId: "", url: "", thumb: "", orgId: orgs[0]?.id ?? "" }); setOpen(true); }}>Subir material</Button>} />
      {list.length === 0 ? <Empty title="Aún no hay material" /> : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Material", "Tipo", "Desarrollo", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><a href={asset(m.url)} target="_blank" rel="noopener" className="flex items-center gap-3 font-semibold hover:underline">
                    {m.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset(m.thumb)} alt="" className="h-10 w-14 rounded-[6px] object-cover" />
                    ) : <span className="grid h-10 w-14 place-items-center rounded-[6px] bg-sunk text-ink-3">{(() => { const I = KIND[m.kind].icon; return <I size={18} />; })()}</span>}
                    {m.title}</a></td>
                  <td className="px-4 py-3"><Badge>{KIND[m.kind].label}</Badge></td>
                  <td className="px-4 py-3 text-ink-2">{db.developments.find((d) => d.id === m.developmentId)?.name ?? "General"}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => { deleteMaterial(me, m.id); toast("Material eliminado"); }} aria-label={`Eliminar ${m.title}`}><Trash size={16} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Subir material">
        <form onSubmit={submit} className="grid gap-4">
          {orgs.length > 1 && <Field label="Desarrolladora" htmlFor="mt-o"><Select id="mt-o" value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value, developmentId: "" })}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="mt-k"><Select id="mt-k" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as MaterialKind })}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></Field>
            <Field label="Desarrollo" htmlFor="mt-d"><Select id="mt-d" value={f.developmentId} onChange={(e) => setF({ ...f, developmentId: e.target.value })}><option value="">General de la desarrolladora</option>{db.developments.filter((d) => d.orgId === (f.orgId || orgs[0]?.id)).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          </div>
          <Field label="Título" htmlFor="mt-t"><Input id="mt-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={() => file.current?.click()} disabled={busy}><UploadSimple size={17} /> {busy ? "Subiendo…" : "Subir archivo"}</Button>
            <input ref={file} type="file" hidden onChange={(e) => onFile(e.target.files)} />
            <Field label="o pega un enlace" htmlFor="mt-u" hint="Para videos y archivos pesados: enlace de Drive, Dropbox o YouTube."><Input id="mt-u" value={f.url.startsWith("data:") ? "Archivo cargado" : f.url} onChange={(e) => setF({ ...f, url: e.target.value })} readOnly={f.url.startsWith("data:")} /></Field>
          </div>
          <Button type="submit" size="lg">Publicar</Button>
        </form>
      </Dialog>
    </Guard>
  );
}
