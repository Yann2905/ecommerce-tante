/**
 * Redimensionne et recompresse les images de `public/`.
 *
 * Pourquoi : les visuels du hero étaient livrés en pleine résolution d'appareil
 * photo (jusqu'à 3840×5760, 2,9 Mo) pour être affichés dans une cellule de
 * grille de ~285 px de large. `next/image` génère ensuite AVIF/WebP à la volée ;
 * ce script ne s'occupe que de ramener les SOURCES à une taille raisonnable.
 *
 * Idempotent : une image déjà sous la limite est seulement recompressée.
 * Les originaux restent récupérables via git (`git checkout -- public/`).
 *
 * Lancement :  npm run optimize:images
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Le côté le plus long suffit : les images sont affichées en object-cover, et
// 1200 px couvre un écran desktop en densité 2× sur ces cellules.
const TARGETS = [
  { file: 'hero/hero-africa.jpg', maxEdge: 1200, quality: 72 },
  { file: 'hero/hero-fashion.jpg', maxEdge: 1200, quality: 72 },
  { file: 'hero/hero-bag.jpg', maxEdge: 1200, quality: 72 },
  { file: 'hero/hero-beauty.jpg', maxEdge: 1200, quality: 72 },
  { file: 'matante.jpg', maxEdge: 1100, quality: 78 },
  { file: 'tante-detouree.png', maxEdge: 800, quality: 80 },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} Ko`;

async function optimize({ file, maxEdge, quality }) {
  const path = join(PUBLIC_DIR, file);
  const before = (await stat(path)).size;
  const input = await readFile(path);

  const image = sharp(input);
  const { width, height, format } = await image.metadata();
  const longest = Math.max(width, height);

  let pipeline = sharp(input).rotate(); // applique l'orientation EXIF avant de rogner
  if (longest > maxEdge) {
    const ratio = maxEdge / longest;
    pipeline = pipeline.resize(Math.round(width * ratio), Math.round(height * ratio), { fit: 'inside' });
  }

  // Le PNG garde son format : il porte la transparence du détourage.
  pipeline = format === 'png'
    ? pipeline.png({ compressionLevel: 9, palette: true, quality })
    : pipeline.jpeg({ quality, mozjpeg: true, progressive: true });

  const output = await pipeline.toBuffer();
  const meta = await sharp(output).metadata();

  if (output.length >= before) {
    console.log(`  = ${file.padEnd(26)} déjà optimale (${kb(before)}), inchangée`);
    return { before, after: before };
  }

  await writeFile(path, output);
  const saved = (1 - output.length / before) * 100;
  console.log(`  ✓ ${file.padEnd(26)} ${String(width).padStart(4)}×${String(height).padEnd(4)} → ${String(meta.width).padStart(4)}×${String(meta.height).padEnd(4)}  ${kb(before).padStart(9)} → ${kb(output.length).padStart(8)}  (−${saved.toFixed(0)} %)`);
  return { before, after: output.length };
}

console.log('Optimisation des images de public/ :\n');
let totalBefore = 0;
let totalAfter = 0;
for (const target of TARGETS) {
  try {
    const { before, after } = await optimize(target);
    totalBefore += before;
    totalAfter += after;
  } catch (error) {
    console.error(`  ✗ ${target.file} — ${error.message}`);
    process.exitCode = 1;
  }
}
console.log(`\nTotal : ${kb(totalBefore)} → ${kb(totalAfter)} (−${((1 - totalAfter / totalBefore) * 100).toFixed(0)} %)`);
