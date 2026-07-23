import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos: trocar a paleta aqui reveste o sistema inteiro,
        // sem tocar em componente. Base clara e quase acromática - em loja de
        // roupa quem dá a cor é a foto do produto, não a interface.
        bg: "#ffffff",
        panel: "#ffffff",
        surface: "#f7f7f7",
        surface2: "#efefef",
        line: "#e5e5e5",
        line2: "#d4d4d4",
        ink: "#0a0a0a",
        // Contrastes sobre #fff: muted 8.1:1, muted2 4.7:1 - ambos passam AA
        // em texto pequeno, que é onde eles são usados (labels, placeholders).
        muted: "#525252",
        muted2: "#737373",
        brand: {
          DEFAULT: "#171717",
          light: "#404040",
          dark: "#000000",
        },
      },
      boxShadow: {
        brand: "0 1px 2px rgba(0, 0, 0, 0.05)",
        "brand-lg": "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Condensada para títulos de seção, marca e nome de produto.
        display: ["var(--font-display)", "Arial Narrow", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
