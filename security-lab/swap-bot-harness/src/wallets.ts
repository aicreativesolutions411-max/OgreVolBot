// DEVNET multi-wallet manager (real @solana/web3.js). Generates/persists N
// THROWAWAY devnet keypairs, airdrops devnet SOL, and reports balances.
//
// These are devnet-only test keys with NO monetary value. This module is loaded
// only by the trial runner at runtime — never by the unit tests (which use the
// web3-free MockWalletBook), so the Jest suite stays offline.

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import bs58 from "bs58";
import { HarnessConfig, assertNoMainnet } from "./config";
import { WalletBook, WalletInfo } from "./types";
import { log } from "./logger";

export class DevnetWalletBook implements WalletBook {
  private keys: Keypair[] = [];
  private infos: WalletInfo[] = [];

  constructor(private cfg: HarnessConfig, private conn: Connection) {
    assertNoMainnet(cfg);
  }

  /** Load persisted keypairs or generate a fresh set of devnet throwaways. */
  init(): void {
    const dir = this.cfg.walletDir;
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < this.cfg.walletCount; i++) {
      const file = path.join(dir, `wallet-${i}.json`);
      let kp: Keypair;
      if (fs.existsSync(file)) {
        const secret = Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8")));
        kp = Keypair.fromSecretKey(secret);
      } else {
        kp = Keypair.generate();
        // DEVNET THROWAWAY key — valueless. Persisted so a trial is repeatable.
        fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
      }
      this.keys.push(kp);
      this.infos.push({ index: i, label: `lab-${i + 1}`, publicKey: kp.publicKey.toBase58() });
    }
  }

  list(): WalletInfo[] {
    return this.infos;
  }

  keypair(index: number): Keypair {
    return this.keys[index];
  }

  pickForSource(chatId: string): WalletInfo {
    let h = 0;
    for (const c of String(chatId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return this.infos[h % this.infos.length];
  }

  async balance(index: number): Promise<number> {
    const lamports = await this.conn.getBalance(new PublicKey(this.infos[index].publicKey));
    return lamports / LAMPORTS_PER_SOL;
  }

  /** Top each wallet up to ~`targetSol` via devnet airdrop (best-effort). */
  async fund(targetSol = 1): Promise<void> {
    for (let i = 0; i < this.keys.length; i++) {
      try {
        const bal = await this.balance(i);
        if (bal >= targetSol) continue;
        const sig = await this.conn.requestAirdrop(this.keys[i].publicKey, Math.ceil((targetSol - bal) * LAMPORTS_PER_SOL));
        await this.conn.confirmTransaction(sig, "confirmed");
        log.info(`airdropped ${this.infos[i].label} (${this.infos[i].publicKey.slice(0, 8)}…)`);
      } catch (e) {
        log.warn(`airdrop failed for ${this.infos[i].label} (devnet faucet limits are normal): ${(e as Error).message}`);
      }
    }
  }

  encodeSecretForDisplay(): never {
    // Guard: we never print secret keys. Kept as a reminder / lint anchor.
    throw new Error("secret keys are never displayed");
  }
}

// Small helper so callers can show a pubkey without importing web3.
export function toBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}
