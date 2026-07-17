const COLLECTION_NAME_MAX = 64;
const COLLECTION_DESCRIPTION_MAX = 800;
const COLLECTION_SUPPLY_MAX = 500;
const COLLECTION_ROYALTY_BPS_MAX = 1_000;

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeLinkedNftCollection(input = {}, coin = {}) {
  const enabled = input?.enabled === true || String(input?.enabled || "").toLowerCase() === "true";
  if (!enabled) return { enabled: false };
  const coinName = cleanText(coin.name, COLLECTION_NAME_MAX) || "SlimeWire Meme";
  const coinSymbol = cleanText(coin.symbol, 16).replace(/^\$/, "").toUpperCase();
  const supplyMode = String(input.supplyMode || "expandable").trim().toLowerCase() === "fixed" ? "fixed" : "expandable";
  const supplyCap = Math.min(COLLECTION_SUPPLY_MAX, Math.max(1, Math.trunc(Number(input.supplyCap) || COLLECTION_SUPPLY_MAX)));
  const royaltyBps = Math.min(COLLECTION_ROYALTY_BPS_MAX, Math.max(0, Math.trunc(Number(input.royaltyBps ?? 500) || 0)));
  return {
    enabled: true,
    name: cleanText(input.name, COLLECTION_NAME_MAX) || `${coinName} NFT Collection`.slice(0, COLLECTION_NAME_MAX),
    description: cleanText(input.description, COLLECTION_DESCRIPTION_MAX)
      || `Official NFT collection linked to ${coinSymbol ? `$${coinSymbol}` : coinName} on SlimeWire.`,
    useCoinArt: input.useCoinArt !== false,
    supplyMode,
    supplyCap,
    royaltyBps,
    standard: "metaplex-core",
    version: 2
  };
}

export function linkedCollectionMetadata({ collection, coin, tokenMint, imageUri, externalUrl }) {
  const spec = normalizeLinkedNftCollection(collection, coin);
  if (!spec.enabled) throw new Error("Linked NFT collection is not enabled.");
  const mint = cleanText(tokenMint, 64);
  if (!mint) throw new Error("The coin mint is required before creating its NFT collection.");
  return {
    name: spec.name,
    symbol: cleanText(coin?.symbol, 10).replace(/^\$/, "").toUpperCase(),
    description: `${spec.description}\n\nLinked coin: ${mint}`.slice(0, 1000),
    image: cleanText(imageUri, 1000),
    external_url: cleanText(externalUrl, 1000),
    attributes: [
      { trait_type: "Linked Coin", value: mint },
      { trait_type: "Launch Platform", value: "SlimeWire" },
      { trait_type: "Collection Standard", value: "Metaplex Core" },
      { trait_type: "Supply Mode", value: spec.supplyMode },
      { trait_type: "SlimeWire Supply Cap", value: spec.supplyCap },
      { trait_type: "Royalty", value: `${(spec.royaltyBps / 100).toFixed(2)}%` }
    ],
    properties: {
      category: "image",
      linked_token_mint: mint,
      supply_mode: spec.supplyMode,
      supply_cap: spec.supplyCap,
      royalty_bps: spec.royaltyBps
    }
  };
}

export async function createMetaplexCoreCollection({
  rpcUrl,
  authorityKeypair,
  name,
  uri,
  supplyMode = "expandable",
  supplyCap = COLLECTION_SUPPLY_MAX,
  royaltyBps = 500,
  signerSecretKey,
  onSigner
}) {
  if (!rpcUrl) throw new Error("Solana RPC URL is required to create the NFT collection.");
  if (!authorityKeypair?.secretKey) throw new Error("Collection authority wallet is unavailable.");
  if (!name || !uri) throw new Error("Collection name and metadata URI are required.");

  // Metaplex is intentionally lazy-loaded: these packages are only paid for in
  // memory when a creator explicitly enables the NFT option on a launch.
  const [{ createCollection, mplCore, ruleSet }, { createUmi }, { createSignerFromKeypair, generateSigner, keypairIdentity }, { fromWeb3JsKeypair }] = await Promise.all([
    import("@metaplex-foundation/mpl-core"),
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/umi"),
    import("@metaplex-foundation/umi-web3js-adapters")
  ]);
  const umi = createUmi(rpcUrl).use(mplCore());
  const authority = fromWeb3JsKeypair(authorityKeypair);
  umi.use(keypairIdentity(authority));
  const collection = signerSecretKey?.length
    ? createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(signerSecretKey)))
    : generateSigner(umi);
  if (typeof onSigner === "function") {
    await onSigner({ address: String(collection.publicKey), secretKey: Uint8Array.from(collection.secretKey) });
  }
  const normalizedRoyaltyBps = Math.min(COLLECTION_ROYALTY_BPS_MAX, Math.max(0, Math.trunc(Number(royaltyBps) || 0)));
  const normalizedSupplyCap = Math.min(COLLECTION_SUPPLY_MAX, Math.max(1, Math.trunc(Number(supplyCap) || COLLECTION_SUPPLY_MAX)));
  const plugins = [];
  if (normalizedRoyaltyBps > 0) {
    plugins.push({
      type: "Royalties",
      basisPoints: normalizedRoyaltyBps,
      creators: [{ address: authority.publicKey, percentage: 100 }],
      ruleSet: ruleSet("None")
    });
  }
  if (String(supplyMode).toLowerCase() === "fixed") {
    plugins.push({ type: "MasterEdition", maxSupply: normalizedSupplyCap, name: cleanText(name, COLLECTION_NAME_MAX), uri: String(uri).trim() });
  }
  const result = await createCollection(umi, {
    collection,
    name: cleanText(name, COLLECTION_NAME_MAX),
    uri: String(uri).trim(),
    plugins
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  return {
    address: String(collection.publicKey),
    signatureBytes: result?.signature ? Uint8Array.from(result.signature) : new Uint8Array()
  };
}

async function metaplexCoreContext(rpcUrl, authorityKeypair = null) {
  if (!rpcUrl) throw new Error("Solana RPC URL is required for NFT collections.");
  const [{ mplCore }, { createUmi }, umiLib, adapters] = await Promise.all([
    import("@metaplex-foundation/mpl-core"),
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/umi"),
    import("@metaplex-foundation/umi-web3js-adapters")
  ]);
  const umi = createUmi(rpcUrl).use(mplCore());
  if (authorityKeypair?.secretKey) {
    umi.use(umiLib.keypairIdentity(adapters.fromWeb3JsKeypair(authorityKeypair)));
  }
  return { umi, umiLib };
}

export async function fetchMetaplexCoreCollection({ rpcUrl, address }) {
  const { umi } = await metaplexCoreContext(rpcUrl);
  const { fetchCollection } = await import("@metaplex-foundation/mpl-core");
  const collection = await fetchCollection(umi, String(address || "").trim());
  return {
    address: String(collection.publicKey),
    updateAuthority: String(collection.updateAuthority),
    name: String(collection.name || ""),
    uri: String(collection.uri || ""),
    numMinted: Number(collection.numMinted || 0),
    currentSize: Number(collection.currentSize || 0),
    royaltyBps: Number(collection.royalties?.basisPoints || 0),
    maxSupply: Number(collection.masterEdition?.maxSupply || 0)
  };
}

export async function fetchMetaplexCoreAssets({ rpcUrl, collectionAddress }) {
  const { umi } = await metaplexCoreContext(rpcUrl);
  const { fetchAssetsByCollection } = await import("@metaplex-foundation/mpl-core");
  const assets = await fetchAssetsByCollection(umi, String(collectionAddress || "").trim(), { skipDerivePlugins: true });
  return assets.map((asset) => ({
    address: String(asset.publicKey),
    owner: String(asset.owner),
    name: String(asset.name || ""),
    uri: String(asset.uri || "")
  }));
}

export async function fetchMetaplexCoreAssetsByAddress({ rpcUrl, addresses = [] }) {
  const clean = [...new Set((Array.isArray(addresses) ? addresses : []).map((value) => String(value || "").trim()).filter(Boolean))];
  if (!clean.length) return [];
  const { umi } = await metaplexCoreContext(rpcUrl);
  const { fetchAllAssets } = await import("@metaplex-foundation/mpl-core");
  const assets = await fetchAllAssets(umi, clean, { skipDerivePlugins: true, chunkSize: 50 });
  return assets.map((asset) => ({
    address: String(asset.publicKey),
    owner: String(asset.owner),
    name: String(asset.name || ""),
    uri: String(asset.uri || "")
  }));
}

export async function createMetaplexCoreAsset({
  rpcUrl,
  authorityKeypair,
  collectionAddress,
  recipient,
  name,
  uri,
  editionNumber,
  signerSecretKey,
  onSigner
}) {
  if (!authorityKeypair?.secretKey) throw new Error("Collection authority wallet is unavailable.");
  if (!collectionAddress || !recipient || !name || !uri) throw new Error("Collection, recipient, name, and metadata URI are required.");
  const { umi, umiLib } = await metaplexCoreContext(rpcUrl, authorityKeypair);
  const { create, fetchCollection } = await import("@metaplex-foundation/mpl-core");
  const asset = signerSecretKey?.length
    ? umiLib.createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(signerSecretKey)))
    : umiLib.generateSigner(umi);
  if (typeof onSigner === "function") {
    await onSigner({ address: String(asset.publicKey), secretKey: Uint8Array.from(asset.secretKey) });
  }
  const collection = await fetchCollection(umi, umiLib.publicKey(String(collectionAddress).trim()));
  const plugins = Number.isInteger(Number(editionNumber)) && Number(editionNumber) > 0
    ? [{ type: "Edition", number: Number(editionNumber) }]
    : [];
  const result = await create(umi, {
    asset,
    collection,
    owner: umiLib.publicKey(String(recipient).trim()),
    name: cleanText(name, COLLECTION_NAME_MAX),
    uri: String(uri).trim(),
    plugins
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  return {
    address: String(asset.publicKey),
    signatureBytes: result?.signature ? Uint8Array.from(result.signature) : new Uint8Array()
  };
}
