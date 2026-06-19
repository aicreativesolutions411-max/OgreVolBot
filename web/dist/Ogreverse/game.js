(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const spriteMaskCanvas = typeof document !== "undefined" && document.createElement
    ? document.createElement("canvas")
    : null;
  const spriteMaskCtx = spriteMaskCanvas ? spriteMaskCanvas.getContext("2d") : null;
  const panel = document.getElementById("panel");
  const toastEl = document.getElementById("toast");
  const mobileControls = document.getElementById("mobile-controls");

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 32;
  const VIEW_COLS = 20;
  const VIEW_ROWS = 15;
  const WORLD_W = 96;
  const WORLD_H = 72;
  const SAVE_KEY = "ogreverse_brainrot_emerald_save_v1";
  const ONLINE_SESSION_KEY = "ogreverse_online_session_v1";
  const ACCOUNT_KEY = "ogreverse_account_v1";
  // Base path the game is served from ("" at root, "/Ogreverse" when hosted under /Ogreverse).
  const OGV_BASE = (typeof location !== "undefined" && location.pathname ? location.pathname.replace(/\/[^/]*$/, "") : "");
  // API origin: when the game is served as a STATIC client off-site (slimewire.org/Ogreverse), the
  // multiplayer + account endpoints live on the backend, so resolve them to the backend origin
  // (CORS-enabled below). When served from the backend itself, stay same-origin (relative).
  const OGV_ON_BACKEND = (typeof location !== "undefined" && /ogrevolbot\.onrender\.com$/i.test(location.host || ""));
  const OGV_API_BASE = OGV_ON_BACKEND ? OGV_BASE : `https://ogrevolbot.onrender.com${OGV_BASE || "/Ogreverse"}`;
  function apiUrl(p) { return `${OGV_API_BASE}${p}`; }

  const TYPES = [
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Rock",
    "Flying",
    "Poison",
    "Psychic",
    "Dark",
    "Steel",
    "Bug",
    "Fairy",
    "Ghost",
    "Normal",
    "Brute",
    "Tech",
    "Trick",
    "Chaos",
  ];

  const TYPE_COLORS = {
    Fire: "#f15d3a",
    Water: "#48a4f0",
    Grass: "#5fca5c",
    Electric: "#f4d64d",
    Rock: "#a88759",
    Flying: "#9dc7f2",
    Poison: "#aa69c8",
    Psychic: "#f272b0",
    Dark: "#5f5b70",
    Steel: "#aeb9c2",
    Bug: "#8fbc3c",
    Fairy: "#f2a7df",
    Ghost: "#7a6fc8",
    Normal: "#c8b89f",
    Brute: "#de7a3b",
    Tech: "#4ed5cf",
    Trick: "#8ce06f",
    Chaos: "#ff72e1",
  };

  const STATUS_COLORS = {
    burn: "#f15d3a",
    poison: "#aa69c8",
    zap: "#f4d64d",
    sleep: "#77c6ef",
    confuse: "#ff72e1",
    flinch: "#f3d35b",
  };

  const TYPE_CHART = makeTypeChart();

  const MOVE_BLUEPRINTS = {
    Fire: [
      ["Cinder Jab", "Physical", 40, 100, 25, { status: "burn", chance: 0.12 }],
      ["Pepper Flare", "Special", 55, 95, 20, { status: "burn", chance: 0.18 }],
      ["Bonfire Flex", "Status", 0, 100, 18, { stat: "atk", amount: 1, target: "self" }],
      ["Magma Lariat", "Physical", 82, 90, 12, { status: "burn", chance: 0.18 }],
      ["Solar Fryer", "Special", 95, 88, 10, { stat: "spd", amount: -1, target: "foe", chance: 0.25 }],
      ["Hot Take Meteor", "Special", 115, 82, 6, { recoil: 0.16 }],
    ],
    Water: [
      ["Bubble Bonk", "Special", 40, 100, 25, { stat: "spe", amount: -1, target: "foe", chance: 0.12 }],
      ["Snack Tide", "Physical", 55, 95, 20, { drain: 0.25 }],
      ["Misty Sip", "Status", 0, 100, 18, { heal: 0.36 }],
      ["Whirlpool Wedgie", "Special", 80, 92, 12, { status: "confuse", chance: 0.18 }],
      ["Tsunami Tackle", "Physical", 92, 88, 10, { flinch: 0.18 }],
      ["Aqua Ratio", "Special", 112, 82, 6, { stat: "spa", amount: -1, target: "self" }],
    ],
    Grass: [
      ["Leaf Slap", "Physical", 40, 100, 25, { drain: 0.2 }],
      ["Vine Receipt", "Special", 55, 95, 20, { stat: "spe", amount: -1, target: "foe", chance: 0.18 }],
      ["Photosnack", "Status", 0, 100, 18, { heal: 0.42 }],
      ["Bramble Bellyflop", "Physical", 84, 90, 12, { status: "poison", chance: 0.12 }],
      ["Pollen Popoff", "Special", 92, 88, 10, { status: "sleep", chance: 0.12 }],
      ["Chlorophyll Combo", "Physical", 110, 84, 6, { stat: "spe", amount: 1, target: "self", chance: 0.25 }],
    ],
    Electric: [
      ["Static Jab", "Special", 40, 100, 25, { status: "zap", chance: 0.15 }],
      ["Battery Bite", "Physical", 58, 95, 20, { status: "zap", chance: 0.18 }],
      ["Charge Clout", "Status", 0, 100, 18, { stat: "spa", amount: 1, target: "self" }],
      ["Thunder Noogie", "Special", 84, 90, 12, { status: "zap", chance: 0.22 }],
      ["Neon Headbutt", "Physical", 94, 88, 10, { flinch: 0.2 }],
      ["Outlet Overkill", "Special", 116, 80, 6, { recoil: 0.18 }],
    ],
    Rock: [
      ["Pebble Yeet", "Physical", 40, 100, 25, { flinch: 0.08 }],
      ["Geode Grumble", "Special", 55, 95, 20, { stat: "def", amount: -1, target: "foe", chance: 0.16 }],
      ["Fortify Forehead", "Status", 0, 100, 18, { stat: "def", amount: 1, target: "self" }],
      ["Boulder Bounce", "Physical", 86, 90, 12, { flinch: 0.18 }],
      ["Avalanche Apology", "Physical", 96, 86, 10, { stat: "spe", amount: -1, target: "self" }],
      ["Mountain Receipt", "Special", 112, 82, 6, { stat: "def", amount: -1, target: "foe", chance: 0.24 }],
    ],
    Flying: [
      ["Wing Ding", "Physical", 40, 100, 25, { flinch: 0.08 }],
      ["Gusty Gossip", "Special", 55, 95, 20, { stat: "acc", amount: -1, target: "foe", chance: 0.15 }],
      ["Cloud Scoot", "Status", 0, 100, 18, { stat: "spe", amount: 1, target: "self" }],
      ["Divebomb Drama", "Physical", 82, 90, 12, { flinch: 0.2 }],
      ["Jetstream Roast", "Special", 94, 88, 10, { stat: "spe", amount: -1, target: "foe", chance: 0.2 }],
      ["Skybox Slam", "Physical", 112, 82, 6, { recoil: 0.15 }],
    ],
    Poison: [
      ["Toxic Flick", "Physical", 40, 100, 25, { status: "poison", chance: 0.18 }],
      ["Sludge Snicker", "Special", 58, 95, 20, { status: "poison", chance: 0.2 }],
      ["Venom Vibe", "Status", 0, 100, 18, { status: "poison" }],
      ["Gunk Dunk", "Physical", 84, 90, 12, { status: "poison", chance: 0.28 }],
      ["Fumesday", "Special", 92, 88, 10, { stat: "spa", amount: -1, target: "foe", chance: 0.22 }],
      ["Biohazard Banter", "Special", 112, 82, 6, { status: "poison", chance: 0.36 }],
    ],
    Psychic: [
      ["Mind Boop", "Special", 40, 100, 25, { stat: "spd", amount: -1, target: "foe", chance: 0.12 }],
      ["Astral Bonk", "Physical", 58, 95, 20, { confuse: 0.18 }],
      ["Brain Buff", "Status", 0, 100, 18, { stat: "spa", amount: 1, target: "self" }],
      ["Telekinetic Tilt", "Special", 84, 90, 12, { status: "confuse", chance: 0.2 }],
      ["Aura Invoice", "Special", 96, 88, 10, { stat: "spd", amount: -1, target: "foe", chance: 0.24 }],
      ["Third Eye Dropkick", "Physical", 112, 82, 6, { flinch: 0.2 }],
    ],
    Dark: [
      ["Sneer Swipe", "Physical", 40, 100, 25, { stat: "def", amount: -1, target: "foe", chance: 0.12 }],
      ["Night Meme", "Special", 58, 95, 20, { status: "confuse", chance: 0.15 }],
      ["Shade Sneak", "Status", 0, 100, 18, { stat: "spe", amount: 1, target: "self" }],
      ["Back Alley Bonk", "Physical", 84, 90, 12, { flinch: 0.25 }],
      ["Doomscroll Drain", "Special", 94, 88, 10, { drain: 0.35 }],
      ["Midnight Ratio", "Physical", 112, 82, 6, { stat: "atk", amount: -1, target: "self" }],
    ],
    Steel: [
      ["Tin Tap", "Physical", 40, 100, 25, { stat: "def", amount: 1, target: "self", chance: 0.1 }],
      ["Chrome Comet", "Special", 58, 95, 20, { stat: "def", amount: -1, target: "foe", chance: 0.14 }],
      ["Iron Posture", "Status", 0, 100, 18, { stat: "def", amount: 1, target: "self" }],
      ["Anvil Uppercut", "Physical", 86, 90, 12, { flinch: 0.18 }],
      ["Magnet Mosh", "Special", 96, 86, 10, { status: "zap", chance: 0.18 }],
      ["Industrial Bonker", "Physical", 116, 80, 6, { recoil: 0.16 }],
    ],
    Bug: [
      ["Nibble Dash", "Physical", 40, 100, 25, { stat: "def", amount: -1, target: "foe", chance: 0.12 }],
      ["Mandible Mug", "Physical", 58, 95, 20, { drain: 0.2 }],
      ["Shell Shimmy", "Status", 0, 100, 18, { stat: "spe", amount: 1, target: "self" }],
      ["Swarm Sneak", "Physical", 84, 90, 12, { flinch: 0.18 }],
      ["Antenna Ambush", "Special", 94, 88, 10, { status: "confuse", chance: 0.18 }],
      ["Hive Heist", "Physical", 112, 82, 6, { drain: 0.28 }],
    ],
    Fairy: [
      ["Glitter Bonk", "Special", 40, 100, 25, { stat: "atk", amount: -1, target: "foe", chance: 0.12 }],
      ["Charm Receipt", "Special", 58, 95, 20, { status: "confuse", chance: 0.16 }],
      ["Cute Lawsuit", "Status", 0, 100, 18, { stat: "spd", amount: 1, target: "self" }],
      ["Sparkle Uppercut", "Physical", 84, 90, 12, { flinch: 0.16 }],
      ["Moonlit Sass", "Special", 96, 88, 10, { stat: "spa", amount: -1, target: "foe", chance: 0.22 }],
      ["Pixie Popoff", "Special", 114, 82, 6, { random: true }],
    ],
    Ghost: [
      ["Boo Jab", "Special", 40, 100, 25, { flinch: 0.08 }],
      ["Haunt Receipt", "Special", 58, 95, 20, { stat: "spd", amount: -1, target: "foe", chance: 0.15 }],
      ["Spooky Posture", "Status", 0, 100, 18, { stat: "spe", amount: 1, target: "self" }],
      ["Polter Bonk", "Physical", 84, 90, 12, { status: "confuse", chance: 0.2 }],
      ["Afterimage Invoice", "Special", 96, 88, 10, { drain: 0.24 }],
      ["Graveyard Pop Quiz", "Special", 114, 82, 6, { flinch: 0.22 }],
    ],
    Normal: [
      ["Plain Tap", "Physical", 40, 100, 25, {}],
      ["Comfy Tackle", "Physical", 58, 95, 20, { flinch: 0.12 }],
      ["Deep Breath", "Status", 0, 100, 18, { heal: 0.32 }],
      ["Basic Bonk", "Physical", 82, 92, 12, { stat: "def", amount: -1, target: "foe", chance: 0.16 }],
      ["Routine Beam", "Special", 92, 88, 10, { stat: "acc", amount: -1, target: "foe", chance: 0.18 }],
      ["Average Apocalypse", "Physical", 112, 82, 6, { recoil: 0.12 }],
    ],
    Brute: [
      ["Hamfist Tap", "Physical", 42, 100, 25, { flinch: 0.08 }],
      ["Shoulder Yodel", "Physical", 60, 95, 20, { stat: "def", amount: -1, target: "foe", chance: 0.15 }],
      ["Protein Roar", "Status", 0, 100, 18, { stat: "atk", amount: 1, target: "self" }],
      ["Knuckle Sandwich", "Physical", 88, 90, 12, { flinch: 0.22 }],
      ["Sock Cyclone", "Physical", 100, 86, 10, { status: "confuse", chance: 0.16 }],
      ["Absolute Unit", "Physical", 118, 80, 6, { recoil: 0.18 }],
    ],
    Tech: [
      ["Laser Prod", "Special", 42, 100, 25, { stat: "spd", amount: -1, target: "foe", chance: 0.1 }],
      ["Router Bite", "Physical", 60, 95, 20, { status: "zap", chance: 0.15 }],
      ["Firmware Flex", "Status", 0, 100, 18, { stat: "spa", amount: 1, target: "self" }],
      ["Quantum Slap", "Special", 86, 90, 12, { status: "confuse", chance: 0.18 }],
      ["Satellite Slam", "Special", 98, 86, 10, { stat: "acc", amount: -1, target: "foe", chance: 0.2 }],
      ["404 Obliterator", "Special", 118, 80, 6, { random: true }],
    ],
    Trick: [
      ["Pocket Sand", "Status", 0, 100, 25, { stat: "acc", amount: -1, target: "foe" }],
      ["Sneaky Shank", "Physical", 55, 100, 22, { crit: 0.16 }],
      ["Decoy Dance", "Status", 0, 100, 18, { stat: "spe", amount: 1, target: "self" }],
      ["Banana Peel Blitz", "Physical", 82, 92, 12, { flinch: 0.26 }],
      ["Trapdoor Text", "Special", 92, 88, 10, { status: "confuse", chance: 0.24 }],
      ["Heist Finale", "Physical", 112, 82, 6, { drain: 0.25 }],
    ],
    Chaos: [
      ["Skibidi Spin", "Physical", 42, 100, 25, { status: "confuse", chance: 0.18 }],
      ["Drain Rizz", "Special", 58, 95, 20, { drain: 0.42 }],
      ["Fanum Tax", "Status", 0, 100, 18, { stat: "atk", amount: -1, target: "foe" }],
      ["Ohio Warp", "Special", 88, 88, 12, { random: true }],
      ["Gyattquake", "Physical", 98, 84, 10, { flinch: 0.24 }],
      ["Brainrot Overload", "Special", 120, 76, 5, { random: true, recoil: 0.14 }],
    ],
  };

  const ITEMS = {
    "Capture Orb": { kind: "orb", rate: 1, price: 200, desc: "A snack-sized orb for catching wild weirdos." },
    "Great Orb": { kind: "orb", rate: 1.55, price: 600, desc: "A sturdier orb with respectable vibes." },
    "Ultra Orb": { kind: "orb", rate: 2.25, price: 1200, desc: "Premium chrome. Aggressively spherical." },
    "Rizz Orb": { kind: "orb", rate: 3.3, price: 2500, desc: "A glittering orb that whispers compliments." },
    Potion: { kind: "heal", amount: 24, price: 300, desc: "Restores 24 HP." },
    "Super Snack": { kind: "heal", amount: 60, price: 700, desc: "Restores 60 HP. Crunchy and legally food." },
    Revive: { kind: "revive", amount: 0.5, price: 1500, desc: "Revives a fainted party member to half HP." },
    "Big Rock Candy": { kind: "evo", price: 1800, desc: "Makes some ogres evolve with unacceptable chewing sounds." },
    "Quantum Cog": { kind: "evo", price: 1800, desc: "Makes some aliens update their skeleton firmware." },
    "Sneak Scarf": { kind: "evo", price: 1800, desc: "Makes some goblins evolve while pretending they did not." },
    "Meme Stone": { kind: "evo", price: 1800, desc: "Makes some brainrot creatures become a public concern." },
  };

  const CLANS = [
    {
      key: "ogre",
      code: "OGR",
      label: "Ogre",
      primary: "Brute",
      evoItem: "Big Rock Candy",
      habitats: ["ogre"],
      types: ["Rock", "Fire", "Steel", "Grass", "Water", "Poison", "Dark", "Flying"],
      roots: [
        "Grunk",
        "Muggo",
        "Brog",
        "Thunk",
        "Gorbo",
        "Cragg",
        "Blorv",
        "Honkus",
        "Smashley",
        "Urk",
        "Drub",
        "Boulderbert",
        "Snorg",
        "Gravyknuckle",
        "Oafley",
        "Punchmo",
        "Funguson",
        "Clobbara",
        "Mudrick",
        "Hamwise",
        "Bashford",
        "Gromp",
        "Chonkley",
        "Rumbleton",
        "Bonkardo",
      ],
      suffixes: [
        ["Pebblemitt", "Mudnugget", "Soupfrown", "Toecrunch", "Hillsnort", "Snackmaul"],
        ["Stonefist", "Loglugger", "Cauldronbelch", "Fortknuckle", "Mossmaw", "Bellyboulder"],
        ["Boulderfist", "Castlecrusher", "Mountainmunch", "Thunderbelch", "Megaton Mauler", "Citadel Chomper"],
      ],
      singleSuffix: ["Gatekeeper", "Bridgebruiser", "Mammothmug", "Fortress Uncle", "Legendary Lunchlord"],
      desc: "A broad cartoon ogre with tiny legs, giant fists, and a heroic lack of indoor voice.",
    },
    {
      key: "alien",
      code: "ALN",
      label: "Alien",
      primary: "Tech",
      evoItem: "Quantum Cog",
      habitats: ["alien"],
      types: ["Psychic", "Electric", "Steel", "Flying", "Water", "Dark", "Chaos", "Fire"],
      roots: [
        "Zorblax",
        "Nebulon",
        "Quibix",
        "Vexlo",
        "Plim",
        "Oort",
        "Xandor",
        "Glorpix",
        "Meeptron",
        "Bleepa",
        "Yorb",
        "Krelvin",
        "Astrozo",
        "Quasaroo",
        "Lazuliq",
        "Orbitron",
        "Voidley",
        "Sprocket",
        "Zenon",
        "Wubwub",
        "Noodleon",
        "Fractal Fred",
        "Pixelon",
        "Moonmo",
        "Gloopiter",
      ],
      suffixes: [
        ["Signalbean", "Blinkpod", "Tiny Saucer", "Wigglebyte", "Astro Peep", "Voidwhisper"],
        ["Laserwhisper", "Nebulachip", "Orbit Sniper", "Hoverbrain", "Cosmic Router", "Plasma Pal"],
        ["Voidwhisper", "Star Kernel", "Nebula Overlord", "Galaxy Glitcher", "Singularity CEO", "Meteor Modem"],
      ],
      singleSuffix: ["Probe Poet", "Cosmic Accountant", "Saucerlord", "Comet DJ", "Mythic Mainframe"],
      desc: "A bright-eyed alien gadget gobbler with floating antennae and opinions about firmware.",
    },
    {
      key: "goblin",
      code: "GBL",
      label: "Goblin",
      primary: "Trick",
      evoItem: "Sneak Scarf",
      habitats: ["goblin"],
      types: ["Dark", "Poison", "Grass", "Flying", "Rock", "Fire", "Water", "Steel"],
      roots: [
        "Sneaknik",
        "Nibblit",
        "Pickpock",
        "Gribby",
        "Slinko",
        "Munchkinz",
        "Trapwick",
        "Jangle",
        "Boggit",
        "Stinklet",
        "Fizzbag",
        "Clankle",
        "Mossbit",
        "Twiggles",
        "Snatcha",
        "Wrenchit",
        "Fangbo",
        "Pipstab",
        "Rattlecap",
        "Zipper",
        "Greblin",
        "Coinpinch",
        "Mudwink",
        "Dripdrab",
        "Cackleton",
      ],
      suffixes: [
        ["Sockpock", "Mossmite", "Cavewink", "Lint Lurker", "Tiny Taker", "Shadowpock"],
        ["Shadowpock", "Daggerdoodle", "Trap Chap", "Mushroom Mugger", "Candle Creep", "Pocket Plunder"],
        ["Warren Warlord", "Shadow CEO", "Trapmaster Deluxe", "Vault Varmint", "Gobbo Giga", "Mischief Mayor"],
      ],
      singleSuffix: ["Door Taxer", "Cave Auditor", "Moss Menace", "Lantern Liar", "Legendary Loot Gob"],
      desc: "A fast little goblin with too many pockets, not enough remorse, and perfect comic timing.",
    },
    {
      key: "brainrot",
      code: "BRT",
      label: "Brainrot",
      primary: "Chaos",
      evoItem: "Meme Stone",
      habitats: ["brainrot"],
      types: ["Poison", "Electric", "Dark", "Trick", "Psychic", "Water", "Fire", "Flying"],
      roots: [
        "Skibidi",
        "Rizzler",
        "Gyatt",
        "Sigma",
        "Ohio",
        "Fanum",
        "Doomscroll",
        "Yeetnik",
        "Bussin",
        "Cringe",
        "Mewmax",
        "NPC",
        "Vibecheck",
        "Griddy",
        "Ratio",
        "Slaycore",
        "Caplord",
        "Goonerang",
        "Lobotomy",
        "Aura",
        "Glizzy",
        "Chat",
        "Delulu",
        "Bopster",
        "Braincell",
      ],
      suffixes: [
        ["Sludge", "Rat", "Pebble", "Gremlin", "Noodle", "Blob"],
        ["Sloplord", "Flexer", "Gargoyle", "Giga Rat", "Meme Wizard", "Vibe Gobbler"],
        ["Sump King", "Obliterator", "Gargantua", "Final Boss Baby", "Chronically Online", "Rift Ruler"],
      ],
      singleSuffix: ["Algorithm", "Livestream Lich", "Gobstopper", "Mystic Sludge", "Legendary Braincell"],
      desc: "A wobbling meme-beast with impossible eyes, rubberhose limbs, and jokes that should not fit in nature.",
    },
  ];

  const CANON_GOBLIN_ROSTER = [
    { id: "GBL001", line: "83", stageIndex: 0, stageCount: 3, name: "Pocketrex", elements: ["Bug", "Dark"], evolvesTo: "GBL002", evoLevel: 18, role: "Sneak", desc: "Pocketrex hoards crumbs, coins, and suspicious lint in its shell-pockets before skittering away with dramatic tiptoes." },
    { id: "GBL002", line: "83", stageIndex: 1, stageCount: 3, name: "Greedog", elements: ["Bug", "Dark"], evolvesTo: "GBL003", evoLevel: 36, role: "Bruiser", desc: "Greedog sniffs out dropped valuables and guards them with mandibles, growls, and very selective bookkeeping." },
    { id: "GBL003", line: "83", stageIndex: 2, stageCount: 3, name: "Goblinix", elements: ["Bug", "Dark"], role: "Warlord", desc: "Goblinix rules its tunnel pile like a tiny tyrant, clicking its armor whenever someone asks for rent." },
    { id: "GBL004", line: "84", stageIndex: 0, stageCount: 3, name: "Trickmaw", elements: ["Dark", "Bug"], evolvesTo: "GBL005", evoLevel: 15, role: "Trickster", desc: "Trickmaw smiles with too many teeth and exactly one honest thought, which it lost yesterday." },
    { id: "GBL005", line: "84", stageIndex: 1, stageCount: 3, name: "Sneakog", elements: ["Dark", "Bug"], evolvesTo: "GBL006", evoLevel: 34, role: "Ambusher", desc: "Sneakog practices dramatic entrances, then forgets the entrance and attacks from behind a pebble." },
    { id: "GBL006", line: "84", stageIndex: 2, stageCount: 3, name: "Stabzar", elements: ["Dark", "Bug"], role: "Assassin", desc: "Stabzar's blade-arms are polished with cave wax and terrible decisions." },
    { id: "GBL007", line: "85", stageIndex: 0, stageCount: 2, name: "Greedclaw", elements: ["Poison", "Fire"], evolvesTo: "GBL008", evoLevel: 28, role: "Breaker", desc: "Greedclaw's claws glow with toxic heat whenever someone nearby opens a snack bag." },
    { id: "GBL008", line: "85", stageIndex: 1, stageCount: 2, name: "Gobblezar", elements: ["Poison", "Fire"], role: "Bulky Breaker", desc: "Gobblezar belches poison flame and insists the smoke is artisanal." },
    { id: "GBL009", line: "86", stageIndex: 0, stageCount: 2, name: "Stabrex", elements: ["Bug", "Dark"], evolvesTo: "GBL010", evoLevel: 25, role: "Striker", desc: "Stabrex jumps first, explains never, and sharpens its horn on warning signs." },
    { id: "GBL010", line: "86", stageIndex: 1, stageCount: 2, name: "Picklin", elements: ["Bug", "Dark"], role: "Duelist", desc: "Picklin is sour, swift, and absolutely convinced every duel should include pickles." },
    { id: "GBL011", line: "87", stageIndex: 0, stageCount: 2, name: "Mischrex", elements: ["Dark"], evolvesTo: "GBL012", evoLevel: 30, role: "Prankster", desc: "Mischrex plants fake footprints, then follows them to see who gets blamed." },
    { id: "GBL012", line: "87", stageIndex: 1, stageCount: 2, name: "Sneakblast", elements: ["Dark"], role: "Bomber", desc: "Sneakblast packs smoke bombs, snack bombs, and one bomb that only insults shoes." },
    { id: "GBL013", line: "88", stageIndex: 0, stageCount: 2, name: "Gobmon", elements: ["Dark", "Poison"], evolvesTo: "GBL014", evoLevel: 27, role: "Status", desc: "Gobmon looks basic until its ears drip venom and its grin itemizes your mistakes." },
    { id: "GBL014", line: "88", stageIndex: 1, stageCount: 2, name: "Trickhide", elements: ["Dark", "Poison"], role: "Disruptor", desc: "Trickhide lives under a cloak, mostly because the cloak keeps winning arguments." },
    { id: "GBL015", line: "89", stageIndex: 0, stageCount: 2, name: "Sneakmaw", elements: ["Poison"], evolvesTo: "GBL016", evoLevel: 29, role: "Venom", desc: "Sneakmaw slinks through puddles and leaves toxic bite marks in unattended lunchboxes." },
    { id: "GBL016", line: "89", stageIndex: 1, stageCount: 2, name: "Greedhide", elements: ["Poison"], role: "Wall", desc: "Greedhide's cloak is full of stolen bottles, fake teeth, and one very real acid flask." },
    { id: "GBL017", line: "90", stageIndex: 0, stageCount: 2, name: "Pocketclaw", elements: ["Bug"], evolvesTo: "GBL018", evoLevel: 31, role: "Fast", desc: "Pocketclaw has six hiding places and somehow all of them contain your keys." },
    { id: "GBL018", line: "90", stageIndex: 1, stageCount: 2, name: "Mischog", elements: ["Bug"], role: "Utility", desc: "Mischog trips traps on purpose, then sells the noise as percussion." },
    { id: "GBL019", line: "91", stageIndex: 0, stageCount: 2, name: "Tricklin", elements: ["Dark", "Fire"], evolvesTo: "GBL020", evoLevel: 24, role: "Glass Cannon", desc: "Tricklin lights matches with its ears and claims every small fire is a strategy." },
    { id: "GBL020", line: "91", stageIndex: 1, stageCount: 2, name: "Gobbleon", elements: ["Dark", "Fire"], role: "Attacker", desc: "Gobbleon eats embers for breakfast and breathes smoke shaped like rude doodles." },
    { id: "GBL021", line: "92", stageIndex: 0, stageCount: 2, name: "Greedmaw", elements: ["Poison", "Dark"], evolvesTo: "GBL022", evoLevel: 28, role: "Drain", desc: "Greedmaw's mouth is bigger than its plans, which is impressive because the plans are illegal." },
    { id: "GBL022", line: "92", stageIndex: 1, stageCount: 2, name: "Stablin", elements: ["Poison", "Dark"], role: "Assassin", desc: "Stablin keeps venom daggers tucked where other creatures keep manners." },
    { id: "GBL023", line: "93", stageIndex: 0, stageCount: 1, name: "Sneakzar", elements: ["Dark"], role: "Rogue", desc: "Sneakzar walks like a rumor and laughs like a locked door." },
    { id: "GBL024", line: "94", stageIndex: 0, stageCount: 1, name: "Trickgob", elements: ["Poison"], role: "Status", desc: "Trickgob labels poison vials as juice boxes and then acts surprised." },
    { id: "GBL025", line: "95", stageIndex: 0, stageCount: 1, name: "Gobbleclaw", elements: ["Dark"], role: "Bruiser", desc: "Gobbleclaw bites first and asks whether that counted as a handshake." },
    { id: "GBL026", line: "96", stageIndex: 0, stageCount: 1, name: "Pocketblast", elements: ["Bug"], role: "Burst", desc: "Pocketblast pops from its shell backpack with enough powder to ruin a parade." },
    { id: "GBL027", line: "97", stageIndex: 0, stageCount: 1, name: "Greedogre", elements: ["Poison"], role: "Tank", desc: "Greedogre is technically a goblin, emotionally an ogre, and legally a smell." },
    { id: "GBL028", line: "98", stageIndex: 0, stageCount: 1, name: "Mischmaw", elements: ["Dark"], role: "Prankster", desc: "Mischmaw's grin arrives two seconds before the problem does." },
    { id: "GBL029", line: "99", stageIndex: 0, stageCount: 1, name: "Goblinhide", elements: ["Bug"], role: "Wall", desc: "Goblinhide's shell is mostly armor and partly unpaid invoices." },
    { id: "GBL030", line: "100", stageIndex: 0, stageCount: 1, name: "Pickrex", elements: ["Dark"], role: "Biter", desc: "Pickrex is short, sour, and furious at anything taller than a bucket." },
    { id: "GBL031", line: "101", stageIndex: 0, stageCount: 1, name: "Stabmon", elements: ["Poison"], role: "Striker", desc: "Stabmon pokes suspicious objects to see if they become less suspicious." },
    { id: "GBL032", line: "102", stageIndex: 0, stageCount: 1, name: "Sneaklin", elements: ["Dark"], role: "Fast", desc: "Sneaklin tiptoes so hard that floorboards apologize in advance." },
    { id: "GBL033", line: "103", stageIndex: 0, stageCount: 1, name: "Trickog", elements: ["Bug"], role: "Utility", desc: "Trickog's shell has fake eyes, real eyes, and one sticker that says maybe." },
    { id: "GBL034", line: "104", stageIndex: 0, stageCount: 1, name: "Greedblast", elements: ["Poison"], role: "Burst", desc: "Greedblast stores pressure in a toxic pouch until everyone regrets curiosity." },
    { id: "GBL035", line: "105", stageIndex: 0, stageCount: 1, name: "Gobzar", elements: ["Dark"], role: "Leader", desc: "Gobzar wears a tiny crown and demands tribute in buttons." },
    { id: "GBL036", line: "106", stageIndex: 0, stageCount: 1, name: "Stabhide", elements: ["Bug", "Dark"], role: "Ambusher", desc: "Stabhide's shell opens only for attacks, naps, and tax evasion." },
    { id: "GBL037", line: "107", stageIndex: 0, stageCount: 1, name: "Pocketmaw", elements: ["Fire"], role: "Attacker", desc: "Pocketmaw keeps embers in its cheeks and snacks in places science refuses to inspect." },
    { id: "GBL038", line: "108", stageIndex: 0, stageCount: 1, name: "Mischblast", elements: ["Dark"], role: "Bomber", desc: "Mischblast signs every smoke cloud with a giggle." },
    { id: "GBL039", line: "109", stageIndex: 0, stageCount: 1, name: "Sneakrex", elements: ["Poison"], role: "Biter", desc: "Sneakrex's tiny arms cannot reach snacks, so it evolved spite." },
    { id: "GBL040", line: "110", stageIndex: 0, stageCount: 1, name: "Trickzar", elements: ["Bug"], role: "Leader", desc: "Trickzar crowns itself king of any room with at least one loose coin." },
    { id: "GBL041", line: "111", stageIndex: 0, stageCount: 1, name: "Greedclaw", elements: ["Dark"], role: "Rogue", desc: "This Greedclaw variant sharpens shadows into claws and collects IOUs from strangers." },
    { id: "GBL042", line: "112", stageIndex: 0, stageCount: 1, name: "Gobblehide", elements: ["Poison"], role: "Wall", desc: "Gobblehide hides until hungry, which means it hides for about four seconds." },
    { id: "GBL043", line: "113", stageIndex: 0, stageCount: 1, name: "Stabog", elements: ["Bug"], role: "Bruiser", desc: "Stabog crawled out of a swamp and immediately asked where the knives were." },
    { id: "GBL044", line: "114", stageIndex: 0, stageCount: 1, name: "Pickmaw", elements: ["Dark"], role: "Miner", desc: "Pickmaw chews tunnels through stone and then invoices the mountain." },
    { id: "GBL045", line: "115", stageIndex: 0, stageCount: 1, name: "Mischzar", elements: ["Fire"], role: "Leader", desc: "Mischzar's flame crown is mostly attitude, but it still burns hats." },
    { id: "GBL046", line: "116", stageIndex: 0, stageCount: 1, name: "Gobmon", elements: ["Poison"], role: "Status", desc: "This Gobmon variant naps in toxic puddles and calls it skincare." },
    { id: "GBL047", line: "117", stageIndex: 0, stageCount: 1, name: "Sneakhide", elements: ["Dark"], role: "Wall", desc: "Sneakhide's cloak contains a goblin, several pockets, and no accountability." },
    { id: "GBL048", line: "118", stageIndex: 0, stageCount: 1, name: "Trickrex", elements: ["Bug"], role: "Biter", desc: "Trickrex has a rex bite, bug legs, and the confidence of a stolen bicycle." },
    { id: "GBL049", line: "119", stageIndex: 0, stageCount: 1, name: "Greedmon", elements: ["Dark"], role: "Rare", desc: "Greedmon's coin belly jingles when it lies, which is constantly." },
    { id: "GBL050", line: "120", stageIndex: 0, stageCount: 1, name: "Gobblemaw", elements: ["Poison"], role: "Rare", desc: "Gobblemaw can swallow a plan whole and spit back a worse one." },
  ];

  const CANON_BRAINROT_ROSTER = [
    { id: "BRT001", line: "121", stageIndex: 0, stageCount: 3, name: "Skibizar", elements: ["Fairy", "Psychic"], role: "Meme Support", evolvesTo: "BRT002", evoLevel: 15, desc: "Skibizar hums in bathroom echo and somehow makes the hallway sparkle." },
    { id: "BRT002", line: "121", stageIndex: 1, stageCount: 3, name: "Rizzon", elements: ["Fairy", "Psychic"], role: "Annoyer", evolvesTo: "BRT003", evoLevel: 34, desc: "Rizzon weaponizes eye contact, then forgets what it was selling." },
    { id: "BRT003", line: "121", stageIndex: 2, stageCount: 3, name: "Gyattrex", elements: ["Fairy", "Psychic"], role: "Mixed Menace", desc: "Gyattrex stomps through reality with maximum confidence and zero context." },
    { id: "BRT004", line: "122", stageIndex: 0, stageCount: 3, name: "Sigmaog", elements: ["Ghost", "Dark"], role: "Randomizer", evolvesTo: "BRT005", evoLevel: 17, desc: "Sigmaog lurks alone by choice, then loudly announces it was by choice." },
    { id: "BRT005", line: "122", stageIndex: 1, stageCount: 3, name: "Fanumzar", elements: ["Ghost", "Dark"], role: "Drain Tank", evolvesTo: "BRT006", evoLevel: 36, desc: "Fanumzar taxes snacks from the living, the dead, and vending machines." },
    { id: "BRT006", line: "122", stageIndex: 2, stageCount: 3, name: "Ohio Rex", elements: ["Ghost", "Dark"], role: "Chaos Sweeper", desc: "Ohio Rex is what happens when a fossil gets resurrected by a comment section." },
    { id: "BRT007", line: "123", stageIndex: 0, stageCount: 2, name: "Grimacex", elements: ["Psychic", "Ghost"], role: "Controller", evolvesTo: "BRT008", evoLevel: 25, desc: "Grimacex smiles like it knows the patch notes and refuses to share." },
    { id: "BRT008", line: "123", stageIndex: 1, stageCount: 2, name: "Mewrex", elements: ["Psychic", "Ghost"], role: "Special Sweeper", desc: "Mewrex floats with forbidden mascot energy and a suspiciously good stat spread." },
    { id: "BRT009", line: "124", stageIndex: 0, stageCount: 1, name: "Skibidrex", elements: ["Fairy"], role: "Annoyer", desc: "Skibidrex bonks rhythmically on pipes until trainers make poor decisions." },
    { id: "BRT010", line: "125", stageIndex: 0, stageCount: 1, name: "Rizzmaw", elements: ["Psychic"], role: "Drain Tank", desc: "Rizzmaw smiles, drains morale, and calls it networking." },
    { id: "BRT011", line: "126", stageIndex: 0, stageCount: 1, name: "Gyatton", elements: ["Ghost"], role: "Randomizer", desc: "Gyatton appears in mirrors only when someone says the joke too loudly." },
    { id: "BRT012", line: "127", stageIndex: 0, stageCount: 1, name: "Sigmaw", elements: ["Normal"], role: "Mixed Menace", desc: "Sigmaw is aggressively ordinary, which makes it everyone else's problem." },
    { id: "BRT013", line: "128", stageIndex: 0, stageCount: 1, name: "Fanumclaw", elements: ["Fairy"], role: "Drain Tank", desc: "Fanumclaw pinches snacks, taxes potions, and files no paperwork." },
    { id: "BRT014", line: "129", stageIndex: 0, stageCount: 1, name: "Ohioblast", elements: ["Ghost"], role: "Chaos Sweeper", desc: "Ohioblast detonates weirdness in a tidy circle and calls it geography." },
    { id: "BRT015", line: "130", stageIndex: 0, stageCount: 1, name: "Grimaclin", elements: ["Psychic"], role: "Controller", desc: "Grimaclin bends spoons, thoughts, and Trial Den signage." },
    { id: "BRT016", line: "131", stageIndex: 0, stageCount: 1, name: "Skibimaw", elements: ["Fairy", "Ghost"], role: "Annoyer", desc: "Skibimaw sings from inside walls and denies owning a mouth." },
    { id: "BRT017", line: "132", stageIndex: 0, stageCount: 1, name: "Rizzlin", elements: ["Psychic"], role: "Meme Support", desc: "Rizzlin buffs allies by saying absolutely nothing with perfect posture." },
    { id: "BRT018", line: "133", stageIndex: 0, stageCount: 1, name: "Gyattog", elements: ["Normal"], role: "Mixed Menace", desc: "Gyattog trots into battle like it owns the route and half the soundtrack." },
    { id: "BRT019", line: "134", stageIndex: 0, stageCount: 1, name: "Sigmaxar", elements: ["Fairy"], role: "Randomizer", desc: "Sigmaxar refuses instructions unless they are delivered by a motivational poster." },
    { id: "BRT020", line: "135", stageIndex: 0, stageCount: 1, name: "Fanumog", elements: ["Ghost"], role: "Drain Tank", desc: "Fanumog haunts lunchboxes and charges an afterlife convenience fee." },
    { id: "BRT021", line: "136", stageIndex: 0, stageCount: 1, name: "Ohiorex", elements: ["Psychic"], role: "Chaos Sweeper", desc: "Ohiorex predicts the next disaster, then causes a weirder one." },
    { id: "BRT022", line: "137", stageIndex: 0, stageCount: 1, name: "Grimaceon", elements: ["Fairy"], role: "Meme Support", desc: "Grimaceon radiates purple confidence and legally ambiguous sweetness." },
    { id: "BRT023", line: "138", stageIndex: 0, stageCount: 1, name: "Skibidogre", elements: ["Ghost"], role: "Mixed Menace", desc: "Skibidogre is too tall for most doors and too haunted for most chairs." },
    { id: "BRT024", line: "139", stageIndex: 0, stageCount: 1, name: "Rizzblast", elements: ["Psychic"], role: "Special Sweeper", desc: "Rizzblast fires charm in straight lines and apology notes in spirals." },
    { id: "BRT025", line: "140", stageIndex: 0, stageCount: 1, name: "Gyattzar", elements: ["Fairy"], role: "Mixed Menace", desc: "Gyattzar wears a tiny crown because the big crown ran away." },
    { id: "BRT026", line: "141", stageIndex: 0, stageCount: 1, name: "Sigmagob", elements: ["Normal"], role: "Annoyer", desc: "Sigmagob stands in the corner and somehow wins the argument." },
    { id: "BRT027", line: "142", stageIndex: 0, stageCount: 1, name: "Fanumhide", elements: ["Ghost"], role: "Drain Tank", desc: "Fanumhide disappears whenever the bill arrives." },
    { id: "BRT028", line: "143", stageIndex: 0, stageCount: 1, name: "Ohiomaw", elements: ["Psychic"], role: "Controller", desc: "Ohiomaw opens portals with its jaw and closes them with bad vibes." },
    { id: "BRT029", line: "144", stageIndex: 0, stageCount: 1, name: "Grimacezar", elements: ["Fairy"], role: "Meme Support", desc: "Grimacezar blesses allies with suspiciously grape-colored courage." },
    { id: "BRT030", line: "145", stageIndex: 0, stageCount: 1, name: "Skibislime", elements: ["Ghost"], role: "Annoyer", desc: "Skibislime leaves spectral puddles and plausible deniability." },
    { id: "BRT031", line: "146", stageIndex: 0, stageCount: 1, name: "Brainrotrex", elements: ["Psychic"], role: "Randomizer", desc: "Brainrotrex forgot the rules so thoroughly that the rules got embarrassed." },
    { id: "BRT032", line: "147", stageIndex: 0, stageCount: 1, name: "Level10Rizz", elements: ["Fairy"], role: "Special Sweeper", desc: "Level10Rizz arrives overleveled in spirit and underleveled in humility." },
    { id: "BRT033", line: "148", stageIndex: 0, stageCount: 1, name: "OhioFinalBoss", elements: ["Ghost", "Dark"], role: "Chaos Sweeper", desc: "OhioFinalBoss is not the final boss, which is exactly how it gets you." },
    { id: "BRT034", line: "149", stageIndex: 0, stageCount: 1, name: "Gyattmaw", elements: ["Normal"], role: "Mixed Menace", desc: "Gyattmaw has one volume setting and it is route-wide." },
    { id: "BRT035", line: "150", stageIndex: 0, stageCount: 1, name: "Sigmahide", elements: ["Fairy"], role: "Randomizer", desc: "Sigmahide blocks attacks by pretending it was never there." },
    { id: "BRT036", line: "151", stageIndex: 0, stageCount: 1, name: "Fanumrex", elements: ["Psychic"], role: "Drain Tank", desc: "Fanumrex audits HP totals with a royal frown." },
    { id: "BRT037", line: "151B", stageIndex: 0, stageCount: 1, name: "Skibiblast", elements: ["Ghost"], role: "Special Sweeper", desc: "Skibiblast launches spectral noise and leaves only subtitles behind." },
  ];

  const EXPANSION_EVOLUTION_ROSTER = [
    { clan: "ogre", baseId: "OGR076", evoId: "OGR077", line: "OGX01", baseName: "Crater Coddle", evoName: "Crater Cudgelord", elements: ["Brute", "Rock"], role: "Tank", evoLevel: 28, habitat: ["ogre"], baseDesc: "Crater Coddle hugs boulders until the boulders apologize.", evoDesc: "Crater Cudgelord swings cooled lava clubs with the patience of a collapsing hill." },
    { clan: "ogre", baseId: "OGR078", evoId: "OGR079", line: "OGX02", baseName: "Gravy Gromplet", evoName: "Gravy Grudgemaw", elements: ["Brute", "Water"], role: "Bulky Support", evoLevel: 30, habitat: ["ogre", "goblin"], baseDesc: "Gravy Gromplet carries soup in its helmet and calls that strategy.", evoDesc: "Gravy Grudgemaw feeds allies warm stew, then tackles enemies through the table." },
    { clan: "ogre", baseId: "OGR080", evoId: "OGR081", line: "OGX03", baseName: "Mossknuckle Nib", evoName: "Mossknuckle Monolith", elements: ["Brute", "Grass"], role: "Fortress", evoLevel: 32, habitat: ["ogre", "goblin"], baseDesc: "Mossknuckle Nib grows tiny shrubs on its shoulders and names them after punches.", evoDesc: "Mossknuckle Monolith stands so still that birds file zoning complaints." },
    { clan: "ogre", baseId: "OGR082", evoId: "OGR083", line: "OGX04", baseName: "Forgebelly Pip", evoName: "Forgebelly Furnace", elements: ["Brute", "Fire"], role: "Wallbreaker", evoLevel: 34, habitat: ["ogre"], baseDesc: "Forgebelly Pip sneezes sparks whenever it thinks about breakfast.", evoDesc: "Forgebelly Furnace laughs in smoke rings and solves locks by melting the door." },
    { clan: "ogre", baseId: "OGR084", evoId: "OGR085", line: "OGX05", baseName: "Ironmug Sprout", evoName: "Ironmug Bastion", elements: ["Brute", "Steel"], role: "Fortress", evoItem: "Big Rock Candy", habitat: ["ogre", "alien"], baseDesc: "Ironmug Sprout wears a pan as a helmet and dares gravity to complain.", evoDesc: "Ironmug Bastion polishes its armor with road signs and stubbornness." },
    { clan: "ogre", baseId: "OGR086", evoId: "OGR087", line: "OGX06", baseName: "Thunderbelch Tad", evoName: "Thunderbelch Titan", elements: ["Brute", "Electric"], role: "Brawler", evoLevel: 36, habitat: ["ogre", "alien"], baseDesc: "Thunderbelch Tad hiccups static into nearby helmets.", evoDesc: "Thunderbelch Titan charges into storms because it thinks thunder is applause." },
    { clan: "ogre", baseId: "OGR088", evoId: "OGR089", line: "OGX07", baseName: "Bogshoulder Bud", evoName: "Bogshoulder Baron", elements: ["Brute", "Poison"], role: "Bruiser", evoLevel: 31, habitat: ["ogre", "goblin"], baseDesc: "Bogshoulder Bud smells like a swamp trying to be motivational.", evoDesc: "Bogshoulder Baron rules mud pits with toxic manners and excellent posture." },
    { clan: "ogre", baseId: "OGR090", evoId: "OGR091", line: "OGX08", baseName: "Cloudclub Cub", evoName: "Cloudclub Colossus", elements: ["Brute", "Flying"], role: "Brawler", evoLevel: 33, habitat: ["ogre", "alien"], baseDesc: "Cloudclub Cub jumps from cliffs and insists falling is just aggressive flying.", evoDesc: "Cloudclub Colossus rides updrafts badly but lands with convincing arguments." },
    { clan: "ogre", baseId: "OGR092", evoId: "OGR093", line: "OGX09", baseName: "Nightoaf Nudge", evoName: "Nightoaf Nullcrusher", elements: ["Brute", "Dark"], role: "Wallbreaker", evoLevel: 35, habitat: ["ogre", "brainrot"], baseDesc: "Nightoaf Nudge practices scary faces in puddles after sunset.", evoDesc: "Nightoaf Nullcrusher headbutts shadows until they become legally solid." },
    { clan: "ogre", baseId: "OGR094", evoId: "OGR095", line: "OGX10", baseName: "Runechomp Runt", evoName: "Runechomp Rampart", elements: ["Brute", "Psychic"], role: "Bulky Support", evoLevel: 37, habitat: ["ogre", "alien"], baseDesc: "Runechomp Runt chews magic stones and burps tiny prophecies.", evoDesc: "Runechomp Rampart predicts danger, then blocks it with its forehead anyway." },

    { clan: "alien", baseId: "ALN076", evoId: "ALN077", line: "ALX01", baseName: "Blinkbyte Sprig", evoName: "Blinkbyte Hyperlink", elements: ["Tech", "Electric"], role: "Fast Blaster", evoLevel: 28, habitat: ["alien"], baseDesc: "Blinkbyte Sprig blinks in Morse code but only knows snack words.", evoDesc: "Blinkbyte Hyperlink teleports mid-sentence and leaves browser tabs in the air." },
    { clan: "alien", baseId: "ALN078", evoId: "ALN079", line: "ALX02", baseName: "Saucerling Bop", evoName: "Saucerlord Bopnova", elements: ["Tech", "Flying"], role: "Support", evoLevel: 30, habitat: ["alien"], baseDesc: "Saucerling Bop hovers three inches too high for normal conversation.", evoDesc: "Saucerlord Bopnova conducts orbit traffic with tiny jazz hands." },
    { clan: "alien", baseId: "ALN080", evoId: "ALN081", line: "ALX03", baseName: "Cachemite", evoName: "Cachemancer", elements: ["Tech", "Psychic"], role: "Controller", evoLevel: 32, habitat: ["alien", "brainrot"], baseDesc: "Cachemite remembers everything except where it put its own antenna.", evoDesc: "Cachemancer predicts enemy moves by reading their loading screens." },
    { clan: "alien", baseId: "ALN082", evoId: "ALN083", line: "ALX04", baseName: "Plasmoid Pipsqueak", evoName: "Plasmoid Parallax", elements: ["Tech", "Fire"], role: "Special Sweeper", evoLevel: 34, habitat: ["alien", "ogre"], baseDesc: "Plasmoid Pipsqueak stores miniature suns in a backpack labeled probably fine.", evoDesc: "Plasmoid Parallax bends heat into angles that make scientists sweat." },
    { clan: "alien", baseId: "ALN084", evoId: "ALN085", line: "ALX05", baseName: "Orbitoodle", evoName: "Orbitoodle Prime", elements: ["Tech", "Water"], role: "Mixed Attacker", evoItem: "Quantum Cog", habitat: ["alien"], baseDesc: "Orbitoodle splashes coolant whenever its ideas overheat.", evoDesc: "Orbitoodle Prime surfs comet tails and debugs waves by staring at them." },
    { clan: "alien", baseId: "ALN086", evoId: "ALN087", line: "ALX06", baseName: "Chromapod", evoName: "Chromapod Kernel", elements: ["Tech", "Steel"], role: "Tech Wall", evoLevel: 36, habitat: ["alien"], baseDesc: "Chromapod sleeps inside an aluminum shell and dreams in pop-up warnings.", evoDesc: "Chromapod Kernel runs defensive firmware on a body shaped like a satellite vault." },
    { clan: "alien", baseId: "ALN088", evoId: "ALN089", line: "ALX07", baseName: "Voidbean", evoName: "Voidbean Oracle", elements: ["Tech", "Dark"], role: "Controller", evoLevel: 31, habitat: ["alien", "brainrot"], baseDesc: "Voidbean whispers into unplugged routers and gets answers.", evoDesc: "Voidbean Oracle knows what lurks between signals and refuses to unsubscribe." },
    { clan: "alien", baseId: "ALN090", evoId: "ALN091", line: "ALX08", baseName: "Glitchlet", evoName: "Glitchlet Overdrive", elements: ["Tech", "Chaos"], role: "Fast Blaster", evoLevel: 33, habitat: ["alien", "brainrot"], baseDesc: "Glitchlet has a tail that clips through furniture and social expectations.", evoDesc: "Glitchlet Overdrive weaponizes bugs so efficiently QA asks for mercy." },
    { clan: "alien", baseId: "ALN092", evoId: "ALN093", line: "ALX09", baseName: "Moonmote", evoName: "Moonmote Mainframe", elements: ["Tech", "Fairy"], role: "Support", evoLevel: 35, habitat: ["alien"], baseDesc: "Moonmote glows softly and insists every night sky needs patch notes.", evoDesc: "Moonmote Mainframe grants lunar buffs with corporate-level sparkle." },
    { clan: "alien", baseId: "ALN094", evoId: "ALN095", line: "ALX10", baseName: "Spectron Tad", evoName: "Spectron Singularity", elements: ["Tech", "Ghost"], role: "Special Sweeper", evoLevel: 37, habitat: ["alien", "brainrot"], baseDesc: "Spectron Tad phases through walls, then apologizes to the wall.", evoDesc: "Spectron Singularity fires haunted lasers from a smile nobody installed." },

    { clan: "goblin", baseId: "GBL076", evoId: "GBL077", line: "GBX01", baseName: "Latchling", evoName: "Latchlord", elements: ["Trick", "Dark"], role: "Disruptor", evoLevel: 28, habitat: ["goblin"], baseDesc: "Latchling locks doors it has never seen just to feel involved.", evoDesc: "Latchlord keeps every key except the one called accountability." },
    { clan: "goblin", baseId: "GBL078", evoId: "GBL079", line: "GBX02", baseName: "Bogbutton", evoName: "Bogbutton Brigand", elements: ["Trick", "Poison"], role: "Status Thief", evoLevel: 30, habitat: ["goblin"], baseDesc: "Bogbutton smells like a wet pocket full of suspicious choices.", evoDesc: "Bogbutton Brigand swaps antidotes with soup labels and runs." },
    { clan: "goblin", baseId: "GBL080", evoId: "GBL081", line: "GBX03", baseName: "Needlenik", evoName: "Needlenik Nuisance", elements: ["Trick", "Bug"], role: "Speedster", evoLevel: 32, habitat: ["goblin"], baseDesc: "Needlenik pokes maps until new shortcuts appear.", evoDesc: "Needlenik Nuisance moves so fast that traps trigger from embarrassment." },
    { clan: "goblin", baseId: "GBL082", evoId: "GBL083", line: "GBX04", baseName: "Candlegrin", evoName: "Candlegrin Crook", elements: ["Trick", "Fire"], role: "Glass Cannon", evoLevel: 34, habitat: ["goblin", "ogre"], baseDesc: "Candlegrin lights fuses to help everyone find them.", evoDesc: "Candlegrin Crook sells smoke bombs by demonstrating them indoors." },
    { clan: "goblin", baseId: "GBL084", evoId: "GBL085", line: "GBX05", baseName: "Mossmug", evoName: "Mossmug Muglord", elements: ["Trick", "Grass"], role: "Trap Setter", evoItem: "Sneak Scarf", habitat: ["goblin"], baseDesc: "Mossmug hides in shrubbery and invoices anyone who trips.", evoDesc: "Mossmug Muglord grows decoy bushes with tiny pickpocket hands." },
    { clan: "goblin", baseId: "GBL086", evoId: "GBL087", line: "GBX06", baseName: "Tinpinch", evoName: "Tinpinch Tactician", elements: ["Trick", "Steel"], role: "Scout", evoLevel: 36, habitat: ["goblin", "alien"], baseDesc: "Tinpinch collects screws and calls them emergency currency.", evoDesc: "Tinpinch Tactician builds armor from stolen toolboxes and bad excuses." },
    { clan: "goblin", baseId: "GBL088", evoId: "GBL089", line: "GBX07", baseName: "Rainrat", evoName: "Rainrat Racketeer", elements: ["Trick", "Water"], role: "Status Thief", evoLevel: 31, habitat: ["goblin"], baseDesc: "Rainrat splashes silently, which somehow makes the splash more suspicious.", evoDesc: "Rainrat Racketeer sells umbrellas with holes exactly where comedy needs them." },
    { clan: "goblin", baseId: "GBL090", evoId: "GBL091", line: "GBX08", baseName: "Kiteklepto", evoName: "Kiteklepto Kingpin", elements: ["Trick", "Flying"], role: "Speedster", evoLevel: 33, habitat: ["goblin", "alien"], baseDesc: "Kiteklepto steals flags, hats, and occasionally wind direction.", evoDesc: "Kiteklepto Kingpin drops trap notes from above and charges delivery." },
    { clan: "goblin", baseId: "GBL092", evoId: "GBL093", line: "GBX09", baseName: "Pebblepunk", evoName: "Pebblepunk Pickboss", elements: ["Trick", "Rock"], role: "Trap Setter", evoLevel: 35, habitat: ["goblin", "ogre"], baseDesc: "Pebblepunk arranges rocks in rude little patterns.", evoDesc: "Pebblepunk Pickboss mines tunnels that spell insults from above." },
    { clan: "goblin", baseId: "GBL094", evoId: "GBL095", line: "GBX10", baseName: "Hexpocket", evoName: "Hexpocket Hoodlum", elements: ["Trick", "Ghost"], role: "Disruptor", evoLevel: 37, habitat: ["goblin", "brainrot"], baseDesc: "Hexpocket keeps haunted coins that spend themselves.", evoDesc: "Hexpocket Hoodlum robs shadows and leaves cursed receipts." },

    { clan: "brainrot", baseId: "BRT076", evoId: "BRT077", line: "BRX01", baseName: "Aura Crumb", evoName: "Aura Monsoon", elements: ["Chaos", "Fairy"], role: "Meme Support", evoLevel: 28, habitat: ["brainrot"], baseDesc: "Aura Crumb sparkles when ignored, which is constantly.", evoDesc: "Aura Monsoon buffs the entire room with glitter and unreasonable confidence." },
    { clan: "brainrot", baseId: "BRT078", evoId: "BRT079", line: "BRX02", baseName: "Delulu Tad", evoName: "Delulord Deluxe", elements: ["Chaos", "Psychic"], role: "Randomizer", evoLevel: 30, habitat: ["brainrot", "alien"], baseDesc: "Delulu Tad believes every miss was actually advanced positioning.", evoDesc: "Delulord Deluxe bends reality until it agrees with the group chat." },
    { clan: "brainrot", baseId: "BRT080", evoId: "BRT081", line: "BRX03", baseName: "Glizzy Gremlin", evoName: "Glizzy Gargantua", elements: ["Chaos", "Normal"], role: "Mixed Menace", evoLevel: 32, habitat: ["brainrot"], baseDesc: "Glizzy Gremlin carries snacks for morale and throws them for damage.", evoDesc: "Glizzy Gargantua turns lunch into a battlefield logistics problem." },
    { clan: "brainrot", baseId: "BRT082", evoId: "BRT083", line: "BRX04", baseName: "NPC Noodle", evoName: "NPC Nemesis", elements: ["Chaos", "Ghost"], role: "Annoyer", evoLevel: 34, habitat: ["brainrot", "goblin"], baseDesc: "NPC Noodle repeats one line until the cave acoustics surrender.", evoDesc: "NPC Nemesis appears behind trainers with quest markers and no context." },
    { clan: "brainrot", baseId: "BRT084", evoId: "BRT085", line: "BRX05", baseName: "Cap Snack", evoName: "Capnado", elements: ["Chaos", "Flying"], role: "Chaos Sweeper", evoItem: "Meme Stone", habitat: ["brainrot", "alien"], baseDesc: "Cap Snack insists every rumor is true if shouted from a high place.", evoDesc: "Capnado spins lies into a weather pattern with excellent footwork." },
    { clan: "brainrot", baseId: "BRT086", evoId: "BRT087", line: "BRX06", baseName: "Doomscroll Dollop", evoName: "Doomscroll Dreadnought", elements: ["Chaos", "Dark"], role: "Drain Tank", evoLevel: 36, habitat: ["brainrot"], baseDesc: "Doomscroll Dollop oozes through bad news and calls it research.", evoDesc: "Doomscroll Dreadnought drains HP by reading cursed comments aloud." },
    { clan: "brainrot", baseId: "BRT088", evoId: "BRT089", line: "BRX07", baseName: "Ratio Runt", evoName: "Ratio Ragnarok", elements: ["Chaos", "Electric"], role: "Fast Blaster", evoLevel: 31, habitat: ["brainrot", "alien"], baseDesc: "Ratio Runt zaps anyone whose argument has weak posture.", evoDesc: "Ratio Ragnarok turns applause meters into lightning cannons." },
    { clan: "brainrot", baseId: "BRT090", evoId: "BRT091", line: "BRX08", baseName: "Slay Slimelet", evoName: "Slay Slime Supreme", elements: ["Chaos", "Poison"], role: "Annoyer", evoLevel: 33, habitat: ["brainrot", "goblin"], baseDesc: "Slay Slimelet drips confidence and something probably not approved.", evoDesc: "Slay Slime Supreme leaves toxic sparkle trails shaped like bad decisions." },
    { clan: "brainrot", baseId: "BRT092", evoId: "BRT093", line: "BRX09", baseName: "Chat Pebble", evoName: "Chat Cataclysm", elements: ["Chaos", "Rock"], role: "Controller", evoLevel: 35, habitat: ["brainrot", "ogre"], baseDesc: "Chat Pebble repeats what everyone just saw and somehow makes it worse.", evoDesc: "Chat Cataclysm rolls downhill with thousands of opinions attached." },
    { clan: "brainrot", baseId: "BRT094", evoId: "BRT095", line: "BRX10", baseName: "Bopster Byte", evoName: "Bopster Brainstorm", elements: ["Chaos", "Tech"], role: "Special Sweeper", evoLevel: 37, habitat: ["brainrot", "alien"], baseDesc: "Bopster Byte dances in compression artifacts and tiny error sounds.", evoDesc: "Bopster Brainstorm remixes reality until every hit lands on beat." },
  ];

  const GYMS = [
    { id: "gym1", x: 18, y: 11, name: "Boulderbelch Bruno", theme: ["Brute", "Rock"], clan: "ogre", badge: "Boulder Bonk Sigil", level: 12, count: 2, aceId: "OGR003", line: "My abs have abs. They are unionized." },
    { id: "gym2", x: 16, y: 45, name: "Sneaky Peeka", theme: ["Bug", "Dark"], clan: "goblin", badge: "Pocket Sand Sigil", level: 17, count: 3, aceId: "GBL003", line: "The floor is a trap, the trap is a floor, and your shoelaces owe rent." },
    { id: "gym3", x: 71, y: 12, name: "Professor Zorbonk", theme: ["Tech", "Electric"], clan: "alien", badge: "Firmware Sigil", level: 23, count: 3, aceId: "ALN003", line: "Welcome to the lab. Please do not lick the satellites." },
    { id: "gym4", x: 72, y: 54, name: "Skibidi Linda", theme: ["Chaos", "Poison"], clan: "brainrot", badge: "Sludge Clip Sigil", level: 29, count: 4, aceId: "BRT003", line: "I put the trial puzzle in a soup and the soup got tenure." },
    { id: "gym5", x: 47, y: 24, name: "Steamjaw Molly", theme: ["Fire", "Water"], clan: "ogre", badge: "Hot Tub Sigil", level: 35, count: 4, aceId: "OGR015", line: "Boiling water is just soup with ambition." },
    { id: "gym6", x: 24, y: 47, name: "Nightcap Niko", theme: ["Dark", "Poison", "Bug"], clan: "goblin", badge: "Dream Sneak Sigil", level: 41, count: 4, aceId: "GBL015", line: "I stole your nightmare and replaced it with a coupon." },
    { id: "gym7", x: 79, y: 16, name: "Chrome Bouncer", theme: ["Steel", "Electric"], clan: "alien", badge: "Chrome Dome Sigil", level: 47, count: 5, aceId: "ALN015", line: "This trial has zero latency and too many stairs." },
    { id: "gym8", x: 84, y: 58, name: "Lord Braincel", theme: ["Chaos", "Tech", "Trick"], clan: "brainrot", badge: "Overload Sigil", level: 53, count: 5, aceId: "BRT033", line: "Eight sigils? Excellent. Now explain the joke to the algorithm." },
  ];

  const ELITE = [
    { id: "elite1", name: "Apex Oaf Gunda", theme: ["Brute", "Rock"], clan: "ogre", level: 58, count: 5, aceId: "OGR025", line: "I trained by headbutting geography." },
    { id: "elite2", name: "Apex Gremlin Tavia", theme: ["Trick", "Poison"], clan: "goblin", level: 61, count: 5, aceId: "GBL025", line: "Every door here is fake except the real one, which is rude." },
    { id: "elite3", name: "Apex Void Dr. Plim", theme: ["Tech", "Psychic"], clan: "alien", level: 64, count: 5, aceId: "ALN025", line: "Your probability of winning is adorable." },
    { id: "elite4", name: "Apex Meme Saint Chadley", theme: ["Chaos", "Dark"], clan: "brainrot", level: 66, count: 5, aceId: "BRT025", line: "I saw the final boss in a cursed thumbnail." },
    { id: "champion", name: "Crown Warden Ogrekid", theme: TYPES, clan: null, level: 69, count: 6, aceId: "BRT049", line: "The Ogreverse bends toward whichever creature has the silliest hat." },
  ];

  const STORY_FLOW = [
    { id: "starter", chapter: "00", title: "First Bond", region: "Memelet Town", target: "Professor Mold Lab", x: 16, y: 61, kind: "tutorial", text: "Choose a starter and receive Capture Orbs." },
    { id: "firstCatch", chapter: "01", title: "Orb Internship", region: "Memelet Town", target: "Orb Intern", x: 21, y: 64, kind: "quest", text: "Catch one wild creature, then report back." },
    trialFlowStep(GYMS[0], 0, "02"),
    trialFlowStep(GYMS[1], 1, "03"),
    { id: "overload1", chapter: "04", title: "Corrupted USB", region: "Slimeport Causeway", target: "Admin Doomscroll", x: 50, y: 38, kind: "villain", text: "After two sigils, intercept Team Overload near the harbor road." },
    trialFlowStep(GYMS[2], 2, "05"),
    trialFlowStep(GYMS[3], 3, "06"),
    trialFlowStep(GYMS[4], 4, "07"),
    { id: "overload2", chapter: "08", title: "Autoplay Ambush", region: "Evergrin Gate", target: "Admin Clipbait", x: 64, y: 39, kind: "villain", text: "After five sigils, stop the hacked Trial Den broadcast." },
    trialFlowStep(GYMS[5], 5, "09"),
    trialFlowStep(GYMS[6], 6, "10"),
    { id: "overloadFinal", chapter: "11", title: "Overload Core", region: "Brainrot Dimension", target: "Lord Scrollus", x: 82, y: 60, kind: "villain", text: "After seven sigils, shut down the Brainrot Overload at the rift." },
    trialFlowStep(GYMS[7], 7, "12"),
    { id: "apex", chapter: "13", title: "Apex Gauntlet", region: "Crown Citadel", target: "Elite Four", x: 88, y: 35, kind: "elite", text: "With eight sigils and Overload stopped, challenge the citadel." },
    { id: "postgame", chapter: "14", title: "Legendary Rift", region: "Brainrot Dimension", target: "Southeast Rift", x: 91, y: 65, kind: "postgame", text: "As Crown Warden, hunt rare legends in postgame rifts." },
  ];

  const TOWN_THEMES = {
    meadow: { ground: "#b7c989", path: "#c7aa6a", trim: "#60d394", accent: "#f3d35b", dark: "#35533f", roof: "#d6534c", detail: "#d8e5a4" },
    ogre: { ground: "#8a7b57", path: "#c1a263", trim: "#de7a3b", accent: "#f3d35b", dark: "#3b332b", roof: "#b87949", detail: "#d6c27c" },
    forge: { ground: "#7b604c", path: "#c48b52", trim: "#f15d3a", accent: "#f3d35b", dark: "#2b2522", roof: "#d65d3a", detail: "#ffb45c" },
    canopy: { ground: "#5f8e64", path: "#b78a4e", trim: "#8ce06f", accent: "#f3d35b", dark: "#263f2f", roof: "#6fb06f", detail: "#d8f0a3" },
    goblin: { ground: "#4d473f", path: "#8b7249", trim: "#8ce06f", accent: "#ff6f69", dark: "#211d24", roof: "#7c5341", detail: "#d9d1a6" },
    harbor: { ground: "#8eb08b", path: "#c7aa6a", trim: "#48a4f0", accent: "#f3d35b", dark: "#1f4d66", roof: "#397cc6", detail: "#d4f4ff" },
    alien: { ground: "#435c70", path: "#566f82", trim: "#4ed5cf", accent: "#f4d64d", dark: "#101820", roof: "#9456d1", detail: "#60d394" },
    brainrot: { ground: "#9456a2", path: "#6d5ec2", trim: "#ff72e1", accent: "#60d394", dark: "#181320", roof: "#ff72e1", detail: "#f3d35b" },
    citadel: { ground: "#8d8fa0", path: "#c8c5b4", trim: "#f3d35b", accent: "#e9e4ff", dark: "#202633", roof: "#d6b85f", detail: "#fff6d7" },
    island: { ground: "#9fbf87", path: "#c7aa6a", trim: "#48a4f0", accent: "#f3d35b", dark: "#305d6f", roof: "#3c9ac5", detail: "#d4f4ff" },
    duel: { ground: "#45566c", path: "#7c83a2", trim: "#4ed5cf", accent: "#f3d35b", dark: "#111827", roof: "#d6b85f", detail: "#ff72e1" },
  };

  const TOWN_ZONES = [
    { key: "grunkridge", name: "Grunkridge", short: "Grunkridge", x1: 12, y1: 9, x2: 26, y2: 16, tile: "town", theme: "ogre", labelX: 14, labelY: 9, iconX: 22, iconY: 11, icon: "stronghold" },
    { key: "fallabore", name: "Fallabore Crater", short: "Fallabore", x1: 36, y1: 12, x2: 44, y2: 18, tile: "town", theme: "ogre", labelX: 36, labelY: 12, iconX: 41, iconY: 15, icon: "crater" },
    { key: "lavaridge", name: "Lavaridge Forge", short: "Lavaridge", x1: 43, y1: 21, x2: 52, y2: 27, tile: "town", theme: "forge", labelX: 43, labelY: 21, iconX: 48, iconY: 24, icon: "forge" },
    { key: "verdanturf", name: "Verdanturf Hollow", short: "Verdanturf", x1: 8, y1: 29, x2: 19, y2: 36, tile: "town", theme: "canopy", labelX: 8, labelY: 29, iconX: 13, iconY: 33, icon: "hollow" },
    { key: "fortree", name: "Fortree Canopy", short: "Fortree", x1: 28, y1: 31, x2: 43, y2: 38, tile: "town", theme: "canopy", labelX: 31, labelY: 31, iconX: 36, iconY: 34, icon: "canopy" },
    { key: "petalbog", name: "Petalbog", short: "Petalbog", x1: 7, y1: 37, x2: 15, y2: 44, tile: "town", theme: "goblin", labelX: 7, labelY: 37, iconX: 11, iconY: 41, icon: "bog" },
    { key: "rustburrow", name: "Rustburrow", short: "Rustburrow", x1: 9, y1: 42, x2: 24, y2: 50, tile: "town", theme: "goblin", labelX: 12, labelY: 44, iconX: 16, iconY: 46, icon: "burrow" },
    { key: "memelet", name: "Memelet Town", short: "Memelet", x1: 12, y1: 59, x2: 25, y2: 67, tile: "town", theme: "meadow", labelX: 14, labelY: 58, iconX: 18, iconY: 63, icon: "labyard" },
    { key: "dewdrop", name: "Dewdrop Isle", short: "Dewdrop", x1: 37, y1: 63, x2: 49, y2: 70, tile: "town", theme: "island", labelX: 38, labelY: 63, iconX: 43, iconY: 67, icon: "isle" },
    { key: "slimeport", name: "Slimeport", short: "Slimeport", x1: 48, y1: 36, x2: 57, y2: 43, tile: "town", theme: "harbor", labelX: 49, labelY: 35, iconX: 53, iconY: 40, icon: "harbor" },
    { key: "duelplaza", name: "Prism Duel Plaza", short: "Duel Plaza", x1: 58, y1: 43, x2: 66, y2: 51, tile: "citadel", theme: "duel", labelX: 58, labelY: 43, iconX: 62, iconY: 47, icon: "arena" },
    { key: "mauvellite", name: "Mauvellite", short: "Mauvellite", x1: 64, y1: 9, x2: 75, y2: 18, tile: "techfloor", theme: "alien", labelX: 65, labelY: 9, iconX: 70, iconY: 13, icon: "tower" },
    { key: "mossdeep", name: "Mossdeep Array", short: "Mossdeep", x1: 76, y1: 11, x2: 85, y2: 20, tile: "techfloor", theme: "alien", labelX: 77, labelY: 11, iconX: 81, iconY: 16, icon: "array" },
    { key: "lilycove", name: "Lilycove Arcade", short: "Lilycove", x1: 63, y1: 20, x2: 75, y2: 27, tile: "techfloor", theme: "alien", labelX: 64, labelY: 20, iconX: 69, iconY: 24, icon: "arcade" },
    { key: "pacifidlog", name: "Pacifidlog Docks", short: "Pacifidlog", x1: 66, y1: 56, x2: 76, y2: 64, tile: "memeFloor", theme: "brainrot", labelX: 67, labelY: 56, iconX: 72, iconY: 60, icon: "dockrift" },
    { key: "sootopolis", name: "Sootopolis Rift", short: "Sootopolis", x1: 77, y1: 48, x2: 89, y2: 59, tile: "memeFloor", theme: "brainrot", labelX: 78, labelY: 48, iconX: 84, iconY: 54, icon: "riftwell" },
    { key: "brainrot", name: "Brainrot Bazaar", short: "Bazaar", x1: 73, y1: 55, x2: 91, y2: 66, tile: "memeFloor", theme: "brainrot", labelX: 80, labelY: 64, iconX: 84, iconY: 58, icon: "bazaar" },
    { key: "evergrin", name: "Evergrin Gate", short: "Evergrin", x1: 76, y1: 31, x2: 84, y2: 39, tile: "citadel", theme: "citadel", labelX: 77, labelY: 31, iconX: 80, iconY: 35, icon: "gate" },
    { key: "crown", name: "Crown Citadel", short: "Crown", x1: 84, y1: 31, x2: 93, y2: 40, tile: "citadel", theme: "citadel", labelX: 84, labelY: 31, iconX: 88, iconY: 35, icon: "citadel" },
  ];

  const state = {
    mode: "title",
    player: null,
    world: null,
    battle: null,
    pvp: null,
    trial: null,
    menu: "home",
    selectedCreature: 0,
    selectedDex: 0,
    titleTick: 0,
    anim: 0,
    stepFx: null,
    battleIntro: null,
    resultBanner: null,
    evolutionFx: null,
    captureFx: null,
    areaBanner: null,
    dialogueFx: null,
    stepParticles: [],
    focusPulse: null,
    lastAreaKey: "",
    toast: "",
    toastUntil: 0,
    panelDirty: true,
    online: {
      enabled: false,
      connecting: false,
      connected: false,
      id: null,
      token: null,
      status: "offline",
      peers: [],
      incoming: null,
      challengeSent: null,
      lastSync: 0,
      lastError: "",
      stream: null,
    },
  };

  const SPRITE_DIR = "assets/sprites";
  const ICON_DIR = "assets/icons";
  const WORLD_ASSET_DIR = "assets/world";
  const PREMIUM_WORLD_DIR = "assets/world-premium";
  const PREMIUM_TILE_DIR = "assets/tiles-premium";
  const BATTLE_BG_DIR = "assets/battle-premium";
  const BATTLE_BG_VERSION = "20260617-premium-battle-v6";
  const GAME_ASSET_VERSION = "20260618-joystick-mobile-v70";
  const TRAINER_DIR = "assets/trainers";
  const TRAINER_ASSET_VERSION = "20260617-story-npc-v5";
  const TITLE_COVER_SRC = "assets/references/ogreverse-region-map-hires-labeled.png";
  const SPRITE_CACHE = new Map();
  const WORLD_ASSET_CACHE = new Map();
  const PREMIUM_WORLD_CACHE = new Map();
  const PREMIUM_TILE_CACHE = new Map();
  const BATTLE_BG_CACHE = new Map();
  const TRAINER_ASSET_CACHE = new Map();
  const TITLE_COVER_CACHE = new Map();
  const WORLD_ASSET_NAMES = ["lab", "pc", "shop", "gym", "elite", "switch", "rift", "tree", "rock", "mushroom", "neon-tower", "slime-prop"];
  const PREMIUM_WORLD_THEMES = ["meadow", "ogre", "forge", "canopy", "goblin", "harbor", "island", "alien", "brainrot", "citadel", "duel"];
  const PREMIUM_WORLD_BUILDINGS = ["lab", "pc", "shop", "gym"];
  const PREMIUM_TILE_VARIANTS = 4;
  const PREMIUM_TILE_KEYS = [
    "beach", "bridge", "cave", "checker", "circuit", "citadel", "deepWater", "dirt", "glitchWall", "memeFloor", "memeGrass", "metal", "moss", "mountain", "mushGrass", "neonGrass", "ogreGrass", "path", "river", "rockGrass", "slime", "techfloor", "void", "wall",
    ...PREMIUM_WORLD_THEMES.flatMap((theme) => [`town_${theme}`, `path_${theme}`]),
  ];
  const BATTLE_BG_NAMES = ["town", "ogre", "alien", "goblin", "brainrot", "citadel"];
  const TRAINER_ASSET_NAMES = ["ogre", "goblin", "alien", "brainrot", "villain", "guard", "trainer", "champion", "player", "prof", "mom", "kid"];
  const PREMIUM_SPRITE_IDS = new Set([
    ...idRange("GBL", 1, 50),
    ...idList("OGR", [1, 2, 3, 15, 25, 49, 50]),
    ...idList("ALN", [1, 2, 3, 4, 5, 6, 10, 15, 20, 25, 30, 40, 45, 49, 50]),
    ...idRange("BRT", 1, 50),
    ...idRange("OGR", 76, 95),
    ...idRange("ALN", 76, 95),
    ...idRange("GBL", 76, 95),
    ...idRange("BRT", 76, 95),
  ]);
  const PREMIUM_SPRITE_FALLBACKS = {
    ogre: {
      basePool: ["OGR001"],
      middlePool: ["OGR002", "OGR015"],
      finalPool: ["OGR003", "OGR015", "OGR025"],
      singlePool: ["OGR015", "OGR025", "OGR003"],
      rarePool: ["OGR025", "OGR049", "OGR050"],
      legendPool: ["OGR049", "OGR050"],
    },
    alien: {
      basePool: ["ALN001", "ALN004", "ALN005", "ALN006"],
      middlePool: ["ALN002", "ALN010", "ALN015", "ALN020"],
      finalPool: ["ALN003", "ALN020", "ALN025", "ALN030", "ALN040"],
      singlePool: ["ALN006", "ALN010", "ALN015", "ALN025", "ALN030", "ALN040", "ALN045"],
      rarePool: ["ALN025", "ALN030", "ALN040", "ALN045", "ALN049", "ALN050"],
      legendPool: ["ALN049", "ALN050"],
    },
    goblin: {
      basePool: ["GBL001", "GBL004", "GBL007", "GBL009", "GBL013", "GBL017", "GBL019", "GBL021"],
      middlePool: ["GBL002", "GBL005", "GBL008", "GBL010", "GBL014", "GBL016", "GBL018", "GBL020"],
      finalPool: ["GBL003", "GBL006", "GBL012", "GBL022", "GBL025", "GBL036"],
      singlePool: ["GBL023", "GBL024", "GBL026", "GBL028", "GBL030", "GBL033", "GBL037", "GBL040"],
      rarePool: ["GBL035", "GBL041", "GBL045", "GBL049", "GBL050"],
      legendPool: ["GBL049", "GBL050"],
    },
    brainrot: {
      basePool: ["BRT001", "BRT004", "BRT007", "BRT010", "BRT012", "BRT015"],
      middlePool: ["BRT002", "BRT005", "BRT008", "BRT017", "BRT020", "BRT027"],
      finalPool: ["BRT003", "BRT006", "BRT023", "BRT025", "BRT031", "BRT037"],
      singlePool: ["BRT009", "BRT011", "BRT013", "BRT014", "BRT016", "BRT018", "BRT021", "BRT024", "BRT028", "BRT030", "BRT034", "BRT036"],
      rarePool: ["BRT025", "BRT029", "BRT031", "BRT033", "BRT036", "BRT049", "BRT050"],
      legendPool: ["BRT033", "BRT049", "BRT050"],
    },
  };
  const EVOLUTION_SPRITE_FAMILIES = {
    ogre: [
      ["OGR001", "OGR002", "OGR003"],
      ["OGR001", "OGR002", "OGR025"],
      ["OGR001", "OGR015", "OGR003"],
      ["OGR001", "OGR015", "OGR025"],
    ],
    alien: [
      ["ALN001", "ALN002", "ALN003"],
      ["ALN004", "ALN010", "ALN020"],
      ["ALN005", "ALN015", "ALN030"],
      ["ALN006", "ALN025", "ALN040"],
    ],
    goblin: [
      ["GBL001", "GBL002", "GBL003"],
      ["GBL004", "GBL005", "GBL006"],
      ["GBL007", "GBL008", "GBL022"],
      ["GBL009", "GBL010", "GBL012"],
      ["GBL013", "GBL014", "GBL025"],
      ["GBL017", "GBL018", "GBL036"],
      ["GBL019", "GBL020", "GBL025"],
      ["GBL021", "GBL022", "GBL036"],
    ],
    brainrot: [
      ["BRT001", "BRT002", "BRT003"],
      ["BRT004", "BRT005", "BRT006"],
      ["BRT007", "BRT008", "BRT023"],
      ["BRT010", "BRT017", "BRT025"],
      ["BRT012", "BRT020", "BRT031"],
      ["BRT015", "BRT027", "BRT037"],
    ],
  };

  const MOVES = generateMoves();
  const MOVES_BY_ID = Object.fromEntries(MOVES.map((move) => [move.id, move]));
  const SPECIES = generateSpecies();
  const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((species) => [species.id, species]));
  const WORLD = generateWorld();
  const NPCS = makeNpcs();

  let keys = new Set();
  let mobileMoveDelay = null;
  let mobileMoveRepeat = null;
  let mobileClickSuppressUntil = 0;
  let mobileJoystickEl = null;
  let mobileJoystickPointerId = null;
  let mobileJoystickDirection = null;
  let mobileJoystickLastMove = 0;
  let lastDebugCapture = 0;
  const DEBUG_CAPTURE = typeof window !== "undefined"
    && typeof window.URLSearchParams !== "undefined"
    && new window.URLSearchParams(window.location.search).has("capture");

  init();

  function idRange(prefix, from, to) {
    const ids = [];
    for (let index = from; index <= to; index += 1) ids.push(`${prefix}${String(index).padStart(3, "0")}`);
    return ids;
  }

  function idList(prefix, numbers) {
    return numbers.map((number) => `${prefix}${String(number).padStart(3, "0")}`);
  }

  function init() {
    resizeGuard();
    WORLD_ASSET_NAMES.forEach((name) => getWorldAssetImage(name));
    preloadPremiumWorldAssets();
    preloadPremiumTerrainTiles();
    BATTLE_BG_NAMES.forEach((name) => getBattleBackgroundImage(name));
    getTitleCoverImage();
    TRAINER_ASSET_NAMES.forEach((name) => {
      getTrainerAssetImage(name, "world");
      getTrainerAssetImage(name, "portrait");
    });
    window.addEventListener("resize", resizeGuard);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeGuard);
    window.addEventListener("orientationchange", resizeGuard);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
    panel.addEventListener("click", onPanelClick);
    setupMobileControls();
    state.hasSave = Boolean(localStorage.getItem(SAVE_KEY));
    applyDebugAutostart();
    state.online.enabled = onlineRequested();
    try { setupAccountUI(); } catch (e) { console.error("account UI", e); }
    renderPanel();
    requestAnimationFrame(loop);
  }

  function applyDebugAutostart() {
    if (!DEBUG_CAPTURE || typeof window.URLSearchParams === "undefined") return;
    const params = new window.URLSearchParams(window.location.search);
    if (params.get("title") === "1") {
      state.player = null;
      state.mode = "title";
      state.battle = null;
      clearTransientChrome();
      return;
    }
    if (params.get("starterSelect") === "1") {
      state.player = createNewGame();
      state.mode = "starter";
      state.battle = null;
      clearTransientChrome();
      return;
    }
    const starterId = params.get("autostart");
    if (!starterId || !SPECIES_BY_ID[starterId]) return;
    state.player = createNewGame();
    state.mode = "starter";
    state.battle = null;
    chooseStarter(starterId);
    const debugBattle = params.get("battle");
    if (params.get("campaign")) seedDebugCampaign(params.get("campaign"));
    if (debugBattle && params.get("crew")) seedDebugCrew(params.get("crew"));
    if (debugBattle) startDebugBattle(debugBattle, params.get("enemy"));
    if (params.get("battleChoice") && state.battle) state.battle.choice = params.get("battleChoice");
    if (!debugBattle && params.get("crew")) seedDebugCrew(params.get("crew"));
    const debugWild = params.get("wild");
    if (!debugBattle && debugWild) startDebugWild(debugWild, params.get("enemy"));
    if (!debugBattle && params.get("pvpDemo") === "1") startDebugPvpDemo(params);
    if (debugBattle || params.get("fx")) clearTransientChrome();
    const outcomeDemo = params.get("outcome");
    if (outcomeDemo && !state.battle && outcomeDemo !== "evolve" && outcomeDemo !== "victory") {
      startDebugBattle(params.get("biome") || "brainrot", params.get("enemy") || "BRT025");
    }
    startOutcomeDemo(outcomeDemo);
    const dexId = params.get("dexId");
    const dexIndex = dexId && SPECIES_BY_ID[dexId]
      ? SPECIES.findIndex((species) => species.id === dexId)
      : Number(params.get("dex") || 0);
    if (Number.isFinite(dexIndex)) state.selectedDex = clamp(dexIndex, 0, SPECIES.length - 1);
    const debugMenu = params.get("menu");
    if (!debugBattle && debugMenu) {
      clearTransientChrome();
      openMenu(debugMenu);
    }
    const debugTrial = params.get("trial");
    if (!debugBattle && debugTrial) {
      const gym = GYMS.find((item) => item.id === debugTrial) || GYMS[0];
      clearTransientChrome();
      state.trial = {
        gymId: gym.id,
        rematch: params.get("rematch") === "1",
        opened: performance.now(),
      };
      state.mode = "trial";
      dirtyPanel();
    }
    const debugTalk = params.get("talk");
    if (!debugBattle && !debugMenu && !debugTrial && debugTalk) {
      const npc = NPCS.find((item) => item.id === debugTalk) || NPCS.find((item) => trainerAssetKey(item.sprite) === debugTalk);
      if (npc) {
        clearTransientChrome();
        state.mode = "overworld";
        state.player.x = clamp(npc.x, 1, WORLD_W - 2);
        state.player.y = clamp(npc.y + 1, 1, WORLD_H - 2);
        state.player.facing = "up";
        const line = npc.dialog?.[0] || npc.trainer?.line || "They stare into the middle distance with tutorial energy.";
        showDialogue(npc, line, 999999, npc.quest ? "quest" : npc.trainer ? "trainer" : "talk");
        dirtyPanel();
      }
    }
  }

  function startOutcomeDemo(kind) {
    if (!kind) return;
    const now = performance.now();
    state.battleIntro = null;
    clearTransientChrome();
    if (kind === "capture") {
      const enemy = state.battle ? activeEnemy() : createCreature("BRT025", 35);
      state.captureFx = {
        itemName: "Rizz Orb",
        enemyId: enemy.id,
        enemyName: enemy.nickname,
        caught: true,
        biome: currentBiome(),
        started: now - 13000,
        until: now + 7000,
      };
      if (state.battle) state.battle.log.unshift("Rizz Orb clicked shut with premium nonsense.");
    } else if (kind === "breakout") {
      const enemy = state.battle ? activeEnemy() : createCreature("BRT025", 35);
      state.captureFx = {
        itemName: "Capture Orb",
        enemyId: enemy.id,
        enemyName: enemy.nickname,
        caught: false,
        biome: currentBiome(),
        started: now - 13000,
        until: now + 7000,
      };
    } else if (kind === "victory") {
      state.resultBanner = {
        title: "VICTORY",
        text: "Trial reward claimed",
        reward: "Great Orb x3 / $2680",
        biome: "ogre",
        started: now - 9000,
        until: now + 9000,
      };
    } else if (kind === "evolve") {
      state.evolutionFx = {
        oldId: "OGR001",
        newId: "OGR002",
        oldName: SPECIES_BY_ID.OGR001.name,
        newName: SPECIES_BY_ID.OGR002.name,
        started: now - 12500,
        until: now + 7000,
      };
    }
  }

  function clearTransientChrome() {
    state.areaBanner = null;
    state.dialogueFx = null;
    state.toast = "";
    state.toastUntil = 0;
    toastEl.textContent = "";
    toastEl.classList.remove("active");
  }

  function startDebugBattle(biome, enemyId) {
    const params = typeof window !== "undefined" ? new window.URLSearchParams(window.location.search) : null;
    const coords = {
      town: [16, 62],
      ogre: [19, 12],
      goblin: [17, 46],
      alien: [72, 14],
      brainrot: [78, 55],
      citadel: [87, 38],
    }[biome] || [16, 62];
    const defaults = {
      town: "OGR003",
      ogre: "OGR025",
      goblin: "GBL025",
      alien: "ALN025",
      brainrot: "BRT025",
      citadel: "BRT049",
    };
    const targetId = SPECIES_BY_ID[enemyId] ? enemyId : defaults[biome] || "BRT025";
    const arenaLevel = biome === "brainrot" || biome === "citadel" ? 55 : 34;
    state.player.x = coords[0];
    state.player.y = coords[1];
    state.player.facing = "up";
    state.player.party[0].level = Math.max(state.player.party[0].level, arenaLevel);
    state.player.party[0].exp = expForLevel(state.player.party[0].level);
    state.player.party[0].hp = calcStats(state.player.party[0]).hp;
    ensureCreatureMoves(state.player.party[0]);
    if (params?.get("crew")) {
      state.player.party.forEach((creature, index) => {
        creature.level = Math.max(creature.level, arenaLevel - Math.min(index, 6));
        creature.exp = expForLevel(creature.level);
        creature.hp = calcStats(creature).hp;
        ensureCreatureMoves(creature);
      });
    }
    startBattle({
      kind: biome === "brainrot" ? "villain" : "battle",
      name: `${titleCase(biome)} Arena`,
      enemyParty: [createCreature(targetId, arenaLevel)],
      trainerSprite: biome === "citadel" ? "champion" : biome === "brainrot" ? "villain" : biome,
      line: `${titleCase(biome)} arena erupts into a challenge.`,
      canRun: true,
    });
    if (params?.get("intro") === "1" && state.battleIntro) {
      const now = performance.now();
      state.battleIntro.started = now - 12000;
      state.battleIntro.until = now + 12000;
    }
    const fxType = params?.get("fx");
    if (fxType && state.battle) {
      const moveType = TYPE_CHART[fxType] ? fxType : "Chaos";
      const now = performance.now();
      const moveName = params.get("move") || `${titleCase(moveType)} Showcase`;
      const fxResult = params.get("fxResult") || "super";
      state.battle.fx = {
        attacker: params.get("fxAttacker") === "you" ? "you" : "foe",
        target: params.get("fxTarget") === "foe" ? "foe" : "you",
        attackerId: (params.get("fxAttacker") === "you" ? activePlayer() : activeEnemy()).id,
        targetId: (params.get("fxTarget") === "foe" ? activeEnemy() : activePlayer()).id,
        attackerClan: SPECIES_BY_ID[(params.get("fxAttacker") === "you" ? activePlayer() : activeEnemy()).id]?.clan || null,
        moveType,
        category: params.get("fxCategory") || "Special",
        moveName,
        result: fxResult,
        damage: Number(params.get("damage") || (fxResult === "super" ? 128 : fxResult === "resist" ? 28 : 72)),
        multiplier: fxResult === "super" ? 2 : fxResult === "resist" ? 0.5 : 1,
        seed: 77,
        started: now - 52000,
        until: now + 32000,
      };
      const debugFxUser = state.battle.fx.attacker === "you" ? activePlayer() : activeEnemy();
      state.battle.log.unshift(`${debugFxUser.nickname} used ${moveName}.`);
    }
    const battleChoice = params?.get("battleChoice");
    if (battleChoice && state.battle) state.battle.choice = battleChoice;
  }

  function startDebugWild(biome, enemyId) {
    const coords = {
      town: [16, 62],
      ogre: [19, 12],
      goblin: [17, 46],
      alien: [72, 14],
      brainrot: [78, 55],
    }[biome] || [16, 62];
    const level = clamp(Number(new URLSearchParams(window.location.search).get("level")) || wildLevelFor(biome), 3, 80);
    const targetId = SPECIES_BY_ID[enemyId] ? enemyId : null;
    const enemy = targetId ? createCreature(targetId, level) : pickWildCreature(biome, level);
    state.player.x = coords[0];
    state.player.y = coords[1];
    state.player.facing = "up";
    state.player.party[0].level = Math.max(state.player.party[0].level, Math.min(level + 2, 80));
    state.player.party[0].exp = expForLevel(state.player.party[0].level);
    state.player.party[0].hp = calcStats(state.player.party[0]).hp;
    ensureCreatureMoves(state.player.party[0]);
    markSeen(enemy.id);
    startBattle({
      kind: "wild",
      name: `Wild ${enemy.nickname}`,
      enemyParty: [enemy],
      canRun: true,
      music: "wild",
    });
    clearTransientChrome();
  }

  function startDebugPvpDemo(params = null) {
    if (!state.player?.party?.length) return;
    if (!params?.get("crew")) seedDebugCrew("showcase");
    const now = Date.now();
    const makePvpCreature = (creature, hpRatio = 1, status = "") => {
      const species = SPECIES_BY_ID[creature.id] || SPECIES_BY_ID.OGR001;
      const stats = calcStats(creature);
      ensureCreatureMoves(creature);
      const hp = Math.max(0, Math.floor(stats.hp * hpRatio));
      return {
        speciesId: creature.id,
        name: creature.nickname || species.name,
        clan: species.clan,
        level: creature.level,
        hp,
        maxHp: stats.hp,
        fainted: hp <= 0,
        status,
        statusLabel: status ? status.slice(0, 4).toUpperCase() : "",
        statusTurns: status ? 2 : 0,
        moves: creature.moves.slice(0, 4).map((slot) => {
          const move = MOVES_BY_ID[slot.id] || MOVES[0];
          return {
            id: slot.id,
            name: move.name,
            type: move.type,
            power: move.power || 0,
            accuracy: move.accuracy || 100,
            pp: slot.pp,
            maxPp: move.pp || slot.pp || 1,
            effectLabel: move.category === "Status" ? "STATUS" : move.effect?.drain ? "DRAIN" : move.effect?.status ? "STATUS" : "SERVER",
          };
        }),
      };
    };
    const playerParty = state.player.party.slice(0, 6).map((creature, index) => ({
      ...makePvpCreature(creature, index === 0 ? 0.72 : index === 2 ? 0.45 : 1, index === 2 ? "Blinded" : ""),
      active: index === 0,
      slot: index,
    }));
    const foeIds = ["ALN003", "BRT006", "GBL006", "OGR015", "ALN025", "BRT033"];
    const foeParty = foeIds.map((id, index) => ({
      ...makePvpCreature(createCreature(id, 42 + index * 2), index === 0 ? 0.63 : index === 3 ? 0 : 1, index === 0 ? "Burned" : ""),
      active: index === 0,
      slot: index,
    }));
    state.player.x = 62;
    state.player.y = 49;
    state.player.facing = "up";
    state.mode = "pvp";
    state.battle = null;
    state.pvp = {
      roomId: "room_prism_demo",
      opponentName: "Bloop",
      challenge: {
        from: "debug-you",
        to: "debug-foe",
        fromName: state.player.name || "You",
        toName: "Bloop",
      },
      busy: false,
      lastError: "",
      viewReceivedAt: now,
      lastClockSecond: null,
      timeoutPollTurn: null,
      view: {
        id: "room_prism_demo",
        turn: 7,
        status: params?.get("pvpStatus") || "select",
        winnerId: null,
        timeoutLoserId: null,
        deadlineAt: now + 27000,
        serverTime: now,
        turnTimeoutMs: 45000,
        you: {
          playerId: "debug-you",
          name: state.player.name || "You",
          activeIndex: 0,
          creature: playerParty[0],
          party: playerParty,
          items: [
            { id: "mend", name: "Mend Patch", label: "HEAL", description: "Restores server-authorized HP.", quantity: 2 },
            { id: "clear_cache", name: "Clear Cache", label: "CURE", description: "Clears status from the active creature.", quantity: 1 },
            { id: "pp_cell", name: "PP Cell", label: "PP", description: "Restores one selected move packet.", quantity: 1 },
          ],
          ready: false,
        },
        foe: {
          playerId: "debug-foe",
          name: "Bloop",
          activeIndex: 0,
          creature: foeParty[0],
          party: foeParty,
          items: [],
          ready: true,
        },
        log: [
          "Bloop locked a move.",
          "Turn 6 resolved by server.",
          "Zorblax Signalbean used Quantum Slap for 74 damage.",
          "Server room opened. Choose a move or switch.",
        ],
        lastEvents: [{
          kind: "move",
          attackerId: "debug-foe",
          defenderId: "debug-you",
          moveId: "quantum_slap",
          type: "Tech",
          hit: true,
          damage: 74,
        }],
      },
    };
    clearTransientChrome();
  }

  function seedDebugCrew(profile = "balanced") {
    if (!state.player?.party?.length) return;
    const addIds = profile === "showcase"
      ? ["OGR006", "ALN006", "BRT034", "BRT036", "OGR011", "ALN012"]
      : profile === "brainrot"
      ? ["BRT003", "BRT025", "GBL003", "ALN003", "OGR003"]
      : ["OGR003", "ALN003", "GBL003", "BRT003", "BRT025"];
    addIds.forEach((id, index) => {
      if (!SPECIES_BY_ID[id] || state.player.party.some((creature) => creature.id === id)) return;
      const creature = createCreature(id, 16 + index * 7);
      state.player.party.push(creature);
      markSeen(id);
      markCaught(id);
    });
    state.player.party = state.player.party.slice(0, 6);
    ["GBL025", "ALN025", "OGR025", "BRT033"].forEach((id, index) => {
      if (!SPECIES_BY_ID[id]) return;
      const creature = createCreature(id, 28 + index * 8);
      state.player.pc.push(creature);
      markSeen(id);
      if (index < 2) markCaught(id);
    });
    state.player.money = Math.max(state.player.money, 6400);
    state.player.bag["Great Orb"] = Math.max(state.player.bag["Great Orb"] || 0, 8);
    state.player.bag["Ultra Orb"] = Math.max(state.player.bag["Ultra Orb"] || 0, 4);
    state.player.bag["Rizz Orb"] = Math.max(state.player.bag["Rizz Orb"] || 0, 2);
  }

  function seedDebugCampaign(profile = "mid") {
    if (!state.player) return;
    const namedCounts = { early: 1, mid: 4, late: 7, finale: 8, champion: 8, postgame: 8 };
    const parsed = Number(profile);
    const badgeCount = clamp(Number.isFinite(parsed) ? parsed : namedCounts[profile] ?? 4, 0, GYMS.length);
    state.player.badges = GYMS.slice(0, badgeCount).map((gym) => gym.badge);
    state.player.quests.starter = "complete";
    state.player.quests.firstCatch = "complete";
    state.player.quests.gymQuest = badgeCount >= 8 ? "complete" : "active";
    state.player.quests.overload = badgeCount >= 2 ? "active" : "locked";
    state.player.quests.postgame = "locked";
    state.player.defeated.overload1 = badgeCount >= 2;
    state.player.defeated.overload2 = badgeCount >= 5;
    state.player.defeated.overloadFinal = profile === "champion" || profile === "postgame" || badgeCount >= 8;
    if (state.player.defeated.overloadFinal) state.player.quests.overload = "complete";
    state.player.switches.brain1 = badgeCount >= 7;
    state.player.switches.brain2 = badgeCount >= 7;
    state.player.switches.brain3 = badgeCount >= 7;
    state.player.champion = profile === "champion" || profile === "postgame";
    state.player.postGameUnlocked = state.player.champion;
    state.player.quests.postgame = state.player.champion ? "active" : "locked";
    state.player.money = Math.max(state.player.money, 12800);
    ["Great Orb", "Ultra Orb", "Rizz Orb", "Potion", "Super Snack", "Revive"].forEach((name) => {
      state.player.bag[name] = Math.max(state.player.bag[name] || 0, name === "Rizz Orb" ? 4 : 8);
    });
    const levelTarget = state.player.champion ? 72 : badgeCount >= 7 ? 58 : badgeCount >= 4 ? 42 : 24;
    state.player.party.forEach((creature) => {
      creature.level = Math.max(creature.level, levelTarget);
      creature.exp = expForLevel(creature.level);
      creature.hp = calcStats(creature).hp;
      ensureCreatureMoves(creature);
      creature.moves.forEach((slot) => (slot.pp = MOVES_BY_ID[slot.id].pp));
    });
    const step = activeStoryStep();
    state.player.x = step.x;
    state.player.y = Math.max(1, step.y + 1);
    state.player.facing = "up";
  }

  function preloadPremiumWorldAssets() {
    PREMIUM_WORLD_THEMES.forEach((theme) => {
      PREMIUM_WORLD_BUILDINGS.forEach((tile) => getPremiumWorldImage(`building_${tile}_${theme}`));
      ["large", "small", "path"].forEach((size) => getPremiumWorldImage(`prop_${size}_${theme}`));
    });
    getPremiumWorldImage("building_elite_citadel");
  }

  function preloadPremiumTerrainTiles() {
    PREMIUM_TILE_KEYS.forEach((key) => {
      for (let variant = 0; variant < PREMIUM_TILE_VARIANTS; variant += 1) {
        getPremiumTileImage(key, variant);
      }
    });
  }

  function resizeGuard() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (typeof document !== "undefined") {
      const height = window.visualViewport?.height || window.innerHeight || 0;
      if (height) document.documentElement.style.setProperty("--ogre-vh", `${height * 0.01}px`);
    }
  }

  function loop(time) {
    state.anim = time;
    draw();
    updateOnline(time);
    updatePvpClock();
    if (DEBUG_CAPTURE && time - lastDebugCapture > 900) {
      lastDebugCapture = time;
      try {
        let snapshot = canvas.toDataURL("image/png");
        if (snapshot.length > 180000) snapshot = canvas.toDataURL("image/jpeg", 0.94);
        canvas.setAttribute("data-ogre-snapshot", snapshot);
      } catch {
        canvas.setAttribute("data-ogre-snapshot", "");
      }
    }
    updateToast();
    requestAnimationFrame(loop);
  }

  function dirtyPanel() {
    state.panelDirty = true;
    renderPanel();
  }

  function toast(text, ms = 2400) {
    state.toast = text;
    state.toastUntil = performance.now() + ms;
    updateToast();
  }

  function showDialogue(source, text, ms = 5200, tag = "") {
    const raw = String(text || "");
    const colon = raw.indexOf(":");
    const speaker = colon > 0 && colon < 32
      ? raw.slice(0, colon).trim()
      : source?.trainer?.name || source?.name || speakerNameForSprite(source?.sprite) || "Ogreverse";
    const body = colon > 0 && colon < 32 ? raw.slice(colon + 1).trim() : raw;
    const sprite = source?.sprite || source?.trainer?.clan || source?.trainerSprite || "trainer";
    const accent = source?.trainer?.theme?.[0] ? TYPE_COLORS[source.trainer.theme[0]] : biomeAccent(spriteToBiome(sprite));
    const alt = source?.trainer?.theme?.[1] ? TYPE_COLORS[source.trainer.theme[1]] : biomeAccentAlt(spriteToBiome(sprite));
    state.dialogueFx = {
      speaker,
      body,
      sprite,
      tag: tag || dialogueTagForSource(source),
      accent,
      alt,
      started: performance.now(),
      until: performance.now() + ms,
    };
    state.toast = "";
    state.toastUntil = 0;
    updateToast();
  }

  function speakerNameForSprite(sprite) {
    return {
      prof: "Professor Mold",
      mom: "Mom",
      kid: "Orb Intern",
      ogre: "Ogre Trainer",
      goblin: "Goblin Trainer",
      alien: "Alien Trainer",
      brainrot: "Brainrot Trainer",
      guard: "Gate Guard",
      villain: "Team Overload",
    }[sprite] || "Trainer";
  }

  function dialogueTagForSource(source) {
    if (!source) return "field";
    if (source.villain) return "overload";
    if (source.quest) return "quest";
    if (source.trainer) return "trainer";
    return "talk";
  }

  function spriteToBiome(sprite) {
    return {
      ogre: "ogre",
      goblin: "goblin",
      alien: "alien",
      brainrot: "brainrot",
      villain: "brainrot",
      champion: "citadel",
      guard: "citadel",
      prof: "town",
      mom: "town",
      kid: "town",
      player: "town",
    }[sprite] || currentBiome();
  }

  function updateToast() {
    if (performance.now() < state.toastUntil && state.toast) {
      toastEl.textContent = state.toast;
      toastEl.classList.add("active");
    } else {
      toastEl.textContent = "";
      toastEl.classList.remove("active");
    }
  }

  function generateMoves() {
    const moves = [];
    TYPES.forEach((type) => {
      MOVE_BLUEPRINTS[type].forEach((spec, index) => {
        const [name, category, power, accuracy, pp, effect] = spec;
        moves.push({
          id: slug(`${type}_${name}`),
          name,
          type,
          category,
          power,
          accuracy,
          pp,
          effect: effect || {},
          tier: index,
          desc: moveDescription(type, name, category, power, effect || {}),
        });
      });
    });
    return moves;
  }

  function moveDescription(type, name, category, power, effect) {
    if (category === "Status") {
      if (effect.heal) return `${name} restores stamina with ${type.toLowerCase()} nonsense.`;
      if (effect.stat && effect.target === "self") return `${name} boosts the user's ${statLabel(effect.stat)}.`;
      if (effect.stat) return `${name} lowers the foe's ${statLabel(effect.stat)}.`;
      if (effect.status) return `${name} inflicts ${effect.status}.`;
      return `${name} bends the turn with pure vibes.`;
    }
    const bits = [`${category} ${type} hit with ${power} power.`];
    if (effect.status) bits.push(`May inflict ${effect.status}.`);
    if (effect.drain) bits.push("Drains HP.");
    if (effect.random) bits.push("May cause a random brainrot side effect.");
    if (effect.flinch) bits.push("May make the foe flinch.");
    return bits.join(" ");
  }

  function generateSpecies() {
    const list = [];
    let number = 1;
    CLANS.forEach((clan) => {
      const linePlans = [
        ...Array(5).fill(3),
        ...Array(15).fill(2),
        ...Array(5).fill(1),
        ...Array(4).fill(3),
        ...Array(5).fill(2),
        ...Array(3).fill(1),
        ...Array(10).fill(2),
      ];
      let local = 1;
      linePlans.forEach((stageCount, lineIndex) => {
        const ids = [];
        const secondary = clan.types[lineIndex % clan.types.length];
        const role = pickRole(clan.key, lineIndex);
        const legendaryLine = stageCount === 1 && lineIndex >= 23;
        for (let stageIndex = 0; stageIndex < stageCount; stageIndex += 1) {
          const id = `${clan.code}${String(local).padStart(3, "0")}`;
          const name = makeSpeciesName(clan, lineIndex, stageIndex, stageCount);
          const stageLabel = stageIndex === 0 ? "base" : stageIndex === 1 ? "middle" : "final";
          const elements = makeElements(clan, secondary, stageIndex, lineIndex);
          const rarity = makeRarity(stageCount, stageIndex, lineIndex, legendaryLine);
          const baseStats = makeBaseStats(clan.key, role, stageCount, stageIndex, legendaryLine, lineIndex);
          const habitat = makeHabitats(clan, secondary, legendaryLine);
          const species = {
            number,
            id,
            name,
            clan: clan.key,
            clanLabel: clan.label,
            lineId: `${clan.code}-L${lineIndex + 1}`,
            stageIndex,
            stageCount,
            stageLabel,
            role,
            elements,
            rarity,
            habitat,
            baseStats,
            captureRate: captureRateFor(rarity, stageIndex),
            expYield: Math.round(sumStats(baseStats) / 6 + stageIndex * 18 + (legendaryLine ? 65 : 0)),
            visual: visualText(clan, secondary, stageIndex, legendaryLine),
            desc: dexText(clan, name, elements, role, lineIndex, legendaryLine),
            learnset: [],
            evolvesTo: null,
            evoLevel: null,
            evoItem: null,
            evoCondition: null,
            legendary: legendaryLine,
            starter: false,
          };
          ids.push(id);
          list.push(species);
          local += 1;
          number += 1;
        }
        for (let i = 0; i < ids.length - 1; i += 1) {
          const from = list.find((species) => species.id === ids[i]);
          from.evolvesTo = ids[i + 1];
          if (stageCount === 3 && i === 0) {
            from.evoLevel = 16 + (lineIndex % 4);
          } else if (stageCount === 3 && i === 1) {
            from.evoLevel = 36 + (lineIndex % 6);
            if (lineIndex % 3 === 0) from.evoCondition = "Night";
          } else if (lineIndex % 6 === 0) {
            from.evoItem = clan.evoItem;
          } else {
            from.evoLevel = 22 + (lineIndex % 10);
          }
        }
      });
    });

    applyCanonGoblinRoster(list);
    applyCanonBrainrotRoster(list);
    applyExpansionEvolutionRoster(list);
    ensureUniversalEvolutionCoverage(list);
    assignSpeciesAbilities(list);

    const starterIds = ["OGR001", "ALN001", "GBL001", "BRT001"];
    list.forEach((species) => {
      species.starter = starterIds.includes(species.id);
      species.learnset = buildLearnset(species);
    });
    ensureEvolutionMoveDeltas(list);
    return list;
  }

  function applyCanonGoblinRoster(list) {
    const roleMap = {
      Sneak: "Disruptor",
      Bruiser: "Bruiser",
      Warlord: "Wallbreaker",
      Trickster: "Status Thief",
      Ambusher: "Trap Setter",
      Assassin: "Glass Cannon",
      Breaker: "Wallbreaker",
      "Bulky Breaker": "Bruiser",
      Striker: "Speedster",
      Duelist: "Mixed Attacker",
      Prankster: "Status Thief",
      Bomber: "Glass Cannon",
      Status: "Status Thief",
      Disruptor: "Disruptor",
      Venom: "Status Thief",
      Wall: "Trap Setter",
      Fast: "Speedster",
      Utility: "Scout",
      "Glass Cannon": "Glass Cannon",
      Attacker: "Mixed Attacker",
      Drain: "Drain Tank",
      Rogue: "Speedster",
      Burst: "Glass Cannon",
      Tank: "Tank",
      Biter: "Bruiser",
      Leader: "Disruptor",
      Miner: "Trap Setter",
      Rare: "Mixed Attacker",
    };
    CANON_GOBLIN_ROSTER.forEach((canon, index) => {
      const species = list.find((item) => item.id === canon.id);
      if (!species) return;
      species.name = canon.name;
      species.clan = "goblin";
      species.clanLabel = "Goblin";
      species.lineId = `GBL-CANON-${canon.line}`;
      species.stageIndex = canon.stageIndex;
      species.stageCount = canon.stageCount;
      species.stageLabel = canon.stageIndex === 0 ? "base" : canon.stageIndex === canon.stageCount - 1 ? "final" : "middle";
      species.role = roleMap[canon.role] || canon.role.toLowerCase();
      species.elements = [...canon.elements];
      species.habitat = ["goblin"];
      if (canon.elements.includes("Fire")) species.habitat.push("ogre");
      if (canon.elements.includes("Bug") || canon.elements.includes("Poison")) species.habitat.push("goblin");
      if (canon.elements.includes("Dark")) species.habitat.push("brainrot");
      species.habitat = [...new Set(species.habitat)];
      species.rarity = canon.stageCount === 3 && canon.stageIndex === 2 ? "rare" : canon.stageCount === 2 && canon.stageIndex === 1 ? "uncommon" : index >= 45 ? "rare" : "common";
      species.baseStats = makeBaseStats("goblin", species.role, canon.stageCount, canon.stageIndex, false, index);
      species.captureRate = captureRateFor(species.rarity, canon.stageIndex);
      species.expYield = Math.round(sumStats(species.baseStats) / 6 + canon.stageIndex * 18);
      species.visual = `Canon Goblin ${canon.line}: ${canon.name}. Use the high-quality front/back Rage Cage sprite reference, strong GBA outline, mischievous expression, and tight 16-color palette.`;
      species.desc = canon.desc;
      species.evolvesTo = canon.evolvesTo || null;
      species.evoLevel = canon.evoLevel || null;
      species.evoItem = null;
      species.evoCondition = null;
      species.legendary = false;
    });
  }

  function applyCanonBrainrotRoster(list) {
    const roleMap = {
      "Chaos Sweeper": "Chaos Sweeper",
      Annoyer: "Annoyer",
      "Drain Tank": "Drain Tank",
      Randomizer: "Randomizer",
      "Meme Support": "Meme Support",
      "Mixed Menace": "Mixed Menace",
      Controller: "Controller",
      "Special Sweeper": "Special Sweeper",
    };
    CANON_BRAINROT_ROSTER.forEach((canon, index) => {
      const species = list.find((item) => item.id === canon.id);
      if (!species) return;
      species.name = canon.name;
      species.clan = "brainrot";
      species.clanLabel = "Brainrot";
      species.lineId = `BRT-CANON-${canon.line}`;
      species.stageIndex = canon.stageIndex;
      species.stageCount = canon.stageCount;
      species.stageLabel = canon.stageIndex === 0 ? "base" : canon.stageIndex === canon.stageCount - 1 ? "final" : "middle";
      species.role = roleMap[canon.role] || "Randomizer";
      species.elements = [...canon.elements];
      species.habitat = ["brainrot"];
      if (canon.elements.includes("Psychic")) species.habitat.push("alien");
      if (canon.elements.includes("Ghost") || canon.elements.includes("Dark")) species.habitat.push("goblin");
      if (canon.elements.includes("Normal") || canon.elements.includes("Fairy")) species.habitat.push("brainrot");
      species.habitat = [...new Set(species.habitat)];
      species.rarity = canon.name === "OhioFinalBoss" || canon.name === "Mewrex" ? "rare" : canon.stageCount === 3 && canon.stageIndex === 2 ? "rare" : canon.stageCount === 2 && canon.stageIndex === 1 ? "uncommon" : "common";
      species.baseStats = makeBaseStats("brainrot", species.role, canon.stageCount, canon.stageIndex, false, index);
      if (canon.name === "OhioFinalBoss") {
        species.baseStats = normalizeStats({
          hp: species.baseStats.hp + 18,
          atk: species.baseStats.atk + 16,
          def: species.baseStats.def + 8,
          spa: species.baseStats.spa + 18,
          spd: species.baseStats.spd + 10,
          spe: species.baseStats.spe + 12,
        }, 520);
      }
      species.captureRate = captureRateFor(species.rarity, canon.stageIndex);
      species.expYield = Math.round(sumStats(species.baseStats) / 6 + canon.stageIndex * 20);
      species.visual = `Canon Brainrot ${canon.line}: ${canon.name}. Exaggerated meme-chaos creature, GBA battle sprite silhouette, bold outline, funny facial expression, compact 16-color palette.`;
      species.desc = canon.desc;
      species.evolvesTo = canon.evolvesTo || null;
      species.evoLevel = canon.evoLevel || null;
      species.evoItem = null;
      species.evoCondition = null;
      species.legendary = false;
    });
  }

  function applyExpansionEvolutionRoster(list) {
    const clanByKey = Object.fromEntries(CLANS.map((clan) => [clan.key, clan]));
    EXPANSION_EVOLUTION_ROSTER.forEach((line, index) => {
      const clan = clanByKey[line.clan];
      if (!clan) return;
      [
        { id: line.baseId, name: line.baseName, stageIndex: 0, desc: line.baseDesc },
        { id: line.evoId, name: line.evoName, stageIndex: 1, desc: line.evoDesc },
      ].forEach((entry) => {
        const species = list.find((item) => item.id === entry.id);
        if (!species) return;
        species.name = entry.name;
        species.clan = clan.key;
        species.clanLabel = clan.label;
        species.lineId = `${clan.code}-EXP-${line.line}`;
        species.stageIndex = entry.stageIndex;
        species.stageCount = 2;
        species.stageLabel = entry.stageIndex === 0 ? "base" : "final";
        species.role = line.role;
        species.elements = [...line.elements];
        species.habitat = [...new Set(line.habitat || clan.habitats)];
        species.rarity = entry.stageIndex === 0
          ? (index % 4 === 0 ? "uncommon" : "common")
          : (index % 5 === 0 ? "rare" : "uncommon");
        species.baseStats = makeBaseStats(clan.key, line.role, 2, entry.stageIndex, false, 80 + index);
        species.captureRate = captureRateFor(species.rarity, entry.stageIndex);
        species.expYield = Math.round(sumStats(species.baseStats) / 6 + entry.stageIndex * 20);
        species.visual = `Expansion ${line.line}: ${entry.name}. Premium-family ${clan.label.toLowerCase()} sprite routing, sharper evolved silhouette, ${line.elements.join("/")} accents, and readable GBA battle scale.`;
        species.desc = entry.desc;
        species.evolvesTo = entry.stageIndex === 0 ? line.evoId : null;
        species.evoLevel = entry.stageIndex === 0 ? (line.evoLevel || null) : null;
        species.evoItem = entry.stageIndex === 0 ? (line.evoItem || null) : null;
        species.evoCondition = entry.stageIndex === 0 ? (line.evoCondition || null) : null;
        species.legendary = false;
      });
    });
  }

  function ensureUniversalEvolutionCoverage(list) {
    const incoming = new Map();
    list.forEach((species) => {
      if (!species.evolvesTo) return;
      if (!incoming.has(species.evolvesTo)) incoming.set(species.evolvesTo, []);
      incoming.get(species.evolvesTo).push(species.id);
    });

    CLANS.forEach((clan) => {
      const orphans = list
        .filter((species) => species.clan === clan.key && !species.evolvesTo && !incoming.has(species.id))
        .sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));

      const madeLines = [];
      for (let i = 0; i < orphans.length; i += 2) {
        const base = orphans[i];
        const evolved = orphans[i + 1];
        if (base && evolved) {
          makeAdoptedEvolutionLine([base, evolved], clan, madeLines.length);
          madeLines.push([base, evolved]);
        } else if (base && madeLines.length) {
          const previous = madeLines[madeLines.length - 1];
          previous.push(base);
          makeAdoptedEvolutionLine(previous, clan, madeLines.length - 1);
        } else if (base) {
          const candidate = list.find((species) => (
            species.clan === clan.key
            && species.stageCount === 2
            && species.stageIndex === 1
            && !species.evolvesTo
          ));
          if (candidate) {
            const first = list.find((species) => species.evolvesTo === candidate.id);
            const line = first ? [first, candidate, base] : [candidate, base];
            makeAdoptedEvolutionLine(line, clan, 0);
          }
        }
      }
    });
  }

  function makeAdoptedEvolutionLine(members, clan, lineOffset) {
    const ordered = members.slice(0, 3).sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));
    if (ordered.length < 2) return;
    const stageCount = ordered.length;
    const lineId = `${clan.code}-ADOPT-${String(Number(ordered[0].id.slice(3))).padStart(3, "0")}`;
    ordered.forEach((species, index) => {
      const originalRole = species.role;
      species.lineId = lineId;
      species.stageCount = stageCount;
      species.stageIndex = index;
      species.stageLabel = index === 0 ? "base" : index === stageCount - 1 ? "final" : "middle";
      species.role = index === 0 ? baseRoleForAdoptedLine(species.role, clan.key) : evolvedRoleFor(species.role, clan.key, index);
      species.evolvesTo = ordered[index + 1]?.id || null;
      species.evoLevel = null;
      species.evoItem = null;
      species.evoCondition = null;
      if (species.evolvesTo) {
        if (index === 0 && (lineOffset + Number(species.id.slice(3))) % 7 === 0) species.evoItem = clan.evoItem;
        else species.evoLevel = index === 0
          ? 22 + ((lineOffset + Number(species.id.slice(3))) % 12)
          : 38 + ((lineOffset + Number(species.id.slice(3))) % 10);
        if (stageCount === 3 && index === 1 && (lineOffset + Number(species.id.slice(3))) % 4 === 0) species.evoCondition = "Night";
      }
      species.rarity = index === stageCount - 1
        ? (species.legendary ? "legendary" : "rare")
        : index === 0
          ? (species.rarity === "rare" || species.rarity === "legendary" ? "uncommon" : "common")
          : "uncommon";
      species.legendary = index === stageCount - 1 && (species.legendary || originalRole === "Rare" || species.rarity === "legendary");
      species.baseStats = makeBaseStats(species.clan, species.role, stageCount, index, species.legendary, Number(species.id.slice(3)));
      species.captureRate = captureRateFor(species.rarity, index);
      species.expYield = Math.round(sumStats(species.baseStats) / 6 + index * 22 + (species.legendary ? 58 : 0));
      species.visual = `${species.visual} Universal evolution pass: stage ${index + 1}/${stageCount}, visibly upgraded silhouette, changed pose language, and distinct ${species.role} ability identity.`;
      if (index > 0) {
        species.desc = `${species.desc} This evolved form keeps the family joke but adds sharper details, older posture, and a new battle trick.`;
      }
    });
  }

  function baseRoleForAdoptedLine(role, clanKey) {
    const fallback = {
      ogre: "Brawler",
      alien: "Support",
      goblin: "Scout",
      brainrot: "Annoyer",
    }[clanKey] || role;
    if (["Rare", "Leader", "Miner", "Biter", "Wall"].includes(role)) return fallback;
    return role;
  }

  function evolvedRoleFor(role, clanKey, stageIndex) {
    const chains = {
      ogre: ["Bruiser", "Wallbreaker", "Fortress", "Bulky Support", "Brawler", "Tank"],
      alien: ["Fast Blaster", "Special Sweeper", "Controller", "Tech Wall", "Mixed Attacker", "Support"],
      goblin: ["Disruptor", "Glass Cannon", "Status Thief", "Trap Setter", "Speedster", "Scout"],
      brainrot: ["Chaos Sweeper", "Randomizer", "Drain Tank", "Mixed Menace", "Meme Support", "Annoyer"],
    };
    const options = chains[clanKey] || [role];
    const start = Math.max(0, options.indexOf(role));
    return options[(start + stageIndex + 1) % options.length];
  }

  function assignSpeciesAbilities(list) {
    list.forEach((species) => {
      species.ability = abilityForSpecies(species);
    });
    const byId = Object.fromEntries(list.map((species) => [species.id, species]));
    list.forEach((species) => {
      if (!species.evolvesTo) return;
      const next = byId[species.evolvesTo];
      if (!next || next.ability.name !== species.ability.name) return;
      next.ability = alternateAbilityForSpecies(next, species.ability.name);
    });
  }

  function abilityForSpecies(species) {
    const pools = {
      ogre: [
        ["Thick Skull", "Boosts Defense with stubborn ogre posture.", { def: 0.05 }],
        ["Lunch Guard", "Boosts HP because snacks are tactical armor.", { hp: 0.05 }],
        ["Grudge Grip", "Boosts Attack after evolving into heavier hands.", { atk: 0.05 }],
        ["Fort Wallop", "Boosts Defense and Attack a little.", { atk: 0.03, def: 0.03 }],
      ],
      alien: [
        ["Signal Bloom", "Boosts Sp. Atk with clean cosmic signal.", { spa: 0.05 }],
        ["Hover Cache", "Boosts Speed through tiny antigravity bursts.", { spe: 0.05 }],
        ["Firmware Shell", "Boosts Sp. Def with defensive code.", { spd: 0.05 }],
        ["Laser Focus", "Boosts Sp. Atk and Speed a little.", { spa: 0.03, spe: 0.03 }],
      ],
      goblin: [
        ["Pocket Trick", "Boosts Speed through suspicious shortcuts.", { spe: 0.05 }],
        ["Cheap Shot", "Boosts Attack with tiny unfair plans.", { atk: 0.05 }],
        ["Trap Sense", "Boosts Defense by spotting bad floors first.", { def: 0.05 }],
        ["Loot Reflex", "Boosts Attack and Speed a little.", { atk: 0.03, spe: 0.03 }],
      ],
      brainrot: [
        ["Rizz Static", "Boosts Sp. Atk with meme-voltage confidence.", { spa: 0.05 }],
        ["Comment Shield", "Boosts HP by ignoring criticism badly.", { hp: 0.05 }],
        ["Glitch Step", "Boosts Speed with chaotic movement frames.", { spe: 0.05 }],
        ["Aura Leak", "Boosts Sp. Atk and Sp. Def a little.", { spa: 0.03, spd: 0.03 }],
      ],
    };
    const pool = pools[species.clan] || pools.brainrot;
    const index = (species.stageIndex * 2 + hash(`${species.id}:${species.role}:${species.elements.join("/")}`)) % pool.length;
    const [name, desc, statMods] = pool[index];
    return { name, desc, statMods };
  }

  function alternateAbilityForSpecies(species, avoidName) {
    const first = abilityForSpecies({ ...species, stageIndex: species.stageIndex + 1 });
    if (first.name !== avoidName) return first;
    return abilityForSpecies({ ...species, id: `${species.id}-alt`, stageIndex: species.stageIndex + 2 });
  }

  function pickRole(clanKey, lineIndex) {
    const rolesByClan = {
      ogre: ["Tank", "Bruiser", "Wallbreaker", "Bulky Support", "Brawler", "Fortress"],
      alien: ["Special Sweeper", "Support", "Fast Blaster", "Tech Wall", "Controller", "Mixed Attacker"],
      goblin: ["Speedster", "Disruptor", "Glass Cannon", "Status Thief", "Scout", "Trap Setter"],
      brainrot: ["Chaos Sweeper", "Annoyer", "Drain Tank", "Randomizer", "Meme Support", "Mixed Menace"],
    };
    const list = rolesByClan[clanKey];
    return list[lineIndex % list.length];
  }

  function makeSpeciesName(clan, lineIndex, stageIndex, stageCount) {
    const root = clan.roots[lineIndex % clan.roots.length];
    if (stageCount === 1) {
      return `${root} ${clan.singleSuffix[lineIndex % clan.singleSuffix.length]}`;
    }
    const suffixes = clan.suffixes[Math.min(stageIndex, clan.suffixes.length - 1)];
    return `${root} ${suffixes[lineIndex % suffixes.length]}`;
  }

  function makeElements(clan, secondary, stageIndex, lineIndex) {
    const hasSecondary = stageIndex > 0 || lineIndex % 2 === 1 || clan.key === "brainrot";
    if (!hasSecondary || secondary === clan.primary) return [clan.primary];
    return [clan.primary, secondary];
  }

  function makeRarity(stageCount, stageIndex, lineIndex, legendaryLine) {
    if (legendaryLine) return "legendary";
    if (stageIndex === stageCount - 1 && stageCount > 1) return lineIndex % 2 ? "rare" : "uncommon";
    if (stageIndex > 0) return "uncommon";
    if (stageCount === 1) return lineIndex % 2 ? "rare" : "uncommon";
    return lineIndex % 3 === 0 ? "uncommon" : "common";
  }

  function makeBaseStats(clanKey, role, stageCount, stageIndex, legendary, lineIndex) {
    const clanBase = {
      ogre: { hp: 72, atk: 82, def: 74, spa: 42, spd: 52, spe: 34 },
      alien: { hp: 48, atk: 44, def: 50, spa: 82, spd: 68, spe: 74 },
      goblin: { hp: 46, atk: 70, def: 42, spa: 55, spd: 48, spe: 88 },
      brainrot: { hp: 58, atk: 64, def: 54, spa: 70, spd: 54, spe: 68 },
    };
    const roleBumps = {
      Tank: { hp: 22, atk: -4, def: 22, spa: -8, spd: 12, spe: -12 },
      Bruiser: { hp: 12, atk: 20, def: 10, spa: -12, spd: 0, spe: -2 },
      Wallbreaker: { hp: 2, atk: 30, def: -2, spa: 4, spd: -8, spe: 0 },
      "Bulky Support": { hp: 14, atk: -2, def: 14, spa: 4, spd: 14, spe: -10 },
      Brawler: { hp: 8, atk: 18, def: 4, spa: -6, spd: 2, spe: 8 },
      Fortress: { hp: 12, atk: 4, def: 28, spa: -8, spd: 18, spe: -20 },
      "Special Sweeper": { hp: -4, atk: -10, def: -6, spa: 28, spd: 8, spe: 18 },
      Support: { hp: 8, atk: -8, def: 4, spa: 12, spd: 16, spe: 8 },
      "Fast Blaster": { hp: -8, atk: -4, def: -8, spa: 24, spd: 0, spe: 24 },
      "Tech Wall": { hp: 10, atk: -10, def: 16, spa: 12, spd: 18, spe: -6 },
      Controller: { hp: 0, atk: -8, def: 2, spa: 20, spd: 12, spe: 10 },
      "Mixed Attacker": { hp: 2, atk: 10, def: -2, spa: 16, spd: 0, spe: 10 },
      Speedster: { hp: -6, atk: 12, def: -10, spa: 0, spd: -6, spe: 30 },
      Disruptor: { hp: 0, atk: 8, def: -4, spa: 8, spd: 6, spe: 18 },
      "Glass Cannon": { hp: -10, atk: 24, def: -14, spa: 12, spd: -8, spe: 20 },
      "Status Thief": { hp: -2, atk: 8, def: -4, spa: 8, spd: 8, spe: 18 },
      Scout: { hp: 0, atk: 6, def: 0, spa: 2, spd: 2, spe: 22 },
      "Trap Setter": { hp: 4, atk: 10, def: 8, spa: 0, spd: 8, spe: 6 },
      "Chaos Sweeper": { hp: -2, atk: 10, def: -6, spa: 20, spd: -2, spe: 18 },
      Annoyer: { hp: 2, atk: 4, def: 2, spa: 10, spd: 8, spe: 14 },
      "Drain Tank": { hp: 16, atk: 2, def: 8, spa: 12, spd: 8, spe: -4 },
      Randomizer: { hp: 4, atk: 8, def: 4, spa: 8, spd: 4, spe: 8 },
      "Meme Support": { hp: 10, atk: -6, def: 4, spa: 10, spd: 14, spe: 8 },
      "Mixed Menace": { hp: 4, atk: 14, def: 0, spa: 14, spd: 0, spe: 10 },
    };
    const raw = { ...clanBase[clanKey] };
    const bump = roleBumps[role] || {};
    Object.keys(raw).forEach((key) => {
      raw[key] += bump[key] || 0;
      raw[key] += ((lineIndex * (key.charCodeAt(0) + 3)) % 13) - 6;
    });
    let target;
    if (legendary) target = 600 + (lineIndex % 2) * 20;
    else if (stageCount === 1) target = 430 + (lineIndex % 5) * 14;
    else if (stageCount === 2) target = stageIndex === 0 ? 325 : 485;
    else target = stageIndex === 0 ? 305 : stageIndex === 1 ? 415 : 535;
    return normalizeStats(raw, target);
  }

  function makeHabitats(clan, secondary, legendary) {
    if (legendary) return ["legendary"];
    const habitats = new Set(clan.habitats);
    if (["Water", "Flying", "Electric"].includes(secondary)) habitats.add("alien");
    if (["Dark", "Poison", "Grass"].includes(secondary)) habitats.add("goblin");
    if (["Chaos", "Psychic"].includes(secondary)) habitats.add("brainrot");
    if (["Rock", "Brute", "Steel", "Fire"].includes(secondary)) habitats.add("ogre");
    return [...habitats];
  }

  function visualText(clan, secondary, stageIndex, legendary) {
    const scale = stageIndex === 0 ? "small overworld sprite" : stageIndex === 1 ? "chunky mid-stage battle sprite" : "large animated battle sprite";
    const extra = legendary ? "with glowing eyes and a crown-like silhouette" : `with ${secondary.toLowerCase()} details`;
    return `${scale}: ${clan.desc} Rendered as high-contrast pixel art ${extra}, two-frame idle bounce, hit flash, and tiny walking bob.`;
  }

  function dexText(clan, name, elements, role, lineIndex, legendary) {
    if (legendary) {
      return `${name} is whispered about by NPCs who definitely did not read the patch notes. It balances ${elements.join("/")} energy by being dramatically inconvenient.`;
    }
    const jokes = [
      "It practices intimidation in the mirror, then apologizes to the mirror.",
      "Its battle cry sounds like a lunch tray falling into destiny.",
      "It collects shiny trash and calls it a portfolio.",
      "It thinks strategy means pointing at a problem until the problem gets nervous.",
      "It has never lost a staring contest because it forgets to blink.",
      "Its favorite habitat is wherever someone said not to stand.",
    ];
    return `${name} is a ${role.toLowerCase()} from the ${clan.label} roster. ${jokes[lineIndex % jokes.length]}`;
  }

  function buildLearnset(species) {
    const primary = CLANS.find((clan) => clan.key === species.clan).primary;
    const preferredTypes = [...new Set([...species.elements, primary])];
    const nativeMoves = preferredTypes.flatMap((type) => MOVES.filter((move) => move.type === type));
    const utilityMoves = MOVES.filter((move) => ["Trick", "Chaos", "Brute", "Tech"].includes(move.type) && move.tier <= Math.min(5, 2 + species.stageIndex));
    const lowTier = uniqueMoves([
      ...nativeMoves.filter((move) => move.tier <= Math.min(2, species.stageIndex + 1)),
      ...utilityMoves.filter((move) => move.tier <= 1),
    ]);
    const stageMin = Math.max(0, species.stageIndex);
    const stageMax = Math.min(5, species.stageIndex + 2);
    const stageCore = uniqueMoves([
      ...nativeMoves.filter((move) => move.tier >= stageMin && move.tier <= stageMax),
      ...utilityMoves.filter((move) => move.tier >= Math.max(0, species.stageIndex - 1) && move.tier <= stageMax),
    ]);
    const signature = uniqueMoves(preferredTypes.flatMap((type, index) => {
      const targetTier = species.stageIndex === 0
        ? 1 + (index % 2)
        : species.stageIndex === 1
          ? 3 + (index % 2)
          : 4 + (index % 2);
      return MOVES
        .filter((move) => move.type === type && move.tier >= targetTier)
        .sort((a, b) => evolutionMoveScore(species, a) - evolutionMoveScore(species, b))
        .slice(0, 2);
    }));
    const fallback = uniqueMoves([...stageCore, ...nativeMoves, ...utilityMoves])
      .sort((a, b) => evolutionMoveScore(species, a) - evolutionMoveScore(species, b));
    const count = 17 + (hash(`${species.id}:learnset`) % 9);
    const levels = learnLevelsFor(count + 4, species.stageIndex);
    const learnset = [];
    const starterPool = lowTier.length ? lowTier : fallback;
    for (let i = 0; i < Math.min(4, count); i += 1) {
      const move = starterPool[(hash(`${species.id}:starter:${i}`) + i) % starterPool.length];
      pushLearnMove(learnset, levels[i], move);
    }
    signature.forEach((move, index) => {
      const level = [
        species.stageIndex === 0 ? 13 : species.stageIndex === 1 ? 22 : 37,
        species.stageIndex === 0 ? 25 : species.stageIndex === 1 ? 36 : 49,
        species.stageIndex === 0 ? 38 : species.stageIndex === 1 ? 48 : 61,
      ][index % 3] + Math.floor(index / 3) * 4;
      pushLearnMove(learnset, level, move);
    });
    let guard = 0;
    while (learnset.length < count && guard < fallback.length * 3) {
      const move = fallback[(hash(`${species.id}:move:${guard}`) + guard) % fallback.length];
      pushLearnMove(learnset, levels[learnset.length] || clamp(learnset.length * 5 + 1, 1, 82), move);
      guard += 1;
    }
    return learnset
      .sort((a, b) => a.level - b.level || a.moveId.localeCompare(b.moveId))
      .slice(0, 25);
  }

  function uniqueMoves(moves) {
    const seen = new Set();
    return moves.filter((move) => {
      if (!move || seen.has(move.id)) return false;
      seen.add(move.id);
      return true;
    });
  }

  function evolutionMoveScore(species, move) {
    const desiredTier = clamp(species.stageIndex + 2, 0, 5);
    const tierFit = Math.abs(move.tier - desiredTier) * 18;
    const roleFit = (
      (species.role.includes("Tank") && move.category === "Status")
      || (species.role.includes("Sweeper") && move.category !== "Status")
      || (species.role.includes("Breaker") && move.power >= 80)
      || (species.role.includes("Support") && (move.effect?.stat || move.effect?.status))
    ) ? -12 : 0;
    return tierFit + roleFit + (hash(`${species.id}:${move.id}`) % 17);
  }

  function learnLevelsFor(count, stageIndex) {
    const levels = [];
    let level = 1;
    for (let i = 0; i < count; i += 1) {
      levels.push(level);
      level += i < 3 ? 3 : i < 8 ? 4 : i < 14 ? 5 : 6;
    }
    if (stageIndex === 1 && levels.length) levels[0] = 1;
    if (stageIndex >= 2 && levels.length) levels[0] = 1;
    return levels;
  }

  function pushLearnMove(learnset, level, move) {
    if (!move || learnset.some((entry) => entry.moveId === move.id)) return;
    learnset.push({ level: clamp(level, 1, 88), moveId: move.id });
  }

  function ensureEvolutionMoveDeltas(list) {
    const byId = Object.fromEntries(list.map((species) => [species.id, species]));
    list.forEach((species) => {
      if (!species.evolvesTo) return;
      const next = byId[species.evolvesTo];
      if (!next) return;
      const currentMoves = new Set(species.learnset.map((entry) => entry.moveId));
      const existingNextMoves = new Set(next.learnset.map((entry) => entry.moveId));
      let nextOnly = next.learnset.filter((entry) => !currentMoves.has(entry.moveId)).length;
      if (nextOnly >= 2) return;
      const clan = CLANS.find((item) => item.key === next.clan);
      const preferredTypes = new Set([...next.elements, clan?.primary].filter(Boolean));
      const growthTypes = new Set([...preferredTypes, "Chaos", "Trick", "Tech", "Brute"]);
      const desiredTier = clamp(next.stageIndex + 2, 2, 5);
      const candidates = MOVES
        .filter((move) => !currentMoves.has(move.id) && !existingNextMoves.has(move.id))
        .sort((a, b) => {
          const aType = preferredTypes.has(a.type) ? -80 : growthTypes.has(a.type) ? -35 : 0;
          const bType = preferredTypes.has(b.type) ? -80 : growthTypes.has(b.type) ? -35 : 0;
          const aTier = Math.abs(a.tier - desiredTier) * 12;
          const bTier = Math.abs(b.tier - desiredTier) * 12;
          return (aType + aTier + evolutionMoveScore(next, a)) - (bType + bTier + evolutionMoveScore(next, b));
        });
      const protectedIds = new Set();
      const baseLevel = species.evoLevel || (next.stageIndex >= 2 ? 40 : 24);
      for (let i = 0; i < candidates.length && nextOnly < 2; i += 1) {
        const move = candidates[i];
        const level = baseLevel + 2 + i * 4;
        pushLearnMove(next.learnset, level, move);
        protectedIds.add(move.id);
        existingNextMoves.add(move.id);
        nextOnly += 1;
      }
      next.learnset.sort((a, b) => a.level - b.level || a.moveId.localeCompare(b.moveId));
      trimLearnset(next.learnset, protectedIds);
    });
  }

  function trimLearnset(learnset, protectedIds) {
    while (learnset.length > 25) {
      let removeIndex = learnset.findIndex((entry) => !protectedIds.has(entry.moveId) && entry.level <= 12);
      if (removeIndex < 0) removeIndex = learnset.findIndex((entry) => !protectedIds.has(entry.moveId));
      if (removeIndex < 0) removeIndex = 0;
      learnset.splice(removeIndex, 1);
    }
  }

  function captureRateFor(rarity, stageIndex) {
    const base = { common: 215, uncommon: 145, rare: 80, legendary: 25 }[rarity];
    return Math.max(18, base - stageIndex * 28);
  }

  function normalizeStats(raw, target) {
    const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
    const stats = {};
    Object.entries(raw).forEach(([key, value]) => {
      stats[key] = Math.max(18, Math.round((value / total) * target));
    });
    let diff = target - sumStats(stats);
    const order = ["hp", "atk", "def", "spa", "spd", "spe"];
    let guard = 0;
    while (diff !== 0 && guard < 60) {
      const key = order[guard % order.length];
      if (diff > 0) {
        stats[key] += 1;
        diff -= 1;
      } else if (stats[key] > 18) {
        stats[key] -= 1;
        diff += 1;
      }
      guard += 1;
    }
    return stats;
  }

  function sumStats(stats) {
    return Object.values(stats).reduce((sum, value) => sum + value, 0);
  }

  function makeTypeChart() {
    const chart = {};
    TYPES.forEach((type) => {
      chart[type] = {};
      TYPES.forEach((target) => {
        chart[type][target] = 1;
      });
    });
    const strong = {
      Fire: ["Grass", "Steel", "Poison"],
      Water: ["Fire", "Rock", "Brute"],
      Grass: ["Water", "Rock", "Trick"],
      Electric: ["Water", "Flying", "Tech"],
      Rock: ["Fire", "Flying", "Tech"],
      Flying: ["Grass", "Brute", "Trick"],
      Poison: ["Grass", "Trick", "Chaos"],
      Psychic: ["Brute", "Poison", "Trick"],
      Dark: ["Psychic", "Tech", "Chaos"],
      Steel: ["Rock", "Flying", "Poison"],
      Bug: ["Grass", "Psychic", "Dark"],
      Fairy: ["Dark", "Brute", "Chaos"],
      Ghost: ["Psychic", "Ghost", "Trick"],
      Normal: [],
      Brute: ["Rock", "Steel", "Dark"],
      Tech: ["Steel", "Psychic", "Flying"],
      Trick: ["Psychic", "Tech", "Water"],
      Chaos: ["Brute", "Steel", "Psychic"],
    };
    const weak = {
      Fire: ["Water", "Rock", "Chaos"],
      Water: ["Electric", "Grass", "Tech"],
      Grass: ["Fire", "Poison", "Flying"],
      Electric: ["Rock", "Grass", "Trick"],
      Rock: ["Water", "Grass", "Steel"],
      Flying: ["Electric", "Rock", "Tech"],
      Poison: ["Psychic", "Steel", "Rock"],
      Psychic: ["Dark", "Chaos", "Tech"],
      Dark: ["Brute", "Flying", "Trick"],
      Steel: ["Fire", "Electric", "Chaos"],
      Bug: ["Fire", "Flying", "Steel"],
      Fairy: ["Poison", "Steel", "Tech"],
      Ghost: ["Dark", "Fairy", "Normal"],
      Normal: ["Ghost", "Steel", "Rock"],
      Brute: ["Psychic", "Flying", "Chaos"],
      Tech: ["Electric", "Chaos", "Trick"],
      Trick: ["Brute", "Flying", "Poison"],
      Chaos: ["Dark", "Trick", "Poison"],
    };
    Object.entries(strong).forEach(([attack, targets]) => targets.forEach((target) => (chart[attack][target] = 2)));
    Object.entries(weak).forEach(([attack, targets]) => targets.forEach((target) => (chart[attack][target] = 0.5)));
    return chart;
  }

  function createNewGame() {
    return {
      name: "Kid",
      x: 14,
      y: 63,
      facing: "down",
      party: [],
      pc: [],
      bag: {
        "Capture Orb": 8,
        Potion: 5,
        "Big Rock Candy": 1,
        "Quantum Cog": 1,
        "Sneak Scarf": 1,
        "Meme Stone": 1,
      },
      money: 1800,
      badges: [],
      flags: {},
      defeated: {},
      dexSeen: {},
      dexCaught: {},
      quests: {
        starter: "active",
        firstCatch: "locked",
        gymQuest: "locked",
        overload: "locked",
        postgame: "locked",
      },
      clock: 480,
      steps: 0,
      repelSteps: 0,
      eliteIndex: 0,
      switches: { goblin: false, brain1: false, brain2: false, brain3: false },
      storyStage: 0,
      champion: false,
      postGameUnlocked: false,
      pvpRecord: {
        duels: 0,
        wins: 0,
        losses: 0,
        streak: 0,
        bestStreak: 0,
        dailyDate: "",
        dailyDuels: 0,
        dailyWins: 0,
        lastRoomId: "",
        lastResult: "",
        lastOpponent: "",
        lastAt: 0,
      },
    };
  }

  function ensurePlayerSchema() {
    if (!state.player) return;
    state.player.party ||= [];
    state.player.pc ||= [];
    state.player.bag ||= {};
    state.player.flags ||= {};
    state.player.defeated ||= {};
    state.player.dexSeen ||= {};
    state.player.dexCaught ||= {};
    state.player.quests ||= {};
    state.player.switches ||= { goblin: false, brain1: false, brain2: false, brain3: false };
    state.player.pvpRecord ||= {};
    const record = state.player.pvpRecord;
    record.duels = Number.isFinite(Number(record.duels)) ? Math.max(0, Number(record.duels)) : 0;
    record.wins = Number.isFinite(Number(record.wins)) ? Math.max(0, Number(record.wins)) : 0;
    record.losses = Number.isFinite(Number(record.losses)) ? Math.max(0, Number(record.losses)) : 0;
    record.streak = Number.isFinite(Number(record.streak)) ? Math.max(0, Number(record.streak)) : 0;
    record.bestStreak = Number.isFinite(Number(record.bestStreak)) ? Math.max(record.streak, Number(record.bestStreak)) : record.streak;
    record.dailyDate ||= "";
    record.dailyDuels = Number.isFinite(Number(record.dailyDuels)) ? Math.max(0, Number(record.dailyDuels)) : 0;
    record.dailyWins = Number.isFinite(Number(record.dailyWins)) ? Math.max(0, Number(record.dailyWins)) : 0;
    record.lastRoomId ||= "";
    record.lastResult ||= "";
    record.lastOpponent ||= "";
    record.lastAt = Number.isFinite(Number(record.lastAt)) ? Number(record.lastAt) : 0;
  }

  function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function currentPvpRecord() {
    ensurePlayerSchema();
    const record = state.player.pvpRecord;
    const today = todayKey();
    if (record.dailyDate !== today) {
      record.dailyDate = today;
      record.dailyDuels = 0;
      record.dailyWins = 0;
    }
    return record;
  }

  function persistPlayerSilently() {
    if (!state.player) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state.player));
      state.hasSave = true;
      cloudPush();
    } catch {
      // Storage can fail in private or restricted browser sessions.
    }
  }

  function startNewGame() {
    state.player = createNewGame();
    state.mode = "starter";
    state.battle = null;
    toast("Professor Mold welcomes you to Memelet Town.");
    dirtyPanel();
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const loaded = JSON.parse(raw);
      state.player = loaded;
      ensurePlayerSchema();
      state.mode = "overworld";
      state.battle = null;
      state.hasSave = true;
      healInvalidParty();
      checkAreaChange(true);
      toast("Save loaded. The Ogreverse remembers your nonsense.");
      ensureOnlineConnected();
      dirtyPanel();
      return true;
    } catch (error) {
      console.error(error);
      toast("Save data was cursed and could not be loaded.");
      return false;
    }
  }

  function saveGame() {
    if (!state.player) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state.player));
    state.hasSave = true;
    cloudPush(true);
    toast(accountState() ? "Saved locally + to your account." : "Saved. Your chaos has been laminated.");
    dirtyPanel();
  }

  // ===== ACCOUNTS + CLOUD SAVE (client) =================================================
  // A logged-in account keeps your run (party, position, badges, duel record) on the server so it
  // follows you across devices and survives a cleared browser. The save IS state.player — we just
  // sync that same blob. UI is a small top-corner widget so it never fights the game's own menus.
  let cloudTimer = null;
  let cloudBusy = false;
  function accountState() {
    try { const raw = localStorage.getItem(ACCOUNT_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function setAccountState(acct) {
    try { acct ? localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acct)) : localStorage.removeItem(ACCOUNT_KEY); } catch {}
  }
  function cloudPush(immediate) {
    const acct = accountState();
    if (!acct || !state.player) return;
    if (cloudTimer) { clearTimeout(cloudTimer); cloudTimer = null; }
    const run = async () => {
      if (cloudBusy) return;
      cloudBusy = true;
      try {
        await postOnlineJson("/api/account/save", { accountId: acct.id, accountToken: acct.token, save: state.player });
        updateAccountWidget("Cloud saved ✓");
      } catch (e) {
        updateAccountWidget("Cloud save retrying…");
      } finally { cloudBusy = false; }
    };
    if (immediate) run(); else cloudTimer = setTimeout(run, 3500);
  }
  async function accountLoginOrRegister(mode, username, password) {
    const payload = await postOnlineJson(`/api/account/${mode}`, { username, password });
    setAccountState({ id: payload.accountId, token: payload.accountToken, username: payload.username });
    if (payload.save && typeof payload.save === "object") {
      // Restore the cloud run as the local save and reboot into it cleanly.
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload.save)); } catch {}
      updateAccountWidget("Loading your run…");
      setTimeout(() => location.reload(), 350);
      return { reloaded: true, username: payload.username };
    }
    // No cloud save yet → push the current local run up so this account owns it.
    cloudPush(true);
    return { reloaded: false, username: payload.username };
  }
  function updateAccountWidget(statusText) {
    const el = document.getElementById("ogv-acct");
    if (!el) return;
    const acct = accountState();
    const status = el.querySelector(".ogv-acct-status");
    const who = el.querySelector(".ogv-acct-who");
    if (acct) {
      el.classList.add("signed-in");
      if (who) who.textContent = `@${acct.username}`;
      if (status && statusText) status.textContent = statusText;
    } else {
      el.classList.remove("signed-in");
      if (who) who.textContent = "Guest";
      if (status) status.textContent = "Sign in to save your run";
    }
  }
  function openAccountDialog() {
    const existing = document.getElementById("ogv-acct-modal");
    if (existing) { existing.remove(); return; }
    const acct = accountState();
    const wrap = document.createElement("div");
    wrap.id = "ogv-acct-modal";
    wrap.className = "ogv-acct-modal";
    if (acct) {
      wrap.innerHTML = `<div class="ogv-acct-card"><h3>Signed in as @${acct.username}</h3>
        <p>Your run syncs to your account automatically — play on any device.</p>
        <div class="ogv-acct-row"><button class="btn" data-ogv="close">Close</button><button class="btn" data-ogv="logout">Log out</button></div></div>`;
    } else {
      wrap.innerHTML = `<div class="ogv-acct-card"><h3>OgreVerse Account</h3>
        <p>Save your run to the cloud and keep it on every device.</p>
        <label>Username<input id="ogv-u" autocomplete="username" maxlength="20" placeholder="3-20 letters/numbers"></label>
        <label>Password<input id="ogv-p" type="password" autocomplete="current-password" placeholder="6+ characters"></label>
        <div class="ogv-acct-msg" id="ogv-acct-msg"></div>
        <div class="ogv-acct-row"><button class="btn primary" data-ogv="login">Log in</button><button class="btn" data-ogv="register">Create</button></div>
        <div class="ogv-acct-row"><button class="btn" data-ogv="close">Cancel</button></div></div>`;
    }
    document.body.appendChild(wrap);
    const msg = (t) => { const m = document.getElementById("ogv-acct-msg"); if (m) m.textContent = t; };
    const submit = async (mode) => {
      const u = (document.getElementById("ogv-u") || {}).value || "";
      const p = (document.getElementById("ogv-p") || {}).value || "";
      msg(mode === "login" ? "Logging in…" : "Creating account…");
      try {
        const r = await accountLoginOrRegister(mode, u.trim(), p);
        if (!r.reloaded) { wrap.remove(); updateAccountWidget("Cloud saved ✓"); toast(`Welcome, @${r.username}. Your run now saves to the cloud.`); }
      } catch (e) {
        const map = { bad_username: "Username must be 3-20 letters, numbers or _.", bad_password: "Password needs 6+ characters.", username_taken: "That name is taken — try logging in.", bad_credentials: "Wrong username or password." };
        msg(map[String(e.message)] || "Could not complete that — try again.");
      }
    };
    wrap.addEventListener("click", (ev) => {
      const act = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-ogv");
      if (!act) { if (ev.target === wrap) wrap.remove(); return; }
      if (act === "close") wrap.remove();
      else if (act === "logout") { setAccountState(null); wrap.remove(); updateAccountWidget(); toast("Logged out. This device is back to a guest run."); }
      else if (act === "login" || act === "register") submit(act);
    });
  }
  function setupAccountUI() {
    if (document.getElementById("ogv-acct")) return;
    const el = document.createElement("div");
    el.id = "ogv-acct";
    el.className = "ogv-acct";
    el.innerHTML = `<button class="ogv-acct-btn" type="button" aria-label="Account"><span class="ogv-acct-who">Guest</span><span class="ogv-acct-status">Sign in to save your run</span></button>`;
    document.body.appendChild(el);
    el.querySelector(".ogv-acct-btn").addEventListener("click", openAccountDialog);
    updateAccountWidget();
    // If already signed in, pull the latest cloud save shortly after boot in case another device advanced it.
    const acct = accountState();
    if (acct) updateAccountWidget("Cloud saved ✓");
  }

  function onlineRequested() {
    if (typeof window === "undefined" || !window.location || !window.URLSearchParams) return false;
    if (!window.location.protocol.startsWith("http")) return false;
    // MMO ON BY DEFAULT — everyone who opens the game joins the shared world and can be challenged.
    // Opt out with ?solo=1 (or ?mmo=0) for a private single-player run.
    const p = new window.URLSearchParams(window.location.search);
    if (p.get("solo") === "1" || p.get("mmo") === "0") return false;
    return true;
  }

  function readOnlineSession() {
    try {
      if (typeof sessionStorage === "undefined") return null;
      const raw = sessionStorage.getItem(ONLINE_SESSION_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!payload?.id || !payload?.token) return null;
      return payload;
    } catch {
      return null;
    }
  }

  function writeOnlineSession(id, token) {
    try {
      if (typeof sessionStorage === "undefined" || !id || !token) return;
      sessionStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify({ id, token, savedAt: Date.now() }));
    } catch {
      // Browsers can disable sessionStorage; online still works without resume.
    }
  }

  function clearOnlineSession() {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(ONLINE_SESSION_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }

  function onlineProfile() {
    const pvpRecord = state.player ? currentPvpRecord() : null;
    const lead = state.player?.party?.find((creature) => creature.hp > 0) || state.player?.party?.[0];
    const species = lead ? SPECIES_BY_ID[lead.id] : SPECIES_BY_ID.OGR001;
    const party = (state.player?.party || []).slice(0, 6).map((creature) => {
      const creatureSpecies = SPECIES_BY_ID[creature.id] || SPECIES_BY_ID.OGR001;
      const stats = calcStats(creature);
      return {
        speciesId: creature.id || "OGR001",
        name: creature.nickname || creatureSpecies.name || "Party Pal",
        level: creature.level || 5,
        hp: typeof creature.hp === "number" ? creature.hp : stats.hp,
      };
    });
    const clanSprite = species?.clan === "ogre" ? "ogre"
      : species?.clan === "alien" ? "alien"
        : species?.clan === "goblin" ? "goblin"
          : species?.clan === "brainrot" ? "brainrot"
            : "trainer";
    return {
      name: state.player?.name || "Kid",
      x: state.player?.x || 14,
      y: state.player?.y || 63,
      facing: state.player?.facing || "down",
      region: currentLocationName(),
      sprite: clanSprite,
      leadSpecies: lead?.id || "OGR001",
      leadName: lead?.nickname || species?.name || "First Bond",
      leadLevel: lead?.level || 5,
      duelWins: pvpRecord?.wins || 0,
      duelStreak: pvpRecord?.streak || 0,
      party,
      badges: state.player?.badges?.length || 0,
    };
  }

  function postOnlineJson(path, body) {
    if (typeof fetch === "function") {
      return fetch(apiUrl(path), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `${path} ${response.status}`);
        return payload;
      });
    }
    if (typeof XMLHttpRequest === "function") {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", apiUrl(path), true);
        request.setRequestHeader("content-type", "application/json");
        request.onload = () => {
          let payload = {};
          try {
            payload = JSON.parse(request.responseText || "{}");
          } catch {
            payload = {};
          }
          if (request.status >= 200 && request.status < 300) resolve(payload);
          else reject(new Error(payload.error || `${path} ${request.status}`));
        };
        request.onerror = () => reject(new Error(`${path} network`));
        request.send(JSON.stringify(body));
      });
    }
    return Promise.reject(new Error("Network API unavailable"));
  }

  async function ensureOnlineConnected() {
    if (!state.online.enabled || !state.player || state.online.connecting || state.online.connected) return;
    state.online.connecting = true;
    state.online.status = "connecting";
    dirtyPanel();
    try {
      const profile = onlineProfile();
      let payload = null;
      let resumed = false;
      const saved = readOnlineSession();
      if (saved?.id && saved?.token) {
        try {
          payload = await postOnlineJson("/api/mmo/resume", { id: saved.id, token: saved.token, ...profile });
          resumed = true;
        } catch {
          clearOnlineSession();
        }
      }
      if (!payload) payload = await postOnlineJson("/api/mmo/join", profile);
      state.online.id = payload.id;
      state.online.token = payload.token;
      state.online.connected = true;
      state.online.status = "online";
      state.online.lastError = "";
      writeOnlineSession(payload.id, payload.token);
      startOnlineEventStream();
      if (payload.room && payload.state) {
        startOnlineBattle({
          room: payload.room,
          challenge: {
            from: state.online.id,
            to: payload.opponentId || "opponent",
            fromName: state.player?.name || "You",
            toName: payload.opponentName || payload.state.foe?.name || "Opponent",
          },
          state: payload.state,
          resumed: true,
        });
      } else {
        toast(resumed ? "Online field deck resumed." : "Online field deck connected. Other trainers can appear nearby.");
      }
    } catch (error) {
      state.online.connected = false;
      state.online.status = "offline";
      state.online.lastError = String(error.message || error).slice(0, 80);
    } finally {
      state.online.connecting = false;
      dirtyPanel();
    }
  }

  function startOnlineEventStream() {
    if (!state.online.id || !state.online.token || typeof EventSource === "undefined") return;
    if (state.online.stream) state.online.stream.close();
    const url = `/api/mmo/events?id=${encodeURIComponent(state.online.id)}&token=${encodeURIComponent(state.online.token)}`;
    const stream = new EventSource(url);
    stream.addEventListener("presence", (event) => {
      try {
        const payload = JSON.parse(event.data);
        state.online.peers = (payload.peers || []).filter((peer) => peer.id !== state.online.id);
        state.online.connected = true;
        state.online.status = "online";
        dirtyPanel();
      } catch {
        state.online.lastError = "Bad presence packet";
      }
    });
    stream.addEventListener("challenge", (event) => {
      try {
        const payload = JSON.parse(event.data);
        state.online.incoming = payload.challenge;
        toast(`${payload.challenge.fromName} wants an online duel.`);
        dirtyPanel();
      } catch {
        state.online.lastError = "Bad challenge packet";
      }
    });
    stream.addEventListener("challengeDeclined", (event) => {
      try {
        const payload = JSON.parse(event.data);
        state.online.challengeSent = null;
        toast(`${payload.challenge.toName} declined the online duel.`);
        dirtyPanel();
      } catch {
        state.online.lastError = "Bad decline packet";
      }
    });
    stream.addEventListener("challengeExpired", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (state.online.challengeSent?.id === payload.challenge.id) state.online.challengeSent = null;
        if (state.online.incoming?.id === payload.challenge.id) state.online.incoming = null;
        toast("Online duel request expired.");
        dirtyPanel();
      } catch {
        state.online.lastError = "Bad expiry packet";
      }
    });
    stream.addEventListener("battle", (event) => {
      try {
        const payload = JSON.parse(event.data);
        state.online.challengeSent = null;
        state.online.incoming = null;
        startOnlineBattle(payload);
      } catch {
        state.online.lastError = "Bad battle packet";
      }
    });
    stream.addEventListener("battleState", (event) => {
      try {
        const payload = JSON.parse(event.data);
        updateOnlineBattleState(payload.state);
      } catch {
        state.online.lastError = "Bad battle state packet";
      }
    });
    stream.onerror = () => {
      state.online.connected = false;
      state.online.status = "reconnecting";
      if (state.online.stream) {
        state.online.stream.close();
        state.online.stream = null;
      }
      dirtyPanel();
    };
    state.online.stream = stream;
  }

  async function sendOnlinePresence(force = false) {
    if (!state.online.connected || !state.online.id || !state.online.token || !state.player) return;
    const body = { id: state.online.id, token: state.online.token, ...onlineProfile() };
    try {
      const payload = await postOnlineJson("/api/mmo/presence", body);
      state.online.peers = (payload.peers || []).filter((peer) => peer.id !== state.online.id);
      state.online.status = "online";
      state.online.lastError = "";
      if (force) dirtyPanel();
    } catch (error) {
      state.online.connected = false;
      state.online.status = "reconnecting";
      state.online.lastError = String(error.message || error).slice(0, 80);
      if (state.online.stream) {
        state.online.stream.close();
        state.online.stream = null;
      }
      dirtyPanel();
    }
  }

  function updateOnline(time) {
    if (!onlineRequested()) return;
    state.online.enabled = true;
    if (!state.player || state.mode === "title" || state.mode === "starter") return;
    ensureOnlineConnected();
    if (!state.online.connected) return;
    if (time - state.online.lastSync > 700) {
      state.online.lastSync = time;
      sendOnlinePresence(false);
    }
  }

  function onlinePeerAt(x, y) {
    if (!state.online.enabled) return null;
    return state.online.peers.find((peer) => Math.round(peer.x) === x && Math.round(peer.y) === y) || null;
  }

  async function challengeOnlinePeer(peer) {
    if (!peer || !state.online.connected) {
      toast("Online field deck is not connected yet.");
      return;
    }
    if (state.online.challengeSent) {
      toast("A duel request is already pending.");
      return;
    }
    if (state.online.incoming) {
      toast("Answer the incoming duel request first.");
      return;
    }
    try {
      const payload = await postOnlineJson("/api/mmo/challenge", { id: state.online.id, token: state.online.token, to: peer.id });
      state.online.challengeSent = payload.challenge;
      toast(`Duel request sent to ${peer.name}.`);
    } catch (error) {
      state.online.lastError = String(error.message || error).slice(0, 80);
      toast("Online challenge failed.");
    }
    dirtyPanel();
  }

  async function respondOnlineChallenge(accept) {
    const challenge = state.online.incoming;
    if (!challenge) return;
    try {
      const payload = await postOnlineJson("/api/mmo/respond", {
        id: state.online.id,
        token: state.online.token,
        challengeId: challenge.id,
        accept,
      });
      if (accept && payload.room) startOnlineBattle({ room: payload.room, challenge, state: payload.state });
      if (!accept) {
        state.online.incoming = null;
        toast("Online duel declined.");
      }
    } catch (error) {
      state.online.lastError = String(error.message || error).slice(0, 80);
      toast("Online response failed.");
    }
    dirtyPanel();
  }

  function resetOnlineConnection() {
    if (state.online.stream) state.online.stream.close();
    clearOnlineSession();
    state.online.connected = false;
    state.online.connecting = false;
    state.online.id = null;
    state.online.token = null;
    state.online.peers = [];
    state.online.incoming = null;
    state.online.challengeSent = null;
    state.online.status = "offline";
    state.online.lastError = "";
    ensureOnlineConnected();
    dirtyPanel();
  }

  function startOnlineBattle(payload) {
    if (!state.player?.party?.length) {
      toast("Choose a first bond before online duels.");
      return;
    }
    if (state.mode === "pvp" && state.pvp?.roomId && state.pvp.roomId === payload.room?.id) {
      updateOnlineBattleState(payload.state);
      return;
    }
    const challenge = payload.challenge || {
      from: state.online.id,
      to: payload.opponentId || "opponent",
      fromName: state.player?.name || "You",
      toName: payload.opponentName || payload.state?.foe?.name || "Opponent",
    };
    const isFrom = challenge.from === state.online.id;
    const opponentName = isFrom ? challenge.toName : challenge.fromName;
    state.online.challengeSent = null;
    state.online.incoming = null;
    state.mode = "pvp";
    state.battle = null;
    state.pvp = {
      roomId: payload.room?.id,
      opponentName,
      challenge,
      view: payload.state || null,
      busy: false,
      lastError: "",
      viewReceivedAt: Date.now(),
      lastClockSecond: null,
      timeoutPollTurn: null,
    };
    toast(payload.resumed ? `Rejoined the server duel with ${opponentName}.` : `${opponentName} joined a server-authoritative duel room.`);
    refreshOnlineBattleState();
    dirtyPanel();
  }

  function updateOnlineBattleState(view) {
    if (!view || !state.pvp || view.id !== state.pvp.roomId) return;
    state.pvp.view = view;
    state.pvp.viewReceivedAt = Date.now();
    state.pvp.lastClockSecond = null;
    state.pvp.timeoutPollTurn = null;
    state.pvp.busy = false;
    recordPvpResult(view);
    dirtyPanel();
  }

  function recordPvpResult(view) {
    if (!state.player || view.status !== "complete" || !view.id) return;
    const record = currentPvpRecord();
    if (record.lastRoomId === view.id || state.pvp?.recordedResultId === view.id) return;
    const won = view.winnerId === view.you.playerId;
    record.duels += 1;
    record.dailyDuels += 1;
    record.lastRoomId = view.id;
    record.lastResult = won ? "win" : "loss";
    record.lastOpponent = view.foe?.name || state.pvp?.opponentName || "Opponent";
    record.lastAt = Date.now();
    if (won) {
      record.wins += 1;
      record.dailyWins += 1;
      record.streak += 1;
      record.bestStreak = Math.max(record.bestStreak, record.streak);
      const cash = 350 + Math.min(10, record.streak) * 50;
      state.player.money += cash;
      addItem(record.streak > 0 && record.streak % 3 === 0 ? "Ultra Orb" : "Great Orb", 1);
      toast(`Duel win recorded. Streak ${record.streak}, +$${cash}.`);
    } else {
      record.losses += 1;
      record.streak = 0;
      addItem("Potion", 1);
      toast("Duel logged. Streak reset, Potion restocked.");
    }
    if (state.pvp) state.pvp.recordedResultId = view.id;
    persistPlayerSilently();
    sendOnlinePresence(true);
  }

  function pvpClockSecondsLeft(view = state.pvp?.view) {
    if (!view?.deadlineAt || view.status === "complete") return null;
    const syncedAt = state.pvp?.viewReceivedAt || Date.now();
    const serverTime = view.serverTime || syncedAt;
    const estimatedServerNow = serverTime + (Date.now() - syncedAt);
    return Math.max(0, Math.ceil((view.deadlineAt - estimatedServerNow) / 1000));
  }

  function updatePvpClock() {
    if (state.mode !== "pvp" || !state.pvp?.view) return;
    const secondsLeft = pvpClockSecondsLeft();
    if (secondsLeft === null) return;
    if (secondsLeft !== state.pvp.lastClockSecond) {
      state.pvp.lastClockSecond = secondsLeft;
      dirtyPanel();
    }
    if (secondsLeft === 0 && state.pvp.timeoutPollTurn !== state.pvp.view.turn) {
      state.pvp.timeoutPollTurn = state.pvp.view.turn;
      refreshOnlineBattleState();
    }
  }

  async function refreshOnlineBattleState() {
    if (!state.pvp?.roomId || !state.online.id || !state.online.token) return;
    try {
      const payload = await postOnlineJson("/api/mmo/battle/state", {
        id: state.online.id,
        token: state.online.token,
        roomId: state.pvp.roomId,
      });
      updateOnlineBattleState(payload.state);
    } catch (error) {
      state.pvp.lastError = String(error.message || error).slice(0, 80);
      dirtyPanel();
    }
  }

  async function submitOnlineBattleAction(action, failMessage) {
    if (!state.pvp?.roomId || state.pvp.busy) return;
    state.pvp.busy = true;
    dirtyPanel();
    try {
      const payload = await postOnlineJson("/api/mmo/battle/choice", {
        id: state.online.id,
        token: state.online.token,
        roomId: state.pvp.roomId,
        action,
      });
      updateOnlineBattleState(payload.state);
    } catch (error) {
      state.pvp.busy = false;
      state.pvp.lastError = String(error.message || error).slice(0, 80);
      toast(failMessage || "Server duel action failed.");
      dirtyPanel();
    }
  }

  function submitOnlineBattleMove(moveId) {
    submitOnlineBattleAction({ kind: "move", moveId }, "Server duel move failed.");
  }

  function submitOnlineBattleSwitch(targetIndex) {
    submitOnlineBattleAction({ kind: "switch", targetIndex }, "Server duel switch failed.");
  }

  function submitOnlineBattleItem(itemId) {
    submitOnlineBattleAction({ kind: "item", itemId }, "Server duel item failed.");
  }

  function surrenderOnlineBattle() {
    submitOnlineBattleAction({ kind: "surrender" }, "Server duel surrender failed.");
  }

  function leaveOnlineBattle() {
    state.pvp = null;
    state.mode = "overworld";
    toast("Returned to the field deck.");
    dirtyPanel();
  }

  function healInvalidParty() {
    state.player.party.forEach((creature) => {
      const stats = calcStats(creature);
      if (typeof creature.hp !== "number" || creature.hp > stats.hp) creature.hp = stats.hp;
      ensureCreatureMoves(creature);
    });
  }

  function chooseStarter(id) {
    const starter = createCreature(id, 5);
    state.player.party.push(starter);
    markSeen(id);
    markCaught(id);
    state.player.quests.starter = "complete";
    state.player.quests.firstCatch = "active";
    state.mode = "overworld";
    checkAreaChange(true);
    toast(`${starter.nickname} joined you. Professor Mold gave you Capture Orbs and concern.`);
    ensureOnlineConnected();
    dirtyPanel();
  }

  function createCreature(speciesId, level) {
    const creature = {
      uid: `${speciesId}-${Date.now().toString(36)}-${Math.floor(Math.random() * 99999).toString(36)}`,
      id: speciesId,
      nickname: SPECIES_BY_ID[speciesId].name,
      level,
      exp: expForLevel(level),
      hp: 1,
      status: null,
      statusTurns: 0,
      moves: [],
      metAt: currentLocationName(),
    };
    creature.moves = currentMovesForSpecies(speciesId, level).map((moveId) => ({
      id: moveId,
      pp: MOVES_BY_ID[moveId].pp,
    }));
    creature.hp = calcStats(creature).hp;
    return creature;
  }

  function currentMovesForSpecies(speciesId, level) {
    const species = SPECIES_BY_ID[speciesId];
    const learned = species.learnset.filter((item) => item.level <= level).map((item) => item.moveId);
    while (learned.length < 4) {
      const fallback = species.learnset[learned.length % species.learnset.length].moveId;
      learned.push(fallback);
    }
    return learned.slice(-4);
  }

  function ensureCreatureMoves(creature) {
    const wanted = currentMovesForSpecies(creature.id, creature.level);
    wanted.forEach((moveId) => {
      if (!creature.moves.some((move) => move.id === moveId)) {
        creature.moves.push({ id: moveId, pp: MOVES_BY_ID[moveId].pp });
      }
    });
    creature.moves = creature.moves.slice(-4);
    creature.moves.forEach((move) => {
      const max = MOVES_BY_ID[move.id].pp;
      if (typeof move.pp !== "number" || move.pp > max) move.pp = max;
    });
  }

  function calcStats(creature) {
    const species = SPECIES_BY_ID[creature.id];
    const level = creature.level;
    const stats = {
      hp: Math.floor(((species.baseStats.hp * 2 * level) / 100) + level + 10),
      atk: Math.floor(((species.baseStats.atk * 2 * level) / 100) + 5),
      def: Math.floor(((species.baseStats.def * 2 * level) / 100) + 5),
      spa: Math.floor(((species.baseStats.spa * 2 * level) / 100) + 5),
      spd: Math.floor(((species.baseStats.spd * 2 * level) / 100) + 5),
      spe: Math.floor(((species.baseStats.spe * 2 * level) / 100) + 5),
    };
    const mods = species.ability?.statMods || {};
    Object.keys(stats).forEach((key) => {
      if (mods[key]) stats[key] = Math.max(1, Math.floor(stats[key] * (1 + mods[key])));
    });
    return stats;
  }

  function expForLevel(level) {
    return Math.floor(Math.pow(level, 3));
  }

  function levelForExp(exp) {
    let level = 1;
    while (level < 100 && expForLevel(level + 1) <= exp) level += 1;
    return level;
  }

  function expToNext(creature) {
    return expForLevel(creature.level + 1) - creature.exp;
  }

  function generateWorld() {
    const tiles = Array.from({ length: WORLD_H }, () => Array.from({ length: WORLD_W }, () => "deepWater"));

    const carveRect = (x1, y1, x2, y2, tile) => {
      for (let y = y1; y <= y2; y += 1) {
        for (let x = x1; x <= x2; x += 1) {
          if (inWorld(x, y)) tiles[y][x] = tile;
        }
      }
    };
    const paintEllipse = (cx, cy, rx, ry, fallbackTile = null) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
          if (!inWorld(x, y)) continue;
          const nx = (x - cx) / rx;
          const ny = (y - cy) / ry;
          if (nx * nx + ny * ny <= 1) tiles[y][x] = fallbackTile || baseTileFor(x, y);
        }
      }
    };
    const softenCoast = () => {
      const copy = tiles.map((row) => [...row]);
      for (let y = 1; y < WORLD_H - 1; y += 1) {
        for (let x = 1; x < WORLD_W - 1; x += 1) {
          if (copy[y][x] === "deepWater") continue;
          const neighbors = [
            copy[y - 1][x],
            copy[y + 1][x],
            copy[y][x - 1],
            copy[y][x + 1],
          ];
          if (neighbors.includes("deepWater") && !["path", "bridge", "lab", "pc", "shop", "gym", "elite", "switch", "rift"].includes(copy[y][x])) {
            tiles[y][x] = "beach";
          }
        }
      }
    };
    const carvePath = (points) => {
      for (let i = 0; i < points.length - 1; i += 1) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y += 1) {
          for (let x = minX; x <= maxX; x += 1) {
            if (inWorld(x, y)) tiles[y][x] = "path";
          }
        }
      }
    };

    paintEllipse(24, 17, 22, 14);
    paintEllipse(29, 37, 27, 24);
    paintEllipse(22, 55, 23, 15);
    paintEllipse(71, 16, 20, 12);
    paintEllipse(76, 55, 22, 13);
    paintEllipse(88, 35, 9, 8, "citadel");
    paintEllipse(50, 40, 9, 6, "town");
    paintEllipse(43, 67, 8, 4, "town");
    paintEllipse(19, 61, 21, 13, "ogreGrass");
    paintEllipse(28, 60, 16, 10, "ogreGrass");
    paintEllipse(16, 57, 10, 7, "town");

    carveRect(35, 33, 41, 55, "river");
    carveRect(39, 52, 44, 58, "river");
    carveRect(53, 37, 62, 42, "deepWater");
    carveRect(58, 34, 64, 38, "bridge");
    carveRect(76, 32, 87, 36, "bridge");

    carveRect(12, 59, 25, 67, "town"); // Memelet Town
    carveRect(12, 9, 26, 16, "town"); // Grunkridge
    carveRect(9, 42, 24, 50, "town"); // Rustburrow / Petalbog edge
    carveRect(48, 36, 57, 43, "town"); // Slimeport
    carveRect(64, 9, 82, 19, "techfloor"); // Mauvellite / Alien Nebula
    carveRect(67, 49, 88, 63, "memeFloor"); // Brainrot Dimension
    carveRect(84, 31, 93, 40, "citadel"); // Crown Citadel

    TOWN_ZONES.forEach((zone) => {
      carveRect(zone.x1, zone.y1, zone.x2, zone.y2, zone.tile);
    });

    carvePath([[18, 59], [18, 53], [25, 53], [25, 45], [18, 45]]);
    carvePath([[25, 45], [31, 45], [31, 35], [45, 35], [49, 38]]);
    carvePath([[23, 53], [23, 38], [25, 28], [19, 18], [19, 15]]);
    carvePath([[30, 35], [35, 29], [42, 22], [48, 21], [52, 25], [52, 35]]);
    carvePath([[54, 38], [62, 38], [68, 33], [70, 20], [72, 16]]);
    carvePath([[56, 41], [63, 43], [70, 49], [75, 55]]);
    carvePath([[77, 55], [82, 48], [84, 42], [88, 40]]);
    carvePath([[78, 35], [88, 35]]);
    carvePath([[18, 64], [42, 64], [42, 67]]);
    carvePath([[54, 41], [60, 45], [62, 47], [65, 47]]);
    carvePath([[62, 47], [68, 49], [72, 55]]);
    carvePath([[62, 47], [67, 42], [77, 36]]);
    carvePath([[61, 51], [61, 56], [66, 60]]);
    carveRect(60, 45, 64, 49, "path");

    const buildings = [
      [16, 61, "lab"],
      [13, 62, "pc"],
      [22, 62, "shop"],
      [62, 46, "gym"],
      [18, 11, "gym"],
      [47, 24, "gym"],
      [16, 45, "gym"],
      [24, 47, "gym"],
      [71, 12, "gym"],
      [79, 16, "gym"],
      [72, 54, "gym"],
      [84, 58, "gym"],
      [88, 35, "elite"],
      [68, 54, "switch"],
      [78, 56, "switch"],
      [85, 52, "switch"],
      [13, 48, "switch"],
      [91, 65, "rift"],
    ];
    buildings.forEach(([x, y, tile]) => {
      if (!["lab", "pc", "shop", "gym", "elite"].includes(tile)) return;
      const zone = TOWN_ZONES.find((place) => x >= place.x1 && x <= place.x2 && y >= place.y1 && y <= place.y2);
      const padTile = zone?.tile === "techfloor" || zone?.tile === "memeFloor" || zone?.tile === "citadel" ? zone.tile : "path";
      carveRect(x - 1, y, x + 1, y + 1, padTile);
      carveRect(x - 2, y + 2, x + 2, y + 2, padTile);
    });
    carveRect(12, 61, 23, 64, "path");
    carveRect(16, 59, 16, 65, "path");
    carveRect(13, 64, 22, 64, "path");
    buildings.forEach(([x, y, tile]) => {
      tiles[y][x] = tile;
    });

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        if (x === 0 || y === 0 || x === WORLD_W - 1 || y === WORLD_H - 1) tiles[y][x] = "deepWater";
      }
    }
    softenCoast();

    return { tiles };
  }

  function baseTileFor(x, y) {
    const border = x < 2 || y < 2 || x > WORLD_W - 3 || y > WORLD_H - 3;
    if (border) return "wall";
    const biome = biomeForCoord(x, y);
    const n = Math.abs(hash(`${x},${y}`)) % 100;
    if (biome === "ogre") {
      if (n < 10) return "mountain";
      if (n < 18) return "rockGrass";
      return n < 72 ? "ogreGrass" : "dirt";
    }
    if (biome === "alien") {
      if (n < 8) return "void";
      if (n < 24) return "neonGrass";
      return n < 70 ? "circuit" : "metal";
    }
    if (biome === "goblin") {
      if (n < 8) return "wall";
      if (n < 25) return "mushGrass";
      return n < 72 ? "cave" : "moss";
    }
    if (n < 8) return "glitchWall";
    if (n < 26) return "memeGrass";
    return n < 72 ? "slime" : "checker";
  }

  function biomeForCoord(x, y) {
    if (x < 48 && y < 32) return "ogre";
    if (x >= 48 && y < 32) return "alien";
    if (x < 48 && y >= 32) return "goblin";
    return "brainrot";
  }

  function currentBiome() {
    if (!state.player) return "town";
    const place = currentPlace();
    if (place) return biomeForPlaceTheme(place.theme);
    const tile = tileAt(state.player.x, state.player.y);
    if (["town", "lab", "pc", "shop"].includes(tile)) return "town";
    if (["citadel", "elite"].includes(tile)) return "citadel";
    if (state.player.x < 36 && state.player.y > 52) return "town";
    return biomeForCoord(state.player.x, state.player.y);
  }

  function biomeForPlaceTheme(theme) {
    if (theme === "duel") return "pvp";
    if (theme === "alien" || theme === "brainrot" || theme === "citadel") return theme;
    if (theme === "ogre" || theme === "forge") return "ogre";
    if (theme === "goblin") return "goblin";
    return "town";
  }

  function biomeName(biome) {
    return {
      town: "Memelet Town",
      citadel: "Crown Citadel",
      ogre: "Ogre Highlands",
      alien: "Alien Nebula",
      goblin: "Goblin Warrens",
      brainrot: "Brainrot Dimension",
      legendary: "Legendary Rift",
      pvp: "Prism Duel Plaza",
    }[biome] || "Ogreverse";
  }

  function placeAt(x, y) {
    return TOWN_ZONES.find((zone) => x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) || null;
  }

  function townThemeAt(x, y) {
    const place = placeAt(x, y);
    return place ? TOWN_THEMES[place.theme] : null;
  }

  function currentPlace() {
    if (!state.player) return null;
    return placeAt(state.player.x, state.player.y);
  }

  function currentLocationName() {
    const place = currentPlace();
    return place ? place.name : biomeName(currentBiome());
  }

  function currentAreaKey() {
    const place = currentPlace();
    return place ? `place:${place.key}` : `biome:${currentBiome()}`;
  }

  function biomeAccent(biome = currentBiome()) {
    return {
      town: "#60d394",
      ogre: "#de7a3b",
      alien: "#4ed5cf",
      goblin: "#8ce06f",
      brainrot: "#ff72e1",
      citadel: "#d6b85f",
      legendary: "#f3d35b",
      pvp: "#4ed5cf",
    }[biome] || "#60d394";
  }

  function biomeAccentAlt(biome = currentBiome()) {
    return {
      town: "#f3d35b",
      ogre: "#d6c27c",
      alien: "#9456d1",
      goblin: "#ff6f69",
      brainrot: "#60d394",
      citadel: "#fff6d7",
      legendary: "#ff72e1",
      pvp: "#f3d35b",
    }[biome] || "#f3d35b";
  }

  function checkAreaChange(force = false) {
    if (!state.player) return;
    const key = currentAreaKey();
    if (!force && state.lastAreaKey === key) return;
    state.lastAreaKey = key;
    const biome = currentBiome();
    const place = currentPlace();
    state.areaBanner = {
      title: currentLocationName(),
      subtitle: place && place.name !== biomeName(biome) ? biomeName(biome) : `${weatherName()} / ${timeOfDay()}`,
      biome,
      started: performance.now(),
      until: performance.now() + 3200,
    };
  }

  function addStepParticles(fromX, fromY, toX, toY) {
    const now = performance.now();
    const targetPlace = placeAt(toX, toY);
    const biome = targetPlace ? biomeForPlaceTheme(targetPlace.theme) : biomeForCoord(toX, toY);
    const tile = tileAt(toX, toY);
    const base = biomeAccent(biome);
    const alt = biomeAccentAlt(biome);
    const waterish = tile === "river" || tile === "deepWater";
    const count = tile === "memeFloor" || tile === "checker" ? 7 : waterish ? 6 : 4;
    for (let i = 0; i < count; i += 1) {
      const jitterX = ((hash(`${fromX}:${fromY}:${toX}:${toY}:${i}`) % 17) - 8) / 28;
      const jitterY = ((hash(`${toY}:${toX}:${i}:step`) % 11) - 5) / 34;
      state.stepParticles.push({
        x: toX + 0.5 + jitterX,
        y: toY + 0.86 + jitterY,
        vx: ((i % 3) - 1) * 0.015,
        vy: -0.018 - (i % 2) * 0.01,
        color: waterish ? "#d4f4ff" : i % 2 ? base : alt,
        dark: tile === "cave" || tile === "mushGrass" ? "#071018" : shade(base, -38),
        size: waterish ? 6 : i % 3 === 0 ? 5 : 3,
        started: now + i * 12,
        until: now + 520 + i * 18,
      });
    }
    if (state.stepParticles.length > 80) state.stepParticles.splice(0, state.stepParticles.length - 80);
  }

  function showFocusPulse(x, y, color = "#f3d35b") {
    state.focusPulse = {
      x,
      y,
      color,
      started: performance.now(),
      until: performance.now() + 520,
    };
  }

  function makeNpcs() {
    return [
      { id: "prof", x: 15, y: 62, sprite: "prof", dialog: ["Professor Mold: The Ogreverse is balanced by friendship, snacks, and legally distinct capture technology.", "Catch creatures, train them, collect eight sigils, and stop Team Brainrot Overload from deep-frying the type chart."] },
      { id: "mom", x: 13, y: 64, sprite: "mom", dialog: ["Mom: I packed Potions, clean socks, and a waiver for whatever a Skibidi Sludge is.", "Come back anytime. I will pretend not to hear the battle music."] },
      { id: "orbKid", x: 21, y: 64, sprite: "kid", quest: "firstCatch", dialog: ["Orb Intern: Catch one creature and I will promote you to Assistant Orb Gobbler. It is unpaid but shiny."] },
      { id: "ogrePoet", x: 18, y: 13, sprite: "ogre", dialog: ["Ogre Poet: Roses are red, boulders are dense, I wrote this on a wall because paper got tense."] },
      { id: "goblinChef", x: 13, y: 46, sprite: "goblin", quest: "caught10", dialog: ["Goblin Chef: Bring proof of ten caught creatures and I will season your bag with Ultra Orbs."] },
      { id: "alienMechanic", x: 70, y: 14, sprite: "alien", quest: "techQuest", dialog: ["Alien Mechanic: My router is haunted by vibes. Show me any Electric or Tech creature and I will pay you in good orbs."] },
      { id: "brainrotBard", x: 76, y: 54, sprite: "brainrot", dialog: ["Brainrot Bard: Three switches make the Trial Den door stop buffering. This was peer-reviewed by a sandwich."] },
      { id: "duelMarshal", x: 62, y: 48, sprite: "guard", dialog: ["Prism Marshal: Trainers gather here for online duels. Open the hosted game with ?mmo=1, roam into the plaza, then challenge anyone nearby.", "Server PvP owns HP, PP, items, switches, clock, accuracy, and damage. No client-side sauce crimes."] },
      { id: "gateGuard", x: 86, y: 38, sprite: "guard", dialog: ["Gate Guard: Crown Citadel opens at eight sigils, after the Overload boss stops chewing on reality."] },
      ...makeTrainerNpcs(),
      ...makeVillainNpcs(),
    ];
  }

  function makeTrainerNpcs() {
    const trainers = [
      ["t1", 19, 54, "Youngster Yapper", ["Brute"], "ogre", 7, 1, "My first strategy is yelling. My second strategy is louder yelling."],
      ["t2", 26, 45, "Goblin Intern Pip", ["Trick"], "goblin", 12, 2, "I put all my money into suspicious pockets."],
      ["t3", 25, 27, "Hiker Bonkson", ["Rock", "Brute"], "ogre", 16, 2, "Mountains respect me because I owe them lunch."],
      ["t4", 68, 25, "Astronaut Mimi", ["Tech", "Flying"], "alien", 20, 2, "Zero gravity, maximum drama."],
      ["t5", 55, 38, "Centerline Chad", ["Water", "Grass"], null, 24, 3, "I stand between regions and charge emotional tolls."],
      ["t6", 31, 43, "Warren Bouncer", ["Dark", "Poison"], "goblin", 28, 3, "Password? It was banana yesterday. Today it is also banana."],
      ["t7", 70, 50, "Meme Tourist", ["Chaos"], "brainrot", 32, 3, "I came for the rift and stayed because my shoes melted."],
      ["t8", 82, 20, "Nebula Ace Kiki", ["Electric", "Psychic"], "alien", 38, 4, "My creatures know calculus and one rude gesture."],
      ["t9", 43, 23, "Ogre Captain Bort", ["Steel", "Brute"], "ogre", 44, 4, "Stronghold rule one: never skip leg day or breakfast."],
      ["t10", 86, 58, "Rift Camper Lou", ["Chaos", "Dark"], "brainrot", 50, 4, "I have been here since the loading screen became sentient."],
      ["t11", 22, 57, "Preschool Bonk Mina", ["Grass", "Brute"], "ogre", 8, 2, "I put a sticker on my boulder. Now it has morale."],
      ["t12", 21, 16, "Stronghold Page Rollo", ["Rock", "Brute"], "ogre", 18, 2, "The castle said I could guard this puddle."],
      ["t13", 49, 35, "Slimeport Clerk Vex", ["Water", "Poison"], null, 27, 3, "Harbor taxes are paid in confusion and exact change."],
      ["t14", 69, 18, "Satellite Jockey Nia", ["Tech", "Electric"], "alien", 33, 3, "My antenna gets three bars and one prophecy."],
      ["t15", 78, 53, "Clip Shrine Pilgrim Lox", ["Fairy", "Ghost"], "brainrot", 45, 4, "I followed the rift trail and it followed me back."],
      ["t16", 88, 36, "Citadel Door Guy Bram", ["Steel", "Psychic"], "alien", 54, 4, "The door has a sigil counter, a mood, and better posture than me."],
      ["t17", 41, 64, "Dewdrop Fisher Lunk", ["Water", "Bug"], "goblin", 22, 3, "I fish for coins. Creatures keep happening."],
      ["t18", 30, 33, "Cave Cousin Mug", ["Bug", "Dark"], "goblin", 30, 3, "I am not lost. I am locally misplaced."],
      ["t19", 16, 58, "Lunchbox Ogre Tams", ["Brute", "Grass"], "ogre", 10, 2, "My lunchbox has more defense than your first bond."],
      ["t20", 32, 29, "Cliff Drummer Orla", ["Rock", "Flying"], "ogre", 24, 3, "I play drums on cliffs. The echo files complaints."],
      ["t21", 52, 42, "Slimeport Dock Poet", ["Water", "Psychic"], null, 31, 3, "Roses are wet, docks are weird, my boat got emotionally cleared."],
      ["t22", 63, 38, "Bridge Sysadmin Quark", ["Tech", "Steel"], "alien", 36, 3, "I rebooted the bridge and now it wants applause."],
      ["t23", 74, 16, "Nebula Intern Zed", ["Electric", "Tech"], "alien", 42, 4, "The satellite chose me because I clicked maybe."],
      ["t24", 72, 57, "Meme Shrine Talia", ["Fairy", "Chaos"], "brainrot", 48, 4, "I came for enlightenment and got a cursed ringtone."],
      ["t25", 83, 55, "Rift DJ Scrollo", ["Ghost", "Chaos"], "brainrot", 52, 4, "My mixtape lowered three stats and raised questions."],
      ["t26", 88, 33, "Evergrin Squire Pell", ["Steel", "Brute"], "ogre", 56, 5, "Crown Citadel asked me to stand here and look expensive."],
    ];
    return trainers.map(([id, x, y, name, theme, clan, level, count, line]) => ({
      id,
      x,
      y,
      sprite: clan || "trainer",
      trainer: { name, theme, clan, level, count, line },
    }));
  }

  function makeVillainNpcs() {
    return [
      { id: "overload1", x: 50, y: 38, sprite: "villain", villain: true, requiresBadges: 2, trainer: { name: "Overload Admin Doomscroll", theme: ["Dark", "Chaos"], clan: "brainrot", level: 24, count: 3, line: "Team Brainrot Overload will replace balance with autoplay!" } },
      { id: "overload2", x: 64, y: 39, sprite: "villain", villain: true, requiresBadges: 5, trainer: { name: "Overload Admin Clipbait", theme: ["Tech", "Chaos"], clan: "alien", level: 42, count: 4, line: "We hacked every Trial Den sign to say 'subscribe'!" } },
      { id: "overloadFinal", x: 82, y: 60, sprite: "villain", villain: true, requiresBadges: 7, trainer: { name: "Overload Boss Lord Scrollus", theme: ["Chaos", "Ghost", "Dark", "Trick"], clan: null, level: 55, count: 5, aceId: "BRT033", line: "When the Brainrot Overload peaks, every type becomes soup!" } },
    ];
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    keys.add(key);
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(key)) event.preventDefault();
    if (state.mode === "overworld") {
      if (["arrowup", "w"].includes(key)) tryMove(0, -1, "up");
      else if (["arrowdown", "s"].includes(key)) tryMove(0, 1, "down");
      else if (["arrowleft", "a"].includes(key)) tryMove(-1, 0, "left");
      else if (["arrowright", "d"].includes(key)) tryMove(1, 0, "right");
      else if (["z", "enter", " "].includes(key)) interact();
      else if (["x", "escape", "m"].includes(key)) openMenu("home");
    } else if (state.mode === "trial" && ["enter", " ", "z"].includes(key)) {
      startTrialFromPreview();
    } else if (state.mode === "trial" && ["x", "escape", "m"].includes(key)) {
      closeTrialPreview();
    } else if (state.mode === "menu" && ["x", "escape", "m"].includes(key)) {
      closeMenu();
    } else if (state.mode === "pvp" && ["x", "escape", "m"].includes(key)) {
      if (state.pvp?.view?.status === "complete") leaveOnlineBattle();
      else refreshOnlineBattleState();
    } else if (state.mode === "title" && ["enter", " "].includes(key)) {
      state.hasSave ? loadGame() : startNewGame();
    }
  }

  function onPanelClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    event.preventDefault();
    handleAction(button.dataset.action, button.dataset.value);
  }

  function setupMobileControls() {
    if (!mobileControls) return;
    mobileJoystickEl = mobileControls.querySelector("[data-joystick]");
    mobileControls.addEventListener("click", (event) => {
      if (performance.now() < mobileClickSuppressUntil) {
        event.preventDefault();
        return;
      }
      onPanelClick(event);
    });
    mobileControls.addEventListener("pointerdown", onMobilePointerDown);
    mobileControls.addEventListener("pointermove", onMobilePointerMove);
    mobileControls.addEventListener("pointerup", stopMobileMoveRepeat);
    mobileControls.addEventListener("pointerleave", stopMobileMoveRepeat);
    mobileControls.addEventListener("pointercancel", stopMobileMoveRepeat);
    mobileControls.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function onMobilePointerDown(event) {
    const joystick = event.target.closest("[data-joystick]");
    if (joystick) {
      event.preventDefault();
      startMobileJoystick(event, joystick);
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button || button.dataset.action !== "touchMove") return;
    event.preventDefault();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort across mobile browsers.
    }
    mobileClickSuppressUntil = performance.now() + 520;
    stopMobileMoveRepeat();
    handleAction("touchMove", button.dataset.value);
    mobileMoveDelay = window.setTimeout(() => {
      mobileMoveRepeat = window.setInterval(() => handleAction("touchMove", button.dataset.value), 145);
    }, 230);
  }

  function onMobilePointerMove(event) {
    if (mobileJoystickPointerId === null || event.pointerId !== mobileJoystickPointerId || !mobileJoystickEl) return;
    event.preventDefault();
    updateMobileJoystick(event);
  }

  function startMobileJoystick(event, joystick) {
    mobileJoystickEl = joystick;
    mobileJoystickPointerId = event.pointerId;
    mobileClickSuppressUntil = performance.now() + 520;
    stopMobileMoveRepeat();
    try {
      joystick.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort across mobile browsers.
    }
    joystick.classList.add("active");
    updateMobileJoystick(event, true);
    mobileMoveRepeat = window.setInterval(() => moveFromMobileJoystick(), 145);
  }

  function updateMobileJoystick(event, immediate = false) {
    if (!mobileJoystickEl) return;
    const rect = mobileJoystickEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const max = Math.max(18, Math.min(rect.width, rect.height) * 0.32);
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > max ? max / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    mobileJoystickEl.style.setProperty("--stick-x", `${Math.round(x)}px`);
    mobileJoystickEl.style.setProperty("--stick-y", `${Math.round(y)}px`);

    const deadzone = Math.min(rect.width, rect.height) * 0.18;
    const nextDirection = distance < deadzone ? null : joystickDirection(rawX, rawY);
    const changed = !sameJoystickDirection(mobileJoystickDirection, nextDirection);
    mobileJoystickDirection = nextDirection;
    if ((immediate || changed) && mobileJoystickDirection) moveFromMobileJoystick(true);
  }

  function joystickDirection(x, y) {
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0
        ? { dx: 1, dy: 0, facing: "right" }
        : { dx: -1, dy: 0, facing: "left" };
    }
    return y > 0
      ? { dx: 0, dy: 1, facing: "down" }
      : { dx: 0, dy: -1, facing: "up" };
  }

  function sameJoystickDirection(a, b) {
    if (!a || !b) return a === b;
    return a.dx === b.dx && a.dy === b.dy && a.facing === b.facing;
  }

  function moveFromMobileJoystick(force = false) {
    if (!mobileJoystickDirection) return;
    const now = performance.now();
    if (!force && now - mobileJoystickLastMove < 110) return;
    mobileJoystickLastMove = now;
    tryMove(mobileJoystickDirection.dx, mobileJoystickDirection.dy, mobileJoystickDirection.facing);
  }

  function stopMobileMoveRepeat() {
    if (mobileMoveDelay) window.clearTimeout(mobileMoveDelay);
    if (mobileMoveRepeat) window.clearInterval(mobileMoveRepeat);
    mobileMoveDelay = null;
    mobileMoveRepeat = null;
    mobileJoystickPointerId = null;
    mobileJoystickDirection = null;
    if (mobileJoystickEl) {
      mobileJoystickEl.classList.remove("active");
      mobileJoystickEl.style.setProperty("--stick-x", "0px");
      mobileJoystickEl.style.setProperty("--stick-y", "0px");
    }
  }

  function handleAction(action, value) {
    if (action === "new") startNewGame();
    if (action === "continue") loadGame();
    if (action === "starter") chooseStarter(value);
    if (action === "quickA") quickConfirm();
    if (action === "quickB") quickBack();
    if (action === "quickMenu") quickMenu();
    if (action === "menu") openMenu(value || "home");
    if (action === "closeMenu") closeMenu();
    if (action === "save") saveGame();
    if (action === "startTrial") startTrialFromPreview();
    if (action === "leaveTrial") closeTrialPreview();
    if (action === "move") handleBattleMove(Number(value));
    if (action === "battleMenu") setBattleChoice(value);
    if (action === "useBattleItem") useBattleItem(value);
    if (action === "run") runFromBattle();
    if (action === "switch") switchBattleCreature(Number(value));
    if (action === "useItem") useItem(value);
    if (action === "itemTarget") {
      const [itemName, index] = value.split("|");
      useItemOnTarget(itemName, Number(index));
    }
    if (action === "battleItemTarget") useBattleItemOnTarget(Number(value));
    if (action === "buy") buyItem(value);
    if (action === "heal") healParty(true);
    if (action === "interact") interact();
    if (action === "onlineReconnect") resetOnlineConnection();
    if (action === "onlineChallenge") {
      const peer = state.online.peers.find((item) => item.id === value);
      challengeOnlinePeer(peer);
    }
    if (action === "onlineAccept") respondOnlineChallenge(true);
    if (action === "onlineDecline") respondOnlineChallenge(false);
    if (action === "pvpMove") submitOnlineBattleMove(value);
    if (action === "pvpSwitch") submitOnlineBattleSwitch(Number(value));
    if (action === "pvpItem") submitOnlineBattleItem(value);
    if (action === "pvpSurrender") surrenderOnlineBattle();
    if (action === "pvpRefresh") refreshOnlineBattleState();
    if (action === "pvpExit") leaveOnlineBattle();
    if (action === "touchMove") {
      const [dx, dy, facing] = value.split(",");
      tryMove(Number(dx), Number(dy), facing);
    }
    if (action === "releasePc") releasePc(Number(value));
    if (action === "withdrawPc") withdrawPc(Number(value));
    if (action === "depositParty") depositParty(Number(value));
    if (action === "dex") {
      state.selectedDex = Number(value);
      openMenu("dex");
    }
    dirtyPanel();
  }

  function quickConfirm() {
    if (state.mode === "title") {
      state.hasSave ? loadGame() : startNewGame();
    } else if (state.mode === "overworld") {
      interact();
    } else if (state.mode === "trial") {
      startTrialFromPreview();
    } else if (state.mode === "pvp") {
      if (state.pvp?.view?.status === "complete") leaveOnlineBattle();
      else refreshOnlineBattleState();
    }
  }

  function quickBack() {
    if (state.mode === "menu") {
      closeMenu();
    } else if (state.mode === "trial") {
      closeTrialPreview();
    } else if (state.mode === "battle") {
      if (state.battle?.choice && state.battle.choice !== "main") setBattleChoice("main");
      else toast("Use Bail in the battle panel to run.");
    } else if (state.mode === "pvp") {
      if (state.pvp?.view?.status === "complete") leaveOnlineBattle();
      else refreshOnlineBattleState();
    } else if (state.mode === "overworld") {
      openMenu("home");
    } else if (state.mode === "starter") {
      state.mode = "title";
      state.player = null;
      clearTransientChrome();
    }
  }

  function quickMenu() {
    if (state.mode === "overworld") openMenu("home");
    else if (state.mode === "menu") closeMenu();
    else if (state.mode === "trial") closeTrialPreview();
    else if (state.mode === "battle") setBattleChoice("main");
    else if (state.mode === "pvp") refreshOnlineBattleState();
    else if (state.mode === "title") quickConfirm();
  }

  function tryMove(dx, dy, facing) {
    if (!state.player || state.mode !== "overworld") return;
    state.player.facing = facing;
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;
    if (!inWorld(nx, ny)) return;
    if (isBlocked(nx, ny)) {
      bumpTile(nx, ny);
      dirtyPanel();
      return;
    }
    state.stepFx = {
      fromX: state.player.x,
      fromY: state.player.y,
      toX: nx,
      toY: ny,
      until: performance.now() + 130,
    };
    addStepParticles(state.player.x, state.player.y, nx, ny);
    state.player.x = nx;
    state.player.y = ny;
    state.player.steps += 1;
    state.player.clock = (state.player.clock + 3) % 1440;
    if (state.player.repelSteps > 0) state.player.repelSteps -= 1;
    checkAreaChange();
    checkStepEvent();
    maybeWildEncounter();
    sendOnlinePresence(true);
    dirtyPanel();
  }

  function isBlocked(x, y) {
    const tile = tileAt(x, y);
    if (["deepWater", "river", "wall", "mountain", "void", "glitchWall", "lab", "pc", "shop", "gym", "elite", "rift"].includes(tile)) return true;
    if (tile === "switch") return true;
    return NPCS.some((npc) => npc.x === x && npc.y === y && npcVisible(npc));
  }

  function bumpTile(x, y) {
    const tile = tileAt(x, y);
    showFocusPulse(x, y, "#f3d35b");
    if (["lab", "pc", "shop", "gym", "elite", "switch", "rift"].includes(tile)) {
      interactAt(x, y);
    }
  }

  function checkStepEvent() {
    const tile = tileAt(state.player.x, state.player.y);
    if (tile === "path" && state.player.badges.length >= 2 && !state.player.defeated.overload1 && distanceTo(50, 38) < 3) {
      toast("A Team Overload admin lurks near the citadel path.");
    }
    if (state.player.champion && !state.player.postGameUnlocked) {
      state.player.postGameUnlocked = true;
      state.player.quests.postgame = "active";
      toast("Post-game unlocked: the Legendary Rift is humming southeast of Brainrot Bazaar.");
    }
  }

  function maybeWildEncounter() {
    if (state.mode !== "overworld") return;
    if (state.player.party.length === 0) return;
    if (state.player.repelSteps > 0) return;
    const tile = tileAt(state.player.x, state.player.y);
    const encounterTiles = {
      ogreGrass: "ogre",
      rockGrass: "ogre",
      neonGrass: "alien",
      circuit: "alien",
      mushGrass: "goblin",
      cave: "goblin",
      memeGrass: "brainrot",
      slime: "brainrot",
      checker: "brainrot",
    };
    const biome = encounterTiles[tile];
    if (!biome) return;
    const chance = tile.includes("Grass") || tile === "circuit" || tile === "cave" ? 0.12 : 0.07;
    if (Math.random() < chance) {
      const level = wildLevelFor(biome);
      const enemy = pickWildCreature(biome, level);
      startBattle({
        kind: "wild",
        name: `Wild ${enemy.nickname}`,
        enemyParty: [enemy],
        canRun: true,
        music: "wild",
      });
    }
  }

  function wildLevelFor(biome) {
    const badgeBonus = state.player.badges.length * 5;
    const base = { ogre: 5, goblin: 9, alien: 14, brainrot: 20 }[biome] || 5;
    return clamp(base + badgeBonus + Math.floor(Math.random() * 5), 3, state.player.champion ? 72 : 58);
  }

  function pickWildCreature(biome, level) {
    let candidates = SPECIES.filter((species) => {
      if (species.legendary) return false;
      if (!species.habitat.includes(biome)) return false;
      if (species.stageIndex > 0 && level < (species.stageIndex === 1 ? 18 : 38)) return false;
      return true;
    });
    if (!candidates.length) candidates = SPECIES.filter((species) => species.clan === biome && species.stageIndex === 0);
    const weighted = [];
    candidates.forEach((species) => {
      const weight = { common: 8, uncommon: 4, rare: 1, legendary: 0 }[species.rarity] || 1;
      for (let i = 0; i < weight; i += 1) weighted.push(species);
    });
    const species = weighted[Math.floor(Math.random() * weighted.length)];
    markSeen(species.id);
    return createCreature(species.id, level);
  }

  function interact() {
    if (!state.player || state.mode !== "overworld") return;
    const [x, y] = frontCoord();
    const npc = NPCS.find((item) => item.x === x && item.y === y && npcVisible(item));
    if (npc) {
      showFocusPulse(x, y, "#60d394");
      interactNpc(npc);
      return;
    }
    const peer = onlinePeerAt(x, y);
    if (peer) {
      showFocusPulse(x, y, "#4ed5cf");
      challengeOnlinePeer(peer);
      return;
    }
    showFocusPulse(x, y, "#f3d35b");
    interactAt(x, y);
  }

  function interactAt(x, y) {
    const tile = tileAt(x, y);
    if (tile === "pc") {
      healParty(true);
      openMenu("pc");
      return;
    }
    if (tile === "shop") {
      openMenu("shop");
      return;
    }
    if (tile === "lab") {
      showDialogue({ sprite: "prof", name: "Professor Mold" }, "Professor Mold: The lab smells like moss, batteries, and first-bond paperwork.");
      return;
    }
    if (tile === "gym") {
      const gym = GYMS.find((item) => item.x === x && item.y === y);
      if (gym) openTrialPreview(gym);
      else if (placeAt(x, y)?.key === "duelplaza") {
        showDialogue({ sprite: "guard", name: "Prism Marshal" }, "Prism Marshal: This is the ranked duel gate. Open with ?mmo=1, meet trainers here, then challenge them to a server-clock PvP room.");
      }
      return;
    }
    if (tile === "elite") {
      challengeElite();
      return;
    }
    if (tile === "switch") {
      toggleSwitch(x, y);
      return;
    }
    if (tile === "rift") {
      enterRift();
      return;
    }
    toast(signText(x, y));
  }

  function trialAccessMessage(gym) {
    const badgeIndex = GYMS.findIndex((item) => item.id === gym.id);
    if (state.player.badges.includes(gym.badge)) return "";
    if (state.player.badges.length < badgeIndex) return `${gym.name}: Sigil order matters. The Trial Den doors are dramatic about it.`;
    if (gym.id === "gym8" && !allBrainSwitchesOn()) return "The Brainrot Trial Den is buffering. Flip three glitch switches around Brainrot Bazaar.";
    return "";
  }

  function openTrialPreview(gym) {
    const message = trialAccessMessage(gym);
    if (message) {
      showDialogue({ sprite: gym.clan || "trainer", trainer: { name: gym.name, theme: gym.theme } }, message, 5200, "locked");
      return;
    }
    state.trial = {
      gymId: gym.id,
      rematch: state.player.badges.includes(gym.badge),
      opened: performance.now(),
    };
    state.mode = "trial";
    dirtyPanel();
  }

  function closeTrialPreview() {
    if (state.mode !== "trial") return;
    state.trial = null;
    state.mode = "overworld";
    dirtyPanel();
  }

  function activeTrialGym() {
    return state.trial ? GYMS.find((gym) => gym.id === state.trial.gymId) : null;
  }

  function startTrialFromPreview() {
    const gym = activeTrialGym();
    if (!gym) return closeTrialPreview();
    state.trial = null;
    challengeGym(gym);
  }

  function interactNpc(npc) {
    if (npc.trainer && !state.player.defeated[npc.id]) {
      if (npc.villain && state.player.badges.length < npc.requiresBadges) {
        showDialogue(npc, `${npc.trainer.name}: Come back with ${npc.requiresBadges} sigils. We are busy ruining the plot.`, 5200, "locked");
        return;
      }
      startBattle({
        kind: npc.villain ? "villain" : "trainer",
        name: npc.trainer.name,
        line: npc.trainer.line,
        trainerSprite: npc.sprite || npc.trainer.clan || "trainer",
        enemyParty: makeEnemyParty(npc.trainer),
        onWin: () => {
          state.player.defeated[npc.id] = true;
          state.player.money += 280 + npc.trainer.level * 18;
          if (npc.villain) {
            state.player.flags[npc.id] = true;
            state.player.quests.overload = npc.id === "overloadFinal" ? "complete" : "active";
            toast(`${npc.trainer.name} dropped a corrupted USB and ran away.`);
          } else {
            toast(`${npc.trainer.name} paid you for emotional damages.`);
          }
        },
      });
      return;
    }
    if (npc.quest === "firstCatch") {
      const caught = Object.keys(state.player.dexCaught).length;
      if (caught >= 2 && state.player.quests.firstCatch !== "complete") {
        addItem("Capture Orb", 8);
        addItem("Great Orb", 2);
        state.player.quests.firstCatch = "complete";
        state.player.quests.gymQuest = "active";
        showDialogue(npc, "Orb Intern: Promotion unlocked. Please accept these orbs from a bucket with excellent vibes.", 5600, "quest");
      } else {
        showDialogue(npc, npc.dialog[0], 5200, "quest");
      }
      return;
    }
    if (npc.quest === "caught10") {
      if (Object.keys(state.player.dexCaught).length >= 10 && !state.player.flags.caught10Reward) {
        addItem("Ultra Orb", 5);
        state.player.flags.caught10Reward = true;
        showDialogue(npc, "Goblin Chef: Your bag is seasoned with Ultra Orbs. It tastes like victory and lint.", 5600, "quest");
      } else {
        showDialogue(npc, npc.dialog[0], 5200, "quest");
      }
      return;
    }
    if (npc.quest === "techQuest") {
      const hasTech = state.player.party.some((creature) => {
        const species = SPECIES_BY_ID[creature.id];
        return species.elements.includes("Tech") || species.elements.includes("Electric");
      });
      if (hasTech && !state.player.flags.techQuestReward) {
        addItem("Great Orb", 4);
        addItem("Quantum Cog", 1);
        state.player.flags.techQuestReward = true;
        showDialogue(npc, "Alien Mechanic: The router respects your vibes. Payment deployed.", 5600, "quest");
      } else {
        showDialogue(npc, npc.dialog[0], 5200, "quest");
      }
      return;
    }
    const lines = npc.dialog || ["They stare into the middle distance with tutorial energy."];
    const index = state.player.flags[`dialog_${npc.id}`] ? 1 : 0;
    state.player.flags[`dialog_${npc.id}`] = true;
    showDialogue(npc, lines[Math.min(index, lines.length - 1)], 5200);
  }

  function challengeGym(gym) {
    const badgeIndex = GYMS.findIndex((item) => item.id === gym.id);
    if (state.player.badges.includes(gym.badge)) {
      startBattle({
        kind: "trial",
        name: `${gym.name} Rematch`,
        line: "Rematch mode: the sigil is decorative, the bonks are real.",
        trainerSprite: gym.clan || "trainer",
        enemyParty: makeEnemyParty({ ...gym, level: gym.level + 12, count: Math.min(6, gym.count + 1) }),
        onWin: () => {
          state.player.money += 2000;
          addItem("Ultra Orb", 2);
          toast(`${gym.name} lost the rematch and handed over Ultra Orbs with dignity.`);
        },
      });
      return;
    }
    if (state.player.badges.length < badgeIndex) {
      toast(`${gym.name}: Sigil order matters. The Trial Den doors are dramatic about it.`);
      return;
    }
    if (gym.id === "gym8" && !allBrainSwitchesOn()) {
      toast("The Brainrot Trial Den is buffering. Flip three glitch switches around Brainrot Bazaar.");
      return;
    }
    startBattle({
      kind: "trial",
      name: `Trial Boss ${gym.name}`,
      line: gym.line,
      trainerSprite: gym.clan || "trainer",
      enemyParty: makeEnemyParty(gym),
      onWin: () => {
        state.player.badges.push(gym.badge);
        state.player.money += 1200 + gym.level * 30;
        addItem(gym.level < 30 ? "Great Orb" : "Ultra Orb", 3);
        if (state.player.badges.length >= 2 && state.player.quests.overload === "locked") state.player.quests.overload = "active";
        toast(`You won the ${gym.badge}. The sigil sparkles with questionable authority.`);
      },
    });
  }

  function challengeElite() {
    if (state.player.badges.length < 8) {
      toast("Crown Citadel requires all eight sigils. The door counts better than most NPCs.");
      return;
    }
    if (!state.player.defeated.overloadFinal) {
      toast("Team Brainrot Overload still controls the southeast rift. Stop Lord Scrollus first.");
      return;
    }
    const index = state.player.eliteIndex || 0;
    const boss = ELITE[index];
    if (!boss) {
      state.player.champion = true;
      state.player.eliteIndex = 0;
      state.mode = "overworld";
      toast("You are Crown Warden of the Ogreverse. Post-game rifts now cough up legends.");
      dirtyPanel();
      return;
    }
    startBattle({
      kind: "apex",
      name: boss.id === "champion" ? boss.name : boss.name,
      line: boss.line,
      trainerSprite: boss.id === "champion" ? "champion" : boss.clan || "trainer",
      enemyParty: makeEnemyParty(boss),
      onWin: () => {
        state.player.eliteIndex += 1;
        state.player.money += 3600;
        if (state.player.eliteIndex >= ELITE.length) {
          state.player.champion = true;
          state.player.eliteIndex = 0;
          state.player.quests.postgame = "active";
          addItem("Rizz Orb", 3);
          state.resultBanner = {
            title: "CROWN WARDEN",
            text: "Champion path complete",
            reward: "Postgame rift open",
            biome: "citadel",
            started: performance.now(),
            until: performance.now() + 3200,
          };
          toast("The credits roll in your head. Crown Warden status achieved.");
        } else {
          toast("Apex room cleared. Heal up if you can, then face the next disaster.");
        }
      },
    });
  }

  function enterRift() {
    if (!state.player.champion) {
      toast("The Legendary Rift makes dial-up noises. It opens after you become Crown Warden.");
      return;
    }
    const legends = SPECIES.filter((species) => species.legendary);
    const unseen = legends.filter((species) => !state.player.dexCaught[species.id]);
    const pick = unseen.length ? unseen[0] : legends[Math.floor(Math.random() * legends.length)];
    const enemy = createCreature(pick.id, 72 + Math.floor(Math.random() * 9));
    markSeen(pick.id);
    startBattle({
      kind: "wild",
      name: `Legendary ${enemy.nickname}`,
      enemyParty: [enemy],
      canRun: true,
      music: "legend",
      onWin: () => toast("The rift coughs up confetti, then pretends it was intentional."),
    });
  }

  function toggleSwitch(x, y) {
    if (x === 13 && y === 48) {
      state.player.switches.goblin = !state.player.switches.goblin;
      toast(state.player.switches.goblin ? "A Goblin Warrens shortcut clanks open somewhere damp." : "The goblin lever clanks back. Somewhere, a door sighs.");
      return;
    }
    const map = { "68,54": "brain1", "78,56": "brain2", "85,52": "brain3" };
    const key = map[`${x},${y}`];
    if (key) {
      state.player.switches[key] = !state.player.switches[key];
      const total = ["brain1", "brain2", "brain3"].filter((id) => state.player.switches[id]).length;
      toast(`Glitch switch toggled. Brainrot Trial buffer: ${total}/3.`);
    }
  }

  function allBrainSwitchesOn() {
    return state.player.switches.brain1 && state.player.switches.brain2 && state.player.switches.brain3;
  }

  function makeEnemyParty(template) {
    const party = [];
    for (let i = 0; i < template.count; i += 1) {
      const level = clamp(template.level + i * 2 + Math.floor(Math.random() * 2), 2, 88);
      const species = template.aceId && i === template.count - 1 && SPECIES_BY_ID[template.aceId]
        ? SPECIES_BY_ID[template.aceId]
        : pickSpeciesForTrainer(template.theme, template.clan, level, i);
      const creature = createCreature(species.id, level);
      party.push(creature);
      markSeen(species.id);
    }
    return party;
  }

  function pickSpeciesForTrainer(theme, clanKey, level, offset) {
    let candidates = SPECIES.filter((species) => {
      if (species.legendary && level < 65) return false;
      if (clanKey && species.clan !== clanKey) return false;
      if (theme && theme.length && !theme.some((type) => species.elements.includes(type))) return false;
      if (species.stageIndex === 2 && level < 36) return false;
      if (species.stageIndex === 1 && level < 20) return false;
      return true;
    });
    if (!candidates.length) {
      candidates = SPECIES.filter((species) => !species.legendary && (!clanKey || species.clan === clanKey));
    }
    candidates.sort((a, b) => {
      const aScore = Math.abs(sumStats(a.baseStats) - (300 + level * 5));
      const bScore = Math.abs(sumStats(b.baseStats) - (300 + level * 5));
      return aScore - bScore || a.number - b.number;
    });
    return candidates[(offset * 7 + level) % Math.min(18, candidates.length)];
  }

  function startBattle(config) {
    const firstAlive = firstAliveIndex(state.player.party);
    if (firstAlive < 0) {
      toast("Your crew is fainted. Visit a Vault station before picking fights.");
      return;
    }
    state.mode = "battle";
    state.battle = {
      ...config,
      playerIndex: firstAlive,
      enemyIndex: 0,
      choice: "main",
      log: [config.line || config.name || "Battle started!"],
      playerStages: freshStages(),
      enemyStages: freshStages(),
      busy: false,
      result: null,
      fx: null,
    };
    state.battleIntro = {
      kind: config.kind || "battle",
      name: config.name || "Battle",
      trainerSprite: config.kind === "wild" ? null : trainerAssetKey(config.trainerSprite || config.clan || "trainer"),
      started: performance.now(),
      until: performance.now() + 780,
    };
    markSeen(activeEnemy().id);
    dirtyPanel();
  }

  function freshStages() {
    return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 };
  }

  function activePlayer() {
    return state.player.party[state.battle.playerIndex];
  }

  function activeEnemy() {
    return state.battle.enemyParty[state.battle.enemyIndex];
  }

  function battleLog(text) {
    state.battle.log.unshift(text);
    state.battle.log = state.battle.log.slice(0, 5);
    toast(text, 1800);
  }

  function setBattleChoice(choice) {
    if (!state.battle || state.battle.busy) return;
    state.battle.choice = choice;
    dirtyPanel();
  }

  function handleBattleMove(moveIndex) {
    if (!state.battle || state.battle.busy) return;
    const player = activePlayer();
    const moveSlot = player.moves[moveIndex];
    if (!moveSlot) return;
    const move = MOVES_BY_ID[moveSlot.id];
    if (moveSlot.pp <= 0) {
      battleLog(`${move.name} has no PP left.`);
      return;
    }
    moveSlot.pp -= 1;
    state.battle.busy = true;
    state.battle.choice = "main";
    const enemyMove = chooseEnemyMove(activeEnemy(), player);
    resolveTurn({ source: "player", moveSlot }, { source: "enemy", moveSlot: enemyMove });
  }

  function resolveTurn(playerAction, enemyAction) {
    const player = activePlayer();
    const enemy = activeEnemy();
    const playerSpeed = stagedStat(player, "spe", state.battle.playerStages);
    const enemySpeed = stagedStat(enemy, "spe", state.battle.enemyStages);
    const order = playerSpeed >= enemySpeed ? [playerAction, enemyAction] : [enemyAction, playerAction];
    resolveTurnActionQueue(order, 0);
  }

  function resolveTurnActionQueue(order, index) {
    if (!state.battle) return;
    if (index >= order.length || isFainted(activePlayer()) || isFainted(activeEnemy())) {
      finishTurnResolution();
      return;
    }
    const action = order[index];
    if (action.source === "player") {
      executeMove(activePlayer(), activeEnemy(), action.moveSlot, state.battle.playerStages, state.battle.enemyStages, "foe");
    } else {
      if (action.moveSlot && Number.isFinite(action.moveSlot.pp)) action.moveSlot.pp = Math.max(0, action.moveSlot.pp - 1);
      executeMove(activeEnemy(), activePlayer(), action.moveSlot, state.battle.enemyStages, state.battle.playerStages, "you");
    }
    const fx = state.battle?.fx;
    const delay = fx && performance.now() < fx.until
      ? Math.max(420, fx.until - performance.now() + 140)
      : 420;
    setTimeout(() => resolveTurnActionQueue(order, index + 1), delay);
  }

  function finishTurnResolution() {
    if (!state.battle) return;
    if (!isFainted(activePlayer()) && !isFainted(activeEnemy())) {
      tickStatus(activePlayer(), "Your");
      tickStatus(activeEnemy(), "Enemy");
    }
    setTimeout(afterTurn, 460);
  }

  function executeMove(attacker, defender, moveSlot, attackerStages, defenderStages, defenderLabel) {
    const move = MOVES_BY_ID[moveSlot.id];
    if (attacker.status === "sleep") {
      attacker.statusTurns -= 1;
      battleLog(`${attacker.nickname} is buffering in its sleep.`);
      if (attacker.statusTurns <= 0) attacker.status = null;
      return;
    }
    if (attacker.status === "confuse" && Math.random() < 0.35) {
      const hurt = Math.max(1, Math.floor(calcStats(attacker).hp * 0.08));
      attacker.hp = clamp(attacker.hp - hurt, 0, calcStats(attacker).hp);
      battleLog(`${attacker.nickname} hit itself in confusion and blamed the UI.`);
      return;
    }
    if (attacker.status === "flinch") {
      attacker.status = null;
      battleLog(`${attacker.nickname} flinched and dropped the bit.`);
      return;
    }
    const accuracy = clamp(move.accuracy + attackerStages.acc * 6, 30, 100);
    if (Math.random() * 100 > accuracy) {
      triggerBattleFx(move, defenderLabel, "miss", { attackerId: attacker.id, defenderId: defender.id });
      battleLog(`${attacker.nickname}'s ${move.name} missed.`);
      return;
    }
    if (move.category === "Status") {
      triggerBattleFx(move, defenderLabel, "status", { attackerId: attacker.id, defenderId: defender.id });
      applyMoveEffect(move, attacker, defender, attackerStages, defenderStages, 0);
      battleLog(`${attacker.nickname} used ${move.name}.`);
      return;
    }
    let damage = calcDamage(attacker, defender, move, attackerStages, defenderStages);
    defender.hp = clamp(defender.hp - damage, 0, calcStats(defender).hp);
    const multiplier = typeMultiplier(move.type, SPECIES_BY_ID[defender.id].elements);
    const vibe = multiplier >= 2 ? " It was super effective." : multiplier <= 0.5 ? " It was not very effective." : "";
    triggerBattleFx(move, defenderLabel, multiplier >= 2 ? "super" : "hit", { damage, multiplier, attackerId: attacker.id, defenderId: defender.id });
    battleLog(`${attacker.nickname} used ${move.name} for ${damage} damage.${vibe}`);
    applyMoveEffect(move, attacker, defender, attackerStages, defenderStages, damage);
  }

  function triggerBattleFx(move, target, result, detail = {}) {
    if (!state.battle) return;
    const now = performance.now();
    const premiumType = ["Tech", "Electric", "Psychic", "Flying", "Chaos"].includes(move.type);
    const attackerSpecies = detail.attackerId ? SPECIES_BY_ID[detail.attackerId] : null;
    const premiumClan = attackerSpecies && ["alien", "brainrot"].includes(attackerSpecies.clan);
    const duration = move.category === "Status" ? 1060 : premiumType || premiumClan ? 980 : 760;
    state.battle.fx = {
      target,
      attacker: target === "foe" ? "you" : "foe",
      attackerId: detail.attackerId || null,
      targetId: detail.defenderId || null,
      attackerClan: attackerSpecies?.clan || null,
      moveType: move.type,
      category: move.category,
      moveName: move.name,
      result,
      damage: detail.damage || 0,
      multiplier: detail.multiplier || 1,
      seed: Math.floor(Math.random() * 9999),
      started: now,
      until: now + duration,
    };
  }

  function calcDamage(attacker, defender, move, attackerStages, defenderStages) {
    const attackKey = move.category === "Special" ? "spa" : "atk";
    const defenseKey = move.category === "Special" ? "spd" : "def";
    const atk = stagedStat(attacker, attackKey, attackerStages);
    const def = Math.max(1, stagedStat(defender, defenseKey, defenderStages));
    const species = SPECIES_BY_ID[attacker.id];
    const stab = species.elements.includes(move.type) ? 1.5 : 1;
    const multiplier = typeMultiplier(move.type, SPECIES_BY_ID[defender.id].elements);
    const crit = Math.random() < (0.06 + (move.effect.crit || 0)) ? 1.5 : 1;
    const random = 0.88 + Math.random() * 0.16;
    return Math.max(1, Math.floor(((((2 * attacker.level) / 5 + 2) * move.power * atk / def) / 50 + 2) * stab * multiplier * crit * random));
  }

  function applyMoveEffect(move, attacker, defender, attackerStages, defenderStages, damage) {
    const effect = move.effect || {};
    const chance = effect.chance ?? 1;
    if (effect.status && Math.random() < chance && !defender.status) {
      defender.status = effect.status;
      defender.statusTurns = effect.status === "sleep" ? 1 + Math.floor(Math.random() * 2) : 0;
      const statusText = {
        burn: "burned",
        poison: "poisoned",
        sleep: "sleepy",
        paralyze: "paralyzed",
        freeze: "frozen",
        confuse: "confused",
      }[effect.status] || effect.status;
      battleLog(`${defender.nickname} got ${statusText}.`);
    }
    if (effect.confuse && Math.random() < effect.confuse && !defender.status) {
      defender.status = "confuse";
      battleLog(`${defender.nickname} became confused by the bit.`);
    }
    if (effect.flinch && Math.random() < effect.flinch && !defender.status) {
      defender.status = "flinch";
    }
    if (effect.stat && Math.random() < chance) {
      const stages = effect.target === "self" ? attackerStages : defenderStages;
      stages[effect.stat] = clamp(stages[effect.stat] + effect.amount, -6, 6);
      const targetName = effect.target === "self" ? attacker.nickname : defender.nickname;
      battleLog(`${targetName}'s ${statLabel(effect.stat)} ${effect.amount > 0 ? "rose" : "fell"}.`);
    }
    if (effect.heal) {
      const maxHp = calcStats(attacker).hp;
      const healed = Math.max(1, Math.floor(maxHp * effect.heal));
      attacker.hp = clamp(attacker.hp + healed, 0, maxHp);
      battleLog(`${attacker.nickname} healed ${healed} HP.`);
    }
    if (effect.drain && damage > 0) {
      const maxHp = calcStats(attacker).hp;
      const healed = Math.max(1, Math.floor(damage * effect.drain));
      attacker.hp = clamp(attacker.hp + healed, 0, maxHp);
      battleLog(`${attacker.nickname} drained ${healed} HP.`);
    }
    if (effect.recoil && damage > 0) {
      const recoil = Math.max(1, Math.floor(damage * effect.recoil));
      attacker.hp = clamp(attacker.hp - recoil, 0, calcStats(attacker).hp);
      battleLog(`${attacker.nickname} took ${recoil} recoil.`);
    }
    if (effect.random && Math.random() < 0.55) {
      randomChaos(attacker, defender, attackerStages, defenderStages);
    }
  }

  function randomChaos(attacker, defender, attackerStages, defenderStages) {
    const options = [
      () => {
        if (!defender.status) defender.status = "confuse";
        battleLog(`${defender.nickname} got lost in the sauce.`);
      },
      () => {
        defenderStages.def = clamp(defenderStages.def - 1, -6, 6);
        battleLog(`${defender.nickname}'s defense was taxed by Fanum law.`);
      },
      () => {
        attackerStages.spe = clamp(attackerStages.spe + 1, -6, 6);
        battleLog(`${attacker.nickname} gained forbidden zoomies.`);
      },
      () => {
        const hurt = Math.max(1, Math.floor(calcStats(defender).hp * 0.06));
        defender.hp = clamp(defender.hp - hurt, 0, calcStats(defender).hp);
        battleLog(`${defender.nickname} took ${hurt} psychic cringe damage.`);
      },
    ];
    options[Math.floor(Math.random() * options.length)]();
  }

  function tickStatus(creature, label) {
    if (creature.status === "burn" || creature.status === "poison" || creature.status === "zap") {
      const maxHp = calcStats(creature).hp;
      const loss = Math.max(1, Math.floor(maxHp * (creature.status === "poison" ? 0.08 : 0.06)));
      creature.hp = clamp(creature.hp - loss, 0, maxHp);
      battleLog(`${label} ${creature.nickname} took ${loss} ${creature.status} damage.`);
    }
  }

  function afterTurn() {
    if (!state.battle) return;
    if (isFainted(activeEnemy())) {
      battleLog(`${activeEnemy().nickname} fainted.`);
      handleEnemyFaint();
      return;
    }
    if (isFainted(activePlayer())) {
      battleLog(`${activePlayer().nickname} fainted.`);
      handlePlayerFaint();
      return;
    }
    state.battle.busy = false;
    dirtyPanel();
  }

  function handleEnemyFaint() {
    const enemy = activeEnemy();
    const xp = Math.floor((SPECIES_BY_ID[enemy.id].expYield * enemy.level) / 5);
    awardExp(xp);
    state.battle.enemyIndex += 1;
    state.battle.enemyStages = freshStages();
    if (state.battle.enemyIndex >= state.battle.enemyParty.length) {
      winBattle();
      return;
    }
    battleLog(`${state.battle.name} sent out ${activeEnemy().nickname}.`);
    markSeen(activeEnemy().id);
    state.battle.busy = false;
    dirtyPanel();
  }

  function handlePlayerFaint() {
    const next = firstAliveIndex(state.player.party);
    if (next < 0) {
      loseBattle();
      return;
    }
    state.battle.playerIndex = next;
    state.battle.playerStages = freshStages();
    battleLog(`Go, ${activePlayer().nickname}!`);
    state.battle.busy = false;
    dirtyPanel();
  }

  function winBattle() {
    const battleName = state.battle.name;
    const onWin = state.battle.onWin;
    battleLog(`You defeated ${battleName}.`);
    state.mode = "overworld";
    state.battle = null;
    state.resultBanner = {
      title: "VICTORY",
      text: `Defeated ${battleName}`,
      reward: "EXP + prize thread",
      biome: currentBiome(),
      started: performance.now(),
      until: performance.now() + 1700,
    };
    if (typeof onWin === "function") onWin();
    updateQuestProgress();
    dirtyPanel();
  }

  function loseBattle() {
    toast("You blacked out and woke up at Memelet Town. Your wallet feels emotionally lighter.");
    state.player.money = Math.max(0, state.player.money - 500);
    state.player.x = 14;
    state.player.y = 63;
    healParty(false);
    state.mode = "overworld";
    state.battle = null;
    state.resultBanner = {
      title: "BLACKOUT",
      text: "Returned to Memelet Town",
      reward: "$500 lesson",
      biome: "town",
      started: performance.now(),
      until: performance.now() + 1800,
    };
    dirtyPanel();
  }

  function awardExp(amount) {
    const alive = state.player.party.filter((creature) => !isFainted(creature));
    if (!alive.length) return;
    const share = Math.max(1, Math.floor(amount / Math.min(3, alive.length)));
    alive.slice(0, 3).forEach((creature) => {
      const before = creature.level;
      creature.exp += share;
      creature.level = levelForExp(creature.exp);
      if (creature.level > before) {
        const oldMax = calcStats({ ...creature, level: before }).hp;
        const newMax = calcStats(creature).hp;
        creature.hp = clamp(creature.hp + (newMax - oldMax) + 8, 1, newMax);
        ensureCreatureMoves(creature);
        battleLog(`${creature.nickname} grew to level ${creature.level}.`);
        tryEvolve(creature);
      }
    });
  }

  function tryEvolve(creature, itemName = null) {
    const species = SPECIES_BY_ID[creature.id];
    if (!species.evolvesTo) return false;
    const canLevel = species.evoLevel && creature.level >= species.evoLevel;
    const canItem = itemName && species.evoItem === itemName;
    const canCondition = !species.evoCondition || species.evoCondition === timeOfDay();
    if ((canLevel && canCondition) || canItem) {
      const oldName = creature.nickname;
      const oldId = creature.id;
      creature.id = species.evolvesTo;
      creature.nickname = SPECIES_BY_ID[creature.id].name;
      ensureCreatureMoves(creature);
      creature.hp = calcStats(creature).hp;
      markSeen(creature.id);
      markCaught(creature.id);
      state.evolutionFx = {
        oldId,
        newId: creature.id,
        oldName,
        newName: creature.nickname,
        started: performance.now(),
        until: performance.now() + 2600,
      };
      toast(`${oldName} evolved into ${creature.nickname}. The OgreLog applauds suspiciously.`);
      return true;
    }
    return false;
  }

  function chooseEnemyMove(enemy, player) {
    const slots = enemy.moves.filter((slot) => slot.pp > 0);
    if (!slots.length) return { id: enemy.moves[0].id, pp: 1 };
    slots.sort((a, b) => {
      const ma = MOVES_BY_ID[a.id];
      const mb = MOVES_BY_ID[b.id];
      const scoreA = ma.power * typeMultiplier(ma.type, SPECIES_BY_ID[player.id].elements);
      const scoreB = mb.power * typeMultiplier(mb.type, SPECIES_BY_ID[player.id].elements);
      return scoreB - scoreA;
    });
    return Math.random() < 0.65 ? slots[0] : slots[Math.floor(Math.random() * slots.length)];
  }

  function useBattleItem(itemName) {
    if (!state.battle || state.battle.busy) return;
    const count = state.player.bag[itemName] || 0;
    if (count <= 0) return;
    const item = ITEMS[itemName];
    if (item.kind === "orb") {
      if (state.battle.kind !== "wild") {
        battleLog("The trainer slapped the orb away with contractual confidence.");
        return;
      }
      state.player.bag[itemName] -= 1;
      const enemy = activeEnemy();
      const caught = attemptCatch(enemy, item.rate);
      state.battle.busy = true;
      state.battle.choice = "main";
      const now = performance.now();
      state.captureFx = {
        itemName,
        enemyId: enemy.id,
        enemyName: enemy.nickname,
        caught,
        biome: currentBiome(),
        started: now,
        until: now + 1160,
      };
      battleLog(`${itemName} launched at ${enemy.nickname}.`);
      setTimeout(() => finishCaptureAttempt(enemy, itemName, caught), 1080);
      dirtyPanel();
      return;
    }
    if (item.kind === "heal" || item.kind === "revive") {
      state.battle.pendingItem = itemName;
      state.battle.choice = "itemTarget";
      dirtyPanel();
      return;
    }
  }

  function finishCaptureAttempt(enemy, itemName, caught) {
    if (caught) {
      markCaught(enemy.id);
      addCreatureToCollection(enemy);
      state.mode = "overworld";
      state.battle = null;
      updateQuestProgress();
      state.resultBanner = {
        title: "CAUGHT",
        text: enemy.nickname,
        reward: `${itemName} sealed the bit`,
        biome: state.captureFx?.biome || currentBiome(),
        started: performance.now(),
        until: performance.now() + 1900,
      };
      toast(`${enemy.nickname} was caught in a ${itemName}. The orb made a tiny legal sound.`);
    } else if (state.battle) {
      battleLog(`${enemy.nickname} broke free and dabbed irresponsibly.`);
      const enemyMove = chooseEnemyMove(activeEnemy(), activePlayer());
      executeMove(activeEnemy(), activePlayer(), enemyMove, state.battle.enemyStages, state.battle.playerStages, "you");
      setTimeout(afterTurn, 360);
    }
    dirtyPanel();
  }

  function useBattleItemOnTarget(creatureIndex) {
    if (!state.battle || state.battle.busy || !state.battle.pendingItem) return;
    const itemName = state.battle.pendingItem;
    const item = ITEMS[itemName];
    const creature = state.player.party[creatureIndex];
    if (!item || !creature || (state.player.bag[itemName] || 0) <= 0) return;
    const maxHp = calcStats(creature).hp;
    if (item.kind === "heal") {
      if (creature.hp <= 0) {
        battleLog("That creature needs Revive before snacks can help.");
        return;
      }
      creature.hp = clamp(creature.hp + item.amount, 0, maxHp);
      state.player.bag[itemName] -= 1;
      battleLog(`${creature.nickname} recovered HP with ${itemName}.`);
    } else if (item.kind === "revive") {
      if (creature.hp > 0) {
        battleLog(`${creature.nickname} is already up and posing.`);
        return;
      }
      creature.hp = Math.max(1, Math.floor(maxHp * item.amount));
      creature.status = null;
      state.player.bag[itemName] -= 1;
      battleLog(`${creature.nickname} revived.`);
    } else {
      return;
    }
    state.battle.pendingItem = null;
    state.battle.choice = "main";
    state.battle.busy = true;
    const enemyMove = chooseEnemyMove(activeEnemy(), activePlayer());
    executeMove(activeEnemy(), activePlayer(), enemyMove, state.battle.enemyStages, state.battle.playerStages, "you");
    setTimeout(afterTurn, 360);
    dirtyPanel();
  }

  function attemptCatch(enemy, rate) {
    const species = SPECIES_BY_ID[enemy.id];
    const maxHp = calcStats(enemy).hp;
    const hpFactor = (3 * maxHp - 2 * enemy.hp) / (3 * maxHp);
    const statusBonus = enemy.status ? 1.35 : 1;
    const badgeBonus = 1 + state.player.badges.length * 0.035;
    const chance = clamp((species.captureRate / 255) * hpFactor * rate * statusBonus * badgeBonus, 0.03, species.legendary ? 0.28 : 0.92);
    return Math.random() < chance;
  }

  function addCreatureToCollection(creature) {
    const copy = JSON.parse(JSON.stringify(creature));
    copy.status = null;
    copy.statusTurns = 0;
    if (state.player.party.length < 6) {
      state.player.party.push(copy);
      toast(`${copy.nickname} joined your crew.`);
    } else {
      state.player.pc.push(copy);
      toast(`${copy.nickname} went to Vault storage.`);
    }
  }

  function runFromBattle() {
    if (!state.battle || state.battle.busy) return;
    if (!state.battle.canRun) {
      battleLog("No running from a trainer with eye contact.");
      return;
    }
    const playerSpeed = stagedStat(activePlayer(), "spe", state.battle.playerStages);
    const enemySpeed = stagedStat(activeEnemy(), "spe", state.battle.enemyStages);
    const chance = clamp(0.55 + (playerSpeed - enemySpeed) / 120, 0.25, 0.95);
    if (Math.random() < chance) {
      state.mode = "overworld";
      state.battle = null;
      toast("You ran away with tactical dignity.");
    } else {
      battleLog("Could not escape. The grass judged you.");
      state.battle.busy = true;
      const enemyMove = chooseEnemyMove(activeEnemy(), activePlayer());
      executeMove(activeEnemy(), activePlayer(), enemyMove, state.battle.enemyStages, state.battle.playerStages, "you");
      setTimeout(afterTurn, 360);
    }
    dirtyPanel();
  }

  function switchBattleCreature(index) {
    if (!state.battle || state.battle.busy) return;
    if (index === state.battle.playerIndex) return;
    const creature = state.player.party[index];
    if (!creature || isFainted(creature)) return;
    state.battle.playerIndex = index;
    state.battle.playerStages = freshStages();
    battleLog(`Go, ${creature.nickname}!`);
    state.battle.choice = "main";
    state.battle.busy = true;
    const enemyMove = chooseEnemyMove(activeEnemy(), activePlayer());
    executeMove(activeEnemy(), activePlayer(), enemyMove, state.battle.enemyStages, state.battle.playerStages, "you");
    setTimeout(afterTurn, 360);
    dirtyPanel();
  }

  function useItem(itemName) {
    if (!state.player || !state.player.bag[itemName]) return;
    const item = ITEMS[itemName];
    if (state.mode === "battle" && state.battle?.pendingItem) {
      return;
    }
    if (item.kind === "heal" || item.kind === "revive" || item.kind === "evo") {
      state.menu = `target:${itemName}`;
      state.mode = "menu";
      dirtyPanel();
      return;
    }
  }

  function useItemOnTarget(itemName, creatureIndex) {
    const item = ITEMS[itemName];
    const creature = state.player.party[creatureIndex];
    if (!item || !creature || (state.player.bag[itemName] || 0) <= 0) return;
    const maxHp = calcStats(creature).hp;
    if (item.kind === "heal") {
      if (creature.hp <= 0) return toast("Healing a fainted creature requires Revive first.");
      creature.hp = clamp(creature.hp + item.amount, 0, maxHp);
      state.player.bag[itemName] -= 1;
      toast(`${creature.nickname} recovered HP.`);
    }
    if (item.kind === "revive") {
      if (creature.hp > 0) return toast(`${creature.nickname} is already standing there dramatically.`);
      creature.hp = Math.max(1, Math.floor(maxHp * item.amount));
      creature.status = null;
      state.player.bag[itemName] -= 1;
      toast(`${creature.nickname} got back up and blamed lag.`);
    }
    if (item.kind === "evo") {
      if (tryEvolve(creature, itemName)) {
        state.player.bag[itemName] -= 1;
      } else {
        toast(`${creature.nickname} sniffed the ${itemName} and declined the plot.`);
      }
    }
    openMenu("bag");
  }

  function buyItem(itemName) {
    const item = ITEMS[itemName];
    if (!item || state.player.money < item.price) {
      toast("Not enough money. The shopkeeper points at the price tag with lore accuracy.");
      return;
    }
    state.player.money -= item.price;
    addItem(itemName, 1);
    toast(`Bought ${itemName}.`);
  }

  function addItem(itemName, count) {
    state.player.bag[itemName] = (state.player.bag[itemName] || 0) + count;
  }

  function healParty(showToast) {
    if (!state.player) return;
    [...state.player.party, ...state.player.pc].forEach((creature) => {
      creature.hp = calcStats(creature).hp;
      creature.status = null;
      creature.statusTurns = 0;
      ensureCreatureMoves(creature);
      creature.moves.forEach((slot) => (slot.pp = MOVES_BY_ID[slot.id].pp));
    });
    if (showToast) toast("Crew healed. The machine hummed the Ogreverse anthem off-key.");
    dirtyPanel();
  }

  function updateQuestProgress() {
    if (state.player.quests.firstCatch === "active" && Object.keys(state.player.dexCaught).length >= 2) {
      toast("Quest updated: talk to the Orb Intern in Memelet Town.");
    }
    if (state.player.badges.length >= 8 && state.player.quests.gymQuest !== "complete") {
      state.player.quests.gymQuest = "complete";
    }
    if (state.player.champion && state.player.quests.postgame === "locked") {
      state.player.quests.postgame = "active";
      state.player.postGameUnlocked = true;
    }
    const legends = SPECIES.filter((species) => species.legendary);
    if (state.player.champion && legends.length && legends.every((species) => state.player.dexCaught[species.id])) {
      state.player.quests.postgame = "complete";
    }
  }

  function normalizeMenu(menu) {
    const key = String(menu || "home").toLowerCase();
    return {
      crew: "party",
      party: "party",
      home: "home",
      satchel: "bag",
      bag: "bag",
      ogrelog: "dex",
      log: "dex",
      dex: "dex",
      world: "map",
      map: "map",
      quest: "quests",
      quests: "quests",
      vault: "pc",
      pc: "pc",
      mart: "shop",
      shop: "shop",
    }[key] || key;
  }

  function openMenu(menu) {
    if (!state.player) return;
    state.mode = "menu";
    state.menu = normalizeMenu(menu);
    if (state.menu === "dex") focusKnownDexEntry();
    state.areaBanner = null;
    dirtyPanel();
    scheduleMobilePanelFocus();
  }

  function focusKnownDexEntry() {
    const selected = SPECIES[state.selectedDex] || SPECIES[0];
    if (selected && (state.player.dexCaught[selected.id] || state.player.dexSeen[selected.id])) return;
    const caughtIndex = SPECIES.findIndex((species) => state.player.dexCaught[species.id]);
    if (caughtIndex >= 0) {
      state.selectedDex = caughtIndex;
      return;
    }
    const seenIndex = SPECIES.findIndex((species) => state.player.dexSeen[species.id]);
    if (seenIndex >= 0) state.selectedDex = seenIndex;
  }

  function closeMenu() {
    if (!state.player) return;
    state.mode = "overworld";
    state.menu = "home";
    dirtyPanel();
    scheduleMobileScreenFocus();
  }

  function mobileLayoutActive() {
    return typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 920px)").matches;
  }

  function scheduleMobilePanelFocus() {
    if (!mobileLayoutActive() || !panel) return;
    window.setTimeout(() => {
      const top = Math.max(0, panel.getBoundingClientRect().top + window.scrollY - 8);
      window.scrollTo({ top, behavior: "auto" });
    }, 45);
  }

  function scheduleMobileScreenFocus() {
    if (!mobileLayoutActive()) return;
    const screen = canvas?.closest?.(".screen-wrap");
    if (!screen) return;
    window.setTimeout(() => {
      const top = Math.max(0, screen.getBoundingClientRect().top + window.scrollY - 8);
      window.scrollTo({ top, behavior: "auto" });
    }, 45);
  }

  function releasePc(index) {
    if (!state.player.pc[index]) return;
    const name = state.player.pc[index].nickname;
    state.player.pc.splice(index, 1);
    toast(`${name} was released and immediately joined a local improv troupe.`);
  }

  function withdrawPc(index) {
    if (state.player.party.length >= 6) {
      toast("Crew is full.");
      return;
    }
    const creature = state.player.pc.splice(index, 1)[0];
    state.player.party.push(creature);
    toast(`${creature.nickname} joined the crew.`);
  }

  function depositParty(index) {
    if (state.player.party.length <= 1) {
      toast("Keep at least one crew member. The plot requires a buddy.");
      return;
    }
    const creature = state.player.party.splice(index, 1)[0];
    state.player.pc.push(creature);
    toast(`${creature.nickname} went to Vault storage.`);
  }

  function markSeen(id) {
    if (state.player) state.player.dexSeen[id] = true;
  }

  function markCaught(id) {
    if (state.player) {
      state.player.dexCaught[id] = true;
      state.player.dexSeen[id] = true;
    }
  }

  function renderPanel() {
    if (typeof document !== "undefined") {
      document.body.dataset.gameMode = state.mode || "title";
      document.body.dataset.hasPlayer = state.player ? "1" : "0";
    }
    if (!state.panelDirty) return;
    state.panelDirty = false;
    if (state.mode === "title") return renderTitlePanel();
    if (state.mode === "starter") return renderStarterPanel();
    if (state.mode === "battle") return renderBattlePanel();
    if (state.mode === "pvp") return renderPvpPanel();
    if (state.mode === "trial") return renderTrialPanel();
    if (state.mode === "menu") return renderMenuPanel();
    return renderOverworldPanel();
  }

  function renderTitlePanel() {
    const starters = SPECIES.filter((species) => species.starter);
    panel.innerHTML = `
      <div class="title-panel hero-title-panel">
        <span class="boot-chip">RAGE CAGE</span>
        <h1>OGREVERSE</h1>
        <p class="subtitle">BRAINROT PRISM</p>
        <div class="route-progress title-progress"><span style="width:7%"></span></div>
      </div>
      <div class="stack title-menu">
        <button class="btn primary" data-action="new">New Run</button>
        <button class="btn" data-action="continue" ${state.hasSave ? "" : "disabled"}>Resume</button>
      </div>
      <div class="card starter-preview title-starter-preview">
        <div class="row"><h2>First Bonds</h2><span class="pill">4 paths</span></div>
        <div class="starter-mini-grid">
          ${starters.map((species) => `
            <button class="btn starter-mini" data-action="new">
              ${iconHtml(species.id)}
              <span><strong>${starterShortName(species)}</strong><small>${species.clanLabel} / ${species.role.split(" ")[0]}</small></span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="card title-route-card">
        <div class="row"><strong>Campaign Road</strong><span class="pill">0/8</span></div>
        <p class="tiny">Memelet Town -> Trial Dens -> Overload Rift -> Crown Citadel.</p>
        ${storyRoadHtml(3)}
      </div>
      <div class="grid title-grid">
        <div class="card title-info-card">
          <h3>Memelet Town</h3>
          <p class="tiny muted">Lab open<br>Orb kit stocked<br>Professor Mold watching</p>
        </div>
        <div class="card title-info-card">
          <h3>World Map</h3>
          <p class="tiny muted">Ogre Highlands<br>Alien Nebula<br>Brainrot Rift</p>
        </div>
      </div>
      <div class="card public-notice-card">
        <div class="row"><strong>Public Prototype</strong><span class="pill">original</span></div>
        <p class="tiny muted">Ogreverse uses original names, maps, creatures, terms, and art direction. Saves stay local to this browser.</p>
      </div>
    `;
  }

  function renderStarterPanel() {
    const starters = SPECIES.filter((species) => species.starter);
    panel.innerHTML = `
      <div class="panel-header">
        <div>
          <h1>Choose First Bond</h1>
          <p class="panel-subtitle">Professor Mold's Lab / Starter License</p>
        </div>
        <span class="pill">Lv 5</span>
      </div>
      <div class="card route-card">
        <div class="row"><strong>Starter Brief</strong><span class="pill">one pick</span></div>
        <p class="tiny">Each starter can clear the full campaign. Pick the vibe, then build coverage with wild catches.</p>
      </div>
      <div class="starter-select-grid">
        ${starters.map((species) => starterChoiceHtml(species)).join("")}
      </div>
    `;
  }

  function starterChoiceHtml(species) {
    const accent = TYPE_COLORS[species.elements[0]] || "#60d394";
    const total = sumStats(species.baseStats);
    return `
      <button class="btn card starter-choice-card" data-action="starter" data-value="${species.id}" style="--card-accent:${accent}">
        <div class="creature-line">
          ${iconHtml(species.id)}
          <div>
            <div class="row"><strong>${species.name}</strong><span class="level-chip">${species.clanLabel}</span></div>
            <div class="row wrap">${typePills(species.elements)}<span class="pill">${species.role}</span></div>
          </div>
        </div>
        <p class="tiny">${species.desc}</p>
        ${statBarsHtml(species.baseStats, true)}
        <div class="row starter-card-footer"><span class="tiny muted">Base ${total}</span><span class="pill">First Bond</span></div>
      </button>
    `;
  }

  function starterShortName(species) {
    return {
      OGR001: "Grunk",
      ALN001: "Zorblax",
      GBL001: "Pocketrex",
      BRT001: "Skibizar",
    }[species.id] || species.name;
  }

  function creatureChoiceHtml(species) {
    return `
      <button class="btn card" data-action="starter" data-value="${species.id}">
        <div class="creature-line">
          ${iconHtml(species.id)}
          <div>
            <div class="row"><strong>${species.name}</strong><span>${species.clanLabel}</span></div>
            <div class="row wrap">${typePills(species.elements)}<span class="pill">${species.role}</span></div>
          </div>
        </div>
        <p class="tiny muted">${species.desc}</p>
      </button>
    `;
  }

  function trialFlowStep(gym, index, chapter) {
    return {
      id: gym.id,
      chapter,
      title: gym.badge,
      region: biomeNameForClan(gym.clan),
      target: `${gym.name}'s Trial Den`,
      x: gym.x,
      y: gym.y,
      kind: "trial",
      gymId: gym.id,
      text: `Defeat ${gym.name} and claim sigil ${index + 1}.`,
    };
  }

  function biomeNameForClan(clan) {
    return {
      ogre: "Ogre Highlands",
      goblin: "Goblin Warrens",
      alien: "Alien Nebula",
      brainrot: "Brainrot Dimension",
    }[clan] || "Ogreverse";
  }

  function storyStepComplete(step) {
    const player = state.player;
    if (!player) return false;
    if (step.id === "starter") return player.quests.starter === "complete";
    if (step.id === "firstCatch") return player.quests.firstCatch === "complete";
    if (step.kind === "trial") {
      const gym = GYMS.find((item) => item.id === step.gymId);
      return gym ? player.badges.includes(gym.badge) : false;
    }
    if (step.id === "overload1" || step.id === "overload2" || step.id === "overloadFinal") return !!player.defeated[step.id];
    if (step.id === "apex") return !!player.champion;
    if (step.id === "postgame") return !!player.postGameUnlocked || player.quests.postgame === "active" || player.quests.postgame === "complete";
    return false;
  }

  function storyStepLocked(step) {
    const player = state.player;
    if (!player) return step.id !== "starter";
    if (step.id === "starter") return false;
    if (step.id === "firstCatch") return player.quests.starter !== "complete";
    if (step.kind === "trial") {
      const index = GYMS.findIndex((item) => item.id === step.gymId);
      if (index < 0) return true;
      if (player.badges.length < index) return true;
      if (step.gymId === "gym8" && !allBrainSwitchesOn()) return true;
      return false;
    }
    if (step.id === "overload1") return player.badges.length < 2;
    if (step.id === "overload2") return player.badges.length < 5;
    if (step.id === "overloadFinal") return player.badges.length < 7;
    if (step.id === "apex") return player.badges.length < 8 || !player.defeated.overloadFinal;
    if (step.id === "postgame") return !player.champion;
    return false;
  }

  function activeStoryStep() {
    if (!state.player) return STORY_FLOW[0];
    return STORY_FLOW.find((step) => !storyStepComplete(step) && !storyStepLocked(step))
      || STORY_FLOW.find((step) => !storyStepComplete(step))
      || STORY_FLOW[STORY_FLOW.length - 1];
  }

  function storyCompletionCount() {
    if (!state.player) return 0;
    return STORY_FLOW.filter((step) => storyStepComplete(step)).length;
  }

  function storyProgressPct() {
    return Math.floor((storyCompletionCount() / STORY_FLOW.length) * 100);
  }

  function destinationDistance(step = activeStoryStep()) {
    if (!state.player || !step) return 0;
    return Math.abs(state.player.x - step.x) + Math.abs(state.player.y - step.y);
  }

  function nextTrialGym() {
    return GYMS.find((gym) => !state.player.badges.includes(gym.badge));
  }

  function currentObjective() {
    if (!state.player) return "Begin a new run in Memelet Town.";
    if (state.player.quests.starter !== "complete") return "Choose your first bond in Professor Mold's lab.";
    if (state.player.quests.firstCatch !== "complete") return "Catch a wild creature, then report to the Orb Intern.";
    if (state.player.badges.length >= 2 && !state.player.defeated.overload1) return "Intercept Admin Doomscroll near the harbor road.";
    if (state.player.badges.length >= 5 && !state.player.defeated.overload2) return "Find Admin Clipbait at the Evergrin Gate route.";
    if (state.player.badges.length >= 7 && !state.player.defeated.overloadFinal) return "Stop Lord Scrollus at the southeast Brainrot Rift.";
    const nextGym = nextTrialGym();
    if (nextGym) return `Clear ${nextGym.name}'s Trial Den for the ${nextGym.badge}.`;
    if (!state.player.defeated.overloadFinal) return "Stop Team Brainrot Overload at the southeast rift.";
    if (!state.player.champion) return "Enter Crown Citadel and survive the Apex Gauntlet.";
    return "Post-game: investigate the Legendary Rift for rare chaotic legends.";
  }

  function ribbonObjectiveText(step = activeStoryStep()) {
    if (!state.player || !step) return "Begin your run.";
    if (step.kind === "trial") return `Clear ${step.target.replace("'s Trial Den", "")}'s den.`;
    if (step.id === "firstCatch") return "Catch a wild creature, then report back.";
    if (step.id === "overload1") return "Intercept Admin Doomscroll.";
    if (step.id === "overload2") return "Stop Admin Clipbait's broadcast.";
    if (step.id === "overloadFinal") return "Stop Lord Scrollus at the rift.";
    if (step.id === "apex") return "Enter Crown Citadel and clear Apex.";
    if (step.id === "postgame") return "Investigate the Legendary Rift.";
    return currentObjective();
  }

  function sigilStripHtmlLegacy() {
    return `<div class="sigil-strip">${GYMS.map((gym) => {
      const won = state.player.badges.includes(gym.badge);
      return `<span class="${won ? "won" : ""}" title="${escapeHtml(gym.badge)}">${won ? "◆" : "◇"}</span>`;
    }).join("")}</div>`;
  }

  function sigilProgressHtml() {
    return `<div class="sigil-strip">${GYMS.map((gym) => {
      const won = state.player.badges.includes(gym.badge);
      return `<span class="${won ? "won" : ""}" title="${escapeHtml(gym.badge)}">${won ? "X" : "-"}</span>`;
    }).join("")}</div>`;
  }

  function sigilStripHtml() {
    return `<div class="sigil-strip">${GYMS.map((gym) => {
      const won = state.player.badges.includes(gym.badge);
      return `<span class="${won ? "won" : ""}" title="${escapeHtml(gym.badge)}">${won ? "OK" : "--"}</span>`;
    }).join("")}</div>`;
  }

  function storyStepState(step) {
    if (storyStepComplete(step)) return "done";
    if (storyStepLocked(step)) return "locked";
    return step.id === activeStoryStep().id ? "active" : "open";
  }

  function storyRoadHtml(limit = STORY_FLOW.length) {
    const active = activeStoryStep();
    const activeIndex = STORY_FLOW.findIndex((step) => step.id === active.id);
    const start = limit >= STORY_FLOW.length ? 0 : clamp(activeIndex - 1, 0, Math.max(0, STORY_FLOW.length - limit));
    const items = STORY_FLOW.slice(start, start + limit);
    return `<div class="story-road">${items.map((step) => {
      const stateName = storyStepState(step);
      const label = stateName === "done" ? "DONE" : stateName === "locked" ? "LOCK" : stateName === "active" ? "NOW" : "NEXT";
      return `<div class="story-step ${stateName}">
        <span>${step.chapter}</span>
        <strong>${escapeHtml(step.title)}</strong>
        <small>${label} / ${escapeHtml(step.region)}</small>
      </div>`;
    }).join("")}</div>`;
  }

  function adventureCardHtml() {
    const step = activeStoryStep();
    const pct = storyProgressPct();
    const distance = destinationDistance(step);
    return `
      <div class="card objective-card route-card">
        <div class="row"><strong>Chapter ${step.chapter}: ${escapeHtml(step.title)}</strong><span class="pill">${step.kind}</span></div>
        <div class="route-progress"><span style="width:${pct}%"></span></div>
        <p class="tiny">${escapeHtml(currentObjective())}</p>
        <div class="route-meta">
          <span>${escapeHtml(step.region)}</span>
          <span>${escapeHtml(step.target)}</span>
          <span>${distance} steps</span>
        </div>
        ${storyRoadHtml(5)}
        ${sigilProgressHtml()}
      </div>
    `;
  }

  function campaignDashboardHtml() {
    const step = activeStoryStep();
    const pct = storyProgressPct();
    const caught = Object.keys(state.player.dexCaught).length;
    const seen = Object.keys(state.player.dexSeen).length;
    return `
      <div class="card campaign-hero" style="--campaign-accent:${campaignAccent(step)}">
        <div class="campaign-chapter">
          <span>CH ${step.chapter}</span>
          <strong>${escapeHtml(step.title)}</strong>
          <small>${escapeHtml(step.kind.toUpperCase())}</small>
        </div>
        <div class="campaign-copy">
          <div class="row"><strong>${escapeHtml(step.target)}</strong><span class="pill">${storyProgressPct()}%</span></div>
          <p class="tiny">${escapeHtml(currentObjective())}</p>
          <div class="route-progress"><span style="width:${pct}%"></span></div>
        </div>
        <div class="campaign-stat-grid">
          <div><span>Region</span><strong>${escapeHtml(step.region)}</strong></div>
          <div><span>Distance</span><strong>${destinationDistance(step)} steps</strong></div>
          <div><span>Sigils</span><strong>${state.player.badges.length}/8</strong></div>
          <div><span>OgreLog</span><strong>${caught}/${seen}</strong></div>
        </div>
      </div>
    `;
  }

  function campaignAccent(step = activeStoryStep()) {
    return {
      tutorial: "#60d394",
      quest: "#f3d35b",
      trial: "#de7a3b",
      villain: "#ff72e1",
      elite: "#d6b85f",
      postgame: "#4ed5cf",
    }[step.kind] || "#60d394";
  }

  function storyRegionSummaryHtml() {
    const regions = [];
    STORY_FLOW.forEach((step) => {
      let item = regions.find((entry) => entry.region === step.region);
      if (!item) {
        item = { region: step.region, total: 0, done: 0, active: false };
        regions.push(item);
      }
      item.total += 1;
      if (storyStepComplete(step)) item.done += 1;
      if (step.id === activeStoryStep().id) item.active = true;
    });
    return `<div class="region-progress-grid">${regions.map((entry) => {
      const pct = Math.floor((entry.done / entry.total) * 100);
      return `<div class="region-chip ${entry.active ? "active" : entry.done === entry.total ? "done" : ""}">
        <div class="row"><strong>${escapeHtml(entry.region)}</strong><span>${entry.done}/${entry.total}</span></div>
        <i><em style="width:${pct}%"></em></i>
      </div>`;
    }).join("")}</div>`;
  }

  function fullGameChecklistHtml() {
    const legends = SPECIES.filter((species) => species.legendary);
    const caughtLegends = legends.filter((species) => state.player.dexCaught[species.id]).length;
    const checks = [
      { label: "First Bond", done: state.player.quests.starter === "complete", note: "Starter chosen" },
      { label: "Orb Internship", done: state.player.quests.firstCatch === "complete", note: "Catch tutorial clear" },
      { label: "Eight Sigils", done: state.player.badges.length >= 8, note: `${state.player.badges.length}/8 won` },
      { label: "Overload Core", done: !!state.player.defeated.overloadFinal, note: "Villain route clear" },
      { label: "Apex Champion", done: !!state.player.champion, note: "Crown Warden title" },
      { label: "Legendary Rift", done: state.player.quests.postgame === "complete", note: `${caughtLegends}/${legends.length} legends caught` },
    ];
    return `<div class="fullgame-checklist">${checks.map((check) => `<div class="${check.done ? "done" : ""}">
      <span>${check.done ? "OK" : "--"}</span>
      <strong>${escapeHtml(check.label)}</strong>
      <small>${escapeHtml(check.note)}</small>
    </div>`).join("")}</div>`;
  }

  function trialLadderHtml() {
    return `<div class="badge-ladder">${GYMS.map((gym, index) => {
      const won = state.player.badges.includes(gym.badge);
      const locked = state.player.badges.length < index || (gym.id === "gym8" && !allBrainSwitchesOn());
      const ace = trialAceSpecies(gym);
      return `<div class="badge-row ${won ? "done" : locked ? "locked" : "active"}">
        <span>${index + 1}</span>
        <div>
          <strong>${escapeHtml(gym.badge)}</strong>
          <small>${escapeHtml(gym.name)} / Lv ${gym.level} / Ace ${escapeHtml(ace.name)}</small>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  function overloadLocksHtml() {
    const locks = [
      { id: "overload1", label: "Doomscroll", need: "2 sigils" },
      { id: "overload2", label: "Clipbait", need: "5 sigils" },
      { id: "overloadFinal", label: "Lord Scrollus", need: "7 sigils" },
      { id: "apex", label: "Apex Gate", need: "8 sigils + Overload clear" },
    ];
    return `<div class="lock-grid">${locks.map((lock) => {
      const step = STORY_FLOW.find((item) => item.id === lock.id);
      const done = lock.id === "apex" ? state.player.champion : !!state.player.defeated[lock.id];
      const locked = step ? storyStepLocked(step) : false;
      return `<div class="lock-chip ${done ? "done" : locked ? "locked" : "active"}">
        <strong>${escapeHtml(lock.label)}</strong>
        <small>${done ? "cleared" : locked ? lock.need : "active"}</small>
      </div>`;
    }).join("")}</div>`;
  }

  function renderOverworldPanel() {
    const player = state.player;
    panel.innerHTML = `
      <div class="panel-header">
        <h1>${currentLocationName()}</h1>
        <span class="pill">${timeOfDay()}</span>
      </div>
      <div class="status-plate">
        <div><span>Sigils</span><strong>${player.badges.length}/8</strong></div>
        <div><span>Money</span><strong>$${player.money}</strong></div>
        <div><span>Log</span><strong>${Object.keys(player.dexCaught).length}/${Object.keys(player.dexSeen).length}</strong></div>
        <div><span>Weather</span><strong>${weatherName()}</strong></div>
      </div>
      ${adventureCardHtml()}
      ${onlinePanelHtml()}
      <div class="command-panel">
        <button class="btn primary command-main" data-action="interact"><span>A</span>Talk / Inspect</button>
        <div class="menu-grid">
          <button class="btn menu-btn" data-action="menu" data-value="party"><span>CRW</span>Crew</button>
          <button class="btn menu-btn" data-action="menu" data-value="bag"><span>SAT</span>Satchel</button>
          <button class="btn menu-btn" data-action="menu" data-value="dex"><span>LOG</span>OgreLog</button>
          <button class="btn menu-btn" data-action="menu" data-value="map"><span>MAP</span>Map</button>
          <button class="btn menu-btn" data-action="menu" data-value="quests"><span>QST</span>Quests</button>
          <button class="btn menu-btn" data-action="menu" data-value="pc"><span>VLT</span>Vault</button>
          <button class="btn menu-btn save-btn" data-action="save"><span>SAV</span>Save</button>
        </div>
      </div>
      ${partyMiniHtml()}
      ${touchControlsHtml()}
    `;
  }

  function onlinePanelHtml() {
    if (!onlineRequested()) return "";
    const online = state.online;
    const statusLabel = online.connected ? "ONLINE" : online.connecting ? "LINKING" : online.status.toUpperCase();
    const peers = online.peers.slice(0, 4);
    const incoming = online.incoming;
    const sent = online.challengeSent;
    const record = state.player ? currentPvpRecord() : null;
    const plazaSteps = state.player ? Math.abs(state.player.x - 62) + Math.abs(state.player.y - 47) : 0;
    const atPlaza = currentPlace()?.key === "duelplaza";
    const hubHint = atPlaza
      ? "You are in the main PvP hub. Stand near trainers and challenge them."
      : `Duel Plaza hub: ${plazaSteps} steps away near Slimeport.`;
    return `
      <div class="card online-card ${online.connected ? "online" : "offline"}">
        <div class="row"><strong>Online Field</strong><span class="pill">${escapeHtml(statusLabel)}</span></div>
        <div class="online-hub-strip ${atPlaza ? "active" : ""}">
          <span>${atPlaza ? "PRISM DUEL PLAZA" : "SOCIAL HUB"}</span>
          <strong>${escapeHtml(hubHint)}</strong>
        </div>
        ${incoming ? `
          <div class="online-duel-alert">
            <strong>${escapeHtml(incoming.fromName)}</strong>
            <span>wants a duel</span>
            <div class="row">
              <button class="btn primary compact-btn" data-action="onlineAccept">Accept</button>
              <button class="btn compact-btn" data-action="onlineDecline">Decline</button>
            </div>
          </div>
        ` : sent ? `
          <p class="tiny">Duel request sent to ${escapeHtml(sent.toName)}.</p>
        ` : `
          <p class="tiny muted">${online.connected ? `${peers.length} nearby trainers in sync.` : "Run node server.mjs and open ?mmo=1."}</p>
        `}
        ${peers.length ? `<div class="online-peer-list">${peers.map((peer) => `
          <button class="btn online-peer-btn" data-action="onlineChallenge" data-value="${escapeHtml(peer.id)}">
            <span><strong>${escapeHtml(peer.name)}</strong><small>${escapeHtml(peer.region || "Ogreverse")} / ${escapeHtml(peer.leadName || "First Bond")} / W${peer.duelWins || 0} S${peer.duelStreak || 0}</small></span>
            <span class="pill">Lv ${peer.leadLevel || 5}</span>
          </button>
        `).join("")}</div>` : ""}
        ${record ? onlineDuelRecordHtml(record, atPlaza) : ""}
        ${online.lastError ? `<p class="tiny warn-text">${escapeHtml(online.lastError)}</p>` : ""}
        <button class="btn compact-btn" data-action="onlineReconnect">${online.connected ? "Refresh Link" : "Connect"}</button>
      </div>
    `;
  }

  function onlineDuelRecordHtml(record, atPlaza) {
    const dailyDuelPct = clamp((record.dailyDuels / 3) * 100, 0, 100);
    const dailyWinPct = clamp((record.dailyWins / 1) * 100, 0, 100);
    const winRate = record.duels ? Math.round((record.wins / record.duels) * 100) : 0;
    const lastLine = record.lastResult
      ? `${record.lastResult.toUpperCase()} vs ${record.lastOpponent || "Opponent"}`
      : atPlaza ? "Find a nearby trainer and throw down." : "Reach Duel Plaza to start the loop.";
    return `
      <div class="online-record-card">
        <div class="row"><strong>Duel Record</strong><span class="pill">${record.wins}-${record.losses}</span></div>
        <div class="online-record-grid">
          <div><span>Streak</span><strong>${record.streak}</strong><small>Best ${record.bestStreak}</small></div>
          <div><span>Rate</span><strong>${winRate}%</strong><small>${record.duels} rooms</small></div>
          <div><span>Today</span><strong>${record.dailyWins}/1</strong><small>wins</small></div>
        </div>
        <div class="daily-contract">
          <div><span>Daily rooms</span><i><em style="width:${dailyDuelPct}%"></em></i><b>${Math.min(3, record.dailyDuels)}/3</b></div>
          <div><span>Daily win</span><i><em style="width:${dailyWinPct}%"></em></i><b>${Math.min(1, record.dailyWins)}/1</b></div>
        </div>
        <p class="tiny muted">${escapeHtml(lastLine)}</p>
      </div>
    `;
  }

  function renderTrialPanel() {
    const gym = activeTrialGym();
    if (!gym) {
      closeTrialPreview();
      return;
    }
    const ace = trialAceSpecies(gym);
    const rematch = state.trial?.rematch;
    const trialLevel = rematch ? gym.level + 12 : gym.level;
    const accent = TYPE_COLORS[gym.theme[0]] || "#f3d35b";
    const alt = TYPE_COLORS[gym.theme[1] || gym.theme[0]] || "#60d394";
    panel.innerHTML = `
      <div class="panel-header">
        <h1>${rematch ? "Trial Rematch" : "Trial Den"}</h1>
        <span class="pill">${gym.clan || "mixed"}</span>
      </div>
      <div class="card trial-card" style="--trial-accent:${accent};--trial-alt:${alt}">
        <div class="trial-boss-card">
          <div class="trial-icon-frame">${iconHtml(ace.id)}</div>
          <div class="trial-boss-copy">
            <div class="trial-boss-heading">
              <strong>${escapeHtml(gym.name)}</strong>
              <span class="level-chip">Lv ${trialLevel}</span>
            </div>
            <div class="trial-theme-row">${typePills(gym.theme)}<span class="pill">${gym.count} foes</span></div>
          </div>
        </div>
        <p class="tiny trial-quote">"${escapeHtml(gym.line)}"</p>
        <div class="trial-reward-grid">
          <span>Ace</span><strong>${escapeHtml(ace.name)}</strong>
          <span>Reward</span><strong>${escapeHtml(gym.badge)}</strong>
        </div>
        ${sigilProgressHtml()}
      </div>
      <div class="stack" style="margin-top:10px">
        <button class="btn primary command-main" data-action="startTrial"><span>A</span>${rematch ? "Start Rematch" : "Start Trial"}</button>
        <button class="btn command-main" data-action="leaveTrial"><span>B</span>Leave Den</button>
      </div>
      <div class="card prep-card" style="margin-top:10px;--trial-accent:${accent}">
        <div class="row"><strong>Prep Check</strong><span class="pill">${weatherName()}</span></div>
        <div class="prep-chip-row">
          <span>Healed crew</span>
          <span>Status cures</span>
          <span>Capture Orbs</span>
        </div>
        <p class="tiny muted">The den locks into a boss fight, then reopens routes, trainers, and wild detours after the sigil clears.</p>
      </div>
    `;
  }

  function renderBattlePanel() {
    const battle = state.battle;
    if (!battle) return;
    const player = activePlayer();
    const enemy = activeEnemy();
    const playerSpecies = SPECIES_BY_ID[player.id];
    const enemySpecies = SPECIES_BY_ID[enemy.id];
    const playerStats = calcStats(player);
    const enemyStats = calcStats(enemy);
    const playerAccent = TYPE_COLORS[playerSpecies.elements[0]] || "#60d394";
    const enemyAccent = TYPE_COLORS[enemySpecies.elements[0]] || "#ff72e1";
    const debugBattleChoice = DEBUG_CAPTURE && typeof window !== "undefined" && typeof window.URLSearchParams !== "undefined"
      ? new window.URLSearchParams(window.location.search).get("battleChoice")
      : "";
    const choice = debugBattleChoice || battle.choice;
    let controls = "";
    if (choice === "fight") {
      controls = `<div class="move-grid">${player.moves.map((slot, index) => {
        const move = MOVES_BY_ID[slot.id];
        const matchup = moveMatchupInfo(move, enemySpecies.elements);
        return `<button class="btn move-btn" style="--move-color:${TYPE_COLORS[move.type] || "#f3d35b"}" data-action="move" data-value="${index}" ${slot.pp <= 0 || battle.busy ? "disabled" : ""}>
          <span class="move-name">${move.name}</span>
          <span class="move-meta"><span style="color:${TYPE_COLORS[move.type]}">${move.type}</span> ${move.category}${move.power ? ` / ${move.power} POW` : ""}</span>
          <span class="move-effect ${matchup.className}">${matchup.label}</span>
          <span class="move-pp">PP ${slot.pp}/${move.pp}</span>
        </button>`;
      }).join("")}</div>
      <button class="btn back-btn" data-action="battleMenu" data-value="main">Back</button>`;
    } else if (choice === "bag") {
      controls = `<div class="stack">${Object.entries(state.player.bag).filter(([, count]) => count > 0).map(([name, count]) => {
        const item = ITEMS[name];
        const disabled = battle.busy || (item.kind === "orb" && battle.kind !== "wild");
        return `<button class="btn" data-action="useBattleItem" data-value="${name}" ${disabled ? "disabled" : ""}>
          <div class="row"><strong>${name}</strong><span>x${count}</span></div>
          <span class="tiny muted">${item.desc}</span>
        </button>`;
      }).join("")}</div><button class="btn back-btn" data-action="battleMenu" data-value="main">Back</button>`;
    } else if (choice === "party") {
      controls = `<div class="stack">${state.player.party.map((creature, index) => partySwitchHtml(creature, index)).join("")}</div><button class="btn back-btn" data-action="battleMenu" data-value="main">Back</button>`;
    } else if (choice === "itemTarget") {
      const itemName = battle.pendingItem || "Item";
      controls = `<div class="stack">${state.player.party.map((creature, index) => {
        return `<button class="btn card compact-creature-card" data-action="battleItemTarget" data-value="${index}" ${battle.busy ? "disabled" : ""}>
          ${compactCreatureTopHtml(creature)}
          ${hpHtml(creature.hp, calcStats(creature).hp)}
        </button>`;
      }).join("")}</div><button class="btn back-btn" data-action="battleMenu" data-value="bag">Back to ${itemName}</button>`;
    } else {
      const readyMoves = player.moves.filter((slot) => slot.pp > 0).length;
      const wildNote = battle.kind === "wild" ? "orbs ready" : "trainer duel";
      controls = `<div class="battle-command-grid">
        <button class="btn primary battle-command fight" data-action="battleMenu" data-value="fight" ${battle.busy ? "disabled" : ""}><span>S</span><strong>Strike</strong><small>${readyMoves}/4 ready</small></button>
        <button class="btn battle-command" data-action="battleMenu" data-value="bag" ${battle.busy ? "disabled" : ""}><span>T</span><strong>Satchel</strong><small>${wildNote}</small></button>
        <button class="btn battle-command" data-action="battleMenu" data-value="party" ${battle.busy ? "disabled" : ""}><span>C</span><strong>Crew</strong><small>switch line</small></button>
        <button class="btn warn battle-command" data-action="run" ${battle.busy || !battle.canRun ? "disabled" : ""}><span>B</span><strong>Bail</strong><small>${battle.canRun ? "route out" : "locked"}</small></button>
      </div>`;
    }
    panel.innerHTML = `
      <div class="panel-header">
        <h1>${battle.name}</h1>
        <span class="pill">${battle.kind}</span>
      </div>
      <div class="battle-card foe-card" style="--card-accent:${enemyAccent}">
        ${battlePanelCreatureTopHtml(enemy, enemySpecies)}
        ${hpHtml(enemy.hp, enemyStats.hp)}
      </div>
      <div class="battle-card player-card" style="--card-accent:${playerAccent}">
        ${battlePanelCreatureTopHtml(player, playerSpecies)}
        ${hpHtml(player.hp, playerStats.hp)}
      </div>
      ${battleReadoutHtml(player, enemy, playerSpecies, enemySpecies)}
      <div class="battle-controls">${controls}</div>
      <div class="card battle-log list">
        ${battle.log.map((line) => `<p class="tiny">${escapeHtml(line)}</p>`).join("")}
      </div>
    `;
  }

  function renderPvpPanel() {
    const pvp = state.pvp;
    const view = pvp?.view;
    if (!pvp || !view) {
      panel.innerHTML = `
        <div class="panel-header">
          <h1>Online Duel</h1>
          <span class="pill">sync</span>
        </div>
        <div class="card">
          <div class="row"><strong>Server Room</strong><span class="pill">${escapeHtml(pvp?.roomId || "pending")}</span></div>
          <p class="tiny muted">Waiting for the server-authoritative room state.</p>
          ${pvp?.lastError ? `<p class="tiny warn-text">${escapeHtml(pvp.lastError)}</p>` : ""}
        </div>
        <div class="stack" style="margin-top:10px">
          <button class="btn primary" data-action="pvpRefresh">Refresh Room</button>
          <button class="btn" data-action="pvpExit">Return to Field</button>
        </div>
      `;
      return;
    }
    const you = view.you.creature;
    const foe = view.foe.creature;
    const complete = view.status === "complete";
    const won = view.winnerId === view.you.playerId;
    const waiting = view.status === "waiting" || view.you.ready || pvp.busy;
    const secondsLeft = pvpClockSecondsLeft(view);
    const clockClass = secondsLeft !== null && secondsLeft <= 10 ? "warn" : "good";
    const clockText = secondsLeft === null ? "Complete" : `${secondsLeft}s`;
    const roomShort = String(pvp.roomId || view.id || "room").replace(/^room_/, "").slice(0, 8).toUpperCase();
    const yourParty = Array.isArray(view.you.party) && view.you.party.length ? view.you.party : [you];
    const foeParty = Array.isArray(view.foe.party) && view.foe.party.length ? view.foe.party : [foe];
    const partyButtons = yourParty.map((member, index) => {
      const active = Boolean(member.active) || index === view.you.activeIndex;
      const fainted = Boolean(member.fainted) || member.hp <= 0;
      const canSwitch = !complete && !waiting && !active && !fainted;
      const hpPct = clamp(member.hp / Math.max(1, member.maxHp), 0, 1);
      const accent = TYPE_COLORS[clanPrimaryType(member.speciesId)] || "#60d394";
      return `
        <button class="pvp-party-btn ${active ? "active" : ""} ${fainted ? "fainted" : ""}" style="--party-accent:${accent};--party-hp:${hpPct * 100}%" data-action="pvpSwitch" data-value="${index}" ${canSwitch ? "" : "disabled"}>
          <span class="pvp-party-slot">${index + 1}</span>
          <span class="pvp-party-name">${escapeHtml(member.name)}</span>
          <span class="pvp-party-lv">Lv ${member.level}</span>
          ${member.statusLabel ? `<span class="pvp-party-status">${escapeHtml(member.statusLabel)}</span>` : ""}
          <span class="pvp-party-hp"></span>
        </button>
      `;
    }).join("");
    const foeSlots = foeParty.map((member, index) => {
      const active = Boolean(member.active) || index === view.foe.activeIndex;
      const fainted = Boolean(member.fainted) || member.hp <= 0;
      return `<span class="pvp-foe-slot ${active ? "active" : ""} ${fainted ? "fainted" : ""}">${index + 1}</span>`;
    }).join("");
    const pvpItems = Array.isArray(view.you.items) ? view.you.items : [];
    const itemButtons = pvpItems.map((item) => {
      const canUse = !complete && !waiting && item.quantity > 0;
      return `
        <button class="pvp-item-btn" data-action="pvpItem" data-value="${escapeHtml(item.id)}" ${canUse ? "" : "disabled"} title="${escapeHtml(item.description || item.name)}">
          <span class="pvp-item-name">${escapeHtml(item.name)}</span>
          <span class="pvp-item-label">${escapeHtml(item.label || "ITEM")}</span>
          <span class="pvp-item-count">x${item.quantity}</span>
        </button>
      `;
    }).join("");
    panel.innerHTML = `
      <div class="panel-header">
        <h1>Online Duel</h1>
        <span class="pill">Turn ${view.turn}</span>
      </div>
      <div class="pvp-clock-strip ${clockClass}">
        <span>Server Clock</span>
        <strong>${escapeHtml(clockText)}</strong>
        <small>${complete && view.timeoutLoserId ? won ? "Timeout win" : "Timed out" : waiting ? "locked action" : "choose action"}</small>
      </div>
      <div class="card pvp-arena-card">
        <div class="row"><strong>Prism Ranked Arena</strong><span class="pill">Room ${escapeHtml(roomShort)}</span></div>
        <p class="tiny muted">${escapeHtml(view.you.name || "You")} vs ${escapeHtml(view.foe.name || pvp.opponentName || "Opponent")} / turn ${view.turn} / server-auth PvP</p>
        <div class="pvp-stakes-grid">
          <span>Full crew</span>
          <span>Ranked kit</span>
          <span>45s clock</span>
        </div>
      </div>
      <div class="battle-card player-card" style="--card-accent:${TYPE_COLORS[clanPrimaryType(you.speciesId)] || "#60d394"}">
        <div class="row"><strong>${escapeHtml(you.name)}</strong><span class="level-chip">Lv ${you.level}</span></div>
        ${pvpHpHtml(you)}
        ${pvpStatusHtml(you)}
      </div>
      <div class="battle-card foe-card" style="--card-accent:${TYPE_COLORS[clanPrimaryType(foe.speciesId)] || "#ff72e1"}">
        <div class="row"><strong>${escapeHtml(view.foe.name)}</strong><span class="level-chip">Server</span></div>
        <div class="row"><span>${escapeHtml(foe.name)}</span><span>Lv ${foe.level}</span></div>
        ${pvpHpHtml(foe)}
        ${pvpStatusHtml(foe)}
      </div>
      <div class="card battle-readout">
        <div class="battle-readout-head">
          <strong>${complete ? won ? "Victory" : "Defeat" : waiting ? "Waiting" : "Choose Action"}</strong>
          <span class="${complete ? won ? "good" : "warn" : waiting ? "warn" : "good"}">${escapeHtml(view.status.toUpperCase())}</span>
        </div>
        <p class="tiny muted">${complete ? "Server room is complete." : waiting ? "Action locked. Waiting for opponent/server." : "Server owns HP, PP, items, switching, turn order, accuracy, and damage."}</p>
      </div>
      <div class="card pvp-party-card">
        <div class="row"><strong>Your Party</strong><span class="tiny muted">switch before attacks</span></div>
        <div class="pvp-party-grid">${partyButtons}</div>
        <div class="row pvp-foe-row"><span class="tiny muted">Foe bench</span><span class="pvp-foe-slots">${foeSlots}</span></div>
      </div>
      <div class="card pvp-item-card">
        <div class="row"><strong>Server Kit</strong><span class="tiny muted">ranked stock</span></div>
        <div class="pvp-item-grid">${itemButtons}</div>
      </div>
      <div class="battle-controls">
        ${complete ? `
          <button class="btn primary command-main" data-action="pvpExit"><span>A</span>Return to Field</button>
        ` : `
          <div class="move-grid">${you.moves.map((move) => `
            <button class="btn move-btn" style="--move-color:${TYPE_COLORS[move.type] || "#f3d35b"}" data-action="pvpMove" data-value="${escapeHtml(move.id)}" ${waiting || move.pp <= 0 ? "disabled" : ""}>
              <span class="move-name">${escapeHtml(move.name)}</span>
              <span class="move-meta"><span style="color:${TYPE_COLORS[move.type] || "#f3d35b"}">${escapeHtml(move.type)}</span> / ${move.power} POW</span>
              <span class="move-effect ${move.effectLabel && move.effectLabel !== "SERVER" ? "status" : "normal"}">${escapeHtml(move.effectLabel || "SERVER")}</span>
              <span class="move-pp">PP ${move.pp}/${move.maxPp}</span>
            </button>
          `).join("")}</div>
          <div class="row pvp-room-actions">
            <button class="btn back-btn" data-action="pvpRefresh">Refresh</button>
            <button class="btn warn back-btn" data-action="pvpSurrender">Surrender</button>
          </div>
        `}
      </div>
      <div class="card battle-log list">
        ${view.log.map((line) => `<p class="tiny">${escapeHtml(line)}</p>`).join("")}
      </div>
      ${pvp.lastError ? `<p class="tiny warn-text">${escapeHtml(pvp.lastError)}</p>` : ""}
    `;
  }

  function pvpHpHtml(creature) {
    const pct = clamp(creature.hp / Math.max(1, creature.maxHp), 0, 1);
    return `<div class="hp"><span style="width:${pct * 100}%"></span></div><p class="tiny">${creature.hp}/${creature.maxHp} HP</p>`;
  }

  function pvpStatusHtml(creature) {
    if (!creature?.status) return "";
    const label = creature.statusLabel || String(creature.status).slice(0, 4).toUpperCase();
    return `<div class="pvp-status-line"><span class="pvp-status-tag">${escapeHtml(label)}</span><span class="tiny muted">${escapeHtml(creature.status)} ${creature.statusTurns || ""}</span></div>`;
  }

  function clanPrimaryType(speciesId) {
    const prefix = String(speciesId || "").slice(0, 3);
    return { OGR: "Brute", ALN: "Tech", GBL: "Trick", BRT: "Chaos" }[prefix] || "Normal";
  }

  function battleReadoutHtml(player, enemy, playerSpecies, enemySpecies) {
    const battle = state.battle;
    const playerSpeed = stagedStat(player, "spe", battle.playerStages);
    const enemySpeed = stagedStat(enemy, "spe", battle.enemyStages);
    const tempo = playerSpeed >= enemySpeed ? "Your tempo" : "Foe tempo";
    const tempoClass = playerSpeed >= enemySpeed ? "good" : "warn";
    const best = player.moves
      .map((slot, index) => {
        const move = MOVES_BY_ID[slot.id];
        const mult = move.category === "Status" ? 0 : typeMultiplier(move.type, enemySpecies.elements);
        const score = (move.power || 0) * mult * (slot.pp > 0 ? 1 : 0);
        return { slot, move, mult, score, index };
      })
      .sort((a, b) => b.score - a.score || b.mult - a.mult)[0];
    const enemyWeak = enemySpecies.elements
      .map((type) => `${type}`)
      .join("/");
    const hpPct = clamp(enemy.hp / calcStats(enemy).hp, 0, 1);
    const catchNote = battle.kind === "wild"
      ? hpPct < 0.35 ? "Prime orb window" : hpPct < 0.65 ? "Chip before orb" : "Soften first"
      : `${state.battle.enemyParty.length} foe line`;
    const bestName = best?.score ? best.move.name : "Status setup";
    const bestTag = best?.score ? moveMatchupInfo(best.move, enemySpecies.elements).label : "CONTROL";
    return `
      <div class="battle-readout" style="--readout-accent:${TYPE_COLORS[playerSpecies.elements[0]]};--readout-alt:${TYPE_COLORS[enemySpecies.elements[0]]}">
        <div class="battle-readout-head">
          <strong>Battle Read</strong>
          <span class="${tempoClass}">${tempo}</span>
        </div>
        <div class="battle-readout-grid">
          <div><span>Best hit</span><strong>${escapeHtml(bestName)}</strong><small>${escapeHtml(bestTag)}</small></div>
          <div><span>Foe shell</span><strong>${escapeHtml(enemyWeak)}</strong><small>${escapeHtml(enemySpecies.role)}</small></div>
          <div><span>Window</span><strong>${escapeHtml(catchNote)}</strong><small>${battle.kind}</small></div>
        </div>
      </div>
    `;
  }

  function renderMenuPanel() {
    const menu = normalizeMenu(state.menu);
    state.menu = menu;
    if (menu.startsWith("target:")) return renderTargetPanel(menu.split(":")[1]);
    const menuTitle = {
      home: "Crew",
      party: "Crew",
      bag: "Satchel",
      dex: "OgreLog",
      map: "World Map",
      quests: "Quests",
      pc: "Vault",
      shop: "Mart",
    }[menu] || "Field Gear";
    const tabs = `
      <div class="menu-grid tabs-grid">
        <button class="btn menu-btn ${menu === "party" || menu === "home" ? "active" : ""}" data-action="menu" data-value="party"><span>CRW</span>Crew</button>
        <button class="btn menu-btn ${menu === "bag" ? "active" : ""}" data-action="menu" data-value="bag"><span>SAT</span>Satchel</button>
        <button class="btn menu-btn ${menu === "dex" ? "active" : ""}" data-action="menu" data-value="dex"><span>LOG</span>OgreLog</button>
        <button class="btn menu-btn ${menu === "map" ? "active" : ""}" data-action="menu" data-value="map"><span>MAP</span>Map</button>
        <button class="btn menu-btn ${menu === "quests" ? "active" : ""}" data-action="menu" data-value="quests"><span>QST</span>Quests</button>
        <button class="btn menu-btn ${menu === "pc" ? "active" : ""}" data-action="menu" data-value="pc"><span>VLT</span>Vault</button>
        <button class="btn menu-btn save-btn" data-action="save"><span>SAV</span>Save</button>
      </div>`;
    let body = "";
    if (menu === "party" || menu === "home") body = partyMenuHtml();
    if (menu === "bag") body = bagMenuHtml();
    if (menu === "dex") body = dexMenuHtml();
    if (menu === "map") body = mapMenuHtml();
    if (menu === "quests") body = questsMenuHtml();
    if (menu === "pc") body = pcMenuHtml();
    if (menu === "shop") body = shopMenuHtml();
    panel.innerHTML = `
      <div class="panel-header gear-header">
        <div>
          <h1>${menuTitle}</h1>
          <p class="panel-subtitle">Field Gear / ${currentLocationName()}</p>
        </div>
        <button class="btn tiny close-btn" data-action="closeMenu">Close</button>
      </div>
      ${tabs}
      <div class="gear-body">${body}</div>
      ${touchControlsHtml()}
    `;
  }

  function renderTargetPanel(itemName) {
    panel.innerHTML = `
      <div class="row"><h1>${itemName}</h1><button class="btn" data-action="menu" data-value="bag">Back</button></div>
      <div class="stack">
        ${state.player.party.map((creature, index) => {
          const hp = hpHtml(creature.hp, calcStats(creature).hp);
          return `<button class="btn card compact-creature-card" data-action="itemTarget" data-value="${itemName}|${index}">
            ${compactCreatureTopHtml(creature)}${hp}
          </button>`;
        }).join("")}
      </div>
    `;
  }

  function partyMiniHtml() {
    return `<div class="card party-mini" style="margin-top:10px"><h2>Crew</h2>${state.player.party.map((creature) => {
      const stats = calcStats(creature);
      const species = SPECIES_BY_ID[creature.id];
      return `<div class="tiny party-mini-row" style="--card-accent:${TYPE_COLORS[species.elements[0]]}">
        <div class="row"><span>${creature.nickname}</span><span>Lv ${creature.level}</span></div>${hpHtml(creature.hp, stats.hp)}
      </div>`;
    }).join("")}</div>`;
  }

  function partyMenuHtml() {
    return `<div class="party-grid">${state.player.party.map((creature, index) => creatureCardHtml(creature, index, true)).join("")}</div>`;
  }

  function creatureCardHtml(creature, index, allowDeposit) {
    const species = SPECIES_BY_ID[creature.id];
    const stats = calcStats(creature);
    const accent = TYPE_COLORS[species.elements[0]] || "#60d394";
    return `
      <div class="card creature-card" style="--card-accent:${accent}">
        <div class="crew-card-top">
          <div class="crew-portrait-frame">${spritePortraitHtml(creature.id)}</div>
          <div class="crew-card-copy">
            <div class="row"><strong>${creature.nickname}</strong><span class="level-chip">Lv ${creature.level}</span></div>
            <div class="row wrap">${typePills(species.elements)}<span class="pill">${species.role}</span><span class="pill">${species.rarity}</span></div>
            ${abilityLineHtml(species)}
          </div>
        </div>
        ${hpHtml(creature.hp, stats.hp)}
        ${statBarsHtml(stats, true)}
        <div class="tiny muted evolution-line">${evolutionHint(species)}</div>
        ${moveChipsHtml(creature)}
        <div class="row creature-actions">
          <span class="tiny muted">EXP next ${Math.max(0, expToNext(creature))}</span>
          ${allowDeposit ? `<button class="btn tiny" data-action="depositParty" data-value="${index}">Vault</button>` : ""}
        </div>
      </div>
    `;
  }

  function battlePanelCreatureTopHtml(creature, species = SPECIES_BY_ID[creature.id]) {
    return `
      <div class="battle-panel-top">
        <div class="battle-panel-portrait">${spritePortraitHtml(creature.id)}</div>
        <div class="battle-panel-copy">
          <div class="row"><strong>${creature.nickname}</strong><span>Lv ${creature.level}</span></div>
          <div class="row wrap">${typePills(species.elements)}<span class="pill">${species.ability?.name || "Wild Spark"}</span></div>
        </div>
      </div>
    `;
  }

  function compactCreatureTopHtml(creature) {
    const species = SPECIES_BY_ID[creature.id];
    return `
      <div class="compact-creature-top" style="--card-accent:${TYPE_COLORS[species.elements[0]] || "#60d394"}">
        <div class="compact-portrait-frame">${spritePortraitHtml(creature.id)}</div>
        <div class="compact-creature-copy">
          <div class="row"><strong>${creature.nickname}</strong><span>Lv ${creature.level}</span></div>
          <div class="row wrap">${typePills(species.elements)}<span class="pill">${species.role}</span><span class="pill">${species.ability?.name || "Wild Spark"}</span></div>
        </div>
      </div>
    `;
  }

  function partySwitchHtml(creature, index) {
    return `<button class="btn card compact-creature-card" data-action="switch" data-value="${index}" ${isFainted(creature) || index === state.battle.playerIndex ? "disabled" : ""}>
      ${compactCreatureTopHtml(creature)}
      ${hpHtml(creature.hp, calcStats(creature).hp)}
    </button>`;
  }

  function bagMenuHtml() {
    return `<div class="item-grid">${Object.entries(ITEMS).map(([name, item]) => {
      const count = state.player.bag[name] || 0;
      return `<button class="btn card item-card" data-action="useItem" data-value="${name}" ${count <= 0 ? "disabled" : ""}>
        <div class="row"><strong>${name}</strong><span class="item-count">x${count}</span></div>
        <div class="row wrap"><span class="pill item-kind">${itemCategoryLabel(item.kind)}</span><span class="pill">$${item.price || 0}</span></div>
        <div class="tiny muted">${item.desc}</div>
      </button>`;
    }).join("")}</div>`;
  }

  function dexMenuHtml() {
    const selected = SPECIES[state.selectedDex] || SPECIES[0];
    const caught = state.player.dexCaught[selected.id];
    const seen = state.player.dexSeen[selected.id] || caught;
    const accent = TYPE_COLORS[selected.elements[0]] || "#60d394";
    const statusText = caught ? "caught" : seen ? "seen" : "locked";
    return `
      <div class="card dex-feature" style="--card-accent:${accent}">
        <div class="dex-showcase">
          <div class="dex-portrait-frame">${seen ? spritePortraitHtml(selected.id) : `<span class="dex-mystery">?</span>`}</div>
          <div class="dex-identity">
            <div class="row"><strong>#${String(selected.number).padStart(3, "0")} ${seen ? selected.name : "???"}</strong><span class="level-chip">${statusText}</span></div>
            <div class="row wrap">${seen ? typePills(selected.elements) : ""}<span class="pill">${selected.rarity}</span><span class="pill">${selected.role}</span></div>
          </div>
        </div>
        <p class="tiny">${seen ? selected.desc : "Silhouette data locked. It is probably judging you from the encounter weeds."}</p>
        ${seen ? abilityLineHtml(selected) : ""}
        <div class="tiny muted dex-visual">${seen ? selected.visual : "Sprite silhouette unavailable until seen."}</div>
        ${seen ? statBarsHtml(selected.baseStats, false) : ""}
        <div class="tiny">${seen ? evolutionHint(selected) : "Evolution data locked."}</div>
        <div class="learnset-strip">${seen ? selected.learnset.slice(0, 8).map((item) => `<span>Lv${item.level} ${MOVES_BY_ID[item.moveId].name}</span>`).join("") : ""}</div>
      </div>
      <div class="list" style="margin-top:10px">
        <div class="dex-grid">
          ${SPECIES.map((species, index) => {
            const status = state.player.dexCaught[species.id] ? "caught" : state.player.dexSeen[species.id] ? "seen" : "locked";
            const label = status === "locked" ? `#${String(species.number).padStart(3, "0")} ???` : `#${String(species.number).padStart(3, "0")} ${species.name}`;
            return `<button class="btn tiny dex-row ${index === state.selectedDex ? "active" : ""}" data-action="dex" data-value="${index}">
              <span>${label}</span><small>${status}</small>
            </button>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function statBarsHtml(stats, compact = false) {
    const keys = [
      ["hp", "HP"],
      ["atk", "ATK"],
      ["def", "DEF"],
      ["spa", "SPA"],
      ["spd", "SPD"],
      ["spe", "SPE"],
    ];
    return `<div class="stat-bars ${compact ? "compact" : ""}">${keys.map(([key, label]) => {
      const value = stats[key] || 0;
      const pct = clamp((value / (compact ? 180 : 140)) * 100, 8, 100);
      return `<div class="stat-row"><span>${label}</span><b>${value}</b><i><em style="width:${pct}%"></em></i></div>`;
    }).join("")}</div>`;
  }

  function moveChipsHtml(creature) {
    return `<div class="move-chip-grid">${creature.moves.map((slot) => {
      const move = MOVES_BY_ID[slot.id];
      return `<span class="move-chip" style="--move-color:${TYPE_COLORS[move.type] || "#f3d35b"}">
        <b>${move.name}</b><small>${move.type} / ${slot.pp}</small>
      </span>`;
    }).join("")}</div>`;
  }

  function itemCategoryLabel(kind) {
    return {
      heal: "MED",
      revive: "REV",
      orb: "ORB",
      evo: "EVO",
      held: "GEAR",
      repel: "FIELD",
    }[kind] || String(kind || "ITEM").toUpperCase().slice(0, 5);
  }

  function abilityLineHtml(species) {
    const ability = species.ability || { name: "Wild Spark", desc: "A small passive quirk waiting for better documentation." };
    return `<div class="tiny ability-line"><strong>${escapeHtml(ability.name)}</strong> - ${escapeHtml(ability.desc)}</div>`;
  }

  function evolutionHint(species) {
    if (!species.evolvesTo) {
      const previous = SPECIES.find((item) => item.evolvesTo === species.id);
      return previous ? `Evolution: final form, evolves from ${previous.name}.` : "Evolution: final form.";
    }
    const next = SPECIES_BY_ID[species.evolvesTo];
    const trigger = species.evoItem ? `use ${species.evoItem}` : species.evoLevel ? `Lv ${species.evoLevel}` : species.evoCondition ? species.evoCondition : "special condition";
    const condition = species.evoCondition && species.evoLevel ? ` during ${species.evoCondition}` : "";
    return `Evolution: ${trigger}${condition} -> ${next.name}`;
  }

  function mapMenuHtml() {
    const player = state.player;
    const step = activeStoryStep();
    return `
      <div class="card map-card premium-map-card">
        <div class="row"><h2>Ogreverse Region</h2><span class="pill">${weatherName()}</span></div>
        <div class="map-frame">
          <img class="region-map-img" src="assets/references/ogreverse-region-map-hires-labeled.png" alt="Ogreverse region map">
        </div>
        <div class="map-status-strip">
          <span>Current: ${escapeHtml(currentLocationName())}</span>
          <span>Next: CH ${step.chapter} ${escapeHtml(step.target)}</span>
        </div>
      </div>
      ${campaignDashboardHtml()}
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Region Control</strong><span class="pill">${storyCompletionCount()}/${STORY_FLOW.length}</span></div>
        ${storyRegionSummaryHtml()}
      </div>
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Campaign Road</strong><span class="pill">${storyCompletionCount()}/${STORY_FLOW.length}</span></div>
        ${storyRoadHtml(STORY_FLOW.length)}
      </div>
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Trial Ladder</strong><span class="pill">${player.badges.length}/8</span></div>
        ${trialLadderHtml()}
      </div>
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Overload Locks</strong><span class="pill">${timeOfDay()}</span></div>
        ${overloadLocksHtml()}
      </div>
    `;
  }

  function questsMenuHtml() {
    const questText = {
      starter: ["Choose a first bond from Professor Mold.", "First bond sealed."],
      firstCatch: ["Catch one wild creature, then talk to the Orb Intern.", "Orb Internship complete."],
      gymQuest: ["Clear all eight Trial Dens.", "All sigils collected."],
      overload: ["Stop Team Brainrot Overload at citadel paths and the southeast rift.", "Brainrot Overload stopped."],
      postgame: ["Become Crown Warden to open the Legendary Rift.", "Legendary Rift unlocked."],
    };
    const step = activeStoryStep();
    return `
      ${campaignDashboardHtml()}
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Full Game Checklist</strong><span class="pill">${state.player.champion ? "warden" : `CH ${step.chapter}`}</span></div>
        ${fullGameChecklistHtml()}
      </div>
      <div class="card" style="margin-top:10px">
        <div class="row"><strong>Story Road</strong><span class="pill">${storyCompletionCount()}/${STORY_FLOW.length}</span></div>
        ${storyRoadHtml(10)}
      </div>
      <div class="quest-thread-grid" style="margin-top:10px">${Object.entries(state.player.quests).map(([id, status]) => {
      const done = status === "complete";
      const locked = status === "locked";
      const text = questText[id] || [id, id];
      return `<div class="card quest-thread-card ${done ? "done" : locked ? "locked" : "active"}">
        <div class="row"><strong>${titleCase(id)}</strong><span class="pill">${status}</span></div>
        <p class="tiny muted">${locked ? "This thread is not active yet." : done ? text[1] : text[0]}</p>
      </div>`;
    }).join("")}</div>
    `;
  }

  function pcMenuHtml() {
    return `
      <h2 style="margin-top:12px">Vault (${state.player.pc.length})</h2>
      <div class="stack list">${state.player.pc.length ? state.player.pc.map((creature, index) => `
        <div class="card vault-card">
          ${compactCreatureTopHtml(creature)}
          <div class="row vault-actions">
            <button class="btn tiny" data-action="withdrawPc" data-value="${index}">Recall</button>
            <button class="btn tiny warn" data-action="releasePc" data-value="${index}">Release</button>
          </div>
        </div>`).join("") : `<p class="muted">Vault is empty.</p>`}</div>
      <h2 style="margin-top:12px">Active Crew</h2>
      <div class="stack">${state.player.party.map((creature, index) => `
        <div class="card compact-creature-card">
          ${compactCreatureTopHtml(creature)}
          <div class="row vault-actions">
            <span class="tiny muted">Slot ${index + 1}</span>
            <button class="btn tiny" data-action="depositParty" data-value="${index}">Vault</button>
          </div>
        </div>`).join("")}</div>
    `;
  }

  function shopMenuHtml() {
    const sale = ["Capture Orb", "Great Orb", "Ultra Orb", "Rizz Orb", "Potion", "Super Snack", "Revive", "Big Rock Candy", "Quantum Cog", "Sneak Scarf", "Meme Stone"];
    return `<div class="card"><div class="row"><strong>Money</strong><span>$${state.player.money}</span></div></div>
      <div class="stack" style="margin-top:10px">${sale.map((name) => {
        const item = ITEMS[name];
        return `<button class="btn card" data-action="buy" data-value="${name}">
          <div class="row"><strong>${name}</strong><span>$${item.price}</span></div>
          <span class="tiny muted">${item.desc}</span>
        </button>`;
      }).join("")}</div>`;
  }

  function touchControlsHtml() {
    return `
      <div class="touch">
        <span></span><button class="btn" data-action="touchMove" data-value="0,-1,up">Up</button><span></span>
        <button class="btn" data-action="touchMove" data-value="-1,0,left">Left</button>
        <button class="btn" data-action="interact">A</button>
        <button class="btn" data-action="touchMove" data-value="1,0,right">Right</button>
        <span></span><button class="btn" data-action="touchMove" data-value="0,1,down">Down</button><span></span>
      </div>
    `;
  }

  function hpHtml(current, max) {
    const pct = clamp((current / max) * 100, 0, 100);
    const cls = pct < 25 ? "low" : pct < 55 ? "mid" : "";
    return `<div class="meter" title="${current}/${max}"><span class="${cls}" style="width:${pct}%"></span></div><div class="tiny muted">${current}/${max} HP</div>`;
  }

  function typePills(types) {
    return types.map((type) => `<span class="pill type" style="background:${TYPE_COLORS[type]}">${type}</span>`).join("");
  }

  function typeLabel(type) {
    return `<span style="color:${TYPE_COLORS[type]}">${type}</span>`;
  }

  function moveMatchupInfo(move, defenderTypes) {
    if (!move || move.category === "Status") return { label: "STATUS", className: "status" };
    const multiplier = typeMultiplier(move.type, defenderTypes || []);
    if (multiplier >= 2) return { label: "SUPER", className: "super" };
    if (multiplier <= 0) return { label: "NO HIT", className: "blocked" };
    if (multiplier <= 0.5) return { label: "RESIST", className: "resist" };
    return { label: "NORMAL", className: "normal" };
  }

  function displaySpriteId(speciesId) {
    if (PREMIUM_SPRITE_IDS.has(speciesId)) return speciesId;
    const species = SPECIES_BY_ID[speciesId];
    if (!species) return speciesId;
    const fallback = PREMIUM_SPRITE_FALLBACKS[species.clan];
    if (!fallback) return speciesId;
    if (species.legendary || species.rarity === "legendary") {
      return pickSpriteVariant(species, fallback.legendPool);
    }
    const familySpriteId = displayEvolutionFamilySpriteId(species);
    if (familySpriteId) return familySpriteId;
    if (species.rarity === "rare") return pickSpriteVariant(species, fallback.rarePool);
    if (species.stageCount === 1) return pickSpriteVariant(species, fallback.singlePool);
    if (species.stageIndex >= 2 || (species.stageCount === 2 && species.stageIndex === 1)) return pickSpriteVariant(species, fallback.finalPool);
    if (species.stageIndex === 1) return pickSpriteVariant(species, fallback.middlePool);
    return pickSpriteVariant(species, fallback.basePool);
  }

  function displayEvolutionFamilySpriteId(species) {
    if (!species || species.stageCount <= 1) return null;
    const families = EVOLUTION_SPRITE_FAMILIES[species.clan];
    if (!families?.length) return null;
    const familyKey = `${species.lineId}:${species.role}:${species.elements.join("/")}`;
    const family = families[Math.abs(hash(familyKey)) % families.length];
    const stageSlot = species.stageCount === 2
      ? (species.stageIndex === 0 ? 0 : Math.min(2, family.length - 1))
      : Math.min(species.stageIndex, family.length - 1);
    return family[stageSlot] || null;
  }

  function pickSpriteVariant(species, pool) {
    if (!pool?.length) return species.id;
    const key = `${species.id}:${species.lineId}:${species.role}:${species.elements.join("/")}:${species.rarity}`;
    return pool[Math.abs(hash(key)) % pool.length];
  }

  function getSpriteImage(speciesId, view) {
    if (typeof Image === "undefined") return null;
    const assetId = displaySpriteId(speciesId);
    const key = `${assetId}_${view}`;
    if (SPRITE_CACHE.has(key)) {
      const cached = SPRITE_CACHE.get(key);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onload = () => {};
    img.onerror = () => SPRITE_CACHE.set(key, null);
    img.src = `${SPRITE_DIR}/${key}.png?v=${GAME_ASSET_VERSION}`;
    SPRITE_CACHE.set(key, img);
    return null;
  }

  function getWorldAssetImage(name) {
    if (typeof Image === "undefined") return null;
    if (WORLD_ASSET_CACHE.has(name)) {
      const cached = WORLD_ASSET_CACHE.get(name);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => WORLD_ASSET_CACHE.set(name, null);
    img.src = `${WORLD_ASSET_DIR}/${name}.png`;
    WORLD_ASSET_CACHE.set(name, img);
    return null;
  }

  function getPremiumWorldImage(name) {
    if (typeof Image === "undefined") return null;
    if (PREMIUM_WORLD_CACHE.has(name)) {
      const cached = PREMIUM_WORLD_CACHE.get(name);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => PREMIUM_WORLD_CACHE.set(name, null);
    img.src = `${PREMIUM_WORLD_DIR}/${name}.png?v=${GAME_ASSET_VERSION}`;
    PREMIUM_WORLD_CACHE.set(name, img);
    return null;
  }

  function getPremiumTileImage(key, variant = 0) {
    if (typeof Image === "undefined") return null;
    const safeVariant = ((variant % PREMIUM_TILE_VARIANTS) + PREMIUM_TILE_VARIANTS) % PREMIUM_TILE_VARIANTS;
    const cacheKey = `${key}_${safeVariant}`;
    if (PREMIUM_TILE_CACHE.has(cacheKey)) {
      const cached = PREMIUM_TILE_CACHE.get(cacheKey);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => PREMIUM_TILE_CACHE.set(cacheKey, null);
    img.src = `${PREMIUM_TILE_DIR}/tile_${key}_${safeVariant}.png?v=${GAME_ASSET_VERSION}`;
    PREMIUM_TILE_CACHE.set(cacheKey, img);
    return null;
  }

  function getBattleBackgroundImage(name) {
    if (typeof Image === "undefined") return null;
    const key = BATTLE_BG_NAMES.includes(name) ? name : "town";
    if (BATTLE_BG_CACHE.has(key)) {
      const cached = BATTLE_BG_CACHE.get(key);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => BATTLE_BG_CACHE.set(key, null);
    img.src = `${BATTLE_BG_DIR}/battle_${key}.png?v=${BATTLE_BG_VERSION}`;
    BATTLE_BG_CACHE.set(key, img);
    return null;
  }

  function getTitleCoverImage() {
    if (typeof Image === "undefined") return null;
    if (TITLE_COVER_CACHE.has(TITLE_COVER_SRC)) {
      const cached = TITLE_COVER_CACHE.get(TITLE_COVER_SRC);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => TITLE_COVER_CACHE.set(TITLE_COVER_SRC, null);
    img.src = `${TITLE_COVER_SRC}?v=${GAME_ASSET_VERSION}`;
    TITLE_COVER_CACHE.set(TITLE_COVER_SRC, img);
    return null;
  }

  function trainerAssetKey(sprite) {
    const key = String(sprite || "trainer").toLowerCase();
    const aliases = {
      route: "trainer",
      human: "trainer",
      null: "trainer",
    };
    const mapped = aliases[key] || key;
    return TRAINER_ASSET_NAMES.includes(mapped) ? mapped : "trainer";
  }

  function getTrainerAssetImage(sprite, variant = "world") {
    if (typeof Image === "undefined") return null;
    const key = `${trainerAssetKey(sprite)}_${variant === "portrait" ? "portrait" : "world"}`;
    if (TRAINER_ASSET_CACHE.has(key)) {
      const cached = TRAINER_ASSET_CACHE.get(key);
      return cached && cached.complete && cached.naturalWidth > 0 ? cached : null;
    }
    const img = new Image();
    img.onerror = () => TRAINER_ASSET_CACHE.set(key, null);
    img.src = `${TRAINER_DIR}/${key}.png?v=${TRAINER_ASSET_VERSION}`;
    TRAINER_ASSET_CACHE.set(key, img);
    return null;
  }

  function drawWorldAsset(name, sx, sy, size = TILE) {
    const img = getWorldAssetImage(name);
    if (!img) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(sx), Math.round(sy), Math.round(size), Math.round(size));
    ctx.restore();
    return true;
  }

  function drawPremiumWorldAsset(name, cx, baseY, maxW, maxH) {
    const img = getPremiumWorldImage(name);
    if (!img) return false;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    drawEllipse(cx, baseY - 2, w * 0.72, Math.max(6, h * 0.11), "rgba(0,0,0,0.32)");
    ctx.drawImage(img, Math.round(cx - w / 2), Math.round(baseY - h), w, h);
    ctx.restore();
    return true;
  }

  function premiumTileKey(tile, place) {
    const theme = place?.theme || null;
    if (["lab", "pc", "shop", "gym", "elite"].includes(tile)) return `town_${theme || "meadow"}`;
    if (tile === "switch") return theme ? `town_${theme}` : "memeFloor";
    if (tile === "rift") return "memeFloor";
    if (tile === "town") return `town_${theme || "meadow"}`;
    if (tile === "path") return theme ? `path_${theme}` : "path";
    if (tile === "techfloor") return theme ? `town_${theme}` : "techfloor";
    if (tile === "memeFloor") return theme ? `town_${theme}` : "memeFloor";
    if (tile === "citadel") return theme ? `town_${theme}` : "citadel";
    return tile;
  }

  function drawPremiumTerrainTile(tile, sx, sy, x, y, place) {
    const key = premiumTileKey(tile, place);
    const variant = Math.abs(hash(`${x}:${y}:${key}:premium-tile`)) % PREMIUM_TILE_VARIANTS;
    const img = getPremiumTileImage(key, variant);
    if (!img) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(sx), Math.round(sy), TILE, TILE);
    ctx.restore();
    return true;
  }

  function drawPremiumBattleBackdrop(biome) {
    const key = BATTLE_BG_NAMES.includes(biome) ? biome : "town";
    const img = getBattleBackgroundImage(key);
    if (!img) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, W, 408);
    ctx.restore();
    drawPremiumBattleBackdropPolish(key);
    if (key === "alien") {
      drawBattleStars("#4ed5cf", "#f3d35b");
    } else if (key === "brainrot") {
      for (let i = 0; i < 4; i += 1) {
        const x = (i * 59 + Math.floor(state.anim / 7)) % W;
        const y = 34 + ((i * 41) % 240);
        drawRect(x, y, i % 2 ? 14 : 4, i % 2 ? 3 : 10, i % 3 ? "rgba(255,114,225,0.58)" : "rgba(96,211,148,0.52)");
      }
    }
    return true;
  }

  function drawPremiumBattleBackdropPolish(key) {
    const accent = biomeAccent(key);
    const alt = biomeAccentAlt(key);
    drawRect(0, 0, W, 5, "#071018");
    drawRect(0, 202, W, 4, "rgba(2,5,10,0.42)");
    drawRect(0, 402, W, 6, "#071018");
    for (let y = 0; y < 408; y += 4) drawRect(0, y, W, 1, "rgba(255,255,255,0.02)");
    drawBattlePerspectiveFloor(key, accent, alt);

    if (key === "ogre" || key === "town") {
      drawBattleRegionalSkyline(key, accent, alt);
      for (let i = 0; i < 9; i += 1) {
        const x = 18 + i * 72;
        const h = 42 + ((i * 19) % 38);
        drawRect(x, 196 - h, 38, h, "rgba(7,16,24,0.54)");
        drawRect(x + 5, 188 - h, 28, 10, key === "ogre" ? "#8a7b57" : "#5f8e64");
        drawRect(x + 14, 177 - h, 10, 9, alt);
        if (i % 3 === 0) {
          drawRect(x + 28, 155 - h, 18, 3, "rgba(255,255,255,0.36)");
          drawRect(x + 35, 150 - h, 14, 2, "rgba(255,255,255,0.22)");
        }
      }
      for (let i = 0; i < 18; i += 1) {
        const x = (i * 37 + Math.floor(state.anim / 20)) % W;
        const y = 228 + ((i * 29) % 138);
        drawRect(x, y, 4, 14, "#d8f0a3");
        if (i % 3 === 0) drawRect(x - 2, y - 2, 8, 3, accent);
      }
      return;
    }

    if (key === "alien") {
      drawAlienBattleMegaStructure(accent, alt);
      for (let i = 0; i < 11; i += 1) {
        const x = 10 + i * 60;
        const y = 106 + ((i * 17) % 74);
        drawRect(x, y, 44, 12, "#071018");
        drawRect(x + 4, y + 3, 36, 6, "#263f56");
        drawRect(x + 10, y + 5, 20, 2, i % 2 ? accent : alt);
        drawRect(x + 20, y + 12, 5, 32, "#071018");
        drawRect(x + 22, y + 14, 1, 28, accent);
      }
      for (let x = -48 + Math.floor(state.anim / 18) % 48; x < W; x += 48) {
        drawRect(x, 236, 17, 2, "rgba(78,213,207,0.54)");
        drawRect(x + 12, 266, 20, 2, "rgba(148,86,209,0.42)");
      }
      return;
    }

    if (key === "goblin") {
      drawGoblinBattleStage(accent, alt);
      for (let i = 0; i < 26; i += 1) {
        const x = (i * 53) % W;
        const y = 32 + ((i * 37) % 160);
        drawRect(x, y, 22, 9, "#17151b");
        drawRect(x + 2, y + 2, 18, 5, i % 3 ? "#4a3f3c" : "#5c4f47");
        if (i % 4 === 0) {
          drawRect(x + 8, y + 8, 5, 18, "#071018");
          drawRect(x + 9, y + 9, 3, 14, accent);
        }
      }
      for (let i = 0; i < 8; i += 1) {
        const x = (i * 104 + Math.floor(state.anim / 18)) % (W + 90) - 60;
        const y = 212 + ((i * 31) % 160);
        drawRect(x, y, 76, 3, "rgba(217,209,166,0.16)");
      }
      return;
    }

    if (key === "brainrot") {
      drawBrainrotBattleStage(accent, alt);
      ctx.save();
      ctx.globalAlpha *= 0.48;
      for (let y = 30; y < 190; y += 32) {
        const off = Math.floor((state.anim / 86 + y) % 42);
        drawRect(-off, y, W + 52, 2, y % 64 ? "rgba(39,23,52,0.42)" : "rgba(7,16,24,0.64)");
        drawRect(18 - off, y + 8, W + 24, 1, "rgba(96,211,148,0.16)");
      }
      ctx.restore();
      for (let i = 0; i < 5; i += 1) {
        const x = (i * 93 + Math.floor(state.anim / 18)) % (W + 30) - 15;
        const y = 68 + ((i * 43) % 196);
        const c = i % 3 === 0 ? "rgba(255,114,225,0.52)" : i % 3 === 1 ? "rgba(96,211,148,0.46)" : "rgba(243,211,91,0.34)";
        drawRect(x - 2, y + 1, 20, 5, "rgba(2,5,10,0.28)");
        drawRect(x, y, 12, 2, c);
        drawRect(x + 14, y + 2, 4, 4, c);
      }
      drawRect(76, 78, 88, 30, "rgba(2,5,10,0.44)");
      drawRect(82, 84, 76, 18, "rgba(48,37,65,0.72)");
      drawRect(90, 90, 36, 3, accent);
      drawRect(132, 90, 18, 3, alt);
      drawRect(96, 112, 54, 3, "rgba(243,211,91,0.28)");
      drawPixelOval(160, 346, 270, 70, "rgba(2,5,10,0.34)", 5, 1);
      drawPixelOval(486, 176, 232, 58, "rgba(2,5,10,0.34)", 5, 1);
      return;
    }

    if (key === "citadel") {
      drawCitadelBattleStage(accent, alt);
      for (let i = 0; i < 8; i += 1) {
        const x = -20 + i * 94;
        drawRect(x, 74, 54, 132, "#071018");
        drawRect(x + 8, 48, 38, 158, "#d6d4c8");
        drawRect(x + 14, 58, 26, 7, "#d6b85f");
        drawRect(x + 24, 30, 8, 22, "#fff6d7");
      }
      for (let i = 0; i < 14; i += 1) {
        const x = (i * 47) % W;
        drawRect(x, 236 + ((i * 17) % 120), 22, 3, i % 2 ? "#d6b85f" : "#e9e4ff");
      }
    }
  }

  function drawBattlePerspectiveFloor(key, accent, alt) {
    const floor = {
      town: ["rgba(49,86,61,0.4)", "rgba(216,240,163,0.22)", "rgba(243,211,91,0.3)"],
      ogre: ["rgba(43,37,34,0.46)", "rgba(214,194,124,0.2)", "rgba(222,122,59,0.28)"],
      alien: ["rgba(7,16,24,0.54)", "rgba(78,213,207,0.32)", "rgba(148,86,209,0.28)"],
      goblin: ["rgba(23,21,27,0.55)", "rgba(217,209,166,0.2)", "rgba(140,224,111,0.24)"],
      brainrot: ["rgba(7,16,24,0.56)", "rgba(96,211,148,0.15)", "rgba(255,114,225,0.12)"],
      citadel: ["rgba(32,38,51,0.42)", "rgba(255,246,215,0.22)", "rgba(214,184,95,0.28)"],
    }[key] || ["rgba(7,16,24,0.44)", "rgba(255,255,255,0.18)", "rgba(96,211,148,0.22)"];
    drawRect(0, 206, W, 4, floor[0]);
    drawRect(0, 402, W, 6, "rgba(2,5,10,0.58)");
    for (let i = 0; i < 8; i += 1) {
      const y = 222 + i * 23;
      const inset = i * 18;
      drawRect(inset, y, W - inset * 2, 2, i % 2 ? floor[1] : "rgba(2,5,10,0.18)");
      if (i % 2 === 0) drawRect(inset + 24, y + 7, W - inset * 2 - 48, 1, floor[2]);
    }
    for (let i = 0; i < 9; i += 1) {
      const x = -46 + i * 92;
      const skew = i < 4 ? -1 : 1;
      drawRect(x, 216, 4, 188, "rgba(2,5,10,0.18)");
      drawRect(x + skew * 18, 250, 3, 124, floor[1]);
    }
  }

  function drawBattleRegionalSkyline(key, accent, alt) {
    const ogre = key === "ogre";
    for (let i = 0; i < 6; i += 1) {
      const x = -32 + i * 126;
      const base = 184 + ((i * 7) % 18);
      if (ogre) {
        drawMiniHighlandCliff(x + 38, base, TOWN_THEMES.ogre, i % 3 === 0);
        drawRect(x + 75, base - 64, 14, 64, "#071018");
        drawRect(x + 79, base - 70, 6, 70, "#8a7b57");
        drawRect(x + 74, base - 76, 16, 9, alt);
      } else {
        drawMiniCanopyTree(x + 34, base, "#5f8e64", "#d8f0a3");
        drawRect(x + 70, base - 36, 48, 35, "#071018");
        drawRect(x + 76, base - 30, 36, 25, "#fff2ca");
        drawRect(x + 72, base - 43, 44, 15, "#d6534c");
        drawRect(x + 83, base - 36, 22, 3, accent);
      }
    }
  }

  function drawAlienBattleMegaStructure(accent, alt) {
    drawEllipse(488, 137, 190, 96, "rgba(7,16,24,0.5)");
    drawRect(404, 76, 166, 124, "rgba(7,16,24,0.36)");
    drawRect(244, 48, 154, 136, "rgba(7,16,24,0.78)");
    drawRect(260, 62, 122, 114, "#263f56");
    drawRect(276, 78, 90, 14, "#071018");
    drawRect(286, 82, 70, 6, accent);
    drawRect(316, 18, 10, 160, "#071018");
    drawRect(319, 22, 4, 152, alt);
    drawRect(244, 132, 154, 9, "#071018");
    drawRect(262, 135, 118, 3, "#9456d1");
    for (let i = 0; i < 5; i += 1) {
      const x = 188 + i * 68;
      drawRect(x, 158, 48, 8, "#071018");
      drawRect(x + 6, 160, 36, 4, i % 2 ? "rgba(78,213,207,0.78)" : "rgba(243,211,91,0.62)");
    }
  }

  function drawGoblinBattleStage(accent, alt) {
    drawEllipse(320, 118, 150, 88, "rgba(7,16,24,0.68)");
    drawRect(254, 112, 132, 64, "#211d24");
    drawRect(272, 124, 96, 12, "#071018");
    drawRect(286, 128, 68, 5, accent);
    for (let i = 0; i < 12; i += 1) {
      const x = 34 + i * 54;
      drawMiniMushroom(x, 197 + ((i * 13) % 16), i % 2 ? "#8ce06f" : "#ff6f69", "#d9d1a6");
    }
    drawRect(0, 202, W, 7, "#071018");
    drawRect(18, 198, W - 36, 3, "rgba(217,209,166,0.24)");
  }

  function drawBrainrotBattleStage(accent, alt) {
    drawRect(406, 42, 154, 138, "#071018");
    drawRect(414, 50, 138, 122, "#263046");
    drawRect(426, 62, 114, 98, "#302541");
    drawRect(438, 74, 90, 74, "#181320");
    for (let i = 0; i < 7; i += 1) {
      const w = 54 - i * 5;
      const x = 456 + i * 4;
      const y = 89 + i * 6;
      drawRect(x - 3, y + 2, w + 6, 5, "#071018");
      drawRect(x, y, w, 3, i % 2 ? accent : alt);
    }
    drawRect(426, 55, 42, 6, "#071018");
    drawRect(432, 57, 30, 2, "#f3d35b");
    drawRect(492, 55, 38, 6, "#071018");
    drawRect(498, 57, 26, 2, accent);
    drawRect(506, 151, 34, 4, "#071018");
    drawRect(510, 152, 26, 2, alt);
    for (let i = 0; i < 7; i += 1) {
      const x = 54 + i * 84;
      drawRect(x, 130, 44, 31, "#071018");
      drawRect(x + 5, 135, 34, 21, "#263646");
      drawRect(x + 10, 140, 24, 4, i % 2 ? accent : alt);
      drawRect(x + 12, 149, 18, 2, "rgba(255,246,215,0.18)");
    }
  }

  function drawCitadelBattleStage(accent, alt) {
    drawRect(216, 34, 208, 168, "rgba(7,16,24,0.68)");
    drawRect(236, 48, 168, 154, "#d6d4c8");
    drawRect(260, 70, 120, 14, "#071018");
    drawRect(276, 74, 88, 6, accent);
    drawRect(292, 105, 56, 97, "#202633");
    drawRect(313, 82, 14, 18, "#60d394");
    drawRect(244, 38, 152, 14, "#d6b85f");
    drawRect(286, 22, 68, 18, "#071018");
    drawRect(294, 25, 52, 12, alt);
    for (let i = 0; i < 4; i += 1) {
      const x = 178 + i * 96;
      drawMiniCitadelColumn(x, 206, TOWN_THEMES.citadel, i % 2);
    }
    drawRect(0, 206, W, 8, "#071018");
    drawRect(26, 204, W - 52, 3, "rgba(255,246,215,0.32)");
  }

  function iconHtml(speciesId) {
    const assetId = displaySpriteId(speciesId);
    return `<img class="sprite-icon" src="${ICON_DIR}/${assetId}.png?v=${GAME_ASSET_VERSION}" alt="" onerror="this.style.display='none'">`;
  }

  function spritePortraitHtml(speciesId) {
    const assetId = displaySpriteId(speciesId);
    return `<img class="sprite-portrait" src="${SPRITE_DIR}/${assetId}_front.png?v=${GAME_ASSET_VERSION}" alt="" onerror="this.style.display='none'">`;
  }

  function drawInsetFrame(x, y, w, h, outer = "#071018", inner = "#1d2a34", trim = "#f3d35b") {
    drawRect(x, y, w, h, outer);
    drawRect(x + 4, y + 4, w - 8, h - 8, inner);
    drawRect(x + 8, y + 8, w - 16, 3, trim);
    drawRect(x + 8, y + h - 11, w - 16, 3, shade(inner, -20));
  }

  function drawPremiumFrame(x, y, w, h, accent = "#60d394", alt = "#f3d35b", inner = "#17222d") {
    drawRect(x + 7, y + h - 3, w - 14, 8, "rgba(2,5,10,0.46)");
    drawRect(x, y, w, h, "#02050a");
    drawRect(x + 3, y + 3, w - 6, h - 6, "#3a4b5b");
    drawRect(x + 6, y + 6, w - 12, h - 12, inner);
    drawRect(x + 9, y + 9, w - 18, 1, "rgba(255,246,215,0.14)");
    drawRect(x + 9, y + h - 10, w - 18, 4, "rgba(2,5,10,0.26)");
    drawRect(x + 12, y + 12, Math.min(92, Math.max(18, w - 24)), 4, accent);
    drawRect(x + 18 + Math.min(92, Math.max(18, w - 24)), y + 12, Math.max(0, w - 134), 3, "#3a4b5b");
    drawRect(x + w - 92, y + 12, Math.min(62, Math.max(0, w - 34)), 4, alt);
    drawPixelCorners(x, y, w, h, accent, alt);
  }

  function drawPixelCorners(x, y, w, h, accent, alt) {
    drawRect(x + 5, y + 5, 13, 3, alt);
    drawRect(x + 5, y + 5, 3, 13, alt);
    drawRect(x + w - 18, y + 5, 13, 3, accent);
    drawRect(x + w - 8, y + 5, 3, 13, accent);
    drawRect(x + 5, y + h - 8, 13, 3, accent);
    drawRect(x + 5, y + h - 18, 3, 13, accent);
    drawRect(x + w - 18, y + h - 8, 13, 3, alt);
    drawRect(x + w - 8, y + h - 18, 3, 13, alt);
  }

  function drawHudPlate(x, y, w, h, title, body, accent, alt) {
    drawCompactFrame(x, y, w, h, accent, alt, "#101820");
    drawRect(x + 12, y + 10, Math.min(64, w - 24), 3, accent);
    drawRect(x + 18 + Math.min(64, w - 24), y + 10, Math.max(0, w - 94), 2, "#3a4b5b");
    drawPixelText(title.toUpperCase().slice(0, Math.max(8, Math.floor((w - 30) / 8))), x + 14, y + 25, 1, "#fff6d7", null);
    if (body) drawPixelText(body.toUpperCase().slice(0, Math.max(8, Math.floor((w - 30) / 8))), x + 14, y + 38, 1, alt, null);
  }

  function drawCompactFrame(x, y, w, h, accent = "#60d394", alt = "#f3d35b", inner = "#101820") {
    drawRect(x + 4, y + h - 2, w - 8, 6, "rgba(2,5,10,0.42)");
    drawRect(x, y, w, h, "#02050a");
    drawRect(x + 3, y + 3, w - 6, h - 6, "#3a4b5b");
    drawRect(x + 6, y + 6, w - 12, h - 12, inner);
    drawRect(x + 9, y + 8, w - 18, 2, "rgba(255,246,215,0.1)");
    drawRect(x + 9, y + h - 9, w - 18, 3, "rgba(2,5,10,0.3)");
    drawRect(x + 5, y + 5, 10, 3, accent);
    drawRect(x + 5, y + 5, 3, 10, accent);
    drawRect(x + w - 15, y + 5, 10, 3, alt);
    drawRect(x + w - 8, y + 5, 3, 10, alt);
    drawRect(x + 5, y + h - 8, 10, 3, alt);
    drawRect(x + w - 15, y + h - 8, 10, 3, accent);
  }

  function drawScreenTexture(color = "rgba(255,255,255,0.04)", step = 8) {
    ctx.save();
    ctx.fillStyle = color;
    for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  }

  function drawSparkleField(count, speed = 40) {
    for (let i = 0; i < count; i += 1) {
      const x = (i * 73 + Math.floor(state.anim / speed)) % W;
      const y = (i * 41 + Math.floor(i / 3) * 11) % H;
      const color = i % 4 === 0 ? "#60d394" : i % 5 === 0 ? "#ff72e1" : "#f3d35b";
      drawRect(x, y, i % 7 === 0 ? 5 : 3, i % 7 === 0 ? 2 : 3, color);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (state.mode === "title") drawTitle();
    else if (state.mode === "starter") drawStarter();
    else if (state.mode === "battle") drawBattle();
    else if (state.mode === "pvp") drawPvpBattle();
    else if (state.mode === "trial") drawTrialPreview();
    else drawOverworld();
    drawMomentOverlays();
  }

  function drawMomentOverlays() {
    const now = performance.now();
    const battleIntroActive = state.battleIntro && now < state.battleIntro.until;
    const captureActive = state.captureFx && now < state.captureFx.until;
    const resultActive = state.resultBanner && now < state.resultBanner.until;
    const evolutionActive = state.evolutionFx && now < state.evolutionFx.until;
    const dialogueActive = state.dialogueFx && now < state.dialogueFx.until && state.mode === "overworld";
    const priorityOverlayActive = battleIntroActive || captureActive || resultActive || evolutionActive || dialogueActive;
    if (battleIntroActive) {
      drawBattleIntroOverlay(state.battleIntro, now);
    } else if (state.battleIntro && now >= state.battleIntro.until) {
      state.battleIntro = null;
    }
    if (captureActive) {
      drawCaptureOverlay(state.captureFx, now);
    } else if (state.captureFx && now >= state.captureFx.until) {
      state.captureFx = null;
    }
    if (resultActive) {
      drawResultBanner(state.resultBanner, now);
    } else if (state.resultBanner && now >= state.resultBanner.until) {
      state.resultBanner = null;
    }
    if (evolutionActive) {
      drawEvolutionOverlay(state.evolutionFx, now);
    } else if (state.evolutionFx && now >= state.evolutionFx.until) {
      state.evolutionFx = null;
    }
    if (state.areaBanner && now < state.areaBanner.until && state.mode === "overworld" && !priorityOverlayActive) {
      drawAreaBanner(state.areaBanner, now);
    } else if (state.areaBanner && now >= state.areaBanner.until) {
      state.areaBanner = null;
    }
    if (dialogueActive && !battleIntroActive && !captureActive && !resultActive && !evolutionActive) {
      drawDialogueOverlay(state.dialogueFx, now);
    } else if (state.dialogueFx && now >= state.dialogueFx.until) {
      state.dialogueFx = null;
    }
  }

  function trialAceSpecies(gym) {
    if (gym.aceId && SPECIES_BY_ID[gym.aceId]) return SPECIES_BY_ID[gym.aceId];
    return pickSpeciesForTrainer(gym.theme, gym.clan, gym.level, 0);
  }

  function drawTypeBadge(type, x, y) {
    drawRect(x, y, 74, 22, "#071018");
    drawRect(x + 3, y + 3, 68, 16, TYPE_COLORS[type] || "#f3d35b");
    drawPixelText(type.toUpperCase().slice(0, 8), x + 8, y + 8, 1, "#101820", null);
  }

  function drawAreaBanner(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const inOut = Math.min(1, Math.min(t / 0.18, (1 - t) / 0.22));
    const accent = biomeAccent(fx.biome);
    const alt = biomeAccentAlt(fx.biome);
    const w = 336;
    const h = 46;
    const x = Math.round((W - w) / 2);
    const y = Math.round(112 - (1 - inOut) * 14);
    drawRect(x - 8, y + h - 7, w + 16, 8, "rgba(2,5,10,0.34)");
    drawInsetFrame(x, y, w, h, "#02050a", "#17222d", accent);
    drawRect(x + 14, y + 14, 72, 4, alt);
    drawRect(x + 90, y + 14, w - 118, 4, "#3a4b5b");
    drawPixelText(fx.title.toUpperCase().slice(0, 25), x + 22, y + 25, 1, "#fff6d7", null);
    drawPixelText(fx.subtitle.toUpperCase().slice(0, 28), x + 22, y + 37, 1, alt, null);
    drawRect(x + w - 54, y + 15, 30, 14, "#071018");
    drawRect(x + w - 49, y + 20, 20, 5, accent);
    drawRect(x + w - 36, y + 10, 5, 24, alt);
    for (let i = 0; i < 5; i += 1) {
      const px = x + w - 112 + i * 11 + Math.floor(Math.sin(state.anim / 100 + i) * 2);
      drawRect(px, y + 34 + (i % 2) * 3, 7, 2, i % 2 ? accent : alt);
    }
  }

  function drawDialogueOverlay(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const inOut = Math.min(1, Math.min(t / 0.12, (1 - t) / 0.18));
    const x = 28;
    const y = Math.round(316 + (1 - inOut) * 18);
    const w = 584;
    const h = 144;
    const accent = fx.accent || "#60d394";
    const alt = fx.alt || "#f3d35b";
    drawPremiumFrame(x, y, w, h, accent, alt, "#14212c");
    drawRect(x + 18, y + 19, 104, 108, "#02050a");
    drawRect(x + 23, y + 24, 94, 98, "#3a4b5b");
    drawRect(x + 28, y + 29, 84, 88, "#101820");
    drawRect(x + 33, y + 34, 72, 5, alt);
    drawRect(x + 33, y + 107, 72, 5, "rgba(2,5,10,0.56)");
    drawRect(x + 36, y + 112, 66, 3, accent);
    drawTrainerPortrait(fx.sprite || "trainer", x + 70, y + 116, 86);
    drawRect(x + 132, y + 20, 250, 28, "#02050a");
    drawRect(x + 137, y + 25, 240, 18, "#0d151d");
    drawRect(x + 146, y + 30, 56, 3, accent);
    drawRect(x + 210, y + 30, 120, 3, "#3a4b5b");
    drawPixelText(fx.speaker.toUpperCase().slice(0, 26), x + 214, y + 33, 1, "#fff6d7", null);
    drawRect(x + w - 120, y + 20, 84, 28, "#02050a");
    drawRect(x + w - 115, y + 25, 74, 18, alt);
    drawRect(x + w - 108, y + 29, 60, 3, "rgba(255,255,255,0.36)");
    drawPixelText(String(fx.tag || "talk").toUpperCase().slice(0, 8), x + w - 103, y + 33, 1, "#071018", null);
    drawRect(x + 132, y + 57, w - 166, 2, "#3a4b5b");
    drawRect(x + 132, y + 63, w - 166, 60, "#0d151d");
    drawRect(x + 138, y + 69, w - 178, 2, alt);
    drawRect(x + 138, y + 116, 82, 3, accent);
    const lines = wrapDialogueText(fx.body, 50, 3);
    lines.forEach((line, index) => {
      drawPixelText(line.toUpperCase(), x + 145, y + 84 + index * 14, 1, index === 0 ? "#fff6d7" : "#cde8f5", null);
    });
    drawRect(x + w - 62, y + h - 31, 34, 17, "#02050a");
    drawRect(x + w - 56, y + h - 25, 13, 6, accent);
    drawRect(x + w - 40, y + h - 22, 6, 4, alt);
  }

  function wrapDialogueText(text, maxChars, maxLines) {
    const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const trimmed = lines.slice(0, maxLines);
      trimmed[maxLines - 1] = `${trimmed[maxLines - 1].slice(0, Math.max(0, maxChars - 3))}...`;
      return trimmed;
    }
    return lines;
  }

  function drawTrialPreview() {
    const gym = activeTrialGym();
    if (!gym) return drawOverworld();
    const biome = gym.clan || biomeForCoord(gym.x, gym.y);
    const accent = TYPE_COLORS[gym.theme[0]] || biomeAccent(biome);
    const alt = TYPE_COLORS[gym.theme[1] || gym.theme[0]] || biomeAccentAlt(biome);
    const ace = trialAceSpecies(gym);
    const trialLevel = state.trial?.rematch ? gym.level + 12 : gym.level;
    drawBattleBackdrop(biome);
    drawRect(0, 0, W, H, "rgba(2,5,10,0.22)");
    drawScreenTexture("rgba(255,255,255,0.025)", 7);
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 83 + Math.floor(state.anim / 11)) % W;
      const y = 18 + ((i * 47) % 374);
      const wide = i % 3 !== 0;
      drawRect(x, y, wide ? 16 : 5, wide ? 4 : 15, i % 2 ? accent : alt);
      if (i % 5 === 0) drawRect(x + 3, y + 7, 10, 2, "#071018");
    }

    drawRect(30, 25, 580, 408, "rgba(2,5,10,0.36)");
    drawInsetFrame(38, 30, 564, 394, "#02050a", "#17222d", accent);
    drawRect(54, 48, 532, 4, alt);
    drawRect(54, 59, 108, 4, accent);
    drawRect(168, 59, 322, 4, "#3a4b5b");
    drawRect(500, 54, 70, 20, "#071018");
    drawRect(506, 59, 58, 10, alt);
    drawPixelText("TRIAL", 515, 61, 1, "#071018", null);

    drawPixelText("TRIAL DEN", 70, 82, 2, accent, "#071018");
    drawPixelText(gym.name.toUpperCase().slice(0, 24), 70, 116, 2, "#fff6d7", "#071018");
    drawPixelText(gym.badge.toUpperCase().slice(0, 34), 74, 150, 1, alt, null);

    drawInsetFrame(66, 174, 206, 156, "#02050a", "#1d2a34", accent);
    drawRect(82, 190, 174, 5, alt);
    drawRect(84, 202, 52, 14, "#071018");
    drawRect(88, 205, 44, 8, accent);
    drawPixelText("BOSS", 95, 206, 1, "#071018", null);
    drawTrainerPortrait(gym.clan || "trainer", 174, 318, 126);
    drawPixelText((gym.clan || "MIXED").toUpperCase().slice(0, 10), 116, 340, 1, "#cde8f5", null);

    drawRect(283, 220, 78, 52, "#02050a");
    drawRect(290, 226, 64, 40, "#f2ead0");
    drawRect(296, 232, 52, 28, "#111820");
    drawRect(300, 236, 44, 4, accent);
    drawPixelText("VS", 309, 244, 2, "#f3d35b", "#071018");
    for (let i = 0; i < 5; i += 1) {
      drawRect(296 + i * 11, 266 + (i % 2) * 4, 7, 3, i % 2 ? alt : accent);
    }

    drawInsetFrame(372, 158, 176, 194, "#02050a", "#1b2934", alt);
    drawRect(388, 174, 144, 5, accent);
    drawRect(392, 186, 86, 14, "#071018");
    drawRect(396, 189, 78, 8, alt);
    drawPixelText("ACE PREVIEW", 401, 190, 1, "#071018", null);
    drawEllipse(460, 324, 138, 24, "rgba(0,0,0,0.34)");
    drawCreatureSprite(ace, 460, 294, 2.15, false);
    drawRect(392, 322, 136, 24, "#071018");
    drawRect(396, 326, 128, 14, "#263646");
    drawPixelText(ace.name.toUpperCase().slice(0, 16), 405, 329, 1, "#fff6d7", null);
    drawRect(488, 203, 42, 17, "#071018");
    drawRect(492, 207, 34, 9, "#263646");
    drawPixelText(`LV${trialLevel}`, 497, 208, 1, "#f3d35b", null);

    gym.theme.slice(0, 4).forEach((type, index) => drawTypeBadge(type, 70 + index * 84, 362));
    drawRect(70, 392, 196, 19, "#071018");
    drawRect(75, 397, 186, 9, "#263646");
    drawPixelText(`CREW LV ${Math.max(5, gym.level - 2)}+`, 86, 398, 1, "#fff6d7", null);
    drawRect(334, 392, 200, 19, "#071018");
    drawRect(339, 397, 190, 9, "#263646");
    drawPixelText("ENTER START   X LEAVE", 354, 398, 1, "#cde8f5", null);
  }

  function drawTrainerPortrait(sprite, cx, baseY, maxH = 136) {
    const img = getTrainerAssetImage(sprite, "portrait");
    if (!img) return false;
    const scale = maxH / img.naturalHeight;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    drawEllipse(cx, baseY - 4, Math.max(46, w * 0.62), 12, "rgba(0,0,0,0.35)");
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(img, Math.round(cx - w / 2), Math.round(baseY - h), w, h);
    ctx.restore();
    return true;
  }

  function drawBattleIntroOverlay(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const reveal = Math.sin(t * Math.PI);
    const biome = currentBiome();
    const accent = fx.kind === "villain" ? "#ff72e1" : fx.kind === "apex" ? "#d6b85f" : biomeAccent(biome);
    const alt = fx.kind === "villain" ? "#60d394" : biomeAccentAlt(biome);
    drawRect(0, 0, W, H, `rgba(2,5,10,${0.18 + reveal * 0.42})`);
    for (let i = 0; i < 7; i += 1) {
      const y = 34 + i * 58;
      const offset = Math.floor((state.anim / 10 + i * 31) % 72);
      drawRect(-offset, y, W + 110, 9 + reveal * 4, "rgba(7,16,24,0.78)");
      drawRect(24 - offset, y + 10, W + 70, 2, i % 2 ? accent : alt);
    }
    if (t > 0.18 && t < 0.82) {
      const title = (fx.kind === "wild" ? "WILD ENCOUNTER" : fx.kind === "trial" ? "TRIAL DEN CLASH" : fx.kind === "apex" ? "APEX GAUNTLET" : fx.kind === "villain" ? "OVERLOAD AMBUSH" : "TRAINER BATTLE").toUpperCase();
      drawInsetFrame(54, 126, 532, 204, "#02050a", "#17222d", accent);
      drawRect(72, 148, 124, 5, alt);
      drawRect(204, 148, 322, 5, "#3a4b5b");
      drawPixelText(title, 86, 174, 2, accent, "#071018");
      drawPixelText(fx.name.toUpperCase().slice(0, 32), 90, 214, 1, "#fff6d7", null);
      drawRect(276, 234, 72, 44, "#071018");
      drawRect(282, 240, 60, 32, "#f2ead0");
      drawRect(288, 246, 48, 20, "#1f2d37");
      drawPixelText("VS", 300, 252, 2, "#f3d35b", "#071018");
      drawRect(82, 242, 144, 56, "#071018");
      drawRect(88, 248, 132, 44, "#213142");
      drawRect(96, 256, 54, 4, "#60d394");
      drawPixelText("CREW READY", 98, 274, 1, "#fff6d7", null);
      if (fx.trainerSprite) {
        drawRect(420, 156, 116, 146, "#071018");
        drawRect(426, 162, 104, 134, "#263646");
        drawRect(434, 170, 88, 5, accent);
        drawTrainerPortrait(fx.trainerSprite, 478, 292, 132);
        drawPixelText(trainerAssetKey(fx.trainerSprite).toUpperCase().slice(0, 12), 434, 304, 1, "#cde8f5", null);
      } else {
        const enemy = state.battle ? SPECIES_BY_ID[activeEnemy().id] : null;
        drawRect(408, 172, 142, 126, "#071018");
        drawRect(416, 180, 126, 110, "#263646");
        drawRect(424, 188, 110, 5, accent);
        if (enemy) drawCreatureSprite(enemy, 480, 278, 1.65, false);
        drawPixelText("WILD SIGNAL", 430, 304, 1, "#cde8f5", null);
      }
    }
  }

  function drawCaptureOverlay(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const biome = fx.biome || currentBiome();
    const accent = fx.itemName === "Rizz Orb" ? "#ff72e1" : fx.itemName === "Ultra Orb" ? "#f3d35b" : biomeAccent(biome);
    const alt = fx.itemName === "Great Orb" ? "#4ed5cf" : biomeAccentAlt(biome);
    const start = { x: 184, y: 292 };
    const target = { x: 484, y: 124 };
    const travel = clamp(t / 0.42, 0, 1);
    const wobble = Math.sin(t * Math.PI * 8) * (1 - clamp((t - 0.5) / 0.5, 0, 1));
    const x = start.x + (target.x - start.x) * travel;
    const y = start.y + (target.y - start.y) * travel - Math.sin(travel * Math.PI) * 72 + wobble * 7;
    for (let i = 0; i < 8; i += 1) {
      const p = clamp(travel - i * 0.055, 0, 1);
      const tx = start.x + (target.x - start.x) * p;
      const ty = start.y + (target.y - start.y) * p - Math.sin(p * Math.PI) * 72;
      drawRect(tx - 6, ty - 3, 12, 6, i % 2 ? accent : alt);
      if (i % 3 === 0) drawRect(tx + 5, ty + 4, 10, 2, "#071018");
    }
    const lock = clamp((t - 0.38) / 0.32, 0, 1);
    const settle = clamp((t - 0.7) / 0.3, 0, 1);
    const orbX = lock ? target.x + Math.sin(t * Math.PI * 12) * (fx.caught ? 3 : 8) * (1 - settle) : x;
    const orbY = lock ? target.y + 40 + Math.sin(t * Math.PI * 10) * 5 * (1 - settle) : y;
    drawPixelOrb(orbX, orbY, 28 + lock * 4, accent, alt, fx.caught);
    if (lock) {
      for (let i = 0; i < 12; i += 1) {
        const angle = i * 0.52 + t * 4;
        const r = 38 + Math.sin(t * Math.PI * 5 + i) * 5;
        const px = target.x + Math.cos(angle) * r;
        const py = target.y + 24 + Math.sin(angle) * r * 0.48;
        drawRect(px - 3, py - 3, 6, 6, i % 2 ? accent : alt);
      }
    }
    if (t > 0.68) {
      const label = fx.caught ? "LOCKED" : "BREAKOUT";
      const labelColor = fx.caught ? "#60d394" : "#ff6f69";
      drawInsetFrame(184, 54, 272, 54, "#02050a", "#17222d", labelColor);
      drawPixelText(label, 212, 75, 2, labelColor, "#071018");
      drawPixelText(fx.enemyName.toUpperCase().slice(0, 22), 330, 82, 1, "#fff6d7", null);
    }
  }

  function drawPixelOrb(cx, cy, size, accent, alt, caught) {
    const s = Math.max(20, size);
    drawRect(cx - s / 2 - 3, cy - s / 2 - 3, s + 6, s + 6, "#071018");
    drawRect(cx - s / 2, cy - s / 2, s, s, "#f2ead0");
    drawRect(cx - s / 2, cy - s / 2, s, Math.floor(s * 0.44), accent);
    drawRect(cx - s / 2, cy - 2, s, 4, "#071018");
    drawRect(cx - 6, cy - 6, 12, 12, "#071018");
    drawRect(cx - 3, cy - 3, 6, 6, caught ? "#60d394" : alt);
    drawRect(cx - s / 2 + 5, cy - s / 2 + 4, Math.floor(s * 0.32), 4, "#fff6d7");
    if (!caught) {
      drawRect(cx - s / 2 - 9, cy - 2, 7, 4, "#ff6f69");
      drawRect(cx + s / 2 + 2, cy - 2, 7, 4, "#ff6f69");
    }
  }

  function drawResultBanner(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const y = 42 + Math.sin(t * Math.PI) * 8;
    const good = fx.title === "VICTORY" || fx.title === "CAUGHT" || fx.title === "CROWN WARDEN";
    const accent = good ? biomeAccent(fx.biome || currentBiome()) : "#ff6f69";
    const alt = good ? "#f3d35b" : "#d9d1a6";
    drawRect(82, y + 62, 476, 12, "rgba(2,5,10,0.42)");
    drawInsetFrame(96, y, 448, 102, "#02050a", good ? "#172d26" : "#3b2228", accent);
    drawRect(118, y + 18, 116, 5, alt);
    drawRect(242, y + 18, 252, 5, "#3a4b5b");
    drawPixelText(fx.title, 124, y + 36, 2, good ? "#f3d35b" : "#ff6f69", "#071018");
    drawPixelText(fx.text.toUpperCase().slice(0, 34), 126, y + 70, 1, "#fff6d7", null);
    if (fx.reward) {
      drawRect(350, y + 56, 158, 28, "#071018");
      drawRect(356, y + 62, 146, 16, "#263646");
      drawPixelText(fx.reward.toUpperCase().slice(0, 22), 364, y + 67, 1, alt, null);
    }
    for (let i = 0; i < 9; i += 1) {
      const px = 114 + i * 47 + Math.sin(state.anim / 110 + i) * 3;
      drawRect(px, y + 88 + (i % 2) * 4, 12, 3, i % 2 ? accent : alt);
    }
  }

  function drawEvolutionOverlay(fx, now) {
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    drawRect(0, 0, W, H, "rgba(3, 6, 11, 0.88)");
    const oldSpecies = SPECIES_BY_ID[fx.oldId];
    const newSpecies = SPECIES_BY_ID[fx.newId];
    const accent = TYPE_COLORS[newSpecies.elements[0]] || "#60d394";
    const alt = TYPE_COLORS[newSpecies.elements[1] || newSpecies.elements[0]] || "#f3d35b";
    for (let i = 0; i < 44; i += 1) {
      const x = (i * 59 + Math.floor(now / 12)) % W;
      const y = (i * 43 + Math.floor(i / 2) * 19) % H;
      drawRect(x, y, i % 2 ? 13 : 4, i % 2 ? 4 : 13, i % 3 ? accent : "#f3d35b");
    }
    drawInsetFrame(64, 48, 512, 352, "#02050a", "#111a22", accent);
    drawRect(92, 82, 128, 5, "#f3d35b");
    drawRect(228, 82, 306, 5, "#3a4b5b");
    drawPixelText("EVOLUTION", 202, 104, 2, "#f3d35b", "#071018");
    drawRect(114, 156, 150, 152, "#071018");
    drawRect(122, 164, 134, 136, "#1f2d37");
    drawRect(376, 156, 150, 152, "#071018");
    drawRect(384, 164, 134, 136, "#1f2d37");
    drawPixelText(fx.oldName.toUpperCase().slice(0, 14), 124, 318, 1, "#cde8f5", null);
    drawPixelText(fx.newName.toUpperCase().slice(0, 14), 386, 318, 1, "#fff6d7", null);
    if (t < 0.46) {
      drawCreatureSprite(oldSpecies, 190, 268, 2.15 + Math.sin(t * 12) * 0.18, false);
      drawPixelText(`${fx.oldName.toUpperCase()} IS CHANGING...`, 152, 358, 1, "#fff6d7", null);
    } else {
      const pop = 2.65 + Math.sin(t * Math.PI * 5) * 0.12;
      drawCreatureSprite(oldSpecies, 190, 268, 1.88, false);
      drawCreatureSprite(newSpecies, 452, 270, pop, false);
      drawPixelText(`${fx.oldName.toUpperCase()} EVOLVED INTO`, 148, 356, 1, "#fff6d7", null);
      drawPixelText(fx.newName.toUpperCase(), 214, 376, 2, accent, "#071018");
    }
    for (let i = 0; i < 10; i += 1) {
      const p = clamp((t - 0.2) / 0.55 - i * 0.03, 0, 1);
      const x = 260 + (118 * p) + i * 2;
      const y = 230 + Math.sin((p + i) * 4) * 34;
      drawRect(x - 8, y - 4, 16, 8, i % 2 ? accent : alt);
      drawRect(x + 3, y + 6, 10, 3, "#fff6d7");
    }
  }

  function drawTitle() {
    state.titleTick += 0.02;
    const cover = getTitleCoverImage();
    if (cover) {
      drawTitleCover(cover);
      drawTitleLaunchBottomFix();
      return;
    }
    const gba = makeGbaPainter();
    drawRect(0, 0, W, H, "#03060b");
    gba.rect(-3, -3, 246, 166, "#02050a");
    gba.rect(0, 0, 240, 160, "#02050a");
    gba.rect(2, 2, 236, 156, "#08101a");
    gba.rect(5, 5, 166, 55, "#071321");
    gba.rect(5, 60, 166, 94, "#102331");
    gba.rect(172, 5, 63, 149, "#050b12");
    gba.rect(175, 8, 57, 143, "#10202a");
    gba.rect(5, 58, 166, 3, "#02050a");
    gba.rect(172, 5, 3, 149, "#02050a");
    gba.rect(8, 8, 160, 2, "#60d394");
    gba.rect(178, 11, 51, 3, "#f3d35b");

    for (let i = 0; i < 120; i += 1) {
      const x = 8 + ((i * 37 + Math.floor(state.anim / 92)) % 156);
      const y = 10 + ((i * 29 + Math.floor(i / 3) * 7) % 40);
      const c = i % 9 === 0 ? "#4ed5cf" : i % 5 === 0 ? "#60d394" : i % 4 === 0 ? "#f3d35b" : "#fff6d7";
      gba.rect(x, y, i % 13 === 0 ? 2 : 1, i % 13 === 0 ? 2 : 1, c);
    }
    for (let i = 0; i < 5; i += 1) {
      const x = 7 + ((state.anim / 44 + i * 39) % 178) - 18;
      const y = 17 + i * 8;
      gba.rect(x, y, 18, 1, i % 2 ? "#4ed5cf" : "#f3d35b");
      gba.rect(x + 13, y + 2, 5, 1, "#fff6d7");
    }

    gba.frame(9, 11, 156, 46, "#02050a", "#102434", "#60d394");
    gba.rect(15, 16, 110, 4, "#f3d35b");
    gba.rect(15, 21, 84, 2, "#fff6d7");
    gba.rect(15, 47, 122, 3, "#3a4b5b");
    gba.text("OGREVERSE", 16, 25, 2, "#f3d35b", "#1d1408");
    gba.text("BRAINROT PRISM", 30, 47, 1, "#fff6d7", "#071018");
    drawRageCageIcon(gba, 102, 14);

    drawTitleRegionMap(gba, 10, 65, 156, 66);
    drawTitleMemeletCard(gba, 12, 108);

    gba.frame(179, 17, 50, 18, "#02050a", "#1c624e", "#60d394");
    gba.text("NEW RUN", 184, 24, 1, "#fff6d7", "#071018");
    gba.frame(179, 40, 50, 18, "#02050a", state.hasSave ? "#1c624e" : "#202a31", "#60d394");
    gba.text("RESUME", 186, 45, 1, state.hasSave ? "#fff6d7" : "#8aa08d", "#071018");
    gba.rect(180, 63, 48, 2, "#3a4b5b");
    gba.text("FIRST", 184, 68, 1, "#f3d35b", "#071018");
    gba.text("BONDS", 184, 78, 1, "#f3d35b", "#071018");
    drawTitleStarterCard(gba, SPECIES_BY_ID.OGR001, "GRUNK", 179, 88);
    drawTitleStarterCard(gba, SPECIES_BY_ID.ALN001, "ZORB", 179, 121);

    gba.frame(10, 137, 156, 16, "#02050a", "#2b3b48", "#f3d35b");
    gba.text("PRESS ENTER", 17, 143, 1, "#fff6d7", "#071018");
    gba.text("RAGE CAGE", 99, 143, 1, "#60d394", "#071018");
    gba.rect(176, 146, 15, 2, "#60d394");
    gba.rect(195, 146, 11, 2, "#f3d35b");
    gba.rect(210, 146, 17, 2, "#4ed5cf");
    drawTitleScanlines(gba);
  }

  function drawTitleLaunchBottomFix() {
    if (H <= 260) return;
    for (let y = 238; y < H - 8; y += 18) {
      for (let x = ((y / 2) % 38) - 20; x < W; x += 48) {
        drawRect(x, y, 18, 2, "#69b8d8");
        drawRect(x + 24, y + 6, 9, 2, "#bfe8f2");
      }
    }
    drawRect(18, 382, 414, 72, "#02050a");
    drawRect(24, 388, 402, 60, "#17222d");
    drawRect(34, 398, 166, 5, "#f3d35b");
    drawRect(210, 398, 190, 5, "#3a4b5b");
    drawPixelText("PRESS ENTER", 42, 418, 2, "#fff6d7", "#071018");
    drawPixelText("BEGIN THE OVERLOAD ROAD", 218, 421, 1, "#60d394", "#071018");
    drawRect(356, 416, 34, 18, "#071018");
    drawRect(365, 421, 15, 8, "#60d394");
    drawRect(384, 424, 6, 5, "#f3d35b");
    drawRect(442, 382, 174, 72, "#02050a");
    drawRect(448, 388, 162, 60, "#10202a");
    drawRect(458, 398, 70, 4, "#60d394");
    drawRect(536, 398, 52, 4, "#f3d35b");
    drawPixelText("WORLD MAP", 462, 418, 2, "#f3d35b", "#071018");
    drawPixelText("380 CREATURES", 464, 442, 1, "#fff6d7", null);
  }

  function drawTitleCover(img) {
    drawRect(0, 0, W, H, "#02050a");
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const targetRatio = W / H;
    const srcRatio = img.naturalWidth / img.naturalHeight;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    let sx = 0;
    let sy = 0;
    if (srcRatio > targetRatio) {
      sw = Math.round(sh * targetRatio);
      sx = Math.round((img.naturalWidth - sw) * 0.48);
    } else {
      sh = Math.round(sw / targetRatio);
      sy = Math.round((img.naturalHeight - sh) * 0.48);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    ctx.restore();

    drawRect(0, 0, W, 88, "rgba(2,5,10,0.64)");
    drawRect(0, H - 104, W, 104, "rgba(2,5,10,0.62)");
    drawRect(448, 0, 192, H, "rgba(2,5,10,0.54)");
    drawRect(0, 0, W, 7, "#02050a");
    drawRect(0, H - 7, W, 7, "#02050a");
    drawRect(0, 0, 7, H, "#02050a");
    drawRect(W - 7, 0, 7, H, "#02050a");
    drawRect(14, 14, 92, 4, "#60d394");
    drawRect(W - 156, 14, 74, 4, "#f3d35b");
    drawRect(W - 76, 14, 48, 4, "#ff6f69");
    drawRect(14, H - 18, 120, 4, "#4ed5cf");
    drawRect(W - 156, H - 18, 46, 4, "#60d394");
    drawRect(W - 104, H - 18, 46, 4, "#f3d35b");
    drawRect(W - 52, H - 18, 34, 4, "#4ed5cf");

    drawTitleCoverLowerWorld();
    drawTitleCoverLogo(22, 28);
    drawTitleCoverMenu();
    drawTitleCoverStarterStrip();
    drawTitleCoverMapKey();
    drawScreenTexture("rgba(255,255,255,0.022)", 6);
  }

  function drawTitleCoverLowerWorld() {
    drawRect(0, 224, W, H - 224, "#0a385d");
    for (let y = 232; y < H - 12; y += 16) {
      for (let x = (y % 32) - 18; x < W; x += 44) {
        drawRect(x, y, 22, 2, "#69b8d8");
        drawRect(x + 26, y + 5, 10, 2, "#bfe8f2");
      }
    }
    const islands = [
      [34, 256, 150, 92, "#476b36", "#7ec45f", "MEMELET"],
      [204, 246, 210, 96, "#65523d", "#a87944", "OGRE ROAD"],
      [38, 362, 176, 76, "#392f32", "#8ce06f", "WARRENS"],
      [238, 362, 168, 78, "#463662", "#ff72e1", "RIFT DOCK"],
    ];
    islands.forEach(([x, y, w, h, base, trim, label], index) => {
      drawRect(x + 8, y + h - 4, w - 16, 10, "rgba(2,5,10,0.38)");
      drawRect(x + 8, y + 8, w - 16, h - 16, "#071018");
      drawRect(x + 12, y + 12, w - 24, h - 24, base);
      drawRect(x + 18, y + 18, w - 36, 5, trim);
      for (let i = 0; i < 26; i += 1) {
        const px = x + 18 + ((i * 29 + index * 13) % Math.max(24, w - 42));
        const py = y + 28 + ((i * 17 + index * 7) % Math.max(18, h - 48));
        drawRect(px, py, i % 3 ? 5 : 9, i % 2 ? 3 : 5, i % 4 ? trim : "#f3d35b");
      }
      drawRect(x + 18, y + h - 28, 92, 17, "#02050a");
      drawRect(x + 21, y + h - 25, 86, 11, "#17222d");
      drawPixelText(label, x + 25, y + h - 21, 1, "#fff6d7", null);
    });
    for (let i = 0; i < 18; i += 1) {
      const x = 150 + i * 13;
      const y = 318 + Math.sin(i * 0.7) * 22;
      drawRect(x, y, 7, 3, i % 2 ? "#fff6d7" : "#f3d35b");
    }
    drawRect(432, 362, 178, 74, "#02050a");
    drawRect(438, 368, 166, 62, "#10202a");
    drawRect(448, 378, 70, 4, "#60d394");
    drawRect(526, 378, 56, 4, "#f3d35b");
    drawPixelText("WORLD MAP", 452, 398, 2, "#f3d35b", "#071018");
    drawPixelText("380 CREATURES", 454, 422, 1, "#fff6d7", null);
  }

  function drawTitleCoverLogo(x, y) {
    drawRect(x + 8, y + 92, 404, 12, "rgba(2,5,10,0.34)");
    drawRect(x, y, 410, 102, "#02050a");
    drawRect(x + 5, y + 5, 400, 92, "#102434");
    drawRect(x + 11, y + 11, 388, 4, "#60d394");
    drawRect(x + 12, y + 20, 184, 6, "#f3d35b");
    drawRect(x + 12, y + 30, 126, 3, "#fff6d7");
    drawPixelText("OGREVERSE", x + 18, y + 42, 4, "#f3d35b", "#1d1408");
    drawPixelText("BRAINROT PRISM", x + 40, y + 80, 2, "#fff6d7", "#071018");
    drawTitleCoverMascot(x + 276, y + 18);
  }

  function drawTitleCoverMascot(x, y) {
    drawRect(x + 8, y + 70, 88, 8, "rgba(2,5,10,0.38)");
    drawRect(x + 15, y + 64, 72, 7, "#02050a");
    drawRect(x + 22, y + 59, 58, 7, "#de7a3b");
    drawRect(x + 30, y + 54, 42, 5, "#f3d35b");
    drawRect(x + 19, y + 69, 64, 3, "#60d394");
    drawCreatureSprite(SPECIES_BY_ID.OGR003, x + 51, y + 64, 1.02, false, "title");
  }

  function drawTitleCoverCrest(x, y, s = 1) {
    const r = (dx, dy, w, h, color) => drawRect(x + dx * s, y + dy * s, w * s, h * s, color);
    r(16, 66, 58, 6, "rgba(2,5,10,0.42)");
    r(30, -7, 10, 8, "#60d394");
    r(34, -12, 4, 5, "#fff6d7");
    r(1, 22, 14, 10, "#071018");
    r(73, 22, 14, 10, "#071018");
    r(4, 25, 14, 7, "#f3d35b");
    r(70, 25, 14, 7, "#f3d35b");
    r(8, 34, 10, 5, "#4ed5cf");
    r(70, 34, 10, 5, "#4ed5cf");
    r(30, 0, 28, 6, "#071018");
    r(20, 6, 48, 8, "#071018");
    r(12, 14, 64, 10, "#071018");
    r(7, 24, 74, 24, "#071018");
    r(12, 48, 64, 10, "#071018");
    r(22, 58, 44, 7, "#071018");
    r(31, 5, 26, 5, "#fff6d7");
    r(21, 11, 46, 12, "#f3d35b");
    r(14, 23, 60, 12, "#e3ad3c");
    r(10, 35, 68, 6, "#071018");
    r(14, 41, 60, 12, "#60d394");
    r(22, 53, 44, 8, "#4ed5cf");
    r(33, 28, 24, 22, "#071018");
    r(37, 32, 16, 14, "#fff6d7");
    r(40, 35, 10, 8, "#4ed5cf");
    r(23, 15, 16, 5, "#fff6d7");
    r(53, 18, 9, 4, "#fff6d7");
    r(18, 44, 9, 4, "#8ce06f");
    r(60, 44, 8, 4, "#8ce06f");
  }

  function drawTitleCoverMenu() {
    const x = 462;
    drawRect(x - 8, 28, 164, 322, "#02050a");
    drawRect(x - 3, 33, 154, 312, "#10202a");
    drawRect(x + 5, 42, 136, 4, "#60d394");
    drawPixelText("RAGE CAGE", x + 14, 58, 1, "#60d394", null);
    drawPixelText("FIELD DECK", x + 14, 72, 2, "#f3d35b", "#071018");

    drawTitleCoverButton(x + 10, 104, "NEW RUN", true);
    drawTitleCoverButton(x + 10, 144, "RESUME", state.hasSave);

    drawRect(x + 10, 190, 128, 4, "#3a4b5b");
    drawPixelText("FIRST BONDS", x + 17, 208, 2, "#f3d35b", "#071018");
    drawTitleCoverBond(SPECIES_BY_ID.OGR001, "GRUNK", x + 12, 232);
    drawTitleCoverBond(SPECIES_BY_ID.ALN001, "ZORB", x + 12, 284);
  }

  function drawTitleCoverButton(x, y, label, active) {
    drawRect(x + 4, y + 27, 126, 6, "rgba(2,5,10,0.34)");
    drawRect(x, y, 132, 30, "#02050a");
    drawRect(x + 4, y + 4, 124, 22, active ? "#1f6f58" : "#263646");
    drawRect(x + 9, y + 8, 112, 3, active ? "#60d394" : "#3a4b5b");
    drawPixelText(label, x + 25, y + 16, 1, active ? "#fff6d7" : "#aeb9c2", "#071018");
  }

  function drawTitleCoverBond(species, label, x, y) {
    const accent = TYPE_COLORS[species.elements[0]] || "#60d394";
    drawRect(x + 5, y + 35, 126, 6, "rgba(2,5,10,0.3)");
    drawRect(x, y, 130, 39, "#02050a");
    drawRect(x + 4, y + 4, 122, 31, "#1a2530");
    drawRect(x + 9, y + 8, 58, 3, accent);
    drawCreatureSprite(species, x + 27, y + 31, 0.72, false);
    drawPixelText(label, x + 54, y + 16, 1, "#fff6d7", null);
    drawRect(x + 55, y + 28, 44, 4, accent);
  }

  function drawTitleCoverStarterStrip() {
    drawRect(22, 386, 402, 64, "#02050a");
    drawRect(28, 392, 390, 52, "#17222d");
    drawRect(36, 400, 160, 5, "#f3d35b");
    drawRect(204, 400, 188, 5, "#3a4b5b");
    drawPixelText("PRESS ENTER", 42, 419, 2, "#fff6d7", "#071018");
    drawPixelText("BEGIN THE OVERLOAD ROAD", 216, 422, 1, "#60d394", "#071018");
    drawRect(356, 416, 34, 18, "#071018");
    drawRect(365, 421, 15, 8, "#60d394");
    drawRect(384, 424, 6, 5, "#f3d35b");
  }

  function drawTitleCoverMapKey() {
    const x = 22;
    const y = 144;
    const tags = [
      ["OGRE HIGHLANDS", "#f3d35b"],
      ["ALIEN NEBULA", "#4ed5cf"],
      ["GOBLIN WARRENS", "#8ce06f"],
      ["BRAINROT RIFT", "#ff72e1"],
    ];
    tags.forEach((tag, index) => {
      const tx = x + (index % 2) * 172;
      const ty = y + Math.floor(index / 2) * 34;
      drawRect(tx + 4, ty + 23, 150, 5, "rgba(2,5,10,0.36)");
      drawRect(tx, ty, 154, 27, "#02050a");
      drawRect(tx + 4, ty + 4, 146, 19, "#17222d");
      drawRect(tx + 10, ty + 8, 42, 3, tag[1]);
      drawPixelText(tag[0], tx + 13, ty + 16, 1, "#fff6d7", null);
    });
  }

  function makeGbaPainter() {
    const scale = Math.min(W / 240, H / 160);
    const ox = Math.floor((W - 240 * scale) / 2);
    const oy = Math.floor((H - 160 * scale) / 2);
    const sx = (v) => ox + v * scale;
    const sy = (v) => oy + v * scale;
    return {
      scale,
      x: sx,
      y: sy,
      rect(x, y, w, h, color) {
        drawRect(sx(x), sy(y), w * scale, h * scale, color);
      },
      text(text, x, y, size, fill, stroke) {
        drawPixelText(text, sx(x), sy(y), size * scale, fill, stroke);
      },
      frame(x, y, w, h, outer, inner, trim) {
        this.rect(x, y, w, h, outer);
        this.rect(x + 1, y + 1, w - 2, h - 2, "#3a4b5b");
        this.rect(x + 2, y + 2, w - 4, h - 4, inner);
        this.rect(x + 4, y + 4, w - 8, 1, trim);
        this.rect(x + 2, y + h - 3, w - 4, 1, "#050b12");
      },
    };
  }

  function drawRageCageIcon(gba, x, y) {
    gba.rect(x + 6, y + 40, 43, 4, "rgba(2,5,10,0.42)");
    gba.rect(x + 9, y + 36, 37, 4, "#02050a");
    gba.rect(x + 13, y + 33, 30, 4, "#de7a3b");
    gba.rect(x + 17, y + 30, 22, 3, "#f3d35b");
    gba.rect(x + 11, y + 39, 32, 2, "#60d394");
    drawCreatureSprite(SPECIES_BY_ID.OGR003, gba.x(x + 28), gba.y(y + 37), gba.scale * 0.5, false, "title");
  }

  function drawTitleStarterCard(gba, species, label, x, y) {
    gba.frame(x, y, 52, 29, "#02050a", "#1a2530", TYPE_COLORS[species.elements[0]]);
    drawCreatureSprite(species, gba.x(x + 14), gba.y(y + 22), gba.scale * 0.28, false);
    gba.text(label, x + 24, y + 8, 1, "#fff6d7", null);
    gba.rect(x + 26, y + 19, 20, 2, TYPE_COLORS[species.elements[0]]);
  }

  function drawMiniWorldMap(gba, x, y) {
    drawTitleRegionMap(gba, x, y, 56, 31);
  }

  function drawTitleRegionMap(gba, x, y, w, h) {
    gba.rect(x, y, w, h, "#02050a");
    gba.rect(x + 2, y + 2, w - 4, h - 4, "#0c4f82");
    gba.rect(x + 2, y + 2, w - 4, 3, "#1f80b7");
    for (let i = 0; i < 18; i += 1) {
      const px = x + 5 + ((i * 17 + Math.floor(state.anim / 120)) % Math.max(8, w - 12));
      const py = y + 7 + ((i * 11 + Math.floor(i / 3) * 5) % Math.max(8, h - 14));
      gba.rect(px, py, i % 4 === 0 ? 6 : 3, 1, i % 3 ? "#d4f4ff" : "#77c6ef");
    }

    const sx = w / 156;
    const sy = h / 66;
    const rx = (v) => Math.round(x + v * sx);
    const ry = (v) => Math.round(y + v * sy);
    const rw = (v) => Math.max(1, Math.round(v * sx));
    const rh = (v) => Math.max(1, Math.round(v * sy));

    drawTitleMapIsland(gba, rx(8), ry(7), rw(61), rh(35), "#5f9c4b", "#35533f", "#8a7b57", 1);
    drawTitleMapIsland(gba, rx(15), ry(38), rw(50), rh(19), "#4d473f", "#8ce06f", "#704c32", 2);
    drawTitleMapIsland(gba, rx(91), ry(6), rw(43), rh(24), "#435c70", "#4ed5cf", "#9456d1", 3);
    drawTitleMapIsland(gba, rx(90), ry(37), rw(52), rh(21), "#6d5ec2", "#ff72e1", "#60d394", 4);
    drawTitleRoute(gba, rx(38), ry(25), rx(77), ry(31), "#f3d35b");
    drawTitleRoute(gba, rx(78), ry(31), rx(106), ry(20), "#f3d35b");
    drawTitleRoute(gba, rx(76), ry(34), rx(111), ry(48), "#fff6d7");
    drawTitleRoute(gba, rx(44), ry(42), rx(77), ry(35), "#f3d35b");

    drawTitleTinyTown(gba, rx(23), ry(18), "#f3d35b", "#de7a3b");
    drawTitleTinyTown(gba, rx(42), ry(47), "#8ce06f", "#704c32");
    drawTitleTinyTown(gba, rx(63), ry(42), "#60d394", "#b87d4b");
    drawTitleTinyTown(gba, rx(111), ry(18), "#4ed5cf", "#9456d1");
    drawTitleTinyTown(gba, rx(118), ry(48), "#ff72e1", "#60d394");
    gba.rect(rx(135), ry(33), rw(10), rh(10), "#071018");
    gba.rect(rx(137), ry(35), rw(6), rh(6), "#d6b85f");

    const bar1 = Math.max(8, Math.min(w - 12, 42));
    const bar2 = Math.max(0, Math.min(w - bar1 - 22, 50));
    gba.rect(x + 5, y + h - 8, bar1, 3, "#60d394");
    if (bar2 > 0) gba.rect(x + 9 + bar1, y + h - 8, bar2, 3, "#f3d35b");
    gba.rect(x + w - 18, y + 5, 10, 2, "#fff6d7");
    gba.rect(x + w - 14, y + 2, 2, 8, "#fff6d7");
    if (w > 100) {
      drawTitleMapLabel(gba, "OGRE", x + 12, y + 8, "#f3d35b");
      drawTitleMapLabel(gba, "ALIEN", x + w - 49, y + 8, "#4ed5cf");
      drawTitleMapLabel(gba, "GOB", x + 16, y + h - 18, "#8ce06f");
      drawTitleMapLabel(gba, "CHAOS", x + w - 52, y + h - 18, "#ff72e1");
    }
  }

  function drawTitleMapIsland(gba, x, y, w, h, base, detail, trim, seed = 1) {
    const rows = Math.max(5, Math.floor(h / 4));
    for (let row = 0; row < rows; row += 1) {
      const t = row / Math.max(1, rows - 1);
      const bulge = Math.sin(t * Math.PI);
      const rowW = Math.max(4, Math.round(w * (0.46 + bulge * 0.5) - ((seed + row) % 3) * 2));
      const rowX = x + Math.round((w - rowW) / 2) + (((seed * 7 + row * 5) % 5) - 2);
      const rowY = y + row * 4;
      gba.rect(rowX + 2, rowY + 2, rowW, 5, "#071018");
      gba.rect(rowX - 1, rowY, rowW + 2, 4, "#d4f4ff");
      gba.rect(rowX + 1, rowY + 1, rowW - 2, 4, base);
    }
    gba.rect(x + Math.round(w * 0.18), y + Math.round(h * 0.18), Math.max(5, Math.round(w * 0.44)), 4, shade(base, 20));
    gba.rect(x + Math.round(w * 0.36), y + Math.round(h * 0.42), Math.max(5, Math.round(w * 0.34)), 4, trim);
    gba.rect(x + Math.round(w * 0.2), y + Math.max(3, h - 8), Math.max(5, Math.round(w * 0.3)), 5, detail);
    gba.rect(x + Math.round(w * 0.7), y + Math.round(h * 0.22), Math.max(3, Math.round(w * 0.11)), Math.max(5, Math.round(h * 0.48)), shade(base, -24));
    for (let i = 0; i < 5; i += 1) {
      const px = x + 4 + ((seed * 11 + i * 13) % Math.max(5, w - 10));
      const py = y + 5 + ((seed * 7 + i * 9) % Math.max(5, h - 12));
      gba.rect(px, py, i % 2 ? 5 : 3, 2, i % 2 ? "#f3d35b" : detail);
    }
  }

  function drawTitleTinyTown(gba, x, y, roof, body) {
    gba.rect(x - 3, y + 5, 10, 3, "#071018");
    gba.rect(x - 2, y + 1, 8, 6, "#fff6d7");
    gba.rect(x - 3, y - 1, 10, 4, roof);
    gba.rect(x, y + 3, 3, 4, body);
    gba.rect(x + 4, y + 3, 2, 2, "#4ed5cf");
  }

  function drawTitleRoute(gba, x1, y1, x2, y2, color) {
    const steps = 9;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 2);
      gba.rect(x, y, 2, 2, i % 2 ? color : "#071018");
    }
  }

  function drawTitleMapLabel(gba, text, x, y, color) {
    const w = text.length * 6 + 5;
    gba.rect(x, y, w, 10, "#071018");
    gba.rect(x + 1, y + 1, w - 2, 8, "#17222d");
    gba.rect(x + 3, y + 2, Math.min(16, w - 6), 1, color);
    gba.text(text, x + 3, y + 4, 1, "#fff6d7", null);
  }

  function drawTitleMemeletCard(gba, x, y) {
    gba.frame(x, y, 52, 20, "#02050a", "#17222d", "#60d394");
    gba.text("MEMELET", x + 5, y + 6, 1, "#f3d35b", "#071018");
    gba.text("LAB", x + 5, y + 15, 1, "#fff6d7", null);
    gba.rect(x + 39, y + 7, 7, 8, "#071018");
    gba.rect(x + 41, y + 4, 4, 12, "#f3d35b");
    gba.rect(x + 42, y + 8, 2, 4, "#4ed5cf");
  }

  function drawTitleScanlines(gba) {
    for (let y = 0; y < 160; y += 2) {
      gba.rect(0, y, 240, 1, "rgba(255,255,255,0.025)");
    }
    gba.rect(0, 0, 240, 2, "#1d2a34");
    gba.rect(0, 158, 240, 2, "#02050a");
  }

  function drawStarter() {
    drawRect(0, 0, W, H, "#071018");
    drawRect(0, 0, W, 188, "#142536");
    for (let y = 0; y < 188; y += 28) {
      drawRect(0, y, W, 2, y % 56 ? "#24384d" : "#3a4b5b");
    }
    for (let x = 0; x < W; x += 42) {
      drawRect(x, 0, 2, 188, "rgba(255,255,255,0.035)");
    }
    drawRect(0, 188, W, 292, "#344756");
    for (let y = 188; y < H; y += 32) {
      for (let x = 0; x < W; x += 32) {
        const n = hash(`${x}:${y}:starter-floor`);
        drawRect(x, y, 32, 32, n % 2 ? "#2b3b48" : "#304453");
        drawRect(x, y, 32, 2, "rgba(255,255,255,0.06)");
        drawRect(x, y + 30, 32, 2, "rgba(0,0,0,0.18)");
      }
    }
    drawInsetFrame(28, 26, 584, 70, "#02050a", "#17222d", "#60d394");
    drawPixelText("PROFESSOR MOLD'S LAB", 52, 50, 2, "#f3d35b", "#071018");
    drawPixelText("PICK ONE FIRST BOND. THE REST OF THE OGREVERSE WILL JUDGE QUIETLY.", 54, 80, 1, "#fff6d7", null);
    drawRect(452, 42, 122, 34, "#071018");
    drawRect(458, 48, 110, 22, "#203241");
    drawPixelText("LICENSE 00", 470, 57, 1, "#60d394", null);
    drawRect(472, 68, 80, 2, "#f3d35b");

    drawRect(28, 118, 110, 232, "#071018");
    drawRect(36, 126, 94, 216, "#213142");
    drawRect(44, 134, 78, 4, "#f3d35b");
    if (!drawTrainerPortrait("prof", 84, 322, 118)) {
      drawTrainerWorldSprite("prof", 68, 218, 0);
    }
    drawPixelText("PROF MOLD", 50, 332, 1, "#fff6d7", null);
    drawPixelText("CERTIFIED", 50, 348, 1, "#60d394", null);

    drawRect(492, 118, 108, 232, "#071018");
    drawRect(500, 126, 92, 216, "#18242d");
    drawRect(508, 134, 76, 4, "#4ed5cf");
    drawPixelText("FIRST BOND", 516, 154, 1, "#f3d35b", null);
    drawPixelText("FIELD ROLES", 516, 174, 1, "#fff6d7", null);
    ["BRUTE", "TECH", "TRICK", "CHAOS"].forEach((label, index) => {
      drawRect(514, 194 + index * 29, 58, 16, "#071018");
      drawRect(518, 198 + index * 29, 50, 8, index === 0 ? "#de7a3b" : index === 1 ? "#4ed5cf" : index === 2 ? "#8ce06f" : "#ff72e1");
      drawPixelText(label, 522, 198 + index * 29, 1, "#071018", null);
    });

    const starters = SPECIES.filter((species) => species.starter);
    starters.forEach((species, index) => {
      const x = 178 + index * 86;
      const accent = TYPE_COLORS[species.elements[0]];
      const alt = TYPE_COLORS[species.elements[1] || species.elements[0]];
      drawRect(x - 34, 150, 68, 134, "#071018");
      drawRect(x - 29, 155, 58, 124, "#22313e");
      drawRect(x - 24, 160, 48, 4, accent);
      drawRect(x - 18, 268, 36, 5, alt);
      drawEllipse(x, 258, 74, 18, "rgba(0,0,0,0.28)");
      drawRect(x - 30, 238, 60, 30, "#704c32");
      drawRect(x - 26, 234, 52, 28, "#b87949");
      drawRect(x - 20, 238, 40, 4, "#f3d35b");
      drawCreatureSprite(species, x, 218 + Math.sin(state.anim / 250 + index) * 4, 1.35, false);
      drawInsetFrame(x - 36, 298, 72, 44, "#071018", "#213142", accent);
      drawPixelText(species.clanLabel.toUpperCase().slice(0, 8), x - 27, 309, 1, "#fff6d7", null);
      drawPixelText(species.role.toUpperCase().slice(0, 8), x - 27, 324, 1, "#cde8f5", null);
    });
    for (let i = 0; i < 18; i += 1) {
      const x = 150 + i * 18;
      drawRect(x, 370 + (i % 2) * 6, 10, 3, i % 3 ? "#60d394" : "#f3d35b");
    }
    drawInsetFrame(96, 374, 448, 42, "#02050a", "#17222d", "#f3d35b");
    drawPixelText("SELECT A STARTER FROM THE PANEL", 138, 394, 1, "#fff6d7", null);
    drawPixelText("ENTER THE CAMPAIGN ROAD WITH ONE CREW BOND.", 138, 410, 1, "#60d394", null);
    drawScreenTexture("rgba(255,255,255,0.03)", 8);
  }

  function drawOverworld() {
    const player = state.player;
    if (!player) return drawTitle();
    const camX = clamp(player.x - Math.floor(VIEW_COLS / 2), 0, WORLD_W - VIEW_COLS);
    const camY = clamp(player.y - Math.floor(VIEW_ROWS / 2), 0, WORLD_H - VIEW_ROWS);
    for (let sy = 0; sy < VIEW_ROWS; sy += 1) {
      for (let sx = 0; sx < VIEW_COLS; sx += 1) {
        const x = camX + sx;
        const y = camY + sy;
        drawTile(tileAt(x, y), sx * TILE, sy * TILE, x, y);
      }
    }
    drawWorldMapRenderPolish(camX, camY);
    drawWorldAmbientDressing(camX, camY);
    drawVisibleSettlementSetPieces(camX, camY);
    drawVisibleWorldObjects(camX, camY);
    drawVisibleTownLabels(camX, camY);
    drawStepParticles(camX, camY);
    drawFocusPulse(camX, camY);
    NPCS.forEach((npc) => {
      if (!npcVisible(npc)) return;
      const sx = (npc.x - camX) * TILE;
      const sy = (npc.y - camY) * TILE;
      if (sx < -TILE || sy < -TILE || sx > W || sy > H) return;
      drawNpc(npc, sx, sy);
    });
    drawOnlinePlayers(camX, camY);
    let playerSx = (player.x - camX) * TILE;
    let playerSy = (player.y - camY) * TILE;
    if (state.stepFx && performance.now() < state.stepFx.until) {
      const progress = 1 - (state.stepFx.until - performance.now()) / 130;
      playerSx += (state.stepFx.fromX - state.stepFx.toX) * TILE * (1 - progress);
      playerSy += (state.stepFx.fromY - state.stepFx.toY) * TILE * (1 - progress);
    }
    drawPlayer(playerSx, playerSy, player.facing);
    drawObjectiveGuide(camX, camY);
    drawWorldLighting();
    drawWorldScreenRim();
    drawScreenTexture("rgba(255,255,255,0.018)", 6);
    drawOverlays();
  }

  function drawOnlinePlayers(camX, camY) {
    if (!state.online.enabled || !state.online.peers.length) return;
    state.online.peers.forEach((peer) => {
      const sx = (Math.round(peer.x) - camX) * TILE;
      const sy = (Math.round(peer.y) - camY) * TILE;
      if (sx < -TILE || sy < -TILE || sx > W || sy > H) return;
      drawOnlinePeer(peer, sx, sy);
    });
  }

  function drawOnlinePeer(peer, sx, sy) {
    const bob = Math.floor(Math.sin(state.anim / 180 + hash(peer.id) % 9) * 1);
    const sprite = peer.sprite || "trainer";
    if (!drawTrainerWorldSprite(sprite, sx, sy, bob)) drawNpc({ sprite, x: peer.x, y: peer.y }, sx, sy);
    const name = String(peer.name || "Guest").toUpperCase().slice(0, 12);
    const lead = String(peer.leadName || "CREW").toUpperCase().slice(0, 12);
    const accent = peer.sprite === "alien" ? "#4ed5cf"
      : peer.sprite === "brainrot" ? "#ff72e1"
        : peer.sprite === "goblin" ? "#8ce06f"
          : peer.sprite === "ogre" ? "#f3d35b"
            : "#60d394";
    const plateX = clamp(sx - 19, 4, W - 112);
    const plateY = clamp(sy - 30, 92, H - 40);
    drawRect(plateX + 3, plateY + 19, 108, 5, "rgba(2,5,10,0.34)");
    drawRect(plateX, plateY, 110, 22, "#02050a");
    drawRect(plateX + 3, plateY + 3, 104, 15, "#17222d");
    drawRect(plateX + 8, plateY + 6, 36, 3, accent);
    drawPixelText(name, plateX + 8, plateY + 15, 1, "#fff6d7", null);
    drawPixelText(`LV${String(peer.leadLevel || 5).padStart(2, "0")}`, plateX + 78, plateY + 15, 1, "#f3d35b", null);
    if (peer.duelWins || peer.duelStreak) drawPixelText(`W${peer.duelWins || 0}/S${peer.duelStreak || 0}`, plateX + 54, plateY + 7, 1, accent, null);
    if (Math.abs(peer.x - state.player.x) + Math.abs(peer.y - state.player.y) <= 1) {
      drawRect(sx + 23, sy + 1, 34, 14, "#02050a");
      drawRect(sx + 26, sy + 4, 28, 8, accent);
      drawPixelText("DUEL", sx + 29, sy + 10, 1, "#071018", null);
    }
    drawPixelText(lead, plateX + 8, plateY + 29, 1, accent, "#071018");
  }

  function drawWorldAmbientDressing(camX, camY) {
    const biome = currentBiome();
    const accent = biomeAccent(biome);
    const alt = biomeAccentAlt(biome);
    const place = currentPlace();
    if (place) {
      const theme = TOWN_THEMES[place.theme] || TOWN_THEMES.meadow;
      const x1 = (place.x1 - camX) * TILE;
      const y1 = (place.y1 - camY) * TILE;
      const x2 = (place.x2 - camX + 1) * TILE;
      const y2 = (place.y2 - camY + 1) * TILE;
      drawRect(x1 + 3, y1 + 3, Math.max(0, x2 - x1 - 6), 3, theme.trim);
      drawRect(x1 + 3, y2 - 6, Math.max(0, x2 - x1 - 6), 3, shade(theme.ground, -28));
      drawRect(x1 + 3, y1 + 6, 3, Math.max(0, y2 - y1 - 12), shade(theme.ground, -30));
      drawRect(x2 - 6, y1 + 6, 3, Math.max(0, y2 - y1 - 12), shade(theme.ground, -34));
      for (let i = 0; i < 6; i += 1) {
        const px = x1 + 14 + ((hash(`${place.key}:${i}:plaza`) + i * 47) % Math.max(32, x2 - x1 - 28));
        const py = y1 + 16 + ((hash(`${place.key}:${i}:plaza-y`) + i * 31) % Math.max(32, y2 - y1 - 32));
        drawRect(px, py, 9, 3, i % 2 ? theme.detail : theme.accent);
      }
    }

    if (biome === "alien") {
      for (let i = 0; i < 9; i += 1) {
        const x = (i * 73 + Math.floor(state.anim / 42) - (camX % 4) * 8) % W;
        const y = 74 + ((i * 47 + camY * 9) % 280);
        drawRect(x, y, 30, 3, "#071018");
        drawRect(x + 4, y + 1, 22, 1, i % 2 ? accent : alt);
      }
    } else if (biome === "brainrot") {
      for (let i = 0; i < 7; i += 1) {
        const n = hash(`${camX}:${camY}:${i}:brainrot-ambient`);
        const x = (n + Math.floor(state.anim / (18 + i))) % W;
        const y = 72 + ((n >> 5) % 310);
        drawRect(x - 2, y + 1, i % 2 ? 24 : 10, i % 2 ? 4 : 13, "rgba(2,5,10,0.22)");
        drawRect(x, y, i % 2 ? 16 : 4, i % 2 ? 2 : 9, i % 3 === 0 ? "rgba(255,114,225,0.62)" : i % 3 === 1 ? "rgba(96,211,148,0.58)" : "rgba(243,211,91,0.5)");
      }
    } else if (biome === "goblin") {
      for (let i = 0; i < 6; i += 1) {
        const x = (i * 118 + Math.floor(state.anim / 30)) % (W + 90) - 70;
        const y = 92 + ((i * 53 + camY * 7) % 280);
        drawRect(x, y, 84, 3, "rgba(217,209,166,0.14)");
        drawRect(x + 18, y + 7, 52, 2, "rgba(140,224,111,0.12)");
      }
    } else if (biome === "ogre") {
      for (let i = 0; i < 7; i += 1) {
        const x = (W - ((i * 83 + Math.floor(state.anim / 25)) % (W + 60)));
        const y = 76 + ((i * 37 + camY * 5) % 260);
        drawRect(x, y, 36, 3, "rgba(216,240,163,0.18)");
        drawRect(x + 10, y + 5, 24, 2, "rgba(222,122,59,0.14)");
      }
    }
  }

  function drawWorldMapRenderPolish(camX, camY) {
    drawWorldDepthEdges(camX, camY);
    drawVisibleTownZoneBases(camX, camY);
  }

  function terrainShelfKey(x, y) {
    const tile = tileAt(x, y);
    const place = placeAt(x, y);
    if (place) return `place:${place.key}`;
    if (isWaterLike(tile)) return "water";
    if (["mountain", "wall", "glitchWall", "cave"].includes(tile)) return `high:${tile}`;
    if (tile === "beach" || isPathLike(tile)) return "route";
    return `biome:${biomeForCoord(x, y)}`;
  }

  function isRaisedTerrain(tile) {
    return tile === "mountain" || tile === "wall" || tile === "glitchWall" || tile === "cave" || tile === "citadel";
  }

  function drawWorldDepthEdges(camX, camY) {
    for (let y = Math.max(0, camY - 1); y <= Math.min(WORLD_H - 1, camY + VIEW_ROWS); y += 1) {
      for (let x = Math.max(0, camX - 1); x <= Math.min(WORLD_W - 1, camX + VIEW_COLS); x += 1) {
        const sx = (x - camX) * TILE;
        const sy = (y - camY) * TILE;
        if (sx < -TILE || sy < -TILE || sx > W || sy > H) continue;
        const tile = tileAt(x, y);
        const up = tileAt(x, y - 1);
        const down = tileAt(x, y + 1);
        const left = tileAt(x - 1, y);
        const right = tileAt(x + 1, y);
        if (isRaisedTerrain(tile)) {
          drawRect(sx + 2, sy + TILE - 6, TILE - 4, 5, "rgba(2,5,10,0.34)");
          drawRect(sx + TILE - 5, sy + 5, 4, TILE - 9, "rgba(2,5,10,0.22)");
          drawRect(sx + 5, sy + 4, TILE - 10, 2, "rgba(255,255,255,0.11)");
          drawRect(sx + 7, sy + 11, TILE - 14, 2, "rgba(255,255,255,0.08)");
        }
        if (isLandLike(tile)) {
          if (isWaterLike(down)) {
            drawRect(sx + 1, sy + TILE - 6, TILE - 2, 4, "rgba(2,5,10,0.36)");
            drawRect(sx + 4, sy + TILE - 9, TILE - 8, 2, "#f2dfa3");
            drawRect(sx + 7, sy + TILE - 2, TILE - 14, 2, "#d4f4ff");
          }
          if (isWaterLike(up)) {
            drawRect(sx + 2, sy, TILE - 4, 3, "rgba(255,255,255,0.18)");
            drawRect(sx + 5, sy + 3, TILE - 10, 2, "#d4f4ff");
          }
          if (isWaterLike(right)) {
            drawRect(sx + TILE - 6, sy + 2, 4, TILE - 4, "rgba(2,5,10,0.3)");
            drawRect(sx + TILE - 9, sy + 5, 2, TILE - 10, "#f2dfa3");
            drawRect(sx + TILE - 2, sy + 7, 2, TILE - 14, "#d4f4ff");
          }
          if (isWaterLike(left)) {
            drawRect(sx, sy + 2, 3, TILE - 4, "rgba(255,255,255,0.14)");
            drawRect(sx + 3, sy + 5, 2, TILE - 10, "#d4f4ff");
          }
        }

        const here = terrainShelfKey(x, y);
        const rightKey = terrainShelfKey(x + 1, y);
        const downKey = terrainShelfKey(x, y + 1);
        if (here !== rightKey && here !== "water" && rightKey !== "water") {
          const strong = here.startsWith("place:") || rightKey.startsWith("place:") || here.startsWith("high:") || rightKey.startsWith("high:");
          if (strong) drawRect(sx + TILE - 2, sy + 4, 2, TILE - 8, "rgba(2,5,10,0.28)");
        }
        if (here !== downKey && here !== "water" && downKey !== "water") {
          const strong = here.startsWith("place:") || downKey.startsWith("place:") || here.startsWith("high:") || downKey.startsWith("high:");
          if (strong) drawRect(sx + 4, sy + TILE - 2, TILE - 8, 2, "rgba(2,5,10,0.32)");
        }
      }
    }
  }

  function placeScreenBounds(place, camX, camY) {
    const x = (place.x1 - camX) * TILE;
    const y = (place.y1 - camY) * TILE;
    return {
      x,
      y,
      w: (place.x2 - place.x1 + 1) * TILE,
      h: (place.y2 - place.y1 + 1) * TILE,
    };
  }

  function placeVisible(place, camX, camY, pad = 64) {
    const b = placeScreenBounds(place, camX, camY);
    return b.x < W + pad && b.x + b.w > -pad && b.y < H + pad && b.y + b.h > -pad;
  }

  function drawVisibleTownZoneBases(camX, camY) {
    TOWN_ZONES.forEach((place) => {
      if (!placeVisible(place, camX, camY, 32)) return;
      const theme = TOWN_THEMES[place.theme] || TOWN_THEMES.meadow;
      const b = placeScreenBounds(place, camX, camY);
      const x = b.x;
      const y = b.y;
      const w = b.w;
      const h = b.h;
      drawRect(x + 6, y + h + 1, Math.max(0, w - 12), 5, "rgba(2,5,10,0.34)");
      drawRect(x + w + 1, y + 9, 5, Math.max(0, h - 12), "rgba(2,5,10,0.24)");
      drawRect(x + 5, y + 5, Math.max(0, w - 10), 2, "rgba(255,255,255,0.1)");
      drawRect(x + 5, y + h - 5, Math.max(0, w - 10), 3, shade(theme.ground, -38));
      drawRect(x + 4, y + 8, 3, Math.max(0, h - 14), shade(theme.ground, -34));
      drawRect(x + w - 7, y + 8, 3, Math.max(0, h - 14), shade(theme.ground, -42));
      const trim = place.theme === "brainrot" ? "#60d394" : theme.trim;
      for (let i = 0; i < 3; i += 1) {
        const px = x + 12 + ((hash(`${place.key}:ledge:${i}`) + i * 71) % Math.max(18, w - 28));
        drawRect(px, y + 8, 20, 2, trim);
      }
      drawRect(x + 6, y + 6, 11, 3, theme.accent);
      drawRect(x + w - 18, y + h - 8, 11, 3, theme.trim);
    });
  }

  function drawVisibleSettlementSetPieces(camX, camY) {
    TOWN_ZONES.forEach((place) => {
      if (!placeVisible(place, camX, camY, 96)) return;
      const theme = TOWN_THEMES[place.theme] || TOWN_THEMES.meadow;
      const cx = (place.iconX - camX) * TILE + TILE / 2;
      const base = (place.iconY - camY) * TILE + TILE + 2;
      if (cx < -96 || cx > W + 96 || base < -64 || base > H + 96) return;
      const themeKey = place.theme || "meadow";
      drawSettlementGroundRing(cx, base, theme);
      drawPremiumWorldAsset(`prop_small_${themeKey}`, cx - 44, base + 4, 52, 52);
      if (place.icon !== "labyard" && place.icon !== "harbor") {
        drawPremiumWorldAsset(`prop_path_${themeKey}`, cx + 43, base + 4, 48, 50);
      }
      drawSettlementSilhouette(place, cx, base, theme);
    });
  }

  function drawSettlementGroundRing(cx, base, theme) {
    drawEllipse(cx + 3, base + 1, 88, 18, "rgba(2,5,10,0.26)");
    drawRect(cx - 35, base - 7, 70, 5, shade(theme.ground, -26));
    drawRect(cx - 29, base - 10, 58, 3, theme.trim);
    drawRect(cx - 19, base - 3, 38, 2, "rgba(255,255,255,0.12)");
  }

  function drawSettlementSilhouette(place, cx, base, theme) {
    if (place.theme === "alien") {
      drawMiniAlienSpire(cx - 28, base - 4, theme, 0);
      drawMiniAlienSpire(cx + 30, base - 7, theme, 1);
      drawRect(cx - 23, base - 22, 46, 4, "#071018");
      drawRect(cx - 19, base - 24, 38, 2, theme.trim);
      return;
    }
    if (place.theme === "brainrot") {
      drawMiniBrainrotRift(cx - 29, base - 5, theme, 0);
      drawMiniBrainrotRift(cx + 30, base - 2, theme, 1);
      drawPixelSpiral(cx + 2, base - 31, 2, "#ff72e1", "#60d394");
      return;
    }
    if (place.theme === "duel") {
      drawMiniDuelPylon(cx - 34, base - 2, theme, 0);
      drawMiniDuelPylon(cx + 34, base - 2, theme, 1);
      drawRect(cx - 42, base - 21, 84, 5, "#071018");
      drawRect(cx - 36, base - 23, 72, 3, theme.accent);
      drawRect(cx - 25, base - 34, 50, 13, "#071018");
      drawRect(cx - 21, base - 31, 42, 7, theme.dark);
      drawRect(cx - 16, base - 28, 32, 2, theme.trim);
      drawRect(cx - 9, base - 16, 18, 5, "#fff6d7");
      return;
    }
    if (place.theme === "goblin") {
      drawMiniGoblinCave(cx - 32, base - 3, theme, 0);
      drawMiniMushroom(cx + 31, base - 3, theme.trim, theme.accent);
      drawMiniMushroom(cx + 44, base - 1, "#ff6f69", "#d9d1a6");
      return;
    }
    if (place.theme === "canopy") {
      drawMiniCanopyTree(cx - 32, base - 2, theme.trim, theme.detail);
      drawMiniCanopyTree(cx + 36, base - 5, theme.detail, theme.trim);
      drawRect(cx - 27, base - 24, 54, 3, "#704c32");
      return;
    }
    if (place.theme === "citadel") {
      drawMiniCitadelColumn(cx - 34, base - 2, theme, 0);
      drawMiniCitadelColumn(cx + 34, base - 2, theme, 1);
      drawRect(cx - 42, base - 18, 84, 4, "#071018");
      drawRect(cx - 36, base - 21, 72, 3, theme.trim);
      return;
    }
    if (place.theme === "ogre" || place.theme === "forge") {
      drawMiniHighlandCliff(cx - 38, base - 1, theme, place.theme === "forge");
      drawMiniHighlandCliff(cx + 32, base - 3, theme, place.theme === "forge");
      return;
    }
    if (place.theme === "harbor" || place.theme === "island") {
      drawRect(cx - 45, base - 17, 90, 4, "#704c32");
      drawRect(cx - 39, base - 21, 5, 21, "#8b643d");
      drawRect(cx + 34, base - 21, 5, 21, "#8b643d");
      drawRect(cx - 18, base - 25, 36, 3, theme.trim);
      return;
    }
    drawMiniCanopyTree(cx - 34, base - 2, "#60d394", "#d8f0a3");
    drawMiniCanopyTree(cx + 38, base - 3, "#7aa95f", "#f3d35b");
    drawRect(cx - 41, base - 14, 82, 3, "#704c32");
    drawRect(cx - 38, base - 18, 4, 12, "#5c3f2b");
    drawRect(cx + 34, base - 18, 4, 12, "#5c3f2b");
  }

  function drawMiniAlienSpire(cx, base, theme, variant) {
    const h = variant ? 42 : 36;
    drawRect(cx - 8, base - h, 16, h, "#071018");
    drawRect(cx - 4, base - h + 5, 8, h - 8, variant ? theme.accent : theme.trim);
    drawRect(cx - 18, base - 18, 36, 6, "#071018");
    drawRect(cx - 14, base - 16, 28, 3, "#596c7d");
    drawRect(cx - 7, base - h - 8, 14, 8, "#071018");
    drawRect(cx - 4, base - h - 10, 8, 7, variant ? "#ff72e1" : "#60d394");
  }

  function drawMiniBrainrotRift(cx, base, theme, variant) {
    const h = variant ? 38 : 33;
    drawRect(cx - 10, base - h, 20, h, "#071018");
    drawRect(cx - 6, base - h + 5, 12, h - 9, variant ? "#345466" : "#3f2a52");
    drawRect(cx - 16, base - 16, 32, 5, "#071018");
    drawRect(cx - 12, base - 15, 24, 2, variant ? theme.accent : theme.trim);
    drawRect(cx - 5, base - h - 7, 10, 7, theme.trim);
    drawRect(cx - 2, base - h - 13, 4, 8, theme.accent);
  }

  function drawMiniDuelPylon(cx, base, theme, variant) {
    const h = variant ? 45 : 39;
    drawRect(cx - 9, base - h, 18, h, "#071018");
    drawRect(cx - 5, base - h + 6, 10, h - 9, variant ? theme.detail : theme.trim);
    drawRect(cx - 18, base - 18, 36, 6, "#071018");
    drawRect(cx - 14, base - 16, 28, 3, theme.ground);
    drawRect(cx - 9, base - h - 10, 18, 10, "#071018");
    drawRect(cx - 5, base - h - 13, 10, 10, variant ? "#ff72e1" : "#4ed5cf");
    drawRect(cx - 2, base - h - 21, 4, 9, theme.accent);
  }

  function drawPixelSpiral(cx, cy, step, c1, c2) {
    drawRect(cx - 18, cy - 2, 36, 4, "#071018");
    drawRect(cx - 14, cy - 7, 28, 4, c1);
    drawRect(cx + 10, cy - 3, 4, 14, c2);
    drawRect(cx - 10, cy + 7, 24, 4, c1);
    drawRect(cx - 14, cy - 1, 4, 12, c2);
    drawRect(cx - 6, cy - 1, 14, 4, "#fff6d7");
    if (step > 1) drawRect(cx - 2, cy + 4, 8, 3, "#071018");
  }

  function drawMiniGoblinCave(cx, base, theme) {
    drawRect(cx - 22, base - 25, 44, 25, "#071018");
    drawEllipse(cx, base - 10, 36, 28, theme.dark);
    drawRect(cx - 10, base - 14, 20, 14, "#111820");
    drawRect(cx - 18, base - 5, 8, 6, theme.accent);
    drawRect(cx + 12, base - 20, 8, 5, theme.trim);
  }

  function drawMiniMushroom(cx, base, cap, stem) {
    drawRect(cx - 4, base - 17, 8, 18, stem);
    drawRect(cx - 3, base - 17, 6, 4, "#071018");
    drawEllipse(cx, base - 20, 30, 17, "#071018");
    drawEllipse(cx, base - 22, 25, 15, cap);
    drawRect(cx - 9, base - 24, 4, 3, "#fff6d7");
    drawRect(cx + 5, base - 20, 5, 3, "#fff6d7");
  }

  function drawMiniCanopyTree(cx, base, leaf, light) {
    drawRect(cx - 5, base - 30, 10, 31, "#704c32");
    drawRect(cx - 2, base - 29, 4, 29, "#5c3f2b");
    drawEllipse(cx - 10, base - 39, 33, 26, "#071018");
    drawEllipse(cx + 7, base - 41, 34, 25, "#071018");
    drawEllipse(cx - 10, base - 42, 29, 23, leaf);
    drawEllipse(cx + 8, base - 44, 30, 23, light);
    drawRect(cx - 4, base - 48, 10, 4, "#d8f0a3");
  }

  function drawMiniCitadelColumn(cx, base, theme, variant) {
    const h = variant ? 48 : 42;
    drawRect(cx - 10, base - h, 20, h, "#071018");
    drawRect(cx - 6, base - h + 6, 12, h - 10, theme.accent);
    drawRect(cx - 13, base - h - 8, 26, 10, "#071018");
    drawRect(cx - 10, base - h - 11, 20, 9, theme.trim);
    drawRect(cx - 4, base - h + 18, 8, 12, "#8d8fa0");
  }

  function drawMiniHighlandCliff(cx, base, theme, forge) {
    drawRect(cx - 24, base - 32, 48, 33, "#071018");
    drawRect(cx - 20, base - 29, 40, 29, forge ? "#6f503f" : "#70645a");
    drawRect(cx - 18, base - 28, 14, 6, forge ? "#f15d3a" : "#c1a263");
    drawRect(cx + 5, base - 22, 13, 5, theme.trim);
    drawRect(cx - 11, base - 12, 22, 4, "rgba(255,255,255,0.12)");
    drawRect(cx - 20, base - 3, 40, 4, "rgba(2,5,10,0.3)");
    if (forge) {
      drawRect(cx - 4, base - 18, 8, 9, "#f15d3a");
      drawRect(cx - 2, base - 21, 4, 5, "#f3d35b");
    }
  }

  function drawWorldScreenRim() {
    drawRect(0, 0, W, 4, "rgba(2,5,10,0.42)");
    drawRect(0, H - 4, W, 4, "rgba(2,5,10,0.42)");
    drawRect(0, 0, 4, H, "rgba(2,5,10,0.34)");
    drawRect(W - 4, 0, 4, H, "rgba(2,5,10,0.34)");
    drawRect(6, 6, 62, 2, biomeAccent());
    drawRect(W - 72, H - 8, 62, 2, biomeAccentAlt());
  }

  function drawStepParticles(camX, camY) {
    const now = performance.now();
    state.stepParticles = state.stepParticles.filter((particle) => now < particle.until);
    state.stepParticles.forEach((particle) => {
      if (now < particle.started) return;
      const t = clamp((now - particle.started) / (particle.until - particle.started), 0, 1);
      const sx = (particle.x - camX + particle.vx * t * 28) * TILE;
      const sy = (particle.y - camY + particle.vy * t * 28) * TILE;
      const alpha = 1 - t;
      drawRect(sx - particle.size / 2, sy - particle.size / 2, particle.size + 2, particle.size, `rgba(2,5,10,${0.28 * alpha})`);
      drawRect(sx, sy - t * 8, particle.size, Math.max(2, particle.size - 1), particle.color);
      if (particle.size > 4) drawRect(sx + 2, sy - t * 8 + 2, particle.size - 2, 1, particle.dark);
    });
  }

  function drawFocusPulse(camX, camY) {
    const fx = state.focusPulse;
    const now = performance.now();
    if (!fx || now >= fx.until) {
      if (fx) state.focusPulse = null;
      return;
    }
    const t = clamp((now - fx.started) / (fx.until - fx.started), 0, 1);
    const sx = (fx.x - camX) * TILE;
    const sy = (fx.y - camY) * TILE;
    const grow = Math.floor(t * 7);
    drawRect(sx + 2 - grow, sy + 2 - grow, TILE - 4 + grow * 2, 3, "#071018");
    drawRect(sx + 2 - grow, sy + TILE - 5 + grow, TILE - 4 + grow * 2, 3, "#071018");
    drawRect(sx + 2 - grow, sy + 2 - grow, 3, TILE - 4 + grow * 2, "#071018");
    drawRect(sx + TILE - 5 + grow, sy + 2 - grow, 3, TILE - 4 + grow * 2, "#071018");
    drawRect(sx + 5 - grow, sy + 5 - grow, TILE - 10 + grow * 2, 2, fx.color);
    drawRect(sx + 5 - grow, sy + TILE - 7 + grow, TILE - 10 + grow * 2, 2, fx.color);
  }

  function drawObjectiveGuide(camX, camY) {
    if (!state.player || state.mode !== "overworld") return;
    const step = activeStoryStep();
    if (!step || storyStepComplete(step)) return;
    const targetBiome = biomeForCoord(step.x, step.y);
    const accent = biomeAccent(targetBiome);
    const alt = biomeAccentAlt(targetBiome);
    const playerX = (state.player.x - camX) * TILE + TILE / 2;
    const playerY = (state.player.y - camY) * TILE + TILE / 2;
    const targetX = (step.x - camX) * TILE + TILE / 2;
    const targetY = (step.y - camY) * TILE + TILE / 2;
    const visible = targetX > -TILE && targetX < W + TILE && targetY > -TILE && targetY < H + TILE;
    if (visible) {
      drawObjectiveRouteDots(playerX, playerY, targetX, targetY, accent, alt);
      drawObjectiveTargetBeacon(targetX, targetY, step, accent, alt);
      return;
    }
    drawObjectiveCompassChip(step, step.x - state.player.x, step.y - state.player.y, accent, alt);
  }

  function drawObjectiveRouteDots(x1, y1, x2, y2, accent, alt) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 42) return;
    const count = clamp(Math.floor(dist / 38), 3, 12);
    const phase = (state.anim / 240) % 1;
    for (let i = 1; i <= count; i += 1) {
      const p = (i - phase * 0.7) / (count + 1);
      if (p <= 0 || p >= 1) continue;
      const x = x1 + dx * p;
      const y = y1 + dy * p;
      drawRect(x - 5, y - 4, 11, 8, "#071018");
      drawRect(x - 2, y - 2, 5, 4, i % 2 ? accent : alt);
    }
  }

  function drawObjectiveTargetBeacon(cx, cy, step, accent, alt) {
    const pulse = Math.floor((Math.sin(state.anim / 130) + 1) * 3);
    const left = cx - TILE / 2;
    const top = cy - TILE / 2;
    drawRect(cx - 3, top - 40 - pulse, 6, 32 + pulse, "rgba(2,5,10,0.54)");
    drawRect(cx - 1, top - 36 - pulse, 2, 28 + pulse, alt);
    drawRect(left - 6 - pulse, top - 6 - pulse, 20, 4, "#071018");
    drawRect(left - 6 - pulse, top - 6 - pulse, 4, 20, "#071018");
    drawRect(left + TILE - 14 + pulse, top - 6 - pulse, 20, 4, "#071018");
    drawRect(left + TILE + 2 + pulse, top - 6 - pulse, 4, 20, "#071018");
    drawRect(left - 6 - pulse, top + TILE + 2 + pulse, 20, 4, "#071018");
    drawRect(left - 6 - pulse, top + TILE - 14 + pulse, 4, 20, "#071018");
    drawRect(left + TILE - 14 + pulse, top + TILE + 2 + pulse, 20, 4, "#071018");
    drawRect(left + TILE + 2 + pulse, top + TILE - 14 + pulse, 4, 20, "#071018");
    drawRect(left - 2 - pulse, top - 2 - pulse, 14, 2, accent);
    drawRect(left - 2 - pulse, top - 2 - pulse, 2, 14, accent);
    drawRect(left + TILE - 10 + pulse, top - 2 - pulse, 14, 2, accent);
    drawRect(left + TILE + 2 + pulse, top - 2 - pulse, 2, 14, accent);
    drawRect(left - 2 - pulse, top + TILE + pulse, 14, 2, alt);
    drawRect(left - 2 - pulse, top + TILE - 10 + pulse, 2, 14, alt);
    drawRect(left + TILE - 10 + pulse, top + TILE + pulse, 14, 2, alt);
    drawRect(left + TILE + 2 + pulse, top + TILE - 10 + pulse, 2, 14, alt);

    const label = objectiveLabel(step);
    const boxW = Math.min(214, Math.max(118, label.length * 7 + 64));
    const boxX = clamp(cx - boxW / 2, 12, W - boxW - 12);
    const boxY = clamp(cy < 120 ? cy + 28 : cy - 62, 96, H - 62);
    drawRect(boxX + 5, boxY + 33, boxW - 10, 5, "rgba(2,5,10,0.42)");
    drawRect(boxX, boxY, boxW, 36, "#02050a");
    drawRect(boxX + 4, boxY + 4, boxW - 8, 28, "#17222d");
    drawRect(boxX + 10, boxY + 9, 42, 3, accent);
    drawRect(boxX + 56, boxY + 9, boxW - 78, 3, "#3a4b5b");
    drawPixelText(`CH ${step.chapter}`, boxX + 11, boxY + 18, 1, "#f3d35b", null);
    drawPixelText(label, boxX + 68, boxY + 18, 1, "#fff6d7", null);
  }

  function drawObjectiveCompassChip(step, dx, dy, accent, alt) {
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / len;
    const ny = dy / len;
    const edgeX = clamp(W / 2 + nx * (W / 2 - 56), 20, W - 154);
    const edgeY = clamp(H / 2 + ny * (H / 2 - 86), 102, H - 54);
    const x = Math.round(edgeX);
    const y = Math.round(edgeY);
    drawRect(x + 5, y + 36, 124, 5, "rgba(2,5,10,0.44)");
    drawRect(x, y, 134, 39, "#02050a");
    drawRect(x + 4, y + 4, 126, 31, "#17222d");
    drawRect(x + 9, y + 9, 42, 3, accent);
    drawRect(x + 54, y + 9, 62, 3, "#3a4b5b");
    drawObjectiveArrowPixels(x + 19, y + 23, dx, dy, accent, alt);
    drawPixelText(`CH ${step.chapter}`, x + 40, y + 18, 1, "#f3d35b", null);
    drawPixelText(`${destinationDistance(step)} STEP`, x + 40, y + 29, 1, "#fff6d7", null);
  }

  function drawObjectiveArrowPixels(cx, cy, dx, dy, accent, alt) {
    drawRect(cx - 11, cy - 11, 22, 22, "#071018");
    if (Math.abs(dx) >= Math.abs(dy)) {
      const right = dx >= 0;
      const shaftX = right ? cx - 9 : cx - 2;
      const headX = right ? cx + 2 : cx - 8;
      drawRect(shaftX, cy - 3, 12, 6, accent);
      drawRect(headX, cy - 7, 6, 14, alt);
      drawRect(right ? headX + 4 : headX - 2, cy - 3, 4, 6, "#fff6d7");
    } else {
      const down = dy >= 0;
      const shaftY = down ? cy - 9 : cy - 2;
      const headY = down ? cy + 2 : cy - 8;
      drawRect(cx - 3, shaftY, 6, 12, accent);
      drawRect(cx - 7, headY, 14, 6, alt);
      drawRect(cx - 3, down ? headY + 4 : headY - 2, 6, 4, "#fff6d7");
    }
  }

  function objectiveLabel(step) {
    const raw = step.target || step.title || "NEXT";
    return raw
      .replace("Professor Mold", "PROF MOLD")
      .replace("Trial Den", "DEN")
      .replace("Elite Four", "APEX")
      .replace("Crown Warden", "WARDEN")
      .replace("'s", "")
      .replace("'", "")
      .toUpperCase()
      .slice(0, 18);
  }

  function drawWorldLighting() {
    const tod = timeOfDay();
    if (tod === "Night") drawRect(0, 0, W, H, "rgba(11,18,41,0.22)");
    if (tod === "Dawn") drawRect(0, 0, W, H, "rgba(244,211,91,0.035)");
    drawRect(0, 0, W, 18, "rgba(0,0,0,0.22)");
    drawRect(0, H - 18, W, 18, "rgba(0,0,0,0.18)");
    drawRect(0, 0, 22, H, "rgba(0,0,0,0.16)");
    drawRect(W - 22, 0, 22, H, "rgba(0,0,0,0.16)");
    drawRect(22, 18, W - 44, 2, "rgba(255,255,255,0.035)");
  }

  function themedTileColor(tile, theme, fallback) {
    if (!theme) return fallback;
    if (tile === "town") return theme.ground;
    if (tile === "path") return theme.path;
    if (tile === "techfloor") return theme.ground;
    if (tile === "memeFloor") return theme.ground;
    if (tile === "citadel") return theme.ground;
    if (tile === "bridge") return theme.path;
    return fallback;
  }

  function drawBrainrotFloorTile(sx, sy, n, theme = TOWN_THEMES.brainrot) {
    drawRect(sx, sy, TILE, TILE, "#3f2a52");
    drawRect(sx, sy + TILE - 5, TILE, 5, "#23152f");
    drawRect(sx, sy, TILE, 2, "rgba(255,255,255,0.07)");
    drawRect(sx + 2, sy + 4, 12, 11, n % 3 === 0 ? "#574170" : "#493560");
    drawRect(sx + 18, sy + 17, 12, 10, n % 4 === 0 ? "#315061" : "#53406d");
    drawRect(sx + 17, sy + 4, 13, 8, "#302541");
    drawRect(sx + 3, sy + 20, 12, 7, "#302541");
    if (n % 7 === 0) drawRect(sx + 5, sy + 9, 8, 2, "rgba(255,114,225,0.72)");
    if (n % 11 === 0) drawRect(sx + 20, sy + 22, 7, 2, "rgba(96,211,148,0.7)");
    if (n % 19 === 0) drawRect(sx + 9, sy + 25, 5, 2, "rgba(243,211,91,0.68)");
    if (n % 29 === 0) drawRect(sx + 23, sy + 6, 4, 4, "rgba(96,211,148,0.62)");
    if (n % 13 === 0) drawRect(sx + ((n >> 2) & 17), sy + ((n >> 4) & 19), 10, 1, "rgba(255,255,255,0.09)");
  }

  function drawThemedSettlementTile(tile, sx, sy, x, y, theme, place, n) {
    drawRect(sx, sy + TILE - 4, TILE, 4, shade(theme.ground, -18));
    drawRect(sx, sy, TILE, 2, "rgba(255,255,255,0.08)");
    if (tile === "path" || tile === "bridge") {
      drawRect(sx, sy + 6, TILE, 3, shade(theme.path, 18));
      drawRect(sx, sy + 17, TILE, 3, shade(theme.path, -16));
      drawRect(sx + 4, sy, 3, TILE, shade(theme.path, -24));
      drawRect(sx + 22, sy, 3, TILE, shade(theme.path, -20));
      for (let i = 0; i < 3; i += 1) {
        drawRect(sx + 6 + i * 9, sy + 10 + ((n >> i) & 3), 5, 3, theme.detail);
      }
      if (place.theme === "harbor" || place.theme === "island") {
        drawRect(sx, sy + 27, TILE, 3, "#1f6598");
        drawRect(sx + 3, sy + 29, 12, 1, "#d4f4ff");
      }
      return;
    }
    if (place.theme === "alien") {
      drawRect(sx + 3, sy + 14, 26, 3, theme.trim);
      drawRect(sx + 14, sy + 3, 3, 26, theme.accent);
      drawRect(sx + 5, sy + 5, 7, 7, theme.dark);
      drawRect(sx + 20, sy + 20, 7, 7, theme.dark);
      drawRect(sx + 7, sy + 7, 3, 3, theme.detail);
      drawRect(sx + 22, sy + 22, 3, 3, "#ff72e1");
      return;
    }
    if (place.theme === "brainrot") {
      drawBrainrotFloorTile(sx, sy, n, theme);
      return;
    }
    if (place.theme === "duel") {
      drawRect(sx + 2, sy + 2, 28, 28, shade(theme.ground, 6));
      drawRect(sx + 4, sy + 4, 24, 2, theme.trim);
      drawRect(sx + 4, sy + 26, 24, 2, shade(theme.dark, 8));
      drawRect(sx + 15, sy + 3, 2, 26, "rgba(78,213,207,0.75)");
      drawRect(sx + 3, sy + 15, 26, 2, "rgba(243,211,91,0.65)");
      drawRect(sx + 7, sy + 7, 6, 6, theme.dark);
      drawRect(sx + 19, sy + 19, 6, 6, theme.dark);
      if (n % 3 === 0) drawRect(sx + 7, sy + 20, 18, 2, theme.detail);
      if (n % 5 === 0) drawRect(sx + 20, sy + 7, 5, 5, "#fff6d7");
      return;
    }
    if (place.theme === "citadel") {
      drawRect(sx + 2, sy + 2, 28, 28, shade(theme.ground, 16));
      drawRect(sx + 4, sy + 4, 24, 2, theme.accent);
      drawRect(sx + 4, sy + 26, 24, 2, shade(theme.ground, -18));
      drawRect(sx + 15, sy + 4, 2, 24, shade(theme.ground, -20));
      drawRect(sx + 5, sy + 15, 22, 2, shade(theme.ground, -14));
      if (n % 5 === 0) drawRect(sx + 23, sy + 6, 4, 4, theme.trim);
      return;
    }
    if (place.theme === "ogre" || place.theme === "forge") {
      drawRect(sx + 2, sy + 5, 28, 8, shade(theme.ground, 14));
      drawRect(sx + 2, sy + 17, 28, 8, shade(theme.ground, -14));
      drawRect(sx + 7, sy + 3, 3, 25, shade(theme.ground, -26));
      drawRect(sx + 20, sy + 3, 3, 25, shade(theme.ground, -26));
      if (place.theme === "forge" && n % 4 === 0) {
        drawRect(sx + 11, sy + 9, 10, 7, "#f15d3a");
        drawRect(sx + 13, sy + 7, 6, 5, "#f3d35b");
      } else if (n % 3 === 0) {
        drawRect(sx + 5, sy + 6, 5, 8, theme.trim);
        drawRect(sx + 22, sy + 6, 5, 8, theme.accent);
      }
      return;
    }
    if (place.theme === "canopy") {
      drawRect(sx + 1, sy + 8, 30, 4, "#704c32");
      drawRect(sx + 1, sy + 19, 30, 4, "#704c32");
      drawRect(sx + 8, sy + 1, 4, 30, "#5c3f2b");
      drawRect(sx + 21, sy + 1, 4, 30, "#5c3f2b");
      for (let i = 0; i < 3; i += 1) {
        drawRect(sx + 4 + i * 10, sy + 4 + ((n >> i) & 9), 6, 6, i % 2 ? theme.trim : theme.detail);
      }
      return;
    }
    if (place.theme === "goblin") {
      drawRect(sx + 3, sy + 4, 26, 22, shade(theme.ground, -14));
      drawRect(sx + 7, sy + 7, 18, 4, shade(theme.ground, 18));
      drawRect(sx + 6, sy + 20, 7, 7, theme.accent);
      drawRect(sx + 8, sy + 26, 3, 4, theme.detail);
      if (n % 2 === 0) drawRect(sx + 21, sy + 12, 6, 5, theme.trim);
      return;
    }
    if (place.theme === "harbor" || place.theme === "island") {
      drawRect(sx + 2, sy + 6, 28, 4, "#704c32");
      drawRect(sx + 2, sy + 17, 28, 4, "#704c32");
      drawRect(sx + 6, sy + 2, 4, 28, "#8b643d");
      drawRect(sx + 21, sy + 2, 4, 28, "#8b643d");
      drawRect(sx + 3, sy + 26, 24, 2, theme.trim);
      if (n % 3 === 0) drawRect(sx + 15, sy + 10, 10, 4, theme.detail);
      return;
    }
    drawRect(sx + 4, sy + 5, 5, 5, theme.detail);
    drawRect(sx + 20, sy + 18, 6, 4, theme.trim);
    drawRect(sx + 11, sy + 25, 3, 3, theme.accent);
  }

  function drawVisibleTownLandmarks(camX, camY) {
    TOWN_ZONES.forEach((place) => {
      const sx = (place.iconX - camX) * TILE;
      const sy = (place.iconY - camY) * TILE;
      if (sx < -48 || sy < -48 || sx > W + 32 || sy > H + 32) return;
      drawTownIcon(place, sx, sy);
    });
  }

  function drawVisibleWorldObjects(camX, camY) {
    const objects = [];
    for (let y = Math.max(1, camY - 2); y <= Math.min(WORLD_H - 2, camY + VIEW_ROWS + 2); y += 1) {
      for (let x = Math.max(1, camX - 2); x <= Math.min(WORLD_W - 2, camX + VIEW_COLS + 2); x += 1) {
        const tile = tileAt(x, y);
        if (["lab", "pc", "shop", "gym", "elite"].includes(tile)) {
          objects.push({ kind: "building", tile, x, y, sort: y + 0.9 });
        }
        if (tile === "switch" || tile === "rift") {
          objects.push({ kind: tile, x, y, sort: y + 0.7 });
        }
        const place = placeAt(x, y);
        if (place && !["lab", "pc", "shop", "gym", "elite", "switch", "rift"].includes(tile)) {
          const h = hash(`${x}:${y}:${place.key}:prop`);
          const onPath = isPathLike(tile);
          const dense = ["goblin", "alien", "brainrot", "citadel"].includes(place.theme);
          const calm = ["meadow", "harbor", "island"].includes(place.theme);
          const largeEvery = dense ? 14 : calm ? 29 : 21;
          const smallEvery = dense ? 9 : calm ? 17 : 13;
          const pathEvery = dense ? 23 : calm ? 39 : 33;
          if (!onPath && h % largeEvery === 0) objects.push({ kind: "prop", prop: "large", place, x, y, seed: h, sort: y + 0.65 });
          else if (!onPath && h % smallEvery === 0) objects.push({ kind: "prop", prop: "small", place, x, y, seed: h, sort: y + 0.55 });
          else if (onPath && h % pathEvery === 0) objects.push({ kind: "prop", prop: "path", place, x, y, seed: h, sort: y + 0.5 });
        }
      }
    }
    TOWN_ZONES.forEach((place) => {
      if (place.iconX < camX - 2 || place.iconX > camX + VIEW_COLS + 1 || place.iconY < camY - 2 || place.iconY > camY + VIEW_ROWS + 1) return;
      objects.push({ kind: "townIcon", place, x: place.iconX, y: place.iconY, sort: place.iconY + 0.5 });
    });
    objects.sort((a, b) => a.sort - b.sort || a.x - b.x);
    objects.forEach((obj) => {
      const sx = (obj.x - camX) * TILE;
      const sy = (obj.y - camY) * TILE;
      if (obj.kind === "building") drawPremiumBuilding(obj.tile, sx, sy, obj.x, obj.y);
      else if (obj.kind === "townIcon") drawTownIcon(obj.place, sx, sy);
      else if (obj.kind === "switch") drawSwitchObject(sx, sy, obj.x, obj.y);
      else if (obj.kind === "rift") drawRiftObject(sx, sy);
      else if (obj.kind === "prop") drawTownProp(obj.prop, obj.place, sx, sy, obj.seed);
    });
  }

  function drawVisibleTownLabels(camX, camY) {
    TOWN_ZONES.forEach((place) => {
      const sx = (place.labelX - camX) * TILE;
      const sy = (place.labelY - camY) * TILE;
      if (sx < -130 || sy < -24 || sx > W + 24 || sy > H + 24) return;
      const theme = TOWN_THEMES[place.theme];
      const label = place.short.toUpperCase().slice(0, 12);
      const w = label.length * 7 + 18;
      drawRect(sx, sy - 15, w, 16, "#071018");
      drawRect(sx + 2, sy - 13, w - 4, 12, "#1d2a34");
      drawRect(sx + 5, sy - 11, 26, 2, theme.trim);
      drawPixelText(label, sx + 7, sy - 8, 1, "#fff6d7", null);
    });
  }

  function drawTownIcon(place, sx, sy) {
    const theme = TOWN_THEMES[place.theme];
    drawEllipse(sx + 16, sy + 29, 28, 8, "rgba(0,0,0,0.28)");
    if (["stronghold", "citadel", "gate"].includes(place.icon)) {
      drawRect(sx + 3, sy + 8, 26, 20, "#071018");
      drawRect(sx + 6, sy + 10, 20, 17, theme.ground);
      drawRect(sx + 3, sy + 4, 7, 24, theme.dark);
      drawRect(sx + 22, sy + 4, 7, 24, theme.dark);
      drawRect(sx + 7, sy + 2, 4, 4, theme.accent);
      drawRect(sx + 23, sy + 2, 4, 4, theme.accent);
      drawRect(sx + 13, sy + 18, 7, 10, "#071018");
      drawRect(sx + 12, sy + 8, 9, 3, theme.trim);
      return;
    }
    if (place.icon === "forge") {
      drawRect(sx + 5, sy + 12, 23, 16, "#071018");
      drawRect(sx + 8, sy + 14, 17, 13, theme.ground);
      drawRect(sx + 20, sy + 3, 6, 18, theme.dark);
      drawRect(sx + 19, sy, 8, 4, "#596c7d");
      drawRect(sx + 9, sy + 20, 14, 7, "#f15d3a");
      drawRect(sx + 12, sy + 17, 8, 5, "#f3d35b");
      drawRect(sx + 22, sy - 4, 8, 3, "rgba(255,255,255,0.55)");
      return;
    }
    if (place.icon === "crater") {
      drawEllipse(sx + 16, sy + 17, 28, 18, "#071018");
      drawEllipse(sx + 16, sy + 17, 19, 11, "#59473c");
      drawRect(sx + 12, sy + 13, 8, 5, "#f15d3a");
      drawRect(sx + 15, sy + 10, 4, 3, "#f3d35b");
      return;
    }
    if (["canopy", "hollow"].includes(place.icon)) {
      drawRect(sx + 13, sy + 12, 7, 18, "#704c32");
      drawRect(sx + 5, sy + 7, 22, 14, theme.trim);
      drawRect(sx + 2, sy + 12, 28, 9, theme.detail);
      drawRect(sx + 8, sy + 16, 16, 7, shade(theme.trim, -20));
      drawRect(sx + 9, sy + 22, 14, 5, "#b78a4e");
      return;
    }
    if (["burrow", "bog"].includes(place.icon)) {
      drawRect(sx + 4, sy + 14, 24, 14, "#071018");
      drawEllipse(sx + 16, sy + 23, 22, 16, theme.dark);
      drawRect(sx + 8, sy + 18, 16, 10, "#111820");
      drawRect(sx + 2, sy + 20, 7, 7, theme.accent);
      drawRect(sx + 23, sy + 11, 7, 6, theme.trim);
      return;
    }
    if (["harbor", "isle"].includes(place.icon)) {
      drawRect(sx + 3, sy + 16, 26, 8, "#704c32");
      drawRect(sx + 7, sy + 10, 4, 18, "#8b643d");
      drawRect(sx + 20, sy + 10, 4, 18, "#8b643d");
      drawRect(sx + 10, sy + 7, 11, 7, theme.roof);
      drawRect(sx + 12, sy + 4, 7, 3, "#fff6d7");
      drawRect(sx + 2, sy + 25, 28, 3, theme.trim);
      return;
    }
    if (["tower", "array", "arcade"].includes(place.icon)) {
      drawRect(sx + 13, sy + 3, 7, 26, "#071018");
      drawRect(sx + 15, sy + 5, 3, 22, theme.trim);
      drawRect(sx + 7, sy + 11, 19, 7, theme.dark);
      drawRect(sx + 4, sy + 20, 25, 8, "#596c7d");
      drawRect(sx + 9, sy + 22, 5, 4, theme.accent);
      drawRect(sx + 18, sy + 22, 5, 4, "#ff72e1");
      drawRect(sx + 11, sy, 11, 3, theme.accent);
      return;
    }
    if (place.icon === "arena") {
      drawRect(sx + 2, sy + 18, 28, 10, "#071018");
      drawRect(sx + 5, sy + 20, 22, 6, theme.ground);
      drawRect(sx + 7, sy + 8, 18, 10, "#071018");
      drawRect(sx + 10, sy + 10, 12, 6, theme.dark);
      drawRect(sx + 4, sy + 5, 24, 5, theme.accent);
      drawRect(sx + 7, sy + 2, 5, 9, theme.trim);
      drawRect(sx + 20, sy + 2, 5, 9, theme.detail);
      drawRect(sx + 13, sy + 13, 7, 3, "#fff6d7");
      return;
    }
    if (["riftwell", "dockrift", "bazaar"].includes(place.icon)) {
      drawRect(sx + 4, sy + 7, 24, 22, "#071018");
      for (let i = 0; i < 5; i += 1) {
        drawRect(sx + 9 + i * 3, sy + 10 + i * 3, 14 - i * 2, 4, i % 2 ? theme.trim : theme.accent);
      }
      drawRect(sx + 4, sy + 22, 5, 5, "#ff72e1");
      drawRect(sx + 23, sy + 13, 5, 5, "#60d394");
      return;
    }
    drawRect(sx + 7, sy + 12, 18, 16, "#071018");
    drawRect(sx + 9, sy + 14, 14, 13, theme.ground);
    drawRect(sx + 7, sy + 9, 18, 5, theme.roof);
  }

  function drawPremiumBuilding(tile, sx, sy, x, y) {
    const place = placeAt(x, y);
    const theme = place ? TOWN_THEMES[place.theme] : townThemeAt(x, y) || TOWN_THEMES.meadow;
    const themeKey = place?.theme || "meadow";
    const atlasMaxW = tile === "elite" ? 132 : tile === "gym" ? 118 : 102;
    const atlasMaxH = tile === "elite" ? 120 : tile === "gym" ? 108 : 94;
    if (drawPremiumWorldAsset(`building_${tile}_${themeKey}`, sx + 16, sy + 43, atlasMaxW, atlasMaxH)) {
      drawPremiumBuildingSign(tile, sx, sy, theme);
      return;
    }
    const isTrial = tile === "gym" || tile === "elite";
    const isService = tile === "lab" || tile === "pc" || tile === "shop";
    const w = tile === "elite" ? 92 : isTrial ? 78 : 66;
    const h = tile === "elite" ? 72 : isTrial ? 62 : 52;
    const baseX = Math.round(sx + 16 - w / 2);
    const baseY = Math.round(sy + 34 - h);
    drawEllipse(sx + 16, sy + 33, w * 0.88, 13, "rgba(0,0,0,0.34)");

    if (place?.theme === "alien") {
      drawAlienBuilding(tile, baseX, baseY, w, h, theme);
    } else if (place?.theme === "brainrot") {
      drawBrainrotBuilding(tile, baseX, baseY, w, h, theme);
    } else if (place?.theme === "duel") {
      drawDuelBuilding(tile, baseX, baseY, w, h, theme);
    } else if (place?.theme === "goblin") {
      drawGoblinBuilding(tile, baseX, baseY, w, h, theme);
    } else if (place?.theme === "citadel") {
      drawCitadelBuilding(tile, baseX, baseY, w, h, theme);
    } else if (place?.theme === "ogre" || place?.theme === "forge") {
      drawOgreBuilding(tile, baseX, baseY, w, h, theme, place.theme === "forge");
    } else {
      drawClassicTownBuilding(tile, baseX, baseY, w, h, theme, isService);
    }

    drawPremiumBuildingSign(tile, sx, sy, theme);
  }

  function drawPremiumBuildingSign(tile, sx, sy, theme) {
    const sign = { lab: "LAB", pc: "+", shop: "$", gym: "TRIAL", elite: "CROWN" }[tile] || "";
    const signW = tile === "gym" ? 42 : tile === "elite" ? 48 : 28;
    drawRect(sx + 16 - signW / 2 - 2, sy - 24, signW + 4, 14, "#071018");
    drawRect(sx + 16 - signW / 2, sy - 22, signW, 10, theme.trim);
    drawPixelText(sign, sx + 18 - signW / 2, sy - 20, 1, "#071018", null);
  }

  function drawClassicTownBuilding(tile, x, y, w, h, theme, isService) {
    drawRect(x + 2, y + 18, w - 4, h - 18, "#071018");
    drawRect(x + 6, y + 22, w - 12, h - 26, "#fff2ca");
    drawRect(x - 1, y + 8, w + 2, 17, "#071018");
    drawRect(x + 4, y + 5, w - 8, 18, theme.roof);
    drawRect(x + 9, y + 10, w - 18, 4, theme.trim);
    drawRect(x + 12, y + 23, w - 24, 4, theme.accent);
    drawRect(x + Math.floor(w / 2) - 7, y + h - 20, 14, 16, "#293642");
    drawRect(x + Math.floor(w / 2) - 3, y + h - 14, 3, 3, "#f3d35b");
    drawRect(x + 11, y + 30, 12, 10, "#77c6ef");
    drawRect(x + w - 23, y + 30, 12, 10, "#77c6ef");
    if (isService) {
      drawRect(x + 6, y + h - 5, w - 12, 5, shade(theme.ground, -24));
      drawRect(x + 10, y + h - 8, w - 20, 3, theme.trim);
    }
  }

  function drawOgreBuilding(tile, x, y, w, h, theme, forge = false) {
    drawRect(x + 3, y + 13, w - 6, h - 13, "#071018");
    drawRect(x + 8, y + 17, w - 16, h - 21, forge ? "#7b604c" : "#8a7b57");
    for (let i = 0; i < 5; i += 1) {
      drawRect(x + 12 + i * Math.floor((w - 24) / 5), y + 19, 4, h - 25, shade(theme.dark, 8));
    }
    drawRect(x + 4, y + 3, w - 8, 18, "#071018");
    drawRect(x + 8, y, w - 16, 20, theme.roof);
    drawRect(x + 12, y + 8, w - 24, 5, forge ? "#f15d3a" : theme.trim);
    drawRect(x + Math.floor(w / 2) - 9, y + h - 22, 18, 18, "#1f1a17");
    drawRect(x + 13, y + h - 15, 14, 7, forge ? "#f15d3a" : theme.accent);
    drawRect(x + w - 28, y + h - 15, 14, 7, forge ? "#f3d35b" : theme.trim);
    if (forge) {
      drawRect(x + w - 18, y - 12, 8, 18, "#2b2522");
      drawRect(x + w - 19, y - 16, 10, 5, "#596c7d");
      drawRect(x + 15, y + 25, w - 30, 5, "#ffb45c");
      drawRect(x + 20, y + 21, 18, 8, "#f15d3a");
    }
  }

  function drawGoblinBuilding(tile, x, y, w, h, theme) {
    drawRect(x + 2, y + 12, w - 4, h - 12, "#071018");
    drawEllipse(x + w / 2, y + h / 2, w - 6, h - 8, theme.dark);
    drawRect(x + 8, y + 25, w - 16, h - 32, "#2c2725");
    drawRect(x + 12, y + 18, w - 24, 8, theme.roof);
    drawRect(x + 16, y + h - 22, 18, 18, "#111820");
    drawRect(x + w - 31, y + h - 21, 13, 11, theme.accent);
    drawRect(x + 12, y + h - 18, 9, 9, theme.trim);
    drawRect(x + Math.floor(w / 2) - 3, y + 7, 6, 12, "#d9d1a6");
    if (tile === "gym") {
      drawRect(x + 6, y + 2, w - 12, 8, "#704c32");
      drawRect(x + 18, y + 4, w - 36, 4, theme.trim);
    }
  }

  function drawAlienBuilding(tile, x, y, w, h, theme) {
    drawRect(x + 5, y + 18, w - 10, h - 18, "#071018");
    drawRect(x + 10, y + 21, w - 20, h - 25, "#263f56");
    drawRect(x + 14, y + 12, w - 28, 16, "#596c7d");
    drawRect(x + 18, y + 15, w - 36, 5, theme.trim);
    drawRect(x + Math.floor(w / 2) - 8, y + h - 22, 16, 18, "#101820");
    drawRect(x + 12, y + h - 17, 12, 8, "#4ed5cf");
    drawRect(x + w - 24, y + h - 17, 12, 8, "#ff72e1");
    drawRect(x + 10, y - 12, 8, 32, "#071018");
    drawRect(x + 13, y - 8, 3, 26, theme.trim);
    drawRect(x + w - 18, y - 16, 8, 36, "#071018");
    drawRect(x + w - 15, y - 11, 3, 29, theme.accent);
    drawRect(x + Math.floor(w / 2) - 11, y + 2, 22, 5, theme.accent);
  }

  function drawBrainrotBuilding(tile, x, y, w, h, theme) {
    drawRect(x + 3, y + 15, w - 6, h - 15, "#071018");
    for (let yy = y + 19; yy < y + h - 4; yy += 10) {
      for (let xx = x + 8; xx < x + w - 8; xx += 12) {
        const color = ((xx + yy) / 2) % 3 < 1 ? "#ff72e1" : ((xx + yy) / 2) % 3 < 2 ? "#60d394" : "#6d5ec2";
        drawRect(xx, yy, 10, 8, color);
      }
    }
    drawRect(x + 7, y + 6, w - 14, 18, "#071018");
    drawRect(x + 11, y + 3, w - 22, 18, theme.roof);
    drawRect(x + 18, y + 10, w - 36, 5, theme.accent);
    drawRect(x + Math.floor(w / 2) - 10, y + h - 24, 20, 20, "#101820");
    drawRect(x + 14, y + h - 17, 13, 8, "#f3d35b");
    drawRect(x + w - 27, y + h - 17, 13, 8, "#4ed5cf");
    if (tile === "gym") {
      for (let i = 0; i < 5; i += 1) {
        drawRect(x + w - 26 + i * 4, y - 12 + i * 4, 18 - i * 2, 4, i % 2 ? "#60d394" : "#ff72e1");
      }
    }
  }

  function drawDuelBuilding(tile, x, y, w, h, theme) {
    drawRect(x + 2, y + 18, w - 4, h - 18, "#071018");
    drawRect(x + 8, y + 23, w - 16, h - 27, "#17222d");
    drawRect(x + 4, y + 8, w - 8, 17, "#071018");
    drawRect(x + 9, y + 5, w - 18, 18, theme.ground);
    drawRect(x + 14, y + 12, w - 28, 4, theme.accent);
    drawRect(x + 12, y + h - 18, w - 24, 5, theme.trim);
    drawRect(x + Math.floor(w / 2) - 9, y + h - 25, 18, 21, "#071018");
    drawRect(x + Math.floor(w / 2) - 5, y + h - 21, 10, 16, theme.dark);
    drawRect(x + 9, y + 24, 11, 18, "#071018");
    drawRect(x + w - 20, y + 24, 11, 18, "#071018");
    drawRect(x + 12, y + 27, 5, 12, "#4ed5cf");
    drawRect(x + w - 17, y + 27, 5, 12, "#ff72e1");
    drawRect(x + Math.floor(w / 2) - 24, y - 10, 48, 17, "#071018");
    drawRect(x + Math.floor(w / 2) - 20, y - 7, 40, 10, theme.dark);
    drawRect(x + Math.floor(w / 2) - 14, y - 4, 28, 2, theme.trim);
    if (tile === "gym") {
      drawRect(x - 7, y + 15, 9, h - 14, "#071018");
      drawRect(x + w - 2, y + 15, 9, h - 14, "#071018");
      drawRect(x - 4, y + 11, 3, h - 10, theme.trim);
      drawRect(x + w + 1, y + 11, 3, h - 10, theme.detail);
      drawRect(x + Math.floor(w / 2) - 33, y + h - 12, 66, 6, "#071018");
      drawRect(x + Math.floor(w / 2) - 29, y + h - 10, 58, 3, theme.accent);
    }
  }

  function drawCitadelBuilding(tile, x, y, w, h, theme) {
    drawRect(x + 2, y + 16, w - 4, h - 16, "#071018");
    drawRect(x + 7, y + 19, w - 14, h - 23, "#d6d4c8");
    drawRect(x + 8, y + 6, w - 16, 18, "#071018");
    drawRect(x + 12, y + 2, w - 24, 21, theme.roof);
    drawRect(x + 18, y + 9, w - 36, 5, theme.trim);
    for (let i = 0; i < 4; i += 1) {
      const tx = x + 4 + i * Math.floor((w - 8) / 3);
      drawRect(tx, y + 4, 8, h - 8, "#071018");
      drawRect(tx + 2, y, 4, h - 12, "#e9e4ff");
      drawRect(tx, y - 5, 8, 6, theme.accent);
    }
    drawRect(x + Math.floor(w / 2) - 9, y + h - 24, 18, 20, "#202633");
    drawRect(x + Math.floor(w / 2) - 13, y + h - 30, 26, 5, theme.trim);
    if (tile === "elite") {
      drawRect(x + Math.floor(w / 2) - 15, y - 13, 30, 7, theme.accent);
      drawRect(x + Math.floor(w / 2) - 3, y - 22, 6, 10, theme.trim);
    }
  }

  function drawSwitchObject(sx, sy, x, y) {
    const theme = townThemeAt(x, y) || TOWN_THEMES.brainrot;
    drawEllipse(sx + 16, sy + 28, 24, 7, "rgba(0,0,0,0.35)");
    drawRect(sx + 7, sy + 8, 18, 20, "#071018");
    drawRect(sx + 10, sy + 6, 12, 20, theme.trim);
    drawRect(sx + 8, sy + 13, 16, 5, theme.accent);
    drawRect(sx + 12, sy + 10, 8, 4, "#fff6d7");
  }

  function drawRiftObject(sx, sy) {
    drawEllipse(sx + 16, sy + 28, 30, 9, "rgba(0,0,0,0.42)");
    const pulse = Math.floor((Math.sin(state.anim / 150) + 1) * 4);
    drawRect(sx + 4 - pulse / 2, sy + 4 - pulse / 2, 24 + pulse, 24 + pulse, "#071018");
    for (let i = 0; i < 6; i += 1) {
      drawRect(sx + 9 + i * 3, sy + 8 + i * 3, 18 - i * 2, 4, i % 2 ? "#60d394" : "#ff72e1");
    }
    drawRect(sx + 13, sy + 14, 7, 7, "#f3d35b");
  }

  function drawTownProp(size, place, sx, sy, seed) {
    const themeKey = place?.theme || "meadow";
    const theme = TOWN_THEMES[themeKey] || TOWN_THEMES.meadow;
    const atlasMaxW = size === "large" ? 58 : size === "path" ? 44 : 42;
    const atlasMaxH = size === "large" ? 58 : size === "path" ? 46 : 44;
    if (drawPremiumWorldAsset(`prop_${size}_${themeKey}`, sx + 16, sy + 35, atlasMaxW, atlasMaxH)) return;
    if (size === "path") {
      if (themeKey === "alien") return drawNeonPylon(sx, sy, theme, seed);
      if (themeKey === "citadel") return drawMiniColumn(sx, sy, theme);
      if (themeKey === "brainrot") return drawGlitchSign(sx, sy, theme, seed);
      return drawTownLamp(sx, sy, theme);
    }
    if (themeKey === "meadow" || themeKey === "canopy") {
      if (size === "large") return drawPremiumTreeObject(sx, sy, theme, seed);
      return seed % 2 ? drawFlowerBedObject(sx, sy, theme) : drawTownFenceObject(sx, sy, theme);
    }
    if (themeKey === "ogre" || themeKey === "forge") {
      if (size === "large") return drawStoneBannerObject(sx, sy, theme, themeKey === "forge");
      return seed % 2 ? drawRockPileObject(sx, sy, theme) : drawTownLamp(sx, sy, theme);
    }
    if (themeKey === "goblin") {
      if (size === "large") return drawMushroomClusterObject(sx, sy, theme);
      return seed % 2 ? drawGoblinCrateObject(sx, sy, theme) : drawGlowingMushroomObject(sx, sy, theme);
    }
    if (themeKey === "harbor" || themeKey === "island") {
      if (size === "large") return drawDockCratesObject(sx, sy, theme);
      return seed % 2 ? drawTownFenceObject(sx, sy, theme) : drawTownLamp(sx, sy, theme);
    }
    if (themeKey === "alien") {
      if (size === "large") return drawNeonPylon(sx, sy, theme, seed);
      return drawCircuitBoxObject(sx, sy, theme, seed);
    }
    if (themeKey === "brainrot") {
      if (size === "large") return drawGlitchKioskObject(sx, sy, theme, seed);
      return drawGlitchSign(sx, sy, theme, seed);
    }
    if (themeKey === "duel") {
      if (size === "large") return drawDuelScorePylonObject(sx, sy, theme, seed);
      return seed % 2 ? drawDuelScorePylonObject(sx, sy, theme, seed) : drawDuelRailObject(sx, sy, theme);
    }
    if (themeKey === "citadel") {
      if (size === "large") return drawMiniColumn(sx, sy, theme);
      return drawFlowerBedObject(sx, sy, theme);
    }
  }

  function drawPremiumTreeObject(sx, sy, theme, seed) {
    const sway = Math.sin(state.anim / 480 + seed) * 1.5;
    drawEllipse(sx + 16, sy + 29, 26, 8, "rgba(0,0,0,0.34)");
    drawRect(sx + 13, sy + 14, 8, 18, "#704c32");
    drawRect(sx + 16, sy + 16, 3, 15, "#5c3f2b");
    drawRect(sx + 2 + sway, sy + 4, 28, 18, "#071018");
    drawRect(sx + 5 + sway, sy + 1, 23, 18, theme.trim);
    drawRect(sx - 1 + sway, sy + 10, 22, 16, shade(theme.trim, -16));
    drawRect(sx + 14 + sway, sy + 8, 21, 17, theme.detail);
    drawRect(sx + 9 + sway, sy + 5, 8, 4, "#d8f0a3");
    drawRect(sx + 21 + sway, sy + 17, 7, 4, "#35533f");
  }

  function drawTownFenceObject(sx, sy, theme) {
    drawRect(sx + 1, sy + 15, 30, 5, "#071018");
    drawRect(sx + 1, sy + 16, 30, 3, "#704c32");
    for (let i = 0; i < 4; i += 1) {
      drawRect(sx + 3 + i * 8, sy + 10, 4, 16, "#071018");
      drawRect(sx + 4 + i * 8, sy + 8, 2, 17, theme.path || "#8b643d");
    }
  }

  function drawFlowerBedObject(sx, sy, theme) {
    drawRect(sx + 3, sy + 19, 25, 8, "#071018");
    drawRect(sx + 5, sy + 18, 21, 7, "#35533f");
    drawFlowerClump(sx + 8, sy + 12, theme.trim, theme.accent);
    drawFlowerClump(sx + 17, sy + 10, "#ff72e1", "#f3d35b");
  }

  function drawTownLamp(sx, sy, theme) {
    const glow = Math.floor((Math.sin(state.anim / 360 + sx) + 1) * 2);
    drawEllipse(sx + 16, sy + 28, 18, 6, "rgba(0,0,0,0.32)");
    drawRect(sx + 13, sy + 8, 6, 21, "#071018");
    drawRect(sx + 15, sy + 11, 2, 17, theme.dark);
    drawRect(sx + 9 - glow, sy + 4 - glow, 14 + glow * 2, 10 + glow * 2, "#071018");
    drawRect(sx + 12, sy + 5, 8, 7, theme.trim);
    drawRect(sx + 14, sy + 7, 4, 3, "#fff6d7");
  }

  function drawStoneBannerObject(sx, sy, theme, forge) {
    drawEllipse(sx + 16, sy + 29, 26, 8, "rgba(0,0,0,0.34)");
    drawRect(sx + 5, sy + 6, 6, 24, "#071018");
    drawRect(sx + 21, sy + 6, 6, 24, "#071018");
    drawRect(sx + 7, sy + 4, 3, 24, theme.dark);
    drawRect(sx + 23, sy + 4, 3, 24, theme.dark);
    drawRect(sx + 9, sy + 8, 14, 14, "#071018");
    drawRect(sx + 11, sy + 9, 10, 12, forge ? "#f15d3a" : theme.roof);
    drawRect(sx + 13, sy + 12, 6, 3, theme.trim);
  }

  function drawRockPileObject(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 28, 24, 7, "rgba(0,0,0,0.33)");
    drawRect(sx + 7, sy + 19, 10, 8, "#071018");
    drawRect(sx + 15, sy + 15, 11, 12, "#071018");
    drawRect(sx + 8, sy + 18, 8, 8, shade(theme.ground, 20));
    drawRect(sx + 17, sy + 14, 9, 11, shade(theme.ground, -18));
    drawRect(sx + 10, sy + 19, 8, 2, "#fff6d7");
  }

  function drawMushroomClusterObject(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 29, 27, 8, "rgba(0,0,0,0.34)");
    drawRect(sx + 8, sy + 20, 5, 9, "#d9d1a6");
    drawRect(sx + 18, sy + 16, 6, 13, "#d9d1a6");
    drawRect(sx + 5, sy + 15, 12, 8, "#ff6f69");
    drawRect(sx + 15, sy + 10, 14, 9, theme.trim);
    drawRect(sx + 9, sy + 17, 3, 2, "#fff6d7");
    drawRect(sx + 21, sy + 12, 3, 2, "#fff6d7");
  }

  function drawGlowingMushroomObject(sx, sy, theme) {
    drawRect(sx + 13, sy + 17, 6, 12, "#d9d1a6");
    drawRect(sx + 9, sy + 11, 14, 9, theme.trim);
    drawRect(sx + 12, sy + 13, 8, 3, "#fff6d7");
  }

  function drawGoblinCrateObject(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 29, 24, 7, "rgba(0,0,0,0.34)");
    drawRect(sx + 7, sy + 15, 18, 13, "#071018");
    drawRect(sx + 9, sy + 17, 14, 10, "#704c32");
    drawRect(sx + 10, sy + 20, 12, 2, theme.accent);
    drawRect(sx + 15, sy + 17, 2, 10, "#d1a267");
  }

  function drawDockCratesObject(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 29, 28, 7, "rgba(0,0,0,0.34)");
    drawRect(sx + 5, sy + 15, 13, 12, "#071018");
    drawRect(sx + 7, sy + 17, 9, 9, "#704c32");
    drawRect(sx + 18, sy + 12, 11, 15, "#071018");
    drawRect(sx + 20, sy + 14, 7, 12, theme.path);
    drawRect(sx + 9, sy + 20, 5, 2, theme.detail);
  }

  function drawNeonPylon(sx, sy, theme, seed) {
    const pulse = Math.floor((Math.sin(state.anim / 260 + seed) + 1) * 2);
    drawEllipse(sx + 16, sy + 29, 25, 7, "rgba(0,0,0,0.36)");
    drawRect(sx + 10, sy + 6, 12, 23, "#071018");
    drawRect(sx + 13, sy + 8, 6, 19, "#263f56");
    drawRect(sx + 14, sy + 4 - pulse, 4, 8 + pulse * 2, theme.trim);
    drawRect(sx + 7, sy + 18, 18, 4, theme.accent);
    drawRect(sx + 11, sy + 24, 10, 3, "#ff72e1");
  }

  function drawCircuitBoxObject(sx, sy, theme, seed) {
    drawRect(sx + 6, sy + 16, 20, 12, "#071018");
    drawRect(sx + 8, sy + 18, 16, 8, "#263f56");
    drawRect(sx + 10, sy + 20, 12, 2, seed % 2 ? theme.trim : "#ff72e1");
    drawRect(sx + 15, sy + 17, 2, 9, theme.accent);
  }

  function drawGlitchKioskObject(sx, sy, theme, seed) {
    drawEllipse(sx + 16, sy + 29, 27, 8, "rgba(0,0,0,0.36)");
    drawRect(sx + 5, sy + 11, 22, 18, "#071018");
    drawRect(sx + 8, sy + 13, 16, 14, seed % 2 ? "#ff72e1" : "#6d5ec2");
    drawRect(sx + 10, sy + 15, 12, 4, "#60d394");
    drawRect(sx + 13, sy + 21, 7, 3, "#f3d35b");
    drawRect(sx + 2, sy + 7, 12, 4, "#ff72e1");
    drawRect(sx + 20, sy + 5, 10, 4, "#60d394");
  }

  function drawGlitchSign(sx, sy, theme, seed) {
    drawRect(sx + 7, sy + 16, 18, 10, "#071018");
    drawRect(sx + 9, sy + 18, 14, 6, seed % 2 ? "#ff72e1" : "#60d394");
    drawRect(sx + 13, sy + 11, 3, 17, theme.dark);
    drawRect(sx + 17, sy + 19, 8, 3, "#f3d35b");
  }

  function drawDuelScorePylonObject(sx, sy, theme, seed) {
    const pulse = Math.floor((Math.sin(state.anim / 220 + seed) + 1) * 2);
    drawEllipse(sx + 16, sy + 29, 26, 7, "rgba(0,0,0,0.36)");
    drawRect(sx + 7, sy + 7, 18, 22, "#071018");
    drawRect(sx + 10, sy + 10, 12, 17, theme.dark);
    drawRect(sx + 12, sy + 5 - pulse, 8, 7 + pulse * 2, seed % 2 ? "#ff72e1" : "#4ed5cf");
    drawRect(sx + 5, sy + 20, 22, 5, "#071018");
    drawRect(sx + 8, sy + 22, 16, 2, theme.accent);
    drawRect(sx + 13, sy + 13, 6, 2, "#fff6d7");
  }

  function drawDuelRailObject(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 29, 26, 6, "rgba(0,0,0,0.32)");
    drawRect(sx + 2, sy + 18, 28, 5, "#071018");
    drawRect(sx + 4, sy + 19, 24, 2, theme.trim);
    drawRect(sx + 5, sy + 23, 22, 4, "#071018");
    drawRect(sx + 8, sy + 24, 16, 2, theme.detail);
    drawRect(sx + 5, sy + 12, 4, 12, theme.accent);
    drawRect(sx + 23, sy + 12, 4, 12, theme.accent);
  }

  function drawMiniColumn(sx, sy, theme) {
    drawEllipse(sx + 16, sy + 29, 24, 7, "rgba(0,0,0,0.34)");
    drawRect(sx + 9, sy + 23, 14, 5, "#071018");
    drawRect(sx + 12, sy + 7, 8, 18, "#e9e4ff");
    drawRect(sx + 8, sy + 5, 16, 5, theme.accent);
    drawRect(sx + 10, sy + 24, 12, 3, theme.trim);
    drawRect(sx + 14, sy + 10, 2, 13, "#aeb9c2");
  }

  function isWaterLike(tile) {
    return tile === "deepWater" || tile === "river";
  }

  function isPathLike(tile) {
    return tile === "path" || tile === "bridge" || tile === "techfloor" || tile === "memeFloor" || tile === "citadel";
  }

  function isLandLike(tile) {
    return tile && !isWaterLike(tile) && tile !== "void";
  }

  function drawTerrainBlend(tile, sx, sy, x, y, theme) {
    const n = {
      up: tileAt(x, y - 1),
      down: tileAt(x, y + 1),
      left: tileAt(x - 1, y),
      right: tileAt(x + 1, y),
    };
    if (isWaterLike(tile)) {
      const foam = tile === "river" ? "#d4f4ff" : "#9ed5ee";
      const deep = tile === "river" ? "#277ca8" : "#164d7b";
      if (isLandLike(n.up)) {
        drawRect(sx, sy, TILE, 3, foam);
        drawRect(sx, sy + 3, TILE, 2, deep);
      }
      if (isLandLike(n.down)) {
        drawRect(sx, sy + TILE - 4, TILE, 3, foam);
      }
      if (isLandLike(n.left)) {
        drawRect(sx, sy, 3, TILE, foam);
        drawRect(sx + 3, sy, 2, TILE, deep);
      }
      if (isLandLike(n.right)) {
        drawRect(sx + TILE - 3, sy, 3, TILE, foam);
      }
      return;
    }
    if ((isPathLike(tile) && !["techfloor", "memeFloor", "citadel"].includes(tile)) || tile === "town") {
      const edge = theme ? shade(theme.path || theme.ground, -28) : "#8e7b54";
      const trim = theme?.detail || "#d9d1a6";
      if (!isPathLike(n.up) && n.up !== tile) drawRect(sx, sy, TILE, 2, edge);
      if (!isPathLike(n.down) && n.down !== tile) drawRect(sx, sy + TILE - 3, TILE, 3, edge);
      if (!isPathLike(n.left) && n.left !== tile) drawRect(sx, sy, 2, TILE, edge);
      if (!isPathLike(n.right) && n.right !== tile) drawRect(sx + TILE - 2, sy, 2, TILE, edge);
      if (theme && tile === "town") {
        if (isPathLike(n.up)) drawRect(sx + 4, sy, TILE - 8, 2, trim);
        if (isPathLike(n.down)) drawRect(sx + 4, sy + TILE - 2, TILE - 8, 2, trim);
        if (isPathLike(n.left)) drawRect(sx, sy + 4, 2, TILE - 8, trim);
        if (isPathLike(n.right)) drawRect(sx + TILE - 2, sy + 4, 2, TILE - 8, trim);
      }
    }
    if (!isWaterLike(tile) && [n.up, n.down, n.left, n.right].some(isWaterLike)) {
      const place = placeAt(x, y);
      const sand = place?.theme === "harbor" || place?.theme === "island" ? "#dfca8e" : "#d8bd78";
      if (isWaterLike(n.up)) drawRect(sx, sy, TILE, 3, sand);
      if (isWaterLike(n.down)) drawRect(sx, sy + TILE - 3, TILE, 3, sand);
      if (isWaterLike(n.left)) drawRect(sx, sy, 3, TILE, sand);
      if (isWaterLike(n.right)) drawRect(sx + TILE - 3, sy, 3, TILE, sand);
    }
  }

  function drawMicroDecor(tile, sx, sy, x, y, theme, n) {
    const place = placeAt(x, y);
    if (["lab", "pc", "shop", "gym", "elite", "switch", "rift"].includes(tile)) return;
    if (theme && (tile === "town" || tile === "path" || tile === "techfloor" || tile === "memeFloor" || tile === "citadel")) {
      const roll = n % 100;
      if (place?.theme === "meadow" || place?.theme === "canopy") {
        if (roll < 34) drawFlowerClump(sx + 4 + (n % 18), sy + 5 + ((n >> 5) % 18), theme.trim, theme.accent);
        if (roll > 76) drawRect(sx + 6, sy + 20, 18, 3, "#704c32");
        if (roll > 86) drawRect(sx + 12, sy + 13, 5, 14, "#35533f");
      } else if (place?.theme === "ogre" || place?.theme === "forge") {
        if (roll < 38) {
          drawRect(sx + 5 + (n % 11), sy + 7 + ((n >> 4) % 16), 12, 2, shade(theme.ground, -34));
          drawRect(sx + 8 + (n % 10), sy + 10 + ((n >> 6) % 11), 4, 4, theme.accent);
        }
        if (place.theme === "forge" && roll > 82) drawForgeSpark(sx + 12, sy + 9, theme);
      } else if (place?.theme === "goblin") {
        if (roll < 42) {
          drawRect(sx + 5 + (n % 18), sy + 16 + ((n >> 5) % 8), 6, 6, roll % 2 ? "#ff6f69" : "#8ce06f");
          drawRect(sx + 7 + (n % 18), sy + 21 + ((n >> 5) % 8), 2, 5, "#d9d1a6");
        }
        if (roll > 86) drawRect(sx + 19, sy + 8, 7, 5, "#071018");
      } else if (place?.theme === "harbor" || place?.theme === "island") {
        if (roll < 44) {
          drawRect(sx + 4, sy + 9 + (n % 16), 23, 2, "#704c32");
          drawRect(sx + 8 + ((n >> 5) % 14), sy + 7, 3, 22, "#8b643d");
        }
        if (roll > 80) drawRect(sx + 20, sy + 8, 6, 12, "#d4f4ff");
      } else if (place?.theme === "alien") {
        if (roll < 62) {
          drawRect(sx + 4, sy + 15, 24, 2, theme.trim);
          drawRect(sx + 15, sy + 4, 2, 24, theme.accent);
          drawRect(sx + 7 + (n % 16), sy + 7 + ((n >> 4) % 16), 3, 3, roll % 2 ? "#ff72e1" : "#60d394");
        }
      } else if (place?.theme === "duel") {
        if (roll < 66) {
          drawRect(sx + 4, sy + 15, 24, 2, roll % 2 ? theme.trim : theme.accent);
          drawRect(sx + 15, sy + 4, 2, 24, roll % 3 ? theme.detail : "#fff6d7");
          drawRect(sx + 6 + (n % 16), sy + 6 + ((n >> 4) % 16), 5, 5, "#071018");
          drawRect(sx + 8 + (n % 16), sy + 8 + ((n >> 4) % 16), 2, 2, roll % 2 ? "#4ed5cf" : "#ff72e1");
        }
      } else if (place?.theme === "brainrot") {
        if (roll < 9) {
          const glitch = roll % 3 === 0 ? "#ff72e1" : roll % 3 === 1 ? "#60d394" : "#f3d35b";
          drawRect(sx + 3 + (n % 19), sy + 5 + ((n >> 4) % 18), roll % 2 ? 12 : 5, roll % 2 ? 2 : 8, "#071018");
          drawRect(sx + 5 + (n % 17), sy + 6 + ((n >> 4) % 16), roll % 2 ? 8 : 3, roll % 2 ? 1 : 6, glitch);
          if (roll > 6) drawRect(sx + 7, sy + 7, 14, 2, "rgba(255,255,255,0.1)");
        }
      } else if (place?.theme === "citadel") {
        if (roll < 42) {
          drawRect(sx + 6, sy + 6, 4, 20, "#d6b85f");
          drawRect(sx + 22, sy + 6, 4, 20, "#d6b85f");
          drawRect(sx + 10, sy + 12, 12, 3, "#e9e4ff");
        }
      }
      return;
    }
    if (["ogreGrass", "rockGrass", "mushGrass", "memeGrass"].includes(tile) && n % 5 === 0) {
      const c1 = tile === "memeGrass" ? "#ff72e1" : tile === "mushGrass" ? "#ff6f69" : "#d8f0a3";
      const c2 = tile === "memeGrass" ? "#60d394" : "#f3d35b";
      drawFlowerClump(sx + 4 + (n % 18), sy + 5 + ((n >> 4) % 18), c1, c2);
    }
    if ((tile === "dirt" || tile === "mountain" || tile === "cave") && n % 4 === 0) {
      drawRect(sx + 4 + (n % 16), sy + 6 + ((n >> 3) % 18), 10, 2, "rgba(0,0,0,0.22)");
      drawRect(sx + 7 + (n % 14), sy + 10 + ((n >> 5) % 14), 5, 4, "rgba(255,255,255,0.08)");
    }
  }

  function drawFlowerClump(x, y, c1, c2) {
    drawRect(x, y + 4, 3, 7, "#5f9c4b");
    drawRect(x + 6, y + 3, 3, 8, "#5f9c4b");
    drawRect(x - 1, y + 2, 5, 3, c1);
    drawRect(x + 5, y, 5, 3, c2);
    drawRect(x + 11, y + 5, 4, 3, c1);
  }

  function drawForgeSpark(x, y, theme) {
    drawRect(x, y + 5, 12, 6, "#071018");
    drawRect(x + 2, y + 3, 8, 8, "#f15d3a");
    drawRect(x + 5, y, 4, 5, "#f3d35b");
    drawRect(x + 8, y + 7, 6, 3, theme.accent);
  }

  function drawTile(tile, sx, sy, x, y) {
    const place = placeAt(x, y);
    const theme = place ? TOWN_THEMES[place.theme] : null;
    const colors = {
      deepWater: "#1f6598",
      river: "#3c9ac5",
      beach: "#dfca8e",
      bridge: "#9b7245",
      dirt: "#8e7b54",
      ogreGrass: "#5f9c4b",
      rockGrass: "#6d8754",
      mountain: "#70645a",
      path: "#c7aa6a",
      town: "#b7c989",
      techfloor: "#435c70",
      circuit: "#263f56",
      neonGrass: "#2f7b88",
      metal: "#596c7d",
      void: "#101224",
      cave: "#514a47",
      moss: "#4e7045",
      mushGrass: "#537f4c",
      slime: "#6eb85c",
      memeGrass: "#a05cac",
      checker: "#6d5ec2",
      memeFloor: "#9456a2",
      citadel: "#8d8fa0",
      wall: "#222832",
      glitchWall: "#34284c",
      lab: "#f0e6bc",
      pc: "#d35f62",
      shop: "#61a2d8",
      gym: "#f2c14e",
      elite: "#e9e4ff",
      switch: "#ff72e1",
      rift: "#111820",
    };
    const usedPremiumTile = drawPremiumTerrainTile(tile, sx, sy, x, y, place);
    if (!usedPremiumTile) {
    drawRect(sx, sy, TILE, TILE, themedTileColor(tile, theme, colors[tile] || "#6f8f5e"));
    const n = hash(`${x}:${y}:${tile}`);
    drawRect(sx, sy + TILE - 1, TILE, 1, "rgba(0,0,0,0.055)");
    drawRect(sx, sy, TILE, 1, "rgba(255,255,255,0.025)");
    if (tile === "deepWater" || tile === "river") {
      const foam = tile === "river" ? "#d4f4ff" : "#9ed5ee";
      const shadow = tile === "river" ? "#277ca8" : "#164d7b";
      for (let i = 0; i < 3; i += 1) {
        const px = sx + (((n >> (i * 5)) + Math.floor(state.anim / (28 + i * 9))) & 21) + 2;
        const py = sy + ((n >> (i * 4)) & 18) + 5;
        drawRect(px, py, 9, 2, foam);
        drawRect(px + 3, py + 2, 7, 1, shadow);
      }
      if (tile === "river") {
        drawRect(sx + 2, sy + 7, 3, 19, "rgba(255,255,255,0.16)");
        drawRect(sx + 26, sy + 4, 2, 23, "rgba(0,0,0,0.14)");
      }
    }
    if (tile === "beach") {
      drawRect(sx, sy, TILE, 3, "#f2dfa3");
      drawRect(sx + 3, sy + 24, 20, 2, "#b9985e");
      for (let i = 0; i < 4; i += 1) {
        drawRect(sx + ((n >> (i * 4)) & 24) + 2, sy + ((n >> (i * 3)) & 22) + 4, 2, 2, "#c9aa66");
      }
    }
    if (tile === "bridge") {
      drawRect(sx, sy, TILE, TILE, "#8b643d");
      drawRect(sx, sy + 5, TILE, 3, "#d1a267");
      drawRect(sx, sy + 15, TILE, 3, "#d1a267");
      drawRect(sx, sy + 25, TILE, 3, "#d1a267");
      drawRect(sx + 5, sy, 3, TILE, "#4d3726");
      drawRect(sx + 23, sy, 3, TILE, "#4d3726");
    }
    const themedSettlement = theme && ["town", "path", "techfloor", "memeFloor", "citadel", "bridge"].includes(tile);
    if (themedSettlement) {
      drawThemedSettlementTile(tile, sx, sy, x, y, theme, place, n);
    }
    if (!themedSettlement && tile === "town") {
      drawRect(sx + 4, sy + 5, 5, 5, "#d8e5a4");
      drawRect(sx + 20, sy + 18, 6, 4, "#7aa95f");
      drawRect(sx + 11, sy + 25, 3, 3, "#f3d35b");
    }
    if (!themedSettlement && tile === "path") {
      for (let i = 0; i < 3; i += 1) {
        drawRect(sx + ((n >> (i * 5)) & 23) + 3, sy + ((n >> (i * 4)) & 21) + 4, 4, 3, "#8e7b54");
      }
    }
    if (tile === "dirt" || tile === "moss") {
      drawRect(sx + 5, sy + 7, 7, 3, shade(colors[tile], 18));
      drawRect(sx + 19, sy + 21, 8, 3, shade(colors[tile], -18));
    }
    if (["ogreGrass", "rockGrass", "neonGrass", "mushGrass", "memeGrass"].includes(tile)) {
      for (let i = 0; i < 4; i += 1) {
        const px = sx + ((n >> (i * 3)) & 23) + 3;
        const py = sy + ((n >> (i * 4)) & 20) + 6;
        drawRect(px, py, 3, 10, tile === "memeGrass" ? "#ffcfef" : tile === "neonGrass" ? "#4ed5cf" : "#d8f0a3");
        if (i === 0) drawRect(px - 1, py - 2, 5, 3, tile === "mushGrass" ? "#ff6f69" : "#f3d35b");
      }
    }
    if (tile === "circuit" || (!themedSettlement && tile === "techfloor")) {
      drawRect(sx + 4, sy + 14, 24, 3, "#4ed5cf");
      drawRect(sx + 14, sy + 4, 3, 24, "#f4d64d");
      drawRect(sx + 5, sy + 5, 6, 6, "#101820");
      drawRect(sx + 21, sy + 21, 6, 6, "#101820");
      drawRect(sx + 7, sy + 7, 2, 2, "#60d394");
      drawRect(sx + 23, sy + 23, 2, 2, "#ff72e1");
    }
    if (tile === "checker") {
      drawBrainrotFloorTile(sx, sy, n, TOWN_THEMES.brainrot);
    }
    if (tile === "slime") {
      drawRect(sx + 6, sy + 8, 8, 5, "#9fe76f");
      drawRect(sx + 20, sy + 22, 6, 4, "#4d9f54");
    }
    if (tile === "cave") {
      drawRect(sx + 5, sy + 21, 7, 7, "#ff6f69");
      drawRect(sx + 7, sy + 27, 3, 4, "#d9d1a6");
      drawRect(sx + 20, sy + 8, 8, 5, "#665b58");
    }
    drawTerrainBlend(tile, sx, sy, x, y, theme);
    drawMicroDecor(tile, sx, sy, x, y, theme, n);
    if (tile === "mountain" || tile === "wall" || tile === "glitchWall") {
      drawRect(sx + 6, sy + 8, 20, 18, shade(colors[tile] || "#333", -20));
      drawRect(sx + 12, sy + 4, 8, 8, shade(colors[tile] || "#333", 18));
      drawRect(sx + 9, sy + 15, 14, 3, "rgba(255,255,255,0.08)");
      if (tile === "glitchWall") {
        drawRect(sx + 3, sy + 6, 8, 3, "#ff72e1");
        drawRect(sx + 20, sy + 24, 8, 3, "#4ed5cf");
      }
    }
    if (tile === "ogreGrass" && n % 29 === 0) drawWorldAsset("tree", sx, sy);
    if ((tile === "rockGrass" || tile === "mountain") && n % 13 === 0) drawWorldAsset("rock", sx, sy);
    if ((tile === "cave" || tile === "mushGrass") && n % 17 === 0) drawWorldAsset("mushroom", sx, sy);
    if ((tile === "circuit" || tile === "neonGrass") && n % 23 === 0) drawWorldAsset("neon-tower", sx, sy);
    if ((tile === "slime" || tile === "memeGrass") && n % 19 === 0) drawWorldAsset("slime-prop", sx, sy);
    if (["lab", "pc", "shop", "gym", "elite"].includes(tile)) {
      const markerTheme = townThemeAt(x, y) || TOWN_THEMES.meadow;
      drawRect(sx + 5, sy + 18, 22, 10, "#071018");
      drawRect(sx + 7, sy + 20, 18, 6, markerTheme.trim);
    }
    if (tile === "switch") {
      const markerTheme = townThemeAt(x, y) || TOWN_THEMES.brainrot;
      drawRect(sx + 10, sy + 18, 12, 8, "#071018");
      drawRect(sx + 12, sy + 20, 8, 4, markerTheme.trim);
    }
    if (tile === "rift") {
      drawRect(sx + 5, sy + 22, 22, 6, "#071018");
      drawRect(sx + 8, sy + 23, 16, 3, "#ff72e1");
    }
    }
    if (usedPremiumTile) {
      drawPremiumTerrainMotion(tile, sx, sy, x, y);
      drawTerrainBlend(tile, sx, sy, x, y, theme);
      drawPremiumTerrainObjects(tile, sx, sy, x, y);
    }
    drawTileFinalPixelPolish(tile, sx, sy, x, y, theme, usedPremiumTile);
  }

  function drawTileFinalPixelPolish(tile, sx, sy, x, y, theme, premium) {
    const n = hash(`${x}:${y}:${tile}:final-polish`);
    if (isWaterLike(tile)) {
      const foam = tile === "river" ? "#d4f4ff" : "#9ed5ee";
      if (n % 3 === 0) {
        const drift = Math.floor(state.anim / (38 + (n % 17)));
        drawRect(sx + ((n + drift) % 23) + 2, sy + ((n >> 4) % 20) + 5, 7, 1, foam);
      }
      if (n % 11 === 0) drawRect(sx + 4, sy + 25, 20, 2, "rgba(255,255,255,0.11)");
      return;
    }

    if (isPathLike(tile) || tile === "town") {
      const trim = theme?.trim || "#d9d1a6";
      const dark = theme ? shade(theme.ground || theme.path, -34) : "#7e6b47";
      if (n % 2 === 0) drawRect(sx + 4 + (n % 20), sy + 7 + ((n >> 5) % 17), 4, 2, dark);
      if (n % 5 === 0) drawRect(sx + 6, sy + 5 + ((n >> 3) % 18), 2, 10, trim);
      if (tile === "town") {
        drawRect(sx + 2, sy + 2, 6, 2, "rgba(255,255,255,0.12)");
        drawRect(sx + 24, sy + 27, 5, 2, "rgba(0,0,0,0.16)");
      }
      return;
    }

    if (["techfloor", "circuit", "metal", "citadel"].includes(tile)) {
      const pulse = n % 3 === 0 ? "#4ed5cf" : "#f3d35b";
      drawRect(sx + 3 + (n % 21), sy + 6, 2, 20, "rgba(7,16,24,0.38)");
      if (n % 4 === 0) drawRect(sx + 6, sy + 9 + ((n >> 4) % 15), 20, 2, pulse);
      if (tile === "citadel") {
        drawRect(sx + 5, sy + 5, 22, 2, "#d6b85f");
        drawRect(sx + 5, sy + 25, 22, 2, "#071018");
      }
      return;
    }

    if (tile === "memeFloor" || tile === "checker") {
      if (n % 31 === 0) {
        const c = n % 9 === 0 ? "rgba(96,211,148,0.72)" : n % 9 === 3 ? "rgba(255,114,225,0.72)" : "rgba(243,211,91,0.66)";
        drawRect(sx + 3 + (n % 18), sy + 5 + ((n >> 3) % 19), n % 2 ? 10 : 5, n % 2 ? 2 : 8, "#071018");
        drawRect(sx + 5 + (n % 16), sy + 6 + ((n >> 3) % 17), n % 2 ? 6 : 3, n % 2 ? 1 : 5, c);
      }
      drawRect(sx + 2, sy + 29, 28, 1, "rgba(2,5,10,0.22)");
      return;
    }

    if (["ogreGrass", "rockGrass", "mushGrass", "memeGrass", "neonGrass", "moss"].includes(tile)) {
      if (n % (premium ? 4 : 7) === 0) {
        const c = tile === "neonGrass" ? "#4ed5cf" : tile === "memeGrass" ? "#ff72e1" : tile === "mushGrass" ? "#ff6f69" : "#d8f0a3";
        drawRect(sx + 6 + (n % 18), sy + 8 + ((n >> 5) % 15), 3, 9, c);
        drawRect(sx + 5 + (n % 18), sy + 6 + ((n >> 5) % 15), 5, 3, tile === "memeGrass" ? "#60d394" : "#f3d35b");
      }
      if (n % 13 === 0) drawRect(sx + 4, sy + 25, 22, 2, "rgba(2,5,10,0.14)");
      return;
    }

    if (["mountain", "wall", "glitchWall", "cave"].includes(tile)) {
      drawRect(sx + 4 + (n % 15), sy + 5 + ((n >> 3) % 16), 11, 2, "rgba(255,255,255,0.08)");
      drawRect(sx + 9 + ((n >> 4) % 12), sy + 17 + ((n >> 7) % 8), 12, 3, "rgba(2,5,10,0.18)");
      if (tile === "glitchWall" && n % 5 === 0) drawRect(sx + 5, sy + 7, 22, 3, n % 2 ? "#ff72e1" : "#4ed5cf");
    }
  }

  function drawPremiumTerrainMotion(tile, sx, sy, x, y) {
    const n = hash(`${x}:${y}:${tile}:motion`);
    if (tile === "deepWater" || tile === "river") {
      const foam = tile === "river" ? "#d4f4ff" : "#9ed5ee";
      const shadow = tile === "river" ? "#277ca8" : "#164d7b";
      for (let i = 0; i < 3; i += 1) {
        const px = sx + (((n >> (i * 5)) + Math.floor(state.anim / (34 + i * 10))) & 21) + 2;
        const py = sy + ((n >> (i * 4)) & 18) + 5;
        drawRect(px, py, 8, 2, foam);
        drawRect(px + 3, py + 2, 6, 1, shadow);
      }
    }
    if (tile === "checker" || tile === "memeFloor") {
      if (n % 13 !== 0) return;
      const glitch = n % 3 === 0 ? "#ff72e1" : n % 3 === 1 ? "#60d394" : "#f3d35b";
      drawRect(sx + 3 + ((n >> 4) % 18), sy + 6 + ((n >> 8) % 17), 10, 3, "#071018");
      drawRect(sx + 5 + ((n >> 4) % 16), sy + 7 + ((n >> 8) % 15), 6, 1, glitch);
    }
  }

  function drawPremiumTerrainObjects(tile, sx, sy, x, y) {
    const n = hash(`${x}:${y}:${tile}:objects`);
    if (tile === "ogreGrass" && n % 29 === 0) drawWorldAsset("tree", sx, sy);
    if ((tile === "rockGrass" || tile === "mountain") && n % 13 === 0) drawWorldAsset("rock", sx, sy);
    if ((tile === "cave" || tile === "mushGrass") && n % 17 === 0) drawWorldAsset("mushroom", sx, sy);
    if ((tile === "circuit" || tile === "neonGrass") && n % 23 === 0) drawWorldAsset("neon-tower", sx, sy);
    if ((tile === "slime" || tile === "memeGrass") && n % 19 === 0) drawWorldAsset("slime-prop", sx, sy);
  }

  function drawBuilding(tile, sx, sy, x, y) {
    const place = placeAt(x, y);
    const theme = place ? TOWN_THEMES[place.theme] : null;
    if (drawWorldAsset(tile, sx, sy)) {
      drawBuildingAccent(tile, sx, sy, theme);
      return;
    }
    const roof = theme?.roof || { lab: "#b87d4b", pc: "#d13f47", shop: "#397cc6", gym: "#c08f2f", elite: "#9d8be5" }[tile];
    drawRect(sx + 1, sy + 5, 30, 24, "#071018");
    drawRect(sx + 3, sy + 7, 26, 20, "#fff2ca");
    drawRect(sx + 0, sy + 2, 32, 9, "#071018");
    drawRect(sx + 2, sy + 1, 28, 9, roof);
    drawRect(sx + 6, sy + 10, 20, 3, shade(roof, 26));
    drawRect(sx + 12, sy + 17, 8, 10, "#30394a");
    drawRect(sx + 14, sy + 18, 2, 2, "#f3d35b");
    drawRect(sx + 5, sy + 13, 7, 5, "#77c6ef");
    drawRect(sx + 20, sy + 13, 7, 5, "#77c6ef");
    const sign = { lab: "L", pc: "+", shop: "$", gym: "T", elite: "C" }[tile] || "";
    drawPixelText(sign, sx + 13, sy + 4, 1, "#fff6d7", null);
    drawBuildingAccent(tile, sx, sy, theme);
  }

  function drawBuildingAccent(tile, sx, sy, theme) {
    if (!theme) return;
    drawRect(sx + 3, sy + 2, 26, 3, theme.trim);
    drawRect(sx + 6, sy + 8, 20, 3, theme.accent);
    if (tile === "gym") {
      drawRect(sx + 3, sy + 25, 26, 4, "#071018");
      drawRect(sx + 5, sy + 25, 22, 2, theme.trim);
      drawRect(sx + 2, sy + 10, 5, 14, theme.dark);
      drawRect(sx + 25, sy + 10, 5, 14, theme.dark);
    }
    if (tile === "elite") {
      drawRect(sx + 8, sy - 2, 16, 5, theme.accent);
      drawRect(sx + 14, sy - 8, 4, 7, theme.trim);
    }
    if (tile === "pc") {
      drawRect(sx + 10, sy + 14, 12, 4, "#ff6f69");
      drawRect(sx + 14, sy + 10, 4, 12, "#ff6f69");
    }
    if (tile === "shop") {
      drawRect(sx + 7, sy + 12, 18, 4, theme.trim);
      drawRect(sx + 10, sy + 18, 12, 3, theme.accent);
    }
  }

  function drawTrainerWorldSprite(sprite, sx, sy, bob = 0) {
    const key = trainerAssetKey(sprite);
    const img = getTrainerAssetImage(key, "world");
    if (!img) return false;
    const targetH = {
      ogre: 74,
      guard: 70,
      villain: 72,
      goblin: 66,
      champion: 70,
      player: 66,
      prof: 68,
      mom: 66,
      kid: 60,
      trainer: 66,
      alien: 70,
      brainrot: 70,
    }[key] || 58;
    const scale = targetH / img.naturalHeight;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const feetX = sx + 16;
    const feetY = sy + 34 + bob;
    drawEllipse(feetX, sy + 33, Math.max(30, w * 0.76), 9, "rgba(0,0,0,0.36)");
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = "rgba(0,0,0,0.33)";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(img, Math.round(feetX - w / 2), Math.round(feetY - h), w, h);
    ctx.restore();
    if (key === "villain" || key === "brainrot") {
      const flicker = Math.floor((state.anim / 120 + sx + sy) % 3);
      drawRect(feetX - 16 + flicker * 8, feetY - h - 4, 5, 5, key === "villain" ? "#ff72e1" : "#60d394");
      drawRect(feetX + 11 - flicker * 5, feetY - Math.floor(h * 0.5), 12, 3, key === "villain" ? "#60d394" : "#ff72e1");
    }
    return true;
  }

  function drawNpc(npc, sx, sy) {
    const sprite = npc.sprite || npc.trainer?.clan || "trainer";
    const bob = Math.floor(Math.sin(state.anim / 220 + npc.x * 0.7 + npc.y) * 1);
    if (drawTrainerWorldSprite(sprite, sx, sy, bob)) return;
    drawEllipse(sx + 16, sy + 31, 24, 7, "rgba(0,0,0,0.28)");
    const pxr = (x, y, w, h, c) => drawRect(sx + x, sy + y + bob, w, h, c);
    if (sprite === "ogre") {
      pxr(6, 14, 20, 16, "#071018");
      pxr(7, 15, 18, 14, "#8aa65f");
      pxr(4, 18, 6, 10, "#d38b45");
      pxr(22, 18, 6, 10, "#d38b45");
      pxr(8, 5, 16, 12, "#071018");
      pxr(9, 6, 14, 11, "#c99662");
      pxr(5, 4, 7, 6, "#f3d35b");
      pxr(20, 4, 7, 6, "#f3d35b");
      pxr(10, 28, 6, 4, "#071018");
      pxr(18, 28, 6, 4, "#071018");
    } else if (sprite === "goblin") {
      pxr(8, 17, 17, 13, "#071018");
      pxr(9, 18, 15, 11, "#4b344d");
      pxr(9, 7, 14, 11, "#071018");
      pxr(10, 8, 12, 10, "#8ce06f");
      pxr(3, 9, 8, 5, "#8ce06f");
      pxr(21, 9, 8, 5, "#8ce06f");
      pxr(11, 21, 10, 4, "#f3d35b");
      pxr(9, 28, 5, 4, "#071018");
      pxr(19, 28, 5, 4, "#071018");
    } else if (sprite === "alien") {
      pxr(9, 16, 15, 14, "#071018");
      pxr(10, 17, 13, 12, "#4ed5cf");
      pxr(5, 7, 23, 13, "#071018");
      pxr(6, 8, 21, 11, "#9456d1");
      pxr(12, 11, 8, 4, "#101820");
      pxr(15, 1, 2, 8, "#4ed5cf");
      pxr(13, 0, 6, 3, "#f3d35b");
      pxr(8, 28, 6, 4, "#071018");
      pxr(20, 28, 6, 4, "#071018");
    } else if (sprite === "brainrot") {
      pxr(7, 17, 19, 13, "#071018");
      pxr(8, 18, 17, 11, "#ff72e1");
      pxr(10, 7, 13, 12, "#071018");
      pxr(11, 8, 11, 10, "#60d394");
      pxr(8, 4, 17, 4, "#f3d35b");
      pxr(10, 1, 4, 5, "#f3d35b");
      pxr(18, 1, 4, 5, "#f3d35b");
      pxr(6, 20, 4, 8, "#f3d35b");
      pxr(23, 20, 4, 8, "#4ed5cf");
      pxr(10, 28, 5, 4, "#071018");
      pxr(18, 28, 5, 4, "#071018");
    } else if (sprite === "villain") {
      pxr(7, 15, 19, 16, "#071018");
      pxr(8, 16, 17, 14, "#292536");
      pxr(8, 6, 17, 13, "#071018");
      pxr(10, 8, 13, 10, "#1d1a25");
      pxr(9, 13, 15, 3, "#ff72e1");
      pxr(5, 19, 5, 9, "#ff72e1");
      pxr(22, 19, 5, 9, "#ff72e1");
      pxr(10, 28, 5, 4, "#071018");
      pxr(18, 28, 5, 4, "#071018");
    } else if (sprite === "guard") {
      pxr(7, 15, 19, 15, "#071018");
      pxr(8, 16, 17, 13, "#aeb9c2");
      pxr(8, 6, 17, 12, "#071018");
      pxr(9, 7, 15, 10, "#d9d1a6");
      pxr(8, 5, 17, 4, "#596c7d");
      pxr(11, 20, 10, 3, "#f3d35b");
      pxr(10, 28, 5, 4, "#071018");
      pxr(18, 28, 5, 4, "#071018");
    } else {
      pxr(8, 16, 17, 14, "#071018");
      pxr(9, 17, 15, 12, "#397cc6");
      pxr(9, 7, 14, 11, "#071018");
      pxr(10, 8, 12, 10, "#f0c38a");
      pxr(7, 4, 18, 6, "#f3d35b");
      pxr(9, 28, 5, 4, "#071018");
      pxr(19, 28, 5, 4, "#071018");
    }
    pxr(12, 11, 3, 3, "#071018");
    pxr(18, 11, 3, 3, "#071018");
  }

  function drawPlayer(sx, sy, facing) {
    const bob = Math.floor(Math.sin(state.anim / 110) * 1);
    if (drawTrainerWorldSprite("player", sx, sy, bob)) return;
    drawEllipse(sx + 16, sy + 31, 24, 7, "rgba(0,0,0,0.28)");
    drawRect(sx + 8, sy + 5 + bob, 16, 14, "#071018");
    drawRect(sx + 9, sy + 6 + bob, 14, 12, "#f0c38a");
    drawRect(sx + 6, sy + 16 + bob, 20, 15, "#071018");
    drawRect(sx + 7, sy + 17 + bob, 18, 13, "#3f7fc2");
    drawRect(sx + 7, sy + 3 + bob, 18, 8, "#071018");
    drawRect(sx + 8, sy + 4 + bob, 16, 6, "#e54f4f");
    drawRect(sx + 9, sy + 6 + bob, 14, 2, "#fff6d7");
    drawRect(sx + 10, sy + 29, 5, 3, "#071018");
    drawRect(sx + 18, sy + 29, 5, 3, "#071018");
    if (facing !== "up") {
      drawRect(sx + 12, sy + 11 + bob, 3, 3, "#071018");
      drawRect(sx + 18, sy + 11 + bob, 3, 3, "#071018");
    }
  }

  function drawOverlays() {
    if (timeOfDay() === "Night") {
      ctx.fillStyle = "rgba(11, 18, 41, 0.28)";
      ctx.fillRect(0, 0, W, H);
    }
    const weather = weatherName();
    drawWeatherLayer(weather);
    const biome = currentBiome();
    const accent = biomeAccent(biome);
    const alt = biomeAccentAlt(biome);
    drawHudPlate(8, 8, 246, 34, currentLocationName(), "", accent, alt);
    drawHudPlate(264, 8, 132, 34, `${timeOfDay()} / ${weather}`, "", alt, accent);
    drawHudPlate(406, 8, 92, 34, `Sigils ${state.player.badges.length}/8`, "", "#f3d35b", accent);
    const step = activeStoryStep();
    const routeLine = `CH ${step.chapter} ${step.target} / ${destinationDistance(step)} STEPS`.toUpperCase().slice(0, 60);
    const objective = ribbonObjectiveText(step).toUpperCase().slice(0, 60);
    drawCompactFrame(8, 46, 492, 42, "#f3d35b", accent, "#101820");
    drawRect(20, 58, 92, 3, "#f3d35b");
    drawRect(118, 58, 348, 2, "#3a4b5b");
    drawPixelText(routeLine, 20, 69, 1, "#f3d35b", null);
    drawPixelText(objective, 20, 82, 1, "#fff6d7", null);
    drawFieldNavigator(step, accent, alt);
  }

  function drawFieldNavigator(step, accent, alt) {
    if (!state.player || !step) return;
    const x = 508;
    const y = 8;
    const w = 122;
    const h = 80;
    const mapX = x + 10;
    const mapY = y + 19;
    const mapW = 102;
    const mapH = 36;
    drawCompactFrame(x, y, w, h, accent, alt, "#101820");
    drawRect(x + 10, y + 15, 36, 3, accent);
    drawRect(x + 51, y + 15, 48, 3, "#3a4b5b");
    drawPixelText("FIELD NAV", x + 12, y + 22, 1, "#fff6d7", null);
    drawRect(x + 98, y + 18, 10, 10, "#02050a");
    drawRect(x + 101, y + 21, 4, 4, alt);
    drawRect(mapX, mapY + 8, mapW, mapH, "#02050a");
    drawRect(mapX + 2, mapY + 10, mapW / 2 - 3, mapH / 2 - 3, "#2d4b39");
    drawRect(mapX + mapW / 2 + 1, mapY + 10, mapW / 2 - 3, mapH / 2 - 3, "#21364f");
    drawRect(mapX + 2, mapY + mapH / 2 + 9, mapW / 2 - 3, mapH / 2 - 3, "#3b342f");
    drawRect(mapX + mapW / 2 + 1, mapY + mapH / 2 + 9, mapW / 2 - 3, mapH / 2 - 3, "#3f2a52");
    drawRect(mapX + 2, mapY + 8 + Math.floor(mapH / 2), mapW - 4, 1, "rgba(255,255,255,0.12)");
    drawRect(mapX + Math.floor(mapW / 2), mapY + 10, 1, mapH - 4, "rgba(255,255,255,0.12)");
    const px = Math.round(mapX + 3 + (state.player.x / Math.max(1, WORLD_W - 1)) * (mapW - 7));
    const py = Math.round(mapY + 11 + (state.player.y / Math.max(1, WORLD_H - 1)) * (mapH - 7));
    const tx = Math.round(mapX + 3 + (step.x / Math.max(1, WORLD_W - 1)) * (mapW - 7));
    const ty = Math.round(mapY + 11 + (step.y / Math.max(1, WORLD_H - 1)) * (mapH - 7));
    drawRect(Math.min(px, tx), py, Math.max(2, Math.abs(tx - px)), 2, "rgba(255,246,215,0.42)");
    drawRect(tx, Math.min(py, ty), 2, Math.max(2, Math.abs(ty - py)), "rgba(255,246,215,0.42)");
    drawRect(tx - 4, ty - 4, 9, 9, "#071018");
    drawRect(tx - 2, ty - 2, 5, 5, alt);
    drawRect(px - 4, py - 4, 9, 9, "#071018");
    drawRect(px - 2, py - 2, 5, 5, "#f3d35b");
    drawObjectiveArrowPixels(x + 22, y + 66, step.x - state.player.x, step.y - state.player.y, accent, alt);
    drawPixelText(`CH ${step.chapter}`, x + 43, y + 62, 1, "#f3d35b", null);
    drawPixelText(`${destinationDistance(step)} ST`, x + 43, y + 73, 1, "#fff6d7", null);
  }

  function drawWeatherLayer(weather) {
    if (weather === "Glitch Rain") {
      for (let i = 0; i < 16; i += 1) {
        const x = (i * 71 + Math.floor(state.anim / 9)) % W;
        const y = (i * 83 + Math.floor(state.anim / 5)) % H;
        drawRect(x, y, i % 3 ? 8 : 3, i % 3 ? 2 : 8, i % 2 ? "#ff72e1" : "#60d394");
      }
    } else if (weather === "Meteor Drizzle") {
      for (let i = 0; i < 14; i += 1) {
        const x = (i * 89 + Math.floor(state.anim / 5)) % W;
        const y = (i * 29 + Math.floor(state.anim / 4)) % H;
        drawRect(x, y, 3, 12, "#f3d35b");
      }
    } else if (weather === "Warren Fog") {
      for (let i = 0; i < 7; i += 1) {
        const x = (i * 104 + Math.floor(state.anim / 22)) % (W + 90) - 60;
        const y = 68 + ((i * 47) % 260);
        drawRect(x, y, 78, 4, "rgba(217,209,166,0.18)");
        drawRect(x + 22, y + 8, 54, 3, "rgba(140,224,111,0.12)");
      }
    } else if (weather === "Highland Gusts") {
      for (let i = 0; i < 9; i += 1) {
        const x = (W - ((i * 91 + Math.floor(state.anim / 9)) % (W + 60)));
        const y = 96 + ((i * 41) % 270);
        drawRect(x, y, 42, 3, "rgba(216,240,163,0.26)");
        drawRect(x + 12, y + 5, 28, 2, "rgba(222,122,59,0.2)");
      }
    }
  }

  function drawBattle() {
    const battle = state.battle;
    if (!battle) return drawOverworld();
    const shake = battleShakeOffset();
    const biome = currentBiome();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    drawBattleBackdrop(biome);
    drawBattlePlatforms(biome);
    drawBattleSceneFocus(biome);
    drawBattleTempoLines();
    const playerSpecies = SPECIES_BY_ID[activePlayer().id];
    const enemySpecies = SPECIES_BY_ID[activeEnemy().id];
    drawBattleActorStage(playerSpecies, 160, 336, 236, 76, biome, "you");
    drawBattleActorStage(enemySpecies, 486, 174, 204, 62, biome, "foe");
    drawBattleActorSpotlight(playerSpecies, 160, 300, 176, 112, biome, "you");
    drawBattleActorSpotlight(enemySpecies, 486, 140, 146, 92, biome, "foe");
    drawCreatureSprite(playerSpecies, 160, 300, 2.86, true, "you");
    drawCreatureSprite(enemySpecies, 486, 140, 2.72, false, "foe");
    drawBattleFx();
    drawBattleForegroundDepth(biome);
    ctx.restore();
    drawBattleArenaChrome(biome);
    drawBattleHud(activeEnemy(), 32, 32, false);
    drawBattleHud(activePlayer(), 365, 330, true);
    drawBattleMessageBox(battle);
    drawScreenTexture("rgba(255,255,255,0.025)", 7);
  }

  function drawPvpBattle() {
    const view = state.pvp?.view;
    if (!view) {
      drawRect(0, 0, W, H, "#071018");
      drawRect(72, 162, 496, 126, "#02050a");
      drawRect(80, 170, 480, 110, "#17222d");
      drawRect(104, 190, 170, 5, "#60d394");
      drawPixelText("SERVER DUEL ROOM", 118, 220, 2, "#f3d35b", "#071018");
      drawPixelText("WAITING FOR AUTHORITATIVE STATE", 120, 250, 1, "#fff6d7", null);
      return;
    }
    const biome = "pvp";
    drawPvpArenaBackdrop(view);
    const youSpecies = SPECIES_BY_ID[view.you.creature.speciesId] || SPECIES_BY_ID.OGR001;
    const foeSpecies = SPECIES_BY_ID[view.foe.creature.speciesId] || SPECIES_BY_ID.ALN001;
    drawBattleActorStage(youSpecies, 160, 336, 236, 76, biome, "you");
    drawBattleActorStage(foeSpecies, 486, 174, 204, 62, biome, "foe");
    drawBattleActorSpotlight(youSpecies, 160, 300, 176, 112, biome, "you");
    drawBattleActorSpotlight(foeSpecies, 486, 140, 146, 92, biome, "foe");
    drawCreatureSprite(youSpecies, 160, 300, 2.86, true, "you");
    drawCreatureSprite(foeSpecies, 486, 140, 2.72, false, "foe");
    drawPvpServerFx(view);
    drawPvpArenaForeground(view);
    drawPvpArenaChrome(view);
    drawPvpHud(view.foe.creature, view.foe.name, 32, 32, false);
    drawPvpHud(view.you.creature, "YOU", 365, 330, true);
    drawPvpPartyPips(view.foe.party, view.foe.activeIndex, 46, 105);
    drawPvpPartyPips(view.you.party, view.you.activeIndex, 382, 398);
    drawPvpMessageBox(view);
    drawScreenTexture("rgba(255,255,255,0.025)", 7);
  }

  function drawPvpArenaBackdrop(view) {
    const secondsLeft = pvpClockSecondsLeft(view);
    const clockWarn = secondsLeft !== null && secondsLeft <= 10;
    const pulse = (Math.sin(state.anim / 150) + 1) / 2;
    drawRect(0, 0, W, H, "#060b13");
    for (let y = 0; y < 220; y += 8) {
      drawRect(0, y, W, 4, y % 16 ? "#0b1722" : "#101d2a");
    }
    drawRect(22, 44, 596, 126, "#02050a");
    drawRect(30, 52, 580, 110, "#122131");
    drawRect(30, 86, 580, 10, "#273848");
    drawRect(30, 126, 580, 10, "#273848");
    for (let i = 0; i < 64; i += 1) {
      const x = 42 + ((i * 47) % 548);
      const y = 62 + ((i * 29) % 78);
      const color = i % 5 === 0 ? "#f3d35b" : i % 4 === 0 ? "#ff72e1" : i % 3 === 0 ? "#4ed5cf" : "#3a4b5b";
      drawRect(x, y, 7, 4, color);
    }
    drawRect(206, 18, 228, 36, "#02050a");
    drawRect(214, 26, 212, 20, "#17222d");
    drawRect(222, 31, 64, 3, "#4ed5cf");
    drawRect(354, 31, 64, 3, "#f3d35b");
    drawPixelText("PRISM RANKED ARENA", 252, 42, 1, "#fff6d7", null);
    drawRect(274, 70, 92, 58, "#02050a");
    drawRect(282, 78, 76, 42, clockWarn ? "#3b1720" : "#152b25");
    drawRect(292, 86, 56, 4, clockWarn ? "#ff6f69" : "#60d394");
    drawPixelText(secondsLeft === null ? "WIN" : `${String(secondsLeft).padStart(2, "0")} SEC`, 296, 108, 1, "#fff6d7", null);
    drawRect(70, 182, 500, 38, "#02050a");
    drawRect(82, 190, 476, 22, "#1a2a38");
    drawRect(110, 198, 120, 3, "#4ed5cf");
    drawRect(410, 198, 120, 3, "#ff72e1");
    drawPixelText(`TURN ${String(view.turn).padStart(2, "0")}`, 288, 205, 1, "#f3d35b", null);
    drawPvpArenaFloor(pulse);
  }

  function drawPvpArenaFloor(pulse) {
    drawRect(0, 220, W, 188, "#111a22");
    for (let y = 226; y < 408; y += 14) {
      const width = Math.round(80 + (y - 220) * 2.2);
      const x = Math.round((W - width) / 2);
      drawRect(x, y, width, 2, y % 28 ? "#213548" : "#4a5d6b");
    }
    for (let i = -7; i <= 7; i += 1) {
      const x1 = 320 + i * 18;
      const x2 = 320 + i * 44;
      drawRect(x1, 220, 2, 188, i % 2 ? "rgba(78,213,207,0.22)" : "rgba(243,211,91,0.18)");
      drawRect(x2, 390, 3, 18, "#02050a");
    }
    drawEllipse(320, 286, 286, 96, "rgba(2,5,10,0.52)");
    drawEllipse(320, 286, 244, 72, "rgba(78,213,207,0.16)");
    drawEllipse(320, 286, 172 + pulse * 14, 42 + pulse * 5, "rgba(243,211,91,0.12)");
    drawRect(314, 224, 12, 184, "rgba(255,114,225,0.22)");
    drawRect(0, 402, W, 6, "#02050a");
  }

  function drawPvpArenaForeground(view) {
    const pulse = (Math.sin(state.anim / 120) + 1) / 2;
    for (let i = 0; i < 18; i += 1) {
      const x = 18 + i * 36;
      const y = 360 + ((i * 17) % 36);
      const color = i % 3 === 0 ? "#4ed5cf" : i % 3 === 1 ? "#f3d35b" : "#ff72e1";
      drawRect(x, y, 24, 5, "#02050a");
      drawRect(x + 4, y + 1, 16, 2, color);
    }
    if (view.status === "waiting" || view.you.ready) {
      ctx.save();
      ctx.globalAlpha = 0.28 + pulse * 0.18;
      drawRect(114, 242, 92, 5, "#60d394");
      drawRect(440, 110, 92, 5, "#ff72e1");
      ctx.restore();
    }
  }

  function drawPvpArenaChrome(view) {
    const accent = "#4ed5cf";
    const alt = "#f3d35b";
    drawRect(0, 0, W, 6, "#02050a");
    drawRect(0, 402, W, 6, "#02050a");
    drawRect(0, 0, 6, 408, "#02050a");
    drawRect(W - 6, 0, 6, 408, "#02050a");
    drawRect(10, 10, 82, 3, accent);
    drawRect(W - 106, 10, 96, 3, view.status === "complete" ? "#60d394" : "#ff72e1");
    drawRect(10, 395, 136, 3, alt);
    drawRect(W - 156, 395, 146, 3, accent);
    drawRect(222, 10, 196, 20, "#02050a");
    drawRect(226, 14, 188, 12, "#17222d");
    drawRect(232, 17, 30, 2, accent);
    drawRect(378, 17, 30, 2, alt);
    drawPixelText("PRISM SERVER DUEL", 274, 17, 1, "#fff6d7", null);
  }

  function drawPvpServerFx(view) {
    const events = Array.isArray(view.lastEvents) ? view.lastEvents : [];
    const event = [...events].reverse().find((item) => item.kind === "move" || item.kind === "switch" || item.kind === "autoSwitch");
    if (!event) return;
    const pulse = (Math.sin(state.anim / 110) + 1) / 2;
    if (event.kind === "switch" || event.kind === "autoSwitch") {
      const isYou = event.playerId === view.you.playerId;
      const x = isYou ? 160 : 486;
      const y = isYou ? 304 : 144;
      const color = isYou ? TYPE_COLORS[clanPrimaryType(view.you.creature.speciesId)] : TYPE_COLORS[clanPrimaryType(view.foe.creature.speciesId)];
      ctx.save();
      ctx.globalAlpha = 0.28 + pulse * 0.32;
      drawRect(x - 54, y - 70, 108, 5, "#071018");
      drawRect(x - 44, y - 68, 88, 1, color || "#60d394");
      drawRect(x - 42, y + 38, 84, 4, "#071018");
      drawRect(x - 30, y + 40, 60, 1, "#fff6d7");
      ctx.restore();
      return;
    }
    if (!event.hit) return;
    const from = event.attackerId === view.you.playerId ? { x: 174, y: 252 } : { x: 496, y: 140 };
    const to = event.defenderId === view.you.playerId ? { x: 162, y: 300 } : { x: 486, y: 142 };
    const color = TYPE_COLORS[event.type] || "#f3d35b";
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    ctx.save();
    ctx.globalAlpha = 0.18 + pulse * 0.24;
    for (let i = 0; i < 8; i += 1) {
      const p = clamp(pulse - i * 0.05, 0, 1);
      const jitter = ((hashTiny(`${view.id}:${view.turn}:${event.moveId}:${i}`) % 23) - 11);
      const x = from.x + dx * p + jitter;
      const y = from.y + dy * p + ((hashTiny(`${event.attackerId}:${i}`) % 17) - 8);
      drawRect(x - 18, y - 3, 36, 6, "#071018");
      drawRect(x - 14, y - 1, 28, 2, i % 2 ? color : "#fff6d7");
    }
    ctx.restore();
  }

  function drawPvpPartyPips(party, activeIndex, x, y) {
    const slots = Array.isArray(party) && party.length ? party : [];
    slots.slice(0, 6).forEach((member, index) => {
      const px = x + index * 18;
      const active = Boolean(member.active) || index === activeIndex;
      const fainted = Boolean(member.fainted) || member.hp <= 0;
      const color = fainted ? "#6f3037" : active ? "#60d394" : "#263646";
      drawRect(px, y, 13, 13, "#02050a");
      drawRect(px + 2, y + 2, 9, 9, color);
      if (active) drawRect(px + 4, y + 4, 5, 2, "#fff6d7");
    });
  }

  function hashTiny(text) {
    let h = 17;
    for (let i = 0; i < String(text).length; i += 1) h = (h * 31 + String(text).charCodeAt(i)) % 9973;
    return h;
  }

  function drawPvpHud(creature, label, x, y, playerSide) {
    const w = playerSide ? 260 : 270;
    const h = playerSide ? 76 : 70;
    const accent = TYPE_COLORS[clanPrimaryType(creature.speciesId)] || "#60d394";
    drawCompactFrame(x, y, w, h, accent, "#f3d35b", "#17222d");
    drawRect(x + 14, y + 14, 90, 4, accent);
    drawPixelText(String(creature.name || label).toUpperCase().slice(0, 20), x + 18, y + 30, 1, "#fff6d7", null);
    drawPixelText(`LV ${String(creature.level).padStart(2, "0")}`, x + w - 72, y + 30, 1, "#f3d35b", null);
    if (creature.statusLabel) {
      drawRect(x + w - 118, y + 18, 38, 15, "#02050a");
      drawRect(x + w - 115, y + 21, 32, 9, "#59436d");
      drawPixelText(String(creature.statusLabel).slice(0, 4), x + w - 111, y + 28, 1, "#fff6d7", null);
    }
    const pct = clamp(creature.hp / Math.max(1, creature.maxHp), 0, 1);
    drawRect(x + 18, y + 45, w - 54, 9, "#02050a");
    drawRect(x + 22, y + 48, Math.max(2, (w - 62) * pct), 3, pct < 0.25 ? "#ff6f69" : pct < 0.55 ? "#f3d35b" : "#60d394");
    if (playerSide) drawPixelText(`${creature.hp}/${creature.maxHp}`, x + w - 96, y + 64, 1, "#fff6d7", null);
  }

  function drawPvpMessageBox(view) {
    drawRect(12, 410, 616, 62, "#02050a");
    drawRect(18, 416, 604, 50, "#f2ead0");
    drawRect(28, 426, 584, 30, "#263646");
    drawRect(42, 436, 96, 4, "#f3d35b");
    const line = view.status === "complete"
      ? view.timeoutLoserId ? view.timeoutLoserId === view.you.playerId ? "SERVER CLOCK: YOU TIMED OUT." : "SERVER CLOCK: OPPONENT TIMED OUT."
        : view.winnerId === view.you.playerId ? "SERVER SAYS: YOU WON THE DUEL." : "SERVER SAYS: OPPONENT WON THE DUEL."
      : view.you.ready ? "ACTION LOCKED. WAITING FOR SERVER RESOLUTION." : "CHOOSE A MOVE OR SWITCH. SERVER OWNS THE TURN.";
    drawPixelText(line, 56, 447, 1, "#fff6d7", null);
  }

  function drawBattleArenaChrome(biome) {
    const accent = biomeAccent(biome);
    const alt = biomeAccentAlt(biome);
    drawRect(0, 0, W, 6, "#02050a");
    drawRect(0, 402, W, 6, "#02050a");
    drawRect(0, 0, 6, 408, "#02050a");
    drawRect(W - 6, 0, 6, 408, "#02050a");
    drawRect(10, 10, 82, 3, accent);
    drawRect(W - 106, 10, 96, 3, alt);
    drawRect(10, 395, 136, 3, alt);
    drawRect(W - 156, 395, 146, 3, accent);
    const fx = state.battle?.fx;
    if (fx && performance.now() < fx.until) return;
    const label = biomeName(biome).toUpperCase().slice(0, 18);
    drawRect(238, 10, 164, 20, "#02050a");
    drawRect(242, 14, 156, 12, "#17222d");
    drawRect(248, 17, 30, 2, accent);
    drawPixelText(label, 284, 17, 1, "#fff6d7", null);
  }

  function battleShakeOffset() {
    const fx = state.battle?.fx;
    if (!fx || performance.now() > fx.until || fx.result === "miss" || fx.category === "Status") return { x: 0, y: 0 };
    const t = clamp((performance.now() - fx.started) / (fx.until - fx.started), 0, 1);
    const impact = clamp((t - 0.58) / 0.22, 0, 1);
    if (!impact) return { x: 0, y: 0 };
    const decay = 1 - clamp((t - 0.58) / 0.42, 0, 1);
    const strength = (fx.result === "super" ? 5 : 3) * decay;
    const seed = fx.seed || 1;
    return {
      x: Math.round(Math.sin(t * 78 + seed) * strength),
      y: Math.round(Math.cos(t * 61 + seed * 0.5) * strength * 0.65),
    };
  }

  function drawBattleTempoLines() {
    const fx = state.battle?.fx;
    if (!fx || performance.now() > fx.until) return;
    const t = clamp((performance.now() - fx.started) / (fx.until - fx.started), 0, 1);
    const sweep = windowPulse(t, 0.05, fx.category === "Status" ? 0.74 : 0.62);
    if (!sweep) return;
    const from = fx.attacker === "you" ? { x: 172, y: 256 } : { x: 500, y: 138 };
    const to = fx.target === "foe" ? { x: 486, y: 142 } : { x: 160, y: 302 };
    const color = TYPE_COLORS[fx.moveType] || "#f3d35b";
    const alt = fx.moveType === "Chaos" ? "#60d394" : "#fff6d7";
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    ctx.save();
    ctx.globalAlpha = 0.18 + sweep * 0.28;
    for (let i = 0; i < 11; i += 1) {
      const p = clamp(sweep - i * 0.055, 0, 1);
      const jitter = ((fx.seed + i * 19) % 23) - 11;
      const x = from.x + dx * p + jitter;
      const y = from.y + dy * p + ((fx.seed + i * 13) % 17) - 8;
      const len = 30 + i * 5 + sweep * 20;
      drawRect(x - len / 2, y - 3, len, 6, "#071018");
      drawRect(x - len / 2 + 4, y - 1, len - 8, 2, i % 2 ? color : alt);
    }
    ctx.restore();
  }

  function battleSpriteMotion(side, species = null) {
    const speciesNumber = species?.number || 0;
    const clan = species?.clan || "";
    const idleAmp = clan === "alien" ? 2.8 : clan === "brainrot" ? 2.1 : 1.7;
    const idleSpeed = clan === "alien" ? 170 : clan === "brainrot" ? 195 : 210;
    const idleY = side ? Math.sin(state.anim / idleSpeed + speciesNumber) * idleAmp : 0;
    const motion = { x: 0, y: idleY, scale: 1, hitFlash: 0, attackGlow: 0 };
    const fx = state.battle?.fx;
    if (!side || !fx || performance.now() > fx.until) return motion;
    const t = clamp((performance.now() - fx.started) / (fx.until - fx.started), 0, 1);
    const isAttacker = fx.attacker === side;
    const isTarget = fx.target === side;
    const forward = side === "you" ? 1 : -1;

    if (isAttacker) {
      const brace = windowPulse(t, 0.02, 0.22);
      const lunge = windowPulse(t, 0.16, fx.category === "Status" ? 0.68 : 0.58);
      const isBeamMove = ["Tech", "Electric", "Psychic", "Fairy", "Ghost", "Flying"].includes(fx.moveType);
      const clanBeam = clan === "alien" || (clan === "brainrot" && ["Chaos", "Ghost", "Psychic", "Fairy"].includes(fx.moveType));
      const lungeDistance = fx.category === "Status" ? 10 : clan === "alien" ? 8 : clan === "brainrot" ? 16 : isBeamMove ? 13 : 25;
      motion.x += forward * (-7 * brace + lungeDistance * lunge);
      motion.y += (clan === "alien" ? -14 : clan === "brainrot" ? -7 : isBeamMove ? -10 : -5) * lunge + 2 * brace;
      motion.scale += (clanBeam ? 0.068 : isBeamMove ? 0.055 : 0.035) * lunge - 0.018 * brace;
      if (clan === "brainrot") {
        motion.x += Math.sin(t * 44 + speciesNumber) * 5 * lunge;
        motion.scale += Math.sin(t * Math.PI * 6) * 0.012 * lunge;
      }
      motion.attackGlow = Math.max(brace * 0.55, lunge);
    }

    if (isTarget && fx.result === "miss") {
      const dodge = windowPulse(t, 0.42, 0.86);
      motion.x += -forward * 16 * dodge;
      motion.y += -6 * dodge;
      motion.scale += 0.018 * dodge;
    } else if (isTarget && fx.category === "Status") {
      const wobble = windowPulse(t, 0.34, 0.92);
      motion.x += Math.sin(t * 18 + speciesNumber) * (clan === "brainrot" ? 6 : 3) * wobble;
      motion.y += (clan === "alien" ? -7 : -3) * wobble;
      motion.scale += (clan === "brainrot" ? 0.026 : 0.012) * wobble;
    } else if (isTarget) {
      const impact = windowPulse(t, 0.54, 0.92);
      const shove = side === "foe" ? 1 : -1;
      const force = fx.result === "super" ? 18 : 12;
      motion.x += shove * force * impact + Math.sin(t * 92 + speciesNumber) * 4 * impact;
      motion.y += Math.cos(t * 74 + speciesNumber) * 3 * impact;
      motion.scale += (clan === "brainrot" ? 0.038 : 0.028) * impact;
      motion.hitFlash = impact;
    }

    return motion;
  }

  function windowPulse(t, start, end) {
    if (t <= start || t >= end) return 0;
    return Math.sin(clamp((t - start) / (end - start), 0, 1) * Math.PI);
  }

  function drawBattleBackdrop(biome) {
    if (drawPremiumBattleBackdrop(biome)) return;
    const palette = {
      ogre: ["#6c9c68", "#4d734f", "#2e4638", "#8b7a5b", "#d6c27c"],
      alien: ["#13263a", "#263f56", "#182033", "#4ed5cf", "#f3d35b"],
      goblin: ["#2b2b2f", "#3f3b36", "#211d24", "#8ce06f", "#ff6f69"],
      brainrot: ["#3b2248", "#5b3263", "#181320", "#ff72e1", "#60d394"],
      citadel: ["#48515f", "#6b7282", "#202633", "#f3d35b", "#e9e4ff"],
      town: ["#7ca76d", "#5f8e64", "#3c5b45", "#f3d35b", "#77c6ef"],
    }[biome] || ["#3f5b48", "#527b54", "#253d32", "#f3d35b", "#60d394"];
    const [base, mid, dark, accent, accent2] = palette;
    drawRect(0, 0, W, H, base);
    drawRect(0, 0, W, 118, dark);
    drawRect(0, 118, W, 104, mid);
    drawRect(0, 222, W, 186, shade(base, 8));

    if (biome === "alien") {
      drawBattleStars(accent, accent2);
      for (let i = 0; i < 8; i += 1) {
        const x = 18 + i * 78;
        const y = 82 + ((i * 19) % 62);
        drawRect(x, y, 54, 12, "#071018");
        drawRect(x + 4, y + 2, 46, 8, "#314b65");
        drawRect(x + 12, y + 4, 28, 2, accent);
        drawRect(x + 21, y + 10, 8, 36, "#071018");
        drawRect(x + 23, y + 12, 4, 32, "#4ed5cf");
      }
      drawRect(0, 208, W, 8, "#071018");
      for (let x = 0; x < W; x += 32) {
        drawRect(x, 214, 20, 4, accent);
        drawRect(x + 8, 236, 24, 3, "#9456d1");
      }
    } else if (biome === "goblin") {
      drawBattleCaveWall();
      for (let i = 0; i < 26; i += 1) {
        const x = (i * 53) % W;
        const y = 28 + ((i * 37) % 168);
        drawRect(x, y, 22, 10, "#17151b");
        drawRect(x + 2, y + 2, 18, 6, i % 3 ? "#4a3f3c" : "#5c4f47");
        if (i % 4 === 0) drawRect(x + 8, y + 9, 5, 20, accent);
      }
      drawRect(0, 214, W, 10, "#18151b");
    } else if (biome === "brainrot") {
      for (let y = 12; y < 216; y += 22) {
        const offset = Math.floor((state.anim / 80 + y) % 34);
        drawRect(-offset, y, W + 44, 6, y % 44 ? "#271734" : "#071018");
      }
      for (let i = 0; i < 52; i += 1) {
        const x = (i * 41 + Math.floor(state.anim / 12)) % W;
        const y = 28 + ((i * 29) % 238);
        drawRect(x, y, i % 2 ? 18 : 6, i % 2 ? 4 : 14, i % 3 ? accent : accent2);
      }
      drawRect(424, 62, 104, 104, "#071018");
      drawRect(436, 74, 80, 80, "#5b3263");
      for (let i = 0; i < 9; i += 1) {
        drawRect(452 + i * 5, 93 + i * 3, 46 - i * 4, 5, i % 2 ? accent : accent2);
      }
      drawRect(0, 224, W, 10, "#071018");
      for (let x = 0; x < W; x += 32) {
        drawRect(x, 234, 16, 16, x % 64 ? "#6d5ec2" : accent);
        drawRect(x + 16, 250, 16, 16, x % 64 ? accent2 : "#101820");
      }
    } else {
      for (let i = 0; i < 7; i += 1) {
        const x = -60 + i * 112;
        const h = 70 + ((i * 23) % 54);
        drawRect(x, 116 - h, 96, h, "#2f4737");
        drawRect(x + 14, 96 - h, 58, 20, "#6f6254");
        drawRect(x + 30, 82 - h, 22, 16, "#d6c27c");
      }
      drawRect(0, 158, W, 14, "#31563d");
      for (let i = 0; i < 34; i += 1) {
        const x = (i * 47) % W;
        const y = 168 + ((i * 31) % 82);
        drawRect(x, y, 5, 20, "#d8f0a3");
        drawRect(x - 2, y - 3, 9, 5, i % 3 ? "#f3d35b" : "#60d394");
      }
    }

    for (let y = 0; y < 408; y += 4) {
      drawRect(0, y, W, 1, "rgba(255,255,255,0.025)");
    }
  }

  function drawBattleStars(accent, accent2) {
    for (let i = 0; i < 72; i += 1) {
      const x = (i * 67 + Math.floor(state.anim / 70)) % W;
      const y = (i * 31 + Math.floor(i / 4) * 11) % 118;
      const color = i % 7 === 0 ? accent2 : i % 5 === 0 ? accent : "#fff6d7";
      drawRect(x, y, i % 9 === 0 ? 4 : 2, i % 9 === 0 ? 2 : 2, color);
    }
  }

  function drawBattleCaveWall() {
    for (let y = 0; y < 214; y += 22) {
      for (let x = 0; x < W; x += 42) {
        const n = hash(`${x}:${y}:battle-cave`);
        drawRect(x, y, 42, 22, n % 2 ? "#312c2f" : "#3f3938");
        drawRect(x + 2, y + 2, 38, 3, "rgba(255,255,255,0.06)");
        drawRect(x + 6 + (n % 12), y + 13, 18, 4, "#1d1a20");
      }
    }
  }

  function drawBattlePlatforms(biome) {
    const palette = {
      alien: ["#071018", "#294d63", "#3f6f86", "#4ed5cf", "#9456d1"],
      brainrot: ["#071018", "#3f2a52", "#5b5f82", "#60d394", "#f3d35b"],
      goblin: ["#071018", "#4b443b", "#6b5b4b", "#8ce06f", "#d9d1a6"],
      citadel: ["#071018", "#6b7282", "#d6d4c8", "#d6b85f", "#fff6d7"],
      town: ["#071018", "#517c55", "#7fb36b", "#f3d35b", "#d8f0a3"],
      ogre: ["#071018", "#5f6d3f", "#8a7b57", "#de7a3b", "#d6c27c"],
    }[biome] || ["#071018", "#517c55", "#7fb36b", "#f3d35b", "#d8f0a3"];
    drawArenaPad(158, 356, 236, 56, palette, true);
    drawArenaPad(486, 175, 204, 46, palette, false);
  }

  function drawArenaPad(cx, cy, w, h, palette, front) {
    const [edge, base, light, trim, sparkle] = palette;
    drawPixelOval(cx, cy + 15, w + 42, h + 30, edge, 5, 0.58);
    drawPixelOval(cx, cy + 9, w + 26, h + 18, shade(base, -28), 5, 0.96);
    drawPixelOval(cx, cy + 2, w + 8, h + 8, base, 4, 0.88);
    drawPixelOval(cx - 10, cy - 6, w * 0.7, h * 0.36, light, 4, 0.7);
    drawRect(cx - w / 2 + 22, cy - 2, w - 44, 4, trim);
    drawRect(cx - w / 2 + 38, cy + 4, w - 76, 2, sparkle);
    for (let i = 0; i < 8; i += 1) {
      const x = cx - w / 2 + 26 + i * Math.max(20, Math.floor(w / 9));
      drawRect(x, cy + 13 + (i % 2) * 3, 14, 3, shade(base, -34));
      if (i % 3 === 0) drawRect(x + 4, cy + 7, 8, 2, sparkle);
    }
    if (front) {
      drawRect(cx - w / 2 + 28, cy + 26, w - 56, 9, shade(base, -32));
      drawRect(cx - w / 2 + 42, cy + 28, w - 84, 2, "rgba(255,255,255,0.13)");
      drawRect(cx - w / 2 + 62, cy + 37, w - 124, 5, edge);
    }
  }

  function drawBattleSceneFocus(biome) {
    const accent = biomeAccent(biome);
    const alt = biomeAccentAlt(biome);
    ctx.save();
    ctx.globalAlpha = biome === "brainrot" ? 0.62 : 0.5;
    drawPixelOval(160, 312, 276, 118, "rgba(2,5,10,0.36)", 6, 1);
    drawPixelOval(486, 148, 220, 88, "rgba(2,5,10,0.32)", 6, 1);
    drawPixelOval(160, 300, 178, 72, "rgba(255,246,215,0.09)", 5, 1);
    drawPixelOval(486, 139, 138, 54, "rgba(255,246,215,0.08)", 5, 1);
    ctx.globalAlpha = biome === "brainrot" ? 0.4 : 0.32;
    for (let i = 0; i < 5; i += 1) {
      const px = 72 + i * 36;
      drawRect(px, 257 + (i % 2) * 7, 18, 2, i % 2 ? accent : alt);
    }
    for (let i = 0; i < 4; i += 1) {
      const px = 428 + i * 31;
      drawRect(px, 107 + (i % 2) * 5, 15, 2, i % 2 ? alt : accent);
    }
    ctx.restore();
  }

  function drawBattleActorStage(species, cx, cy, w, h, biome, side) {
    const accent = TYPE_COLORS[species.elements[0]] || biomeAccent(biome);
    const alt = TYPE_COLORS[species.elements[1] || species.elements[0]] || biomeAccentAlt(biome);
    const isPlayer = side === "you";
    const lift = isPlayer ? 22 : 16;
    const panelW = isPlayer ? w + 34 : w + 20;
    const panelH = isPlayer ? h + 18 : h + 14;
    const x = cx - panelW / 2;
    const y = cy - lift - panelH / 2;
    ctx.save();
    ctx.globalAlpha = 0.68;
    drawPixelOval(cx, cy - 8, panelW + 44, panelH + 22, "#02050a", 5, 0.75);
    drawPixelOval(cx, cy - 12, panelW + 20, panelH + 8, "rgba(255,255,255,0.06)", 5, 1);
    ctx.globalAlpha = 0.9;
    drawRect(x + 18, y + panelH - 10, panelW - 36, 6, "#071018");
    drawRect(x + 28, y + panelH - 8, panelW - 56, 2, alt);
    drawRect(x + 42, y + 9, panelW - 84, 3, accent);
    drawRect(x + 58, y + 15, panelW - 116, 2, "rgba(255,255,255,0.16)");
    drawRect(x + 20, y + 18, 4, panelH - 34, "rgba(255,246,215,0.08)");
    drawRect(x + panelW - 24, y + 18, 4, panelH - 34, "rgba(2,5,10,0.34)");
    drawRect(x + 28, y + panelH - 26, panelW - 56, 3, "rgba(2,5,10,0.42)");
    for (let i = 0; i < 7; i += 1) {
      const px = x + 22 + i * Math.max(17, Math.floor(panelW / 8));
      const py = y + panelH - 22 + (i % 2) * 4;
      drawRect(px, py, 14, 3, i % 2 ? accent : alt);
    }
    ctx.globalAlpha = 0.18;
    const pulse = Math.floor(Math.sin(state.anim / 180 + species.number) * 6);
    drawRect(cx - panelW / 2 + 8 + pulse, y + 22, panelW - 16 - pulse * 2, 4, accent);
    drawRect(cx - panelW / 2 + 22 - pulse, y + 31, panelW - 44 + pulse * 2, 3, alt);
    ctx.restore();
  }

  function drawBattleActorSpotlight(species, cx, cy, w, h, biome, side) {
    const accent = TYPE_COLORS[species.elements[0]] || biomeAccent(biome);
    const alt = TYPE_COLORS[species.elements[1] || species.elements[0]] || biomeAccentAlt(biome);
    const clan = species.clan || "";
    const pulse = (Math.sin(state.anim / (clan === "alien" ? 150 : 190) + species.number) + 1) / 2;
    ctx.save();
    ctx.globalAlpha = 0.22 + pulse * 0.12;
    drawPixelOval(cx, cy + h * 0.28, w, h * 0.34, accent, 5, 1);
    ctx.globalAlpha = 0.14 + pulse * 0.08;
    drawPixelOval(cx, cy + h * 0.18, w * 0.58, h * 0.2, alt, 4, 1);
    ctx.globalAlpha = 0.28;
    const sparkCount = clan === "alien" ? 6 : clan === "brainrot" ? 5 : 3;
    for (let i = 0; i < sparkCount; i += 1) {
      const sx = cx - w * 0.34 + ((i * 29 + Math.floor(state.anim / 18)) % Math.max(1, Math.floor(w * 0.68)));
      const sy = cy - h * 0.34 + ((i * 17 + species.number * 3) % Math.max(1, Math.floor(h * 0.54)));
      const c = i % 2 ? accent : alt;
      drawRect(sx, sy, clan === "alien" ? 3 : 4, 2, c);
      if (clan === "brainrot" && i % 2 === 0) drawRect(sx + 5, sy + 2, 2, 4, c);
    }
    if (side === "foe") {
      ctx.globalAlpha = 0.18;
      drawRect(cx - w * 0.32, cy + h * 0.38, w * 0.64, 3, "#fff6d7");
    }
    ctx.restore();
  }

  function drawPixelOval(cx, cy, w, h, color, step = 4, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    for (let y = -h / 2; y <= h / 2; y += step) {
      const row = 1 - Math.pow((y * 2) / h, 2);
      if (row < 0) continue;
      const rowW = Math.sqrt(row) * w;
      drawRect(cx - rowW / 2, cy + y, rowW, step, color);
    }
    ctx.restore();
  }

  function drawBattleForegroundDepth(biome) {
    const color = {
      alien: "#4ed5cf",
      brainrot: "#ff72e1",
      goblin: "#8ce06f",
      citadel: "#d6b85f",
      ogre: "#de7a3b",
      town: "#60d394",
    }[biome] || "#60d394";
    drawRect(0, 404, W, 4, "rgba(2,5,10,0.72)");
    const count = biome === "brainrot" ? 7 : 18;
    for (let i = 0; i < count; i += 1) {
      const x = (i * 43 + Math.floor(state.anim / 18)) % W;
      const y = 210 + ((i * 31) % 174);
      if (biome === "brainrot") {
        if (i % 2 === 0) drawRect(x, y, 12, 2, i % 4 === 0 ? "#60d394" : color);
      } else if (i % 3 === 0) drawRect(x, y, 10, 2, color);
    }
  }

  function drawBattleHud(creature, x, y, playerSide) {
    const species = SPECIES_BY_ID[creature.id];
    const stats = calcStats(creature);
    const w = playerSide ? 264 : 270;
    const h = playerSide ? 76 : 72;
    const accent = TYPE_COLORS[species.elements[0]];
    const alt = TYPE_COLORS[species.elements[1] || species.elements[0]];
    drawPremiumFrame(x, y, w, h, accent, alt, "#17222d");
    drawRect(x + 12, y + 18, w - 24, 18, "#101820");
    drawRect(x + 15, y + 22, 56, 3, accent);
    drawRect(x + 78, y + 22, Math.max(0, w - 154), 3, "#3a4b5b");
    drawRect(x + 12, y + h - 14, w - 24, 4, "#071018");
    drawRect(x + 16, y + h - 12, 84, 2, alt);
    if (playerSide) {
      drawRect(x + w - 54, y + h - 25, 42, 13, "#071018");
      drawRect(x + w - 51, y + h - 22, 36, 7, "#f3d35b");
      drawPixelText("CREW", x + w - 48, y + h - 21, 1, "#071018", null);
    } else {
      drawRect(x + 14, y + h - 25, 46, 13, "#071018");
      drawRect(x + 17, y + h - 22, 40, 7, "#ff6f69");
      drawPixelText("FOE", x + 25, y + h - 21, 1, "#071018", null);
    }
    drawPixelText(creature.nickname.slice(0, 20).toUpperCase(), x + 17, y + 31, 1, "#fff6d7", null);
    drawRect(x + w - 72, y + 18, 56, 14, "#071018");
    drawRect(x + w - 69, y + 20, 50, 8, "#263646");
    drawPixelText(`LV ${creature.level}`, x + w - 64, y + 21, 1, "#f3d35b", null);
    drawBattlePartyPips(
      x + w - 90,
      y + 36,
      playerSide ? state.player.party.length : state.battle?.enemyParty.length || 1,
      playerSide ? state.battle?.playerIndex || 0 : state.battle?.enemyIndex || 0,
      accent,
    );
    const pct = clamp(creature.hp / stats.hp, 0, 1);
    drawRect(x + 14, y + 43, 164, 14, "#071018");
    drawRect(x + 17, y + 46, 22, 8, "#f3d35b");
    drawPixelText("HP", x + 22, y + 47, 1, "#071018", null);
    drawRect(x + 42, y + 47, 129, 6, "#0b141c");
    drawRect(x + 44, y + 49, Math.floor(125 * pct), 3, pct < 0.25 ? "#ff6f69" : pct < 0.55 ? "#f3d35b" : "#60d394");
    drawRect(x + 44, y + 47, 125, 1, "rgba(255,255,255,0.18)");
    if (playerSide) drawPixelText(`${creature.hp}/${stats.hp}`, x + 181, y + 46, 1, "#fff6d7", null);
    drawRect(x + (playerSide ? 15 : 66), y + h - 24, 25, 6, accent);
    drawRect(x + (playerSide ? 42 : 93), y + h - 24, 25, 6, species.elements[1] ? alt : "#3a4b5b");
    if (creature.status) {
      const label = statusLabel(creature.status);
      const color = STATUS_COLORS[creature.status] || "#f3d35b";
      drawRect(x + w - 50, y + h - 24, 36, 13, "#071018");
      drawRect(x + w - 48, y + h - 22, 32, 9, color);
      drawPixelText(label, x + w - 44, y + h - 20, 1, "#071018", null);
    }
  }

  function drawBattlePartyPips(x, y, count, activeIndex, accent) {
    const total = clamp(count || 1, 1, 6);
    for (let i = 0; i < total; i += 1) {
      const px = x + i * 10;
      const active = i === activeIndex;
      drawRect(px, y, 8, 8, "#071018");
      drawRect(px + 1, y + 1, 6, 6, active ? accent : "#3a4b5b");
      drawRect(px + 2, y + 2, 4, 1, active ? "#fff6d7" : "#647987");
    }
  }

  function drawBattleMessageBox(battle) {
    drawRect(0, 408, W, 72, "#071018");
    drawPremiumFrame(8, 413, W - 16, 60, "#f3d35b", biomeAccent(), "#17222d");
    drawRect(22, 432, W - 74, 24, "#101820");
    drawRect(28, 437, 92, 3, "#f3d35b");
    drawRect(125, 437, W - 168, 3, "#3a4b5b");
    drawRect(28, 458, W - 76, 3, "#071018");
    drawRect(W - 70, 426, 38, 12, "#071018");
    drawRect(W - 67, 428, 32, 8, biomeAccent());
    drawPixelText((battle.choice || "main").toUpperCase().slice(0, 5), W - 62, 429, 1, "#071018", null);
    const text = (battle.log[0] || "Choose a move.").slice(0, 56).toUpperCase();
    drawPixelText(text, 34, 451, 1, "#fff6d7", null);
    drawRect(W - 42, 448, 18, 12, "#071018");
    drawRect(W - 37, 451, 8, 6, "#60d394");
    drawRect(W - 28, 454, 4, 3, "#f3d35b");
  }

  function battleSideSpecies(side) {
    if (!state.battle) return null;
    const creature = side === "you" ? activePlayer() : activeEnemy();
    return creature ? SPECIES_BY_ID[creature.id] : null;
  }

  function drawBattleFx() {
    const fx = state.battle?.fx;
    if (!fx || performance.now() > fx.until) return;
    const duration = fx.until - fx.started;
    const t = clamp((performance.now() - fx.started) / duration, 0, 1);
    const from = fx.attacker === "you" ? { x: 172, y: 256 } : { x: 500, y: 138 };
    const to = fx.target === "foe" ? { x: 486, y: 142 } : { x: 160, y: 302 };
    const color = TYPE_COLORS[fx.moveType] || "#f3d35b";
    const alt = fx.result === "super" ? "#fff6d7" : fx.moveType === "Chaos" ? "#60d394" : shade(color, 28);
    const dark = fx.moveType === "Dark" || fx.moveType === "Ghost" ? "#071018" : shade(color, -34);
    const seed = fx.seed || 1;
    const impact = clamp((t - 0.62) / 0.38, 0, 1);
    const travel = clamp(t / 0.76, 0, 1);
    const headX = from.x + (to.x - from.x) * travel;
    const headY = from.y + (to.y - from.y) * travel;

    drawMoveCallout(fx, t, color, alt);
    drawClanSignatureFx(fx, from, to, t, travel, impact, color, alt, seed);

    if (fx.result === "miss") {
      const mx = to.x + 20 * Math.sin(t * Math.PI * 2);
      const my = to.y - 34 - t * 18;
      drawPixelText("MISS", mx - 18, my, 1, "#fff6d7", "#071018");
      for (let i = 0; i < 4; i += 1) {
        const wx = to.x - 36 + i * 24 + t * 18;
        const wy = to.y - 38 + i * 11;
        drawRect(wx, wy, 28, 4, i % 2 ? color : "#fff6d7");
      }
      return;
    }
    if (fx.category === "Status") {
      drawStatusAura(to.x, to.y, color, alt, t, seed);
      return;
    }

    if (impact) drawDamagePop(fx, to, impact, color);

    if (fx.moveType === "Electric") {
      drawElectricCoils(from, to, color, alt, travel, seed);
      drawLightningPath(from, to, color, "#fff6d7", travel, seed);
      if (impact) drawImpactBurst(to.x, to.y, color, alt, impact);
      return;
    }

    if (fx.moveType === "Tech") {
      if (/satellite/i.test(fx.moveName)) drawSatelliteStrike(from, to, color, "#f3d35b", t, seed);
      else drawTechBeamGrid(from, to, color, "#f3d35b", travel, seed);
      if (impact) {
        drawTechTargetGrid(to.x, to.y, color, "#f3d35b", impact, seed);
        drawImpactBurst(to.x, to.y, color, "#f3d35b", impact);
      }
      return;
    }

    if (fx.moveType === "Fire") {
      for (let i = 0; i < 8; i += 1) {
        const p = Math.max(0, travel - i * 0.055);
        const x = from.x + (to.x - from.x) * p;
        const y = from.y + (to.y - from.y) * p + Math.sin((p + i) * 9) * 7;
        drawRect(x - 8, y - 6, 16, 10, i % 2 ? color : "#fff6d7");
        drawRect(x + 4, y - 2, 10, 5, "#f3d35b");
      }
      if (impact) drawImpactBurst(to.x, to.y, color, "#fff6d7", impact);
      return;
    }

    if (fx.moveType === "Water") {
      for (let i = 0; i < 10; i += 1) {
        const p = clamp(travel - i * 0.045, 0, 1);
        const x = from.x + (to.x - from.x) * p;
        const y = from.y + (to.y - from.y) * p + Math.sin((p * 16 + i) * 1.2) * 12;
        drawRect(x - 12, y, 24, 5, i % 2 ? color : "#cde8f5");
        drawRect(x - 7, y + 7, 14, 4, "#071018");
      }
      if (impact) drawSplashBurst(to.x, to.y, color, impact);
      return;
    }

    if (fx.moveType === "Flying") {
      drawJetstreamAttack(from, to, color, alt, travel, seed);
      if (impact) drawImpactBurst(to.x, to.y, color, alt, impact);
      return;
    }

    if (fx.moveType === "Grass") {
      for (let i = 0; i < 12; i += 1) {
        const p = clamp(travel - i * 0.035, 0, 1);
        const sway = Math.sin((p + i + seed) * 8) * 16;
        const x = from.x + (to.x - from.x) * p + sway;
        const y = from.y + (to.y - from.y) * p;
        drawRect(x - 8, y - 3, 16, 6, i % 2 ? color : alt);
        drawRect(x - 4, y - 9, 4, 12, "#fff6d7");
      }
      if (impact) drawImpactBurst(to.x, to.y, color, alt, impact);
      return;
    }

    if (fx.moveType === "Poison") {
      for (let i = 0; i < 11; i += 1) {
        const p = clamp(travel - i * 0.04, 0, 1);
        const x = from.x + (to.x - from.x) * p + Math.sin(i + seed) * 10;
        const y = from.y + (to.y - from.y) * p + Math.cos(p * 10 + i) * 9;
        drawRect(x - 6, y - 5, 12, 10, "#071018");
        drawRect(x - 4, y - 3, 8, 6, i % 2 ? color : "#8ce06f");
      }
      if (impact) drawSplashBurst(to.x, to.y, color, impact);
      return;
    }

    if (fx.moveType === "Psychic" || fx.moveType === "Fairy" || fx.moveType === "Ghost") {
      drawPsychicLens(to.x, to.y, color, alt, t, seed, fx.moveType);
      drawOrbitalRings(headX, headY, color, alt, t, seed);
      drawChunkyLine(from.x, from.y, headX, headY, 3, fx.moveType === "Ghost" ? "#071018" : color);
      if (impact) drawStatusAura(to.x, to.y, color, fx.moveType === "Ghost" ? "#071018" : alt, impact, seed);
      return;
    }

    if (fx.moveType === "Chaos") {
      drawChunkyLine(from.x, from.y, headX, headY, 11, "#071018");
      drawChunkyLine(from.x, from.y, headX, headY, 6, "#ff72e1");
      drawChunkyLine(from.x, from.y, headX, headY, 3, "#60d394");
      ctx.save();
      ctx.globalAlpha *= 0.7;
      for (let i = 0; i < 16; i += 1) {
        const p = clamp(travel - i * 0.031, 0, 1);
        const x = from.x + (to.x - from.x) * p + (((seed + i * 13) % 19) - 9);
        const y = from.y + (to.y - from.y) * p + (((seed + i * 17) % 23) - 11);
        const glitch = i % 3 === 0 ? "#ff72e1" : i % 3 === 1 ? "#60d394" : "#f3d35b";
        drawRect(x - 10, y - 7, i % 2 ? 20 : 8, i % 2 ? 7 : 17, "#071018");
        drawRect(x - 7, y - 4, i % 2 ? 14 : 4, i % 2 ? 4 : 11, glitch);
        if (i % 5 === 0) drawRect(x + 4, y + 7, 12, 3, "#fff6d7");
      }
      ctx.restore();
      if (impact) {
        ctx.save();
        ctx.globalAlpha *= 0.76;
        drawImpactBurst(to.x, to.y, "#ff72e1", "#60d394", impact);
        for (let i = 0; i < 7; i += 1) {
          const angle = i * 0.63 + seed;
          const dist = 24 + impact * 46 + (i % 3) * 7;
          const x = to.x + Math.cos(angle) * dist;
          const y = to.y - 12 + Math.sin(angle) * dist * 0.62;
          drawRect(x - 7, y - 7, 14, 14, "#071018");
          drawRect(x - 4, y - 4, 8, 8, i % 2 ? "#f3d35b" : "#60d394");
        }
        ctx.restore();
        drawPixelText("???", to.x - 12, to.y - 58 - impact * 10, 1, "#f3d35b", "#071018");
      }
      return;
    }

    if (fx.moveType === "Rock" || fx.moveType === "Steel") {
      for (let i = 0; i < 9; i += 1) {
        const p = clamp(travel - i * 0.04, 0, 1);
        const arc = Math.sin(p * Math.PI) * (42 + (i % 3) * 8);
        const x = from.x + (to.x - from.x) * p + (i - 4) * 3;
        const y = from.y + (to.y - from.y) * p - arc;
        drawRect(x - 7, y - 6, 14, 12, "#071018");
        drawRect(x - 4, y - 4, 10, 8, i % 2 ? color : alt);
      }
      if (impact) drawImpactBurst(to.x, to.y, color, "#fff6d7", impact);
      return;
    }

    drawPhysicalSlash(to.x, to.y, color, alt, dark, t, fx.moveType);
  }

  function drawClanSignatureFx(fx, from, to, t, travel, impact, color, alt, seed = 1) {
    const attackerSpecies = fx.attackerId ? SPECIES_BY_ID[fx.attackerId] : battleSideSpecies(fx.attacker);
    const targetSpecies = fx.targetId ? SPECIES_BY_ID[fx.targetId] : battleSideSpecies(fx.target);
    if (!attackerSpecies) return;

    if (attackerSpecies.clan === "alien") {
      drawAlienSignalFX(from, to, t, travel, impact, color, alt, seed, attackerSpecies);
    } else if (attackerSpecies.clan === "brainrot") {
      drawBrainrotSignatureFX(fx, from, to, t, travel, impact, color, alt, seed, attackerSpecies);
    }

    if (targetSpecies?.clan === "alien" && impact) {
      drawAlienShieldBreak(to.x, to.y, color, alt, impact, seed);
    } else if (targetSpecies?.clan === "brainrot" && impact) {
      drawBrainrotHitGlitch(to.x, to.y, impact, seed);
    }
  }

  function drawAlienSignalFX(from, to, t, travel, impact, color, alt, seed, species) {
    const charge = windowPulse(t, 0.02, 0.34);
    const cast = windowPulse(t, 0.18, 0.72);
    const originY = from.y - 28;
    ctx.save();
    ctx.globalAlpha = 0.42 + charge * 0.36;
    for (let ring = 0; ring < 3; ring += 1) {
      const w = 44 + ring * 22 + charge * 30;
      const y = originY + ring * 8;
      drawRect(from.x - w / 2, y, w, 4, "#071018");
      drawRect(from.x - w / 2 + 4, y + 1, w - 8, 2, ring % 2 ? color : alt);
    }
    for (let i = 0; i < 4; i += 1) {
      const angle = seed + i * Math.PI * 0.5 + t * 4;
      const x = from.x + Math.cos(angle) * (34 + charge * 13);
      const y = originY + Math.sin(angle) * (16 + charge * 8);
      drawAlienDrone(x, y, i % 2 ? color : alt, i % 2 ? alt : color, charge || cast);
    }
    ctx.restore();

    if (cast) {
      const headX = from.x + (to.x - from.x) * travel;
      const headY = from.y + (to.y - from.y) * travel;
      drawChunkyLine(from.x, from.y - 10, headX, headY, 12, "#071018");
      drawChunkyLine(from.x, from.y - 10, headX, headY, 6, color);
      drawChunkyLine(from.x, from.y - 10, headX, headY, 2, "#fff6d7");
      for (let i = 0; i < 7; i += 1) {
        const p = clamp(travel - i * 0.07, 0, 1);
        const x = from.x + (to.x - from.x) * p;
        const y = from.y + (to.y - from.y) * p - 10;
        drawRect(x - 16, y - 12, 32, 4, "#071018");
        drawRect(x - 11, y - 10, 22, 2, i % 2 ? alt : color);
        drawRect(x - 3, y - 21, 6, 22, i % 2 ? color : alt);
      }
    }

    if (impact) {
      drawTechTargetGrid(to.x, to.y, color, alt, impact, seed);
      drawPixelText("SYNC", to.x - 16, to.y - 82 - impact * 7, 1, "#fff6d7", "#071018");
      if (species.legendary || species.rarity === "legendary") {
        drawSatelliteStrike(from, to, color, "#f3d35b", Math.min(1, t + 0.18), seed);
      }
    }
  }

  function drawAlienDrone(cx, cy, color, alt, power = 1) {
    drawRect(cx - 12, cy - 8, 24, 16, "#071018");
    drawRect(cx - 8, cy - 5, 16, 10, "#263646");
    drawRect(cx - 5, cy - 2, 10, 4, color);
    drawRect(cx - 20, cy - 3, 8, 6, alt);
    drawRect(cx + 12, cy - 3, 8, 6, alt);
    if (power) drawRect(cx - 2, cy + 8, 4, 12 + power * 8, "#f3d35b");
  }

  function drawAlienShieldBreak(cx, cy, color, alt, impact) {
    const size = 38 + impact * 46;
    drawRect(cx - size / 2, cy - 55, size, 5, "#071018");
    drawRect(cx - size / 2, cy + 22, size, 5, "#071018");
    drawRect(cx - size / 2, cy - 55, 5, 82, color);
    drawRect(cx + size / 2 - 5, cy - 55, 5, 82, alt);
    for (let i = 0; i < 6; i += 1) {
      const x = cx - size / 2 + 10 + i * (size - 20) / 5;
      drawRect(x, cy - 50 + (i % 2) * 8, 3, 58, i % 2 ? alt : color);
    }
  }

  function drawBrainrotSignatureFX(fx, from, to, t, travel, impact, color, alt, seed, species) {
    const charge = windowPulse(t, 0.02, 0.32);
    const pulse = Math.sin(t * Math.PI);
    const noiseColors = ["#ff72e1", "#60d394", "#f3d35b", "#4ed5cf"];

    ctx.save();
    ctx.globalAlpha = 0.58 + charge * 0.25;
    for (let i = 0; i < 10; i += 1) {
      const x = from.x - 46 + i * 10 + Math.sin(t * 24 + i) * 4;
      const barH = 8 + ((seed + i * 7) % 24) * (0.45 + charge);
      drawRect(x - 3, from.y - 34 - barH, 8, barH, "#071018");
      drawRect(x - 1, from.y - 31 - barH, 4, Math.max(3, barH - 6), noiseColors[i % noiseColors.length]);
    }
    ctx.restore();

    drawChunkyLine(from.x, from.y - 8, from.x + (to.x - from.x) * travel, from.y + (to.y - from.y) * travel - 8, 13, "#071018");
    for (let i = 0; i < 18; i += 1) {
      const p = clamp(travel - i * 0.034, 0, 1);
      const x = from.x + (to.x - from.x) * p + (((seed + i * 17) % 29) - 14);
      const y = from.y + (to.y - from.y) * p - 8 + (((seed + i * 23) % 25) - 12);
      const wide = i % 2 ? 18 : 7;
      const tall = i % 2 ? 6 : 16;
      drawRect(x - wide / 2, y - tall / 2, wide, tall, "#071018");
      drawRect(x - wide / 2 + 3, y - tall / 2 + 2, Math.max(2, wide - 6), Math.max(2, tall - 4), noiseColors[i % noiseColors.length]);
    }

    if (fx.category === "Status") {
      drawPixelText("BUFF?", from.x - 22, from.y - 74 - charge * 8, 1, "#f3d35b", "#071018");
      drawStatusAura(from.x, from.y - 18, "#ff72e1", "#60d394", pulse, seed);
    }

    if (impact) {
      drawBrainrotHitGlitch(to.x, to.y, impact, seed);
      drawPixelText(species.role.toUpperCase().slice(0, 8), to.x - 24, to.y - 86 - impact * 7, 1, "#f3d35b", "#071018");
    }
  }

  function drawBrainrotHitGlitch(cx, cy, impact, seed) {
    const colors = ["#ff72e1", "#60d394", "#f3d35b", "#4ed5cf", "#fff6d7"];
    for (let i = 0; i < 13; i += 1) {
      const angle = seed + i * 0.53;
      const dist = 20 + impact * 58 + (i % 4) * 6;
      const x = cx + Math.cos(angle) * dist;
      const y = cy - 16 + Math.sin(angle) * dist * 0.6;
      const w = i % 3 === 0 ? 22 : 10;
      const h = i % 3 === 1 ? 20 : 8;
      drawRect(x - w / 2, y - h / 2, w, h, "#071018");
      drawRect(x - w / 2 + 3, y - h / 2 + 2, Math.max(2, w - 6), Math.max(2, h - 4), colors[i % colors.length]);
    }
    drawPixelText("LOL", cx - 10, cy - 59 - impact * 12, 1, "#fff6d7", "#071018");
  }

  function drawMoveCallout(fx, t, color, alt) {
    const slide = Math.sin(clamp(t / 0.22, 0, 1) * Math.PI * 0.5);
    const baseX = 326;
    const x = baseX + (fx.attacker === "you" ? -18 + 18 * slide : 18 - 18 * slide);
    const y = 18;
    const tag = fx.result === "miss"
      ? "MISS"
      : fx.category === "Status"
        ? "STATUS"
        : fx.result === "super" || fx.multiplier >= 2
          ? "SUPER"
          : fx.result === "resist" || fx.multiplier <= 0.5
            ? "RESIST"
            : fx.category.toUpperCase().slice(0, 6);
    drawPremiumFrame(x, y, 242, 44, color, alt, "#18242d");
    drawRect(x + 12, y + 15, 56, 16, "#071018");
    drawRect(x + 15, y + 18, 50, 10, color);
    drawPixelText(fx.moveType.toUpperCase().slice(0, 7), x + 18, y + 20, 1, "#071018", null);
    drawPixelText(fx.moveName.slice(0, 24), x + 78, y + 17, 1, "#fff6d7", null);
    drawRect(x + 174, y + 25, 54, 11, "#071018");
    drawRect(x + 177, y + 27, 48, 7, tag === "MISS" ? "#aeb9c2" : tag === "RESIST" ? "#d9d1a6" : alt);
    drawPixelText(tag, x + 181, y + 27, 1, "#071018", null);
  }

  function drawStatusAura(cx, cy, color, alt, t, seed = 1) {
    const radius = 30 + t * 58;
    const pulse = Math.sin(t * Math.PI);
    drawRect(cx - radius / 2, cy - 48, radius, 4, color);
    drawRect(cx - radius / 2, cy + 18, radius, 4, color);
    drawRect(cx - radius / 2, cy - 48, 4, 70, alt);
    drawRect(cx + radius / 2 - 4, cy - 48, 4, 70, alt);
    for (let i = 0; i < 10; i += 1) {
      const angle = t * 7 + i * 0.7 + seed;
      const x = cx + Math.cos(angle) * (24 + pulse * 22);
      const y = cy - 16 + Math.sin(angle) * (18 + pulse * 18);
      drawRect(x - 4, y - 4, 8, 8, i % 2 ? color : "#f3d35b");
      if (i % 3 === 0) drawRect(x - 2, y - 12, 4, 6, "#fff6d7");
    }
  }

  function drawLightningPath(from, to, color, alt, t, seed = 1) {
    const points = [{ x: from.x, y: from.y }];
    const steps = 7;
    for (let i = 1; i <= steps; i += 1) {
      const p = Math.min(t, i / steps);
      const jitter = (((seed + i * 31) % 25) - 12) * Math.sin(t * Math.PI);
      points.push({
        x: from.x + (to.x - from.x) * p + jitter,
        y: from.y + (to.y - from.y) * p + (((seed + i * 17) % 19) - 9),
      });
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      if (i / steps > t + 0.08) break;
      drawChunkyLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, 7, "#071018");
      drawChunkyLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, 3, i % 2 ? color : alt);
    }
    for (let i = 0; i < 6; i += 1) {
      const p = clamp(t - i * 0.08, 0, 1);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      drawRect(x - 3, y - 14, 6, 28, i % 2 ? color : alt);
      drawRect(x - 12, y - 3, 24, 6, "#fff6d7");
    }
  }

  function drawElectricCoils(from, to, color, alt, t, seed = 1) {
    const pulse = Math.sin(t * Math.PI);
    for (let i = 0; i < 7; i += 1) {
      const p = clamp(t - i * 0.075, 0, 1);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      const r = 10 + ((seed + i * 7) % 9) + pulse * 8;
      drawRect(x - r, y - r * 0.4, r * 2, 4, "#071018");
      drawRect(x - r + 3, y - r * 0.4 + 1, r * 2 - 6, 2, i % 2 ? color : alt);
      drawRect(x - 3, y - r, 6, r * 2, i % 2 ? alt : color);
    }
  }

  function drawTechBeamGrid(from, to, color, alt, t, seed = 1) {
    const headX = from.x + (to.x - from.x) * t;
    const headY = from.y + (to.y - from.y) * t;
    drawChunkyLine(from.x, from.y, headX, headY, 10, "#071018");
    drawChunkyLine(from.x, from.y, headX, headY, 5, color);
    drawChunkyLine(from.x, from.y, headX, headY, 2, "#fff6d7");
    for (let i = 0; i < 10; i += 1) {
      const p = clamp(t - i * 0.065, 0, 1);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      const wide = 24 + ((seed + i * 11) % 15);
      drawRect(x - wide / 2, y - 12, wide, 5, "#071018");
      drawRect(x - wide / 2 + 3, y - 10, wide - 6, 2, i % 2 ? alt : color);
      drawRect(x - 4, y - 20, 8, 34, "#071018");
      drawRect(x - 2, y - 16, 4, 26, i % 2 ? color : alt);
    }
  }

  function drawTechTargetGrid(cx, cy, color, alt, t, seed = 1) {
    const size = 34 + t * 56;
    drawRect(cx - size / 2, cy - 52, size, 5, "#071018");
    drawRect(cx - size / 2, cy + 24, size, 5, "#071018");
    drawRect(cx - size / 2, cy - 52, 5, 81, "#071018");
    drawRect(cx + size / 2 - 5, cy - 52, 5, 81, "#071018");
    for (let i = 0; i < 6; i += 1) {
      const x = cx - size / 2 + 9 + i * (size - 18) / 5;
      drawRect(x, cy - 48, 3, 72, i % 2 ? color : alt);
    }
    for (let i = 0; i < 5; i += 1) {
      const y = cy - 44 + i * 16;
      drawRect(cx - size / 2 + 5, y, size - 10, 2, i % 2 ? alt : color);
    }
    drawPixelText("LOCK", cx - 16, cy - 66 - t * 8, 1, alt, "#071018");
  }

  function drawSatelliteStrike(from, to, color, alt, t, seed = 1) {
    const charge = clamp(t / 0.4, 0, 1);
    const drop = clamp((t - 0.28) / 0.62, 0, 1);
    const satX = to.x - 58 + Math.sin(seed) * 14;
    const satY = 44 + Math.cos(seed) * 10;
    drawRect(satX - 30, satY - 13, 60, 26, "#071018");
    drawRect(satX - 24, satY - 9, 48, 18, "#263646");
    drawRect(satX - 17, satY - 5, 34, 10, color);
    drawRect(satX - 44, satY - 5, 16, 10, alt);
    drawRect(satX + 28, satY - 5, 16, 10, alt);
    drawRect(satX - 4, satY + 14, 8, 26 + charge * 18, "#071018");
    drawRect(satX - 2, satY + 17, 4, 21 + charge * 18, color);
    const beamEndY = satY + 42 + (to.y - satY - 42) * drop;
    drawRect(satX - 13, satY + 39, 26, beamEndY - satY - 33, "#071018");
    drawRect(satX - 9, satY + 42, 18, beamEndY - satY - 39, color);
    drawRect(satX - 3, satY + 42, 6, beamEndY - satY - 39, "#fff6d7");
    drawChunkyLine(from.x, from.y, satX, satY, 3, alt);
  }

  function drawJetstreamAttack(from, to, color, alt, t, seed = 1) {
    for (let i = 0; i < 14; i += 1) {
      const p = clamp(t - i * 0.035, 0, 1);
      const x = from.x + (to.x - from.x) * p + Math.sin(seed + i) * 8;
      const y = from.y + (to.y - from.y) * p + Math.cos(p * 8 + i) * 14;
      const len = 28 + (i % 4) * 10;
      drawRect(x - len / 2, y - 4, len, 8, "#071018");
      drawRect(x - len / 2 + 4, y - 2, len - 8, 3, i % 2 ? color : alt);
      if (i % 3 === 0) drawRect(x + len / 2 - 8, y - 12, 5, 22, "#fff6d7");
    }
  }

  function drawPsychicLens(cx, cy, color, alt, t, seed = 1, moveType = "Psychic") {
    const pulse = Math.sin(t * Math.PI);
    const dark = moveType === "Ghost" ? "#02050a" : "#071018";
    for (let ring = 0; ring < 3; ring += 1) {
      const w = 42 + ring * 30 + pulse * 24;
      const h = 18 + ring * 14 + pulse * 10;
      drawRect(cx - w / 2, cy - 24 - h / 2, w, 4, dark);
      drawRect(cx - w / 2, cy - 24 + h / 2, w, 4, dark);
      drawRect(cx - w / 2, cy - 24 - h / 2, 4, h, ring % 2 ? color : alt);
      drawRect(cx + w / 2 - 4, cy - 24 - h / 2, 4, h, ring % 2 ? alt : color);
    }
    for (let i = 0; i < 8; i += 1) {
      const a = seed + i * 0.78 + t * 5;
      const x = cx + Math.cos(a) * (22 + pulse * 26);
      const y = cy - 24 + Math.sin(a) * (14 + pulse * 18);
      drawRect(x - 5, y - 5, 10, 10, dark);
      drawRect(x - 3, y - 3, 6, 6, i % 2 ? color : alt);
    }
  }

  function drawChunkyLine(x1, y1, x2, y2, size, color) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / Math.max(3, size)));
    for (let i = 0; i <= steps; i += 1) {
      const p = i / steps;
      drawRect(x1 + dx * p - size / 2, y1 + dy * p - size / 2, size, size, color);
    }
  }

  function drawSplashBurst(cx, cy, color, t) {
    const rise = Math.sin(t * Math.PI);
    for (let i = 0; i < 12; i += 1) {
      const dir = i % 2 ? -1 : 1;
      const x = cx + (i - 5.5) * 8 * t;
      const y = cy - 8 - rise * (18 + (i % 4) * 5) + (i % 3) * 6;
      const tailY = dir < 0 ? y - 4 : y + 6;
      drawRect(x - 5, y - 4, 10, 8, i % 2 ? color : "#cde8f5");
      drawRect(x - 2, tailY, 4, 10, "#071018");
    }
    drawImpactBurst(cx, cy, color, "#fff6d7", t);
  }

  function drawOrbitalRings(cx, cy, color, alt, t, seed = 1) {
    const r = 24 + Math.sin(t * Math.PI) * 22;
    for (let ring = 0; ring < 3; ring += 1) {
      const ringR = r + ring * 12;
      for (let i = 0; i < 12; i += 1) {
        const a = t * (5 + ring) + i * 0.52 + seed;
        const x = cx + Math.cos(a) * ringR;
        const y = cy + Math.sin(a) * ringR * 0.48;
        drawRect(x - 4, y - 3, 8, 6, (i + ring) % 2 ? color : alt);
      }
    }
    drawRect(cx - 12, cy - 12, 24, 24, "#071018");
    drawRect(cx - 8, cy - 8, 16, 16, color);
    drawRect(cx - 3, cy - 3, 6, 6, "#fff6d7");
  }

  function drawPhysicalSlash(cx, cy, color, alt, dark, t, moveType) {
    const slashT = Math.sin(t * Math.PI);
    const isHeavy = moveType === "Brute" || moveType === "Normal";
    const count = isHeavy ? 6 : moveType === "Bug" || moveType === "Trick" ? 7 : 5;
    for (let i = 0; i < count; i += 1) {
      const x = cx - 52 + i * 18 + t * 38;
      const y = cy - 46 + i * (moveType === "Bug" ? 9 : 13);
      const w = (isHeavy ? 58 : 44) * slashT;
      drawRect(x - 3, y - 3, w + 8, 10, dark);
      drawRect(x, y, w, 5, i % 2 ? color : alt);
      drawRect(x + 8, y + 6, Math.max(5, w * 0.65), 4, "#fff6d7");
    }
    if (moveType === "Dark" || moveType === "Trick") {
      for (let i = 0; i < 5; i += 1) {
        drawRect(cx - 38 + i * 18, cy - 58 + Math.sin(t * 8 + i) * 10, 14, 18, i % 2 ? "#071018" : color);
      }
    }
    if (t > 0.54) drawImpactBurst(cx, cy, color, alt, (t - 0.54) / 0.46);
  }

  function drawDamagePop(fx, point, t, color) {
    if (!fx.damage) return;
    const text = `-${fx.damage}`;
    const chipW = Math.max(58, 22 + text.length * 8);
    const y = point.y - 76 - Math.sin(t * Math.PI) * 16;
    const x = fx.target === "foe" ? point.x + 34 : point.x - chipW - 28;
    drawRect(x - 8, y - 8, chipW + 16, 25, "#071018");
    drawRect(x - 5, y - 5, chipW + 10, 19, "#293642");
    drawRect(x - 2, y - 2, chipW - 18, 3, color);
    drawPixelText(text, x + 4, y + 3, 1, "#fff6d7", null);
    if (fx.multiplier >= 2) {
      drawRect(x - 8, y + 20, 78, 14, "#071018");
      drawRect(x - 5, y + 22, 72, 10, color);
      drawPixelText("SMASH", x + 5, y + 24, 1, "#071018", null);
    } else if (fx.multiplier <= 0.5) {
      drawRect(x - 8, y + 20, 78, 14, "#071018");
      drawRect(x - 5, y + 22, 72, 10, "#aeb9c2");
      drawPixelText("RESIST", x + 1, y + 24, 1, "#071018", null);
    }
  }

  function drawImpactBurst(cx, cy, color, alt, t) {
    const size = 10 + t * 34;
    drawRect(cx - size / 2, cy - 4, size, 8, color);
    drawRect(cx - 4, cy - size / 2, 8, size, alt);
    drawRect(cx - size * 0.38, cy - size * 0.38, size * 0.22, size * 0.22, "#fff6d7");
    drawRect(cx + size * 0.2, cy + size * 0.2, size * 0.22, size * 0.22, "#fff6d7");
  }

  function drawActorRim(cx, topY, w, h, color, intensity) {
    if (!intensity) return;
    ctx.save();
    ctx.globalAlpha = 0.18 + intensity * 0.34;
    const pad = 7 + intensity * 7;
    drawRect(cx - w / 2 - pad, topY - pad, w + pad * 2, 4, color);
    drawRect(cx - w / 2 - pad, topY + h + pad - 4, w + pad * 2, 4, "#071018");
    drawRect(cx - w / 2 - pad, topY - pad, 4, h + pad * 2, color);
    drawRect(cx + w / 2 + pad - 4, topY - pad, 4, h + pad * 2, "#fff6d7");
    for (let i = 0; i < 5; i += 1) {
      const x = cx - w / 2 + 12 + i * Math.max(13, w / 5);
      drawRect(x, topY - pad - 5 + (i % 2) * 5, 14, 3, i % 2 ? color : "#f3d35b");
    }
    ctx.restore();
  }

  function drawSpriteHitSheen(left, top, w, h, color, intensity) {
    if (!intensity) return;
    ctx.save();
    ctx.globalAlpha = 0.16 + intensity * 0.38;
    drawRect(left - 5, top + h * 0.18, w + 10, 8, "#fff6d7");
    drawRect(left + w * 0.2, top - 8, 9, h + 16, "#fff6d7");
    drawRect(left + w * 0.06, top + h * 0.52, w * 0.82, 6, color);
    drawRect(left + w * 0.55, top + h * 0.08, 7, h * 0.68, color);
    ctx.restore();
  }

  function drawTintedSpriteImage(img, left, top, w, h, color, alpha = 1) {
    if (!spriteMaskCanvas || !spriteMaskCtx) return false;
    if (spriteMaskCanvas.width !== w || spriteMaskCanvas.height !== h) {
      spriteMaskCanvas.width = w;
      spriteMaskCanvas.height = h;
    }
    spriteMaskCtx.clearRect(0, 0, w, h);
    spriteMaskCtx.imageSmoothingEnabled = false;
    spriteMaskCtx.globalCompositeOperation = "source-over";
    spriteMaskCtx.drawImage(img, 0, 0, w, h);
    spriteMaskCtx.globalCompositeOperation = "source-in";
    spriteMaskCtx.fillStyle = color;
    spriteMaskCtx.fillRect(0, 0, w, h);
    spriteMaskCtx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteMaskCanvas, Math.round(left), Math.round(top));
    ctx.restore();
    return true;
  }

  function drawPremiumSpriteMat(img, left, top, w, h, accent, alt, intensity, side) {
    const outline = Math.max(1, Math.round(w / 74));
    const darkAlpha = side === "you" ? 0.56 : 0.62;
    drawTintedSpriteImage(img, left - outline, top, w, h, "#02050a", darkAlpha);
    drawTintedSpriteImage(img, left + outline, top, w, h, "#02050a", darkAlpha);
    drawTintedSpriteImage(img, left, top - outline, w, h, "#02050a", darkAlpha);
    drawTintedSpriteImage(img, left, top + outline, w, h, "#02050a", darkAlpha * 0.92);
    if (w > 82 || h > 82) {
      drawTintedSpriteImage(img, left - outline, top - outline, w, h, "#02050a", 0.34);
      drawTintedSpriteImage(img, left + outline, top + outline, w, h, "#02050a", 0.3);
    }
    drawTintedSpriteImage(img, left - outline * 2, top - outline, w, h, accent, 0.13 + intensity * 0.16);
    drawTintedSpriteImage(img, left + outline * 2, top + outline, w, h, alt, 0.1 + intensity * 0.14);
    if (side === "foe") {
      drawTintedSpriteImage(img, left + outline, top - outline, w, h, "#fff6d7", 0.08 + intensity * 0.12);
    } else {
      drawTintedSpriteImage(img, left - outline, top - outline, w, h, "#fff6d7", 0.07 + intensity * 0.1);
    }
  }

  function battleSpritePresentation(species, baseScale, back) {
    const stage = species.stageIndex >= 2 ? 1.08 : species.stageIndex === 1 ? 1.02 : 0.98;
    const rarity = species.legendary || species.rarity === "legendary" ? 1.08 : species.rarity === "rare" ? 1.04 : 1;
    const clan = species.clan === "ogre" ? 1.04 : species.clan === "goblin" ? 0.96 : species.clan === "alien" ? 1.08 : species.clan === "brainrot" ? 1.08 : 1;
    const side = back ? 1.08 : 1.02;
    return baseScale * stage * rarity * clan * side;
  }

  function drawCreatureContactShadow(x, anchorY, w, h, species, motion) {
    const accent = TYPE_COLORS[species.elements[0]] || "#60d394";
    const alt = TYPE_COLORS[species.elements[1] || species.elements[0]] || "#fff6d7";
    const shadowW = Math.max(42, w * (0.56 + motion.attackGlow * 0.08));
    const shadowH = Math.max(10, h * 0.105);
    drawPixelOval(x, anchorY + 3, shadowW + 24, shadowH + 12, "#02050a", 4, 0.46);
    drawPixelOval(x, anchorY - 1, shadowW, shadowH, "#071018", 4, 0.42);
    ctx.save();
    ctx.globalAlpha = 0.2 + motion.attackGlow * 0.18;
    drawRect(x - shadowW / 2 + 11, anchorY - 3, shadowW - 22, 2, accent);
    drawRect(x - shadowW / 2 + 26, anchorY + 2, shadowW - 52, 2, alt);
    ctx.restore();
  }

  function drawGeneratedEvolutionUpgrades(species, cx, anchorY, w, h, accent, alt, motion, back) {
    if (!species || species.stageIndex <= 0) return;
    const stagePower = Math.max(1, species.stageCount === 2 && species.stageIndex === 1 ? 2 : species.stageIndex);
    const top = anchorY - h;
    const unit = Math.max(2, Math.round(Math.min(w, h) / 34));
    const outline = "#02050a";
    const dark = "#071018";
    const shine = "#fff6d7";
    const pulse = Math.round(Math.sin((state.anim + Math.abs(hash(species.lineId))) / 170) * unit);
    const sideNudge = back ? -unit : unit;
    const block = (x, y, bw, bh, color) => drawRect(x, y, Math.max(unit, bw), Math.max(unit, bh), color);
    const x0 = (ratio) => cx + w * ratio;
    const y0 = (ratio) => top + h * ratio;

    block(x0(-0.34), y0(0.71), w * 0.68, unit * 3, outline);
    block(x0(-0.29), y0(0.71) + unit, w * 0.58, unit, accent);
    if (stagePower >= 2) {
      block(x0(-0.22), y0(0.78), w * 0.44, unit * 2, outline);
      block(x0(-0.17), y0(0.78), w * 0.34, unit, alt);
    }

    if (species.clan === "ogre") {
      block(x0(-0.36) - pulse, y0(0.12), unit * 7, unit * 4, outline);
      block(x0(-0.34) - pulse, y0(0.10), unit * 5, unit * 3, alt);
      block(x0(0.23) + pulse, y0(0.12), unit * 7, unit * 4, outline);
      block(x0(0.25) + pulse, y0(0.10), unit * 5, unit * 3, alt);
      block(x0(-0.45), y0(0.48), unit * 9, unit * 6, outline);
      block(x0(-0.43), y0(0.49), unit * 7, unit * 4, accent);
      block(x0(0.31), y0(0.48), unit * 9, unit * 6, outline);
      block(x0(0.33), y0(0.49), unit * 7, unit * 4, accent);
      if (stagePower >= 2) {
        block(x0(-0.07), y0(0.18), unit * 5, unit * 4, outline);
        block(x0(-0.05), y0(0.18), unit * 3, unit * 2, shine);
        block(x0(-0.5), y0(0.63), unit * 4, unit * 4, alt);
        block(x0(0.44), y0(0.63), unit * 4, unit * 4, alt);
      }
    } else if (species.clan === "alien") {
      block(cx - unit, top - unit * 7 + pulse, unit * 2, unit * 7, outline);
      block(cx, top - unit * 6 + pulse, unit, unit * 5, accent);
      block(x0(-0.23), top - unit * 5 + pulse, unit * 9, unit * 2, outline);
      block(x0(-0.2), top - unit * 4 + pulse, unit * 6, unit, alt);
      block(x0(-0.43), y0(0.36), unit * 7, unit * 7, outline);
      block(x0(-0.41), y0(0.38), unit * 5, unit * 4, accent);
      block(x0(0.31), y0(0.36), unit * 7, unit * 7, outline);
      block(x0(0.33), y0(0.38), unit * 5, unit * 4, accent);
      block(x0(-0.04), y0(0.47), unit * 4, unit * 4, outline);
      block(x0(-0.02), y0(0.48), unit * 2, unit * 2, shine);
      if (stagePower >= 2) {
        block(x0(-0.3) - sideNudge, y0(0.18), unit * 5, unit * 3, alt);
        block(x0(0.24) + sideNudge, y0(0.18), unit * 5, unit * 3, alt);
        block(x0(-0.17), anchorY - unit * 4, unit * 4, unit * 4, accent);
        block(x0(0.1), anchorY - unit * 4, unit * 4, unit * 4, alt);
      }
    } else if (species.clan === "goblin") {
      block(x0(-0.42), y0(0.22), unit * 8, unit * 5, outline);
      block(x0(-0.4), y0(0.22), unit * 6, unit * 3, alt);
      block(x0(0.3), y0(0.22), unit * 8, unit * 5, outline);
      block(x0(0.32), y0(0.22), unit * 6, unit * 3, alt);
      block(x0(-0.52), y0(0.56), unit * 10, unit * 4, outline);
      block(x0(-0.49), y0(0.56), unit * 8, unit * 2, shine);
      block(x0(0.38), y0(0.56), unit * 10, unit * 4, outline);
      block(x0(0.4), y0(0.56), unit * 8, unit * 2, shine);
      block(x0(-0.18), y0(0.66), unit * 5, unit * 4, outline);
      block(x0(-0.16), y0(0.67), unit * 3, unit * 2, accent);
      block(x0(0.11), y0(0.66), unit * 5, unit * 4, outline);
      block(x0(0.13), y0(0.67), unit * 3, unit * 2, accent);
      if (stagePower >= 2) {
        block(x0(-0.13), top - unit * 3, unit * 9, unit * 5, outline);
        block(x0(-0.1), top - unit * 2, unit * 3, unit * 3, accent);
        block(x0(0.02), top - unit * 3, unit * 3, unit * 4, alt);
        block(x0(0.13), top - unit * 2, unit * 3, unit * 3, accent);
      }
    } else {
      block(x0(-0.18), top - unit * 6 + pulse, unit * 4, unit * 6, outline);
      block(x0(-0.16), top - unit * 5 + pulse, unit * 2, unit * 3, "#f3d35b");
      block(x0(-0.03), top - unit * 8 + pulse, unit * 4, unit * 8, outline);
      block(x0(-0.01), top - unit * 7 + pulse, unit * 2, unit * 5, alt);
      block(x0(0.12), top - unit * 6 + pulse, unit * 4, unit * 6, outline);
      block(x0(0.14), top - unit * 5 + pulse, unit * 2, unit * 3, "#f3d35b");
      for (let i = 0; i < 7 + stagePower * 2; i += 1) {
        const seed = Math.abs(hash(`${species.lineId}:${i}:glitch`));
        const gx = x0(((seed % 96) / 100) - 0.48);
        const gy = y0(0.1 + (((seed >> 7) % 72) / 100));
        const color = i % 3 === 0 ? "#ff72e1" : i % 3 === 1 ? accent : alt;
        block(gx, gy, unit * 2, unit * 2, color);
      }
      if (stagePower >= 2) {
        block(x0(-0.39), y0(0.42), unit * 6, unit * 6, outline);
        block(x0(-0.37), y0(0.44), unit * 4, unit * 3, accent);
        block(x0(0.31), y0(0.42), unit * 6, unit * 6, outline);
        block(x0(0.33), y0(0.44), unit * 4, unit * 3, alt);
      }
    }

    if (motion.attackGlow > 0.08) {
      block(x0(-0.45), top - unit * 2, w * 0.9, unit, accent);
      block(x0(-0.36), anchorY + unit, w * 0.72, unit, alt);
    }
    block(x0(-0.08), y0(0.55), unit * 6, unit * 2, dark);
    block(x0(-0.04), y0(0.55), unit * 3, unit, shine);
  }

  function drawCreatureSprite(species, cx, cy, scale = 2, back = false, side = "") {
    const clan = species.clan;
    const colors = spriteColors(species);
    const fx = state.battle?.fx;
    const motion = battleSpriteMotion(side, species);
    const fxColor = TYPE_COLORS[fx?.moveType] || colors.accent || "#f3d35b";
    const s = scale * motion.scale;
    const x = cx + motion.x;
    const y = cy + motion.y;
    const assetId = displaySpriteId(species.id);
    const usesFallbackSprite = assetId !== species.id;
    const spriteImg = getSpriteImage(species.id, back ? "back" : "front");
    if (spriteImg) {
      const presentedScale = battleSpritePresentation(species, s, back);
      const spriteScale = Math.max(0.35, presentedScale / 2.34);
      const w = Math.round(spriteImg.naturalWidth * spriteScale);
      const h = Math.round(spriteImg.naturalHeight * spriteScale);
      const anchorY = y + 16 * s;
      const topY = anchorY - h;
      const altColor = TYPE_COLORS[species.elements[1] || species.elements[0]] || "#fff6d7";
      drawCreatureContactShadow(x, anchorY, w, h, species, motion);
      drawActorRim(x, topY, w, h, fxColor, motion.attackGlow * 0.48);
      drawPremiumSpriteMat(spriteImg, Math.round(x - w / 2), Math.round(topY), w, h, fxColor, altColor, motion.attackGlow, side);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowOffsetX = Math.max(1, Math.round(1.2 * spriteScale));
      ctx.shadowOffsetY = Math.max(1, Math.round(1.4 * spriteScale));
      ctx.drawImage(spriteImg, Math.round(x - w / 2), Math.round(topY), w, h);
      ctx.restore();
      drawSpriteHitSheen(x - w / 2, topY, w, h, fxColor, motion.hitFlash);
      if (usesFallbackSprite && species.stageIndex > 0) {
        drawGeneratedEvolutionUpgrades(species, x, anchorY, w, h, fxColor, altColor, motion, back);
      }
      if (species.legendary) {
        const aura = Math.floor((Math.sin(state.anim / 180) + 1) * 3);
        drawRect(x - w / 2 - 3 - aura, anchorY - h - 3 - aura, w + 6 + aura * 2, 3, "#f3d35b");
        drawRect(x - w / 2 - 3 - aura, anchorY - 2 + aura, w + 6 + aura * 2, 3, "#ff72e1");
      }
      return;
    }
    drawEllipse(x, y + 10 * s, 44 * s, 12 * s, "rgba(0,0,0,0.28)");
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowOffsetX = Math.max(1, Math.round(1.2 * s));
    ctx.shadowOffsetY = Math.max(1, Math.round(1.2 * s));
    if (clan === "ogre") {
      px(x - 18 * s, y - 26 * s, 36 * s, 32 * s, colors.body);
      px(x - 26 * s, y - 10 * s, 16 * s, 22 * s, colors.accent);
      px(x + 10 * s, y - 10 * s, 16 * s, 22 * s, colors.accent);
      px(x - 12 * s, y - 36 * s, 24 * s, 18 * s, colors.face);
      px(x - 15 * s, y - 38 * s, 8 * s, 8 * s, colors.horn);
      px(x + 7 * s, y - 38 * s, 8 * s, 8 * s, colors.horn);
    } else if (clan === "alien") {
      px(x - 14 * s, y - 30 * s, 28 * s, 34 * s, colors.body);
      px(x - 20 * s, y - 44 * s, 40 * s, 20 * s, colors.face);
      px(x - 26 * s, y - 12 * s, 12 * s, 8 * s, colors.accent);
      px(x + 14 * s, y - 12 * s, 12 * s, 8 * s, colors.accent);
      px(x - 3 * s, y - 54 * s, 6 * s, 12 * s, colors.horn);
    } else if (clan === "goblin") {
      px(x - 12 * s, y - 25 * s, 24 * s, 26 * s, colors.body);
      px(x - 17 * s, y - 35 * s, 34 * s, 18 * s, colors.face);
      px(x - 28 * s, y - 33 * s, 12 * s, 8 * s, colors.horn);
      px(x + 16 * s, y - 33 * s, 12 * s, 8 * s, colors.horn);
      px(x - 20 * s, y - 8 * s, 10 * s, 16 * s, colors.accent);
      px(x + 10 * s, y - 8 * s, 10 * s, 16 * s, colors.accent);
    } else {
      px(x - 18 * s, y - 28 * s, 36 * s, 30 * s, colors.body);
      px(x - 24 * s, y - 18 * s, 12 * s, 22 * s, colors.accent);
      px(x + 12 * s, y - 18 * s, 12 * s, 22 * s, colors.accent);
      px(x - 10 * s, y - 42 * s, 20 * s, 18 * s, colors.face);
      px(x - 3 * s, y - 54 * s, 6 * s, 12 * s, colors.horn);
    }
    ctx.restore();
    px(x - 12 * s, y - 22 * s, 8 * s, 5 * s, "rgba(255,255,255,0.18)");
    px(x + 7 * s, y - 4 * s, 8 * s, 4 * s, "rgba(0,0,0,0.16)");
    const eyeY = clan === "brainrot" ? y - 35 * s : y - 29 * s;
    const eyeColor = back ? "#cde8f5" : "#111820";
    px(x - 8 * s, eyeY, 4 * s, 4 * s, eyeColor);
    px(x + 5 * s, eyeY, 4 * s, 4 * s, eyeColor);
    px(x - 1 * s, eyeY + 8 * s, 8 * s, 2 * s, back ? "#cde8f5" : "#071018");
    if (clan === "ogre") {
      px(x - 20 * s, y - 22 * s, 5 * s, 9 * s, shade(colors.body, -18));
      px(x + 15 * s, y - 22 * s, 5 * s, 9 * s, shade(colors.body, -18));
    } else if (clan === "alien") {
      px(x - 11 * s, y - 18 * s, 22 * s, 3 * s, "#101820");
      px(x - 2 * s, y - 51 * s, 4 * s, 4 * s, "#f3d35b");
    } else if (clan === "goblin") {
      px(x - 4 * s, y - 13 * s, 8 * s, 7 * s, "#f3d35b");
      px(x - 3 * s, y - 12 * s, 5 * s, 3 * s, "#071018");
    } else {
      px(x - 14 * s, y - 8 * s, 8 * s, 8 * s, "#4ed5cf");
      px(x + 7 * s, y - 31 * s, 5 * s, 5 * s, "#fff6d7");
    }
    if (species.stageIndex > 0) {
      drawGeneratedEvolutionUpgrades(species, x, y + 16 * s, 58 * s, 88 * s, colors.accent, colors.horn, motion, back);
    }
    if (species.legendary) {
      px(x - 16 * s, y - 59 * s, 32 * s, 6 * s, "#f3d35b");
      px(x - 10 * s, y - 68 * s, 7 * s, 9 * s, "#f3d35b");
      px(x - 2 * s, y - 72 * s, 5 * s, 13 * s, "#fff6d7");
      px(x + 4 * s, y - 68 * s, 7 * s, 9 * s, "#f3d35b");
    }
    drawActorRim(x, y - 76 * s, 58 * s, 88 * s, fxColor, motion.attackGlow * 0.72);
    drawSpriteHitSheen(x - 29 * s, y - 76 * s, 58 * s, 88 * s, fxColor, motion.hitFlash);
  }

  function spriteColors(species) {
    const base = TYPE_COLORS[species.elements[0]];
    const accent = TYPE_COLORS[species.elements[1] || species.elements[0]];
    return {
      body: base,
      accent,
      face: shade(base, 34),
      horn: shade(accent, 26),
    };
  }

  function px(x, y, w, h, color) {
    drawRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h), color);
  }

  const PIXEL_FONT = {
    " ": ["000", "000", "000", "000", "000", "000", "000"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
    X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
    "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
    "6": ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
    "!": ["001", "001", "001", "001", "001", "000", "001"],
    "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
    ".": ["000", "000", "000", "000", "000", "011", "011"],
    ",": ["000", "000", "000", "000", "011", "001", "010"],
    ":": ["000", "011", "011", "000", "011", "011", "000"],
    "'": ["01", "01", "10", "00", "00", "00", "00"],
    "-": ["0000", "0000", "0000", "1111", "0000", "0000", "0000"],
    "+": ["000", "010", "010", "111", "010", "010", "000"],
    "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
    "%": ["11001", "11010", "00100", "01000", "10110", "00110", "00000"],
    "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
    "$": ["01111", "10100", "10100", "01110", "00101", "00101", "11110"],
  };

  function drawPixelText(text, x, y, scale, fill, stroke) {
    const value = String(text).toUpperCase();
    if (stroke) drawBitmapText(value, x + scale, y + scale, scale, stroke);
    drawBitmapText(value, x, y, scale, fill);
  }

  function drawBitmapText(text, x, y, scale, fill) {
    let cursorX = x;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = fill;
    for (const ch of text) {
      if (ch === "\n") {
        cursorX = x;
        y += 9 * scale;
        continue;
      }
      const glyph = PIXEL_FONT[ch] || PIXEL_FONT["?"];
      for (let gy = 0; gy < glyph.length; gy += 1) {
        const row = glyph[gy];
        for (let gx = 0; gx < row.length; gx += 1) {
          if (row[gx] === "1") {
            ctx.fillRect(
              Math.round(cursorX + gx * scale),
              Math.round(y + gy * scale),
              Math.max(1, Math.round(scale)),
              Math.max(1, Math.round(scale))
            );
          }
        }
      }
      cursorX += (glyph[0].length + 1) * scale;
    }
    ctx.restore();
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawEllipse(x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tileAt(x, y) {
    if (!inWorld(x, y)) return "wall";
    return WORLD.tiles[y][x];
  }

  function inWorld(x, y) {
    return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
  }

  function npcVisible(npc) {
    if (npc.villain) {
      if (state.player?.defeated[npc.id]) return false;
      return state.player?.badges.length >= npc.requiresBadges;
    }
    return true;
  }

  function frontCoord() {
    const dir = state.player.facing;
    const delta = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    }[dir] || [0, 1];
    return [state.player.x + delta[0], state.player.y + delta[1]];
  }

  function signText(x, y) {
    const place = placeAt(x, y);
    if (place?.key === "duelplaza") return "Prism Duel Plaza: stand near trainers, challenge them, and build a local streak. Server clock owns PvP.";
    const biome = biomeName(biomeForCoord(x, y));
    if (x < 22 && y > 56) return "Memelet Town: please keep first-bond choices inside the lab until emotionally ready.";
    if (biome.includes("Ogre")) return "Ogre Highlands: stronghold ahead, bring snacks and a second helmet.";
    if (biome.includes("Alien")) return "Alien Nebula: do not feed the satellites after midnight.";
    if (biome.includes("Goblin")) return "Goblin Warrens: if your wallet is missing, check the wallet-shaped hole.";
    return "Brainrot Dimension: reality may lag, buffer, or ask you to like and subscribe.";
  }

  function distanceTo(x, y) {
    return Math.abs(state.player.x - x) + Math.abs(state.player.y - y);
  }

  function isFainted(creature) {
    return !creature || creature.hp <= 0;
  }

  function firstAliveIndex(party) {
    return party.findIndex((creature) => creature.hp > 0);
  }

  function stagedStat(creature, key, stages) {
    const base = calcStats(creature)[key];
    const stage = stages[key] || 0;
    const mod = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
    let value = base * mod;
    if (creature.status === "burn" && key === "atk") value *= 0.72;
    if (creature.status === "zap" && key === "spe") value *= 0.65;
    return Math.max(1, Math.floor(value));
  }

  function typeMultiplier(attackType, defenderTypes) {
    return defenderTypes.reduce((mult, type) => mult * (TYPE_CHART[attackType]?.[type] || 1), 1);
  }

  function statLabel(stat) {
    return { atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed", acc: "Accuracy" }[stat] || stat;
  }

  function statusLabel(status) {
    return {
      burn: "BRN",
      poison: "PSN",
      zap: "ZAP",
      sleep: "SLP",
      confuse: "CNF",
      flinch: "FLN",
    }[status] || String(status).slice(0, 3).toUpperCase();
  }

  function timeOfDay() {
    if (!state.player) return "Day";
    const minutes = state.player.clock % 1440;
    if (minutes < 360) return "Night";
    if (minutes < 660) return "Dawn";
    if (minutes < 1080) return "Day";
    if (minutes < 1260) return "Dusk";
    return "Night";
  }

  function weatherName() {
    const biome = currentBiome();
    const bucket = Math.floor((state.player?.clock || 0) / 180) % 4;
    if (biome === "alien" && bucket === 1) return "Meteor Drizzle";
    if (biome === "brainrot" && bucket !== 2) return "Glitch Rain";
    if (biome === "goblin" && bucket === 2) return "Warren Fog";
    if (biome === "ogre" && bucket === 0) return "Highland Gusts";
    return "Clear";
  }

  function shade(hex, amount) {
    const clean = hex.replace("#", "");
    const num = parseInt(clean, 16);
    const r = clamp((num >> 16) + amount, 0, 255);
    const g = clamp(((num >> 8) & 255) + amount, 0, 255);
    const b = clamp((num & 255) + amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function titleCase(text) {
    return text.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }
})();
