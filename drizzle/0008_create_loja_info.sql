CREATE TABLE "loja_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"logo_url" text,
	"telefone" text,
	"endereco" text,
	"instagram" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
