"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import type { Course, CourseKind } from "@/lib/types";
import { deleteCourse, saveCourse, useDB, useSessionUser } from "@/lib/db";
import { Badge, Button, Dialog, Empty, Field, Input, Select, Textarea } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";
import { COURSE_KIND } from "@/components/panel/labels";

type F = Omit<Course, "id" | "createdAt"> & { id?: string };

export default function AcademiaAdmin() {
  const db = useDB();
  const me = useSessionUser();
  const [f, setF] = useState<F | null>(null);
  if (!me) return null;
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((x) => (x ? { ...x, [k]: v } : x));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f || f.title.trim().length < 5) return toast.error("Escribe un título.");
    saveCourse(me!, { ...f, title: f.title.trim(), summary: f.summary.trim(), body: f.body.trim() });
    toast.success("Guardado en la academia");
    setF(null);
  }
  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Academia" sub="Cursos de bienes raíces, capacitación de proyectos y eventos que ven los asesores en su portal." actions={<Button onClick={() => setF({ kind: "curso", title: "", summary: "", body: "", published: true })}>Agregar</Button>} />
      {db.courses.length === 0 ? <Empty title="La academia está vacía" /> : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Título", "Tipo", "Proyecto", "Estado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {db.courses.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.title}</td>
                  <td className="px-4 py-3"><Badge>{COURSE_KIND[c.kind].label}</Badge></td>
                  <td className="px-4 py-3 text-ink-2">{db.developments.find((d) => d.id === c.developmentId)?.name ?? "-"}</td>
                  <td className="px-4 py-3">{c.published ? <Badge tone="ok">Visible</Badge> : <Badge>Oculto</Badge>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setF({ ...c })} aria-label="Editar"><PencilSimple size={16} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { deleteCourse(me, c.id); toast("Eliminado"); }} aria-label="Eliminar"><Trash size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!f} onClose={() => setF(null)} title={f?.id ? "Editar" : "Agregar a la academia"} wide>
        {f && (
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" htmlFor="co-k"><Select id="co-k" value={f.kind} onChange={(e) => set("kind", e.target.value as CourseKind)}>{Object.entries(COURSE_KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></Field>
              <Field label="Proyecto (opcional)" htmlFor="co-d"><Select id="co-d" value={f.developmentId ?? ""} onChange={(e) => { const d = db.developments.find((x) => x.id === e.target.value); setF({ ...f, developmentId: d?.id, orgId: d?.orgId }); }}><option value="">General</option>{db.developments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
            </div>
            <Field label="Título" htmlFor="co-t"><Input id="co-t" value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Resumen" htmlFor="co-s"><Textarea id="co-s" rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
            <Field label="Contenido" htmlFor="co-b"><Textarea id="co-b" rows={6} value={f.body} onChange={(e) => set("body", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Duración" htmlFor="co-du"><Input id="co-du" value={f.duration ?? ""} onChange={(e) => set("duration", e.target.value)} placeholder="45 min" /></Field>
              <Field label="Fecha (eventos)" htmlFor="co-fe"><Input id="co-fe" type="date" value={f.date?.slice(0, 10) ?? ""} onChange={(e) => set("date", e.target.value || undefined)} /></Field>
              <Field label="Lugar (eventos)" htmlFor="co-l"><Input id="co-l" value={f.place ?? ""} onChange={(e) => set("place", e.target.value)} /></Field>
            </div>
            <Field label="Enlace al contenido (video, presentación, registro)" htmlFor="co-u"><Input id="co-u" value={f.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://" /></Field>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Visible para los asesores</label>
            <Button type="submit" size="lg">Guardar</Button>
          </form>
        )}
      </Dialog>
    </Guard>
  );
}
