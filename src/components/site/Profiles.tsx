"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SealCheck, Clock, MapPin, Phone, EnvelopeSimple, CalendarBlank, Buildings, ArrowRight, UserCircle } from "@phosphor-icons/react";
import { useDB } from "@/lib/db";
import { available, devHref, isSeededListing, orgHref, orgOf, published } from "@/lib/queries";
import { asset, creditName, deliveryLabel, money, moneyShort, TYPE_LABEL } from "@/lib/format";
import { Avatar, Badge, Button, Empty, OrgLogo, cx } from "../ui";
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
  if (!org || org.status !== "activa") return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este perfil no está disponible" action={<Button href="/desarrolladoras/">Ver desarrolladoras</Button>} /></div>;

  const listings = published(db).filter((l) => l.orgId === org.id);
  const shown = listings.filter((l) => (!type || l.type === type) && (!beds || l.bedrooms >= beds));
  const devs = db.developments.filter((d) => d.orgId === org.id);
  const team = db.users.filter((u) => u.orgId === org.id && u.role === "asesor" && u.active);

  return (
    <div>
      <section className="border-b border-line bg-card">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <OrgLogo org={org} size={72} className="rounded-[16px]" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-3">{org.kind === "desarrolladora" ? "Desarrolladora" : "Inmobiliaria"}</p>
                <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                  {org.name}
                  {org.verified && <SealCheck size={34} weight="fill" className="shrink-0 text-ok" aria-label="Desarrolladora verificada" />}
                </h1>
              </div>
            </div>
            <p className="max-w-[60ch] text-lg text-ink-2 text-pretty">{org.tagline}</p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            <div><dt className="text-ink-3">Inmuebles</dt><dd className="font-display text-3xl font-semibold tabular">{listings.filter((l) => l.status === "publicado").length}</dd></div>
            <div><dt className="text-ink-3">Desarrollos</dt><dd className="font-display text-3xl font-semibold tabular">{devs.length}</dd></div>
            <div><dt className="text-ink-3">Responde en</dt><dd className="font-display text-3xl font-semibold tabular">~{org.responseMinutes}<span className="text-base"> min</span></dd></div>
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-14">
          {devs.length > 0 && (
            <section className="grid gap-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Desarrollos</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {devs.map((d) => {
                  const ls = available(db).filter((l) => l.developmentId === d.id);
                  return (
                    <Link key={d.id} href={devHref(d)} className="lift zoom-img overflow-hidden rounded-[16px] border border-line bg-card">
                      <div className="aspect-[16/9] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset(d.images[0])} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                      <div className="grid gap-1 p-5">
                        <p className="font-display text-xl font-semibold">{d.name}</p>
                        <p className="text-sm text-ink-2">{d.colonia}, {d.municipio} · {deliveryLabel(d.delivery, d.deliveryDate)}</p>
                        <p className="mt-1 text-sm font-semibold">{ls.length} modelos{ls.length ? ` desde ${moneyShort(Math.min(...ls.map((l) => l.price)))}` : ""}</p>
                      </div>
                    </Link>
                  );
                })}
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
            <h2 className="font-display text-2xl font-semibold tracking-tight">Sobre {org.name}</h2>
            <p className="max-w-[68ch] text-[17px] leading-relaxed text-ink-2">{org.description}</p>
          </section>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="grid gap-4 rounded-[18px] border border-line bg-card p-6">
            <Button size="lg" onClick={() => setContact(true)}>Contactar a {org.name.split(" ")[0]}</Button>
            <ul className="grid gap-3 text-sm">
              <li className="flex gap-2.5"><Clock size={18} className="shrink-0 text-ink-3" /> {org.hours}</li>
              <li className="flex gap-2.5"><MapPin size={18} className="shrink-0 text-ink-3" /> {org.address}</li>
              <li className="flex gap-2.5"><Phone size={18} className="shrink-0 text-ink-3" /> {org.phone} <span className="text-ink-3">(demo)</span></li>
              <li className="flex gap-2.5"><EnvelopeSimple size={18} className="shrink-0 text-ink-3" /> {org.email}</li>
              <li className="flex gap-2.5"><CalendarBlank size={18} className="shrink-0 text-ink-3" /> Opera desde {org.since}</li>
            </ul>
          </div>
          <div className="grid gap-3 rounded-[18px] border border-line bg-card p-6">
            <p className="font-semibold">Créditos que acepta</p>
            <div className="flex flex-wrap gap-2">{org.credits.map((c) => <Badge key={c}>{creditName(c)}</Badge>)}</div>
          </div>
          {team.length > 0 && (
            <div className="grid gap-3 rounded-[18px] border border-line bg-card p-6">
              <p className="font-semibold">Asesores</p>
              {team.map((u) => (
                <div key={u.id} className="flex items-center gap-3 text-sm">
                  <Avatar name={u.name} size={36} />
                  <div><p className="font-semibold">{u.name}</p><p className="text-ink-2">{u.title}</p></div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} asesor={team[0]} source="perfil" />
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
  if (!d) return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Este desarrollo no está disponible" action={<Button href="/inmuebles/">Ver inmuebles</Button>} /></div>;
  const org = orgOf(db, d.orgId)!;
  const asesor = db.users.find((u) => u.id === models[0]?.asesorId);
  const credits = Array.from(new Set(models.flatMap((m) => m.credits)));
  const from = models.length ? Math.min(...models.map((m) => m.price)) : 0;

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
            <OrgLogo org={org} size={32} /> {org.name} {org.verified && <SealCheck size={18} weight="fill" className="text-ok" />}
          </Link>
          <p className="text-ink-2 text-pretty">{d.description}</p>
          <dl className="grid grid-cols-3 gap-4 border-y border-line py-5">
            <div><dt className="text-sm text-ink-3">Desde</dt><dd className="font-display text-2xl font-semibold tabular">{from ? moneyShort(from) : "Pendiente"}</dd></div>
            <div><dt className="text-sm text-ink-3">Unidades</dt><dd className="font-display text-2xl font-semibold tabular">{d.totalUnits}</dd></div>
            <div><dt className="text-sm text-ink-3">Avance de obra</dt><dd className="font-display text-2xl font-semibold tabular">{d.progress}%</dd></div>
          </dl>
          <div className="h-2 overflow-hidden rounded-full bg-sunk" aria-hidden><div className="h-full rounded-full bg-brick" style={{ width: `${d.progress}%` }} /></div>
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
                      <td className="px-5 py-3.5 tabular">{m.m2Built}</td>
                      <td className="px-5 py-3.5 font-semibold tabular">{money(m.price)}</td>
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
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight">Créditos aceptados</h2>
          <div className="flex flex-wrap gap-2">{credits.map((c) => <Badge key={c}>{creditName(c)}</Badge>)}</div>
          {asesor && (
            <div className="mt-6 flex items-center gap-3 rounded-[14px] border border-line bg-card p-4">
              <Avatar name={asesor.name} size={44} />
              <div className="text-sm"><p className="font-semibold">{asesor.name}</p><p className="text-ink-2">{asesor.title}, atiende {d.name}</p></div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setContact(true)}><UserCircle size={16} /> Contactar</Button>
            </div>
          )}
        </div>
        <div className="grid content-start gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Ubicación</h2>
          <MapView className="h-80 w-full overflow-hidden rounded-[16px] border border-line" points={[{ id: d.id, lat: d.lat, lng: d.lng, label: d.name }]} zoom={14} activeId={d.id} />
          <p className="flex items-center gap-2 text-sm text-ink-3"><Buildings size={16} /> {d.colonia}, {d.municipio}. Ubicación aproximada.</p>
          <Link href={orgHref(org)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brick hover:underline">Más desarrollos de {org.name} <ArrowRight size={14} /></Link>
        </div>
      </section>
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} asesor={asesor} developmentId={d.id} source="desarrollo" />
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
                <p className="text-sm text-ink-2">{o.kind === "desarrolladora" ? "Desarrolladora" : "Inmobiliaria"} · {o.municipios.join(", ")}</p>
              </div>
            </div>
            <p className="text-ink-2 text-pretty">{o.tagline}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span><strong className="tabular">{ls.length}</strong> inmuebles</span>
              <span><strong className="tabular">{devs.length}</strong> desarrollos</span>
              <span>Responde en <strong className="tabular">~{o.responseMinutes} min</strong></span>
            </div>
            <div className="flex flex-wrap gap-1.5">{o.credits.map((c) => <span key={c} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2">{creditName(c)}</span>)}</div>
          </Link>
        );
      })}
    </div>
  );
}
