const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(process.cwd(), 'web/public/assets/slimewire/swamp');
const sheets = path.join(root, 'sheets');
const outRoot = path.join(root, 'individual');

fs.mkdirSync(outRoot, { recursive: true });

const index = {
  version: '2026-06-12-swamp-individual-v1',
  generatedAt: '2026-06-12',
  root: '/assets/slimewire/swamp/individual',
  characters: [],
  walkFrames: [],
  creatureWalkFrames: [],
  bosses: [],
  buildings: [],
  tiles: [],
  props: [],
  vfx: [],
  rewards: [],
  backgrounds: [],
};

function cleanName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
}

function rel(filePath) {
  return `/assets/slimewire/swamp/individual/${path.relative(outRoot, filePath).replace(/\\/g, '/')}`;
}

function keyMagenta(buf) {
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const a = buf[i + 3];
    if (a === 0) continue;
    const strong = r > 180 && b > 170 && g < 115;
    const pink = r > 135 && b > 120 && g < 100 && r + b > g * 4;
    const edge = r > 95 && b > 95 && g < 70 && r + b > 240;
    if (strong || pink || edge) {
      buf[i] = 0;
      buf[i + 1] = 0;
      buf[i + 2] = 0;
      buf[i + 3] = 0;
    }
  }
  return buf;
}

async function sanitizeSheet(name) {
  const filePath = path.join(sheets, `${name}.png`);
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyMagenta(data);
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(filePath);
}

function bounds(total, count, indexValue) {
  const start = Math.round((total * indexValue) / count);
  const end = Math.round((total * (indexValue + 1)) / count);
  return [start, Math.max(1, end - start)];
}

async function saveCell(sheetName, cols, rows, col, row, outDir, fileBase, pad = 3) {
  const sheetPath = path.join(sheets, `${sheetName}.png`);
  const meta = await sharp(sheetPath).metadata();
  const [left, width] = bounds(meta.width, cols, col);
  const [top, height] = bounds(meta.height, rows, row);
  const out = path.join(outDir, `${fileBase}.png`);
  fs.mkdirSync(outDir, { recursive: true });

  const raw = await sharp(sheetPath)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  keyMagenta(raw.data);

  let cell = sharp(raw.data, { raw: raw.info }).png();
  try {
    cell = cell.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 });
  } catch {}

  await cell
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);

  const outMeta = await sharp(out).metadata();
  return { out, width: outMeta.width, height: outMeta.height };
}

async function gridAssets({ sheetName, cols, rows, outDir, prefix, type, target }) {
  await sanitizeSheet(sheetName);
  let count = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      count += 1;
      const file = cleanName(`${prefix}-${String(count).padStart(3, '0')}`);
      const saved = await saveCell(sheetName, cols, rows, col, row, path.join(outRoot, outDir), file);
      index[target].push({
        id: file,
        type,
        pack: sheetName,
        path: rel(saved.out),
        width: saved.width,
        height: saved.height,
        cell: { row, col },
      });
    }
  }
}

async function walkAssets({ sheetName, rows, outDir, target, characters }) {
  await sanitizeSheet(sheetName);
  const directions = ['down', 'left', 'right', 'up'];
  const cols = 16;
  for (let row = 0; row < rows; row += 1) {
    const character = cleanName(characters[row] || `actor-${row + 1}`);
    for (let dir = 0; dir < directions.length; dir += 1) {
      for (let frame = 0; frame < 4; frame += 1) {
        const col = dir * 4 + frame;
        const name = `${character}-${directions[dir]}-${String(frame + 1).padStart(2, '0')}`;
        const saved = await saveCell(
          sheetName,
          cols,
          rows,
          col,
          row,
          path.join(outRoot, outDir, character, directions[dir]),
          name,
          2,
        );
        index[target].push({
          id: name,
          type: target === 'walkFrames' ? 'walk-frame' : 'creature-walk-frame',
          pack: sheetName,
          character,
          direction: directions[dir],
          frame: frame + 1,
          path: rel(saved.out),
          width: saved.width,
          height: saved.height,
        });
      }
    }
  }
}

async function vfxAssets() {
  const effects = [
    'slime-splash',
    'coin-sparkle-burst',
    'green-portal-open',
    'chart-candle-pop',
    'buy-confirmation-pulse',
    'sell-confirmation-puff',
    'boss-hit-impact',
    'poison-cloud',
    'shield-proc',
    'treasure-pickup',
    'rocket-launch-trail',
    'level-up-glow',
  ];
  await sanitizeSheet('swamp-vfx-pack-02');
  for (let row = 0; row < effects.length; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const effect = effects[row];
      const name = `${effect}-${String(col + 1).padStart(2, '0')}`;
      const saved = await saveCell(
        'swamp-vfx-pack-02',
        6,
        12,
        col,
        row,
        path.join(outRoot, 'vfx/pack-02', effect),
        name,
        2,
      );
      index.vfx.push({
        id: name,
        type: 'vfx-frame',
        pack: 'swamp-vfx-pack-02',
        effect,
        frame: col + 1,
        path: rel(saved.out),
        width: saved.width,
        height: saved.height,
      });
    }
  }
}

async function backgroundPanels() {
  const sheetName = 'swamp-background-panels-01';
  const sheetPath = path.join(sheets, `${sheetName}.png`);
  const meta = await sharp(sheetPath).metadata();
  const cols = 3;
  const rows = 2;
  const labels = [
    'swamp-village-hub',
    'launch-boss-raid-arena',
    'muddy-reed-path',
    'night-chart-firefly-swamp',
    'trading-hut-interior',
    'treasure-leaderboard-cave',
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const indexValue = row * cols + col;
      const [left, width] = bounds(meta.width, cols, col);
      const [top, height] = bounds(meta.height, rows, row);
      const outDir = path.join(outRoot, 'backgrounds/panels-01');
      fs.mkdirSync(outDir, { recursive: true });
      const out = path.join(outDir, `${labels[indexValue]}.png`);
      await sharp(sheetPath).extract({ left, top, width, height }).png({ compressionLevel: 9 }).toFile(out);
      const outMeta = await sharp(out).metadata();
      index.backgrounds.push({
        id: labels[indexValue],
        type: 'background-panel',
        pack: sheetName,
        path: rel(out),
        width: outMeta.width,
        height: outMeta.height,
        cell: { row, col },
      });
    }
  }
}

async function main() {
  await gridAssets({ sheetName: 'swamp-coin-creatures-pack-04', cols: 8, rows: 4, outDir: 'characters/coin-creatures-pack-04', prefix: 'coin-creature-04', type: 'character', target: 'characters' });
  await gridAssets({ sheetName: 'swamp-coin-creatures-pack-05', cols: 8, rows: 4, outDir: 'characters/coin-creatures-pack-05', prefix: 'coin-creature-05', type: 'character', target: 'characters' });
  await gridAssets({ sheetName: 'swamp-coin-creatures-pack-06', cols: 8, rows: 5, outDir: 'characters/coin-creatures-pack-06', prefix: 'coin-creature-06', type: 'character', target: 'characters' });
  await gridAssets({ sheetName: 'swamp-bosses-pack-02', cols: 4, rows: 4, outDir: 'bosses/pack-02', prefix: 'boss-02', type: 'boss', target: 'bosses' });
  await gridAssets({ sheetName: 'swamp-buildings-pack-02', cols: 6, rows: 4, outDir: 'buildings/pack-02', prefix: 'building-02', type: 'building', target: 'buildings' });
  await gridAssets({ sheetName: 'swamp-clean-tileset-03', cols: 8, rows: 8, outDir: 'tiles/clean-03', prefix: 'tile-clean-03', type: 'tile', target: 'tiles' });
  await gridAssets({ sheetName: 'swamp-props-pack-02', cols: 8, rows: 8, outDir: 'props/pack-02', prefix: 'prop-02', type: 'prop', target: 'props' });
  await gridAssets({ sheetName: 'swamp-rewards-icons-02', cols: 8, rows: 8, outDir: 'rewards/icons-02', prefix: 'reward-icon-02', type: 'reward-icon', target: 'rewards' });
  await walkAssets({
    sheetName: 'swamp-walk-cycle-pack-04',
    rows: 8,
    outDir: 'walk/humanoid-pack-04',
    target: 'walkFrames',
    characters: ['hooded-degen-trader', 'slime-armored-warrior', 'moss-ogre-scout', 'skeleton-market-maker', 'swamp-witch-caller', 'coin-goblin-runner', 'frog-courier', 'robot-wallet-helper'],
  });
  await walkAssets({
    sheetName: 'swamp-creature-walk-cycle-04',
    rows: 8,
    outDir: 'walk/creature-pack-04',
    target: 'creatureWalkFrames',
    characters: ['baby-whale-slime', 'toxic-slug', 'coin-crab', 'bone-frog', 'bramble-slime', 'crystal-eye-token', 'mini-hydra-slime', 'golden-runner-slime'],
  });
  await vfxAssets();
  await backgroundPanels();

  index.summary = {
    characters: index.characters.length,
    walkFrames: index.walkFrames.length,
    creatureWalkFrames: index.creatureWalkFrames.length,
    bosses: index.bosses.length,
    buildings: index.buildings.length,
    tiles: index.tiles.length,
    props: index.props.length,
    vfxFrames: index.vfx.length,
    rewards: index.rewards.length,
    backgrounds: index.backgrounds.length,
    total:
      index.characters.length +
      index.walkFrames.length +
      index.creatureWalkFrames.length +
      index.bosses.length +
      index.buildings.length +
      index.tiles.length +
      index.props.length +
      index.vfx.length +
      index.rewards.length +
      index.backgrounds.length,
  };

  fs.writeFileSync(path.join(outRoot, 'asset-index.json'), `${JSON.stringify(index, null, 2)}\n`);

  const manifestPath = path.join(root, 'swamp-assets-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = '2026-06-12-swamp-assets-v7-individual';
  manifest.individualAssets = {
    index: '/assets/slimewire/swamp/individual/asset-index.json',
    summary: index.summary,
    note: 'Primary game-ready individual PNG cutouts. Sheet files remain as source atlases/backups.',
  };
  manifest.notes = manifest.notes || [];
  const note = 'v7 adds direct individual PNG cutouts and asset-index.json so game code can load characters, walk frames, tiles, props, VFX, rewards, bosses, buildings, and backgrounds without manual sheet slicing.';
  if (!manifest.notes.includes(note)) manifest.notes.push(note);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify(index.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
