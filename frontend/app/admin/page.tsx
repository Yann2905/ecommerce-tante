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
  <div className="bg-white p-8 rounded-[2.5rem] border border-[#F5E6D3] flex flex-col justify-between relative overflow-hidden shadow-sm">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg relative z-10`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="relative z-10 text-left">
      <h3 className="text-[#8B5E34] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
      {loading ? (
        <Loader2 size={22} className="animate-spin text-[#C9A84C] mt-1" />
      ) : (
        <p className="text-4xl font-black tracking-tighter text-[#2D1B08]">{value}</p>
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
    // Récupération de l'utilisateur connecté
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || 'Admin');
    });

    async function loadStats() {
      try {
        // Chargement des commandes
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

        // Chargement du nombre de produits
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

  // --- FONCTION DE DÉCONNEXION (MÉTHODE RADICALE) ---
  const handleFinalLogout = async () => {
    setLogoutLoading(true);
    try {
      // 1. Déconnexion via Supabase (ceci met à jour les cookies avec createBrowserClient)
      await supabase.auth.signOut();
      
      // 2. Nettoyage manuel du stockage
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Redirection BRUTE vers le login
      // Cela force le Middleware à re-vérifier la session sans cookies
      window.location.href = '/login';
    } catch (err) {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] p-6 md:p-12 lg:p-16">

      {/* ── MODALE DE DÉCONNEXION (Priorité Maximale) ── */}
      <AnimatePresence>
        {showLogout && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={28} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-serif font-black text-[#2D1B08] mb-4 italic">Quitter ?</h3>
              <p className="text-gray-400 text-sm mb-8 font-medium italic">Voulez-vous vraiment fermer la session de Emma-Shop ?</p>
              
              <div className="flex gap-4">
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
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="text-left">
          <h1 className="text-5xl font-black tracking-tighter text-[#2D1B08]">Console Boutique<span className="text-[#B48446]">.</span></h1>
          <p className="text-[#8B5E34] font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic opacity-60">Gestion Emma-Shop</p>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/" className="px-6 py-3 bg-white border border-[#F5E6D3] rounded-xl text-[#8B5E34] font-black text-[10px] uppercase tracking-widest hover:bg-[#FDF8F2] transition-all">
            Site public
          </Link>
          
          <div className="hidden md:flex px-4 py-2.5 rounded-xl border border-[#F5E6D3] bg-white text-[11px] font-bold text-[#8B5E34] items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {userEmail}
          </div>

          {/* BOUTON DÉCONNEXION */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowLogout(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#2D1B08] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all cursor-pointer relative z-50"
          >
            <LogOut size={14} /> Quitter
          </button>
        </div>
      </header>

      {/* ── STATISTIQUES ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Revenu Traité" value={revenue} icon={TrendingUp} color="bg-[#B48446]" loading={loading} />
        <StatCard title="Commandes" value={orderCount} icon={ShoppingCart} color="bg-[#2D1B08]" loading={loading} />
        <StatCard title="Catalogue" value={productCount} icon={Package} color="bg-[#8B5E34]" loading={loading} />
        <StatCard title="En attente" value={String(newOrders.length)} icon={AlertTriangle} color="bg-amber-500" loading={loading} highlight={newOrders.length > 0} />
      </div>

      {/* ── ACTIONS ── */}
      <div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        <Link href="/admin/products" className="lg:col-span-2 group bg-[#2D1B08] rounded-[3.5rem] p-12 min-h-[320px] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-2xl">
          <div className="z-10">
            <h2 className="text-6xl font-black text-white tracking-tighter leading-none">INVENTAIRE<span className="text-[#B48446]">.</span></h2>
            <p className="text-white/40 mt-5 max-w-xs text-sm font-medium italic">Gérez vos boubous et accessoires en temps réel.</p>
          </div>
          <div className="z-10 flex items-center gap-2 text-[#B48446] font-black uppercase text-[10px] tracking-widest group-hover:translate-x-3 transition-transform">
            Modifier le catalogue <ArrowRight size={16} />
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#B48446] rounded-full blur-[120px] opacity-10" />
        </Link>

        <Link href="/admin/orders" className="bg-white border border-[#F5E6D3] rounded-[3.5rem] p-10 flex flex-col justify-between hover:shadow-xl transition-all">
          <div className="text-left">
            <h2 className="text-2xl font-black tracking-tighter text-[#2D1B08] italic">COMMANDES.</h2>
            <div className="mt-8 space-y-3">
              {newOrders.length > 0 ? newOrders.map((o) => (
                <div key={o.id} className="text-[10px] font-bold p-3 bg-[#FDF8F2] rounded-xl flex justify-between items-center text-[#8B5E34]">
                  <span className="truncate pr-2">{o.customer_name}</span>
                  <span className="font-black shrink-0">{o.total_price}€</span>
                </div>
              )) : (
                <p className="text-gray-300 text-xs italic">Aucune commande en attente</p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-end mt-10">
             <div className="text-[9px] font-black uppercase text-[#B48446] tracking-widest">Voir tout →</div>
             <Smartphone className="text-[#B48446]/20" size={32} />
          </div>
        </Link>

      </div>
    </div>
  );
}
