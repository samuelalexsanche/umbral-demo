import type { Metadata } from "next";
import { SealCheck, UsersThree, ChatCircleDots, Newspaper, ChartBar, Stack } from "@phosphor-icons/react/dist/ssr";
import RequestForm from "./RequestForm";
import CityPair from "@/components/site/CityPair";

export const metadata: Metadata = {
  title: "Coloca el inventario de tu desarrollo en Umbral",
  description: "Para desarrolladoras de Guadalajara y Puerto Vallarta: perfil verificado con historia y avances de obra, inventario en tiempo real, red de asesores aprobados que reciben y atienden prospectos, y un asistente de IA con tu información.",
  alternates: { canonical: "publica-tus-desarrollos/" },
};

const FEATURES = [
  { i: SealCheck, t: "Perfil con calificación de confianza", d: "Tu trayectoria, inventario, nuevos lanzamientos y la calificación de confianza, con sello de calidad y confianza." },
  { i: Stack, t: "Inventario en tiempo real", d: "Actualizas tu inventario, precios, condiciones de pago, tipos de crédito y fechas de entrega." },
  { i: UsersThree, t: "Red de asesores aprobados", d: "Solo el equipo de asesores de Umbral y asesores externos certificados obtienen el acceso a tu inventario." },
  { i: ChartBar, t: "Prospectos asignados", d: "La plataforma genera prospectos interesados y calificados para cada proyecto." },
  { i: Newspaper, t: "Noticias y avances de obra", d: "Publicamos avances de obra, noticias, contenido, nuevos lanzamientos y eventos." },
  { i: ChatCircleDots, t: "Asistente de IA propio", d: "Responde dudas o la información que se requiera en todo momento y pasa a un asesor calificado de Umbral." },
];

export default function Page() {
  return (
    <div>
      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="grid gap-5">
          <h1 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-balance">Coloca tu inventario frente a compradores y asesores aprobados.</h1>
          <p className="max-w-[48ch] text-lg text-ink-2">Umbral es una plataforma que trabaja con desarrolladoras reconocidas en el mercado inmobiliario y es atendida por asesores capacitados para promover los proyectos. Solicita información para colocar tu inventario.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#solicitud" className="press inline-flex h-12 items-center rounded-full bg-brick px-6 font-semibold text-white hover:bg-brick-d">Solicitar información</a>
          </div>
        </div>
        <div className="text-ink"><CityPair className="aspect-[4/3] rounded-[22px]" /></div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-4 sm:px-6">
        <h2 className="max-w-[24ch] font-display text-3xl font-semibold tracking-tight sm:text-4xl">Lo que obtiene tu desarrolladora</h2>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ i: Icon, t, d }) => (
            <li key={t} className="grid content-start gap-3 bg-card p-7">
              <Icon size={30} className="text-brick" />
              <p className="font-display text-xl font-semibold">{t}</p>
              <p className="text-ink-2">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Cómo funciona</h2>
          <ol className="grid gap-5">
            {[
              ["Solicitud", "Compártenos tu trayectoria y tus desarrollos. Revisamos que cumplan la garantía Umbral."],
              ["Alta y verificación", "Creamos tu perfil y tu acceso, y revisamos documentos para otorgar el sello de confianza."],
              ["Publicas tu inventario", "Desarrollos, tipologías, disponibilidad, precios, condiciones y formas de pago, videos, renders y eventos."],
              ["Asesores Umbral", "Los asesores aprobados por Umbral cotizan y promueven tus proyectos."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-semibold text-paper tabular">{i + 1}</span>
                <span><span className="block font-semibold">{t}</span><span className="text-ink-2">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <div id="solicitud" className="scroll-mt-24">
          <RequestForm />
        </div>
      </section>
    </div>
  );
}
