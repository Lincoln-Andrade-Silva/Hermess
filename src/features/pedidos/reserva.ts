import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItens, pedidos, produtosVariacoes } from "@/db/schema";

/** Aceita tanto o `db` quanto uma transação - ambos expõem `execute`. */
type Executor = Pick<typeof db, "execute">;

/**
 * Varredura preguiçosa: devolve ao estoque a reserva de pedidos vencidos ainda
 * `aguardando_pagamento` e os marca `expirado`. Sem cron - roda no checkout e
 * nas leituras de estoque sensíveis. É barata quando nada venceu (índice em
 * status + expira_em). Idempotente.
 */
export async function liberarReservasVencidas(exec: Executor = db): Promise<void> {
  await exec.execute(sql`
    update ${produtosVariacoes} as v
    set reservado = greatest(0, v.reservado - i.quantidade)
    from ${pedidoItens} as i
    join ${pedidos} as p on p.id = i.pedido_id
    where i.variacao_id = v.id
      and p.status = 'aguardando_pagamento'
      and p.expira_em < now()
  `);

  await exec.execute(sql`
    update ${pedidos}
    set status = 'expirado'
    where status = 'aguardando_pagamento' and expira_em < now()
  `);
}
