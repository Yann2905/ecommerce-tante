import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * ✅ PING ANTI-PAUSE
 * Appelé automatiquement par le Vercel Cron (voir vercel.json) pour garder
 * la base Supabase active (le plan gratuit met le projet en pause après ~7
 * jours d'inactivité). Fait une requête ultra-légère (1 ligne, id seul).
 *
 * Si la variable CRON_SECRET est définie sur Vercel, on exige le header
 * `Authorization: Bearer <CRON_SECRET>` que Vercel Cron envoie automatiquement.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const { error } = await supabaseAdmin
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    message: 'Base Supabase active.',
  });
}
