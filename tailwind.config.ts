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
        // sem tocar em componente. Base: fundo quase preto + acento único.
        bg: "#0a0a12",
        panel: "#0f0f1c",
        surface: "#141428",
        surface2: "#1a1a30",
        line: "#1e1e38",
        line2: "#252545",
        ink: "#f0f4ff",
        muted: "#6b7280",
        muted2: "#4b5563",
        brand: {
          DEFAULT: "#3b82f6",
          light: "#60a5fa",
          dark: "#1d4ed8",
        },
      },
      boxShadow: {
        brand: "0 1px 6px rgba(59, 130, 246, 0.06)",
        "brand-lg": "0 2px 10px rgba(59, 130, 246, 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
