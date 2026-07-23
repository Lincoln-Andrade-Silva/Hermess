"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { Button, FormError, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { finalizarVendaPdv, listarVariacoesPdv, type ListagemPdv, type VariacaoPdv } from "./actions";

interface ItemVenda {
  variacaoId: string;
  produtoNome: string;
  sku: string;
  preco: string;
  quantidade: number;
  disponivel: number;
}

const METODOS = [
  { valor: "dinheiro", label: "Dinheiro" },
  { valor: "pix", label: "Pix" },
  { valor: "credito", label: "Crédito" },
  { valor: "debito", label: "Débito" },
] as const;

const LISTA_VAZIA: ListagemPdv = { itens: [], page: 1, pageCount: 1 };

export function PdvClient({ categorias }: { categorias: { value: string; label: string }[] }) {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [page, setPage] = useState(1);
  const [versao, setVersao] = useState(0);
  const [lista, setLista] = useState<ListagemPdv>(LISTA_VAZIA);
  const [carregando, buscar] = useTransition();

  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [nome, setNome] = useState("");
  const [metodo, setMetodo] = useState<(typeof METODOS)[number]["valor"]>("dinheiro");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);
  const [finalizando, finalizar] = useTransition();

  useEffect(() => {
    const atraso = q.trim() ? 300 : 0;
    const t = setTimeout(() => {
      buscar(async () =>
        setLista(
          await listarVariacoesPdv({
            q: q.trim() || undefined,
            categoria: categoria === "todas" ? undefined : categoria,
            page,
          }),
        ),
      );
    }, atraso);
    return () => clearTimeout(t);
  }, [q, categoria, page, versao]);

  function adicionar(v: VariacaoPdv) {
    setSucesso(null);
    setItens((prev) => {
      const existente = prev.find((i) => i.variacaoId === v.variacaoId);
      if (existente) {
        return prev.map((i) =>
          i.variacaoId === v.variacaoId
            ? { ...i, quantidade: Math.min(i.disponivel, i.quantidade + 1) }
            : i,
        );
      }
      return [
        ...prev,
        {
          variacaoId: v.variacaoId,
          produtoNome: v.produtoNome,
          sku: v.sku,
          preco: v.preco,
          quantidade: 1,
          disponivel: v.disponivel,
        },
      ];
    });
  }

  function mudarQtd(variacaoId: string, delta: number) {
    setItens((prev) =>
      prev.flatMap((i) => {
        if (i.variacaoId !== variacaoId) return [i];
        const qtd = i.quantidade + delta;
        if (qtd <= 0) return [];
        return [{ ...i, quantidade: Math.min(i.disponivel, qtd) }];
      }),
    );
  }

  const total = itens.reduce((acc, i) => acc + Number(i.preco) * i.quantidade, 0);

  function concluir() {
    setErro(null);
    finalizar(async () => {
      const r = await finalizarVendaPdv({
        nome: nome.trim() || undefined,
        metodoPagamento: metodo,
        itens: itens.map((i) => ({ variacaoId: i.variacaoId, quantidade: i.quantidade })),
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setSucesso(r.numero);
      setItens([]);
      setNome("");
      setVersao((v) => v + 1); // recarrega o estoque na lista
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted2" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar produto ou SKU"
              className="h-[50px] pl-10"
            />
          </div>
          <Select
            value={categoria}
            onChange={(v) => {
              setCategoria(v);
              setPage(1);
            }}
            options={[{ value: "todas", label: "Todas as categorias" }, ...categorias]}
            className="sm:w-52"
          />
        </div>

        <div
          className={cn(
            "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
            carregando && "opacity-50",
          )}
        >
          {lista.itens.map((v) => (
            <button
              key={v.variacaoId}
              type="button"
              onClick={() => adicionar(v)}
              className="flex items-center gap-4 rounded-2xl border border-line p-3.5 text-left transition hover:border-ink hover:shadow-sm"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                {v.imagem && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.imagem} alt="" className="h-full w-full object-cover object-top" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{v.produtoNome}</p>
                <p className="font-mono text-xs text-muted">{v.sku}</p>
                <p className="mt-1 text-lg font-bold text-ink">{formatBRL(v.preco)}</p>
                <p className="text-xs text-muted2">{v.disponivel} em estoque</p>
              </div>
              <Plus className="h-5 w-5 shrink-0 text-muted2" />
            </button>
          ))}
        </div>

        {lista.itens.length === 0 && !carregando && (
          <p className="mt-4 rounded-xl border border-dashed border-line2 px-4 py-10 text-center text-sm text-muted">
            Nenhum produto com saldo encontrado.
          </p>
        )}

        {lista.pageCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 transition hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span>
              {page} de {lista.pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lista.pageCount, p + 1))}
              disabled={page >= lista.pageCount}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 transition hover:bg-surface disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carrinho da venda */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <ShoppingBag className="h-5 w-5 text-muted" />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-ink">
              Venda
            </h2>
          </div>

          {itens.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              {sucesso ? (
                <div className="space-y-3">
                  <Check className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="font-medium text-ink">Venda #{sucesso} registrada!</p>
                  <Link
                    href={`/admin/pedidos/${sucesso}`}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Ver no painel
                  </Link>
                </div>
              ) : (
                "Toque num produto para adicionar à venda."
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {itens.map((i) => (
                  <li key={i.variacaoId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{i.produtoNome}</p>
                      <p className="font-mono text-xs text-muted">{i.sku}</p>
                    </div>
                    <div className="flex items-center rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() => mudarQtd(i.variacaoId, -1)}
                        aria-label="Menos"
                        className="p-1.5 text-muted transition hover:text-ink"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{i.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => mudarQtd(i.variacaoId, 1)}
                        disabled={i.quantidade >= i.disponivel}
                        aria-label="Mais"
                        className="p-1.5 text-muted transition hover:text-ink disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm font-medium text-ink">
                      {formatBRL(Number(i.preco) * i.quantidade)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItens((p) => p.filter((x) => x.variacaoId !== i.variacaoId))}
                      aria-label="Remover"
                      className="text-muted transition hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 border-t border-line p-4">
                <div className="flex items-center justify-between text-lg font-bold text-ink">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted2">
                    Pagamento
                  </p>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
                    {METODOS.map((m) => (
                      <button
                        key={m.valor}
                        type="button"
                        onClick={() => setMetodo(m.valor)}
                        className={cn(
                          "rounded-lg py-2 text-sm font-medium transition",
                          metodo === m.valor ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do cliente (opcional)"
                />

                {erro && <FormError>{erro}</FormError>}

                <Button className="w-full py-3" onClick={concluir} disabled={finalizando}>
                  {finalizando ? "Registrando..." : `Finalizar · ${formatBRL(total)}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
