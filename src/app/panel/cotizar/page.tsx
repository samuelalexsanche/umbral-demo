"use client";
import { useEffect, useState } from "react";
import { Printer } from "@phosphor-icons/react";
import { can, useDB, useSessionUser } from "@/lib/db";
import { orgOf } from "@/lib/queries";
import { asset, bathsLabel, deliveryLabel, money, monthlyPayment } from "@/lib/format";
import { Button, Field, Input, Select } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

/** Cotización personalizada: lleva los datos del asesor y se guarda como PDF desde el diálogo de impresión. */
export default function Cotizar() {
  const db = useDB();
  const me = useSessionUser();
  const [id, setId] = useState("");
  const [client, setClient] = useState("");
  const [down, setDown] = useState(10);
  const [years, setYears] = useState(20);
  const [bankId, setBankId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [unitId, setUnitId] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setId(q.get("id") ?? "");
    setUnitId(q.get("u") ?? "");
  }, []);
  if (!me) return null;

  const options = db.listings.filter((l) => l.status === "publicado" && l.price > 0 && orgOf(db, l.orgId)?.status === "activa");
  const l = options.find((x) => x.id === id);
  const banks = [...db.banks].sort((a, b) => a.rate - b.rate);
  const bank = banks.find((b) => b.id === bankId) ?? banks[0];
  const org = l ? orgOf(db, l.orgId) : undefined;
  const dev = l?.developmentId ? db.developments.find((d) => d.id === l.developmentId) : undefined;
  const unitOptions = (l?.units ?? []).filter((x) => x.status === "disponible" && x.price > 0);
  const unit = unitOptions.find((x) => x.id === unitId);
  const list = unit?.price ?? l?.price ?? 0;
  const price = Math.max(0, list - discount);
  const downAmt = (price * down) / 100;
  const pay = bank ? monthlyPayment(price - downAmt, bank.rate, years) : 0;
  const folio = `COT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${(unit?.id ?? l?.id ?? "").replace(/\W/g, "").slice(-5).toUpperCase()}`;
  const today = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Guard roles={["asesor", "superadmin"]} allow={can.usePortal}>
      <div className="print:hidden">
        <PageHead title="Cotización personalizada" sub="Elige el inmueble y los datos del cliente. Al imprimir, guarda como PDF; lleva tu nombre, teléfono, celular y correo." />
        <div className="mb-8 grid gap-4 rounded-[14px] border border-line bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Inmueble" htmlFor="q-l">
            <Select id="q-l" value={id} onChange={(e) => { setId(e.target.value); setUnitId(""); }}>
              <option value="">Elige un inmueble</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select>
          </Field>
          {unitOptions.length > 0 && (
            <Field label="Unidad" htmlFor="q-u" hint="Sin unidad, se cotiza el precio desde.">
              <Select id="q-u" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                <option value="">Precio desde</option>
                {unitOptions.map((x) => <option key={x.id} value={x.id}>{x.id} · piso {x.floor} · {x.m2} m² · {money(x.price)}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Nombre del cliente" htmlFor="q-c"><Input id="q-c" value={client} onChange={(e) => setClient(e.target.value)} /></Field>
          <Field label="Descuento (MXN, opcional)" htmlFor="q-d" hint="Solo si la desarrolladora lo autorizó."><Input id="q-d" inputMode="numeric" value={discount ? String(discount) : ""} onChange={(e) => setDiscount(Number(e.target.value.replace(/\D/g, "")) || 0)} /></Field>
          <Field label="Enganche" htmlFor="q-e"><Select id="q-e" value={down} onChange={(e) => setDown(Number(e.target.value))}>{[10, 15, 20, 25, 30, 40, 50].map((n) => <option key={n} value={n}>{n}%</option>)}</Select></Field>
          <Field label="Plazo del crédito" htmlFor="q-p"><Select id="q-p" value={years} onChange={(e) => setYears(Number(e.target.value))}>{[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} años</option>)}</Select></Field>
          {banks.length > 0 && <Field label="Banco para la corrida" htmlFor="q-b"><Select id="q-b" value={bank?.id} onChange={(e) => setBankId(e.target.value)}>{banks.map((b) => <option key={b.id} value={b.id}>{b.bank} · {b.rate}%</option>)}</Select></Field>}
        </div>
        <div className="mb-6 flex justify-end"><Button onClick={() => window.print()} disabled={!l}><Printer size={18} /> Imprimir o guardar PDF</Button></div>
      </div>

      {l && org ? (
        <article className="mx-auto grid max-w-[820px] gap-6 rounded-[14px] border border-line bg-white p-8 text-[#1d1d1b] print:max-w-none print:rounded-none print:border-0 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="font-display text-2xl font-semibold">Cotización</p>
              <p className="text-sm text-ink-3">{folio} · {today}</p>
              {client && <p className="mt-2 text-sm">Para: <strong>{client}</strong></p>}
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{me.name}</p>
              <p>{me.title}{me.company ? `, ${me.company}` : ""}</p>
              {me.phone && <p>Tel. {me.phone}</p>}
              {me.mobile && me.mobile !== me.phone && <p>Cel. {me.mobile}</p>}
              <p>{me.email}</p>
            </div>
          </header>
          <section className="grid gap-5 sm:grid-cols-[240px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(l.images[0])} alt="" className="aspect-[4/5] w-full rounded-[10px] object-cover" />
            <div className="grid content-start gap-2">
              <p className="font-display text-2xl font-semibold leading-tight">{l.title}</p>
              {unit && <p className="text-sm font-semibold">Unidad {unit.id}{unit.tower ? `, torre ${unit.tower}` : ""}{unit.floor ? `, piso ${unit.floor}` : ""} · modelo {unit.model} · vista {unit.view.toLowerCase()}{unit.delivery ? ` · entrega ${unit.delivery}` : ""}</p>}
              <p className="text-sm text-ink-2">{dev ? `${dev.name} · ` : ""}{dev?.address ?? `${l.colonia}, ${l.municipio}`}</p>
              <p className="text-sm text-ink-2">{org.name} · {deliveryLabel(l.delivery, l.deliveryDate)}</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
                <li>{l.bedrooms} {l.bedrooms === 1 ? "recámara" : "recámaras"}</li>
                <li>{bathsLabel(unit?.bathrooms ?? l.bathrooms)}</li>
                <li>{unit?.parking ?? l.parking} {(unit?.parking ?? l.parking) === 1 ? "cajón" : "cajones"}</li>
                {(unit?.m2 ?? l.m2Built) > 0 && <li>{unit?.m2 ?? l.m2Built} m² construidos</li>}
              </ul>
              {l.features.length > 0 && <p className="text-sm text-ink-2">{l.features.join(" · ")}</p>}
            </div>
          </section>
          <section className="grid gap-2 rounded-[10px] bg-[#f4f2ec] p-5 text-sm">
            <Row k={unit ? "Precio de lista" : "Precio desde"} v={money(list)} />
            {discount > 0 && <Row k="Descuento" v={`- ${money(discount)}`} />}
            <Row k="Precio cotizado" v={money(price)} strong />
            <Row k={`Enganche (${down}%)`} v={money(Math.round(downAmt))} />
            <Row k="Monto a financiar" v={money(Math.round(price - downAmt))} />
            {bank && <Row k={`Mensualidad estimada con ${bank.bank} (${bank.rate}% anual, ${years} años)`} v={money(Math.round(pay))} strong />}
          </section>
          {(l.paymentTerms || dev?.paymentTerms || org.paymentTerms) && (
            <section className="text-sm"><p className="font-semibold">Condiciones de pago</p><p className="text-ink-2">{l.paymentTerms || dev?.paymentTerms || org.paymentTerms}</p></section>
          )}
          <footer className="border-t border-line pt-4 text-xs text-ink-3">
            Cotización informativa con precios vigentes al {today}, sujetos a cambio y a disponibilidad sin previo aviso. La mensualidad es una estimación sin seguros, comisiones ni gastos de escrituración; la tasa final la determina el banco. El apartado se firma con {org.name}.
          </footer>
        </article>
      ) : (
        <p className="text-center text-ink-3 print:hidden">Elige un inmueble para ver la cotización.</p>
      )}
    </Guard>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={strong ? "font-semibold" : "text-ink-2"}>{k}</span>
      <span className={`tabular ${strong ? "font-semibold" : ""}`}>{v}</span>
    </div>
  );
}
