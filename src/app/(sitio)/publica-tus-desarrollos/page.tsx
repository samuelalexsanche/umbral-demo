import type { Metadata } from "next";
import { SealCheck, UsersThree, ChatCircleDots, Newspaper, ChartBar, Stack } from "@phosphor-icons/react/dist/ssr";
import RequestForm from "./RequestForm";
import { asset } from "@/lib/format";

export const metadata: Metadata = {
  title: "Coloca el inventario de tu desarrollo en Umbral",
  description: "Para desarrolladoras de Guadalajara: perfil verificado con historia y avances de obra, inventario en tiempo real, red de asesores aprobados que reciben y atienden prospectos, y un asistente de IA con tu información.",
  alternates: { canonical: "publica-tus-desarrollos/" },
};

const FEATURES = [
  { i: SealCheck, t: "Perfil con calificación de confianza", d: "Tu historia, inventario actual, nuevos lanzamientos y la calificación de confianza. El sello verde distingue a quien cumple los criterios." },
  { i: Stack, t: "Inventario en tiempo real", d: "Actualizas inventario, precios, condiciones de pago y créditos desde tu panel; el sitio y los asesores lo ven al momento." },
  { i: UsersThree, t: "Red de asesores aprobados", d: "Solo el equipo de asesores de la plataforma y asesores externos filtrados por el administrador tienen acceso a tu inventario." },
  { i: ChartBar, t: "Prospectos asignados", d: "La plataforma reparte los prospectos entre sus asesores internos, con etapas y notas, y tú ves los de tus desarrollos." },
  { i: Newspaper, t: "Noticias y avances de obra", d: "Publicas avances, noticias y lanzamientos en tu perfil y en la sección de noticias." },
  { i: ChatCircleDots, t: "Asistente de IA propio", d: "Responde dudas a cualquier hora con la información que tú cargas y pasa la conversación a un asesor." },
];

export default function Page() {
  return (
    <div>
      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="grid gap-5">
          <h1 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-balance">Coloca tu inventario frente a compradores y asesores aprobados.</h1>
          <p className="max-w-[48ch] text-lg text-ink-2">Umbral es una plataforma privada: solo publican desarrolladoras aceptadas y solo asesores aprobados acceden al inventario. Solicita información para colocar tu inventario; el alta está sujeta a condiciones.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#solicitud" className="press inline-flex h-12 items-center rounded-full bg-brick px-6 font-semibold text-white hover:bg-brick-d">Solicitar información</a>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/casillas/avila-leon-1.webp")} alt="Render de Ávila & León, de Grupo Casillas" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
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
              ["Solicitud", "Nos compartes tu empresa y tus desarrollos. Revisamos que cumplan las condiciones de la plataforma."],
              ["Alta y verificación", "Creamos tu perfil y tu acceso, y revisamos documentos para tu calificación de confianza."],
              ["Publicas tu inventario", "Desarrollos, tipologías, fotos, precios, condiciones de pago y material para asesores."],
              ["Asesores y prospectos", "Los asesores aprobados cotizan tu inventario y la plataforma asigna los prospectos a su equipo interno."],
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
