// Static crawler-visible branding. Never depend on client-side JS for share cards.
// Explicit release query also bypasses a CDN-cached SPA fallback if a crawler
// requested a new filename before that release's assets finished propagating.
export const BRAND_MARK = '/assets/slimewire/brand/slime-mark-20260929.jpg?v=c005fdf5';
export const SHARE_IMAGE = 'https://slimewire.org/assets/slimewire/brand/slimewire-share-20260929.png?v=c005fdf5';
const DEFAULT_DESCRIPTION = 'One home. Every move. Wallet, terminal and launches with creator and community fee sharing.';
const pages = new Map([
  ['home.html', ['/', 'SlimeWire — One home. Every move.', DEFAULT_DESCRIPTION]],
  ['index.html', ['/terminal', 'SlimeWire Terminal — Charts & trading', 'Explore markets, research coins and review trades in the SlimeWire terminal.']],
  ['gg.html', ['/terminal', 'SlimeWire Terminal — Charts & trading', 'Explore markets, research coins and review trades in the SlimeWire terminal.']],
  ['launch.html', ['/launch', 'SlimeWire Launch — Create. Share. Track.', 'Launch a coin, choose your fee destinations and follow recorded payments with transaction receipts.']],
  ['bot.html', ['/bot', 'SlimeWire Telegram — Scan. Trade. Connect.', 'Scan coins, trade privately and run your community with the SlimeWire Telegram toolkit.']],
  ['help.html', ['/help', 'SlimeWire — Help & safety', 'Get started with SlimeWire. Understand wallets, fees, backups and safe recovery.']],
  ['contact.html', ['/contact', 'SlimeWire — Contact & collaborations', 'Have feedback, a project idea, or a game in the works? Talk directly with SlimeWire on Telegram about support and collaboration.']],
  ['launch-earnings.html', ['/launch/earnings', 'SlimeWire — Earnings & receipts', 'Follow recorded fees, pending rewards and per-coin payout receipts.']],
  ['launch-community.html', ['/launch/community', 'SlimeWire — Community rewards', 'Manage community fee sharing, partnerships and recorded rewards.']],
  ['slime-build.html', ['/launch/build', 'Slime Build — Ideas into evidence.', 'Plan milestones, share delivery evidence and follow recorded project funding. No escrow or automatic spending.']],
  ['launch-rehearsal.html', ['/launch/rehearsal', 'SlimeWire — Launch Rehearsal', 'Preview your coin and understand a hypothetical fee split before choosing a wallet or spending SOL.']],
  ['fun.html', ['/wallet', 'SlimeWallet — Your crypto. Your move.', 'Manage your SlimeWire wallets, review trades, fund wallets and track holdings.']],
]);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function applySiteBranding(html, fileName) {
  const name = String(fileName).replaceAll('\\', '/');
  if (!html.includes('</head>') || html.includes('data-slime-brand="20260929"')) return html;
  // Only replace known SlimeWire marks, not token avatars or Left4Sol artwork.
  let out = html.replace(/\/assets\/slimewire\/(?:svg\/slimewire-mark\.svg|png\/slimewire-mark(?:-64)?\.png)(?:\?v=[\w.-]+)?/g, BRAND_MARK);
  // Legacy guides share the same old login artwork. Replace only their social
  // tags; screenshots, game artwork and token-specific previews stay intact.
  const legacyCard = /<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*\/assets\/slimewire\/auto\/login-hero\.jpg[^>]*>/i.test(out);
  if (legacyCard) out = out.replace(/<meta\b[^>]*>/gi, tag => {
    if (/(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag)) return tag.replace(/https:\/\/(?:www\.)?slimewire\.org\/assets\/slimewire\/auto\/login-hero\.jpg/g, SHARE_IMAGE);
    if (/property=["']og:image:width["']/i.test(tag)) return tag.replace(/content=["']\d+["']/i, 'content="1734"');
    if (/property=["']og:image:height["']/i.test(tag)) return tag.replace(/content=["']\d+["']/i, 'content="907"');
    return tag;
  });
  out = out.replace(/<link\b[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/gi, tag => tag.includes(BRAND_MARK) ? tag.replace(/type=["'][^"']+["']/i, 'type="image/jpeg"') : tag);
  out = out.replace(/(<a\b[^>]*class="wordmark"[^>]*>)(slime<span>wire<\/span>)/g,
    `$1<img class="sw-brand-mark" src="${BRAND_MARK}" width="40" height="40" alt="">$2`);
  const page = pages.get(name);
  if (page) {
    const [route, title, description] = page;
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
      .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
    const tags = `<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://slimewire.org${route}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SlimeWire">
<meta property="og:url" content="https://slimewire.org${route}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SHARE_IMAGE}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1734">
<meta property="og:image:height" content="907">
<meta property="og:image:alt" content="SlimeWire. One home. Every move. Wallet, Terminal, Launch. Green slime logo on black.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SHARE_IMAGE}">
<meta name="twitter:image:alt" content="SlimeWire. One home. Every move. Wallet, Terminal, Launch. Green slime logo on black.">`;
    out = out.replace('</head>', tags + '\n</head>');
  }
  if (out === html) return html;
  return out.replace('</head>', '<link rel="stylesheet" href="/site-branding.css?v=20260929" data-slime-brand="20260929">\n</head>');
}
