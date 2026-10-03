import { createRewardAssetResolver, rewardError, rewardAddress } from './tokenRewardAssets.js';
import { normalizeTokenRewardPolicy, tokenRewardPolicyHash } from './tokenRewardPolicy.js';
import { tokenRewardCurve } from './tokenRewardMeteora.js';
import { createTokenRewardExecutionApi } from './tokenRewardExecutionApi.js';

export function tokenRewardReadiness() {
  // Not enabled by a feature flag alone. Deployment, a funded payout vault,
  // policy-bound native launch adoption and pre/post-graduation receipts are
  // separate release requirements. Never report these as working from UI tests.
  return { launchEnabled: false, payoutsEnabled: false, network: 'mainnet-beta', rail: 'slimewire-meteora',
    capabilities: { tickerSearch: true, exactMintCheck: true, customQuoteConstruction: true, exactTokenTransfers: true, durablePayoutAccounting: true, cadenceHours: 12 },
    blockers: ['Live runtime configuration and an approved validation wallet are required.', 'The complete launch, collection and payout flow must pass a wallet-approved funded test before general release.'],
    note: 'Token selection and payout plans are available. Saving a plan does not launch a coin or activate payouts.' };
}

export function verifiedRewardCurve(asset) {
  try { return tokenRewardCurve(asset); }
  catch { throw rewardError(422, 'The launch protocol cannot safely construct this pairing at its current price and token precision. Choose another token; no fallback asset was selected.'); }
}

export function createTokenRewardsApi({ readBody, sendJson, runtime, resolver = runtime?.resolver || createRewardAssetResolver(), now = Date.now } = {}) {
  let recent = [];
  const execution = createTokenRewardExecutionApi({ runtime, readBody, sendJson, now });
  const readiness = () => runtime?.readiness() || tokenRewardReadiness();
  return { async route(request, response, url) {
    const prefix = '/api/web/token-rewards/'; if (!url.pathname.startsWith(prefix)) return false;
    if (await execution.route(request, response, url)) return true;
    const send = (code, value) => sendJson(request, response, code, value, '', { 'Cache-Control': 'no-store' });
    try {
      const action = url.pathname.slice(prefix.length); let data;
      if (action === 'readiness' && request.method === 'GET') data = readiness();
      else if (action === 'program' && request.method === 'GET') {
        if (!runtime || url.searchParams.size !== 1 || !url.searchParams.has('mint')) throw rewardError(400, 'Provide one launched token mint.');
        data = await runtime.rewards.read(rewardAddress(url.searchParams.get('mint')));
        if (!data) throw rewardError(404, 'No native reward program was found for this mint.');
      }
      else if (action === 'search' && request.method === 'GET') {
        if ([...url.searchParams.keys()].some(k => k !== 'q') || url.searchParams.getAll('q').length !== 1) throw rewardError(400, 'Provide one token search.');
        data = { tokens: await resolver.search(url.searchParams.get('q')) };
      } else if (action === 'asset' && request.method === 'GET') {
        if ([...url.searchParams.keys()].some(k => k !== 'mint') || url.searchParams.getAll('mint').length !== 1) throw rewardError(400, 'Provide one exact token mint.');
        data = await resolver.resolve(url.searchParams.get('mint'));
        verifiedRewardCurve(data);
      } else if (action === 'plan' && request.method === 'POST') {
        if (url.searchParams.size || !/^application\/json(?:;|$)/i.test(request.headers['content-type'] || '')) throw rewardError(400, 'A JSON launch plan is required.');
        recent = recent.filter(t => now() - t < 60000); if (recent.length >= 30) throw rewardError(429, 'Launch planning is busy. Please retry shortly.'); recent.push(now());
        let input; try { input = JSON.parse(await readBody(request, 8192)); } catch { throw rewardError(400, 'Invalid launch plan.'); }
        const allowed = ['name', 'symbol', 'creator', 'quoteMint', 'creatorShareBps', 'holderShareBps', 'partnerShareBps', 'partnerMint'];
        if (!input || Array.isArray(input) || Object.keys(input).some(k => !allowed.includes(k))) throw rewardError(400, 'Unsupported launch-plan field.');
        if (typeof input.name !== 'string' || !input.name.trim() || Buffer.byteLength(input.name) > 32 || /[\x00-\x1f]/.test(input.name) || !/^[A-Za-z0-9]{1,10}$/.test(input.symbol || '')) throw rewardError(422, 'Add a name up to 32 UTF-8 bytes and an alphanumeric ticker up to 10 characters.');
        const asset = await resolver.resolve(input.quoteMint, { fresh: true }), policy = normalizeTokenRewardPolicy(input, asset);
        if (policy.partnerShareBps) await resolver.resolve(policy.partnerMint);
        const curve = verifiedRewardCurve(asset);
        data = { version: 1, type: 'unsigned-token-reward-plan', name: input.name.trim(), symbol: input.symbol, createdAt: now(), requiresFreshReviewBeforeSigning: true, asset, policy, policyHash: tokenRewardPolicyHash(policy),
          curve: { initialMarketCapUsd: 5000, migrationMarketCapUsd: 69000, migrationQuoteRaw: curve.migrationQuoteThreshold.toString(), totalSupplyTokens: '1000000000', migrationRoundingReserveTokens: '1', quoteDecimals: asset.decimals, transferTaxBps: 0, tradingFeeBps: 100, feeCurrency: asset.symbol, lpPermanentlyLockedPercent: 100 },
          readiness: readiness(), disclosures: ['The split applies to realized net distributable trading fees after protocol deductions, not trading volume.', 'Network fees and token-account rent require a separately funded SOL budget. Dust remains reserved.', 'Holders need more than $20 of their community token at the snapshot; complete snapshots are required. Missing data delays payouts.', 'The fee vault is service-managed. Recipients need no platform signup or claim action.', 'SOL pair rewards are represented by wrapped SOL token accounts; there is no automatic conversion of other selected tokens into SOL.', 'One token from the billion-token launch supply is reserved for migration rounding and assigned to the developer. All migrated liquidity is configured to be permanently locked.', 'USD curve estimates use the current quote-token price. The price and exact launch parameters require a fresh review before signing.', 'A live launch uses two separate wallet approvals. The first creates its configuration; the second creates the coin and funds the displayed network budget. Do not stop between steps if you want the launch completed.'] };
        data.disclosures.push('Custom quote tokens are not guaranteed an automatic migration keeper. Once the curve fills, a separately funded migration may be needed before DEX trading resumes. Validation must cover this step; fee distribution does not perform migrations.');
      } else throw rewardError(405, 'Unsupported reward action. Launch signing is available only through the approved-wallet execution flow.');
      send(200, { ok: true, data });
    } catch (e) { const status = [400, 404, 405, 413, 422, 429, 502].includes(e.status || e.statusCode) ? (e.status || e.statusCode) : 502; send(status, { ok: false, error: e.status ? e.message : 'The reward setup could not be verified. No funds were moved.' }); }
    return true;
  } };
}
