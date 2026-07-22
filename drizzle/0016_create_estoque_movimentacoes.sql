CREATE TYPE "public"."tipo_movimentacao" AS ENUM('entrada', 'ajuste', 'venda', 'devolucao');--> statement-breakpoint
CREATE TABLE "estoque_movimentacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variacao_id" uuid NOT NULL,
	"tipo" "tipo_movimentacao" NOT NULL,
	"quantidade" integer NOT NULL,
	"estoque_resultante" integer NOT NULL,
	"motivo" text,
	"usuario_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loja_info" ADD COLUMN "estoque_minimo" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_variacao_id_produtos_variacoes_id_fk" FOREIGN KEY ("variacao_id") REFERENCES "public"."produtos_variacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_usuario_id_profiles_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estoque_mov_variacao_idx" ON "estoque_movimentacoes" USING btree ("variacao_id","criado_em");