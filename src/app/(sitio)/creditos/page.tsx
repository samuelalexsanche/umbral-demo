import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { CREDITS } from "@/lib/seed";
import { BankRates, CreditRequest, CreditSimulator } from "@/components/site/CreditCenter";

export const metadata: Metadata = {
  title: "Créditos hipotecarios: tasas bancarias y simulador",
  description: "Compara tasas de crédito hipotecario de los principales bancos, calcula tu mensualidad y tramita tu crédito con un asesor para comprar departamento nuevo en Guadalajara.",
  alternates: { canonical: "creditos/" },
};

const QA = [
  { q: "¿Qué necesito para un crédito hipotecario bancario?", a: "Ingresos comprobables, buen historial en buró de crédito, identificación oficial y comprobante de domicilio. Cada banco pide documentos distintos para empleados e independientes; el asesor te dice cuáles aplican a tu caso." },
  { q: "¿Puedo comprar una preventa con crédito bancario?", a: "Sí. En preventa normalmente pagas el enganche durante la obra con recursos propios, y el crédito bancario se ejerce a la entrega, cuando el departamento se puede escriturar." },
  { q: "¿Cuánto cuesta tramitar el crédito con Umbral?", a: "Nada. Te acompañamos a comparar bancos, integrar tu expediente y llegar a la firma." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-10 sm:px-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: QA.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) }} />
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Créditos para comprar tu departamento</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-ink-2">Compara las tasas de los bancos, calcula tu mensualidad y, si quieres, tramita el crédito con nosotros.</p>

      <section className="mt-12 grid gap-5" id="tasas">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Tasas bancarias</h2>
        <BankRates />
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2" id="simulador">
        <div className="grid content-start gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Simulador de crédito</h2>
          <p className="text-ink-2">Elige un banco para usar su tasa, o mueve la tasa a mano. El resultado es una estimación.</p>
          <CreditSimulator />
        </div>
        <div className="grid content-start gap-4" id="tramita">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Tramita con nosotros</h2>
          <p className="text-ink-2">Un asesor revisa tu perfil, compara bancos y te acompaña de la precalificación a la firma.</p>
          <CreditRequest />
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {CREDITS.map((c) => (
          <div key={c.id} id={c.id} className="grid content-start gap-3 rounded-[18px] border border-line bg-card p-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{c.name}</h2>
            <p className="text-ink">{c.short}</p>
            <p className="text-sm text-ink-2"><strong className="text-ink">Quién puede usarlo:</strong> {c.who}</p>
            <p className="text-sm text-ink-2">{c.how}</p>
            <Link href={`/inmuebles/?c=${c.id}`} className="font-semibold text-brick hover:underline">Ver inmuebles</Link>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Preguntas frecuentes</h2>
        {QA.map((x) => (
          <div key={x.q} className="grid gap-2 border-t border-line pt-5">
            <h3 className="text-lg font-semibold">{x.q}</h3>
            <p className="max-w-[68ch] text-ink-2">{x.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
