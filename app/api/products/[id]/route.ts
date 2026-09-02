import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { reportError } from '@/lib/observability';
import { ProductPatchSchema } from '@/lib/product-validation';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('products').select('id, name, description, price, discount_price, stock, category_id, image_url, gallery, is_active, categories(name)').eq('id', id).eq('is_active', true).single();
  if (error || !data) return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 });
  }

  try {
    const parsed = ProductPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données produit invalides.', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('products').update(parsed.data).eq('id', id).select().single();
    if (error) {
      await reportError('products.update', error, { productId: id });
      return NextResponse.json({ error: 'Impossible de modifier le produit.' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    await reportError('products.update', err, { productId: id });
    return NextResponse.json({ error: 'Impossible de modifier le produit.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) {
      await reportError('products.delete', error, { productId: id });
      return NextResponse.json({ error: 'Impossible de supprimer le produit.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Produit supprimé.' });
  } catch (err) {
    await reportError('products.delete', err, { productId: id });
    return NextResponse.json({ error: 'Impossible de supprimer le produit.' }, { status: 500 });
  }
}
