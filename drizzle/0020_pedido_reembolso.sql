CREATE TYPE "public"."reembolso_status" AS ENUM('nenhum', 'solicitado', 'aprovado', 'recusado');--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "reembolso" "reembolso_status" DEFAULT 'nenhum' NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "reembolso_motivo" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "reembolso_solicitado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "reembolso_resolvido_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "reembolso_estoque_pendente" boolean DEFAULT false NOT NULL;