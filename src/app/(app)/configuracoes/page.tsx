"use client";

import { useEffect, useState } from "react";
import { Coffee, Database, Milk, Monitor, Moon, ShieldCheck, Sun } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionTitle,
  useToast,
} from "@/components/ui";
import {
  limparCotacoesManuais,
  lerCotacoesManuais,
  salvarCotacoesManuais,
} from "@/lib/cotacoes";
import { firebaseConfigured } from "@/lib/firebase";
import { type Tema, useTheme } from "@/lib/theme-context";
import { useWorkspace, WORKSPACE_LABEL } from "@/lib/workspace-context";
import { carregarDadosTesteCafe } from "@/modules/cafe/seed";
import { carregarDadosTesteQueijos } from "@/modules/queijos/seed";

const COLECOES = {
  queijos: ["queijos_compras", "queijos_vendas", "queijos_tipos"],
  cafe: ["cafe_producao", "cafe_vendas"],
};

const OPCOES_TEMA: { valor: Tema; rotulo: string; icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", icone: Sun },
  { valor: "escuro", rotulo: "Escuro", icone: Moon },
  { valor: "sistema", rotulo: "Sistema", icone: Monitor },
];

export default function ConfiguracoesPage() {
  const { workspace } = useWorkspace();
  const { tema, setTema } = useTheme();
  const { notify, toastElement } = useToast();
  const [confirmarSeed, setConfirmarSeed] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [manualCafe, setManualCafe] = useState("");
  const [manualLeite, setManualLeite] = useState("");

  useEffect(() => {
    const manuais = lerCotacoesManuais();
    setManualCafe(manuais.cafe);
    setManualLeite(manuais.leite);
  }, []);

  function salvarAjustes() {
    salvarCotacoesManuais({ cafe: manualCafe, leite: manualLeite });
    notify("Ajustes manuais salvos neste dispositivo.");
  }

  function usarAutomatico() {
    limparCotacoesManuais();
    setManualCafe("");
    setManualLeite("");
    notify("Cotações automáticas restauradas.");
  }

  async function carregarTeste() {
    setCarregando(true);
    try {
      if (workspace === "cafe") await carregarDadosTesteCafe();
      else await carregarDadosTesteQueijos();
      notify(`Dados de teste de ${WORKSPACE_LABEL[workspace]} carregados.`);
      setConfirmarSeed(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erro ao carregar dados de teste.", "error");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Status da integração e utilitários do workspace ativo."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Aparência" subtitle="Preferência salva neste navegador" />
          <div className="grid grid-cols-3 gap-2 px-4 py-4 sm:px-5">
            {OPCOES_TEMA.map(({ valor, rotulo, icone: Icone }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTema(valor)}
                aria-pressed={tema === valor}
                className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                  tema === valor
                    ? "border-accent bg-accent-soft text-accent-dark"
                    : "border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800"
                }`}
              >
                <Icone size={18} />
                {rotulo}
              </button>
            ))}
          </div>
          <p className="px-4 pb-4 text-[11px] leading-relaxed text-slate-500 dark:text-neutral-400 sm:px-5">
            &quot;Sistema&quot; acompanha a preferência do dispositivo automaticamente.
          </p>
        </Card>

        <Card>
          <SectionTitle
            title="Cotações"
            subtitle="Ajuste manual opcional — em branco usa a cotação automática"
          />
          <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
            <Field label="Café arábica (R$/saca)" hint="Ex.: 1678,92">
              <Input
                inputMode="decimal"
                placeholder="Automático"
                value={manualCafe}
                onChange={(event) => setManualCafe(event.target.value)}
              />
            </Field>
            <Field label="Leite MG (R$/litro)" hint="Ex.: 2,7978">
              <Input
                inputMode="decimal"
                placeholder="Automático"
                value={manualLeite}
                onChange={(event) => setManualLeite(event.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-5">
            <Button size="sm" onClick={salvarAjustes}>
              Salvar ajustes
            </Button>
            <Button size="sm" variant="secondary" onClick={usarAutomatico}>
              Usar valores automáticos
            </Button>
          </div>
          <p className="border-t border-slate-100 dark:border-neutral-800 px-4 py-3 text-[10px] leading-relaxed text-slate-400 dark:text-neutral-500 sm:px-5">
            Fontes: CEPEA/ESALQ via Cultivee (CC BY-NC 4.0, uso não comercial) e Conseleite-MG via
            MilkPoint.
          </p>
        </Card>

        <Card>
          <SectionTitle title="Ambiente" subtitle="Informações da instalação" />
          <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-neutral-400">Negócio ativo</span>
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-neutral-200">
                {workspace === "cafe" ? <Coffee size={16} className="text-accent" /> : <Milk size={16} className="text-accent" />}
                {WORKSPACE_LABEL[workspace]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-neutral-400">Firebase Auth + Firestore</span>
              <Badge tone={firebaseConfigured ? "success" : "danger"}>
                {firebaseConfigured ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-neutral-400">Plano Firebase</span>
              <Badge tone="success">Spark (sem custo)</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-neutral-400">Ambiente</span>
              <Badge tone="neutral">
                {process.env.NODE_ENV === "development" ? "Desenvolvimento" : "Produção"}
              </Badge>
            </div>
            <p className="rounded-lg bg-slate-50 dark:bg-neutral-950 px-3 py-2 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
              Limites Spark: 50 mil leituras e 20 mil escritas/dia, 1 GiB de armazenamento.
              Evite muitas abas abertas e use Exportar CSV como rotina de backup manual.
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Isolamento dos domínios" subtitle="Coleções usadas pelo negócio selecionado" />
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {COLECOES[workspace].map((colecao) => (
                <span key={colecao} className="rounded-lg bg-accent-soft px-3 py-2 font-mono text-xs text-accent-dark">
                  {colecao}
                </span>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
              Não existem relatórios consolidados entre café e queijos. A troca de negócio carrega
              apenas os módulos e coleções da operação selecionada.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="Dados de teste" subtitle="Disponível também no modal de configurações" />
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-neutral-300">
              <Database size={20} className="mt-0.5 shrink-0 text-accent" />
              <p className="max-w-2xl leading-relaxed">
                Insere registros de exemplo <strong>apenas nas coleções de {WORKSPACE_LABEL[workspace]}</strong>.
                Use somente em desenvolvimento ou em um projeto de teste — os dados são adicionados
                aos existentes e não podem ser desfeitos automaticamente.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setConfirmarSeed(true)} disabled={!firebaseConfigured}>
              Carregar dados de teste
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmarSeed}
        onClose={() => setConfirmarSeed(false)}
        title="Carregar dados de teste?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmarSeed(false)} disabled={carregando}>
              Cancelar
            </Button>
            <Button onClick={() => void carregarTeste()} disabled={carregando}>
              {carregando ? "Carregando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        Serão adicionados registros de exemplo exclusivamente em {WORKSPACE_LABEL[workspace]}.
        Deseja continuar?
      </Modal>
      {toastElement}
    </>
  );
}
