export const PAGE_SIZE = 10;

/** Lê o número da página do searchParam (1-based), com fallback 1. */
export function parsePagina(valor?: string): number {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function totalPaginas(total: number, tamanho: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / tamanho));
}

export function offsetDaPagina(pagina: number, tamanho: number = PAGE_SIZE): number {
  return (pagina - 1) * tamanho;
}

/** Monta uma URL preservando os params atuais e aplicando updates (null/"" remove). */
export function montarUrl(
  pathname: string,
  searchParams: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(searchParams.toString());
  for (const [chave, valor] of Object.entries(updates)) {
    if (valor === null || valor === "") params.delete(chave);
    else params.set(chave, valor);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
