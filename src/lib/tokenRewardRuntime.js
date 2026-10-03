import path from 'node:path';
import { Keypair } from '@solana/web3.js';
import { createStonksFreeConnection } from './slimeStonksNative.js';
import { createRewardAssetResolver } from './tokenRewardAssets.js';
import { createTokenRewardStore, createTokenRewardService } from './tokenRewardService.js';
import { createTokenRewardDriver } from './tokenRewardMeteora.js';
import { createTokenRewardLaunchService } from './tokenRewardLaunch.js';
import { createTokenRewardSnapshot } from './tokenRewardSnapshot.js';
import { decodeLaunchImageDataUrl, processLaunchImage } from './launchImageProcessor.js';
import { uploadImage, uploadJsonMetadata, getPinataJwt } from './pinataMetadata.js';

export function createTokenRewardRuntime({ dataDir, encrypt, decrypt, env = process.env, connection = createStonksFreeConnection(), store: injectedStore, resolver: injectedResolver, audit = event => console.info('token_rewards', JSON.stringify(event)) }) {
  const store = injectedStore || createTokenRewardStore(path.join(dataDir, 'token-rewards.json'));
  const resolver = injectedResolver || createRewardAssetResolver({ rpc: connection, trackerApiKey: env.SOLANA_TRACKER_API_KEY || '' });
  const validationWallets = new Set(String(env.TOKEN_REWARDS_VALIDATION_WALLETS || '').split(',').map(v => v.trim()).filter(Boolean));
  let storageReady = false, started = false;
  const configured = Boolean(dataDir && path.isAbsolute(dataDir) && typeof encrypt === 'function' && typeof decrypt === 'function' && getPinataJwt(env));
  const readiness = () => ({ release: 'wallet-validation', launchEnabled: false, payoutsEnabled: false, validationEnabled: configured && storageReady && validationWallets.size > 0,
    network: 'mainnet-beta', rail: 'slimewire-meteora', requiresWalletApproval: true,
    capabilities: { tickerSearch: true, exactMintCheck: true, customQuoteConstruction: true, exactTokenTransfers: true, durablePayoutAccounting: true, walletSigning: true, dedicatedFeeVaults: true, graduatedCollection: true, cadenceHours: 12 },
    blockers: [...(!configured ? ['Persistent storage, encrypted vault keys and metadata upload must be configured.'] : []), ...(!storageReady ? ['Reward storage has not passed its startup check.'] : []),
      ...(validationWallets.size ? [] : ['Choose the wallet for the first user-approved live validation launch.']), 'General release is held until launch, collection and recipient delivery have been verified with real receipts.'],
    note: 'The transaction flow is installed. A wallet-approved validation launch is required before general availability; a saved plan is not a launch.' });
  async function driverFor(program) {
    const secret = await store.mutate(db => { const row = Object.values(db.tokenRewardLaunches || {}).find(r => r.mint === program.mint && r.vault === program.vault && r.policyHash === program.ledger.policyHash); if (!row?.keys?.vault) throw new Error('Dedicated reward vault is unavailable.'); return row.keys.vault; });
    const bytes = decrypt(secret);
    let signer; try { signer = Keypair.fromSecretKey(new Uint8Array(bytes)); } finally { bytes.fill(0); }
    if (signer.publicKey.toBase58() !== program.vault) { signer.secretKey.fill(0); throw new Error('Dedicated vault identity does not match.'); }
    return createTokenRewardDriver({ connection, signer });
  }
  // Driver lookup inside a ledger mutation must not acquire the same lock.
  // Read encrypted keys once per cycle, outside the mutation, and keep only a
  // bounded in-memory signer cache. Public methods never expose it.
  const drivers = new Map();
  const cachedDriver = async program => { const hit = drivers.get(program.vault); if (!hit) throw new Error('Reward signer is not loaded; retrying on the next server cycle.'); return hit; };
  const rewards = createTokenRewardService({ store, driverFor: cachedDriver, snapshot: createTokenRewardSnapshot({ connection, resolver }), enableBroadcast: true, audit });
  async function warm(program) { if (!drivers.has(program.vault)) { if (drivers.size >= 2000) throw new Error('Reward signer capacity reached.'); drivers.set(program.vault, await driverFor(program)); } }
  const registration = { ...rewards, async register(input) {
    await warm({ ...input, ledger: { policyHash: (await import('./tokenRewardPolicy.js')).tokenRewardPolicyHash(input.policy) } });
    return rewards.register(input);
  } };
  async function metadata(input) {
    const processed = await processLaunchImage(decodeLaunchImageDataUrl(input.imageData, { name: input.name, symbol: input.symbol }), { maxInputBytes: 3 * 1024 * 1024, outputSize: 1000 });
    const image = await uploadImage({ image: processed });
    const result = await uploadJsonMetadata({ metadata: { name: input.name.trim(), symbol: input.symbol, description: input.description.trim(), image: image.imageUri, showName: true, createdOn: 'https://slimewire.org/slimestonks' }, filename: input.symbol.toLowerCase() + '-metadata.json' });
    return result.uri;
  }
  const launches = createTokenRewardLaunchService({ store, connection, resolver, metadata, encrypt, decrypt, rewards: registration, audit });
  async function start() {
    if (started || !configured) return; started = true;
    await store.mutate(() => true); storageReady = true;
    let busy = false;
    const tick = async () => {
      if (busy) return; busy = true;
      try {
        const programs = await store.mutate(db => Object.values(db.tokenRewardPrograms || {}).filter(p => !p.paused || p.ledger.pending));
        for (const p of programs) await warm(p);
        await launches.reconcileDue(); await rewards.tickDue();
      } catch { audit({ type: 'token_reward_runner', status: 'NEEDS_ATTENTION' }); }
      finally { busy = false; }
    };
    void tick(); const timer = setInterval(tick, 15000); timer.unref?.();
  }
  return { resolver, launches, rewards, readiness, start, canLaunch: wallet => configured && storageReady && validationWallets.has(wallet) };
}
