-- "Tabela de medidas" amarrava o catálogo a vestuário. Vira ficha técnica
-- livre: matriz pura com título definido pelo lojista, servindo tanto para
-- roupa (Tamanho/Busto) quanto para qualquer outro produto (Modelo/Voltagem).
ALTER TABLE "categorias" ADD COLUMN IF NOT EXISTS "ficha_tecnica" jsonb;
--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "ficha_tecnica" jsonb;
--> statement-breakpoint

-- Converte o formato antigo ({colunas, linhas:[{tamanho,valores}]}) para a
-- matriz nova, promovendo "tamanho" a primeira coluna.
UPDATE "categorias" SET "ficha_tecnica" = jsonb_build_object(
  'titulo', 'Tabela de medidas',
  'colunas', '["Tamanho"]'::jsonb || coalesce("tabela_medidas"->'colunas', '[]'::jsonb),
  'linhas', coalesce((
    SELECT jsonb_agg(jsonb_build_array(l->>'tamanho') || coalesce(l->'valores', '[]'::jsonb))
    FROM jsonb_array_elements("tabela_medidas"->'linhas') l
  ), '[]'::jsonb)
) WHERE "tabela_medidas" IS NOT NULL;
--> statement-breakpoint

UPDATE "produtos" SET "ficha_tecnica" = jsonb_build_object(
  'titulo', 'Tabela de medidas',
  'colunas', '["Tamanho"]'::jsonb || coalesce("tabela_medidas"->'colunas', '[]'::jsonb),
  'linhas', coalesce((
    SELECT jsonb_agg(jsonb_build_array(l->>'tamanho') || coalesce(l->'valores', '[]'::jsonb))
    FROM jsonb_array_elements("tabela_medidas"->'linhas') l
  ), '[]'::jsonb)
) WHERE "tabela_medidas" IS NOT NULL;
--> statement-breakpoint

ALTER TABLE "categorias" DROP COLUMN IF EXISTS "tabela_medidas";
--> statement-breakpoint
ALTER TABLE "produtos" DROP COLUMN IF EXISTS "tabela_medidas";
