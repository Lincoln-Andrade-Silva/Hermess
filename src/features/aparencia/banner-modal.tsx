"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { Banner } from "@/db/schema";
import { Button, Field, FormError, Input, Modal, Toggle } from "@/components/ui";
import { enviarBanner, salvarBanner } from "./actions";

interface Props {
  banner: Banner | null;
  open: boolean;
  onClose: () => void;
  onSalvo: () => void;
}

/** Upload de uma imagem única, com preview. */
function CampoImagem({
  label,
  hint,
  valor,
  onChange,
  onErro,
  proporcao,
}: {
  label: string;
  hint: string;
  valor: string | null;
  onChange: (url: string | null) => void;
  onErro: (erro: string) => void;
  proporcao: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, iniciar] = useTransition();

  function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    iniciar(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await enviarBanner(fd);
      if (r.erro) onErro(r.erro);
      else if (r.url) onChange(r.url);
    });
  }

  return (
    <Field label={label} hint={hint}>
      {valor ? (
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={valor} alt="" className="w-full object-contain" style={{ aspectRatio: proporcao }} />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remover imagem"
            className="absolute right-2 top-2 rounded-lg bg-black/55 p-2 text-white transition hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          style={{ aspectRatio: proporcao }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line2 bg-surface/40 text-muted transition hover:border-ink hover:text-ink disabled:opacity-60"
        >
          <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
          <span className="text-sm font-medium">{enviando ? "Enviando..." : "Enviar imagem"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={selecionar}
        className="hidden"
      />
    </Field>
  );
}

export function BannerModal({ banner, open, onClose, onSalvo }: Props) {
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [imagemUrl, setImagemUrl] = useState<string | null>(banner?.imagemUrl ?? null);
  const [imagemMobileUrl, setImagemMobileUrl] = useState<string | null>(banner?.imagemMobileUrl ?? null);
  const [link, setLink] = useState(banner?.link ?? "");
  const [alt, setAlt] = useState(banner?.alt ?? "");
  const [ativo, setAtivo] = useState(banner?.ativo ?? true);

  function salvar() {
    setErro(null);
    if (!imagemUrl) {
      setErro("Envie a imagem de desktop.");
      return;
    }
    iniciar(async () => {
      const r = await salvarBanner(banner?.id ?? null, {
        imagemUrl,
        imagemMobileUrl,
        link: link.trim() || null,
        alt: alt.trim() || null,
        ativo,
      });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      onSalvo();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={banner ? "Editar banner" : "Novo banner"} className="max-w-2xl">
      <div className="space-y-5">
        <CampoImagem
          label="Imagem — desktop"
          hint="(ideal 1920×720)"
          valor={imagemUrl}
          onChange={setImagemUrl}
          onErro={setErro}
          proporcao="1920 / 720"
        />

        <CampoImagem
          label="Imagem — celular"
          hint="(opcional, ideal 1080×1350)"
          valor={imagemMobileUrl}
          onChange={setImagemMobileUrl}
          onErro={setErro}
          proporcao="1080 / 1350"
        />
        <p className="-mt-3 text-xs text-muted">
          Sem a versão de celular, a de desktop é usada nos dois — e num banner largo isso costuma
          cortar demais no telefone.
        </p>

        <Field label="Link ao clicar" htmlFor="banner-link" hint="(opcional)">
          <Input
            id="banner-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/categoria/camisetas ou https://..."
          />
        </Field>

        <Field label="Descrição da imagem" htmlFor="banner-alt" hint="(acessibilidade e SEO)">
          <Input
            id="banner-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Coleção de inverno"
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <div>
            <p className="text-sm font-medium">Banner ativo</p>
            <p className="text-xs text-muted">Inativo não aparece na home.</p>
          </div>
          <Toggle on={ativo} onClick={() => setAtivo(!ativo)} />
        </div>

        {erro && <FormError>{erro}</FormError>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar banner"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
