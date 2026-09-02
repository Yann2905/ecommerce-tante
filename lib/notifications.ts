import { supabaseAdmin } from './supabase-admin';
import { displayOrderStatus } from './order-status';

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address?: string | null;
  total_price: number | string;
  status?: string | null;
};

type OrderItemInput = { product_id: string; quantity: number; unit_price?: number | string | null };
type ProductRow = { id: string; name: string; image_url?: string | null };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://emmaashop.fr';

export async function notifyNewOrder(order: OrderRow, items: OrderItemInput[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM || 'Emmaashop <contact@emmaashop.fr>';
  const ownerEmail = process.env.SHOP_EMAIL;
  if (!ownerEmail) return;

  try {
    const orderInfo = await buildOrderInfo(order, items);
    await sendEmail(apiKey, from, ownerEmail, `Nouvelle commande — ${order.customer_name}`, `<h2>Nouvelle commande Emmaashop</h2>${orderInfo}<p>Connectez-vous à l’espace administrateur pour la traiter.</p>`);

    if (order.customer_email) {
      const customerHtml = `<h2>Merci pour votre commande, ${escapeHtml(order.customer_name)}.</h2><p>Votre commande a bien été enregistrée par Emmaashop. Nous vous contacterons prochainement pour confirmer la livraison.</p>${orderInfo}<p style="margin-top:24px"><a href="${SITE_URL}" style="background:#283b24;color:#fff;padding:12px 18px;text-decoration:none">Retourner sur Emmaashop</a></p>`;
      await sendEmail(apiKey, from, order.customer_email, `Confirmation de votre commande #${order.id}`, customerHtml);
    }
  } catch (err) {
    console.error(JSON.stringify({ event: 'notifications.new_order_failed', message: err instanceof Error ? err.message : String(err) }));
  }
}

export async function notifyOrderStatusChanged(order: OrderRow, fromStatus: string, toStatus: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !order.customer_email) return;

  const from = process.env.RESEND_FROM || 'Emmaashop <contact@emmaashop.fr>';
  try {
    const fromLabel = displayOrderStatus(fromStatus);
    const toLabel = displayOrderStatus(toStatus);
    const subject = `Mise à jour de votre commande #${order.id}`;
    const html = `<h2>Votre commande évolue</h2><p>Bonjour ${escapeHtml(order.customer_name)},</p><p>Le statut de votre commande <strong>#${escapeHtml(order.id)}</strong> est maintenant : <strong>${escapeHtml(toLabel)}</strong>.</p><p style="color:#666">Statut précédent : ${escapeHtml(fromLabel)}</p><p>Notre équipe reste disponible si vous avez une question.</p><p style="margin-top:24px"><a href="${SITE_URL}" style="background:#283b24;color:#fff;padding:12px 18px;text-decoration:none">Visiter Emmaashop</a></p>`;
    await sendEmail(apiKey, from, order.customer_email, subject, html);
  } catch (err) {
    console.error(JSON.stringify({ event: 'notifications.status_change_failed', message: err instanceof Error ? err.message : String(err), orderId: order.id }));
  }
}

async function buildOrderInfo(order: OrderRow, items: OrderItemInput[]) {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, image_url')
    .in('id', items.map((item) => item.product_id));

  const productById = new Map<string, ProductRow>((products ?? []).map((product) => [product.id, product]));
  const lines = items.map((item) => {
    const product = productById.get(item.product_id);
    const image = product?.image_url
      ? `<img src="${escapeHtml(product.image_url)}" alt="" width="72" style="width:72px;height:72px;object-fit:cover;vertical-align:middle;margin-right:10px;border-radius:6px">`
      : '';
    const price = item.unit_price == null ? '' : ` — ${escapeHtml(String(item.unit_price))} €`;
    return `<div style="margin:8px 0">${image}<strong>${escapeHtml(product?.name ?? item.product_id)}</strong> × ${item.quantity}${price}</div>`;
  }).join('');

  return `
    <p><strong>Client :</strong> ${escapeHtml(order.customer_name)}</p>
    ${order.customer_email ? `<p><strong>E-mail :</strong> ${escapeHtml(order.customer_email)}</p>` : ''}
    <p><strong>Téléphone :</strong> ${escapeHtml(order.customer_phone)}</p>
    <p><strong>Adresse :</strong> ${escapeHtml(order.delivery_address ?? 'Non précisée')}</p>
    <p><strong>Articles :</strong><br>${lines}</p>
    <p><strong>Total :</strong> ${escapeHtml(String(order.total_price))} €</p>
    <hr>
    <p style="color:#888;font-size:12px">Commande n° ${escapeHtml(order.id)}</p>
  `;
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend a renvoyé ${res.status}`);
}

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
