import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getLojaBrand } from "@/lib/loja";
import "./globals.css";

// Display condensada para títulos/marca; DM Sans para corpo, preço e formulários.
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
});

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const { nome } = await getLojaBrand();
  return {
    title: { default: nome, template: `%s · ${nome}` },
    description: "Loja online e gestão de vendas.",
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // Evita o zoom automático ao focar inputs no mobile.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
