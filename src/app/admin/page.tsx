import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Clock,
  Coins,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/cn";
import { resumoDashboard } from "@/features/dashboard/actions";
import { PeriodoSelector } from "@/features/dashboard/periodo-selector";
import { STATUS_LABEL, STATUS_TONE } from "@/features/pedidos/status";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const METODO_LABEL: Record<string, string> = {
  online: "Online (Mercado Pago)",
  dinheiro: "Dinheiro",
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  balcao: "Balcão",
};

function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null;
  return ((atual - anterior) / anterior) * 100;
}

function ddmm(dia: string): string {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

/** Valor curto para o eixo do gráfico: R$ 1,6k, R$ 320. */
function compacto(v: number): string {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k` : `R$ ${Math.round(v)}`;
}

function Delta({ pct, base }: { pct: number | null; base: string }) {
  if (pct === null) return <span className="text-xs text-muted2">sem base de comparação</span>;
  const positivo = pct >= 0;
  const Icone = positivo ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          positivo ? "text-emerald-600" : "text-red-600",
        )}
      >
        <Icone className="h-3.5 w-3.5" />
        {Math.abs(pct).toFixed(0)}%
      </span>
      vs. {base}
    </span>
  );
}

function Kpi({
  icon: Icon,
  rotulo,
  valor,
  delta,
}: {
  icon: typeof TrendingUp;
  rotulo: string;
  valor: string;
  delta?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-center gap-2 text-muted2">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
        <span className="text-[11px] font-bold uppercase tracking-wider">{rotulo}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{valor}</p>
      {delta && <p className="mt-1">{delta}</p>}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">{titulo}</p>
      {children}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string; de?: string; ate?: string };
}) {
  await requireAdmin();
  const r = await resumoDashboard(searchParams);

  const maxDia = Math.max(1, ...r.porDia.map((d) => d.total));
  const totalCanais = r.porCanal.online + r.porCanal.pdv;
  const pctOnline = totalCanais > 0 ? (r.porCanal.online / totalCanais) * 100 : 0;
  const maxMetodo = Math.max(1, ...r.porMetodo.map((m) => m.total));
  const margemPct = r.faturamento > 0 ? (r.margem / r.faturamento) * 100 : 0;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">Visão geral das vendas · {r.label.toLowerCase()}.</p>
      </div>
      <div className="mt-4">
        <PeriodoSelector />
      </div>

      {/* Alertas acionáveis */}
      {(r.aguardando > 0 || r.estoqueBaixo > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {r.aguardando > 0 && (
            <Link
              href="/admin/pedidos?status=aguardando_pagamento"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 transition hover:border-amber-500"
            >
              <Clock className="h-4 w-4" />
              <strong>{r.aguardando}</strong> aguardando pagamento
            </Link>
          )}
          {r.estoqueBaixo > 0 && (
            <Link
              href="/admin/estoque?baixo=1"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 transition hover:border-amber-500"
            >
              <Boxes className="h-4 w-4" />
              <strong>{r.estoqueBaixo}</strong> com estoque baixo
            </Link>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          rotulo="Faturamento"
          valor={formatBRL(r.faturamento)}
          delta={<Delta pct={variacao(r.faturamento, r.faturamentoAnterior)} base={r.labelAnterior} />}
        />
        <Kpi
          icon={Receipt}
          rotulo="Vendas"
          valor={String(r.vendas)}
          delta={<Delta pct={variacao(r.vendas, r.vendasAnterior)} base={r.labelAnterior} />}
        />
        <Kpi
          icon={Coins}
          rotulo="Ticket médio"
          valor={formatBRL(r.ticketMedio)}
          delta={<Delta pct={variacao(r.ticketMedio, r.ticketMedioAnterior)} base={r.labelAnterior} />}
        />
        <Kpi
          icon={Package}
          rotulo="Margem"
          valor={formatBRL(r.margem)}
          delta={
            <span className="text-xs text-muted">
              {margemPct.toFixed(0)}% · custo {formatBRL(r.custo)}
            </span>
          }
        />
      </div>

      {/* Pedidos por status */}
      {r.porStatus.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted2">Pedidos</span>
          {r.porStatus.map((s) => (
            <span key={s.status} className="inline-flex items-center gap-1.5">
              <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              <strong className="text-sm text-ink">{s.quantidade}</strong>
            </span>
          ))}
          <span className="ml-auto text-sm text-muted">
            {r.itensVendidos} itens vendidos
          </span>
        </div>
      )}

      {/* Gráfico de faturamento por dia */}
      <div className="mt-6">
        <Secao titulo="Faturamento por dia">
          {r.porDia.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">Sem vendas no período.</p>
          ) : (
            <div className="mt-5 flex gap-2">
              {/* Eixo Y (valores) */}
              <div className="flex h-52 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-muted2">
                <span>{compacto(maxDia)}</span>
                <span>{compacto(maxDia / 2)}</span>
                <span>R$ 0</span>
              </div>
              {/* Barras + eixo X (datas) */}
              <div className="min-w-0 flex-1">
                <div className="flex h-52 items-end gap-px border-b border-l border-line pl-1 sm:gap-1">
                  {r.porDia.map((d) => (
                    <div
                      key={d.dia}
                      className="group relative flex h-full flex-1 flex-col justify-end"
                      title={`${ddmm(d.dia)}: ${formatBRL(d.total)} · ${d.vendas} venda(s)`}
                    >
                      <div
                        className="w-full rounded-t bg-ink/80 transition group-hover:bg-ink"
                        style={{ height: `${Math.max(2, (d.total / maxDia) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between pl-1 text-[10px] tabular-nums text-muted2">
                  <span>{ddmm(r.porDia[0].dia)}</span>
                  {r.porDia.length > 2 && (
                    <span>{ddmm(r.porDia[Math.floor(r.porDia.length / 2)].dia)}</span>
                  )}
                  <span>{ddmm(r.porDia[r.porDia.length - 1].dia)}</span>
                </div>
              </div>
            </div>
          )}
        </Secao>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Por método */}
        <Secao titulo="Por método de pagamento">
          {r.porMetodo.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Sem vendas no período.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {r.porMetodo.map((m) => (
                <li key={m.metodo}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{METODO_LABEL[m.metodo] ?? m.metodo}</span>
                    <span className="font-semibold text-ink">
                      {formatBRL(m.total)}{" "}
                      <span className="text-xs font-normal text-muted2">· {m.vendas}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${(m.total / maxMetodo) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {/* Por canal */}
        <Secao titulo="Por canal">
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Loja online</span>
                <span className="font-semibold text-ink">{formatBRL(r.porCanal.online)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-ink" style={{ width: `${pctOnline}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Balcão (PDV)</span>
                <span className="font-semibold text-ink">{formatBRL(r.porCanal.pdv)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-brand" style={{ width: `${100 - pctOnline}%` }} />
              </div>
            </div>
          </div>
        </Secao>
      </div>

      {/* Ranking de produtos */}
      <div className="mt-6">
        <Secao titulo="Produtos mais vendidos">
          {r.topProdutos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Sem vendas no período.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {r.topProdutos.map((p, i) => (
                <li key={p.nome} className="flex items-center gap-4 py-2.5">
                  <span className="w-5 shrink-0 text-center font-display text-lg font-extrabold text-muted2">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.nome}</span>
                  <span className="shrink-0 text-sm text-muted">{p.quantidade} un.</span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold text-ink">
                    {formatBRL(p.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </>
  );
}
