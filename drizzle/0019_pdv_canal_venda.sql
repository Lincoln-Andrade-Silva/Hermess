CREATE TYPE "public"."canal_venda" AS ENUM('online', 'pdv');--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "cliente_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "canal" "canal_venda" DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "metodo_pagamento" text;