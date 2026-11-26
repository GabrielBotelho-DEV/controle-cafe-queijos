"use client";

import { useCallback, useEffect, useState } from "react";
import { Coffee, ExternalLink, Milk, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  aplicarCotacaoManual,
  EVENTO_COTACOES,
  formatCotacaoValor,
  lerCotacoesManuais,
  type Cotacao,
  type RespostaCotacoes,
  type TipoCotacao,
} from "@/lib/cotacoes";
import { formatDecimal } from "@/lib/format";

const FONTES: Record<TipoCotacao, string> = {
  cafe: "https://cultivee.com.br/cotacoes/cafe",
  leite: "https://www.milkpoint.com.br/preco-do-leite/conseleite/mg/",
};

const TITULOS: Record<TipoCotacao, string> = {
  cafe: "Café arábica",
  leite: "Leite — Minas Gerais",
};

export function CotacaoCard({ tipo }: { tipo: TipoCotacao }) {
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const manuais = lerCotacoesManuais();
    try {
      const resposta = await fetch("/api/cotacoes", { cache: "no-store" });
      if (!resposta.ok) throw new Error("Falha ao consultar cotações.");
      const dados = (await resposta.json()) as RespostaCotacoes;
      const base = dados[tipo];
      const comStale = base ? { ...base, stale: dados.stale || Boolean(base.stale) } : null;
      setCotacao(aplicarCotacaoManual(comStale, manuais[tipo], tipo));
    } catch {
      setCotacao((anterior) => aplicarCotacaoManual(anterior, manuais[tipo], tipo));
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => {
    void carregar();
    const recarregar = () => void carregar();
    window.addEventListener(EVENTO_COTACOES, recarregar);
    window.addEventListener("storage", recarregar);
    return () => {
      window.removeEventListener(EVENTO_COTACOES, recarregar);
      window.removeEventListener("storage", recarregar);
    };
  }, [carregar]);

  const Icon = tipo === "cafe" ? Coffee : Milk;
  const titulo = cotacao?.titulo ?? TITULOS[tipo];
  const fonteUrl = cotacao?.fonteUrl ?? FONTES[tipo];
  const variacao = cotacao?.variacao;
  const temVariacao = typeof variacao === "number" && Number.isFinite(variacao);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Cotação atual
            </p>
            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-neutral-100">{titulo}</h2>
          </div>
        </div>
        <a
          href={fonteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent-soft"
        >
          Fonte <ExternalLink size={12} />
        </a>
      </div>

      <div className="border-t border-slate-100 dark:border-neutral-800 px-4 py-3 sm:px-5">
        {carregando && !cotacao ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400">Carregando cotação...</p>
        ) : !cotacao ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Cotação indisponível no momento.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {formatCotacaoValor(cotacao.valor, tipo)}
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">{cotacao.unidade}</span>
              {cotacao.manual && <Badge tone="accent">Manual</Badge>}
              {!cotacao.manual && cotacao.projetado && <Badge tone="warning">Projetado</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-neutral-400">
              <span>Período: {cotacao.periodo}</span>
              {temVariacao && (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    (variacao ?? 0) >= 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {(variacao ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {(variacao ?? 0) >= 0 ? "+" : ""}
                  {formatDecimal(variacao, 2)}%
                </span>
              )}
              {cotacao.stale && <Badge tone="warning">Último valor disponível</Badge>}
            </div>
          </>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400 dark:text-neutral-500">
          {tipo === "cafe"
            ? "CEPEA/ESALQ via Cultivee — CC BY-NC 4.0 (uso não comercial)"
            : "Conseleite-MG via MilkPoint"}
        </p>
      </div>
    </Card>
  );
}
