import { supabaseAdmin } from './supabase-admin';

/**
 * ✅ Notification e-mail à la boutique lors d'une nouvelle commande.
 *
 * Best-effort : si les variables d'environnement ne sont pas configurées,
 * la fonction ne fait rien (elle ne doit JAMAIS faire échouer la commande).
 * Utilise l'API Resend directement en fetch (aucune dépendance ajoutée).
 *
 * Variables requises (serveur) :
 *   - RESEND_API_KEY   : clé API Resend (https://resend.com)
 *   - RESEND_FROM      : expéditeur vérifié, ex "Emma-Shop <commandes@ton-domaine.com>"
 *   - SHOP_EMAIL       : destinataire (l'e-mail de ta tante)
 */
type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_price: number | string;
};

type OrderItemInput = { product_id: string; quantity: number };

export async function notifyNewOrder(order: OrderRow, items: OrderItemInput[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.SHOP_EMAIL;

  // Non configuré → on ne tente rien (pas d'erreur).
  if (!apiKey || !from || !to) return;

  try {
    // Récupère les noms des produits pour un e-mail lisible.
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .in(
        'id',
        items.map((i) => i.product_id)
      );

    const nameById = new Map((products ?? []).map((p) => [p.id, p.name]));
    const lines = items
      .map((i) => `• ${nameById.get(i.product_id) ?? i.product_id} × ${i.quantity}`)
      .join('<br>');

    const html = `
      <h2>🛍️ Nouvelle commande Emma-Shop</h2>
      <p><strong>Client :</strong> ${escapeHtml(order.customer_name)}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(order.customer_phone)}</p>
      <p><strong>Adresse :</strong> ${escapeHtml(order.delivery_address)}</p>
      <p><strong>Articles :</strong><br>${lines}</p>
      <p><strong>Total :</strong> ${order.total_price} €</p>
      <hr>
      <p style="color:#888;font-size:12px">Commande n° ${order.id}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nouvelle commande — ${order.customer_name}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error('Resend a renvoyé une erreur :', res.status, await res.text());
    }
  } catch (err) {
    // On loggue mais on n'interrompt jamais le flux de commande.
    console.error('notifyNewOrder a échoué :', err);
  }
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
