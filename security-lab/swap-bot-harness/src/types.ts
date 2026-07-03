// Web3-free shared types so the handler + unit tests never transitively import a
// chain SDK (keeps the Jest suite offline and ESM-free). The REAL, web3-backed
// implementations live in wallets.ts / chain.ts and are only loaded at runtime
// by the trial runner.

export interface WalletInfo {
  index: number;
  label: string;
  publicKey: string; // base58 devnet pubkey
}

/** A set of DEVNET trial wallets. Sources are deterministically mapped to one. */
export interface WalletBook {
  list(): WalletInfo[];
  /** Deterministically map a Telegram source (chatId) to one trial wallet. */
  pickForSource(chatId: string): WalletInfo;
  /** Devnet SOL balance for a wallet (UI units). */
  balance(index: number): Promise<number>;
}

export interface ExecOutcome {
  broadcast: boolean;
  signature?: string;
  err: unknown;
  note: string;
  walletLabel?: string;
}

// Pluggable execution. Tests/offline leave it undefined (handler simulates with a
// mock). The trial/live-devnet path injects a real executor that signs+broadcasts
// on devnet ONLY (genesis-gated). Never a mainnet path.
export type RealExecutor = (ctx: {
  chatId: string;
  inputMint: string;
  outputMint: string;
  uiAmount: number;
  slippageBps: number;
}) => Promise<ExecOutcome>;

// A deterministic, web3-free WalletBook for unit tests (fixed fake pubkeys).
export class MockWalletBook implements WalletBook {
  private wallets: WalletInfo[];
  constructor(count = 3) {
    this.wallets = Array.from({ length: count }, (_, i) => ({
      index: i,
      label: `lab-${i + 1}`,
      publicKey: `MockWa11et${i}1111111111111111111111111111111`,
    }));
  }
  list(): WalletInfo[] {
    return this.wallets;
  }
  pickForSource(chatId: string): WalletInfo {
    let h = 0;
    for (const c of String(chatId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return this.wallets[h % this.wallets.length];
  }
  async balance(): Promise<number> {
    return 0;
  }
}
