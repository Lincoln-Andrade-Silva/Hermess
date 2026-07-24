"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { Banner } from "@/db/schema";
import { Badge, Button, ConfirmModal, PageHeader } from "@/components/ui";
import { BannerModal } from "./banner-modal";
import { excluirBanner, reordenarBanners } from "./actions";

export function BannersClient({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();
  const [editando, setEditando] = useState<Banner | null>(null);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState<Banner | null>(null);

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= banners.length) return;
    const ordem = banners.map((b) => b.id);
    [ordem[indice], ordem[destino]] = [ordem[destino], ordem[indice]];
    iniciar(async () => {
      await reordenarBanners(ordem);
      router.refresh();
    });
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    iniciar(async () => {
      await excluirBanner(excluindo.id);
      setExcluindo(null);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Banner inicial"
        description="Banners da home. Um só aparece estático; vários viram carrossel na ordem abaixo."
        action={
          <Button onClick={() => setCriando(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Novo banner
          </Button>
        }
      />

      {banners.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line2 bg-surface/30 px-6 py-16 text-center">
          <ImageOff className="h-7 w-7 text-muted2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink">Nenhum banner ainda</p>
          <p className="max-w-sm text-xs text-muted">
            Sem banner, a home mostra um destaque tipográfico simples. Envie uma arte pronta para
            personalizar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className="flex flex-col gap-3 rounded-2xl border border-line p-3 sm:flex-row sm:items-center"
            >
              <div className="aspect-[1920/720] w-full shrink-0 overflow-hidden rounded-lg border border-line bg-surface sm:w-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.imagemUrl} alt={banner.alt ?? ""} className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">Banner {i + 1}</span>
                  {banner.ativo ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="muted">Inativo</Badge>
                  )}
                  {banner.imagemMobileUrl && <Badge tone="brand">Tem versão mobile</Badge>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0 || processando}
                  aria-label="Mover para cima"
                  className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === banners.length - 1 || processando}
                  aria-label="Mover para baixo"
                  className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(banner)}
                  aria-label={`Editar banner ${i + 1}`}
                  className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setExcluindo(banner)}
                  aria-label={`Excluir banner ${i + 1}`}
                  className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(criando || editando) && (
        <BannerModal
          banner={editando}
          open
          onClose={() => {
            setCriando(false);
            setEditando(null);
          }}
          onSalvo={() => {
            setCriando(false);
            setEditando(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmModal
        open={excluindo !== null}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        loading={processando}
        title="Excluir banner"
        confirmLabel="Excluir"
        message="O banner sai da home e as imagens são apagadas do armazenamento."
      />
    </>
  );
}
