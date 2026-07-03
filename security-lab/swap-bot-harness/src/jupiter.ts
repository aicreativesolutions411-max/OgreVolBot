// Swap quote provider.
//
//  * Default: a deterministic MOCK. No network, no keys.
//  * Optional: READ-ONLY quotes from Jupiter's public quote API (GET only).
//    This never returns signing material and never builds/executes a swap.
//
// There is intentionally NO swap-execution / swap-instruction path here. A swap
// bot's danger lives in the execute step; this harness stops at "here is what a
// swap WOULD look like" and hands that plan to the simulator (solana.ts).

import { HarnessConfig } from "./config";

export interface Quote {
  inputMint: string;
  outputMint: string;
  inAmount: string; // base units (string to avoid float loss)
  outAmount: string; // base units
  slippageBps: number;
  priceImpactPct: number;
  source: "mock" | "jupiter-readonly";
}

export interface SwapPlan {
  quote: Quote;
  // A description only — NOT a serialized transaction. The simulator builds a
  // harmless no-op tx to exercise the signing/simulate path; it never assembles
  // a real Jupiter swap.
  note: string;
}

function toBaseUnits(uiAmount: number, decimals = 9): string {
  // Integer base-units as a string. 1e9 lamports = 1 SOL by default.
  return BigInt(Math.round(uiAmount * 10 ** decimals)).toString();
}

// Deterministic mock: output = 99.5% of input scaled by a fixed pseudo-rate
// derived from the mint strings, so tests are stable and offline.
function mockQuote(inputMint: string, outputMint: string, uiAmount: number, slippageBps: number): Quote {
  const seed = (inputMint.charCodeAt(0) + outputMint.charCodeAt(0)) % 7; // 0..6
  const rate = 1 + seed * 0.05; // 1.00x .. 1.30x, deterministic
  const inBase = toBaseUnits(uiAmount);
  const outBase = (BigInt(inBase) * BigInt(Math.round(rate * 995))) / 1000n; // -0.5% "fee"
  return {
    inputMint,
    outputMint,
    inAmount: inBase,
    outAmount: outBase.toString(),
    slippageBps,
    priceImpactPct: 0.05,
    source: "mock",
  };
}

export async function getQuote(
  cfg: HarnessConfig,
  args: { inputMint: string; outputMint: string; uiAmount: number; slippageBps: number },
  fetchImpl: typeof fetch = fetch
): Promise<Quote> {
  const { inputMint, outputMint, uiAmount, slippageBps } = args;
  if (!cfg.useRealJupiterQuotes) {
    return mockQuote(inputMint, outputMint, uiAmount, slippageBps);
  }
  // READ-ONLY: fetch a quote. No API key required for the public quote endpoint;
  // if the env misconfigures the base URL or the network is down, we fail closed.
  const url =
    `${cfg.jupiterQuoteBase}/quote?inputMint=${encodeURIComponent(inputMint)}` +
    `&outputMint=${encodeURIComponent(outputMint)}&amount=${toBaseUnits(uiAmount)}` +
    `&slippageBps=${slippageBps}`;
  const res = await fetchImpl(url, { method: "GET" });
  if (!res.ok) throw new Error(`jupiter quote failed: HTTP ${res.status}`);
  const j: any = await res.json();
  if (!j || !j.outAmount) throw new Error("jupiter quote: malformed response");
  return {
    inputMint,
    outputMint,
    inAmount: String(j.inAmount ?? toBaseUnits(uiAmount)),
    outAmount: String(j.outAmount),
    slippageBps,
    priceImpactPct: Number(j.priceImpactPct ?? 0),
    source: "jupiter-readonly",
  };
}

export function buildSwapPlan(quote: Quote): SwapPlan {
  return {
    quote,
    note: "PLAN ONLY — no swap transaction is assembled or executed by this harness.",
  };
}
