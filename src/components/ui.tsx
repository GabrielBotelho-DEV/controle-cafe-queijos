"use client";

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-slate-800 dark:text-neutral-200 shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-slate-100 dark:disabled:bg-neutral-800";

export const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400";

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-card ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-neutral-800 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-neutral-200">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
};

const buttonVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark shadow-sm",
  secondary: "border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800",
  ghost: "text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800",
  danger: "border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      } ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400 dark:text-neutral-500">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function AutocompleteInput({
  options,
  listId,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { options: string[]; listId: string }) {
  return (
    <>
      <input
        {...props}
        list={listId}
        autoComplete="off"
        className={`${inputClass} ${props.className ?? ""}`}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300",
  success: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  danger: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",
  accent: "bg-accent-soft text-accent-dark",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function TableContainer({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

export const thClass =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400";
export const tdClass = "whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-neutral-200";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-slate-400 dark:text-neutral-500">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500 dark:text-neutral-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-neutral-600 border-t-accent" />
      Carregando dados...
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-6 text-sm text-red-700 dark:text-red-300">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-card sm:p-5 ${
        emphasis ? "border-accent/30 bg-accent-soft/40" : "border-slate-200 dark:border-neutral-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">{label}</p>
        {icon && <span className="text-accent/70">{icon}</span>}
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">{hint}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 px-5 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-neutral-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-200"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 text-sm text-slate-600 dark:text-neutral-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-neutral-800 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

type ToastState = { message: string; type: "success" | "error" | "info" } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ message, type });

  const element = toast ? (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm shadow-xl">
      {toast.type === "success" ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : toast.type === "error" ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <Info size={18} className="mt-0.5 shrink-0 text-accent" />
      )}
      <span className="text-slate-700 dark:text-neutral-200">{toast.message}</span>
    </div>
  ) : null;

  return { notify, toastElement: element };
}
