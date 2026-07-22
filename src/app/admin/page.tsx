import { BarChart3, Package, Receipt, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { resumoDashboard } from "@/features/dashboard/actions";
import { DashboardPeriodo } from "@/features/dashboard/dashboard-periodo";

export const dynamic = "force-dynamic";

function Kpi({
  icon: Icon,
  rotulo,
  valor,
  nota,
}: {
  icon: typeof BarChart3;
  rotulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-center gap-2 text-muted2">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
        <span className="text-[11px] font-bold uppercase tracking-wider">{rotulo}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{valor}</p>
      {nota && <p className="text-xs text-muted">{nota}</p>}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  await requireAdmin();
  const r = await resumoDashboard(searchParams.periodo);

  const maxDia = Math.max(1, ...r.porDia.map((d) => d.total));
  const totalCanais = r.porCanal.online + r.porCanal.pdv;
  const pctOnline = totalCanais > 0 ? (r.porCanal.online / totalCanais) * 100 : 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">Vendas dos últimos {r.dias} dias.</p>
        </div>
        <DashboardPeriodo />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={TrendingUp} rotulo="Faturamento" valor={formatBRL(r.faturamento)} />
        <Kpi icon={Receipt} rotulo="Vendas" valor={String(r.vendas)} />
        <Kpi icon={BarChart3} rotulo="Ticket médio" valor={formatBRL(r.ticketMedio)} />
        <Kpi icon={Package} rotulo="Itens vendidos" valor={String(r.itensVendidos)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Faturamento por dia */}
        <div className="rounded-2xl border border-line p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">
            Faturamento por dia
          </p>
          {r.porDia.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">Sem vendas no período.</p>
          ) : (
            <div className="mt-5 flex h-48 items-end gap-1">
              {r.porDia.map((d) => (
                <div key={d.dia} className="group relative flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-ink/85 transition hover:bg-ink"
                    style={{ height: `${Math.max(2, (d.total / maxDia) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-bg opacity-0 transition group-hover:opacity-100">
                    {formatBRL(d.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por canal */}
        <div className="rounded-2xl border border-line p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">Por canal</p>
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
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${100 - pctOnline}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking de produtos */}
      <div className="mt-6 rounded-2xl border border-line p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">
          Produtos mais vendidos
        </p>
        {r.topProdutos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Sem vendas no período.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {r.topProdutos.map((p, i) => (
              <li key={p.nome} className="flex items-center gap-4 py-3">
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
      </div>
    </>
  );
}
