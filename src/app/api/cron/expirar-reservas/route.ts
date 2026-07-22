import { NextResponse } from "next/server";
import { liberarReservasVencidas } from "@/features/pedidos/reserva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Libera reservas de pedidos vencidos. Chamado pelo Vercel Cron (que envia
 * `Authorization: Bearer <CRON_SECRET>`). Se `CRON_SECRET` estiver definido,
 * exige o header; sem ele, aceita — facilita o dev local.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  await liberarReservasVencidas();
  return NextResponse.json({ ok: true });
}
