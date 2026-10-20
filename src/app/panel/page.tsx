"use client";
import Link from "next/link";
import { ArrowRight, Eye, HouseLine, ChatsCircle, ClipboardText, Sparkle } from "@phosphor-icons/react";
import { ROLE_LABEL, useDB, useSessionUser, visibleLeads, visibleListings } from "@/lib/db";
import { listingHref } from "@/lib/queries";
import { creditName, relTime } from "@/lib/format";
import { Badge, Button, Empty } from "@/components/ui";
import { PageHead, STATUS } from "@/components/panel/Shell";

export default function Resumen() {
  const db = useDB();
  const me = useSessionUser();
  if (!me) return null;
  const listings = visibleListings(db, me);
  const leads = visibleLeads(db, me);
  const week = Date.now() - 7 * 864e5;
  const pub = listings.filter((l) => l.status === "publicado");
  const pending = listings.filter((l) => l.status === "revision");
  const newLeads = leads.filter((l) => l.status === "nuevo");
  const views = pub.reduce((s, l) => s + l.views, 0);
  const fromAgent = leads.filter((l) => l.source === "agente").length;

  // prospectos por semana (últimas 6)
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = Date.now() - i * 7 * 864e5;
    const start = end - 7 * 864e5;
    return { label: i === 0 ? "Esta" : `-${i}`, n: leads.filter((l) => { const t = new Date(l.createdAt).getTime(); return t > start && t <= end; }).length };
  }).reverse();
  const maxW = Math.max(1, ...weeks.map((w) => w.n));

  const kpis = me.role === "colaborador"
    ? [
        { i: HouseLine, label: "Mis borradores", v: listings.filter((l) => l.status === "borrador").length },
        { i: ClipboardText, label: "En revisión", v: pending.length },
        { i: HouseLine, label: "Publicados", v: pub.length },
      ]
    : [
        { i: HouseLine, label: "Inmuebles publicados", v: pub.length },
        { i: ChatsCircle, label: "Prospectos nuevos", v: newLeads.length },
        { i: ClipboardText, label: "Por revisar", v: pending.filter((l) => l.createdBy !== me.id).length },
        { i: Eye, label: "Vistas de tus fichas", v: views.toLocaleString("es-MX") },
      ];

  return (
    <div className="grid gap-8">
      <PageHead
        title={`Hola, ${me.name.split(" ")[0]}`}
        sub={`${ROLE_LABEL[me.role]}${me.orgId ? ` en ${db.orgs.find((o) => o.id === me.orgId)?.name}` : " de Umbral"}.`}
        actions={<Button href="/panel/inmuebles/editar/">{me.role === "colaborador" ? "Nuevo borrador" : "Publicar inmueble"}</Button>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({ i: Icon, label, v }) => (
          <div key={label} className="grid gap-2 rounded-[14px] border border-line bg-card p-5">
            <Icon size={22} className="text-ink-3" />
            <p className="font-display text-4xl font-semibold tracking-tight tabular">{v}</p>
            <p className="text-sm text-ink-2">{label}</p>
          </div>
        ))}
      </div>

      {me.role !== "colaborador" && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[14px] border border-line bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Prospectos nuevos</h2>
              <Link href="/panel/prospectos/" className="inline-flex items-center gap-1 text-sm font-semibold text-brick hover:underline">Ver todos <ArrowRight size={14} /></Link>
            </div>
            {newLeads.length ? (
              <ul className="divide-y divide-line">
                {newLeads.slice(0, 6).map((l) => {
                  const li = db.listings.find((x) => x.id === l.listingId);
                  return (
                    <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                      <span className="font-semibold">{l.name}</span>
                      <span className="text-ink-2">{li?.title ?? "Contacto general"}</span>
                      {l.credit && <Badge>{creditName(l.credit)}</Badge>}
                      {l.source === "agente" && <Badge tone="brick"><Sparkle size={12} weight="fill" /> Asistente</Badge>}
                      <span className="ml-auto text-ink-3">{relTime(l.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="Sin prospectos nuevos">Los contactos desde fichas, perfiles y el asistente aparecen aquí.</Empty>
            )}
          </section>
          <section className="rounded-[14px] border border-line bg-card p-5">
            <h2 className="font-display text-xl font-semibold">Prospectos por semana</h2>
            <p className="text-sm text-ink-2">{fromAgent} de {leads.length} llegaron por el asistente de IA.</p>
            <div className="mt-6 flex h-44 items-end gap-3" role="img" aria-label={`Prospectos por semana: ${weeks.map((w) => `${w.label} ${w.n}`).join(", ")}`}>
              {weeks.map((w) => (
                <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold tabular">{w.n}</span>
                  <div className="w-full rounded-t-[6px] bg-ink" style={{ height: `${(w.n / maxW) * 120 + 4}px` }} />
                  <span className="text-xs text-ink-3">{w.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="rounded-[14px] border border-line bg-card p-5">
        <h2 className="mb-4 font-display text-xl font-semibold">{me.role === "colaborador" ? "Tus inmuebles" : "Inmuebles con más vistas"}</h2>
        {listings.length ? (
          <ul className="divide-y divide-line">
            {[...listings].sort((a, b) => b.views - a.views).slice(0, 6).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <Link href={listingHref(l)} className="font-semibold hover:underline">{l.title}</Link>
                <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
                {l.reviewNote && <span className="text-warn">Nota: {l.reviewNote}</span>}
                <span className="ml-auto inline-flex items-center gap-1 text-ink-3"><Eye size={15} /> {l.views}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Aún no hay inmuebles" action={<Button href="/panel/inmuebles/editar/">Crear el primero</Button>} />
        )}
      </section>
    </div>
  );
}
