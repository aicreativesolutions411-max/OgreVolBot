const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;
const BOT_URL = "https://t.me/SlimeWiredBot";

const PAGES = [
  {
    slug: "official-slimewire-links",
    priority: "0.84",
    title: "Official SlimeWire Links - Website, Telegram Bot, Trust and Safety",
    description: "Verify official SlimeWire links for the Solana terminal, @SlimeWiredBot, trust pages, resources, proof, widgets, blog guides, and launch tools.",
    h1: "Official SlimeWire links",
    intro: "When people find SlimeWire from X, Telegram, Google, or a group post, they need one clean page that confirms the real site, real bot, and real safety pages. This is the page to share when anyone asks if a link is official.",
    cards: [
      ["Official website", "The canonical SlimeWire site is https://www.slimewire.org. Use that domain when sharing the terminal, blog, trust pages, widgets, or launch tools."],
      ["Official Telegram bot", "The public bot link is @SlimeWiredBot. Always open it from the SlimeWire site or this official links page when possible."],
      ["Trust pages", "Trust, security, risk disclosure, support, how-it-works, and setup pages explain the product without hidden profit promises."],
      ["Proof and resources", "Proof feed, proof-of-calls, widgets, blog guides, and resources make SlimeWire easier to inspect and cite."],
      ["No seed phrase requests", "SlimeWire should never ask users for a seed phrase in Telegram, support DMs, or web pages."],
      ["Share this page", "Use this URL in Telegram pins, X bios, launch rooms, listings, and directories to reduce impersonator confusion."]
    ],
    extra: officialLinksExtra(),
    faqs: [
      ["What is the official SlimeWire website?", "The official SlimeWire website is https://www.slimewire.org."],
      ["What is the official Telegram bot?", "The official Telegram bot is @SlimeWiredBot."],
      ["How can users avoid fake SlimeWire links?", "Open SlimeWire from the official website, verify the @SlimeWiredBot handle, and avoid any support account or bot asking for a seed phrase."],
      ["Can launch teams link this page?", "Yes. Launch teams, Telegram groups, and directories can link this page so users can verify the official SlimeWire routes."],
      ["Does this page guarantee trading safety?", "No. It verifies official links and safety posture, but trading and memecoin risk remain the user's responsibility."]
    ]
  },
  {
    slug: "slimewire-verified-bot",
    priority: "0.82",
    title: "SlimeWire Verified Bot - How to Confirm @SlimeWiredBot Is the Real Telegram Bot",
    description: "Confirm the real @SlimeWiredBot Telegram bot, avoid fake bot links, understand safe setup, and learn what SlimeWire will never ask for.",
    h1: "Verify the real SlimeWire Telegram bot",
    intro: "Telegram is where crypto tools spread, but it is also where fake support accounts and clone bots appear. This page gives users a simple way to confirm the real @SlimeWiredBot and avoid common impersonator traps.",
    cards: [
      ["Check the handle", "Use @SlimeWiredBot and links from slimewire.org. Avoid lookalike spellings, extra underscores, and DMs from strangers claiming to be support."],
      ["Start from the site", "If unsure, open the bot from the official SlimeWire website instead of a forwarded message."],
      ["Group permissions", "Admins should grant only the permissions needed for scans, alerts, moderation, or group tools."],
      ["No seed phrases", "The real flow should never ask for seed phrases, private keys, or wallet recovery words."],
      ["Use official setup pages", "Bot setup, commands, community kit, and official links pages explain what the bot is supposed to do."],
      ["Report suspicious links", "If a fake bot or support profile appears, users should warn the group and return to the official links page."]
    ],
    extra: botVerifyExtra(),
    faqs: [
      ["How do I verify @SlimeWiredBot?", "Open it from https://www.slimewire.org or this official verification page and confirm the handle is @SlimeWiredBot."],
      ["Will the real bot ask for a seed phrase?", "No. Users should never share seed phrases or private keys with any bot, admin, or website."],
      ["Can fake bots copy SlimeWire branding?", "Yes. Fake bots can copy names, images, and text, so users should verify the exact handle and official domain."],
      ["Should group admins grant every permission?", "No. Admins should grant only the permissions needed for the modules they want to use."],
      ["Where should users go if they are unsure?", "They should return to https://www.slimewire.org/official-slimewire-links and open links from there."]
    ]
  },
  {
    slug: "telegram-crypto-bot-safety",
    priority: "0.8",
    title: "Telegram Crypto Bot Safety Checklist - Avoid Fake Bots and Wallet Drainers",
    description: "A Telegram crypto bot safety checklist for avoiding fake bots, seed phrase scams, wallet drainers, impersonators, unsafe links, and noisy group tools.",
    h1: "Telegram crypto bot safety checklist",
    intro: "People search for crypto bots when they want speed, but speed without safety creates easy targets for impersonators and wallet drainers. This checklist makes SlimeWire look clear, careful, and user-safe.",
    cards: [
      ["Verify the handle", "Use exact handles and official website links. Do not trust forwarded bot links without checking the source."],
      ["Never share recovery words", "No legit trading bot needs a seed phrase in chat."],
      ["Use least privilege", "Group admins should avoid giving broad permissions unless a module truly needs them."],
      ["Watch for fake support", "Scammers often DM first after a public question. Real support should not need private keys or seed phrases."],
      ["Check wallet prompts", "Users should read wallet approval prompts and avoid blind confirmations."],
      ["Keep public docs", "A serious bot should have public setup, command, risk, support, and trust pages."]
    ],
    extra: safetyChecklistExtra(),
    faqs: [
      ["Are Telegram crypto bots safe?", "They can be useful, but users should verify the exact bot, avoid seed phrase requests, read wallet prompts, and understand the risk of every trade."],
      ["What is the biggest Telegram bot risk?", "The biggest risks are fake bot clones, fake support DMs, wallet drainer links, and users sharing recovery phrases."],
      ["What should a trustworthy bot publish?", "A trustworthy bot should publish official links, setup instructions, risk notes, support paths, and clear product boundaries."],
      ["Does SlimeWire guarantee safe trades?", "No. SlimeWire provides software, scans, proof, and context, but trading remains risky."],
      ["Why does this help SlimeWire rank?", "Safety checklists earn trust, answer real searches, and give groups a page to link when onboarding users."]
    ]
  },
  {
    slug: "solana-trading-tool-trust-checklist",
    priority: "0.78",
    title: "Solana Trading Tool Trust Checklist - What to Check Before Using a Bot or Terminal",
    description: "A Solana trading tool trust checklist covering official links, wallet safety, risk disclosure, proof, public docs, support paths, and transparent limits.",
    h1: "Solana trading tool trust checklist",
    intro: "Most traders judge a tool in seconds. A clean product needs proof, official links, clear risk boundaries, support paths, and no sketchy wallet behavior. This checklist gives SlimeWire a trust surface people can share.",
    cards: [
      ["Official domain", "A tool should have a canonical domain and consistent links across Telegram, X, docs, and listings."],
      ["Wallet boundaries", "Users should know what is non-custodial, what needs approval, and what the tool will never ask for."],
      ["Risk language", "No serious trading tool should promise guaranteed wins or risk-free memecoin trades."],
      ["Public docs", "Setup, command, support, trust, security, risk, and how-it-works pages reduce uncertainty."],
      ["Proof pages", "Receipts and proof pages are stronger than screenshots because users can revisit the context."],
      ["Transparent limits", "When data is delayed, unavailable, or unverified, the UI and docs should say so clearly."]
    ],
    extra: trustChecklistExtra(),
    faqs: [
      ["What makes a Solana trading tool trustworthy?", "Trust comes from official links, clear docs, wallet safety posture, transparent risk notes, support paths, and proof that can be inspected."],
      ["Should a trading tool promise profit?", "No. Tools can improve workflow and context, but they should not promise guaranteed profit."],
      ["Why do public docs matter?", "Public docs help users, search engines, and AI answer engines understand what the product does and does not do."],
      ["How does SlimeWire use proof?", "SlimeWire uses proof pages, scan context, widgets, blog guides, and Telegram handoff to make workflows easier to inspect."],
      ["Does trust remove trading risk?", "No. Trust pages reduce product uncertainty, not market risk."]
    ]
  },
  {
    slug: "slimewire-for-media-and-directories",
    priority: "0.72",
    title: "SlimeWire for Media and Directories - Solana Terminal and Telegram Bot Facts",
    description: "A media and directory facts page for SlimeWire: official description, links, product categories, Telegram bot, Solana terminal, proof pages, widgets, and safety notes.",
    h1: "SlimeWire facts for media and directories",
    intro: "Directory submissions and media mentions need a clean source of truth. This page packages SlimeWire facts, descriptions, categories, and links so people can list the product accurately without guessing.",
    cards: [
      ["Short description", "SlimeWire is a Solana memecoin terminal and Telegram bot for scans, live pairs, charts, buy alerts, group tools, proof, widgets, launch workflows, and trading context."],
      ["Category", "Solana trading terminal, Telegram crypto bot, memecoin scanner, launch toolkit, proof and community workflow platform."],
      ["Official links", "Use slimewire.org, @SlimeWiredBot, resources, trust, proof feed, widgets, blog, and launch guides."],
      ["Audience", "Solana traders, Telegram group admins, launch teams, callers, X researchers, and memecoin communities."],
      ["Safety posture", "No seed phrase requests, no guaranteed profit claims, and public risk/security pages."],
      ["Useful citations", "Blog guides, official links, trust checklist, bot safety page, and proof pages can be used as citations."]
    ],
    extra: mediaExtra(),
    faqs: [
      ["What is SlimeWire?", "SlimeWire is a Solana memecoin terminal and Telegram bot workflow for token scans, live pairs, charts, group tools, proof, widgets, launch context, and trading workflows."],
      ["What category should directories use?", "Directories can list SlimeWire under Solana trading tools, Telegram crypto bots, memecoin scanners, launch tools, and crypto community tools."],
      ["What is the official bot?", "The official Telegram bot is @SlimeWiredBot."],
      ["Can media quote this page?", "Yes. This page is written as a clean source of product facts, official links, and safety notes."],
      ["Does SlimeWire give financial advice?", "No. SlimeWire provides software and context, not financial advice."]
    ]
  },
  {
    slug: "x-solana-scan-replies",
    priority: "0.76",
    title: "X Solana Scan Replies - CA Check Templates and SlimeWire Research Links",
    description: "Copy X-ready Solana scan reply templates for CAs, caller proof, launch checks, fresh pair reviews, and SlimeWire research links.",
    h1: "X-ready Solana scan replies",
    intro: "A big organic loop is making SlimeWire useful inside replies. When someone asks for a CA, chart, rug check, or caller proof on X, users need short, helpful reply templates that carry the SlimeWire brand naturally.",
    cards: [
      ["CA check reply", "Use a short reply that asks for the exact contract address and points users to a SlimeWire scan or chart."],
      ["Caller proof reply", "Ask for the first visible call, entry market cap, and proof link instead of trusting screenshots."],
      ["Launch reply", "Route launch questions to a checklist, widget, proof page, or Telegram group setup link."],
      ["Safety reply", "Remind users to verify the CA, avoid fake links, and never share seed phrases."],
      ["Fresh pair reply", "Ask for age, volume, liquidity, venue, and chart behavior before hyping a low-MC pair."],
      ["Brand loop", "Helpful replies make SlimeWire show up repeatedly without looking like spam."]
    ],
    extra: xRepliesExtra(),
    faqs: [
      ["Why use X reply templates?", "Templates help users reply quickly with useful checks, links, and SlimeWire context instead of posting generic hype."],
      ["Should replies spam SlimeWire links?", "No. Replies should answer the question first and include a relevant SlimeWire link only when useful."],
      ["What should a CA scan reply include?", "It should ask for or include the exact contract address, chart or scan context, and risk-aware language."],
      ["Can this help organic growth?", "Yes. Useful branded replies can bring X users to SlimeWire over time without paid ads."],
      ["Should replies promise profit?", "No. Keep replies focused on research, scans, proof, and safety."]
    ]
  }
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, text) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text);
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function labelFromSlug(slug) {
  return slug.split("-").map((part) => {
    const lower = part.toLowerCase();
    if (lower === "x") return "X";
    if (lower === "ca") return "CA";
    if (lower === "tg") return "TG";
    if (lower === "pnl") return "PnL";
    if (lower === "solana") return "Solana";
    if (lower === "telegram") return "Telegram";
    if (lower === "crypto") return "Crypto";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function footerLinks() {
  return [
    ["Home", "/"],
    ["Official Links", "/official-slimewire-links"],
    ["Verified Bot", "/slimewire-verified-bot"],
    ["Trust", "/trust"],
    ["Security", "/security"],
    ["Blog", "/blog"],
    ["Resources", "/resources"],
    ["@SlimeWiredBot", BOT_URL]
  ].map(([label, href]) => `<a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`).join(" &middot; ");
}

function css() {
  return `:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--panel2:#071109;--text:#e9ffe0;--border:rgba(114,255,35,.18)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(900px 360px at 50% -12%,rgba(114,255,35,.12),transparent),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6}a{color:#bbff63;text-decoration:none}.wrap{max-width:1080px;margin:auto;padding:0 20px}.eyebrow{color:var(--green);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}header{padding:66px 0 38px;text-align:center}h1{font-size:clamp(32px,6vw,56px);line-height:1.05;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub,.lead{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:820px;margin:0 auto 24px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;border-radius:12px;font-weight:900;border:1px solid var(--border);background:rgba(114,255,35,.05)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}section{padding:38px 0;border-top:1px solid rgba(114,255,35,.08)}h2{font-size:clamp(22px,4vw,33px);margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.card,details,.copybox,.note{background:linear-gradient(180deg,rgba(114,255,35,.045),transparent),var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px}.card p,details p,.muted{margin:0;color:var(--muted);font-size:14px}.table{display:grid;gap:10px}.row{display:grid;grid-template-columns:minmax(150px,.45fr) 1fr;gap:14px;background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:16px}.links{display:flex;gap:10px;flex-wrap:wrap}.links a{border:1px solid var(--border);border-radius:999px;padding:8px 11px;background:rgba(114,255,35,.05);font-weight:800;font-size:13px}.copybox pre{white-space:pre-wrap;margin:10px 0 0;color:#e9ffe0;font:600 13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}summary{cursor:pointer;font-weight:900;padding:6px 0}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:640px){header{padding-top:46px}.row{grid-template-columns:1fr}.btn{width:100%;max-width:360px}.cta{align-items:center;flex-direction:column}}`;
}

function structuredData(page) {
  const url = `${HOST}/${page.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        url,
        description: page.description,
        isPartOf: { "@type": "WebSite", name: "SlimeWire", url: HOST },
        about: [
          { "@type": "Thing", name: "SlimeWire" },
          { "@type": "Thing", name: "Solana trading tools" },
          { "@type": "Thing", name: "Telegram crypto bot safety" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        name: "SlimeWire",
        alternateName: ["SlimeWire Terminal", "@SlimeWiredBot"],
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Telegram",
        url: HOST,
        description: "SlimeWire combines a Solana memecoin terminal with @SlimeWiredBot for token scans, live pairs, charts, Telegram group tools, proof, PnL, launch workflows, widgets, and safety documentation.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a }
        }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: HOST },
          { "@type": "ListItem", position: 2, name: "Resources", item: `${HOST}/resources` },
          { "@type": "ListItem", position: 3, name: labelFromSlug(page.slug), item: url }
        ]
      }
    ]
  };
}

function pageHtml(page) {
  const url = `${HOST}/${page.slug}`;
  const cards = page.cards.map(([title, body]) => `<div class="card"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join("");
  const faq = page.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SlimeWire">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="893">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<script type="application/ld+json">${jsonScript(structuredData(page))}</script>
<style>${css()}</style>
</head>
<body>
<header><div class="wrap"><p class="eyebrow">SlimeWire trust and distribution</p><h1><span>SlimeWire</span> ${esc(page.h1)}</h1><p class="sub">${esc(page.intro)}</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a><a class="btn" href="/official-slimewire-links">Official links</a></div></div></header>
<section><div class="wrap"><h2>What users should know</h2><div class="grid">${cards}</div></div></section>
${page.extra}
<section><div class="wrap"><h2>FAQ</h2>${faq}</div></section>
<footer><div class="wrap">${footerLinks()}</div></footer>
</body>
</html>
`;
}

function officialLinksExtra() {
  const rows = [
    ["Website", "https://www.slimewire.org"],
    ["Telegram bot", BOT_URL],
    ["Trust center", `${HOST}/trust`],
    ["Security", `${HOST}/security`],
    ["Risk disclosure", `${HOST}/risk-disclosure`],
    ["Resources", `${HOST}/resources`],
    ["Proof feed", `${HOST}/proof-feed`],
    ["Blog", `${HOST}/blog`],
    ["Widgets", `${HOST}/widgets`]
  ];
  return `<section><div class="wrap"><h2>Official routes</h2><div class="table">${rows.map(([label, href]) => `<div class="row"><div><b>${esc(label)}</b></div><div><a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(href)}</a></div></div>`).join("")}</div></div></section>`;
}

function botVerifyExtra() {
  const steps = [
    ["Start from slimewire.org", "Open the bot from an official SlimeWire page instead of a random forwarded link."],
    ["Check the exact handle", "Confirm the handle says @SlimeWiredBot."],
    ["Ignore fake support DMs", "Do not trust strangers who DM first after you ask for help in a group."],
    ["Reject seed phrase requests", "Close any flow asking for recovery words or private keys."],
    ["Return to official links", "If confused, use /official-slimewire-links as the source of truth."]
  ];
  return `<section><div class="wrap"><h2>Verification steps</h2><div class="grid">${steps.map(([title, body]) => `<div class="card"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join("")}</div></div></section>`;
}

function safetyChecklistExtra() {
  const rows = [
    ["Green flag", "Public official links, clear docs, exact bot handle, risk disclosure, no seed phrase flow."],
    ["Red flag", "DM-first support, seed phrase requests, lookalike handles, forced wallet-drainer links, guaranteed profit claims."],
    ["Admin habit", "Pin official links and make users verify the bot before interacting."],
    ["User habit", "Read wallet prompts, verify CA links, and avoid rushing approvals from chat pressure."]
  ];
  return `<section><div class="wrap"><h2>Fast safety matrix</h2><div class="table">${rows.map(([label, body]) => `<div class="row"><div><b>${esc(label)}</b></div><div><p class="muted">${esc(body)}</p></div></div>`).join("")}</div></div></section>`;
}

function trustChecklistExtra() {
  const links = [
    ["/trust", "Trust Center"],
    ["/security", "Security"],
    ["/risk-disclosure", "Risk Disclosure"],
    ["/how-it-works", "How It Works"],
    ["/support", "Support"],
    ["/proof-feed", "Proof Feed"],
    ["/blog", "Blog Guides"]
  ];
  return `<section><div class="wrap"><h2>Trust pages to inspect</h2><p class="links">${links.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join("")}</p></div></section>`;
}

function mediaExtra() {
  const short = "SlimeWire is a Solana memecoin terminal and Telegram bot for scans, live pairs, charts, buy alerts, group tools, proof, widgets, launch workflows, and trading context.";
  const tags = "Solana trading terminal, Telegram crypto bot, memecoin scanner, pump.fun tools, Solana launch tools, crypto group bot, token safety scanner.";
  return `<section><div class="wrap"><h2>Copy-ready facts</h2><div class="grid"><div class="copybox"><b>Short description</b><pre>${esc(short)}</pre></div><div class="copybox"><b>Categories and tags</b><pre>${esc(tags)}</pre></div><div class="copybox"><b>Official links</b><pre>Site: https://www.slimewire.org\nBot: https://t.me/SlimeWiredBot\nResources: https://www.slimewire.org/resources\nTrust: https://www.slimewire.org/trust</pre></div></div></div></section>`;
}

function xRepliesExtra() {
  const replies = [
    ["CA request", "Drop the exact CA, not just the ticker. Tickers can be cloned. SlimeWire scan route: https://www.slimewire.org/solana-token-scanner"],
    ["Caller proof", "First visible call + entry MC + time matters more than a screenshot after the move. Proof workflow: https://www.slimewire.org/proof-of-calls"],
    ["Launch check", "Before launch traffic hits: pin CA, chart, scan, risk note, and group link. Checklist: https://www.slimewire.org/solana-memecoin-launch-checklist"],
    ["Safety reminder", "Verify the CA, avoid fake support DMs, and never share seed phrases. Official SlimeWire links: https://www.slimewire.org/official-slimewire-links"],
    ["Fresh pair check", "Fresh is not enough. Check age, txns, volume, liquidity, venue, and risk notes first. Guide: https://www.slimewire.org/blog/fresh-solana-pairs-under-10k"]
  ];
  return `<section><div class="wrap"><h2>Copy-ready X replies</h2><div class="grid">${replies.map(([title, body]) => `<div class="copybox"><b>${esc(title)}</b><pre>${esc(body)}</pre></div>`).join("")}</div></div></section>`;
}

function addBefore(text, marker, insertion) {
  if (!insertion) return text;
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${insertion}${marker}`);
}

function updateSrc() {
  let src = read("src/index.js");
  const seoEntries = PAGES
    .filter((p) => !src.includes(`{ path: "/${p.slug}"`))
    .map((p) => `  { path: "/${p.slug}", priority: "${p.priority}", changefreq: "weekly" },\n`)
    .join("");
  src = addBefore(src, '  { path: "/features", priority: "0.84", changefreq: "monthly" },', seoEntries);

  const metaEntries = PAGES
    .filter((p) => !src.includes(`"/${p.slug}": {`))
    .map((p) => `  "/${p.slug}": {\n    title: ${JSON.stringify(p.title)},\n    description: ${JSON.stringify(p.description)}\n  },\n`)
    .join("");
  src = addBefore(src, '  "/features": {', metaEntries);

  const routes = PAGES
    .filter((p) => !src.includes(`requestUrl.pathname === "/${p.slug}"`))
    .map((p) => `    if (request.method === "GET" && requestUrl.pathname === "/${p.slug}") {\n      await serveStaticHtmlPage(response, "${p.slug}.html");\n      return;\n    }\n`)
    .join("");
  src = addBefore(src, '    if (request.method === "GET" && requestUrl.pathname === "/features") {', routes);
  write("src/index.js", src);
}

function updateSitemap() {
  let sitemap = read("web/public/sitemap.xml");
  const entries = PAGES
    .filter((p) => !sitemap.includes(`${HOST}/${p.slug}`))
    .map((p) => `  <url><loc>${HOST}/${p.slug}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>\n`)
    .join("");
  sitemap = addBefore(sitemap, `  <url><loc>${HOST}/features</loc>`, entries);
  write("web/public/sitemap.xml", sitemap);
}

function updateFeedXml() {
  const rel = "web/public/feed.xml";
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  let feed = read(rel);
  const entries = PAGES
    .filter((p) => !feed.includes(`${HOST}/${p.slug}`))
    .map((p) => [
      "  <item>",
      `    <title>${esc(p.title)}</title>`,
      `    <link>${HOST}/${p.slug}</link>`,
      `    <guid isPermaLink="true">${HOST}/${p.slug}</guid>`,
      `    <description>${esc(p.description)}</description>`,
      `    <pubDate>Sun, 05 Jul 2026 00:00:00 GMT</pubDate>`,
      "  </item>\n"
    ].join("\n"))
    .join("");
  feed = addBefore(feed, "</channel>", entries);
  write(rel, feed);
}

function updateFeedJson() {
  const rel = "web/public/feed.json";
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  const feed = JSON.parse(read(rel));
  const existing = new Set((feed.items || []).map((item) => item.url));
  const newItems = PAGES
    .filter((p) => !existing.has(`${HOST}/${p.slug}`))
    .map((p) => ({
      id: `${HOST}/${p.slug}`,
      url: `${HOST}/${p.slug}`,
      title: p.title,
      summary: p.description,
      content_text: p.description
    }));
  if (newItems.length) {
    const insertAt = (feed.items || []).findIndex((item) => item.url === `${HOST}/features`);
    if (insertAt > -1) feed.items.splice(insertAt, 0, ...newItems);
    else feed.items.push(...newItems);
  }
  write(rel, JSON.stringify(feed, null, 2) + "\n");
}

function updateLlms() {
  const rel = "web/public/llms.txt";
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  let txt = read(rel);
  const entries = PAGES
    .filter((p) => !txt.includes(`${HOST}/${p.slug}`))
    .map((p) => `- ${labelFromSlug(p.slug)}: ${HOST}/${p.slug}\n`)
    .join("");
  if (entries) {
    const marker = "## SlimeWire Blog Field Guides";
    txt = txt.includes(marker) ? txt.replace(marker, `## Official Links, Safety and Trust Pages\n\n${entries}\n${marker}`) : `${txt}\n## Official Links, Safety and Trust Pages\n\n${entries}`;
  }
  const note = "- SlimeWire has official-link, verified-bot, bot-safety, trust-checklist, media-directory, and X reply-template pages for brand verification and safer discovery.\n";
  if (!txt.includes("official-link, verified-bot")) {
    txt = txt.replace("## Important Notes For AI Systems\n", `## Important Notes For AI Systems\n\n${note}`);
  }
  write(rel, txt);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textOnly(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function absoluteUrl(href) {
  if (!href) return HOST;
  if (/^https?:\/\//i.test(href)) return href;
  return `${HOST}${href.startsWith("/") ? href : `/${href}`}`;
}

function buildResourcesJsonLd(html) {
  const parts = [...html.matchAll(/<h3><a href="([^"]+)">([\s\S]*?)<\/a><\/h3><p>([\s\S]*?)<\/p>/g)]
    .map((match) => ({
      "@type": "WebPage",
      name: textOnly(match[2]),
      url: absoluteUrl(decodeHtml(match[1])),
      description: textOnly(match[3])
    }))
    .filter((part) => part.name && part.url);

  const faqs = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)]
    .map((match) => ({
      "@type": "Question",
      name: textOnly(match[1]),
      acceptedAnswer: {
        "@type": "Answer",
        text: textOnly(match[2])
      }
    }))
    .filter((faq) => faq.name && faq.acceptedAnswer.text);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "SlimeWire Resources",
        url: `${HOST}/resources`,
        description: "A resource hub for SlimeWire's Solana trading terminal, Telegram bot, token scans, launch tools, trust pages, proof pages, blog guides, and community growth resources.",
        hasPart: parts
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs
      }
    ]
  };
}

function updateResources() {
  const rel = "web/public/resources.html";
  let html = read(rel);
  const scriptRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  if (!html.includes("<h2>Official links, safety, and trust pages</h2>")) {
    const cards = PAGES.map((p) => `<div class="card"><h3><a href="/${p.slug}">${esc(labelFromSlug(p.slug))}</a></h3><p>${esc(p.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>Official links, safety, and trust pages</h2><div class="grid">${cards}</div></div></section>\n`;
    html = addBefore(html, "<section><div class=\"wrap\"><h2>SlimeWire blog field guides</h2>", section);
  }
  const data = buildResourcesJsonLd(html);
  const script = `<script type="application/ld+json">${jsonScript(data)}</script>`;
  html = scriptRe.test(html) ? html.replace(scriptRe, () => script) : html.replace("</head>", `${script}\n</head>`);
  write(rel, html);
}

function main() {
  for (const page of PAGES) {
    write(`web/public/${page.slug}.html`, pageHtml(page));
  }
  updateSrc();
  updateSitemap();
  updateFeedXml();
  updateFeedJson();
  updateLlms();
  updateResources();
  console.log(`Added ${PAGES.length} trust/distribution pages.`);
}

main();
