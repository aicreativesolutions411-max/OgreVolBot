import test from "node:test";
import assert from "node:assert/strict";
import {
  canSubmitPerpOrder,
  createPerpsProvider,
  DriftPerpsProvider,
  MockPerpsProvider,
  resolveOgreTekConfig,
  shouldShowOgreTekNav,
  validatePerpOrder
} from "../web/public/perps.js";

test("Ogre Tek feature flag hides and shows nav", () => {
  const hidden = resolveOgreTekConfig({});
  assert.equal(shouldShowOgreTekNav(hidden), false);

  const shown = resolveOgreTekConfig({ ogreTek: { enabled: true } });
  assert.equal(shouldShowOgreTekNav(shown), true);
});

test("mock provider loads demo markets", async () => {
  const config = resolveOgreTekConfig({ ogreTek: { enabled: true, allowedMarkets: ["SOL-PERP", "ETH-PERP"] } });
  const provider = new MockPerpsProvider(config);
  const markets = await provider.getMarkets();
  assert.deepEqual(markets.map((market) => market.symbol), ["SOL-PERP", "ETH-PERP"]);
});

test("provider factory returns placeholders for configured live providers", async () => {
  const provider = createPerpsProvider(resolveOgreTekConfig({ ogreTek: { enabled: true, provider: "drift" } }));
  assert.ok(provider instanceof DriftPerpsProvider);
  await assert.rejects(() => provider.getMarkets(), /not configured yet/);
});

test("trade ticket calculates position size and liquidation estimate", async () => {
  const config = resolveOgreTekConfig({ ogreTek: { enabled: true, maxLeverage: 5 } });
  const provider = new MockPerpsProvider(config);
  const market = await provider.getMarket("SOL-PERP");
  const account = await provider.getAccount("wallet-address");
  const validation = validatePerpOrder(
    { marketSymbol: "SOL-PERP", direction: "long", collateralUsd: 100, leverage: 3, slippagePct: 0.5 },
    market,
    account,
    config
  );

  assert.equal(validation.ok, true);
  assert.equal(validation.quote.positionSizeUsd, 300);
  assert.ok(validation.quote.liquidationPrice > 0);
});

test("invalid numeric inputs are blocked", async () => {
  const config = resolveOgreTekConfig({ ogreTek: { enabled: true, maxLeverage: 3 } });
  const provider = new MockPerpsProvider(config);
  const market = await provider.getMarket("SOL-PERP");
  const account = await provider.getAccount("wallet-address");
  const validation = validatePerpOrder(
    { marketSymbol: "SOL-PERP", collateralUsd: -1, leverage: 9, slippagePct: Number.NaN },
    market,
    account,
    config
  );

  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes("Collateral")));
  assert.ok(validation.errors.some((error) => error.includes("capped")));
  assert.ok(validation.errors.some((error) => error.includes("Slippage")));
});

test("wallet disconnected state blocks review", async () => {
  const config = resolveOgreTekConfig({ ogreTek: { enabled: true } });
  const provider = new MockPerpsProvider(config);
  const market = await provider.getMarket("SOL-PERP");
  const account = await provider.getAccount("");
  const validation = validatePerpOrder(
    { marketSymbol: "SOL-PERP", collateralUsd: 100, leverage: 2 },
    market,
    account,
    config
  );

  assert.equal(validation.ok, false);
  assert.ok(validation.errors.some((error) => error.includes("Connect a wallet")));
});

test("risk checkbox and demo mode prevent live order submission", async () => {
  const config = resolveOgreTekConfig({ ogreTek: { enabled: true, demoMode: true } });
  const provider = new MockPerpsProvider(config);
  const market = await provider.getMarket("SOL-PERP");
  const account = await provider.getAccount("wallet-address");
  const validation = validatePerpOrder(
    { marketSymbol: "SOL-PERP", collateralUsd: 100, leverage: 2 },
    market,
    account,
    config
  );

  assert.equal(validation.ok, true);
  assert.equal(canSubmitPerpOrder({ validation, riskAccepted: false, demoMode: false }), false);
  assert.equal(canSubmitPerpOrder({ validation, riskAccepted: true, demoMode: true }), false);
  assert.equal(canSubmitPerpOrder({ validation, riskAccepted: true, demoMode: false }), true);
});
