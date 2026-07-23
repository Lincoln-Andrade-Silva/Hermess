"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button, Field, FormError, Modal, Textarea } from "@/components/ui";
import { solicitarReembolso } from "./actions";

/**
 * Botão do cliente para solicitar reembolso do pedido. A solicitação vai para a
 * loja aprovar ou recusar - não move dinheiro sozinha. Aparece quando o pedido
 * está pago em diante e ainda não há solicitação em análise.
 */
export function BotaoReembolso({ numero }: { numero: number }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function abrir() {
    setMotivo("");
    setErro(null);
    setAberto(true);
  }

  function enviar() {
    setErro(null);
    iniciar(async () => {
      const r = await solicitarReembolso(numero, { motivo });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível solicitar.");
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={abrir}>
        <RotateCcw className="h-4 w-4" />
        Solicitar reembolso
      </Button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Solicitar reembolso" className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Sua solicitação será enviada para a loja analisar. O reembolso só é efetivado após a
            aprovação.
          </p>
          <Field label="Motivo" htmlFor="reembolso-motivo" hint="(opcional)">
            <Textarea
              id="reembolso-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Conte por que quer o reembolso"
            />
          </Field>

          {erro && <FormError>{erro}</FormError>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setAberto(false)} disabled={enviando}>
              Voltar
            </Button>
            <Button onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
