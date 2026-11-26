import { NextResponse } from "next/server";
import type { Cotacao, RespostaCotacoes, TipoCotacao } from "@/lib/cotacoes";
import { parseDecimal } from "@/lib/format";

export const dynamic = "force-dynamic";

const REVALIDAR_SEGUNDOS = 3600;
const URL_CAFE = "https://cultivee.com.br/dados/cotacoes/ultimo.json";
const URL_LEITE = "https://www.milkpoint.com.br/preco-do-leite/conseleite/mg/";
const CREDITO_CAFE =
  "CEPEA/ESALQ via Cultivee — CC BY-NC 4.0 (uso não comercial)";
const CREDITO_LEITE =
  "Conseleite-MG via MilkPoint — valor de referência pago ao produtor";

/** Últimos valores válidos em memória para fallback quando a fonte estiver fora. */
const ultimos: Record<TipoCotacao, Cotacao | null> = { cafe: null, leite: null };

function textoLimpo(valor: string): string {
  return valor
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&atilde;/gi, "ã")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function buscarCafe(): Promise<Cotacao> {
  const resposta = await fetch(URL_CAFE, {
    next: { revalidate: REVALIDAR_SEGUNDOS },
    headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
  });
  if (!resposta.ok) throw new Error(`Cultivee respondeu ${resposta.status}.`);

  const dados = (await resposta.json()) as {
    itens?: Array<{
      key?: string;
      valor?: number | string;
      data_ref?: string;
      var_pct?: number | string;
      unidade?: string;
    }>;
  };
  const item = dados.itens?.find((registro) => registro.key === "cafe-arabica");
  if (!item) throw new Error("Cotação de café arábica não encontrada na fonte.");

  const valor = Number(item.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Valor de café arábica inválido na fonte.");
  }

  return {
    tipo: "cafe",
    titulo: "Café arábica",
    valor,
    unidade: "R$/saca de 60 kg",
    periodo: item.data_ref ?? "—",
    variacao: item.var_pct === undefined || item.var_pct === null ? null : Number(item.var_pct),
    fonte: "CEPEA/ESALQ via Cultivee",
    fonteUrl: "https://cultivee.com.br/cotacoes/cafe",
    credito: CREDITO_CAFE,
    atualizadoEm: new Date().toISOString(),
  };
}

async function buscarLeite(): Promise<Cotacao> {
  const resposta = await fetch(URL_LEITE, {
    next: { revalidate: REVALIDAR_SEGUNDOS },
    headers: {
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "Mozilla/5.0 (compatible; GestaoCafeQueijo/1.0)",
    },
  });
  if (!resposta.ok) throw new Error(`MilkPoint respondeu ${resposta.status}.`);

  const html = await resposta.text();
  const trecho = html.match(/<strong>\s*Conseleite MG\s*<\/strong>([\s\S]*?)<\/table>/i)?.[1];
  if (!trecho) throw new Error("Tabela Conseleite-MG não encontrada na fonte.");

  const linhas = Array.from(
    trecho.matchAll(/<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi),
  );
  const primeira = linhas[0];
  if (!primeira) throw new Error("Nenhum valor de leite MG encontrado na tabela.");

  const periodoBruto = textoLimpo(primeira[1]);
  const valor = parseDecimal(textoLimpo(primeira[2]));
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Valor de leite MG inválido na fonte.");
  }

  return {
    tipo: "leite",
    titulo: "Leite — Minas Gerais",
    valor,
    unidade: "R$/litro",
    periodo: periodoBruto.replace("*", ""),
    variacao: null,
    fonte: "Conseleite-MG via MilkPoint",
    fonteUrl: URL_LEITE,
    credito: CREDITO_LEITE,
    projetado: periodoBruto.includes("*"),
    atualizadoEm: new Date().toISOString(),
  };
}

export async function GET() {
  const resultados = await Promise.allSettled([buscarCafe(), buscarLeite()]);

  const cafe = resultados[0].status === "fulfilled"
    ? resultados[0].value
    : ultimos.cafe;
  const leite = resultados[1].status === "fulfilled"
    ? resultados[1].value
    : ultimos.leite;

  if (resultados[0].status === "fulfilled") ultimos.cafe = resultados[0].value;
  if (resultados[1].status === "fulfilled") ultimos.leite = resultados[1].value;

  const falhas = resultados
    .filter((resultado): resultado is PromiseRejectedResult => resultado.status === "rejected")
    .map((resultado) => (resultado.reason instanceof Error ? resultado.reason.message : String(resultado.reason)));

  const resposta: RespostaCotacoes = {
    cafe,
    leite,
    stale: falhas.length > 0,
    erro: falhas.length ? falhas.join(" ") : null,
  };

  return NextResponse.json(resposta, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
