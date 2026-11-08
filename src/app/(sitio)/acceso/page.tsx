"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Buildings, UserCircle, UserPlus } from "@phosphor-icons/react";
import { REMOTE } from "@/lib/backend";
import { login, loginAs, roleLabel, useDB } from "@/lib/db";
import { Button, Field, Input, OrgLogo } from "@/components/ui";

const QUICK = [
  { id: "u-admin", icon: ShieldCheck, what: "Todo: desarrolladoras, aprobación de asesores, noticias, academia, tasas y prospectos." },
  { id: "u-casillas", icon: Buildings, what: "Su perfil, desarrollos, inventario, precios, condiciones de pago, material y avances de obra." },
  { id: "u-interno", icon: UserCircle, what: "Portal de asesores y los prospectos que le asigna la plataforma." },
  { id: "u-externo", icon: UserPlus, what: "Portal de asesores: inventario, cotizaciones con sus datos, descargas y academia." },
];

export default function Page() {
  const db = useDB();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await login(email, pass);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.push(r.user.role === "asesor" ? "/panel/portal/" : "/panel/");
  }
  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="grid content-start gap-5 rounded-[18px] border border-line bg-card p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Acceso</h1>
          <p className="mt-2 text-ink-2">Para desarrolladoras y asesores aprobados. Si eres asesor y aún no tienes cuenta, <Link href="/asesores/" className="font-semibold text-brick hover:underline">solicita tu acceso</Link>.</p>
        </div>
        <Field label="Correo" htmlFor="l-e"><Input id="l-e" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contraseña" htmlFor="l-p" error={error}><Input id="l-p" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} aria-invalid={!!error} /></Field>
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
        {!REMOTE && <p className="text-sm text-ink-3">Modo local: las cuentas de prueba usan la contraseña <code className="rounded bg-sunk px-1.5 py-0.5 font-semibold text-ink">demo1234</code>.</p>}
      </form>
      {!REMOTE && <div className="grid content-start gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Entrar con un rol de prueba</h2>
        {QUICK.map(({ id, icon: Icon, what }) => {
          const u = db.users.find((x) => x.id === id);
          if (!u) return null;
          const org = db.orgs.find((o) => o.id === u.orgId);
          return (
            <button key={id} aria-label={`Entrar como ${roleLabel(u)}: ${u.name}`} onClick={() => { loginAs(id); router.push(u.role === "asesor" ? "/panel/portal/" : "/panel/"); }} className="press lift grid grid-cols-[auto_1fr] items-start gap-4 rounded-[16px] border border-line bg-card p-5 text-left">
              {org ? <OrgLogo org={org} size={44} /> : <span className="grid size-11 place-items-center rounded-[10px] bg-ink text-paper"><Icon size={22} /></span>}
              <span className="grid gap-1">
                <span className="font-semibold">{roleLabel(u)}</span>
                <span className="text-sm text-ink-2">{u.name}{org ? `, ${org.name}` : ""} · {u.email}</span>
                <span className="text-sm text-ink-3">{what}</span>
              </span>
            </button>
          );
        })}
      </div>}
    </div>
  );
}
