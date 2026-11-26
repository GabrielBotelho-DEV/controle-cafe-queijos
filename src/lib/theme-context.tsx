"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tema = "claro" | "escuro" | "sistema";

type TemaEfetivo = "claro" | "escuro";

type ThemeContextValue = {
  tema: Tema;
  temaEfetivo: TemaEfetivo;
  setTema: (tema: Tema) => void;
  alternarTema: () => void;
};

const CHAVE_TEMA = "sistema-cafe-queijo:tema";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function lerTema(): Tema {
  if (typeof window === "undefined") return "claro";
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA);
    return salvo === "claro" || salvo === "escuro" || salvo === "sistema" ? salvo : "claro";
  } catch {
    return "claro";
  }
}

function preferenciaSistema(): TemaEfetivo {
  if (typeof window === "undefined") return "claro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function aplicarTema(tema: Tema): TemaEfetivo {
  const efetivo = tema === "sistema" ? preferenciaSistema() : tema;
  const raiz = document.documentElement;
  raiz.classList.toggle("dark", efetivo === "escuro");
  raiz.dataset.tema = efetivo;
  // color-scheme aceita "light"/"dark", não os rótulos em português.
  raiz.style.colorScheme = efetivo === "escuro" ? "dark" : "light";
  return efetivo;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("claro");
  const [temaEfetivo, setTemaEfetivo] = useState<TemaEfetivo>("claro");

  useEffect(() => {
    // O script no <head> já aplicou o tema salvo; aqui sincronizamos o React
    // e reaplicamos sempre que a aba volta, para curar qualquer dessincronização.
    const sincronizar = () => {
      const salvo = lerTema();
      setTemaState(salvo);
      setTemaEfetivo(aplicarTema(salvo));
    };
    sincronizar();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudarSistema = () => {
      if (lerTema() === "sistema") setTemaEfetivo(aplicarTema("sistema"));
    };
    const aoAlterarArmazenamento = (event: StorageEvent) => {
      if (event.key === CHAVE_TEMA) sincronizar();
    };
    const aoVoltarParaAba = () => {
      if (document.visibilityState === "visible") sincronizar();
    };

    media.addEventListener("change", aoMudarSistema);
    window.addEventListener("storage", aoAlterarArmazenamento);
    window.addEventListener("focus", sincronizar);
    document.addEventListener("visibilitychange", aoVoltarParaAba);
    return () => {
      media.removeEventListener("change", aoMudarSistema);
      window.removeEventListener("storage", aoAlterarArmazenamento);
      window.removeEventListener("focus", sincronizar);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, []);

  const setTema = useCallback((proximo: Tema) => {
    try {
      window.localStorage.setItem(CHAVE_TEMA, proximo);
    } catch {
      // Preferência não crítica: segue aplicando na sessão atual.
    }
    setTemaState(proximo);
    setTemaEfetivo(aplicarTema(proximo));
  }, []);

  const alternarTema = useCallback(() => {
    // Fonte única da verdade: a classe realmente aplicada no <html>.
    const efetivoAtual: TemaEfetivo = document.documentElement.classList.contains("dark")
      ? "escuro"
      : "claro";
    setTema(efetivoAtual === "escuro" ? "claro" : "escuro");
  }, [setTema]);

  const valor = useMemo(
    () => ({ tema, temaEfetivo, setTema, alternarTema }),
    [tema, temaEfetivo, setTema, alternarTema],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return contexto;
}
