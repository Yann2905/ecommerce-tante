import { hasMarketingConsent } from './consent';

/**
 * Point d'entrée UNIQUE des événements publicitaires côté navigateur.
 *
 * Règles non négociables :
 *  1. Aucun script tiers avant consentement marketing explicite.
 *  2. Aucun événement si les Pixel ID ne sont pas configurés (no-op silencieux).
 *  3. Aucun événement sur /admin ni /login.
 *  4. Les montants d'une commande viennent TOUJOURS du serveur, jamais du panier.
 *  5. Un `eventId` partagé avec le serveur permet la déduplication.
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
export const ADS_CURRENCY = process.env.NEXT_PUBLIC_ADS_CURRENCY || 'EUR';

/**
 * TikTok expose historiquement `CompletePayment` et, selon la configuration du
 * compte, `Purchase`. Le nom exact doit être confirmé dans TikTok Events Manager
 * avant la première campagne — d'où cette variable plutôt qu'une valeur figée.
 */
const TIKTOK_PURCHASE_EVENT = process.env.NEXT_PUBLIC_TIKTOK_PURCHASE_EVENT || 'CompletePayment';

export type MarketingEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Contact';

export type MarketingContent = {
  id: string;
  quantity: number;
  name?: string;
  price?: number;
};

export type MarketingPayload = {
  /** Identifiant partagé navigateur/serveur pour dédupliquer. order.id pour Purchase. */
  eventId?: string;
  contents?: MarketingContent[];
  /** Montant total. Pour Purchase : impérativement le total renvoyé par /api/orders. */
  value?: number;
  contentName?: string;
};

type Fbq = (...args: unknown[]) => void;
type Ttq = { track: (event: string, payload?: unknown, options?: unknown) => void; page: () => void };

declare global {
  interface Window {
    fbq?: Fbq & { callMethod?: Fbq; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

let pixelsLoaded = false;

export function isMarketingConfigured(): boolean {
  return Boolean(META_PIXEL_ID || TIKTOK_PIXEL_ID);
}

/** Les pages d'administration ne doivent jamais alimenter les régies. */
function isTrackablePath(pathname: string): boolean {
  return !pathname.startsWith('/admin') && !pathname.startsWith('/login');
}

function canTrack(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isMarketingConfigured()) return false;
  if (!hasMarketingConsent()) return false;
  return isTrackablePath(window.location.pathname);
}

/* ------------------------------------------------------------------ *
 * Chargement des pixels — jamais appelé avant consentement.
 * ------------------------------------------------------------------ */

function loadMetaPixel(pixelId: string) {
  if (window.fbq) return;

  const queue: unknown[] = [];
  const fbq = function (...args: unknown[]) {
    // Équivalent au snippet officiel Meta : `this` reste `fbq` dans les deux cas.
    if (fbq.callMethod) fbq.callMethod(...args);
    else queue.push(args);
  } as Window['fbq'] & { callMethod?: Fbq; queue: unknown[] };

  fbq.queue = queue;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
}

function loadTikTokPixel(pixelId: string) {
  if (window.ttq) return;

  const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
  window.TiktokAnalyticsObject = 'ttq';

  const ttq = [] as unknown as Ttq & Record<string, any>;
  ttq.methods = methods;
  ttq.setAndDefer = (target: Record<string, any>, method: string) => {
    target[method] = (...args: unknown[]) => target.push([method, ...args]);
  };
  for (const method of methods) ttq.setAndDefer(ttq, method);

  ttq.instance = (id: string) => {
    const instance = ttq._i?.[id] || [];
    for (const method of methods) ttq.setAndDefer(instance, method);
    return instance;
  };

  ttq.load = (id: string, options?: Record<string, unknown>) => {
    const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = url;
    ttq._t = ttq._t || {};
    ttq._t[id] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[id] = options || {};

    const script = document.createElement('script');
    script.async = true;
    script.src = `${url}?sdkid=${id}&lib=ttq`;
    document.head.appendChild(script);
  };

  window.ttq = ttq;
  ttq.load(pixelId);
}

/**
 * Charge les pixels si — et seulement si — le consentement est accordé.
 * Idempotent : plusieurs appels ne chargent qu'une fois.
 */
export function loadMarketingPixels() {
  if (typeof window === 'undefined' || pixelsLoaded) return;
  if (!hasMarketingConsent() || !isMarketingConfigured()) return;
  if (!isTrackablePath(window.location.pathname)) return;

  if (META_PIXEL_ID) loadMetaPixel(META_PIXEL_ID);
  if (TIKTOK_PIXEL_ID) loadTikTokPixel(TIKTOK_PIXEL_ID);
  pixelsLoaded = true;
}

/* ------------------------------------------------------------------ *
 * Normalisation puis mapping vers chaque régie.
 * ------------------------------------------------------------------ */

function metaPayload(payload: MarketingPayload) {
  const contents = payload.contents ?? [];
  const body: Record<string, unknown> = { currency: ADS_CURRENCY };

  if (payload.value != null) body.value = Number(payload.value.toFixed(2));
  if (payload.contentName) body.content_name = payload.contentName;
  if (contents.length) {
    body.content_type = 'product';
    body.content_ids = contents.map((content) => content.id);
    body.contents = contents.map((content) => ({
      id: content.id,
      quantity: content.quantity,
      ...(content.price != null ? { item_price: content.price } : {}),
    }));
    body.num_items = contents.reduce((sum, content) => sum + content.quantity, 0);
  }
  return body;
}

function tiktokPayload(payload: MarketingPayload) {
  const contents = payload.contents ?? [];
  const body: Record<string, unknown> = { currency: ADS_CURRENCY };

  if (payload.value != null) body.value = Number(payload.value.toFixed(2));
  if (contents.length) {
    body.contents = contents.map((content) => ({
      content_id: content.id,
      content_type: 'product',
      quantity: content.quantity,
      ...(content.name ? { content_name: content.name } : {}),
      ...(content.price != null ? { price: content.price } : {}),
    }));
  } else if (payload.contentName) {
    body.description = payload.contentName;
  }
  return body;
}

/**
 * Émet un événement vers toutes les régies configurées.
 * Sans consentement, sans Pixel ID, ou sur /admin : ne fait rien.
 */
export function trackMarketingEvent(name: MarketingEventName, payload: MarketingPayload = {}) {
  if (!canTrack()) return;

  try {
    if (window.fbq && META_PIXEL_ID) {
      const options = payload.eventId ? { eventID: payload.eventId } : undefined;
      window.fbq('track', name, metaPayload(payload), options);
    }

    if (window.ttq && TIKTOK_PIXEL_ID) {
      const tiktokName = name === 'Purchase' ? TIKTOK_PURCHASE_EVENT : name;
      const options = payload.eventId ? { event_id: payload.eventId } : undefined;
      window.ttq.track(tiktokName, tiktokPayload(payload), options);
    }
  } catch {
    // Un pixel cassé ne doit jamais interrompre un parcours d'achat.
  }
}

/** PageView : envoyé au chargement puis à chaque changement de route. */
export function trackMarketingPageView() {
  if (!canTrack()) return;
  try {
    if (window.fbq && META_PIXEL_ID) window.fbq('track', 'PageView');
    if (window.ttq && TIKTOK_PIXEL_ID) window.ttq.page();
  } catch {
    // idem : silencieux par conception.
  }
}
