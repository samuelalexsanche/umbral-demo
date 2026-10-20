"use client";
import { useState } from "react";
import { toast } from "sonner";
import { changePassword, ROLE_LABEL, useDB, useSessionUser } from "@/lib/db";
import { Button, Field, Input } from "@/components/ui";
import { PageHead } from "@/components/panel/Shell";

export default function Cuenta() {
  const me = useSessionUser();
  const db = useDB();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  if (!me) return null;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (a.length < 8) return setErr("Usa al menos 8 caracteres.");
    if (a !== b) return setErr("Las contraseñas no coinciden.");
    changePassword(me!.id, a);
    setA(""); setB(""); setErr("");
    toast.success("Contraseña actualizada");
  }
  return (
    <div className="mx-auto max-w-xl">
      <PageHead title="Mi cuenta" sub={`${me.name} · ${ROLE_LABEL[me.role]}${me.orgId ? ` en ${db.orgs.find((o) => o.id === me.orgId)?.name}` : ""}`} />
      <form onSubmit={submit} className="grid gap-4 rounded-[14px] border border-line bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Cambiar contraseña</h2>
        <Field label="Nueva contraseña" htmlFor="pw-a"><Input id="pw-a" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Confírmala" htmlFor="pw-b" error={err}><Input id="pw-b" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} aria-invalid={!!err} /></Field>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
