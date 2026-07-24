-- Tema é lido apenas no servidor, pelos layouts, via Drizzle com o papel
-- postgres (que ignora RLS). Nenhum acesso pela anon/authenticated key: RLS
-- ativo sem policy permissiva, deny por padrão.
ALTER TABLE "tema_config" ENABLE ROW LEVEL SECURITY;
