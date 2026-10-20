"use client";
import { useDB } from "@/lib/db";
import { relTime } from "@/lib/format";
import { Button, Empty } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Solicitudes() {
  const db = useDB();
  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Solicitudes de desarrolladoras" sub="Empresas que pidieron una demo desde la página Para desarrolladores." />
      {db.requests.length === 0 ? (
        <Empty title="Sin solicitudes todavía" action={<Button variant="outline" href="/publica-tus-desarrollos/#solicitud">Ver el formulario</Button>}>Llena el formulario de la página para desarrolladores y la solicitud aparecerá aquí.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-line text-ink-3"><tr>{["Empresa", "Contacto", "Unidades", "Recibida", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {db.requests.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.company}</td>
                  <td className="px-4 py-3 text-ink-2">{r.name} · {r.phone} · {r.email}</td>
                  <td className="px-4 py-3">{r.units || "-"}</td>
                  <td className="px-4 py-3 text-ink-3">{relTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><Button size="sm" href={`/panel/inmobiliarias/?nueva=${encodeURIComponent(r.company)}`}>Dar de alta</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Guard>
  );
}
