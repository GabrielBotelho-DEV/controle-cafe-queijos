import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** CAPTCHA leve para uso pessoal: desafio matemático assinado com HMAC. */
const SEGREDO = process.env.CAPTCHA_SECRET || "cafe-queijo-captcha-local";
const VALIDADE_MS = 5 * 60 * 1000;

type Desafio = { a: number; b: number; expira: number };

function assinar(payload: string): string {
  return createHmac("sha256", SEGREDO).update(payload).digest("hex");
}

function codificar(desafio: Desafio): string {
  const payload = Buffer.from(
    `${desafio.a}.${desafio.b}.${desafio.expira}`,
    "utf8",
  ).toString("base64url");
  return `${payload}.${assinar(payload)}`;
}

function decodificar(token: string): Desafio | null {
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return null;

  const esperada = Buffer.from(assinar(payload), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  const [a, b, expira] = Buffer.from(payload, "base64url").toString("utf8").split(".").map(Number);
  if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isFinite(expira)) return null;
  if (Date.now() > expira) return null;
  return { a, b, expira };
}

export async function GET() {
  const desafio: Desafio = {
    a: randomInt(2, 10),
    b: randomInt(2, 10),
    expira: Date.now() + VALIDADE_MS,
  };

  return NextResponse.json(
    { token: codificar(desafio), pergunta: `Quanto é ${desafio.a} + ${desafio.b}?` },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let corpo: { token?: unknown; resposta?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ valido: false }, { status: 400 });
  }

  if (typeof corpo.token !== "string" || typeof corpo.resposta !== "string") {
    return NextResponse.json({ valido: false }, { status: 400 });
  }

  const desafio = decodificar(corpo.token);
  const resposta = Number(corpo.resposta.trim());
  const valido = Boolean(desafio && Number.isInteger(resposta) && resposta === desafio.a + desafio.b);

  return NextResponse.json(
    { valido },
    { status: valido ? 200 : 401, headers: { "Cache-Control": "no-store" } },
  );
}
