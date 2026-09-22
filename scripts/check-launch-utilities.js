// Read-only deployment checks. Never loads a wallet, signs, sends a transaction,
// creates a service, changes environment variables, or prints secret values.
import { Connection, Keypair } from '@solana/web3.js';
import { launchUtilityCapabilities, USEPAID_VERIFIED_TREASURY } from '../src/lib/launchUtility.js';
import { verifyUsePaidRecipient } from '../src/lib/usePaidRecipient.js';

async function renderEnvironment() {
  if (!process.env.RENDER_API_KEY) throw new Error('RENDER_API_KEY is unavailable.');
  const env = {};
  let cursor = '';
  for (let page = 0; page < 10; page++) {
    const response = await fetch('https://api.render.com/v1/services/srv-d86q8gq8qa3s73fq1r60/env-vars?limit=100' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''), {
      headers: { Authorization: 'Bearer ' + process.env.RENDER_API_KEY }, signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('Render environment read returned HTTP ' + response.status);
    const rows = await response.json();
    for (const row of rows) { const value = row.envVar || row; env[value.key] = value.value; }
    if (rows.length < 100) return env;
    cursor = rows.at(-1)?.cursor;
    if (!cursor) throw new Error('Render pagination did not provide a cursor; refusing an incomplete audit.');
  }
  throw new Error('Render environment pagination exceeded the bounded audit.');
}

const env = process.argv.includes('--render') ? await renderEnvironment() : process.env;
const caps = launchUtilityCapabilities(env);
const result = {
  target: process.argv.includes('--render') ? 'Render web service' : 'local environment',
  readOnly: true,
  usepaidConfigured: caps.usepaid.available,
  usepaidPublishedRecipient: USEPAID_VERIFIED_TREASURY,
  usepaidRecipientVerifiedOnChain: false,
  creatorFeeRecoveryEnabled: env.CREATOR_FEES_AUTO_CLAIM_ENABLED !== 'false',
  pumpLaunchEnabled: env.PUMP_LAUNCH_ENABLED === 'true',
  marketplaceKeyConfigured: Boolean(env.MAGIC_EDEN_API_KEY),
  nftAutomaticPurchasesAvailable: caps.nftFloor.available,
  freeListingPreview: 'not_checked', purchaseInstructionAccess: 'not_checked',
  blockers: []
};
try {
  await verifyUsePaidRecipient(new Connection('https://api.mainnet-beta.solana.com', { commitment: 'confirmed', disableRetryOnRateLimit: true }));
  result.usepaidRecipientVerifiedOnChain = true;
} catch { result.blockers.push('UsePaid public-chain recipient verification failed; do not activate a new fee route.'); }
if (!caps.usepaid.available) result.blockers.push(caps.usepaid.reason);
try {
  const response = await fetch('https://api-mainnet.magiceden.dev/v2/collections/okay_bears/listings?offset=0&limit=1&sort=listPrice&sort_direction=asc', { signal: AbortSignal.timeout(10000) });
  result.freeListingPreview = 'HTTP ' + response.status;
  const listing = response.ok ? (await response.json())[0] : null;
  if (!env.MAGIC_EDEN_API_KEY) {
    result.purchaseInstructionAccess = 'key_required';
    result.blockers.push('Magic Eden purchase-instruction access is not configured.');
  } else if (listing) {
    const query = new URLSearchParams({ buyer: Keypair.generate().publicKey.toBase58(), seller: listing.seller, tokenMint: listing.tokenMint, tokenATA: listing.tokenAddress, price: String(listing.price), sellerExpiry: String(listing.expiry || 0) });
    if (listing.auctionHouse) query.set('auctionHouseAddress', listing.auctionHouse);
    const probe = await fetch('https://api-mainnet.magiceden.dev/v2/instructions/buy_now?' + query, { headers: { Authorization: 'Bearer ' + env.MAGIC_EDEN_API_KEY }, signal: AbortSignal.timeout(15000) });
    result.purchaseInstructionAccess = 'HTTP ' + probe.status;
    // Do not output or sign the returned transaction. HTTP 200 is access only,
    // not proof that a purchase is safe or that settlement has been validated.
    await probe.arrayBuffer();
  }
} catch { result.blockers.push('Marketplace read-only access check failed.'); }
if (!caps.nftFloor.available) result.blockers.push('Native NFT signing, isolated treasury and distribution engine are not implemented; preview remains read-only.');
console.log(JSON.stringify(result, null, 2));
