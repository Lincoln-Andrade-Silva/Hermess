import { redirect } from "next/navigation";

/** Pagamento virou aba de Configurações; a rota antiga segue valendo em favoritos. */
export default function PagamentoPage() {
  redirect("/admin/configuracoes?tab=pagamentos");
}
