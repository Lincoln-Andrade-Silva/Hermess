import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const tipoUsuario = pgEnum("tipo_usuario", ["admin", "cliente"]);
export const statusUsuario = pgEnum("status_usuario", ["ativo", "inativo"]);

// `profiles.id` referencia auth.users(id). A FK, a RLS e o trigger de criação
// automática ficam na migration custom (Drizzle não modela o schema `auth`).
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  tipo: tipoUsuario("tipo").notNull().default("cliente"),
  status: statusUsuario("status").notNull().default("ativo"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NovoProfile = typeof profiles.$inferInsert;

/**
 * Tabela livre exibida na página do produto. Matriz pura — a primeira coluna
 * é o rótulo da linha — para não amarrar o sistema a um domínio: uma loja de
 * roupa põe "Tamanho / Busto / Comprimento", uma de eletrônico põe
 * "Modelo / Voltagem / Potência". O título também é do lojista.
 */
export interface FichaTecnica {
  titulo: string;
  colunas: string[];
  linhas: string[][];
}

export const categorias = pgTable("categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Categoria = typeof categorias.$inferSelect;
export type NovaCategoria = typeof categorias.$inferInsert;

export const produtos = pgTable("produtos", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoriaId: uuid("categoria_id").references(() => categorias.id, { onDelete: "restrict" }),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  descricao: text("descricao"),
  fichaTecnica: jsonb("ficha_tecnica").$type<FichaTecnica>(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Produto = typeof produtos.$inferSelect;
export type NovoProduto = typeof produtos.$inferInsert;

export const produtosImagens = pgTable("produtos_imagens", {
  id: uuid("id").primaryKey().defaultRandom(),
  produtoId: uuid("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  ordem: integer("ordem").notNull().default(0),
});

export type ProdutoImagem = typeof produtosImagens.$inferSelect;

export const tipoOpcao = pgEnum("tipo_opcao", ["texto", "cor"]);

/** Valor de um eixo. `hex` só é preenchido quando a opção é do tipo `cor`. */
export interface ValorOpcao {
  valor: string;
  hex?: string;
}

export const produtosOpcoes = pgTable(
  "produtos_opcoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    tipo: tipoOpcao("tipo").notNull().default("texto"),
    ordem: integer("ordem").notNull().default(0),
    valores: jsonb("valores").$type<ValorOpcao[]>().notNull().default([]),
  },
  (t) => ({
    // Dois eixos "Cor" no mesmo produto tornariam a combinação ambígua.
    nomeUnicoPorProduto: unique("produtos_opcoes_produto_nome_unq").on(t.produtoId, t.nome),
  }),
);

export type ProdutoOpcao = typeof produtosOpcoes.$inferSelect;

/** Valores escolhidos por eixo: `{ "Cor": "Preto", "Tamanho": "P" }`. */
export type Combinacao = Record<string, string>;

export const produtosVariacoes = pgTable(
  "produtos_variacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    // Preço cheio. Desconto é responsabilidade do módulo de Promoções, que
    // aplica regra e validade por cima deste valor — nunca sobrescrevendo-o.
    preco: numeric("preco", { precision: 10, scale: 2 }).notNull(),
    estoque: integer("estoque").notNull().default(0),
    // Reservado no checkout e liberado na expiração (Fase 4).
    // Disponível para venda = estoque - reservado.
    reservado: integer("reservado").notNull().default(0),
    imagemUrl: text("imagem_url"),
    combinacao: jsonb("combinacao").$type<Combinacao>().notNull(),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => ({
    combinacaoUnicaPorProduto: unique("produtos_variacoes_produto_combinacao_unq").on(
      t.produtoId,
      t.combinacao,
    ),
    // Como o SKU deriva só dos valores dos eixos, "PPreto" se repete entre
    // produtos diferentes. A unicidade é por produto, não global.
    skuUnicoPorProduto: unique("produtos_variacoes_produto_sku_unq").on(t.produtoId, t.sku),
  }),
);

export type ProdutoVariacao = typeof produtosVariacoes.$inferSelect;
export type NovaProdutoVariacao = typeof produtosVariacoes.$inferInsert;

/**
 * Banners da home. Arte pronta enviada pelo lojista — o sistema não sobrepõe
 * texto. A imagem mobile é separada porque a proporção larga de um banner de
 * desktop fica ruim no celular; quando ausente, cai para a de desktop.
 */
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  imagemUrl: text("imagem_url").notNull(),
  imagemMobileUrl: text("imagem_mobile_url"),
  // Destino do clique. Nulo = banner não é clicável.
  link: text("link"),
  // Texto alternativo para acessibilidade e SEO.
  alt: text("alt"),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Banner = typeof banners.$inferSelect;
export type NovoBanner = typeof banners.$inferInsert;

/**
 * Identidade e contato da loja. Linha única (1 loja por deploy) — o app sempre
 * lê/escreve o primeiro registro. O nome cadastrado substitui "Hermess" em toda
 * a UI; ausência de registro cai no padrão do template.
 */
export const lojaInfo = pgTable("loja_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  logoUrl: text("logo_url"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  instagram: text("instagram"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type LojaInfo = typeof lojaInfo.$inferSelect;
export type NovaLojaInfo = typeof lojaInfo.$inferInsert;

export const statusPedido = pgEnum("status_pedido", [
  "aguardando_pagamento",
  "pago",
  "cancelado",
  "expirado",
]);

/**
 * Pedido de retirada. Nasce `aguardando_pagamento` reservando estoque das
 * variações; o pagamento (Fase 5) o move para `pago`. Sem pagamento até
 * `expiraEm`, a varredura preguiçosa devolve a reserva e o marca `expirado`.
 */
export const pedidos = pgTable(
  "pedidos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Número curto e legível para o cliente e o balcão. Sequência própria.
    numero: serial("numero").notNull().unique(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    // Snapshot do contato no momento da compra — o profile pode mudar depois.
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    status: statusPedido("status").notNull().default("aguardando_pagamento"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Varredura de expiração filtra por (status, expiraEm).
    statusExpiraIdx: index("pedidos_status_expira_idx").on(t.status, t.expiraEm),
    clienteIdx: index("pedidos_cliente_idx").on(t.clienteId),
  }),
);

export type Pedido = typeof pedidos.$inferSelect;
export type NovoPedido = typeof pedidos.$inferInsert;

/**
 * Item do pedido com preço e combinação congelados na compra — alterações
 * futuras no produto não reescrevem o histórico. `variacaoId` vira nulo se a
 * variação for excluída; a reserva já terá sido resolvida antes disso.
 */
export const pedidoItens = pgTable("pedido_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  variacaoId: uuid("variacao_id").references(() => produtosVariacoes.id, { onDelete: "set null" }),
  nomeProduto: text("nome_produto").notNull(),
  sku: text("sku").notNull(),
  combinacao: jsonb("combinacao").$type<Combinacao>().notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  quantidade: integer("quantidade").notNull(),
});

export type PedidoItem = typeof pedidoItens.$inferSelect;
export type NovoPedidoItem = typeof pedidoItens.$inferInsert;
