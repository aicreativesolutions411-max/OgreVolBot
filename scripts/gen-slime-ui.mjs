// Kick the local Codex CLI to render premium slime UI backgrounds for the map/airdrop pages + X card.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const base = path.join(process.env.USERPROFILE || process.env.HOME, ".codex", "vendor_imports");
function findCodex(root){ try{ for(const d of fs.readdirSync(root)){ const p=path.join(root,d,"codex.exe"); if(fs.existsSync(p)) return p; } }catch{} return null; }
let CODEX=null; try{ CODEX=findCodex(path.join(process.env.USERPROFILE,".codex","vendor_imports")); }catch{}
if(!CODEX){ try{ const b=path.join(process.env.USERPROFILE,".codex"); for(const d of fs.readdirSync(b)){ const p=path.join(b,d); const f=findCodex(p); if(f){CODEX=f;break;} } }catch{} }
if(!CODEX){ console.log("codex.exe not found"); process.exit(2); }
const OUT = path.resolve("web/public/ui");
const jobs = [
  { file: path.join(OUT,"slime-dark.png"), prompt: "Premium dark UI background texture for a crypto app, deep near-black forest green (#03100a), glossy dripping slime and neon lime-green (#5be36a) bioluminescent glow blobs around the EDGES, large EMPTY dark negative space in the CENTER, soft grain, cinematic, seamless, 1536x1024 landscape, NO text, NO characters, NO logos." },
  { file: path.join(OUT,"slime-cream.png"), prompt: "Premium light UI background texture, warm cream parchment (#f6ecd7) with soft pastel pink, mint and lavender glossy slime blobs only around the EDGES, large EMPTY cream negative space in the CENTER, subtle paper grain, elegant, seamless, 1536x1024 landscape, NO text, NO characters, NO logos." },
];
const instruction = "Generate these images with the imagegen tool and save each PNG to the exact absolute path shown. Do not ask questions, just create them:\n" +
  jobs.map((j,i)=>`${i+1}) ${j.prompt}  ->  ${j.file}`).join("\n");
console.log("codex:", CODEX);
try { execFileSync(CODEX, ["exec", instruction], { stdio: ["ignore","inherit","inherit"], timeout: 25*60_000 }); }
catch(e){ console.log("codex error:", String(e.message||e).slice(0,160)); }
for(const j of jobs) console.log(fs.existsSync(j.file)?("OK "+path.basename(j.file)):("MISSING "+path.basename(j.file)));
