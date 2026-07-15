// Source for web/public/vendor/slimewire-mwa.iife.min.js.
// Regenerate deliberately with:
//   npm install --no-save @solana-mobile/mobile-wallet-adapter-protocol@2.2.9
//   npx esbuild scripts/slimewire-mwa-entry.js --bundle --minify --platform=browser --format=iife --target=chrome100 --outfile=web/public/vendor/slimewire-mwa.iife.min.js
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";

const APP_IDENTITY = Object.freeze({
  name: "SlimeWire",
  uri: "https://slimewire.org",
  icon: "assets/slimewire/png/slimewire-mark.png",
});

function bytesToBase58(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let number = 0n;
  for (const byte of bytes) number = (number << 8n) + BigInt(byte);
  let encoded = "";
  while (number > 0n) {
    encoded = alphabet[Number(number % 58n)] + encoded;
    number /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = `1${encoded}`;
  }
  return encoded || "1";
}

function base64AddressToBase58(address) {
  const text = String(address || "").trim();
  if (!text) throw new Error("The wallet did not return a Solana address.");
  // MWA protocol accounts use base64. Wallet-standard-shaped accounts may
  // already expose the familiar base58 address, so accept either shape.
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) return text;
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (bytes.length !== 32) throw new Error("The wallet returned an invalid Solana address.");
  return bytesToBase58(bytes);
}

async function authorizeAndSign(options = {}) {
  if (typeof options.prepareTransaction !== "function") throw new Error("The funding transaction could not be prepared.");
  const cached = options.cachedAuthorization && typeof options.cachedAuthorization === "object"
    ? options.cachedAuthorization
    : null;
  const baseUri = String(cached?.walletUriBase || "").trim();
  return transact(async (wallet) => {
    let authorization;
    try {
      authorization = await wallet.authorize({
        identity: APP_IDENTITY,
        chain: "solana:mainnet",
        ...(cached?.authToken ? { auth_token: cached.authToken } : {}),
      });
    } catch (error) {
      if (!cached?.authToken) throw error;
      // A wallet/account change can invalidate an old authorization token.
      // Re-authorize in the same open MWA activity instead of bouncing the
      // user back to SlimeWire and making them tap the wallet a second time.
      authorization = await wallet.authorize({ identity: APP_IDENTITY, chain: "solana:mainnet" });
    }
    const account = authorization?.accounts?.[0];
    const publicKey = base64AddressToBase58(account?.address);
    const order = await options.prepareTransaction(publicKey);
    if (!order?.transaction) throw new Error("The funding transaction could not be prepared.");
    const signed = await wallet.signTransactions({ payloads: [String(order.transaction)] });
    const signedTransaction = String(signed?.signed_payloads?.[0] || "").trim();
    if (!signedTransaction) throw new Error("The wallet did not return the approved transfer.");
    return {
      publicKey,
      order,
      signedTransaction,
      authorization: {
        authToken: String(authorization.auth_token || ""),
        walletUriBase: String(authorization.wallet_uri_base || ""),
        publicKey,
      },
    };
  }, baseUri ? { baseUri } : undefined);
}

window.SlimeWireMwa = Object.freeze({ authorizeAndSign });
