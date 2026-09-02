import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { notifyNewOrder } from '@/lib/notifications';
import { reportError } from '@/lib/observability';
import { checkRateLimit, getClientAddress } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const OrderItemSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  quantity: z.number().int().positive('Quantité invalide'),
  variant_id: z.string().uuid('Variante invalide').optional(),
});

const CreateOrderSchema = z.object({
  customer_name: z.string().trim().min(2, 'Nom trop court').max(100),
  customer_phone: z.string().trim().min(8, 'Numéro invalide').max(30),
  customer_email: z.string().trim().email('E-mail invalide').max(200),
  delivery_address: z.string().trim().max(300).optional().nullable(),
  items: z.array(OrderItemSchema).min(1, 'Panier vide').max(100),
  idempotency_key: z.string().uuid('Clé de commande invalide'),
});

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(`orders:${getClientAddress(request)}`);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
    }
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données de commande invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { customer_name, customer_phone, customer_email, delivery_address, items, idempotency_key } = parsed.data;
    const { data: order, error } = await supabaseAdmin.rpc('create_order', {
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_customer_email: customer_email,
      p_delivery_address: delivery_address ?? null,
      p_items: items,
      p_idempotency_key: idempotency_key,
    });

    if (error) {
      const status = /stock insuffisant|produit non disponible|panier vide|quantité invalide/i.test(error.message)
        ? 409
        : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    const created = Boolean(order?._created ?? true);
    if (created) {
      await notifyNewOrder(order, items);
    }

    return NextResponse.json(
      { message: created ? 'Commande réussie ! Le stock a été mis à jour.' : 'Commande déjà enregistrée.', order, created },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    await reportError('orders.create', err);
    return NextResponse.json({ error: 'Une erreur interne est survenue. Réessayez dans quelques instants.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Accès refusé. Session administrateur invalide ou token manquant.' },
      { status: 401 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, customer_name, customer_email, customer_phone, delivery_address, total_price, status, created_at, updated_at, items:order_items(quantity, unit_price, variant:product_variants(label), product:products(name, image_url)), status_events:order_status_events(*)')
    .order('created_at', { ascending: false });

  if (error) {
    await reportError('orders.list', error);
    return NextResponse.json({ error: 'Impossible de charger les commandes.' }, { status: 500 });
  }
  return NextResponse.json(data);
}
