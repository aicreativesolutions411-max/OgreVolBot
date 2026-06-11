export const OGRE_AGENT_KNOWLEDGE_VERSION = "2026-06-10-site-intel-v2";

function cleanText(value = "") {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function shortMint(value = "") {
  const text = String(value || "").trim();
  return text.length > 12 ? `${text.slice(0, 5)}...${text.slice(-4)}` : text;
}

function tokenMintFromText(text = "") {
  const match = String(text || "").match(/\b[A-HJ-NP-Za-km-z1-9]{32,48}\b/);
  return match ? match[0] : "";
}

function activeTokenMint(message = "", context = {}) {
  return tokenMintFromText(message)
    || String(context.lastTokenMint || context.smartChartToken || context.tradeToken || context.currentToken?.tokenMint || "").trim();
}

function action(label, type, extra = {}) {
  return { label, type, ...extra };
}

const OGRE_AGENT_SITE_KNOWLEDGE = [
  {
    intent: "site_referral_help",
    terms: [/\b(referral|referal|refferal|refferral|referrer|ref code|invite|invite link|affiliate|\/r\/|payout wallet|payouts?)\b/],
    reply: () => [
      "Custom referral code: open Profile, find the Referral card, edit only the code after /r/, then tap Save Link.",
      "Use letters, numbers, dash, or underscore. Add a Referral Payout Wallet if you want referral fee payouts, then copy/share the generated link."
    ].join("\n"),
    actions: () => [action("Open Profile", "open_tab", { tab: "profile" }), action("Wallets", "open_tab", { tab: "wallets" })]
  },
  {
    intent: "site_profile_help",
    terms: [/\b(profile|pfp|avatar|picture|badges?|quests?|trader board|leaderboard|x profile|twitter profile|account settings?|customi[sz]e)\b/],
    reply: () => [
      "Profile controls PFP/avatar, X profile, referrals, badges/quests, trader-board visibility, payout wallet, and account settings.",
      "On mobile use the right rail Profile/Home entry; on desktop use Profile in the top bar or Home/Profile from the tools."
    ].join("\n"),
    actions: () => [action("Open Profile", "open_tab", { tab: "profile" })]
  },
  {
    intent: "site_trade_setup_help",
    terms: [/\b(tp\/sl|tpsl|take profit|profit take|stop loss|stoploss|\btp\b|\bsl\b|presets?|slippage|quick buy|auto[- ]?exit|timer|protected buy|sell percent|exit size)\b/],
    reply: () => [
      "Trade setup lives in Slime Swap and Smart Chart: pick wallet, SOL amount, preset, slippage, take-profit, stop-loss, timer, and exit size before buying.",
      "Managed SlimeWire wallets can run server TP/SL and timer exits. Phantom/Solflare-style connected wallets still show wallet approval prompts for trades."
    ].join("\n"),
    actions: () => [action("Slime Swap", "open_tab", { tab: "trade" }), action("Positions", "open_tab", { tab: "positions" })]
  },
  {
    intent: "site_chart_help",
    terms: [/\b(trade button|coin pfp|token pfp|coin picture|token picture|chart page|smart chart|dex chart|chart and txns|transactions|ca pasted|contract address|chart button)\b/],
    reply: ({ tokenMint }) => [
      "Tap a coin PFP, Chart, or Trade button to open Smart Chart with that token CA already loaded.",
      "The page is a DEX chart + transactions view with buy/sell controls: web keeps the panel on the right, mobile stacks it under the chart."
    ].join("\n"),
    actions: ({ tokenMint }) => tokenMint
      ? [action("Open Chart", "open_chart", { tokenMint }), action("Open Buy Panel", "open_quick_buy", { tokenMint })]
      : [action("Smart Chart", "open_tab", { tab: "smartChart" }), action("Live Terminal", "open_tab", { tab: "terminal" })]
  },
  {
    intent: "site_mobile_nav_help",
    terms: [/\b(mobile|phone|right rail|right bar|tools?|icons?|options?|navigation|nav|where.*tools?|where.*profile)\b/],
    reply: () => "Mobile uses the same 18 tools as desktop in the right rail: Live, Home, Chart, Swap, Pairs, Trades, Scope, Watch, KOL, AI, Pump, Bundle, Volume, Launch, Snipe, Wallets, Pos, and PnL. Scroll the rail on short screens.",
    actions: () => [action("Live Terminal", "open_tab", { tab: "terminal" }), action("Profile", "open_tab", { tab: "profile" })]
  },
  {
    intent: "site_wallet_help",
    terms: [/\b(connect wallet|wallet connect|phantom|solflare|backpack|disconnect|connected wallet|browser wallet|managed wallet|create wallet|wallet ready|wallet status)\b/],
    reply: () => [
      "Wallet status is clickable in the top bar. Connect opens Phantom, Solflare, Backpack, or managed wallet options; connected status lets you open wallet controls or disconnect.",
      "Browser wallets can buy/sell with confirmation. Managed wallets unlock backend TP/SL, timers, bundle, sniper, and Ogre A.I. automation."
    ].join("\n"),
    actions: () => [action("Connect Wallet", "open_wallet_connect"), action("Wallets", "open_tab", { tab: "wallets" })]
  },
  {
    intent: "site_clip_help",
    terms: [/\b(rec|record|recording|clip farm|clip|screen record|screenrecord|share clip|save clip)\b/],
    reply: () => [
      "REC records a shareable SlimeWire clip. Desktop uses browser screen capture; mobile falls back to an in-site SlimeWire clip card when the browser blocks screen capture.",
      "After it finishes, use Share or Save."
    ].join("\n"),
    actions: () => [action("Start REC", "start_clip_recording"), action("Live Terminal", "open_tab", { tab: "terminal" })]
  },
  {
    intent: "site_ogre_ai_help",
    terms: [/\b(ogre a\.?i\.?|ai bot|auto pick|best picks|low mc|low mcap|fresh launch|fresh launches|runner|runners|moonshot|2x|x2|climbing|volume coming in|easy potential|stale pairs?)\b/],
    reply: () => [
      "Ogre A.I. should look for fresh low-MC setups with real recent volume, buy pressure, enough liquidity to exit, and a cleaner risk read. It should avoid stale rows and avoid repeating the same mints when fresh alternatives exist.",
      "Use Ogre A.I. for managed-wallet entries, or ask me for fresh low-MC runners and I will rank the live rows I can actually see."
    ].join("\n"),
    actions: () => [action("Ogre A.I.", "open_tab", { tab: "ogreAi" }), action("Slime Scope", "open_tab", { tab: "slimeScope" }), action("Refresh Feeds", "refresh_feeds")]
  },
  {
    intent: "site_push_alerts_help",
    terms: [/\b(push alerts?|notifications?|notify|ping me|alert me|phone alerts?|get pinged|lock screen)\b/],
    reply: () => [
      "Push alerts ping your phone when a take-profit or stop-loss fires, a plan fails, or a KOL copy executes - even with the site closed.",
      "Enable them under Profile > Alerts. On iPhone, add SlimeWire to your Home Screen first (Share > Add to Home Screen), then enable."
    ].join("\n"),
    actions: () => [action("Open Profile", "open_tab", { tab: "profile" })]
  },
  {
    intent: "site_shield_receipts_help",
    terms: [/\b(shield receipts?|receipts?|rug log|flagged tokens?|hit rate|slimeshield (history|proof|record))\b/],
    reply: () => [
      "SlimeShield Receipts record every AVOID/RISK flag, then track what happened to the token. Confirmed rugs show how many minutes of warning the shield gave.",
      "Find the receipts panel on the Ogre Tek hub, including the running hit-rate."
    ].join("\n"),
    actions: () => [action("Ogre Tek", "open_tab", { tab: "tek" }), action("Slime Scope", "open_tab", { tab: "slimeScope" })]
  },
  {
    intent: "site_kol_copy_help",
    terms: [/\b(copy trad(e|ing)|copy wallet|copy kol|mirror (a )?wallet|follow (a )?wallet|copy (their|his|her) buys?)\b/],
    reply: () => [
      "KOL copy-trading lives on the KOL Tracker: tap Copy Wallet Next Buy on any tracked wallet and SlimeWire mirrors their next buy from your selected wallets, then arms TP/SL on the copied bag automatically.",
      "Set the buy amount and exits in the copy setup before arming."
    ].join("\n"),
    actions: () => [action("KOL Tracker", "open_tab", { tab: "kol" }), action("TP/SL Audit", "open_tab", { tab: "txAudit" })]
  },
  {
    intent: "site_quick_buy_amount_help",
    terms: [/\b(quick buy (amount|button|sol)|change (the )?buy amount|buy button amount|default buy)\b/],
    reply: () => [
      "The quick-buy amount shows right on every Buy button (like \"Buy 0.1 SOL\"). Change it in the Quick Buy SOL box on any feed toolbar, pick a preset, or just tell me \"set quick buy to 0.5\".",
      "Every Buy button across the site fires with that amount."
    ].join("\n"),
    actions: () => [action("Live Terminal", "open_tab", { tab: "terminal" })]
  },
  {
    intent: "site_telegram_help",
    terms: [/\b(telegram|tg bot|telegram bot|\/look|group bot|telegram group|telegram alerts)\b/],
    reply: () => [
      "The SlimeWire Telegram bot trades from DM (wallets, buys, sells, PnL cards) and works in groups: /look <CA> gives an instant SlimeShield read with trade links, /alpha posts current top picks.",
      "Group admins can enable launch/TP/SL alerts with /slimewire on. Link your Telegram to the site with the /web login code."
    ].join("\n"),
    actions: () => [action("Open Profile", "open_tab", { tab: "profile" })]
  },
  {
    intent: "site_guide_help",
    terms: [/\b(help|guide|tutorial|walk me|what can you do|how do i use|where do i start|show me around)\b/],
    reply: () => [
      "I can guide SlimeWire from chat: token reads, Smart Chart, Slime Scope, Live Pairs, wallet refresh, Positions, PnL, presets, TP/SL, Protected Buy, referrals, badges, Pump Launch, Bundle, Volume, Sniper, KOL, and trade requests.",
      "Ask naturally, like 'make a ref code', 'check this CA', 'buy 0.1 SOL with 25 TP 8 SL', 'record a clip', or 'show positions'."
    ].join("\n"),
    actions: () => [action("Live Terminal", "open_tab", { tab: "terminal" }), action("Profile", "open_tab", { tab: "profile" }), action("Positions", "open_tab", { tab: "positions" })]
  }
];

export function ogreAgentKnowledgeReply(message = "", context = {}) {
  const lower = cleanText(message);
  if (!lower) return null;
  const tokenMint = activeTokenMint(message, context);
  const asksSiteHelp = /\b(how|where|what|make|create|change|edit|set|use|find|open|show|custom|help|guide|why|can you|start|record|connect)\b/.test(lower)
    || /\b(ref|pfp|tp\/sl|tpsl|stoploss|stop loss|take profit|rec|clip|wallet|profile|badges?|quests?|low mc|fresh launch|runner|x2|push|alerts?|notifications?|receipts?|copy|telegram|quick buy)\b/.test(lower);
  if (!asksSiteHelp) return null;

  const card = OGRE_AGENT_SITE_KNOWLEDGE.find((entry) => entry.terms.some((term) => term.test(lower)));
  if (!card) return null;
  const payload = { message, context, tokenMint, shortMint: shortMint(tokenMint) };
  const reply = typeof card.reply === "function" ? card.reply(payload) : String(card.reply || "");
  const actions = typeof card.actions === "function" ? card.actions(payload) : card.actions || [];
  return {
    reply,
    actions: actions.filter(Boolean).slice(0, 5),
    intent: card.intent,
    siteHelp: true,
    knowledgeVersion: OGRE_AGENT_KNOWLEDGE_VERSION,
    modelPowered: false
  };
}

export function ogreAgentKnowledgeSummary() {
  return [
    `Knowledge ${OGRE_AGENT_KNOWLEDGE_VERSION}: SlimeWire site map and lingo are preloaded.`,
    "Understand synonyms for referrals/ref code/invite, profile/PFP/badges/quests, wallet/connect/Phantom/Solflare/managed wallet, TP/SL/take-profit/stop-loss/timer/slippage/presets, Smart Chart/DEX chart/transactions/CA, REC/clip farm, Live Pairs/Slime Scope/KOL/Watch/Positions/PnL, and Ogre A.I. fresh low-MC runner scans.",
    "When the user asks for trade candidates, prefer visible fresh low-MC rows with real recent volume, buy pressure, usable liquidity, and cleaner risk data; avoid stale or repeated pairs. Never guarantee profit."
  ].join(" ");
}
