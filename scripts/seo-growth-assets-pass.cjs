const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "web", "public");
const ASSET_DIR = path.join(PUBLIC_DIR, "assets", "slimewire");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;

const CONTENT_PAGES = [
  {
    slug: "proof-feed",
    priority: "0.82",
    title: "SlimeWire Proof Feed - Public Solana Bot Calls, Receipts and Results",
    description: "Follow SlimeWire proof cards, Solana token calls, Telegram bot receipts, buy tracking, scan outcomes, and public result loops in one crawlable feed.",
    h1: "Proof feed for calls, receipts and bot results",
    intro: "Search traffic sticks when users can verify what a product actually does. This page makes SlimeWire proof loops public: calls, receipts, scan context, group posts, and trading bot outcomes that can be shared back into Telegram and X.",
    cards: [
      ["Call receipts", "Every useful SlimeWire proof card should point to token context, chart review, timing, and visible result history."],
      ["Buy tracking loop", "Telegram buy tracking becomes more trustworthy when users can open a public page instead of only seeing a chat post."],
      ["Scanner trail", "Token scans, warnings, market context, and chart links help users understand why a call or alert mattered."],
      ["Group proof", "Communities can link proof pages after raids, launches, calls, and alerts so new users see receipts fast."],
      ["Share ready", "Proof cards can be reused in X posts, Telegram groups, listings, articles, and directories."],
      ["Risk visible", "The page explains outcomes and workflow, not guaranteed wins. That helps SlimeWire look legitimate instead of hype-only."]
    ],
    extra: proofExtra(),
    faqs: [
      ["What is the SlimeWire proof feed?", "The SlimeWire proof feed is a public page for calls, receipts, bot alerts, token context, and result loops tied back to the SlimeWire terminal and @SlimeWiredBot."],
      ["Does the proof feed guarantee profitable trades?", "No. It is a transparency and discovery page. Crypto trading remains risky, and users are responsible for every wallet action."],
      ["Can Telegram groups share this page?", "Yes. The feed is designed for Telegram groups, launch teams, callers, and communities that want a clean public link for proof and follow-up."],
      ["Does it replace the terminal?", "No. The terminal is still the live product. The proof feed is an indexable public layer that helps users and search engines understand SlimeWire activity."],
      ["Will the feed still load if live data is unavailable?", "Yes. The page keeps a fast static fallback and only adds live proof snapshots when the public proof API is available."]
    ]
  },
  {
    slug: "widgets",
    priority: "0.78",
    title: "SlimeWire Widgets - Embeddable Solana Bot Badges, Proof Links and Token Cards",
    description: "Embed SlimeWire proof, scan, raid, chart, and Telegram bot badges on launch pages, blogs, group sites, and token community pages.",
    h1: "Embeddable SlimeWire widgets for launch pages and groups",
    intro: "Free backlinks and useful embeds beat cold traffic. These lightweight widgets let communities add SlimeWire proof, scan, chart, and Telegram bot calls-to-action to their own pages without heavy scripts.",
    cards: [
      ["Scanned by SlimeWire", "A compact badge for token pages and community sites that want to link users to a SlimeWire scan or chart."],
      ["Buy tracker badge", "A small embed for groups that want to route users from a tracked token page to @SlimeWiredBot or the terminal."],
      ["Raid live badge", "A launch-friendly badge that sends users from websites and link-in-bio pages to SlimeWire raid or launch context."],
      ["Chart handoff", "A clean button that opens the SlimeWire terminal chart for a token contract address."],
      ["SEO friendly", "Every badge links back to a crawlable SlimeWire page, which helps discovery without spam."],
      ["No heavy dependency", "The script creates an iframe and leaves the host page alone, so it stays low-risk for other communities."]
    ],
    extra: widgetsExtra(),
    faqs: [
      ["What are SlimeWire widgets?", "SlimeWire widgets are lightweight embeddable badges that route users to SlimeWire scans, charts, proof pages, raid pages, or @SlimeWiredBot."],
      ["Can launch teams use the widgets?", "Yes. Launch teams can place the badges on token pages, campaign pages, link-in-bio pages, and group resource pages."],
      ["Do widgets trade from another website?", "No. Widgets are links and iframe badges. Wallet actions still happen through SlimeWire or the user's wallet flow."],
      ["Do widgets help SEO?", "They can help because they create useful, contextual SlimeWire links from community pages without needing spam or fake traffic."],
      ["Are the widgets heavy?", "No. The script is tiny and creates a single iframe for each badge."]
    ]
  },
  {
    slug: "all-in-one-telegram-bot-comparison",
    priority: "0.82",
    title: "All-in-One Telegram Bot Comparison - Trading, Raids, Buy Tracking and Moderation",
    description: "Compare stacked Telegram crypto bots against SlimeWire's all-in-one bot workflow for Solana scans, buy tracking, raid tools, moderation, proof, and terminal handoff.",
    h1: "All-in-one Telegram bot comparison",
    intro: "Crypto groups usually stack separate bots for scans, buy alerts, raids, moderation, token calls, and chart links. This page explains the cleaner SlimeWire angle: one Telegram bot workflow connected to a real Solana terminal.",
    cards: [
      ["Separate bot stack", "Many groups run one bot for buy tracking, one for raids, one for moderation, one for scans, and another for launch posts."],
      ["SlimeWire workflow", "@SlimeWiredBot is positioned as the group layer for scans, buy tracking, raids, alerts, moderation, proof, and terminal handoff."],
      ["Cleaner room", "One modular setup can reduce bot clutter while still letting admins enable only the modules they want."],
      ["Terminal depth", "Telegram handles speed. SlimeWire handles charts, txns, wallets, positions, PnL, proof, and launch pages."],
      ["Better proof trail", "Calls, receipts, and proof links make the product easier to judge than a stream of disconnected chat alerts."],
      ["Honest limits", "Some groups may still keep specialty bots, but SlimeWire should be visible when people search for an all-in-one Telegram crypto bot."]
    ],
    extra: comparisonExtra(),
    faqs: [
      ["Is SlimeWire really an all-in-one Telegram bot?", "SlimeWire is built to combine Telegram scans, buy tracking, raid tools, alerts, moderation, proof links, and web terminal handoff through @SlimeWiredBot."],
      ["Does it replace every Telegram bot?", "Not always. Some groups may keep specialty bots, but SlimeWire reduces the need to stack many disconnected bots for common Solana group workflows."],
      ["Why is this useful for Telegram groups?", "It keeps scans, alerts, raid context, buy tracking, moderation, and terminal links closer together, which makes the group easier to run."],
      ["Does SlimeWire handle wallet actions inside Telegram?", "Wallet-specific actions still depend on the user's chosen wallet or SlimeWire wallet workflow. The bot should never ask for a seed phrase."],
      ["Does this page target TG searches too?", "Yes. Many users search for Telegram as TG, so SlimeWire uses both phrases across its resource pages."]
    ]
  },
  {
    slug: "video-demos",
    priority: "0.72",
    title: "SlimeWire Video Demos - Solana Terminal, Telegram Bot and Launch Teasers",
    description: "Watch and reuse SlimeWire demo assets for Solana trading terminal teasers, Telegram bot clips, launch posts, proof cards, and short social videos.",
    h1: "Video demos and teaser scripts",
    intro: "The fastest organic content loop is short clips: a scan, a chart, a proof card, a Telegram bot alert, and a clear link. This page packages existing SlimeWire trailer assets and scripts so clips can be made quickly without paid AI video credits.",
    cards: [
      ["Terminal teaser", "Show the live terminal, chart handoff, token cards, and trade context in a tight clip."],
      ["Telegram bot teaser", "Show @SlimeWiredBot scanning, alerting, and routing a group back to SlimeWire."],
      ["Launch teaser", "Show launch page, raid card, proof link, and terminal CTA for project teams."],
      ["Proof teaser", "Show receipts and result pages so the product looks real and verifiable."],
      ["X and TG ready", "The copy blocks are short enough to turn into posts, captions, or pinned group content."],
      ["Reuse existing media", "The page uses MP4 files already in the repo, avoiding paid video generation credits."]
    ],
    extra: videoExtra(),
    faqs: [
      ["Did this page generate new AI videos?", "No. It packages existing SlimeWire trailer MP4 files and gives ready-to-record teaser scripts, which avoids extra AI video credits."],
      ["Where should these clips be posted?", "Use them on X, Telegram groups, pinned launch rooms, directory profiles, partner pages, and short-form social posts."],
      ["What makes a good SlimeWire demo clip?", "A good clip shows a real workflow: scan, chart, proof, Telegram handoff, or launch visibility, then ends with slimewire.org and @SlimeWiredBot."],
      ["Should videos promise profit?", "No. Clips should show speed, workflow, proof, and context without claiming guaranteed returns."]
    ]
  },
  {
    slug: "cheap-crypto-advertising",
    priority: "0.72",
    title: "Cheap Crypto Advertising Tests - How SlimeWire Should Buy Traffic Carefully",
    description: "A practical SlimeWire playbook for low-budget crypto advertising, micro-KOL tests, Telegram placements, crypto ad networks, compliance limits, UTM tracking, and traffic quality.",
    h1: "Cheap crypto advertising tests for SlimeWire",
    intro: "Paid traffic can help, but broad crypto ads burn money fast if the page does not convert. The best low-budget path is proof-first: track every click, send traffic to the right landing page, and avoid networks or sellers that promise fake engagement.",
    cards: [
      ["Start with proof links", "Before spending, make sure every campaign points to a relevant page: terminal, Telegram bot, widgets, proof feed, comparison, or launch page."],
      ["Use UTMs", "Every link should identify source, campaign, and creative so wins and dead traffic are obvious after 48 hours."],
      ["Test micro-KOLs", "Small X and Telegram accounts with real replies often beat broad display ads for early crypto tools."],
      ["Avoid fake traffic", "Do not buy guaranteed users, bot clicks, fake Telegram joins, or engagement farms. They hurt trust and do not create traders."],
      ["Use crypto-native networks carefully", "AADS, Bitmedia, Coinzilla, and Cointraffic can be tested, but budgets and quality vary."],
      ["Respect platform rules", "Google, X, Reddit, and Meta restrict crypto and financial ads. Safer copy focuses on software, education, and risk transparency."]
    ],
    extra: adsExtra(),
    faqs: [
      ["What is the cheapest paid channel to test first?", "The cheapest useful tests are usually micro-KOL posts, Telegram group sponsorships, AADS-style small placements, or Bitmedia-style small network tests with strict UTM tracking."],
      ["Should SlimeWire run Google or Meta ads first?", "Not first. Mainstream platforms have strict crypto and financial policies, so SlimeWire should build proof pages and organic demand before paying for restricted traffic."],
      ["What budget should be tested?", "A practical first test is small: 50 to 150 dollars for a micro-KOL or Telegram placement, then 100 to 300 dollars for a crypto-native ad network only if tracking is ready."],
      ["What should paid traffic land on?", "Send traffic to the most relevant page: /solana-telegram-bot for bot users, /proof-feed for trust, /widgets for communities, /launch for launch teams, and /all-in-one-telegram-bot-comparison for group admins."],
      ["What should SlimeWire avoid?", "Avoid fake traffic, guaranteed ranking sellers, fake reviews, bought Telegram members, vague ad sellers, and campaigns that promise profit."]
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
    if (lower === "seo") return "SEO";
    if (lower === "x") return "X";
    if (lower === "solana") return "Solana";
    if (lower === "telegram") return "Telegram";
    if (lower === "crypto") return "Crypto";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function pageFooter() {
  const pages = [
    ["Home", "/"],
    ["Resources", "/resources"],
    ["Proof Feed", "/proof-feed"],
    ["Widgets", "/widgets"],
    ["Comparison", "/all-in-one-telegram-bot-comparison"],
    ["Video Demos", "/video-demos"],
    ["Ad Playbook", "/cheap-crypto-advertising"],
    ["@SlimeWiredBot", "https://t.me/SlimeWiredBot"]
  ];
  return pages.map(([label, href]) => {
    const external = href.startsWith("http");
    return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`;
  }).join(" &middot; ");
}

function structuredData(page) {
  const url = `${HOST}/${page.slug}`;
  const faq = page.faqs.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a }
  }));
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
          { "@type": "Thing", name: "Solana trading terminal" },
          { "@type": "Thing", name: "Telegram crypto bot" },
          { "@type": "Thing", name: "Crypto marketing" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        name: "SlimeWire",
        alternateName: ["SlimeWire Terminal", "@SlimeWiredBot"],
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Telegram",
        url: HOST,
        description: "SlimeWire combines a Solana memecoin terminal with @SlimeWiredBot for token scans, live pairs, charts, Telegram group tools, proof, PnL, and launch workflows.",
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
}

function pageHtml(page) {
  const url = `${HOST}/${page.slug}`;
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
<script type="application/ld+json">${jsonScript(structuredData(page))}</script>
${baseStyle()}
</head>
<body>
<header><div class="wrap"><p class="eyebrow">SlimeWire growth asset</p><h1><span>SlimeWire</span> ${esc(page.h1)}</h1><p class="sub">${esc(page.intro)}</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="https://t.me/SlimeWiredBot" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a></div></div></header>
<section><div class="wrap"><h2>Why this helps discovery</h2><div class="grid">${cards}</div></div></section>
${page.extra || ""}
<section><div class="wrap"><h2>FAQ</h2>${faqs}</div></section>
<footer><div class="wrap">${pageFooter()}</div></footer>
</body>
</html>
`;
}

function baseStyle() {
  return `<style>:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--text:#e9ffe0;--border:rgba(114,255,35,.18);--soft:rgba(114,255,35,.08)}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.55}a{color:#bbff63;text-decoration:none}.wrap{max-width:1080px;margin:auto;padding:0 20px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#bbff63;font-weight:900;font-size:12px;margin:0 0 10px}.btn{display:inline-block;padding:12px 18px;border-radius:12px;font-weight:900;border:1px solid var(--border)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}header{padding:66px 0 38px;text-align:center;background:radial-gradient(900px 360px at 50% -10%,rgba(114,255,35,.14),transparent)}h1{font-size:clamp(31px,6vw,52px);line-height:1.06;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:850px;margin:0 auto 24px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}section{padding:38px 0;border-top:1px solid rgba(114,255,35,.08)}h2{font-size:clamp(22px,4vw,32px);margin:0 0 12px}.lead{color:var(--muted);max-width:840px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px}.card,details,.panel{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px;font-size:17px}.card p,details p,.muted{margin:0;color:var(--muted);font-size:14px}summary{cursor:pointer;font-weight:900;padding:6px 0}.wide{grid-column:1/-1}.mini{font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#b8ff80;font-weight:900}.table{display:grid;gap:8px}.row{display:grid;grid-template-columns:180px 1fr;gap:12px;align-items:start;padding:12px;border:1px solid var(--border);border-radius:12px;background:rgba(114,255,35,.04)}pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#030603;border:1px solid var(--border);border-radius:12px;padding:14px;color:#d9ffcb;font-size:13px}.video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}video{display:block;width:100%;border-radius:16px;border:1px solid var(--border);background:#020402}.proof-list{display:grid;gap:10px}.proof-item{border:1px solid var(--border);border-radius:12px;padding:12px;background:rgba(114,255,35,.05)}.proof-item b{display:block}.proof-item span{color:var(--muted);font-size:13px}.badge-demo{height:86px;border:0;width:100%;max-width:520px}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:560px){.wrap{padding:0 14px}.btn{width:100%;text-align:center}.row{grid-template-columns:1fr}}</style>`;
}

function proofExtra() {
  return `<section><div class="wrap"><h2>Live proof snapshot</h2><p class="lead">This panel tries the public proof API and falls back cleanly if the live feed is unavailable.</p><div class="panel"><div id="proofSnapshot" class="proof-list"><div class="proof-item"><b>Loading proof feed...</b><span>Fetching public SlimeWire receipts.</span></div></div></div></div></section>
<script>
(function(){
  const target = document.getElementById("proofSnapshot");
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const endpoints = ["/api/web/proof", "https://ogrevolbot.onrender.com/api/web/proof"];
  async function load(){
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) continue;
        const data = await response.json();
        const alpha = data.alpha || {};
        const shield = data.shield || {};
        const wins = Array.isArray(alpha.recentWins) ? alpha.recentWins.slice(0, 4) : [];
        const calls = Array.isArray(alpha.recentCalls) ? alpha.recentCalls.slice(0, 4) : [];
        const rows = [
          ["Calls tracked", alpha.totalCalls || 0, "Public call history attached to SlimeWire proof."],
          ["2x wins", alpha.wins || 0, "Wins are shown as outcomes, not promises."],
          ["Hit rate", alpha.hitRatePct != null ? alpha.hitRatePct + "%" : "building", "Calculated from tracked calls when enough data exists."],
          ["Shield flags", shield.rugsCalled || 0, "Risk flags and outcomes make warnings easier to revisit."]
        ];
        const live = rows.map(([label, value, note]) => '<div class="proof-item"><b>' + esc(label) + ': ' + esc(value) + '</b><span>' + esc(note) + '</span></div>');
        wins.forEach((win) => live.push('<div class="proof-item"><b>$' + esc(win.symbol || "token") + ' hit ' + esc(win.peakX || "?") + 'x</b><span>Recent SlimeWire tracked win. Open the terminal for chart context.</span></div>'));
        calls.forEach((call) => live.push('<div class="proof-item"><b>$' + esc(call.symbol || "token") + ' is tracking</b><span>Status: ' + esc(call.status || call.outcome || "live") + '</span></div>'));
        target.innerHTML = live.join("") || '<div class="proof-item"><b>Proof feed is initializing.</b><span>Calls and receipts will appear as data is tracked.</span></div>';
        return;
      } catch {}
    }
    target.innerHTML = '<div class="proof-item"><b>Live proof is unavailable right now.</b><span>The static page still explains the SlimeWire proof workflow and links users to the terminal.</span></div>';
  }
  load();
})();
</script>`;
}

function widgetsExtra() {
  const scan = `<div data-slimewire-widget="scan" data-slimewire-token="PASTE_CA_HERE" data-slimewire-label="Scanned by SlimeWire"></div>
<script src="https://www.slimewire.org/assets/slimewire/widget.js" defer></script>`;
  const proof = `<iframe title="SlimeWire proof badge" src="https://www.slimewire.org/widget?type=proof&label=Proof%20tracked%20by%20SlimeWire" width="520" height="86" loading="lazy"></iframe>`;
  const raid = `<iframe title="SlimeWire raid badge" src="https://www.slimewire.org/widget?type=raid&label=Raid%20live%20on%20SlimeWire" width="520" height="86" loading="lazy"></iframe>`;
  return `<section><div class="wrap"><h2>Copy-paste embeds</h2><div class="grid"><div class="card wide"><h3>Script embed</h3><pre><code>${esc(scan)}</code></pre></div><div class="card"><h3>Proof iframe</h3><pre><code>${esc(proof)}</code></pre></div><div class="card"><h3>Raid iframe</h3><pre><code>${esc(raid)}</code></pre></div><div class="card wide"><h3>Live examples</h3><iframe class="badge-demo" title="SlimeWire scan widget demo" src="/widget?type=scan&token=DemoMint&label=Scanned%20by%20SlimeWire" loading="lazy"></iframe><iframe class="badge-demo" title="SlimeWire proof widget demo" src="/widget?type=proof&label=Proof%20tracked%20by%20SlimeWire" loading="lazy"></iframe></div></div></div></section>`;
}

function comparisonExtra() {
  const rows = [
    ["Token scan", "A scanner bot answers a CA.", "A scan can link into token pages, chart context, proof, and the terminal."],
    ["Buy tracking", "A buy bot posts volume in chat.", "Buy tracking can become part of a broader proof and launch loop."],
    ["Raid tools", "A raid bot posts social tasks.", "Raid cards can connect launch attention back to charts, proof, and @SlimeWiredBot."],
    ["Moderation", "A moderation bot manages rules and spam.", "Group controls can live beside trading modules so admins manage fewer bots."],
    ["Chart handoff", "Separate bots often link users away.", "SlimeWire keeps chart, txn, wallet context, PnL, and proof in one web terminal."],
    ["Discovery", "The stack is hard to explain to new users.", "A single SlimeWire resource trail is easier for Google, AI answers, groups, and directories to understand."]
  ];
  return `<section><div class="wrap"><h2>Stacked bot setup vs SlimeWire</h2><div class="table">${rows.map(([feature, stacked, slimewire]) => `<div class="row"><div><b>${esc(feature)}</b></div><div><span class="mini">Typical stack</span><p class="muted">${esc(stacked)}</p><span class="mini">SlimeWire angle</span><p class="muted">${esc(slimewire)}</p></div></div>`).join("")}</div></div></section>`;
}

function videoExtra() {
  const clips = [
    ["/assets/slimewire/trailers/trailer-cinematic.mp4", "Cinematic SlimeWire trailer"],
    ["/assets/slimewire/trailers/sampleA-realpanel.mp4", "Real panel trading teaser"],
    ["/assets/slimewire/hero-raid.mp4", "Launch and raid teaser"]
  ].filter(([src]) => fs.existsSync(path.join(PUBLIC_DIR, src.replace(/^\//, ""))));
  const videos = clips.map(([src, label]) => `<div class="card"><h3>${esc(label)}</h3><video controls muted playsinline preload="metadata" src="${esc(src)}"></video></div>`).join("");
  const script15 = "0-3s: show live pairs or Telegram scan. 3-8s: open SlimeWire chart and proof context. 8-12s: show @SlimeWiredBot alert or launch page. 12-15s: end on slimewire.org and @SlimeWiredBot.";
  const script30 = "Open with the problem: groups stack too many bots. Show SlimeWire scan, chart, proof feed, widgets, launch page, and Telegram handoff. Close with: one terminal, one bot workflow, receipts over hype.";
  return `<section><div class="wrap"><h2>Existing video assets</h2><div class="video-grid">${videos || '<div class="card"><h3>No MP4 assets found</h3><p>Record a terminal walkthrough and drop it into assets/slimewire/trailers.</p></div>'}</div></div></section><section><div class="wrap"><h2>Fast teaser scripts</h2><div class="grid"><div class="card"><h3>15-second short</h3><p>${esc(script15)}</p></div><div class="card"><h3>30-second explainer</h3><p>${esc(script30)}</p></div><div class="card"><h3>Recording checklist</h3><p>Use the site recorder, keep the chart readable, avoid wallet secrets, show only public token data, and end with the bot and URL.</p></div></div></div></section>`;
}

function adsExtra() {
  const links = [
    ["Google crypto ad policy", "https://support.google.com/adspolicy/answer/16114090"],
    ["X financial services ad policy", "https://business.x.com/en/help/ads-policies/ads-content-policies/financial-services"],
    ["Reddit financial/crypto ads policy", "https://business.reddithelp.com/s/article/financial-cryptocurrency-products-and-services-policy"],
    ["Meta cryptocurrency ad policy", "https://transparency.meta.com/policies/ad-standards/restricted-goods-services/cryptocurrency-products-and-services/"],
    ["Coinzilla advertiser page", "https://coinzilla.com/"],
    ["Cointraffic advertiser page", "https://cointraffic.com/advertisers/"],
    ["Bitmedia FAQ", "https://bitmedia.io/faq"],
    ["AADS advertiser help", "https://help.aads.com/en/category/advertisers-oj2jwu/"]
  ];
  const rows = [
    ["Free first", "Post proof links, widgets, and comparison pages into owned Telegram/X profiles and partner launch pages.", "Highest quality, slower burn."],
    ["Micro-KOLs", "Pay small accounts for real demo posts using trackable links.", "Best early paid test if replies are real."],
    ["Telegram group placements", "Sponsor pinned posts or bot demos in Solana group chats.", "Good fit, but avoid fake member groups."],
    ["AADS or Bitmedia", "Run tiny crypto-native tests only after UTM tracking is ready.", "Watch bounce rate and bot traffic carefully."],
    ["Coinzilla", "Useful once the funnel is proven because minimums can be higher than micro tests.", "Better after landing pages convert."],
    ["Cointraffic", "Not a cheap first move if using managed campaign minimums.", "Keep for later scale tests."]
  ];
  return `<section><div class="wrap"><h2>Suggested cheap test order</h2><div class="table">${rows.map(([channel, action, note]) => `<div class="row"><div><b>${esc(channel)}</b></div><div><p class="muted">${esc(action)}</p><p class="muted"><b>${esc(note)}</b></p></div></div>`).join("")}</div></div></section><section><div class="wrap"><h2>Policy and network references</h2><p class="lead">Crypto ads are restricted on mainstream platforms. Keep copy software-focused, add risk language, and do not promise returns.</p><div class="grid">${links.map(([label, href]) => `<div class="card"><h3><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></h3><p>Open the current policy or advertiser page before spending.</p></div>`).join("")}</div></div></section>`;
}

function widgetHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>SlimeWire Widget</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:transparent;color:#e9ffe0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}.badge{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:76px;padding:12px 14px;border:1px solid rgba(114,255,35,.35);border-radius:18px;background:radial-gradient(circle at 10% 0%,rgba(114,255,35,.20),transparent 55%),#050705;box-shadow:0 0 18px rgba(114,255,35,.13) inset}.brand{display:flex;align-items:center;gap:10px;min-width:0}.mark{width:42px;height:42px;border-radius:50%;object-fit:contain;background:#0b1608;border:1px solid rgba(114,255,35,.24)}b{display:block;font-size:15px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{display:block;color:#8ea28a;font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cta{flex:0 0 auto;border-radius:999px;padding:9px 12px;background:linear-gradient(180deg,#bbff63,#72ff23);color:#04120a;font-weight:900;text-decoration:none;font-size:12px}@media(max-width:360px){.badge{gap:8px;padding:10px}.mark{width:34px;height:34px}.cta{padding:8px 10px}}</style>
</head>
<body>
<div class="badge">
  <div class="brand"><img class="mark" src="/assets/slimewire/png/slimewire-mark.png" alt=""><span><b id="label">SlimeWire</b><span class="meta" id="meta">Solana terminal and Telegram bot</span></span></div>
  <a class="cta" id="link" target="_blank" rel="noopener noreferrer" href="https://www.slimewire.org/">Open</a>
</div>
<script>
(function(){
  const params = new URLSearchParams(location.search);
  const type = String(params.get("type") || "scan").toLowerCase();
  const token = String(params.get("token") || "").trim();
  const custom = String(params.get("label") || "").trim();
  const map = {
    scan: ["Scanned by SlimeWire", "Token scan and chart handoff", "/terminal/chart?token="],
    proof: ["Proof tracked by SlimeWire", "Calls, receipts and public results", "/proof-feed"],
    raid: ["Raid live on SlimeWire", "Launch attention and group flow", "/raids"],
    chart: ["Open SlimeWire chart", "Dex chart, txns and terminal view", "/terminal/chart?token="],
    bot: ["Use @SlimeWiredBot", "Telegram scans, alerts and groups", "https://t.me/SlimeWiredBot"]
  };
  const config = map[type] || map.scan;
  document.getElementById("label").textContent = custom || config[0];
  document.getElementById("meta").textContent = token ? token.slice(0, 8) + "..." + token.slice(-4) : config[1];
  const href = config[2].startsWith("http") ? config[2] : "https://www.slimewire.org" + (config[2].endsWith("=") ? config[2] + encodeURIComponent(token) : config[2]);
  document.getElementById("link").href = href;
})();
</script>
</body>
</html>
`;
}

function widgetJs() {
  return `(function(){
  function currentBase(){
    var script = document.currentScript || (function(){ var scripts = document.getElementsByTagName("script"); return scripts[scripts.length - 1]; })();
    try { return new URL("/widget.html", script && script.src ? script.src : "https://www.slimewire.org/assets/slimewire/widget.js").href; }
    catch (error) { return "https://www.slimewire.org/widget.html"; }
  }
  var base = currentBase();
  var nodes = document.querySelectorAll("[data-slimewire-widget]");
  for (var i = 0; i < nodes.length; i += 1) {
    var node = nodes[i];
    var params = new URLSearchParams();
    params.set("type", node.getAttribute("data-slimewire-widget") || "scan");
    if (node.getAttribute("data-slimewire-token")) params.set("token", node.getAttribute("data-slimewire-token"));
    if (node.getAttribute("data-slimewire-label")) params.set("label", node.getAttribute("data-slimewire-label"));
    var iframe = document.createElement("iframe");
    iframe.title = node.getAttribute("data-slimewire-title") || "SlimeWire widget";
    iframe.src = base + "?" + params.toString();
    iframe.loading = "lazy";
    iframe.width = "520";
    iframe.height = "86";
    iframe.style.cssText = "width:100%;max-width:520px;height:86px;border:0;display:block;overflow:hidden";
    node.innerHTML = "";
    node.appendChild(iframe);
  }
})();\n`;
}

function addBefore(text, marker, insertion) {
  if (!insertion) return text;
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${insertion}${marker}`);
}

function updateSrc() {
  let src = read("src/index.js");
  const seoEntries = CONTENT_PAGES
    .filter((p) => !src.includes(`{ path: "/${p.slug}"`))
    .map((p) => `  { path: "/${p.slug}", priority: "${p.priority}", changefreq: "weekly" },\n`)
    .join("");
  src = addBefore(src, '  { path: "/features", priority: "0.84", changefreq: "monthly" },', seoEntries);

  const metaEntries = CONTENT_PAGES
    .filter((p) => !src.includes(`"/${p.slug}": {`))
    .map((p) => `  "/${p.slug}": {\n    title: ${JSON.stringify(p.title)},\n    description: ${JSON.stringify(p.description)}\n  },\n`)
    .join("");
  src = addBefore(src, '  "/features": {', metaEntries);

  const routes = CONTENT_PAGES
    .filter((p) => !src.includes(`requestUrl.pathname === "/${p.slug}"`))
    .map((p) => `    if (request.method === "GET" && requestUrl.pathname === "/${p.slug}") {\n      await serveStaticHtmlPage(response, "${p.slug}.html");\n      return;\n    }\n`)
    .join("");
  const widgetRoute = src.includes('requestUrl.pathname === "/widget"') ? "" : `    if (request.method === "GET" && requestUrl.pathname === "/widget") {\n      await serveStaticHtmlPage(response, "widget.html");\n      return;\n    }\n`;
  src = addBefore(src, '    if (request.method === "GET" && requestUrl.pathname === "/features") {', routes + widgetRoute);
  write("src/index.js", src);
}

function updateSitemap() {
  let sitemap = read("web/public/sitemap.xml");
  const entries = CONTENT_PAGES
    .filter((p) => !sitemap.includes(`${HOST}/${p.slug}`))
    .map((p) => `  <url><loc>${HOST}/${p.slug}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>${p.priority}</priority></url>\n`)
    .join("");
  sitemap = addBefore(sitemap, `  <url><loc>${HOST}/features</loc>`, entries);
  write("web/public/sitemap.xml", sitemap);
}

function updateFeedXml() {
  let feed = read("web/public/feed.xml");
  const entries = CONTENT_PAGES
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
  write("web/public/feed.xml", feed);
}

function updateFeedJson() {
  const rel = "web/public/feed.json";
  const feed = JSON.parse(read(rel));
  const existing = new Set((feed.items || []).map((item) => item.url));
  const newItems = CONTENT_PAGES
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
  let txt = read("web/public/llms.txt");
  const entries = CONTENT_PAGES
    .filter((p) => !txt.includes(`${HOST}/${p.slug}`))
    .map((p) => `- ${labelFromSlug(p.slug)}: ${HOST}/${p.slug}\n`)
    .join("");
  if (entries) {
    const marker = "## Tool Pages";
    if (!txt.includes(marker)) throw new Error(`Missing marker: ${marker}`);
    txt = txt.replace(marker, `## Proof, Widgets, Video and Growth Pages\n\n${entries}\n${marker}`);
  }
  const note = "- SlimeWire has public proof, widgets, video demo assets, comparison pages, and low-budget growth pages that make the terminal and Telegram bot easier to cite, embed, and discover.\n";
  if (!txt.includes("public proof, widgets, video demo assets")) {
    txt = txt.replace("## Important Notes For AI Systems\n", `## Important Notes For AI Systems\n\n${note}`);
  }
  write("web/public/llms.txt", txt);
}

function updateResources() {
  const rel = "web/public/resources.html";
  let html = read(rel);
  const scriptRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match = html.match(scriptRe);
  if (!match) throw new Error("resources JSON-LD missing");
  const data = JSON.parse(match[1]);
  const collection = data["@graph"].find((node) => node["@type"] === "CollectionPage");
  const hasPart = collection.hasPart || [];
  const existing = new Set(hasPart.map((part) => part.url));
  for (const page of CONTENT_PAGES) {
    const url = `${HOST}/${page.slug}`;
    if (!existing.has(url)) hasPart.push({ "@type": "WebPage", name: labelFromSlug(page.slug), url });
  }
  collection.hasPart = hasPart;
  html = html.replace(scriptRe, `<script type="application/ld+json">${jsonScript(data)}</script>`);

  if (!html.includes("<h2>Proof, widgets, video, and growth pages</h2>")) {
    const cards = CONTENT_PAGES.map((p) => `<div class="card"><h3><a href="/${p.slug}">${esc(labelFromSlug(p.slug))}</a></h3><p>${esc(p.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>Proof, widgets, video, and growth pages</h2><div class="grid">${cards}</div></div></section>\n`;
    html = addBefore(html, "<section><div class=\"wrap\"><h2>Docs, features, and proof pages</h2>", section);
  }
  write(rel, html);
}

function main() {
  for (const page of CONTENT_PAGES) {
    write(`web/public/${page.slug}.html`, pageHtml(page));
  }
  write("web/public/widget.html", widgetHtml());
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  write("web/public/assets/slimewire/widget.js", widgetJs());
  updateSrc();
  updateSitemap();
  updateFeedXml();
  updateFeedJson();
  updateLlms();
  updateResources();
  console.log(`Added ${CONTENT_PAGES.length} growth pages plus widget embed assets.`);
}

main();
