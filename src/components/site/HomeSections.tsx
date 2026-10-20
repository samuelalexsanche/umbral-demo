"use client";
import Link from "next/link";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { useDB } from "@/lib/db";
import { available, devHref, isSeededListing, orgHref, orgOf } from "@/lib/queries";
import { asset, deliveryLabel, moneyShort } from "@/lib/format";
import { OrgLogo } from "../ui";
import ListingCard from "./ListingCard";

export function Featured() {
  const db = useDB();
  const list = available(db).filter((l) => l.featured).slice(0, 6);
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((l) => (
        <ListingCard key={l.id} l={l} org={orgOf(db, l.orgId)} seeded={isSeededListing(l.id)} />
      ))}
    </div>
  );
}

export function Developments() {
  const db = useDB();
  const devs = db.developments.filter((d) => orgOf(db, d.orgId)?.status === "activa");
  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 [scrollbar-width:none]">
      {devs.map((d) => {
        const org = orgOf(db, d.orgId)!;
        const prices = available(db).filter((l) => l.developmentId === d.id).map((l) => l.price);
        return (
          <Link key={d.id} href={devHref(d)} className="lift zoom-img group relative w-[min(78vw,340px)] shrink-0 snap-start overflow-hidden rounded-[16px] bg-ink text-paper">
            <div className="aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(d.images[0])} alt={`${d.name}, ${d.colonia}, ${d.municipio}`} loading="lazy" className="h-full w-full object-cover opacity-90" />
            </div>
            <div className="absolute inset-x-0 bottom-0 grid gap-1 bg-gradient-to-t from-ink via-ink/80 to-transparent p-5 pt-16">
              <p className="text-xs font-semibold uppercase tracking-wide text-paper/70">{deliveryLabel(d.delivery, d.deliveryDate)}</p>
              <p className="font-display text-2xl font-semibold tracking-tight">{d.name}</p>
              <p className="text-sm text-paper/80">{d.colonia}, {d.municipio}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-paper/90">
                <OrgLogo org={org} size={22} className="rounded-md" /> {org.name}
                {prices.length > 0 && <span className="ml-auto font-semibold tabular">desde {moneyShort(Math.min(...prices))}</span>}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function OrgsRow() {
  const db = useDB();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {db.orgs.filter((o) => o.status === "activa").map((o) => {
        const n = available(db).filter((l) => l.orgId === o.id).length;
        return (
          <Link key={o.id} href={orgHref(o)} className="press flex items-center gap-3 rounded-[14px] border border-line bg-card p-4 hover:border-ink-3">
            <OrgLogo org={o} size={46} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-semibold">
                {o.name} {o.verified && <SealCheck size={16} weight="fill" className="shrink-0 text-ok" aria-label="Verificada" />}
              </p>
              <p className="text-sm text-ink-2">{n} inmuebles · responde en ~{o.responseMinutes} min</p>
            </div>
            <ArrowRight size={18} className="ml-auto shrink-0 text-ink-3" />
          </Link>
        );
      })}
    </div>
  );
}
