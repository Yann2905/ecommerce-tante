import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().max(80).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(60).optional().nullable(),
  label: z.string().trim().min(1).max(80),
  stock: z.number().int().min(0),
  is_active: z.boolean().default(true),
});
const VariantListSchema = z.array(VariantSchema).max(30);

async function productIdFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  return z.string().uuid().safeParse(id).success ? id : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const productId = await productIdFrom(params);
  if (!productId) return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 });
  const isAdmin = new URL(request.url).searchParams.get('scope') === 'admin';
  if (isAdmin && !await getAuthUser(request)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });

  const query = supabaseAdmin.from('product_variants').select('*').eq('product_id', productId).order('created_at', { ascending: true });
  const { data, error } = isAdmin ? await query : await query.eq('is_active', true);
  if (error) {
    await reportError('variants.list', error, { productId });
    return NextResponse.json({ error: 'Impossible de charger les variantes.' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  const productId = await productIdFrom(params);
  if (!productId) return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 });

  try {
    const parsed = VariantListSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Données de variantes invalides.', details: parsed.error.flatten() }, { status: 400 });

    const { data: existing, error: existingError } = await supabaseAdmin.from('product_variants').select('id').eq('product_id', productId);
    if (existingError) throw existingError;
    const submittedIds = new Set(parsed.data.flatMap((variant) => variant.id ? [variant.id] : []));
    const idsToDelete = (existing ?? []).map((variant) => variant.id).filter((id) => !submittedIds.has(id));
    if (idsToDelete.length) {
      const { error } = await supabaseAdmin.from('product_variants').delete().in('id', idsToDelete);
      if (error) throw error;
    }

    for (const variant of parsed.data) {
      const payload = {
        product_id: productId,
        sku: variant.sku || null,
        size: variant.size || null,
        color: variant.color || null,
        label: variant.label,
        stock: variant.stock,
        is_active: variant.is_active,
        updated_at: new Date().toISOString(),
      };
      if (variant.id) {
        const { error } = await supabaseAdmin.from('product_variants').update(payload).eq('id', variant.id).eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('product_variants').insert(payload);
        if (error) throw error;
      }
    }

    const { data: variants, error: variantsError } = await supabaseAdmin.from('product_variants').select('*').eq('product_id', productId);
    if (variantsError) throw variantsError;
    const totalStock = (variants ?? []).filter((variant) => variant.is_active).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    const { error: productError } = await supabaseAdmin.from('products').update({ stock: totalStock }).eq('id', productId);
    if (productError) throw productError;

    return NextResponse.json(variants ?? []);
  } catch (err) {
    await reportError('variants.replace', err, { productId });
    return NextResponse.json({ error: 'Impossible d’enregistrer les variantes.' }, { status: 500 });
  }
}
