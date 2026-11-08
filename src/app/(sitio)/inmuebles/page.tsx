import type { Metadata } from "next";
import SearchExplorer from "@/components/site/SearchExplorer";
import JsonLd from "@/components/JsonLd";
import { SEED } from "@/lib/seed";
import { SITE } from "@/lib/format";

export const metadata: Metadata = {
  title: "Casas y departamentos nuevos en Guadalajara, Zapopan y Tlajomulco",
  description: "Busca departamentos nuevos por precio, recámaras, municipio, entrega y desarrolladora. Información actualizada por cada desarrolladora.",
  alternates: { canonical: "inmuebles/" },
};

export default function Page() {
  const list = SEED.listings.filter((l) => l.status === "publicado");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Inmuebles nuevos en la zona metropolitana de Guadalajara",
          numberOfItems: list.length,
          itemListElement: list.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/inmueble/${l.slug}/`, name: l.title })),
        }}
      />
      <SearchExplorer />
    </>
  );
}
