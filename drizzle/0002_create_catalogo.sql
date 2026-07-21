CREATE TYPE "public"."tipo_opcao" AS ENUM('texto', 'cor');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"tabela_medidas" jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descricao" text,
	"tabela_medidas" jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "produtos_imagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"url" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos_opcoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_opcao" DEFAULT 'texto' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"valores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "produtos_opcoes_produto_nome_unq" UNIQUE("produto_id","nome")
);
--> statement-breakpoint
CREATE TABLE "produtos_variacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"preco_comparativo" numeric(10, 2),
	"estoque" integer DEFAULT 0 NOT NULL,
	"reservado" integer DEFAULT 0 NOT NULL,
	"imagem_url" text,
	"combinacao" jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "produtos_variacoes_sku_unique" UNIQUE("sku"),
	CONSTRAINT "produtos_variacoes_produto_combinacao_unq" UNIQUE("produto_id","combinacao")
);
--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_imagens" ADD CONSTRAINT "produtos_imagens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_opcoes" ADD CONSTRAINT "produtos_opcoes_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_variacoes" ADD CONSTRAINT "produtos_variacoes_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;