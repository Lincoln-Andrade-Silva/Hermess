import Link from "next/link";
import Image from "next/image";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ProdutoVitrine } from "./queries";

/**
 * Card da vitrine. Uma linha por produto — as cores viram swatches dentro do
 * card em vez de ocupar seis posições da grade, que é o erro mais caro das
 * lojas que serviram de referência.
 */
export function ProdutoCard({ produto, prioridade }: { produto: ProdutoVitrine; prioridade?: boolean }) {
  const faixaDePreco = produto.precoMax !== produto.precoMin;

  return (
    <Link href={`/produto/${produto.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface">
        {produto.capa ? (
          <>
            <Image
              src={produto.capa}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={prioridade}
              className={cn(
                "object-cover transition-opacity duration-500",
                produto.verso && "group-hover:opacity-0",
              )}
            />
            {/* Verso revelado no hover: em moda é o que mais move conversão. */}
            {produto.verso && (
              <Image
                src={produto.verso}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted2">
            sem imagem
          </div>
        )}

        {!produto.disponivel && (
          <span className="absolute left-3 top-3 rounded bg-ink/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-bg">
            Esgotado
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <h3 className="font-display text-[15px] font-semibold uppercase leading-tight tracking-wide text-ink">
          {produto.nome}
        </h3>

        <p className="text-sm font-semibold text-ink">
          {faixaDePreco && <span className="text-xs font-normal text-muted">a partir de </span>}
          {formatBRL(produto.precoMin)}
        </p>

        {produto.cores.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {produto.cores.slice(0, 5).map((cor) => (
              <span
                key={cor.valor}
                title={cor.valor}
                style={{ backgroundColor: cor.hex }}
                className="h-4 w-4 rounded-full border border-line2"
              />
            ))}
            {produto.cores.length > 5 && (
              <span className="text-[11px] text-muted">+{produto.cores.length - 5}</span>
            )}
          </div>
        )}

        {produto.tamanhos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {produto.tamanhos.map((tamanho) => (
              <span
                key={tamanho.valor}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[11px] font-medium",
                  tamanho.disponivel
                    ? "border-line2 text-muted"
                    : "border-line text-muted2 line-through",
                )}
              >
                {tamanho.valor}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
