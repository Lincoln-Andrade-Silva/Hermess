-- Banner ativo é leitura pública (aparece na home para qualquer visitante).
-- O app escreve via Drizzle com o papel postgres, que ignora RLS; esta policy
-- protege o acesso direto pela anon key.
ALTER TABLE "banners" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

GRANT SELECT ON "banners" TO anon, authenticated;
--> statement-breakpoint

CREATE POLICY "banners_select_publico" ON "banners"
  FOR SELECT TO anon, authenticated
  USING ("ativo");
