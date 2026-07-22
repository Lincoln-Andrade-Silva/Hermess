import type { Pedido } from "@/db/schema";

type StatusPedido = Pedido["status"];
type Tone = "success" | "warning" | "muted" | "danger";

export const STATUS_LABEL: Record<StatusPedido, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export const STATUS_TONE: Record<StatusPedido, Tone> = {
  aguardando_pagamento: "warning",
  pago: "success",
  cancelado: "danger",
  expirado: "muted",
};
