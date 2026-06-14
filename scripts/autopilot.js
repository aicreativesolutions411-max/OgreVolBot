#!/usr/bin/env node
// Terminal control for the Live Autopilot. It talks to the always-on server
// (Render), so once you START it the loop runs in the background even if you
// close your laptop/phone. This script only sends commands.
//
// It authenticates with YOUR terminal session — no server env vars required.
// One-time login (get a code from Telegram with /web):
//
//   node scripts/autopilot.js login --code A1B2C3
//
// Then:
//   node scripts/autopilot.js wallets                                   # list your loaded wallets
//   node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen # PAPER (no SOL)
//   node scripts/autopilot.js start --sol 0.5 --minutes 60 --wallet 2 --live   # REAL SOL, wallet #2
//   node scripts/autopilot.js status
//   node scripts/autopilot.js stop                                      # kill switch
//
// API host defaults to the live server; override with AUTOPILOT_API.
// Headless boxes can skip login and set AUTOPILOT_CONTROL_KEY instead.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API = (process.env.AUTOPILOT_API || "https://ogrevolbot.onrender.com").replace(/\/$/, "");
const KEY = process.env.AUTOPILOT_CONTROL_KEY || "";
const TOKEN_FILE = path.join(os.homedir(), ".slimewire-autopilot.json");

function loadToken() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")).token || "";
  } catch {
    return "";
  }
}
function saveToken(token, expiresAt) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiresAt }, null, 2));
}
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
function headers() {
  const h = { "content-type": "application/json" };
  const token = loadToken();
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}
function withKey(obj) {
  return KEY ? { ...obj, key: KEY } : obj;
}

async function jget(url) {
  const sep = url.includes("?") ? "&" : "?";
  const full = KEY ? `${url}${sep}key=${encodeURIComponent(KEY)}` : url;
  return (await fetch(full, { headers: headers() })).json();
}
async function jpost(url, body) {
  return (await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(withKey(body)) })).json();
}

async function main() {
  const cmd = (process.argv[2] || "status").toLowerCase();

  if (cmd === "login") {
    const code = String(arg("code", ""));
    if (!code) return die("Pass --code <code from Telegram /web>.");
    const r = await (await fetch(`${API}/api/web/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code })
    })).json();
    if (!r.token) return print(r);
    saveToken(r.token, r.expiresAt);
    console.log(`Logged in. Session saved to ${TOKEN_FILE}`);
    return;
  }

  if (!loadToken() && !KEY) {
    return die("Not logged in. Run:  node scripts/autopilot.js login --code <code from /web>");
  }

  if (cmd === "wallets") return print(await jget(`${API}/api/web/autopilot/wallets`));
  if (cmd === "status") return print(await jget(`${API}/api/web/autopilot/status`));
  if (cmd === "stop") return print(await jpost(`${API}/api/web/autopilot/stop`, {}));

  if (cmd === "start") {
    const live = Boolean(arg("live", false));
    const payload = {
      sol: Number(arg("sol", 0.25)),
      minutes: Number(arg("minutes", 60)),
      mode: String(arg("mode", "normal")),
      live,
      wallet: arg("wallet", undefined),
      confirm: live ? "LIVE" : undefined
    };
    if (!(payload.sol > 0)) return die("--sol must be > 0");
    if (live && (payload.wallet === undefined)) {
      return die("Live mode needs --wallet <index>. Run the wallets command to see indexes.");
    }
    console.log(live
      ? `\n⚠️  LIVE: real SOL from wallet #${payload.wallet} · ${payload.sol} SOL · ${payload.minutes}m · ${payload.mode}\n`
      : `\nPAPER (no SOL): ${payload.sol} SOL sim · ${payload.minutes}m · ${payload.mode}\n`);
    return print(await jpost(`${API}/api/web/autopilot/start`, payload));
  }

  die(`Unknown command "${cmd}". Use: login | wallets | start | status | stop`);
}

function print(json) {
  if (json && json.status) {
    const s = json.status;
    console.log(JSON.stringify({
      running: s.running, live: s.live, mode: s.mode, wallet: s.wallet,
      bank: s.bank, equity: s.equity, pnlPct: s.pnlPct,
      wins: s.wins, losses: s.losses, open: s.open, endsInS: s.endsInS, stopReason: s.stopReason
    }, null, 2));
  } else {
    console.log(JSON.stringify(json, null, 2));
  }
}
function die(msg) {
  console.error(msg);
  process.exit(1);
}

main().catch((e) => die(e && e.message ? e.message : String(e)));
