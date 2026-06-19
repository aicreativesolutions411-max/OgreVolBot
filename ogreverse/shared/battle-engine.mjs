const ARCHETYPES = {
  OGR: {
    label: "Ogre",
    hp: 54,
    atk: 15,
    def: 13,
    spe: 7,
    weakTo: ["Psychic", "Chaos", "Water"],
    resists: ["Rock", "Brute", "Normal"],
    moves: [
      ["hamfist_tango", "Hamfist Tango", "Brute", 42, 96, 18, { status: "Rattled", chance: 22, turns: 2 }],
      ["pebble_yeet", "Pebble Yeet", "Rock", 36, 100, 22],
      ["knuckle_sandwich", "Knuckle Sandwich", "Brute", 54, 88, 12],
      ["stubborn_wallop", "Stubborn Wallop", "Rock", 48, 92, 14],
    ],
  },
  ALN: {
    label: "Alien",
    hp: 42,
    atk: 13,
    def: 9,
    spe: 15,
    weakTo: ["Dark", "Trick", "Electric"],
    resists: ["Tech", "Psychic", "Flying"],
    moves: [
      ["signal_ping", "Signal Ping", "Tech", 36, 100, 22, { status: "Jammed", chance: 28, turns: 2 }],
      ["void_whisper", "Void Whisper", "Psychic", 42, 94, 18, { status: "Dazed", chance: 26, turns: 2 }],
      ["antenna_laser", "Antenna Laser", "Tech", 56, 86, 12],
      ["brain_upload", "Brain Upload", "Psychic", 50, 90, 14],
    ],
  },
  GBL: {
    label: "Goblin",
    hp: 46,
    atk: 14,
    def: 10,
    spe: 14,
    weakTo: ["Fire", "Flying", "Fairy"],
    resists: ["Dark", "Trick", "Poison"],
    moves: [
      ["pocket_sand", "Pocket Sand", "Trick", 34, 100, 24, { status: "Blinded", chance: 100, turns: 2 }],
      ["shadow_pock", "Shadow Pock", "Dark", 42, 94, 18],
      ["receipt_stab", "Receipt Stab", "Dark", 54, 88, 12],
      ["mushroom_mug", "Mushroom Mug", "Poison", 46, 92, 14, { status: "Poisoned", chance: 34, turns: 4 }],
    ],
  },
  BRT: {
    label: "Brainrot",
    hp: 48,
    atk: 14,
    def: 9,
    spe: 12,
    weakTo: ["Steel", "Poison", "Tech"],
    resists: ["Chaos", "Ghost", "Psychic"],
    moves: [
      ["skibidi_spin", "Skibidi Spin", "Chaos", 38, 98, 22, { status: "Confused", chance: 38, turns: 2 }],
      ["rizz_drain", "Rizz Drain", "Psychic", 42, 94, 18, { drain: 0.4 }],
      ["doomscroll_pulse", "Doomscroll Pulse", "Ghost", 56, 86, 12, { status: "Doomscroll", chance: 32, turns: 3 }],
      ["ohio_clause", "Ohio Clause", "Chaos", 50, 90, 14, { status: "Confused", chance: 24, turns: 2 }],
    ],
  },
};

const STATUS_META = {
  Blinded: { label: "BLIND", accuracyPenalty: 18 },
  Confused: { label: "CONF", skipChance: 25 },
  Dazed: { label: "DAZE", skipChance: 18 },
  Doomscroll: { label: "DOOM", damageDivisor: 14, speedMultiplier: 0.85 },
  Jammed: { label: "JAM", speedMultiplier: 0.72 },
  Poisoned: { label: "PSN", damageDivisor: 10 },
  Rattled: { label: "RATL", attackMultiplier: 0.86 },
};

const ITEM_DEFS = {
  mend_orb: {
    name: "Mend Orb",
    label: "HEAL",
    quantity: 2,
    description: "Restores 35% HP to the active creature.",
    priority: 1,
    apply(room, side, target) {
      if (!target || target.hp <= 0) throw new Error("bad_item_target");
      const amount = Math.max(1, Math.round(target.maxHp * 0.35));
      const healed = Math.min(target.maxHp - target.hp, amount);
      target.hp = clamp(target.hp + healed, 0, target.maxHp);
      return {
        kind: "item",
        playerId: side.playerId,
        playerName: side.name,
        itemName: "Mend Orb",
        creatureName: target.name,
        heal: healed,
      };
    },
  },
  clear_cache: {
    name: "Clear Cache",
    label: "CLEAN",
    quantity: 1,
    description: "Removes the active creature's status problem.",
    priority: 1,
    apply(room, side, target) {
      if (!target || target.hp <= 0 || !target.status) throw new Error("bad_item_target");
      const oldStatus = target.status;
      target.status = null;
      target.statusTurns = 0;
      target.statusAppliedTurn = 0;
      return {
        kind: "item",
        playerId: side.playerId,
        playerName: side.name,
        itemName: "Clear Cache",
        creatureName: target.name,
        clearedStatus: oldStatus,
      };
    },
  },
  pp_crisp: {
    name: "PP Crisp",
    label: "PP",
    quantity: 1,
    description: "Restores 6 PP to the active creature's lowest move.",
    priority: 1,
    apply(room, side, target) {
      if (!target || target.hp <= 0) throw new Error("bad_item_target");
      const move = target.moves
        .filter((item) => item.pp < item.maxPp)
        .sort((a, b) => (a.pp / Math.max(1, a.maxPp)) - (b.pp / Math.max(1, b.maxPp)))[0];
      if (!move) throw new Error("bad_item_target");
      const restored = Math.min(6, move.maxPp - move.pp);
      move.pp += restored;
      return {
        kind: "item",
        playerId: side.playerId,
        playerName: side.name,
        itemName: "PP Crisp",
        creatureName: target.name,
        moveName: move.name,
        pp: restored,
      };
    },
  },
};

const DEFAULT_TURN_TIMEOUT_MS = 45000;
const MIN_TURN_TIMEOUT_MS = 250;

function prefixFor(speciesId = "") {
  const prefix = String(speciesId).slice(0, 3).toUpperCase();
  return ARCHETYPES[prefix] ? prefix : "OGR";
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

function makeMoves(archetype) {
  return archetype.moves.map(([id, name, type, power, accuracy, pp, effect = null]) => ({
    id,
    name,
    type,
    power,
    accuracy,
    pp,
    maxPp: pp,
    effect,
  }));
}

function moveEffectLabel(move) {
  if (!move.effect) return "SERVER";
  if (move.effect.drain) return "DRAIN";
  if (move.effect.status) return `${STATUS_META[move.effect.status]?.label || move.effect.status.toUpperCase()} ${move.effect.chance || 0}%`;
  return "EFFECT";
}

function partyEntriesFor(session) {
  const party = Array.isArray(session.party) ? session.party.filter(Boolean).slice(0, 6) : [];
  if (party.length) return party;
  return [
    {
      speciesId: session.leadSpecies || "OGR001",
      name: session.leadName || "First Bond",
      level: session.leadLevel || 5,
    },
  ];
}

function createCreature(entry = {}, fallbackSession = {}, slot = 0) {
  const speciesId = String(entry.speciesId || entry.id || entry.leadSpecies || (slot === 0 ? fallbackSession.leadSpecies : "") || "OGR001").slice(0, 12);
  const prefix = prefixFor(speciesId);
  const archetype = ARCHETYPES[prefix];
  const level = clamp(Number(entry.level || (slot === 0 ? fallbackSession.leadLevel : 5) || 5), 1, 100);
  const maxHp = Math.round(archetype.hp + level * 4.2);
  const suppliedHp = Number(entry.hp);
  const hp = Number.isFinite(suppliedHp) ? clamp(Math.round(suppliedHp), 0, maxHp) : maxHp;
  return {
    speciesId,
    name: String(entry.name || entry.nickname || (slot === 0 ? fallbackSession.leadName : "") || archetype.label).slice(0, 24),
    clan: archetype.label,
    level,
    hp,
    maxHp,
    atk: Math.round(archetype.atk + level * 1.35),
    def: Math.round(archetype.def + level * 1.05),
    spe: Math.round(archetype.spe + level * 1.12),
    weakTo: archetype.weakTo,
    resists: archetype.resists,
    status: entry.status || null,
    statusTurns: Math.max(0, Number(entry.statusTurns || 0)),
    statusAppliedTurn: 0,
    moves: makeMoves(archetype),
  };
}

function createParty(session) {
  const party = partyEntriesFor(session).map((entry, index) => createCreature(entry, session, index));
  if (!party.some((creature) => creature.hp > 0) && party[0]) party[0].hp = party[0].maxHp;
  return party;
}

function createItemStock(session = {}) {
  const supplied = session.pvpItems && typeof session.pvpItems === "object" ? session.pvpItems : {};
  const stock = {};
  Object.entries(ITEM_DEFS).forEach(([id, item]) => {
    const value = Number(supplied[id]);
    stock[id] = Number.isFinite(value) ? clamp(Math.floor(value), 0, item.quantity) : item.quantity;
  });
  return stock;
}

function firstLivingIndex(side) {
  return side.party.findIndex((creature) => creature.hp > 0);
}

function activeCreature(side) {
  return side.party[side.activeIndex] || side.party[firstLivingIndex(side)] || side.party[0];
}

function hasLivingCreature(side) {
  return firstLivingIndex(side) >= 0;
}

function canSwitch(side, targetIndex) {
  return Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < side.party.length && targetIndex !== side.activeIndex && side.party[targetIndex].hp > 0;
}

export function createDuelRoom({ id, players, createdAt = Date.now(), seed = "", turnTimeoutMs = DEFAULT_TURN_TIMEOUT_MS }) {
  if (!id) throw new Error("Room id required.");
  if (!Array.isArray(players) || players.length !== 2) throw new Error("Duel room requires exactly two players.");
  const sides = players.map((session, index) => {
    const party = createParty(session);
    return {
      playerId: session.id,
      name: String(session.name || `Player ${index + 1}`).slice(0, 18),
      activeIndex: Math.max(0, party.findIndex((creature) => creature.hp > 0)),
      party,
      items: createItemStock(session),
    };
  });
  return {
    id,
    createdAt,
    seed: seed || `${id}:${createdAt}`,
    turn: 1,
    status: "select",
    winnerId: null,
    timeoutLoserId: null,
    choices: {},
    sides,
    turnTimeoutMs: Math.max(MIN_TURN_TIMEOUT_MS, Number(turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS)),
    deadlineAt: createdAt + Math.max(MIN_TURN_TIMEOUT_MS, Number(turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS)),
    log: ["Server room opened. Choose a move or switch."],
    lastEvents: [],
    updatedAt: createdAt,
  };
}

function sideFor(room, playerId) {
  return room.sides.find((side) => side.playerId === playerId) || null;
}

function opponentFor(room, playerId) {
  return room.sides.find((side) => side.playerId !== playerId) || null;
}

function publicCreature(creature) {
  return {
    speciesId: creature.speciesId,
    name: creature.name,
    clan: creature.clan,
    level: creature.level,
    hp: creature.hp,
    maxHp: creature.maxHp,
    fainted: creature.hp <= 0,
    status: creature.status,
    statusLabel: creature.status ? STATUS_META[creature.status]?.label || String(creature.status).slice(0, 4).toUpperCase() : "",
    statusTurns: creature.statusTurns || 0,
    moves: creature.moves.map((move) => ({
      id: move.id,
      name: move.name,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      maxPp: move.maxPp,
      effectLabel: moveEffectLabel(move),
    })),
  };
}

function publicSide(side, ready) {
  return {
    playerId: side.playerId,
    name: side.name,
    activeIndex: side.activeIndex,
    creature: publicCreature(activeCreature(side)),
    party: side.party.map((creature, index) => ({
      ...publicCreature(creature),
      active: index === side.activeIndex,
      slot: index,
    })),
    items: Object.entries(ITEM_DEFS).map(([id, item]) => ({
      id,
      name: item.name,
      label: item.label,
      description: item.description,
      quantity: side.items?.[id] || 0,
    })),
    ready,
  };
}

export function publicDuelView(room, playerId) {
  const you = sideFor(room, playerId);
  const foe = opponentFor(room, playerId);
  if (!you || !foe) throw new Error("Player is not in this room.");
  return {
    id: room.id,
    turn: room.turn,
    status: room.status,
    winnerId: room.winnerId,
    timeoutLoserId: room.timeoutLoserId,
    deadlineAt: room.deadlineAt,
    serverTime: Date.now(),
    turnTimeoutMs: room.turnTimeoutMs,
    you: publicSide(you, Boolean(room.choices[you.playerId])),
    foe: publicSide(foe, Boolean(room.choices[foe.playerId])),
    log: room.log.slice(0, 8),
    lastEvents: room.lastEvents,
  };
}

function moveById(creature, moveId) {
  return creature.moves.find((move) => move.id === moveId) || creature.moves.find((move) => move.pp > 0) || creature.moves[0];
}

function statusMeta(creature) {
  return creature?.status ? STATUS_META[creature.status] || {} : {};
}

function effectiveSpeed(creature) {
  return Math.max(1, Math.round((creature?.spe || 1) * (statusMeta(creature).speedMultiplier || 1)));
}

function effectiveAttack(creature) {
  return Math.max(1, Math.round((creature?.atk || 1) * (statusMeta(creature).attackMultiplier || 1)));
}

function effectiveAccuracy(move, attacker) {
  return clamp((move?.accuracy || 100) - (statusMeta(activeCreature(attacker)).accuracyPenalty || 0), 1, 100);
}

function effectiveness(move, defender) {
  if (defender.weakTo.includes(move.type)) return 1.6;
  if (defender.resists.includes(move.type)) return 0.65;
  return 1;
}

function accuracyRoll(room, move, attacker, defender) {
  const roll = hash(`${room.seed}:${room.turn}:${attacker.playerId}:${defender.playerId}:${move.id}`) % 100;
  return roll < effectiveAccuracy(move, attacker);
}

function damageFor(room, move, attacker, defender) {
  const attackerCreature = activeCreature(attacker);
  const defenderCreature = activeCreature(defender);
  const critRoll = hash(`${room.seed}:crit:${room.turn}:${attacker.playerId}:${move.id}`) % 100;
  const variance = 0.88 + (hash(`${room.seed}:var:${room.turn}:${move.id}:${defender.playerId}`) % 18) / 100;
  const crit = critRoll < 8 ? 1.5 : 1;
  const eff = effectiveness(move, defenderCreature);
  const raw = (((attackerCreature.level * 0.42 + 2) * move.power * effectiveAttack(attackerCreature)) / Math.max(12, defenderCreature.def)) / 11 + 2;
  return {
    damage: Math.max(1, Math.round(raw * variance * crit * eff)),
    crit,
    effectiveness: eff,
  };
}

function maybeApplyMoveEffect(room, move, attacker, defender, event) {
  const effect = move.effect;
  const attackerCreature = activeCreature(attacker);
  const defenderCreature = activeCreature(defender);
  if (!effect || !event.hit || !defenderCreature || defenderCreature.hp <= 0) return;
  if (effect.drain && event.damage > 0 && attackerCreature.hp > 0) {
    const heal = Math.min(attackerCreature.maxHp - attackerCreature.hp, Math.max(1, Math.round(event.damage * effect.drain)));
    attackerCreature.hp = clamp(attackerCreature.hp + heal, 0, attackerCreature.maxHp);
    event.drain = heal;
  }
  if (effect.status && !defenderCreature.status) {
    const roll = hash(`${room.seed}:status:${room.turn}:${attacker.playerId}:${defender.playerId}:${move.id}`) % 100;
    if (roll < (effect.chance || 0)) {
      defenderCreature.status = effect.status;
      defenderCreature.statusTurns = Math.max(1, Number(effect.turns || 2));
      defenderCreature.statusAppliedTurn = room.turn;
      event.statusApplied = effect.status;
      event.statusLabel = STATUS_META[effect.status]?.label || effect.status.toUpperCase();
    }
  }
}

function applyMove(room, attacker, defender, moveId) {
  if (room.winnerId) return null;
  const attackerCreature = activeCreature(attacker);
  const defenderCreature = activeCreature(defender);
  const move = moveById(attackerCreature, moveId);
  const event = {
    kind: "move",
    attackerId: attacker.playerId,
    attackerName: attackerCreature.name,
    defenderId: defender.playerId,
    defenderName: defenderCreature.name,
    moveId: move.id,
    moveName: move.name,
    type: move.type,
    hit: false,
    damage: 0,
    effectiveness: 1,
    crit: false,
  };
  if (!move || move.pp <= 0) {
    event.moveName = "Struggle Buffer";
    event.damage = Math.max(1, Math.round(attackerCreature.level * 0.8));
    defenderCreature.hp = clamp(defenderCreature.hp - event.damage, 0, defenderCreature.maxHp);
    event.hit = true;
    return event;
  }
  move.pp -= 1;
  if (!accuracyRoll(room, move, attacker, defender)) return event;
  const damage = damageFor(room, move, attacker, defender);
  event.hit = true;
  event.damage = damage.damage;
  event.effectiveness = damage.effectiveness;
  event.crit = damage.crit > 1;
  defenderCreature.hp = clamp(defenderCreature.hp - event.damage, 0, defenderCreature.maxHp);
  maybeApplyMoveEffect(room, move, attacker, defender, event);
  return event;
}

function switchSide(side, targetIndex, automatic = false) {
  const next = side.party[targetIndex];
  side.activeIndex = targetIndex;
  return {
    kind: automatic ? "autoSwitch" : "switch",
    playerId: side.playerId,
    playerName: side.name,
    creatureName: next.name,
    targetIndex,
  };
}

function autoPromote(side) {
  const nextIndex = firstLivingIndex(side);
  if (nextIndex < 0) return null;
  return switchSide(side, nextIndex, true);
}

function eventLine(event) {
  if (event.kind === "surrender") return `${event.playerName} surrendered the server duel.`;
  if (event.kind === "timeout") return `${event.playerName} timed out; ${event.winnerName} wins by server clock.`;
  if (event.kind === "item") {
    if (event.heal) return `${event.playerName} used ${event.itemName}; ${event.creatureName} healed ${event.heal}.`;
    if (event.clearedStatus) return `${event.playerName} used ${event.itemName}; ${event.creatureName} cleared ${event.clearedStatus}.`;
    if (event.pp) return `${event.playerName} used ${event.itemName}; ${event.moveName} restored ${event.pp} PP.`;
    return `${event.playerName} used ${event.itemName}.`;
  }
  if (event.kind === "switch") return `${event.playerName} switched to ${event.creatureName}.`;
  if (event.kind === "autoSwitch") return `${event.playerName} sent in ${event.creatureName}.`;
  if (event.kind === "faint") return `${event.creatureName} fainted.`;
  if (event.kind === "statusDamage") return `${event.creatureName} took ${event.damage} from ${event.status}.`;
  if (event.kind === "statusClear") return `${event.creatureName} shook off ${event.status}.`;
  if (event.kind === "statusSkip") return `${event.creatureName} is ${event.status} and lost the beat.`;
  if (event.kind === "skip") return `${event.creatureName} could not move.`;
  if (!event.hit) return `${event.attackerName}'s ${event.moveName} missed.`;
  const crit = event.crit ? " Critical hit." : "";
  const eff = event.effectiveness > 1 ? " Super effective." : event.effectiveness < 1 ? " Resisted." : "";
  const drain = event.drain ? ` Drained ${event.drain}.` : "";
  const status = event.statusApplied ? ` ${event.defenderName} became ${event.statusApplied}.` : "";
  return `${event.attackerName} used ${event.moveName} for ${event.damage}.${crit}${eff}${drain}${status}`;
}

function normalizeChoice(side, action) {
  if (action && typeof action === "object" && action.kind === "surrender") {
    return { kind: "surrender", selectedAt: Date.now() };
  }
  if (action && typeof action === "object" && action.kind === "item") {
    const itemId = String(action.itemId || action.id || "");
    if (!ITEM_DEFS[itemId]) throw new Error("bad_item");
    if ((side.items?.[itemId] || 0) <= 0) throw new Error("item_empty");
    const targetIndex = Number.isInteger(Number(action.targetIndex)) ? Number(action.targetIndex) : side.activeIndex;
    if (targetIndex < 0 || targetIndex >= side.party.length) throw new Error("bad_item_target");
    const target = side.party[targetIndex];
    if (!target || target.hp <= 0) throw new Error("bad_item_target");
    return { kind: "item", itemId, targetIndex, selectedAt: Date.now() };
  }
  if (action && typeof action === "object" && action.kind === "switch") {
    const targetIndex = Number(action.targetIndex ?? action.index ?? action.slot);
    if (!canSwitch(side, targetIndex)) throw new Error("bad_switch");
    return { kind: "switch", targetIndex, selectedAt: Date.now() };
  }
  const moveId = action && typeof action === "object" ? action.moveId : action;
  const creature = activeCreature(side);
  const move = moveById(creature, moveId);
  return {
    kind: "move",
    moveId: move.id,
    activeIndex: side.activeIndex,
    creatureName: creature.name,
    selectedAt: Date.now(),
  };
}

function applyItemChoice(room, side, choice) {
  const item = ITEM_DEFS[choice.itemId];
  if (!item) throw new Error("bad_item");
  if ((side.items?.[choice.itemId] || 0) <= 0) throw new Error("item_empty");
  const target = side.party[choice.targetIndex];
  const event = item.apply(room, side, target);
  side.items[choice.itemId] = Math.max(0, (side.items[choice.itemId] || 0) - 1);
  return {
    ...event,
    itemId: choice.itemId,
    targetIndex: choice.targetIndex,
  };
}

function statusSkipEvent(room, side) {
  const creature = activeCreature(side);
  const meta = statusMeta(creature);
  if (!creature?.status || !meta.skipChance) return null;
  const roll = hash(`${room.seed}:skip:${room.turn}:${side.playerId}:${creature.status}`) % 100;
  if (roll >= meta.skipChance) return null;
  return {
    kind: "statusSkip",
    playerId: side.playerId,
    playerName: side.name,
    creatureName: creature.name,
    status: creature.status,
    statusLabel: meta.label || creature.status.toUpperCase(),
  };
}

function handleFaintAfterDamage(room, side, opponent, events) {
  const creature = activeCreature(side);
  if (!creature || creature.hp > 0) return;
  events.push({ kind: "faint", playerId: side.playerId, playerName: side.name, creatureName: creature.name });
  if (!hasLivingCreature(side)) {
    room.winnerId = opponent.playerId;
    return;
  }
  const promoteEvent = autoPromote(side);
  if (promoteEvent) events.push(promoteEvent);
}

function applyEndTurnStatuses(room, events) {
  for (const side of room.sides) {
    if (room.winnerId) break;
    const opponent = opponentFor(room, side.playerId);
    const creature = activeCreature(side);
    const meta = statusMeta(creature);
    if (!creature?.status || creature.hp <= 0) continue;
    if (meta.damageDivisor) {
      const damage = Math.max(1, Math.round(creature.maxHp / meta.damageDivisor));
      creature.hp = clamp(creature.hp - damage, 0, creature.maxHp);
      events.push({
        kind: "statusDamage",
        playerId: side.playerId,
        playerName: side.name,
        creatureName: creature.name,
        status: creature.status,
        statusLabel: meta.label || creature.status.toUpperCase(),
        damage,
      });
      handleFaintAfterDamage(room, side, opponent, events);
      if (room.winnerId || creature.hp <= 0) continue;
    }
    if (creature.statusAppliedTurn !== room.turn) {
      creature.statusTurns = Math.max(0, Number(creature.statusTurns || 0) - 1);
      if (creature.statusTurns <= 0) {
        const oldStatus = creature.status;
        creature.status = null;
        creature.statusAppliedTurn = 0;
        events.push({
          kind: "statusClear",
          playerId: side.playerId,
          playerName: side.name,
          creatureName: creature.name,
          status: oldStatus,
        });
      }
    }
  }
}

function completeBySurrender(room, side) {
  const foe = opponentFor(room, side.playerId);
  room.winnerId = foe.playerId;
  room.timeoutLoserId = null;
  room.status = "complete";
  room.choices = {};
  room.deadlineAt = null;
  room.lastEvents = [{ kind: "surrender", playerId: side.playerId, playerName: side.name }];
  room.log = [
    eventLine(room.lastEvents[0]),
    `${foe.name} won the server duel.`,
    ...room.log,
  ].slice(0, 10);
  room.updatedAt = Date.now();
}

function completeByTimeout(room, loser, winner, now = Date.now()) {
  room.winnerId = winner.playerId;
  room.timeoutLoserId = loser.playerId;
  room.status = "complete";
  room.choices = {};
  room.deadlineAt = null;
  room.lastEvents = [{
    kind: "timeout",
    playerId: loser.playerId,
    playerName: loser.name,
    winnerId: winner.playerId,
    winnerName: winner.name,
  }];
  room.log = [
    eventLine(room.lastEvents[0]),
    `${winner.name} won the server duel.`,
    ...room.log,
  ].slice(0, 10);
  room.updatedAt = now;
}

export function advanceDuelClock(room, now = Date.now()) {
  if (!room || room.status === "complete") return room;
  if (!room.deadlineAt) room.deadlineAt = now + (room.turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS);
  const choiceIds = Object.keys(room.choices || {});
  if (choiceIds.length === 1 && now >= room.deadlineAt) {
    const winner = sideFor(room, choiceIds[0]);
    const loser = opponentFor(room, choiceIds[0]);
    if (winner && loser) completeByTimeout(room, loser, winner, now);
    return room;
  }
  if (choiceIds.length === 0 && now >= room.deadlineAt) {
    room.deadlineAt = now + (room.turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS);
    room.updatedAt = now;
  }
  return room;
}

function resolveTurn(room) {
  const [a, b] = room.sides;
  const events = [];

  [a, b].forEach((side) => {
    const choice = room.choices[side.playerId];
    if (choice?.kind === "switch" && canSwitch(side, choice.targetIndex)) {
      events.push(switchSide(side, choice.targetIndex));
    }
  });

  [a, b].forEach((side) => {
    const choice = room.choices[side.playerId];
    if (choice?.kind === "item") {
      try {
        events.push(applyItemChoice(room, side, choice));
      } catch (error) {
        events.push({
          kind: "skip",
          playerId: side.playerId,
          playerName: side.name,
          creatureName: activeCreature(side)?.name || side.name,
          reason: String(error.message || error),
        });
      }
    }
  });

  const movers = [a, b]
    .filter((side) => room.choices[side.playerId]?.kind === "move")
    .sort((left, right) => {
      const rightSpeed = effectiveSpeed(activeCreature(right));
      const leftEffectiveSpeed = effectiveSpeed(activeCreature(left));
      if (rightSpeed !== leftEffectiveSpeed) return rightSpeed - leftEffectiveSpeed;
      return left.playerId.localeCompare(right.playerId);
    });

  for (const attacker of movers) {
    if (room.winnerId) break;
    const defender = attacker === a ? b : a;
    const choice = room.choices[attacker.playerId];
    const attackerCreature = activeCreature(attacker);
    const defenderCreature = activeCreature(defender);
    if (!attackerCreature || !defenderCreature || attackerCreature.hp <= 0 || defenderCreature.hp <= 0) continue;
    if (choice.activeIndex !== attacker.activeIndex) {
      events.push({ kind: "skip", playerId: attacker.playerId, playerName: attacker.name, creatureName: choice.creatureName || attackerCreature.name });
      continue;
    }
    const statusEvent = statusSkipEvent(room, attacker);
    if (statusEvent) {
      events.push(statusEvent);
      continue;
    }
    const event = applyMove(room, attacker, defender, choice.moveId);
    if (event) events.push(event);
    handleFaintAfterDamage(room, defender, attacker, events);
  }

  if (!room.winnerId) applyEndTurnStatuses(room, events);

  room.lastEvents = events;
  room.log = [
    ...events.map(eventLine).reverse(),
    ...(room.winnerId ? [`${sideFor(room, room.winnerId).name} won the server duel.`] : [`Turn ${room.turn} resolved by server.`]),
    ...room.log,
  ].slice(0, 10);
  room.choices = {};
  room.status = room.winnerId ? "complete" : "select";
  room.turn += room.winnerId ? 0 : 1;
  room.updatedAt = Date.now();
  room.deadlineAt = room.winnerId ? null : room.updatedAt + (room.turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS);
}

export function submitDuelChoice(room, playerId, action) {
  advanceDuelClock(room);
  const side = sideFor(room, playerId);
  if (!side) throw new Error("Player is not in this room.");
  if (room.status === "complete") return room;
  const choice = normalizeChoice(side, action);
  if (choice.kind === "surrender") {
    completeBySurrender(room, side);
    return room;
  }
  room.choices[playerId] = choice;
  room.status = Object.keys(room.choices).length >= 2 ? "resolving" : "waiting";
  room.deadlineAt = Date.now() + (room.turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS);
  room.log = [`${side.name} ${choice.kind === "switch" ? "queued a switch" : "locked a move"}.`, ...room.log].slice(0, 10);
  if (Object.keys(room.choices).length >= 2) resolveTurn(room);
  return room;
}
