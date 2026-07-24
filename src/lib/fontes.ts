/**
 * Catálogo de fontes oferecido na tela de Aparência. É dado puro, sem
 * `next/font`, para poder ser importado também pelo client da tela - o
 * carregamento em si fica em `fontes-google.ts`, que só o layout usa.
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
  { chave: "inter", nome: "Inter", variavel: "--font-inter" },
  { chave: "manrope", nome: "Manrope", variavel: "--font-manrope" },
  { chave: "figtree", nome: "Figtree", variavel: "--font-figtree" },
  { chave: "work-sans", nome: "Work Sans", variavel: "--font-work-sans" },
  { chave: "source-sans", nome: "Source Sans 3", variavel: "--font-source-sans" },
  { chave: "rubik", nome: "Rubik", variavel: "--font-rubik" },
  { chave: "karla", nome: "Karla", variavel: "--font-karla" },
];

/** Títulos, marca e nome de produto: condensadas e de peso alto. */
export const FONTES_TITULO: readonly OpcaoFonte[] = [
  { chave: "barlow-condensed", nome: "Barlow Condensed", variavel: "--font-barlow-condensed" },
  { chave: "oswald", nome: "Oswald", variavel: "--font-oswald" },
  { chave: "bebas-neue", nome: "Bebas Neue", variavel: "--font-bebas-neue" },
  { chave: "anton", nome: "Anton", variavel: "--font-anton" },
  { chave: "archivo-narrow", nome: "Archivo Narrow", variavel: "--font-archivo-narrow" },
  { chave: "saira-condensed", nome: "Saira Condensed", variavel: "--font-saira-condensed" },
  { chave: "fjalla-one", nome: "Fjalla One", variavel: "--font-fjalla-one" },
  { chave: "teko", nome: "Teko", variavel: "--font-teko" },
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
