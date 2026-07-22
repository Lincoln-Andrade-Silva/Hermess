import { NextResponse } from "next/server";
import { validarWebhook } from "@/lib/mercadopago";
import { reconciliarPagamentoPedido } from "@/features/pedidos/reconciliar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MP às vezes faz GET pra validar a URL do webhook.
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const type =
    (body as { type?: string }).type ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic");
  const dataId =
    (body as { data?: { id?: string } }).data?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  if (!dataId) return NextResponse.json({ ok: true });

  const valido = await validarWebhook({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId: String(dataId),
  });
  if (!valido) return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });

  try {
    if (type === "payment") {
      await reconciliarPagamentoPedido(String(dataId));
    }
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    return NextResponse.json({ error: "erro" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
