import type { Combinacao } from "@/db/schema";
import { skuSugerido } from "@/lib/slug";

export interface EixoRascunho {
  nome: string;
  tipo: "texto" | "cor";
  valores: { valor: string; hex?: string }[];
}

export interface VariacaoRascunho {
  sku: string;
  preco: string;
  precoCusto: string;
  estoque: string;
  imagemUrl: string | null;
  combinacao: Combinacao;
  ativo: boolean;
}

/**
 * Chave estável de uma combinação. Ordena as chaves porque o Postgres também
 * normaliza o jsonb - assim client e banco enxergam a mesma identidade.
 */
export function chaveCombinacao(combinacao: Combinacao): string {
  return Object.keys(combinacao)
    .sort()
    .map((k) => `${k}=${combinacao[k]}`)
    .join("|");
}

/** Produto cartesiano dos valores de cada eixo. */
function combinar(eixos: EixoRascunho[]): Combinacao[] {
  return eixos.reduce<Combinacao[]>(
    (acumulado, eixo) =>
      acumulado.flatMap((parcial) =>
        eixo.valores
          .filter((v) => v.valor.trim())
          .map((v) => ({ ...parcial, [eixo.nome]: v.valor })),
      ),
    [{}],
  );
}

/** Valores da combinação na ordem em que os eixos foram declarados. */
function valoresOrdenados(eixos: EixoRascunho[], combinacao: Combinacao): string[] {
  return eixos.map((e) => combinacao[e.nome]).filter(Boolean);
}

/**
 * Mantém a grade em sincronia com os tipos de variação. Roda a cada mudança,
 * sem botão: criar um valor faz a linha aparecer, excluir faz sumir.
 *
 * Duas regras de preservação, e a segunda é a que evita perder trabalho:
 *
 * 1. Combinação que continua existindo mantém tudo - casada por chave.
 * 2. Quando a quantidade de combinações não muda, o que houve foi renomear um
 *    valor, não trocar a grade. Nesse caso a linha é casada por posição, então
 *    corrigir "Pretp" para "Preto" preserva preço e estoque em vez de zerar.
 *
 * O SKU só é regenerado quando ainda era o sugerido; se o lojista digitou o
 * dele, permanece.
 */
export function sincronizarGrade(
  eixos: EixoRascunho[],
  atuais: VariacaoRascunho[],
): VariacaoRascunho[] {
  const eixosValidos = eixos.filter((e) => e.nome.trim() && e.valores.some((v) => v.valor.trim()));

  // Sem eixos o produto tem uma variação única - item sem opções.
  if (eixosValidos.length === 0) {
    const existente = atuais.find((v) => Object.keys(v.combinacao).length === 0) ?? atuais[0];
    return [
      existente
        ? { ...existente, combinacao: {} }
        : {
            sku: skuSugerido([]),
            preco: "",
            precoCusto: "",
            estoque: "0",
            imagemUrl: null,
            combinacao: {},
            ativo: true,
          },
    ];
  }

  const combinacoes = combinar(eixosValidos);
  const porChave = new Map(atuais.map((v) => [chaveCombinacao(v.combinacao), v]));
  const renomeando = combinacoes.length === atuais.length;

  return combinacoes.map((combinacao, i) => {
    const sugerido = skuSugerido(valoresOrdenados(eixosValidos, combinacao));

    const existente = porChave.get(chaveCombinacao(combinacao)) ?? (renomeando ? atuais[i] : null);
    if (existente) {
      const skuAnteriorEraSugerido =
        existente.sku === skuSugerido(valoresOrdenados(eixosValidos, existente.combinacao));

      return {
        ...existente,
        combinacao,
        sku: skuAnteriorEraSugerido ? sugerido : existente.sku,
      };
    }

    return {
      sku: sugerido,
      preco: "",
      precoCusto: "",
      estoque: "0",
      imagemUrl: null,
      combinacao,
      ativo: true,
    };
  });
}

