CREATE TABLE "pagamento_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_token" text,
	"public_key" text,
	"webhook_secret" text,
	"site_url" text,
	"taxa_gateway" numeric(5, 2) DEFAULT '4.99' NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "gateway_pagamento_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "pendencia_estoque" boolean DEFAULT false NOT NULL;