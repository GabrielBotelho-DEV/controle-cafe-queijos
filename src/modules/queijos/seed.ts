import { COLLECTIONS, seedRecords } from "@/lib/firestore";
import type { CompraQueijo, VendaQueijo } from "@/modules/queijos/types";

/** Carrega apenas dados da operação de queijos. Nunca escreve em coleções de café. */
export async function carregarDadosTesteQueijos(): Promise<void> {
  const hoje = new Date();
  const data = (offset: number) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  await Promise.all([
    seedRecords<CompraQueijo>(COLLECTIONS.queijosCompras, [
      { data: data(20), fornecedor: "Laticínio Roseira", tipo: "Provolone", quantidadeKg: 12, custoPorKg: 32.5, total: 390 },
      { data: data(18), fornecedor: "Laticínio Roseira", tipo: "Mussarela", quantidadeKg: 20, custoPorKg: 28, total: 560 },
      { data: data(12), fornecedor: "Fazenda Boa Vida", tipo: "Cabaça", quantidadeKg: 8, custoPorKg: 36, total: 288 },
      { data: data(9), fornecedor: "Laticínio Roseira", tipo: "Nozinho", quantidadeKg: 6, custoPorKg: 42, total: 252 },
      { data: data(5), fornecedor: "Cooperativa Serra", tipo: "Palito", quantidadeKg: 5.5, custoPorKg: 30, total: 165 },
    ]),
    seedRecords<VendaQueijo>(COLLECTIONS.queijosVendas, [
      { data: data(15), cliente: "Mercado Central", tipo: "Provolone", quantidadeKg: 7, precoPorKg: 48, total: 336, formaPagamento: "Pix", situacao: "Pago" },
      { data: data(11), cliente: "Padaria da Vila", tipo: "Mussarela", quantidadeKg: 10, precoPorKg: 39, total: 390, formaPagamento: "Dinheiro", situacao: "Pago" },
      { data: data(7), cliente: "Mercado Central", tipo: "Cabaça", quantidadeKg: 3.5, precoPorKg: 52, total: 182, formaPagamento: "Pix", situacao: "Pendente" },
      { data: data(4), cliente: "Restaurante Sabor", tipo: "Nozinho", quantidadeKg: 2, precoPorKg: 59, total: 118, formaPagamento: "Cartão", situacao: "Pago" },
      { data: data(2), cliente: "CONSUMO", tipo: "Palito", quantidadeKg: 0.5, precoPorKg: 0, total: 0, formaPagamento: "Outro", situacao: "Pago" },
    ]),
  ]);
}
