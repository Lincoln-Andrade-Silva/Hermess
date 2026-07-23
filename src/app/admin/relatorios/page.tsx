import type { ReactNode } from "react";
import { PageHeader, UrlTabBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import { normalizarDias } from "@/lib/periodo";
import { DashboardPeriodo } from "@/features/dashboard/dashboard-periodo";
import {
  relatorioEstoque,
  relatorioFaturamento,
  relatorioPagamentos,
  relatorioProdutos,
} from "@/features/relatorios/actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "faturamento", label: "Faturamento" },
  { key: "produtos", label: "Produtos" },
  { key: "pagamentos", label: "Pagamentos" },
  { key: "estoque", label: "Estoque" },
] as const;

const METODO_LABEL: Record<string, string> = {
  online: "Loja online (Mercado Pago)",
  dinheiro: "Dinheiro",
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  balcao: "Balcão",
};

function ddmm(dia: string): string {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

function Cartao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted2">{rotulo}</p>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{valor}</p>
    </div>
  );
}

function Tabela({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-surface/40">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

const th = "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted2";
const thr = th.replace("text-left", "text-right");
const td = "px-4 py-3";
const tdr = "px-4 py-3 text-right tabular-nums";

async function Faturamento({ dias }: { dias: number }) {
  const r = await relatorioFaturamento(dias);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Cartao rotulo="Faturamento" valor={formatBRL(r.total)} />
        <Cartao rotulo="Custo" valor={formatBRL(r.custo)} />
        <Cartao rotulo="Margem" valor={formatBRL(r.margem)} />
        <Cartao rotulo="Vendas" valor={String(r.vendas)} />
        <Cartao rotulo="Ticket médio" valor={formatBRL(r.ticket)} />
      </div>
      {r.porDia.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line2 py-12 text-center text-sm text-muted">
          Sem vendas no período.
        </p>
      ) : (
        <Tabela
          head={
            <>
              <th className={th}>Dia</th>
              <th className={thr}>Vendas</th>
              <th className={thr}>Faturamento</th>
            </>
          }
        >
          {r.porDia.map((d) => (
            <tr key={d.dia}>
              <td className={td}>{ddmm(d.dia)}</td>
              <td className={tdr}>{d.vendas}</td>
              <td className={`${tdr} font-medium text-ink`}>{formatBRL(d.total)}</td>
            </tr>
          ))}
        </Tabela>
      )}
    </div>
  );
}

async function Produtos({ dias }: { dias: number }) {
  const linhas = await relatorioProdutos(dias);
  if (linhas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line2 py-12 text-center text-sm text-muted">
        Sem vendas no período.
      </p>
    );
  }
  return (
    <Tabela
      head={
        <>
          <th className={th}>Produto</th>
          <th className={thr}>Qtd</th>
          <th className={thr}>Faturamento</th>
          <th className={thr}>Custo</th>
          <th className={thr}>Margem</th>
          <th className={thr}>Margem %</th>
        </>
      }
    >
      {linhas.map((p) => {
        const margem = p.faturamento - p.custo;
        const margemPct = p.faturamento > 0 ? (margem / p.faturamento) * 100 : 0;
        return (
          <tr key={p.nome}>
            <td className={`${td} font-medium text-ink`}>{p.nome}</td>
            <td className={tdr}>{p.quantidade}</td>
            <td className={tdr}>{formatBRL(p.faturamento)}</td>
            <td className={`${tdr} text-muted`}>{formatBRL(p.custo)}</td>
            <td className={`${tdr} font-medium ${margem >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatBRL(margem)}
            </td>
            <td className={`${tdr} ${margem >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {margemPct.toFixed(0)}%
            </td>
          </tr>
        );
      })}
    </Tabela>
  );
}

async function Pagamentos({ dias }: { dias: number }) {
  const linhas = await relatorioPagamentos(dias);
  const total = linhas.reduce((a, l) => a + l.total, 0);
  if (linhas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line2 py-12 text-center text-sm text-muted">
        Sem vendas no período.
      </p>
    );
  }
  return (
    <Tabela
      head={
        <>
          <th className={th}>Método</th>
          <th className={thr}>Vendas</th>
          <th className={thr}>Total</th>
          <th className={thr}>%</th>
        </>
      }
    >
      {linhas.map((l) => (
        <tr key={l.metodo}>
          <td className={`${td} font-medium text-ink`}>{METODO_LABEL[l.metodo] ?? l.metodo}</td>
          <td className={tdr}>{l.vendas}</td>
          <td className={`${tdr} font-medium text-ink`}>{formatBRL(l.total)}</td>
          <td className={`${tdr} text-muted`}>
            {total > 0 ? `${Math.round((l.total / total) * 100)}%` : "—"}
          </td>
        </tr>
      ))}
    </Tabela>
  );
}

async function Estoque() {
  const r = await relatorioEstoque();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Cartao rotulo="Valor em estoque" valor={formatBRL(r.valorEmEstoque)} />
        <Cartao rotulo="Peças" valor={String(r.totalPecas)} />
        <Cartao rotulo="Estoque baixo" valor={String(r.variacoesBaixo)} />
        <Cartao rotulo="Esgotadas" valor={String(r.esgotadas)} />
      </div>
      {r.porCategoria.length > 0 && (
        <Tabela
          head={
            <>
              <th className={th}>Categoria</th>
              <th className={thr}>Peças</th>
              <th className={thr}>Valor de custo</th>
            </>
          }
        >
          {r.porCategoria.map((c) => (
            <tr key={c.categoria}>
              <td className={`${td} font-medium text-ink`}>{c.categoria}</td>
              <td className={tdr}>{c.pecas}</td>
              <td className={`${tdr} font-medium text-ink`}>{formatBRL(c.valor)}</td>
            </tr>
          ))}
        </Tabela>
      )}
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { tab?: string; periodo?: string };
}) {
  await requireAdmin();
  const tab = searchParams.tab ?? "faturamento";
  const dias = normalizarDias(searchParams.periodo);

  let conteudo: ReactNode;
  if (tab === "produtos") conteudo = <Produtos dias={dias} />;
  else if (tab === "pagamentos") conteudo = <Pagamentos dias={dias} />;
  else if (tab === "estoque") conteudo = <Estoque />;
  else conteudo = <Faturamento dias={dias} />;

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Faturamento, produtos, pagamentos e estoque."
        action={tab !== "estoque" ? <DashboardPeriodo /> : undefined}
      />
      <UrlTabBar tabs={TABS} defaultTab="faturamento" resetParams={[]} />
      {conteudo}
    </>
  );
}
