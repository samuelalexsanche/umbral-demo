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
  const n = SEED.listings.filter((l) => l.orgId === o.id && l.status === "publicado").length;
  return {
    title: `${o.name}: ${n} inmuebles en ${o.municipios.join(" y ")}`,
    description: `${o.tagline} Perfil de ${o.name} con su inventario, desarrollos, créditos aceptados y asesores.`,
    alternates: { canonical: `inmobiliaria/${o.slug}/` },
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
          "@type": "RealEstateAgent",
          name: o.name,
          url: `${SITE}/inmobiliaria/${o.slug}/`,
          description: o.description,
          foundingDate: String(o.since),
          areaServed: o.municipios.map((m) => ({ "@type": "City", name: m })),
          address: { "@type": "PostalAddress", addressLocality: o.municipios[0], addressRegion: "Jalisco", addressCountry: "MX" },
          openingHours: o.hours,
        }}
      />
      <OrgProfile id={o.id} />
    </>
  );
}
