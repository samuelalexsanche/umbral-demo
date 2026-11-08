"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import type { BankRate } from "@/lib/types";
import { deleteBank, saveBank, useDB, useSessionUser } from "@/lib/db";
import { relTime } from "@/lib/format";
import { Button, Dialog, Field, Input } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

type F = { id?: string; bank: string; product: string; rate: string; cat: string; minDown: string; maxYears: string; notes: string };
const blank: F = { bank: "", product: "Crédito hipotecario", rate: "", cat: "", minDown: "10", maxYears: "20", notes: "" };

export default function Tasas() {
  const db = useDB();
  const me = useSessionUser();
  const [f, setF] = useState<F | null>(null);
  if (!me) return null;
  const edit = (b: BankRate) => setF({ id: b.id, bank: b.bank, product: b.product, rate: String(b.rate), cat: b.cat?.toString() ?? "", minDown: String(b.minDown), maxYears: String(b.maxYears), notes: b.notes });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const rate = Number(f!.rate);
    if (!f!.bank.trim() || !(rate > 0 && rate < 40)) return toast.error("Escribe el banco y una tasa válida.");
    saveBank(me!, { id: f!.id, bank: f!.bank.trim(), product: f!.product.trim(), rate, cat: f!.cat ? Number(f!.cat) : undefined, minDown: Number(f!.minDown) || 10, maxYears: Number(f!.maxYears) || 20, notes: f!.notes.trim() });
    toast.success("Tasa guardada; ya se ve en el sitio y en el simulador");
    setF(null);
  }
  const set = (k: keyof F) => (e: { target: { value: string } }) => setF({ ...f!, [k]: e.target.value });
  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Tasas bancarias" sub="Se publican en Créditos, alimentan el simulador y las cotizaciones de los asesores. Actualízalas cuando los bancos cambien sus tasas." actions={<Button onClick={() => setF(blank)}>Agregar banco</Button>} />
      <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-ink-3"><tr>{["Banco", "Producto", "Tasa", "CAT", "Enganche mín.", "Plazo máx.", "Actualizada", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {db.banks.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold">{b.bank}{b.notes && <p className="font-normal text-xs text-warn">{b.notes}</p>}</td>
                <td className="px-4 py-3 text-ink-2">{b.product}</td>
                <td className="px-4 py-3 font-semibold tabular">{b.rate}%</td>
                <td className="px-4 py-3 tabular">{b.cat ? `${b.cat}%` : "-"}</td>
                <td className="px-4 py-3 tabular">{b.minDown}%</td>
                <td className="px-4 py-3 tabular">{b.maxYears} años</td>
                <td className="px-4 py-3 text-ink-3">{relTime(b.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => edit(b)} aria-label={`Editar ${b.bank}`}><PencilSimple size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { deleteBank(me, b.id); toast("Banco quitado"); }} aria-label={`Quitar ${b.bank}`}><Trash size={16} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!f} onClose={() => setF(null)} title={f?.id ? `Editar ${f.bank}` : "Agregar banco"}>
        {f && (
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Banco" htmlFor="b-b"><Input id="b-b" value={f.bank} onChange={set("bank")} /></Field>
              <Field label="Producto" htmlFor="b-p"><Input id="b-p" value={f.product} onChange={set("product")} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Tasa anual %" htmlFor="b-r"><Input id="b-r" inputMode="decimal" value={f.rate} onChange={set("rate")} /></Field>
              <Field label="CAT %" htmlFor="b-c"><Input id="b-c" inputMode="decimal" value={f.cat} onChange={set("cat")} /></Field>
              <Field label="Enganche mín. %" htmlFor="b-e"><Input id="b-e" inputMode="numeric" value={f.minDown} onChange={set("minDown")} /></Field>
              <Field label="Plazo máx. (años)" htmlFor="b-y"><Input id="b-y" inputMode="numeric" value={f.maxYears} onChange={set("maxYears")} /></Field>
            </div>
            <Field label="Nota interna (opcional)" htmlFor="b-n" hint="No se publica. Úsala para recordar de dónde salió la tasa."><Input id="b-n" value={f.notes} onChange={set("notes")} /></Field>
            <Button type="submit" size="lg">Guardar</Button>
          </form>
        )}
      </Dialog>
    </Guard>
  );
}
