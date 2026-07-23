import "dotenv/config";
import postgres from "postgres";

/**
 * Popula o dashboard/relatórios com vendas fictícias.
 *   npx tsx scripts/seed-vendas.ts [quantidade]   (padrão: 40)
 *
 * As vendas nascem "retirado" (contam como venda e podem ser excluídas depois
 * pela lixeira em Pedidos). O cliente é "Cliente Teste N" para fácil limpeza.
 * Não mexe no estoque — é só para visualizar os números.
 */
const METODOS = ["dinheiro", "pix", "credito", "debito"] as const;
const escolher = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const inteiro = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL é obrigatória.");

  const quantidade = Number(process.argv[2]) || 40;
  const sql = postgres(databaseUrl, { prepare: false, max: 1 });

  try {
    const variacoes = await sql<
      { id: string; nome: string; sku: string; preco: string; combinacao: Record<string, string> }[]
    >`
      select v.id, p.nome, v.sku, v.preco, v.combinacao
      from produtos_variacoes v
      join produtos p on p.id = v.produto_id
      where v.ativo
      limit 300
    `;

    if (variacoes.length === 0) {
      throw new Error("Nenhuma variação ativa encontrada. Cadastre um produto antes.");
    }

    let itensTotal = 0;

    for (let i = 0; i < quantidade; i++) {
      const online = Math.random() < 0.6;
      const canal = online ? "online" : "pdv";
      const metodo = online ? null : escolher(METODOS);
      // Espalha nos últimos 30 dias, com hora aleatória.
      const criadoEm = new Date(Date.now() - Math.random() * 30 * 86_400_000);

      const nItens = inteiro(1, 3);
      const escolhidas = Array.from({ length: nItens }, () => escolher(variacoes));
      const itens = escolhidas.map((v) => ({ v, qtd: inteiro(1, 3) }));
      const total = itens.reduce((acc, it) => acc + Number(it.v.preco) * it.qtd, 0);

      const [pedido] = await sql<{ id: string }[]>`
        insert into pedidos
          (cliente_id, nome, telefone, email, canal, metodo_pagamento, status, total, expira_em, criado_em)
        values
          (null, ${`Cliente Teste ${i + 1}`}, '', null, ${canal}, ${metodo}, 'retirado', ${total.toFixed(2)}, ${criadoEm}, ${criadoEm})
        returning id
      `;

      for (const { v, qtd } of itens) {
        await sql`
          insert into pedido_itens
            (pedido_id, variacao_id, nome_produto, sku, combinacao, preco_unitario, quantidade)
          values
            (${pedido.id}, ${v.id}, ${v.nome}, ${v.sku}, ${sql.json(v.combinacao)}, ${v.preco}, ${qtd})
        `;
        itensTotal += qtd;
      }
    }

    console.log(`✅ ${quantidade} vendas fictícias criadas (${itensTotal} itens) nos últimos 30 dias.`);
    console.log("   Veja em /admin (dashboard) e /admin/relatorios.");
    console.log('   Para limpar depois: exclua os pedidos "Cliente Teste" pela lixeira em /admin/pedidos.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed de vendas falhou:");
  console.error(err);
  process.exit(1);
});
