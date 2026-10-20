import type { Metadata } from "next";
import ListingDetail from "@/components/site/ListingDetail";
import JsonLd from "@/components/JsonLd";
import { SEED, CREDITS } from "@/lib/seed";
import { SITE, money, TYPE_LABEL, deliveryLabel } from "@/lib/format";

export function generateStaticParams() {
  return SEED.listings.map((l) => ({ slug: l.slug }));
}

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const l = SEED.listings.find((x) => x.slug === slug)!;
  const org = SEED.orgs.find((o) => o.id === l.orgId)!;
  const credits = l.credits.map((c) => CREDITS.find((x) => x.id === c)!.name).join(", ");
  return {
    title: `${l.title} · ${money(l.price)}`,
    description: `${TYPE_LABEL[l.type]} de ${l.bedrooms} recámaras y ${l.m2Built} m² en ${l.colonia}, ${l.municipio}. ${deliveryLabel(l.delivery, l.deliveryDate)}. Acepta ${credits}. Publicado por ${org.name}.`,
    alternates: { canonical: `inmueble/${l.slug}/` },
    openGraph: { images: [{ url: l.images[0].slice(1) }] },
  };
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const l = SEED.listings.find((x) => x.slug === slug)!;
  const org = SEED.orgs.find((o) => o.id === l.orgId)!;
  const residence = l.type === "departamento" ? "Apartment" : "SingleFamilyResidence";
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: l.title,
          url: `${SITE}/inmueble/${l.slug}/`,
          datePosted: l.createdAt,
          description: l.description,
          image: l.images.map((i) => SITE + i),
          offers: { "@type": "Offer", price: l.price, priceCurrency: "MXN", availability: l.status === "vendido" ? "https://schema.org/SoldOut" : "https://schema.org/InStock", seller: { "@type": "RealEstateAgent", name: org.name, url: `${SITE}/inmobiliaria/${org.slug}/` } },
          about: {
            "@type": residence,
            numberOfRooms: l.bedrooms,
            numberOfBedrooms: l.bedrooms,
            numberOfBathroomsTotal: l.bathrooms,
            floorSize: { "@type": "QuantitativeValue", value: l.m2Built, unitCode: "MTK" },
            address: { "@type": "PostalAddress", addressLocality: l.municipio, addressRegion: "Jalisco", addressCountry: "MX", streetAddress: l.colonia },
            geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng },
          },
        }}
      />
      <ListingDetail id={l.id} />
    </>
  );
}
