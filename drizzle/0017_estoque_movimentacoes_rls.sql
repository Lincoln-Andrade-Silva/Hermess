-- Movimentações de estoque são dados internos do admin: nenhum acesso pela
-- anon/authenticated key. RLS ativo sem policy permissiva (deny por padrão); o
-- app lê e escreve via Drizzle com o papel postgres, que ignora RLS.
ALTER TABLE "estoque_movimentacoes" ENABLE ROW LEVEL SECURITY;
