/* SlimeWire procedural clan emblem.
 * Deterministic SVG badge generated from a clan tag — same name always yields
 * the same colours + shape, so a crew has a stable identity everywhere it shows
 * (crews board, profile, raids). No assets, no network. window.clanEmblem(name, size).
 */
(function () {
  "use strict";
  function hash(str) {
    let h = 2166136261 >>> 0;
    const s = String(str || "").toUpperCase();
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }
  // Swamp-leaning duo-tones (bright -> deep) for the badge gradient.
  var PALETTES = [
    ["#72ff3b", "#1c7d2f"], ["#5fe08a", "#147d4a"], ["#5ab0ff", "#1b4f8a"],
    ["#a98bff", "#5a2fb0"], ["#ffcf5a", "#a87413"], ["#ff6b6b", "#a82626"],
    ["#3fe0d0", "#147d72"], ["#ff9f5a", "#a85a13"], ["#ff7bd0", "#a8267e"]
  ];
  var SHAPES = ["shield", "hex", "diamond", "round"];
  function shapePath(shape) {
    if (shape === "shield") return '<path d="M32 4 L58 14 V32 C58 46 46 56 32 60 C18 56 6 46 6 32 V14 Z"';
    if (shape === "hex") return '<path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z"';
    if (shape === "diamond") return '<path d="M32 3 L61 32 L32 61 L3 32 Z"';
    return '<circle cx="32" cy="32" r="29"';
  }
  function initialsOf(name) {
    var clean = String(name || "").replace(/[^A-Za-z0-9]/g, "");
    if (!clean) return "?";
    return clean.slice(0, clean.length >= 2 ? 2 : 1).toUpperCase();
  }
  function clanEmblem(name, size) {
    size = size || 44;
    var h = hash(name);
    var pal = PALETTES[h % PALETTES.length];
    var shape = SHAPES[(h >>> 6) % SHAPES.length];
    var initials = initialsOf(name);
    var id = "ce" + (h % 999983);
    var fontSize = initials.length > 1 ? 22 : 30;
    // A small crest star seeded by the hash gives each badge a touch of flair.
    var star = (h >>> 11) % 2 === 0
      ? '<path d="M32 8.5 l1.4 2.9 3.2.3 -2.4 2.1 .7 3.1 -2.9-1.6 -2.9 1.6 .7-3.1 -2.4-2.1 3.2-.3 z" fill="rgba(255,255,255,0.78)"/>'
      : "";
    var body = shapePath(shape);
    return (
      '<svg class="clan-emblem" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + String(name || "crew") + ' emblem">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="' + pal[1] + '"/></linearGradient></defs>' +
      body + ' fill="url(#' + id + ')" stroke="rgba(255,255,255,0.34)" stroke-width="2.5"/>' +
      body + ' fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1" transform="scale(0.86) translate(5.2 5.2)"/>' +
      star +
      '<text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="' + fontSize + '" fill="#ffffff" paint-order="stroke" stroke="rgba(0,0,0,0.28)" stroke-width="1.2">' + initials + "</text>" +
      "</svg>"
    );
  }
  window.clanEmblem = clanEmblem;
})();
