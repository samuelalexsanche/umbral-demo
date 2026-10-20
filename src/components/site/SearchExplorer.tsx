"use client";
import { useEffect, useMemo, useState } from "react";
import { FunnelSimple, MapTrifold, SquaresFour, X, MagnifyingGlass } from "@phosphor-icons/react";
import type { CreditId, Delivery, Listing, PropertyType } from "@/lib/types";
import { useDB } from "@/lib/db";
import { CREDITS } from "@/lib/seed";
import { isSeededListing, MUNICIPIOS, orgOf, published } from "@/lib/queries";
import { moneyShort, TYPE_LABEL } from "@/lib/format";
import { Button, Dialog, Empty, Input, Select, cx } from "../ui";
import ListingCard from "./ListingCard";
import MapView from "./MapView";

export interface Filters {
  q: string;
  m: string;
  o: string;
  d: string;
  t: PropertyType | "";
  c: CreditId[];
  pmin: number;
  pmax: number;
  r: number;
  b: number;
  p: number;
  e: Delivery | "";
  a: string[];
  s: "relevancia" | "precio-asc" | "precio-desc" | "recientes" | "m2";
  vendidos: boolean;
}

const EMPTY: Filters = { q: "", m: "", o: "", d: "", t: "", c: [], pmin: 0, pmax: 0, r: 0, b: 0, p: 0, e: "", a: [], s: "relevancia", vendidos: false };

function fromURL(): Filters {
  const u = new URLSearchParams(window.location.search);
  const n = (k: string) => Number(u.get(k)) || 0;
  return {
    ...EMPTY,
    q: u.get("q") ?? "",
    m: u.get("m") ?? "",
    o: u.get("o") ?? "",
    d: u.get("d") ?? "",
    t: (u.get("t") as PropertyType) ?? "",
    c: (u.get("c")?.split(",").filter(Boolean) as CreditId[]) ?? [],
    pmin: n("pmin"),
    pmax: n("pmax"),
    r: n("r"),
    b: n("b"),
    p: n("p"),
    e: (u.get("e") as Delivery) ?? "",
    a: u.get("a")?.split(",").filter(Boolean) ?? [],
    s: (u.get("s") as Filters["s"]) || "relevancia",
    vendidos: u.get("vendidos") === "1",
  };
}

function toURL(f: Filters) {
  const u = new URLSearchParams();
  (Object.keys(f) as (keyof Filters)[]).forEach((k) => {
    const v = f[k];
    if (Array.isArray(v) ? v.length : v && v !== EMPTY[k]) u.set(k, Array.isArray(v) ? v.join(",") : v === true ? "1" : String(v));
  });
  const qs = u.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function applyFilters(list: Listing[], f: Filters, devName: (id?: string) => string, orgName: (id: string) => string) {
  const q = norm(f.q.trim());
  const out = list.filter(
    (l) =>
      (f.vendidos || l.status === "publicado") &&
      (!q || norm(`${l.title} ${l.colonia} ${l.municipio} ${devName(l.developmentId)} ${orgName(l.orgId)}`).includes(q)) &&
      (!f.m || l.municipio === f.m) &&
      (!f.o || l.orgId === f.o) &&
      (!f.d || l.developmentId === f.d) &&
      (!f.t || l.type === f.t) &&
      (!f.c.length || f.c.some((c) => l.credits.includes(c))) &&
      (!f.pmin || l.price >= f.pmin) &&
      (!f.pmax || l.price <= f.pmax) &&
      (!f.r || l.bedrooms >= f.r) &&
      (!f.b || l.bathrooms >= f.b) &&
      (!f.p || l.parking >= f.p) &&
      (!f.e || l.delivery === f.e) &&
      (!f.a.length || f.a.every((a) => l.amenities.includes(a))),
  );
  const sorters: Record<Filters["s"], (a: Listing, b: Listing) => number> = {
    relevancia: (a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views,
    "precio-asc": (a, b) => a.price - b.price,
    "precio-desc": (a, b) => b.price - a.price,
    recientes: (a, b) => b.createdAt.localeCompare(a.createdAt),
    m2: (a, b) => b.m2Built - a.m2Built,
  };
  return out.sort(sorters[f.s]);
}

export default function SearchExplorer() {
  const db = useDB();
  const [f, setF] = useState<Filters>(EMPTY);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"split" | "grid">("split");
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    setF(fromURL());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) toURL(f);
  }, [f, ready]);

  const base = published(db);
  const devName = (id?: string) => db.developments.find((d) => d.id === id)?.name ?? "";
  const orgName = (id: string) => db.orgs.find((o) => o.id === id)?.name ?? "";
  const results = useMemo(() => applyFilters(base, f, devName, orgName), [base, f]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <K extends "c" | "a">(k: K, v: string) =>
    setF((x) => ({ ...x, [k]: (x[k] as string[]).includes(v) ? (x[k] as string[]).filter((y) => y !== v) : [...(x[k] as string[]), v] }));

  const activeCount = [f.m, f.o, f.d, f.t, f.pmin, f.pmax, f.r, f.b, f.p, f.e, f.vendidos].filter(Boolean).length + f.c.length + f.a.length;
  const orgs = db.orgs.filter((o) => o.status === "activa");
  const devs = db.developments.filter((d) => !f.o || d.orgId === f.o);

  const chips: { label: string; clear: () => void }[] = [
    ...(f.m ? [{ label: f.m, clear: () => set("m", "") }] : []),
    ...(f.o ? [{ label: orgName(f.o), clear: () => set("o", "") }] : []),
    ...(f.d ? [{ label: devName(f.d), clear: () => set("d", "") }] : []),
    ...(f.t ? [{ label: TYPE_LABEL[f.t], clear: () => set("t", "") }] : []),
    ...f.c.map((c) => ({ label: CREDITS.find((x) => x.id === c)!.name, clear: () => toggle("c", c) })),
    ...(f.pmin ? [{ label: `Desde ${moneyShort(f.pmin)}`, clear: () => set("pmin", 0) }] : []),
    ...(f.pmax ? [{ label: `Hasta ${moneyShort(f.pmax)}`, clear: () => set("pmax", 0) }] : []),
    ...(f.r ? [{ label: `${f.r}+ recámaras`, clear: () => set("r", 0) }] : []),
    ...(f.b ? [{ label: `${f.b}+ baños`, clear: () => set("b", 0) }] : []),
    ...(f.p ? [{ label: `${f.p}+ estacionamientos`, clear: () => set("p", 0) }] : []),
    ...(f.e ? [{ label: f.e === "preventa" ? "Preventa" : "Entrega inmediata", clear: () => set("e", "") }] : []),
    ...f.a.map((a) => ({ label: a, clear: () => toggle("a", a) })),
  ];

  const panel = (
    <div className="grid gap-6">
      <Group label="Créditos que acepta">
        <div className="flex flex-wrap gap-2">
          {CREDITS.map((c) => (
            <Chip key={c.id} on={f.c.includes(c.id)} onClick={() => toggle("c", c.id)}>{c.name}</Chip>
          ))}
        </div>
      </Group>
      <div className="grid grid-cols-2 gap-3">
        <Group label="Municipio">
          <Select value={f.m} onChange={(e) => set("m", e.target.value)}>
            <option value="">Todos</option>
            {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Group>
        <Group label="Tipo">
          <Select value={f.t} onChange={(e) => set("t", e.target.value as PropertyType)}>
            <option value="">Todos</option>
            {(Object.keys(TYPE_LABEL) as PropertyType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </Select>
        </Group>
        <Group label="Desarrolladora o inmobiliaria">
          <Select value={f.o} onChange={(e) => setF((x) => ({ ...x, o: e.target.value, d: "" }))}>
            <option value="">Todas</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </Group>
        <Group label="Desarrollo">
          <Select value={f.d} onChange={(e) => set("d", e.target.value)}>
            <option value="">Todos</option>
            {devs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Group>
        <Group label="Precio desde">
          <Select value={f.pmin} onChange={(e) => set("pmin", Number(e.target.value))}>
            {[0, 1_500_000, 2_500_000, 3_500_000, 5_000_000, 7_000_000].map((v) => <option key={v} value={v}>{v ? moneyShort(v) : "Sin mínimo"}</option>)}
          </Select>
        </Group>
        <Group label="Precio hasta">
          <Select value={f.pmax} onChange={(e) => set("pmax", Number(e.target.value))}>
            {[0, 2_000_000, 3_000_000, 4_500_000, 6_000_000, 8_000_000, 10_000_000].map((v) => <option key={v} value={v}>{v ? moneyShort(v) : "Sin máximo"}</option>)}
          </Select>
        </Group>
      </div>
      <Group label="Recámaras">
        <Steps value={f.r} options={[0, 1, 2, 3, 4]} onChange={(v) => set("r", v)} />
      </Group>
      <div className="grid grid-cols-2 gap-3">
        <Group label="Baños">
          <Steps value={f.b} options={[0, 1, 2, 3]} onChange={(v) => set("b", v)} />
        </Group>
        <Group label="Estacionamientos">
          <Steps value={f.p} options={[0, 1, 2, 3]} onChange={(v) => set("p", v)} />
        </Group>
      </div>
      <Group label="Entrega">
        <div className="flex flex-wrap gap-2">
          <Chip on={f.e === ""} onClick={() => set("e", "")}>Cualquiera</Chip>
          <Chip on={f.e === "entrega-inmediata"} onClick={() => set("e", "entrega-inmediata")}>Entrega inmediata</Chip>
          <Chip on={f.e === "preventa"} onClick={() => set("e", "preventa")}>Preventa</Chip>
        </div>
      </Group>
      <Group label="Amenidades">
        <div className="flex flex-wrap gap-2">
          {db.amenities.map((a) => <Chip key={a} on={f.a.includes(a)} onClick={() => toggle("a", a)}>{a}</Chip>)}
        </div>
      </Group>
      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-2">
        <input type="checkbox" checked={f.vendidos} onChange={(e) => set("vendidos", e.target.checked)} className="size-4" /> Mostrar también los agotados
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6">
      <div className="grid gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Casas y departamentos nuevos en Guadalajara</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1">
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <Input aria-label="Buscar por colonia, desarrollo o desarrolladora" placeholder="Colonia, desarrollo o desarrolladora" value={f.q} onChange={(e) => set("q", e.target.value)} className="rounded-full pl-10" />
          </div>
          <Button variant="outline" onClick={() => setSheet(true)}>
            <FunnelSimple size={18} /> Filtros{activeCount ? ` (${activeCount})` : ""}
          </Button>
          <Select aria-label="Ordenar" value={f.s} onChange={(e) => set("s", e.target.value as Filters["s"])} className="w-auto rounded-full">
            <option value="relevancia">Más relevantes</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="recientes">Más recientes</option>
            <option value="m2">Más metros</option>
          </Select>
          <div className="hidden rounded-full border border-line bg-card p-1 lg:flex" role="group" aria-label="Vista">
            <button onClick={() => setView("split")} aria-pressed={view === "split"} className={cx("press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "split" ? "bg-ink text-paper" : "text-ink-2")}><MapTrifold size={16} /> Mapa</button>
            <button onClick={() => setView("grid")} aria-pressed={view === "grid"} className={cx("press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold", view === "grid" ? "bg-ink text-paper" : "text-ink-2")}><SquaresFour size={16} /> Cuadrícula</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <p className="mr-2 text-sm text-ink-2"><strong className="text-ink tabular">{results.length}</strong> {results.length === 1 ? "resultado" : "resultados"}</p>
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="press inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-medium text-paper hover:bg-slate">
              {c.label} <X size={13} aria-label="Quitar" />
            </button>
          ))}
          {chips.length > 0 && <button onClick={() => setF({ ...EMPTY, q: f.q, s: f.s })} className="text-sm font-semibold text-brick hover:underline">Quitar filtros</button>}
        </div>
      </div>

      <div className={cx("mt-6 grid gap-6", view === "split" && "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]")}>
        <div>
          {results.length === 0 ? (
            <Empty title="Nada coincide con todos tus filtros" action={<Button variant="outline" onClick={() => setF(EMPTY)}>Quitar filtros</Button>}>
              Prueba con otro crédito o sube el precio máximo. También puedes preguntarle al asistente de cada desarrolladora.
            </Empty>
          ) : (
            <div className={cx("grid gap-5 sm:grid-cols-2", view === "grid" && "lg:grid-cols-3 xl:grid-cols-4")}>
              {results.map((l) => (
                <ListingCard key={l.id} l={l} org={orgOf(db, l.orgId)} seeded={isSeededListing(l.id)} active={active === l.id} onHover={setActive} />
              ))}
            </div>
          )}
        </div>
        {view === "split" && (
          <div className="hidden lg:block">
            <div className="sticky top-20 h-[calc(100dvh-6rem)] overflow-hidden rounded-[16px] border border-line">
              <MapView
                className="h-full w-full"
                points={results.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, label: moneyShort(l.price) }))}
                activeId={active}
                onSelect={(id) => {
                  setActive(id);
                  document.getElementById(`card-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filtros" wide>
        {panel}
        <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 flex items-center justify-between gap-3 border-t border-line bg-card px-6 py-4">
          <button onClick={() => setF({ ...EMPTY, q: f.q, s: f.s })} className="font-semibold text-ink-2 hover:text-ink">Limpiar</button>
          <Button onClick={() => setSheet(false)}>Ver {results.length} {results.length === 1 ? "resultado" : "resultados"}</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-ink-2">{label}</p>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cx("press h-9 rounded-full px-3.5 text-sm font-medium", on ? "bg-ink text-paper" : "border border-line bg-card text-ink-2 hover:border-ink-3")}>
      {children}
    </button>
  );
}

function Steps({ value, options, onChange }: { value: number; options: number[]; onChange: (v: number) => void }) {
  return (
    <div className="flex overflow-hidden rounded-full border border-line bg-card">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={cx("h-9 flex-1 text-sm font-semibold transition-colors", value === o ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunk")}>
          {o === 0 ? "Todas" : `${o}+`}
        </button>
      ))}
    </div>
  );
}
