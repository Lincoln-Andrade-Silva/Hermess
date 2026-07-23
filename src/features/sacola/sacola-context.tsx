"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Combinacao } from "@/db/schema";

export interface ItemSacola {
  variacaoId: string;
  produtoNome: string;
  produtoSlug: string;
  combinacao: Combinacao;
  /** Preço unitário para exibição; o checkout revalida no servidor. */
  preco: string;
  imagem: string | null;
  quantidade: number;
}

interface SacolaContexto {
  itens: ItemSacola[];
  /** Só vira true após ler o localStorage - evita flicker/hidratação errada. */
  pronto: boolean;
  quantidadeTotal: number;
  subtotal: number;
  adicionar: (item: Omit<ItemSacola, "quantidade">, quantidade?: number) => void;
  definirQuantidade: (variacaoId: string, quantidade: number) => void;
  remover: (variacaoId: string) => void;
  limpar: () => void;
}

const STORAGE_KEY = "hermess.sacola.v1";
const QTD_MAX = 99;

const Contexto = createContext<SacolaContexto | null>(null);

export function SacolaProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemSacola[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (bruto) setItens(JSON.parse(bruto) as ItemSacola[]);
    } catch {
      // localStorage corrompido: começa vazio em vez de quebrar a loja.
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto) localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, pronto]);

  const adicionar = useCallback<SacolaContexto["adicionar"]>((item, quantidade = 1) => {
    setItens((prev) => {
      const existente = prev.find((i) => i.variacaoId === item.variacaoId);
      if (existente) {
        return prev.map((i) =>
          i.variacaoId === item.variacaoId
            ? { ...i, quantidade: Math.min(QTD_MAX, i.quantidade + quantidade) }
            : i,
        );
      }
      return [...prev, { ...item, quantidade: Math.min(QTD_MAX, quantidade) }];
    });
  }, []);

  const definirQuantidade = useCallback<SacolaContexto["definirQuantidade"]>(
    (variacaoId, quantidade) => {
      setItens((prev) =>
        quantidade <= 0
          ? prev.filter((i) => i.variacaoId !== variacaoId)
          : prev.map((i) =>
              i.variacaoId === variacaoId
                ? { ...i, quantidade: Math.min(QTD_MAX, quantidade) }
                : i,
            ),
      );
    },
    [],
  );

  const remover = useCallback((variacaoId: string) => {
    setItens((prev) => prev.filter((i) => i.variacaoId !== variacaoId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const value = useMemo<SacolaContexto>(() => {
    const quantidadeTotal = itens.reduce((acc, i) => acc + i.quantidade, 0);
    const subtotal = itens.reduce((acc, i) => acc + Number(i.preco) * i.quantidade, 0);
    return {
      itens,
      pronto,
      quantidadeTotal,
      subtotal,
      adicionar,
      definirQuantidade,
      remover,
      limpar,
    };
  }, [itens, pronto, adicionar, definirQuantidade, remover, limpar]);

  return <Contexto.Provider value={value}>{children}</Contexto.Provider>;
}

export function useSacola(): SacolaContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSacola precisa estar dentro de <SacolaProvider>.");
  return ctx;
}
