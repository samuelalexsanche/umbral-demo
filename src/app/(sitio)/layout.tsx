import { DemoBanner, SiteFooter, SiteHeader } from "@/components/site/Chrome";

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main id="contenido">{children}</main>
      <SiteFooter />
    </>
  );
}
