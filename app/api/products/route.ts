import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { reportError } from '@/lib/observability';
import { ProductSchema } from '@/lib/product-validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isAdmin = new URL(request.url).searchParams.get('scope') === 'admin';
  if (isAdmin && !await getAuthUser(request)) {
    return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  }

  const query = supabaseAdmin.from('products').select('*, categories(name)').order('created_at', { ascending: false });
  const { data, error } = isAdmin ? await query : await query.eq('is_active', true);

  if (error) {
    await reportError('products.list', error, { scope: isAdmin ? 'admin' : 'public' });
    return NextResponse.json({ error: 'Impossible de charger le catalogue.' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });

  try {
    const parsed = ProductSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données produit invalides.', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('products').insert([parsed.data]).select().single();
    if (error) {
      await reportError('products.create', error);
      return NextResponse.json({ error: 'Impossible de créer le produit.' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    await reportError('products.create', err);
    return NextResponse.json({ error: 'Impossible de créer le produit.' }, { status: 500 });
  }
}
