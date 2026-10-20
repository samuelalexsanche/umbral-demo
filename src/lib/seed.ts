// Datos de demostración. Empresas, personas, teléfonos y precios son ficticios;
// las colonias y municipios son reales del área metropolitana de Guadalajara.
import type { Credit, DB, Development, Lead, Listing, Org, User } from "./types";

export const CREDITS: Credit[] = [
  {
    id: "infonavit",
    name: "Infonavit",
    short: "Crédito para trabajadores del sector privado que cotizan en el Infonavit.",
    who: "Personas con empleo formal en el sector privado y relación laboral vigente.",
    how: "Revisa tu precalificación en Mi Cuenta Infonavit y lleva tu número de seguridad social al asesor.",
  },
  {
    id: "fovissste",
    name: "Fovissste",
    short: "Crédito para trabajadores al servicio del Estado afiliados al ISSSTE.",
    who: "Trabajadores del gobierno federal y de dependencias afiliadas al ISSSTE.",
    how: "Consulta tus puntos y modalidades en el portal del Fovissste antes de apartar.",
  },
  {
    id: "cofinavit",
    name: "Cofinavit",
    short: "Combina tu crédito Infonavit con un crédito bancario para alcanzar más monto.",
    who: "Derechohabientes del Infonavit que necesitan complementar su monto con un banco.",
    how: "El asesor te ayuda a coordinar la precalificación del Infonavit y la del banco.",
  },
  {
    id: "unamos",
    name: "Unamos Créditos Infonavit",
    short: "Permite que derechohabientes del Infonavit sumen sus créditos para una sola vivienda.",
    who: "Parejas, familiares o amigos que cotizan en el Infonavit y quieren comprar juntos.",
    how: "Cada persona revisa su precalificación y se tramitan de forma conjunta.",
  },
  {
    id: "bancario",
    name: "Crédito bancario",
    short: "Hipoteca con un banco; la tasa, el plazo y el enganche dependen de tu perfil.",
    who: "Personas con ingresos comprobables, empleadas o independientes.",
    how: "Compara la oferta de varios bancos; el simulador de cada ficha da una estimación inicial.",
  },
  {
    id: "contado",
    name: "Contado",
    short: "Pago con recursos propios, en una exhibición o según el plan del desarrollador.",
    who: "Cualquier comprador con recursos propios.",
    how: "Pregunta por descuentos de contado y esquemas de pago durante la obra.",
  },
];

export const AMENITIES = [
  "Alberca", "Casa club", "Gimnasio", "Áreas verdes", "Juegos infantiles", "Seguridad 24/7",
  "Acceso controlado", "Roof garden", "Asadores", "Cancha de pádel", "Coworking", "Pet park",
  "Elevador", "Bodega", "Ciclovía", "Salón de eventos",
];

const img = (n: string) => `/img/${n}.jpg`;

const orgs: Org[] = [
  {
    id: "org-arcada", slug: "arcada-desarrollos", name: "Arcada Desarrollos", kind: "desarrolladora",
    verified: true, status: "activa", initials: "AR", color: "#2E3A45",
    tagline: "Casas y departamentos para familias que ya saben dónde quieren vivir.",
    description: "Desarrolladora tapatía enfocada en vivienda residencial en Zapopan y Guadalajara. Construye fraccionamientos cerrados con casa club y torres de departamentos cerca de los corredores de trabajo.",
    since: 2011, municipios: ["Zapopan", "Guadalajara"],
    phone: "33 0000 0101", email: "ventas@arcada.example", address: "Oficina de ventas en Bosque Arcada, El Bajío, Zapopan",
    hours: "Lunes a viernes de 10:00 a 19:00, sábados y domingos de 10:00 a 15:00",
    credits: ["bancario", "contado", "cofinavit"], responseMinutes: 12,
    agent: {
      enabled: true, name: "Ana de Arcada",
      greeting: "Hola, soy Ana, asistente de Arcada Desarrollos. Pregúntame por casas, departamentos, créditos o visitas.",
      suggested: ["¿Qué créditos aceptan?", "¿Cuánto es el apartado?", "¿Tienen casas con estudio?", "¿Puedo visitar este fin de semana?"],
      kb: [
        { id: "kb-a1", q: "Apartado", a: "El apartado es de 30,000 pesos y es reembolsable durante los primeros 7 días naturales." },
        { id: "kb-a2", q: "Enganche", a: "En Bosque Arcada el enganche mínimo es del 10%. En Lumen Providencia, al ser preventa, se puede diferir el enganche en mensualidades hasta la entrega." },
        { id: "kb-a3", q: "Créditos", a: "Aceptamos crédito bancario, Cofinavit y contado. No aceptamos Infonavit tradicional ni Fovissste en estos desarrollos." },
        { id: "kb-a4", q: "Visitas", a: "Las casas muestra de Bosque Arcada se pueden visitar sin cita en horario de oficina. Para Lumen Providencia la visita al showroom es con cita." },
        { id: "kb-a5", q: "Entrega Lumen", a: "Lumen Providencia tiene entrega estimada en diciembre de 2027. El avance de obra se publica cada mes en la ficha del desarrollo." },
        { id: "kb-a6", q: "Mantenimiento", a: "La cuota de mantenimiento en Bosque Arcada es de 1,850 pesos al mes e incluye seguridad 24/7, casa club y áreas verdes." },
        { id: "kb-a7", q: "Escrituración", a: "Las casas se escrituran ante notario elegido por el comprador o por el banco. Los gastos de escrituración no están incluidos en el precio." },
      ],
      notes: "Arcada no vende lotes ni hace permutas. Las promociones vigentes las confirma el asesor.",
    },
    createdAt: "2026-06-02T10:00:00Z",
  },
  {
    id: "org-nativa", slug: "nativa-habitat", name: "Nativa Hábitat", kind: "desarrolladora",
    verified: true, status: "activa", initials: "NH", color: "#3F5A3C",
    tagline: "Tu primera casa con el crédito que ya tienes.",
    description: "Desarrolladora de vivienda accesible en el sur del área metropolitana. Trabaja con Infonavit, Fovissste y bancos, y acompaña al comprador en todo el trámite de su crédito.",
    since: 2014, municipios: ["Tlajomulco de Zúñiga"],
    phone: "33 0000 0202", email: "hola@nativa.example", address: "Módulo de ventas en Nativa Tlajomulco, Tlajomulco de Zúñiga",
    hours: "Todos los días de 9:00 a 18:00",
    credits: ["infonavit", "fovissste", "unamos", "cofinavit", "bancario", "contado"], responseMinutes: 8,
    agent: {
      enabled: true, name: "Toño de Nativa",
      greeting: "Hola, soy Toño de Nativa Hábitat. Te ayudo a saber qué casa te alcanza con tu crédito.",
      suggested: ["¿Puedo comprar con Infonavit?", "¿Qué documentos necesito?", "¿Cuánto tarda el trámite?", "¿Hay transporte cerca?"],
      kb: [
        { id: "kb-n1", q: "Infonavit", a: "Sí, todas las casas de Nativa Tlajomulco se pueden comprar con Infonavit, Fovissste, Unamos Créditos o Cofinavit. Te ayudamos con la precalificación." },
        { id: "kb-n2", q: "Documentos", a: "Para iniciar: INE, CURP, comprobante de domicilio, acta de nacimiento, número de seguridad social o de ISSSTE y tu precalificación." },
        { id: "kb-n3", q: "Tiempo de trámite", a: "Con crédito Infonavit el trámite suele tomar entre 4 y 8 semanas desde que entregas tus documentos completos." },
        { id: "kb-n4", q: "Apartado", a: "El apartado es de 5,000 pesos y se descuenta del precio final." },
        { id: "kb-n5", q: "Transporte", a: "El fraccionamiento está a 10 minutos de la carretera a Chapala y tiene rutas de transporte público en la entrada." },
        { id: "kb-n6", q: "Escuelas", a: "Hay primaria y secundaria públicas a menos de 2 kilómetros." },
      ],
      notes: "Las casas se entregan con piso cerámico, cocineta y calentador solar.",
    },
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    id: "org-cantera", slug: "inmobiliaria-cantera", name: "Inmobiliaria Cantera", kind: "inmobiliaria",
    verified: true, status: "activa", initials: "IC", color: "#8A4B2A",
    tagline: "Comercializamos vivienda nueva y casas seleccionadas en Guadalajara y Tlaquepaque.",
    description: "Inmobiliaria con oficina en Tlaquepaque. Comercializa el desarrollo Cantera Residencial y una cartera de casas y departamentos revisados por su equipo legal.",
    since: 2008, municipios: ["San Pedro Tlaquepaque", "Guadalajara"],
    phone: "33 0000 0303", email: "contacto@cantera.example", address: "Oficina en San Pedro Tlaquepaque, Jalisco",
    hours: "Lunes a sábado de 9:30 a 18:30",
    credits: ["infonavit", "fovissste", "cofinavit", "bancario", "contado"], responseMinutes: 20,
    agent: {
      enabled: true, name: "Asistente Cantera",
      greeting: "Hola, soy el asistente de Inmobiliaria Cantera. ¿Buscas casa nueva o alguna de nuestras propiedades seleccionadas?",
      suggested: ["¿Las casas tienen escrituras en regla?", "¿Aceptan Fovissste?", "¿Cobran comisión al comprador?"],
      kb: [
        { id: "kb-c1", q: "Comisión", a: "El comprador no paga comisión. La comisión la cubre el desarrollador o el propietario." },
        { id: "kb-c2", q: "Revisión legal", a: "Cada propiedad de nuestra cartera pasa por revisión de escrituras, predial y libertad de gravamen antes de publicarse." },
        { id: "kb-c3", q: "Fovissste", a: "Cantera Residencial acepta Fovissste. En las propiedades seleccionadas depende de cada vendedor; está indicado en cada ficha." },
        { id: "kb-c4", q: "Apartado", a: "El apartado en Cantera Residencial es de 15,000 pesos." },
      ],
      notes: "Tlaquepaque centro está a 8 minutos de Cantera Residencial.",
    },
    createdAt: "2026-06-18T10:00:00Z",
  },
  {
    id: "org-mezquite", slug: "grupo-mezquite", name: "Grupo Mezquite", kind: "desarrolladora",
    verified: false, status: "activa", initials: "GM", color: "#5B4A6B",
    tagline: "Preventa en Zapopan norte y departamentos en la Americana.",
    description: "Grupo desarrollador con proyectos de casas en preventa en Zapopan norte y una torre de departamentos en la colonia Americana de Guadalajara.",
    since: 2017, municipios: ["Zapopan", "Guadalajara"],
    phone: "33 0000 0404", email: "ventas@mezquite.example", address: "Showroom en colonia Americana, Guadalajara",
    hours: "Lunes a sábado de 10:00 a 19:00",
    credits: ["infonavit", "cofinavit", "unamos", "bancario", "contado"], responseMinutes: 35,
    agent: {
      enabled: true, name: "Asistente Mezquite",
      greeting: "Hola, te atiende el asistente de Grupo Mezquite. Pregunta por la preventa de Mezquite Valle o por la torre en la Americana.",
      suggested: ["¿Cuándo entregan Mezquite Valle?", "¿Cuál es el avance de obra?", "¿Aceptan Infonavit en la torre?"],
      kb: [
        { id: "kb-m1", q: "Entrega Mezquite Valle", a: "La primera etapa de Mezquite Valle se entrega en junio de 2027. El avance de obra al día de hoy es del 30%." },
        { id: "kb-m2", q: "Torre y créditos", a: "Torre Mezquite Americana acepta crédito bancario y contado. Infonavit, Cofinavit y Unamos aplican solo en Mezquite Valle." },
        { id: "kb-m3", q: "Precio preventa", a: "Los precios de preventa se respetan con el apartado firmado. Pueden cambiar en cada nueva etapa." },
      ],
      notes: "",
    },
    createdAt: "2026-07-01T10:00:00Z",
  },
];

const developments: Development[] = [
  {
    id: "dev-bosque", slug: "bosque-arcada", name: "Bosque Arcada", orgId: "org-arcada", kind: "fraccionamiento",
    colonia: "El Bajío", municipio: "Zapopan", lat: 20.6895, lng: -103.4472,
    description: "Fraccionamiento cerrado de 120 casas en El Bajío, Zapopan, con casa club, alberca y senderos arbolados. A 5 minutos de Av. Vallarta y de centros comerciales.",
    amenities: ["Alberca", "Casa club", "Gimnasio", "Áreas verdes", "Juegos infantiles", "Seguridad 24/7", "Acceso controlado", "Asadores"],
    delivery: "entrega-inmediata", progress: 100, totalUnits: 120,
    images: [img("bosque-arcada-fachada"), img("bosque-arcada-sala"), img("bosque-arcada-cocina"), img("bosque-arcada-casaclub")],
    createdAt: "2026-06-03T10:00:00Z",
  },
  {
    id: "dev-lumen", slug: "lumen-providencia", name: "Lumen Providencia", orgId: "org-arcada", kind: "torre",
    colonia: "Providencia", municipio: "Guadalajara", lat: 20.6938, lng: -103.3884,
    description: "Torre de 14 niveles en Providencia con 84 departamentos de una a tres recámaras, roof garden con alberca y coworking. Preventa con entrega estimada en diciembre de 2027.",
    amenities: ["Roof garden", "Alberca", "Gimnasio", "Coworking", "Elevador", "Bodega", "Pet park", "Seguridad 24/7"],
    delivery: "preventa", deliveryDate: "2027-12", progress: 45, totalUnits: 84,
    images: [img("lumen-providencia-torre"), img("lumen-providencia-depto"), img("lumen-providencia-roof")],
    createdAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "dev-nativa", slug: "nativa-tlajomulco", name: "Nativa Tlajomulco", orgId: "org-nativa", kind: "fraccionamiento",
    colonia: "Santa Fe", municipio: "Tlajomulco de Zúñiga", lat: 20.5232, lng: -103.3797,
    description: "Fraccionamiento de vivienda accesible con parque central, juegos infantiles y acceso controlado. Casas de dos y tres recámaras listas para crédito Infonavit y Fovissste.",
    amenities: ["Áreas verdes", "Juegos infantiles", "Acceso controlado", "Ciclovía", "Pet park"],
    delivery: "entrega-inmediata", progress: 80, totalUnits: 640,
    images: [img("nativa-tlajomulco-fachada"), img("nativa-tlajomulco-interior"), img("nativa-tlajomulco-parque")],
    createdAt: "2026-06-11T10:00:00Z",
  },
  {
    id: "dev-cantera", slug: "cantera-residencial", name: "Cantera Residencial", orgId: "org-cantera", kind: "privada",
    colonia: "Las Juntas", municipio: "San Pedro Tlaquepaque", lat: 20.6247, lng: -103.3053,
    description: "Privada de 36 casas con arquitectura mexicana contemporánea: patios interiores, cantera y talavera. A 8 minutos del centro de Tlaquepaque.",
    amenities: ["Acceso controlado", "Áreas verdes", "Asadores", "Seguridad 24/7"],
    delivery: "entrega-inmediata", progress: 100, totalUnits: 36,
    images: [img("cantera-residencial-fachada"), img("cantera-residencial-cocina"), img("cantera-residencial-patio")],
    createdAt: "2026-06-19T10:00:00Z",
  },
  {
    id: "dev-mvalle", slug: "mezquite-valle", name: "Mezquite Valle", orgId: "org-mezquite", kind: "fraccionamiento",
    colonia: "Tesistán", municipio: "Zapopan", lat: 20.7905, lng: -103.4748,
    description: "Fraccionamiento en preventa en Zapopan norte con 260 casas en tres etapas, casa club y cancha de pádel. Primera etapa con entrega en junio de 2027.",
    amenities: ["Casa club", "Cancha de pádel", "Alberca", "Áreas verdes", "Acceso controlado", "Juegos infantiles"],
    delivery: "preventa", deliveryDate: "2027-06", progress: 30, totalUnits: 260,
    images: [img("mezquite-valle-modelo"), img("mezquite-valle-interior"), img("mezquite-valle-obra")],
    createdAt: "2026-07-02T10:00:00Z",
  },
  {
    id: "dev-torre", slug: "torre-mezquite-americana", name: "Torre Mezquite Americana", orgId: "org-mezquite", kind: "torre",
    colonia: "Americana", municipio: "Guadalajara", lat: 20.6741, lng: -103.3688,
    description: "Edificio de 10 niveles en la colonia Americana con 48 departamentos, terrazas privadas y roof garden. Caminable a restaurantes, cafés y Av. Chapultepec.",
    amenities: ["Roof garden", "Elevador", "Gimnasio", "Bodega", "Seguridad 24/7", "Pet park"],
    delivery: "entrega-inmediata", progress: 100, totalUnits: 48,
    images: [img("torre-mezquite-torre"), img("torre-mezquite-depto"), img("torre-mezquite-terraza")],
    createdAt: "2026-07-03T10:00:00Z",
  },
];

const devById = Object.fromEntries(developments.map((d) => [d.id, d]));

type L = Omit<Listing, "id" | "slug" | "colonia" | "municipio" | "lat" | "lng" | "views" | "createdAt" | "updatedAt" | "featured"> &
  Partial<Pick<Listing, "colonia" | "municipio" | "lat" | "lng" | "featured">> & { key: string; offset?: number; day: string };

const raw: L[] = [
  { key: "casa-encino-bosque-arcada", title: "Casa Encino en Bosque Arcada", orgId: "org-arcada", developmentId: "dev-bosque", asesorId: "u-mariana", createdBy: "u-mariana", status: "publicado", type: "casa", price: 6350000, bedrooms: 3, bathrooms: 2.5, parking: 2, m2Built: 168, m2Land: 160, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 9, unitsTotal: 40, credits: ["bancario", "cofinavit", "contado"], amenities: [], features: ["Doble altura en sala", "Cocina con isla", "Jardín trasero", "Cuarto de lavado", "Preparación para minisplit"], description: "Casa de dos niveles con sala en doble altura, cocina abierta con isla y jardín trasero. Las tres recámaras están en planta alta; la principal tiene vestidor y baño completo.", images: [img("bosque-arcada-fachada"), img("bosque-arcada-sala"), img("bosque-arcada-cocina"), img("bosque-arcada-casaclub")], featured: true, day: "2026-08-04" },
  { key: "casa-roble-bosque-arcada", title: "Casa Roble con estudio en Bosque Arcada", orgId: "org-arcada", developmentId: "dev-bosque", asesorId: "u-jorge", createdBy: "u-jorge", status: "publicado", type: "casa", price: 7480000, bedrooms: 3, bathrooms: 3.5, parking: 2, m2Built: 205, m2Land: 190, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 5, unitsTotal: 30, credits: ["bancario", "cofinavit", "contado"], amenities: [], features: ["Estudio en planta baja", "Recámara principal con terraza", "Vestidor", "Cuarto de servicio", "Jardín"], description: "El modelo más amplio del fraccionamiento: estudio en planta baja que funciona como cuarta recámara u oficina, recámara principal con terraza y cuarto de servicio.", images: [img("bosque-arcada-sala"), img("bosque-arcada-fachada"), img("bosque-arcada-cocina"), img("bosque-arcada-casaclub")], featured: false, day: "2026-08-06" },
  { key: "casa-fresno-bosque-arcada", title: "Casa Fresno en Bosque Arcada", orgId: "org-arcada", developmentId: "dev-bosque", asesorId: "u-mariana", createdBy: "u-fernanda", status: "revision", type: "casa", price: 5890000, bedrooms: 3, bathrooms: 2.5, parking: 2, m2Built: 152, m2Land: 150, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 11, unitsTotal: 50, credits: ["bancario", "cofinavit", "contado"], amenities: [], features: ["Cocina integral", "Patio de servicio", "Jardín"], description: "Modelo de entrada a Bosque Arcada con tres recámaras, cocina integral y jardín. Ideal para familias que buscan casa en fraccionamiento con casa club.", images: [img("bosque-arcada-cocina"), img("bosque-arcada-fachada"), img("bosque-arcada-sala")], featured: false, day: "2026-10-15" },
  { key: "casa-alamo-bosque-arcada", title: "Casa Álamo en Bosque Arcada", orgId: "org-arcada", developmentId: "dev-bosque", asesorId: "u-jorge", createdBy: "u-jorge", status: "borrador", type: "casa", price: 6900000, bedrooms: 4, bathrooms: 3, parking: 2, m2Built: 188, m2Land: 170, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 6, unitsTotal: 20, credits: ["bancario", "contado"], amenities: [], features: ["Cuatro recámaras", "Terraza"], description: "Borrador de un modelo de cuatro recámaras. Falta confirmar precio final con dirección comercial.", images: [img("bosque-arcada-casaclub"), img("bosque-arcada-sala")], featured: false, day: "2026-10-17" },
  { key: "lumen-1-recamara", title: "Departamento de 1 recámara en Lumen Providencia", orgId: "org-arcada", developmentId: "dev-lumen", asesorId: "u-mariana", createdBy: "u-mariana", status: "publicado", type: "departamento", price: 3950000, bedrooms: 1, bathrooms: 1, parking: 1, m2Built: 62, levels: 1, delivery: "preventa", deliveryDate: "2027-12", unitsAvailable: 14, unitsTotal: 28, credits: ["bancario", "contado"], amenities: [], features: ["Balcón", "Cocina abierta", "Bodega incluida"], description: "Departamento de una recámara con balcón y cocina abierta, pensado para profesionistas o inversión. Incluye bodega y un cajón de estacionamiento.", images: [img("lumen-providencia-depto"), img("lumen-providencia-torre"), img("lumen-providencia-roof")], featured: false, day: "2026-08-12" },
  { key: "lumen-2-recamaras", title: "Departamento de 2 recámaras en Lumen Providencia", orgId: "org-arcada", developmentId: "dev-lumen", asesorId: "u-jorge", createdBy: "u-jorge", status: "publicado", type: "departamento", price: 5780000, bedrooms: 2, bathrooms: 2, parking: 2, m2Built: 98, levels: 1, delivery: "preventa", deliveryDate: "2027-12", unitsAvailable: 19, unitsTotal: 42, credits: ["bancario", "contado"], amenities: [], features: ["Vista a la ciudad", "Dos baños completos", "Balcón", "Bodega"], description: "Dos recámaras con baño propio cada una y ventanales de piso a techo. Pisos altos con vista a la ciudad.", images: [img("lumen-providencia-torre"), img("lumen-providencia-depto"), img("lumen-providencia-roof")], featured: true, day: "2026-08-14" },
  { key: "lumen-penthouse", title: "Penthouse en Lumen Providencia", orgId: "org-arcada", developmentId: "dev-lumen", asesorId: "u-mariana", createdBy: "u-rodrigo", status: "publicado", type: "departamento", price: 9900000, bedrooms: 3, bathrooms: 3.5, parking: 3, m2Built: 176, levels: 1, delivery: "preventa", deliveryDate: "2027-12", unitsAvailable: 2, unitsTotal: 4, credits: ["bancario", "contado"], amenities: [], features: ["Terraza privada", "Vista panorámica", "Cuarto de servicio", "Tres cajones"], description: "Uno de los cuatro penthouses de la torre, con terraza privada y vista panorámica de Guadalajara.", images: [img("lumen-providencia-roof"), img("lumen-providencia-depto"), img("lumen-providencia-torre")], featured: false, day: "2026-08-20" },
  { key: "casa-jacaranda-nativa", title: "Casa Jacaranda en Nativa Tlajomulco", orgId: "org-nativa", developmentId: "dev-nativa", asesorId: "u-oscar", createdBy: "u-oscar", status: "publicado", type: "casa", price: 1480000, bedrooms: 2, bathrooms: 1, parking: 1, m2Built: 58, m2Land: 90, levels: 1, delivery: "entrega-inmediata", unitsAvailable: 48, unitsTotal: 220, credits: ["infonavit", "fovissste", "unamos", "cofinavit", "bancario", "contado"], amenities: [], features: ["Calentador solar", "Cocineta", "Patio trasero", "Crecimiento a segundo nivel"], description: "Casa de una planta con dos recámaras y patio trasero, preparada para crecer a segundo nivel. Se entrega con calentador solar y cocineta.", images: [img("nativa-tlajomulco-fachada"), img("nativa-tlajomulco-interior"), img("nativa-tlajomulco-parque")], featured: true, day: "2026-08-02" },
  { key: "casa-tabachin-nativa", title: "Casa Tabachín en Nativa Tlajomulco", orgId: "org-nativa", developmentId: "dev-nativa", asesorId: "u-daniela", createdBy: "u-daniela", status: "publicado", type: "casa", price: 1890000, bedrooms: 3, bathrooms: 1.5, parking: 1, m2Built: 74, m2Land: 98, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 31, unitsTotal: 260, credits: ["infonavit", "fovissste", "unamos", "cofinavit", "bancario", "contado"], amenities: [], features: ["Calentador solar", "Medio baño en planta baja", "Patio"], description: "Casa de dos plantas con tres recámaras arriba y medio baño en planta baja. El modelo más vendido de Nativa.", images: [img("nativa-tlajomulco-interior"), img("nativa-tlajomulco-fachada"), img("nativa-tlajomulco-parque")], featured: false, day: "2026-08-03" },
  { key: "casa-huanacaxtle-nativa", title: "Casa Huanacaxtle en Nativa Tlajomulco", orgId: "org-nativa", developmentId: "dev-nativa", asesorId: "u-oscar", createdBy: "u-lucia", status: "publicado", type: "casa", price: 2290000, bedrooms: 3, bathrooms: 2, parking: 2, m2Built: 92, m2Land: 120, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 17, unitsTotal: 160, credits: ["infonavit", "fovissste", "unamos", "cofinavit", "bancario", "contado"], amenities: [], features: ["Dos cajones", "Dos baños completos", "Jardín"], description: "El modelo más amplio de Nativa: tres recámaras, dos baños completos, jardín y cochera para dos autos.", images: [img("nativa-tlajomulco-parque"), img("nativa-tlajomulco-fachada"), img("nativa-tlajomulco-interior")], featured: false, day: "2026-08-09" },
  { key: "casa-patio-cantera", title: "Casa Patio en Cantera Residencial", orgId: "org-cantera", developmentId: "dev-cantera", asesorId: "u-paola", createdBy: "u-paola", status: "publicado", type: "casa", price: 3650000, bedrooms: 3, bathrooms: 2.5, parking: 2, m2Built: 142, m2Land: 128, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 7, unitsTotal: 20, credits: ["infonavit", "fovissste", "cofinavit", "bancario", "contado"], amenities: [], features: ["Patio interior", "Detalles en cantera", "Cocina con talavera", "Terraza"], description: "Casa con patio interior al centro, cocina con detalles de talavera y terraza en planta alta.", images: [img("cantera-residencial-fachada"), img("cantera-residencial-patio"), img("cantera-residencial-cocina")], featured: true, day: "2026-08-22" },
  { key: "casa-arcos-cantera", title: "Casa Arcos en Cantera Residencial", orgId: "org-cantera", developmentId: "dev-cantera", asesorId: "u-paola", createdBy: "u-ernesto", status: "publicado", type: "casa", price: 4280000, bedrooms: 3, bathrooms: 3, parking: 2, m2Built: 165, m2Land: 140, levels: 2, delivery: "entrega-inmediata", unitsAvailable: 4, unitsTotal: 16, credits: ["infonavit", "fovissste", "cofinavit", "bancario", "contado"], amenities: [], features: ["Arcos de cantera", "Recámara en planta baja", "Patio"], description: "Modelo con recámara en planta baja, útil para adultos mayores, y portal de arcos de cantera hacia el patio.", images: [img("cantera-residencial-patio"), img("cantera-residencial-fachada"), img("cantera-residencial-cocina")], featured: false, day: "2026-08-25" },
  { key: "casa-chapalita-jardin", title: "Casa con jardín en Chapalita", orgId: "org-cantera", asesorId: "u-paola", createdBy: "u-paola", status: "publicado", type: "casa", price: 7200000, bedrooms: 3, bathrooms: 2, parking: 2, m2Built: 210, m2Land: 300, levels: 1, delivery: "entrega-inmediata", credits: ["bancario", "contado"], amenities: [], features: ["Una sola planta", "Jardín de 90 m²", "Remodelada en 2025", "Calle arbolada"], description: "Casa de una planta remodelada, con jardín amplio en calle arbolada de Chapalita. Escrituras y predial revisados por el equipo legal de Cantera.", colonia: "Chapalita", municipio: "Guadalajara", lat: 20.6662, lng: -103.4003, images: [img("cantera-chapalita-casa")], featured: false, day: "2026-09-02" },
  { key: "depto-remodelado-americana", title: "Departamento remodelado en la Americana", orgId: "org-cantera", asesorId: "u-paola", createdBy: "u-paola", status: "publicado", type: "departamento", price: 3350000, bedrooms: 2, bathrooms: 1, parking: 1, m2Built: 85, levels: 1, delivery: "entrega-inmediata", credits: ["bancario", "cofinavit", "contado"], amenities: [], features: ["Techos altos", "Piso de pasta original", "Balcón a la calle"], description: "Departamento en edificio de los años cincuenta, remodelado, con techos altos y piso de pasta original. A dos cuadras de Av. Chapultepec.", colonia: "Americana", municipio: "Guadalajara", lat: 20.6722, lng: -103.3642, images: [img("cantera-americana-depto")], featured: false, day: "2026-09-05" },
  { key: "modelo-sabino-mezquite-valle", title: "Modelo Sabino en Mezquite Valle", orgId: "org-mezquite", developmentId: "dev-mvalle", asesorId: "u-hector", createdBy: "u-hector", status: "publicado", type: "casa", price: 2980000, bedrooms: 3, bathrooms: 2.5, parking: 2, m2Built: 128, m2Land: 120, levels: 2, delivery: "preventa", deliveryDate: "2027-06", unitsAvailable: 38, unitsTotal: 90, credits: ["infonavit", "cofinavit", "unamos", "bancario", "contado"], amenities: [], features: ["Precio de preventa", "Jardín", "Cocina abierta"], description: "Casa en preventa con tres recámaras y jardín. Precio de primera etapa con entrega en junio de 2027.", images: [img("mezquite-valle-modelo"), img("mezquite-valle-interior"), img("mezquite-valle-obra")], featured: true, day: "2026-09-10" },
  { key: "modelo-huizache-mezquite-valle", title: "Modelo Huizache en Mezquite Valle", orgId: "org-mezquite", developmentId: "dev-mvalle", asesorId: "u-ximena", createdBy: "u-ximena", status: "publicado", type: "casa", price: 2590000, bedrooms: 2, bathrooms: 1.5, parking: 1, m2Built: 96, m2Land: 105, levels: 2, delivery: "preventa", deliveryDate: "2027-06", unitsAvailable: 44, unitsTotal: 100, credits: ["infonavit", "cofinavit", "unamos", "bancario", "contado"], amenities: [], features: ["Precio de preventa", "Patio"], description: "Modelo de dos recámaras en preventa, ideal para primera casa con Infonavit o Unamos Créditos.", images: [img("mezquite-valle-interior"), img("mezquite-valle-modelo"), img("mezquite-valle-obra")], featured: false, day: "2026-09-11" },
  { key: "modelo-pirul-mezquite-valle", title: "Modelo Pirul en Mezquite Valle", orgId: "org-mezquite", developmentId: "dev-mvalle", asesorId: "u-hector", createdBy: "u-claudia", status: "publicado", type: "casa", price: 3390000, bedrooms: 3, bathrooms: 2.5, parking: 2, m2Built: 140, m2Land: 135, levels: 2, delivery: "preventa", deliveryDate: "2027-06", unitsAvailable: 21, unitsTotal: 70, credits: ["infonavit", "cofinavit", "bancario", "contado"], amenities: [], features: ["Estancia familiar en planta alta", "Jardín", "Precio de preventa"], description: "El modelo más amplio de Mezquite Valle, con estancia familiar en planta alta.", images: [img("mezquite-valle-obra"), img("mezquite-valle-modelo"), img("mezquite-valle-interior")], featured: false, day: "2026-09-12" },
  { key: "torre-mezquite-2-recamaras", title: "Departamento de 2 recámaras en Torre Mezquite", orgId: "org-mezquite", developmentId: "dev-torre", asesorId: "u-ximena", createdBy: "u-ximena", status: "publicado", type: "departamento", price: 5950000, bedrooms: 2, bathrooms: 2, parking: 2, m2Built: 112, levels: 1, delivery: "entrega-inmediata", unitsAvailable: 8, unitsTotal: 30, credits: ["bancario", "contado"], amenities: [], features: ["Terraza", "Piso de madera", "Bodega"], description: "Departamento listo para habitar con terraza y piso de madera, en la colonia Americana.", images: [img("torre-mezquite-depto"), img("torre-mezquite-torre"), img("torre-mezquite-terraza")], featured: true, day: "2026-09-15" },
  { key: "torre-mezquite-loft", title: "Loft en Torre Mezquite", orgId: "org-mezquite", developmentId: "dev-torre", asesorId: "u-hector", createdBy: "u-hector", status: "vendido", type: "departamento", price: 3480000, bedrooms: 1, bathrooms: 1, parking: 1, m2Built: 58, levels: 1, delivery: "entrega-inmediata", unitsAvailable: 0, unitsTotal: 12, credits: ["bancario", "contado"], amenities: [], features: ["Doble altura", "Tapanco"], description: "Lofts con doble altura y tapanco. Agotados.", images: [img("torre-mezquite-torre"), img("torre-mezquite-depto")], featured: false, day: "2026-09-16" },
  { key: "torre-mezquite-garden", title: "Departamento garden en Torre Mezquite", orgId: "org-mezquite", developmentId: "dev-torre", asesorId: "u-ximena", createdBy: "u-claudia", status: "publicado", type: "departamento", price: 8750000, bedrooms: 3, bathrooms: 3, parking: 2, m2Built: 158, levels: 1, delivery: "entrega-inmediata", unitsAvailable: 2, unitsTotal: 6, credits: ["bancario", "contado"], amenities: [], features: ["Terraza de 45 m²", "Cuarto de servicio", "Tres recámaras"], description: "Departamento de tres recámaras con terraza de 45 m² en planta baja del edificio.", images: [img("torre-mezquite-terraza"), img("torre-mezquite-depto"), img("torre-mezquite-torre")], featured: false, day: "2026-09-18" },
];

const listings: Listing[] = raw.map((r, i) => {
  const d = r.developmentId ? devById[r.developmentId] : undefined;
  const { key, day, offset, ...rest } = r;
  void offset;
  return {
    ...rest,
    id: `l-${i + 1}`,
    slug: key,
    colonia: r.colonia ?? d!.colonia,
    municipio: r.municipio ?? d!.municipio,
    lat: r.lat ?? d!.lat + ((i % 3) - 1) * 0.0012,
    lng: r.lng ?? d!.lng + ((i % 2) - 0.5) * 0.0015,
    amenities: d ? d.amenities : [],
    featured: r.featured ?? false,
    views: 180 + ((i * 137) % 900),
    createdAt: `${day}T15:00:00Z`,
    updatedAt: `${day}T15:00:00Z`,
  };
});

const u = (id: string, name: string, email: string, role: User["role"], title: string, orgId?: string, managerId?: string, phone = "33 0000 0000"): User => ({
  id, name, email, password: "demo1234", role, orgId, managerId, phone, title, active: true,
  createdAt: "2026-06-15T10:00:00Z", mustChangePassword: false,
});

const users: User[] = [
  u("u-admin", "Valeria Ortiz", "admin@umbral.example", "superadmin", "Administración de la plataforma"),
  u("u-rodrigo", "Rodrigo Villaseñor", "rodrigo@arcada.example", "org_admin", "Director comercial", "org-arcada"),
  u("u-mariana", "Mariana Celis", "mariana@arcada.example", "asesor", "Asesora de ventas", "org-arcada", undefined, "33 0000 0111"),
  u("u-jorge", "Jorge Anguiano", "jorge@arcada.example", "asesor", "Asesor de ventas", "org-arcada", undefined, "33 0000 0112"),
  u("u-fernanda", "Fernanda Ruvalcaba", "fernanda@arcada.example", "colaborador", "Colaboradora", "org-arcada", "u-mariana"),
  u("u-lucia", "Lucía Barragán", "lucia@nativa.example", "org_admin", "Gerente de ventas", "org-nativa"),
  u("u-oscar", "Óscar Tapia", "oscar@nativa.example", "asesor", "Asesor de crédito", "org-nativa", undefined, "33 0000 0211"),
  u("u-daniela", "Daniela Quiroz", "daniela@nativa.example", "asesor", "Asesora de crédito", "org-nativa", undefined, "33 0000 0212"),
  u("u-ernesto", "Ernesto Gallardo", "ernesto@cantera.example", "org_admin", "Director", "org-cantera"),
  u("u-paola", "Paola Íñiguez", "paola@cantera.example", "asesor", "Asesora inmobiliaria", "org-cantera", undefined, "33 0000 0311"),
  u("u-claudia", "Claudia Arreola", "claudia@mezquite.example", "org_admin", "Gerente comercial", "org-mezquite"),
  u("u-hector", "Héctor Partida", "hector@mezquite.example", "asesor", "Asesor de ventas", "org-mezquite", undefined, "33 0000 0411"),
  u("u-ximena", "Ximena Orozco", "ximena@mezquite.example", "asesor", "Asesora de ventas", "org-mezquite", undefined, "33 0000 0412"),
];

const lead = (id: string, listingKey: string, name: string, credit: Lead["credit"], status: Lead["status"], source: Lead["source"], at: string, message: string, notes: Lead["notes"] = []): Lead => {
  const l = listings.find((x) => x.slug === listingKey)!;
  return { id, orgId: l.orgId, asesorId: l.asesorId, listingId: l.id, developmentId: l.developmentId, name, phone: "33 0000 9" + id.slice(-3).padStart(3, "0"), email: name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@correo.example", credit, message, source, status, notes, createdAt: at };
};

const leads: Lead[] = [
  lead("ld-001", "casa-encino-bosque-arcada", "Andrea Medina", "bancario", "nuevo", "ficha", "2026-10-18T17:20:00Z", "Me interesa visitar la casa muestra este sábado."),
  lead("ld-002", "casa-encino-bosque-arcada", "Luis Navarro", "cofinavit", "contactado", "agente", "2026-10-16T13:05:00Z", "Pregunté al asistente por Cofinavit y quiero saber cuánto me alcanza.", [{ at: "2026-10-16T14:00:00Z", by: "u-mariana", text: "Le envié la corrida financiera por WhatsApp." }]),
  lead("ld-003", "lumen-2-recamaras", "Sofía Ramírez", "bancario", "cita", "ficha", "2026-10-14T19:40:00Z", "¿Hay unidades en piso alto?", [{ at: "2026-10-15T10:00:00Z", by: "u-jorge", text: "Cita en showroom el jueves a las 17:00." }]),
  lead("ld-004", "lumen-penthouse", "Ricardo Hernández", "contado", "apartado", "ficha", "2026-10-05T11:10:00Z", "Interesado en penthouse, pago de contado.", [{ at: "2026-10-09T12:00:00Z", by: "u-mariana", text: "Apartó PH-02. Firma de contrato el 20 de octubre." }]),
  lead("ld-005", "casa-roble-bosque-arcada", "Gabriela Torres", "bancario", "descartado", "perfil", "2026-09-28T16:00:00Z", "Buscaba algo más cerca de Providencia.", [{ at: "2026-09-29T10:00:00Z", by: "u-jorge", text: "Se le ofreció Lumen. No le interesó departamento." }]),
  lead("ld-006", "casa-jacaranda-nativa", "Miguel Ángel Ruiz", "infonavit", "nuevo", "agente", "2026-10-19T09:15:00Z", "Tengo 1,600 puntos en Infonavit, ¿me alcanza?"),
  lead("ld-007", "casa-tabachin-nativa", "Karla Esparza", "fovissste", "contactado", "ficha", "2026-10-17T12:30:00Z", "Soy maestra, ¿aceptan Fovissste?", [{ at: "2026-10-17T13:00:00Z", by: "u-daniela", text: "Le mandé la lista de documentos." }]),
  lead("ld-008", "casa-huanacaxtle-nativa", "José Luis y Brenda Díaz", "unamos", "cita", "ficha", "2026-10-12T18:00:00Z", "Queremos unir créditos con mi esposa."),
  lead("ld-009", "casa-jacaranda-nativa", "Alejandra Vega", "infonavit", "cerrado", "desarrollo", "2026-09-20T10:30:00Z", "Quiero la casa en esquina.", [{ at: "2026-10-10T10:00:00Z", by: "u-oscar", text: "Firmó escrituras. Entrega el 25 de octubre." }]),
  lead("ld-010", "casa-patio-cantera", "Fernando Lara", "infonavit", "nuevo", "ficha", "2026-10-18T20:10:00Z", "¿Puedo ver la casa entre semana?"),
  lead("ld-011", "casa-chapalita-jardin", "Patricia Gómez", "bancario", "contactado", "perfil", "2026-10-11T15:45:00Z", "¿Acepta mascotas el fraccionamiento?"),
  lead("ld-012", "modelo-sabino-mezquite-valle", "Iván Castañeda", "infonavit", "nuevo", "agente", "2026-10-18T22:05:00Z", "Pregunté por la fecha de entrega, quiero apartar."),
  lead("ld-013", "modelo-huizache-mezquite-valle", "Mónica Salas", "unamos", "contactado", "ficha", "2026-10-13T09:50:00Z", "Queremos comprar con mi hermana."),
  lead("ld-014", "torre-mezquite-2-recamaras", "Diego Zamora", "bancario", "cita", "ficha", "2026-10-10T17:30:00Z", "¿El precio incluye bodega?"),
  lead("ld-015", "torre-mezquite-garden", "Laura Cervantes", "contado", "nuevo", "desarrollo", "2026-10-19T11:00:00Z", "Busco planta baja con terraza para mis perros."),
  lead("ld-016", "lumen-1-recamara", "Emilio Rangel", "bancario", "nuevo", "ficha", "2026-10-17T21:15:00Z", "Lo quiero como inversión para renta."),
];

export function seedDB(): DB {
  return {
    version: 3,
    orgs: structuredClone(orgs),
    developments: structuredClone(developments),
    listings: structuredClone(listings),
    users: structuredClone(users),
    leads: structuredClone(leads),
    activity: [
      { id: "ac-1", at: "2026-10-17T10:00:00Z", userId: "u-jorge", orgId: "org-arcada", text: "creó el borrador Casa Álamo en Bosque Arcada" },
      { id: "ac-2", at: "2026-10-15T12:00:00Z", userId: "u-fernanda", orgId: "org-arcada", text: "envió a revisión Casa Fresno en Bosque Arcada" },
      { id: "ac-3", at: "2026-10-09T12:00:00Z", userId: "u-mariana", orgId: "org-arcada", text: "marcó como apartado el prospecto de Ricardo Hernández" },
    ],
    requests: [],
    amenities: [...AMENITIES],
  };
}

export const SEED = seedDB();
