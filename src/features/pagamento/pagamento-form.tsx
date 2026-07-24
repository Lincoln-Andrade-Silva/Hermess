"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import type { PagamentoConfig } from "@/db/schema";
import { Button, Field, FormError, FormSuccess, Input, Toggle } from "@/components/ui";
import { salvarPagamentoConfig } from "./actions";

export function PagamentoForm({ config }: { config: PagamentoConfig | null }) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [accessToken, setAccessToken] = useState(config?.accessToken ?? "");
  const [publicKey, setPublicKey] = useState(config?.publicKey ?? "");
  const [webhookSecret, setWebhookSecret] = useState(config?.webhookSecret ?? "");
  const [siteUrl, setSiteUrl] = useState(config?.siteUrl ?? "");
  const [taxa, setTaxa] = useState(config ? String(config.taxaGateway) : "4.99");
  const [ativo, setAtivo] = useState(config?.ativo ?? false);

  function salvar() {
    setErro(null);
    setSucesso(false);
    const taxaNum = Number(taxa.replace(",", "."));
    iniciar(async () => {
      const r = await salvarPagamentoConfig({
        accessToken: accessToken.trim() || null,
        publicKey: publicKey.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
        siteUrl: siteUrl.trim(),
        taxaGateway: taxaNum,
        ativo,
      });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      setSucesso(true);
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted2" />
        <p className="text-sm leading-relaxed text-muted">
          Credenciais do Mercado Pago usadas para cobrar os pedidos da loja. Pegue em{" "}
          <strong className="font-medium text-ink">
            Suas integrações → sua aplicação → Credenciais
          </strong>
          . O Access Token é secreto - não compartilhe.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
        <div>
          <p className="text-sm font-medium">Pagamento online ativo</p>
          <p className="text-xs text-muted">Desligado, o cliente cria o pedido mas não paga online.</p>
        </div>
        <Toggle on={ativo} onClick={() => setAtivo(!ativo)} />
      </div>

      <Field label="Access Token" htmlFor="pg-token" hint="(secreto - produção ou teste)">
        <Input
          id="pg-token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="APP_USR-... ou TEST-..."
          autoComplete="off"
        />
      </Field>

      <Field label="Public Key" htmlFor="pg-public">
        <Input
          id="pg-public"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="APP_USR-... ou TEST-..."
          autoComplete="off"
        />
      </Field>

      <Field label="Webhook Secret" htmlFor="pg-secret" hint="(assinatura do painel do MP)">
        <Input
          id="pg-secret"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          autoComplete="off"
        />
      </Field>

      <Field label="URL do site" htmlFor="pg-site" hint="(opcional - usada no retorno/webhook)">
        <Input
          id="pg-site"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://minhaloja.com.br"
        />
      </Field>

      <Field label="Taxa do Mercado Pago (%)" htmlFor="pg-taxa" hint="(usada no líquido do produto)">
        <Input
          id="pg-taxa"
          value={taxa}
          onChange={(e) => setTaxa(e.target.value)}
          inputMode="decimal"
          placeholder="4.99"
        />
      </Field>
      <p className="-mt-3 text-xs text-muted">
        Percentual retido por venda. O valor exato depende do meio (Pix costuma ser menor que cartão)
        e do prazo de recebimento - confira em Seu negócio → Taxas no painel do Mercado Pago.
      </p>

      {erro && <FormError>{erro}</FormError>}
      {sucesso && <FormSuccess>Configurações de pagamento salvas.</FormSuccess>}

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
