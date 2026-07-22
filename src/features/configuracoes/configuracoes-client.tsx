"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, X } from "lucide-react";
import type { LojaInfo } from "@/db/schema";
import { maskTelefone } from "@/lib/format";
import { Button, Field, FormError, FormSuccess, Input, PageHeader } from "@/components/ui";
import { enviarLogo, salvarConfiguracoes } from "./actions";

export function ConfiguracoesClient({ info }: { info: LojaInfo | null }) {
  const router = useRouter();
  const inputLogo = useRef<HTMLInputElement>(null);
  const [salvando, iniciar] = useTransition();
  const [enviandoLogo, enviarLogoTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [nome, setNome] = useState(info?.nome ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(info?.logoUrl ?? null);
  const [telefone, setTelefone] = useState(maskTelefone(info?.telefone ?? ""));
  const [endereco, setEndereco] = useState(info?.endereco ?? "");
  const [instagram, setInstagram] = useState(info?.instagram ?? "");
  const [emailNotificacao, setEmailNotificacao] = useState(info?.emailNotificacao ?? "");
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(info?.estoqueMinimo ?? 5));

  function selecionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErro(null);
    enviarLogoTransicao(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await enviarLogo(fd);
      if (r.erro) setErro(r.erro);
      else if (r.url) setLogoUrl(r.url);
    });
  }

  function salvar() {
    setErro(null);
    setSucesso(false);
    iniciar(async () => {
      const r = await salvarConfiguracoes({
        nome,
        logoUrl,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
        instagram: instagram.trim() || null,
        emailNotificacao: emailNotificacao.trim() || null,
        estoqueMinimo: Number(estoqueMinimo) || 0,
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
    <>
      <PageHeader
        title="Configurações"
        description="Identidade da loja. O nome e a logo aparecem na vitrine, no painel e no login."
      />

      <div className="max-w-2xl space-y-6">
        <Field label="Logo" hint="(opcional, quadrada — png, jpeg, webp ou avif até 5MB)">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => inputLogo.current?.click()}
                disabled={enviandoLogo}
                aria-label={logoUrl ? "Trocar logo" : "Enviar logo"}
                className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-line bg-surface transition hover:border-ink disabled:opacity-60"
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-muted2" strokeWidth={1.5} />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-6 w-6" strokeWidth={1.5} />
                </span>
              </button>
              {logoUrl && !enviandoLogo && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  aria-label="Remover logo"
                  className="absolute -right-1 -top-1 rounded-full border border-line bg-bg p-1.5 text-muted shadow-sm transition hover:border-red-600 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted">
              {enviandoLogo ? "Enviando..." : logoUrl ? "Clique para trocar" : "Clique para enviar a logo"}
            </p>
          </div>
          <input
            ref={inputLogo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={selecionarLogo}
            className="hidden"
          />
        </Field>

        <Field label="Nome da loja" htmlFor="cfg-nome">
          <Input
            id="cfg-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Minha Loja"
            maxLength={60}
          />
        </Field>

        <Field label="Telefone / WhatsApp" htmlFor="cfg-telefone" hint="(opcional)">
          <Input
            id="cfg-telefone"
            value={telefone}
            onChange={(e) => setTelefone(maskTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            maxLength={16}
          />
        </Field>

        <Field label="Endereço de retirada" htmlFor="cfg-endereco" hint="(opcional)">
          <Input
            id="cfg-endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, bairro — cidade/UF"
          />
        </Field>

        <Field label="Instagram" htmlFor="cfg-instagram" hint="(opcional, sem @)">
          <Input
            id="cfg-instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="minhaloja"
          />
        </Field>

        <Field
          label="E-mail para notificações"
          htmlFor="cfg-email"
          hint="(recebe aviso a cada pedido)"
        >
          <Input
            id="cfg-email"
            type="email"
            value={emailNotificacao}
            onChange={(e) => setEmailNotificacao(e.target.value)}
            placeholder="loja@exemplo.com"
          />
        </Field>

        <Field
          label="Alerta de estoque baixo"
          htmlFor="cfg-estoque-minimo"
          hint="(quando o estoque chega neste número)"
        >
          <Input
            id="cfg-estoque-minimo"
            type="number"
            min={0}
            inputMode="numeric"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
          />
        </Field>

        {erro && <FormError>{erro}</FormError>}
        {sucesso && <FormSuccess>Configurações salvas.</FormSuccess>}

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </>
  );
}
