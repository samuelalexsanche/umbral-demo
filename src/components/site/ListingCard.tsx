"use client";
import Link from "next/link";
import { Heart, SealCheck, Bed, Bathtub, Ruler } from "@phosphor-icons/react";
import type { Listing, Org } from "@/lib/types";
import { asset, baths, bathsLabel, creditName, money, monthYear } from "@/lib/format";
import { toggleFav, useFavs } from "@/lib/favs";
import { Badge, OrgLogo, cx } from "../ui";

export function listingHref(l: Pick<Listing, "slug" | "id">, seeded: boolean) {
  return seeded ? `/inmueble/${l.slug}/` : `/inmueble/ver/?id=${l.id}`;
}

export default function ListingCard({
  l,
  org,
  seeded,
  active,
  onHover,
  compact,
}: {
  l: Listing;
  org?: Org;
  seeded: boolean;
  active?: boolean;
  onHover?: (id: string | null) => void;
  compact?: boolean;
}) {
  const favs = useFavs();
  const fav = favs.includes(l.id);
  const href = listingHref(l, seeded);
  const low = l.unitsAvailable !== undefined && l.unitsAvailable > 0 && l.unitsAvailable <= 5;
  return (
    <article
      id={`card-${l.id}`}
      onMouseEnter={() => onHover?.(l.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cx(
        "lift group relative overflow-hidden rounded-[14px] border bg-card shadow-[var(--shadow-card)]",
        active ? "border-ink" : "border-line",
      )}
    >
      <Link href={href} className="zoom-img block overflow-hidden" aria-label={l.title}>
        <div className="relative aspect-[4/3] bg-sunk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(l.images[0] ?? "/img/bosque-arcada-fachada.jpg")} alt={`${l.title}, ${l.colonia}`} loading="lazy" className="h-full w-full object-cover" />
        </div>
      </Link>
      <button
        onClick={() => toggleFav(l.id)}
        aria-pressed={fav}
        aria-label={fav ? "Quitar de guardados" : "Guardar inmueble"}
        className="press absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-card/90 text-ink shadow-sm backdrop-blur hover:bg-card"
      >
        <Heart size={19} weight={fav ? "fill" : "regular"} className={fav ? "text-brick" : ""} />
      </button>
      <div className="absolute left-3 top-3 flex gap-1.5">
        {l.delivery === "preventa" ? <Badge tone="dark">Preventa{l.deliveryDate ? ` · ${monthYear(l.deliveryDate)}` : ""}</Badge> : <Badge className="bg-card/90 text-ink">Entrega inmediata</Badge>}
      </div>
      <div className={cx("grid gap-2.5 p-4", compact && "gap-2 p-3.5")}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[22px] font-semibold tracking-tight tabular">{money(l.price)}</p>
          {low && <span className="text-xs font-semibold text-brick">Quedan {l.unitsAvailable}</span>}
          {l.status === "vendido" && <Badge tone="bad">Agotado</Badge>}
        </div>
        <Link href={href} className="line-clamp-1 font-semibold leading-snug hover:underline">{l.title}</Link>
        <p className="text-sm text-ink-2">{l.colonia}, {l.municipio}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2" aria-label="Características">
          <li className="inline-flex items-center gap-1.5"><Bed size={16} /> {l.bedrooms} rec</li>
          <li className="inline-flex items-center gap-1.5"><Bathtub size={16} /> {bathsLabel(l.bathrooms)}</li>
          <li className="inline-flex items-center gap-1.5"><Ruler size={16} /> {l.m2Built} m²</li>
        </ul>
        {!compact && (
          <div className="flex flex-wrap gap-1.5" aria-label="Créditos aceptados">
            {l.credits.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-ink-2">{creditName(c)}</span>
            ))}
            {l.credits.length > 3 && <span className="rounded-full px-1.5 py-0.5 text-xs text-ink-3">+{l.credits.length - 3}</span>}
          </div>
        )}
        {org && (
          <div className="mt-1 flex items-center gap-2 border-t border-line pt-3 text-sm">
            <OrgLogo org={org} size={24} className="rounded-md" />
            <span className="truncate font-medium text-ink-2">{org.name}</span>
            {org.verified && <SealCheck size={16} weight="fill" className="shrink-0 text-ok" aria-label="Verificada" />}
          </div>
        )}
      </div>
    </article>
  );
}
