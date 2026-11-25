import type { FirestoreRecord } from "@/lib/firestore";

export type QualidadeCafe = "Gourmet" | "Tradicional";
export type PesoCafe = 250 | 500;
export type StatusCafe = "Pago" | "Fiado" | "Pendente";
export type FormaPagamentoCafe = "Pix" | "Dinheiro" | "Cartão" | "Outro";

export interface ProducaoCafe extends FirestoreRecord {
  data: string;
  lote: string;
  qualidade: QualidadeCafe;
  peso: PesoCafe;
  quantidade: number;
  custoCafe: number;
  luizPago: boolean;
  custoTorra: number;
  torraPaga: boolean;
  custoTotal: number;
  observacoes: string;
}

export interface VendaCafe extends FirestoreRecord {
  data: string;
  cliente: string;
  lote: string;
  qualidade: QualidadeCafe;
  peso: PesoCafe;
  quantidade: number;
  valorUnitario: number;
  total: number;
  status: StatusCafe;
  formaPagamento: FormaPagamentoCafe | "";
  observacoes: string;
}

export type ProducaoCafeInput = Omit<ProducaoCafe, keyof FirestoreRecord>;
export type VendaCafeInput = Omit<VendaCafe, keyof FirestoreRecord>;
