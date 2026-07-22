-- Pedidos são privados: nenhum acesso pela anon/authenticated key. O RLS fica
-- ativo sem policy permissiva (deny por padrão); o app lê e escreve via Drizzle
-- com o papel postgres, que ignora RLS. Se um dia o cliente ler o próprio
-- pedido pelo client do Supabase, adiciona-se aqui uma policy por cliente_id.
ALTER TABLE "pedidos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "pedido_itens" ENABLE ROW LEVEL SECURITY;
