# Hermess

Sistema genérico de venda de produtos: catálogo com variações, checkout, pagamentos (Pix, cartão de crédito e débito via Mercado Pago), painel administrativo com dashboard e relatórios.

O nome vem de Hermes, deus grego do comércio e das trocas.

Construído como **template reutilizável**, modelo **1 loja por deploy**: cada cliente é um novo projeto Vercel + novo Supabase rodando o mesmo código. A identidade da loja (nome, logo, contatos) é configurável dentro do sistema, sem tocar em código.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict): frontend + API (Route Handlers)
- **TailwindCSS**: tema escuro, mobile-first
- **Drizzle ORM** + **Supabase** (Postgres, Auth, Storage)
- **TanStack Table**: listagens com paginação server-side, busca e filtros por URL
- **Mercado Pago**: Pix, crédito e débito
- **Deploy**: Vercel + Supabase

## Status

Em definição de escopo. O roadmap por fases entra aqui assim que fechado.
