"use client";
import { useState } from "react";
import { toast } from "sonner";
import { changePassword, roleLabel, updateUser, useDB, useSessionUser } from "@/lib/db";
import { Avatar, Button, Field, Input, Textarea } from "@/components/ui";
import { PageHead } from "@/components/panel/Shell";

export default function Cuenta() {
  const me = useSessionUser();
  const db = useDB();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  const [p, setP] = useState<{ name: string; phone: string; mobile: string; title: string; company: string; bio: string } | null>(null);
  if (!me) return null;
  const prof = p ?? { name: me.name, phone: me.phone, mobile: me.mobile ?? "", title: me.title, company: me.company ?? "", bio: me.bio ?? "" };
  const setProf = (k: keyof typeof prof) => (e: { target: { value: string } }) => setP({ ...prof, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (a.length < 8) return setErr("Usa al menos 8 caracteres.");
    if (a !== b) return setErr("Las contraseñas no coinciden.");
    const r = await changePassword(me!.id, a);
    if (!r.ok) return setErr(r.error ?? "No se pudo cambiar.");
    setA(""); setB(""); setErr("");
    toast.success("Contraseña actualizada");
  }
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <PageHead title="Mi perfil" sub={`${roleLabel(me)}${me.orgId ? ` en ${db.orgs.find((o) => o.id === me.orgId)?.name}` : ""} · ${me.email}`} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prof.name.trim().length < 3) return toast.error("Escribe tu nombre completo.");
          updateUser(me, me.id, { name: prof.name.trim(), phone: prof.phone.trim(), mobile: prof.mobile.trim(), title: prof.title.trim(), company: prof.company.trim() || undefined, bio: prof.bio.trim() || undefined });
          setP(null);
          toast.success("Perfil actualizado");
        }}
        className="grid gap-4 rounded-[14px] border border-line bg-card p-6"
      >
        <div className="flex items-center gap-3"><Avatar name={prof.name} size={48} /><h2 className="font-display text-lg font-semibold">Datos de contacto</h2></div>
        {me.role === "asesor" && <p className="text-sm text-ink-2">Estos datos aparecen en las cotizaciones que generas para tus clientes.</p>}
        <Field label="Nombre completo" htmlFor="pf-n"><Input id="pf-n" autoComplete="name" value={prof.name} onChange={setProf("name")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="pf-t"><Input id="pf-t" type="tel" value={prof.phone} onChange={setProf("phone")} /></Field>
          <Field label="Celular" htmlFor="pf-c"><Input id="pf-c" type="tel" value={prof.mobile} onChange={setProf("mobile")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Puesto" htmlFor="pf-p"><Input id="pf-p" value={prof.title} onChange={setProf("title")} /></Field>
          {me.role === "asesor" && <Field label="Empresa (opcional)" htmlFor="pf-e"><Input id="pf-e" value={prof.company} onChange={setProf("company")} /></Field>}
        </div>
        {me.role === "asesor" && <Field label="Presentación breve (opcional)" htmlFor="pf-b"><Textarea id="pf-b" rows={3} value={prof.bio} onChange={setProf("bio")} maxLength={400} /></Field>}
        <Button type="submit">Guardar perfil</Button>
      </form>
      <form onSubmit={submit} className="grid gap-4 rounded-[14px] border border-line bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Cambiar contraseña</h2>
        <Field label="Nueva contraseña" htmlFor="pw-a"><Input id="pw-a" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Confírmala" htmlFor="pw-b" error={err}><Input id="pw-b" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} aria-invalid={!!err} /></Field>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
