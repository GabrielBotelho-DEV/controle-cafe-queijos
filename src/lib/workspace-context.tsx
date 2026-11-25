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

export type Workspace = "queijos" | "cafe";

type WorkspaceContextValue = {
  workspace: Workspace;
  ready: boolean;
  setWorkspace: (workspace: Workspace) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const STORAGE_KEY = "sistema-workspace";

export const WORKSPACE_HOME: Record<Workspace, string> = {
  queijos: "/queijos/resumo",
  cafe: "/cafe/painel",
};

export const WORKSPACE_LABEL: Record<Workspace, string> = {
  queijos: "Operação Queijos",
  cafe: "Operação Café",
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace>("queijos");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "queijos" || stored === "cafe") setWorkspaceState(stored);
    setReady(true);
  }, []);

  const setWorkspace = useCallback((next: Workspace) => {
    setWorkspaceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ workspace, ready, setWorkspace }),
    [workspace, ready, setWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider");
  return context;
}
