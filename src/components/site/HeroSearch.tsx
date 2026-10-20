"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { CreditId } from "@/lib/types";
import { useDB } from "@/lib/db";
import { available, MUNICIPIOS } from "@/lib/queries";
import { moneyShort } from "@/lib/format";
import { Select, cx } from "../ui";
import MapView from "./MapView";

const CHOICES: { id: CreditId | "todos"; label: string }[] = [
  { id: "todos", label: "Cualquiera" },
  { id: "infonavit", label: "Infonavit" },
  { id: "fovissste", label: "Fovissste" },
  { id: "bancario", label: "Banco" },
  { id: "cofinavit", label: "Cofinavit" },
  { id: "contado", label: "Contado" },
];

const BUDGETS = [0, 2_000_000, 3_000_000, 4_500_000, 6_000_000, 8_000_000];

/** Momento firma: eliges con qué compras y el mapa enciende solo lo que te alcanza. */
export default function HeroSearch() {
  const db = useDB();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [credit, setCredit] = useState<CreditId | "todos">("todos");
  const [muni, setMuni] = useState("");
  const [max, setMax] = useState(0);

  const all = available(db);
  const match = useMemo(
    () => all.filter((l) => (credit === "todos" || l.credits.includes(credit)) && (!muni || l.municipio === muni) && (!max || l.price <= max)),
    [all, credit, muni, max],
  );
  const ids = new Set(match.map((l) => l.id));
  const points = all.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, label: "", off: !ids.has(l.id) }));
  const from = match.length ? Math.min(...match.map((l) => l.price)) : 0;

  function go() {
    const p = new URLSearchParams();
    if (credit !== "todos") p.set("c", credit);
    if (muni) p.set("m", muni);
    if (max) p.set("pmax", String(max));
    router.push(`/inmuebles/${p.size ? `?${p}` : ""}`);
  }

  return (
    <section className="mx-auto grid max-w-[1400px] gap-8 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-14">
      <div className="grid content-center gap-7">
        <h1 className="font-display text-[clamp(2.5rem,5.4vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">
          Casas nuevas en Guadalajara que sí aceptan tu crédito.
        </h1>
        <p className="max-w-[46ch] text-lg text-ink-2 text-pretty">
          Elige con qué vas a comprar y ve solo lo que te alcanza. Cada inmueble lo publica su desarrolladora y lo atiende un asesor con nombre.
        </p>

        <div className="grid gap-4 rounded-[18px] border border-line bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-ink-2">¿Con qué vas a comprar?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={credit === c.id}
                  onClick={() => setCredit(c.id)}
                  className={cx(
                    "press relative h-10 rounded-full px-4 text-[15px] font-semibold",
                    credit === c.id ? "text-white" : "border border-line text-ink-2 hover:border-ink-3 hover:text-ink",
                  )}
                >
                  {credit === c.id && (
                    <motion.span layoutId="credit-pill" className="absolute inset-0 rounded-full bg-brick" transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0.15 }} />
                  )}
                  <span className="relative">{c.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-1.5 text-sm font-semibold text-ink-2">
              Municipio
              <Select value={muni} onChange={(e) => setMuni(e.target.value)}>
                <option value="">Toda la zona metropolitana</option>
                {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink-2">
              Precio máximo
              <Select value={max} onChange={(e) => setMax(Number(e.target.value))}>
                {BUDGETS.map((b) => <option key={b} value={b}>{b ? `Hasta ${moneyShort(b)}` : "Sin límite"}</option>)}
              </Select>
            </label>
            <button onClick={go} className="press mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-paper hover:bg-slate">
              <MagnifyingGlass size={18} weight="bold" /> Ver
            </button>
          </div>
          <div className="flex items-baseline gap-2 border-t border-line pt-4" aria-live="polite">
            <span className="relative inline-flex h-[1.15em] overflow-hidden font-display text-4xl font-semibold tracking-tight tabular">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={match.length}
                  initial={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                >
                  {match.length}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-ink-2">
              {match.length === 1 ? "inmueble disponible" : "inmuebles disponibles"}
              {match.length > 0 && <> desde <strong className="text-ink tabular">{moneyShort(from)}</strong></>}
            </span>
          </div>
        </div>
      </div>

      <div className="relative min-h-[360px] overflow-hidden rounded-[22px] border border-line lg:min-h-[560px]">
        <MapView points={points} mode="dot" className="absolute inset-0" />
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex justify-between gap-3 text-xs">
          <span className="rounded-full bg-card/95 px-3 py-1.5 font-semibold shadow-sm backdrop-blur">
            <span className="mr-1.5 inline-block size-2.5 rounded-full bg-brick align-middle" /> Te alcanza
          </span>
          <span className="rounded-full bg-card/95 px-3 py-1.5 text-ink-2 shadow-sm backdrop-blur">Área metropolitana de Guadalajara</span>
        </div>
      </div>
    </section>
  );
}
