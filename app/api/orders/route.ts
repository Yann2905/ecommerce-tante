import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { notifyNewOrder } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Le prix (unit_price / total_price) envoyé par le client est IGNORÉ :
// la fonction SQL create_order relit les vrais prix en base. On l'accepte
// en optionnel pour rester compatible avec les deux formulaires existants.
const OrderItemSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  quantity: z.number().int().positive('Quantité invalide'),
  unit_price: z.number().positive().optional(),
});

const CreateOrderSchema = z.object({
  customer_name: z.string().min(2, 'Nom trop court').max(100),
  customer_phone: z.string().min(8, 'Numéro invalide').max(20),
  delivery_address: z.string().max(300).optional().nullable(),
  total_price: z.number().positive().optional(),
  items: z.array(OrderItemSchema).min(1, 'Panier vide'),
});

// ✅ Public — un client passe commande. Le total est recalculé côté serveur.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Données de commande invalides',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { customer_name, customer_phone, delivery_address, items } = parsed.data;

    // ✅ Création ATOMIQUE en base (vérif stock + verrou + décrément + prix
    // serveur) via la fonction SQL create_order (voir supabase/migrations).
    const { data: order, error } = await supabaseAdmin.rpc('create_order', {
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_delivery_address: delivery_address ?? null,
      p_items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    });

    if (error) {
      // Les erreurs métier (stock insuffisant, produit indisponible…) remontent
      // comme exceptions Postgres → message clair, statut 400.
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 🔔 Notification e-mail à la boutique (best-effort, ne bloque pas la commande).
    await notifyNewOrder(order, items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));

    return NextResponse.json(
      { message: 'Commande réussie ! Le stock a été mis à jour.', order },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ Protégé — seule l'admin voit les commandes
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Accès refusé. Session invalide ou token manquant.' },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, image_url))')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
