"use client";
import Link from "next/link";
import { SealCheck } from "@phosphor-icons/react";
import type { Development, Listing, Org } from "@/lib/types";
import { asset, deliveryLabel, moneyShort } from "@/lib/format";
import { bedroomsLabel, devHref, unitsOf } from "@/lib/queries";
import { OrgLogo, cx } from "../ui";

/** Un proyecto = una tarjeta: una sola imagen, nombre, recámaras disponibles y lo esencial. */
export default function ProjectCard({ dev, listings, org, active, onHover }: { dev: Development; listings: Listing[]; org?: Org; active?: boolean; onHover?: (id: string | null) => void }) {
  const from = Math.min(...listings.map((l) => l.price));
  const units = listings.reduce((s, l) => s + (l.status === "publicado" ? unitsOf(l) : 0), 0);
  const m2 = listings.map((l) => l.m2Built).filter(Boolean);
  const highlights = [
    m2.length ? (Math.min(...m2) === Math.max(...m2) ? `${Math.min(...m2)} m²` : `${Math.min(...m2)} a ${Math.max(...m2)} m²`) : "",
    dev.delivery === "preventa" && dev.progress ? `${dev.progress}% de obra` : "",
    ...dev.amenities.slice(0, 2),
  ].filter(Boolean);
  return (
    <Link
      href={devHref(dev)}
      id={`card-${dev.id}`}
      onMouseEnter={() => onHover?.(dev.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cx("lift zoom-img group grid overflow-hidden rounded-[14px] border bg-card shadow-[var(--shadow-card)]", active ? "border-ink" : "border-line")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(dev.images[0])} alt={`${dev.name}, ${dev.colonia}, ${dev.municipio}`} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-paper backdrop-blur">{deliveryLabel(dev.delivery, dev.deliveryDate)}</span>
      </div>
      <div className="grid gap-2 p-4">
        <p className="font-display text-xl font-semibold leading-tight tracking-tight">{dev.name}</p>
        <p className="text-sm text-ink-3">{dev.colonia}, {dev.municipio}</p>
        <p className="font-semibold">{bedroomsLabel(listings)}</p>
        <p className="line-clamp-2 text-sm text-ink-2">{dev.description}</p>
        {highlights.length > 0 && <p className="flex flex-wrap gap-1.5">{highlights.map((h) => <span key={h} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2">{h}</span>)}</p>}
        <div className="mt-1 flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm text-ink-2">Desde <strong className="font-display text-xl text-ink tabular">{moneyShort(from)}</strong>{units > 0 && <span className="block text-xs text-ink-3">{units} {units === 1 ? "unidad disponible" : "unidades disponibles"}</span>}</p>
          {org && <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-2"><OrgLogo org={org} size={22} className="rounded-md" /> {org.name}{org.verified && <SealCheck size={14} weight="fill" className="text-ok" />}</span>}
        </div>
      </div>
    </Link>
  );
}
