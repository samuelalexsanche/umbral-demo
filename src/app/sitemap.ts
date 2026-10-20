import type { MetadataRoute } from "next";
import { SEED } from "@/lib/seed";
import { SITE } from "@/lib/format";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const fixed = ["", "inmuebles/", "desarrolladoras/", "creditos/", "publica-tus-desarrollos/"].map((p) => ({ url: `${SITE}/${p}`, lastModified: now }));
  return [
    ...fixed,
    ...SEED.listings.filter((l) => l.status === "publicado").map((l) => ({ url: `${SITE}/inmueble/${l.slug}/`, lastModified: l.updatedAt })),
    ...SEED.orgs.map((o) => ({ url: `${SITE}/inmobiliaria/${o.slug}/`, lastModified: now })),
    ...SEED.developments.map((d) => ({ url: `${SITE}/desarrollo/${d.slug}/`, lastModified: now })),
  ];
}
