export type Role = "superadmin" | "org_admin" | "asesor" | "colaborador";

export type CreditId = "contado" | "bancario" | "infonavit" | "fovissste" | "cofinavit" | "unamos";

export type PropertyType = "casa" | "departamento" | "townhouse" | "terreno";

export type ListingStatus = "borrador" | "revision" | "publicado" | "pausado" | "vendido";

export type Delivery = "entrega-inmediata" | "preventa";

export type LeadStatus = "nuevo" | "contactado" | "cita" | "apartado" | "cerrado" | "descartado";

export type LeadSource = "ficha" | "agente" | "perfil" | "desarrollo";

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

export interface Org {
  id: string;
  slug: string;
  name: string;
  kind: "desarrolladora" | "inmobiliaria";
  verified: boolean;
  status: "activa" | "suspendida";
  initials: string;
  color: string;
  tagline: string;
  description: string;
  since: number;
  municipios: string[];
  phone: string;
  email: string;
  address: string;
  hours: string;
  credits: CreditId[];
  responseMinutes: number;
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
  lat: number;
  lng: number;
  description: string;
  amenities: string[];
  delivery: Delivery;
  deliveryDate?: string;
  progress: number;
  totalUnits: number;
  images: string[];
  createdAt: string;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  orgId: string;
  developmentId?: string;
  asesorId: string;
  createdBy: string;
  status: ListingStatus;
  reviewNote?: string;
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
  orgId?: string;
  managerId?: string;
  phone: string;
  title: string;
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
  orgId: string;
  asesorId: string;
  listingId?: string;
  developmentId?: string;
  name: string;
  phone: string;
  email: string;
  credit?: CreditId;
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

export interface PlatformRequest {
  id: string;
  company: string;
  name: string;
  phone: string;
  email: string;
  units: string;
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
  amenities: string[];
}
