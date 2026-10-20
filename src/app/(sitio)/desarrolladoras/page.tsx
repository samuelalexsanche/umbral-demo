import type { Metadata } from "next";
import { OrgDirectory } from "@/components/site/Profiles";

export const metadata: Metadata = {
  title: "Desarrolladoras e inmobiliarias en Guadalajara",
  description: "Perfiles de desarrolladoras e inmobiliarias que publican vivienda nueva en Guadalajara, Zapopan, Tlaquepaque y Tlajomulco: inventario, créditos aceptados y tiempo de respuesta.",
  alternates: { canonical: "desarrolladoras/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Desarrolladoras e inmobiliarias</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-ink-2">Cada una administra su propio perfil, inventario y equipo de asesores. El sello verde indica que ya pasó la verificación de documentos.</p>
      <div className="mt-10"><OrgDirectory /></div>
    </div>
  );
}
