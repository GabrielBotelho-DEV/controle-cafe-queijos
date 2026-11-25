"use client";

import { useState } from "react";
import { Coffee, Database, Milk, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Modal,
  PageHeader,
  SectionTitle,
  useToast,
} from "@/components/ui";
import { firebaseConfigured } from "@/lib/firebase";
import { useWorkspace, WORKSPACE_LABEL } from "@/lib/workspace-context";
import { carregarDadosTesteCafe } from "@/modules/cafe/seed";
import { carregarDadosTesteQueijos } from "@/modules/queijos/seed";

const COLECOES = {
  queijos: ["queijos_compras", "queijos_vendas", "queijos_tipos"],
  cafe: ["cafe_producao", "cafe_vendas"],
};

export default function ConfiguracoesPage() {
  const { workspace } = useWorkspace();
  const { notify, toastElement } = useToast();
  const [confirmarSeed, setConfirmarSeed] = useState(false);
  const [carregando, setCarregando] = useState(false);

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
          <SectionTitle title="Ambiente" subtitle="Informações da instalação" />
          <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Negócio ativo</span>
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                {workspace === "cafe" ? <Coffee size={16} className="text-accent" /> : <Milk size={16} className="text-accent" />}
                {WORKSPACE_LABEL[workspace]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Firebase Auth + Firestore</span>
              <Badge tone={firebaseConfigured ? "success" : "danger"}>
                {firebaseConfigured ? "Configurado" : "Não configurado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Plano Firebase</span>
              <Badge tone="success">Spark (sem custo)</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Ambiente</span>
              <Badge tone="neutral">
                {process.env.NODE_ENV === "development" ? "Desenvolvimento" : "Produção"}
              </Badge>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
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
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
              Não existem relatórios consolidados entre café e queijos. A troca de negócio carrega
              apenas os módulos e coleções da operação selecionada.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle title="Dados de teste" subtitle="Disponível também no modal de configurações" />
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3 text-sm text-slate-600">
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
