import { supabaseAdmin } from './supabase-admin';

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  total_price: number | string;
};

type OrderItemInput = { product_id: string; quantity: number };

type ProductRow = { id: string; name: string; image_url?: string | null };

/** Envoie les notifications sans jamais faire échouer la création de commande. */
export async function notifyNewOrder(order: OrderRow, items: OrderItemInput[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Emmaashop <contact@emmaashop.com>';
  const ownerEmail = process.env.SHOP_EMAIL || 'sonya.carlach@gmail.com';
  if (!apiKey) return;

  try {
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
      return `<div style="margin:8px 0">${image}<strong>${escapeHtml(product?.name ?? item.product_id)}</strong> × ${item.quantity}</div>`;
    }).join('');

    const orderInfo = `
      <p><strong>Client :</strong> ${escapeHtml(order.customer_name)}</p>
      <p><strong>E-mail :</strong> ${escapeHtml(order.customer_email)}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(order.customer_phone)}</p>
      <p><strong>Adresse :</strong> ${escapeHtml(order.delivery_address)}</p>
      <p><strong>Articles :</strong><br>${lines}</p>
      <p><strong>Total :</strong> ${escapeHtml(String(order.total_price))} €</p>
      <hr>
      <p style="color:#888;font-size:12px">Commande n° ${escapeHtml(order.id)}</p>
    `;

    const ownerHtml = `<h2>Nouvelle commande Emmaashop</h2>${orderInfo}<p>Connectez-vous au panel pour traiter la commande.</p>`;
    await sendEmail(apiKey, from, ownerEmail, `Nouvelle commande — ${order.customer_name}`, ownerHtml);

    if (order.customer_email) {
      const customerHtml = `<h2>Merci pour votre commande, ${escapeHtml(order.customer_name)}.</h2><p>Votre commande a bien été enregistrée par Emmaashop. Nous vous contacterons prochainement pour confirmer la livraison.</p>${orderInfo}<p style="margin-top:24px"><a href="https://emmaashop.fr" style="background:#283b24;color:#fff;padding:12px 18px;text-decoration:none">Retourner sur Emmaashop</a></p>`;
      await sendEmail(apiKey, from, order.customer_email, `Confirmation de votre commande #${order.id}`, customerHtml);
    }
  } catch (err) {
    console.error('Les notifications e-mail ont échoué :', err);
  }
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) console.error('Resend a renvoyé une erreur :', res.status, await res.text());
}

function escapeHtml(input: string): string {
  return String(input).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
