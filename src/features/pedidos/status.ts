import type { Pedido } from "@/db/schema";

type StatusPedido = Pedido["status"];
type Tone = "success" | "warning" | "muted" | "danger" | "brand";

export const STATUS_LABEL: Record<StatusPedido, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  pronto_para_retirada: "Pronto para retirada",
  retirado: "Retirado",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export const STATUS_TONE: Record<StatusPedido, Tone> = {
  aguardando_pagamento: "warning",
  pago: "success",
  separando: "brand",
  pronto_para_retirada: "brand",
  retirado: "muted",
  cancelado: "danger",
  expirado: "muted",
};

/** Próximo status na cadeia de retirada, ou null quando não há avanço manual. */
export const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  pago: "separando",
  separando: "pronto_para_retirada",
  pronto_para_retirada: "retirado",
};

/** Rótulo da ação de avançar (ex.: "Marcar como separando"). */
export const AVANCAR_LABEL: Partial<Record<StatusPedido, string>> = {
  pago: "Iniciar separação",
  separando: "Marcar pronto para retirada",
  pronto_para_retirada: "Confirmar retirada",
};

/** Status que ainda podem ser cancelados pelo admin. */
export const CANCELAVEIS: StatusPedido[] = [
  "aguardando_pagamento",
  "pago",
  "separando",
  "pronto_para_retirada",
];
