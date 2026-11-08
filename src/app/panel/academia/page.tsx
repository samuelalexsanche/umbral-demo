"use client";
import { useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { COURSE_KIND } from "@/components/panel/labels";
import type { Course, CourseKind } from "@/lib/types";
import { can, useDB, useSessionUser } from "@/lib/db";
import { Badge, Button, Dialog, Empty, cx } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";


export default function Academia() {
  const db = useDB();
  const me = useSessionUser();
  const [kind, setKind] = useState<CourseKind | "">("");
  const [open, setOpen] = useState<Course | null>(null);
  if (!me) return null;
  const list = db.courses.filter((c) => c.published && (!kind || c.kind === kind));
  return (
    <Guard roles={["asesor", "superadmin"]} allow={can.usePortal}>
      <PageHead title="Academia" sub="Cursos de bienes raíces, capacitación de cada proyecto y eventos para asesores." />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["", "curso", "capacitacion", "evento"] as const).map((k) => (
          <button key={k || "todo"} onClick={() => setKind(k)} aria-pressed={kind === k} className={cx("press h-9 rounded-full px-3.5 text-sm font-semibold", kind === k ? "bg-ink text-paper" : "border border-line bg-card text-ink-2")}>{k ? COURSE_KIND[k].label : "Todo"}</button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="Aún no hay contenido aquí" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const K = COURSE_KIND[c.kind];
            const d = db.developments.find((x) => x.id === c.developmentId);
            return (
              <button key={c.id} onClick={() => setOpen(c)} className="lift grid content-start gap-3 rounded-[14px] border border-line bg-card p-5 text-left">
                <span className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-[10px] bg-ink text-paper"><K.icon size={20} /></span><Badge>{K.label}</Badge></span>
                <p className="font-display text-lg font-semibold">{c.title}</p>
                <p className="text-sm text-ink-2">{c.summary}</p>
                <p className="text-xs text-ink-3">{[d?.name, c.duration, c.date && new Date(c.date).toLocaleDateString("es-MX", { day: "numeric", month: "long" }), c.place].filter(Boolean).join(" · ")}</p>
              </button>
            );
          })}
        </div>
      )}
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} wide>
        {open && (
          <div className="grid gap-4">
            <p className="text-ink-2">{open.summary}</p>
            <div className="grid gap-3 text-[15px] leading-relaxed">{open.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
            {open.url && <Button href={open.url} external variant="outline"><ArrowSquareOut size={17} /> Abrir contenido</Button>}
          </div>
        )}
      </Dialog>
    </Guard>
  );
}
