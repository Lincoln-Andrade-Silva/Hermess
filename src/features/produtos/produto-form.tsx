"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { FichaTecnica } from "@/db/schema";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { FichaEditor } from "@/components/admin/ficha-editor";
import { descartarImagens, salvarProduto, type ProdutoCompleto } from "./actions";
import { sincronizarGrade, type EixoRascunho, type VariacaoRascunho } from "./grade";
import { GaleriaEditor } from "./galeria-editor";
import { OpcoesEditor } from "./opcoes-editor";
import { VariacoesGrade } from "./variacoes-grade";

interface Props {
  produto: ProdutoCompleto | null;
  categorias: { id: string; nome: string }[];
  taxaGateway: number;
}

export function ProdutoForm({ produto, categorias, taxaGateway }: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvamento] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(produto?.categoriaId ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [ficha, setFicha] = useState<FichaTecnica | null>(produto?.fichaTecnica ?? null);
  const [imagens, setImagens] = useState<string[]>(produto?.imagens.map((i) => i.url) ?? []);

  const [eixos, setEixos] = useState<EixoRascunho[]>(
    produto?.opcoes.map((o) => ({ nome: o.nome, tipo: o.tipo, valores: o.valores })) ?? [],
  );
  const [variacoes, setVariacoes] = useState<VariacaoRascunho[]>(
    produto?.variacoes.map((v) => ({
      sku: v.sku,
      preco: v.preco,
      estoque: String(v.estoque),
      imagemUrl: v.imagemUrl,
      combinacao: v.combinacao,
      ativo: v.ativo,
    })) ?? [],
  );
  // A grade é derivada dos tipos de variação: criar, renomear ou excluir um
  // valor remodela a tabela na hora, sem etapa manual.
  useEffect(() => {
    setVariacoes((atuais) => sincronizarGrade(eixos, atuais));
  }, [eixos]);

  function salvar() {
    setErro(null);
    iniciarSalvamento(async () => {
      const resultado = await salvarProduto(produto?.id ?? null, {
        nome,
        descricao: descricao.trim() || null,
        categoriaId: categoriaId || null,
        ativo,
        fichaTecnica: ficha,
        imagens,
        opcoes: eixos
          .filter((e) => e.nome.trim())
          .map((e) => ({
            nome: e.nome.trim(),
            tipo: e.tipo,
            valores: e.valores
              .filter((v) => v.valor.trim())
              .map((v) => ({ valor: v.valor.trim(), hex: v.hex })),
          })),
        variacoes: variacoes.map((v) => ({
          sku: v.sku.trim(),
          preco: v.preco || "0",
          estoque: v.estoque || "0",
          imagemUrl: v.imagemUrl,
          combinacao: v.combinacao,
          ativo: v.ativo,
        })),
      });

      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível salvar.");
        return;
      }
      router.push("/admin/produtos");
      router.refresh();
    });
  }

  async function cancelar() {
    // Imagens enviadas mas nunca salvas ficariam órfãs consumindo cota.
    const salvas = new Set(produto?.imagens.map((i) => i.url) ?? []);
    const novas = imagens.filter((url) => !salvas.has(url));
    if (novas.length > 0) await descartarImagens(novas);
    router.push("/admin/produtos");
  }

  return (
    <>
      <PageHeader
        title={produto ? "Editar produto" : "Novo produto"}
        description={produto ? `/${produto.slug}` : "O slug é gerado a partir do nome."}
      />

      <div className="space-y-5">
        <Card className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="prod-nome">
              <Input
                id="prod-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do produto"
              />
            </Field>
            <Field label="Categoria">
              <Select
                value={categoriaId}
                onChange={setCategoriaId}
                options={[
                  { value: "", label: "Sem categoria" },
                  ...categorias.map((c) => ({ value: c.id, label: c.nome })),
                ]}
              />
            </Field>
          </div>

          <Field label="Descrição" htmlFor="prod-descricao">
            <Textarea
              id="prod-descricao"
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que o cliente precisa saber antes de comprar."
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Produto ativo</p>
              <p className="text-xs text-muted">Inativo some da vitrine e da busca.</p>
            </div>
            <Toggle on={ativo} onClick={() => setAtivo(!ativo)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">Galeria</h2>
            <p className="text-sm text-muted">
              A primeira imagem é a capa no card da vitrine. A segunda vira o hover.
            </p>
          </div>
          <GaleriaEditor imagens={imagens} onChange={setImagens} onErro={setErro} />
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">
              Variações
            </h2>
            <p className="text-sm text-muted">
              Declare as variações do produto. A tabela abaixo se monta sozinha com as combinações.
            </p>
          </div>

          <OpcoesEditor eixos={eixos} onChange={setEixos} iniciarMinimizado={produto !== null} />

          <VariacoesGrade
            eixos={eixos}
            variacoes={variacoes}
            onChange={setVariacoes}
            taxaGateway={taxaGateway}
          />
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">
              Ficha técnica
            </h2>
            <p className="text-sm text-muted">
              Tabela livre exibida na página do produto: medidas, especificações, composição — o que
              fizer sentido para o que você vende.
            </p>
          </div>
          <FichaEditor
            valor={ficha}
            onChange={setFicha}
            legendaVazio="Sem ficha, a página do produto não exibe a tabela."
          />
        </Card>

        {erro && <FormError>{erro}</FormError>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={cancelar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar produto"}
          </Button>
        </div>
      </div>
    </>
  );
}
