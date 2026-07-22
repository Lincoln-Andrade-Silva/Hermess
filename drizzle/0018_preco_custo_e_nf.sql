ALTER TABLE "estoque_movimentacoes" ADD COLUMN "custo_unitario" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "estoque_movimentacoes" ADD COLUMN "nf" text;--> statement-breakpoint
ALTER TABLE "produtos_variacoes" ADD COLUMN "preco_custo" numeric(10, 2) DEFAULT '0' NOT NULL;