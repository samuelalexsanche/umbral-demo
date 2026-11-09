export type Role = "superadmin" | "desarrolladora" | "asesor";

/** Interno: equipo de la plataforma, recibe prospectos. Externo: aprobado por el administrador, solo consulta y cotiza. */
export type AsesorTipo = "interno" | "externo";

export type CreditId = "contado" | "bancario";

export type PropertyType = "casa" | "departamento" | "townhouse" | "terreno";

export type ListingStatus = "borrador" | "publicado" | "pausado" | "vendido";

export type Delivery = "entrega-inmediata" | "preventa";

export type LeadStatus = "nuevo" | "contactado" | "cita" | "apartado" | "cerrado" | "descartado";

export type LeadSource = "ficha" | "agente" | "perfil" | "desarrollo" | "credito";

export interface Credit {
  id: CreditId;
  name: string;
  short: string;
  who: string;
  how: string;
}

export interface KbEntry {
  id: string;
  q: string;
  a: string;
}

export interface AgentConfig {
  enabled: boolean;
  name: string;
  greeting: string;
  suggested: string[];
  kb: KbEntry[];
  notes: string;
}

export interface TrustCriterion {
  id: string;
  label: string;
  ok: boolean;
}

/** Desarrolladora. Se conserva el nombre `Org` en el código para no tocar cada pantalla. */
export interface Org {
  id: string;
  slug: string;
  name: string;
  verified: boolean;
  status: "activa" | "suspendida";
  initials: string;
  color: string;
  /** Símbolo cuadrado (avatar). */
  logo?: string;
  /** Logotipo horizontal completo. */
  logoWide?: string;
  cover?: string;
  tagline: string;
  description: string;
  history: string;
  since: number;
  projectsDone?: number;
  unitsDelivered?: number;
  municipios: string[];
  phone: string;
  email: string;
  website?: string;
  address: string;
  hours: string;
  credits: CreditId[];
  paymentTerms: string;
  responseMinutes: number;
  /** Sello verde: lo otorga el administrador cuando se cumplen los criterios. */
  seal: boolean;
  trust: TrustCriterion[];
  agent: AgentConfig;
  createdAt: string;
}

export interface Development {
  id: string;
  slug: string;
  name: string;
  orgId: string;
  kind: "fraccionamiento" | "torre" | "privada";
  colonia: string;
  municipio: string;
  address?: string;
  lat: number;
  lng: number;
  description: string;
  typologies?: string;
  priceFrom?: number;
  amenities: string[];
  delivery: Delivery;
  deliveryDate?: string;
  progress: number;
  totalUnits: number;
  paymentTerms?: string;
  images: string[];
  launch?: boolean;
  createdAt: string;
}

/** Unidad concreta del inventario de una desarrolladora (departamento A-406, etc.). */
export interface Unit {
  id: string;
  tower?: string;
  floor: number;
  model: string;
  view: string;
  delivery?: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  m2: number;
  /** 0 cuando la desarrolladora no publica el precio (apartadas). */
  price: number;
  status: "disponible" | "apartado" | "vendido";
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  orgId: string;
  developmentId?: string;
  createdBy: string;
  status: ListingStatus;
  type: PropertyType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  m2Built: number;
  m2Land?: number;
  levels: number;
  delivery: Delivery;
  deliveryDate?: string;
  unitsAvailable?: number;
  unitsTotal?: number;
  credits: CreditId[];
  paymentTerms?: string;
  /** Unidades reales de esta tipología. Si existen, precio y disponibilidad salen de aquí. */
  units?: Unit[];
  amenities: string[];
  features: string[];
  description: string;
  colonia: string;
  municipio: string;
  lat: number;
  lng: number;
  images: string[];
  featured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  /** Desarrolladora a la que pertenece (usuarios de la desarrolladora y sus asesores). Un asesor sin orgId es independiente. */
  orgId?: string;
  asesorTipo?: AsesorTipo;
  company?: string;
  phone: string;
  mobile?: string;
  title: string;
  photo?: string;
  bio?: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  mustChangePassword: boolean;
}

export interface LeadNote {
  at: string;
  by: string;
  text: string;
}

export interface Lead {
  id: string;
  orgId?: string;
  /** Asesor interno al que la plataforma asignó el prospecto. */
  asesorId?: string;
  listingId?: string;
  developmentId?: string;
  name: string;
  phone: string;
  email: string;
  credit?: CreditId;
  bankId?: string;
  message: string;
  source: LeadSource;
  status: LeadStatus;
  notes: LeadNote[];
  transcript?: { role: "user" | "assistant"; text: string }[];
  createdAt: string;
}

export interface Activity {
  id: string;
  at: string;
  userId: string;
  orgId?: string;
  text: string;
}

/** Desarrolladora que pide colocar su inventario. Sujeto a condiciones. */
export interface PlatformRequest {
  id: string;
  company: string;
  name: string;
  phone: string;
  email: string;
  units: string;
  createdAt: string;
}

export type ApplicationStatus = "pendiente" | "aprobada" | "rechazada";

/**
 * Solicitud de acceso de un asesor.
 * - Sin orgId: asesor independiente que la envía desde la página /asesores.
 * - Con orgId: la desarrolladora pide dar de alta a un asesor de su equipo.
 * La revisa siempre el administrador general, que asigna el acceso al aprobar.
 */
export interface AdvisorApplication {
  id: string;
  orgId?: string;
  /** Usuario de la desarrolladora que pidió el alta. */
  requestedBy?: string;
  title?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  experience: string;
  zone: string;
  message: string;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  userId?: string;
  createdAt: string;
}

export interface BankRate {
  id: string;
  bank: string;
  product: string;
  rate: number;
  cat?: number;
  minDown: number;
  maxYears: number;
  notes: string;
  updatedAt: string;
}

export type ArticleCategory = "mercado" | "financieras" | "proyectos" | "global" | "entrevista" | "avance" | "lanzamiento";

/** Noticias de la plataforma y publicaciones de cada desarrolladora (noticias, avances de obra, lanzamientos). */
export interface Article {
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  summary: string;
  body: string;
  image?: string;
  source?: string;
  sourceUrl?: string;
  author?: string;
  orgId?: string;
  developmentId?: string;
  published: boolean;
  date: string;
  createdBy: string;
}

export type MaterialKind = "brochure" | "render" | "video" | "publicidad";

export interface Material {
  id: string;
  orgId: string;
  developmentId?: string;
  kind: MaterialKind;
  title: string;
  url: string;
  thumb?: string;
  createdAt: string;
}

export type CourseKind = "curso" | "capacitacion" | "evento";

export interface Course {
  id: string;
  kind: CourseKind;
  title: string;
  summary: string;
  body: string;
  orgId?: string;
  developmentId?: string;
  date?: string;
  place?: string;
  duration?: string;
  url?: string;
  published: boolean;
  createdAt: string;
}

export interface DB {
  version: number;
  orgs: Org[];
  developments: Development[];
  listings: Listing[];
  users: User[];
  leads: Lead[];
  activity: Activity[];
  requests: PlatformRequest[];
  applications: AdvisorApplication[];
  banks: BankRate[];
  articles: Article[];
  materials: Material[];
  courses: Course[];
  amenities: string[];
  /** Turno del reparto de prospectos entre asesores internos. */
  rr: number;
}
