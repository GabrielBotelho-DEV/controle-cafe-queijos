"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Download, Pencil, Plus, Trash2, X } from "lucide-react";
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
  Textarea,
  tdClass,
  thClass,
  useToast,
} from "@/components/ui";
import { downloadCsv } from "@/lib/csv";
import { csvNumber, formatBRL, formatDate, parseDecimal, round2, todayISO } from "@/lib/format";
import { calcularCustoProducao, filtrarProducao, PESOS_CAFE, QUALIDADES_CAFE } from "@/modules/cafe/logic";
import { useCafe } from "@/modules/cafe/cafe-context";
import type {
  PesoCafe,
  ProducaoCafe,
  QualidadeCafe,
} from "@/modules/cafe/types";

type FormState = {
  data: string;
  lote: string;
  qualidade: QualidadeCafe;
  peso: string;
  quantidade: string;
  custoCafe: string;
  luizPago: string;
  custoTorra: string;
  torraPaga: string;
  observacoes: string;
};

const formVazio = (): FormState => ({
  data: todayISO(),
  lote: "",
  qualidade: "Gourmet",
  peso: "250",
  quantidade: "",
  custoCafe: "",
  luizPago: "Não",
  custoTorra: "",
  torraPaga: "Não",
  observacoes: "",
});

export function ProducaoView() {
  const { producao, loading, error, salvarProducao, excluirProducao } = useCafe();
  const { notify, toastElement } = useToast();
  const [form, setForm] = useState<FormState>(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [filtros, setFiltros] = useState({ lote: "", qualidade: "", inicio: "", fim: "" });

  const lotes = useMemo(
    () => [...new Set(producao.map((item) => item.lote))].filter(Boolean).sort(),
    [producao],
  );
  const filtradas = useMemo(() => filtrarProducao(producao, filtros), [producao, filtros]);
  const custoCafe = parseDecimal(form.custoCafe);
  const custoTorra = parseDecimal(form.custoTorra);
  const custoTotal = calcularCustoProducao(custoCafe, custoTorra);

  function setCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function iniciarEdicao(item: ProducaoCafe) {
    setEditandoId(item.id);
    setForm({
      data: item.data,
      lote: item.lote,
      qualidade: item.qualidade,
      peso: String(item.peso),
      quantidade: String(item.quantidade),
      custoCafe: String(item.custoCafe).replace(".", ","),
      luizPago: item.luizPago ? "Sim" : "Não",
      custoTorra: String(item.custoTorra).replace(".", ","),
      torraPaga: item.torraPaga ? "Sim" : "Não",
      observacoes: item.observacoes,
    });
    document.getElementById("form-producao")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formVazio());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantidade = parseDecimal(form.quantidade);
    if (!form.data || !form.lote.trim() || quantidade <= 0) {
      notify("Preencha data, lote e uma quantidade válida.", "error");
      return;
    }
    const peso = Number(form.peso) as PesoCafe;
    setSalvando(true);
    try {
      await salvarProducao(
        {
          data: form.data,
          lote: form.lote.trim().toUpperCase(),
          qualidade: form.qualidade,
          peso: PESOS_CAFE.includes(peso) ? peso : 250,
          quantidade,
          custoCafe: round2(custoCafe),
          luizPago: form.luizPago === "Sim",
          custoTorra: round2(custoTorra),
          torraPaga: form.torraPaga === "Sim",
          custoTotal,
          observacoes: form.observacoes.trim(),
        },
        editandoId ?? undefined,
      );
      notify(editandoId ? "Produção atualizada com sucesso." : "Lote registrado com sucesso.");
      cancelarEdicao();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao salvar a produção.", "error");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    setExcluindo(true);
    try {
      await excluirProducao(excluirId);
      notify("Registro de produção excluído.");
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
      "cafe-producao",
      ["Data de fabricação", "Nº do lote", "Qualidade", "Peso (g)", "Quantidade produzida (un.)", "Custo do café (R$)", "Luiz pago?", "Custo da torra (R$)", "Torra paga?", "Custo total (R$)", "Observações"],
      filtradas.map((item) => [
        item.data,
        item.lote,
        item.qualidade,
        String(item.peso),
        String(item.quantidade),
        csvNumber(item.custoCafe),
        item.luizPago ? "Sim" : "Não",
        csvNumber(item.custoTorra),
        item.torraPaga ? "Sim" : "Não",
        csvNumber(item.custoTotal),
        item.observacoes,
      ]),
    );
    notify(`${filtradas.length} registro(s) exportado(s) em CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Produção e estoque"
        description="Cada registro representa um lote e um peso específico (250 g ou 500 g)."
        actions={
          <Button variant="secondary" onClick={exportar} disabled={!filtradas.length}>
            <Download size={16} /> Exportar CSV
          </Button>
        }
      />

      <Card id="form-producao" className="mb-5">
        <SectionTitle
          title={editandoId ? "Editar lote" : "Novo lote produzido"}
          subtitle={editandoId ? "Altere os campos e salve as alterações." : "Informe a fabricação, os custos e o pagamento."}
          actions={
            editandoId ? (
              <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                <X size={14} /> Cancelar edição
              </Button>
            ) : undefined
          }
        />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
          <Field label="Data de fabricação">
            <Input type="date" required value={form.data} onChange={(e) => setCampo("data", e.target.value)} />
          </Field>
          <Field label="Nº do lote">
            <AutocompleteInput
              required
              listId="lotes-cafe"
              options={lotes}
              placeholder="Ex.: 25014"
              value={form.lote}
              onChange={(e) => setCampo("lote", e.target.value)}
            />
          </Field>
          <Field label="Qualidade">
            <Select value={form.qualidade} onChange={(e) => setCampo("qualidade", e.target.value as QualidadeCafe)}>
              {QUALIDADES_CAFE.map((qualidade) => (
                <option key={qualidade} value={qualidade}>{qualidade}</option>
              ))}
            </Select>
          </Field>
          <Field label="Peso (g)">
            <Select value={form.peso} onChange={(e) => setCampo("peso", e.target.value)}>
              {PESOS_CAFE.map((peso) => (
                <option key={peso} value={peso}>{peso} g</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade produzida (un.)">
            <Input type="text" inputMode="numeric" required placeholder="0" value={form.quantidade} onChange={(e) => setCampo("quantidade", e.target.value)} />
          </Field>
          <Field label="Custo do café (R$)">
            <Input type="text" inputMode="decimal" placeholder="0,00" value={form.custoCafe} onChange={(e) => setCampo("custoCafe", e.target.value)} />
          </Field>
          <Field label="Luiz pago?">
            <Select value={form.luizPago} onChange={(e) => setCampo("luizPago", e.target.value)}>
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </Select>
          </Field>
          <Field label="Custo da torra (R$)">
            <Input type="text" inputMode="decimal" placeholder="0,00" value={form.custoTorra} onChange={(e) => setCampo("custoTorra", e.target.value)} />
          </Field>
          <Field label="Torra paga?">
            <Select value={form.torraPaga} onChange={(e) => setCampo("torraPaga", e.target.value)}>
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </Select>
          </Field>
          <div className="flex flex-col justify-end gap-2 rounded-lg bg-slate-50 px-4 py-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Custo total</p>
              <p className="text-lg font-bold text-accent-dark">{formatBRL(custoTotal)}</p>
            </div>
            <Button type="submit" disabled={salvando} className="w-full">
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : <><Plus size={16} /> Registrar</>}
            </Button>
          </div>
          <Field label="Observações" className="sm:col-span-2 xl:col-span-5">
            <Textarea
              rows={2}
              placeholder='Ex.: "grão", "LUIZ PAGOU A TORRA"'
              value={form.observacoes}
              onChange={(e) => setCampo("observacoes", e.target.value)}
            />
          </Field>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Lotes registrados" subtitle={`${filtradas.length} de ${producao.length} registro(s)`} />
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
          <Field label="Lote">
            <Input placeholder="Buscar lote..." value={filtros.lote} onChange={(e) => setFiltros({ ...filtros, lote: e.target.value })} />
          </Field>
          <Field label="Qualidade">
            <Select value={filtros.qualidade} onChange={(e) => setFiltros({ ...filtros, qualidade: e.target.value })}>
              <option value="">Todas</option>
              {QUALIDADES_CAFE.map((qualidade) => (
                <option key={qualidade} value={qualidade}>{qualidade}</option>
              ))}
            </Select>
          </Field>
          <Field label="De">
            <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          </Field>
          <Field label="Até">
            <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between gap-2 sm:col-span-2 xl:col-span-4">
            <span className="text-xs text-slate-500">
              Produção filtrada: <strong className="text-slate-800">{filtradas.reduce((sum, item) => sum + item.quantidade, 0)} un.</strong> · Custo:{" "}
              <strong className="text-slate-800">{formatBRL(filtradas.reduce((sum, item) => sum + item.custoTotal, 0))}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setFiltros({ lote: "", qualidade: "", inicio: "", fim: "" })}>
              <X size={14} /> Limpar filtros
            </Button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : filtradas.length === 0 ? (
          <EmptyState message="Nenhum lote encontrado para os filtros selecionados." />
        ) : (
          <TableContainer>
            <table className="w-full min-w-[1100px] border-collapse">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className={thClass}>Fabricação</th>
                  <th className={thClass}>Lote</th>
                  <th className={thClass}>Qualidade</th>
                  <th className={thClass}>Peso</th>
                  <th className={thClass}>Produzido</th>
                  <th className={thClass}>Custo café</th>
                  <th className={thClass}>Luiz pago?</th>
                  <th className={thClass}>Custo torra</th>
                  <th className={thClass}>Torra paga?</th>
                  <th className={thClass}>Custo total</th>
                  <th className={thClass}>Observações</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className={tdClass}>{formatDate(item.data)}</td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>{item.lote}</td>
                    <td className={tdClass}><Badge tone="accent">{item.qualidade}</Badge></td>
                    <td className={tdClass}>{item.peso} g</td>
                    <td className={tdClass}>{item.quantidade} un.</td>
                    <td className={tdClass}>{formatBRL(item.custoCafe)}</td>
                    <td className={tdClass}>
                      <Badge tone={item.luizPago ? "success" : "warning"}>{item.luizPago ? "Sim" : "Não"}</Badge>
                    </td>
                    <td className={tdClass}>{formatBRL(item.custoTorra)}</td>
                    <td className={tdClass}>
                      <Badge tone={item.torraPaga ? "success" : "warning"}>{item.torraPaga ? "Sim" : "Não"}</Badge>
                    </td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>{formatBRL(item.custoTotal)}</td>
                    <td className={`${tdClass} max-w-[220px] truncate`} title={item.observacoes}>{item.observacoes || "—"}</td>
                    <td className={tdClass}>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => iniciarEdicao(item)} className="rounded p-1.5 text-slate-500 hover:bg-accent-soft hover:text-accent-dark" title="Editar" aria-label="Editar produção">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setExcluirId(item.id)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" title="Excluir" aria-label="Excluir produção">
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
        title="Excluir lote?"
        message="O lote será removido permanentemente e afetará o estoque e os indicadores de café."
        onCancel={() => setExcluirId(null)}
        onConfirm={() => void confirmarExclusao()}
        loading={excluindo}
      />
      {toastElement}
    </>
  );
}
