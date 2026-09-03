/**
 * Mesure d'audience first-party : anonymisée, sans IP, sans partage tiers.
 * Sert de contrôle indépendant des pixels publicitaires — si Meta annonce
 * 10 ventes et cette couche 4, c'est la couche interne qui a raison.
 *
 * Distincte de lib/marketing.ts : ne dépend d'aucune régie et n'est pas
 * conditionnée au consentement marketing.
 */
export type InternalEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_created';

export function sendInternalEvent(eventType: InternalEventType, path?: string) {
  if (typeof window === 'undefined') return;

  const targetPath = path || window.location.pathname;
  if (targetPath.startsWith('/admin') || targetPath.startsWith('/login')) return;

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, path: targetPath }),
    keepalive: true,
  }).catch(() => undefined);
}
