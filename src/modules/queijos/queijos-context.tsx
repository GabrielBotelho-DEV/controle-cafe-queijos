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
import { carregarDadosTesteQueijos } from "@/modules/queijos/seed";
import type {
  CompraQueijo,
  CompraQueijoInput,
  TipoQueijo,
  VendaQueijo,
  VendaQueijoInput,
} from "@/modules/queijos/types";

type QueijosContextValue = {
  compras: CompraQueijo[];
  vendas: VendaQueijo[];
  tiposCadastrados: TipoQueijo[];
  loading: boolean;
  error: string | null;
  salvarCompra: (dados: CompraQueijoInput, id?: string) => Promise<void>;
  salvarVenda: (dados: VendaQueijoInput, id?: string) => Promise<void>;
  marcarPago: (id: string) => Promise<void>;
  excluirCompra: (id: string) => Promise<void>;
  excluirVenda: (id: string) => Promise<void>;
  cadastrarTipo: (nome: string) => Promise<void>;
  carregarDadosTeste: () => Promise<void>;
};

const QueijosContext = createContext<QueijosContextValue | null>(null);

export function QueijosProvider({ children }: { children: ReactNode }) {
  const comprasQuery = useCollection<CompraQueijo>(COLLECTIONS.queijosCompras);
  const vendasQuery = useCollection<VendaQueijo>(COLLECTIONS.queijosVendas);
  const tiposQuery = useCollection<TipoQueijo>(COLLECTIONS.queijosTipos);

  const salvarCompra = useCallback(async (dados: CompraQueijoInput, id?: string) => {
    if (id) await updateRecord<CompraQueijo>(COLLECTIONS.queijosCompras, id, dados);
    else await createRecord<CompraQueijo>(COLLECTIONS.queijosCompras, dados);
  }, []);

  const salvarVenda = useCallback(async (dados: VendaQueijoInput, id?: string) => {
    if (id) await updateRecord<VendaQueijo>(COLLECTIONS.queijosVendas, id, dados);
    else await createRecord<VendaQueijo>(COLLECTIONS.queijosVendas, dados);
  }, []);

  const marcarPago = useCallback(
    async (id: string) => {
      await updateRecord<VendaQueijo>(COLLECTIONS.queijosVendas, id, { situacao: "Pago" });
    },
    [],
  );

  const excluirCompra = useCallback(
    async (id: string) => deleteRecord(COLLECTIONS.queijosCompras, id),
    [],
  );
  const excluirVenda = useCallback(
    async (id: string) => deleteRecord(COLLECTIONS.queijosVendas, id),
    [],
  );

  const cadastrarTipo = useCallback(async (nome: string) => {
    const trimmed = nome.trim();
    if (!trimmed) return;
    await createRecord<TipoQueijo>(COLLECTIONS.queijosTipos, { nome: trimmed });
  }, []);

  const carregarDadosTeste = useCallback(async () => {
    await carregarDadosTesteQueijos();
  }, []);

  const value = useMemo(
    () => ({
      compras: comprasQuery.data,
      vendas: vendasQuery.data,
      tiposCadastrados: tiposQuery.data,
      loading: comprasQuery.loading || vendasQuery.loading || tiposQuery.loading,
      error: comprasQuery.error ?? vendasQuery.error ?? tiposQuery.error,
      salvarCompra,
      salvarVenda,
      marcarPago,
      excluirCompra,
      excluirVenda,
      cadastrarTipo,
      carregarDadosTeste,
    }),
    [
      comprasQuery.data,
      comprasQuery.loading,
      comprasQuery.error,
      vendasQuery.data,
      vendasQuery.loading,
      vendasQuery.error,
      tiposQuery.data,
      tiposQuery.loading,
      tiposQuery.error,
      salvarCompra,
      salvarVenda,
      marcarPago,
      excluirCompra,
      excluirVenda,
      cadastrarTipo,
      carregarDadosTeste,
    ],
  );

  return <QueijosContext.Provider value={value}>{children}</QueijosContext.Provider>;
}

export function useQueijos(): QueijosContextValue {
  const context = useContext(QueijosContext);
  if (!context) throw new Error("useQueijos deve ser usado dentro de QueijosProvider");
  return context;
}
