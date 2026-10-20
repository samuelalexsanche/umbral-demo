"use client";
import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { addPlatformRequest } from "@/lib/db";
import { Button, Field, Input, Select } from "@/components/ui";

export default function RequestForm() {
  const [f, setF] = useState({ company: "", name: "", phone: "", email: "", units: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.company.trim().length < 2) er.company = "Escribe el nombre de tu desarrolladora o inmobiliaria.";
    if (f.name.trim().length < 2) er.name = "Escribe tu nombre.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = "Revisa el correo.";
    setErr(er);
    if (Object.keys(er).length) return;
    addPlatformRequest(f);
    setOk(true);
  }
  if (ok)
    return (
      <div className="grid gap-3 rounded-[18px] border border-line bg-card p-8 text-center">
        <CheckCircle size={44} weight="fill" className="mx-auto text-ok" />
        <p className="font-display text-2xl font-semibold">Solicitud recibida</p>
        <p className="text-ink-2">El equipo de Umbral te contactará para agendar la demo. La solicitud ya aparece en el panel del administrador general.</p>
      </div>
    );
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-[18px] border border-line bg-card p-6 sm:p-8">
      <p className="font-display text-2xl font-semibold">Solicitar una demo</p>
      <Field label="Desarrolladora o inmobiliaria" htmlFor="r-co" error={err.company}><Input id="r-co" value={f.company} onChange={set("company")} aria-invalid={!!err.company} /></Field>
      <Field label="Tu nombre" htmlFor="r-n" error={err.name}><Input id="r-n" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!err.name} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="r-p" error={err.phone}><Input id="r-p" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} aria-invalid={!!err.phone} /></Field>
        <Field label="Correo" htmlFor="r-e" error={err.email}><Input id="r-e" type="email" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!err.email} /></Field>
      </div>
      <Field label="¿Cuántas unidades tienes en venta?" htmlFor="r-u">
        <Select id="r-u" value={f.units} onChange={set("units")}>
          <option value="">Selecciona</option>
          <option>Menos de 50</option><option>50 a 200</option><option>200 a 500</option><option>Más de 500</option>
        </Select>
      </Field>
      <Button type="submit" size="lg">Enviar solicitud</Button>
    </form>
  );
}
