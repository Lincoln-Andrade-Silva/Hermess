"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Button, ConfirmModal, FormError } from "@/components/ui";
import { criarPagamento } from "./pagamento-actions";
import { cancelarMeuPedido } from "./actions";

export function BotaoPagar({ numero }: { numero: number }) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  function pagar() {
    setErro(null);
    iniciar(async () => {
      const r = await criarPagamento(numero);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      window.location.href = r.initPoint;
    });
  }

  function cancelar() {
    setErro(null);
    iniciar(async () => {
      const r = await cancelarMeuPedido(numero);
      setConfirmar(false);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível cancelar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-2">
      <Button className="w-full py-4 text-base" onClick={pagar} disabled={processando}>
        <CreditCard className="h-5 w-5" />
        {processando ? "Abrindo pagamento..." : "Pagar agora"}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setConfirmar(true)}
        disabled={processando}
      >
        Cancelar pedido
      </Button>
      {erro && <FormError>{erro}</FormError>}

      <ConfirmModal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={cancelar}
        loading={processando}
        title="Cancelar pedido"
        confirmLabel="Cancelar pedido"
        message="Seu pedido será cancelado e a reserva de estoque liberada. Esta ação não pode ser desfeita."
      />
    </div>
  );
}
