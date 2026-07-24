"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/db/schema";
import { cn } from "@/lib/cn";

/** Uma imagem de banner: usa a versão mobile em telas pequenas quando existe. */
function BannerImagem({ banner, prioridade }: { banner: Banner; prioridade: boolean }) {
  const temMobile = Boolean(banner.imagemMobileUrl);
  return (
    <>
      {temMobile && (
        <Image
          src={banner.imagemMobileUrl!}
          alt={banner.alt ?? ""}
          fill
          priority={prioridade}
          sizes="100vw"
          className="object-cover sm:hidden"
        />
      )}
      <Image
        src={banner.imagemUrl}
        alt={banner.alt ?? ""}
        fill
        priority={prioridade}
        sizes="100vw"
        className={cn("object-cover", temMobile && "hidden sm:block")}
      />
    </>
  );
}

/** Envolve o banner num link só quando há destino. */
function BannerLink({ banner, children }: { banner: Banner; children: React.ReactNode }) {
  if (!banner.link) return <>{children}</>;
  const externo = /^https?:\/\//.test(banner.link);
  return (
    <Link
      href={banner.link}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block h-full w-full"
    >
      {children}
    </Link>
  );
}

const INTERVALO_MS = 6000;

export function BannerHero({ banners }: { banners: Banner[] }) {
  const [atual, setAtual] = useState(0);
  const total = banners.length;

  const ir = useCallback(
    (indice: number) => setAtual((indice + total) % total),
    [total],
  );

  // Autoplay só faz sentido com mais de um banner; pausa fora da aba.
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setAtual((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [total]);

  if (total === 0) return null;

  const unico = total === 1;

  return (
    <section
      className="relative aspect-[1080/1350] w-full overflow-hidden border-b border-line sm:aspect-[1920/720]"
      aria-roledescription={unico ? undefined : "carrossel"}
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          aria-hidden={i !== atual}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === atual ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <BannerLink banner={banner}>
            <BannerImagem banner={banner} prioridade={i === 0} />
          </BannerLink>
        </div>
      ))}

      {!unico && (
        <>
          <button
            type="button"
            onClick={() => ir(atual - 1)}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow-sm backdrop-blur transition hover:bg-white sm:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => ir(atual + 1)}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow-sm backdrop-blur transition hover:bg-white sm:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para o banner ${i + 1}`}
                aria-current={i === atual}
                className={cn(
                  "h-2 rounded-full bg-white shadow-sm transition-all",
                  i === atual ? "w-6" : "w-2 opacity-60 hover:opacity-100",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
