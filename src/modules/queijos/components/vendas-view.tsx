"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Check, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  AutocompleteInput,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  SectionTitle,
  Select,
  TableContainer,
  tdClass,
  thClass,
  useToast,
} from "@/components/ui";
import { downloadCsv } from "@/lib/csv";
import { csvNumber, formatBRL, formatDate, formatDecimal, parseDecimal, round2, todayISO } from "@/lib/format";
import {
  CLIENTES_ESPECIAIS_QUEIJO,
  calcularTotalQueijo,
  estoqueQueijo,
  filtrarVendas,
  TIPOS_QUEIJO_INICIAIS,
} from "@/modules/queijos/logic";
import { useQueijos } from "@/modules/queijos/queijos-context";
import type { FormaPagamentoQueijo, SituacaoQueijo, VendaQueijo } from "@/modules/queijos/types";

type FormState = {
  data: string;
  cliente: string;
  tipo: string;
  quantidade: string;
  precoPorKg: string;
  formaPagamento: FormaPagamentoQueijo;
  situacao: SituacaoQueijo;
};

const formVazio = (): FormState => ({
  data: todayISO(),
  cliente: "",
  tipo: TIPOS_QUEIJO_INICIAIS[0],
  quantidade: "",
  precoPorKg: "",
  formaPagamento: "Pix",
  situacao: "Pago",
});

export function VendasView() {
  const { compras, vendas, tiposCadastrados, loading, error, salvarVenda, marcarPago, excluirVenda } =
    useQueijos();
  const { notify, toastElement } = useToast();
  const [form, setForm] = useState<FormState>(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [perda, setPerda] = useState(false);
  const [filtros, setFiltros] = useState({ cliente: "", situacao: "", inicio: "", fim: "" });

  const tipos = useMemo(
    () =>
      [
        ...TIPOS_QUEIJO_INICIAIS,
        ...tiposCadastrados.map((tipo) => tipo.nome),
        ...compras.map((item) => item.tipo),
        ...vendas.map((item) => item.tipo),
      ].filter((tipo, index, array) => array.indexOf(tipo) === index),
    [compras, vendas, tiposCadastrados],
  );
  const clientes = useMemo(
    () => [...new Set(vendas.map((item) => item.cliente))].filter(Boolean).sort(),
    [vendas],
  );
  const filtradas = useMemo(() => filtrarVendas(vendas, filtros), [vendas, filtros]);

  const quantidade = parseDecimal(form.quantidade);
  const precoPorKg = parseDecimal(form.precoPorKg);
  const totalCalculado = calcularTotalQueijo(quantidade, precoPorKg);
  const vendaEditada = vendas.find((item) => item.id === editandoId);
  const estoqueDisponivel = round2(
    estoqueQueijo(form.tipo, compras, vendas) + (vendaEditada?.tipo === form.tipo ? vendaEditada.quantidadeKg : 0),
  );
  const excedeEstoque = quantidade > estoqueDisponivel;

  function setCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function alternarPerda(ativo: boolean) {
    setPerda(ativo);
    setForm((anterior) => ({
      ...anterior,
      ...(ativo
        ? { precoPorKg: "0", formaPagamento: "Outro" as const, situacao: "Pago" as const }
        : {}),
    }));
  }

  function iniciarEdicao(item: VendaQueijo) {
    setEditandoId(item.id);
    setForm({
      data: item.data,
      cliente: item.cliente,
      tipo: item.tipo,
      quantidade: String(item.quantidadeKg).replace(".", ","),
      precoPorKg: String(item.precoPorKg).replace(".", ","),
      formaPagamento: item.formaPagamento,
      situacao: item.situacao,
    });
    setPerda(item.precoPorKg === 0 && item.formaPagamento === "Outro");
    document.getElementById("form-venda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formVazio());
    setPerda(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.data || !form.cliente.trim() || quantidade <= 0 || precoPorKg < 0) {
      notify("Preencha data, cliente e uma quantidade válida.", "error");
      return;
    }
    setSalvando(true);
    try {
      await salvarVenda(
        {
          data: form.data,
          cliente: form.cliente.trim().toUpperCase(),
          tipo: form.tipo,
          quantidadeKg: round2(quantidade),
          precoPorKg: round2(precoPorKg),
          total: totalCalculado,
          formaPagamento: form.formaPagamento,
          situacao: form.situacao,
        },
        editandoId ?? undefined,
      );
      notify(editandoId ? "Venda atualizada com sucesso." : "Venda registrada com sucesso.");
      cancelarEdicao();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao salvar a venda.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarPagamento(id: string) {
    try {
      await marcarPago(id);
      notify("Venda marcada como Paga.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao atualizar a venda.", "error");
    }
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    setExcluindo(true);
    try {
      await excluirVenda(excluirId);
      notify("Venda excluída.");
      if (editandoId === excluirId) cancelarEdicao();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    } finally {
      setExcluindo(false);
      setExcluirId(null);
    }
  }

  function exportar() {
    downloadCsv(
      "queijos-vendas",
      ["Data", "Cliente", "Tipo de queijo", "Quantidade (kg)", "Preço por kg (R$)", "Total da venda (R$)", "Forma de pagamento", "Situação"],
      filtradas.map((item) => [
        item.data,
        item.cliente,
        item.tipo,
        csvNumber(item.quantidadeKg),
        csvNumber(item.precoPorKg),
        csvNumber(item.total),
        item.formaPagamento,
        item.situacao,
      ]),
    );
    notify(`${filtradas.length} venda(s) exportada(s) em CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Vendas de queijos"
        description="Saídas, clientes, formas de pagamento e situação financeira."
        actions={
          <Button variant="secondary" onClick={exportar} disabled={!filtradas.length}>
            <Download size={16} /> Exportar CSV
          </Button>
        }
      />

      <Card id="form-venda" className="mb-5">
        <SectionTitle
          title={editandoId ? "Editar venda" : "Nova venda"}
          subtitle={editandoId ? "Altere os campos e salve as alterações." : "Registre uma venda ou uma saída sem faturamento."}
          actions={
            editandoId ? (
              <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                <X size={14} /> Cancelar edição
              </Button>
            ) : undefined
          }
        />
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <label className="flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              checked={perda}
              onChange={(event) => alternarPerda(event.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
            <span className="text-xs font-semibold text-slate-700">
              Registrar perda / consumo / brinde (não entra no faturamento)
            </span>
          </label>
          {perda && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cliente:</span>
              {CLIENTES_ESPECIAIS_QUEIJO.map((cliente) => (
                <button
                  key={cliente}
                  type="button"
                  onClick={() => setCampo("cliente", cliente)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    form.cliente === cliente
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cliente}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <Field label="Data">
            <Input type="date" required value={form.data} onChange={(e) => setCampo("data", e.target.value)} />
          </Field>
          <Field label="Cliente">
            <AutocompleteInput
              required
              listId="clientes-queijo"
              options={[...clientes, ...CLIENTES_ESPECIAIS_QUEIJO]}
              placeholder="Ex.: Mercado Central"
              value={form.cliente}
              onChange={(e) => setCampo("cliente", e.target.value)}
            />
          </Field>
          <Field label="Tipo de queijo" hint={`Estoque atual: ${formatDecimal(estoqueDisponivel)} kg`}>
            <Select value={form.tipo} onChange={(e) => setCampo("tipo", e.target.value)}>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade vendida (kg)">
            <Input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={form.quantidade}
              onChange={(e) => setCampo("quantidade", e.target.value)}
            />
          </Field>
          <Field label="Preço por kg (R$)">
            <Input
              type="text"
              inputMode="decimal"
              required
              disabled={perda}
              placeholder="0,00"
              value={form.precoPorKg}
              onChange={(e) => setCampo("precoPorKg", e.target.value)}
            />
          </Field>
          <Field label="Forma de pagamento">
            <Select
              value={form.formaPagamento}
              disabled={perda}
              onChange={(e) => setCampo("formaPagamento", e.target.value as FormaPagamentoQueijo)}
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Outro">Outro</option>
            </Select>
          </Field>
          <Field label="Situação">
            <Select
              value={form.situacao}
              disabled={perda}
              onChange={(e) => setCampo("situacao", e.target.value as SituacaoQueijo)}
            >
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
            </Select>
          </Field>
          <div className="flex items-end justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total da venda</p>
              <p className="text-lg font-bold text-accent-dark">{formatBRL(totalCalculado)}</p>
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar" : <><Plus size={16} /> Registrar</>}
            </Button>
          </div>
          {excedeEstoque && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 xl:col-span-4">
              <AlertTriangle size={15} /> A quantidade informada é maior que o estoque disponível deste tipo ({formatDecimal(estoqueDisponivel)} kg).
            </p>
          )}
        </form>
      </Card>

      <Card>
        <SectionTitle title="Vendas registradas" subtitle={`${filtradas.length} de ${vendas.length} registro(s)`} />
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-4 sm:px-5">
          <Field label="Cliente">
            <Select value={filtros.cliente} onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}>
              <option value="">Todos</option>
              {clientes.map((cliente) => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </Select>
          </Field>
          <Field label="Situação">
            <Select value={filtros.situacao} onChange={(e) => setFiltros({ ...filtros, situacao: e.target.value })}>
              <option value="">Todas</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
            </Select>
          </Field>
          <Field label="De">
            <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          </Field>
          <Field label="Até">
            <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} />
          </Field>
          <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-4">
            <span className="text-xs text-slate-500">
              Total filtrado: <strong className="text-slate-800">{formatBRL(filtradas.reduce((sum, item) => sum + item.total, 0))}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setFiltros({ cliente: "", situacao: "", inicio: "", fim: "" })}>
              <X size={14} /> Limpar filtros
            </Button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : filtradas.length === 0 ? (
          <EmptyState message="Nenhuma venda encontrada para os filtros selecionados." />
        ) : (
          <TableContainer>
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Quantidade</th>
                  <th className={thClass}>Preço/kg</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Pagamento</th>
                  <th className={thClass}>Situação</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className={tdClass}>{formatDate(item.data)}</td>
                    <td className={`${tdClass} font-medium`}>{item.cliente}</td>
                    <td className={tdClass}><Badge tone="accent">{item.tipo}</Badge></td>
                    <td className={tdClass}>{formatDecimal(item.quantidadeKg)} kg</td>
                    <td className={tdClass}>{formatBRL(item.precoPorKg)}</td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>{formatBRL(item.total)}</td>
                    <td className={tdClass}>{item.formaPagamento}</td>
                    <td className={tdClass}>
                      <Badge tone={item.situacao === "Pago" ? "success" : "warning"}>{item.situacao}</Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1">
                        {item.situacao === "Pendente" && (
                          <button
                            type="button"
                            onClick={() => void confirmarPagamento(item.id)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            title="Marcar como pago"
                          >
                            <Check size={14} /> Pago
                          </button>
                        )}
                        <button type="button" onClick={() => iniciarEdicao(item)} className="rounded p-1.5 text-slate-500 hover:bg-accent-soft hover:text-accent-dark" title="Editar" aria-label="Editar venda">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setExcluirId(item.id)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" title="Excluir" aria-label="Excluir venda">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(excluirId)}
        title="Excluir venda?"
        message="Esta venda será removida permanentemente e afetará o estoque e os indicadores."
        onCancel={() => setExcluirId(null)}
        onConfirm={() => void confirmarExclusao()}
        loading={excluindo}
      />
      {toastElement}
    </>
  );
}
