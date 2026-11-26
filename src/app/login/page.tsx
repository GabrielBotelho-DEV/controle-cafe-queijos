"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useWorkspace, WORKSPACE_HOME } from "@/lib/workspace-context";
import { Button, Field, Input } from "@/components/ui";

type Captcha = { token: string; pergunta: string };

const CHAVE_CREDENCIAIS = "cafe-queijo:credenciais";

type Credenciais = { email: string; senha: string };

function lerCredenciais(): Credenciais | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CREDENCIAIS);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<Credenciais>;
    if (typeof dados.email === "string" && typeof dados.senha === "string") {
      return { email: dados.email, senha: dados.senha };
    }
  } catch {
    // Descarta dados corrompidos sem quebrar a tela de login.
  }
  return null;
}

function CheeseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M9 46 54 18v28a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3Z" fill="currentColor" opacity="0.95" />
      <path d="M9 46 54 18l-1.5-2.6a3 3 0 0 0-4.1-1.1L9.9 41.8A3 3 0 0 0 8.6 46Z" fill="currentColor" />
      <circle cx="44" cy="34" r="3.6" fill="#7F1D1D" opacity="0.28" />
      <circle cx="32" cy="41" r="2.6" fill="#7F1D1D" opacity="0.28" />
      <circle cx="49" cy="43" r="2" fill="#7F1D1D" opacity="0.28" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { entrar, user, loading, configured } = useAuth();
  const { workspace, ready } = useWorkspace();
  const { temaEfetivo, alternarTema } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvarSenha, setSalvarSenha] = useState(false);
  const [credenciaisCarregadas, setCredenciaisCarregadas] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [resposta, setResposta] = useState("");
  const [carregandoCaptcha, setCarregandoCaptcha] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && ready && user) router.replace(WORKSPACE_HOME[workspace]);
  }, [loading, ready, user, router, workspace]);

  const carregarCaptcha = useCallback(async () => {
    setCarregandoCaptcha(true);
    try {
      const response = await fetch("/api/captcha", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível gerar a verificação.");
      const dados = (await response.json()) as Captcha;
      setCaptcha(dados);
      setResposta("");
    } catch (error) {
      setCaptcha(null);
      setErro(error instanceof Error ? error.message : "Erro ao carregar o CAPTCHA.");
    } finally {
      setCarregandoCaptcha(false);
    }
  }, []);

  useEffect(() => {
    void carregarCaptcha();
  }, [carregarCaptcha]);

  useEffect(() => {
    const credenciais = lerCredenciais();
    if (credenciais) {
      setEmail(credenciais.email);
      setSenha(credenciais.senha);
      setSalvarSenha(true);
    }
    setCredenciaisCarregadas(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!configured) {
      setErro("Configure as variáveis NEXT_PUBLIC_FIREBASE_* no .env.local antes de entrar.");
      return;
    }
    if (!captcha) {
      setErro("Aguarde a verificação humana ou atualize o desafio.");
      return;
    }
    if (!resposta.trim()) {
      setErro("Responda a verificação humana para continuar.");
      return;
    }

    setEnviando(true);
    try {
      const verificacao = await fetch("/api/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captcha.token, resposta: resposta.trim() }),
      });
      if (!verificacao.ok) {
        setErro("Resposta incorreta ou desafio expirado. Tente o novo desafio.");
        return;
      }
      await entrar(email, senha);

      if (salvarSenha) {
        window.localStorage.setItem(
          CHAVE_CREDENCIAIS,
          JSON.stringify({ email, senha } satisfies Credenciais),
        );
      } else {
        window.localStorage.removeItem(CHAVE_CREDENCIAIS);
      }
    } catch (error) {
      setErro(error instanceof Error ? erroFirebase(error.message) : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
      void carregarCaptcha();
    }
  }

  const rotuloTema = `Alternar para modo ${temaEfetivo === "escuro" ? "claro" : "escuro"}`;

  return (
    <main className="min-h-screen bg-[#faf8f5] dark:bg-neutral-950 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Painel temático */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#4A2C2A] via-[#5c2b26] to-[#7F1D1D] p-10 text-white xl:p-14 lg:flex">
        <div className="absolute right-8 top-8 z-20 hidden lg:block">
          <button
            type="button"
            onClick={alternarTema}
            title={rotuloTema}
            aria-label={rotuloTema}
            className="rounded-lg bg-white/10 p-2 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            {temaEfetivo === "escuro" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-16 top-8 rotate-12 opacity-10">
          <Coffee size={220} strokeWidth={0.7} />
        </div>
        <div className="pointer-events-none absolute -bottom-10 right-4 -rotate-12 opacity-10">
          <CheeseIcon className="h-64 w-64 text-amber-300" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Coffee size={22} className="text-amber-300" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">Gestão &amp; Operações</p>
              <p className="text-[11px] text-white/60">Café e queijos, cada um no seu lugar</p>
            </div>
          </div>

          <h1 className="mt-20 max-w-xl text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Do grão ao queijo, <span className="text-amber-300">tudo sob controle.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Produção, compras, vendas e estoque em módulos separados — simples de usar no dia a dia.
          </p>

          <div className="mt-12 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/20 text-amber-200">
                <Coffee size={20} />
              </span>
              <p className="mt-4 text-sm font-bold">Operação Café</p>
              <p className="mt-1 text-xs text-white/60">Lotes, qualidades, unidades e saldo.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/20 text-amber-200">
                <CheeseIcon className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-bold">Operação Queijos</p>
              <p className="mt-1 text-xs text-white/60">Compras em kg, custo médio e estoque.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={15} /> Acesso restrito a usuários liberados no Firebase
        </div>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Coffee size={20} />
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D97706] text-white">
                <CheeseIcon className="h-6 w-6" />
              </span>
              <span className="ml-1 text-sm font-bold text-slate-900 dark:text-neutral-100">Gestão &amp; Operações</span>
            </div>
            <button
              type="button"
              onClick={alternarTema}
              title={rotuloTema}
              aria-label={rotuloTema}
              className="rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800"
            >
              {temaEfetivo === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">Acesso ao sistema</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
                Entre com o e-mail liberado pelo administrador.
              </p>
            </div>

            {!configured && (
              <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                <strong className="font-semibold">Firebase não configurado.</strong> Copie o
                <code className="mx-1 rounded bg-amber-100 dark:bg-amber-900/50 px-1">.env.example</code>
                para <code className="rounded bg-amber-100 dark:bg-amber-900/50 px-1">.env.local</code> e preencha os dados
                do seu projeto.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="E-mail">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400 dark:text-neutral-500" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="voce@empresa.com.br"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>

              <Field label="Senha">
                <div className="relative">
                  <LockKeyhole size={16} className="absolute left-3 top-3 text-slate-400 dark:text-neutral-500" />
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    className="pl-9 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((valor) => !valor)}
                    className="absolute right-2 top-1.5 rounded-md p-1.5 text-slate-400 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-700"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={salvarSenha}
                  onChange={(event) => {
                    const marcado = event.target.checked;
                    setSalvarSenha(marcado);
                    if (!marcado) window.localStorage.removeItem(CHAVE_CREDENCIAIS);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-neutral-600 accent-[#7F1D1D]"
                />
                <span className="text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                  <span className="font-semibold text-slate-700 dark:text-neutral-200">Salvar senha neste dispositivo</span>
                  <span className="mt-0.5 flex items-start gap-1 text-[11px] text-slate-400 dark:text-neutral-500">
                    <Info size={12} className="mt-0.5 shrink-0" />
                    Fica salva sem criptografia neste navegador. Evite em computadores compartilhados.
                  </span>
                </span>
              </label>

              <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50/80 dark:bg-neutral-800/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    <ShieldCheck size={15} className="text-accent" /> Verificação humana
                  </span>
                  <button
                    type="button"
                    onClick={() => void carregarCaptcha()}
                    disabled={carregandoCaptcha}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={carregandoCaptcha ? "animate-spin" : ""} />
                    Novo desafio
                  </button>
                </div>
                {carregandoCaptcha || !captcha ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-neutral-500">
                    <Loader2 size={15} className="animate-spin" /> Gerando desafio...
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700 dark:text-neutral-200">{captcha.pergunta}</p>
                    <div className="relative mt-2">
                      <KeyRound size={15} className="absolute left-3 top-3 text-slate-400 dark:text-neutral-500" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        placeholder="Sua resposta"
                        value={resposta}
                        onChange={(event) => setResposta(event.target.value)}
                        className="bg-white dark:bg-neutral-900 pl-9"
                      />
                    </div>
                  </>
                )}
              </div>

              {erro && (
                <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                disabled={enviando || carregandoCaptcha || !credenciaisCarregadas}
                className="w-full"
              >
                {enviando ? (
                  <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                ) : (
                  <>Entrar no sistema <ArrowRight size={16} /></>
                )}
              </Button>
            </form>

            <p className="mt-6 flex items-start gap-2 border-t border-slate-100 dark:border-neutral-800 pt-5 text-xs leading-relaxed text-slate-400 dark:text-neutral-500">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
              Não é possível criar conta por aqui. Acesso apenas para usuários cadastrados manualmente no Firebase.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-neutral-500">
            © {new Date().getFullYear()} Gestão &amp; Operações · Uso pessoal
          </p>
        </div>
      </section>
    </main>
  );
}

function erroFirebase(message: string): string {
  if (message.includes("invalid-credential") || message.includes("wrong-password"))
    return "E-mail ou senha incorretos.";
  if (message.includes("user-not-found")) return "E-mail não liberado neste sistema.";
  if (message.includes("invalid-email")) return "Informe um e-mail válido.";
  if (message.includes("too-many-requests")) return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (message.includes("network")) return "Sem conexão com o Firebase. Verifique sua internet.";
  return message;
}
