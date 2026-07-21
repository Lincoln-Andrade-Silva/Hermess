# Hermess

Sistema genérico de venda de produtos: catálogo com variações, vitrine pública, checkout com pagamento online (Pix, crédito e débito via Mercado Pago), controle de estoque e painel administrativo com dashboard e relatórios.

O nome vem de Hermes, deus grego do comércio e das trocas.

Construído como **template reutilizável**, modelo **1 loja por deploy**: cada cliente é um novo projeto Vercel + novo Supabase rodando o mesmo código. A identidade da loja (nome, logo, contatos) é configurável dentro do sistema, sem tocar em código.

Primeiro cliente: loja de roupas. O modelo de variações e a vitrine foram desenhados em cima desse caso (Cor × Tamanho, swatch de cor, tabela de medidas), mas nada no schema é específico de moda.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict): frontend + API (Route Handlers)
- **TailwindCSS**: tema claro e quase acromático, mobile-first. Barlow Condensed (títulos) + DM Sans (corpo)
- **Drizzle ORM** + **Supabase** (Postgres, Auth, Storage)
- **TanStack Table**: listagens com paginação server-side, busca e filtros por URL
- **Mercado Pago Checkout Pro**: Pix, crédito e débito
- **Deploy**: Vercel + Supabase

## Setup

```bash
npm install
cp .env.example .env    # preencha as credenciais do Supabase
npm run db:check        # testa a conexão com o Postgres
npm run db:migrate      # cria as tabelas, RLS e triggers
npm run seed:admin      # cria o admin padrão (admin@hermess.com / 123456)
npm run dev             # http://localhost:3000
```

> Primeiro passo ao reimplantar para um novo cliente: rodar o seed e **trocar a senha do admin**.

| Comando | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:check` | Testa conexão com o Postgres |
| `npm run db:generate` | Gera migrations a partir do schema Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run seed:admin` | Cria o admin padrão |

## Decisões de arquitetura

**Tenancy** — uma loja por deploy. Sem `tenant_id`, sem RLS por tenant. Reuso direto do modelo do Chronoss.

**Variações** — eixos declarados (Cor, Tamanho) e variações geradas a partir deles, com a combinação guardada em `jsonb`. Escolhido sobre a normalização completa por cortar de 5 tabelas pra 3 e simplificar muito o admin. O custo aceito: o valor da combinação não tem integridade referencial e filtrar por cor na vitrine usa operador JSON em vez de join indexado — tolerável num catálogo de loja única.

Cada eixo tem um `tipo` (`texto` | `cor`), que é o que permite renderizar cor como swatch e trocar a galeria do produto quando o cliente seleciona.

```
produtos             id, categoria_id, nome, descricao, preco_base, ativo
produtos_imagens     id, produto_id, url, ordem
produtos_opcoes      id, produto_id, nome, tipo, ordem, valores jsonb
produtos_variacoes   id, produto_id, sku, preco, estoque, reservado,
                     imagem_url, ativo, combinacao jsonb
```

**Estoque** — reserva no checkout com expiração. Criar o pedido incrementa `reservado` na variação; o pagamento aprovado converte reserva em baixa de `estoque`; pedido não pago expira em 30 min (cron na Vercel) e devolve a reserva. Disponível para venda = `estoque - reservado`. Escolhido porque Pix e Checkout Pro são assíncronos: baixar só na aprovação deixa dois clientes pagarem a mesma última peça.

**Pagamento** — Checkout Pro, idêntico ao Chronoss. Credenciais no banco (configuráveis no admin), não no `.env`. Webhook valida HMAC do `x-signature` e **nunca confia no payload**: consulta o pagamento no MP e reflete no domínio. `external_reference` no formato `clienteId:pedidoId`.

**Entrega** — só retirada no local. Sem frete, sem endereço de entrega, sem integração de logística. Envio fica pra depois do MVP.

**Deploy** — `vercel.json` fixa `framework: nextjs` e a região `gru1` (São Paulo). O preset é declarado no repositório porque a detecção automática falha quando o projeto é criado manualmente na Vercel, e o erro que aparece (`No Output Directory named "public"`) não sugere a causa. A região importa: o Postgres fica em São Paulo, e função em Washington paga a latência do Atlântico em toda query.

No deploy, `DATABASE_URL` precisa apontar para o **Transaction Pooler** (porta 6543), não para a conexão direta usada em dev — cada função serverless abre a própria conexão e o pool do free tier esgota rápido.

**Auth** — cadastro obrigatório pra comprar (Supabase Auth via `@supabase/ssr`, papéis em `profiles.tipo`). Registro cria o usuário já confirmado via `service_role`, sem depender de SMTP.

Como a vitrine é pública, o middleware inverte a lógica do Chronoss: em vez de listar as rotas abertas, lista as **fechadas** (`/admin`, `/checkout`, `/meus-pedidos`, `/minha-conta`). Tudo que não casa com esses prefixos é acessível sem sessão.

**Máquina de estados do pedido**

```
aguardando_pagamento ─┬─> pago ─> separando ─> pronto_para_retirada ─> retirado
                      ├─> expirado          (reserva devolvida pelo cron)
                      └─> cancelado
                    pago ─> estornado       (estorno no MP, reserva/estoque devolvidos)
```

## Roadmap (fases)

**Base**
- [x] **Fase 0**: Setup — Next.js, Tailwind, Drizzle, design system portado do Chronoss (`components/ui`, `DataTable` server-side, filtros por URL)
- [x] **Fase 1**: Auth — registro/login, `profiles` com tipo/status, proteção de rotas, seed admin, shell do painel

**Catálogo**
- [ ] **Fase 2**: Cadastro de produtos — categorias, produto, eixos de opção com tipo, geração de variações, galeria múltipla, tabela de medidas
- [ ] **Fase 3**: Vitrine pública — home, listagem com filtro por categoria/cor/tamanho/preço, página do produto com swatch trocando a galeria e tamanho esgotado visível

### Notas de vitrine (Fase 3)

Referência de layout: lojas streetwear BR (Monte Leste, Sometimes). O que herdar e o que corrigir.

**Herdar.** Imagem 3:4 com troca frente/verso no hover. Nome em duas linhas de altura fixa, para o card não dançar. Preço Pix em destaque, parcelamento em cinza abaixo. Badge de categoria com posição configurável no card. Tarja de avisos no topo (frete grátis, parcelamento) em marquee pausável no hover.

**Corrigir — são os erros que essas lojas cometem:**

O nome do produto vem concatenado com a variação ("Calça Baggy Oversized - ML Preto"), e a mesma peça em seis cores ocupa seis lugares na vitrine. A listagem deve agrupar por produto e mostrar as cores como swatches dentro de um card só.

Três badges disputam o mesmo card ("Lançamento" + "-14%" + "2 POR 269"). Limite: no máximo dois, com prioridade desconto > coleção.

A nota exibida no card é da loja, não do produto, o que infla todos para 4.9. Se entrar avaliação, é por produto — ou não entra.

**Consequência de schema:** o badge de "-14%" exige `preco_comparativo` em `produtos_variacoes` (o "de R$ X por R$ Y"), e o agrupamento por cor exige que a query de listagem já traga as variações agregadas. Ambos precisam nascer na Fase 2.

**Venda**
- [ ] **Fase 4**: Carrinho e checkout de retirada, com reserva de estoque
- [ ] **Fase 5**: Pagamento — Checkout Pro, webhook, reconciliação, estorno, cron de expiração
- [ ] **Fase 6**: Pedidos no admin — listagem, detalhe e máquina de estados
- [ ] **Fase 7**: PDV — venda de balcão lançada pelo admin

**Gestão**
- [ ] **Fase 8**: Estoque — entrada, movimentações e alerta de estoque baixo
- [ ] **Fase 9**: Dashboard — KPIs, gráficos e ranking de produtos, com filtro por período
- [ ] **Fase 10**: Relatórios — faturamento, produtos, métodos de pagamento e estoque
- [ ] **Fase 11**: Configurações — identidade da loja, credenciais do Mercado Pago, janela de retirada, usuários

**Entrega**
- [ ] **Fase 12**: Deploy (Vercel + Supabase + domínio)
- [ ] **Fase 13**: Checklist de reuso do template

### Fora do MVP

Frete e envio, cupons de desconto, avaliações de produto, lista de desejos, "avise-me quando chegar", multi-loja.
