const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "web", "public");
const HOST = "https://www.slimewire.org";
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${HOST}/assets/slimewire/auto/login-hero.jpg`;

const PAGES = [
  {
    slug: "all-in-one-telegram-crypto-bot",
    priority: "0.84",
    title: "All-in-One Telegram Crypto Bot - Trading, Raids, Buy Tracking and Moderation",
    description: "SlimeWire positions @SlimeWiredBot as an all-in-one Telegram crypto bot for Solana groups: token scans, buy tracking, raid cards, Rose-style moderation, alerts, proof, and terminal handoff.",
    h1: "all-in-one Telegram crypto bot",
    intro: "Most crypto groups stack separate bots for trading alerts, raid posts, buy tracking, scan cards, and moderation. SlimeWire's angle is different: one Telegram bot token can expose modular group tools while the web terminal handles deeper charts, wallets, proof, and PnL.",
    cards: [
      ["One bot token", "Group admins can keep the room cleaner by using one SlimeWire bot instead of a pile of unrelated bot accounts."],
      ["Trading context", "Scans, alerts, chart handoff, token pages, wallet context, proof links, and PnL connect back to the terminal."],
      ["Buy tracking", "The group Buy Bot module can track a coin, post buy activity, show thresholds, and send users to SlimeWire."],
      ["Raid cards", "The Raid Bot module helps communities run cleaner X-raid style posts with progress and SlimeWire links."],
      ["Rose-style moderation", "Rose & Shield covers captcha, welcome/rules, anti-link, anti-flood, notes, filters, warns, mutes, bans, and anti-scam options."],
      ["Scan Bot", "A pasted CA or ticker can trigger a SlimeShield-style scan card with a chart and terminal handoff."]
    ],
    faqs: [
      ["Is SlimeWire an all-in-one Telegram crypto bot?", "SlimeWire is built to combine Telegram scans, buy tracking, raids, alerts, group tools, Rose-style moderation, proof, and web terminal handoff through @SlimeWiredBot."],
      ["Does it replace every separate group bot?", "For many SlimeWire group workflows it can reduce bot sprawl, but group admins should choose the modules they actually need."],
      ["What does TG mean?", "TG is common shorthand for Telegram. This page uses both terms so people searching either phrase can find the same SlimeWire workflow."],
      ["Does the bot guarantee profitable trades?", "No. SlimeWire provides software, alerts, scans, and context. Crypto and memecoin trading remain risky."]
    ],
    related: ["top-solana-telegram-bots", "telegram-bot-setup", "telegram-bot-commands", "crypto-telegram-group-bot"]
  },
  {
    slug: "all-in-one-solana-tg-bot",
    priority: "0.84",
    title: "All-in-One Solana TG Bot - Scans, Buy Bot, Raids, Moderation and Terminal",
    description: "SlimeWire is an all-in-one Solana TG bot workflow for Telegram groups that need token scans, buy tracking, raid tools, moderation, alerts, proof, and web terminal handoff.",
    h1: "all-in-one Solana TG bot",
    intro: "People search for Telegram as TG, tele, telly, and group bot. SlimeWire should be discoverable across those searches because the core pitch is simple: one Solana group bot layer tied to a real web terminal.",
    cards: [
      ["TG scans", "Paste a CA or ticker in a Telegram group and route users toward token context instead of scattered links."],
      ["Buy Bot", "Track buys for a selected coin and show useful group-facing buy context."],
      ["Raid Bot", "Coordinate launch and X-raid attention without needing a separate raid-only bot."],
      ["Rose & Shield", "Moderation and anti-scam controls live alongside trading utilities, not in a disconnected bot."],
      ["Terminal handoff", "Open SlimeWire for charts, txns, wallets, positions, PnL, launch pages, and proof."],
      ["Modular by design", "Admins can turn modules on or off so the room stays useful instead of noisy."]
    ],
    faqs: [
      ["What is an all-in-one Solana TG bot?", "It is a Telegram bot workflow that combines Solana scans, group alerts, buy tracking, raid tools, moderation, and terminal handoff."],
      ["Why use TG in the page wording?", "Many crypto users search for Telegram as TG, so SlimeWire documents both terms."],
      ["Can admins choose only some modules?", "Yes. SlimeWire's group bot flow is modular so admins can use the features that fit their room."],
      ["Is SlimeWire financial advice?", "No. It is a Solana trading software stack and Telegram workflow, not financial advice."]
    ],
    related: ["solana-tg-bot", "tg-trading-bot", "telegram-trading-bot-with-moderation", "features"]
  },
  {
    slug: "tg-trading-bot",
    priority: "0.82",
    title: "TG Trading Bot - Solana Telegram Bot for Scans, Alerts and Group Tools",
    description: "SlimeWire's TG trading bot workflow connects Telegram scans, Solana alerts, buy tracking, raid cards, token research, proof, PnL, and the SlimeWire web terminal.",
    h1: "TG trading bot",
    intro: "TG trading bot searches usually mean Telegram trading bot. SlimeWire makes that language explicit and points traders to a Solana workflow built for fast chat, deeper chart review, and group utilities.",
    cards: [
      ["Telegram speed", "Use chat for scans, alerts, group coordination, and quick handoff."],
      ["Terminal depth", "Use the web terminal for charts, transactions, wallet context, positions, PnL, and proof."],
      ["Group modules", "Buy Bot, Raid Bot, Scan Bot, and Rose & Shield can be managed from one SlimeWire bot setup."],
      ["Solana focus", "The workflow is built around Solana memecoin markets, fresh launches, and token scans."],
      ["Less clutter", "One bot token with modules can be easier for groups than stacking many single-purpose bots."],
      ["Risk visible", "The pages keep wallet and memecoin risk clear rather than promising easy wins."]
    ],
    faqs: [
      ["Is TG the same as Telegram?", "Yes. TG is common crypto shorthand for Telegram."],
      ["What does @SlimeWiredBot do?", "@SlimeWiredBot supports SlimeWire's Telegram scans, alerts, group tools, launch workflows, proof links, and terminal handoff."],
      ["Can a TG trading bot trade for everyone in a group?", "No. Users still need their own wallet flow or selected SlimeWire wallet setup. The bot should not move funds without the user's intended action."],
      ["Why combine TG and web?", "Telegram is fast for groups; the web terminal gives more room for charts, txns, wallet state, and PnL."]
    ],
    related: ["tg-crypto-bot", "telegram-crypto-trading-bot", "solana-telegram-bot", "solana-trading-terminal"]
  },
  {
    slug: "tg-crypto-bot",
    priority: "0.82",
    title: "TG Crypto Bot - Telegram Crypto Bot for Solana Groups",
    description: "SlimeWire is a TG crypto bot workflow for Solana groups: scans, alerts, buy tracking, raid tools, moderation, token research, proof links, and web terminal handoff.",
    h1: "TG crypto bot",
    intro: "Crypto communities often say TG instead of Telegram. SlimeWire documents that exact phrase so groups searching for a TG crypto bot can find the all-in-one Solana workflow.",
    cards: [
      ["CA and ticker scans", "Groups can use scan flows to turn token mentions into cleaner context."],
      ["Buy tracking", "Buy activity can be surfaced inside chat for a tracked token."],
      ["Raid and launch flow", "Launch teams can use raid cards, alerts, and proof links to route attention."],
      ["Moderation layer", "Rose-style moderation and Shield options help reduce group chaos."],
      ["Terminal link", "Every chat workflow can point users back to SlimeWire for deeper review."],
      ["Search clarity", "Using both TG and Telegram wording helps users and answer engines understand the product."]
    ],
    faqs: [
      ["What is a TG crypto bot?", "It is a Telegram crypto bot, often used by trading groups for alerts, scans, and community workflows."],
      ["Does SlimeWire support Solana groups?", "Yes. SlimeWire is focused on Solana memecoin workflows, Telegram groups, launch teams, and traders."],
      ["What makes SlimeWire different?", "It combines Telegram group tools with a web terminal, proof pages, scanners, launch tools, and wallet-aware workflows."],
      ["Is this a replacement for research?", "No. It is a toolset to organize research and action, not a guarantee that a token is safe."]
    ],
    related: ["all-in-one-telegram-crypto-bot", "crypto-telegram-group-bot", "telegram-token-scanner", "telegram-crypto-alerts"]
  },
  {
    slug: "solana-tg-bot",
    priority: "0.82",
    title: "Solana TG Bot - Telegram Scans, Buy Tracking, Raids and Token Tools",
    description: "SlimeWire's Solana TG bot workflow helps Telegram groups scan tokens, post alerts, track buys, run raids, moderate chat, and open the SlimeWire terminal.",
    h1: "Solana TG bot",
    intro: "A Solana TG bot should do more than answer one command. SlimeWire frames the bot as a group layer connected to live pairs, scans, buy tracking, moderation, launch tools, and a full web terminal.",
    cards: [
      ["Solana token scans", "Paste a contract address or ticker and move toward token context."],
      ["Buy activity", "Track buys for a coin and route users to chart or quick review."],
      ["Raid coordination", "Use raid cards for launch and community campaigns."],
      ["Group protection", "Moderation and anti-scam controls help keep rooms usable."],
      ["Proof pages", "Calls, receipts, and PnL pages make activity easier to verify later."],
      ["Terminal workflow", "SlimeWire web pages hold the deeper chart, wallet, and position context."]
    ],
    faqs: [
      ["Is SlimeWire a Solana TG bot?", "Yes. @SlimeWiredBot is the Telegram layer for SlimeWire's Solana terminal and group workflows."],
      ["Can it scan Solana tokens?", "Yes. SlimeWire includes Telegram token scan workflows and web scanner pages."],
      ["Can it run raids and buy tracking?", "The group modules include raid and buy tracking workflows that admins can enable."],
      ["Does it remove wallet risk?", "No. Users remain responsible for wallet actions, approvals, slippage, liquidity, and market risk."]
    ],
    related: ["solana-telegram-bot", "all-in-one-solana-tg-bot", "telegram-buy-tracker-bot", "telegram-raid-bot-with-buy-tracker"]
  },
  {
    slug: "crypto-telegram-group-bot",
    priority: "0.82",
    title: "Crypto Telegram Group Bot - Buy Bot, Raid Bot, Scan Bot and Moderation",
    description: "SlimeWire gives crypto Telegram groups a modular bot workflow: Buy Bot, Raid Bot, Scan Bot, Rose-style moderation, alerts, proof links, and Solana terminal handoff.",
    h1: "crypto Telegram group bot",
    intro: "A trading group needs more than a scanner. It needs buy posts, launch links, raid coordination, moderation, anti-scam rules, proof, and a clean way to move from chat to a terminal.",
    cards: [
      ["Buy Bot module", "Track a group's coin and post buy context with links back to SlimeWire."],
      ["Raid Bot module", "Coordinate X-raid style posts with progress and cleaner group flow."],
      ["Scan Bot module", "Turn pasted CAs or tickers into token scan cards and chart handoff."],
      ["Rose & Shield", "Moderation, captcha, rules, notes, anti-link, anti-flood, and anti-scam tools live in the same bot setup."],
      ["Launch support", "Launch rooms, alerts, proof pages, and raid cards help teams route traffic."],
      ["Less bot sprawl", "A modular group bot can reduce the need for many separate Telegram bots."]
    ],
    faqs: [
      ["What should a crypto Telegram group bot include?", "A strong group bot can include token scans, buy tracking, raid tools, moderation, alerts, proof links, and terminal handoff."],
      ["Can SlimeWire moderate a group?", "SlimeWire includes Rose-style group moderation and Shield workflows when admins enable that module."],
      ["Can SlimeWire post buy alerts?", "The Buy Bot module can track a coin and post buy context in supported group workflows."],
      ["Can every module stay off by default?", "Yes. Modular controls help admins avoid flooding the room."]
    ],
    related: ["telegram-trading-bot-with-moderation", "telegram-raid-buy-bot", "telegram-buy-tracker-bot", "telegram-bot-setup"]
  },
  {
    slug: "telegram-trading-bot-with-moderation",
    priority: "0.82",
    title: "Telegram Trading Bot with Moderation - Trading Tools plus Rose-Style Group Control",
    description: "SlimeWire documents a Telegram trading bot with moderation: Solana scans, buy tracking, raid cards, alerts, Rose-style tools, anti-scam settings, proof, and terminal handoff.",
    h1: "Telegram trading bot with moderation",
    intro: "Most groups add one bot for trading and another for moderation. SlimeWire's differentiator is that trading utilities and Rose-style controls can live under the same SlimeWire group setup.",
    cards: [
      ["Trading utilities", "Scans, alerts, buy tracking, token context, launch links, and chart handoff support active rooms."],
      ["Rose-style controls", "Welcome, rules, captcha, anti-link, anti-flood, notes, filters, warns, mutes, bans, reports, and purge workflows help admins."],
      ["Shield options", "Anti-scam and anti-impersonation settings help reduce common group abuse."],
      ["Cleaner setup", "One bot token can expose modules instead of forcing admins to stack unrelated bots."],
      ["Terminal connected", "Charts, wallets, positions, PnL, and proof remain in the SlimeWire web terminal."],
      ["Honest limits", "Moderation and scans reduce friction, but do not make trading risk-free."]
    ],
    faqs: [
      ["Can a Telegram trading bot also moderate?", "Yes, if it includes moderation modules. SlimeWire documents this combined workflow through @SlimeWiredBot."],
      ["What does Rose-style mean?", "It means familiar Telegram moderation patterns such as captcha, rules, notes, filters, anti-link, anti-flood, warns, mute, kick, ban, report, purge, and pin controls."],
      ["Is SlimeWire affiliated with Rose?", "No. Rose-style describes familiar moderation behavior; SlimeWire is its own Solana terminal and Telegram bot stack."],
      ["Why combine trading and moderation?", "Crypto groups already need both, and one modular setup can be cleaner than several separate bot accounts."]
    ],
    related: ["crypto-group-moderation-bot", "all-in-one-telegram-crypto-bot", "telegram-bot-commands", "security"]
  },
  {
    slug: "telegram-raid-buy-bot",
    priority: "0.8",
    title: "Telegram Raid and Buy Bot - Solana Group Raids, Buy Tracking and Proof",
    description: "SlimeWire combines Telegram raid and buy bot workflows for Solana groups: raid cards, buy tracking, token scans, alerts, proof links, and terminal handoff.",
    h1: "Telegram raid and buy bot",
    intro: "Raid tools and buy tracking usually live in different bots. SlimeWire makes the combined use case visible: launch attention, buy context, token scans, and terminal links can work together.",
    cards: [
      ["Raid cards", "Run cleaner campaign posts with a link back to SlimeWire."],
      ["Buy tracking", "Track buy activity for a selected coin and give users a quick next step."],
      ["Scan context", "CA and ticker scan workflows reduce blind link chasing."],
      ["Launch visibility", "Launch teams can connect alerts, raid cards, scans, and proof pages."],
      ["Group controls", "Admins can enable or disable modules so the group does not get overloaded."],
      ["Terminal proof", "Chart pages, receipts, proof, and PnL help make the activity easier to revisit."]
    ],
    faqs: [
      ["What is a Telegram raid and buy bot?", "It is a bot workflow that helps groups coordinate social raids while also tracking buy activity and token context."],
      ["Does SlimeWire include both raid and buy workflows?", "Yes. SlimeWire includes group modules for raid posts and buy tracking workflows."],
      ["Should every group enable both?", "No. Admins should enable only the modules that fit their group."],
      ["Does raid activity guarantee a trade result?", "No. Raids may increase attention, but market results are never guaranteed."]
    ],
    related: ["telegram-raid-bot-with-buy-tracker", "telegram-raid-tools", "telegram-buy-tracker-bot", "memecoin-launch-tools"]
  },
  {
    slug: "telegram-buy-tracker-bot",
    priority: "0.8",
    title: "Telegram Buy Tracker Bot - Solana Buy Alerts, Charts and Group Handoff",
    description: "SlimeWire's Telegram buy tracker bot workflow helps Solana groups track buys, show token context, link charts, route quick review, and connect activity to proof and PnL.",
    h1: "Telegram buy tracker bot",
    intro: "Buy tracker searches are high-intent because launch teams and communities want visible momentum. SlimeWire documents buy tracking as part of a broader Solana group and terminal workflow.",
    cards: [
      ["Tracked coin", "A group can set a token and track buy context around that coin."],
      ["Buy posts", "Buy activity can be surfaced with quick links and group-facing context."],
      ["Chart handoff", "Users can move from a buy post to a chart and token review page."],
      ["Proof trail", "Receipts, calls, and PnL context make activity easier to review later."],
      ["Launch fit", "Buy tracking pairs naturally with launch pages, raid cards, and Telegram alerts."],
      ["Risk clarity", "Visible buys are not a safety guarantee; users still need research and wallet caution."]
    ],
    faqs: [
      ["What is a Telegram buy tracker bot?", "It is a bot that tracks and posts buy activity for a token in a Telegram group."],
      ["Does SlimeWire have buy tracking?", "SlimeWire includes a Buy Bot group workflow for tracked token buy context and handoff links."],
      ["Can buy posts link to charts?", "Yes. SlimeWire workflows can route users from Telegram context into chart and terminal pages."],
      ["Do buy alerts prove a coin is safe?", "No. Buy alerts show activity, not safety or guaranteed profit."]
    ],
    related: ["solana-buy-tracker-bot", "telegram-buy-bot", "solana-pnl-tracker", "proof-of-calls"]
  },
  {
    slug: "solana-buy-tracker-bot",
    priority: "0.8",
    title: "Solana Buy Tracker Bot - Telegram Buy Alerts, Token Context and SlimeWire",
    description: "SlimeWire's Solana buy tracker bot workflow connects Telegram buy alerts, tracked tokens, chart links, scans, group tools, proof cards, and terminal review.",
    h1: "Solana buy tracker bot",
    intro: "Solana communities often want a buy tracker that is not isolated from the rest of the workflow. SlimeWire ties buy context to scans, charts, proof, group tools, and the terminal.",
    cards: [
      ["Solana focused", "The workflow is built around Solana memecoin launches, CAs, charts, and wallet-aware review."],
      ["Telegram visible", "Group buy posts help communities see activity in the place they already coordinate."],
      ["Chart and scan links", "Buy context can point users to token research instead of only a hype post."],
      ["Modular controls", "Admins can turn the Buy Bot module on or off."],
      ["Launch stack", "Buy tracking can sit beside raids, alerts, launch rooms, and proof pages."],
      ["No guarantees", "Buy volume can still reverse, so users need risk controls and position discipline."]
    ],
    faqs: [
      ["Is SlimeWire a Solana buy tracker bot?", "SlimeWire includes Solana buy tracking workflows through its Telegram group tooling and terminal handoff."],
      ["Can it help launch teams?", "Yes. Buy tracking can pair with launch alerts, raid cards, proof pages, and token scan links."],
      ["Can admins choose not to use buy tracking?", "Yes. Group modules are designed to be toggled."],
      ["Is a buy tracker a trading signal?", "It can be useful context, but it is not a guaranteed signal or financial advice."]
    ],
    related: ["telegram-buy-tracker-bot", "solana-trading-bot-for-groups", "solana-memecoin-alerts", "data-freshness"]
  },
  {
    slug: "telegram-raid-bot-with-buy-tracker",
    priority: "0.8",
    title: "Telegram Raid Bot with Buy Tracker - Solana Launch Group Workflow",
    description: "SlimeWire documents a Telegram raid bot with buy tracker workflow for Solana launches: raid posts, buy alerts, token scans, proof links, and terminal handoff.",
    h1: "Telegram raid bot with buy tracker",
    intro: "Launch groups often want the raid post and buy tracker in the same place. SlimeWire's group tooling can position those workflows side by side with scans, proof, and web terminal links.",
    cards: [
      ["Raid plus buys", "Connect social activity with visible buy context instead of splitting attention across bots."],
      ["Token scan cards", "A pasted CA can route into token context, chart links, and risk notes."],
      ["Launch proof", "Proof pages and receipts help communities revisit what happened."],
      ["Telegram flow", "The group stays inside Telegram until deeper chart or wallet review is needed."],
      ["Admin toggles", "Use only the modules the room needs."],
      ["Clean handoff", "SlimeWire links guide users to the terminal, not a dead-end post."]
    ],
    faqs: [
      ["Can one Telegram bot handle raid posts and buy tracking?", "Yes, SlimeWire documents both workflows as modules around @SlimeWiredBot."],
      ["Why combine raid and buy tracking?", "It keeps launch attention, buy context, token scans, and proof links connected in one group flow."],
      ["Can this be used for Solana launches?", "Yes. SlimeWire is focused on Solana memecoin and launch workflows."],
      ["Does this make a launch safe?", "No. It improves visibility and workflow organization, not market certainty."]
    ],
    related: ["telegram-raid-buy-bot", "pump-fun-launch-platform", "launch-on-slimewire-guide", "telegram-raid-bot"]
  },
  {
    slug: "crypto-group-moderation-bot",
    priority: "0.78",
    title: "Crypto Group Moderation Bot - Rose-Style Moderation plus Solana Trading Tools",
    description: "SlimeWire's crypto group moderation bot workflow combines Rose-style Telegram moderation, anti-scam options, token scans, buy tracking, raid tools, alerts, and terminal handoff.",
    h1: "crypto group moderation bot",
    intro: "A crypto group moderation bot should understand the room it protects. SlimeWire pairs familiar moderation controls with crypto-specific scans, anti-scam settings, buy tracking, raid tools, and launch handoff.",
    cards: [
      ["Captcha and joins", "New-member verification, welcome text, and clean service-message handling help groups stay tidy."],
      ["Rules, notes, filters", "Admins can use familiar Telegram moderation patterns without leaving the SlimeWire stack."],
      ["Anti-link and anti-flood", "Basic abuse controls help prevent spam and noisy rooms."],
      ["Anti-scam settings", "Shield-style options can remove scam/phishing messages, impersonators, and known bad actors when enabled."],
      ["Trading-aware", "Token scans, buy tracking, raid posts, alerts, and terminal links keep moderation connected to the group purpose."],
      ["One stack", "The value is not just moderation; it is moderation plus Solana group trading workflows."]
    ],
    faqs: [
      ["Is SlimeWire only a moderation bot?", "No. SlimeWire combines moderation workflows with Solana scans, buy tracking, raid tools, alerts, proof, and terminal handoff."],
      ["What does Rose-style moderation mean?", "It means common Telegram group controls such as captcha, rules, notes, filters, anti-link, anti-flood, warns, mute, kick, ban, report, and purge."],
      ["Does SlimeWire prevent every scam?", "No. Moderation and anti-scam tooling can reduce obvious abuse, but no bot can guarantee a scam-free group."],
      ["Why combine moderation with trading tools?", "Crypto groups need both safety and trading context; a combined workflow can be simpler for admins."]
    ],
    related: ["telegram-trading-bot-with-moderation", "security", "trust", "support"]
  },
  {
    slug: "telegram-token-buy-alert-bot",
    priority: "0.8",
    title: "Telegram Token Buy Alert Bot - Solana Buy Posts, Scans and Chart Links",
    description: "SlimeWire's Telegram token buy alert bot workflow helps Solana groups post buy context, scan tokens, link charts, share proof, and route users into the web terminal.",
    h1: "Telegram token buy alert bot",
    intro: "A token buy alert bot is useful when it gives the group more than a flashing buy message. SlimeWire connects buy context to token scans, chart links, proof, and terminal review.",
    cards: [
      ["Buy alert context", "Buy posts can be paired with token identity, group settings, and SlimeWire links."],
      ["Scan next", "Users can move from buy activity to token research instead of acting blind."],
      ["Chart review", "Dex chart and transaction handoff help users inspect the market."],
      ["Proof and PnL", "Receipts and proof pages make group claims easier to revisit."],
      ["Launch team fit", "Buy alerts pair well with launch pages, raid cards, and Telegram campaigns."],
      ["Risk disclosure", "Buy alerts are not proof of safety or future price movement."]
    ],
    faqs: [
      ["What is a Telegram token buy alert bot?", "It is a bot that posts token buy activity in Telegram, usually for a tracked coin or launch group."],
      ["Does SlimeWire support token buy alerts?", "SlimeWire includes buy tracking and alert-style workflows as part of its Telegram group tooling."],
      ["Can alerts link to SlimeWire charts?", "Yes. SlimeWire workflows are designed to hand users from Telegram into chart and terminal pages."],
      ["Are buy alerts enough to trade from?", "No. Users should still review liquidity, chart behavior, wallet prompts, and risk."]
    ],
    related: ["telegram-buy-tracker-bot", "telegram-buy-bot", "solana-token-alerts", "solana-dex-chart"]
  },
  {
    slug: "missrose-alternative-for-crypto-groups",
    priority: "0.78",
    title: "MissRose Alternative for Crypto Groups - Moderation plus Solana Tools",
    description: "SlimeWire documents a MissRose-style alternative for crypto groups that combines Telegram moderation, anti-scam settings, Solana scans, buy tracking, raid tools, proof, and terminal handoff.",
    h1: "MissRose alternative for crypto groups",
    intro: "Crypto groups often add MissRose or a Rose-style bot for moderation, then add separate trading bots for buy posts, scans, raids, and alerts. SlimeWire's long-tail angle is the combined workflow: moderation plus Solana group trading tools.",
    cards: [
      ["Rose-style controls", "Captcha, rules, welcome messages, notes, filters, anti-link, anti-flood, warns, mute, kick, ban, report, purge, and pin-style workflows."],
      ["Crypto-aware Shield", "Anti-scam, anti-impersonator, known-scammer, and suspicious link controls belong next to trading utilities."],
      ["Trading modules", "Buy Bot, Raid Bot, Scan Bot, alerts, launch workflows, proof links, and terminal handoff sit in the same SlimeWire ecosystem."],
      ["Cleaner groups", "Admins can reduce bot sprawl by using modular tools through one SlimeWire group setup."],
      ["Solana focus", "The product language is aimed at Solana memecoin rooms, launch teams, and Telegram communities."],
      ["Not affiliated", "SlimeWire is its own product; MissRose-style means familiar moderation patterns, not ownership or endorsement."]
    ],
    faqs: [
      ["Is SlimeWire a MissRose alternative?", "SlimeWire can cover Rose-style moderation patterns for crypto groups while also adding Solana scans, buy tracking, raids, proof, and terminal handoff."],
      ["Is SlimeWire affiliated with MissRose?", "No. SlimeWire is independent. The page uses MissRose alternative wording because many Telegram admins search that phrase."],
      ["Why would crypto groups want moderation and trading together?", "Trading groups need both safety and market workflow. Combining them can reduce clutter and make setup easier."],
      ["Does moderation guarantee a safe group?", "No. It can reduce obvious abuse, but admins and users still need caution."]
    ],
    related: ["telegram-trading-bot-with-moderation", "crypto-group-moderation-bot", "security", "trust"]
  },
  {
    slug: "rose-bot-alternative-crypto",
    priority: "0.78",
    title: "Rose Bot Alternative for Crypto - Telegram Moderation and Solana Group Tools",
    description: "SlimeWire is a Rose bot alternative angle for crypto groups that need moderation, anti-scam controls, Solana token scans, buy alerts, raid posts, proof, and terminal links.",
    h1: "Rose bot alternative for crypto",
    intro: "A normal Rose-style bot helps manage a Telegram group. A crypto group also needs token scans, buy context, raid posts, launch links, proof, and chart handoff. SlimeWire puts those ideas on one product map.",
    cards: [
      ["Moderation basics", "Rules, welcomes, notes, filters, anti-link, anti-flood, and admin actions keep the room manageable."],
      ["Crypto protection", "Scam, impersonator, phishing, and known-bad-actor controls matter more in token groups than normal chat rooms."],
      ["Token scans", "CA and ticker scan workflows help turn chat noise into useful token context."],
      ["Buy and raid modules", "Buy tracking and raid posts help launch teams and communities stay organized."],
      ["Web terminal", "SlimeWire's site adds charts, wallet context, positions, PnL, and proof outside the group feed."],
      ["All-in-one positioning", "This is the search angle Google was missing: group moderation plus trading utilities under one brand."]
    ],
    faqs: [
      ["What is a Rose bot alternative for crypto?", "It is a Telegram group bot workflow with Rose-style moderation plus crypto-specific scans, anti-scam settings, buy alerts, and launch tools."],
      ["Does SlimeWire copy Rose?", "No. SlimeWire is a separate Solana terminal and Telegram bot stack that documents familiar moderation-style workflows."],
      ["Can SlimeWire help token launch groups?", "Yes. SlimeWire pages describe launch alerts, raid cards, buy tracking, scans, proof, and terminal handoff."],
      ["Does a moderation bot remove trading risk?", "No. Moderation and scans are tools, not guarantees."]
    ],
    related: ["missrose-alternative-for-crypto-groups", "crypto-group-moderation-bot", "all-in-one-telegram-crypto-bot", "telegram-bot-setup"]
  },
  {
    slug: "telegram-anti-scam-bot-crypto",
    priority: "0.8",
    title: "Telegram Anti-Scam Bot for Crypto Groups - Shield, Scans and Moderation",
    description: "SlimeWire's Telegram anti-scam bot angle for crypto groups combines Shield-style protections, Rose-style moderation, Solana token scans, CA context, alerts, and terminal handoff.",
    h1: "Telegram anti-scam bot for crypto groups",
    intro: "Crypto Telegram groups get spam, impersonators, fake links, hidden scam text, suspicious CAs, and wallet-drainer bait. SlimeWire's anti-scam positioning ties moderation to token scans and the Solana trading terminal.",
    cards: [
      ["Scam link cleanup", "Anti-link and scam/phishing deletion settings can reduce obvious group attacks."],
      ["Impersonator checks", "Crypto groups need tools that watch for fake-admin and brand impersonation behavior."],
      ["Known bad actors", "Cross-group bad actor awareness helps groups react faster when patterns repeat."],
      ["Token scan context", "CA scans and SlimeShield-style cards give users a safer next step than trusting a raw pasted address."],
      ["Moderation actions", "Warn, mute, kick, ban, report, purge, and captcha workflows help admins respond."],
      ["Risk honesty", "No Telegram anti-scam bot can catch everything; user wallet caution still matters."]
    ],
    faqs: [
      ["What should a Telegram anti-scam bot do for crypto groups?", "It should reduce scam links, impersonators, spam, suspicious content, and provide token scan context when users discuss a coin."],
      ["Does SlimeWire include anti-scam group tools?", "SlimeWire documents Shield-style group protections alongside Telegram scans, moderation, buy tracking, and terminal handoff."],
      ["Can a bot guarantee no scams?", "No. It can reduce obvious abuse, but crypto groups still need active admins and careful users."],
      ["Why connect anti-scam tools to token scans?", "Because crypto scams often happen through token links, contract addresses, fake launches, and wallet-drainer prompts."]
    ],
    related: ["security", "crypto-group-moderation-bot", "telegram-token-scanner", "solana-rug-checker"]
  },
  {
    slug: "telegram-ca-scanner-bot",
    priority: "0.82",
    title: "Telegram CA Scanner Bot - Solana Contract Address Scans and Chart Handoff",
    description: "SlimeWire's Telegram CA scanner bot workflow scans Solana contract addresses, returns token context, links charts, supports group alerts, and hands users to the web terminal.",
    h1: "Telegram CA scanner bot",
    intro: "Crypto users often paste a CA before they paste a full token name. SlimeWire should rank for that shorthand too: CA scanner, contract scanner, token scanner, and Telegram scan bot.",
    cards: [
      ["CA detection", "A Telegram scanner should recognize contract addresses and avoid triggering on random text."],
      ["Token context", "Useful scans include symbol, name, market basics, links, risk notes, and chart handoff when available."],
      ["Group flow", "A scanner should work in a busy group without flooding or confusing users."],
      ["Quick review", "Chart links and terminal pages give traders more context before wallet actions."],
      ["Launch utility", "Launch teams and callers can use CA scans to route users into cleaner proof and chart pages."],
      ["SlimeWire fit", "@SlimeWiredBot supports the CA scanner search intent through token scan and terminal workflows."]
    ],
    faqs: [
      ["What does CA mean in crypto Telegram groups?", "CA usually means contract address. On Solana, users paste a token mint address for scanners and chart tools."],
      ["Is SlimeWire a Telegram CA scanner bot?", "SlimeWire includes Telegram token scan workflows and CA scanner pages connected to its Solana web terminal."],
      ["Can CA scans prove a token is safe?", "No. A scan can surface useful context, but users still need to review liquidity, holders, chart behavior, and wallet prompts."],
      ["Why link CA scans to a terminal?", "The terminal can show deeper charts, transactions, wallet context, positions, PnL, and proof pages."]
    ],
    related: ["telegram-token-scanner", "solana-token-scanner", "solana-token-research-tool", "telegram-token-buy-alert-bot"]
  },
  {
    slug: "tg-ca-scanner",
    priority: "0.8",
    title: "TG CA Scanner - Telegram Contract Address Scanner for Solana",
    description: "SlimeWire's TG CA scanner page targets Telegram shorthand searches for Solana contract address scanning, token context, chart links, group alerts, and terminal handoff.",
    h1: "TG CA scanner",
    intro: "People in crypto rooms type TG for Telegram and CA for contract address. This page gives search engines the exact shorthand while explaining the real SlimeWire workflow.",
    cards: [
      ["TG equals Telegram", "The page explicitly connects Telegram and TG language so shorthand searches find SlimeWire."],
      ["CA equals contract address", "Solana groups often paste token mints as CAs for scanner bots."],
      ["Scan Bot workflow", "A scanner can turn a CA into token context and SlimeWire chart handoff."],
      ["Risk notes", "Scans should warn when data is thin instead of pretending every token is clean."],
      ["Group-friendly", "The best scanner works without flooding and lets admins control modules."],
      ["Terminal handoff", "Charts, transactions, wallet state, and proof live better on the web terminal."]
    ],
    faqs: [
      ["What is a TG CA scanner?", "It is shorthand for a Telegram contract address scanner, usually used in crypto groups."],
      ["Does SlimeWire use both TG and Telegram wording?", "Yes. SlimeWire pages use both terms so users and AI systems can connect the shorthand."],
      ["Can a CA scanner catch every bad token?", "No. It can provide context, but it cannot guarantee safety."],
      ["What should happen after a CA scan?", "Users should review chart, liquidity, token context, warnings, and wallet prompts before acting."]
    ],
    related: ["telegram-ca-scanner-bot", "tg-crypto-bot", "solana-tg-bot", "solana-rug-checker"]
  },
  {
    slug: "memecoin-tg-bot",
    priority: "0.82",
    title: "Memecoin TG Bot - Telegram Scans, Buy Tracking, Raids and Solana Terminal",
    description: "SlimeWire is a memecoin TG bot workflow for Telegram groups that need Solana token scans, buy tracking, raid cards, launch alerts, proof, PnL, and web terminal handoff.",
    h1: "memecoin TG bot",
    intro: "Memecoin groups move fast and use shorthand. A memecoin TG bot needs to understand CAs, tickers, buy activity, raids, launches, and the need for a deeper chart and wallet-aware review.",
    cards: [
      ["Fresh market context", "Memecoin rooms need quick scans, alerts, and chart links when a token starts moving."],
      ["Buy tracking", "Visible buy activity can help communities understand current attention around a token."],
      ["Raid and launch flow", "Launch teams need Telegram cards, proof, and links that route users into the terminal."],
      ["Moderation", "Fast rooms need anti-spam, anti-link, anti-scam, and admin tools too."],
      ["Proof and PnL", "Receipts, call context, and PnL pages help communities review outcomes."],
      ["SlimeWire fit", "SlimeWire combines Telegram and web workflows for Solana memecoin traders."]
    ],
    faqs: [
      ["What is a memecoin TG bot?", "It is a Telegram bot used by memecoin groups for scans, alerts, buy tracking, raids, and community workflows."],
      ["Is SlimeWire focused on memecoins?", "Yes. SlimeWire is built around Solana memecoin terminal and Telegram bot workflows."],
      ["Can it help with launches?", "Yes. SlimeWire documents launch alerts, raid cards, proof, token scans, and terminal handoff."],
      ["Does it guarantee wins?", "No. Memecoin trading is risky, and software cannot guarantee results."]
    ],
    related: ["solana-memecoin-bot", "tg-trading-bot", "pump-fun-terminal", "solana-memecoin-trading-platform"]
  },
  {
    slug: "degen-telegram-bot",
    priority: "0.78",
    title: "Degen Telegram Bot - Solana Memecoin Scans, Raids, Buy Tracking and Proof",
    description: "SlimeWire's degen Telegram bot angle covers fast Solana memecoin scans, TG alerts, buy tracking, raid tools, launch context, proof cards, PnL, and terminal handoff.",
    h1: "degen Telegram bot",
    intro: "Degen searches are informal, but real users type them. SlimeWire can rank for that language while still presenting the product responsibly: fast tools, clear risk, and no profit guarantees.",
    cards: [
      ["Fast scans", "Degen rooms need fast CA scans and chart handoff when a token starts trending."],
      ["Buy tracking", "Buy posts and token activity can help show group momentum."],
      ["Raid tools", "Community posts and raid cards help route attention around launches."],
      ["Terminal review", "The web terminal gives deeper charts, txns, wallet context, and PnL."],
      ["Moderation", "High-speed rooms need moderation and anti-scam options to stay usable."],
      ["Responsible framing", "The page uses degen language without promising easy money."]
    ],
    faqs: [
      ["What is a degen Telegram bot?", "It is an informal term for a Telegram bot used by fast crypto trading communities for scans, alerts, buy tracking, raids, and token workflows."],
      ["Does SlimeWire use degen tools responsibly?", "SlimeWire documents fast workflows while keeping risk disclosures and wallet caution visible."],
      ["Can the bot trade automatically for users?", "Wallet and trade actions depend on user-selected flows and should never be treated as guaranteed or risk-free."],
      ["Why target this search term?", "Because real Solana memecoin users search casual phrases like degen bot, TG bot, CA scanner, and buy tracker."]
    ],
    related: ["memecoin-tg-bot", "solana-ai-trading-bot", "solana-alpha-alerts", "risk-disclosure"]
  },
  {
    slug: "pump-fun-buy-tracker-bot",
    priority: "0.8",
    title: "pump.fun Buy Tracker Bot - Telegram Buy Alerts, Launch Context and Charts",
    description: "SlimeWire's pump.fun buy tracker bot workflow connects fresh launch buy alerts, Telegram groups, token scans, chart handoff, proof pages, and Solana terminal review.",
    h1: "pump.fun buy tracker bot",
    intro: "Launch teams and memecoin rooms search for pump.fun buy trackers because visible buys create attention. SlimeWire connects that intent to a broader launch and terminal workflow.",
    cards: [
      ["Launch buy context", "Buy posts around fresh launch tokens can send users to scan and chart pages."],
      ["Telegram visibility", "Groups can see tracked activity where the community already lives."],
      ["Chart handoff", "Buy alerts should not be dead ends; users need chart and transaction context."],
      ["Proof links", "Proof and call pages help communities revisit launch performance."],
      ["Raid pairing", "Buy tracking pairs naturally with raid cards and launch alerts."],
      ["Risk reminder", "Buy activity can reverse fast, especially on fresh memecoins."]
    ],
    faqs: [
      ["What is a pump.fun buy tracker bot?", "It is a bot workflow that surfaces buy activity for pump.fun-style launches in Telegram."],
      ["Does SlimeWire support pump.fun launch workflows?", "Yes. SlimeWire has pump.fun scanner, launch alert, terminal, raid, and buy tracking pages."],
      ["Can buy tracking help launch visibility?", "It can help communities see activity, but it does not guarantee price movement."],
      ["Should users trade only from buy posts?", "No. Users should review chart, liquidity, risk notes, and wallet prompts."]
    ],
    related: ["pump-fun-terminal", "pump-fun-launch-platform", "telegram-buy-tracker-bot", "telegram-raid-bot-with-buy-tracker"]
  },
  {
    slug: "solana-launch-group-bot",
    priority: "0.82",
    title: "Solana Launch Group Bot - Telegram Launch Alerts, Raids, Buy Tracking and Proof",
    description: "SlimeWire's Solana launch group bot workflow helps launch teams use Telegram alerts, raid cards, buy tracking, token scans, proof links, and terminal handoff.",
    h1: "Solana launch group bot",
    intro: "Launch groups need coordinated attention, but the best workflow is not just hype. SlimeWire connects launch alerts, raids, buy tracking, scans, proof, and chart review into one ecosystem.",
    cards: [
      ["Launch alerts", "Announce and route launch attention into Telegram and SlimeWire pages."],
      ["Raid cards", "Use group-friendly raid posts with progress and links."],
      ["Buy tracking", "Surface buy context around the launch token when enabled."],
      ["CA scans", "Let users inspect token context instead of blindly following a post."],
      ["Proof pages", "Calls, receipts, and outcomes can be revisited after the launch."],
      ["Terminal handoff", "Charts, txns, wallet context, PnL, and launch tools live in the web terminal."]
    ],
    faqs: [
      ["What is a Solana launch group bot?", "It is a Telegram bot workflow for launch alerts, raids, buy tracking, token scans, proof links, and community coordination."],
      ["Can SlimeWire help launch teams?", "Yes. SlimeWire documents launch rooms, raid tools, buy tracking, scans, proof pages, and terminal handoff."],
      ["Does a launch bot guarantee buyers?", "No. It can improve visibility and workflow, but it cannot guarantee market results."],
      ["Why use one bot for launch workflows?", "One modular bot can keep launch alerts, scans, raids, and buy context easier to manage."]
    ],
    related: ["launch-on-slimewire-guide", "pump-fun-launch-platform", "solana-launch-bot", "telegram-raid-buy-bot"]
  },
  {
    slug: "telegram-community-trading-bot",
    priority: "0.8",
    title: "Telegram Community Trading Bot - Solana Groups, Scans, Alerts and Proof",
    description: "SlimeWire's Telegram community trading bot workflow supports Solana groups with scans, alerts, buy tracking, raids, moderation, proof, PnL, and terminal links.",
    h1: "Telegram community trading bot",
    intro: "Community trading is not just one wallet or one alert. It is the whole group loop: token discovery, scans, calls, buy activity, raids, moderation, proof, and a shared terminal destination.",
    cards: [
      ["Group scans", "Turn CAs and tickers into useful token context."],
      ["Community alerts", "Route launch, token, and proof updates into Telegram."],
      ["Buy and raid modules", "Track buy activity and coordinate social attention when admins enable modules."],
      ["Moderation", "Rose-style controls help keep the room usable while trading conversations move fast."],
      ["Proof and PnL", "Receipts and performance context make community claims easier to judge."],
      ["Terminal destination", "The web terminal gives users a deeper place to inspect charts and wallet state."]
    ],
    faqs: [
      ["What is a Telegram community trading bot?", "It is a bot workflow for trading communities that need scans, alerts, group tools, buy context, moderation, proof, and terminal links."],
      ["Is SlimeWire only for solo traders?", "No. SlimeWire also targets Telegram groups, launch teams, callers, and communities."],
      ["Can groups use only scanning and moderation?", "Yes. SlimeWire's group workflows are modular by design."],
      ["Does community activity guarantee a winner?", "No. Community signals are context, not certainty."]
    ],
    related: ["solana-trading-bot-for-groups", "crypto-telegram-group-bot", "all-in-one-telegram-crypto-bot", "proof-of-calls"]
  },
  {
    slug: "telegram-coin-launch-bot",
    priority: "0.8",
    title: "Telegram Coin Launch Bot - Solana Launch Alerts, Scans, Raids and Buy Context",
    description: "SlimeWire's Telegram coin launch bot workflow helps Solana teams connect launch alerts, token scans, raid cards, buy tracking, proof pages, and web terminal handoff.",
    h1: "Telegram coin launch bot",
    intro: "Launch teams often search for a Telegram coin launch bot, but the real need is a connected workflow: alert the room, scan the token, route to charts, track activity, and preserve proof.",
    cards: [
      ["Launch announcement", "Use Telegram to route early attention to the coin and the SlimeWire terminal."],
      ["Token scan", "CA scans give users a cleaner token context path."],
      ["Raid tools", "Raid cards can coordinate community attention without a separate one-off bot."],
      ["Buy context", "Buy tracking can sit beside launch alerts when enabled."],
      ["Proof trail", "Proof pages and receipts help teams show what happened."],
      ["Risk clarity", "Launch visibility is not a promise of price action."]
    ],
    faqs: [
      ["What is a Telegram coin launch bot?", "It is a bot workflow for announcing, coordinating, scanning, and routing attention around a crypto token launch."],
      ["Does SlimeWire support coin launch workflows?", "Yes. SlimeWire pages cover launch alerts, raid cards, scans, buy tracking, proof, and terminal handoff."],
      ["Can it be used with Solana launches?", "Yes. SlimeWire is focused on Solana memecoin and Telegram launch workflows."],
      ["Does it guarantee launch success?", "No. It organizes visibility and workflow, not market outcomes."]
    ],
    related: ["solana-launch-group-bot", "memecoin-launch-tools", "solana-launch-scanner", "pump-fun-launch-alerts"]
  }
];

function file(rel) {
  return path.join(ROOT, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(file(rel), text);
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
    if (lower === "solana") return "Solana";
    if (lower === "telegram") return "Telegram";
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function addBefore(text, marker, insertion) {
  if (!insertion) return text;
  if (!text.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return text.replace(marker, `${insertion}${marker}`);
}

function relatedLinks(page) {
  const links = [...new Set([...(page.related || []), "resources", "solana-telegram-bot"])];
  return links.map((slug) => `<a href="/${slug}">${esc(labelFromSlug(slug))}</a>`).join(" &middot; ");
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
          { "@type": "Thing", name: "Telegram crypto bot" },
          { "@type": "Thing", name: "TG trading bot" },
          { "@type": "Thing", name: "Solana group trading tools" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        name: "SlimeWire",
        alternateName: ["SlimeWire TG Bot", "@SlimeWiredBot"],
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web, Telegram",
        url: HOST,
        description: "SlimeWire combines a Solana web terminal with @SlimeWiredBot for Telegram scans, buy tracking, raids, group moderation, token research, alerts, proof, PnL, and launch workflows.",
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
<style>:root{--green:#72ff23;--bg:#050705;--muted:#8ea28a;--panel:#0a0f0b;--text:#e9ffe0;--border:rgba(114,255,35,.16)}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.55}a{color:#bbff63;text-decoration:none}.wrap{max-width:1080px;margin:auto;padding:0 20px}.btn{display:inline-block;padding:12px 18px;border-radius:12px;font-weight:800;border:1px solid var(--border)}.primary{background:linear-gradient(180deg,#bbff63,var(--green));color:#04120a;border:0}header{padding:66px 0 38px;text-align:center;background:radial-gradient(900px 360px at 50% -10%,rgba(114,255,35,.14),transparent)}h1{font-size:clamp(31px,6vw,52px);line-height:1.06;margin:0 0 14px}h1 span,h2 span{color:var(--green)}.sub{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:850px;margin:0 auto 24px}.cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}section{padding:38px 0;border-top:1px solid rgba(114,255,35,.08)}h2{font-size:clamp(22px,4vw,32px);margin:0 0 12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px}.card,details{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:18px}.card h3{margin:0 0 8px;font-size:17px}.card p,details p{margin:0;color:var(--muted);font-size:14px}.links{color:var(--muted);font-size:14px}.links a{font-weight:800}summary{cursor:pointer;font-weight:800;padding:6px 0}footer{padding:34px 0 56px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid rgba(114,255,35,.08)}footer a{margin:0 6px}@media(max-width:560px){.wrap{padding:0 14px}.btn{width:100%;text-align:center}}</style>
</head>
<body>
<header><div class="wrap"><h1><span>SlimeWire</span> ${esc(page.h1)}</h1><p class="sub">${esc(page.intro)}</p><div class="cta"><a class="btn primary" href="/">Open SlimeWire</a><a class="btn" href="https://t.me/SlimeWiredBot" target="_blank" rel="noopener noreferrer">Open @SlimeWiredBot</a></div></div></header>
<section><div class="wrap"><h2>What this search usually means</h2><div class="grid">${cards}</div></div></section>
<section><div class="wrap"><h2>Related SlimeWire pages</h2><p class="links">${relatedLinks(page)}</p></div></section>
<section><div class="wrap"><h2>FAQ</h2>${faqs}</div></section>
<footer><div class="wrap"><a href="/">Home</a> &middot; <a href="/resources">Resources</a> &middot; <a href="/all-in-one-telegram-crypto-bot">All-in-one bot</a> &middot; <a href="/tg-trading-bot">TG bot</a> &middot; <a href="/telegram-bot-setup">Setup</a> &middot; <a href="https://t.me/SlimeWiredBot" target="_blank" rel="noopener noreferrer">@SlimeWiredBot</a></div></footer>
</body>
</html>
`;
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

  const routeEntries = PAGES
    .filter((p) => !src.includes(`requestUrl.pathname === "/${p.slug}"`))
    .map((p) => `    if (request.method === "GET" && requestUrl.pathname === "/${p.slug}") {\n      await serveStaticHtmlPage(response, "${p.slug}.html");\n      return;\n    }\n`)
    .join("");
  src = addBefore(src, '    if (request.method === "GET" && requestUrl.pathname === "/features") {', routeEntries);
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
  feed = addBefore(feed, "</channel>", entries);
  write("web/public/feed.xml", feed);
}

function updateFeedJson() {
  const rel = "web/public/feed.json";
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
  let txt = read("web/public/llms.txt");
  const entries = PAGES
    .filter((p) => !txt.includes(`${HOST}/${p.slug}`))
    .map((p) => `- ${labelFromSlug(p.slug)}: ${HOST}/${p.slug}\n`)
    .join("");
  if (entries) {
    const marker = `- Telegram Crypto Trading Bot: ${HOST}/telegram-crypto-trading-bot`;
    if (!txt.includes(marker)) throw new Error(`Missing marker: ${marker}`);
    txt = txt.replace(marker, `${marker}\n${entries.trimEnd()}`);
  }
  const note = "- SlimeWire is discoverable for both Telegram and TG shorthand searches, including all-in-one Telegram crypto bot, TG trading bot, buy tracker bot, raid bot, scan bot, and crypto group moderation bot.\n";
  if (!txt.includes("TG shorthand searches")) {
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
  const existing = new Set((collection.hasPart || []).map((part) => part.url));
  collection.hasPart = collection.hasPart || [];
  for (const page of PAGES) {
    const url = `${HOST}/${page.slug}`;
    if (!existing.has(url)) collection.hasPart.push({ "@type": "WebPage", name: labelFromSlug(page.slug), url });
  }
  html = html.replace(scriptRe, `<script type="application/ld+json">${jsonScript(data)}</script>`);

  if (!html.includes("<h2>TG and all-in-one group bot pages</h2>")) {
    const cards = PAGES.map((p) => `<div class="card"><h3><a href="/${p.slug}">${esc(labelFromSlug(p.slug))}</a></h3><p>${esc(p.description)}</p></div>`).join("");
    const section = `<section><div class="wrap"><h2>TG and all-in-one group bot pages</h2><div class="grid">${cards}</div></div></section>\n`;
    html = addBefore(html, '<section><div class="wrap"><h2>Category authority pages</h2>', section);
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
  console.log(`Added ${PAGES.length} TG intent SEO pages.`);
}

main();
