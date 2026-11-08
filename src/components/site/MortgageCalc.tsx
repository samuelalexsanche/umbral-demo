"use client";
import { useState } from "react";
import { useDB } from "@/lib/db";
import { money, monthlyPayment } from "@/lib/format";
import { Input, Select } from "../ui";

/** Simulador de crédito hipotecario bancario a tasa fija, con las tasas que publica el administrador. */
export default function MortgageCalc({ price: fixedPrice, onBank }: { price?: number; onBank?: (bankId: string) => void }) {
  const db = useDB();
  const banks = [...db.banks].sort((a, b) => a.rate - b.rate);
  const [bankId, setBankId] = useState("");
  const [custom, setCustom] = useState(4_000_000);
  const [down, setDown] = useState(10);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(banks[0]?.rate ?? 10.5);
  const price = fixedPrice ?? custom;
  const bank = banks.find((b) => b.id === bankId);
  const loan = price * (1 - down / 100);
  const pay = monthlyPayment(loan, rate, years);

  function pick(id: string) {
    setBankId(id);
    onBank?.(id);
    const b = banks.find((x) => x.id === id);
    if (b) {
      setRate(b.rate);
      setDown((d) => Math.max(d, b.minDown));
      setYears((y) => Math.min(y, b.maxYears));
    }
  }

  return (
    <div className="grid gap-5 rounded-[14px] border border-line bg-card p-5">
      <div>
        <p className="text-sm text-ink-2">Mensualidad estimada{bank ? ` con ${bank.bank}` : " con crédito bancario"}</p>
        <p className="font-display text-4xl font-semibold tracking-tight tabular">{money(Math.round(pay))}</p>
        <p className="text-xs text-ink-3">Enganche de {money(Math.round((price * down) / 100))} y crédito de {money(Math.round(loan))}.</p>
      </div>
      {fixedPrice === undefined && (
        <label className="grid gap-1.5 text-sm font-semibold text-ink-2">
          Precio del inmueble
          <Input inputMode="numeric" value={custom ? custom.toLocaleString("es-MX") : ""} onChange={(e) => setCustom(Number(e.target.value.replace(/\D/g, "")) || 0)} />
        </label>
      )}
      {banks.length > 0 && (
        <label className="grid gap-1.5 text-sm font-semibold text-ink-2">
          Banco
          <Select value={bankId} onChange={(e) => pick(e.target.value)}>
            <option value="">Tasa libre</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.bank}: {b.rate}% anual</option>)}
          </Select>
        </label>
      )}
      <Range label="Enganche" value={down} min={bank?.minDown ?? 5} max={50} step={5} suffix="%" onChange={setDown} />
      <Range label="Plazo" value={years} min={5} max={bank?.maxYears ?? 20} step={5} suffix=" años" onChange={setYears} />
      <Range label="Tasa anual" value={rate} min={7} max={16} step={0.05} suffix="%" onChange={setRate} />
      <p className="text-xs text-ink-3">Estimación sin seguros, comisiones ni gastos de escrituración. El banco da la tasa y el monto reales según tu perfil.</p>
    </div>
  );
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (n: number) => void }) {
  const id = `r-${label}`;
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="font-semibold text-ink-2">{label}</label>
        <output htmlFor={id} className="font-semibold tabular">{Number(value.toFixed(2))}{suffix}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}
