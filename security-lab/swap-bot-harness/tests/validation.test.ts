import { validateMint, validateAmount, validateSlippageBps, parseCommand } from "../src/validation";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("mint validation", () => {
  test("accepts a valid base58 mint", () => {
    expect(validateMint(SOL).ok).toBe(true);
  });
  test("rejects empty / short / non-base58 / injection", () => {
    for (const bad of ["", "abc", "0OIl_not_base58", "'; DROP TABLE x;--", "So1111".repeat(20)]) {
      expect(validateMint(bad).ok).toBe(false);
    }
  });
  test("rejects a 44-char string that is not decodable to a key", () => {
    expect(validateMint("1".repeat(44)).ok).toBe(false);
  });
});

describe("amount validation", () => {
  test("accepts a normal decimal within ceiling", () => {
    expect(validateAmount("0.25", 5).ok).toBe(true);
  });
  test("rejects zero, negative, NaN, Infinity, scientific, over-ceiling", () => {
    for (const bad of ["0", "-1", "abc", "1e9", "Infinity", "NaN", "10"]) {
      expect(validateAmount(bad, 5).ok).toBe(false);
    }
  });
});

describe("slippage validation", () => {
  test("accepts within ceiling", () => {
    expect(validateSlippageBps("50", 100).ok).toBe(true);
  });
  test("rejects excessive slippage (drain vector)", () => {
    expect(validateSlippageBps("10000", 100).ok).toBe(false);
    expect(validateSlippageBps("101", 100).ok).toBe(false);
  });
  test("rejects non-integer / negative", () => {
    for (const bad of ["-1", "1.5", "abc", ""]) {
      expect(validateSlippageBps(bad, 100).ok).toBe(false);
    }
  });
});

describe("command parsing (whitelist)", () => {
  test("parses known commands", () => {
    expect(parseCommand("/status").ok).toBe(true);
    expect(parseCommand("/help").ok).toBe(true);
    expect(parseCommand(`/quote ${SOL} ${USDC} 1 50`).ok).toBe(true);
    expect(parseCommand(`/quote@MyBot ${SOL} ${USDC} 1`).ok).toBe(true);
  });
  test("rejects unknown commands and missing args", () => {
    expect(parseCommand("/drain everything").ok).toBe(false);
    expect(parseCommand("/quote").ok).toBe(false);
    expect(parseCommand(`/quote ${SOL}`).ok).toBe(false);
  });
  test("rejects control chars and over-long payloads", () => {
    const bell = String.fromCharCode(7); // built, not embedded, to keep source clean ASCII
    expect(parseCommand(`/quote ${bell} x`).ok).toBe(false);
    expect(parseCommand("/quote " + "A".repeat(500)).ok).toBe(false);
  });
});
