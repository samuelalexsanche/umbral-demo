"use client";
import { useState } from "react";
import { money, monthlyPayment } from "@/lib/format";

/** Simulador orientativo de crédito hipotecario bancario a tasa fija. */
export default function MortgageCalc({ price }: { price: number }) {
  const [down, setDown] = useState(10);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(10.5);
  const loan = price * (1 - down / 100);
  const pay = monthlyPayment(loan, rate, years);
  return (
    <div className="grid gap-5 rounded-[14px] border border-line bg-card p-5">
      <div>
        <p className="text-sm text-ink-2">Mensualidad estimada con crédito bancario</p>
        <p className="font-display text-4xl font-semibold tracking-tight tabular">{money(Math.round(pay))}</p>
        <p className="text-xs text-ink-3">Enganche de {money(Math.round(price * down / 100))} y crédito de {money(Math.round(loan))}.</p>
      </div>
      <Range label="Enganche" value={down} min={5} max={50} step={5} suffix="%" onChange={setDown} />
      <Range label="Plazo" value={years} min={5} max={20} step={5} suffix=" años" onChange={setYears} />
      <Range label="Tasa anual" value={rate} min={8} max={14} step={0.25} suffix="%" onChange={setRate} />
      <p className="text-xs text-ink-3">Estimación sin seguros, comisiones ni gastos de escrituración. Tu banco te dará la tasa y el monto reales según tu perfil.</p>
    </div>
  );
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (n: number) => void }) {
  const id = `r-${label}`;
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="font-semibold text-ink-2">{label}</label>
        <output htmlFor={id} className="font-semibold tabular">{value}{suffix}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}
