-- Config de pagamento guarda segredos (access token, webhook secret): nenhum
-- acesso pela anon/authenticated key. RLS ativo sem policy permissiva (deny por
-- padrão); o app lê via Drizzle com o papel postgres, que ignora RLS.
ALTER TABLE "pagamento_config" ENABLE ROW LEVEL SECURITY;
