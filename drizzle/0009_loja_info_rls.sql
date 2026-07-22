-- Identidade da loja (nome, logo, contato, endereço) aparece na vitrine pública,
-- logo é leitura livre. O app escreve via Drizzle com o papel postgres, que ignora
-- RLS; esta policy protege o acesso direto pela anon key.
ALTER TABLE "loja_info" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

GRANT SELECT ON "loja_info" TO anon, authenticated;
--> statement-breakpoint

CREATE POLICY "loja_info_select_publico" ON "loja_info"
  FOR SELECT TO anon, authenticated
  USING (true);
