import type { Metadata } from "next";
import { Buildings, FilePdf, DownloadSimple, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import ApplicationForm from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Portal de asesores inmobiliarios",
  description: "Asesores inmobiliarios aprobados: inventario en tiempo real de desarrollos en Guadalajara, cotizaciones con tus datos, material de venta y academia. Solicita tu acceso.",
  alternates: { canonical: "asesores/" },
};

const PERKS = [
  { i: Buildings, t: "Inventario en tiempo real", d: "Precios, disponibilidad y condiciones de pago tal como los actualiza cada desarrolladora." },
  { i: FilePdf, t: "Cotización personalizada", d: "Genera cotizaciones en PDF con tu nombre, teléfono, celular y correo." },
  { i: DownloadSimple, t: "Material de venta", d: "Brochures, renders, videos y publicidad de cada desarrollo, listos para compartir." },
  { i: GraduationCap, t: "Academia", d: "Cursos de bienes raíces, capacitación de cada proyecto y eventos." },
];

export default function Page() {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pt-12 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
      <div className="grid content-start gap-6">
        <h1 className="font-display text-[clamp(2.3rem,4.6vw,3.8rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-balance">Portal de asesores</h1>
        <p className="max-w-[50ch] text-lg text-ink-2">Umbral es una plataforma privada. Para vender el inventario de nuestras desarrolladoras, envía tu solicitud; el administrador la revisa y, si se aprueba, te da acceso.</p>
        <ul className="grid gap-4">
          {PERKS.map(({ i: Icon, t, d }) => (
            <li key={t} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-ink text-paper"><Icon size={22} /></span>
              <span><span className="block font-semibold">{t}</span><span className="text-ink-2">{d}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <ApplicationForm />
    </div>
  );
}
