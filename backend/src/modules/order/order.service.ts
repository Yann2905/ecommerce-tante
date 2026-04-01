import { supabase } from '../../config/supabase';

interface OrderData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_price: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number; // ← sera ignoré, on récupère le vrai prix
}

export class OrderService {

  async createOrder(orderData: OrderData, items: OrderItem[]) {

    // ✅ Étape 1 — Récupérer les vrais prix depuis la BDD
    const productIds = items.map(i => i.product_id);

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, price, discount_price, stock, is_active, name')
      .in('id', productIds);

    if (prodError) throw prodError;

    // ✅ Étape 2 — Vérifier stock et disponibilité
    for (const item of items) {
      const product = products?.find(p => p.id === item.product_id);

      if (!product) 
        throw new Error(`Produit introuvable : ${item.product_id}`);
      if (!product.is_active) 
        throw new Error(`Produit non disponible : ${product.name}`);
      if (product.stock < item.quantity) 
        throw new Error(`Stock insuffisant pour : ${product.name}`);
    }

    // ✅ Étape 3 — Recalculer le total côté serveur (jamais faire confiance au client)
    const serverTotal = items.reduce((sum, item) => {
      const product = products!.find(p => p.id === item.product_id)!;
      const realPrice = product.discount_price ?? product.price;
      return sum + realPrice * item.quantity;
    }, 0);

    // ✅ Étape 4 — Créer la commande avec le vrai total
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ ...orderData, total_price: serverTotal }])
      .select()
      .single();

    if (orderError) throw orderError;

    // ✅ Étape 5 — Insérer les articles avec les vrais prix
    const orderItems = items.map(item => {
      const product = products!.find(p => p.id === item.product_id)!;
      return {
        order_id:   order.id,
        product_id: item.product_id,
        quantity:   item.quantity,
        unit_price: product.discount_price ?? product.price, // ← prix réel BDD
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  }

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image_url))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}