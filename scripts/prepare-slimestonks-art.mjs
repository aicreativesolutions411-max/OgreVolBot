// Mechanical web delivery conversion; artwork is generated with image_gen.
// Originals are never changed. Pass the selected bull and rewards PNG paths.
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const [bull, rewards] = process.argv.slice(2);
if (!bull || !rewards) throw new Error('Usage: node scripts/prepare-slimestonks-art.mjs <bull.png> <rewards.png>');
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/public/assets/slimewire/stonks');
await fs.mkdir(directory, { recursive: true });
for (const [source, name, width] of [[bull, 'bull-hero-v1.webp', 1774], [bull, 'bull-home-v1.webp', 1440], [rewards, 'reward-flow-v1.webp', 1774]]) {
  const target = path.join(directory, name);
  await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(target);
  const stat = await fs.stat(target);
  console.log(name + ': ' + Math.round(stat.size / 1024) + ' KB');
}
