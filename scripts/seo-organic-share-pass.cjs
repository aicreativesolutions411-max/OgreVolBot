const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "web", "public");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;
const BOT_URL = "https://t.me/SlimeWiredBot";
const ADD_GROUP_URL = "https://t.me/SlimeWiredBot?startgroup=community_kit";

const PAGES = [
  {
    slug: "add-slimewire-bot-to-telegram-group",
    priority: "0.83",
    title: "Add SlimeWire Bot to Telegram Group - Solana Scans, Raids and Buy Alerts",
    description: "Add @SlimeWiredBot to a Telegram group for Solana token scans, buy alerts, raid cards, launch context, proof links, and terminal handoff.",
    h1: "Add SlimeWire Bot to a Telegram group",
    intro: "This is the lowest-friction organic growth loop: every real group that adds @SlimeWiredBot can create new SlimeWire users without ads. The page gives admins a clean setup path, clear safety notes, and share-ready links.",
    ctas: [
      ["Add bot to group", ADD_GROUP_URL, true],
      ["Open @SlimeWiredBot", BOT_URL, true],
      ["Open terminal", "/", false]
    ],
    cards: [
      ["Group scans", "Drop a contract address and route users to token context, charts, proof, and SlimeWire terminal pages."],
      ["Buy alerts", "Use Telegram-native alerts to keep a launch room or trading group aware of live activity."],
      ["Raid cards", "Turn community attention into a trackable action loop instead of scattered messages."],
      ["Proof links", "Send users to public proof and resource pages so SlimeWire looks verifiable, not just loud."],
      ["Terminal handoff", "Telegram moves fast; the website holds charts, positions, PnL, widgets, and deeper context."],
      ["No seed phrases", "The bot should never ask for seed phrases. Wallet approvals stay with the user and wallet flow."]
    ],
    extra: groupSetupExtra(),
    faqs: [
      ["How do I add SlimeWire Bot to a Telegram group?", "Open the add-to-group link, choose the group, approve Telegram's bot invite flow, then use SlimeWire commands or group setup options inside the chat."],
      ["What can @SlimeWiredBot do in a crypto group?", "@SlimeWiredBot supports SlimeWire workflows such as Solana token scans, buy alerts, raid cards, launch context, proof links, and handoff to the SlimeWire terminal."],
      ["Does the bot need admin permissions?", "Some group features may need admin permissions, but basic bot access should stay limited to the features the group wants to use."],
      ["Will the bot ask for my seed phrase?", "No. A legitimate SlimeWire flow should never ask for a seed phrase or private key in Telegram."],
      ["Why is this good for organic growth?", "Each group that adds @SlimeWiredBot becomes a live discovery surface where users can see SlimeWire scans, proof, charts, and launch workflows."]
    ]
  },
  {
    slug: "slimewire-community-kit",
    priority: "0.8",
    title: "SlimeWire Community Kit - Telegram Pins, X Posts, Widgets and Share Links",
    description: "Copy SlimeWire Telegram pinned posts, X posts, group admin DMs, widget links, bot start links, and proof links for organic community growth.",
    h1: "Community kit for organic SlimeWire traffic",
    intro: "When paid ad platforms are annoying, the answer is repeatable organic material. This kit gives group admins, callers, launch teams, and holders ready-to-use SlimeWire posts that route people to the bot and terminal.",
    ctas: [
      ["Open share links", "/share", false],
      ["Use widgets", "/widgets", false],
      ["Open @SlimeWiredBot", BOT_URL, true]
    ],
    cards: [
      ["Pinned post copy", "A clean group post that explains SlimeWire without sounding like a fake ad."],
      ["X post copy", "Short copy for posts, quote tweets, and reply threads around Solana tools."],
      ["Admin DM copy", "A direct message template for asking real groups to test SlimeWire."],
      ["Bot start links", "Track organic sources with simple Telegram start payloads."],
      ["Widget links", "Give launch teams embeddable SlimeWire badges for backlinks and trust."],
      ["Proof-first funnel", "Send cold users to proof, resources, setup, or the bot instead of only the homepage."]
    ],
    extra: communityKitExtra(),
    faqs: [
      ["What is the SlimeWire community kit?", "It is a collection of share-ready SlimeWire posts, Telegram bot links, widget links, and proof links that communities can reuse."],
      ["Can a Telegram group pin this copy?", "Yes. The page includes simple pinned post copy that routes users to @SlimeWiredBot and slimewire.org."],
      ["Can launch teams use these links?", "Yes. Launch teams can use the widget and proof links to send users into SlimeWire launch, scan, chart, and bot workflows."],
      ["Does this replace paid ads?", "No, but it creates free organic loops that should exist before spending money on ads."],
      ["Should posts promise wins?", "No. Posts should focus on tools, scans, alerts, proof, and speed, not guaranteed profit."]
    ]
  },
  {
    slug: "slimewire-launch-promo-kit",
    priority: "0.82",
    title: "SlimeWire Launch Promo Kit - Solana Launch Visibility, Raids, Widgets and Proof",
    description: "A Solana launch promo kit for teams that want SlimeWire visibility, Telegram bot alerts, raid cards, widgets, proof links, charts, and launch handoff.",
    h1: "Launch promo kit for Solana teams",
    intro: "Launch teams need more than a chart link. SlimeWire can become a launch surface: Telegram alerts, raid cards, token scan context, proof links, widgets, and terminal handoff all pointing users back to the same campaign.",
    ctas: [
      ["Launch guide", "/launch-on-slimewire-guide", false],
      ["Widgets", "/widgets", false],
      ["Open @SlimeWiredBot", BOT_URL, true]
    ],
    cards: [
      ["Before launch", "Prepare scan links, group bot setup, pinned posts, and widget embeds before the token is live."],
      ["At launch", "Route traffic into token context, chart view, proof links, and Telegram alerts."],
      ["After launch", "Keep attention alive with proof cards, raid recaps, buy alerts, and community posts."],
      ["Group handoff", "Let Telegram users move from chat hype to chart context without losing the SlimeWire path."],
      ["Embeds", "Use SlimeWire badges on token pages, link-in-bio pages, and community landing pages."],
      ["Trust posture", "Make risk notes and proof visible so the campaign looks cleaner than pure hype."]
    ],
    extra: launchKitExtra(),
    faqs: [
      ["Why would a Solana team launch with SlimeWire?", "SlimeWire can give launch teams a combined surface for Telegram alerts, raid cards, scan context, widgets, proof links, and web terminal handoff."],
      ["Does SlimeWire replace pump.fun or a DEX?", "No. SlimeWire is a discovery, bot, chart, group, and terminal layer around the launch workflow."],
      ["What should teams prepare first?", "Teams should prepare a pinned Telegram post, token scan link, widget embed, proof route, launch guide link, and bot group setup."],
      ["Can this help organic discovery?", "Yes. Launch teams that link SlimeWire pages and widgets create useful backlinks and traffic loops."],
      ["Should a launch page promise profit?", "No. It should explain tooling, visibility, scan context, and risk instead of promising returns."]
    ]
  },
  {
    slug: "solana-memecoin-launch-checklist",
    priority: "0.78",
    title: "Solana Memecoin Launch Checklist - Telegram Bot, Scans, Proof and Launch Tools",
    description: "A practical Solana memecoin launch checklist covering Telegram setup, token scans, launch links, proof pages, widgets, risk notes, and SlimeWire handoff.",
    h1: "Solana memecoin launch checklist",
    intro: "A launch with scattered links loses attention. This checklist keeps the launch room, chart, scan, proof, bot, and SlimeWire terminal path connected so users can understand the project faster.",
    ctas: [
      ["Open launch guide", "/launch-on-slimewire-guide", false],
      ["Add bot to group", ADD_GROUP_URL, true],
      ["Open widgets", "/widgets", false]
    ],
    cards: [
      ["Telegram room", "Pin the contract, chart, bot, and risk note before the first wave of users arrive."],
      ["Scan path", "Give users a SlimeWire scan or chart route so they can inspect token context quickly."],
      ["Proof trail", "Collect public proof links, raid recaps, and result pages as the launch unfolds."],
      ["Widget embed", "Place a SlimeWire badge on any website, link hub, or campaign page."],
      ["Admin commands", "Make sure group admins know which bot commands and modules are active."],
      ["Post-launch loop", "After launch, keep updates flowing with alerts, proof links, and terminal handoff."]
    ],
    extra: checklistExtra(),
    faqs: [
      ["What should be ready before a Solana memecoin launch?", "Teams should prepare Telegram pins, token scan links, chart links, bot setup, proof pages, widgets, and risk notes before launch traffic arrives."],
      ["Where does SlimeWire fit in a launch?", "SlimeWire connects Telegram bot workflows, token scans, proof, widgets, charts, and terminal context."],
      ["Can this checklist help a launch get more attention?", "It can help by reducing confusion, improving share links, and creating more crawlable and shareable launch context."],
      ["Does this make a token safe?", "No. It improves organization and context, but token risk remains separate and users must review before trading."],
      ["Is this only for pump.fun launches?", "No. The checklist can support Solana memecoin launches across common Solana launch and trading workflows."]
    ]
  },
  {
    slug: "crypto-telegram-growth-playbook",
    priority: "0.76",
    title: "Crypto Telegram Growth Playbook - Bots, Pins, Proof, Raids and Group Tools",
    description: "A practical crypto Telegram growth playbook for groups using bots, pinned posts, proof links, raid workflows, buy alerts, scans, and SlimeWire handoff.",
    h1: "Crypto Telegram growth playbook",
    intro: "A group grows when new users instantly understand what is happening. SlimeWire's best organic angle is to make every group post useful: scan, alert, proof, chart, raid, or terminal link.",
    ctas: [
      ["Add bot to group", ADD_GROUP_URL, true],
      ["Community kit", "/slimewire-community-kit", false],
      ["Proof feed", "/proof-feed", false]
    ],
    cards: [
      ["Pin the path", "Keep one pinned post that explains the bot, terminal, proof, and risk notes."],
      ["Show receipts", "Use proof links and result pages so visitors can judge the tool quickly."],
      ["Use scans", "Token scans are useful content, not just promotion. They keep traders returning."],
      ["Avoid spam", "Do not blast low-quality groups. Useful posts in real rooms compound better."],
      ["Track links", "Use different bot start payloads for groups, X posts, launch pages, and partners."],
      ["Repeat weekly", "Refresh the pinned post, proof links, and demo posts without changing the core message."]
    ],
    extra: growthPlaybookExtra(),
    faqs: [
      ["How can a crypto Telegram group grow organically?", "A group grows organically by posting useful scans, proof, buy alerts, launch context, chart links, and clear pinned instructions instead of pure spam."],
      ["How does SlimeWire help Telegram groups?", "SlimeWire provides @SlimeWiredBot, terminal links, proof pages, widgets, raids, token scans, and launch context that groups can share."],
      ["Should groups buy fake members?", "No. Fake members do not become traders and can damage trust. SlimeWire should focus on real groups, useful posts, and proof."],
      ["What should a sponsored group post include?", "It should include a short product description, bot link, site link, proof or setup link, and a risk-aware message."],
      ["What is the best free first step?", "Add @SlimeWiredBot to a real group, pin the setup post, then share scan and proof links when they are useful."]
    ]
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
    const lower = part.toLowerCase();
    if (lower === "tg") return "TG";
    if (lower === "pnl") return "PnL";
    if (lower === "dex") return "Dex";
    if (lower === "ai") return "AI";
    if (lower === "x") return "X";
    if (lower === "seo") return "SEO";
    if (lower === "solana") return "Solana";
    if (lower === "telegram") return "Telegram";
    if (lower === "crypto") return "Crypto";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function footerLinks() {
  return [
    ["Home", "/"],
    ["Resources", "/resources"],
    ["Add Bot", "/add-slimewire-bot-to-telegram-group"],
    ["Community Kit", "/slimewire-community-kit"],
    ["Launch Promo Kit", "/slimewire-launch-promo-kit"],
    ["Widgets", "/widgets"],
    ["Proof Feed", "/proof-feed"],
    ["@SlimeWiredBot", BOT_URL]
  ].map(([label, href]) => {
    const external = href.startsWith("http");
    return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`;
  }).join(" &middot; ");
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
          { "@type": "Thing", name: "Solana Telegram bot" },
          { "@type": "Thing", name: "Crypto community growth" },
          { "@type": "Thing", name: "Solana memecoin launch tools" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        name: "SlimeWire",
        alternateName: ["SlimeWire Terminal", "@SlimeWiredBot"],
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Telegram",
        url: HOST,
        description: "SlimeWire combines a Solana memecoin terminal with @SlimeWiredBot for token scans, live pairs, charts, Telegram group tools, proof, PnL, launch workflows, and community growth loops.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: HOST },
          { "@type": "ListItem", position: 2, name: "Resources", item: `${HOST}/resources` },
          { "@type": "ListItem", position: 3, name: labelFromSlug(page.slug), item: url }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a }
        }))
      }
    ]
  };
}

function pageHtml(page) {
  const url = `${HOST}/${page.slug}`;
  const ctas = page.ctas.map(([label, href, external], index) => `<a class="btn ${index === 0 ? "primary" : ""}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`).join("");
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
<style>:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--panel2:#071109;--text:#e9ffe0;--border:rgba(114,255,35,.18)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(900px 360px at 50% -12%,rgba(114,255,35,.12),transparent),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.55}a{color:#bbff63;text-decoration:none}.wrap{max-width:1080px;margin:auto;padding:0 20px}.eyebrow{color:var(--green);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}header{padding:68px 0 38px;text-align:center}h1{font-size:clamp(32px,6vw,56px);line-height:1.05;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub,.lead{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:820px;margin:0 auto 24px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;border-radius:12px;font-weight:900;border:1px solid var(--border);background:rgba(114,255,35,.05)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}section{padding:38px 0;border-top:1px solid rgba(114,255,35,.08)}h2{font-size:clamp(22px,4vw,33px);margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.card,details,.copybox{background:linear-gradient(180deg,rgba(114,255,35,.045),transparent),var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px}.card p,details p,.muted{margin:0;color:var(--muted);font-size:14px}.steps{counter-reset:step;display:grid;gap:12px}.step{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:flex-start;background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:16px}.step:before{counter-increment:step;content:counter(step);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--green);color:#04120a;font-weight:900}.copygrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px}.copybox pre{white-space:pre-wrap;margin:10px 0 0;color:#e9ffe0;font:600 13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.table{display:grid;gap:10px}.row{display:grid;grid-template-columns:minmax(130px,.55fr) 1fr;gap:14px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:16px}summary{cursor:pointer;font-weight:900;padding:6px 0}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:640px){header{padding-top:46px}.row{grid-template-columns:1fr}.btn{width:100%;max-width:360px}.cta{align-items:center;flex-direction:column}}</style>
</head>
<body>
<header><div class="wrap"><p class="eyebrow">SlimeWire organic growth asset</p><h1><span>SlimeWire</span> ${esc(page.h1)}</h1><p class="sub">${esc(page.intro)}</p><div class="cta">${ctas}</div></div></header>
<section><div class="wrap"><h2>Why this brings real users</h2><div class="grid">${cards}</div></div></section>
${page.extra}
<section><div class="wrap"><h2>FAQ</h2>${faq}</div></section>
<footer><div class="wrap">${footerLinks()}</div></footer>
</body>
</html>
`;
}

function groupSetupExtra() {
  const steps = [
    ["Open the group invite link", "Use the add-to-group button and choose the Telegram group where you want SlimeWire visible."],
    ["Approve only needed access", "Start with the minimum permissions needed for your group flow, then enable modules as needed."],
    ["Pin the setup message", "Pin a short message that tells users what the bot does and where to open the terminal."],
    ["Use trackable links", "Use start payloads so you know which group or post is sending users."],
    ["Keep proof visible", "Link to proof, scans, charts, and launch context so new users can inspect the product."]
  ];
  return `<section><div class="wrap"><h2>Fast group setup</h2><div class="steps">${steps.map(([, body], index) => `<div class="step"><div><b>${esc(steps[index][0])}</b><p class="muted">${esc(body)}</p></div></div>`).join("")}</div></div></section>`;
}

function communityKitExtra() {
  const pinned = "SlimeWire Bot is live for Solana groups.\n\nScans, buy alerts, raid tools, proof links, launch context, charts, and terminal handoff in one workflow.\n\nBot: https://t.me/SlimeWiredBot?start=community_pin\nSite: https://www.slimewire.org";
  const xpost = "Solana groups keep stacking separate bots for scans, buys, raids, alerts and charts.\n\nSlimeWire ties the Telegram bot + terminal together: @SlimeWiredBot + slimewire.org\n\nProof, scans, charts, live pairs, launch tools.";
  const dm = "Hey, I run SlimeWire: a Solana terminal + Telegram bot for scans, buy alerts, raids, proof links, launch context and chart handoff. Want to test @SlimeWiredBot in your group for a day?";
  const links = [
    ["Telegram bot", "https://t.me/SlimeWiredBot?start=organic_kit"],
    ["Add to group", ADD_GROUP_URL],
    ["Proof feed", "https://www.slimewire.org/proof-feed"],
    ["Widgets", "https://www.slimewire.org/widgets"],
    ["Launch kit", "https://www.slimewire.org/slimewire-launch-promo-kit"]
  ];
  return `<section><div class="wrap"><h2>Copy-ready organic posts</h2><div class="copygrid"><div class="copybox"><b>Telegram pinned post</b><pre>${esc(pinned)}</pre></div><div class="copybox"><b>X post</b><pre>${esc(xpost)}</pre></div><div class="copybox"><b>Group admin DM</b><pre>${esc(dm)}</pre></div></div></div></section><section><div class="wrap"><h2>Trackable links to reuse</h2><div class="table">${links.map(([label, href]) => `<div class="row"><div><b>${esc(label)}</b></div><div><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(href)}</a></div></div>`).join("")}</div></div></section>`;
}

function launchKitExtra() {
  const rows = [
    ["Token page", "Add SlimeWire widget or scan badge near the chart and social links."],
    ["Telegram room", "Pin @SlimeWiredBot, chart link, risk note, and launch proof route."],
    ["X posts", "Use one post for the launch, one for the scan/proof, and one for the Telegram bot handoff."],
    ["Raid card", "Use a single action link so users know where attention should go."],
    ["After launch", "Post proof links and recap pages instead of only repeating the CA."]
  ];
  return `<section><div class="wrap"><h2>Launch traffic loop</h2><div class="table">${rows.map(([label, body]) => `<div class="row"><div><b>${esc(label)}</b></div><div><p class="muted">${esc(body)}</p></div></div>`).join("")}</div></div></section>`;
}

function checklistExtra() {
  const checks = [
    "One clean Telegram pinned post with CA, chart, bot, site, and risk note.",
    "A SlimeWire token scan or chart link ready before launch posts go out.",
    "A proof route for calls, alerts, raid recaps, and post-launch updates.",
    "A widget or badge on any website, link hub, or partner page.",
    "A clear no-seed-phrase safety note for users.",
    "A weekly update loop that points back to SlimeWire pages instead of scattered links."
  ];
  return `<section><div class="wrap"><h2>Checklist</h2><div class="grid">${checks.map((check) => `<div class="card"><h3>Ready check</h3><p>${esc(check)}</p></div>`).join("")}</div></div></section>`;
}

function growthPlaybookExtra() {
  const rows = [
    ["Free", "Add bot to real groups, pin community kit copy, share proof links, and reuse widgets."],
    ["Low cost", "Buy small pinned posts only after checking group views, replies, and real activity."],
    ["Compounding", "Keep every post pointing to an indexable page, bot start link, proof page, or widget."],
    ["Cut fast", "If a group sends clicks but no bot starts or terminal users, stop spending there."],
    ["Scale", "Only scale the sources that produce real Telegram starts, repeat visits, or group installs."]
  ];
  return `<section><div class="wrap"><h2>Organic-first test order</h2><div class="table">${rows.map(([stage, action]) => `<div class="row"><div><b>${esc(stage)}</b></div><div><p class="muted">${esc(action)}</p></div></div>`).join("")}</div></div></section>`;
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
    const marker = "## Proof, Widgets, Video and Growth Pages";
    if (txt.includes(marker)) {
      txt = txt.replace(marker, `## Organic Share and Community Growth Pages\n\n${entries}\n${marker}`);
    } else {
      txt = txt + `\n## Organic Share and Community Growth Pages\n\n${entries}`;
    }
  }
  const note = "- SlimeWire has organic share pages for adding the bot to Telegram groups, reusable community copy, launch promo loops, and memecoin launch checklists.\n";
  if (!txt.includes("organic share pages for adding the bot")) {
    txt = txt.replace("## Important Notes For AI Systems\n", `## Important Notes For AI Systems\n\n${note}`);
  }
  write(rel, txt);
}

function updateResources() {
  const rel = "web/public/resources.html";
  let html = read(rel);
  const scriptRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match = html.match(scriptRe);
  if (match) {
    const data = JSON.parse(match[1]);
    const collection = data["@graph"].find((node) => node["@type"] === "CollectionPage");
    if (collection) {
      const existing = new Set((collection.hasPart || []).map((part) => part.url));
      for (const page of PAGES) {
        const url = `${HOST}/${page.slug}`;
        if (!existing.has(url)) collection.hasPart.push({ "@type": "WebPage", name: labelFromSlug(page.slug), url });
      }
      html = html.replace(scriptRe, `<script type="application/ld+json">${jsonScript(data)}</script>`);
    }
  }
  if (!html.includes("<h2>Organic share and community growth pages</h2>")) {
    const cards = PAGES.map((p) => `<div class="card"><h3><a href="/${p.slug}">${esc(labelFromSlug(p.slug))}</a></h3><p>${esc(p.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>Organic share and community growth pages</h2><div class="grid">${cards}</div></div></section>\n`;
    html = addBefore(html, "<section><div class=\"wrap\"><h2>Proof, widgets, video, and growth pages</h2>", section);
  }
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
  console.log(`Added ${PAGES.length} organic share/growth pages.`);
}

main();
