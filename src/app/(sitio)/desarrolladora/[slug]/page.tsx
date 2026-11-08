import type { Metadata } from "next";
import { OrgProfile } from "@/components/site/Profiles";
import JsonLd from "@/components/JsonLd";
import { SEED } from "@/lib/seed";
import { SITE } from "@/lib/format";

export function generateStaticParams() {
  return SEED.orgs.map((o) => ({ slug: o.slug }));
}
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const o = SEED.orgs.find((x) => x.slug === slug)!;
  const n = SEED.developments.filter((d) => d.orgId === o.id).length;
  return {
    title: `${o.name}: ${n} desarrollos en ${o.municipios.join(" y ")}`,
    description: `${o.tagline} Historia, inventario actual, avances de obra, lanzamientos y calificación de confianza de ${o.name}.`,
    alternates: { canonical: `desarrolladora/${o.slug}/` },
  };
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const o = SEED.orgs.find((x) => x.slug === slug)!;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: o.name,
          url: `${SITE}/desarrolladora/${o.slug}/`,
          description: o.description,
          foundingDate: String(o.since),
          areaServed: o.municipios.map((m) => ({ "@type": "City", name: m })),
          address: { "@type": "PostalAddress", addressLocality: o.municipios[0], addressRegion: "Jalisco", addressCountry: "MX" },
        }}
      />
      <OrgProfile id={o.id} />
    </>
  );
}
