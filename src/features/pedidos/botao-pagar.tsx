"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { Button, FormError } from "@/components/ui";
import { criarPagamento } from "./pagamento-actions";

export function BotaoPagar({ numero }: { numero: number }) {
  const [processando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

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

  return (
    <div className="mt-6 space-y-2">
      <Button className="w-full py-4 text-base" onClick={pagar} disabled={processando}>
        <CreditCard className="h-5 w-5" />
        {processando ? "Abrindo pagamento..." : "Pagar agora"}
      </Button>
      {erro && <FormError>{erro}</FormError>}
    </div>
  );
}
