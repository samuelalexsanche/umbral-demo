"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { can, setListingStatus, useDB, useSessionUser, visibleListings } from "@/lib/db";
import { listingHref, userOf } from "@/lib/queries";
import { asset, creditName, money, relTime } from "@/lib/format";
import { Button, Dialog, Empty, Field, Textarea } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Revision() {
  const db = useDB();
  const me = useSessionUser();
  const [reject, setReject] = useState<string | null>(null);
  const [note, setNote] = useState("");
  if (!me) return null;
  const list = visibleListings(db, me).filter((l) => l.status === "revision" && can.review(me, l));
  return (
    <Guard roles={["superadmin", "org_admin", "asesor"]}>
      <PageHead title="Revisión" sub="Publicaciones que los colaboradores enviaron. Revisa datos, fotos y precio antes de publicarlas." />
      {list.length === 0 ? (
        <Empty title="Nada pendiente de revisar">Cuando un colaborador envíe un inmueble, aparece aquí.</Empty>
      ) : (
        <div className="grid gap-4">
          {list.map((l) => (
            <article key={l.id} className="grid gap-4 rounded-[14px] border border-line bg-card p-5 md:grid-cols-[200px_1fr_auto]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(l.images[0])} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />
              <div className="grid content-start gap-1.5">
                <Link href={listingHref(l)} className="font-display text-xl font-semibold hover:underline">{l.title}</Link>
                <p className="text-sm text-ink-2">{money(l.price)} · {l.bedrooms} rec · {l.m2Built} m² · {l.colonia}, {l.municipio}</p>
                <p className="text-sm text-ink-2">Créditos: {l.credits.map(creditName).join(", ")}</p>
                <p className="text-sm text-ink-3">Enviado por {userOf(db, l.createdBy)?.name} {relTime(l.updatedAt)} · {l.images.length} fotos</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-2">{l.description}</p>
              </div>
              <div className="flex flex-wrap content-start gap-2 md:flex-col">
                <Button onClick={() => { setListingStatus(me, l.id, "publicado"); toast.success("Publicado"); }}>Aprobar y publicar</Button>
                <Button variant="outline" href={`/panel/inmuebles/editar/?id=${l.id}`}>Editar</Button>
                <Button variant="ghost" onClick={() => { setReject(l.id); setNote(""); }}>Pedir cambios</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog open={!!reject} onClose={() => setReject(null)} title="Pedir cambios">
        <Field label="¿Qué debe corregir?" htmlFor="rv-n" hint="El colaborador verá esta nota en su borrador.">
          <Textarea id="rv-n" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReject(null)}>Cancelar</Button>
          <Button disabled={note.trim().length < 5} onClick={() => { setListingStatus(me, reject!, "borrador", note.trim()); setReject(null); toast("Se regresó a borrador con tu nota"); }}>Regresar con nota</Button>
        </div>
      </Dialog>
    </Guard>
  );
}
