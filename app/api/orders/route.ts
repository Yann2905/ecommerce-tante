import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const OrderItemSchema = z.object({
  product_id: z.string().uuid('ID produit invalide'),
  quantity: z.number().int().positive('Quantité invalide'),
  unit_price: z.number().positive('Prix invalide'),
});

const CreateOrderSchema = z.object({
  customer_name: z.string().min(2, 'Nom trop court').max(100),
  customer_phone: z.string().min(8, 'Numéro invalide').max(20),
  delivery_address: z
    .string()
    .max(300)
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val : 'Non précisée')),
  total_price: z.number().positive('Total invalide'),
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

    const { customer_name, customer_phone, delivery_address, total_price, items } =
      parsed.data;

    // 1. Récupérer les vrais prix / stocks depuis la BDD
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, price, discount_price, stock, is_active, name')
      .in('id', productIds);

    if (prodError) throw prodError;

    // 2. Vérifier stock et disponibilité
    for (const item of items) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Produit introuvable : ${item.product_id}`);
      if (!product.is_active)
        throw new Error(`Produit non disponible : ${product.name}`);
      if (product.stock < item.quantity)
        throw new Error(`Stock insuffisant pour : ${product.name}`);
    }

    // 3. Recalculer le total côté serveur (jamais faire confiance au client)
    const serverTotal = items.reduce((sum, item) => {
      const product = products!.find((p) => p.id === item.product_id)!;
      const realPrice = product.discount_price ?? product.price;
      return sum + realPrice * item.quantity;
    }, 0);

    // 4. Créer la commande avec le vrai total
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{ customer_name, customer_phone, delivery_address, total_price: serverTotal }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Insérer les articles avec les vrais prix
    const orderItems = items.map((item) => {
      const product = products!.find((p) => p.id === item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.discount_price ?? product.price,
      };
    });

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

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
