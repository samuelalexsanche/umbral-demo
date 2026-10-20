import type { Metadata } from "next";
import { SealCheck, UsersThree, ChatCircleDots, FunnelSimple, ChartBar, Stack } from "@phosphor-icons/react/dist/ssr";
import RequestForm from "./RequestForm";
import { asset } from "@/lib/format";

export const metadata: Metadata = {
  title: "Publica tus desarrollos inmobiliarios en Guadalajara",
  description: "Plataforma para desarrolladoras e inmobiliarias: perfil verificado, inventario por modelo, asesores con roles, prospectos directos, filtro por crédito y un asistente de IA entrenado con tu información.",
  alternates: { canonical: "publica-tus-desarrollos/" },
};

const FEATURES = [
  { i: SealCheck, t: "Perfil verificado", d: "Tu desarrolladora con su propia página, sello de verificación, créditos que aceptas y tiempo de respuesta." },
  { i: Stack, t: "Inventario por modelo", d: "Publica modelos con unidades disponibles. Cuando vendes, el inventario baja y lo agotado se marca solo." },
  { i: UsersThree, t: "Tu equipo con roles", d: "Administrador, asesores y colaboradores. Cada quien ve y edita solo lo suyo; los colaboradores publican con revisión." },
  { i: FunnelSimple, t: "Compradores que sí califican", d: "Te encuentran por el crédito que tienen. Los prospectos llegan con el crédito que piensan usar." },
  { i: ChatCircleDots, t: "Asistente de IA propio", d: "Responde dudas 24/7 con la base de conocimiento que tú cargas y pasa al asesor a quien quiere visitar." },
  { i: ChartBar, t: "Prospectos en un solo lugar", d: "Cada contacto llega al asesor del inmueble, con etapas, notas y la conversación del asistente." },
];

export default function Page() {
  return (
    <div>
      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="grid gap-5">
          <h1 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-balance">Tu desarrollo frente a compradores que ya saben con qué van a pagar.</h1>
          <p className="max-w-[48ch] text-lg text-ink-2">Umbral es el escaparate de vivienda nueva de Guadalajara donde cada desarrolladora tiene perfil propio, equipo propio y prospectos propios.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#solicitud" className="press inline-flex h-12 items-center rounded-full bg-brick px-6 font-semibold text-white hover:bg-brick-d">Solicitar una demo</a>
            <a href={asset("/acceso/")} className="press inline-flex h-12 items-center rounded-full border border-line bg-card px-6 font-semibold hover:border-ink-3">Probar el panel</a>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/desarrolladores-maqueta.jpg")} alt="Maqueta de un desarrollo residencial en una oficina de ventas" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
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
              ["Alta y verificación", "Creamos el perfil de tu empresa y revisamos documentos para otorgar el sello."],
              ["Tu equipo entra", "Das de alta a tus asesores; cada uno recibe su acceso con su rol."],
              ["Publicas tu inventario", "Desarrollos, modelos, fotos, precios, créditos y unidades disponibles."],
              ["Recibes prospectos", "Llegan al asesor responsable de cada inmueble, con su crédito y su mensaje."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-semibold text-paper tabular">{i + 1}</span>
                <span><span className="block font-semibold">{t}</span><span className="text-ink-2">{d}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-[14px] bg-sunk p-5 text-sm text-ink-2">Planes por número de desarrollos publicados. <strong className="text-ink">[PENDIENTE: precios de la plataforma]</strong></p>
        </div>
        <div id="solicitud" className="scroll-mt-24">
          <RequestForm />
        </div>
      </section>
    </div>
  );
}
