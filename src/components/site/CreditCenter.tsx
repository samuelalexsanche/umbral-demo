"use client";
import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { createLead, useDB } from "@/lib/db";
import { Button, Field, Input, Select, Textarea } from "../ui";
import MortgageCalc from "./MortgageCalc";

export function BankRates() {
  const db = useDB();
  const banks = [...db.banks].sort((a, b) => a.rate - b.rate);
  if (!banks.length) return null;
  const updated = banks.reduce((m, b) => (b.updatedAt > m ? b.updatedAt : m), banks[0].updatedAt);
  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-[16px] border border-line bg-card">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-line text-ink-3">
            <tr>{["Banco", "Producto", "Tasa anual", "CAT", "Enganche mínimo", "Plazo máximo"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {banks.map((b, i) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3.5 font-semibold">{b.bank}{i === 0 && <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 text-xs text-ok">Menor tasa</span>}</td>
                <td className="px-5 py-3.5 text-ink-2">{b.product}</td>
                <td className="px-5 py-3.5 font-semibold tabular">{b.rate}%</td>
                <td className="px-5 py-3.5 tabular text-ink-2">{b.cat ? `${b.cat}%` : "-"}</td>
                <td className="px-5 py-3.5 tabular">{b.minDown}%</td>
                <td className="px-5 py-3.5 tabular">{b.maxYears} años</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-3">Tasas de referencia actualizadas el {new Date(updated).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}. La tasa final depende de tu perfil y la confirma el banco.</p>
    </div>
  );
}

export function CreditSimulator() {
  return <MortgageCalc />;
}

export function CreditRequest() {
  const db = useDB();
  const [f, setF] = useState({ name: "", phone: "", email: "", bankId: "", income: "", developmentId: "", message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Escribe tu nombre.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = "Revisa el correo.";
    setErr(er);
    if (Object.keys(er).length) return;
    const dev = db.developments.find((d) => d.id === f.developmentId);
    const bank = db.banks.find((b) => b.id === f.bankId);
    const ok = await createLead({
      orgId: dev?.orgId,
      developmentId: dev?.id,
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      credit: "bancario",
      bankId: f.bankId || undefined,
      message: [`Quiere tramitar crédito bancario${bank ? ` con ${bank.bank}` : ""}.`, f.income && `Ingreso mensual aproximado: ${f.income}.`, f.message.trim()].filter(Boolean).join(" "),
      source: "credito",
    });
    if (!ok) return setErr({ name: "No se pudo enviar. Intenta de nuevo en un momento." });
    setSent(true);
  }

  if (sent)
    return (
      <div className="grid gap-3 rounded-[18px] border border-line bg-card p-8 text-center">
        <CheckCircle size={48} weight="fill" className="mx-auto text-ok" />
        <p className="font-display text-2xl font-semibold">Recibimos tu solicitud</p>
        <p className="text-ink-2">Un asesor de Umbral te llama para revisar tu perfil, comparar bancos y acompañarte en el trámite.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-[18px] border border-line bg-card p-6 sm:p-8">
      <Field label="Nombre" htmlFor="cr-n" error={err.name}><Input id="cr-n" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!err.name} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="cr-p" error={err.phone}><Input id="cr-p" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} aria-invalid={!!err.phone} /></Field>
        <Field label="Correo (opcional)" htmlFor="cr-e" error={err.email}><Input id="cr-e" type="email" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!err.email} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Banco de interés" htmlFor="cr-b">
          <Select id="cr-b" value={f.bankId} onChange={set("bankId")}>
            <option value="">Que me recomienden</option>
            {db.banks.map((b) => <option key={b.id} value={b.id}>{b.bank}</option>)}
          </Select>
        </Field>
        <Field label="Desarrollo de interés" htmlFor="cr-d">
          <Select id="cr-d" value={f.developmentId} onChange={set("developmentId")}>
            <option value="">Aún no lo sé</option>
            {db.developments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Ingreso mensual aproximado (opcional)" htmlFor="cr-i" hint="Ayuda a estimar cuánto te prestaría el banco."><Input id="cr-i" inputMode="numeric" value={f.income} onChange={set("income")} /></Field>
      <Field label="Comentarios (opcional)" htmlFor="cr-m"><Textarea id="cr-m" rows={3} value={f.message} onChange={set("message")} /></Field>
      <Button type="submit" size="lg">Quiero tramitar mi crédito</Button>
      <p className="text-center text-xs text-ink-3">El trámite con nosotros no tiene costo para ti. Nunca te pediremos depósitos para aprobar un crédito.</p>
    </form>
  );
}
