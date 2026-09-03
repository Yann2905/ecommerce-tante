import { logEvent } from './observability';

/**
 * Conversions API Meta + Events API TikTok.
 *
 * Pourquoi côté serveur : le navigateur peut perdre l'événement (bloqueur, onglet
 * fermé, réseau coupé). Ici, `Purchase` part depuis la confirmation réelle de la
 * commande, avec le montant recalculé par Postgres — jamais celui du panier client.
 *
 * Déduplication : `event_id = order.id`, identique à l'événement navigateur.
 * Comme `create_order` est idempotente, une commande = un seul id = un seul
 * Purchase, même en cas de double-clic ou de réponse réseau perdue.
 *
 * Les tokens sont strictement serveur : jamais de préfixe NEXT_PUBLIC_.
 */

const META_DATASET_ID = process.env.META_DATASET_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const TIKTOK_TOKEN = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN;
const ADS_CURRENCY = process.env.NEXT_PUBLIC_ADS_CURRENCY || 'EUR';
const TIKTOK_PURCHASE_EVENT = process.env.NEXT_PUBLIC_TIKTOK_PURCHASE_EVENT || 'CompletePayment';
const META_API_VERSION = 'v21.0';

export type ServerPurchase = {
  orderId: string;
  value: number;
  contents: Array<{ id: string; quantity: number }>;
};

/** Signaux non identifiants extraits de la requête (aucune donnée client saisie). */
type RequestSignals = {
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
  fbp?: string;
  fbc?: string;
  ttp?: string;
};

function cookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1];
}

export function requestSignals(request: Request): RequestSignals {
  const cookies = request.headers.get('cookie');
  const forwarded = request.headers.get('x-forwarded-for');
  return {
    ip: forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    sourceUrl: request.headers.get('referer') || process.env.NEXT_PUBLIC_SITE_URL || undefined,
    fbp: cookieValue(cookies, '_fbp'),
    fbc: cookieValue(cookies, '_fbc'),
    ttp: cookieValue(cookies, '_ttp'),
  };
}

async function sendMetaPurchase(purchase: ServerPurchase, signals: RequestSignals) {
  if (!META_DATASET_ID || !META_TOKEN) return;

  // user_data ne contient aucune donnée saisie par la cliente (ni nom, ni e-mail,
  // ni téléphone, ni adresse) : uniquement les cookies publicitaires Meta et les
  // en-têtes techniques. Un ajout de PII hachée exigerait une analyse juridique.
  const userData: Record<string, unknown> = {};
  if (signals.ip) userData.client_ip_address = signals.ip;
  if (signals.userAgent) userData.client_user_agent = signals.userAgent;
  if (signals.fbp) userData.fbp = signals.fbp;
  if (signals.fbc) userData.fbc = signals.fbc;

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: purchase.orderId,
      action_source: 'website',
      ...(signals.sourceUrl ? { event_source_url: signals.sourceUrl } : {}),
      user_data: userData,
      custom_data: {
        currency: ADS_CURRENCY,
        value: Number(purchase.value.toFixed(2)),
        content_type: 'product',
        content_ids: purchase.contents.map((content) => content.id),
        contents: purchase.contents.map((content) => ({ id: content.id, quantity: content.quantity })),
        num_items: purchase.contents.reduce((sum, content) => sum + content.quantity, 0),
        order_id: purchase.orderId,
      },
    }],
  };

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_DATASET_ID}/events?access_token=${encodeURIComponent(META_TOKEN)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  if (!response.ok) throw new Error(`Meta CAPI a renvoyé ${response.status}`);
}

async function sendTikTokPurchase(purchase: ServerPurchase, signals: RequestSignals) {
  if (!TIKTOK_PIXEL_ID || !TIKTOK_TOKEN) return;

  const user: Record<string, unknown> = {};
  if (signals.ip) user.ip = signals.ip;
  if (signals.userAgent) user.user_agent = signals.userAgent;
  if (signals.ttp) user.ttp = signals.ttp;

  const body = {
    event_source: 'web',
    event_source_id: TIKTOK_PIXEL_ID,
    data: [{
      event: TIKTOK_PURCHASE_EVENT,
      event_time: Math.floor(Date.now() / 1000),
      event_id: purchase.orderId,
      user,
      ...(signals.sourceUrl ? { page: { url: signals.sourceUrl } } : {}),
      properties: {
        currency: ADS_CURRENCY,
        value: Number(purchase.value.toFixed(2)),
        order_id: purchase.orderId,
        contents: purchase.contents.map((content) => ({
          content_id: content.id,
          content_type: 'product',
          quantity: content.quantity,
        })),
      },
    }],
  };

  const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: { 'Access-Token': TIKTOK_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`TikTok Events API a renvoyé ${response.status}`);
}

/**
 * Envoie Purchase aux régies configurées. Best-effort et non bloquant : une panne
 * Meta ou TikTok ne doit jamais faire échouer une commande déjà enregistrée.
 * Ne fait rien sans consentement marketing ou sans token configuré.
 */
export async function sendServerPurchase(
  purchase: ServerPurchase,
  signals: RequestSignals,
  hasConsent: boolean,
) {
  if (!hasConsent) return;

  const deliveries = [
    { platform: 'meta', send: () => sendMetaPurchase(purchase, signals) },
    { platform: 'tiktok', send: () => sendTikTokPurchase(purchase, signals) },
  ];

  await Promise.all(deliveries.map(async ({ platform, send }) => {
    try {
      await send();
    } catch (error) {
      logEvent('warn', 'marketing.server_purchase_failed', {
        platform,
        orderId: purchase.orderId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }));
}
