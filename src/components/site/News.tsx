"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CurrencyDollar } from "@phosphor-icons/react";
import type { Article, ArticleCategory } from "@/lib/types";
import { useDB } from "@/lib/db";
import { asset } from "@/lib/format";
import { orgOf, devHref, orgHref } from "@/lib/queries";
import { Badge, Button, Empty, cx } from "../ui";

export const CATEGORY: Record<ArticleCategory, string> = {
  mercado: "Mercado inmobiliario",
  financieras: "Noticias financieras",
  proyectos: "Nuevos proyectos",
  global: "Mercado global",
  entrevista: "Entrevistas",
  avance: "Avance de obra",
  lanzamiento: "Lanzamiento",
};

export const articleHref = (a: Pick<Article, "id">) => `/noticias/ver/?id=${a.id}`;

const longDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

export function ArticleCard({ a }: { a: Article }) {
  const db = useDB();
  const org = orgOf(db, a.orgId);
  return (
    <Link href={articleHref(a)} className="lift zoom-img grid content-start overflow-hidden rounded-[16px] border border-line bg-card">
      {a.image && (
        <div className="aspect-[16/10] overflow-hidden bg-sunk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(a.image)} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="grid gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <Badge tone={a.category === "avance" || a.category === "lanzamiento" ? "brick" : "neutral"}>{CATEGORY[a.category]}</Badge>
          <span>{longDate(a.date)}</span>
        </div>
        <p className="font-display text-lg font-semibold leading-snug text-balance">{a.title}</p>
        <p className="line-clamp-3 text-sm text-ink-2">{a.summary}</p>
        {org && <p className="text-xs font-semibold text-ink-3">{org.name}</p>}
      </div>
    </Link>
  );
}

/** Tipo de cambio del día. Fuente gratuita sin llave (exchangerate-api, actualiza cada 24 h). */
export function FxTicker({ className }: { className?: string }) {
  const [fx, setFx] = useState<{ usd: number; eur: number; cad: number; at: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("https://open.er-api.com/v6/latest/MXN")
      .then((r) => r.json())
      .then((j) => {
        if (!alive || j.result !== "success") throw new Error();
        setFx({ usd: 1 / j.rates.USD, eur: 1 / j.rates.EUR, cad: 1 / j.rates.CAD, at: j.time_last_update_utc });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  const n = (v: number) => v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <section className={cx("grid gap-3 rounded-[18px] border border-line bg-card p-5", className)} aria-label="Tipo de cambio">
      <p className="flex items-center gap-2 font-semibold"><CurrencyDollar size={19} /> Tipo de cambio</p>
      {failed ? (
        <p className="text-sm text-ink-3">No se pudo cargar el tipo de cambio en este momento.</p>
      ) : !fx ? (
        <div className="h-20 animate-pulse rounded-[10px] bg-sunk" />
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[["Dólar", fx.usd], ["Euro", fx.eur], ["Dólar canadiense", fx.cad]].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-xs text-ink-3">{k}</dt>
                <dd className="font-display text-xl font-semibold tabular">${n(v as number)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-ink-3">Pesos por unidad. Referencia de mercado actualizada el {new Date(fx.at).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}; los bancos aplican su propio tipo de cambio.</p>
        </>
      )}
    </section>
  );
}

const FILTERS: (ArticleCategory | "")[] = ["", "mercado", "financieras", "proyectos", "global", "entrevista", "avance", "lanzamiento"];

export function NewsIndex() {
  const db = useDB();
  const [cat, setCat] = useState<ArticleCategory | "">("");
  const all = db.articles.filter((a) => a.published).sort((a, b) => b.date.localeCompare(a.date));
  const list = all.filter((a) => !cat || a.category === cat);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categoría">
          {FILTERS.map((c) => (
            <button key={c || "todas"} onClick={() => setCat(c)} aria-pressed={cat === c} className={cx("press h-9 rounded-full px-3.5 text-sm font-semibold", cat === c ? "bg-ink text-paper" : "border border-line bg-card text-ink-2")}>
              {c ? CATEGORY[c] : "Todas"}
            </button>
          ))}
        </div>
        {list.length ? (
          <div className="grid gap-5 sm:grid-cols-2">{list.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        ) : (
          <Empty title="Aún no hay publicaciones en esta categoría" />
        )}
      </div>
      <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
        <FxTicker />
        <div className="grid gap-2 rounded-[18px] border border-line bg-card p-5 text-sm text-ink-2">
          <p className="font-semibold text-ink">Contenido de fuentes fiables</p>
          <p>Cada nota indica su fuente. Los avances y lanzamientos los publica la propia desarrolladora.</p>
        </div>
      </aside>
    </div>
  );
}

export function ArticleView({ id }: { id: string }) {
  const db = useDB();
  const a = db.articles.find((x) => x.id === id && x.published);
  if (!a) return <div className="mx-auto max-w-3xl px-4 py-24"><Empty title="Esta nota no está disponible" action={<Button href="/noticias/">Ver noticias</Button>} /></div>;
  const org = orgOf(db, a.orgId);
  const dev = a.developmentId ? db.developments.find((d) => d.id === a.developmentId) : undefined;
  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 pt-10 sm:px-6">
      <nav aria-label="Ruta" className="text-sm text-ink-3"><Link href="/noticias/" className="hover:text-ink">Noticias</Link> / {CATEGORY[a.category]}</nav>
      <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">{a.title}</h1>
      <p className="text-lg text-ink-2 text-pretty">{a.summary}</p>
      <p className="text-sm text-ink-3">{longDate(a.date)}{a.author ? ` · ${a.author}` : ""}{org ? ` · ${org.name}` : ""}</p>
      {a.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset(a.image)} alt="" className="w-full rounded-[18px]" />
      )}
      <div className="grid gap-4 text-[17px] leading-relaxed text-ink-2">
        {a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {(a.source || a.sourceUrl) && (
        <p className="border-t border-line pt-4 text-sm text-ink-3">
          Fuente: {a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">{a.source || a.sourceUrl} <ArrowUpRight size={13} /></a> : a.source}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {dev && <Button href={devHref(dev)} variant="outline">Ver {dev.name}</Button>}
        {org && <Button href={orgHref(org)} variant="ghost">Perfil de {org.name}</Button>}
      </div>
    </article>
  );
}
