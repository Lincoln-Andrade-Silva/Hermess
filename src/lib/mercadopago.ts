import { createHmac } from "crypto";
import { getPagamentoConfig } from "./pagamento";

const API = "https://api.mercadopago.com";

async function accessToken(): Promise<string> {
  const cfg = await getPagamentoConfig();
  if (!cfg?.accessToken) throw new Error("Mercado Pago não configurado.");
  return cfg.accessToken;
}

export interface ItemPreferencia {
  titulo: string;
  quantidade: number;
  precoUnitario: number;
}

/**
 * Cria uma preferência do Checkout Pro e devolve o link do checkout. O Checkout
 * Pro oferece Pix, crédito e débito conforme habilitado na conta do lojista -
 * não restringimos os meios aqui.
 */
export async function criarPreferencia(input: {
  itens: ItemPreferencia[];
  payerEmail: string;
  externalReference: string;
  baseUrl: string;
  retornoPath: string;
}): Promise<{ id: string; initPoint: string }> {
  const token = await accessToken();
  const retorno = `${input.baseUrl}${input.retornoPath}`;
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: input.itens.map((i) => ({
        title: i.titulo,
        quantity: i.quantidade,
        unit_price: Number(i.precoUnitario.toFixed(2)),
        currency_id: "BRL",
      })),
      payer: { email: input.payerEmail },
      external_reference: input.externalReference,
      back_urls: { success: retorno, failure: retorno, pending: retorno },
      auto_return: "approved",
      notification_url: `${input.baseUrl}/api/webhooks/mercadopago`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`MP preference: ${JSON.stringify(data)}`);
  return { id: data.id, initPoint: data.init_point };
}

export interface Pagamento {
  id: number;
  status: string; // approved | pending | in_process | rejected | refunded | cancelled | charged_back
  external_reference?: string;
  payment_method_id?: string;
}

/** Consulta um pagamento único (evento type=payment do webhook / retorno do checkout). */
export async function getPagamento(id: string): Promise<Pagamento> {
  const token = await accessToken();
  const res = await fetch(`${API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`MP get payment: ${JSON.stringify(data)}`);
  return data;
}

/** Estorna (total) um pagamento aprovado. Idempotente pela chave enviada. */
export async function estornarPagamento(paymentId: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch(`${API}/v1/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `refund-${paymentId}`,
    },
    body: "{}",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`MP refund: ${JSON.stringify(data)}`);
  }
}

/** Situação do pagamento traduzida para o domínio do pedido. */
export function situacaoPagamento(status: string): "aprovado" | "estornado" | "pendente" {
  if (status === "approved") return "aprovado";
  if (status === "refunded" || status === "cancelled" || status === "charged_back") {
    return "estornado";
  }
  return "pendente";
}

/**
 * Valida a assinatura (x-signature) da notificação. Em dev, ou sem segredo
 * configurado, aceita - facilita testar sem o segredo do painel do MP.
 */
export async function validarWebhook(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const cfg = await getPagamentoConfig();
  const secret = cfg?.webhookSecret;
  if (!secret) return true;
  if (!params.xSignature) return false;

  const partes = Object.fromEntries(
    params.xSignature.split(",").map((p) => {
      const [k, v] = p.trim().split("=");
      return [k, v];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${params.dataId};request-id:${params.xRequestId ?? ""};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");
  return hmac === v1;
}
