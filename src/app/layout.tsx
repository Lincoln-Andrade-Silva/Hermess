import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CLASSES_DE_FONTE } from "@/lib/fontes-google";
import { getLojaBrand } from "@/lib/loja";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { nome } = await getLojaBrand();
  return {
    title: { default: nome, template: `%s · ${nome}` },
    description: "Loja online e gestão de vendas.",
  };
}

// `themeColor` sai daqui: cada escopo define o seu a partir do tema em uso.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Evita o zoom automático ao focar inputs no mobile.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Todas as fontes do catálogo entram como variável; cada escopo aponta
    // `--font-sans` / `--font-display` para a que foi configurada.
    <html lang="pt-BR" className={CLASSES_DE_FONTE}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
