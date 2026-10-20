"use client";
import { useState } from "react";
import { CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import type { CreditId, LeadSource, Listing, Org, User } from "@/lib/types";
import { createLead } from "@/lib/db";
import { CREDITS } from "@/lib/seed";
import { creditName, waLink } from "@/lib/format";
import type { ChatMsg } from "@/lib/agent";
import { Avatar, Button, Dialog, Field, Input, Select, Textarea } from "../ui";

export default function ContactDialog({
  open,
  onClose,
  org,
  asesor,
  listing,
  developmentId,
  source,
  transcript,
}: {
  open: boolean;
  onClose: () => void;
  org: Org;
  asesor?: User;
  listing?: Listing;
  developmentId?: string;
  source: LeadSource;
  transcript?: ChatMsg[];
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", credit: "" as CreditId | "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const asesorId = asesor?.id ?? listing?.asesorId ?? "";
  const subject = listing ? listing.title : org.name;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Escribe tu nombre para que el asesor sepa a quién llamar.";
    if (form.phone.replace(/\D/g, "").length < 10) err.phone = "Escribe un teléfono de 10 dígitos.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) err.email = "Revisa el correo, por ejemplo nombre@correo.com.";
    setErrors(err);
    if (Object.keys(err).length) return;
    createLead({
      orgId: org.id,
      asesorId,
      listingId: listing?.id,
      developmentId: developmentId ?? listing?.developmentId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      credit: form.credit || undefined,
      message: form.message.trim() || `Me interesa ${subject}.`,
      source,
      transcript: transcript?.map((m) => ({ role: m.role, text: m.text })),
    });
    setSent(true);
  }

  const waText = `Hola${asesor ? ` ${asesor.name.split(" ")[0]}` : ""}, vi ${subject} en Umbral y me gustaría más información.${form.credit ? ` Compraría con ${creditName(form.credit)}.` : ""}`;

  return (
    <Dialog open={open} onClose={() => { onClose(); setTimeout(() => setSent(false), 300); }} title={sent ? "Listo, te van a contactar" : "Hablar con un asesor"}>
      {sent ? (
        <div className="grid gap-4 text-center">
          <CheckCircle size={48} weight="fill" className="mx-auto text-ok" />
          <p className="text-ink-2">
            {asesor ? `${asesor.name} de ${org.name}` : org.name} recibió tus datos. El tiempo de respuesta habitual de esta inmobiliaria es de {org.responseMinutes} minutos en horario de oficina.
          </p>
          <p className="text-sm text-ink-3">Nunca te pediremos pagos por chat. El apartado se hace siempre en la oficina de ventas.</p>
          <Button variant="outline" href={waLink(waText)} external><WhatsappLogo size={18} /> Continuar por WhatsApp</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4">
          {asesor && (
            <div className="flex items-center gap-3 rounded-[12px] bg-sunk p-3">
              <Avatar name={asesor.name} size={44} />
              <div className="text-sm">
                <p className="font-semibold">{asesor.name}</p>
                <p className="text-ink-2">{asesor.title} · {org.name}</p>
              </div>
            </div>
          )}
          <Field label="Nombre" htmlFor="c-name" error={errors.name}>
            <Input id="c-name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" htmlFor="c-phone" error={errors.phone}>
              <Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Correo (opcional)" htmlFor="c-email" error={errors.email}>
              <Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
            </Field>
          </div>
          <Field label="¿Con qué piensas comprar?" htmlFor="c-credit" hint="Ayuda al asesor a llegar con números reales.">
            <Select id="c-credit" value={form.credit} onChange={set("credit")}>
              <option value="">Aún no lo sé</option>
              {CREDITS.filter((c) => !listing || listing.credits.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Mensaje (opcional)" htmlFor="c-msg">
            <Textarea id="c-msg" rows={3} value={form.message} onChange={set("message")} placeholder={`Me interesa ${subject}.`} />
          </Field>
          {transcript && transcript.length > 0 && <p className="text-xs text-ink-3">El asesor verá también tu conversación con el asistente para no repetirte las preguntas.</p>}
          <Button type="submit" size="lg">Enviar al asesor</Button>
          <p className="text-center text-xs text-ink-3">Tus datos solo los recibe {org.name}.</p>
        </form>
      )}
    </Dialog>
  );
}
