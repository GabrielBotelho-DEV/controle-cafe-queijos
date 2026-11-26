/** Tipos e preferências locais dos cards de cotação. */

import { parseDecimal } from "@/lib/format";

export type TipoCotacao = "cafe" | "leite";

export type Cotacao = {
  tipo: TipoCotacao;
  titulo: string;
  valor: number;
  unidade: string;
  periodo: string;
  variacao?: number | null;
  fonte: string;
  fonteUrl: string;
  credito: string;
  projetado?: boolean;
  stale?: boolean;
  manual?: boolean;
  atualizadoEm?: string;
};

export type RespostaCotacoes = {
  cafe: Cotacao | null;
  leite: Cotacao | null;
  stale: boolean;
  erro?: string | null;
};

export type CotacoesManuais = { cafe: string; leite: string };

const CHAVE_MANUAIS = "sistema-cafe-queijo:cotacoes-manuais";
export const EVENTO_COTACOES = "sistema-cafe-queijo:cotacoes-alteradas";

function vazias(): CotacoesManuais {
  return { cafe: "", leite: "" };
}

export function lerCotacoesManuais(): CotacoesManuais {
  if (typeof window === "undefined") return vazias();
  try {
    const bruto = window.localStorage.getItem(CHAVE_MANUAIS);
    if (!bruto) return vazias();
    const dados = JSON.parse(bruto) as Partial<CotacoesManuais>;
    return {
      cafe: typeof dados.cafe === "string" ? dados.cafe : "",
      leite: typeof dados.leite === "string" ? dados.leite : "",
    };
  } catch {
    return vazias();
  }
}

export function salvarCotacoesManuais(valores: CotacoesManuais): void {
  const normalizado = { cafe: valores.cafe.trim(), leite: valores.leite.trim() };
  try {
    window.localStorage.setItem(CHAVE_MANUAIS, JSON.stringify(normalizado));
  } catch {
    // Ajuste manual não é essencial para o uso do sistema.
  }
  window.dispatchEvent(new Event(EVENTO_COTACOES));
}

export function limparCotacoesManuais(): void {
  salvarCotacoesManuais(vazias());
}

export function aplicarCotacaoManual(
  cotacao: Cotacao | null,
  valorManual: string,
  tipo: TipoCotacao,
): Cotacao | null {
  if (!cotacao) return null;
  const texto = valorManual.trim();
  if (!texto) return cotacao;

  const valor = parseDecimal(texto);
  if (!Number.isFinite(valor) || valor <= 0) return cotacao;

  return {
    ...cotacao,
    tipo,
    valor,
    periodo: "Ajuste manual",
    variacao: null,
    projetado: false,
    manual: true,
    fonte: "Valor informado manualmente",
  };
}

const formatters = new Map<number, Intl.NumberFormat>();

export function formatCotacaoValor(valor: number, tipo: TipoCotacao): string {
  const casas = tipo === "leite" ? 4 : 2;
  let formatter = formatters.get(casas);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
    formatters.set(casas, formatter);
  }
  return `R$ ${formatter.format(valor)}`;
}
