import { twMerge } from "tailwind-merge";

/**
 * Junta classes resolvendo conflitos do Tailwind: a última vence.
 *
 * Sem isso, `cn("h-[50px]", "h-9")` deixa as duas no HTML e quem ganha é a
 * ordem do CSS gerado, não a da chamada — então um componente base com altura
 * fixa não pode ser sobrescrito pelo consumidor de forma previsível.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
