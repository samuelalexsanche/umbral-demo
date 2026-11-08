"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SealCheck, Clock, MapPin, Phone, EnvelopeSimple, CalendarBlank, Buildings, ArrowRight, Leaf, CheckCircle, Circle, Rocket } from "@phosphor-icons/react";
import type { Article, Org } from "@/lib/types";
import { useDB, useHydrated } from "@/lib/db";
import { available, devHref, isSeededListing, orgHref, orgOf, published } from "@/lib/queries";
import { asset, creditName, deliveryLabel, moneyShort, priceLabel, TYPE_LABEL } from "@/lib/format";
import { Badge, Button, Empty, OrgLogo, cx } from "../ui";
import { ArticleCard } from "./News";
import ListingCard from "./ListingCard";
import MapView from "./MapView";
import ContactDialog from "./ContactDialog";
import AgentChat from "./AgentChat";

export function OrgProfile({ id }: { id: string }) {
  const db = useDB();
  const org = db.orgs.find((o) => o.id === id);
  const [type, setType] = useState("");
  const [beds, setBeds] = useState(0);
  const [contact, setContact] = useState(false);
  const ready = useHydrated();
  if (!ready) return <div className="mx-auto h-[60dvh] max-w-[1400px] animate-pulse px-4 py-8"><div className="h-full rounded-[18px] bg-sunk" /></div>;
  if (!org || org.status !== "activa") return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este perfil no está disponible" action={<Button href="/desarrolladoras/">Ver desarrolladoras</Button>} /></div>;

  const listings = published(db).filter((l) => l.orgId === org.id);
  const shown = listings.filter((l) => (!type || l.type === type) && (!beds || l.bedrooms >= beds));
  const devs = db.developments.filter((d) => d.orgId === org.id);
  const posts = db.articles.filter((a) => a.orgId === org.id && a.published).sort((a, b) => b.date.localeCompare(a.date));
  const launches = devs.filter((d) => d.launch);

  return (
    <div>
      <section className="border-b border-line bg-card">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <OrgLogo org={org} size={72} className="rounded-[16px]" />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-3">Desarrolladora {org.seal && <SealBadge />}</p>
                <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  {org.name}
                  {org.verified && <SealCheck size={34} weight="fill" className="shrink-0 text-ok" aria-label="Desarrolladora verificada" />}
                </h1>
              </div>
            </div>
            <p className="max-w-[60ch] text-lg text-ink-2 text-pretty">{org.tagline}</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            <div><dt className="text-ink-3">Años</dt><dd className="font-display text-3xl font-semibold tabular">{new Date().getFullYear() - org.since}</dd></div>
            <div><dt className="text-ink-3">Proyectos realizados</dt><dd className="font-display text-3xl font-semibold tabular">{org.projectsDone ?? devs.length}</dd></div>
            <div><dt className="text-ink-3">En venta</dt><dd className="font-display text-3xl font-semibold tabular">{devs.length}</dd></div>
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-14">
          {launches.length > 0 && (
            <section className="grid gap-5">
              <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight"><Rocket size={24} /> Nuevos lanzamientos</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {launches.map((d) => <DevCard key={d.id} d={d} />)}
              </div>
            </section>
          )}
          {devs.length > 0 && (
            <section className="grid gap-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Inventario actual</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {devs.map((d) => <DevCard key={d.id} d={d} />)}
              </div>
            </section>
          )}

          <section className="grid gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Todos sus inmuebles</h2>
              <div className="flex gap-2">
                <select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-full border border-line bg-card px-3 text-sm">
                  <option value="">Todos los tipos</option>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select aria-label="Recámaras" value={beds} onChange={(e) => setBeds(Number(e.target.value))} className="h-10 rounded-full border border-line bg-card px-3 text-sm">
                  {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n ? `${n}+ recámaras` : "Recámaras"}</option>)}
                </select>
              </div>
            </div>
            {shown.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {shown.map((l) => <ListingCard key={l.id} l={l} seeded={isSeededListing(l.id)} />)}
              </div>
            ) : (
              <Empty title="Sin inmuebles con esos filtros" />
            )}
          </section>

          <section className="grid gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Historia</h2>
            <p className="max-w-[68ch] text-[17px] leading-relaxed text-ink-2">{org.description}</p>
            {org.history && <p className="max-w-[68ch] text-[17px] leading-relaxed text-ink-2">{org.history}</p>}
          </section>

          {posts.length > 0 && (
            <section className="grid gap-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Noticias y avances de obra</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {posts.slice(0, 6).map((a) => <ArticleCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="grid gap-4 rounded-[18px] border border-line bg-card p-6">
            <Button size="lg" onClick={() => setContact(true)}>Quiero información</Button>
            <ul className="grid gap-3 text-sm">
              {org.hours && <li className="flex gap-2.5"><Clock size={18} className="shrink-0 text-ink-3" /> {org.hours}</li>}
              {org.address && <li className="flex gap-2.5"><MapPin size={18} className="shrink-0 text-ink-3" /> {org.address}</li>}
              {org.phone && <li className="flex gap-2.5"><Phone size={18} className="shrink-0 text-ink-3" /> {org.phone}</li>}
              {org.email && <li className="flex gap-2.5"><EnvelopeSimple size={18} className="shrink-0 text-ink-3" /> {org.email}</li>}
              <li className="flex gap-2.5"><CalendarBlank size={18} className="shrink-0 text-ink-3" /> Desarrolla desde {org.since}</li>
            </ul>
          </div>
          <TrustCard org={org} />
          <div className="grid gap-3 rounded-[18px] border border-line bg-card p-6">
            <p className="font-semibold">Formas de pago</p>
            <div className="flex flex-wrap gap-2">{org.credits.map((c) => <Badge key={c}>{creditName(c)}</Badge>)}</div>
            {org.paymentTerms && <p className="text-sm text-ink-2">{org.paymentTerms}</p>}
            <Link href="/creditos/" className="text-sm font-semibold text-brick hover:underline">Ver tasas y tramitar crédito</Link>
          </div>
        </aside>
      </div>
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} source="perfil" />
      <AgentChat org={org} context={`el perfil de ${org.name}`} />
    </div>
  );
}

export function DevelopmentProfile({ id }: { id: string }) {
  const db = useDB();
  const d = db.developments.find((x) => x.id === id);
  const [contact, setContact] = useState(false);
  const [img, setImg] = useState(0);
  const models = useMemo(() => (d ? published(db).filter((l) => l.developmentId === d.id) : []), [db, d]);
  const ready = useHydrated();
  if (!ready) return <div className="mx-auto h-[60dvh] max-w-[1400px] animate-pulse px-4 py-8"><div className="h-full rounded-[18px] bg-sunk" /></div>;
  if (!d) return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este desarrollo no está disponible" action={<Button href="/inmuebles/">Ver inmuebles</Button>} /></div>;
  const org = orgOf(db, d.orgId)!;
  const credits = Array.from(new Set(models.flatMap((m) => m.credits).concat(org.credits)));
  const priced = models.filter((m) => m.price > 0);
  const from = d.priceFrom ?? (priced.length ? Math.min(...priced.map((m) => m.price)) : 0);
  const posts = db.articles.filter((a) => a.developmentId === d.id && a.published).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      <nav aria-label="Ruta" className="mb-4 flex gap-1.5 text-sm text-ink-3">
        <Link href="/desarrolladoras/" className="hover:text-ink">Desarrolladoras</Link> / <Link href={orgHref(org)} className="hover:text-ink">{org.name}</Link>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-[18px] bg-sunk">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={img} src={asset(d.images[img])} alt={`${d.name}, foto ${img + 1}`} className="aspect-[16/10] w-full object-cover" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {d.images.map((src, i) => (
              <button key={src} onClick={() => setImg(i)} aria-label={`Foto ${i + 1}`} aria-pressed={img === i} className={cx("press shrink-0 overflow-hidden rounded-[10px] border-2", img === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(src)} alt="" loading="lazy" className="h-16 w-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={d.delivery === "preventa" ? "dark" : "neutral"}>{deliveryLabel(d.delivery, d.deliveryDate)}</Badge>
            <Badge>{d.kind === "torre" ? "Torre de departamentos" : d.kind === "privada" ? "Privada" : "Fraccionamiento"}</Badge>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{d.name}</h1>
          <p className="text-lg text-ink-2">{d.colonia}, {d.municipio}, Jalisco</p>
          <Link href={orgHref(org)} className="flex items-center gap-2.5 font-semibold hover:underline">
            <OrgLogo org={org} size={32} /> {org.name} {org.verified && <SealCheck size={18} weight="fill" className="text-ok" />} {org.seal && <SealBadge />}
          </Link>
          <p className="text-ink-2 text-pretty">{d.description}</p>
          <dl className="grid grid-cols-3 gap-4 border-y border-line py-5">
            <div><dt className="text-sm text-ink-3">Desde</dt><dd className="font-display text-2xl font-semibold tabular">{from ? moneyShort(from) : "Por confirmar"}</dd></div>
            <div><dt className="text-sm text-ink-3">Tipologías</dt><dd className="text-[15px] font-semibold">{d.typologies || "Por confirmar"}</dd></div>
            <div><dt className="text-sm text-ink-3">Avance de obra</dt><dd className="font-display text-2xl font-semibold tabular">{d.progress ? `${d.progress}%` : "Por iniciar"}</dd></div>
          </dl>
          {d.progress > 0 && <div className="h-2 overflow-hidden rounded-full bg-sunk" aria-hidden><div className="h-full rounded-full bg-brick" style={{ width: `${d.progress}%` }} /></div>}
          {d.paymentTerms && <p className="rounded-[12px] bg-sunk px-4 py-3 text-sm"><strong>Condiciones de pago:</strong> {d.paymentTerms}</p>}
          <Button size="lg" onClick={() => setContact(true)}>Agendar visita</Button>
        </div>
      </div>

      <section className="mt-16 grid gap-5">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Modelos disponibles</h2>
        {models.length ? (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-line bg-card">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-ink-3"><tr>{["Modelo", "Recámaras", "Baños", "m²", "Precio", "Disponibles"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3.5 font-semibold"><Link href={isSeededListing(m.id) ? `/inmueble/${m.slug}/` : `/inmueble/ver/?id=${m.id}`} className="hover:underline">{m.title.replace(` en ${d.name}`, "")}</Link></td>
                      <td className="px-5 py-3.5 tabular">{m.bedrooms}</td>
                      <td className="px-5 py-3.5 tabular">{m.bathrooms}</td>
                      <td className="px-5 py-3.5 tabular">{m.m2Built || "Por confirmar"}</td>
                      <td className="px-5 py-3.5 font-semibold tabular">{priceLabel(m.price)}</td>
                      <td className="px-5 py-3.5 tabular">{m.status === "vendido" ? <Badge tone="bad">Agotado</Badge> : `${m.unitsAvailable ?? "-"} de ${m.unitsTotal ?? "-"}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((m) => <ListingCard key={m.id} l={m} seeded={isSeededListing(m.id)} compact />)}
            </div>
          </>
        ) : (
          <Empty title="Aún no hay modelos publicados" />
        )}
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Amenidades</h2>
          <ul className="grid grid-cols-2 gap-2">{d.amenities.map((a) => <li key={a} className="rounded-[10px] bg-card px-3.5 py-2.5 text-[15px] ring-1 ring-line">{a}</li>)}</ul>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight">Formas de pago</h2>
          <div className="flex flex-wrap gap-2">{credits.map((c) => <Badge key={c}>{creditName(c)}</Badge>)}</div>
          <Link href="/creditos/" className="text-sm font-semibold text-brick hover:underline">Compara tasas bancarias y tramita tu crédito</Link>
        </div>
        <div className="grid content-start gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Ubicación</h2>
          <MapView className="h-80 w-full overflow-hidden rounded-[16px] border border-line" points={[{ id: d.id, lat: d.lat, lng: d.lng, label: d.name }]} zoom={14} activeId={d.id} />
          <p className="flex items-center gap-2 text-sm text-ink-3"><Buildings size={16} /> {d.address ?? `${d.colonia}, ${d.municipio}`}. Ubicación aproximada.</p>
          <Link href={orgHref(org)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brick hover:underline">Más desarrollos de {org.name} <ArrowRight size={14} /></Link>
        </div>
      </section>
      {posts.length > 0 && (
        <section className="mt-16 grid gap-5">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Avances y noticias de {d.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} developmentId={d.id} source="desarrollo" />
      <AgentChat org={org} context={`el desarrollo ${d.name}`} />
    </div>
  );
}

export function OrgDirectory() {
  const db = useDB();
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {db.orgs.filter((o) => o.status === "activa").map((o) => {
        const ls = available(db).filter((l) => l.orgId === o.id);
        const devs = db.developments.filter((d) => d.orgId === o.id);
        return (
          <Link key={o.id} href={orgHref(o)} className="lift grid gap-4 rounded-[18px] border border-line bg-card p-6">
            <div className="flex items-center gap-4">
              <OrgLogo org={o} size={56} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display text-xl font-semibold">{o.name} {o.verified && <SealCheck size={20} weight="fill" className="text-ok" aria-label="Verificada" />}</p>
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">Desarrolladora · {o.municipios.join(", ")} {o.seal && <SealBadge />}</p>
              </div>
            </div>
            <p className="text-ink-2 text-pretty">{o.tagline}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span><strong className="tabular">{devs.length}</strong> desarrollos en venta</span>
              <span><strong className="tabular">{ls.length}</strong> inmuebles</span>
              {o.trust.length > 0 && <span>Confianza <strong className="tabular">{o.trust.filter((t) => t.ok).length}/{o.trust.length}</strong></span>}
            </div>
            <div className="flex flex-wrap gap-1.5">{o.credits.map((c) => <span key={c} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2">{creditName(c)}</span>)}</div>
          </Link>
        );
      })}
    </div>
  );
}

export function SealBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold normal-case tracking-normal text-ok" title="Sello verde: cumple los criterios de confianza de Umbral">
      <Leaf size={13} weight="fill" /> Sello verde
    </span>
  );
}

function TrustCard({ org }: { org: Org }) {
  if (!org.trust.length) return null;
  const ok = org.trust.filter((t) => t.ok).length;
  return (
    <div className="grid gap-3 rounded-[18px] border border-line bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Calificación de confianza</p>
        <span className="font-display text-2xl font-semibold tabular">{ok}/{org.trust.length}</span>
      </div>
      {org.seal && <p className="flex items-center gap-2 rounded-[10px] bg-ok-soft px-3 py-2 text-sm font-semibold text-ok"><Leaf size={17} weight="fill" /> Tiene el sello verde de Umbral</p>}
      <ul className="grid gap-2 text-sm">
        {org.trust.map((t) => (
          <li key={t.id} className={cx("flex items-start gap-2", t.ok ? "text-ink" : "text-ink-3")}>
            {t.ok ? <CheckCircle size={18} weight="fill" className="mt-px shrink-0 text-ok" /> : <Circle size={18} className="mt-px shrink-0" />} {t.label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-3">Umbral revisa estos criterios con documentos de la desarrolladora.</p>
    </div>
  );
}

function DevCard({ d }: { d: import("@/lib/types").Development }) {
  const db = useDB();
  const ls = available(db).filter((l) => l.developmentId === d.id);
  const from = d.priceFrom ?? (ls.length ? Math.min(...ls.map((l) => l.price)) : 0);
  return (
    <Link href={devHref(d)} className="lift zoom-img overflow-hidden rounded-[16px] border border-line bg-card">
      <div className="aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(d.images[0])} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="grid gap-1 p-5">
        <p className="font-display text-xl font-semibold">{d.name}</p>
        <p className="text-sm text-ink-2">{d.colonia}, {d.municipio} · {deliveryLabel(d.delivery, d.deliveryDate)}</p>
        {d.typologies && <p className="text-sm text-ink-2">{d.typologies}</p>}
        <p className="mt-1 text-sm font-semibold">{from ? `Desde ${moneyShort(from)}` : "Precio por confirmar"}</p>
      </div>
    </Link>
  );
}

export type { Article };
