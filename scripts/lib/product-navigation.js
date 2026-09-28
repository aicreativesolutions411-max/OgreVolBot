// Static, presentation-only product navigation. No balances or account preloads.
const surfaces = new Map([
  ['index.html', 'terminal'], ['gg.html', 'terminal'], ['fun.html', 'wallet'],
  ['cash/index.html', 'wallet'], ['launch.html', 'launch'], ['launch-community.html', 'launch']
]);

export function productNavigation(active = '') {
  const link = (key, href, label) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<nav class="sw-product-nav" data-sw-product-nav aria-label="SlimeWire products">${link('wallet', '/wallet', 'Wallet')}${link('terminal', '/terminal?desktop=1', 'Terminal')}${link('launch', '/launch', 'Launch')}</nav>`;
}

export function applyProductNavigation(html, fileName) {
  if (html.includes('data-sw-products-ready')) return html;
  const name = String(fileName).replaceAll('\\', '/');
  const surface = surfaces.get(name);
  let result = html;
  if (surface) {
    const strip = `<div class="sw-product-strip" data-sw-product-surface="${surface}">${productNavigation(surface === 'wallet' && name === 'fun.html' ? '' : surface)}</div>`;
    if (surface === 'terminal') result = result.replace('<div id="app">', '<div id="app">' + strip);
    else if (name === 'fun.html') result = result.replace(/(<\/header>\s*)(<main class="fun-main">)/, '$1' + strip + '$2');
    else if (name === 'cash/index.html') result = result.replace(/(<\/header>\s*)(<!-- CASH TAB -->)/, '$1' + strip + '$2');
    else result = result.replace(/(<div class="shell">)/, '$1' + strip);
    if (result === html) throw new Error('Product navigation insertion point missing: ' + fileName);
  }
  if (!result.includes('data-sw-product-nav')) return html;
  return result.replace('</head>', '<link rel="stylesheet" href="/product-navigation.css?v=20260928a">\n<script src="/product-navigation.js?v=20260928a" defer data-sw-products-ready></script>\n</head>');
}
