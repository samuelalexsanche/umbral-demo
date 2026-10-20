"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  House, Buildings, HouseLine, ClipboardText, ChatsCircle, UsersThree, Sparkle, IdentificationCard,
  Tray, ListChecks, ClockCounterClockwise, Key, SignOut, ArrowSquareOut, List, X, MapPinArea,
} from "@phosphor-icons/react";
import type { Role, User } from "@/lib/types";
import { logout, ROLE_LABEL, useDB, useSessionUser, visibleLeads, visibleListings } from "@/lib/db";
import { Avatar, Badge, Logo, OrgLogo, cx } from "../ui";

type Item = { href: string; label: string; icon: typeof House; roles: Role[]; count?: (u: User) => number };

export function usePanelNav() {
  const db = useDB();
  const items: Item[] = [
    { href: "/panel/", label: "Resumen", icon: House, roles: ["superadmin", "org_admin", "asesor", "colaborador"] },
    { href: "/panel/inmobiliarias/", label: "Inmobiliarias", icon: Buildings, roles: ["superadmin"] },
    { href: "/panel/inmuebles/", label: "Inmuebles", icon: HouseLine, roles: ["superadmin", "org_admin", "asesor", "colaborador"] },
    {
      href: "/panel/revision/", label: "Revisión", icon: ClipboardText, roles: ["superadmin", "org_admin", "asesor"],
      count: (u) => visibleListings(db, u).filter((l) => l.status === "revision" && l.createdBy !== u.id).length,
    },
    {
      href: "/panel/prospectos/", label: "Prospectos", icon: ChatsCircle, roles: ["superadmin", "org_admin", "asesor"],
      count: (u) => visibleLeads(db, u).filter((l) => l.status === "nuevo").length,
    },
    { href: "/panel/desarrollos/", label: "Desarrollos", icon: MapPinArea, roles: ["superadmin", "org_admin"] },
    { href: "/panel/equipo/", label: "Equipo", icon: UsersThree, roles: ["superadmin", "org_admin", "asesor"] },
    { href: "/panel/agente/", label: "Agente de IA", icon: Sparkle, roles: ["superadmin", "org_admin"] },
    { href: "/panel/perfil/", label: "Perfil de la inmobiliaria", icon: IdentificationCard, roles: ["org_admin"] },
    { href: "/panel/solicitudes/", label: "Solicitudes", icon: Tray, roles: ["superadmin"], count: () => db.requests.length },
    { href: "/panel/catalogos/", label: "Catálogos", icon: ListChecks, roles: ["superadmin"] },
    { href: "/panel/actividad/", label: "Actividad", icon: ClockCounterClockwise, roles: ["superadmin", "org_admin", "asesor"] },
    { href: "/panel/cuenta/", label: "Mi cuenta", icon: Key, roles: ["superadmin", "org_admin", "asesor", "colaborador"] },
  ];
  return items;
}

export default function PanelShell({ children }: { children: ReactNode }) {
  const me = useSessionUser();
  const db = useDB();
  const router = useRouter();
  const path = usePathname();
  const nav = usePanelNav();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (mounted && !me) router.replace("/acceso/");
  }, [mounted, me, router]);

  if (!mounted || !me) return <div className="grid min-h-dvh place-items-center text-ink-3">Cargando panel…</div>;

  const org = me.orgId ? db.orgs.find((o) => o.id === me.orgId) : undefined;
  const items = nav.filter((i) => i.roles.includes(me.role));
  const isActive = (href: string) => (href === "/panel/" ? path === "/panel" || path === "/panel/" : path?.startsWith(href.replace(/\/$/, "")));

  const side = (
    <nav className="grid gap-0.5" aria-label="Panel">
      {items.map((i) => {
        const n = i.count?.(me) ?? 0;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cx("flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] font-medium transition-colors", isActive(i.href) ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunk hover:text-ink")}
          >
            <i.icon size={19} weight={isActive(i.href) ? "fill" : "regular"} />
            <span className="flex-1">{i.label}</span>
            {n > 0 && <span className={cx("rounded-full px-2 text-xs font-bold tabular", isActive(i.href) ? "bg-paper text-ink" : "bg-brick text-white")}>{n}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-line bg-card lg:flex lg:h-dvh lg:flex-col lg:gap-6 lg:sticky lg:top-0 lg:p-4">
        <Link href="/" className="px-2 pt-2"><Logo /></Link>
        {org && (
          <div className="flex items-center gap-2.5 rounded-[12px] bg-sunk p-2.5">
            <OrgLogo org={org} size={34} />
            <div className="min-w-0 text-sm"><p className="truncate font-semibold">{org.name}</p><p className="text-ink-3">{org.kind === "desarrolladora" ? "Desarrolladora" : "Inmobiliaria"}</p></div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{side}</div>
        <UserBox me={me} onOut={() => { logout(); router.push("/acceso/"); }} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-[1100] flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen((o) => !o)} className="press grid size-10 place-items-center rounded-full hover:bg-sunk" aria-label="Menú del panel" aria-expanded={open}>
            {open ? <X size={22} /> : <List size={22} />}
          </button>
          <Logo />
          <Badge className="ml-auto max-w-[45%] truncate whitespace-nowrap">{ROLE_LABEL[me.role]}</Badge>
        </header>
        {open && (
          <div className="fixed inset-x-0 top-14 bottom-0 z-[1100] grid content-start gap-5 overflow-y-auto bg-card p-4 lg:hidden">
            {side}
            <UserBox me={me} onOut={() => { logout(); router.push("/acceso/"); }} />
          </div>
        )}
        <div className="border-b border-line bg-slate px-4 py-1.5 text-center text-[13px] text-paper/85 sm:px-8">
          Estás en el panel de la demo como <strong className="text-paper">{ROLE_LABEL[me.role].toLowerCase()}</strong>. Los cambios se guardan solo en este navegador.
        </div>
        {me.mustChangePassword && !path?.startsWith("/panel/cuenta") && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-warn-soft px-4 py-3 text-sm font-medium text-warn sm:mx-8">
            Tu cuenta usa una contraseña temporal. Cámbiala antes de seguir.
            <Link href="/panel/cuenta/" className="font-semibold underline">Cambiar contraseña</Link>
          </div>
        )}
        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function UserBox({ me, onOut }: { me: User; onOut: () => void }) {
  return (
    <div className="grid gap-2 border-t border-line pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <Avatar name={me.name} size={36} />
        <div className="min-w-0 text-sm"><p className="truncate font-semibold">{me.name}</p><p className="truncate text-ink-3">{ROLE_LABEL[me.role]}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/" className="press inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line py-2 text-sm font-medium text-ink-2 hover:text-ink"><ArrowSquareOut size={16} /> Ver sitio</Link>
        <button onClick={onOut} className="press inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line py-2 text-sm font-medium text-ink-2 hover:text-ink"><SignOut size={16} /> Salir</button>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1.5 max-w-[70ch] text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const me = useSessionUser();
  if (!me) return null;
  if (!roles.includes(me.role))
    return <div className="rounded-[14px] border border-line bg-card p-10 text-center text-ink-2">Tu rol ({ROLE_LABEL[me.role].toLowerCase()}) no tiene acceso a esta sección.</div>;
  return <>{children}</>;
}

export const STATUS: Record<string, { label: string; tone: "neutral" | "brick" | "ok" | "warn" | "bad" | "dark" }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  revision: { label: "En revisión", tone: "warn" },
  publicado: { label: "Publicado", tone: "ok" },
  pausado: { label: "Pausado", tone: "neutral" },
  vendido: { label: "Vendido", tone: "bad" },
};

export const LEAD_STATUS: { id: "nuevo" | "contactado" | "cita" | "apartado" | "cerrado" | "descartado"; label: string; tone: "neutral" | "brick" | "ok" | "warn" | "bad" | "dark" }[] = [
  { id: "nuevo", label: "Nuevo", tone: "brick" },
  { id: "contactado", label: "Contactado", tone: "neutral" },
  { id: "cita", label: "Cita agendada", tone: "warn" },
  { id: "apartado", label: "Apartado", tone: "dark" },
  { id: "cerrado", label: "Vendido", tone: "ok" },
  { id: "descartado", label: "Descartado", tone: "bad" },
];
