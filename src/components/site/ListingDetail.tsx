"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bed, Bathtub, Car, Ruler, Stack, Tree, SealCheck, Heart, WhatsappLogo, Clock, ArrowRight, Images, CheckCircle, Warning } from "@phosphor-icons/react";
import { addView, can, useDB, useSessionUser } from "@/lib/db";
import { available, devHref, isSeededListing, orgHref, orgOf, devOf, userOf } from "@/lib/queries";
import { CREDITS } from "@/lib/seed";
import { asset, baths, bathsLabel, deliveryLabel, money, TYPE_LABEL, waLink } from "@/lib/format";
import { toggleFav, useFavs } from "@/lib/favs";
import { Avatar, Badge, Button, Dialog, Empty, OrgLogo } from "../ui";
import ListingCard from "./ListingCard";
import MapView from "./MapView";
import MortgageCalc from "./MortgageCalc";
import ContactDialog from "./ContactDialog";
import AgentChat from "./AgentChat";

export default function ListingDetail({ id }: { id: string }) {
  const db = useDB();
  const me = useSessionUser();
  const favs = useFavs();
  const [contact, setContact] = useState(false);
  const [gallery, setGallery] = useState(false);
  const l = db.listings.find((x) => x.id === id);

  useEffect(() => {
    if (l && l.status === "publicado") addView(l.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!l) return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este inmueble ya no existe" action={<Button href="/inmuebles/">Ver inmuebles disponibles</Button>}>Puede que la desarrolladora lo haya retirado.</Empty></div>;

  const org = orgOf(db, l.orgId)!;
  const dev = devOf(db, l.developmentId);
  const asesor = userOf(db, l.asesorId);
  const isPublic = (l.status === "publicado" || l.status === "vendido") && org.status === "activa";
  const canPreview = me ? can.editListing(me, l) || can.review(me, l) : false;
  if (!isPublic && !canPreview)
    return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este inmueble no está publicado" action={<Button href="/inmuebles/">Ver inmuebles disponibles</Button>}>Está en revisión o en borrador de su desarrolladora.</Empty></div>;

  const fav = favs.includes(l.id);
  const similar = available(db).filter((x) => x.id !== l.id && (x.municipio === l.municipio || Math.abs(x.price - l.price) / l.price < 0.25)).slice(0, 3);
  const sold = l.status === "vendido";
  const specs = [
    { i: Bed, t: `${l.bedrooms} ${l.bedrooms === 1 ? "recámara" : "recámaras"}` },
    { i: Bathtub, t: `${bathsLabel(l.bathrooms)}` },
    { i: Car, t: `${l.parking} ${l.parking === 1 ? "estacionamiento" : "estacionamientos"}` },
    { i: Ruler, t: `${l.m2Built} m² construidos` },
    ...(l.m2Land ? [{ i: Tree, t: `${l.m2Land} m² de terreno` }] : []),
    { i: Stack, t: `${l.levels} ${l.levels === 1 ? "nivel" : "niveles"}` },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      {!isPublic && (
        <div className="mb-5 flex items-center gap-2 rounded-[12px] bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          <Warning size={18} /> Vista previa: este inmueble está en {l.status} y solo lo ve tu equipo.
        </div>
      )}
      <nav aria-label="Ruta" className="mb-4 flex flex-wrap gap-1.5 text-sm text-ink-3">
        <Link href="/inmuebles/" className="hover:text-ink">Inmuebles</Link> /
        <Link href={`/inmuebles/?m=${encodeURIComponent(l.municipio)}`} className="hover:text-ink">{l.municipio}</Link>
        {dev && <> / <Link href={devHref(dev)} className="hover:text-ink">{dev.name}</Link></>}
      </nav>

      <div className="relative grid gap-2 overflow-hidden rounded-[18px] sm:grid-cols-[2fr_1fr] sm:grid-rows-2" style={{ maxHeight: 560 }}>
        {l.images.slice(0, 3).map((src, i) => (
          <button key={src + i} onClick={() => setGallery(true)} className={i === 0 ? "sm:row-span-2" : "hidden sm:block"} aria-label="Ver galería">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(src)} alt={`${l.title}, foto ${i + 1}`} className="h-full max-h-[560px] w-full object-cover" fetchPriority={i === 0 ? "high" : undefined} />
          </button>
        ))}
        <button onClick={() => setGallery(true)} className="press absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-semibold shadow">
          <Images size={18} /> {l.images.length} fotos
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid content-start gap-10">
          <header className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone={l.delivery === "preventa" ? "dark" : "neutral"}>{deliveryLabel(l.delivery, l.deliveryDate)}</Badge>
              <Badge>{TYPE_LABEL[l.type]}</Badge>
              {sold && <Badge tone="bad">Agotado</Badge>}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-[2.6rem]">{l.title}</h1>
            <p className="text-lg text-ink-2">{l.colonia}, {l.municipio}, Jalisco</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specs.map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px]"><Icon size={22} className="text-ink-3" /> {t}</li>
              ))}
            </ul>
          </header>

          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">¿Con qué crédito se puede comprar?</h2>
            <p className="text-ink-2">
              {org.name} acepta {l.credits.length === 1 ? "esta forma de pago" : `${l.credits.length} formas de pago`} para este inmueble:
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CREDITS.map((c) => {
                const ok = l.credits.includes(c.id);
                return (
                  <li key={c.id} className={`flex items-start gap-3 rounded-[12px] border p-3.5 ${ok ? "border-line bg-card" : "border-transparent bg-sunk/60 text-ink-3"}`}>
                    {ok ? <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-ok" /> : <span className="mt-0.5 grid size-[22px] shrink-0 place-items-center text-lg leading-none">·</span>}
                    <span>
                      <span className="block font-semibold">{c.name}{!ok && " (no aplica)"}</span>
                      {ok && <span className="text-sm text-ink-2">{c.short}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Descripción</h2>
            <p className="max-w-[68ch] text-[17px] leading-relaxed text-ink-2 text-pretty">{l.description}</p>
            {l.features.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {l.features.map((f) => <li key={f} className="rounded-full bg-sunk px-3 py-1.5 text-sm font-medium">{f}</li>)}
              </ul>
            )}
          </section>

          {l.amenities.length > 0 && (
            <section className="grid gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Amenidades {dev ? `de ${dev.name}` : ""}</h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {l.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-[15px]"><CheckCircle size={18} className="text-ink-3" /> {a}</li>)}
              </ul>
            </section>
          )}

          {(l.credits.includes("bancario") || l.credits.includes("cofinavit")) && !sold && (
            <section className="grid gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight">¿Cuánto pagaría al mes?</h2>
              <MortgageCalc price={l.price} />
            </section>
          )}

          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Ubicación</h2>
            <MapView className="h-80 w-full overflow-hidden rounded-[16px] border border-line" points={[{ id: l.id, lat: l.lat, lng: l.lng, label: TYPE_LABEL[l.type] }]} zoom={14} activeId={l.id} />
            <p className="text-sm text-ink-3">Ubicación aproximada en {l.colonia}, {l.municipio}. La dirección exacta te la da el asesor.</p>
          </section>

          {dev && (
            <section className="grid gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight">El desarrollo</h2>
              <Link href={devHref(dev)} className="press grid overflow-hidden rounded-[16px] border border-line bg-card hover:border-ink-3 sm:grid-cols-[220px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(dev.images[0])} alt={dev.name} loading="lazy" className="h-48 w-full object-cover sm:h-full" />
                <div className="grid gap-2 p-5">
                  <p className="font-display text-xl font-semibold">{dev.name}</p>
                  <p className="text-sm text-ink-2 text-pretty">{dev.description}</p>
                  <div className="mt-1 grid gap-1.5">
                    <div className="flex justify-between text-sm"><span className="text-ink-2">Avance de obra</span><span className="font-semibold tabular">{dev.progress}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-sunk"><div className="h-full rounded-full bg-ink" style={{ width: `${dev.progress}%` }} /></div>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brick">Ver todos los modelos <ArrowRight size={15} /></span>
                </div>
              </Link>
            </section>
          )}

          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Quién lo vende</h2>
            <div className="grid gap-4 rounded-[16px] border border-line bg-card p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <OrgLogo org={org} size={56} />
              <div>
                <p className="flex items-center gap-1.5 font-display text-xl font-semibold">{org.name} {org.verified && <SealCheck size={20} weight="fill" className="text-ok" aria-label="Verificada" />}</p>
                <p className="text-sm text-ink-2">{org.kind === "desarrolladora" ? "Desarrolladora" : "Inmobiliaria"} desde {org.since} · responde en ~{org.responseMinutes} min</p>
              </div>
              <Button href={orgHref(org)} variant="outline" size="sm">Ver perfil</Button>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="grid gap-5 rounded-[18px] border border-line bg-card p-6 shadow-[var(--shadow-card)]">
            <div>
              <p className="font-display text-[2.4rem] font-semibold leading-none tracking-tight tabular">{money(l.price)}</p>
              {l.unitsAvailable !== undefined && (
                <p className={`mt-2 text-sm font-semibold ${l.unitsAvailable <= 5 ? "text-brick" : "text-ink-2"}`}>
                  {sold ? "Sin unidades disponibles" : `${l.unitsAvailable} de ${l.unitsTotal} unidades disponibles`}
                </p>
              )}
              <p className="mt-1 text-xs text-ink-3">Actualizado por {org.name} el {new Date(l.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}</p>
            </div>
            {asesor && (
              <div className="flex items-center gap-3 border-y border-line py-4">
                <Avatar name={asesor.name} size={48} />
                <div className="text-sm">
                  <p className="font-semibold">{asesor.name}</p>
                  <p className="text-ink-2">{asesor.title}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-3"><Clock size={13} /> Responde en ~{org.responseMinutes} min</p>
                </div>
              </div>
            )}
            <Button size="lg" onClick={() => setContact(true)} disabled={sold}>Contactar al asesor</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" href={waLink(`Hola, vi ${l.title} (${money(l.price)}) en Umbral y quiero más información.`)} external><WhatsappLogo size={18} /> WhatsApp</Button>
              <Button variant="outline" onClick={() => toggleFav(l.id)} aria-pressed={fav}><Heart size={18} weight={fav ? "fill" : "regular"} className={fav ? "text-brick" : ""} /> {fav ? "Guardado" : "Guardar"}</Button>
            </div>
            <p className="text-xs text-ink-3">El apartado se firma en la oficina de ventas de {org.name}. Nunca deposites a cuentas personales.</p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">También te puede interesar</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => <ListingCard key={s.id} l={s} org={orgOf(db, s.orgId)} seeded={isSeededListing(s.id)} />)}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-[1150] flex items-center justify-between gap-3 border-t border-line bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="font-display text-xl font-semibold tabular">{money(l.price)}</p>
        <Button onClick={() => setContact(true)} disabled={sold}>Contactar al asesor</Button>
      </div>

      <Dialog open={gallery} onClose={() => setGallery(false)} title={l.title} wide>
        <div className="grid gap-3">
          {l.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + i} src={asset(src)} alt={`${l.title}, foto ${i + 1}`} loading="lazy" className="w-full rounded-[12px]" />
          ))}
        </div>
      </Dialog>
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} asesor={asesor} listing={l} source="ficha" />
      <AgentChat org={org} listing={l} context={`${l.title} (${money(l.price)}) en ${l.colonia}, ${l.municipio}`} />
    </div>
  );
}
