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
        // Tokens semânticos ligados a CSS vars: cada escopo (vitrine e painel)
        // injeta a sua paleta no `:root` e o sistema inteiro se reveste, sem
        // tocar em componente. Os valores vêm de `src/lib/tema.ts`; o default
        // do tema claro fica em `globals.css`. O formato `rgb(... / <alpha>)`
        // é o que mantém utilitários com opacidade (`bg-surface/40`) válidos.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        surface2: "rgb(var(--c-surface2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        line2: "rgb(var(--c-line2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        muted2: "rgb(var(--c-muted2) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          // Texto sobre o brand. Preto ou branco conforme a luminância da cor,
          // porque no tema escuro o botão primário é claro com texto escuro.
          fg: "rgb(var(--c-brand-fg) / <alpha-value>)",
          light: "rgb(var(--c-brand-light) / <alpha-value>)",
          dark: "rgb(var(--c-brand-dark) / <alpha-value>)",
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
