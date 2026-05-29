import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "preview-layouts", "style2-pages");

const palette = {
  bg: "#020702",
  panel: "#071309",
  panel2: "#0b1b0d",
  panel3: "#102314",
  line: "#255f25",
  lineSoft: "#163a18",
  text: "#f3ffe9",
  muted: "#9db596",
  green: "#a7ff4f",
  green2: "#39ff65",
  red: "#ff5c8a",
  amber: "#ffd166",
  blue: "#5de2ff"
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(width, height, body) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="slime" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#d8ff68"/>
      <stop offset=".45" stop-color="#50ff54"/>
      <stop offset="1" stop-color="#0dbb32"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".8">
      <stop offset="0" stop-color="#56ff45" stop-opacity=".35"/>
      <stop offset=".55" stop-color="#113d18" stop-opacity=".20"/>
      <stop offset="1" stop-color="#020702" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      text { font-family: Inter, Arial, sans-serif; letter-spacing: 0; }
      .title { fill: ${palette.text}; font-weight: 900; font-size: 42px; }
      .sub { fill: ${palette.muted}; font-size: 17px; }
      .h { fill: ${palette.text}; font-size: 20px; font-weight: 800; }
      .label { fill: ${palette.muted}; font-size: 13px; font-weight: 800; text-transform: uppercase; }
      .body { fill: ${palette.text}; font-size: 18px; font-weight: 700; }
      .small { fill: ${palette.muted}; font-size: 13px; }
      .green { fill: ${palette.green}; }
      .red { fill: ${palette.red}; }
      .chipText { fill: ${palette.text}; font-size: 14px; font-weight: 800; }
      .buttonText { fill: #061006; font-size: 14px; font-weight: 900; }
      .buttonTextDark { fill: ${palette.text}; font-size: 14px; font-weight: 900; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.18)}" r="${Math.round(width * 0.38)}" fill="url(#glow)"/>
  ${body}
</svg>`;
}

function roundRect(x, y, w, h, r = 16, fill = palette.panel, stroke = palette.lineSoft, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
}

function text(value, x, y, cls = "body", anchor = "start") {
  return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function chip(value, x, y, w, active = false) {
  return `
    ${roundRect(x, y, w, 34, 17, active ? "url(#slime)" : "#0b1a0c", active ? "#a7ff4f" : palette.lineSoft)}
    ${text(value, x + w / 2, y + 23, active ? "buttonText" : "chipText", "middle")}
  `;
}

function button(value, x, y, w, active = false) {
  return `
    ${roundRect(x, y, w, 36, 18, active ? "url(#slime)" : "#142218", active ? "#a7ff4f" : palette.line)}
    ${text(value, x + w / 2, y + 24, active ? "buttonText" : "buttonTextDark", "middle")}
  `;
}

function tokenAvatar(x, y, label, color = "#47ff54") {
  return `
    <circle cx="${x + 26}" cy="${y + 26}" r="26" fill="#111b10" stroke="${color}" stroke-width="2"/>
    <circle cx="${x + 26}" cy="${y + 26}" r="16" fill="${color}" opacity=".24"/>
    ${text(label.slice(0, 2), x + 26, y + 33, "chipText", "middle")}
  `;
}

function iconLink(label, x, y, color = palette.green) {
  return `
    <circle cx="${x}" cy="${y}" r="13" fill="#132015" stroke="${color}" stroke-width="1"/>
    <text x="${x}" y="${y + 5}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="900" text-anchor="middle">${esc(label)}</text>
  `;
}

const tokenRows = [
  ["SLIME", "Slimewire", "8s", "$18.4K", "+42.1%", "$22K", "144 / 82", "$41K", "SM"],
  ["PUMP", "PumpSnipe", "31s", "$12.8K", "+18.7%", "$9K", "91 / 44", "$23K", "PU"],
  ["WIRE", "Fresh mover", "2m", "$38.1K", "+63.5%", "$64K", "388 / 177", "$121K", "WI"],
  ["OGRE", "Narrative", "7m", "$55.0K", "+24.8%", "$86K", "528 / 210", "$218K", "OG"],
  ["MINT", "Low MC pick", "18m", "$9.6K", "+31.2%", "$14K", "88 / 29", "$19K", "MI"],
  ["ACE", "KOL signal", "41m", "$72.5K", "+12.4%", "$105K", "781 / 390", "$344K", "AC"]
];

function tokenTablePreview() {
  const width = 1440;
  const height = 920;
  let body = "";
  body += text("Compact Signal Rows", 56, 70, "title");
  body += text("Coin PFP, copyable CA, chart links, share links, Trade, Bundle, and Watch stay in one fast row.", 58, 102, "sub");
  body += chip("Trade Preset: Fast 25/8", 58, 132, 210, true);
  body += chip("Bundle Preset: 6 Wallet Split", 282, 132, 230);
  body += chip("Watchlist Auto Refresh", 528, 132, 210);
  body += button("Refresh Picks", 1195, 126, 180, true);

  body += roundRect(40, 190, 1360, 660, 20, "#070d0b", "#295f24");
  const headers = [["Pair Info", 58], ["Created", 420], ["Current Liq", 560], ["FDV / MC", 725], ["Txns", 870], ["Volume", 1010], ["Action", 1190]];
  headers.forEach(([label, x]) => { body += text(label, x, 232, "label"); });
  body += `<line x1="40" y1="252" x2="1400" y2="252" stroke="${palette.lineSoft}"/>`;
  let y = 278;
  tokenRows.forEach((row, index) => {
    const shade = index % 2 ? "#090f12" : "#0a120c";
    body += `<rect x="42" y="${y - 18}" width="1356" height="86" fill="${shade}" opacity=".95"/>`;
    if (index === 2) body += `<rect x="42" y="${y - 18}" width="1356" height="86" fill="#20213b" opacity=".50"/>`;
    body += tokenAvatar(58, y - 2, row[8], index % 2 ? palette.blue : palette.green);
    body += text(`$${row[0]} / SOL`, 124, y + 18, "body");
    body += text(`${row[1]} - 7xK9...pUMP`, 124, y + 42, "small");
    body += iconLink("D", 126, y + 67);
    body += iconLink("P", 158, y + 67, palette.amber);
    body += iconLink("X", 190, y + 67, palette.blue);
    body += iconLink("W", 222, y + 67, palette.green2);
    body += iconLink("S", 254, y + 67, palette.green);
    body += iconLink("TG", 288, y + 67, palette.blue);
    body += text(row[2], 420, y + 25, "body");
    body += text("fresh", 420, y + 47, "small");
    body += text(row[3], 560, y + 25, "body");
    body += text(row[4], 560, y + 47, "small green");
    body += text(row[5], 725, y + 25, "body");
    body += text(index < 2 ? "Pump early" : "signal", 725, y + 47, "small");
    body += text(row[6], 870, y + 25, "body");
    body += text("buys / sells", 870, y + 47, "small");
    body += text(row[7], 1010, y + 25, "body");
    body += text("1h volume", 1010, y + 47, "small");
    body += button("Trade", 1175, y, 72, true);
    body += button("Bundle", 1255, y, 80);
    body += button("Watch", 1345, y, 70);
    y += 92;
  });
  body += roundRect(358, 796, 724, 74, 18, "rgba(15,20,18,.92)", "#294c2b", "filter=\"url(#softGlow)\"");
  body += text("Verified CA", 410, 828, "body");
  body += text("Locked Liquidity", 615, 828, "body");
  body += text("Not Honeypot", 860, 828, "body");
  body += text("Fast preset buy", 410, 854, "small");
  body += text("Current liquidity only", 615, 854, "small");
  body += text("No row-level volume clutter", 860, 854, "small");
  return svg(width, height, body);
}

function kolPreview() {
  const width = 1440;
  const height = 920;
  let body = "";
  body += text("KOL Tracker + SlimeWire Traders", 56, 70, "title");
  body += text("KOL rows use the same compact scanner layout, with opt-in SlimeWire trader cards below.", 58, 102, "sub");
  body += chip("Hot Buys", 58, 132, 120, true);
  body += chip("Top KOLs", 190, 132, 120);
  body += chip("Consistent", 322, 132, 140);
  body += chip("Fresh", 474, 132, 100);
  body += chip("Top SlimeWire", 586, 132, 170);
  body += button("Refresh", 1240, 126, 135, true);

  body += roundRect(40, 190, 1360, 420, 20, "#070d0b", "#295f24");
  [["KOL / Token", 58], ["Age", 420], ["Current Liq", 560], ["MC", 725], ["Wallet", 870], ["Volume", 1010], ["Action", 1190]].forEach(([label, x]) => { body += text(label, x, 232, "label"); });
  body += `<line x1="40" y1="252" x2="1400" y2="252" stroke="${palette.lineSoft}"/>`;
  const kolRows = [
    ["MOON", "Alpha caller", "4m", "$48K", "+35%", "$71K", "9Fv...3kD", "$86K", "MO"],
    ["VOLT", "Wallet cluster", "11m", "$24K", "+22%", "$36K", "C2q...Pp9", "$43K", "VO"],
    ["FANG", "Fresh KOL buy", "28m", "$88K", "+18%", "$142K", "8Ld...xY2", "$190K", "FA"]
  ];
  let y = 278;
  kolRows.forEach((row, index) => {
    body += `<rect x="42" y="${y - 18}" width="1356" height="86" fill="${index % 2 ? "#090f12" : "#0a120c"}"/>`;
    body += tokenAvatar(58, y - 2, row[8], index === 0 ? palette.green : palette.blue);
    body += text(`$${row[0]}`, 124, y + 18, "body");
    body += text(`${row[1]} - CA 6mS...pump`, 124, y + 42, "small");
    body += iconLink("D", 126, y + 67);
    body += iconLink("P", 158, y + 67, palette.amber);
    body += iconLink("X", 190, y + 67, palette.blue);
    body += iconLink("S", 222, y + 67);
    body += text(row[2], 420, y + 25, "body");
    body += text("KOL signal", 420, y + 47, "small");
    body += text(row[3], 560, y + 25, "body");
    body += text(row[4], 560, y + 47, "small green");
    body += text(row[5], 725, y + 25, "body");
    body += text("buy pressure", 725, y + 47, "small");
    body += text(row[6], 870, y + 25, "body");
    body += text("copy link", 870, y + 47, "small");
    body += text(row[7], 1010, y + 25, "body");
    body += text("recent flow", 1010, y + 47, "small");
    body += button("Trade", 1175, y, 72, true);
    body += button("Bundle", 1255, y, 80);
    body += button("Watch", 1345, y, 70);
    y += 92;
  });

  body += text("Top SlimeWire Traders", 58, 672, "h");
  const cards = [
    ["SlimeAce", "+14.8 SOL", "68% win", "24 trades"],
    ["WireFlip", "+8.2 SOL", "61% win", "19 trades"],
    ["GreenTape", "+5.6 SOL", "55% win", "12 trades"]
  ];
  cards.forEach((card, index) => {
    const x = 58 + index * 455;
    body += roundRect(x, 700, 410, 130, 18, palette.panel2, palette.line);
    body += tokenAvatar(x + 18, 724, card[0].slice(0, 2), palette.green);
    body += text(card[0], x + 92, 744, "h");
    body += text(card[1], x + 92, 776, "body green");
    body += text(`${card[2]} - ${card[3]}`, x + 92, 806, "small");
    body += button("View", x + 296, 750, 82, true);
  });
  return svg(width, height, body);
}

function profilePreview() {
  const width = 1440;
  const height = 920;
  let body = "";
  body += text("Profile, Presets, and Referrals", 56, 70, "title");
  body += text("Saved login keeps profile, X handle, PFP, watched tokens, presets, and referral wallet after Render deploys.", 58, 102, "sub");
  body += roundRect(50, 145, 420, 300, 22, palette.panel, palette.line);
  body += tokenAvatar(86, 186, "SW", palette.green);
  body += text("SlimeWire Account", 156, 208, "h");
  body += text("Wallet connected: 8HT...Wdnb", 156, 238, "small");
  body += button("Connect Wallet", 82, 292, 160, true);
  body += button("Upload PFP", 258, 292, 140);
  body += button("Connect X", 82, 344, 160);
  body += button("Open Wallets", 258, 344, 140);
  body += text("Username", 82, 410, "label");
  body += roundRect(172, 388, 250, 40, 10, "#0f1c12", palette.lineSoft);
  body += text("slimewire_trader", 190, 414, "small");

  body += roundRect(510, 145, 420, 300, 22, palette.panel, palette.line);
  body += text("Trade Presets", 542, 195, "h");
  body += text("One-wallet quick buys from rows", 542, 224, "small");
  body += chip("Fast Scalp 0.1 SOL", 542, 255, 200, true);
  body += chip("Moonbag 0.5 SOL", 542, 302, 185);
  body += chip("Custom / Manual", 542, 349, 175);
  body += text("TP 25% | SL 8% | Sell 100% | Slip 4%", 542, 410, "small");

  body += roundRect(970, 145, 420, 300, 22, palette.panel, palette.line);
  body += text("Bundle Presets", 1002, 195, "h");
  body += text("Multi-wallet buys without reselecting every row", 1002, 224, "small");
  body += chip("6 Wallet Split", 1002, 255, 170, true);
  body += chip("Low MC 3 Wallet", 1002, 302, 185);
  body += chip("Custom / Manual", 1002, 349, 175);
  body += text("Per-wallet TP/SL targets can be saved", 1002, 410, "small");

  body += roundRect(50, 500, 650, 250, 22, palette.panel2, palette.line);
  body += text("Referral Settings", 82, 550, "h");
  body += text("Share link: slimewire.org?ref=SLIME123", 82, 586, "body");
  body += text("Fee split: 0.15% to referrer, 0.50% to platform", 82, 620, "small");
  body += roundRect(82, 648, 420, 42, 10, "#0f1c12", palette.lineSoft);
  body += text("Referral payout wallet", 102, 676, "small");
  body += button("Copy Link", 520, 648, 120, true);
  body += button("Share X", 82, 705, 120);
  body += button("Share TG", 218, 705, 120);
  body += button("Opt In Board", 354, 705, 150);

  body += roundRect(740, 500, 650, 250, 22, palette.panel2, palette.line);
  body += text("Watchlist", 772, 550, "h");
  body += text("Saved tokens auto-refresh while this tab is open.", 772, 586, "small");
  body += chip("$WIRE", 772, 622, 110, true);
  body += chip("$MOON", 896, 622, 118);
  body += chip("$SLIME", 1028, 622, 120);
  body += text("Rows keep DEX, Pump, X, Web, share, Trade, Bundle, and Remove controls.", 772, 690, "small");
  return svg(width, height, body);
}

function mobilePreview() {
  const width = 720;
  const height = 1280;
  let body = "";
  body += text("SlimeWire", 40, 70, "title");
  body += text("Mobile compact flow", 42, 105, "sub");
  body += button("Create Wallet", 40, 135, 145, true);
  body += button("Connect", 198, 135, 105);
  body += button("Profile", 316, 135, 95);
  body += button("Refresh", 424, 135, 100);
  body += roundRect(36, 202, 648, 76, 18, palette.panel2, palette.line);
  body += text("Wallets", 68, 234, "label");
  body += text("3", 68, 262, "body green");
  body += text("Total SOL", 218, 234, "label");
  body += text("2.8401", 218, 262, "body");
  body += text("Positions", 398, 234, "label");
  body += text("7", 398, 262, "body");
  body += text("PnL", 548, 234, "label");
  body += text("+1.72", 548, 262, "body green");
  const tabs = ["Trade", "Bundle", "Volume", "Live", "KOL", "Watch"];
  tabs.forEach((tab, index) => {
    const x = 40 + (index % 3) * 208;
    const y = 315 + Math.floor(index / 3) * 48;
    body += chip(tab, x, y, 186, index === 3);
  });
  body += text("Live Pairs", 40, 460, "h");
  body += text("Auto-refreshes while this screen is open", 40, 490, "small");
  let y = 522;
  tokenRows.slice(0, 5).forEach((row, index) => {
    body += roundRect(36, y, 648, 126, 18, index % 2 ? "#090f12" : "#0a120c", palette.lineSoft);
    body += tokenAvatar(58, y + 24, row[8], index % 2 ? palette.blue : palette.green);
    body += text(`$${row[0]} / SOL`, 124, y + 42, "body");
    body += text(`${row[2]} - Liq ${row[3]} - MC ${row[5]}`, 124, y + 72, "small");
    body += iconLink("D", 126, y + 100);
    body += iconLink("P", 158, y + 100, palette.amber);
    body += iconLink("X", 190, y + 100, palette.blue);
    body += iconLink("S", 222, y + 100);
    body += button("Trade", 438, y + 28, 90, true);
    body += button("Bundle", 540, y + 28, 104);
    body += button("Watch", 438, y + 76, 206);
    y += 142;
  });
  return svg(width, height, body);
}

async function writePreview(name, markup) {
  const target = path.join(OUT_DIR, name);
  await sharp(Buffer.from(markup)).png().toFile(target);
  console.log(target);
}

await fs.mkdir(OUT_DIR, { recursive: true });
await writePreview("style2-compact-token-list.png", tokenTablePreview());
await writePreview("style2-kol-traders-flow.png", kolPreview());
await writePreview("style2-profile-referrals-presets.png", profilePreview());
await writePreview("style2-mobile-compact-flow.png", mobilePreview());
