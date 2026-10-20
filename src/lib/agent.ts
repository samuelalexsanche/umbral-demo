"use client";
import type { DB, Org } from "./types";
import { creditName, deliveryLabel, money, SITE, TYPE_LABEL } from "./format";

export const AGENT_URL = "https://umbral-agente.mattera.workers.dev/chat";

export interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  handoff?: boolean;
  offline?: boolean;
}

export function buildPayload(db: DB, org: Org, messages: ChatMsg[], context?: string) {
  const listings = db.listings.filter((l) => l.orgId === org.id && l.status === "publicado");
  const devs = db.developments.filter((d) => d.orgId === org.id);
  return {
    org: {
      name: org.name,
      kind: org.kind,
      agentName: org.agent.name,
      description: org.description,
      phone: org.phone,
      hours: org.hours,
      address: org.address,
      credits: org.credits.map(creditName).join(", "),
      kb: org.agent.kb.map(({ q, a }) => ({ q, a })),
      notes: org.agent.notes,
    },
    developments: devs.map((d) => ({
      name: d.name,
      place: `${d.colonia}, ${d.municipio}`,
      description: d.description,
      amenities: d.amenities.join(", "),
      delivery: deliveryLabel(d.delivery, d.deliveryDate),
      progress: d.progress,
    })),
    listings: listings.map((l) => ({
      title: `${TYPE_LABEL[l.type]}: ${l.title}`,
      price: money(l.price),
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      m2: l.m2Built,
      place: `${l.colonia}, ${l.municipio}`,
      delivery: deliveryLabel(l.delivery, l.deliveryDate),
      credits: l.credits.map(creditName).join(", "),
      available: l.unitsAvailable ?? null,
      url: `${SITE}/inmueble/${l.slug}/`,
    })),
    context,
    messages: messages.map((m) => ({ role: m.role, content: m.text })),
  };
}

export async function askAgent(db: DB, org: Org, messages: ChatMsg[], context?: string): Promise<ChatMsg> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(db, org, messages, context)),
      signal: ctrl.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.reply) throw new Error(data.error || "sin respuesta");
    return { role: "assistant", text: data.reply, handoff: !!data.handoff };
  } catch {
    return localAnswer(db, org, messages[messages.length - 1]?.text ?? "");
  } finally {
    clearTimeout(t);
  }
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Respaldo sin conexión: busca en la base de conocimiento por coincidencia de palabras. */
export function localAnswer(db: DB, org: Org, q: string): ChatMsg {
  const words = norm(q).split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  let best = { score: 0, a: "" };
  for (const e of org.agent.kb) {
    const hay = norm(`${e.q} ${e.a}`);
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > best.score) best = { score, a: e.a };
  }
  const wantsHuman = /visita|apart|cotiz|asesor|cita|llamar|whats/.test(norm(q));
  if (best.score > 0) return { role: "assistant", text: best.a, handoff: wantsHuman, offline: true };
  const n = db.listings.filter((l) => l.orgId === org.id && l.status === "publicado").length;
  return {
    role: "assistant",
    text: `No tengo esa respuesta confirmada. ${org.name} tiene ${n} inmuebles publicados; un asesor puede resolverte esto directamente.`,
    handoff: true,
    offline: true,
  };
}
