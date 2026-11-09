// Datos iniciales. Grupo Casillas y sus proyectos se cargaron a partir de su material de redes
// (carpeta de Drive del 8-nov-2026). Lo marcado como "por confirmar" en docs/produccion.md
// debe validarse con la desarrolladora antes de abrir el sitio al público.
import type { AdvisorApplication, Article, BankRate, Course, Credit, DB, Development, Lead, Listing, Material, Org, Unit, User } from "./types";
import { INVENTARIO_FECHA, UNITS } from "./inventario-casillas";

export const CREDITS: Credit[] = [
  {
    id: "bancario",
    name: "Crédito bancario",
    short: "Hipoteca con un banco; la tasa, el plazo y el enganche dependen de tu perfil.",
    who: "Personas con ingresos comprobables, empleadas o independientes.",
    how: "Compara las tasas de varios bancos y solicita el trámite con nosotros: un asesor te acompaña de la precalificación a la firma.",
  },
  {
    id: "contado",
    name: "Contado",
    short: "Pago con recursos propios, en una exhibición o según el plan de pagos de la desarrolladora.",
    who: "Cualquier comprador con recursos propios.",
    how: "Pregunta por descuentos de contado y esquemas de pago durante la obra.",
  },
];

export const AMENITIES = [
  "Alberca", "Casa club", "Gimnasio", "Áreas verdes", "Juegos infantiles", "Seguridad 24/7",
  "Acceso controlado", "Roof garden", "Asadores", "Cancha de pádel", "Coworking", "Pet park",
  "Elevador", "Bodega", "Ciclovía", "Salón de eventos", "Ludoteca", "Área comercial", "Estacionamiento para bicicletas",
];

const img = (dev: string, n: number) => `/img/casillas/${dev}-${n}.webp`;
const imgs = (dev: string, count: number) => Array.from({ length: count }, (_, i) => img(dev, i + 1));

const orgs: Org[] = [
  {
    id: "org-casillas", slug: "grupo-casillas", name: "Grupo Casillas",
    verified: true, status: "activa", initials: "GC", color: "#1F2A44",
    tagline: "Desarrollos verticales en las zonas que más crecen de Guadalajara y Zapopan.",
    description: "Desarrolladora tapatía con proyectos de departamentos en la Colonia Moderna, Zona Country, Colonia 5 de Mayo y Ciudad Granja. Construye edificios de escala media con amenidades, cerca de transporte y de los corredores de servicios de la ciudad.",
    history: "Grupo Casillas lleva 23 años desarrollando proyectos en Jalisco y suma 34 proyectos realizados. Su portafolio actual se concentra en vivienda vertical en zonas consolidadas: Alcalde Mil y Argentina 824 en la Colonia Moderna, Ávila & León en la Zona Country, Punta Patria sobre Av. Patria y Cedros 1180 en Ciudad Granja, Zapopan.",
    since: 2003, projectsDone: 34,
    municipios: ["Guadalajara", "Zapopan"],
    phone: "", email: "", address: "Guadalajara, Jalisco", hours: "",
    credits: ["bancario", "contado"],
    paymentTerms: "Esquemas de pago por proyecto: apartado, enganche y mensualidades durante la obra en preventas. El asesor comparte el plan vigente.",
    responseMinutes: 30,
    seal: true,
    trust: [
      { id: "t1", label: "Identidad y razón social verificadas", ok: true },
      { id: "t2", label: "Más de 10 años de trayectoria", ok: true },
      { id: "t3", label: "Proyectos entregados comprobables", ok: true },
      { id: "t4", label: "Permisos de construcción vigentes por proyecto", ok: false },
      { id: "t5", label: "Avance de obra publicado cada mes", ok: true },
    ],
    agent: {
      enabled: true, name: "Asistente de Grupo Casillas",
      greeting: "Hola, soy el asistente de Grupo Casillas. Pregúntame por Alcalde Mil, Argentina 824, Cedros 1180, Punta Patria o Ávila & León.",
      suggested: ["¿Qué proyectos tienen en preventa?", "¿Cuál tiene entrega inmediata?", "¿Cuánto es el enganche?", "¿Puedo agendar una visita?"],
      kb: [
        { id: "kb-1", q: "Preventas", a: "Alcalde Mil (Colonia Moderna), Punta Patria (Colonia 5 de Mayo) y Ávila & León (Zona Country) están en preventa." },
        { id: "kb-2", q: "Entrega inmediata", a: "Argentina 824 (Colonia Moderna) y Cedros 1180 (Ciudad Granja, Zapopan) tienen departamentos con entrega inmediata." },
        { id: "kb-3", q: "Enganche", a: "En Punta Patria el enganche es desde el 10%. Para los demás proyectos el asesor te comparte el esquema vigente." },
        { id: "kb-4", q: "Trayectoria", a: "Grupo Casillas tiene 23 años desarrollando y 34 proyectos realizados." },
      ],
      notes: "Los precios publicados son 'desde'. Las promociones y la disponibilidad exacta las confirma el asesor.",
    },
    createdAt: "2026-11-08T10:00:00Z",
  },
];

const developments: Development[] = [
  {
    id: "dev-alcalde", slug: "alcalde-mil", name: "Alcalde Mil", orgId: "org-casillas", kind: "torre",
    colonia: "Colonia Moderna", municipio: "Guadalajara", lat: 20.6578, lng: -103.3505,
    description: "Torre de departamentos en preventa en la Colonia Moderna, a pasos de la estación del tren Guadalajara-CDMX y del Parque Agua Azul, con conexión a Línea 3, Línea 5 y Macrobús. Amenidades en rooftop: gimnasio, coworking, juegos infantiles, asadores y área comercial.",
    typologies: "Estudio, 1 y 2 recámaras y Lock-Off",
    priceFrom: 3200000,
    amenities: ["Roof garden", "Gimnasio", "Coworking", "Juegos infantiles", "Asadores", "Área comercial", "Elevador"],
    delivery: "preventa", progress: 60, totalUnits: 0,
    images: imgs("alcalde-mil", 7), launch: false,
    createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "dev-argentina", slug: "argentina-824", name: "Argentina 824", orgId: "org-casillas", kind: "torre",
    colonia: "Colonia Moderna", municipio: "Guadalajara", lat: 20.6648, lng: -103.3606,
    description: "Edificio de departamentos con entrega inmediata a minutos de la Colonia Americana. Arquitectura de ladrillo aparente, terraza común y pocas unidades por piso.",
    typologies: "1 y 2 recámaras y Lock-Off, desde 52 m²",
    priceFrom: 4500000,
    amenities: ["Elevador", "Estacionamiento para bicicletas", "Área comercial"],
    delivery: "entrega-inmediata", progress: 100, totalUnits: 0,
    images: imgs("argentina-824", 7),
    createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "dev-cedros", slug: "cedros-1180", name: "Cedros 1180", orgId: "org-casillas", kind: "torre",
    colonia: "Ciudad Granja", municipio: "Zapopan", address: "Av. Cedros 1180, Ciudad Granja, Zapopan",
    lat: 20.6862, lng: -103.4478,
    description: "Proyecto boutique de solo 34 departamentos en Ciudad Granja, Zapopan, con entrega inmediata. A minutos del Estadio Akron y del Parque Metropolitano. Terraza común en azotea.",
    typologies: "2 recámaras, 2 baños, 2 cajones",
    priceFrom: 5800000,
    amenities: ["Roof garden", "Elevador", "Acceso controlado"],
    delivery: "entrega-inmediata", progress: 100, totalUnits: 34,
    images: imgs("cedros-1180", 7),
    createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "dev-patria", slug: "punta-patria", name: "Punta Patria", orgId: "org-casillas", kind: "torre",
    colonia: "Colonia 5 de Mayo", municipio: "Guadalajara", address: "Av. Patria 750, Col. 5 de Mayo, Guadalajara",
    lat: 20.7088, lng: -103.3912,
    description: "Departamentos de 3 recámaras en preventa sobre Av. Patria, pensados para familias que buscan más espacio. Alberca, gimnasio, ludoteca y coworking.",
    typologies: "3 recámaras",
    priceFrom: 3200000,
    amenities: ["Alberca", "Gimnasio", "Ludoteca", "Coworking", "Áreas verdes"],
    delivery: "preventa", progress: 0, totalUnits: 0,
    paymentTerms: "Enganche desde el 10%.",
    images: imgs("punta-patria", 6), launch: true,
    createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "dev-avila", slug: "avila-leon", name: "Ávila & León", orgId: "org-casillas", kind: "torre",
    colonia: "Country Club", municipio: "Guadalajara", address: "Av. Ávila Camacho esquina Enrique Díaz de León, Zona Country, Guadalajara",
    lat: 20.7021, lng: -103.3741,
    description: "Departamentos en preventa en la Zona Country, a 5 minutos del Country Club, Midtown, Punto Sao Paulo y el Parque Ávila Camacho, a pasos de la Línea 3. Alberca con vista a la ciudad, cancha de pádel, gimnasio, coworking y área infantil.",
    typologies: "1, 2 y 3 recámaras",
    priceFrom: 3900000,
    amenities: ["Alberca", "Cancha de pádel", "Gimnasio", "Coworking", "Juegos infantiles", "Elevador"],
    delivery: "preventa", progress: 0, totalUnits: 0,
    images: imgs("avila-leon", 7), launch: true,
    createdAt: "2026-11-08T10:00:00Z",
  },
];


// Una ficha por desarrollo y número de recámaras, armada con las unidades reales del inventario de Grupo Casillas.
// Precio "desde" y m² mínimo salen de las unidades disponibles; las apartadas se muestran pero no cuentan.
const BEDS_LABEL = ["Estudio", "1 recámara", "2 recámaras", "3 recámaras"];
const FEATURES: Record<string, string[]> = {
  "dev-alcalde": ["Precio de preventa", "Rooftop con amenidades", "A pasos del tren GDL-CDMX"],
  "dev-argentina": ["Entrega inmediata", "A minutos de la Colonia Americana", "Edificio con pocas unidades"],
  "dev-cedros": ["Proyecto boutique de 34 departamentos", "Dos cajones de estacionamiento"],
  "dev-patria": ["Precio de preventa", "Enganche desde 10%", "Alberca, gimnasio, ludoteca y coworking"],
  "dev-avila": ["Precio de preventa", "A 5 minutos del Country Club", "A pasos de la Línea 3"],
};
const isStudio = (u: Unit) => u.model === "E";
const groupKey = (u: Unit) => (isStudio(u) ? 0 : u.bedrooms);

const listings: Listing[] = developments.flatMap((d) => {
  const groups = new Map<number, Unit[]>();
  for (const unit of UNITS[d.id] ?? []) groups.set(groupKey(unit), [...(groups.get(groupKey(unit)) ?? []), unit]);
  return [...groups.entries()].sort((x, y) => x[0] - y[0]).map(([k, units]) => {
    const avail = units.filter((x) => x.status === "disponible" && x.price > 0);
    const base = avail.length ? avail : units;
    const min = <K extends keyof Unit>(f: K) => Math.min(...base.map((x) => x[f] as number));
    const max = <K extends keyof Unit>(f: K) => Math.max(...base.map((x) => x[f] as number));
    const label = BEDS_LABEL[k];
    const title = k === 0 ? `Estudio en ${d.name}` : `Departamento de ${label} en ${d.name}`;
    const m2a = min("m2"), m2b = max("m2");
    return {
      id: `l-${d.slug}-${k}`,
      slug: `${d.slug}-${k === 0 ? "estudio" : `${k}-recamara${k > 1 ? "s" : ""}`}`,
      title,
      orgId: d.orgId,
      developmentId: d.id,
      createdBy: "u-admin",
      status: avail.length ? "publicado" : "pausado",
      type: "departamento",
      price: avail.length ? min("price") : 0,
      bedrooms: Math.max(1, k),
      bathrooms: min("bathrooms"),
      parking: max("parking"),
      m2Built: m2a,
      levels: 1,
      delivery: d.delivery,
      unitsAvailable: avail.length,
      credits: ["bancario", "contado"],
      paymentTerms: d.paymentTerms,
      units,
      amenities: d.amenities,
      features: FEATURES[d.id] ?? [],
      description: `${title}${m2a === m2b ? ` de ${m2a} m²` : `, de ${m2a} a ${m2b} m²`}. ${avail.length} ${avail.length === 1 ? "unidad disponible" : "unidades disponibles"} al ${new Date(INVENTARIO_FECHA).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}. ${d.description}`,
      colonia: d.colonia,
      municipio: d.municipio,
      lat: d.lat,
      lng: d.lng,
      images: d.images,
      featured: avail.length > 0 && k === Math.min(...[...groups.entries()].filter(([, us]) => us.some((x) => x.status === "disponible" && x.price > 0)).map(([g]) => g)),
      views: 0,
      createdAt: INVENTARIO_FECHA,
      updatedAt: INVENTARIO_FECHA,
    } satisfies Listing;
  });
});

// Los "desde" y el número de unidades de cada desarrollo se recalculan con el inventario.
for (const d of developments) {
  const avail = (UNITS[d.id] ?? []).filter((x) => x.status === "disponible" && x.price > 0);
  d.priceFrom = avail.length ? Math.min(...avail.map((x) => x.price)) : undefined;
}

const u = (id: string, name: string, email: string, role: User["role"], title: string, extra: Partial<User> = {}): User => ({
  id, name, email, password: "demo1234", role, phone: "", title, active: true,
  createdAt: "2026-11-08T10:00:00Z", mustChangePassword: false, ...extra,
});

// Cuentas de desarrollo (solo modo local). En Supabase las cuentas se crean desde el panel.
const users: User[] = [
  u("u-admin", "Administración Umbral", "admin@umbral.example", "superadmin", "Administración de la plataforma"),
  u("u-casillas", "Grupo Casillas", "casillas@umbral.example", "desarrolladora", "Dirección comercial", { orgId: "org-casillas" }),
  u("u-interno", "Asesor interno de prueba", "interno@umbral.example", "asesor", "Asesor inmobiliario", { asesorTipo: "interno", phone: "33 0000 0001", mobile: "33 0000 0001" }),
  u("u-externo", "Asesor externo de prueba", "externo@umbral.example", "asesor", "Asesor inmobiliario", { asesorTipo: "externo", company: "Independiente", phone: "33 0000 0002", mobile: "33 0000 0002" }),
];

const leads: Lead[] = [];

const applications: AdvisorApplication[] = [];

// Tasas de referencia para probar el simulador. Deben reemplazarse con las vigentes antes de publicar.
const banks: BankRate[] = [
  { id: "bk-bbva", bank: "BBVA", product: "Hipoteca tasa fija", rate: 10.75, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
  { id: "bk-banorte", bank: "Banorte", product: "Crédito hipotecario", rate: 10.9, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
  { id: "bk-santander", bank: "Santander", product: "Hipoteca Santander", rate: 10.85, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
  { id: "bk-hsbc", bank: "HSBC", product: "Hipoteca HSBC", rate: 10.6, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
  { id: "bk-scotiabank", bank: "Scotiabank", product: "Crédito hipotecario", rate: 11.0, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
  { id: "bk-banamex", bank: "Banamex", product: "Hipoteca Banamex", rate: 11.1, minDown: 10, maxYears: 20, notes: "Tasa de referencia por confirmar.", updatedAt: "2026-11-08T10:00:00Z" },
];

const articles: Article[] = [
  {
    id: "ar-1", slug: "alcalde-mil-60-por-ciento-de-avance", category: "avance", orgId: "org-casillas", developmentId: "dev-alcalde",
    title: "Alcalde Mil alcanza 60% de avance de obra",
    summary: "La torre de la Colonia Moderna sigue en preventa con estudios, departamentos de 1 y 2 recámaras y Lock-Off.",
    body: "Grupo Casillas reporta 60% de avance en Alcalde Mil. El proyecto sigue en preventa con estudios, departamentos de 1 y 2 recámaras y unidades Lock-Off, desde 2.47 millones de pesos.\n\nAlcalde Mil está en la Colonia Moderna, a pasos de la futura estación del tren Guadalajara-CDMX y del Parque Agua Azul.",
    image: "/img/casillas/pub/alcalde-mil-avance.webp", published: true, date: "2026-11-01T10:00:00Z", createdBy: "u-casillas",
  },
  {
    id: "ar-2", slug: "avila-leon-preventa-zona-country", category: "lanzamiento", orgId: "org-casillas", developmentId: "dev-avila",
    title: "Ávila & León abre preventa en la Zona Country",
    summary: "Departamentos de 1, 2 y 3 recámaras desde 4.09 millones de pesos, en la esquina de Ávila Camacho y Enrique Díaz de León.",
    body: "Ávila & León es el proyecto de Grupo Casillas en la Zona Country. Tiene departamentos de 1, 2 y 3 recámaras y estudios, con alberca, cancha de pádel, gimnasio, coworking y área infantil.\n\nLa preventa arranca desde 4.09 millones de pesos.",
    image: "/img/casillas/pub/avila-leon-preventa.webp", published: true, date: "2026-10-20T10:00:00Z", createdBy: "u-casillas",
  },
  {
    id: "ar-3", slug: "punta-patria-preventa", category: "lanzamiento", orgId: "org-casillas", developmentId: "dev-patria",
    title: "Punta Patria: departamentos de 3 recámaras en preventa",
    summary: "Sobre Av. Patria, con enganche desde 10%.",
    body: "Punta Patria ofrece departamentos de tres recámaras en preventa sobre Av. Patria 750, Colonia 5 de Mayo. Incluye alberca, gimnasio, ludoteca y coworking. Enganche desde 10%.",
    image: "/img/casillas/pub/punta-patria-preventa.webp", published: true, date: "2026-10-10T10:00:00Z", createdBy: "u-casillas",
  },
];

const materials: Material[] = [
  { id: "m-1", orgId: "org-casillas", developmentId: "dev-alcalde", kind: "publicidad", title: "Alcalde Mil: preventa desde $3.2 MDP", url: "/img/casillas/pub/alcalde-mil-preventa.webp", thumb: "/img/casillas/pub/alcalde-mil-preventa.webp", createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-2", orgId: "org-casillas", developmentId: "dev-argentina", kind: "publicidad", title: "Argentina 824: entrega inmediata", url: "/img/casillas/pub/argentina-824-entrega.webp", thumb: "/img/casillas/pub/argentina-824-entrega.webp", createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-3", orgId: "org-casillas", developmentId: "dev-cedros", kind: "publicidad", title: "Cedros 1180: último departamento", url: "/img/casillas/pub/cedros-1180-ultimo.webp", thumb: "/img/casillas/pub/cedros-1180-ultimo.webp", createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-4", orgId: "org-casillas", developmentId: "dev-patria", kind: "publicidad", title: "Punta Patria: preventa", url: "/img/casillas/pub/punta-patria-preventa.webp", thumb: "/img/casillas/pub/punta-patria-preventa.webp", createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-5", orgId: "org-casillas", developmentId: "dev-avila", kind: "publicidad", title: "Ávila & León: preventa desde $3.9 MDP", url: "/img/casillas/pub/avila-leon-preventa.webp", thumb: "/img/casillas/pub/avila-leon-preventa.webp", createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-6", orgId: "org-casillas", kind: "publicidad", title: "Brokers y agencias: hasta 4% de comisión", url: "/img/casillas/pub/brokers-4.webp", thumb: "/img/casillas/pub/brokers-4.webp", createdAt: "2026-11-08T10:00:00Z" },
  ...developments.flatMap((d) => d.images.slice(0, 4).map((src, i): Material => ({ id: `m-r-${d.id}-${i}`, orgId: d.orgId, developmentId: d.id, kind: "render", title: `${d.name}, imagen ${i + 1}`, url: src, thumb: src, createdAt: "2026-11-08T10:00:00Z" }))),
  { id: "m-v-1", orgId: "org-casillas", developmentId: "dev-alcalde", kind: "video", title: "Alcalde Mil, reel noviembre 2026", url: "https://drive.google.com/file/d/1wo40KcvXkx1QyOH9-ZZDWbG-GR87QW8J/view", thumb: img("alcalde-mil", 1), createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-v-2", orgId: "org-casillas", developmentId: "dev-argentina", kind: "video", title: "Argentina 824, reel octubre 2026", url: "https://drive.google.com/file/d/1_lxEAVxl8epfo23sRI1s_CJLYkZTM3Pw/view", thumb: img("argentina-824", 1), createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-v-3", orgId: "org-casillas", developmentId: "dev-patria", kind: "video", title: "Punta Patria, reel noviembre 2026", url: "https://drive.google.com/file/d/1Q8JLMLGByVXKC9RGhJAWMPwsxuCxYh3F/view", thumb: img("punta-patria", 1), createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-v-4", orgId: "org-casillas", developmentId: "dev-avila", kind: "video", title: "Ávila & León, reel noviembre 2026", url: "https://drive.google.com/file/d/1REjlzqerCOCJCxbMLADyAD4d4maCd7wD/view", thumb: img("avila-leon", 1), createdAt: "2026-11-08T10:00:00Z" },
  { id: "m-v-5", orgId: "org-casillas", kind: "video", title: "Grupo Casillas: alianzas con inmobiliarias", url: "https://drive.google.com/file/d/1McNz5JqpSKDMxkt-qny6Dbrk3XuIXUhX/view", thumb: "/img/casillas/pub/brokers-4.webp", createdAt: "2026-11-08T10:00:00Z" },
];

const courses: Course[] = [
  {
    id: "c-1", kind: "capacitacion", orgId: "org-casillas", developmentId: "dev-alcalde",
    title: "Capacitación: Alcalde Mil", summary: "Ubicación, tipologías, amenidades y argumentos de venta del proyecto.",
    body: "Contenido de la capacitación por cargar: presentación del proyecto, tabla de precios vigente y preguntas frecuentes de compradores.",
    published: true, createdAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "c-2", kind: "curso", title: "Crédito bancario para asesores",
    summary: "Cómo precalificar a un comprador, qué documentos pide el banco y cómo leer la tasa y el CAT.",
    body: "Contenido del curso por cargar.",
    duration: "45 min", published: true, createdAt: "2026-11-08T10:00:00Z",
  },
];

export function seedDB(): DB {
  return {
    version: 12,
    orgs: structuredClone(orgs),
    developments: structuredClone(developments),
    listings: structuredClone(listings),
    users: structuredClone(users),
    leads: structuredClone(leads),
    activity: [],
    requests: [],
    applications: structuredClone(applications),
    banks: structuredClone(banks),
    articles: structuredClone(articles),
    materials: structuredClone(materials),
    courses: structuredClone(courses),
    amenities: [...AMENITIES],
    rr: 0,
  };
}

export const SEED = seedDB();
