import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { CREDITS, SEED } from "@/lib/seed";
import { moneyShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "Guía de créditos para comprar casa nueva en Guadalajara",
  description: "Qué es y quién puede usar Infonavit, Fovissste, Cofinavit, Unamos Créditos, crédito bancario o contado para comprar vivienda nueva en Guadalajara, y qué inmuebles los aceptan.",
  alternates: { canonical: "creditos/" },
};

const QA = [
  { q: "¿Qué crédito me conviene para comprar una casa nueva?", a: "Depende de dónde trabajas y de tu ingreso. Si cotizas en el Infonavit, empieza por tu precalificación; si trabajas para el Estado, revisa el Fovissste; si tu monto no alcanza, Cofinavit combina Infonavit con un banco. Con ingresos comprobables también puedes pedir un crédito bancario directo." },
  { q: "¿Puedo usar Infonavit en una preventa?", a: "Normalmente el crédito Infonavit se ejerce cuando la vivienda ya está terminada y escriturable. En una preventa puedes apartar y el crédito se aplica a la entrega; confirma el esquema con el asesor de cada desarrollo." },
  { q: "¿Qué pasa si el desarrollo no acepta mi crédito?", a: "El crédito lo elige la desarrolladora según su producto y sus convenios. En Umbral solo verás el crédito marcado cuando la desarrolladora lo confirmó, así no pierdes tiempo con inmuebles que no te aplican." },
];

export default function Page() {
  const pub = SEED.listings.filter((l) => l.status === "publicado");
  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-10 sm:px-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: QA.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) }} />
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Guía de créditos para comprar casa nueva en Guadalajara</h1>
      <p className="mt-4 max-w-[64ch] text-lg text-ink-2">Seis formas de pago que aceptan las desarrolladoras de Umbral, quién puede usar cada una y cuántos inmuebles las aceptan hoy. Los requisitos cambian: confírmalos siempre con el Infonavit, el Fovissste o tu banco.</p>

      <div className="mt-12 grid gap-4">
        {CREDITS.map((c) => {
          const ls = pub.filter((l) => l.credits.includes(c.id));
          return (
            <section key={c.id} id={c.id} className="grid gap-4 rounded-[18px] border border-line bg-card p-6 sm:grid-cols-[1fr_220px] sm:p-8">
              <div className="grid content-start gap-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{c.name}</h2>
                <p className="text-[17px] text-ink">{c.short}</p>
                <p className="text-ink-2"><strong className="text-ink">Quién puede usarlo:</strong> {c.who}</p>
                <p className="text-ink-2"><strong className="text-ink">Primer paso:</strong> {c.how}</p>
              </div>
              <div className="grid content-start gap-2 rounded-[14px] bg-sunk p-5">
                <p className="font-display text-4xl font-semibold tabular">{ls.length}</p>
                <p className="text-sm text-ink-2">inmuebles lo aceptan{ls.length ? `, desde ${moneyShort(Math.min(...ls.map((l) => l.price)))}` : ""}</p>
                <Link href={`/inmuebles/?c=${c.id}`} className="mt-2 font-semibold text-brick hover:underline">Ver inmuebles</Link>
              </div>
            </section>
          );
        })}
      </div>

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
