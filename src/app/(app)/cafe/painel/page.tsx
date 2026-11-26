"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  CircleDollarSign,
  Clock3,
  Coins,
  Download,
  PackageCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionTitle,
  StatCard,
  TableContainer,
  tdClass,
  thClass,
  useToast,
} from "@/components/ui";
import { CotacaoCard } from "@/components/cotacao-card";
import { downloadCsv } from "@/lib/csv";
import { formatBRL, formatDate, round2 } from "@/lib/format";
import { useCafe } from "@/modules/cafe/cafe-context";
import {
  estoquePorQualidade,
  resumoCafe,
  saldoPorLote,
  vendasEmAbertoCafe,
} from "@/modules/cafe/logic";

export default function PainelCafePage() {
  const { producao, vendas, loading, error, darBaixa, carregarDadosTeste } = useCafe();
  const { notify, toastElement } = useToast();

  const resumo = useMemo(() => resumoCafe(producao, vendas), [producao, vendas]);
  const qualidade = useMemo(() => estoquePorQualidade(producao, vendas), [producao, vendas]);
  const lotes = useMemo(() => saldoPorLote(producao, vendas), [producao, vendas]);
  const pendentes = useMemo(() => vendasEmAbertoCafe(vendas), [vendas]);
  const totalPendente = useMemo(
    () => round2(pendentes.reduce((sum, item) => sum + item.total, 0)),
    [pendentes],
  );

  async function confirmarBaixa(id: string) {
    try {
      await darBaixa(id);
      notify("Baixa dada: venda marcada como Paga.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao dar baixa.", "error");
    }
  }

  function exportarLotes() {
    downloadCsv(
      "cafe-saldo-por-lote",
      ["Nº do lote", "Qualidade", "Peso (g)", "Produzido (un.)", "Vendido (un.)", "Saldo disponível (un.)"],
      lotes.map((item) => [
        item.lote,
        item.qualidade,
        String(item.peso),
        String(item.produzido),
        String(item.vendido),
        String(item.saldo),
      ]),
    );
    notify("Saldo por lote exportado em CSV.");
  }

  function exportarQualidade() {
    downloadCsv(
      "cafe-estoque-por-qualidade",
      ["Qualidade", "Produzido (un.)", "Vendido (un.)", "Disponível (un.)"],
      qualidade.map((item) => [item.qualidade, String(item.produzido), String(item.vendido), String(item.disponivel)]),
    );
    notify("Estoque por qualidade exportado em CSV.");
  }

  async function carregarTeste() {
    try {
      await carregarDadosTeste();
      notify("Dados de teste de café carregados.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao carregar dados de teste.", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Painel geral — Café"
        description="Indicadores de produção, vendas e estoque exclusivos da operação de café."
        actions={
          <>
            {process.env.NODE_ENV === "development" && (
              <Button variant="secondary" onClick={() => void carregarTeste()}>
                Carregar dados de teste
              </Button>
            )}
            <Button variant="secondary" onClick={exportarLotes} disabled={!lotes.length}>
              <Download size={16} /> Exportar CSV
            </Button>
          </>
        }
      />

      <div className="mb-5">
        <CotacaoCard tipo="cafe" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unidades produzidas" value={String(resumo.unidadesProduzidas)} icon={<Boxes size={18} />} />
        <StatCard label="Unidades vendidas" value={String(resumo.unidadesVendidas)} icon={<ShoppingBag size={18} />} />
        <StatCard label="Estoque disponível" value={`${resumo.estoqueDisponivel} un.`} icon={<PackageCheck size={18} />} emphasis />
        <StatCard label="Valor total vendido" value={formatBRL(resumo.valorTotalVendido)} icon={<CircleDollarSign size={18} />} />
        <StatCard label="Vendas pagas" value={formatBRL(resumo.vendasPagas)} icon={<Wallet size={18} />} />
        <StatCard label="Valor fiado" value={formatBRL(resumo.valorFiado)} icon={<Clock3 size={18} />} />
        <StatCard label="Valor pendente" value={formatBRL(resumo.valorPendente)} icon={<Clock3 size={18} />} />
        <StatCard label="Custo total registrado" value={formatBRL(resumo.custoTotalRegistrado)} icon={<Coins size={18} />} />
      </div>

      <Card className="mb-5">
        <SectionTitle
          title="Vendas em aberto — Café"
          subtitle={`${pendentes.length} registro(s) · ${formatBRL(totalPendente)} em Fiado/Pendente`}
        />
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : pendentes.length === 0 ? (
          <EmptyState message="Nenhuma venda pendente ou fiada." />
        ) : (
          <TableContainer>
            <table className="w-full min-w-[1000px] border-collapse">
              <thead className="bg-slate-50/80 dark:bg-neutral-800/60">
                <tr>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Lote</th>
                  <th className={thClass}>Qualidade</th>
                  <th className={thClass}>Peso</th>
                  <th className={thClass}>Qtd.</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Observações</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {pendentes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/60">
                    <td className={tdClass}>{formatDate(item.data)}</td>
                    <td className={`${tdClass} font-medium`}>{item.cliente}</td>
                    <td className={`${tdClass} font-semibold text-slate-900 dark:text-neutral-100`}>{item.lote}</td>
                    <td className={tdClass}><Badge tone="accent">{item.qualidade}</Badge></td>
                    <td className={tdClass}>{item.peso} g</td>
                    <td className={tdClass}>{item.quantidade} un.</td>
                    <td className={`${tdClass} font-semibold text-slate-900 dark:text-neutral-100`}>{formatBRL(item.total)}</td>
                    <td className={tdClass}>
                      <Badge tone={item.status === "Fiado" ? "warning" : "danger"}>{item.status}</Badge>
                    </td>
                    <td className={`${tdClass} max-w-[200px] truncate`} title={item.observacoes}>
                      {item.observacoes || "—"}
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => void confirmarBaixa(item.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50"
                        title="Dar baixa como paga"
                      >
                        <Check size={14} /> Baixa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionTitle
            title="Estoque por qualidade"
            subtitle="Produção e vendas agrupadas por qualidade"
            actions={
              <Button variant="ghost" size="sm" onClick={exportarQualidade} disabled={!qualidade.length}>
                <Download size={14} /> Exportar CSV
              </Button>
            }
          />
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <TableContainer>
              <table className="w-full min-w-[520px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-neutral-800/60">
                  <tr>
                    <th className={thClass}>Qualidade</th>
                    <th className={thClass}>Produzido (un.)</th>
                    <th className={thClass}>Vendido (un.)</th>
                    <th className={thClass}>Disponível (un.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {qualidade.map((item) => (
                    <tr key={item.qualidade} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/60">
                      <td className={`${tdClass} font-semibold text-slate-800 dark:text-neutral-200`}>{item.qualidade}</td>
                      <td className={tdClass}>{item.produzido}</td>
                      <td className={tdClass}>{item.vendido}</td>
                      <td className={tdClass}>
                        <Badge tone={item.disponivel <= 0 ? "danger" : "success"}>{item.disponivel}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Saldo por lote"
            subtitle="Agrupado por lote + qualidade + peso"
            actions={
              <Button variant="ghost" size="sm" onClick={exportarLotes} disabled={!lotes.length}>
                <Download size={14} /> Exportar CSV
              </Button>
            }
          />
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <LoadingState />
          ) : lotes.length === 0 ? (
            <EmptyState message="Nenhum lote registrado ainda." />
          ) : (
            <TableContainer>
              <table className="w-full min-w-[620px] border-collapse">
                <thead className="bg-slate-50/80 dark:bg-neutral-800/60">
                  <tr>
                    <th className={thClass}>Lote</th>
                    <th className={thClass}>Qualidade</th>
                    <th className={thClass}>Peso</th>
                    <th className={thClass}>Produzido</th>
                    <th className={thClass}>Vendido</th>
                    <th className={thClass}>Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {lotes.map((item) => (
                    <tr key={item.chave} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/60">
                      <td className={`${tdClass} font-semibold text-slate-900 dark:text-neutral-100`}>{item.lote}</td>
                      <td className={tdClass}><Badge tone="accent">{item.qualidade}</Badge></td>
                      <td className={tdClass}>{item.peso} g</td>
                      <td className={tdClass}>{item.produzido}</td>
                      <td className={tdClass}>{item.vendido}</td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${
                            item.saldo <= 0 ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {item.saldo <= 0 && <AlertTriangle size={13} />}
                          {item.saldo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          )}
        </Card>
      </div>
      {toastElement}
    </>
  );
}
