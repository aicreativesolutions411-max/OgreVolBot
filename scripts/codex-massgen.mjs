#!/usr/bin/env node
// 🏭 CODEX MASS-GEN — drive the local OpenAI Codex CLI through a big prompt bank to build a huge PFP/asset
// database, FREE (bills the ChatGPT Pro sub, not MCP credits). Resumable: skips any target file that already
// exists, so it survives Codex rate-limits/resets — just re-run and it continues. Runs sequentially (one Codex
// instance at a time to avoid ~/.codex state conflicts). Output lands in web/public/pfp/_incoming/<category>/;
// process it with scripts/pfp-intake.mjs afterwards.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const INBOX = path.join(REPO, "web", "public", "pfp", "_incoming");
const LOG = path.join(REPO, "_massgen.log");
function log(m) { const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`; console.log(line); try { fs.appendFileSync(LOG, line + "\n"); } catch {} }

// Locate codex.exe (hash dir changes across updates)
function findCodex() {
  const base = path.join(process.env.USERPROFILE || "C:\\Users\\USER", "AppData", "Local", "OpenAI", "Codex", "bin");
  for (const d of (fs.existsSync(base) ? fs.readdirSync(base) : [])) {
    const p = path.join(base, d, "codex.exe");
    if (fs.existsSync(p)) return p;
  }
  throw new Error("codex.exe not found under " + base);
}
const CODEX = findCodex();

const CHAR_STYLE = "made of neon-green slime, exaggerated cartoon COMEDY, funny relatable dark-degen crypto meme humor, thick bold black outlines, dramatic lighting, head-and-shoulders PFP composition centered, ultra detailed, square 1:1, opaque full background, leave a little empty space in the bottom-right corner";
// COMEDY gag set — the owner wants the DB to skew FUNNY (big mix of relatable degen comedy). These are the
// larger portion; the monster/archetype list below keeps the badass variety in the mix.
const gags = [
  "a slime degen down 99 percent still holding with a shaky thumbs up", "a slime degen checking his phone under the dinner table",
  "a slime degen explaining a chart to his unimpressed cat", "a slime degen asleep face-down on a keyboard drooling, red chart on screen",
  "a slime degen with a not-financial-advice tattoo", "a slime degen frozen mid-panic, phone showing minus 100 percent",
  "a slime degen at a support group saying hi my name is anon and I aped", "a slime degen with six phones all showing red candles",
  "a slime degen doing frantic pushups to cope with a red day", "a slime degen kissing his hardware wallet goodnight",
  "a slime degen with a few-understand smug face", "a slime degen who turned 100k into 12 dollars laughing maniacally",
  "a slime degen with a thousand-yard stare after a rug", "a slime degen whose diamond hands literally turned to stone",
  "a slime degen who sold everything then bought back higher, facepalming", "a slime degen building a fort out of empty energy drink cans",
  "a slime degen who bought the top wearing a dunce cap", "a slime degen ghost still checking charts in the afterlife",
  "a slime degen doing a rain dance for green candles", "a slime degen wojak-style crying grin",
  "a slime degen counting imaginary gains on his fingers", "a slime degen weeping over a 1000x screenshot he did not take",
  "a slime degen zen master who has transcended all losses, faint glow", "a slime degen with laser eyes that fizzled out into smoke",
  "a slime degen who named his kid after a memecoin ticker", "a slime degen setting his coin ticker as a forehead sticker",
  "a slime degen flexing a screenshot of unrealized gains", "a slime degen holding a bag literally labeled RUG",
  "a slime degen sweating while hovering the sell button", "a slime degen with hopium goggles seeing green everywhere"
].map((a, i) => ({ cat: "characters", name: `mg_g${String(i + 1).padStart(3, "0")}`, transparent: false,
  prompt: `SlimeWire degen mascot character: ${a}, ${CHAR_STYLE}.` }));

// ---- PROMPT BANK ------------------------------------------------------------------------------------
const characters = [
  // monster / creature archetypes
  "slime demon warlord with glowing sigils", "toxic ogre brute with tusks", "cyber slime skull with circuits",
  "grim reaper of slime with a dollar scythe", "slime vampire lord with fangs", "slime werewolf mid-howl",
  "slime kraken with tentacles", "slime dragon breathing green fire", "slime gargoyle perched", "slime lich with a staff",
  "slime minotaur with a battle axe", "slime cyclops with one glowing eye", "slime hydra three heads", "slime phoenix reborn in goo",
  "slime golem of cracked stone", "slime yeti frost-covered", "slime medusa with snake hair", "slime banshee screaming",
  "slime frankenstein monster stitched", "slime mummy wrapped in bandages", "slime swamp thing overgrown", "slime chupacabra feral",
  // trader / KOL personas
  "slime crypto whale in a suit smoking a cigar", "slime day-trader with six monitors", "slime chart analyst with a laser pointer",
  "slime hedge fund villain", "slime influencer streaming with a ring light", "slime venture capitalist smug",
  "slime quant nerd with glasses", "slime market maker puppeteer", "slime gm poster with coffee", "slime alpha caller with a megaphone",
  // professions / roles
  "slime samurai with a katana", "slime ninja assassin in shadow", "slime pirate captain with gold teeth", "slime astronaut cracked helmet",
  "slime knight in green armor", "slime wizard casting spells", "slime gladiator in the arena", "slime cowboy gunslinger",
  "slime viking raider", "slime boxer with gloves up", "slime chef with a cleaver", "slime mechanic covered in oil",
  "slime DJ with headphones", "slime rockstar shredding a guitar", "slime rapper with a gold chain", "slime scientist with potions",
  "slime detective with a magnifying glass", "slime surgeon with a mask", "slime firefighter with an axe", "slime racecar driver with a helmet",
  "slime monk in robes", "slime shaman with a bone mask", "slime jester with a jagged grin", "slime executioner hooded",
  "slime king on a throne", "slime queen with a scepter", "slime emperor in a cape", "slime prophet glowing",
  // creatures / mascots
  "slime frog with bulging eyes", "slime cat with a smug face", "slime dog goofy tongue out", "slime gorilla beating chest",
  "slime shark grinning", "slime bull charging", "slime bear grumpy", "slime rat sneaky",
  "slime octopus juggling coins", "slime alien overlord", "slime robot with a glowing core", "slime ghost translucent",
  "slime skeleton dabbing", "slime zombie trader decayed", "slime devil with a pitchfork", "slime angel with a green halo",
  "slime clown menacing", "slime mushroom character", "slime cactus with sunglasses", "slime snail slow but confident",
  // moods (extra variants beyond kmood batch)
  "euphoric slime trader throwing cash, we're so back", "bullish slime chad flexing with a rocket", "rugged slime trader ugly-crying at a red chart",
  "coping slime trader forced smile this is fine", "diamond-hands slime gritting teeth", "rekt slime trader dazed after a LIQUIDATED blast",
  "moon-gazing slime with a telescope", "aped-in slime gorilla smashing buy", "paper-hands slime panic selling",
  "comfy zen slime meditating as charts burn", "ngmi slime slumped over a laptop", "gambler slime at a slot machine",
  "up-only slime flexing a giant green candle", "exit-liquidity slime clown holding bags"
].map((a, i) => ({ cat: "characters", name: `mg_c${String(i + 1).padStart(3, "0")}`, transparent: false,
  prompt: `SlimeWire degen mascot character: a ${a}, ${CHAR_STYLE}.` }));

const hats = ["golden crown dripping slime", "devil horns and a crooked halo", "viking horned helmet", "backwards snapback cap",
  "black cowboy hat", "wizard hat with stars", "top hat", "pirate tricorn hat", "spartan helmet", "chef hat",
  "beanie with a slime logo", "durag", "party cone hat", "halo of green flames", "samurai kabuto helmet", "graduation cap",
  "flat cap", "bucket hat", "propeller beanie", "laurel wreath", "cyberpunk visor", "santa hat green", "bandana",
  "astronaut helmet cracked"].map((h, i) => ({ cat: "hat", name: `mg_h${String(i + 1).padStart(3, "0")}`, transparent: true,
  prompt: `a ${h}, glossy neon-green-accent cartoon sticker, thick black outline, isolated with a TRANSPARENT background, no drop shadow.` }));

const props = ["fat lit blunt with green smoke", "chunky gold chain with a dollar pendant", "deal-with-it pixel sunglasses",
  "cartoon money gun spraying green cash", "rocket blasting off with green flames", "red crashing candlestick chart",
  "green pumping candlestick chart", "box of tissues", "tiny green lambo", "telescope pointed at a green moon",
  "briefcase overflowing with green cash", "cartoon bull", "cartoon bear", "diamond glowing green", "flaming green candle",
  "slot machine", "green energy drink can", "microphone", "katana dripping goo", "glowing green orb",
  "stack of green cash", "calculator", "trophy", "bomb with a lit fuse"].map((p, i) => ({ cat: "prop", name: `mg_p${String(i + 1).padStart(3, "0")}`, transparent: true,
  prompt: `a ${p}, glossy cartoon sticker, thick black outline, isolated with a TRANSPARENT background, no drop shadow.` }));

const badges = ["WAGMI", "NGMI", "GMI", "REKT", "LFG", "COPE", "SER", "FUD", "HODL", "GM", "100X", "1000X", "ALPHA", "DEGEN",
  "APED IN", "TO THE MOON", "DIAMOND HANDS", "PAPER HANDS", "SEND IT", "BULLISH", "RUGGED", "PROBABLY NOTHING", "FEW", "IYKYK"]
  .map((b, i) => ({ cat: "badge", name: `mg_b${String(i + 1).padStart(3, "0")}`, transparent: true,
  prompt: `a round enamel-pin BADGE that says "${b}" in bold letters with a small slime drip, glossy green cartoon sticker, thick bold border, isolated with a TRANSPARENT background, no shadow.` }));

const bgs = ["abstract neon-green slime splatter over black", "dark toxic swamp with glowing fog", "green matrix data-rain over black",
  "molten green circuitry texture", "cyberpunk green grid over a dark swamp", "green nebula in deep space",
  "glossy green liquid metal", "dark cave with bioluminescent green moss", "green lightning storm on black",
  "abstract green smoke on black", "radioactive green ooze pools", "green hex-grid tech surface",
  "dark jungle with green mist", "green aurora over black mountains", "green bokeh lights blurred", "cracked earth glowing green"]
  .map((b, i) => ({ cat: "bg", name: `mg_bg${String(i + 1).padStart(2, "0")}`, transparent: false,
  prompt: `PFP BACKGROUND: ${b}, cinematic, high contrast, square 1:1, no text, no characters, no people, seamless, empty negative space.` }));

const ALL = [...gags, ...characters, ...hats, ...props, ...badges, ...bgs];
for (const c of ["characters", "hat", "prop", "badge", "bg"]) fs.mkdirSync(path.join(INBOX, c), { recursive: true });

// resumable: only ones whose target PNG doesn't exist yet
const todo = ALL.filter((it) => !fs.existsSync(path.join(INBOX, it.cat, it.name + ".png")));
log(`MASS-GEN start · ${ALL.length} in bank · ${todo.length} to do · ${ALL.length - todo.length} already present`);

const BATCH = 10;
let done = 0, failStreak = 0;
for (let i = 0; i < todo.length; i += BATCH) {
  const chunk = todo.slice(i, i + BATCH);
  const lines = chunk.map((it, k) => `${k + 1}) ${it.prompt}  ->  ${path.join(INBOX, it.cat, it.name + ".png")}`).join("\n");
  const instruction = `You are a batch image generator. For EACH item below, use your image generation tool to create the image, then save the PNG to the EXACT absolute path shown after the arrow. After each save print SAVED:<path>. Do NOT modify any git repo, do NOT run builds, do nothing else.\n\n${lines}`;
  const before = chunk.filter((it) => fs.existsSync(path.join(INBOX, it.cat, it.name + ".png"))).length;
  try {
    execFileSync(CODEX, ["exec", instruction], { stdio: ["ignore", "ignore", "ignore"], timeout: 30 * 60_000 });
  } catch (e) { log(`batch ${i / BATCH + 1} codex error: ${String(e.message).slice(0, 100)}`); }
  const landed = chunk.filter((it) => fs.existsSync(path.join(INBOX, it.cat, it.name + ".png"))).length - before;
  done += landed;
  log(`batch ${i / BATCH + 1}/${Math.ceil(todo.length / BATCH)} → +${landed}/${chunk.length} landed (total ${done})`);
  if (landed === 0) { failStreak++; if (failStreak >= 3) { log("3 empty batches in a row — likely out of Codex quota. Stopping (re-run later to resume)."); break; } }
  else failStreak = 0;
}
log(`MASS-GEN done for this run · +${done} images. Re-run to resume any that didn't land.`);
