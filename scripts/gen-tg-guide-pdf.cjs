const path = require("path");
const http = require("http");
const fs = require("fs");
const { chromium } = require(path.join(process.cwd(), "tools/recorder/node_modules/playwright"));

// Render web/public/tg-guide.html to a print-ready PDF where EACH section is its own page, sized to
// exactly its own content height (CSS named pages + preferCSSPageSize). That gives BOTH: every tool
// fully on one page (no bleeding across a break) AND no blank space at the bottom (the page shrinks to
// the content instead of padding out to a fixed A4). Served over a tiny local HTTP server so the
// absolute /assets/... paths resolve. Output lands in web/public/ for a direct download link.
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
    if (p === "/") p = "/tg-guide.html";
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
  const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
  await p.emulateMedia({ media: "print" });
  await p.goto(`http://127.0.0.1:${port}/tg-guide.html`, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1600);

  // Assign every top-level block (cover, each .sec, footer) its own named @page sized to its measured
  // content height + a small safety pad so a sub-pixel reflow never spills onto a second page.
  await p.evaluate(() => {
    const W = 794, PAD = 26;
    const lead = document.querySelector(".lead"); if (lead) lead.style.display = "none";
    // Each section is its OWN page now, so the old break-inside:avoid rules (meant for A4 flow) only
    // hurt — they bump a card/tip onto a phantom second page. Neutralize them; the page is content-sized.
    const rules = ["@page{margin:0}", ".step,.card,.nav-row,.tip,.warn,.note,.sech,.cards{break-inside:auto !important;break-before:auto !important;break-after:auto !important}"];
    const cover = document.querySelector(".cover");
    const secs = [...document.querySelectorAll(".sec")];
    const foot = document.querySelector(".foot");
    secs.forEach((s) => { s.style.borderTop = "none"; });
    // MEASURE true flowed height via the gap to the NEXT block — getBoundingClientRect misses a child's
    // bottom margin (e.g. a trailing .tip), which is exactly what was spilling a section onto page 2.
    const top = (el) => el.getBoundingClientRect().top;
    const bot = (el) => el.getBoundingClientRect().bottom;
    const secTop = secs.map(top);
    const setPage = (el, name, h) => { el.style.page = name; el.style.breakBefore = "page"; rules.push(`@page ${name}{size:${W}px ${Math.max(90, Math.ceil(h)) + PAD}px;margin:0}`); };
    if (cover) setPage(cover, "pcover", bot(cover) - top(cover));
    secs.forEach((s, i) => {
      // Height = gap to the next section (captures trailing child margins). The last section measures to
      // the footer, so it carries the .body bottom padding as extra headroom — fine, keeps its tail on-page.
      const h = (i + 1 < secs.length ? secTop[i + 1] : top(foot)) - secTop[i];
      setPage(s, "psec" + i, h);
    });
    if (foot) setPage(foot, "pfoot", bot(foot) - top(foot));
    const st = document.createElement("style"); st.textContent = rules.join("\n"); document.head.appendChild(st);
  });

  const outPub = path.join(ROOT, "SlimeWire-TG-Guide.pdf");
  await p.pdf({ path: outPub, printBackground: true, preferCSSPageSize: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
  fs.mkdirSync(path.join(process.cwd(), "docs"), { recursive: true });
  fs.copyFileSync(outPub, path.join(process.cwd(), "docs", "SlimeWire-TG-Guide.pdf"));
  await b.close();
  server.close();
  console.log("PDF written -> web/public/SlimeWire-TG-Guide.pdf (one page per section, sized to content)");
})().catch((e) => { console.error("PDF FAIL:", e.message); process.exit(1); });
