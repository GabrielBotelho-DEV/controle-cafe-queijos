import type { FirestoreRecord } from "@/lib/firestore";

export type FormaPagamentoQueijo = "Pix" | "Dinheiro" | "Cartão" | "Outro";
export type SituacaoQueijo = "Pago" | "Pendente";

export interface CompraQueijo extends FirestoreRecord {
  data: string;
  fornecedor: string;
  tipo: string;
  quantidadeKg: number;
  custoPorKg: number;
  total: number;
}

export interface VendaQueijo extends FirestoreRecord {
  data: string;
  cliente: string;
  tipo: string;
  quantidadeKg: number;
  precoPorKg: number;
  total: number;
  formaPagamento: FormaPagamentoQueijo;
  situacao: SituacaoQueijo;
}

export interface TipoQueijo extends FirestoreRecord {
  nome: string;
}

export type CompraQueijoInput = Omit<CompraQueijo, keyof FirestoreRecord>;
export type VendaQueijoInput = Omit<VendaQueijo, keyof FirestoreRecord>;
