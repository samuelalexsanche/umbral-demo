import type { Metadata } from "next";
import { OrgDirectory } from "@/components/site/Profiles";

export const metadata: Metadata = {
  title: "Desarrolladoras en Guadalajara",
  description: "Perfiles de las desarrolladoras que publican vivienda nueva en Guadalajara y Zapopan: historia, inventario actual, avances de obra y calificación de confianza.",
  alternates: { canonical: "desarrolladoras/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Desarrolladoras</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-ink-2">Solo publican desarrolladoras aprobadas por Umbral. La calificación de confianza muestra qué criterios cumple cada una, y el sello verde se otorga a las que cumplen lo que exige la plataforma.</p>
      <div className="mt-10"><OrgDirectory /></div>
    </div>
  );
}
