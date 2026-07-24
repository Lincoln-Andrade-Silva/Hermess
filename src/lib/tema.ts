import type { TemaConfig } from "@/db/schema";

export type EscopoTema = "vitrine" | "admin";
export type ModoTema = "claro" | "escuro" | "personalizado";

/**
 * As cinco cores que o lojista escolhe no modo personalizado. Os demais tokens
 * do sistema são derivados destas - pedir treze cores transformaria a tela num
 * editor de tema, não numa configuração.
 */
export interface CoresBase {
  bg: string;
  surface: string;
  ink: string;
  line: string;
  brand: string;
}

/** Paleta completa: é ela que vira CSS var e alimenta os tokens do Tailwind. */
export interface PaletaTema extends CoresBase {
  panel: string;
  surface2: string;
  line2: string;
  muted: string;
  muted2: string;
  brandFg: string;
  brandLight: string;
  brandDark: string;
}

/**
 * Tema claro: os valores que o sistema sempre teve, copiados um a um. É o
 * padrão, então precisa ficar idêntico ao de antes desta tela existir - por isso
 * é declarado, e não derivado.
 */
export const PALETA_CLARA: PaletaTema = {
  bg: "#ffffff",
  panel: "#ffffff",
  surface: "#f7f7f7",
  surface2: "#efefef",
  line: "#e5e5e5",
  line2: "#d4d4d4",
  ink: "#0a0a0a",
  muted: "#525252",
  muted2: "#737373",
  brand: "#171717",
  brandFg: "#ffffff",
  brandLight: "#404040",
  brandDark: "#000000",
};

/**
 * Tema escuro, seguindo a mesma lógica do claro: quase acromático, para quem dá
 * cor ser a foto do produto. `panel` é levemente mais claro que o fundo porque
 * no escuro a sombra não separa dropdown de página - quem separa é a superfície.
 * `muted` (7,4:1) e `muted2` (5,7:1) passam AA sobre o fundo.
 */
export const PALETA_ESCURA: PaletaTema = {
  bg: "#0b0b0c",
  panel: "#151517",
  surface: "#18181a",
  surface2: "#202024",
  line: "#2a2a2e",
  line2: "#3a3a40",
  ink: "#f4f4f5",
  muted: "#a1a1ac",
  muted2: "#8a8a93",
  // No escuro o botão primário é claro com texto escuro - a inversão do claro.
  brand: "#fafafa",
  brandFg: "#0a0a0a",
  brandLight: "#d4d4d4",
  brandDark: "#ffffff",
};

/** Ponto de partida dos seletores quando o lojista entra no personalizado. */
export const CORES_BASE_CLARA: CoresBase = {
  bg: PALETA_CLARA.bg,
  surface: PALETA_CLARA.surface,
  ink: PALETA_CLARA.ink,
  line: PALETA_CLARA.line,
  brand: PALETA_CLARA.brand,
};

const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

export function hexValido(valor: string | null | undefined): valor is string {
  return typeof valor === "string" && HEX_VALIDO.test(valor);
}

type Rgb = [number, number, number];

function hexParaRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbParaHex([r, g, b]: Rgb): string {
  const canal = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

/** Interpola `de` em direção a `para`; `peso` de 0 a 1. */
function misturar(de: string, para: string, peso: number): string {
  const a = hexParaRgb(de);
  const b = hexParaRgb(para);
  return rgbParaHex([
    a[0] + (b[0] - a[0]) * peso,
    a[1] + (b[1] - a[1]) * peso,
    a[2] + (b[2] - a[2]) * peso,
  ]);
}

/** Luminância relativa da WCAG, de 0 (preto) a 1 (branco). */
export function luminancia(hex: string): number {
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = hexParaRgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razão de contraste WCAG entre duas cores, de 1 a 21. */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [claro, escuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * Completa a paleta a partir das cinco cores base, no modo personalizado. As
 * derivações são todas relativas a `ink` e `bg`, então a mesma regra serve para
 * uma escolha clara ou escura: "mais forte" é sempre mais perto do texto, "mais
 * fraco" mais perto do fundo, sem precisar saber qual dos dois é o escuro.
 */
export function derivarPaleta(base: CoresBase): PaletaTema {
  const { bg, surface, ink, line, brand } = base;
  const fundoClaro = luminancia(bg) > 0.5;
  return {
    ...base,
    panel: fundoClaro ? bg : misturar(bg, ink, 0.05),
    surface2: misturar(surface, ink, 0.05),
    line2: misturar(line, ink, 0.08),
    muted: misturar(ink, bg, 0.29),
    muted2: misturar(ink, bg, 0.43),
    // Texto sobre o brand: preto ou branco, o que contrastar mais.
    brandFg: contraste(brand, "#ffffff") >= contraste(brand, "#0a0a0a") ? "#ffffff" : "#0a0a0a",
    brandLight: misturar(brand, bg, 0.18),
    // Hover do botão primário: afasta do fundo, ou seja, escurece sobre fundo
    // claro e clareia sobre fundo escuro. Nos dois casos a mudança aparece.
    brandDark: misturar(brand, fundoClaro ? "#000000" : "#ffffff", 0.2),
  };
}

/** Paleta em uso num escopo, já resolvendo modo e registro ausente. */
export function paletaDoTema(config: TemaConfig | null): PaletaTema {
  if (!config || config.tema === "claro") return PALETA_CLARA;
  if (config.tema === "escuro") return PALETA_ESCURA;

  // Personalizado com cor faltando ou corrompida cai no claro campo a campo, em
  // vez de derrubar a página inteira.
  return derivarPaleta({
    bg: hexValido(config.corBg) ? config.corBg : CORES_BASE_CLARA.bg,
    surface: hexValido(config.corSurface) ? config.corSurface : CORES_BASE_CLARA.surface,
    ink: hexValido(config.corInk) ? config.corInk : CORES_BASE_CLARA.ink,
    line: hexValido(config.corLine) ? config.corLine : CORES_BASE_CLARA.line,
    brand: hexValido(config.corBrand) ? config.corBrand : CORES_BASE_CLARA.brand,
  });
}

/**
 * `color-scheme` do escopo, para o navegador pintar scrollbar, autofill e
 * controles nativos (date picker, select) do lado certo.
 */
export function esquemaDeCor(paleta: PaletaTema): "light" | "dark" {
  return luminancia(paleta.bg) < 0.5 ? "dark" : "light";
}

/** Tailwind consome as vars via `rgb(var(--c-x) / <alpha-value>)`. */
function tripletoRgb(hex: string): string {
  return hexParaRgb(hex).join(" ");
}

const TOKENS: Record<keyof PaletaTema, string> = {
  bg: "--c-bg",
  panel: "--c-panel",
  surface: "--c-surface",
  surface2: "--c-surface2",
  line: "--c-line",
  line2: "--c-line2",
  ink: "--c-ink",
  muted: "--c-muted",
  muted2: "--c-muted2",
  brand: "--c-brand",
  brandFg: "--c-brand-fg",
  brandLight: "--c-brand-light",
  brandDark: "--c-brand-dark",
};

/** Mapa `--c-token` -> tripleto, para style inline (preview) e para o `:root`. */
export function varsDeCor(paleta: PaletaTema): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const token of Object.keys(TOKENS) as (keyof PaletaTema)[]) {
    vars[TOKENS[token]] = tripletoRgb(paleta[token]);
  }
  return vars;
}

/** Declarações de cor prontas para injetar num bloco `:root`. */
export function declaracoesDeCor(paleta: PaletaTema): string {
  return Object.entries(varsDeCor(paleta))
    .map(([nome, valor]) => `${nome}:${valor}`)
    .join(";");
}

/**
 * Paleta correspondente à escolha em edição na tela de Aparência - o mesmo que
 * `paletaDoTema` faz a partir do registro, mas a partir do estado do formulário,
 * para alimentar o preview antes de salvar.
 */
export function paletaDeSelecao(tema: ModoTema, cores: CoresBase): PaletaTema {
  if (tema === "escuro") return PALETA_ESCURA;
  if (tema === "personalizado") return derivarPaleta(cores);
  return PALETA_CLARA;
}

/**
 * Cores dos estados de feedback (erro, sucesso, aviso) por esquema. São tokens à
 * parte da paleta: não dependem das cinco cores escolhidas - vermelho continua
 * vermelho no tema personalizado -, só precisam de uma variante escura legível
 * sobre fundo escuro. Cada um traz fundo, borda e texto.
 */
const FEEDBACK: Record<"light" | "dark", Record<string, string>> = {
  light: {
    "--fb-danger-surface": "#fef2f2",
    "--fb-danger-line": "#fecaca",
    "--fb-danger-ink": "#b91c1c",
    "--fb-success-surface": "#ecfdf5",
    "--fb-success-line": "#a7f3d0",
    "--fb-success-ink": "#047857",
    "--fb-warning-surface": "#fffbeb",
    "--fb-warning-line": "#fde68a",
    "--fb-warning-ink": "#92400e",
  },
  dark: {
    "--fb-danger-surface": "#2a1618",
    "--fb-danger-line": "#5c2b2f",
    "--fb-danger-ink": "#fca5a5",
    "--fb-success-surface": "#0f241d",
    "--fb-success-line": "#1f4d3c",
    "--fb-success-ink": "#6ee7b7",
    "--fb-warning-surface": "#271d0c",
    "--fb-warning-line": "#4a3a18",
    "--fb-warning-ink": "#fcd34d",
  },
};

/** Mapa dos tokens de feedback, para style inline (preview) e live-apply. */
export function varsDeFeedback(esquema: "light" | "dark"): Record<string, string> {
  return FEEDBACK[esquema];
}

/** Declarações de feedback prontas para injetar num bloco `:root`. */
export function declaracoesDeFeedback(esquema: "light" | "dark"): string {
  return Object.entries(FEEDBACK[esquema])
    .map(([nome, valor]) => `${nome}:${valor}`)
    .join(";");
}
