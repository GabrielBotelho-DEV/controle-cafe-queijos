import { COLLECTIONS, seedRecords } from "@/lib/firestore";
import type { ProducaoCafe, VendaCafe } from "@/modules/cafe/types";

/** Carrega apenas dados da operação de café. Nunca escreve em coleções de queijos. */
export async function carregarDadosTesteCafe(): Promise<void> {
  const hoje = new Date();
  const data = (offset: number) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  await Promise.all([
    seedRecords<ProducaoCafe>(COLLECTIONS.cafeProducao, [
      { data: data(25), lote: "25014", qualidade: "Gourmet", peso: 250, quantidade: 120, custoCafe: 780, luizPago: true, custoTorra: 180, torraPaga: true, custoTotal: 960, observacoes: "grão" },
      { data: data(20), lote: "25019", qualidade: "Tradicional", peso: 500, quantidade: 80, custoCafe: 640, luizPago: false, custoTorra: 120, torraPaga: true, custoTotal: 760, observacoes: "LUIZ PAGOU A TORRA" },
      { data: data(14), lote: "26022", qualidade: "Gourmet", peso: 500, quantidade: 60, custoCafe: 570, luizPago: true, custoTorra: 90, torraPaga: false, custoTotal: 660, observacoes: "" },
      { data: data(6), lote: "25014", qualidade: "Gourmet", peso: 250, quantidade: 40, custoCafe: 260, luizPago: true, custoTorra: 60, torraPaga: true, custoTotal: 320, observacoes: "grão" },
    ]),
    seedRecords<VendaCafe>(COLLECTIONS.cafeVendas, [
      { data: data(18), cliente: "Cafeteria Ponto Quente", lote: "25014", qualidade: "Gourmet", peso: 250, quantidade: 30, valorUnitario: 16, total: 480, status: "Pago", formaPagamento: "Pix", observacoes: "GABRIEL ENTREGOU" },
      { data: data(12), cliente: "Mercado Municipal", lote: "25019", qualidade: "Tradicional", peso: 500, quantidade: 25, valorUnitario: 24, total: 600, status: "Pago", formaPagamento: "Dinheiro", observacoes: "" },
      { data: data(8), cliente: "Cafeteria Ponto Quente", lote: "26022", qualidade: "Gourmet", peso: 500, quantidade: 20, valorUnitario: 28, total: 560, status: "Fiado", formaPagamento: "", observacoes: "LEVAR PRA ESTIVA" },
      { data: data(3), cliente: "Padaria da Vila", lote: "25014", qualidade: "Gourmet", peso: 250, quantidade: 45, valorUnitario: 16, total: 720, status: "Pendente", formaPagamento: "", observacoes: "" },
    ]),
  ]);
}
