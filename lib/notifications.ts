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
 *   - RESEND_FROM      : expéditeur vérifié, par défaut "Emmaashop <contact@emmaashop.com>"
 *   - SHOP_EMAIL       : destinataire, par défaut "sonya.carlach@gmail.com"
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
  // Valeurs Emmaashop par défaut ; les variables d’environnement restent prioritaires.
  const from = process.env.RESEND_FROM || 'Emmaashop <contact@emmaashop.com>';
  const to = process.env.SHOP_EMAIL || 'sonya.carlach@gmail.com';

  // Non configuré → on ne tente rien (pas d'erreur).
  if (!apiKey || !from || !to) return;

  try {
    // Récupère les noms et images des produits pour un e-mail lisible.

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, image_url')
      .in(
        'id',
        items.map((i) => i.product_id)
      );

    const productById = new Map((products ?? []).map((p) => [p.id, p]));
    const lines = items
      .map((i) => {
        const product = productById.get(i.product_id);
        const image = product?.image_url ? `<img src="${escapeHtml(product.image_url)}" alt="" width="72" style="width:72px;height:72px;object-fit:cover;vertical-align:middle;margin-right:10px;border-radius:6px">` : '';
        return `<div style="margin:8px 0">${image}<strong>${escapeHtml(product?.name ?? i.product_id)}</strong> × ${i.quantity}</div>`;
      })
      .join('');

    const html = `
      <h2>🛍️ Nouvelle commande Emmaashop</h2>
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
