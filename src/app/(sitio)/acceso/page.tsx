"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Buildings, UserCircle, UserPlus } from "@phosphor-icons/react";
import { login, loginAs, ROLE_LABEL, useDB } from "@/lib/db";
import { Button, Field, Input, OrgLogo } from "@/components/ui";

const QUICK = [
  { id: "u-admin", icon: ShieldCheck, what: "Ve todo: inmobiliarias, verificación, usuarios, catálogos y solicitudes." },
  { id: "u-rodrigo", icon: Buildings, what: "Administra Arcada: perfil, desarrollos, asesores, agente de IA y todos sus prospectos." },
  { id: "u-mariana", icon: UserCircle, what: "Publica sus inmuebles, atiende sus prospectos y da de alta colaboradores." },
  { id: "u-fernanda", icon: UserPlus, what: "Crea borradores que su asesora revisa antes de publicarse." },
];

export default function Page() {
  const db = useDB();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = login(email, pass);
    if (!r.ok) return setError(r.error);
    router.push("/panel/");
  }
  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="grid content-start gap-5 rounded-[18px] border border-line bg-card p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Acceso para inmobiliarias</h1>
          <p className="mt-2 text-ink-2">Entra con el correo que te dio tu administrador.</p>
        </div>
        <Field label="Correo" htmlFor="l-e"><Input id="l-e" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contraseña" htmlFor="l-p" error={error}><Input id="l-p" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} aria-invalid={!!error} /></Field>
        <Button type="submit" size="lg">Entrar</Button>
        <p className="text-sm text-ink-3">En la demo todas las cuentas usan la contraseña <code className="rounded bg-sunk px-1.5 py-0.5 font-semibold text-ink">demo1234</code>.</p>
      </form>
      <div className="grid content-start gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Entrar con un rol de prueba</h2>
        {QUICK.map(({ id, icon: Icon, what }) => {
          const u = db.users.find((x) => x.id === id)!;
          const org = db.orgs.find((o) => o.id === u.orgId);
          return (
            <button key={id} aria-label={`Entrar como ${ROLE_LABEL[u.role]}: ${u.name}`} onClick={() => { loginAs(id); router.push("/panel/"); }} className="press lift grid grid-cols-[auto_1fr] items-start gap-4 rounded-[16px] border border-line bg-card p-5 text-left">
              {org ? <OrgLogo org={org} size={44} /> : <span className="grid size-11 place-items-center rounded-[10px] bg-ink text-paper"><Icon size={22} /></span>}
              <span className="grid gap-1">
                <span className="font-semibold">{ROLE_LABEL[u.role]}</span>
                <span className="text-sm text-ink-2">{u.name}{org ? `, ${org.name}` : ""} · {u.email}</span>
                <span className="text-sm text-ink-3">{what}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
