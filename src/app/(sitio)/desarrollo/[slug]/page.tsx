import type { Metadata } from "next";
import { DevelopmentProfile } from "@/components/site/Profiles";
import JsonLd from "@/components/JsonLd";
import { SEED } from "@/lib/seed";
import { SITE, deliveryLabel } from "@/lib/format";

export function generateStaticParams() {
  return SEED.developments.map((d) => ({ slug: d.slug }));
}
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const d = SEED.developments.find((x) => x.slug === slug)!;
  const o = SEED.orgs.find((x) => x.id === d.orgId)!;
  return {
    title: `${d.name} en ${d.colonia}, ${d.municipio}`,
    description: `${d.description.split(".")[0]}. ${deliveryLabel(d.delivery, d.deliveryDate)}. Desarrolla ${o.name}.`,
    alternates: { canonical: `desarrollo/${d.slug}/` },
    openGraph: { images: [{ url: d.images[0].slice(1) }] },
  };
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const d = SEED.developments.find((x) => x.slug === slug)!;
  const o = SEED.orgs.find((x) => x.id === d.orgId)!;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": d.kind === "torre" ? "ApartmentComplex" : "GatedResidenceCommunity",
          name: d.name,
          url: `${SITE}/desarrollo/${d.slug}/`,
          description: d.description,
          image: d.images.map((i) => SITE + i),
          amenityFeature: d.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
          address: { "@type": "PostalAddress", streetAddress: d.colonia, addressLocality: d.municipio, addressRegion: "Jalisco", addressCountry: "MX" },
          geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng },
          containedInPlace: { "@type": "City", name: d.municipio },
          provider: { "@type": "RealEstateAgent", name: o.name, url: `${SITE}/inmobiliaria/${o.slug}/` },
        }}
      />
      <DevelopmentProfile id={d.id} />
    </>
  );
}
