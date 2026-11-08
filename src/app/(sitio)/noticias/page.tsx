import type { Metadata } from "next";
import { NewsIndex } from "@/components/site/News";

export const metadata: Metadata = {
  title: "Noticias del mercado inmobiliario en Guadalajara",
  description: "Mercado inmobiliario, noticias financieras, tipo de cambio, nuevos proyectos, avances de obra y entrevistas con especialistas.",
  alternates: { canonical: "noticias/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Noticias</h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-2">Mercado inmobiliario, finanzas, nuevos proyectos y entrevistas con arquitectos, financieros y diseñadores.</p>
      <div className="mt-10"><NewsIndex /></div>
    </div>
  );
}
