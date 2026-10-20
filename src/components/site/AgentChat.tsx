"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChatCircleDots, PaperPlaneRight, X, Sparkle, UserCircle } from "@phosphor-icons/react";
import type { Listing, Org } from "@/lib/types";
import { askAgent, type ChatMsg } from "@/lib/agent";
import { useDB } from "@/lib/db";
import { OrgLogo, cx } from "../ui";
import ContactDialog from "./ContactDialog";

/** Asistente de IA de UNA inmobiliaria, con su base de conocimiento e inventario. */
export default function AgentChat({ org, listing, context, inline }: { org: Org; listing?: Listing; context?: string; inline?: boolean }) {
  const db = useDB();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!!inline);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [msgs, busy, reduce]);

  if (!org.agent.enabled) return null;

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", text: question }];
    setMsgs(next);
    setText("");
    setBusy(true);
    const reply = await askAgent(db, org, next, context);
    setMsgs([...next, reply]);
    setBusy(false);
  }

  const panel = (
    <div className={cx("flex flex-col overflow-hidden bg-card", inline ? "h-[520px] rounded-[14px] border border-line" : "h-[min(620px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] rounded-[18px] border border-line shadow-[var(--shadow-pop)]")}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <OrgLogo org={org} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{org.agent.name}</p>
          <p className="flex items-center gap-1 text-xs text-ink-3"><Sparkle size={12} weight="fill" className="text-brick" /> Asistente con IA de {org.name}</p>
        </div>
        {!inline && (
          <button onClick={() => setOpen(false)} className="press grid size-9 place-items-center rounded-full text-ink-2 hover:bg-sunk" aria-label="Cerrar asistente">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <Bubble role="assistant">{org.agent.greeting}</Bubble>
        {msgs.length === 0 && org.agent.suggested.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {org.agent.suggested.map((s) => (
              <button key={s} onClick={() => send(s)} className="press rounded-full border border-line bg-paper px-3 py-1.5 text-left text-sm text-ink-2 hover:border-ink-3 hover:text-ink">{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className="space-y-2">
            <Bubble role={m.role}>{m.text}</Bubble>
            {m.role === "assistant" && m.offline && <p className="pl-1 text-[11px] text-ink-3">Respuesta de la base de conocimiento (el servicio de IA no respondió).</p>}
            {m.role === "assistant" && m.handoff && (
              <button onClick={() => setContact(true)} className="press inline-flex items-center gap-1.5 rounded-full bg-brick px-3.5 py-2 text-sm font-semibold text-white hover:bg-brick-d">
                <UserCircle size={17} /> Hablar con un asesor
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div className="inline-flex gap-1 rounded-[14px] bg-sunk px-3.5 py-3" aria-label="Escribiendo">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d * 120}ms` }} />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 border-t border-line p-3">
        <label htmlFor={`ask-${org.id}`} className="sr-only">Escribe tu pregunta</label>
        <input id={`ask-${org.id}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu pregunta" maxLength={600} autoComplete="off" className="h-11 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] focus:border-ink focus:outline-none" />
        <button type="submit" disabled={busy || !text.trim()} className="press grid size-11 place-items-center rounded-full bg-ink text-paper disabled:opacity-40" aria-label="Enviar">
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>
      <p className="px-4 pb-3 text-center text-[11px] text-ink-3">Respuestas orientativas. Confirma precios y disponibilidad con el asesor.</p>
      <ContactDialog open={contact} onClose={() => setContact(false)} org={org} listing={listing} source="agente" transcript={msgs} />
    </div>
  );

  if (inline) return panel;

  return (
    <div className={cx("fixed right-4 z-[1200] flex flex-col items-end gap-3 sm:right-6 lg:bottom-6", listing ? "bottom-20" : "bottom-4 sm:bottom-6")}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "bottom right" }}
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <button onClick={() => setOpen(true)} className="press flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3 pr-5 text-paper shadow-[var(--shadow-pop)] hover:bg-slate">
          <span className="grid size-8 place-items-center rounded-full bg-brick"><ChatCircleDots size={18} weight="fill" /></span>
          <span className="text-sm font-semibold">Pregúntale a {org.agent.name.split(" ")[0]}</span>
        </button>
      )}
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cx("max-w-[86%] whitespace-pre-line rounded-[14px] px-3.5 py-2.5 text-[15px] leading-relaxed", role === "user" ? "ml-auto bg-ink text-paper" : "bg-sunk text-ink")}>
      {children}
    </div>
  );
}
