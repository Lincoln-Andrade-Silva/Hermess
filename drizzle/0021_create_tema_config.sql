CREATE TYPE "public"."escopo_tema" AS ENUM('vitrine', 'admin');--> statement-breakpoint
CREATE TYPE "public"."modo_tema" AS ENUM('claro', 'escuro', 'personalizado');--> statement-breakpoint
CREATE TABLE "tema_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escopo" "escopo_tema" NOT NULL,
	"tema" "modo_tema" DEFAULT 'claro' NOT NULL,
	"cor_bg" text,
	"cor_surface" text,
	"cor_ink" text,
	"cor_line" text,
	"cor_brand" text,
	"fonte_corpo" text DEFAULT 'dm-sans' NOT NULL,
	"fonte_titulo" text DEFAULT 'barlow-condensed' NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tema_config_escopo_unq" UNIQUE("escopo")
);
