import { FilePdf, Image as ImageIcon, VideoCamera, Megaphone, GraduationCap, Buildings, CalendarBlank } from "@phosphor-icons/react";
import type { CourseKind, MaterialKind } from "@/lib/types";

export const KIND: Record<MaterialKind, { label: string; icon: typeof FilePdf }> = {
  brochure: { label: "Brochure", icon: FilePdf },
  render: { label: "Renders", icon: ImageIcon },
  video: { label: "Videos", icon: VideoCamera },
  publicidad: { label: "Publicidad", icon: Megaphone },
};

export const COURSE_KIND: Record<CourseKind, { label: string; icon: typeof GraduationCap }> = {
  curso: { label: "Cursos de bienes raíces", icon: GraduationCap },
  capacitacion: { label: "Capacitación de proyectos", icon: Buildings },
  evento: { label: "Eventos", icon: CalendarBlank },
};
