import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { BASE, SITE } from "@/lib/format";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE + "/"),
  title: { default: "Umbral · Departamentos nuevos en Guadalajara y Puerto Vallarta", template: "%s · Umbral" },
  description:
    "Departamentos nuevos en Guadalajara y Puerto Vallarta, en preventa y entrega inmediata. Umbral conecta de forma rápida y segura a compradores, inversionistas, desarrolladoras y asesores inmobiliarios.",
  applicationName: "Umbral",
  robots: { index: false, follow: false },
  openGraph: { type: "website", locale: "es_MX", siteName: "Umbral", images: [{ url: "img/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: `${BASE}/icon.svg`, type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#f3f3ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: 12 } }} />
      </body>
    </html>
  );
}
