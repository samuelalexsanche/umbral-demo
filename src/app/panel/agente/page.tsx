"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash, Sparkle } from "@phosphor-icons/react";
import type { AgentConfig } from "@/lib/types";
import { saveOrg, uid, useDB, useSessionUser } from "@/lib/db";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";
import AgentChat from "@/components/site/AgentChat";

export default function Agente() {
  const db = useDB();
  const me = useSessionUser();
  const [orgId, setOrgId] = useState("");
  const [a, setA] = useState<AgentConfig | null>(null);
  const [testKey, setTestKey] = useState(0);
  useEffect(() => {
    if (me && !orgId) setOrgId(me.orgId ?? db.orgs[0].id);
  }, [me, orgId, db.orgs]);
  const org = db.orgs.find((o) => o.id === orgId);
  useEffect(() => {
    if (org) setA(structuredClone(org.agent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);
  if (!me || !org || !a) return null;

  const fromAgent = db.leads.filter((l) => l.orgId === org.id && l.source === "agente").length;
  const dirty = JSON.stringify(a) !== JSON.stringify(org.agent);
  function save() {
    saveOrg(me!, { id: org!.id, name: org!.name, agent: { ...a!, kb: a!.kb.filter((k) => k.q.trim() && k.a.trim()), suggested: a!.suggested.filter((s) => s.trim()) } });
    setTestKey((k) => k + 1);
    toast.success("Agente actualizado. Ya responde con la nueva información.");
  }

  return (
    <Guard roles={["superadmin", "org_admin"]}>
      <PageHead
        title="Agente de IA"
        sub={`El asistente que responde en el perfil, los desarrollos y las fichas de ${org.name}. Solo usa lo que cargues aquí y el inventario publicado.`}
        actions={me.role === "superadmin" ? (
          <Select aria-label="Inmobiliaria" value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-auto">
            {db.orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        ) : undefined}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-6">
          <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5">
            <label className="flex items-center justify-between gap-4">
              <span><span className="block font-semibold">Asistente activo</span><span className="text-sm text-ink-2">Si lo apagas, desaparece de las páginas públicas.</span></span>
              <input type="checkbox" className="size-5" checked={a.enabled} onChange={(e) => setA({ ...a, enabled: e.target.checked })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del asistente" htmlFor="ag-n"><Input id="ag-n" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} /></Field>
              <div className="grid content-end gap-1 text-sm text-ink-2"><span><strong className="text-ink tabular">{fromAgent}</strong> prospectos llegaron por el asistente</span></div>
            </div>
            <Field label="Saludo" htmlFor="ag-g"><Textarea id="ag-g" rows={2} value={a.greeting} onChange={(e) => setA({ ...a, greeting: e.target.value })} /></Field>
            <Field label="Preguntas sugeridas" htmlFor="ag-s" hint="Una por línea. Aparecen como botones al abrir el chat."><Textarea id="ag-s" rows={3} value={a.suggested.join("\n")} onChange={(e) => setA({ ...a, suggested: e.target.value.split("\n") })} /></Field>
          </section>

          <section className="grid gap-4 rounded-[14px] border border-line bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Base de conocimiento</h2>
                <p className="text-sm text-ink-2">Políticas, apartado, enganche, horarios, trámites. El agente no inventa: si algo no está aquí ni en el inventario, ofrece pasar con un asesor.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setA({ ...a, kb: [...a.kb, { id: uid("kb"), q: "", a: "" }] })}><Plus size={16} /> Agregar</Button>
            </div>
            {a.kb.map((k, i) => (
              <div key={k.id} className="grid gap-2 rounded-[12px] bg-sunk p-3 sm:grid-cols-[200px_1fr_auto]">
                <Input aria-label={`Tema ${i + 1}`} placeholder="Tema (ej. Apartado)" value={k.q} onChange={(e) => setA({ ...a, kb: a.kb.map((x) => (x.id === k.id ? { ...x, q: e.target.value } : x)) })} />
                <Textarea aria-label={`Respuesta ${i + 1}`} rows={2} placeholder="Lo que el agente debe saber" value={k.a} onChange={(e) => setA({ ...a, kb: a.kb.map((x) => (x.id === k.id ? { ...x, a: e.target.value } : x)) })} />
                <button onClick={() => setA({ ...a, kb: a.kb.filter((x) => x.id !== k.id) })} className="press grid size-10 place-items-center self-start rounded-[8px] text-ink-2 hover:bg-card" aria-label="Eliminar entrada"><Trash size={17} /></button>
              </div>
            ))}
            <Field label="Notas adicionales" htmlFor="ag-no" hint="Contexto general: qué no venden, cómo prefieren que se hable de promociones, etc."><Textarea id="ag-no" rows={3} value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} /></Field>
          </section>
          <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <Button variant="ghost" disabled={!dirty} onClick={() => setA(structuredClone(org.agent))}>Descartar</Button>
            <Button disabled={!dirty} onClick={save}>Guardar cambios</Button>
          </div>
        </div>
        <div className="grid content-start gap-3 xl:sticky xl:top-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkle size={16} weight="fill" className="text-brick" /> Prueba el agente con la información guardada</p>
          {org.agent.enabled ? <AgentChat key={`${org.id}-${testKey}`} org={org} inline /> : <p className="rounded-[14px] border border-line bg-card p-6 text-sm text-ink-2">El asistente está apagado.</p>}
        </div>
      </div>
    </Guard>
  );
}
