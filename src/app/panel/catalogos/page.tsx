"use client";
import { useState } from "react";
import { toast } from "sonner";
import { addAmenity, useDB, useSessionUser } from "@/lib/db";
import { CREDITS } from "@/lib/seed";
import { Button, Input } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Catalogos() {
  const db = useDB();
  const me = useSessionUser();
  const [n, setN] = useState("");
  if (!me) return null;
  return (
    <Guard roles={["superadmin"]}>
      <PageHead title="Catálogos" sub="Listas que comparten todas las inmobiliarias para que los filtros del buscador funcionen igual para todos." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid content-start gap-4 rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Amenidades</h2>
          <ul className="flex flex-wrap gap-2">{db.amenities.map((a) => <li key={a} className="rounded-full bg-sunk px-3 py-1.5 text-sm">{a}</li>)}</ul>
          <form onSubmit={(e) => { e.preventDefault(); if (n.trim().length > 2) { addAmenity(me, n.trim()); setN(""); toast.success("Amenidad agregada"); } }} className="flex gap-2">
            <Input aria-label="Nueva amenidad" placeholder="Nueva amenidad" value={n} onChange={(e) => setN(e.target.value)} />
            <Button type="submit" variant="dark">Agregar</Button>
          </form>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Formas de pago</h2>
          <p className="text-sm text-ink-2">Son fijas porque alimentan el filtro principal del sitio y la guía de créditos.</p>
          {CREDITS.map((c) => <div key={c.id} className="border-t border-line pt-3"><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-2">{c.short}</p></div>)}
        </section>
      </div>
    </Guard>
  );
}
