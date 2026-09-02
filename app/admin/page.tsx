'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Box, LogOut, Package, ShoppingBag, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiCall } from '@/lib/api';
import { ORDER_STATUS_LABELS, normalizeOrderStatus } from '@/lib/order-status';

type Dashboard = {
  stats: { revenue: number; ordersCount: number; pendingCount: number; productsCount: number; activeProductsCount: number; inStockCount: number; lowStockCount: number };
  recentOrders: Array<{ id: string; customer_name: string; total_price: number; status: string; created_at: string }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          router.replace('/login');
          return;
        }
        setDashboard(await apiCall('/api/admin/dashboard'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
  const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value));
  const stats = dashboard?.stats;

  return <main className="min-h-screen bg-[var(--paper)]"><header className="border-b border-[var(--line)] bg-white"><div className="container-shop flex h-20 items-center justify-between"><Link href="/" className="display text-3xl">Emmaashop<span className="text-[var(--olive)]">.</span></Link><div className="flex items-center gap-6"><span className="hidden text-[11px] font-bold uppercase tracking-[.15em] text-[var(--muted)] sm:inline">Administration</span><button onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"><LogOut size={16}/> Sortir</button></div></div></header><div className="container-shop py-10 md:py-16"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Vue d’ensemble</p><h1 className="display mt-3 text-5xl">Bonjour, Emma.</h1><p className="mt-3 text-sm text-[var(--muted)]">Pilotez votre boutique depuis un seul espace.</p></div><Link href="/" className="btn-secondary w-fit">Voir la boutique <ArrowRight size={15}/></Link></div>{error && <p role="alert" className="mt-6 bg-[#f9e8e4] p-3 text-xs text-[var(--coral)]">{error}</p>}{loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[var(--olive)]"/></div> : <><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Chiffre d’affaires", money(stats?.revenue ?? 0), TrendingUp], ['Commandes', stats?.ordersCount ?? 0, ShoppingBag], ['À traiter', stats?.pendingCount ?? 0, Package], ['Produits en stock', stats?.inStockCount ?? 0, Box]].map(([label, value, Icon]: any) => <div key={label} className="bg-white p-6"><Icon size={19} className="text-[var(--olive)]"/><p className="mt-8 text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div><div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="bg-white p-6 md:p-8"><div className="flex items-end justify-between border-b border-[var(--line)] pb-5"><div><p className="eyebrow">Activité récente</p><h2 className="display mt-2 text-3xl">Dernières commandes</h2></div><Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest">Tout voir <ArrowRight size={13} className="ml-1 inline"/></Link></div><div className="mt-3 divide-y divide-[var(--line)]">{dashboard?.recentOrders.length ? dashboard.recentOrders.slice(0, 6).map((order) => <Link href={`/admin/orders?order=${order.id}`} key={order.id} className="flex items-center justify-between gap-4 py-4 hover:bg-[var(--paper)]"><div><p className="font-semibold">{order.customer_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{date(order.created_at)} · {ORDER_STATUS_LABELS[normalizeOrderStatus(order.status)]}</p></div><strong>{money(order.total_price)}</strong></Link>) : <p className="py-10 text-sm text-[var(--muted)]">Aucune commande pour le moment.</p>}</div></section><aside className="bg-[#fffaf0] p-6 md:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow">Surveillance</p><h2 className="display mt-2 text-3xl">Stock à vérifier</h2></div><AlertTriangle className="text-[#a87320]" size={20}/></div><p className="mt-4 text-sm text-[var(--muted)]">{stats?.lowStockCount ?? 0} référence{(stats?.lowStockCount ?? 0) > 1 ? 's' : ''} à 3 unités ou moins.</p><div className="mt-6 grid gap-3">{dashboard?.lowStockProducts.length ? dashboard.lowStockProducts.map((product) => <Link key={product.id} href="/admin/products" className="flex items-center justify-between border-b border-[#eadfbf] pb-3 text-sm"><span>{product.name}</span><strong className="text-[#a87320]">{product.stock}</strong></Link>) : <p className="text-sm text-[var(--muted)]">Aucune alerte de stock.</p>}</div></aside></div><div className="mt-10 grid gap-5 md:grid-cols-2"><Link href="/admin/products" className="group border border-[var(--line)] bg-white p-7 transition hover:border-[var(--ink)]"><p className="eyebrow">Catalogue</p><h2 className="display mt-3 text-3xl">Gérer les produits</h2><p className="mt-3 text-sm text-[var(--muted)]">Ajouter, modifier, masquer ou supprimer les pièces de la boutique.</p><span className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">Ouvrir <ArrowRight size={15} className="transition group-hover:translate-x-1"/></span></Link><Link href="/admin/orders" className="group border border-[var(--line)] bg-white p-7 transition hover:border-[var(--ink)]"><p className="eyebrow">Ventes</p><h2 className="display mt-3 text-3xl">Suivre les commandes</h2><p className="mt-3 text-sm text-[var(--muted)]">Retrouver les demandes clients et organiser les livraisons.</p><span className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">Ouvrir <ArrowRight size={15} className="transition group-hover:translate-x-1"/></span></Link></div></>}</div></main>;
}
