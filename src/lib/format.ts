/** Formatação e conversões no padrão brasileiro (pt-BR). */

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatters = new Map<number, Intl.NumberFormat>();

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatBRL(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0);
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
  let formatter = decimalFormatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    decimalFormatters.set(digits, formatter);
  }
  return formatter.format(value ?? 0);
}

/** Aceita tanto "1.234,56" quanto "1234.56" (e strings com R$). */
export function parseDecimal(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;

  let text = input.trim().replace(/[^\d,.-]/g, "");
  const hasComma = text.includes(",");
  if (hasComma) {
    text = text.replace(/\./g, "").replace(",", ".");
  }
  const value = Number.parseFloat(text);
  return Number.isFinite(value) ? value : 0;
}

/** Converte "2026-11-25" para "25/11/2026". */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

/** Data de hoje no formato usado pelos inputs type="date" (AAAA-MM-DD). */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Número para CSV: duas casas decimais com vírgula, sem separador de milhar. */
export function csvNumber(value: number | null | undefined): string {
  return (value ?? 0).toFixed(2).replace(".", ",");
}
