/**
 * Migration des images Supabase Storage → Cloudinary.
 *
 * Pour CHAQUE produit, envoie image_url + chaque photo de gallery vers Cloudinary
 * (import par URL : Cloudinary récupère l'image depuis son URL Supabase actuelle),
 * puis met à jour la ligne en base avec les nouvelles URLs Cloudinary.
 *
 * - Idempotent : les URLs déjà sur res.cloudinary.com sont ignorées.
 * - Sûr : sauvegarde des anciennes URLs dans scripts/backup-image-urls-*.json
 *   avant toute modification. Les fichiers Supabase ne sont PAS supprimés.
 *
 * Lancement :  node scripts/migrate-images-to-cloudinary.mjs
 * (lit les variables depuis .env.local)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// --- Charger .env.local manuellement ---
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) {
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (!(m[1] in process.env)) process.env[m[1]] = val;
      }
    }
  } catch (e) {
    console.error('Impossible de lire', path, '-', e.message);
  }
}
loadEnv('.env.local');

const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cName = process.env.CLOUDINARY_CLOUD_NAME;
const cKey = process.env.CLOUDINARY_API_KEY;
const cSecret = process.env.CLOUDINARY_API_SECRET;

if (!supaUrl || !supaKey) {
  console.error('❌ Variables Supabase manquantes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}
if (!cName || !cKey || !cSecret) {
  console.error('❌ Variables Cloudinary manquantes (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).');
  process.exit(1);
}

cloudinary.config({ cloud_name: cName, api_key: cKey, api_secret: cSecret, secure: true });
const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

const FOLDER = 'emma-shop/products';
const isCloudinary = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');

async function migrateUrl(url) {
  if (!url || isCloudinary(url)) return url; // vide ou déjà migré
  const res = await cloudinary.uploader.upload(url, { folder: FOLDER });
  return res.secure_url;
}

async function main() {
  console.log('📥 Lecture des produits…');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url, gallery');
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`   ${products.length} produits trouvés.`);

  const backupPath = `scripts/backup-image-urls-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(products, null, 2));
  console.log(`💾 Sauvegarde des URLs actuelles → ${backupPath}\n`);

  let migrated = 0, skipped = 0, failed = 0;
  for (const p of products) {
    try {
      const newMain = await migrateUrl(p.image_url);
      const newGallery = [];
      for (const g of (p.gallery || [])) newGallery.push(await migrateUrl(g));

      const changed =
        newMain !== p.image_url ||
        JSON.stringify(newGallery) !== JSON.stringify(p.gallery || []);

      if (!changed) { skipped++; console.log(`⏭️  ${p.name} — déjà à jour`); continue; }

      const { error: upErr } = await supabase
        .from('products')
        .update({ image_url: newMain, gallery: newGallery })
        .eq('id', p.id);
      if (upErr) throw upErr;

      migrated++;
      console.log(`✅ ${p.name} — ${1 + newGallery.length} image(s) migrée(s)`);
    } catch (e) {
      failed++;
      console.error(`❌ ${p.name} — ${e.message}`);
    }
  }

  console.log(`\n🎉 Terminé : ${migrated} migré(s), ${skipped} déjà à jour, ${failed} échec(s).`);
  if (failed) console.log('   (Les produits en échec gardent leur ancienne URL Supabase — rien de cassé.)');
}

main();
