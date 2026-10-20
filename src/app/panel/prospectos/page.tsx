"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkle, WhatsappLogo, Phone, EnvelopeSimple } from "@phosphor-icons/react";
import type { Lead, LeadStatus } from "@/lib/types";
import { can, updateLead, useDB, useSessionUser, visibleLeads } from "@/lib/db";
import { listingHref, userOf, devOf, orgOf } from "@/lib/queries";
import { creditName, relTime, shortDate } from "@/lib/format";
import { Avatar, Badge, Button, Dialog, Empty, Field, Select, Textarea, cx } from "@/components/ui";
import { Guard, LEAD_STATUS, PageHead } from "@/components/panel/Shell";

const SOURCE: Record<Lead["source"], string> = { ficha: "Ficha del inmueble", agente: "Asistente de IA", perfil: "Perfil de la inmobiliaria", desarrollo: "Página del desarrollo" };

export default function Prospectos() {
  const db = useDB();
  const me = useSessionUser();
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [who, setWho] = useState("");
  if (!me) return null;
  const all = visibleLeads(db, me).filter((l) => !who || l.asesorId === who);
  const lead = all.find((l) => l.id === open) ?? db.leads.find((l) => l.id === open);
  const asesores = db.users.filter((u) => u.role === "asesor" && (me.role === "superadmin" || u.orgId === me.orgId));

  return (
    <Guard roles={["superadmin", "org_admin", "asesor"]}>
      <PageHead
        title="Prospectos"
        sub="Cada contacto llega al asesor responsable del inmueble. Muévelos de etapa conforme avanzan."
        actions={can.reassignLead(me) ? (
          <Select aria-label="Filtrar por asesor" value={who} onChange={(e) => setWho(e.target.value)} className="w-auto">
            <option value="">Todos los asesores</option>
            {asesores.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        ) : undefined}
      />
      {all.length === 0 ? (
        <Empty title="Sin prospectos todavía">Llegan desde las fichas, los perfiles y el asistente de IA.</Empty>
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          {LEAD_STATUS.map((s) => {
            const col = all.filter((l) => l.status === s.id);
            return (
              <section key={s.id} className="w-[290px] shrink-0 rounded-[14px] bg-sunk/70 p-3" aria-label={s.label}>
                <header className="mb-3 flex items-center justify-between px-1">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="text-sm font-semibold text-ink-3 tabular">{col.length}</span>
                </header>
                <div className="grid gap-2.5">
                  {col.map((l) => {
                    const li = db.listings.find((x) => x.id === l.listingId);
                    return (
                      <button key={l.id} onClick={() => { setOpen(l.id); setNote(""); }} className="press grid gap-1.5 rounded-[12px] border border-line bg-card p-3.5 text-left hover:border-ink-3">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{l.name}</span>
                          <span className="text-xs text-ink-3">{relTime(l.createdAt)}</span>
                        </span>
                        <span className="line-clamp-1 text-sm text-ink-2">{li?.title ?? devOf(db, l.developmentId)?.name ?? orgOf(db, l.orgId)?.name}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {l.credit && <Badge>{creditName(l.credit)}</Badge>}
                          {l.source === "agente" && <Badge tone="brick"><Sparkle size={11} weight="fill" /> IA</Badge>}
                        </span>
                        {me.role !== "asesor" && <span className="text-xs text-ink-3">{userOf(db, l.asesorId)?.name ?? "Sin asesor"}</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!lead} onClose={() => setOpen(null)} title={lead?.name ?? ""} wide>
        {lead && (
          <div className="grid gap-6 md:grid-cols-[1fr_260px]">
            <div className="grid content-start gap-5">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" href={`https://wa.me/52${lead.phone.replace(/\D/g, "")}`} external><WhatsappLogo size={16} /> WhatsApp</Button>
                <Button size="sm" variant="outline" href={`tel:${lead.phone.replace(/\D/g, "")}`} external><Phone size={16} /> {lead.phone}</Button>
                {lead.email && <Button size="sm" variant="outline" href={`mailto:${lead.email}`} external><EnvelopeSimple size={16} /> Correo</Button>}
              </div>
              <div className="rounded-[12px] bg-sunk p-4">
                <p className="text-sm text-ink-3">{SOURCE[lead.source]} · {shortDate(lead.createdAt)}</p>
                <p className="mt-1">{lead.message}</p>
                {lead.listingId && (() => { const li = db.listings.find((x) => x.id === lead.listingId); return li ? <Link href={listingHref(li)} className="mt-2 inline-block text-sm font-semibold text-brick hover:underline">{li.title}</Link> : null; })()}
              </div>
              {lead.transcript && lead.transcript.length > 0 && (
                <div className="grid gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkle size={15} weight="fill" className="text-brick" /> Conversación con el asistente</p>
                  <div className="grid max-h-64 gap-2 overflow-y-auto rounded-[12px] border border-line p-3">
                    {lead.transcript.map((m, i) => (
                      <p key={i} className={cx("max-w-[85%] rounded-[10px] px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-ink text-paper" : "bg-sunk")}>{m.text}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3">
                <p className="text-sm font-semibold">Notas</p>
                {lead.notes.length === 0 && <p className="text-sm text-ink-3">Sin notas todavía.</p>}
                {lead.notes.map((n, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <Avatar name={userOf(db, n.by)?.name ?? "?"} size={28} />
                    <div><p><strong>{userOf(db, n.by)?.name}</strong> <span className="text-ink-3">{relTime(n.at)}</span></p><p className="text-ink-2">{n.text}</p></div>
                  </div>
                ))}
                <Textarea aria-label="Nueva nota" rows={2} placeholder="Ej. Le envié la corrida por WhatsApp" value={note} onChange={(e) => setNote(e.target.value)} />
                <div><Button size="sm" disabled={note.trim().length < 2} onClick={() => { updateLead(me, lead.id, {}, note.trim()); setNote(""); toast.success("Nota agregada"); }}>Agregar nota</Button></div>
              </div>
            </div>
            <div className="grid content-start gap-4">
              <Field label="Etapa" htmlFor="ld-st">
                <Select id="ld-st" value={lead.status} onChange={(e) => { updateLead(me, lead.id, { status: e.target.value as LeadStatus }); toast(`Movido a ${LEAD_STATUS.find((s) => s.id === e.target.value)?.label}`); }}>
                  {LEAD_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </Field>
              {can.reassignLead(me) && (
                <Field label="Asesor" htmlFor="ld-as">
                  <Select id="ld-as" value={lead.asesorId} onChange={(e) => { updateLead(me, lead.id, { asesorId: e.target.value }); toast("Prospecto reasignado"); }}>
                    {db.users.filter((u) => u.role === "asesor" && u.orgId === lead.orgId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </Field>
              )}
              <dl className="grid gap-2 text-sm">
                <div><dt className="text-ink-3">Crédito</dt><dd className="font-semibold">{lead.credit ? creditName(lead.credit) : "No lo indicó"}</dd></div>
                <div><dt className="text-ink-3">Correo</dt><dd>{lead.email || "No lo dejó"}</dd></div>
                <div><dt className="text-ink-3">Inmobiliaria</dt><dd>{orgOf(db, lead.orgId)?.name}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </Dialog>
    </Guard>
  );
}
