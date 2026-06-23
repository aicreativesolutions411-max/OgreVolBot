// Validates the in-place DOM reconcile used by the live feed (syncTrendingTable / syncCards in gg.html):
// reuse rows by key, reorder, insert new, remove gone, and the replaceWith-moved-node fix. Uses a tiny
// fake DOM so it runs with zero deps. Mirrors the exact algorithm shipped in gg.html.
let UID = 0;
class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this._kids = []; this.parent = null; this.uid = ++UID; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  get children() { return this._kids.slice(); }
  get firstChild() { return this._kids[0] || null; }
  get nextSibling() { if (!this.parent) return null; const i = this.parent._kids.indexOf(this); return this.parent._kids[i + 1] || null; }
  _detach(n) { const i = this._kids.indexOf(n); if (i >= 0) this._kids.splice(i, 1); }
  insertBefore(node, ref) {
    if (node.parent) node.parent._detach(node);
    node.parent = this;
    if (ref == null) { this._kids.push(node); return node; }
    const i = this._kids.indexOf(ref);
    this._kids.splice(i < 0 ? this._kids.length : i, 0, node);
    return node;
  }
  appendChild(node) { return this.insertBefore(node, null); }
  remove() { if (this.parent) this.parent._detach(this); this.parent = null; }
  replaceWith(n) { if (!this.parent) return; this.parent.insertBefore(n, this); this.remove(); }
  // innerHTML setter: parse ONE root element of form `<tag data-mint="..">` into a fake node.
  set innerHTML(html) {
    this._kids = [];
    const m = /^<([a-z]+)([^>]*)>/i.exec(html);
    if (!m) return;
    const node = new El(m[1]);
    const dm = /data-mint="([^"]*)"/.exec(m[2]); if (dm) node.attrs["data-mint"] = dm[1];
    node._html = html; node.parent = this; this._kids.push(node);
  }
}
// seed existing rows with the SAME sig an unchanged row would produce (v:0 → "sig:0"), so "unchanged"
// rows are correctly detected as reusable — mirrors steady state after the first sync has run once.
const mkTbody = (mints) => { const tb = new El("tbody"); for (const m of mints) { const tr = new El("tr"); tr.attrs["data-mint"] = m; tr.attrs["data-sig"] = "sig:0"; tb.appendChild(tr); } return tb; };
const ids = (tb) => tb._kids.map((n) => n.attrs["data-mint"]).join(",");

// ===== exact algorithm from gg.html syncCards (with the replaceWith fix) =====
function syncCards(container, rows, buildFn, sigFn) {
  if (!container) return false;
  const existing = new Map();
  for (const el of Array.from(container.children)) { const m = el.getAttribute && el.getAttribute("data-mint"); if (m) existing.set(m, el); }
  if (!existing.size) return false;
  const sg = sigFn; const tpl = new El("div"); let prev = null;
  rows.forEach((r, i) => {
    const sig = sg(r, i); let el = existing.get(r.mint);
    if (el) { if (el.getAttribute("data-sig") !== sig) { tpl.innerHTML = buildFn(r, i); const nn = tpl.firstChild; el.replaceWith(nn); el = nn; } existing.delete(r.mint); }
    else { tpl.innerHTML = buildFn(r, i); el = tpl.firstChild; }
    if (el && el.setAttribute) el.setAttribute("data-sig", sig);
    if (prev) { if (prev.nextSibling !== el) container.insertBefore(el, prev.nextSibling); }
    else if (container.firstChild !== el) container.insertBefore(el, container.firstChild);
    prev = el;
  });
  for (const el of existing.values()) el.remove();
  return true;
}

let pass = 0, fail = 0;
const check = (name, got, want) => { if (got === want) { pass++; } else { fail++; console.log(`FAIL ${name}: got "${got}" want "${want}"`); } };
const build = (r) => `<div class="card" data-mint="${r.mint}">x</div>`;
const sig = (r) => "sig:" + r.v;

// 1) same set, one value changed → order preserved, only changed row is a NEW node (rebuilt), rest reused.
{
  const tb = mkTbody(["A", "B", "C"]);
  const A = tb._kids[0], B = tb._kids[1], C = tb._kids[2];
  syncCards(tb, [{ mint: "A", v: 0 }, { mint: "B", v: 9 }, { mint: "C", v: 0 }], build, sig);
  check("1.order", ids(tb), "A,B,C");
  check("1.A-reused", tb._kids[0] === A, true);
  check("1.B-rebuilt", tb._kids[1] !== B, true);   // value changed → replaced
  check("1.C-reused", tb._kids[2] === C, true);
  check("1.count", tb._kids.length, 3);
}
// 2) reorder + insert + remove in one pass (B gone, D new, order C,A,D)
{
  const tb = mkTbody(["A", "B", "C"]);
  const A = tb._kids[0], C = tb._kids[2];
  syncCards(tb, [{ mint: "C", v: 0 }, { mint: "A", v: 0 }, { mint: "D", v: 0 }], build, sig);
  check("2.order", ids(tb), "C,A,D");
  check("2.A-reused", tb._kids.includes(A), true);
  check("2.C-reused", tb._kids[0] === C, true);
  check("2.count", tb._kids.length, 3);
  check("2.no-dupes", new Set(ids(tb).split(",")).size, 3);
}
// 3) steady (no change) → every node reused, zero rebuilds (the no-flicker guarantee)
{
  const tb = mkTbody(["A", "B", "C"]);
  const snap = tb._kids.slice();
  syncCards(tb, [{ mint: "A", v: 0 }, { mint: "B", v: 0 }, { mint: "C", v: 0 }].map((r) => ({ ...r })), build, (r) => "sig:0");
  check("3.all-reused", tb._kids.every((n, i) => n === snap[i]), true);
  check("3.order", ids(tb), "A,B,C");
}
// 4) full turnover (all new mints) → all replaced, correct order, no leftovers
{
  const tb = mkTbody(["A", "B"]);
  syncCards(tb, [{ mint: "X", v: 0 }, { mint: "Y", v: 0 }, { mint: "Z", v: 0 }], build, sig);
  check("4.order", ids(tb), "X,Y,Z");
  check("4.count", tb._kids.length, 3);
}
// 5) shrink (more existing than incoming) → extras removed
{
  const tb = mkTbody(["A", "B", "C", "D", "E"]);
  syncCards(tb, [{ mint: "B", v: 0 }, { mint: "D", v: 0 }], build, sig);
  check("5.order", ids(tb), "B,D");
  check("5.count", tb._kids.length, 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
