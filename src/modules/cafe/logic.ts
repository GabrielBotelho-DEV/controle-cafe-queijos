import { round2 } from "@/lib/format";
import type {
  PesoCafe,
  ProducaoCafe,
  QualidadeCafe,
  VendaCafe,
} from "@/modules/cafe/types";

export const QUALIDADES_CAFE: QualidadeCafe[] = ["Gourmet", "Tradicional"];
export const PESOS_CAFE: PesoCafe[] = [250, 500];

export function calcularCustoProducao(custoCafe: number, custoTorra: number): number {
  return round2(custoCafe + custoTorra);
}

export function calcularTotalVendaCafe(quantidade: number, valorUnitario: number): number {
  return round2(quantidade * valorUnitario);
}

export function resumoCafe(producao: ProducaoCafe[], vendas: VendaCafe[]) {
  const unidadesProduzidas = producao.reduce((sum, item) => sum + item.quantidade, 0);
  const unidadesVendidas = vendas.reduce((sum, item) => sum + item.quantidade, 0);
  return {
    unidadesProduzidas,
    unidadesVendidas,
    estoqueDisponivel: unidadesProduzidas - unidadesVendidas,
    valorTotalVendido: round2(vendas.reduce((sum, item) => sum + item.total, 0)),
    vendasPagas: round2(
      vendas.filter((item) => item.status === "Pago").reduce((sum, item) => sum + item.total, 0),
    ),
    valorFiado: round2(
      vendas.filter((item) => item.status === "Fiado").reduce((sum, item) => sum + item.total, 0),
    ),
    valorPendente: round2(
      vendas.filter((item) => item.status === "Pendente").reduce((sum, item) => sum + item.total, 0),
    ),
    custoTotalRegistrado: round2(producao.reduce((sum, item) => sum + item.custoTotal, 0)),
  };
}

export function estoquePorQualidade(producao: ProducaoCafe[], vendas: VendaCafe[]) {
  return QUALIDADES_CAFE.map((qualidade) => {
    const produzido = producao
      .filter((item) => item.qualidade === qualidade)
      .reduce((sum, item) => sum + item.quantidade, 0);
    const vendido = vendas
      .filter((item) => item.qualidade === qualidade)
      .reduce((sum, item) => sum + item.quantidade, 0);
    return { qualidade, produzido, vendido, disponivel: produzido - vendido };
  });
}

export interface SaldoLoteCafe {
  chave: string;
  lote: string;
  qualidade: QualidadeCafe;
  peso: PesoCafe;
  produzido: number;
  vendido: number;
  saldo: number;
}

function chaveLote(lote: string, qualidade: QualidadeCafe, peso: PesoCafe): string {
  return `${lote}|${qualidade}|${peso}`;
}

export function saldoPorLote(producao: ProducaoCafe[], vendas: VendaCafe[]): SaldoLoteCafe[] {
  const lotes = new Map<string, SaldoLoteCafe>();

  const obter = (lote: string, qualidade: QualidadeCafe, peso: PesoCafe): SaldoLoteCafe => {
    const chave = chaveLote(lote, qualidade, peso);
    if (!lotes.has(chave)) {
      lotes.set(chave, { chave, lote, qualidade, peso, produzido: 0, vendido: 0, saldo: 0 });
    }
    return lotes.get(chave)!;
  };

  producao.forEach((item) => {
    obter(item.lote, item.qualidade, item.peso).produzido += item.quantidade;
  });
  vendas.forEach((item) => {
    obter(item.lote, item.qualidade, item.peso).vendido += item.quantidade;
  });

  return [...lotes.values()]
    .map((item) => ({ ...item, saldo: item.produzido - item.vendido }))
    .sort((a, b) => a.lote.localeCompare(b.lote, "pt-BR") || a.peso - b.peso);
}

export function saldoDisponivelCafe(
  lote: string,
  qualidade: QualidadeCafe,
  peso: PesoCafe,
  producao: ProducaoCafe[],
  vendas: VendaCafe[],
): number {
  const item = saldoPorLote(producao, vendas).find(
    (loteItem) =>
      loteItem.lote === lote && loteItem.qualidade === qualidade && loteItem.peso === peso,
  );
  return item?.saldo ?? 0;
}

export function filtrarProducao(
  producao: ProducaoCafe[],
  filtros: { lote: string; qualidade: string; inicio: string; fim: string },
): ProducaoCafe[] {
  return producao.filter((item) => {
    if (filtros.lote && !item.lote.toLowerCase().includes(filtros.lote.toLowerCase())) return false;
    if (filtros.qualidade && item.qualidade !== filtros.qualidade) return false;
    if (filtros.inicio && item.data < filtros.inicio) return false;
    if (filtros.fim && item.data > filtros.fim) return false;
    return true;
  });
}

export function filtrarVendasCafe(
  vendas: VendaCafe[],
  filtros: { lote: string; cliente: string; status: string; observacao: string; inicio: string; fim: string },
): VendaCafe[] {
  return vendas.filter((item) => {
    if (filtros.lote && !item.lote.toLowerCase().includes(filtros.lote.toLowerCase())) return false;
    if (filtros.cliente && item.cliente !== filtros.cliente) return false;
    if (filtros.status && item.status !== filtros.status) return false;
    if (filtros.observacao && !item.observacoes.toLowerCase().includes(filtros.observacao.toLowerCase())) return false;
    if (filtros.inicio && item.data < filtros.inicio) return false;
    if (filtros.fim && item.data > filtros.fim) return false;
    return true;
  });
}
