import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SITE } from "@/lib/format";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE + "/"),
  title: { default: "Umbral · Casas nuevas en Guadalajara de desarrolladores verificados", template: "%s · Umbral" },
  description:
    "Encuentra casas y departamentos nuevos en Guadalajara, Zapopan, Tlajomulco y Tlaquepaque. Filtra por el crédito que ya tienes (Infonavit, Fovissste, bancario) y habla directo con el asesor del desarrollo.",
  applicationName: "Umbral",
  robots: { index: false, follow: false },
  openGraph: { type: "website", locale: "es_MX", siteName: "Umbral", images: [{ url: "img/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: "icon.svg", type: "image/svg+xml" }] },
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
