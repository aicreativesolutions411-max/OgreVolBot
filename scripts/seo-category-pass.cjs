const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "web", "public");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;

const PAGES = [
  {
    slug: "top-solana-trading-platforms",
    priority: "0.84",
    title: "Top Solana Trading Platforms - Bots, Terminals, Scanners and Alerts",
    description: "A practical guide to top Solana trading platforms and what traders should compare: live pairs, Telegram bots, scans, charts, wallet controls, proof, PnL, and launch tools.",
    h1: "Top Solana trading platforms",
    intro: "Traders looking for a Solana trading platform usually need more than one button. They need live market discovery, token research, chart context, wallet state, proof, and a Telegram workflow that can move fast without hiding risk.",
    cards: [
      ["Live market discovery", "A useful platform should show fresh pairs, market cap, liquidity, recent movement, and chart handoff without forcing users to jump between too many tools."],
      ["Telegram plus web", "The strongest workflow lets Telegram groups scan and share quickly, then opens a deeper web terminal for charts, positions, PnL, and settings."],
      ["Risk context", "Token scanners, visible warnings, liquidity context, and user-safe wallet prompts help traders make decisions without pretending any trade is guaranteed."],
      ["Proof and receipts", "Receipts, call tracking, proof links, and PnL context make a platform easier to evaluate than a tool that only shows hype."],
      ["Launch support", "Launch teams need alerts, raid cards, chart links, scans, and community handoff so the trading flow stays connected."],
      ["SlimeWire fit", "SlimeWire combines a Solana terminal, @SlimeWiredBot, scanner pages, proof pages, and launch tools in one crawlable stack."]
    ],
    faqs: [
      ["What should a top Solana trading platform include?", "It should include live pairs, chart access, token scans, wallet state, positions, PnL, alerts, Telegram support, and clear risk notes."],
      ["Is SlimeWire a Solana trading platform?", "Yes. SlimeWire is a Solana memecoin trading terminal plus a Telegram bot workflow for scans, alerts, charts, wallets, proof, and launch tools."],
      ["Does a trading platform remove memecoin risk?", "No. Software can improve context and speed, but Solana memecoin trading is risky and users remain responsible for wallet actions."],
      ["Where should a new SlimeWire user start?", "Start with the terminal at slimewire.org, then add @SlimeWiredBot if you want Telegram scans, group alerts, or launch workflows."]
    ],
    related: ["solana-trading-terminal", "best-solana-trading-bots", "features", "trust"]
  },
  {
    slug: "top-solana-telegram-bots",
    priority: "0.84",
    title: "Top Solana Telegram Bots - Scans, Alerts, Buy Flow and Group Tools",
    description: "Compare top Solana Telegram bots by token scans, group alerts, chart links, wallet handoff, quick buy flows, receipts, proof, and launch visibility.",
    h1: "Top Solana Telegram bots",
    intro: "A strong Solana Telegram bot should turn chat into useful trading context, not just spam buttons. The best setups scan contract addresses, post clean alerts, link charts, hand off to wallets, and keep group workflows understandable.",
    cards: [
      ["CA scanning", "A Telegram bot should recognize Solana contract addresses, return token context, and give users a clean next step."],
      ["Group alerts", "Communities need configurable alerts, launch cards, proof links, and signal hygiene so chat stays useful."],
      ["Chart handoff", "Fast Telegram scans are strongest when they link to a web terminal with Dex charts, transactions, and trade controls."],
      ["Wallet boundaries", "Bots should never ask for seed phrases and should make wallet actions explicit through the user's chosen flow."],
      ["Proof context", "Call tracking, receipts, and PnL context help groups judge outcomes instead of relying only on claims."],
      ["SlimeWire fit", "@SlimeWiredBot connects Telegram scans, alerts, group tools, proof, and SlimeWire terminal handoff."]
    ],
    faqs: [
      ["What makes a Solana Telegram bot useful?", "Useful Solana Telegram bots scan tokens, post clear alerts, link charts, support group workflows, and keep wallet actions explicit."],
      ["Can @SlimeWiredBot be added to groups?", "Yes. @SlimeWiredBot is built for Telegram group workflows such as scans, alerts, launch context, proof cards, and terminal handoff."],
      ["Should Telegram bots guarantee profitable trades?", "No. A legitimate bot should provide context and workflow speed without guaranteeing profit or hiding trading risk."],
      ["How does SlimeWire connect Telegram and web?", "Telegram scans and alerts can send users to SlimeWire pages for deeper charts, token review, positions, PnL, and launch workflows."]
    ],
    related: ["solana-telegram-bot", "telegram-bot-commands", "solana-trading-bot-for-groups", "telegram-token-scanner"]
  },
  {
    slug: "top-solana-terminals",
    priority: "0.84",
    title: "Top Solana Terminals - Live Pairs, Dex Charts, Wallets and PnL",
    description: "A guide to top Solana terminals for live pairs, Dex chart review, token scans, wallet state, positions, PnL, alerts, and Telegram trading workflows.",
    h1: "Top Solana terminals",
    intro: "A terminal should feel like a trader's command center: live pairs, charts, transactions, wallet state, exits, alerts, and proof in one place. The more context it keeps together, the less time users waste switching tabs.",
    cards: [
      ["Live pair boards", "Fresh markets move quickly, so a terminal needs clear filters, stable refreshes, and readable token cards."],
      ["Chart and txns", "Dex chart and transaction views help users inspect flow before acting."],
      ["Wallet and positions", "Balances, positions, sell controls, PnL, and refresh status should come from a consistent source of truth."],
      ["Presets and exits", "Amount, slippage, take-profit, stop-loss, and timer settings should be visible enough to review before action."],
      ["Telegram companion", "A terminal gets stronger when Telegram can feed scans, alerts, and group activity into it."],
      ["SlimeWire fit", "SlimeWire is built as a Solana memecoin terminal with Telegram, proof, launch, scanner, and wallet workflows around it."]
    ],
    faqs: [
      ["What is a Solana trading terminal?", "A Solana trading terminal is a web interface for live pairs, charts, transactions, wallet context, positions, alerts, and trade workflows."],
      ["How is a terminal different from a Telegram bot?", "A Telegram bot is fast inside chat, while a terminal gives a bigger workspace for charts, token review, wallet state, and PnL."],
      ["Does SlimeWire include a terminal?", "Yes. SlimeWire's main site is the live terminal, and @SlimeWiredBot is the Telegram companion."],
      ["Can a terminal make trades risk-free?", "No. Terminals organize data and controls, but users still need to understand market, liquidity, wallet, and memecoin risk."]
    ],
    related: ["solana-trading-terminal", "solana-memecoin-terminal", "solana-dex-chart", "data-freshness"]
  },
  {
    slug: "solana-trading-platform",
    priority: "0.82",
    title: "Solana Trading Platform - Terminal, Telegram Bot, Scans and PnL",
    description: "SlimeWire is a Solana trading platform for memecoin workflows: live pairs, Telegram scans, Dex charts, wallet context, alerts, positions, PnL, proof, and launch tools.",
    h1: "Solana trading platform for fast markets",
    intro: "Solana traders often use a scanner, a chart site, a Telegram bot, a wallet, and a PnL tracker separately. SlimeWire's goal is to bring those workflows closer together without hiding the risk of fast memecoin markets.",
    cards: [
      ["Terminal first", "Open live pairs, charts, transactions, wallet state, positions, and trade context from the web terminal."],
      ["Telegram connected", "Use @SlimeWiredBot for scans, alerts, group workflows, proof links, and launch updates."],
      ["Research flow", "Review token context, market data, liquidity, chart behavior, links, and risk notes before acting."],
      ["Trade review", "Keep presets, wallet state, receipts, and PnL context visible so actions feel traceable."],
      ["Launch flow", "Launch pages, raid cards, Telegram alerts, and proof links help creators route attention back into the terminal."],
      ["Crawlable docs", "Public pages explain the product clearly for users, directories, search engines, and AI answer systems."]
    ],
    faqs: [
      ["What does SlimeWire include as a Solana trading platform?", "It includes a web terminal, Telegram bot workflows, token scans, live pair discovery, charts, wallet context, positions, PnL, proof pages, and launch tools."],
      ["Is SlimeWire only a bot?", "No. SlimeWire is both a web terminal and a Telegram bot workflow."],
      ["Can users browse without a wallet?", "Users can browse public pages and terminal context, while wallet-specific actions require the appropriate wallet flow."],
      ["Does SlimeWire provide financial advice?", "No. SlimeWire provides trading software and information context, not financial advice."]
    ],
    related: ["features", "how-it-works", "security", "risk-disclosure"]
  },
  {
    slug: "solana-memecoin-trading-platform",
    priority: "0.84",
    title: "Solana Memecoin Trading Platform - Fresh Pairs, Telegram and Proof",
    description: "SlimeWire is a Solana memecoin trading platform for fresh pairs, pump.fun style launches, token scans, Dex charts, Telegram alerts, wallet context, proof, and PnL.",
    h1: "Solana memecoin trading platform",
    intro: "Memecoin traders need speed, but speed without context gets messy. SlimeWire focuses on fresh pairs, token scans, chart handoff, Telegram workflows, wallet context, and proof so users can move quickly while still seeing the basics.",
    cards: [
      ["Fresh pairs", "Track new Solana markets, launch alerts, and scanner context from a terminal-style workflow."],
      ["Token research", "Look at market cap, liquidity, chart behavior, transaction flow, links, and warnings where available."],
      ["Telegram groups", "Bring scans, alerts, group calls, proof links, and launch updates into Telegram through @SlimeWiredBot."],
      ["Positions and PnL", "Review wallet positions, realized PnL, receipts, and proof context after trades."],
      ["Launch visibility", "Creators can use launch pages, Telegram cards, proof, and terminal handoff to route attention."],
      ["Risk clarity", "SlimeWire pages avoid profit guarantees and keep memecoin risk visible."]
    ],
    faqs: [
      ["What is a Solana memecoin trading platform?", "It is a toolset for discovering, researching, tracking, and managing fast Solana memecoin markets."],
      ["Why do memecoin traders use Telegram?", "Telegram is where many Solana communities coordinate scans, calls, alerts, launches, and updates."],
      ["How does SlimeWire support memecoin launches?", "SlimeWire supports launch pages, alerts, raid cards, scans, proof links, and trader handoff into the terminal."],
      ["Can SlimeWire prevent losses?", "No. SlimeWire can organize data and workflow, but memecoin trading can still lose money quickly."]
    ],
    related: ["solana-memecoin-tools", "solana-memecoin-screener", "pump-fun-launch-alerts", "proof-of-calls"]
  },
  {
    slug: "pump-fun-terminal",
    priority: "0.82",
    title: "pump.fun Terminal - Fresh Launch Scanner, Charts, Alerts and Presets",
    description: "Use SlimeWire as a pump.fun terminal workflow for fresh launch scanning, chart handoff, Telegram alerts, token context, presets, proof, and PnL review.",
    h1: "pump.fun terminal workflow",
    intro: "Fresh launch traders need a fast route from discovery to chart review to wallet action. SlimeWire organizes pump.fun-style scanning, alerts, chart handoff, token context, and proof pages around the web terminal and Telegram bot.",
    cards: [
      ["Fresh launch focus", "Track new launch-style pairs with market context and quick links back into SlimeWire."],
      ["Chart handoff", "Open selected tokens into a chart and transaction workflow for better review."],
      ["Telegram alerts", "Bring launch alerts and token scans into Telegram groups through @SlimeWiredBot."],
      ["Preset review", "Use visible amount, slippage, TP/SL, and timer context where trade workflows are available."],
      ["Proof links", "Connect calls, receipts, and outcomes so launch interest can be evaluated later."],
      ["Risk notes", "Fresh launches are volatile, so the page keeps risk language plain instead of promising easy wins."]
    ],
    faqs: [
      ["What is a pump.fun terminal?", "It is a workflow for fresh launch discovery, token review, chart handoff, alerts, and trade context around pump.fun-style Solana markets."],
      ["Does SlimeWire replace pump.fun?", "No. SlimeWire is a trading and discovery workflow around Solana launch markets, charts, Telegram alerts, and proof pages."],
      ["Can Telegram groups use this workflow?", "Yes. @SlimeWiredBot can help groups scan tokens, share alerts, and move users into SlimeWire pages."],
      ["Are fresh launches safe?", "No. Fresh launches can be extremely volatile and risky, so users should review liquidity, chart behavior, wallet prompts, and position size."]
    ],
    related: ["pump-fun-bot", "pump-fun-scanner", "pump-fun-trading-bot", "pump-fun-launch-alerts"]
  },
  {
    slug: "pump-fun-launch-platform",
    priority: "0.82",
    title: "pump.fun Launch Platform Workflow - Alerts, Raids, Proof and Trader Handoff",
    description: "SlimeWire gives launch teams a pump.fun launch platform workflow with Telegram alerts, raid cards, token scans, chart links, proof pages, and terminal handoff.",
    h1: "pump.fun launch platform workflow",
    intro: "Launch teams need more than a link. They need a path from announcement to Telegram attention to chart review to proof. SlimeWire helps package launch visibility with alerts, raid cards, token scans, proof links, and terminal handoff.",
    cards: [
      ["Announcement flow", "Route users from launch context into clean pages, Telegram alerts, and the terminal."],
      ["Community cards", "Raid and alert cards can give groups a cleaner way to coordinate launch attention."],
      ["Scanner handoff", "Token scans and chart links help traders inspect the launch instead of relying only on copy."],
      ["Proof trail", "Calls, receipts, and proof pages make launch activity easier to revisit."],
      ["Bot plus site", "Launch workflows work best when Telegram and the web terminal reinforce each other."],
      ["Practical guardrails", "Launch pages should set expectations and avoid claiming risk-free outcomes."]
    ],
    faqs: [
      ["Why launch through a SlimeWire workflow?", "SlimeWire can connect launch visibility, Telegram alerts, raid cards, token scans, chart links, proof, and terminal handoff."],
      ["Is this a guarantee of volume or price action?", "No. It is a visibility and workflow tool, not a promise of market results."],
      ["Can launch teams use Telegram?", "Yes. Telegram is a core SlimeWire path for alerts, scans, raid cards, and group updates."],
      ["Where should launch teams start?", "Start with the Launch on SlimeWire guide, then use the terminal and @SlimeWiredBot links for handoff."]
    ],
    related: ["launch-on-slimewire-guide", "solana-launch-bot", "memecoin-launch-tools", "telegram-raid-bot"]
  },
  {
    slug: "solana-token-research-tool",
    priority: "0.8",
    title: "Solana Token Research Tool - Scanner, Dex Chart, Alerts and Risk Context",
    description: "Use SlimeWire as a Solana token research tool for contract scans, market cap, liquidity, Dex charts, transaction flow, Telegram alerts, wallet context, and risk notes.",
    h1: "Solana token research tool",
    intro: "Before acting on a Solana token, traders usually want the same basics: what is it, how new is it, where is the chart, what does liquidity look like, are there visible warnings, and what is the next safe workflow step.",
    cards: [
      ["Contract scan", "Paste a Solana contract address and move toward token context, chart links, and alerts."],
      ["Market basics", "Market cap, liquidity, age, volume, and chart behavior help users understand the visible setup."],
      ["Risk notes", "Authority notes, liquidity context, token warnings, and metadata gaps are useful signals, not guarantees."],
      ["Chart review", "Dex chart and transaction views help traders inspect flow before using a wallet."],
      ["Telegram context", "Groups can use @SlimeWiredBot to scan and share token context directly in chat."],
      ["Follow-through", "Watchlists, alerts, positions, PnL, and proof pages connect research to later review."]
    ],
    faqs: [
      ["What should a Solana token research tool show?", "It should show token identity, market basics, liquidity, chart links, transaction context, risk notes, and workflow links."],
      ["Is a token scanner the same as a guarantee?", "No. A scanner can surface useful information, but it cannot guarantee a token is safe or profitable."],
      ["Can SlimeWire scan tokens in Telegram?", "Yes. @SlimeWiredBot supports Telegram token scanning workflows and can hand users to SlimeWire pages."],
      ["How does research connect to trading?", "SlimeWire connects research pages to charts, wallet context, alerts, positions, proof, and PnL review."]
    ],
    related: ["solana-token-scanner", "solana-rug-checker", "solana-dex-chart", "solana-token-alerts"]
  },
  {
    slug: "solana-crypto-terminal",
    priority: "0.8",
    title: "Solana Crypto Terminal - Live Pairs, Token Scans, Telegram and Wallet Context",
    description: "SlimeWire is a Solana crypto terminal workflow for live pairs, token scans, Dex charts, Telegram alerts, wallet state, positions, PnL, proof, and launch tools.",
    h1: "Solana crypto terminal",
    intro: "A crypto terminal for Solana should help users move from discovery to research to wallet-aware review. SlimeWire keeps live pairs, scans, charts, alerts, positions, PnL, proof, and launch context connected.",
    cards: [
      ["Discovery", "Use live pair pages and scanners to find what is moving."],
      ["Research", "Open token context, charts, links, transaction flow, and risk notes."],
      ["Telegram", "Use @SlimeWiredBot for chat-native scans, alerts, and group tools."],
      ["Wallet context", "Review wallet state, positions, exits, and PnL in the terminal flow."],
      ["Launch visibility", "Connect launches to Telegram cards, scans, proof, and terminal handoff."],
      ["Public resources", "Indexable pages explain the product so users and search engines understand the stack."]
    ],
    faqs: [
      ["What is a Solana crypto terminal?", "It is a web workflow for live Solana markets, token research, charts, alerts, wallets, positions, and trading context."],
      ["Does SlimeWire include Telegram workflows?", "Yes. SlimeWire includes @SlimeWiredBot for Telegram scans, alerts, group tools, and handoff to the terminal."],
      ["Can users research without connecting a wallet?", "Public pages and token context can be viewed without a wallet, while wallet-specific actions require the user's wallet flow."],
      ["Does SlimeWire promise returns?", "No. It provides software and context, not financial advice or guaranteed outcomes."]
    ],
    related: ["solana-trading-terminal", "solana-memecoin-terminal", "resources", "support"]
  },
  {
    slug: "telegram-crypto-trading-bot",
    priority: "0.82",
    title: "Telegram Crypto Trading Bot - Solana Scans, Alerts, Groups and Terminal Handoff",
    description: "SlimeWire's Telegram crypto trading bot workflow helps Solana users scan tokens, share alerts, manage group context, open charts, review proof, and hand off to the web terminal.",
    h1: "Telegram crypto trading bot for Solana",
    intro: "A Telegram crypto trading bot should make chat more useful: scan tokens, post cleaner alerts, organize group workflows, and send users to a deeper chart and wallet-aware terminal when needed.",
    cards: [
      ["Scan in chat", "Token scans can turn a pasted contract address into context and a next step."],
      ["Alert flow", "Group alerts, launch updates, watchlists, and proof links help organize the feed."],
      ["Terminal handoff", "Telegram is fast, while the web terminal gives more space for charts, txns, wallet state, and PnL."],
      ["Group utility", "A useful bot supports communities, callers, and launch teams without turning every thread into clutter."],
      ["User-safe wording", "A legitimate bot keeps risk visible and does not pretend every signal is a certain win."],
      ["SlimeWire fit", "@SlimeWiredBot is the Telegram layer for SlimeWire's Solana terminal and public resource stack."]
    ],
    faqs: [
      ["What can a Telegram crypto trading bot do?", "It can scan tokens, post alerts, link charts, organize group workflows, and hand users to a web terminal for deeper review."],
      ["Is @SlimeWiredBot focused on Solana?", "Yes. @SlimeWiredBot is built around SlimeWire's Solana terminal, token scans, alerts, launch flows, and trading context."],
      ["Does Telegram replace wallet approvals?", "No. Wallet actions still depend on the user's wallet or selected SlimeWire wallet flow."],
      ["Why combine Telegram with a web terminal?", "Telegram is best for speed and groups, while the web terminal is better for charts, transactions, wallet state, positions, and PnL."]
    ],
    related: ["solana-telegram-bot", "best-telegram-crypto-bots", "telegram-crypto-alerts", "telegram-bot-setup"]
  }
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text);
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
    if (part === "nft") return "NFT";
    if (part === "pnl") return "PnL";
    if (part === "dex") return "Dex";
    if (part === "ai") return "AI";
    if (part === "solana") return "Solana";
    if (part === "telegram") return "Telegram";
    if (part === "pump") return "pump.fun";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ").replace("pump.fun Fun", "pump.fun");
}

function relatedLinks(page) {
  const links = (page.related || []).concat(["resources", "solana-telegram-bot"]);
  return [...new Set(links)].map((slug) => `<a href="/${slug}">${esc(labelFromSlug(slug))}</a>`).join(" &middot; ");
}

function pageHtml(page) {
  const url = `${HOST}/${page.slug}`;
  const faq = page.faqs.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a }
  }));
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        url,
        description: page.description,
        isPartOf: { "@type": "WebSite", name: "SlimeWire", url: HOST },
        about: [
          { "@type": "Thing", name: "Solana trading" },
          { "@type": "Thing", name: "Telegram trading bot" },
          { "@type": "Thing", name: "Memecoin trading terminal" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        name: "SlimeWire",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Telegram",
        url: HOST,
        description: "SlimeWire is a Solana memecoin terminal and Telegram trading bot for live pairs, token scans, charts, wallet context, alerts, proof, PnL, and launch tools.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: HOST },
          { "@type": "ListItem", position: 2, name: "Resources", item: `${HOST}/resources` },
          { "@type": "ListItem", position: 3, name: page.h1, item: url }
        ]
      },
      { "@type": "FAQPage", mainEntity: faq }
    ]
  };
  const cards = page.cards.map(([h, p]) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("");
  const faqs = page.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
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
<script type="application/ld+json">${jsonScript(structured)}</script>
<style>:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--text:#e9ffe0;--border:rgba(114,255,35,.16)}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.55}a{color:#bbff63;text-decoration:none}.wrap{max-width:1080px;margin:auto;padding:0 20px}.btn{display:inline-block;padding:12px 18px;border-radius:12px;font-weight:800;border:1px solid var(--border)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}header{padding:66px 0 38px;text-align:center;background:radial-gradient(900px 360px at 50% -10%,rgba(114,255,35,.14),transparent)}h1{font-size:clamp(31px,6vw,52px);line-height:1.06;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:820px;margin:0 auto 24px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}section{padding:38px 0;border-top:1px solid rgba(114,255,35,.08)}h2{font-size:clamp(22px,4vw,32px);margin:0 0 12px}.lead{color:var(--muted);max-width:820px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px}.card,details{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px;font-size:17px}.card p,details p{margin:0;color:var(--muted);font-size:14px}summary{cursor:pointer;font-weight:800;padding:6px 0}.links{color:var(--muted);font-size:14px}.links a{font-weight:800}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:560px){.wrap{padding:0 14px}.btn{width:100%;text-align:center}}</style>
</head>
<body>
<header><div class="wrap"><h1><span>SlimeWire</span> ${esc(page.h1)}</h1><p class="sub">${esc(page.intro)}</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="https://t.me/SlimeWiredBot" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a></div></div></header>
<section><div class="wrap"><h2>Why this matters</h2><p class="lead">${esc(page.description)}</p><div class="grid">${cards}</div></div></section>
<section><div class="wrap"><h2>Related SlimeWire pages</h2><p class="links">${relatedLinks(page)}</p></div></section>
<section><div class="wrap"><h2>FAQ</h2>${faqs}</div></section>
<footer><div class="wrap"><a href="/">Home</a> &middot; <a href="/resources">Resources</a> &middot; <a href="/features">Features</a> &middot; <a href="/trust">Trust</a> &middot; <a href="/solana-telegram-bot">Telegram bot</a> &middot; <a href="https://t.me/SlimeWiredBot" target="_blank" rel="noopener noreferrer">@SlimeWiredBot</a></div></footer>
</body>
</html>
`;
}

function addAfter(text, marker, insertion) {
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${marker}${insertion}`);
}

function addBefore(text, marker, insertion) {
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${insertion}${marker}`);
}

function updateSrc() {
  let src = read("src/index.js");
  const seoEntries = PAGES
    .filter((p) => !src.includes(`{ path: "/${p.slug}"`))
    .map((p) => `  { path: "/${p.slug}", priority: "${p.priority}", changefreq: "weekly" },\n`)
    .join("");
  if (seoEntries) src = addBefore(src, '  { path: "/features", priority: "0.84", changefreq: "monthly" },', seoEntries);

  const metaEntries = PAGES
    .filter((p) => !src.includes(`"/${p.slug}": {`))
    .map((p) => `  "/${p.slug}": {\n    title: ${JSON.stringify(p.title)},\n    description: ${JSON.stringify(p.description)}\n  },\n`)
    .join("");
  if (metaEntries) src = addBefore(src, '  "/features": {', metaEntries);

  const routeEntries = PAGES
    .filter((p) => !src.includes(`requestUrl.pathname === "/${p.slug}"`))
    .map((p) => `    if (request.method === "GET" && requestUrl.pathname === "/${p.slug}") {\n      await serveStaticHtmlPage(response, "${p.slug}.html");\n      return;\n    }\n`)
    .join("");
  if (routeEntries) src = addBefore(src, '    if (request.method === "GET" && requestUrl.pathname === "/features") {', routeEntries);
  write("src/index.js", src);
}

function updateSitemap() {
  let sitemap = read("web/public/sitemap.xml");
  const entries = PAGES
    .filter((p) => !sitemap.includes(`${HOST}/${p.slug}`))
    .map((p) => `  <url><loc>${HOST}/${p.slug}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>\n`)
    .join("");
  if (entries) sitemap = addBefore(sitemap, `  <url><loc>${HOST}/features</loc>`, entries);
  write("web/public/sitemap.xml", sitemap);
}

function updateFeedXml() {
  let feed = read("web/public/feed.xml");
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
  if (entries) feed = addBefore(feed, "</channel>", entries);
  write("web/public/feed.xml", feed);
}

function updateFeedJson() {
  const feedPath = "web/public/feed.json";
  const feed = JSON.parse(read(feedPath));
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
    const insertAt = Math.max(0, (feed.items || []).findIndex((item) => item.url === `${HOST}/features`));
    if (insertAt > -1) feed.items.splice(insertAt, 0, ...newItems);
    else feed.items.push(...newItems);
  }
  write(feedPath, JSON.stringify(feed, null, 2) + "\n");
}

function updateLlms() {
  let txt = read("web/public/llms.txt");
  const entries = PAGES
    .filter((p) => !txt.includes(`${HOST}/${p.slug}`))
    .map((p) => `- ${labelFromSlug(p.slug)}: ${HOST}/${p.slug}\n`)
    .join("");
  if (entries) {
    const marker = `- Top Solana trading sites: ${HOST}/top-solana-trading-sites`;
    if (!txt.includes(marker)) throw new Error(`Missing marker: ${marker}`);
    txt = txt.replace(marker, `${marker}\n${entries.trimEnd()}`);
  }
  write("web/public/llms.txt", txt);
}

function updateResources() {
  const rel = "web/public/resources.html";
  let html = read(rel);

  const scriptRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match = html.match(scriptRe);
  if (!match) throw new Error("resources JSON-LD not found");
  const data = JSON.parse(match[1]);
  const collection = data["@graph"].find((node) => node["@type"] === "CollectionPage");
  const hasPart = collection.hasPart || [];
  const existing = new Set(hasPart.map((part) => part.url));
  for (const page of PAGES) {
    const url = `${HOST}/${page.slug}`;
    if (!existing.has(url)) hasPart.push({ "@type": "WebPage", name: labelFromSlug(page.slug), url });
  }
  collection.hasPart = hasPart;
  html = html.replace(scriptRe, `<script type="application/ld+json">${jsonScript(data)}</script>`);

  if (!html.includes("<h2>Category authority pages</h2>")) {
    const cards = PAGES.map((p) => `<div class="card"><h3><a href="/${p.slug}">${esc(labelFromSlug(p.slug))}</a></h3><p>${esc(p.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>Category authority pages</h2><div class="grid">${cards}</div></div></section>\n`;
    html = addBefore(html, '<section><div class="wrap"><h2>Trading discovery pages</h2>', section);
  }
  write(rel, html);
}

function main() {
  for (const page of PAGES) {
    fs.writeFileSync(path.join(PUBLIC_DIR, `${page.slug}.html`), pageHtml(page));
  }
  updateSrc();
  updateSitemap();
  updateFeedXml();
  updateFeedJson();
  updateLlms();
  updateResources();
  console.log(`Added ${PAGES.length} SEO category pages.`);
}

main();
