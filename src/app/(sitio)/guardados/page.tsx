"use client";
import { useState } from "react";
import Link from "next/link";
import { useDB } from "@/lib/db";
import { useFavs } from "@/lib/favs";
import { isSeededListing, listingHref, orgOf, devOf } from "@/lib/queries";
import { asset, baths, creditName, deliveryLabel, money, monthlyPayment, TYPE_LABEL } from "@/lib/format";
import ListingCard from "@/components/site/ListingCard";
import { Button, Empty, cx } from "@/components/ui";

export default function Page() {
  const db = useDB();
  const favs = useFavs();
  const list = favs.map((id) => db.listings.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);
  const [cmp, setCmp] = useState<string[]>([]);
  const chosen = list.filter((l) => cmp.includes(l.id));
  const toggle = (id: string) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  const rows: [string, (l: (typeof list)[number]) => React.ReactNode][] = [
    ["Precio", (l) => <strong className="tabular">{money(l.price)}</strong>],
    ["Mensualidad estimada*", (l) => <span className="tabular">{money(Math.round(monthlyPayment(l.price * 0.9, 10.5, 20)))}</span>],
    ["Tipo", (l) => TYPE_LABEL[l.type]],
    ["Recámaras", (l) => l.bedrooms],
    ["Baños", (l) => baths(l.bathrooms)],
    ["Estacionamientos", (l) => l.parking],
    ["Construcción", (l) => `${l.m2Built} m²`],
    ["Precio por m²", (l) => <span className="tabular">{money(Math.round(l.price / l.m2Built))}</span>],
    ["Ubicación", (l) => `${l.colonia}, ${l.municipio}`],
    ["Entrega", (l) => deliveryLabel(l.delivery, l.deliveryDate)],
    ["Créditos", (l) => l.credits.map(creditName).join(", ")],
    ["Desarrolladora", (l) => orgOf(db, l.orgId)?.name],
    ["Desarrollo", (l) => devOf(db, l.developmentId)?.name ?? "Independiente"],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Guardados</h1>
      <p className="mt-2 text-ink-2">Elige hasta 3 para compararlos lado a lado. Se guardan en este navegador.</p>
      {list.length === 0 ? (
        <div className="mt-10"><Empty title="Aún no guardas inmuebles" action={<Button href="/inmuebles/">Explorar inmuebles</Button>}>Toca el corazón en cualquier inmueble para guardarlo aquí.</Empty></div>
      ) : (
        <>
          {chosen.length >= 2 && (
            <section className="mt-8 overflow-x-auto rounded-[18px] border border-line bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="w-44 px-5 py-4 text-ink-3">Comparar</th>
                    {chosen.map((l) => (
                      <th key={l.id} className="px-5 py-4 align-top">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(l.images[0])} alt="" className="mb-3 aspect-[4/3] w-full rounded-[10px] object-cover" />
                        <Link href={listingHref(l)} className="font-semibold hover:underline">{l.title}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, fn]) => (
                    <tr key={label} className="border-b border-line last:border-0">
                      <th scope="row" className="px-5 py-3 font-medium text-ink-2">{label}</th>
                      {chosen.map((l) => <td key={l.id} className="px-5 py-3">{fn(l)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 py-3 text-xs text-ink-3">*Crédito bancario con 10% de enganche, 20 años y tasa de 10.5% anual. Solo como referencia.</p>
            </section>
          )}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((l) => (
              <div key={l.id} className="grid gap-2">
                <ListingCard l={l} org={orgOf(db, l.orgId)} seeded={isSeededListing(l.id)} />
                <label className={cx("flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", cmp.includes(l.id) ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2")}>
                  <input type="checkbox" className="size-4" checked={cmp.includes(l.id)} onChange={() => toggle(l.id)} disabled={!cmp.includes(l.id) && cmp.length >= 3} />
                  {cmp.includes(l.id) ? "En la comparación" : "Agregar a la comparación"}
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
