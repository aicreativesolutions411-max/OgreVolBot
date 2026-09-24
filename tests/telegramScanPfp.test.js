import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
import { createScanPfpLoader, scanPhotoContent, telegramVisibleText } from "../src/lib/telegramScanPfp.js";

test("PFP loader shares requests, tries alternate artwork and caches genuine images", async () => {
  const original = await sharp({ create: { width: 320, height: 320, channels: 3, background: "#1aaf50" } }).png().toBuffer();
  const calls = [];
  const load = createScanPfpLoader({ fetchImage: async (url) => { calls.push(url); return url.includes("broken") ? null : original; } });
  const [one, two] = await Promise.all([load("sol:CaseSensitiveMint", ["https://cdn/broken", "https://cdn/real"]), load("sol:CaseSensitiveMint", ["https://cdn/broken", "https://cdn/real"])]);
  assert.deepEqual(one, two);
  assert.equal(calls.length, 2);
  const meta = await sharp(one).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, 512);
  assert.equal(meta.height, 512);
  const { channels } = meta;
  const pixel = await sharp(one).raw().toBuffer();
  assert.ok(Math.abs(pixel[0] - 26) < 5 && Math.abs(pixel[1] - 175) < 5 && Math.abs(pixel[2] - 80) < 5);
  assert.deepEqual(pixel.subarray(0, channels), pixel.subarray(256 * 512 * channels, 256 * 512 * channels + channels), "no stats/branding overlays");
  assert.deepEqual(await load("sol:CaseSensitiveMint", []), one);
  assert.equal(calls.length, 2, "warm scans never refetch the image");
});

test("missing/invalid artwork is not replaced with a fake badge and new metadata can retry", async () => {
  const original = await sharp({ create: { width: 100, height: 100, channels: 3, background: "red" } }).png().toBuffer();
  const load = createScanPfpLoader({ fetchImage: async (url) => url.endsWith("good") ? original : Buffer.from("not an image") });
  assert.equal(await load("sol:mint", ["https://cdn/bad"]), null);
  assert.ok(await load("sol:mint", ["https://cdn/good"]));
  assert.equal(await load("sol:MINT", []), null, "Solana mint keys stay case-sensitive");
});

test("caption sizing decodes entities and preserves full details without dropping photo or buttons", () => {
  const markup = { inline_keyboard: [[{ text: "Buy", callback_data: "qb:mint" }]] };
  const short = "<b>Coin &amp; friends</b>\n<code>CA</code>";
  assert.equal(telegramVisibleText(short), "Coin & friends\nCA");
  assert.deepEqual(scanPhotoContent(short, markup), { caption: short, replyMarkup: markup, fullText: null });
  const long = short + "\n" + "🛡 Safety &lt;verified&gt;\n".repeat(110);
  const fitted = scanPhotoContent(long, markup);
  assert.ok(telegramVisibleText(fitted.caption).length <= 1024);
  assert.equal(fitted.fullText, long);
  assert.deepEqual(fitted.replyMarkup.inline_keyboard[0], markup.inline_keyboard[0]);
  assert.equal(fitted.replyMarkup.inline_keyboard.at(-1)[0].callback_data, "scantext:full");
  assert.equal(markup.inline_keyboard.length, 1);
});

test("both scan chains use real PFP media, never a stats card, and keep the original message", () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const sol = source.slice(source.indexOf("async function renderSolScanCardPng"), source.indexOf("function slimeScanHardTradeRisk"));
  const rh = source.slice(source.indexOf("async function renderRhScanCardPng"), source.indexOf("async function editRhScanTelegramCard"));
  for (const body of [sol, rh]) {
    assert.match(body, /loadTelegramScanPfp/);
    assert.doesNotMatch(body, /renderXScanCard|xFallbackLogoBuffer|telegram-compact/);
  }
  const settle = source.slice(source.indexOf("async function settleTelegramSolScanCard"), source.indexOf("// /look <CA>"));
  assert.doesNotMatch(settle, /deleteMessage/);
  assert.match(settle, /messageId: activeMessageId[\s\S]*photoOnly: true/);
});

test("photo promotion keeps the exact message ID and all overflow details", async () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("async function editTelegramScanPhoto("), source.indexOf("async function editTelegramScanCaption("));
  const calls = [];
  const saved = [];
  const edit = new Function("scanPhotoContent", "editMessagePhotoBuffer", "rememberTelegramScanText", "friendlyError", `return (${fn});`)(
    scanPhotoContent,
    async (...args) => { calls.push(args); return { message_id: args[1], photo: [{}] }; },
    (...args) => saved.push(args),
    (error) => error.message
  );
  const fullText = "<b>COIN</b>\n" + "Stats, security, original caller, links\n".repeat(50);
  const image = Buffer.from("pfp");
  const result = await edit(-123, 42, image, fullText, { inline_keyboard: [[{ text: "Chart", callback_data: "chart" }]] });
  assert.equal(result.message_id, 42);
  assert.equal(calls.length, 1, "no send/delete of the original scan");
  assert.equal(calls[0][0], -123);
  assert.equal(calls[0][1], 42);
  assert.equal(calls[0][2], image);
  assert.ok(telegramVisibleText(calls[0][3]).length <= 1024);
  assert.deepEqual(saved, [[-123, 42, fullText]]);
});

test("new scan photos keep the source reply and forum thread", async () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("async function sendTelegramScanPhoto("), source.indexOf("async function editTelegramScanPhoto("));
  const calls = [];
  const send = new Function("scanPhotoContent", "sendPhoto", "rememberTelegramScanText", `return (${fn});`)(scanPhotoContent, async (...args) => { calls.push(args); return { message_id: 99, photo: [{}] }; }, () => {});
  await send(-123, "pfp.jpg", Buffer.from("pfp"), "Scan info", null, { replyToMessageId: 42, messageThreadId: 7 });
  assert.equal(calls[0][3], "Scan info");
  assert.deepEqual(calls[0][6], { replyToMessageId: 42, messageThreadId: 7 });
});

test("bounded image failures do not leave a scan waiting forever", async () => {
  const load = createScanPfpLoader({ fetchImage: () => new Promise(() => {}), timeoutMs: 10 });
  const start = Date.now();
  assert.equal(await load("sol:timeout", ["https://cdn/slow"]), null);
  assert.ok(Date.now() - start < 2000);
});

test("Telegram upload failure preserves the existing text and safety buttons", async () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("async function deliverTelegramSolScan("), source.indexOf("function slimeScanProgressHtml("));
  const calls = [];
  const safetyButtons = { inline_keyboard: [[{ text: "Safety check running", url: "https://rugcheck.xyz" }]] };
  const deps = {
    slimeScanKeyboardForResult: () => safetyButtons,
    scanMarketStatsFromSources: () => ({ mc: 0 }),
    isPrivateChat: () => true,
    slimeScanPairIdentity: () => ({ ready: false }),
    tickerScanSelectionLine: () => "",
    formatSlimeScanCard: () => "<b>COIN</b>\nAll scan info",
    telegramWithCommunityFooter: (text) => text,
    scanFastTimeout: (promise) => promise,
    renderSolScanCardPng: async () => Buffer.from("real pfp"),
    editTelegramScanPhoto: async () => { throw new Error("temporary upload failure"); },
    friendlyError: (error) => error.message,
    console: { warn: () => {} },
    telegram: async (method, body) => { calls.push({ method, body }); return { message_id: body.message_id }; }
  };
  const deliver = new Function(...Object.keys(deps), `return (${fn});`)(...Object.values(deps));
  const result = await deliver({ chatId: -123, message: { chat: { id: -123 } }, mint: "mint", scan: { meta: { symbol: "COIN" } }, messageId: 42, photoOnly: true });
  assert.equal(result.messageId, 42);
  assert.equal(result.isPhoto, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "editMessageText");
  assert.equal(calls[0].body.text, "<b>COIN</b>\nAll scan info");
  assert.deepEqual(calls[0].body.reply_markup, safetyButtons);
});
