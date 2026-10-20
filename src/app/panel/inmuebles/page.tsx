"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Eye, Trash, Pause, Play, CheckCircle, Copy } from "@phosphor-icons/react";
import { can, deleteListing, saveListing, setListingStatus, useDB, useSessionUser, visibleListings } from "@/lib/db";
import { listingHref, orgOf, userOf } from "@/lib/queries";
import { asset, money, relTime } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { Badge, Button, Dialog, Empty, Input, Select } from "@/components/ui";
import { PageHead, STATUS } from "@/components/panel/Shell";

export default function Inmuebles() {
  const db = useDB();
  const me = useSessionUser();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [del, setDel] = useState<Listing | null>(null);
  if (!me) return null;
  const all = visibleListings(db, me);
  const list = all.filter((l) => (!st || l.status === st) && (!q || l.title.toLowerCase().includes(q.toLowerCase())));

  function duplicate(l: Listing) {
    const { id, slug, views, createdAt, updatedAt, createdBy, ...rest } = l;
    void id; void slug; void views; void createdAt; void updatedAt; void createdBy;
    saveListing(me!, { ...rest, title: `${l.title} (copia)`, status: "borrador" });
    toast.success("Copia creada como borrador");
  }

  return (
    <div>
      <PageHead
        title={me.role === "colaborador" ? "Mis borradores" : me.role === "asesor" ? "Mis inmuebles" : "Inmuebles"}
        sub={me.role === "colaborador" ? "Crea borradores y envíalos a revisión. Tu asesora los publica." : `${all.length} inmuebles en total.`}
        actions={<Button href="/panel/inmuebles/editar/">{me.role === "colaborador" ? "Nuevo borrador" : "Publicar inmueble"}</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Buscar" placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select aria-label="Estado" value={st} onChange={(e) => setSt(e.target.value)} className="w-auto">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label} ({all.filter((l) => l.status === k).length})</option>)}
        </Select>
      </div>
      {list.length === 0 ? (
        <Empty title="Sin inmuebles con ese filtro" action={<Button href="/panel/inmuebles/editar/">Crear inmueble</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line text-ink-3">
              <tr>{["Inmueble", "Precio", "Estado", "Asesor", "Vistas", "Actualizado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const edit = can.editListing(me, l);
                return (
                  <tr key={l.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(l.images[0] ?? "/img/bosque-arcada-fachada.jpg")} alt="" className="h-12 w-16 shrink-0 rounded-[8px] object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{l.title}</p>
                          <p className="text-ink-3">{me.role === "superadmin" ? `${orgOf(db, l.orgId)?.name} · ` : ""}{l.colonia}, {l.municipio}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular">{money(l.price)}</td>
                    <td className="px-4 py-3"><Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>{l.reviewNote && <p className="mt-1 max-w-[180px] text-xs text-warn">{l.reviewNote}</p>}</td>
                    <td className="px-4 py-3 text-ink-2">{userOf(db, l.asesorId)?.name ?? "Sin asignar"}</td>
                    <td className="px-4 py-3 tabular text-ink-2">{l.views}</td>
                    <td className="px-4 py-3 text-ink-3">{relTime(l.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn label="Ver ficha" href={listingHref(l)}><Eye size={17} /></IconBtn>
                        {edit && <IconBtn label="Editar" href={`/panel/inmuebles/editar/?id=${l.id}`}><PencilSimple size={17} /></IconBtn>}
                        {edit && can.publishDirectly(me) && l.status === "publicado" && <IconBtn label="Pausar" onClick={() => { setListingStatus(me, l.id, "pausado"); toast("Inmueble pausado"); }}><Pause size={17} /></IconBtn>}
                        {edit && can.publishDirectly(me) && (l.status === "pausado" || l.status === "borrador") && <IconBtn label="Publicar" onClick={() => { setListingStatus(me, l.id, "publicado"); toast.success("Inmueble publicado"); }}><Play size={17} /></IconBtn>}
                        {edit && can.publishDirectly(me) && l.status === "publicado" && <IconBtn label="Marcar vendido" onClick={() => { setListingStatus(me, l.id, "vendido"); toast("Marcado como vendido"); }}><CheckCircle size={17} /></IconBtn>}
                        {me.role !== "colaborador" && <IconBtn label="Duplicar" onClick={() => duplicate(l)}><Copy size={17} /></IconBtn>}
                        {edit && <IconBtn label="Eliminar" onClick={() => setDel(l)}><Trash size={17} /></IconBtn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!del} onClose={() => setDel(null)} title="¿Eliminar este inmueble?">
        <p className="text-ink-2">Vas a eliminar <strong className="text-ink">{del?.title}</strong>. Los prospectos que ya llegaron se conservan, pero la ficha dejará de existir.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { deleteListing(me, del!.id); setDel(null); toast("Inmueble eliminado"); }}>Eliminar</Button>
        </div>
      </Dialog>
    </div>
  );
}

function IconBtn({ label, href, onClick, children }: { label: string; href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "press grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-sunk hover:text-ink";
  return href ? <Link href={href} className={cls} aria-label={label} title={label}>{children}</Link> : <button onClick={onClick} className={cls} aria-label={label} title={label}>{children}</button>;
}
