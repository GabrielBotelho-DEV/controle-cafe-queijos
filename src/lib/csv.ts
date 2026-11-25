import { formatDate } from "@/lib/format";

type CsvRow = (string | number | null | undefined)[];

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text = formatDate(text);
  if (/[;"\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Gera um CSV compatível com Excel em pt-BR: ; como separador e BOM UTF-8. */
export function buildCsv(headers: string[], rows: CsvRow[]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(";"));
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvRow[]): void {
  const blob = new Blob([buildCsv(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
