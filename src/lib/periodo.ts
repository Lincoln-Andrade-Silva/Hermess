import { formatData } from "@/lib/format";

export const PRESETS = [
  { valor: "7", label: "7 dias", dias: 7 },
  { valor: "30", label: "30 dias", dias: 30 },
  { valor: "90", label: "90 dias", dias: 90 },
] as const;

export interface Intervalo {
  inicio: Date;
  fim: Date;
  dias: number;
  /** Janela imediatamente anterior de mesmo tamanho (para comparação). */
  anterior: { inicio: Date; fim: Date };
  label: string;
  /** Rótulo curto da base de comparação, ex.: "30 dias anteriores". */
  labelAnterior: string;
  personalizado: boolean;
}

export interface ParamsPeriodo {
  periodo?: string;
  de?: string;
  ate?: string;
}

function ehData(s?: string): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Resolve o intervalo a partir dos params. Prioriza o range personalizado
 * (`de`/`ate`); senão usa o preset `periodo` (default 30 dias). Também calcula a
 * janela anterior de mesmo tamanho para comparações.
 */
export function resolverIntervalo(params: ParamsPeriodo): Intervalo {
  if (ehData(params.de) && ehData(params.ate)) {
    const inicio = new Date(`${params.de}T00:00:00`);
    const fim = new Date(`${params.ate}T23:59:59.999`);
    const span = Math.max(1, fim.getTime() - inicio.getTime());
    const dias = Math.max(1, Math.round(span / 86_400_000));
    return {
      inicio,
      fim,
      dias,
      anterior: { inicio: new Date(inicio.getTime() - span), fim: new Date(inicio.getTime() - 1) },
      label: `${formatData(inicio)} a ${formatData(fim)}`,
      labelAnterior: "período anterior",
      personalizado: true,
    };
  }

  const dias = PRESETS.find((p) => p.valor === params.periodo)?.dias ?? 30;
  const span = dias * 86_400_000;
  const fim = new Date();
  const inicio = new Date(fim.getTime() - span);
  return {
    inicio,
    fim,
    dias,
    anterior: { inicio: new Date(inicio.getTime() - span), fim: inicio },
    label: `Últimos ${dias} dias`,
    labelAnterior: `${dias} dias anteriores`,
    personalizado: false,
  };
}
