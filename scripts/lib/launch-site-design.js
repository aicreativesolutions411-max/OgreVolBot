// Presentation only. No account, wallet, trading or launch state is changed here.
// Launch pages only. Wallet/Go/Cash and the main site's non-launch views retain
// their existing appearance. A build-time shell avoids runtime data requests.
const tools = new Set([
  'prelaunch.html', 'launch-os.html', 'launch-hq.html', 'trend-launch.html',
  'site-maker.html', 'social-kit.html', 'partner-rewards.html'
]);
const guides = new Set([
  'launch-on-slimewire-guide.html', 'launch-os-guide.html',
  'memecoin-launch-tools.html', 'slimewire-launch-promo-kit.html',
  'solana-memecoin-launch-checklist.html', 'pump-fun-launch-platform.html'
]);

export function designSurface(fileName) {
  const name = String(fileName).replaceAll('\\', '/');
  if (['index.html', 'gg.html'].includes(name)) return 'terminal';
  if (name === 'launch.html') return 'landing';
  if (tools.has(name)) return 'tool';
  if (guides.has(name)) return 'public';
  return null;
}

export const launchSiteNavigation = `
<nav class="sw-site-nav" data-sw-navigation aria-label="SlimeWire navigation">
  <a class="sw-site-brand" href="/launch" aria-label="SlimeWire launch home"><img src="/assets/slimewire/svg/slimewire-mark.svg" width="35" height="35" alt=""><span>slimewire <em>/ launch</em></span></a>
  <div class="sw-site-links" data-sw-product-nav role="navigation" aria-label="SlimeWire products">
    <a href="/wallet">Wallet</a>
    <a href="/terminal?desktop=1">Terminal</a>
    <a href="/launch" aria-current="page">Launch</a>
    <details class="sw-nav-more"><summary>More <span aria-hidden="true">⌄</span></summary><div class="sw-nav-menu">
      <a href="/launch">Explore launches</a>
      <a href="/terminal?from=fun#launch">Regular launch <span>All launch settings and bundle options</span></a>
      <a href="/launch/community">Community <span>Fee sharing, partnerships &amp; rewards</span></a>
      <a href="/launch#mine">My launches</a>
      <a href="/launch/earnings">My earnings <span>Developer, holder &amp; receiving-wallet payments</span></a>
      <a href="/terminal">Trading terminal <span>Charts, markets &amp; positions</span></a>
      <a href="/prelaunch">Prelaunch <span>Bring your community together</span></a>
      <a href="/launch-os">Launch tools <span>Brand, website &amp; community kit</span></a>
      <a href="/launch-on-slimewire-guide">Launch guide <span>Learn the launch workflow</span></a>
      <a href="/tg-guide">Telegram bot <span>Scans, trades &amp; group tools</span></a>
      <a href="/support">Help &amp; support</a>
    </div></details>
  </div>
</nav>`;

export function applyLaunchSiteDesign(html, fileName) {
  const surface = designSurface(fileName);
  if (!surface || /data-sw-design="launch(?:-workspace)?"/.test(html)) return html;
  let result = html.replace(/<html\b/, `<html data-sw-design="${surface === 'terminal' ? 'launch-workspace' : 'launch'}"`)
    .replace(/<body\b/, `<body data-sw-surface="${surface}"`)
    .replace('</head>', '<link rel="stylesheet" href="/launch-site.css?v=20260927a">\n</head>');
  if (surface === 'public' || surface === 'tool') {
    result = result.replace(/(<body\b[^>]*>)/, '$1' + launchSiteNavigation);
  } else if (surface === 'terminal') {
    // CSS reveals this only while #v-launch is active. The normal terminal
    // header and mobile bottom bar are otherwise completely unchanged.
    result = result.replace('<div id="app">', '<div id="app">\n<div class="sw-launch-navigation">' + launchSiteNavigation + '</div>');
  }
  return result;
}
