import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAuthUser(request)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: 'Le nom doit contenir entre 2 et 80 caractères.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('categories').update({ name }).eq('id', id).select('id,name').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Cette catégorie existe déjà.' : 'Impossible de renommer la catégorie.' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAuthUser(request)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  const { id } = await params;
  const { count } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) return NextResponse.json({ error: `Cette catégorie contient ${count} produit${count > 1 ? 's' : ''}. Recatégorisez-les avant de la supprimer.` }, { status: 409 });
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Impossible de supprimer la catégorie.' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
