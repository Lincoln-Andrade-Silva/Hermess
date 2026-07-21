-- Índices das FKs: toda listagem do catálogo filtra por estas colunas.
CREATE INDEX IF NOT EXISTS "produtos_categoria_id_idx" ON "produtos" ("categoria_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "produtos_imagens_produto_id_idx" ON "produtos_imagens" ("produto_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "produtos_opcoes_produto_id_idx" ON "produtos_opcoes" ("produto_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "produtos_variacoes_produto_id_idx" ON "produtos_variacoes" ("produto_id");
--> statement-breakpoint

-- A vitrine lista produtos ativos ordenados por data; o índice parcial cobre
-- exatamente esse acesso sem carregar as linhas inativas.
CREATE INDEX IF NOT EXISTS "produtos_ativos_idx" ON "produtos" ("criado_em" DESC) WHERE "ativo";
--> statement-breakpoint

-- `atualizado_em` mantido pelo banco: qualquer caminho de escrita (app, SQL
-- manual, importação) fica correto sem depender da aplicação lembrar.
CREATE OR REPLACE FUNCTION public.touch_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS produtos_touch_atualizado_em ON "produtos";
--> statement-breakpoint

CREATE TRIGGER produtos_touch_atualizado_em
  BEFORE UPDATE ON "produtos"
  FOR EACH ROW EXECUTE FUNCTION public.touch_atualizado_em();
--> statement-breakpoint

-- Estoque e reserva nunca podem ficar negativos, e o reservado nunca pode
-- passar do estoque. Regra no banco porque a Fase 4 vai mexer nestes campos
-- de dois lugares (checkout e webhook) e a race condition mora exatamente aí.
ALTER TABLE "produtos_variacoes"
  ADD CONSTRAINT "produtos_variacoes_estoque_nao_negativo" CHECK ("estoque" >= 0);
--> statement-breakpoint

ALTER TABLE "produtos_variacoes"
  ADD CONSTRAINT "produtos_variacoes_reservado_valido"
  CHECK ("reservado" >= 0 AND "reservado" <= "estoque");
--> statement-breakpoint

-- Row Level Security. O app escreve via Drizzle com o papel `postgres`, que
-- ignora RLS; estas policies protegem o acesso direto pela anon key (PostgREST),
-- garantindo que o catálogo seja somente-leitura para o público.
ALTER TABLE "categorias" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "produtos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "produtos_imagens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "produtos_opcoes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "produtos_variacoes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

GRANT SELECT ON "categorias", "produtos", "produtos_imagens", "produtos_opcoes", "produtos_variacoes" TO anon, authenticated;
--> statement-breakpoint

CREATE POLICY "categorias_select_publico" ON "categorias"
  FOR SELECT TO anon, authenticated
  USING ("ativo");
--> statement-breakpoint

CREATE POLICY "produtos_select_publico" ON "produtos"
  FOR SELECT TO anon, authenticated
  USING ("ativo");
--> statement-breakpoint

CREATE POLICY "produtos_imagens_select_publico" ON "produtos_imagens"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM "produtos" p WHERE p."id" = "produto_id" AND p."ativo"));
--> statement-breakpoint

CREATE POLICY "produtos_opcoes_select_publico" ON "produtos_opcoes"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM "produtos" p WHERE p."id" = "produto_id" AND p."ativo"));
--> statement-breakpoint

-- Variação inativa some da vitrine mesmo com o produto ativo (cor descontinuada).
CREATE POLICY "produtos_variacoes_select_publico" ON "produtos_variacoes"
  FOR SELECT TO anon, authenticated
  USING ("ativo" AND EXISTS (SELECT 1 FROM "produtos" p WHERE p."id" = "produto_id" AND p."ativo"));
