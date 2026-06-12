// Smoke: the /t share-tag injection regexes must match the real t.html markup.
// Mirrors the .replace chain in injectTokenShareTags (src/index.js).
import fs from "node:fs";

const html = fs.readFileSync(new URL("../web/dist/t.html", import.meta.url), "utf8");
const title = "$BONK — SlimeShield says BUY (82/100) | SlimeWire";
const desc = "MC 1.2M. Triple-engine risk read (SlimeShield × Rugcheck × GoPlus).";
const img = "https://go.slimewire.org/api/web/signal-card?tokenMint=Dez";

const out = html
  .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  .replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`)
  .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
  .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
  .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`);

const checks = {
  title: out.includes(`<title>${title}</title>`),
  description: out.includes(`name="description" content="${desc}"`),
  ogTitle: out.includes(`property="og:title" content="${title}"`),
  ogDescription: out.includes(`property="og:description" content="${desc}"`),
  ogImage: out.includes(`property="og:image" content="${img}"`)
};
console.log(JSON.stringify(checks, null, 1));
if (Object.values(checks).some((ok) => !ok)) {
  console.error("SHARE TAG REGEX MISMATCH");
  process.exit(1);
}
console.log("All share-tag replacements match t.html markup.");
