"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, List, X, UserCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useFavs } from "@/lib/favs";
import { resetDemo, useSessionUser } from "@/lib/db";
import { Button, Logo, cx } from "../ui";

const NAV = [
  { href: "/inmuebles/", label: "Inmuebles" },
  { href: "/desarrolladoras/", label: "Desarrolladoras" },
  { href: "/creditos/", label: "Créditos" },
  { href: "/publica-tus-desarrollos/", label: "Para desarrolladores" },
];

export function DemoBanner() {
  return (
    <div className="bg-slate text-[13px] text-paper/85">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 py-1.5 text-center">
        <span>Demo: inmobiliarias, personas y precios son ficticios. Lo que crees se guarda en este navegador.</span>
        <button
          onClick={() => {
            resetDemo();
            toast.success("Datos de la demo restablecidos");
          }}
          className="press inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-paper underline-offset-2 hover:underline"
        >
          <ArrowCounterClockwise size={13} /> Restablecer
        </button>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const favs = useFavs();
  const me = useSessionUser();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="sticky top-0 z-[1100] border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Umbral, inicio"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx("rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors", path?.startsWith(n.href) ? "bg-sunk text-ink" : "text-ink-2 hover:text-ink")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/guardados/" className="press relative grid size-10 place-items-center rounded-full text-ink-2 hover:bg-sunk hover:text-ink" aria-label={`Guardados (${mounted ? favs.length : 0})`}>
            <Heart size={21} />
            {mounted && favs.length > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brick px-1 text-[10px] font-bold leading-4 text-white">{favs.length}</span>}
          </Link>
          {mounted && me ? (
            <Button href="/panel/" variant="dark" size="sm" className="hidden sm:inline-flex"><UserCircle size={18} /> Mi panel</Button>
          ) : (
            <Button href="/acceso/" variant="outline" size="sm" className="hidden sm:inline-flex">Acceso para inmobiliarias</Button>
          )}
          <button className="press grid size-10 place-items-center rounded-full hover:bg-sunk lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-paper px-4 pb-5 pt-2 lg:hidden" aria-label="Menú">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block border-b border-line py-3.5 font-display text-xl font-semibold">{n.label}</Link>
          ))}
          <Link href={me ? "/panel/" : "/acceso/"} className="block py-3.5 font-display text-xl font-semibold text-brick">{me ? "Mi panel" : "Acceso para inmobiliarias"}</Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <Logo light />
          <p className="max-w-sm text-sm text-paper/70">Casas y departamentos nuevos del área metropolitana de Guadalajara, publicados por desarrolladoras e inmobiliarias con perfil propio y asesores identificados.</p>
        </div>
        <div className="grid content-start gap-2.5 text-sm">
          <p className="font-semibold text-paper/50">Buscar</p>
          <Link href="/inmuebles/?m=Zapopan" className="text-paper/85 hover:text-paper">Casas en Zapopan</Link>
          <Link href="/inmuebles/?m=Guadalajara" className="text-paper/85 hover:text-paper">Departamentos en Guadalajara</Link>
          <Link href="/inmuebles/?c=infonavit" className="text-paper/85 hover:text-paper">Casas con Infonavit</Link>
          <Link href="/inmuebles/?e=preventa" className="text-paper/85 hover:text-paper">Preventas</Link>
        </div>
        <div className="grid content-start gap-2.5 text-sm">
          <p className="font-semibold text-paper/50">Umbral</p>
          <Link href="/desarrolladoras/" className="text-paper/85 hover:text-paper">Desarrolladoras e inmobiliarias</Link>
          <Link href="/creditos/" className="text-paper/85 hover:text-paper">Guía de créditos</Link>
          <Link href="/publica-tus-desarrollos/" className="text-paper/85 hover:text-paper">Publica tus desarrollos</Link>
        </div>
        <div className="grid content-start gap-2.5 text-sm">
          <p className="font-semibold text-paper/50">Equipos de venta</p>
          <Link href="/acceso/" className="text-paper/85 hover:text-paper">Acceso para inmobiliarias</Link>
          <Link href="/guardados/" className="text-paper/85 hover:text-paper">Guardados y comparador</Link>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-[1400px] px-4 py-5 text-xs text-paper/50 sm:px-6">Versión de demostración. Precios, inventario y requisitos de crédito son orientativos y deben confirmarse con cada desarrolladora.</p>
      </div>
    </footer>
  );
}
