import "dotenv/config";
import postgres from "postgres";

/**
 * Cria pedidos de teste para um cliente real, um por status do fluxo de
 * retirada, para exercitar os botões da página do pedido (WhatsApp, cancelar,
 * solicitar reembolso) e do admin.
 *   npx tsx scripts/seed-pedidos-teste.ts [busca]
 * `busca` casa por nome ou e-mail (padrão: "lincoln"). Usa o contato do profile.
 *
 * Nasce um pedido em cada status: pago, separando, pronto_para_retirada. Todos
 * como venda online (canal online), sem mexer no estoque - é só para navegar.
 * O avanço real de status no sistema é manual, pelo botão "Avançar status" no
 * detalhe do pedido em /admin/pedidos (pago -> separando -> pronto -> retirado).
 */
const STATUS = ["pago", "separando", "pronto_para_retirada"] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL é obrigatória.");

  const busca = (process.argv[2] || "lincoln").toLowerCase();
  const sql = postgres(databaseUrl, { prepare: false, max: 1 });

  try {
    const [cliente] = await sql<
      { id: string; nome: string; email: string; telefone: string | null }[]
    >`
      select id, nome, email, telefone
      from profiles
      where lower(nome) like ${`%${busca}%`} or lower(email) like ${`%${busca}%`}
      order by (lower(email) = ${busca}) desc, criado_em desc
      limit 1
    `;

    if (!cliente) {
      throw new Error(`Nenhum cliente casando com "${busca}". Passe outro nome/e-mail como argumento.`);
    }

    const variacoes = await sql<
      { id: string; nome: string; sku: string; preco: string; combinacao: Record<string, string> }[]
    >`
      select v.id, p.nome, v.sku, v.preco, v.combinacao
      from produtos_variacoes v
      join produtos p on p.id = v.produto_id
      where v.ativo
      limit 50
    `;
    if (variacoes.length === 0) throw new Error("Nenhuma variação ativa. Cadastre um produto antes.");

    const criados: number[] = [];

    for (const status of STATUS) {
      const escolhidas = variacoes.slice(0, Math.min(2, variacoes.length));
      const itens = escolhidas.map((v) => ({ v, qtd: 1 }));
      const total = itens.reduce((acc, it) => acc + Number(it.v.preco) * it.qtd, 0);
      const agora = new Date();

      const [pedido] = await sql<{ id: string; numero: number }[]>`
        insert into pedidos
          (cliente_id, nome, telefone, email, canal, status, total, expira_em, criado_em)
        values
          (${cliente.id}, ${cliente.nome}, ${cliente.telefone ?? "(11) 90000-0000"}, ${cliente.email},
           'online', ${status}, ${total.toFixed(2)}, ${agora}, ${agora})
        returning id, numero
      `;

      for (const { v, qtd } of itens) {
        await sql`
          insert into pedido_itens
            (pedido_id, variacao_id, nome_produto, sku, combinacao, preco_unitario, quantidade)
          values
            (${pedido.id}, ${v.id}, ${v.nome}, ${v.sku}, ${sql.json(v.combinacao)}, ${v.preco}, ${qtd})
        `;
      }

      criados.push(pedido.numero);
      console.log(`✅ Pedido #${pedido.numero} (${status}) para ${cliente.nome}.`);
    }

    console.log("");
    console.log(`Cliente: ${cliente.nome} <${cliente.email}>. Abra logado como ele:`);
    for (const numero of criados) console.log(`   /pedido/${numero}`);
    console.log("O botão de WhatsApp aparece se a loja tiver telefone em Configurações.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed dos pedidos falhou:");
  console.error(err);
  process.exit(1);
});
