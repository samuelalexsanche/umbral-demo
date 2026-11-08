"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Trash, UploadSimple, Eye } from "@phosphor-icons/react";
import type { Article, ArticleCategory } from "@/lib/types";
import { deleteArticle, saveArticle, useDB, useSessionUser } from "@/lib/db";
import { uploadFile } from "@/lib/files";
import { asset, relTime } from "@/lib/format";
import { CATEGORY, articleHref } from "@/components/site/News";
import { Badge, Button, Dialog, Empty, Field, Input, Select, Textarea } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

type F = Omit<Article, "id" | "slug" | "createdBy"> & { id?: string };

const ORG_CATS: ArticleCategory[] = ["avance", "lanzamiento", "proyectos"];
const ALL_CATS = Object.keys(CATEGORY) as ArticleCategory[];

export default function Publicaciones() {
  const db = useDB();
  const me = useSessionUser();
  const [f, setF] = useState<F | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  if (!me) return null;
  const admin = me.role === "superadmin";
  const cats = admin ? ALL_CATS : ORG_CATS;
  const list = db.articles.filter((a) => admin || a.orgId === me.orgId).sort((a, b) => b.date.localeCompare(a.date));

  const start = (a?: Article) =>
    setF(a ? { ...a } : { category: admin ? "mercado" : "avance", title: "", summary: "", body: "", published: true, date: new Date().toISOString(), orgId: admin ? undefined : me.orgId });

  async function onFile(fl: FileList | null) {
    const x = fl?.[0];
    if (!x) return;
    setBusy(true);
    const r = await uploadFile(x, "noticias");
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setF((v) => (v ? { ...v, image: r.url } : v));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    if (f.title.trim().length < 8) return toast.error("Escribe un título de al menos 8 caracteres.");
    if (f.summary.trim().length < 20) return toast.error("Escribe un resumen de al menos 20 caracteres.");
    if (["mercado", "financieras", "global"].includes(f.category) && !f.source?.trim()) return toast.error("Las noticias de mercado y financieras llevan fuente.");
    saveArticle(me!, { ...f, title: f.title.trim(), summary: f.summary.trim(), body: f.body.trim() });
    toast.success(f.published ? "Publicado" : "Guardado como borrador");
    setF(null);
  }
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((x) => (x ? { ...x, [k]: v } : x));

  return (
    <Guard roles={["superadmin", "desarrolladora"]}>
      <PageHead
        title={admin ? "Noticias" : "Noticias y avances"}
        sub={admin ? "Contenido informativo del mercado inmobiliario, noticias financieras, entrevistas y publicaciones de las desarrolladoras." : "Publica avances de obra, lanzamientos y noticias de tus proyectos. Aparecen en tu perfil y en Noticias."}
        actions={<Button onClick={() => start()}>Nueva publicación</Button>}
      />
      {list.length === 0 ? <Empty title="Aún no hay publicaciones" /> : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Publicación", "Categoría", "Autor", "Fecha", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="max-w-[340px] px-4 py-3 font-semibold">{a.title}</td>
                  <td className="px-4 py-3"><Badge>{CATEGORY[a.category]}</Badge></td>
                  <td className="px-4 py-3 text-ink-2">{db.orgs.find((o) => o.id === a.orgId)?.name ?? "Umbral"}</td>
                  <td className="px-4 py-3 text-ink-3">{relTime(a.date)}</td>
                  <td className="px-4 py-3">{a.published ? <Badge tone="ok">Publicado</Badge> : <Badge>Borrador</Badge>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {a.published && <Button size="sm" variant="ghost" href={articleHref(a)} aria-label="Ver"><Eye size={16} /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => start(a)} aria-label="Editar"><PencilSimple size={16} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { deleteArticle(me, a.id); toast("Publicación eliminada"); }} aria-label="Eliminar"><Trash size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!f} onClose={() => setF(null)} title={f?.id ? "Editar publicación" : "Nueva publicación"} wide>
        {f && (
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Categoría" htmlFor="ar-c"><Select id="ar-c" value={f.category} onChange={(e) => set("category", e.target.value as ArticleCategory)}>{cats.map((c) => <option key={c} value={c}>{CATEGORY[c]}</option>)}</Select></Field>
              {admin && <Field label="Desarrolladora (opcional)" htmlFor="ar-o"><Select id="ar-o" value={f.orgId ?? ""} onChange={(e) => setF({ ...f, orgId: e.target.value || undefined, developmentId: undefined })}><option value="">Umbral</option>{db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>}
              {f.orgId && <Field label="Desarrollo (opcional)" htmlFor="ar-d"><Select id="ar-d" value={f.developmentId ?? ""} onChange={(e) => set("developmentId", e.target.value || undefined)}><option value="">Toda la desarrolladora</option>{db.developments.filter((d) => d.orgId === f.orgId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>}
            </div>
            <Field label="Título" htmlFor="ar-t"><Input id="ar-t" value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={140} /></Field>
            <Field label="Resumen" htmlFor="ar-s"><Textarea id="ar-s" rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} maxLength={280} /></Field>
            <Field label="Contenido" htmlFor="ar-b" hint="Separa los párrafos con una línea en blanco."><Textarea id="ar-b" rows={8} value={f.body} onChange={(e) => set("body", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fuente" htmlFor="ar-f" hint="Obligatoria en noticias de mercado y financieras."><Input id="ar-f" value={f.source ?? ""} onChange={(e) => set("source", e.target.value)} placeholder="Banxico, SHF, INEGI…" /></Field>
              <Field label="Enlace a la fuente" htmlFor="ar-u"><Input id="ar-u" value={f.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://" /></Field>
            </div>
            {f.category === "entrevista" && <Field label="Entrevistado y especialidad" htmlFor="ar-a"><Input id="ar-a" value={f.author ?? ""} onChange={(e) => set("author", e.target.value)} placeholder="Arq. Nombre Apellido, arquitecta" /></Field>}
            <div className="flex flex-wrap items-center gap-3">
              {f.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(f.image)} alt="" className="h-16 w-24 rounded-[8px] object-cover" />
              )}
              <Button type="button" variant="outline" onClick={() => file.current?.click()} disabled={busy}><UploadSimple size={17} /> {busy ? "Subiendo…" : f.image ? "Cambiar imagen" : "Agregar imagen"}</Button>
              <input ref={file} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files)} />
              <label className="ml-auto flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Publicar</label>
            </div>
            <Button type="submit" size="lg">Guardar</Button>
          </form>
        )}
      </Dialog>
    </Guard>
  );
}
