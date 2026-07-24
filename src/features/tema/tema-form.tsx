"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import type { TemaConfig } from "@/db/schema";
import {
  Button,
  ColorPicker,
  Field,
  FormError,
  FormSuccess,
  Label,
  Segmented,
  Select,
} from "@/components/ui";
import { FONTES_CORPO, FONTES_TITULO, variavelDaFonte } from "@/lib/fontes";
import {
  CORES_BASE_CLARA,
  contraste,
  derivarPaleta,
  esquemaDeCor,
  hexValido,
  paletaDeSelecao,
  varsDeCor,
  varsDeFeedback,
  type CoresBase,
  type EscopoTema,
  type ModoTema,
} from "@/lib/tema";
import { salvarTemaConfig } from "./actions";
import { PreviewPainel } from "./preview-painel";
import { PreviewVitrine } from "./preview-vitrine";

const TEMAS: { value: ModoTema; label: string }[] = [
  { value: "claro", label: "Claro" },
  { value: "escuro", label: "Escuro" },
  { value: "personalizado", label: "Personalizado" },
];

const CAMPOS_DE_COR: { chave: keyof CoresBase; rotulo: string; descricao: string }[] = [
  { chave: "bg", rotulo: "Fundo", descricao: "Fundo das páginas." },
  { chave: "surface", rotulo: "Superfície", descricao: "Campos, cards e áreas destacadas." },
  { chave: "ink", rotulo: "Texto", descricao: "Texto principal e ícones." },
  { chave: "line", rotulo: "Linhas", descricao: "Bordas e divisórias." },
  { chave: "brand", rotulo: "Marca", descricao: "Botão principal e destaques." },
];

/** Mínimo da WCAG AA para texto pequeno, que é onde o problema aparece. */
const CONTRASTE_MINIMO = 4.5;

function coresIniciais(config: TemaConfig | null): CoresBase {
  if (!config) return CORES_BASE_CLARA;
  return {
    bg: hexValido(config.corBg) ? config.corBg : CORES_BASE_CLARA.bg,
    surface: hexValido(config.corSurface) ? config.corSurface : CORES_BASE_CLARA.surface,
    ink: hexValido(config.corInk) ? config.corInk : CORES_BASE_CLARA.ink,
    line: hexValido(config.corLine) ? config.corLine : CORES_BASE_CLARA.line,
    brand: hexValido(config.corBrand) ? config.corBrand : CORES_BASE_CLARA.brand,
  };
}

function razao(valor: number): string {
  return `${valor.toFixed(1).replace(".", ",")}:1`;
}

export function TemaForm({
  escopo,
  config,
  nomeLoja,
}: {
  escopo: EscopoTema;
  config: TemaConfig | null;
  nomeLoja: string;
}) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const [tema, setTema] = useState<ModoTema>(config?.tema ?? "claro");
  const [cores, setCores] = useState<CoresBase>(() => coresIniciais(config));
  const [fonteCorpo, setFonteCorpo] = useState(config?.fonteCorpo ?? FONTES_CORPO[0].chave);
  const [fonteTitulo, setFonteTitulo] = useState(config?.fonteTitulo ?? FONTES_TITULO[0].chave);

  const paleta = useMemo(() => paletaDeSelecao(tema, cores), [tema, cores]);
  const esquema = esquemaDeCor(paleta);
  // Preview e live-apply carregam cor + feedback juntos, senão os chips de estado
  // no preview usariam o esquema do painel em volta, não o do tema em edição.
  const varsPreview = useMemo(
    () => ({ ...varsDeCor(paleta), ...varsDeFeedback(esquema) }),
    [paleta, esquema],
  );
  const fonteCorpoVar = variavelDaFonte(fonteCorpo, FONTES_CORPO);
  const fonteTituloVar = variavelDaFonte(fonteTitulo, FONTES_TITULO);

  // No painel, a escolha é aplicada ao vivo sobrescrevendo as vars do documento -
  // inline ganha do `<style>` do layout. A limpeza restaura o tema salvo ao sair
  // da tela ou trocar de aba sem salvar: é o "cancela se sair sem salvar".
  useEffect(() => {
    if (escopo !== "admin") return;
    const root = document.documentElement;
    const overrides: Record<string, string> = {
      ...varsPreview,
      "color-scheme": esquema,
      "--font-sans": `var(${fonteCorpoVar})`,
      "--font-display": `var(${fonteTituloVar})`,
    };
    for (const [prop, valor] of Object.entries(overrides)) root.style.setProperty(prop, valor);
    return () => {
      for (const prop of Object.keys(overrides)) root.style.removeProperty(prop);
    };
  }, [escopo, esquema, varsPreview, fonteCorpoVar, fonteTituloVar]);

  function trocarCor(chave: keyof CoresBase, hex: string) {
    setCores((atual) => ({ ...atual, [chave]: hex }));
  }

  // Só o personalizado pode gerar combinação ilegível: claro e escuro já vêm
  // conferidos. O aviso não bloqueia - a decisão do visual é do lojista.
  const avisosDeContraste: string[] = [];
  if (tema === "personalizado") {
    const derivada = derivarPaleta(cores);
    const textoPrincipal = contraste(cores.ink, cores.bg);
    const textoSecundario = contraste(derivada.muted, cores.bg);
    if (textoPrincipal < CONTRASTE_MINIMO) {
      avisosDeContraste.push(
        `Texto sobre o fundo está em ${razao(textoPrincipal)} - abaixo de 4,5:1, a leitura fica difícil.`,
      );
    }
    if (textoSecundario < CONTRASTE_MINIMO) {
      avisosDeContraste.push(
        `Textos de apoio ficam em ${razao(textoSecundario)} sobre o fundo - aproxime o Texto do extremo oposto ao Fundo.`,
      );
    }
  }

  function salvar() {
    setErro(null);
    setSucesso(false);
    iniciar(async () => {
      const r = await salvarTemaConfig({ escopo, tema, cores, fonteCorpo, fonteTitulo });
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível salvar.");
        return;
      }
      setSucesso(true);
      router.refresh();
    });
  }

  const controles = (
    <div className="space-y-6">
      <Field label="Tema">
        <Segmented options={TEMAS} value={tema} onChange={setTema} />
      </Field>

      {tema === "personalizado" && (
        <div className="space-y-3 rounded-xl border border-line p-4">
          <p className="text-xs text-muted">
            As demais cores do sistema saem destas cinco - tons de apoio, bordas e o texto sobre a
            marca são calculados para acompanhar a escolha.
          </p>
          {CAMPOS_DE_COR.map(({ chave, rotulo, descricao }) => (
            <div key={chave} className="flex items-center gap-3">
              <ColorPicker
                value={cores[chave]}
                onChange={(hex) => trocarCor(chave, hex)}
                rotulo={rotulo}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{rotulo}</p>
                <p className="text-xs text-muted">{descricao}</p>
              </div>
              <span className="ml-auto font-mono text-xs text-muted2">{cores[chave]}</span>
            </div>
          ))}
        </div>
      )}

      <Field label="Fonte do corpo" hint="(texto, preço e formulários)">
        <Select
          value={fonteCorpo}
          onChange={setFonteCorpo}
          options={FONTES_CORPO.map((f) => ({ value: f.chave, label: f.nome }))}
        />
      </Field>

      <Field label="Fonte dos títulos" hint="(marca, seções e nome de produto)">
        <Select
          value={fonteTitulo}
          onChange={setFonteTitulo}
          options={FONTES_TITULO.map((f) => ({ value: f.chave, label: f.nome }))}
        />
      </Field>

      {avisosDeContraste.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-warning-line bg-warning-surface px-4 py-3">
          {avisosDeContraste.map((aviso) => (
            <p key={aviso} className="flex gap-2 text-sm text-warning-ink">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {aviso}
            </p>
          ))}
        </div>
      )}

      {erro && <FormError>{erro}</FormError>}
      {sucesso && <FormSuccess>Aparência salva.</FormSuccess>}

      <div className="flex items-center justify-between gap-3">
        <Label className="normal-case tracking-normal">
          {escopo === "vitrine"
            ? "Vale para a loja e o login."
            : "As mudanças já aparecem no painel; saia sem salvar para descartar."}
        </Label>
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );

  // Cada escopo tem a sua miniatura: a vitrine porque o admin não a vê ao vivo,
  // o painel para servir de recorte estável enquanto o painel real muda em volta.
  const preview =
    escopo === "vitrine" ? (
      <PreviewVitrine
        vars={varsPreview}
        fonteCorpoVar={fonteCorpoVar}
        fonteTituloVar={fonteTituloVar}
        nomeLoja={nomeLoja}
      />
    ) : (
      <PreviewPainel
        vars={varsPreview}
        fonteCorpoVar={fonteCorpoVar}
        fonteTituloVar={fonteTituloVar}
        nomeLoja={nomeLoja}
      />
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="max-w-2xl">{controles}</div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
          {escopo === "vitrine" ? "Prévia da vitrine" : "Prévia do painel"}
        </p>
        {preview}
      </div>
    </div>
  );
}
