import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listarCategoriasComProduto, listarVitrine } from "@/features/vitrine/queries";
import { ProdutoCard } from "@/features/vitrine/produto-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [novidades, categorias] = await Promise.all([
    listarVitrine({ ordem: "recentes" }),
    listarCategoriasComProduto(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {categorias.length > 0 && (
        <section className="mb-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categorias.slice(0, 4).map((categoria) => (
              <Link
                key={categoria.slug}
                href={`/categoria/${categoria.slug}`}
                className="group flex items-center justify-between rounded-xl border border-line px-5 py-4 transition hover:border-ink"
              >
                <span className="font-display text-lg font-extrabold uppercase tracking-wide text-ink">
                  {categoria.nome}
                </span>
                <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink sm:text-4xl">
            Novidades
          </h1>
          <Link
            href="/produtos"
            className="shrink-0 text-sm font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline"
          >
            Ver tudo
          </Link>
        </div>

        {novidades.itens.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line2 px-6 py-16 text-center text-sm text-muted">
            Nenhum produto publicado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {novidades.itens.map((produto, i) => (
              <ProdutoCard key={produto.id} produto={produto} prioridade={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
