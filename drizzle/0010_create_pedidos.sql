CREATE TYPE "public"."status_pedido" AS ENUM('aguardando_pagamento', 'pago', 'cancelado', 'expirado');--> statement-breakpoint
CREATE TABLE "pedido_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"variacao_id" uuid,
	"nome_produto" text NOT NULL,
	"sku" text NOT NULL,
	"combinacao" jsonb NOT NULL,
	"preco_unitario" numeric(10, 2) NOT NULL,
	"quantidade" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" serial NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"status" "status_pedido" DEFAULT 'aguardando_pagamento' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_variacao_id_produtos_variacoes_id_fk" FOREIGN KEY ("variacao_id") REFERENCES "public"."produtos_variacoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_profiles_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedidos_status_expira_idx" ON "pedidos" USING btree ("status","expira_em");--> statement-breakpoint
CREATE INDEX "pedidos_cliente_idx" ON "pedidos" USING btree ("cliente_id");