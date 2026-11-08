"use client";
import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { submitApplication } from "@/lib/db";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export default function ApplicationForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", experience: "", zone: "", message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 5) er.name = "Escribe nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) er.email = "Escribe un correo válido; será tu usuario.";
    if (f.phone.replace(/\D/g, "").length < 10) er.phone = "Escribe un teléfono de 10 dígitos.";
    if (!f.experience) er.experience = "Elige tu experiencia.";
    setErr(er);
    if (Object.keys(er).length) return;
    const r = submitApplication({ ...f, name: f.name.trim(), phone: f.phone.trim(), company: f.company.trim(), zone: f.zone.trim(), message: f.message.trim() });
    if (!r.ok) return setErr({ email: r.error });
    setSent(true);
  }

  if (sent)
    return (
      <div className="grid gap-3 rounded-[18px] border border-line bg-card p-8 text-center">
        <CheckCircle size={48} weight="fill" className="mx-auto text-ok" />
        <p className="font-display text-2xl font-semibold">Recibimos tu solicitud</p>
        <p className="text-ink-2">El administrador de Umbral la revisa. Si se aprueba, te llega tu acceso al correo {f.email}.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-[18px] border border-line bg-card p-6 sm:p-8">
      <p className="font-display text-2xl font-semibold">Solicitud de acceso</p>
      <Field label="Nombre completo" htmlFor="a-n" error={err.name}><Input id="a-n" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!err.name} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Correo" htmlFor="a-e" error={err.email}><Input id="a-e" type="email" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!err.email} /></Field>
        <Field label="Celular" htmlFor="a-p" error={err.phone}><Input id="a-p" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} aria-invalid={!!err.phone} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inmobiliaria o empresa (opcional)" htmlFor="a-c"><Input id="a-c" value={f.company} onChange={set("company")} placeholder="Independiente" /></Field>
        <Field label="Experiencia en bienes raíces" htmlFor="a-x" error={err.experience}>
          <Select id="a-x" value={f.experience} onChange={set("experience")} aria-invalid={!!err.experience}>
            <option value="">Elige</option>
            <option>Menos de 1 año</option>
            <option>1 a 3 años</option>
            <option>3 a 5 años</option>
            <option>Más de 5 años</option>
          </Select>
        </Field>
      </div>
      <Field label="Zonas donde trabajas (opcional)" htmlFor="a-z"><Input id="a-z" value={f.zone} onChange={set("zone")} placeholder="Zapopan, Providencia, Country" /></Field>
      <Field label="Cuéntanos de ti (opcional)" htmlFor="a-m"><Textarea id="a-m" rows={3} value={f.message} onChange={set("message")} placeholder="Certificaciones, desarrollos que has vendido, cómo consigues clientes." /></Field>
      <Button type="submit" size="lg">Enviar solicitud</Button>
      <p className="text-center text-xs text-ink-3">El acceso lo otorga únicamente el administrador general de Umbral.</p>
    </form>
  );
}
