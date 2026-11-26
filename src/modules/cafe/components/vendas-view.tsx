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
  Textarea,
  tdClass,
  thClass,
  useToast,
} from "@/components/ui";
import { downloadCsv } from "@/lib/csv";
import { csvNumber, formatBRL, formatDate, parseDecimal, round2, todayISO } from "@/lib/format";
import { useCafe } from "@/modules/cafe/cafe-context";
import {
  calcularTotalVendaCafe,
  filtrarVendasCafe,
  PESOS_CAFE,
  QUALIDADES_CAFE,
  saldoPorLote,
} from "@/modules/cafe/logic";
import type {
  FormaPagamentoCafe,
  PesoCafe,
  QualidadeCafe,
  StatusCafe,
  VendaCafe,
} from "@/modules/cafe/types";

type FormState = {
  data: string;
  cliente: string;
  lote: string;
  qualidade: QualidadeCafe;
  peso: string;
  quantidade: string;
  valorUnitario: string;
  status: StatusCafe;
  formaPagamento: FormaPagamentoCafe | "";
  observacoes: string;
};

const formVazio = (): FormState => ({
  data: todayISO(),
  cliente: "",
  lote: "",
  qualidade: "Gourmet",
  peso: "250",
  quantidade: "",
  valorUnitario: "",
  status: "Pago",
  formaPagamento: "Pix",
  observacoes: "",
});

export function VendasCafeView() {
  const { producao, vendas, loading, error, salvarVenda, darBaixa, excluirVenda } = useCafe();
  const { notify, toastElement } = useToast();
  const [form, setForm] = useState<FormState>(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [filtros, setFiltros] = useState({
    lote: "",
    cliente: "",
    status: "",
    observacao: "",
    inicio: "",
    fim: "",
  });

  const lotes = useMemo(() => saldoPorLote(producao, vendas), [producao, vendas]);
  const numerosLote = useMemo(
    () =>
      [...new Set(lotes.filter((lote) => lote.saldo > 0).map((lote) => lote.lote))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [lotes],
  );
  const clientes = useMemo(
    () => [...new Set(vendas.map((item) => item.cliente))].filter(Boolean).sort(),
    [vendas],
  );
  const filtradas = useMemo(() => filtrarVendasCafe(vendas, filtros), [vendas, filtros]);

  const quantidade = parseDecimal(form.quantidade);
  const valorUnitario = parseDecimal(form.valorUnitario);
  const totalCalculado = calcularTotalVendaCafe(quantidade, valorUnitario);
  const loteDigitado = form.lote.trim().toUpperCase();
  const vendaEditada = vendas.find((item) => item.id === editandoId);
  const saldoDisponivel =
    lotes
      .filter((item) => item.lote === loteDigitado)
      .reduce((sum, item) => sum + item.saldo, 0) +
    (vendaEditada && vendaEditada.lote === loteDigitado ? vendaEditada.quantidade : 0);
  const excedeSaldo = quantidade > saldoDisponivel;

  function setCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function iniciarEdicao(item: VendaCafe) {
    setEditandoId(item.id);
    setForm({
      data: item.data,
      cliente: item.cliente,
      lote: item.lote,
      qualidade: item.qualidade,
      peso: String(item.peso),
      quantidade: String(item.quantidade),
      valorUnitario: String(item.valorUnitario).replace(".", ","),
      status: item.status,
      formaPagamento: item.formaPagamento,
      observacoes: item.observacoes,
    });
    document.getElementById("form-venda-cafe")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formVazio());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.data || !loteDigitado || !form.cliente.trim() || quantidade <= 0 || valorUnitario < 0) {
      notify("Preencha data, lote, cliente e uma quantidade válida.", "error");
      return;
    }
    const peso = Number(form.peso) as PesoCafe;
    setSalvando(true);
    try {
      await salvarVenda(
        {
          data: form.data,
          cliente: form.cliente.trim().toUpperCase(),
          lote: loteDigitado,
          qualidade: form.qualidade,
          peso: PESOS_CAFE.includes(peso) ? peso : 250,
          quantidade,
          valorUnitario: round2(valorUnitario),
          total: totalCalculado,
          status: form.status,
          formaPagamento: form.status === "Pago" ? form.formaPagamento : "",
          observacoes: form.observacoes.trim(),
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

  async function confirmarBaixa(id: string) {
    try {
      await darBaixa(id);
      notify("Baixa dada: venda marcada como Paga.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao dar baixa.", "error");
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
      "cafe-vendas",
      ["Data da venda", "Cliente", "Nº do lote", "Qualidade", "Peso (g)", "Quantidade (un.)", "Valor unitário (R$)", "Total da venda (R$)", "Status", "Como foi pago", "Observações"],
      filtradas.map((item) => [
        item.data,
        item.cliente,
        item.lote,
        item.qualidade,
        String(item.peso),
        String(item.quantidade),
        csvNumber(item.valorUnitario),
        csvNumber(item.total),
        item.status,
        item.formaPagamento || "",
        item.observacoes,
      ]),
    );
    notify(`${filtradas.length} venda(s) exportada(s) em CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Controle de vendas — Café"
        description="Vendas com Nº do Lote digitável, qualidade, peso, saldo e status financeiro."
        actions={
          <Button variant="secondary" onClick={exportar} disabled={!filtradas.length}>
            <Download size={16} /> Exportar CSV
          </Button>
        }
      />

      <Card id="form-venda-cafe" className="mb-5">
        <SectionTitle
          title={editandoId ? "Editar venda" : "Nova venda"}
          subtitle={editandoId ? "Altere os campos e salve as alterações." : "Digite o Nº do Lote com saldo disponível."}
          actions={
            editandoId ? (
              <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                <X size={14} /> Cancelar edição
              </Button>
            ) : undefined
          }
        />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-6">
          <Field label="Data da venda">
            <Input type="date" required value={form.data} onChange={(e) => setCampo("data", e.target.value)} />
          </Field>
          <Field label="Cliente">
            <AutocompleteInput
              required
              listId="clientes-cafe"
              options={clientes}
              placeholder="Ex.: Cafeteria Ponto Quente"
              value={form.cliente}
              onChange={(e) => setCampo("cliente", e.target.value)}
            />
          </Field>
          <Field label="Nº do Lote" className="sm:col-span-2 xl:col-span-2" hint="Digite o número do lote com saldo disponível">
            <AutocompleteInput
              required
              listId="lotes-cafe"
              options={numerosLote}
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
          <Field label="Quantidade (un.)">
            <Input type="text" inputMode="numeric" required placeholder="0" value={form.quantidade} onChange={(e) => setCampo("quantidade", e.target.value)} />
          </Field>
          <Field label="Valor unitário (R$)">
            <Input type="text" inputMode="decimal" required placeholder="0,00" value={form.valorUnitario} onChange={(e) => setCampo("valorUnitario", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setCampo("status", e.target.value as StatusCafe)}>
              <option value="Pago">Pago</option>
              <option value="Fiado">Fiado</option>
              <option value="Pendente">Pendente</option>
            </Select>
          </Field>
          <Field label="Como foi pago" hint="Opcional para Fiado ou Pendente">
            <Select
              value={form.formaPagamento}
              onChange={(e) => setCampo("formaPagamento", e.target.value as FormaPagamentoCafe)}
              disabled={form.status !== "Pago"}
            >
              <option value="">—</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Outro">Outro</option>
            </Select>
          </Field>
          <div className="flex flex-col justify-end gap-2 rounded-lg bg-slate-50 px-4 py-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total da venda</p>
              <p className="text-lg font-bold text-accent-dark">{formatBRL(totalCalculado)}</p>
            </div>
            <Button type="submit" disabled={salvando} className="w-full">
              {salvando ? "Salvando..." : editandoId ? "Salvar" : <><Plus size={16} /> Registrar</>}
            </Button>
          </div>
          <Field label="Observações (entrega / logística)" className="sm:col-span-2 xl:col-span-6">
            <Textarea
              rows={2}
              placeholder='Ex.: "GABRIEL ENTREGOU", "LEVAR PRA ESTIVA"'
              value={form.observacoes}
              onChange={(e) => setCampo("observacoes", e.target.value)}
              className="border-amber-300 bg-amber-50/60"
            />
          </Field>
          {excedeSaldo && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 sm:col-span-2 xl:col-span-6">
              <AlertTriangle size={15} /> Saldo disponível deste lote: {saldoDisponivel} un. A quantidade informada é maior que o saldo.
            </p>
          )}
        </form>
      </Card>

      <Card>
        <SectionTitle title="Vendas registradas" subtitle={`${filtradas.length} de ${vendas.length} registro(s)`} />
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
          <Field label="Lote">
            <Input placeholder="Buscar lote..." value={filtros.lote} onChange={(e) => setFiltros({ ...filtros, lote: e.target.value })} />
          </Field>
          <Field label="Cliente">
            <Select value={filtros.cliente} onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}>
              <option value="">Todos</option>
              {clientes.map((cliente) => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Fiado">Fiado</option>
              <option value="Pendente">Pendente</option>
            </Select>
          </Field>
          <Field label="Observação de entrega">
            <Input placeholder="Ex.: GABRIEL..." value={filtros.observacao} onChange={(e) => setFiltros({ ...filtros, observacao: e.target.value })} />
          </Field>
          <Field label="De">
            <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          </Field>
          <Field label="Até">
            <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between gap-2 sm:col-span-2 xl:col-span-4">
            <span className="text-xs text-slate-500">
              Total filtrado: <strong className="text-slate-800">{formatBRL(filtradas.reduce((sum, item) => sum + item.total, 0))}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltros({ lote: "", cliente: "", status: "", observacao: "", inicio: "", fim: "" })}
            >
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
            <table className="w-full min-w-[1180px] border-collapse">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Lote</th>
                  <th className={thClass}>Qualidade</th>
                  <th className={thClass}>Peso</th>
                  <th className={thClass}>Qtd.</th>
                  <th className={thClass}>Valor unit.</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Pagamento</th>
                  <th className={thClass}>Observações</th>
                  <th className={thClass}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className={tdClass}>{formatDate(item.data)}</td>
                    <td className={`${tdClass} font-medium`}>{item.cliente}</td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>{item.lote}</td>
                    <td className={tdClass}><Badge tone="accent">{item.qualidade}</Badge></td>
                    <td className={tdClass}>{item.peso} g</td>
                    <td className={tdClass}>{item.quantidade} un.</td>
                    <td className={tdClass}>{formatBRL(item.valorUnitario)}</td>
                    <td className={`${tdClass} font-semibold text-slate-900`}>{formatBRL(item.total)}</td>
                    <td className={tdClass}>
                      <Badge tone={item.status === "Pago" ? "success" : item.status === "Fiado" ? "warning" : "danger"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className={tdClass}>{item.formaPagamento || "—"}</td>
                    <td className={`${tdClass} max-w-[200px] truncate`} title={item.observacoes}>{item.observacoes || "—"}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1">
                        {(item.status === "Fiado" || item.status === "Pendente") && (
                          <button
                            type="button"
                            onClick={() => void confirmarBaixa(item.id)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            title="Dar baixa como paga"
                          >
                            <Check size={14} /> Baixa
                          </button>
                        )}
                        <button type="button" onClick={() => iniciarEdicao(item)} className="rounded p-1.5 text-slate-500 hover:bg-accent-soft hover:text-accent-dark" title="Editar" aria-label="Editar venda de café">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => setExcluirId(item.id)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" title="Excluir" aria-label="Excluir venda de café">
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
        message="A venda será removida permanentemente e afetará o estoque e os indicadores de café."
        onCancel={() => setExcluirId(null)}
        onConfirm={() => void confirmarExclusao()}
        loading={excluindo}
      />
      {toastElement}
    </>
  );
}
