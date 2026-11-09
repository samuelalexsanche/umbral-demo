import Link from "next/link";
import { SealCheck, UserFocus, ArrowsClockwise, Sparkle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import HeroSearch from "@/components/site/HeroSearch";
import { Developments, Featured, OrgsRow } from "@/components/site/HomeSections";
import JsonLd from "@/components/JsonLd";
import { CREDITS, SEED } from "@/lib/seed";
import { LatestNews } from "@/components/site/HomeSections";
import { FxTicker } from "@/components/site/News";
import { SITE, asset } from "@/lib/format";

const FAQ = [
  {
    q: "¿Puedo comprar con crédito bancario?",
    a: "Sí. En la sección de créditos comparas las tasas de los principales bancos, calculas tu mensualidad y puedes tramitar el crédito con un asesor de Umbral sin costo.",
  },
  {
    q: "¿Quién publica los inmuebles?",
    a: "Solo desarrolladoras aprobadas por Umbral, desde su propio panel. Cada perfil muestra su historia, su inventario actual, sus avances de obra y una calificación de confianza; el sello verde lo tienen las que cumplen los criterios de la plataforma.",
  },
  {
    q: "¿Cuánto cuesta usar Umbral para comprar?",
    a: "Buscar, guardar, comparar, contactar a un asesor y tramitar tu crédito es gratis para quien compra.",
  },
  {
    q: "¿Qué hago para apartar una casa?",
    a: "Deja tus datos en la ficha del inmueble y un asesor de Umbral te contacta. El apartado se firma siempre con la desarrolladora; nunca se paga por chat ni a cuentas personales.",
  },
];

export default function Home() {
  const pub = SEED.listings.filter((l) => l.status === "publicado" && l.price > 0);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": `${SITE}/#org`, name: "Umbral", url: `${SITE}/`, logo: `${SITE}/icon.svg`, areaServed: "Zona Metropolitana de Guadalajara, Jalisco, México" },
            { "@type": "WebSite", "@id": `${SITE}/#web`, name: "Umbral", url: `${SITE}/`, inLanguage: "es-MX", publisher: { "@id": `${SITE}/#org` } },
            { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
          ],
        }}
      />
      <HeroSearch />

      <section className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Desarrollos en venta</h2>
          <Link href="/desarrolladoras/" className="hidden items-center gap-1.5 font-semibold text-ink-2 hover:text-ink sm:inline-flex">Ver desarrolladoras <ArrowRight size={16} /></Link>
        </div>
        <Developments />
      </section>

      <section className="mx-auto mt-20 max-w-[1400px] px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Destacados de la semana</h2>
          <Link href="/inmuebles/" className="inline-flex items-center gap-1.5 font-semibold text-ink-2 hover:text-ink">Ver los {pub.length} inmuebles <ArrowRight size={16} /></Link>
        </div>
        <Featured />
      </section>

      <section className="mt-24 bg-slate text-paper">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid content-start gap-5">
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">Lo que cambia cuando la desarrolladora publica directo.</h2>
            <p className="max-w-[44ch] text-paper/75">Los portales de clasificados mezclan anuncios repetidos, precios viejos y vendedores que no contestan. Aquí cada inmueble tiene dueño y responsable.</p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[16px] bg-paper/10 sm:grid-cols-2">
            {[
              { i: SealCheck, t: "Desarrolladoras verificadas", d: "Solo publican desarrolladoras aprobadas. La calificación de confianza y el sello verde son públicos." },
              { i: UserFocus, t: "Asesores aprobados", d: "Te atiende un asesor de Umbral. Nadie se da de alta solo: cada asesor pasa por aprobación." },
              { i: ArrowsClockwise, t: "Inventario que se mueve", d: "Las unidades disponibles se actualizan desde el panel de la desarrolladora; lo vendido se marca como agotado." },
              { i: Sparkle, t: "Un asistente por desarrolladora", d: "Resuelve dudas de créditos, visitas y entregas con la información que la propia empresa cargó." },
            ].map(({ i: Icon, t, d }) => (
              <li key={t} className="grid gap-3 bg-slate p-6">
                <Icon size={28} className="text-brick-soft" />
                <p className="font-display text-xl font-semibold">{t}</p>
                <p className="text-sm text-paper/70">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">¿Cuánto pagarías al mes?</h2>
          <p className="text-ink-2 text-pretty">
            Compara las tasas de los bancos, calcula tu mensualidad con el simulador y, si quieres, tramita tu crédito con nosotros. Antes de enamorarte de un departamento, revisa cuánto te presta el banco.
          </p>
          <Link href="/creditos/" className="inline-flex items-center gap-1.5 font-semibold text-brick hover:underline">Ver tasas y simulador <ArrowRight size={16} /></Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CREDITS.map((c) => {
            const n = pub.filter((l) => l.credits.includes(c.id)).length;
            return (
              <li key={c.id}>
                <Link href={`/inmuebles/?c=${c.id}`} className="press grid h-full gap-1.5 rounded-[14px] border border-line bg-card p-5 hover:border-ink-3">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xl font-semibold">{c.name}</span>
                    <span className="text-sm font-semibold text-ink-2 tabular">{n} inmuebles</span>
                  </span>
                  <span className="text-sm text-ink-2">{c.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Noticias, avances y divisas</h2>
          <Link href="/noticias/" className="inline-flex items-center gap-1.5 font-semibold text-ink-2 hover:text-ink">Ver noticias <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <LatestNews />
          <FxTicker className="order-first content-start self-start lg:order-none" />
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-4 sm:px-6">
        <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Quién publica en Umbral</h2>
        <OrgsRow />
      </section>

      <section className="mx-auto mt-24 grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-2 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-[64ch] text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-4 sm:px-6">
        <div className="grid items-center gap-8 overflow-hidden rounded-[22px] bg-ink p-8 text-paper sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">¿Eres desarrollador o asesor?</h2>
            <p className="max-w-[48ch] text-paper/75">Las desarrolladoras solicitan colocar su inventario, sujeto a condiciones. Los asesores solicitan acceso al portal: inventario en tiempo real, cotizaciones con sus datos, material de venta y academia.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/publica-tus-desarrollos/" className="press inline-flex h-12 items-center gap-2 rounded-full bg-brick px-6 font-semibold text-white hover:bg-brick-d">Para desarrolladores <ArrowRight size={18} /></Link>
              <Link href="/asesores/" className="press inline-flex h-12 items-center gap-2 rounded-full border border-paper/30 px-6 font-semibold text-paper hover:border-paper">Soy asesor</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/img/casillas/pub/brokers-4.webp")} alt="Asesores revisando un desarrollo de Grupo Casillas" loading="lazy" className="aspect-square w-full rounded-[14px] object-cover" />
        </div>
      </section>
    </>
  );
}
