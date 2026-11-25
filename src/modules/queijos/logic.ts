import { round2 } from "@/lib/format";
import type { CompraQueijo, TipoQueijo, VendaQueijo } from "@/modules/queijos/types";

export const TIPOS_QUEIJO_INICIAIS = [
  "Provolone",
  "Mussarela",
  "Cabaça",
  "Nozinho",
  "Palito",
] as const;

export const CLIENTES_ESPECIAIS_QUEIJO = ["CONSUMO", "PERDA", "BRINDE"] as const;

export function calcularTotalQueijo(quantidadeKg: number, precoPorKg: number): number {
  return round2(quantidadeKg * precoPorKg);
}

export function resumoQueijos(compras: CompraQueijo[], vendas: VendaQueijo[]) {
  const totalComprado = round2(compras.reduce((sum, item) => sum + item.total, 0));
  const totalVendido = round2(vendas.reduce((sum, item) => sum + item.total, 0));
  const aReceber = round2(
    vendas.filter((item) => item.situacao === "Pendente").reduce((sum, item) => sum + item.total, 0),
  );
  return { totalComprado, totalVendido, aReceber, lucroLiquido: round2(totalVendido - totalComprado) };
}

export interface PosicaoQueijo {
  tipo: string;
  compradoKg: number;
  vendidoKg: number;
  estoqueKg: number;
  custoMedioKg: number;
  valorVendido: number;
}

export function posicaoPorTipoQueijo(
  compras: CompraQueijo[],
  vendas: VendaQueijo[],
  tiposCadastrados: TipoQueijo[] = [],
): PosicaoQueijo[] {
  const tipos = new Set<string>([
    ...TIPOS_QUEIJO_INICIAIS,
    ...tiposCadastrados.map((tipo) => tipo.nome),
    ...compras.map((compra) => compra.tipo),
    ...vendas.map((venda) => venda.tipo),
  ]);

  return [...tipos]
    .filter((tipo) => tipo.trim() !== "")
    .map((tipo) => {
      const comprasDoTipo = compras.filter((compra) => compra.tipo === tipo);
      const vendasDoTipo = vendas.filter((venda) => venda.tipo === tipo);
      const compradoKg = round2(comprasDoTipo.reduce((sum, item) => sum + item.quantidadeKg, 0));
      const vendidoKg = round2(vendasDoTipo.reduce((sum, item) => sum + item.quantidadeKg, 0));
      const gasto = comprasDoTipo.reduce((sum, item) => sum + item.total, 0);
      return {
        tipo,
        compradoKg,
        vendidoKg,
        estoqueKg: round2(compradoKg - vendidoKg),
        custoMedioKg: compradoKg > 0 ? round2(gasto / compradoKg) : 0,
        valorVendido: round2(vendasDoTipo.reduce((sum, item) => sum + item.total, 0)),
      };
    })
    .sort((a, b) => a.tipo.localeCompare(b.tipo, "pt-BR"));
}

/** Estoque atual em kg de um tipo específico. */
export function estoqueQueijo(tipo: string, compras: CompraQueijo[], vendas: VendaQueijo[]): number {
  const comprado = compras
    .filter((item) => item.tipo === tipo)
    .reduce((sum, item) => sum + item.quantidadeKg, 0);
  const vendido = vendas
    .filter((item) => item.tipo === tipo)
    .reduce((sum, item) => sum + item.quantidadeKg, 0);
  return round2(comprado - vendido);
}

export function filtrarCompras(
  compras: CompraQueijo[],
  filtros: { tipo: string; fornecedor: string; inicio: string; fim: string },
): CompraQueijo[] {
  return compras.filter((item) => {
    if (filtros.tipo && item.tipo !== filtros.tipo) return false;
    if (filtros.fornecedor && item.fornecedor !== filtros.fornecedor) return false;
    if (filtros.inicio && item.data < filtros.inicio) return false;
    if (filtros.fim && item.data > filtros.fim) return false;
    return true;
  });
}

export function filtrarVendas(
  vendas: VendaQueijo[],
  filtros: { cliente: string; situacao: string; inicio: string; fim: string },
): VendaQueijo[] {
  return vendas.filter((item) => {
    if (filtros.cliente && item.cliente !== filtros.cliente) return false;
    if (filtros.situacao && item.situacao !== filtros.situacao) return false;
    if (filtros.inicio && item.data < filtros.inicio) return false;
    if (filtros.fim && item.data > filtros.fim) return false;
    return true;
  });
}
