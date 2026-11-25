"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  LogOut,
  Milk,
  PackagePlus,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace, WORKSPACE_HOME, type Workspace } from "@/lib/workspace-context";
import { Button, Modal } from "@/components/ui";

const NAV_ITENS: Record<Workspace, { href: string; label: string; icon: typeof Coffee }[]> = {
  queijos: [
    { href: "/queijos/resumo", label: "Resumo", icon: LayoutDashboard },
    { href: "/queijos/compras", label: "Compras", icon: ShoppingCart },
    { href: "/queijos/vendas", label: "Vendas", icon: TrendingUp },
  ],
  cafe: [
    { href: "/cafe/painel", label: "Painel", icon: LayoutDashboard },
    { href: "/cafe/producao", label: "Produção e estoque", icon: PackagePlus },
    { href: "/cafe/vendas", label: "Vendas", icon: ClipboardList },
  ],
};

function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace();
  const router = useRouter();

  function alternar(next: Workspace) {
    if (next === workspace) return;
    setWorkspace(next);
    router.push(WORKSPACE_HOME[next]);
  }

  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
      role="group"
      aria-label="Seletor de negócio"
    >
      <button
        type="button"
        onClick={() => alternar("queijos")}
        aria-pressed={workspace === "queijos"}
        className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
          workspace === "queijos"
            ? "bg-white text-[#7F1D1D] shadow-sm ring-1 ring-[#7F1D1D]/15"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Milk size={15} />
        Queijos
      </button>
      <button
        type="button"
        onClick={() => alternar("cafe")}
        aria-pressed={workspace === "cafe"}
        className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
          workspace === "cafe"
            ? "bg-white text-[#4A2C2A] shadow-sm ring-1 ring-[#4A2C2A]/15"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Coffee size={15} />
        Café
      </button>
    </div>
  );
}

function NavLinks({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const { workspace } = useWorkspace();
  const links = [
    ...NAV_ITENS[workspace],
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <nav className={horizontal ? "flex gap-1" : "space-y-1"}>
      {links.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              horizontal ? "shrink-0 whitespace-nowrap" : ""} ${
              ativo
                ? "bg-accent-soft text-accent-dark ring-1 ring-accent/10"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={18} className={ativo ? "text-accent" : "text-slate-400"} />
            <span className="truncate">{label}</span>
            {ativo && <ChevronRight size={14} className="ml-auto text-accent/60" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { workspace } = useWorkspace();
  const Icon = workspace === "cafe" ? Coffee : Milk;
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">Gestão &amp; Operações</p>
        <p className="truncate text-[11px] font-medium text-accent">
          {workspace === "cafe" ? "Operação Café" : "Operação Queijos"}
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, sair } = useAuth();
  const { workspace } = useWorkspace();
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  return (
    <div data-workspace={workspace} className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-4 py-5">
          <Brand />
        </div>
        <div className="border-b border-slate-100 p-3">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Negócio ativo
          </p>
          <WorkspaceSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="border-t border-slate-100 p-3">
          <p className="truncate px-2 pb-2 text-[11px] text-slate-400" title={user?.email ?? ""}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => setConfirmarSaida(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-2 px-4 pt-3">
            <Brand />
            <button
              type="button"
              onClick={() => setConfirmarSaida(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Sair da conta"
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="px-4 py-3">
            <WorkspaceSwitcher />
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            <NavLinks horizontal />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      <Modal
        open={confirmarSaida}
        onClose={() => setConfirmarSaida(false)}
        title="Sair da conta?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmarSaida(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void sair()}>Sair</Button>
          </>
        }
      >
        Você será redirecionado para a tela de login.
      </Modal>
    </div>
  );
}
