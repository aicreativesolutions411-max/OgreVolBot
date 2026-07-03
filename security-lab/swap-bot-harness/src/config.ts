// Central guardrail config for the swap-bot lab harness.
//
// SAFETY MODEL (read this before touching anything):
//   1. DRY_RUN defaults to TRUE. It is only false when the env var is the exact
//      string "false". Any typo / unset value keeps DRY_RUN on.
//   2. mainnet-beta is HARD-BLOCKED. There is no code path in this harness that
//      can broadcast a transaction on mainnet. Requesting it throws.
//   3. Broadcasting requires ALL of: DRY_RUN=false, SOLANA_CLUSTER=devnet,
//      ALLOW_DEVNET_SEND=true, AND a runtime genesis-hash check proving the RPC
//      really is devnet (see solana.ts). Env strings alone are never trusted.
//   4. No secrets are read here. No private keys, seed phrases, bot tokens, or
//      API keys are required to run the harness in its default (mock) mode.

// Well-known Solana cluster genesis hashes. Used to verify the chain we're
// actually talking to, instead of trusting the SOLANA_CLUSTER env string.
export const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
export const TESTNET_GENESIS = "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY";

export type Cluster = "devnet" | "localnet" | "testnet" | "mainnet-beta";

export interface HarnessConfig {
  dryRun: boolean;
  cluster: Cluster;
  allowDevnetSend: boolean;
  useRealJupiterQuotes: boolean;
  jupiterQuoteBase: string;
  rpcUrl: string;
  adminChatIds: Set<string>;
  rateLimitPerMin: number;
  maxSlippageBps: number; // hard ceiling — commands above this are rejected
  maxAmountUi: number; // hard per-command amount ceiling (lab safety)
  dbPath: string;
  walletCount: number; // how many devnet trial wallets to manage
  walletDir: string; // where throwaway DEVNET keypairs are persisted
}

function envBool(env: NodeJS.ProcessEnv, name: string, def: boolean): boolean {
  const v = env[name];
  if (v === undefined) return def;
  // Only the exact strings flip the value; everything else falls back to `def`
  // (so a fat-fingered "ture" can't accidentally disable DRY_RUN).
  if (v.toLowerCase() === "true") return true;
  if (v.toLowerCase() === "false") return false;
  return def;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): HarnessConfig {
  const clusterRaw = (env.SOLANA_CLUSTER || "devnet").toLowerCase();
  const cluster = (["devnet", "localnet", "testnet", "mainnet-beta"].includes(clusterRaw)
    ? clusterRaw
    : "devnet") as Cluster;

  const adminChatIds = new Set(
    String(env.ADMIN_CHAT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^-?\d{3,}$/.test(s)) // Telegram chat IDs are integers
  );

  return {
    dryRun: envBool(env, "DRY_RUN", true), // <-- defaults ON
    cluster,
    allowDevnetSend: envBool(env, "ALLOW_DEVNET_SEND", false),
    useRealJupiterQuotes: envBool(env, "USE_REAL_JUPITER_QUOTES", false),
    jupiterQuoteBase: env.JUPITER_QUOTE_BASE || "https://quote-api.jup.ag/v6",
    rpcUrl: env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    adminChatIds,
    rateLimitPerMin: clampInt(env.RATE_LIMIT_PER_MIN, 20, 1, 240),
    maxSlippageBps: clampInt(env.MAX_SLIPPAGE_BPS, 100, 0, 500), // default 1%, ceiling 5%
    maxAmountUi: clampFloat(env.MAX_AMOUNT_UI, 5, 0, 1000), // lab per-command amount ceiling
    dbPath: env.DB_PATH || "./swap-bot-lab.sqlite",
    walletCount: clampInt(env.WALLET_COUNT, 3, 1, 20),
    walletDir: env.WALLET_DIR || "./devnet-wallets",
  };
}

function clampInt(v: string | undefined, def: number, lo: number, hi: number): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, n));
}
function clampFloat(v: string | undefined, def: number, lo: number, hi: number): number {
  const n = Number.parseFloat(String(v ?? ""));
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, n));
}

/** Throws if the config asks us to touch mainnet in any executable capacity. */
export function assertNoMainnet(cfg: HarnessConfig): void {
  if (cfg.cluster === "mainnet-beta") {
    throw new Error(
      "BLOCKED: mainnet-beta is not permitted in the lab harness. This tool never broadcasts on mainnet."
    );
  }
}

/**
 * Pure predicate: are we allowed to broadcast a (harmless devnet no-op) tx?
 * This is the FLAG gate only. solana.ts additionally verifies the live chain's
 * genesis hash before any send, so lying in the env cannot reach mainnet.
 */
export function broadcastFlagsAllow(cfg: HarnessConfig): boolean {
  return cfg.dryRun === false && cfg.cluster === "devnet" && cfg.allowDevnetSend === true;
}

/**
 * Belt-and-suspenders chain-identity gate. The REAL devnet executor calls this
 * on every send: even if flags say "devnet", the chain must PROVE it's devnet by
 * its genesis hash, and a mainnet host in the RPC URL is refused outright. This
 * is a cryptographic gate, not a flag — reaching mainnet requires editing source.
 */
export function assertGenesisIsDevnet(genesis: string, rpcUrl = ""): void {
  if (genesis === MAINNET_GENESIS) throw new Error("refusing: chain is MAINNET (genesis match) — aborting");
  if (genesis !== DEVNET_GENESIS) throw new Error(`refusing: chain genesis ${genesis} is not devnet — aborting`);
  if (/mainnet|api\.mainnet-beta\.solana\.com/i.test(rpcUrl)) throw new Error("refusing: RPC URL looks like mainnet — aborting");
}

/** Human-readable one-liner describing the current safety posture. */
export function modeSummary(cfg: HarnessConfig): string {
  if (cfg.cluster === "mainnet-beta") return "🛑 mainnet-beta requested — HARD BLOCKED";
  if (cfg.dryRun) return `🧪 DRY_RUN (no signing, no broadcast) · cluster=${cfg.cluster}`;
  if (broadcastFlagsAllow(cfg)) return `⚠️ DEVNET SEND ARMED (no-op tx only) · cluster=${cfg.cluster}`;
  return `🧪 simulate-only (broadcast disabled) · cluster=${cfg.cluster}`;
}
