"use client";
import { useEffect, useState } from "react";
import { DownloadSimple, ArrowSquareOut } from "@phosphor-icons/react";
import { KIND } from "@/components/panel/labels";
import type { MaterialKind } from "@/lib/types";
import { can, useDB, useSessionUser } from "@/lib/db";
import { asset } from "@/lib/format";
import { Badge, Empty, Select, cx } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";


export default function Descargas() {
  const db = useDB();
  const me = useSessionUser();
  const [dev, setDev] = useState("");
  const [kind, setKind] = useState<MaterialKind | "">("");
  useEffect(() => setDev(new URLSearchParams(window.location.search).get("d") ?? ""), []);
  if (!me) return null;
  const list = db.materials.filter((m) => (!dev || m.developmentId === dev) && (!kind || m.kind === kind));

  return (
    <Guard roles={["asesor", "desarrolladora", "superadmin"]} allow={can.usePortal}>
      <PageHead title="Descargas" sub="Material de venta de cada desarrollo: brochure, renders, videos y publicidad. Lo sube y actualiza la desarrolladora." />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select aria-label="Desarrollo" value={dev} onChange={(e) => setDev(e.target.value)} className="w-auto">
          <option value="">Todos los desarrollos</option>
          {db.developments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        {(["", "brochure", "render", "video", "publicidad"] as const).map((k) => (
          <button key={k || "todo"} onClick={() => setKind(k)} aria-pressed={kind === k} className={cx("press h-9 rounded-full px-3.5 text-sm font-semibold", kind === k ? "bg-ink text-paper" : "border border-line bg-card text-ink-2")}>
            {k ? KIND[k].label : "Todo"}
          </button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="Sin material con ese filtro">La desarrolladora todavía no sube material de este tipo.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((m) => {
            const K = KIND[m.kind];
            const external = /^https?:/.test(m.url);
            const d = db.developments.find((x) => x.id === m.developmentId);
            return (
              <a key={m.id} href={asset(m.url)} target="_blank" rel="noopener" download={!external || undefined} className="lift grid overflow-hidden rounded-[14px] border border-line bg-card">
                <div className="relative aspect-[4/3] overflow-hidden bg-sunk">
                  {m.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset(m.thumb)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-ink-3"><K.icon size={42} /></span>
                  )}
                  <Badge className="absolute left-2 top-2" tone="dark"><K.icon size={12} /> {K.label}</Badge>
                </div>
                <div className="flex items-center gap-2 p-3.5 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{m.title}</p><p className="text-ink-3">{d?.name ?? db.orgs.find((o) => o.id === m.orgId)?.name}</p></div>
                  {external ? <ArrowSquareOut size={18} className="shrink-0 text-ink-3" /> : <DownloadSimple size={18} className="shrink-0 text-ink-3" />}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </Guard>
  );
}
