CREATE TYPE "public"."status_usuario" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."tipo_usuario" AS ENUM('admin', 'cliente');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"telefone" text,
	"tipo" "tipo_usuario" DEFAULT 'cliente' NOT NULL,
	"status" "status_usuario" DEFAULT 'ativo' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
