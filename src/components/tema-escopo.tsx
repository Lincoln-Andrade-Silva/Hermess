import type { Viewport } from "next";
import { FONTES_CORPO, FONTES_TITULO, variavelDaFonte } from "@/lib/fontes";
import { declaracoesDeCor, esquemaDeCor, paletaDoTema, type EscopoTema } from "@/lib/tema";
import { obterTemaConfig } from "@/features/tema/queries";

/**
 * Aplica o tema de um escopo sobrescrevendo as vars do `:root`. Como só um grupo
 * de rotas renderiza por requisição, vitrine e painel nunca colidem - cada
 * layout monta este componente como primeiro filho, antes de qualquer conteúdo,
 * para o navegador já ter as cores na primeira pintura.
 *
 * O CSS é montado no servidor a partir de valores fechados: cores viram tripleto
 * numérico e as fontes saem do catálogo, então nada que o lojista digita chega
 * cru à folha de estilo.
 */
export async function TemaEscopo({ escopo }: { escopo: EscopoTema }) {
  const config = await obterTemaConfig(escopo);
  const paleta = paletaDoTema(config);

  const fonteCorpo = variavelDaFonte(config?.fonteCorpo ?? "", FONTES_CORPO);
  const fonteTitulo = variavelDaFonte(config?.fonteTitulo ?? "", FONTES_TITULO);

  const css = [
    ":root{",
    `color-scheme:${esquemaDeCor(paleta)};`,
    `${declaracoesDeCor(paleta)};`,
    `--font-sans:var(${fonteCorpo});`,
    `--font-display:var(${fonteTitulo});`,
    "}",
  ].join("");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/**
 * `theme-color` do escopo, para a barra do navegador no mobile acompanhar o
 * fundo da página. Cada layout reexporta isto como `generateViewport`; o Next
 * mescla com o viewport da raiz, que segue cuidando de escala e largura.
 */
export async function viewportDoEscopo(escopo: EscopoTema): Promise<Viewport> {
  const paleta = paletaDoTema(await obterTemaConfig(escopo));
  return { themeColor: paleta.bg };
}
