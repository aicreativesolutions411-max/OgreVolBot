const path = require("path");
const { chromium } = require(path.join(process.cwd(), "tools/recorder/node_modules/playwright"));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const f = "file:///" + path.join(process.cwd(), "web/public/manual.html").split(path.sep).join("/");
  await p.goto(f, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1800);
  await p.pdf({ path: "docs/SlimeWire-User-Manual.pdf", format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
  await b.close();
  console.log("PDF written -> docs/SlimeWire-User-Manual.pdf");
})().catch((e) => { console.error("PDF FAIL:", e.message); process.exit(1); });
