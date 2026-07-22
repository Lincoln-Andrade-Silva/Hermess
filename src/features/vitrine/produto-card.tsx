import Link from "next/link";
import Image from "next/image";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ProdutoVitrine } from "./queries";

/**
 * Card da vitrine. Deliberadamente enxuto: foto dominante, nome e preço. As
 * cores viram swatches pequenos que só aparecem no hover — chips de tamanho
 * poluíam a grade e são informação de página de produto, não de listagem.
 */
export function ProdutoCard({ produto, prioridade }: { produto: ProdutoVitrine; prioridade?: boolean }) {
  const faixaDePreco = produto.precoMax !== produto.precoMin;

  return (
    <Link href={`/produto/${produto.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface">
        {produto.capa ? (
          <>
            <Image
              src={produto.capa}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={prioridade}
              className={cn(
                "object-cover object-top transition-all duration-700",
                produto.disponivel ? "group-hover:scale-105" : "opacity-70 grayscale",
                produto.verso && produto.disponivel && "group-hover:opacity-0",
              )}
            />
            {produto.verso && produto.disponivel && (
              <Image
                src={produto.verso}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="scale-105 object-cover object-top opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted2">
            sem imagem
          </div>
        )}

        {!produto.disponivel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-ink/15 bg-bg/85 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-ink backdrop-blur">
              Esgotado
            </span>
          </div>
        )}

        {produto.cores.length > 1 && produto.disponivel && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {produto.cores.slice(0, 5).map((cor) => (
              <span
                key={cor.valor}
                title={cor.valor}
                style={{ backgroundColor: cor.hex }}
                className="h-3.5 w-3.5 rounded-full border border-white/80 shadow"
              />
            ))}
            {produto.cores.length > 5 && (
              <span className="text-[10px] font-medium text-white drop-shadow">
                +{produto.cores.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="truncate font-display text-sm font-semibold uppercase tracking-wide text-ink transition-colors group-hover:text-muted">
          {produto.nome}
        </h3>
        <p className="mt-0.5 text-sm text-ink">
          {faixaDePreco && <span className="text-xs text-muted">a partir de </span>}
          <span className="font-semibold">{formatBRL(produto.precoMin)}</span>
        </p>
      </div>
    </Link>
  );
}
