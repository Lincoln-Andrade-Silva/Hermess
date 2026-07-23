export const PERIODOS = [7, 30, 90] as const;

/** Normaliza o parâmetro de período para um dos valores aceitos (default 30). */
export function normalizarDias(diasParam?: string): number {
  const n = Number(diasParam);
  return (PERIODOS as readonly number[]).includes(n) ? n : 30;
}
