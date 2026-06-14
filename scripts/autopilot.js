#!/usr/bin/env node
// Terminal control for the Live Autopilot. Runs against the always-on server
// (Render), so once you START it the loop runs in the background even if you
// close your phone/laptop. This script just sends commands; it does not need to
// stay open.
//
// Setup (once):
//   export AUTOPILOT_API="https://ogrevolbot.onrender.com"   # the API host
//   export AUTOPILOT_CONTROL_KEY="<the key you set on Render>"
//
// Usage:
//   node scripts/autopilot.js status
//   node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen          # PAPER (no SOL)
//   node scripts/autopilot.js start --sol 0.5 --minutes 60 --mode degen --live    # REAL SOL
//   node scripts/autopilot.js stop
//
// --live requires AUTOPILOT_WALLET_PUBKEY + AUTOPILOT_CONTROL_KEY configured on
// the server; the script auto-sends confirm:"LIVE" so you opt in explicitly here.

const API = (process.env.AUTOPILOT_API || "https://ogrevolbot.onrender.com").replace(/\/$/, "");
const KEY = process.env.AUTOPILOT_CONTROL_KEY || "";

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

async function main() {
  const cmd = (process.argv[2] || "status").toLowerCase();
  if (!KEY) {
    console.error("Set AUTOPILOT_CONTROL_KEY (and optionally AUTOPILOT_API) in your environment first.");
    process.exit(1);
  }

  if (cmd === "status") {
    const r = await fetch(`${API}/api/web/autopilot/status?key=${encodeURIComponent(KEY)}`);
    return print(await r.json());
  }
  if (cmd === "stop") {
    const r = await fetch(`${API}/api/web/autopilot/stop`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: KEY })
    });
    return print(await r.json());
  }
  if (cmd === "start") {
    const live = Boolean(arg("live", false));
    const payload = {
      key: KEY,
      sol: Number(arg("sol", 0.25)),
      minutes: Number(arg("minutes", 60)),
      mode: String(arg("mode", "normal")),
      live,
      confirm: live ? "LIVE" : undefined
    };
    if (live) {
      console.log(`\n⚠️  LIVE mode: this will trade REAL SOL from the dedicated autopilot wallet.`);
      console.log(`   ${payload.sol} SOL budget · ${payload.minutes} min · ${payload.mode}\n`);
    } else {
      console.log(`\nPAPER mode (no SOL touched): ${payload.sol} SOL sim · ${payload.minutes} min · ${payload.mode}\n`);
    }
    const r = await fetch(`${API}/api/web/autopilot/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return print(await r.json());
  }
  console.error(`Unknown command "${cmd}". Use: status | start | stop`);
  process.exit(1);
}

function print(json) {
  if (json && json.status) {
    const s = json.status;
    console.log(JSON.stringify({
      running: s.running,
      live: s.live,
      mode: s.mode,
      bank: s.bank,
      equity: s.equity,
      pnlPct: s.pnlPct,
      wins: s.wins,
      losses: s.losses,
      open: s.open,
      endsInS: s.endsInS,
      stopReason: s.stopReason
    }, null, 2));
  } else {
    console.log(JSON.stringify(json, null, 2));
  }
}

main().catch((e) => {
  console.error(e && e.message ? e.message : e);
  process.exit(1);
});
