import { Card, PageHeader } from "@/components/ui";

/** Placeholder: os KPIs e gráficos entram na Fase 9. */
export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral da loja." />
      <Card>
        <p className="text-sm text-muted">
          Os indicadores de vendas entram na Fase 9, depois que pedidos e pagamentos existirem.
        </p>
      </Card>
    </>
  );
}
