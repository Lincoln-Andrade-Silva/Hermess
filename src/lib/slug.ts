/** Converte texto livre em slug de URL: "Camiseta Oversized" -> "camiseta-oversized". */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Garante unicidade acrescentando sufixo numérico quando o slug já existe.
 * `existentes` deve conter os slugs em uso, exceto o do próprio registro em edição.
 */
export function slugUnico(texto: string, existentes: string[]): string {
  const base = slugify(texto) || "item";
  const usados = new Set(existentes);
  if (!usados.has(base)) return base;

  let n = 2;
  while (usados.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * SKU a partir dos valores da combinação, na ordem dos tipos de variação:
 * Tamanho P + Cor Preto vira "P Preto". Acento é removido porque o código
 * circula em etiqueta e planilha, onde acento costuma quebrar.
 *
 * Não leva o nome do produto, então o SKU só é único dentro do produto; a
 * unicidade no banco é por (produto_id, sku).
 */
export function skuSugerido(valores: string[]): string {
  if (valores.length === 0) return "Unico";

  return valores
    .map((valor) =>
      valor
        // Só tira acento e pontuação; o caixa do que foi digitado é preservado
        // para "GG" não virar "Gg".
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9 ]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" "),
    )
    .filter(Boolean)
    .join(" ");
}
