/**
 * Nettoyage du bucket Supabase Storage "products" APRÈS migration vers Cloudinary.
 *
 * Sécurité : avant toute suppression, on vérifie qu'AUCUN produit en base ne
 * référence encore une URL Supabase Storage. Si c'est le cas, on s'arrête.
 *
 * Lancement :  node scripts/cleanup-supabase-storage.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) {
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (!(m[1] in process.env)) process.env[m[1]] = val;
      }
    }
  } catch (e) { console.error('Impossible de lire', path, '-', e.message); }
}
loadEnv('.env.local');

const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supaUrl || !supaKey) { console.error('❌ Variables Supabase manquantes.'); process.exit(1); }

const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
const BUCKET = 'products';

async function main() {
  // 1. Filet de sécurité : plus aucune référence Supabase en base ?
  const { data: products, error } = await supabase
    .from('products')
    .select('image_url, gallery');
  if (error) { console.error('❌', error.message); process.exit(1); }

  const stillRef = [];
  for (const p of products) {
    const urls = [p.image_url, ...(p.gallery || [])];
    for (const u of urls) {
      if (typeof u === 'string' && u.includes('supabase.co/storage')) stillRef.push(u);
    }
  }
  if (stillRef.length > 0) {
    console.error(`🛑 STOP : ${stillRef.length} image(s) en base pointent encore vers Supabase.`);
    console.error('   Relance d\'abord la migration. Aucun fichier supprimé.');
    stillRef.slice(0, 5).forEach(u => console.error('   -', u));
    process.exit(1);
  }
  console.log('✅ Aucune référence Supabase en base — nettoyage autorisé.\n');

  // 2. Lister les fichiers du bucket
  const { data: files, error: listErr } = await supabase
    .storage.from(BUCKET)
    .list('', { limit: 1000 });
  if (listErr) { console.error('❌ list:', listErr.message); process.exit(1); }

  const names = (files || []).filter(f => f.id !== null).map(f => f.name);
  if (names.length === 0) { console.log('Bucket déjà vide, rien à supprimer.'); return; }

  console.log(`🗑️  ${names.length} fichier(s) à supprimer :`);
  names.forEach(n => console.log('   -', n));

  // 3. Supprimer
  const { data: removed, error: rmErr } = await supabase
    .storage.from(BUCKET)
    .remove(names);
  if (rmErr) { console.error('❌ remove:', rmErr.message); process.exit(1); }

  console.log(`\n🎉 ${removed?.length ?? names.length} fichier(s) supprimé(s) du bucket "${BUCKET}".`);
}

main();
