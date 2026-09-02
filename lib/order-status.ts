export const ORDER_STATUSES = [
  'en_attente',
  'confirmee',
  'en_preparation',
  'expediee',
  'livree',
  'annulee',
  'retournee',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
  retournee: 'Retournée',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'en_attente',
  'confirmee',
  'en_preparation',
  'expediee',
];

export function normalizeOrderStatus(value: string | null | undefined): OrderStatus {
  const normalized = String(value ?? '').trim().toLowerCase();
  const aliases: Record<string, OrderStatus> = {
    'livré': 'livree',
    'livree': 'livree',
    'annulé': 'annulee',
    'annulee': 'annulee',
    'retournée': 'retournee',
    'retournee': 'retournee',
    'en_attente': 'en_attente',
    'confirmee': 'confirmee',
    'en_preparation': 'en_preparation',
    'expediee': 'expediee',
  };
  return aliases[normalized] ?? 'en_attente';
}

export function canTransitionOrderStatus(from: string, to: OrderStatus): boolean {
  const current = normalizeOrderStatus(from);
  if (current === to) return true;
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    en_attente: ['confirmee', 'annulee'],
    confirmee: ['en_preparation', 'annulee'],
    en_preparation: ['expediee', 'annulee'],
    expediee: ['livree'],
    livree: ['retournee'],
    annulee: [],
    retournee: [],
  };
  return transitions[current].includes(to);
}

export function displayOrderStatus(value: string | null | undefined): string {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(value)];
}
