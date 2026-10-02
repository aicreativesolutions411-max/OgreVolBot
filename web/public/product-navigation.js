(function(root){
  'use strict';
  function currentProduct(pathname, hash = '') {
    if (/^\/(?:launch(?:\/|$)|prelaunch(?:\/|$)|launch-os(?:\/|$)|launch-hq(?:\/|$)|trend-launch(?:\/|$)|partner-rewards(?:\/|$))/.test(pathname) || /^#launch(?:\/|$)/.test(hash)) return 'Launch';
    if (/^\/(?:wallet|cash)(?:\/|\.html|$)/.test(pathname)) return 'Wallet';
    if (/^\/(?:terminal|portal)(?:\/|$)/.test(pathname) || /^\/(?:index|gg)\.html$/.test(pathname)) return 'Terminal';
    return '';
  }
  root.SlimeProductNavigation = { currentProduct };
  if (!root.document) return;
  function update(){
    const active = currentProduct(root.location.pathname, root.location.hash);
    root.document.querySelectorAll('[data-sw-product-nav] > a').forEach(link => {
      if (link.textContent.trim() === active) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }
  update();
  root.addEventListener('hashchange', update);
})(typeof window === 'undefined' ? globalThis : window);
