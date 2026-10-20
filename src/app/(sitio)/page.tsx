import Link from "next/link";
import { SealCheck, UserFocus, ArrowsClockwise, Sparkle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import HeroSearch from "@/components/site/HeroSearch";
import { Developments, Featured, OrgsRow } from "@/components/site/HomeSections";
import JsonLd from "@/components/JsonLd";
import { CREDITS, SEED } from "@/lib/seed";
import { SITE, asset } from "@/lib/format";

const FAQ = [
  {
    q: "¿Puedo buscar casas que acepten Infonavit o Fovissste?",
    a: "Sí. En Umbral cada inmueble indica los créditos que acepta su desarrolladora y puedes filtrar por Infonavit, Fovissste, Cofinavit, Unamos Créditos, crédito bancario o contado. El filtro solo muestra lo que la desarrolladora confirmó.",
  },
  {
    q: "¿Quién publica los inmuebles?",
    a: "Los publican directamente las desarrolladoras e inmobiliarias desde su panel, con su perfil propio y el asesor responsable de cada inmueble. Las que muestran el sello de verificación ya pasaron la revisión de documentos de la plataforma.",
  },
  {
    q: "¿Cuánto cuesta usar Umbral para comprar?",
    a: "Buscar, guardar, comparar y contactar asesores es gratis para quien compra. Las desarrolladoras pagan por publicar su inventario.",
  },
  {
    q: "¿Qué hago para apartar una casa?",
    a: "Habla con el asesor desde la ficha del inmueble. El apartado se firma siempre en la oficina de ventas de la desarrolladora; nunca se paga por chat ni a cuentas personales.",
  },
];

export default function Home() {
  const pub = SEED.listings.filter((l) => l.status === "publicado");
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
              { i: SealCheck, t: "Desarrolladoras verificadas", d: "Revisamos acta constitutiva, permisos y oficina de ventas antes de otorgar el sello." },
              { i: UserFocus, t: "Un asesor con nombre", d: "Cada inmueble tiene un asesor responsable y su tiempo de respuesta es público." },
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
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">¿Con qué crédito puedo comprar una casa nueva?</h2>
          <p className="text-ink-2 text-pretty">
            En la zona metropolitana de Guadalajara la mayoría de las casas nuevas se compran con Infonavit, Fovissste, crédito bancario o una combinación como Cofinavit. Antes de enamorarte de una casa, revisa cuánto te presta tu instituto o tu banco y filtra por ese crédito.
          </p>
          <Link href="/creditos/" className="inline-flex items-center gap-1.5 font-semibold text-brick hover:underline">Leer la guía de créditos <ArrowRight size={16} /></Link>
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
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">¿Tienes un desarrollo? Publícalo con su propio perfil.</h2>
            <p className="max-w-[48ch] text-paper/75">Inventario por modelo, asesores con roles, prospectos directos a tu equipo y un asistente de IA entrenado con tu información.</p>
            <div><Link href="/publica-tus-desarrollos/" className="press inline-flex h-12 items-center gap-2 rounded-full bg-brick px-6 font-semibold text-white hover:bg-brick-d">Conocer la plataforma <ArrowRight size={18} /></Link></div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/img/desarrolladores-maqueta.jpg")} alt="Maqueta de un fraccionamiento en una oficina de ventas" loading="lazy" className="aspect-[16/10] w-full rounded-[14px] object-cover" />
        </div>
      </section>
    </>
  );
}
