import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Quicksand } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Tipografías del Manual de identidad GOYN Barranquilla 2024 (§6):
// Quicksand para cuerpos de texto y títulos (el manual la admite en "Títulos | Quicksand bold"),
// Permanent Marker para elementos destacados. Brandon Grotesque, la principal, es comercial:
// se agregará como fuente local cuando GOYN entregue la licencia web (ver docs/03).
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const marker = Permanent_Marker({ variable: "--font-permanent-marker", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "GOYN Conecta BAQ · Mapa del ecosistema juvenil de Barranquilla",
    template: "%s · GOYN Conecta BAQ",
  },
  description:
    "El espejo digital del ecosistema juvenil de Barranquilla: ver, conectar y medir lo que hacen las organizaciones del Colaborativo GOYN por las juventudes.",
  icons: { icon: "/icon.webp" },
};

export const viewport: Viewport = { themeColor: "#9B00FF" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className={`${quicksand.variable} ${marker.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
