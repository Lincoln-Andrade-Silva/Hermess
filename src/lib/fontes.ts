/**
 * Catálogo de fontes oferecido na tela de Aparência. É dado puro, sem
 * `next/font`, para poder ser importado também pelo client da tela - o
 * carregamento em si fica em `fontes-google.ts`, que só o layout usa.
 *
 * As listas privilegiam variedade visível: entre uma opção e outra a mudança
 * precisa saltar aos olhos. Por isso misturam categorias (neutra, geométrica,
 * serifada, arredondada, condensada), em vez de vários neutros parecidos.
 *
 * Acrescentar uma fonte aqui exige declarar o loader correspondente lá; as duas
 * listas são conferidas em tempo de build por `fontes-google.ts`.
 */
export interface OpcaoFonte {
  chave: string;
  nome: string;
  variavel: string;
}

/** Corpo, preço, formulário: precisa aguentar texto pequeno e denso. */
export const FONTES_CORPO: readonly OpcaoFonte[] = [
  { chave: "dm-sans", nome: "DM Sans", variavel: "--font-dm-sans" },
  { chave: "poppins", nome: "Poppins", variavel: "--font-poppins" },
  { chave: "inter", nome: "Inter", variavel: "--font-inter" },
  { chave: "lora", nome: "Lora", variavel: "--font-lora" },
  { chave: "fraunces", nome: "Fraunces", variavel: "--font-fraunces" },
  { chave: "nunito", nome: "Nunito", variavel: "--font-nunito" },
  { chave: "space-grotesk", nome: "Space Grotesk", variavel: "--font-space-grotesk" },
  { chave: "roboto-slab", nome: "Roboto Slab", variavel: "--font-roboto-slab" },
];

/** Títulos, marca e nome de produto: peso alto e presença. */
export const FONTES_TITULO: readonly OpcaoFonte[] = [
  { chave: "barlow-condensed", nome: "Barlow Condensed", variavel: "--font-barlow-condensed" },
  { chave: "oswald", nome: "Oswald", variavel: "--font-oswald" },
  { chave: "bebas-neue", nome: "Bebas Neue", variavel: "--font-bebas-neue" },
  { chave: "anton", nome: "Anton", variavel: "--font-anton" },
  { chave: "playfair", nome: "Playfair Display", variavel: "--font-playfair" },
  { chave: "archivo-black", nome: "Archivo Black", variavel: "--font-archivo-black" },
  { chave: "abril-fatface", nome: "Abril Fatface", variavel: "--font-abril-fatface" },
  { chave: "fjalla-one", nome: "Fjalla One", variavel: "--font-fjalla-one" },
];

/**
 * Resolve a chave salva no banco para a CSS var correspondente. Chave que saiu
 * do catálogo (registro antigo, fonte removida) cai na primeira opção da lista,
 * que é sempre a fonte padrão do template.
 */
export function variavelDaFonte(chave: string, opcoes: readonly OpcaoFonte[]): string {
  const escolhida = opcoes.find((f) => f.chave === chave) ?? opcoes[0];
  return escolhida.variavel;
}
