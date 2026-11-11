import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";

// Página independiente para socios (desarrolladoras, asesores y administración).
// No sale en el menú ni en el pie del sitio público, y no se indexa.
export const metadata: Metadata = { title: "Acceso de socios", robots: { index: false, follow: false } };

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-paper">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Umbral, inicio"><Logo /></Link>
        <span className="text-sm font-semibold text-ink-3">Socios de Umbral</span>
      </header>
      <main id="contenido">{children}</main>
      <footer className="px-4 py-6 text-center text-xs text-ink-3">Acceso exclusivo para desarrolladoras, asesores y administración de Umbral.</footer>
    </div>
  );
}
