'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle, Clock3, ExternalLink, Loader2, MapPin, MessageCircle, Package, ShoppingBag, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import AdminChrome from '@/components/AdminChrome';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus, canTransitionOrderStatus } from '@/lib/order-status';

type OrderItem = { quantity: number; unit_price: number; variant?: { label: string } | null; product: { name: string; image_url?: string } | null };
type StatusEvent = { id: string; from_status: string | null; to_status: string; note?: string | null; created_at: string };
type Order = { id: string; customer_name: string; customer_email?: string | null; customer_phone: string; delivery_address?: string | null; total_price: number; status: string; created_at: string; updated_at?: string; items: OrderItem[]; status_events?: StatusEvent[] };

const STATUS_ICONS: Record<OrderStatus, typeof Clock3> = {
  en_attente: Clock3,
  confirmee: Check,
  en_preparation: Package,
  expediee: ExternalLink,
  livree: CheckCircle,
  annulee: XCircle,
  retournee: XCircle,
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  en_attente: 'bg-[#f7ead0] text-[#8a5a16]',
  confirmee: 'bg-[#e9eee1] text-[var(--olive-deep)]',
  en_preparation: 'bg-[#e8edf0] text-[#36515f]',
  expediee: 'bg-[#e6e4f2] text-[#4e4778]',
  livree: 'bg-[#e3eee3] text-[var(--olive-deep)]',
  annulee: 'bg-[#f9e8e4] text-[var(--coral)]',
  retournee: 'bg-[#f0e5eb] text-[#7b4863]',
};

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiCall('/api/orders');
      const nextOrders = (rows as Order[]) || [];
      setOrders(nextOrders);
      const requested = new URLSearchParams(window.location.search).get('order');
      if (requested) setSelected(nextOrders.find((order) => order.id === requested) ?? null);
    } catch (err) {
      if (String(err).toLowerCase().includes('accès') || String(err).includes('401')) router.replace('/login');
      else setError(err instanceof Error ? err.message : 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => orders.filter((order) => filter === 'all' || order.status === filter), [orders, filter]);
  const total = orders.filter((order) => order.status !== 'annulee').reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const pending = orders.filter((order) => ['en_attente', 'confirmee', 'en_preparation'].includes(order.status)).length;
  const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
  const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  const updateStatus = async (status: OrderStatus) => {
    if (!selected || !canTransitionOrderStatus(selected.status, status) || updating) return;
    setUpdating(true);
    setError('');
    try {
      const result = await apiCall(`/api/orders/${selected.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected(result.order as Order);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier le statut.');
    } finally {
      setUpdating(false);
    }
  };

  const whatsApp = () => {
    if (!selected) return;
    const phone = selected.customer_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${selected.customer_name}, c'est Emmaashop. Nous vous contactons concernant votre commande #${selected.id}.`)}`, '_blank', 'noopener,noreferrer');
  };

  return <AdminChrome title="Commandes" eyebrow="Ventes"><div className="mt-8"><div className="grid gap-3 sm:grid-cols-3"><div className="border border-[var(--line)] bg-white p-5"><Package size={18} className="text-[var(--olive)]"/><p className="eyebrow mt-7">Toutes les commandes</p><p className="mt-2 text-2xl font-bold">{loading ? '—' : orders.length}</p></div><div className={`border p-5 ${pending ? 'border-[#dfbd7a] bg-[#fffaf0]' : 'border-[var(--line)] bg-white'}`}><Clock3 size={18} className="text-[#a87320]"/><p className="eyebrow mt-7">À traiter</p><p className="mt-2 text-2xl font-bold">{loading ? '—' : pending}</p></div><div className="border border-[var(--line)] bg-white p-5"><Check size={18} className="text-[var(--olive)]"/><p className="eyebrow mt-7">Chiffre d’affaires</p><p className="mt-2 text-2xl font-bold">{loading ? '—' : money(total)}</p></div></div>{error && <p role="alert" className="mt-5 bg-[#f9e8e4] p-3 text-xs text-[var(--coral)]">{error}</p>}<div className="mt-8 flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-4"><button onClick={() => setFilter('all')} className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] ${filter === 'all' ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] bg-white text-[var(--muted)]'}`}>Toutes <span className="ml-1 opacity-60">{orders.length}</span></button>{ORDER_STATUSES.map((key) => <button key={key} onClick={() => setFilter(key)} className={`shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] ${filter === key ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] bg-white text-[var(--muted)]'}`}>{ORDER_STATUS_LABELS[key]} <span className="ml-1 opacity-60">{orders.filter((order) => order.status === key).length}</span></button>)}</div><div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]"><section className="grid gap-3">{loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-[var(--olive)]"/></div> : filtered.length === 0 ? <div className="border border-dashed border-[var(--line)] py-24 text-center"><ShoppingBag size={30} className="mx-auto text-[var(--muted)]"/><p className="mt-4 text-sm text-[var(--muted)]">Aucune commande dans cette sélection.</p></div> : filtered.map((order) => { const status = (ORDER_STATUSES.includes(order.status as OrderStatus) ? order.status : 'en_attente') as OrderStatus; const Icon = STATUS_ICONS[status]; const active = selected?.id === order.id; return <button key={order.id} onClick={() => setSelected(order)} className={`w-full border p-5 text-left transition ${active ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--line)] bg-white hover:border-[var(--ink)]'}`}><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${active ? 'bg-white/15 text-white' : 'bg-[#eeece5]'}`}>{order.customer_name?.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-bold">{order.customer_name}</p><p className={`mt-1 text-xs ${active ? 'text-white/55' : 'text-[var(--muted)]'}`}>{date(order.created_at)}</p></div></div><strong className={`shrink-0 text-lg ${active ? 'text-[var(--sand)]' : 'text-[var(--ink)]'}`}>{money(order.total_price)}</strong></div><div className="mt-4 flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${active ? 'bg-white/10 text-[var(--sand)]' : STATUS_CLASSES[status]}`}><Icon size={11}/>{ORDER_STATUS_LABELS[status]}</span><span className={`text-xs ${active ? 'text-white/55' : 'text-[var(--muted)]'}`}>{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}</span></div></button>; })}</section><aside className={`${selected ? 'fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:p-6 lg:static lg:inset-auto lg:z-auto lg:block lg:bg-transparent lg:p-0' : 'hidden lg:block'} min-h-[330px]`} onClick={() => selected && setSelected(null)}>{selected ? <div className="max-h-[92dvh] w-full overflow-y-auto bg-white lg:max-h-none" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between border-b border-[var(--line)] p-6"><div><p className="eyebrow">Détail commande</p><h2 className="display mt-2 text-3xl">{selected.customer_name}</h2><p className="mt-1 text-xs text-[var(--muted)]">{date(selected.created_at)}</p></div><button onClick={() => setSelected(null)} className="text-[var(--muted)] lg:hidden"><X size={18}/></button></div><div className="grid gap-3 border-b border-[var(--line)] p-6 text-sm"><p className="flex items-start gap-3"><MessageCircle size={16} className="mt-0.5 text-[var(--olive)]"/>{selected.customer_phone}</p>{selected.customer_email && <p className="break-all text-xs text-[var(--muted)]">{selected.customer_email}</p>}<p className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 text-[var(--olive)]"/>{selected.delivery_address || 'Adresse non précisée'}</p></div><div className="border-b border-[var(--line)] p-6"><p className="eyebrow mb-4">Articles</p><div className="grid gap-3">{(selected.items || []).map((item, index) => <div key={`${item.product?.name}-${index}`} className="flex justify-between gap-3 text-sm"><span>{item.product?.name || 'Article'}{item.variant?.label ? <span className="text-[var(--muted)]"> · {item.variant.label}</span> : null} <span className="text-[var(--muted)]">× {item.quantity}</span></span><strong>{money(item.unit_price * item.quantity)}</strong></div>)}</div><div className="mt-5 flex justify-between border-t border-[var(--line)] pt-4"><span className="text-sm font-bold">Total</span><strong className="text-xl">{money(selected.total_price)}</strong></div></div><div className="p-6"><p className="eyebrow mb-3">Modifier le statut</p><div className="grid gap-2">{ORDER_STATUSES.filter((status) => status !== selected.status && canTransitionOrderStatus(selected.status, status)).map((status) => <button key={status} disabled={updating} onClick={() => updateStatus(status)} className={`flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50 ${status === 'annulee' ? 'bg-[var(--coral)]' : 'bg-[var(--olive)]'}`}>{updating ? <Loader2 size={14} className="animate-spin"/> : status === 'annulee' ? <XCircle size={14}/> : <CheckCircle size={14}/>} {ORDER_STATUS_LABELS[status]}</button>)}<button onClick={whatsApp} className="flex items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 text-[10px] font-bold uppercase tracking-wider hover:border-[var(--ink)]"><ExternalLink size={14}/> Contacter WhatsApp</button></div>{selected.status_events?.length ? <div className="mt-7 border-t border-[var(--line)] pt-5"><p className="eyebrow mb-3">Historique</p><div className="grid gap-3 text-xs text-[var(--muted)]">{selected.status_events.slice(0, 6).map((event) => <div key={event.id}><strong className="text-[var(--ink)]">{event.from_status ? `${event.from_status} → ` : ''}{event.to_status}</strong><span className="ml-2">{date(event.created_at)}</span>{event.note && <p className="mt-1">{event.note}</p>}</div>)}</div></div> : null}</div></div> : <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><ShoppingBag size={32} className="mx-auto text-[var(--muted)]"/><p className="mt-4 text-sm text-[var(--muted)]">Sélectionnez une commande<br/>pour voir son détail.</p></div></div>}</aside></div></div></AdminChrome>;
}
