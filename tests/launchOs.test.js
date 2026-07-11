import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../web/public/launch-os.html", import.meta.url), "utf8");
const publicHq = fs.readFileSync(new URL("../web/public/launch-hq.html", import.meta.url), "utf8");
const guide = fs.readFileSync(new URL("../web/public/launch-os-guide.html", import.meta.url), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`) >= 0
    ? source.indexOf(`function ${name}(`)
    : source.indexOf(`async function ${name}(`);
  assert.ok(start >= 0, `${name} must exist`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not parse ${name}`);
}

test("Launch OS exposes an authenticated project workspace and a sanitized public HQ", () => {
  const publicApi = serverSource.indexOf('pathname.startsWith("/api/launch-os/public/")');
  const authGate = serverSource.indexOf("const auth = await authenticateWebRequest(request)", publicApi);
  assert.ok(publicApi > 0 && authGate > publicApi, "public HQ must load before the auth gate");
  assert.match(serverSource, /pathname === "\/api\/web\/launch-os\/projects"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch-os\/create"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch-os\/update"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch-os\/live"/);
  assert.match(functionBody(serverSource, "mutateLaunchOs"), /LockService\.withLock\("launch-os-store"/);

  const publicProject = functionBody(serverSource, "publicLaunchOsProject");
  assert.match(publicProject, /delete value\.telegramSetupUrl/);
  assert.match(publicProject, /groupCount/);
  assert.doesNotMatch(publicProject, /setupCode|userId/);
});

test("Launch OS standalone editor needs no terminal login and protects edits with a private capability key", () => {
  const publicCreate = serverSource.indexOf('pathname === "/api/launch-os/create"');
  const authGate = serverSource.indexOf("const auth = await authenticateWebRequest(request)", publicCreate);
  assert.ok(publicCreate > 0 && authGate > publicCreate, "standalone creation must run before the terminal auth gate");
  assert.match(serverSource, /pathname\.startsWith\("\/api\/launch-os\/edit\/"\)/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/launch-os\/live\/"\)/);
  assert.match(serverSource, /X-Launch-Edit-Key/);
  assert.match(serverSource, /function createPublicLaunchOsProject[\s\S]{0,350}randomBytes\(24\)/);
  assert.match(serverSource, /function createPublicLaunchOsProject[\s\S]{0,350}hashWebSecret\(editKey\)/);
  assert.match(functionBody(serverSource, "launchOsEditorMatches"), /constantTimeStringEquals/);
  assert.match(functionBody(serverSource, "assertLaunchOsCreateAllowed"), /record\.count > 12/);
  assert.doesNotMatch(functionBody(serverSource, "clientLaunchOsProject"), /editorKeyHash|setupCode|userId/);

  assert.match(dashboard, /No account, wallet connection or setup form required/);
  assert.match(dashboard, /slimeLaunchOsEdits/);
  assert.match(dashboard, /\/api\/launch-os\/create/);
  assert.match(dashboard, /\/api\/launch-os\/edit\//);
  assert.match(dashboard, /\/api\/launch-os\/live\//);
  assert.match(dashboard, /Copy private edit link/);
  assert.match(dashboard, /\/launch-os\?project=/);
  assert.doesNotMatch(dashboard, /ogreWebToken|\/api\/web\/launch-os/);
});

test("Launch OS Telegram deep link configures the full group stack only for an admin owner", () => {
  const connect = functionBody(serverSource, "connectLaunchOsTelegramGroup");
  assert.match(connect, /String\(project\.userId\) !== String\(userId\)/);
  assert.match(connect, /project\.userId &&/);
  assert.match(connect, /buybot: true, raid: true, rose: true, scan: true/);
  assert.match(connect, /RAID_DEFAULT_PRESET\.targets/);
  assert.match(connect, /telegramWelcome/);

  const handler = functionBody(serverSource, "handleGroupBotCommand");
  assert.match(handler, /launchos_\(\[a-f0-9\]\{10\}\)/);
  assert.match(handler, /isGroupBotAdmin/);
  assert.match(handler, /connectLaunchOsTelegramGroup/);
  assert.match(handler, /groupBotPostSetup/);
});

test("Launch OS dashboard, public HQ and guide keep every launch workflow organized", () => {
  for (const label of ["Built For You", "Brand Assets", "Install TG", "Public Site", "Listing Pack", "X \\+ Content", "Live Tools", "Edit \\+ Safety"]) {
    assert.match(dashboard, new RegExp(label));
  }
  assert.match(dashboard, /AUTOMATION COMPLETE/);
  assert.match(dashboard, /Download complete launch pack/);
  assert.match(dashboard, /Finished X \+ community package/);
  assert.doesNotMatch(dashboard, /Readiness checklist/);
  assert.match(dashboard, /\/api\/launch-os\/create/);
  assert.match(dashboard, /\/api\/launch-os\/edit\//);
  assert.match(dashboard, /\/api\/launch-os\/live\//);
  assert.match(dashboard, /assets\/slimewire\/launch\/hero\.png/);
  assert.match(dashboard, /assets\/slimewire\/png\/slimewire-mark\.png/);
  assert.match(publicHq, /\/api\/launch-os\/public\//);
  assert.match(publicHq, /assets\/slimewire\/poster-prelaunch\.webp/);
  assert.match(guide, /Forge the Launch Passport/);
  assert.match(guide, /Launch-day/);
  assert.match(guide, /Crisis/);
});

test("Launch OS is discoverable from both production web shells", () => {
  for (const file of ["index.html", "gg.html"]) {
    const source = fs.readFileSync(new URL(`../web/public/${file}`, import.meta.url), "utf8");
    assert.match(source, /Launch OS — complete coin operation/);
    assert.match(source, /url:"\/launch-os"/);
  }
});
