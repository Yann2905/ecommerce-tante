'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingCart, TrendingUp, Users, ArrowRight,
  Smartphone, Loader2, LogOut, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ─── COMPOSANT : CARTE DE STATISTIQUE ────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, loading, highlight }: any) => (
  <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-[#F5E6D3] flex flex-col justify-between relative overflow-hidden shadow-sm">
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${color} flex items-center justify-center mb-4 sm:mb-6 shadow-lg relative z-10`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="relative z-10 text-left">
      <h3 className="text-[#8B5E34] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2">{title}</h3>
      {loading ? (
        <Loader2 size={20} className="animate-spin text-[#C9A84C] mt-1" />
      ) : (
        <p className="text-3xl sm:text-4xl font-black tracking-tighter text-[#2D1B08]">{value}</p>
      )}
    </div>
  </div>
);

// ─── COMPOSANT : DASHBOARD PRINCIPAL ─────────────────────────────────────────
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [revenue, setRevenue] = useState('0 €');
  const [orderCount, setOrderCount] = useState('0');
  const [productCount, setProductCount] = useState('0');
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || 'Admin');
    });

    async function loadStats() {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total_price, status, customer_name, created_at')
          .order('created_at', { ascending: false });

        if (orders) {
          setOrderCount(String(orders.length));
          const total = orders
            .filter(o => o.status === 'traité')
            .reduce((sum, o) => sum + (o.total_price || 0), 0);

          setRevenue(new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
          }).format(total));

          setNewOrders(orders.filter(o => o.status === 'en_attente').slice(0, 3));
        }

        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
        setProductCount(String(count ?? 0));
      } catch (e) {
        console.error("Erreur stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleFinalLogout = async () => {
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] px-4 py-6 sm:px-6 sm:py-10 md:p-12 lg:p-16">

      {/* ── MODALE DE DÉCONNEXION ── */}
      <AnimatePresence>
        {showLogout && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
                <LogOut size={26} className="text-red-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#2D1B08] mb-3 sm:mb-4 italic">Quitter ?</h3>
              <p className="text-gray-400 text-sm mb-7 sm:mb-8 font-medium italic">
                Voulez-vous vraiment fermer la session de Emmaashop ?
              </p>

              <div className="flex gap-3 sm:gap-4">
                <button
                  disabled={logoutLoading}
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  disabled={logoutLoading}
                  onClick={handleFinalLogout}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {logoutLoading ? <Loader2 size={14} className="animate-spin" /> : "Déconnexion"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="max-w-7xl mx-auto mb-10 sm:mb-14 lg:mb-16">
        {/* Ligne titre */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-[#2D1B08] leading-tight">
            Console Boutique<span className="text-[#B48446]">.</span>
          </h1>
          <p className="text-[#8B5E34] font-bold text-[10px] uppercase tracking-[0.3em] mt-1.5 italic opacity-60">
            Gestion Emmaashop
          </p>
        </div>

        {/* Ligne actions */}
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            href="/"
            className="px-5 py-3 bg-white border border-[#F5E6D3] rounded-xl text-[#8B5E34] font-black text-[10px] uppercase tracking-widest hover:bg-[#FDF8F2] transition-all"
          >
            Site public
          </Link>

          {/* Email — masqué sur très petit écran */}
          {userEmail && (
            <div className="hidden sm:flex px-4 py-2.5 rounded-xl border border-[#F5E6D3] bg-white text-[11px] font-bold text-[#8B5E34] items-center gap-2 max-w-[200px] truncate">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}

          {/* Bouton déconnexion */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowLogout(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[#2D1B08] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all cursor-pointer"
          >
            <LogOut size={14} /> Quitter
          </button>
        </div>
      </header>

      {/* ── STATISTIQUES ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
        <StatCard title="Revenu Traité" value={revenue} icon={TrendingUp} color="bg-[#B48446]" loading={loading} />
        <StatCard title="Commandes" value={orderCount} icon={ShoppingCart} color="bg-[#2D1B08]" loading={loading} />
        <StatCard title="Catalogue" value={productCount} icon={Package} color="bg-[#8B5E34]" loading={loading} />
        <StatCard title="En attente" value={String(newOrders.length)} icon={AlertTriangle} color="bg-amber-500" loading={loading} highlight={newOrders.length > 0} />
      </div>

      {/* ── ACTIONS ── */}
      <div className="max-w-7xl mx-auto mt-6 sm:mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-left">

        {/* Carte Inventaire — pleine largeur sur mobile, 2/3 sur desktop */}
        <Link
          href="/admin/products"
          className="lg:col-span-2 group bg-[#2D1B08] rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 lg:p-12 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-2xl"
        >
          <div className="z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
              INVENTAIRE<span className="text-[#B48446]">.</span>
            </h2>
            <p className="text-white/40 mt-3 sm:mt-5 max-w-xs text-sm font-medium italic">
              Gérez vos boubous et accessoires en temps réel.
            </p>
          </div>
          <div className="z-10 flex items-center gap-2 text-[#B48446] font-black uppercase text-[10px] tracking-widest group-hover:translate-x-3 transition-transform mt-6 sm:mt-0">
            Modifier le catalogue <ArrowRight size={16} />
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#B48446] rounded-full blur-[120px] opacity-10" />
        </Link>

        {/* Carte Commandes */}
        <Link
          href="/admin/orders"
          className="bg-white border border-[#F5E6D3] rounded-[2.5rem] sm:rounded-[3.5rem] p-7 sm:p-10 flex flex-col justify-between hover:shadow-xl transition-all min-h-[220px] sm:min-h-[260px]"
        >
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#2D1B08] italic">COMMANDES.</h2>
            <div className="mt-5 sm:mt-8 space-y-2 sm:space-y-3">
              {newOrders.length > 0 ? newOrders.map((o) => (
                <div
                  key={o.id}
                  className="text-[10px] font-bold p-2.5 sm:p-3 bg-[#FDF8F2] rounded-xl flex justify-between items-center text-[#8B5E34] gap-2"
                >
                  <span className="truncate">{o.customer_name}</span>
                  <span className="font-black shrink-0">{o.total_price}€</span>
                </div>
              )) : (
                <p className="text-gray-300 text-xs italic">Aucune commande en attente</p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-end mt-6 sm:mt-10">
            <div className="text-[9px] font-black uppercase text-[#B48446] tracking-widest">Voir tout →</div>
            <Smartphone className="text-[#B48446]/20" size={28} />
          </div>
        </Link>

      </div>

      {/* Safe area bottom iOS */}
      <div className="h-6 sm:h-0" />
    </div>
  );
}