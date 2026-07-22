"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import type { LojaInfo } from "@/db/schema";
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
  const [telefone, setTelefone] = useState(info?.telefone ?? "");
  const [endereco, setEndereco] = useState(info?.endereco ?? "");
  const [instagram, setInstagram] = useState(info?.instagram ?? "");

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
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted2" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => inputLogo.current?.click()}
                disabled={enviandoLogo}
              >
                {enviandoLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
              </Button>
              {logoUrl && (
                <Button variant="secondary" onClick={() => setLogoUrl(null)} disabled={enviandoLogo}>
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              )}
            </div>
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
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(00) 00000-0000"
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
