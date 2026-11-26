"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Clock3, Download, Plus, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
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
import { csvNumber, formatBRL, formatDecimal } from "@/lib/format";
import { posicaoPorTipoQueijo, resumoQueijos } from "@/modules/queijos/logic";
import { useQueijos } from "@/modules/queijos/queijos-context";

export default function ResumoQueijosPage() {
  const { compras, vendas, tiposCadastrados, loading, error, cadastrarTipo, carregarDadosTeste } =
    useQueijos();
  const { notify, toastElement } = useToast();
  const [novoTipo, setNovoTipo] = useState("");
  const [cadastrando, setCadastrando] = useState(false);

  const resumo = useMemo(() => resumoQueijos(compras, vendas), [compras, vendas]);
  const posicao = useMemo(
    () => posicaoPorTipoQueijo(compras, vendas, tiposCadastrados),
    [compras, vendas, tiposCadastrados],
  );

  async function handleNovoTipo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!novoTipo.trim()) return;
    setCadastrando(true);
    try {
      await cadastrarTipo(novoTipo);
      notify(`Tipo "${novoTipo.trim()}" cadastrado.`);
      setNovoTipo("");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao cadastrar o tipo.", "error");
    } finally {
      setCadastrando(false);
    }
  }

  function exportar() {
    downloadCsv(
      "queijos-posicao-por-tipo",
      ["Tipo de queijo", "Comprado (kg)", "Vendido (kg)", "Estoque (kg)", "Custo médio/kg (R$)", "Valor vendido (R$)"],
      posicao.map((item) => [
        item.tipo,
        csvNumber(item.compradoKg),
        csvNumber(item.vendidoKg),
        csvNumber(item.estoqueKg),
        csvNumber(item.custoMedioKg),
        csvNumber(item.valorVendido),
      ]),
    );
    notify("Posição por tipo exportada em CSV.");
  }

  async function carregarTeste() {
    try {
      await carregarDadosTeste();
      notify("Dados de teste de queijos carregados.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao carregar dados de teste.", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Painel de controle — Queijos"
        description="Indicadores e posição de estoque exclusivos da operação de queijos."
        actions={
          <>
            {process.env.NODE_ENV === "development" && (
              <Button variant="secondary" onClick={() => void carregarTeste()}>
                Carregar dados de teste
              </Button>
            )}
            <Button variant="secondary" onClick={exportar} disabled={!posicao.length}>
              <Download size={16} /> Exportar CSV
            </Button>
          </>
        }
      />

      <div className="mb-5">
        <CotacaoCard tipo="leite" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total comprado" value={formatBRL(resumo.totalComprado)} icon={<ShoppingCart size={18} />} />
        <StatCard label="Total vendido" value={formatBRL(resumo.totalVendido)} icon={<TrendingUp size={18} />} />
        <StatCard label="A receber" value={formatBRL(resumo.aReceber)} icon={<Clock3 size={18} />} hint="Vendas pendentes" />
        <StatCard
          label="Lucro líquido"
          value={formatBRL(resumo.lucroLiquido)}
          icon={<Wallet size={18} />}
          hint="Vendido − comprado"
          emphasis
        />
      </div>

      <Card>
        <SectionTitle
          title="Posição por tipo de queijo"
          subtitle="Comprado, vendido e estoque em kg por tipo"
          actions={
            <form onSubmit={handleNovoTipo} className="flex items-center gap-2">
              <Input
                aria-label="Novo tipo de queijo"
                placeholder="Novo tipo..."
                value={novoTipo}
                onChange={(event) => setNovoTipo(event.target.value)}
                className="w-36 py-1.5 text-xs sm:w-44"
              />
              <Button type="submit" size="sm" disabled={cadastrando || !novoTipo.trim()}>
                <Plus size={14} /> Tipo
              </Button>
            </form>
          }
        />
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : posicao.length === 0 ? (
          <EmptyState message="Nenhum dado de queijos ainda. Registre compras e vendas para ver a posição." />
        ) : (
          <TableContainer>
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-slate-50/80 dark:bg-neutral-800/60">
                <tr>
                  <th className={thClass}>Tipo de queijo</th>
                  <th className={thClass}>Comprado (kg)</th>
                  <th className={thClass}>Vendido (kg)</th>
                  <th className={thClass}>Estoque (kg)</th>
                  <th className={thClass}>Custo médio/kg</th>
                  <th className={thClass}>Valor vendido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {posicao.map((item) => {
                  const critico = item.estoqueKg <= 0;
                  return (
                    <tr key={item.tipo} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/60">
                      <td className={`${tdClass} font-semibold text-slate-800 dark:text-neutral-200`}>{item.tipo}</td>
                      <td className={tdClass}>{formatDecimal(item.compradoKg)}</td>
                      <td className={tdClass}>{formatDecimal(item.vendidoKg)}</td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${
                            critico ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {critico && <AlertTriangle size={13} />}
                          {formatDecimal(item.estoqueKg)}
                        </span>
                      </td>
                      <td className={tdClass}>{formatBRL(item.custoMedioKg)}</td>
                      <td className={`${tdClass} font-semibold text-slate-900 dark:text-neutral-100`}>{formatBRL(item.valorVendido)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableContainer>
        )}
        <div className="border-t border-slate-100 dark:border-neutral-800 px-5 py-3 text-xs text-slate-500 dark:text-neutral-400">
          Tipos cadastrados: <Badge tone="accent">{tiposCadastrados.length}</Badge> personalizado(s)
        </div>
      </Card>
      {toastElement}
    </>
  );
}
