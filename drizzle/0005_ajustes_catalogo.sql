-- Desconto sai do cadastro do produto: vira responsabilidade do módulo de
-- Promoções, que aplica regra e validade sobre o preço cheio.
ALTER TABLE "produtos_variacoes" DROP COLUMN IF EXISTS "preco_comparativo";
--> statement-breakpoint

-- Ficha técnica passa a existir só no produto. Ter a mesma tabela na categoria
-- dobrava a manutenção e criava ambiguidade sobre a origem do que é exibido.
ALTER TABLE "categorias" DROP COLUMN IF EXISTS "ficha_tecnica";
--> statement-breakpoint

-- O SKU passa a derivar apenas dos valores dos eixos ("PPreto"), então ele se
-- repete entre produtos por construção. A unicidade global daria colisão no
-- segundo produto que tivesse Cor=Preto e Tamanho=P.
ALTER TABLE "produtos_variacoes" DROP CONSTRAINT IF EXISTS "produtos_variacoes_sku_unique";
--> statement-breakpoint

ALTER TABLE "produtos_variacoes"
  ADD CONSTRAINT "produtos_variacoes_produto_sku_unq" UNIQUE ("produto_id", "sku");
