import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { CapaGrano } from "@/components/capa-grano";
import { DOMINIO_CANONICO } from "@/lib/dominio";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${DOMINIO_CANONICO}`),
  title: {
    default: "Mirage",
    template: "%s — Mirage",
  },
  description:
    "Mirage desarrolla software a medida: sistemas específicos para las necesidades de cada cliente.",
  openGraph: {
    siteName: "Mirage",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CapaGrano />
        {children}
      </body>
    </html>
  );
}
