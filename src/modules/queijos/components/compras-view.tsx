"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
  calcularTotalQueijo,
  filtrarCompras,
  TIPOS_QUEIJO_INICIAIS,
} from "@/modules/queijos/logic";
import { useQueijos } from "@/modules/queijos/queijos-context";
import type { CompraQueijo } from "@/modules/queijos/types";

type FormState = {
  data: string;
  fornecedor: string;
  tipo: string;
  quantidade: string;
  custoPorKg: string;
};

const formVazio = (): FormState => ({
  data: todayISO(),
  fornecedor: "",
  tipo: TIPOS_QUEIJO_INICIAIS[0],
  quantidade: "",
  custoPorKg: "",
});

export function ComprasView() {
  const { compras, tiposCadastrados, loading, error, salvarCompra, excluirCompra } = useQueijos();
  const { notify, toastElement } = useToast();
  const [form, setForm] = useState<FormState>(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [filtros, setFiltros] = useState({ tipo: "", fornecedor: "", inicio: "", fim: "" });

  const tipos = useMemo(
    () => [
      ...TIPOS_QUEIJO_INICIAIS,
      ...tiposCadastrados.map((tipo) => tipo.nome),
      ...compras.map((compra) => compra.tipo),
    ].filter((tipo, index, array) => array.indexOf(tipo) === index),
    [compras, tiposCadastrados],
  );
  const fornecedores = useMemo(
    () => [...new Set(compras.map((item) => item.fornecedor))].filter(Boolean).sort(),
    [compras],
  );
  const filtradas = useMemo(() => filtrarCompras(compras, filtros), [compras, filtros]);
  const totalCalculado = calcularTotalQueijo(parseDecimal(form.quantidade), parseDecimal(form.custoPorKg));

  function setCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function iniciarEdicao(item: CompraQueijo) {
    setEditandoId(item.id);
    setForm({
      data: item.data,
      fornecedor: item.fornecedor,
      tipo: item.tipo,
      quantidade: String(item.quantidadeKg).replace(".", ","),
      custoPorKg: String(item.custoPorKg).replace(".", ","),
    });
    document.getElementById("form-compra")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formVazio());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantidadeKg = parseDecimal(form.quantidade);
    const custoPorKg = parseDecimal(form.custoPorKg);
    if (!form.data || !form.fornecedor.trim() || quantidadeKg <= 0 || custoPorKg < 0) {
      notify("Preencha data, fornecedor e uma quantidade válida.", "error");
      return;
    }
    setSalvando(true);
    try {
      await salvarCompra(
        {
          data: form.data,
          fornecedor: form.fornecedor.trim(),
          tipo: form.tipo,
          quantidadeKg: round2(quantidadeKg),
          custoPorKg: round2(custoPorKg),
          total: totalCalculado,
        },
        editandoId ?? undefined,
      );
      notify(editandoId ? "Compra atualizada com sucesso." : "Compra registrada com sucesso.");
      cancelarEdicao();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao salvar a compra.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    setExcluindo(true);
    try {
      await excluirCompra(excluirId);
      notify("Compra excluída.");
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
      "queijos-compras",
      ["Data", "Fornecedor / Laticínio", "Tipo de queijo", "Quantidade (kg)", "Custo por kg (R$)", "Total da compra (R$)"],
      filtradas.map((item) => [
        item.data,
        item.fornecedor,
        item.tipo,
        csvNumber(item.quantidadeKg),
        csvNumber(item.custoPorKg),
        csvNumber(item.total),
      ]),
    );
    notify(`${filtradas.length} compra(s) exportada(s) em CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Compras de queijos"
        description="Registre entradas por tipo, fornecedor e custo por kg."
        actions={
          <Button variant="secondary" onClick={exportar} disabled={!filtradas.length}>
            <Download size={16} /> Exportar CSV
          </Button>
        }
      />

      <Card id="form-compra" className="mb-5">
        <SectionTitle
          title={editandoId ? "Editar compra" : "Nova compra"}
          subtitle={editandoId ? "Altere os campos e salve as alterações." : "Preencha os dados da aquisição."}
          actions={
            editandoId ? (
              <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                <X size={14} /> Cancelar edição
              </Button>
            ) : undefined
          }
        />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-6">
          <Field label="Data">
            <Input type="date" required value={form.data} onChange={(e) => setCampo("data", e.target.value)} />
          </Field>
          <Field label="Fornecedor / Laticínio" className="xl:col-span-2">
            <AutocompleteInput
              required
              listId="fornecedores-queijo"
              options={fornecedores}
              placeholder="Ex.: Laticínio Roseira"
              value={form.fornecedor}
              onChange={(e) => setCampo("fornecedor", e.target.value)}
            />
          </Field>
          <Field label="Tipo de queijo">
            <Select value={form.tipo} onChange={(e) => setCampo("tipo", e.target.value)}>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade (kg)">
            <Input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={form.quantidade}
              onChange={(e) => setCampo("quantidade", e.target.value)}
            />
          </Field>
          <Field label="Custo por kg (R$)">
            <Input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={form.custoPorKg}
              onChange={(e) => setCampo("custoPorKg", e.target.value)}
            />
          </Field>
          <div className="flex items-end justify-between gap-3 rounded-lg bg-slate-50 dark:bg-neutral-950 px-4 py-3 xl:col-span-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Total da compra
              </p>
              <p className="text-lg font-bold text-accent-dark">{formatBRL(totalCalculado)}</p>
            </div>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : <><Plus size={16} /> Registrar</>}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Compras registradas" subtitle={`${filtradas.length} de ${compras.length} registro(s)`} />
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 dark:border-neutral-800 px-4 py-4 sm:grid-cols-4 sm:px-5">
          <Field label="Tipo">
            <Select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fornecedor">
            <Select value={filtros.fornecedor} onChange={(e) => setFiltros({ ...filtros, fornecedor: e.target.value })}>
              <option value="">Todos</option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor} value={fornecedor}>{fornecedor}</option>
              ))}
            </Select>
          </Field>
          <Field label="De">
            <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          </Field>
          <Field label="Até">
            <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} />
          </Field>
          <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-4">
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Total filtrado: <strong className="text-slate-800 dark:text-neutral-200">{formatBRL(filtradas.reduce((sum, item) => sum + item.total, 0))}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltros({ tipo: "", fornecedor: "", inicio: "", fim: "" })}
            >
              <Search size={14} /> Limpar filtros
            </Button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : filtradas.length === 0 ? (
          <EmptyState message="Nenhuma compra encontrada para os filtros selecionados." />
        ) : (
          <TableContainer>
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-slate-50/80 dark:bg-neutral-800/60">
                <tr>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Fornecedor</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Quantidade</th>
                  <th className={thClass}>Custo/kg</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filtradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/60">
                    <td className={tdClass}>{formatDate(item.data)}</td>
                    <td className={`${tdClass} font-medium`}>{item.fornecedor}</td>
                    <td className={tdClass}><Badge tone="accent">{item.tipo}</Badge></td>
                    <td className={tdClass}>{formatDecimal(item.quantidadeKg)} kg</td>
                    <td className={tdClass}>{formatBRL(item.custoPorKg)}</td>
                    <td className={`${tdClass} font-semibold text-slate-900 dark:text-neutral-100`}>{formatBRL(item.total)}</td>
                    <td className={tdClass}>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => iniciarEdicao(item)} className="rounded p-1.5 text-slate-500 dark:text-neutral-400 hover:bg-accent-soft hover:text-accent-dark" title="Editar" aria-label="Editar compra">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setExcluirId(item.id)} className="rounded p-1.5 text-slate-500 dark:text-neutral-400 hover:bg-red-50 hover:text-red-700" title="Excluir" aria-label="Excluir compra">
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
        title="Excluir compra?"
        message="Esta compra será removida permanentemente e afetará o estoque e os indicadores."
        onCancel={() => setExcluirId(null)}
        onConfirm={() => void confirmarExclusao()}
        loading={excluindo}
      />
      {toastElement}
    </>
  );
}
