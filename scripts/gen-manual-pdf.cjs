const path = require("path");
const http = require("http");
const fs = require("fs");
const { chromium } = require(path.join(process.cwd(), "tools/recorder/node_modules/playwright"));

// Render web/public/manual.html to a print-ready PDF. We serve the page over a tiny local HTTP
// server (NOT file://) so the absolute /assets/... paths resolve — that's what makes the cover logo,
// the grid background and the footer lockup actually render into the PDF instead of being dropped.
const ROOT = path.join(process.cwd(), "web/public");
const MIME = {
  ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".css": "text/css",
  ".js": "text/javascript", ".json": "application/json", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2"
};

(async () => {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/manual.html";
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${port}/manual.html`, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1800);
  fs.mkdirSync(path.join(process.cwd(), "docs"), { recursive: true });
  await p.pdf({
    path: "docs/SlimeWire-User-Manual.pdf",
    format: "A4",
    printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" }
  });
  await b.close();
  server.close();
  console.log("PDF written -> docs/SlimeWire-User-Manual.pdf");
})().catch((e) => { console.error("PDF FAIL:", e.message); process.exit(1); });
