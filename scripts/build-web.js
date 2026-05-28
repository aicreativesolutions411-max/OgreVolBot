import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "web", "public");
const distDir = path.join(rootDir, "web", "dist");

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

await fs.rm(distDir, { recursive: true, force: true });
await copyDir(publicDir, distDir);

const buildId = String(process.env.WEB_BUILD_ID || new Date().toISOString().replace(/[-:.TZ]/g, "")).slice(0, 14);
const apiBase = normalizeBaseUrl(process.env.OGRE_API_BASE || process.env.WEB_API_BASE || process.env.RENDER_EXTERNAL_URL || "https://ogrevolbot.onrender.com");
const telegramBotUsername = String(process.env.TELEGRAM_BOT_USERNAME || "OgreTradeBot").trim().replace(/^@/, "");
const portalUrl = normalizeBaseUrl(process.env.WEB_PORTAL_URL || "https://www.slimewire.org");
const configSource = `window.OGRE_PORTAL_CONFIG = ${JSON.stringify({ apiBase, telegramBotUsername, portalUrl }, null, 2)};\n`;
await fs.writeFile(path.join(distDir, "config.js"), configSource, "utf8");

const indexPath = path.join(distDir, "index.html");
const indexHtml = await fs.readFile(indexPath, "utf8");
await fs.writeFile(
  indexPath,
  indexHtml
    .replace(/styles\.css(?:\?v=[^"]*)?/g, `styles.css?v=${buildId}`)
    .replace(/app\.js(?:\?v=[^"]*)?/g, `app.js?v=${buildId}`),
  "utf8"
);

try {
  const assetDir = path.join(distDir, "assets");
  await fs.mkdir(assetDir, { recursive: true });
  await fs.copyFile(
    path.join(rootDir, "pnl-card-slime-preview.png"),
    path.join(assetDir, "pnl-card-slime-preview.png")
  );
} catch (error) {
  console.warn(`Web preview image was not copied: ${error.message}`);
}

console.log(`Built OgreTrade web portal at ${path.relative(rootDir, distDir)}`);
