const RARITY = Object.freeze({
  common: { label: "Common", multiplierBps: 10_000 },
  uncommon: { label: "Uncommon", multiplierBps: 12_500 },
  rare: { label: "Rare", multiplierBps: 15_000 },
  epic: { label: "Epic", multiplierBps: 20_000 },
  legendary: { label: "Legendary", multiplierBps: 30_000 }
});

function cleanText(value, maxLength = 120) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function nftRarityTiers() {
  return Object.entries(RARITY).map(([key, value]) => ({ key, ...value }));
}

export function normalizeNftRarity(value) {
  const key = cleanText(value, 24).toLowerCase();
  return RARITY[key] ? key : "common";
}

export function normalizeNftItem(input = {}, defaults = {}) {
  const name = cleanText(input.name || defaults.name, 64);
  if (!name) throw new Error("NFT name is required.");
  return {
    name,
    description: cleanText(input.description || defaults.description, 800),
    rarity: normalizeNftRarity(input.rarity),
    recipient: cleanText(input.recipient || defaults.recipient, 64),
    imageDataUrl: String(input.imageDataUrl || "").trim(),
    imageName: cleanText(input.imageName, 120),
    version: 1
  };
}

// Loyalty grows 10% every 30 uninterrupted days, capped at 2x after 300 days.
// This is reward weight, never a promised yield or a claim about market value.
export function nftLoyaltyMultiplierBps(ownerSince, now = Date.now()) {
  const since = typeof ownerSince === "number" ? ownerSince : Date.parse(String(ownerSince || ""));
  const elapsed = Number.isFinite(since) ? Math.max(0, Number(now) - since) : 0;
  const periods = Math.min(10, Math.floor(elapsed / (30 * 86_400_000)));
  return 10_000 + periods * 1_000;
}

export function nftRewardPower({ rarity, ownerSince }, now = Date.now()) {
  const rarityKey = normalizeNftRarity(rarity);
  const rarityBps = RARITY[rarityKey].multiplierBps;
  const loyaltyBps = nftLoyaltyMultiplierBps(ownerSince, now);
  return {
    rarity: rarityKey,
    rarityBps,
    loyaltyBps,
    powerMicros: BigInt(rarityBps) * BigInt(loyaltyBps),
    displayMultiplier: (rarityBps * loyaltyBps) / 100_000_000
  };
}

export function syncNftOwnership(previous = {}, assets = [], now = Date.now()) {
  const prior = previous && typeof previous === "object" ? previous : {};
  const next = {};
  for (const raw of Array.isArray(assets) ? assets : []) {
    const asset = cleanText(raw.asset || raw.address || raw.publicKey, 64);
    const owner = cleanText(raw.owner, 64);
    if (!asset || !owner) continue;
    const old = prior[asset];
    const sameOwner = old && String(old.owner || "") === owner;
    next[asset] = {
      asset,
      owner,
      ownerSince: sameOwner && Number(old.ownerSince) > 0 ? Number(old.ownerSince) : Number(now),
      lastCheckedAt: Number(now)
    };
  }
  return next;
}

export function allocateNftRewards(totalRaw, assetRows = [], now = Date.now()) {
  const total = BigInt(totalRaw || 0);
  if (total <= 0n) return [];
  const rows = (Array.isArray(assetRows) ? assetRows : [])
    .map((row) => {
      const asset = cleanText(row.asset || row.address, 64);
      const owner = cleanText(row.owner, 64);
      const power = nftRewardPower(row, now);
      return asset && owner ? { ...row, asset, owner, ...power } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.asset.localeCompare(b.asset));
  if (!rows.length) return [];
  const totalPower = rows.reduce((sum, row) => sum + row.powerMicros, 0n);
  if (totalPower <= 0n) return [];
  let assigned = 0n;
  return rows.map((row, index) => {
    const allocationRaw = index === rows.length - 1
      ? total - assigned
      : (total * row.powerMicros) / totalPower;
    assigned += allocationRaw;
    return {
      asset: row.asset,
      owner: row.owner,
      rarity: row.rarity,
      ownerSince: Number(row.ownerSince) || Number(now),
      rarityBps: row.rarityBps,
      loyaltyBps: row.loyaltyBps,
      displayMultiplier: row.displayMultiplier,
      allocationRaw: allocationRaw.toString(),
      claimedAt: "",
      claimSignature: ""
    };
  });
}

