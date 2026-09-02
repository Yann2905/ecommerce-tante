import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('SUPABASE_DB_URL ou DATABASE_URL est requis pour créer une sauvegarde.');
  process.exit(1);
}

const outputDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
mkdirSync(outputDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = join(outputDir, `supabase-${stamp}.dump`);

const result = spawnSync('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', outputFile, databaseUrl], { stdio: 'inherit' });
if (result.error) {
  console.error(`pg_dump est indisponible : ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Sauvegarde créée : ${outputFile}`);
console.log('Conservez ce fichier dans un stockage privé et testez régulièrement sa restauration.');
