import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { getLojaBrand } from "@/lib/loja";
import { listarCategoriasComProduto, listarVitrine } from "@/features/vitrine/queries";
import { listarBannersAtivos } from "@/features/aparencia/queries";
import { BannerHero } from "@/features/aparencia/banner-hero";
import { ProdutoCard } from "@/features/vitrine/produto-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [novidades, categorias, marca, banners] = await Promise.all([
    listarVitrine({ ordem: "recentes" }),
    listarCategoriasComProduto(),
    getLojaBrand(),
    listarBannersAtivos(),
  ]);

  // Destaque com a foto do produto mais recente, quando houver.
  const destaque = novidades.itens.find((p) => p.capa);

  return (
    <div>
      {banners.length > 0 ? (
        // Arte pronta do lojista tem prioridade sobre o hero tipográfico.
        <BannerHero banners={banners} />
      ) : (
        // Hero editorial: a foto ocupa a largura, a marca por cima. Sem foto,
        // um bloco tipográfico - nunca uma caixa vazia.
        <section className="relative flex min-h-[62vh] items-end overflow-hidden border-b border-line sm:min-h-[70vh]">
          {destaque?.capa ? (
            <>
              <Image
                src={destaque.capa}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}

          <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
            <p
              className={cn(
                "mb-2 text-xs font-semibold uppercase tracking-[0.2em]",
                destaque?.capa ? "text-white/80" : "text-muted",
              )}
            >
              {marca.nome}
            </p>
            <h1
              className={cn(
                "max-w-2xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl",
                destaque?.capa ? "text-white" : "text-ink",
              )}
            >
              Nova
              <br />
              coleção
            </h1>
            <Link
              href="/produtos"
              className={cn(
                "mt-6 inline-flex items-center rounded-full px-7 py-3 font-display text-sm font-bold uppercase tracking-wide transition",
                destaque?.capa
                  ? "bg-white text-ink hover:bg-white/90"
                  : "bg-ink text-bg hover:bg-brand-dark",
              )}
            >
              Comprar agora
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {categorias.length > 0 && (
          <section className="mb-16">
            <div className="flex flex-wrap gap-2">
              {categorias.map((categoria) => (
                <Link
                  key={categoria.slug}
                  href={`/categoria/${categoria.slug}`}
                  className="rounded-full border border-line px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-ink transition hover:border-ink hover:bg-ink hover:text-bg"
                >
                  {categoria.nome}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
              Novidades
            </h2>
            <Link
              href="/produtos"
              className="shrink-0 text-sm font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline"
            >
              Ver tudo
            </Link>
          </div>

          {novidades.itens.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line2 px-6 py-20 text-center text-sm text-muted">
              Nenhum produto publicado ainda. Cadastre um produto ativo no painel.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {novidades.itens.map((produto, i) => (
                <ProdutoCard key={produto.id} produto={produto} prioridade={i < 4} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
