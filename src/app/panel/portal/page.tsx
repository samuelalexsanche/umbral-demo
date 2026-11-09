"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { FilePdf, Eye, DownloadSimple, CaretDown } from "@phosphor-icons/react";
import { can, useDB, useSessionUser } from "@/lib/db";
import { devHref, listingHref, orgOf } from "@/lib/queries";
import { asset, deliveryLabel, money, moneyShort, priceLabel, relTime } from "@/lib/format";
import { Badge, Button, Empty, Input, OrgLogo, Select } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

/** Inventario en tiempo real para asesores: lo que la desarrolladora cambia se ve aquí al momento. */
export default function Portal() {
  const db = useDB();
  const me = useSessionUser();
  const [q, setQ] = useState("");
  const [dev, setDev] = useState("");
  const [beds, setBeds] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  if (!me) return null;
  const devs = db.developments.filter((d) => orgOf(db, d.orgId)?.status === "activa");
  const units = db.listings.filter((l) => (l.status === "publicado" || l.status === "vendido") && orgOf(db, l.orgId)?.status === "activa");
  const shown = units.filter((l) => (!dev || l.developmentId === dev) && (!beds || l.bedrooms >= beds) && (!q || `${l.title} ${l.colonia}`.toLowerCase().includes(q.toLowerCase())));
  const updated = units.reduce((m, l) => (l.updatedAt > m ? l.updatedAt : m), "");

  return (
    <Guard roles={["asesor", "superadmin"]} allow={can.usePortal}>
      <PageHead
        title="Inventario"
        sub={`Información en tiempo real de ${devs.length} desarrollos. ${updated ? `Último cambio de una desarrolladora: ${relTime(updated)}.` : ""}`}
        actions={<Button href="/panel/cotizar/" variant="dark"><FilePdf size={18} /> Nueva cotización</Button>}
      />

      <div className="-mx-4 mb-10 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
        {devs.map((d) => {
          const org = orgOf(db, d.orgId)!;
          const avail = units.filter((l) => l.developmentId === d.id && l.status === "publicado");
          return (
            <div key={d.id} className="grid w-[280px] shrink-0 overflow-hidden rounded-[14px] border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(d.images[0])} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="grid gap-1.5 p-4 text-sm">
                <p className="flex items-center gap-2 font-display text-lg font-semibold"><OrgLogo org={org} size={22} className="rounded-md" /> {d.name}</p>
                <p className="text-ink-2">{d.colonia}, {d.municipio}</p>
                <p className="text-ink-2">{deliveryLabel(d.delivery, d.deliveryDate)}{d.progress ? ` · ${d.progress}% de obra` : ""}</p>
                {d.typologies && <p className="text-ink-2">{d.typologies}</p>}
                <p className="font-semibold">{d.priceFrom ? `Desde ${moneyShort(d.priceFrom)}` : "Precio por confirmar"} · {avail.length} {avail.length === 1 ? "ficha" : "fichas"}</p>
                {d.paymentTerms && <p className="text-xs text-ink-3">{d.paymentTerms}</p>}
                <div className="mt-1 flex gap-2">
                  <Button size="sm" variant="outline" href={devHref(d)}><Eye size={15} /> Ver</Button>
                  <Button size="sm" variant="ghost" href={`/panel/descargas/?d=${d.id}`}><DownloadSimple size={15} /> Material</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Buscar" placeholder="Buscar por nombre o colonia" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select aria-label="Desarrollo" value={dev} onChange={(e) => setDev(e.target.value)} className="w-auto">
          <option value="">Todos los desarrollos</option>
          {devs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select aria-label="Recámaras" value={beds} onChange={(e) => setBeds(Number(e.target.value))} className="w-auto">
          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n ? `${n}+ recámaras` : "Recámaras"}</option>)}
        </Select>
      </div>
      {shown.length === 0 ? <Empty title="Sin inmuebles con esos filtros" /> : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Inmueble", "Rec.", "Baños", "m²", "Precio", "Disponibles", "Condiciones", "Actualizado", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((l) => (
                <Fragment key={l.id}>
                <tr className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><Link href={listingHref(l)} className="font-semibold hover:underline">{l.title}</Link><p className="text-ink-3">{orgOf(db, l.orgId)?.name}</p>{l.units && l.units.length > 0 && <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} aria-expanded={open === l.id} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-ink"><CaretDown size={12} className={open === l.id ? "rotate-180" : ""} /> {open === l.id ? "Ocultar" : "Ver"} {l.units.length} unidades</button>}</td>
                  <td className="px-4 py-3 tabular">{l.bedrooms}</td>
                  <td className="px-4 py-3 tabular">{l.bathrooms}</td>
                  <td className="px-4 py-3 tabular">{l.m2Built || "-"}</td>
                  <td className="px-4 py-3 font-semibold tabular">{priceLabel(l.price)}</td>
                  <td className="px-4 py-3">{l.status === "vendido" ? <Badge tone="bad">Vendido</Badge> : l.unitsAvailable !== undefined ? <span className="tabular">{l.unitsAvailable}{l.unitsTotal ? ` de ${l.unitsTotal}` : ""}</span> : <Badge tone="ok">Disponible</Badge>}</td>
                  <td className="max-w-[220px] px-4 py-3 text-ink-2">{l.paymentTerms ?? db.developments.find((d) => d.id === l.developmentId)?.paymentTerms ?? "-"}</td>
                  <td className="px-4 py-3 text-ink-3">{relTime(l.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">{l.status === "publicado" && l.price > 0 && <Button size="sm" href={`/panel/cotizar/?id=${l.id}`}><FilePdf size={15} /> Cotizar</Button>}</td>
                </tr>
                {open === l.id && l.units && (
                  <tr className="border-b border-line bg-paper"><td colSpan={9} className="px-4 py-3">
                    <table className="w-full text-left text-xs">
                      <thead className="text-ink-3"><tr>{["Unidad", "Piso", "Modelo", "Vista", "Entrega", "Rec.", "Baños", "Cajones", "m²", "Precio", "Estatus", ""].map((h) => <th key={h} className="px-2 py-1.5 font-semibold">{h}</th>)}</tr></thead>
                      <tbody>
                        {[...l.units].sort((a, b) => (a.status === b.status ? a.price - b.price : a.status === "disponible" ? -1 : 1)).map((x) => (
                          <tr key={x.id} className="border-t border-line">
                            <td className="px-2 py-1.5 font-semibold">{x.id}</td>
                            <td className="px-2 py-1.5 tabular">{x.floor || "-"}</td>
                            <td className="px-2 py-1.5">{x.model}</td>
                            <td className="px-2 py-1.5">{x.view}</td>
                            <td className="px-2 py-1.5 tabular">{x.delivery ?? "-"}</td>
                            <td className="px-2 py-1.5 tabular">{x.bedrooms}</td>
                            <td className="px-2 py-1.5 tabular">{x.bathrooms}</td>
                            <td className="px-2 py-1.5 tabular">{x.parking}</td>
                            <td className="px-2 py-1.5 tabular">{x.m2}</td>
                            <td className="px-2 py-1.5 font-semibold tabular">{x.price ? money(x.price) : "-"}</td>
                            <td className="px-2 py-1.5">{x.status === "disponible" ? <Badge tone="ok">Disponible</Badge> : <Badge>{x.status === "apartado" ? "Apartado" : "Vendido"}</Badge>}</td>
                            <td className="px-2 py-1.5 text-right">{x.status === "disponible" && x.price > 0 && <Link href={`/panel/cotizar/?id=${l.id}&u=${encodeURIComponent(x.id)}`} className="font-semibold underline">Cotizar</Link>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td></tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Guard>
  );
}
