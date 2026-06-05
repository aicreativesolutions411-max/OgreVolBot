import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : "";
}

const token = argValue("token") || "<mintOrTokenAddress>";

console.log(JSON.stringify({
  token,
  prefetchSources: {
    hover: /pointerenter[\s\S]*prefetchTokenChartFromElement/.test(appSource),
    touch: /touchstart[\s\S]*prefetchTokenChartFromElement/.test(appSource),
    focus: /focusin[\s\S]*prefetchTokenChartFromElement/.test(appSource),
    click: /function openTokenChart[\s\S]*prefetchTokenChart/.test(appSource)
  },
  routeChunkPrefetched: /prefetchTokenChart/.test(appSource),
  metadataPrefetched: /rememberSmartChartDexResolution\(tokenRef\)/.test(appSource),
  candlesPrefetched: false,
  candleProvider: "dexscreener-embed",
  dedupeHit: /smartChartBootstrapLoading/.test(appSource),
  providerCallsAvoided: /smartChartBootstrapForMint\(mint\)/.test(appSource),
  cacheTtl: /SMART_CHART_BOOTSTRAP_TTL_MS = 10 \* 60 \* 1000/.test(appSource) ? "10m" : "unknown"
}, null, 2));
