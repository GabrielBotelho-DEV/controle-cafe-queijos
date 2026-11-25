"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  COLLECTIONS,
  createRecord,
  deleteRecord,
  updateRecord,
  useCollection,
} from "@/lib/firestore";
import { carregarDadosTesteCafe } from "@/modules/cafe/seed";
import type {
  ProducaoCafe,
  ProducaoCafeInput,
  VendaCafe,
  VendaCafeInput,
} from "@/modules/cafe/types";

type CafeContextValue = {
  producao: ProducaoCafe[];
  vendas: VendaCafe[];
  loading: boolean;
  error: string | null;
  salvarProducao: (dados: ProducaoCafeInput, id?: string) => Promise<void>;
  salvarVenda: (dados: VendaCafeInput, id?: string) => Promise<void>;
  darBaixa: (id: string) => Promise<void>;
  excluirProducao: (id: string) => Promise<void>;
  excluirVenda: (id: string) => Promise<void>;
  carregarDadosTeste: () => Promise<void>;
};

const CafeContext = createContext<CafeContextValue | null>(null);

export function CafeProvider({ children }: { children: ReactNode }) {
  const producaoQuery = useCollection<ProducaoCafe>(COLLECTIONS.cafeProducao);
  const vendasQuery = useCollection<VendaCafe>(COLLECTIONS.cafeVendas);

  const salvarProducao = useCallback(async (dados: ProducaoCafeInput, id?: string) => {
    if (id) await updateRecord<ProducaoCafe>(COLLECTIONS.cafeProducao, id, dados);
    else await createRecord<ProducaoCafe>(COLLECTIONS.cafeProducao, dados);
  }, []);

  const salvarVenda = useCallback(async (dados: VendaCafeInput, id?: string) => {
    if (id) await updateRecord<VendaCafe>(COLLECTIONS.cafeVendas, id, dados);
    else await createRecord<VendaCafe>(COLLECTIONS.cafeVendas, dados);
  }, []);

  const darBaixa = useCallback(async (id: string) => {
    const venda = vendasQuery.data.find((item) => item.id === id);
    if (!venda) return;
    await updateRecord<VendaCafe>(COLLECTIONS.cafeVendas, id, {
      status: "Pago",
      formaPagamento: venda.formaPagamento || "Pix",
    });
  }, [vendasQuery.data]);

  const excluirProducao = useCallback(
    async (id: string) => deleteRecord(COLLECTIONS.cafeProducao, id),
    [],
  );
  const excluirVenda = useCallback(
    async (id: string) => deleteRecord(COLLECTIONS.cafeVendas, id),
    [],
  );

  const carregarDadosTeste = useCallback(async () => {
    await carregarDadosTesteCafe();
  }, []);

  const value = useMemo(
    () => ({
      producao: producaoQuery.data,
      vendas: vendasQuery.data,
      loading: producaoQuery.loading || vendasQuery.loading,
      error: producaoQuery.error ?? vendasQuery.error,
      salvarProducao,
      salvarVenda,
      darBaixa,
      excluirProducao,
      excluirVenda,
      carregarDadosTeste,
    }),
    [
      producaoQuery.data,
      producaoQuery.loading,
      producaoQuery.error,
      vendasQuery.data,
      vendasQuery.loading,
      vendasQuery.error,
      salvarProducao,
      salvarVenda,
      darBaixa,
      excluirProducao,
      excluirVenda,
      carregarDadosTeste,
    ],
  );

  return <CafeContext.Provider value={value}>{children}</CafeContext.Provider>;
}

export function useCafe(): CafeContextValue {
  const context = useContext(CafeContext);
  if (!context) throw new Error("useCafe deve ser usado dentro de CafeProvider");
  return context;
}
