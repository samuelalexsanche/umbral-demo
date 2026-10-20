// Agente de IA por inmobiliaria para la demo de Umbral.
// Recibe la base de conocimiento y el inventario de UNA inmobiliaria y responde solo con eso.
const ALLOWED = ["https://samuelalexsanche.github.io", "http://localhost:3000", "http://localhost:4324"];
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const hits = new Map();

const cors = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
});

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });

const clip = (s, n) => String(s ?? "").slice(0, n);

function limited(ip) {
  const t = Date.now();
  const arr = (hits.get(ip) || []).filter((x) => t - x < 60000);
  arr.push(t);
  hits.set(ip, arr);
  return arr.length > 20;
}

function systemPrompt(p) {
  const o = p.org || {};
  const kb = (o.kb || []).slice(0, 40).map((e) => `- ${clip(e.q, 120)}: ${clip(e.a, 600)}`).join("\n");
  const inv = (p.listings || []).slice(0, 40).map((l) =>
    `- ${clip(l.title, 120)} | ${clip(l.price, 30)} | ${l.bedrooms} recámaras, ${l.bathrooms} baños, ${l.m2} m² | ${clip(l.place, 80)} | ${clip(l.delivery, 60)} | créditos: ${clip(l.credits, 160)}${l.available != null ? ` | disponibles: ${l.available}` : ""}`
  ).join("\n");
  const devs = (p.developments || []).slice(0, 12).map((d) =>
    `- ${clip(d.name, 80)} en ${clip(d.place, 80)}: ${clip(d.description, 300)} Amenidades: ${clip(d.amenities, 200)}. ${clip(d.delivery, 60)}. Avance de obra: ${d.progress}%`
  ).join("\n");
  return `Eres ${clip(o.agentName, 60)}, el asistente virtual de ${clip(o.name, 80)} (${clip(o.kind, 20)}) en la plataforma Umbral.
Hablas en español de México, con trato de "tú", claro y cálido, en respuestas cortas (máximo 90 palabras) y sin emojis.

Reglas:
1. Responde solo con la información de abajo. Si algo no está, di que no lo tienes confirmado y ofrece que un asesor lo responda.
2. Nunca inventes precios, disponibilidad, fechas, tasas, promociones ni requisitos.
3. Solo hablas de ${clip(o.name, 80)} y sus inmuebles. Si preguntan por otra empresa o por temas ajenos, redirige con amabilidad.
4. No des asesoría legal ni financiera definitiva; las cifras de crédito son orientativas.
5. Nunca pidas pagos ni datos bancarios por el chat. El apartado se hace con un asesor en la oficina de ventas.
6. Responde primero todo lo que sí sabes, con oraciones completas. Si la persona quiere visitar, apartar o cotizar, o pide algo que no sabes, cierra con una oración que la invite a hablar con un asesor y agrega al final, en una línea aparte, la etiqueta [ASESOR].

Sobre la empresa: ${clip(o.description, 600)}
Teléfono: ${clip(o.phone, 40)}. Horario: ${clip(o.hours, 160)}. Ubicación: ${clip(o.address, 160)}.
Créditos que acepta: ${clip(o.credits, 200)}.
${p.context ? `La persona está viendo: ${clip(p.context, 160)}.` : ""}

Base de conocimiento:
${kb || "- (sin entradas)"}
${o.notes ? `Notas: ${clip(o.notes, 600)}` : ""}

Desarrollos:
${devs || "- (sin desarrollos)"}

Inventario publicado:
${inv || "- (sin inmuebles publicados)"}`;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return json({ ok: true, service: "umbral-agente" }, 200, origin);
    if (req.method !== "POST" || url.pathname !== "/chat") return json({ error: "no encontrado" }, 404, origin);
    if (!ALLOWED.includes(origin)) return json({ error: "origen no permitido" }, 403, origin);
    if (limited(req.headers.get("CF-Connecting-IP") || "x")) return json({ error: "Demasiadas preguntas seguidas. Espera un minuto." }, 429, origin);

    const text = await req.text();
    if (text.length > 60000) return json({ error: "Solicitud demasiado grande" }, 413, origin);
    let p;
    try { p = JSON.parse(text); } catch { return json({ error: "JSON inválido" }, 400, origin); }

    const history = (p.messages || []).slice(-10).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: clip(m.content, 1200),
    }));
    if (!history.length || history[history.length - 1].role !== "user") return json({ error: "Falta la pregunta" }, 400, origin);

    try {
      const out = await env.AI.run(MODEL, {
        messages: [{ role: "system", content: systemPrompt(p) }, ...history],
        max_tokens: 400,
        temperature: 0.3,
      });
      let reply = String(out.response || "").trim();
      const handoff = reply.includes("[ASESOR]");
      reply = reply.replace(/\[ASESOR\]/g, "").trim();
      return json({ reply, handoff }, 200, origin);
    } catch (e) {
      return json({ error: "El modelo no respondió", detail: String(e).slice(0, 200) }, 502, origin);
    }
  },
};
