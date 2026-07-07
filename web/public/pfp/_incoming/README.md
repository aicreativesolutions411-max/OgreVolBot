# 🧟 PFP intake — free asset factory (you generate, I process)

**Use your existing unlimited ChatGPT / Codex image gen. You click generate + save; everything else is automated.**

## How
1. Generate the prompts below in ChatGPT (or any tool). Download the PNGs.
2. Drop each file into the matching subfolder here:
   - `characters/` — full slime characters (kept as-is, cover-cropped to square)
   - `bg/` — square backgrounds (kept as-is)
   - `hat/` `prop/` `badge/` — **stickers on a solid WHITE background** (the white gets keyed out to transparent)
3. Tell me "process the intake" (or run `node scripts/pfp-intake.mjs`).
   → it keys/resizes each file, drops it into the real asset folder, and moves the original to `_done/`.
4. Then: `npm run build:web` → commit → deploy.

Re-running is safe (idempotent). Filenames don't matter — the **subfolder** decides the category.

---

## Prompts to run (paste into ChatGPT, save to the folder in the heading)

Every character shares this suffix — keep it: *"…neon-green slime, dark cartoon, thick bold outlines, dramatic lighting, head-and-shoulders PFP composition centered, funny degen meme style, ultra detailed, square 1:1."*

### → `characters/`  (KOL market-mood set, remaining)
1. a slime trader in denial with a forced smile staring at a red chart, "this is fine" coping energy, tiny flames
2. a slime trader gritting teeth holding a glowing green diamond through the pain, red chart behind, diamond-hands energy
3. a slime trader comically blown up by a red "LIQUIDATED" explosion, X eyes, dazed, rekt energy
4. a hopeful slime trader gazing at a green moon through a telescope, hopium energy, stars
5. a wild slime gorilla-trader smashing a green BUY button, bloodshot eyes, "aped in" energy
6. a panicking slime trader with paper hands frantically selling, sweating, "paper hands" energy
7. a zen slime trader meditating calmly while charts burn behind, "comfy / unbothered" energy
8. a defeated slime trader slumped over a laptop, hood up, "ngmi" energy, dim red glow
9. an over-leveraged slime trader at a slot machine pulling the lever, gambling degen energy, coins flying
10. a smug slime whale in a tiny crown counting a huge stack of cash, "made it" energy
11. a slime trader as exit liquidity, clown makeup, holding bags labeled with green slime, self-aware clown energy
12. a slime trader flexing a giant green candle like a sword, victorious, "up only" energy

### → `badge/`  (round enamel-pin sticker, **solid WHITE background**, thick bold border, glossy)
*"round BADGE sticker that says 'X' … centered on a solid flat pure white background, isolated, no shadow."*
BULLISH · RUGGED · NGMI · GMI · COPE · SER · FUD · HODL · GM · 100X · ALPHA · SEND IT

### → `prop/`  (glossy cartoon sticker, **solid WHITE background**, thick black outline, isolated)
1. a red crashing candlestick chart with a down arrow
2. a green pumping candlestick chart with an up arrow
3. a box of tissues (for the losses)
4. a tiny green lambo
5. a telescope pointed at a green moon
6. a briefcase overflowing with green cash
7. a cartoon bear (bearish) dripping green
8. a cartoon bull (bullish) dripping green

### → `bg/`  (square, no text, no characters)
1. abstract dark green matrix / data-rain over black
2. a green neon trading floor blurred bokeh
3. molten green circuitry texture on black
