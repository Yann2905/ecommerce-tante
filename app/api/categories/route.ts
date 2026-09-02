import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const isAdmin = new URL(request.url).searchParams.get('scope') === 'admin';
  if (isAdmin && !await getAuthUser(request)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('categories').select('id,name').order('name');
  if (error) return NextResponse.json({ error: 'Impossible de charger les catégories.' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!await getAuthUser(request)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: 'Le nom doit contenir entre 2 et 80 caractères.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('categories').insert({ name }).select('id,name').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Cette catégorie existe déjà.' : 'Impossible de créer la catégorie.' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json(data, { status: 201 });
}
