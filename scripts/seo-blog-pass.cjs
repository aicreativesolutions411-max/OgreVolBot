const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "web", "public");
const BLOG_DIR = path.join(PUBLIC_DIR, "blog");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;
const BOT_URL = "https://t.me/SlimeWiredBot";

const POSTS = [
  {
    slug: "how-to-check-a-solana-contract-address",
    title: "How to Check a Solana Contract Address Before You Buy",
    description: "A practical SlimeWire guide to checking a Solana contract address from Telegram, X, or a launch page before buying a memecoin.",
    h1: "How to check a Solana contract address before you buy",
    date: TODAY,
    minutes: 6,
    intro: "Most bad trades start with rushing a contract address from chat or X without context. This guide gives traders a simple pre-buy check that works whether the CA came from Telegram, a launch page, a reply thread, or a caller.",
    sections: [
      ["Start with the exact CA", "Copy the contract address directly from the source, then compare it against the chart, socials, and token page. Fake ticker clones rely on people searching the symbol instead of checking the mint."],
      ["Check age, liquidity, market cap, and venue", "Age tells you whether the token is a fresh launch or already cycled. Liquidity and market cap help size risk. Venue badges such as pump.fun, PumpSwap, Meteora, Raydium, Orca, or Bonk-style launch sources help users understand where the market is forming."],
      ["Read risk signals before speed signals", "Fast entries are useless if the token has obvious warnings. Look for mint/freeze authority context, suspicious metadata, dead liquidity, missing socials, strange holder concentration, and whether the chart has real trades or just noise."],
      ["Use Telegram for speed and the terminal for context", "Telegram is great for dropping a CA fast. A web terminal is better for chart, transactions, proof, PnL, and wallet context. The cleaner workflow is scan in Telegram, then open the full SlimeWire view when you need more room."],
      ["Save the scan or proof link", "If a token becomes a call, launch, or group play, save a public scan/proof link. It helps new users inspect what happened instead of digging through a chat scroll."]
    ],
    checklist: ["Copy the exact CA, not only the ticker.", "Open a chart before buying.", "Check age, market cap, liquidity, venue, and recent volume.", "Look for visible risk warnings.", "Avoid acting on posts that hide the CA or route through sketchy links.", "Never share a seed phrase with any bot or site."],
    related: ["/solana-rug-checker", "/solana-token-scanner", "/telegram-ca-scanner-bot", "/proof-feed"],
    faqs: [
      ["What is a Solana contract address?", "It is the mint address that identifies a token on Solana. Traders often call it the CA."],
      ["Why not just search the ticker?", "Tickers can be duplicated. The contract address is the safer identifier to compare across charts, scanners, and Telegram posts."],
      ["Can a scanner guarantee a token is safe?", "No. A scanner can surface context and warnings, but every trade still carries risk."],
      ["Where does SlimeWire fit?", "SlimeWire connects Telegram scans, token pages, charts, proof links, and terminal context so users can inspect a CA faster."]
    ]
  },
  {
    slug: "track-solana-memecoin-callers",
    title: "How to Track Solana Memecoin Callers Without Guessing",
    description: "Learn how Solana traders can track caller proof, entry market cap, follow-up movement, and public receipts instead of trusting hype alone.",
    h1: "How to track Solana memecoin callers without guessing",
    date: TODAY,
    minutes: 7,
    intro: "Crypto X and Telegram are full of callers. Some are early, some are late, and some delete the misses. The only useful way to judge a caller is to track the call, the entry context, and the outcome in public.",
    sections: [
      ["Log the first visible call", "Record the first post or Telegram message where the CA was shared. The market cap and age at that moment matter more than a later screenshot."],
      ["Separate call timing from trade timing", "A caller can be early while a follower enters late. Track the public call separately from your own wallet fill so proof stays fair."],
      ["Watch the after-call window", "Useful windows are often 15 minutes, 1 hour, 6 hours, and 24 hours. This shows whether a call had immediate momentum, slow grind, or a fast reversal."],
      ["Keep misses visible", "A trustworthy proof trail includes dead calls, stopped plays, and warnings. Hiding misses creates bad signal quality over time."],
      ["Turn proof into shareable pages", "Public proof pages make caller history easier to cite on X, Telegram, and search. They also help SlimeWire become the place users check before trusting a call."]
    ],
    checklist: ["Capture CA, caller, source, time, market cap, and token age.", "Track 15m, 1h, 6h, and 24h movement.", "Keep rugs and dead calls in the record.", "Avoid leaderboards based only on screenshots.", "Link proof pages back to the chart and terminal."],
    related: ["/proof-of-calls", "/proof-feed", "/solana-call-tracker", "/telegram-trading-bot-results"],
    faqs: [
      ["What is caller proof?", "Caller proof is a record of when a token was shared, what the market looked like, and what happened after the call."],
      ["Why do screenshots fail as proof?", "Screenshots can omit timing, market cap, and deleted misses. A public proof trail is harder to manipulate."],
      ["Should caller tracking be financial advice?", "No. It is transparency and context, not a guarantee that future calls will work."],
      ["Can SlimeWire help callers look more legitimate?", "Yes. SlimeWire proof links, scans, and result pages give callers cleaner receipts to share."]
    ]
  },
  {
    slug: "pump-fun-launch-marketing-checklist",
    title: "Pump.fun Launch Marketing Checklist for Telegram and X",
    description: "A pump.fun launch marketing checklist for teams using Telegram, X, SlimeWire widgets, proof links, raid cards, and token scan pages.",
    h1: "Pump.fun launch marketing checklist for Telegram and X",
    date: TODAY,
    minutes: 8,
    intro: "A launch needs more than a CA pasted into chat. The best teams prepare the path users will follow: X post, Telegram group, scan link, chart, proof, raid task, and follow-up content.",
    sections: [
      ["Prepare before the token is live", "Have the Telegram room, X post draft, launch copy, scan route, risk note, and SlimeWire widget ready before attention arrives."],
      ["Make the CA easy to verify", "Pin the CA, chart link, and scan link in one place. Users should not need to chase admins for the correct address."],
      ["Use a single source of truth", "Launch teams lose users when every post links somewhere different. A SlimeWire launch or promo page can collect chart, proof, scan, Telegram, and X links in one clean path."],
      ["Turn raids into proof", "A raid card should not only say like and reply. It should connect the social action back to a token page or proof page users can revisit."],
      ["Keep post-launch updates useful", "After the first wave, post chart context, proof links, scan updates, holder notes, and community milestones instead of repeating only the ticker."]
    ],
    checklist: ["Pinned Telegram post ready.", "X launch post ready.", "Correct CA and chart link verified.", "SlimeWire scan/proof/widget path ready.", "Raid CTA prepared.", "Post-launch recap planned."],
    related: ["/pump-fun-launch-platform", "/slimewire-launch-promo-kit", "/solana-memecoin-launch-checklist", "/widgets"],
    faqs: [
      ["What should a pump.fun launch prepare first?", "Prepare the Telegram pin, X launch post, CA, chart link, scan path, and proof route before sending traffic."],
      ["Why use a SlimeWire widget?", "A widget gives launch pages and community sites a branded path back to SlimeWire scans, proof, charts, or Telegram bot links."],
      ["Should launch marketing promise profit?", "No. It should explain tools, visibility, proof, and risk without guaranteeing returns."],
      ["Can SlimeWire replace a launch venue?", "No. SlimeWire is a discovery, bot, chart, proof, and community layer around the launch workflow."]
    ]
  },
  {
    slug: "crypto-telegram-bot-stack",
    title: "Crypto Telegram Bot Stack: Scans, Raids, Buy Alerts and Moderation",
    description: "A simple guide to the crypto Telegram bot stack groups use for scans, raids, buy alerts, moderation, proof, and SlimeWire terminal handoff.",
    h1: "Crypto Telegram bot stack: scans, raids, buy alerts and moderation",
    date: TODAY,
    minutes: 7,
    intro: "Most crypto groups end up with too many separate bots. One bot scans tokens, another posts buys, another handles raids, another moderates spam, and another links charts. A cleaner stack keeps the useful parts and removes confusion.",
    sections: [
      ["What most groups actually need", "A good Solana group needs CA scans, buy alerts, raid posts, moderation basics, chart handoff, proof links, and a simple setup path for admins."],
      ["Where separate bots get messy", "Too many bots create duplicate commands, permission confusion, broken buttons, and users who do not know which alert to trust."],
      ["Why terminal handoff matters", "Telegram is not a great place to inspect charts, transactions, PnL, and wallets. A terminal handoff gives users a fuller view without slowing the chat."],
      ["Keep modules optional", "Not every group needs everything. Admins should be able to use scans without raids, moderation without trading prompts, or buy alerts without clutter."],
      ["Make setup visible", "A public setup page and command page help groups decide faster than a long DM conversation with an admin."]
    ],
    checklist: ["Token scanner.", "Buy tracker.", "Raid tool.", "Moderation basics.", "Chart and terminal handoff.", "Public setup/help page."],
    related: ["/all-in-one-telegram-bot-comparison", "/telegram-bot-setup", "/telegram-bot-commands", "/add-slimewire-bot-to-telegram-group"],
    faqs: [
      ["What is a crypto Telegram bot stack?", "It is the set of bots and modules a group uses for scans, alerts, raids, moderation, proof, and links."],
      ["Can one bot replace every bot?", "Not always, but a modular bot can reduce clutter by combining the common group workflows."],
      ["Why combine trading tools and moderation?", "Crypto groups need both. Combining them can reduce setup friction if permissions and modules stay clear."],
      ["Does SlimeWire ask for seed phrases in Telegram?", "No. Users should never share seed phrases with any bot, admin, or website."]
    ]
  },
  {
    slug: "x-solana-memecoin-research",
    title: "How to Use X to Research Solana Memecoins Without Getting Lost",
    description: "A SlimeWire guide to researching Solana memecoins on X by checking CAs, callers, replies, charts, proof links, and Telegram context.",
    h1: "How to use X to research Solana memecoins without getting lost",
    date: TODAY,
    minutes: 6,
    intro: "X is where a lot of Solana attention starts, but it is also where fake tickers, late calls, recycled screenshots, and copy-paste hype spread quickly. The goal is not to trust X blindly; it is to turn X posts into verifiable token context.",
    sections: [
      ["Extract the CA first", "If a post has only a ticker and no CA, slow down. Find the exact address and compare it against chart links, Telegram pins, and scan pages."],
      ["Read replies for signal and noise", "Replies can reveal whether users are asking for the CA, calling out a fake, posting chart links, or repeating copied hype."],
      ["Check the caller's timing", "A caller who posts after a chart has already moved is different from someone who logged it early. Track market cap and token age at the post time."],
      ["Look for proof links", "Proof pages, scan links, and terminal links are better than isolated screenshots because they give users more context to inspect."],
      ["Use X as discovery, not confirmation", "Let X show you what people are talking about. Use SlimeWire, charts, and scanner context to decide whether the token deserves more attention."]
    ],
    checklist: ["Find the CA.", "Check the chart.", "Check age and market cap.", "Review replies for warnings.", "Compare against Telegram pins if available.", "Look for public proof or scan links."],
    related: ["/solana-alpha-alerts", "/solana-token-research-tool", "/proof-feed", "/slimewire-community-kit"],
    faqs: [
      ["Can X be useful for Solana memecoin research?", "Yes, but it should be treated as discovery. Users still need to verify the CA, chart, timing, and risk context."],
      ["Why are tickers risky on X?", "Many tokens can share the same ticker, and fake clones rely on users not checking the actual mint address."],
      ["What should a good X call include?", "A useful call includes the CA, chart or scan link, timing context, and risk-aware language."],
      ["How can SlimeWire help X users?", "SlimeWire gives X users scan pages, proof links, Telegram bot flows, widgets, and terminal context to verify what they are seeing."]
    ]
  },
  {
    slug: "fresh-solana-pairs-under-10k",
    title: "Fresh Solana Pairs Under $10K: What Traders Should Check First",
    description: "A risk-aware guide to reviewing fresh Solana pairs under $10K market cap with age, volume, liquidity, venue, chart behavior, and SlimeWire scan context.",
    h1: "Fresh Solana pairs under $10K: what traders should check first",
    date: TODAY,
    minutes: 7,
    intro: "Very low market cap Solana pairs can move fast, but they can also die instantly. The useful edge is not buying every fresh token; it is filtering for real early activity while making risk visible.",
    sections: [
      ["Age matters, but age is not enough", "A token can be fresh and still dead. Check whether real trades are happening, whether volume is climbing, and whether the chart has any structure."],
      ["Volume should match the story", "Under-$10K pairs need early volume to matter. If a token has no transactions, no follow-up, and no group activity, it may be too stale even if it is new."],
      ["Liquidity and venue shape risk", "Pump-style launches, PumpSwap, Meteora, Raydium, Orca, and other venues have different trade behavior. Venue context helps users understand what they are looking at."],
      ["Do not ignore basic warnings", "Mint/freeze context, token program, metadata, holder patterns, dead socials, and suspicious transfers should stay visible before a buy."],
      ["Exit planning matters more at low MC", "Low market cap entries can reverse quickly. Presets, stop loss, take profit, and timer exits should be part of the review, not an afterthought."]
    ],
    checklist: ["Age under review.", "Real transactions.", "Rising early volume.", "Market cap and liquidity visible.", "Venue badge visible.", "Risk warnings visible.", "Exit plan chosen before entry."],
    related: ["/solana-new-pair-alerts", "/solana-memecoin-screener", "/pump-fun-scanner", "/solana-take-profit-stop-loss-bot"],
    faqs: [
      ["Are fresh Solana pairs under $10K safer?", "No. They can have more upside but also higher failure risk. Users should inspect context before trading."],
      ["What makes a fresh pair worth watching?", "Useful signals include real transactions, rising early volume, visible liquidity, a known venue, and fewer obvious risk warnings."],
      ["Should traders have exits ready?", "Yes. Low market cap tokens can reverse quickly, so take-profit, stop-loss, timer, or manual exits should be planned before buying."],
      ["How does SlimeWire help with fresh pairs?", "SlimeWire organizes live pairs, scan context, chart links, token metadata, Telegram flows, and exit planning into one workflow."]
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

function addBefore(text, marker, insertion) {
  if (!insertion) return text;
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${insertion}${marker}`);
}

function labelFromSlug(slug) {
  return slug.split("-").map((part) => {
    const lower = part.toLowerCase();
    if (lower === "ca") return "CA";
    if (lower === "x") return "X";
    if (lower === "pnl") return "PnL";
    if (lower === "tg") return "TG";
    if (lower === "dex") return "Dex";
    if (lower === "solana") return "Solana";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function footerLinks() {
  return [
    ["Home", "/"],
    ["Blog", "/blog"],
    ["Resources", "/resources"],
    ["Proof Feed", "/proof-feed"],
    ["Community Kit", "/slimewire-community-kit"],
    ["Add Bot", "/add-slimewire-bot-to-telegram-group"],
    ["@SlimeWiredBot", BOT_URL]
  ].map(([label, href]) => `<a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`).join(" &middot; ");
}

function pageCss() {
  return `:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--panel2:#071109;--text:#e9ffe0;--border:rgba(114,255,35,.18)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(900px 360px at 50% -12%,rgba(114,255,35,.12),transparent),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.65}a{color:#bbff63;text-decoration:none}.wrap{max-width:980px;margin:auto;padding:0 20px}.eyebrow{color:var(--green);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}header{padding:66px 0 38px;text-align:center}h1{font-size:clamp(32px,6vw,58px);line-height:1.05;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:820px;margin:0 auto 24px}.meta{color:#b8cbb2;font-size:13px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;border-radius:12px;font-weight:900;border:1px solid var(--border);background:rgba(114,255,35,.05)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}section{padding:36px 0;border-top:1px solid rgba(114,255,35,.08)}article{max-width:820px;margin:0 auto}.post-body h2{font-size:clamp(22px,4vw,32px);margin:0 0 12px}.post-body p{color:#d8ead2;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.card,details,.note{background:linear-gradient(180deg,rgba(114,255,35,.045),transparent),var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px}.card p,details p,.muted{margin:0;color:var(--muted);font-size:14px}.checklist{display:grid;gap:10px;padding:0;list-style:none}.checklist li{background:var(--panel2);border:1px solid var(--border);border-radius:14px;padding:12px 14px}.checklist li:before{content:"Check";display:inline-block;margin-right:9px;color:#04120a;background:var(--green);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:900}.links{display:flex;gap:10px;flex-wrap:wrap}.links a{border:1px solid var(--border);border-radius:999px;padding:8px 11px;background:rgba(114,255,35,.05);font-weight:800;font-size:13px}summary{cursor:pointer;font-weight:900;padding:6px 0}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:640px){header{padding-top:46px}.btn{width:100%;max-width:360px}.cta{align-items:center;flex-direction:column}}`;
}

function postStructuredData(post) {
  const url = `${HOST}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        url,
        datePublished: post.date,
        dateModified: post.date,
        image: OG_IMAGE,
        author: { "@type": "Organization", name: "SlimeWire", url: HOST },
        publisher: {
          "@type": "Organization",
          name: "SlimeWire",
          logo: { "@type": "ImageObject", url: `${HOST}/assets/slimewire/png/slimewire-mark.png` }
        },
        mainEntityOfPage: url,
        isPartOf: { "@type": "Blog", name: "SlimeWire Blog", url: `${HOST}/blog` }
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a }
        }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: HOST },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${HOST}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url }
        ]
      }
    ]
  };
}

function postHtml(post) {
  const url = `${HOST}/blog/${post.slug}`;
  const sectionHtml = post.sections.map(([title, body]) => `<section><article class="post-body"><h2>${esc(title)}</h2><p>${esc(body)}</p></article></section>`).join("\n");
  const checklist = post.checklist.map((item) => `<li>${esc(item)}</li>`).join("");
  const related = post.related.map((href) => `<a href="${esc(href)}">${esc(labelFromSlug(href.replace(/^\//, "")))}</a>`).join("");
  const faq = post.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(post.title)}</title>
<meta name="description" content="${esc(post.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="SlimeWire">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="893">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(post.description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<script type="application/ld+json">${jsonScript(postStructuredData(post))}</script>
<style>${pageCss()}</style>
</head>
<body>
<header><div class="wrap"><p class="eyebrow">SlimeWire field guide</p><h1><span>SlimeWire</span> ${esc(post.h1)}</h1><p class="sub">${esc(post.intro)}</p><p class="meta">${esc(post.date)} · ${post.minutes} min read · Solana, Telegram, X and launch workflows</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a></div></div></header>
${sectionHtml}
<section><article><h2>Quick checklist</h2><ul class="checklist">${checklist}</ul></article></section>
<section><article><h2>Related SlimeWire pages</h2><p class="links">${related}</p></article></section>
<section><article><h2>FAQ</h2>${faq}</article></section>
<footer><div class="wrap">${footerLinks()}</div></footer>
</body>
</html>
`;
}

function blogStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "SlimeWire Blog",
        url: `${HOST}/blog`,
        description: "SlimeWire field guides for Solana memecoin traders, Telegram groups, X research, pump.fun launches, token scans, proof links, and trading terminal workflows.",
        publisher: { "@type": "Organization", name: "SlimeWire", url: HOST },
        blogPost: POSTS.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: `${HOST}/blog/${post.slug}` }))
      },
      {
        "@type": "ItemList",
        name: "SlimeWire field guides",
        itemListElement: POSTS.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${HOST}/blog/${post.slug}`,
          name: post.title
        }))
      }
    ]
  };
}

function blogHtml() {
  const cards = POSTS.map((post) => `<div class="card"><h3><a href="/blog/${post.slug}">${esc(post.title)}</a></h3><p>${esc(post.description)}</p><p class="meta">${esc(post.date)} · ${post.minutes} min read</p></div>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SlimeWire Blog - Solana Trading, Telegram Bots, X Research and Launch Guides</title>
<meta name="description" content="SlimeWire blog field guides for Solana memecoin trading, Telegram bots, X research, pump.fun launches, token scans, proof links, and launch workflows.">
<link rel="canonical" href="${HOST}/blog">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SlimeWire">
<meta property="og:title" content="SlimeWire Blog - Solana Trading, Telegram Bots, X Research and Launch Guides">
<meta property="og:description" content="Field guides for Solana traders, Telegram groups, launch teams, callers, and X researchers using SlimeWire.">
<meta property="og:url" content="${HOST}/blog">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="893">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SlimeWire Blog - Solana Trading, Telegram Bots, X Research and Launch Guides">
<meta name="twitter:description" content="Field guides for Solana traders, Telegram groups, launch teams, callers, and X researchers using SlimeWire.">
<meta name="twitter:image" content="${OG_IMAGE}">
<script type="application/ld+json">${jsonScript(blogStructuredData())}</script>
<style>${pageCss()}</style>
</head>
<body>
<header><div class="wrap"><p class="eyebrow">SlimeWire blog</p><h1><span>SlimeWire</span> field guides for Solana traders</h1><p class="sub">Useful, crawlable guides for people searching how to check CAs, judge callers, prepare launches, run Telegram groups, research on X, and review fresh Solana pairs.</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a></div></div></header>
<section><div class="wrap"><h2>Latest guides</h2><div class="grid">${cards}</div></div></section>
<section><div class="wrap"><div class="note"><h2>Why the blog exists</h2><p class="muted">These are not random filler posts. Each guide answers a real search or share question and points readers toward a useful SlimeWire workflow: scan, proof, Telegram bot, chart, launch page, widget, or terminal handoff.</p></div></div></section>
<footer><div class="wrap">${footerLinks()}</div></footer>
</body>
</html>
`;
}

function updateSrc() {
  let src = read("src/index.js");
  const allPaths = [{ path: "/blog", title: "SlimeWire Blog - Solana Trading, Telegram Bots, X Research and Launch Guides", description: "SlimeWire blog field guides for Solana memecoin trading, Telegram bots, X research, pump.fun launches, token scans, proof links, and launch workflows.", priority: "0.82" }]
    .concat(POSTS.map((post) => ({ path: `/blog/${post.slug}`, title: post.title, description: post.description, priority: "0.74" })));

  const seoEntries = allPaths
    .filter((p) => !src.includes(`{ path: "${p.path}"`))
    .map((p) => `  { path: "${p.path}", priority: "${p.priority}", changefreq: "weekly" },\n`)
    .join("");
  src = addBefore(src, '  { path: "/features", priority: "0.84", changefreq: "monthly" },', seoEntries);

  const metaEntries = allPaths
    .filter((p) => !src.includes(`"${p.path}": {`))
    .map((p) => `  "${p.path}": {\n    title: ${JSON.stringify(p.title)},\n    description: ${JSON.stringify(p.description)}\n  },\n`)
    .join("");
  src = addBefore(src, '  "/features": {', metaEntries);

  const routeEntries = allPaths
    .filter((p) => !src.includes(`requestUrl.pathname === "${p.path}"`))
    .map((p) => {
      const file = p.path === "/blog" ? "blog.html" : `${p.path.replace(/^\//, "")}/index.html`;
      return `    if (request.method === "GET" && requestUrl.pathname === "${p.path}") {\n      await serveStaticHtmlPage(response, "${file}");\n      return;\n    }\n`;
    })
    .join("");
  src = addBefore(src, '    if (request.method === "GET" && requestUrl.pathname === "/features") {', routeEntries);
  write("src/index.js", src);
}

function updateSitemap() {
  let sitemap = read("web/public/sitemap.xml");
  const entries = [`${HOST}/blog`].concat(POSTS.map((post) => `${HOST}/blog/${post.slug}`))
    .filter((url) => !sitemap.includes(url))
    .map((url) => `  <url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>${url.endsWith("/blog") ? "0.82" : "0.74"}</priority></url>\n`)
    .join("");
  sitemap = addBefore(sitemap, `  <url><loc>${HOST}/features</loc>`, entries);
  write("web/public/sitemap.xml", sitemap);
}

function updateFeedXml() {
  const rel = "web/public/feed.xml";
  if (!fs.existsSync(path.join(ROOT, rel))) return;
  let feed = read(rel);
  const entries = POSTS
    .filter((post) => !feed.includes(`${HOST}/blog/${post.slug}`))
    .map((post) => [
      "  <item>",
      `    <title>${esc(post.title)}</title>`,
      `    <link>${HOST}/blog/${post.slug}</link>`,
      `    <guid isPermaLink="true">${HOST}/blog/${post.slug}</guid>`,
      `    <description>${esc(post.description)}</description>`,
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
  const newItems = POSTS
    .filter((post) => !existing.has(`${HOST}/blog/${post.slug}`))
    .map((post) => ({
      id: `${HOST}/blog/${post.slug}`,
      url: `${HOST}/blog/${post.slug}`,
      title: post.title,
      summary: post.description,
      content_text: post.description
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
  const entries = [`- Blog: ${HOST}/blog\n`].concat(POSTS.map((post) => `- ${post.title}: ${HOST}/blog/${post.slug}\n`)).filter((line) => !txt.includes(line.split(": ").pop().trim())).join("");
  if (entries) {
    const marker = "## Organic Share and Community Growth Pages";
    txt = txt.includes(marker) ? txt.replace(marker, `## SlimeWire Blog Field Guides\n\n${entries}\n${marker}`) : `${txt}\n## SlimeWire Blog Field Guides\n\n${entries}`;
  }
  const note = "- SlimeWire publishes field guides for Solana CA checks, caller proof, pump.fun launches, Telegram bot stacks, X research, and fresh-pair review.\n";
  if (!txt.includes("field guides for Solana CA checks")) {
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
      collection.hasPart = collection.hasPart || [];
      const existing = new Set(collection.hasPart.map((part) => part.url));
      const blogParts = [{ name: "SlimeWire Blog", url: `${HOST}/blog` }].concat(POSTS.map((post) => ({ name: post.title, url: `${HOST}/blog/${post.slug}` })));
      for (const part of blogParts) {
        if (!existing.has(part.url)) collection.hasPart.push({ "@type": "WebPage", name: part.name, url: part.url });
      }
      html = html.replace(scriptRe, `<script type="application/ld+json">${jsonScript(data)}</script>`);
    }
  }
  if (!html.includes("<h2>SlimeWire blog field guides</h2>")) {
    const cards = POSTS.map((post) => `<div class="card"><h3><a href="/blog/${post.slug}">${esc(post.title)}</a></h3><p>${esc(post.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>SlimeWire blog field guides</h2><div class="grid"><div class="card"><h3><a href="/blog">Blog hub</a></h3><p>Evergreen SlimeWire field guides for Solana traders, Telegram groups, X researchers, callers, and launch teams.</p></div>${cards}</div></div></section>\n`;
    html = addBefore(html, "<section><div class=\"wrap\"><h2>Organic share and community growth pages</h2>", section);
  }
  write(rel, html);
}

function main() {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  write("web/public/blog.html", blogHtml());
  write("web/public/blog/index.html", blogHtml());
  for (const post of POSTS) {
    const html = postHtml(post);
    write(`web/public/blog/${post.slug}.html`, html);
    write(`web/public/blog/${post.slug}/index.html`, html);
  }
  updateSrc();
  updateSitemap();
  updateFeedXml();
  updateFeedJson();
  updateLlms();
  updateResources();
  console.log(`Added blog hub plus ${POSTS.length} field guides.`);
}

main();
