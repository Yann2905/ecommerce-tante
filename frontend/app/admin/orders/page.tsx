'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  ShoppingCart, User, MapPin, Phone, CheckCircle,
  XCircle, Clock, ExternalLink, ChevronRight, Loader2,
  TrendingUp, Package, Sparkles
} from 'lucide-react';

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_price: number;
  status: string;
  created_at: string;
  items: Array<{
    quantity: number;
    unit_price: number;
    product: { name: string };
  }>;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  en_attente: { label: 'En attente', color: '#92400E', bg: '#FEF3C7', icon: Clock },
  livré: { label: 'Livré', color: '#065F46', bg: '#D1FAE5', icon: CheckCircle },
  annulé: { label: 'Annulé', color: '#991B1B', bg: '#FEE2E2', icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'livré' | 'annulé'>('all');

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, items:order_items(quantity, unit_price, product:products(name))`)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchOrders();
    if (selectedOrder?.id === orderId)
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    setUpdatingId(null);
  };

  const contactWhatsApp = (phone: string, name: string) => {
    // 1. On ne garde que les chiffres (supprime +, espaces, points, etc.)
    const cleanPhone = phone.replace(/\D/g, '');

    // 2. On s'assure que le message est bien encodé
    const msg = encodeURIComponent(`Bonjour ${name} 👋, c'est Emma-Shop. Je vous contacte concernant votre commande. Merci de votre confiance ! 🌟`);

    // 3. On utilise wa.me avec le numéro propre
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // ✅ Prix en euros
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return {
      day: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);
  const stats = {
    total: orders.length,
    en_attente: orders.filter(o => o.status === 'en_attente').length,
    revenue: orders.filter(o => o.status === 'livré').reduce((s, o) => s + o.total_price, 0),
  };

  return (
    <div className="min-h-screen text-[#2D1B08]" style={{ background: '#FFFDFB' }}>

      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.03] rounded-full"
          style={{ background: 'radial-gradient(circle, #C9A84C, transparent)', transform: 'translate(20%, -20%)' }} />
      </div>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="border-b sticky top-0 z-50"
        style={{ background: 'rgba(255,253,251,0.95)', backdropFilter: 'blur(20px)', borderColor: '#F5E6D3' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-black italic text-[#2D1B08]">
              Commandes<span className="text-[#C9A84C]">.</span>
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8B5E34]/60 mt-0.5">Suivi en temps réel</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} onClick={fetchOrders}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#EAD8C0] text-[#8B5E34] hover:border-[#C9A84C]/40 transition-all"
          >
            ↻ Actualiser
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Package, label: 'Total commandes', value: stats.total, color: '#2D1B08' },
            { icon: Clock, label: 'En attente', value: stats.en_attente, color: '#C9A84C', highlight: stats.en_attente > 0 },
            { icon: TrendingUp, label: 'Chiffre livré', value: fmt(stats.revenue), color: '#065F46' },
          ].map(({ icon: Icon, label, value, color, highlight }: any, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-6 rounded-3xl border bg-white relative overflow-hidden"
              style={{ borderColor: highlight ? '#C9A84C40' : '#F5E6D3', boxShadow: highlight ? '0 0 0 2px #C9A84C20' : 'none' }}
            >
              {highlight && (
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: 'linear-gradient(135deg, #C9A84C08, transparent)' }}
                />
              )}
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} style={{ color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60">{label}</span>
              </div>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
            </motion.div>
          ))}
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'en_attente', 'livré', 'annulé'] as const).map(f => (
            <motion.button
              key={f} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${filter === f ? 'text-white shadow-lg' : 'border border-[#EAD8C0] text-[#8B5E34] bg-white'}`}
              style={filter === f ? { background: f === 'all' ? 'linear-gradient(135deg, #2D1B08, #4A2810)' : f === 'en_attente' ? '#C9A84C' : f === 'livré' ? '#065F46' : '#991B1B' } : {}}
            >
              {f === 'all' ? 'Toutes' : STATUS_CONFIG[f]?.label} {f !== 'all' && `(${orders.filter(o => o.status === f).length})`}
            </motion.button>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* Liste commandes */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-24">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={32} className="text-[#C9A84C]" />
                </motion.div>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-[#8B5E34] italic font-medium opacity-60">Aucune commande ici</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filtered.map((order, i) => {
                  const { label, color, bg, icon: StatusIcon } = STATUS_CONFIG[order.status] || STATUS_CONFIG.en_attente;
                  const { day, time } = fmtDate(order.created_at);
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <motion.div
                      key={order.id} layout
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                      className="relative rounded-3xl border p-5 cursor-pointer transition-all duration-300 group overflow-hidden"
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #2D1B08, #3D2010)' : 'white',
                        borderColor: isSelected ? 'transparent' : '#F5E6D3',
                        boxShadow: isSelected ? '0 20px 50px rgba(45,27,8,0.25)' : 'none',
                      }}
                    >
                      {!isSelected && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                          style={{ background: 'linear-gradient(135deg, #FDF8F2, transparent)' }} />
                      )}
                      <div className="relative flex items-center gap-5">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg"
                          style={{ background: isSelected ? 'rgba(201,168,76,0.2)' : '#FDF8F2', color: isSelected ? '#C9A84C' : '#8B5E34' }}
                        >
                          {order.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`font-black text-sm uppercase tracking-tight truncate ${isSelected ? 'text-[#FFFDFB]' : 'text-[#2D1B08]'}`}>
                              {order.customer_name}
                            </h3>
                            {/* ✅ Prix en euros */}
                            <span className="text-xl font-black shrink-0 text-[#C9A84C]">
                              {fmt(order.total_price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase"
                              style={{ background: isSelected ? 'rgba(255,255,255,0.1)' : bg, color: isSelected ? '#C9A84C' : color }}
                            >
                              <StatusIcon size={9} /> {label}
                            </span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-[#FFFDFB]/50' : 'text-[#8B5E34]/50'}`}>
                              {day} · {time}
                            </span>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isSelected ? 90 : 0 }} className={isSelected ? 'text-[#C9A84C]' : 'text-[#C9A84C]/30'}>
                          <ChevronRight size={20} />
                        </motion.div>
                      </div>

                      {/* Actions inline */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-5 pt-5 border-t border-white/10 flex gap-2 flex-wrap"
                        >
                          {order.status !== 'livré' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={e => { e.stopPropagation(); updateStatus(order.id, 'livré'); }}
                              disabled={updatingId === order.id}
                              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                              style={{ background: '#D1FAE5', color: '#065F46' }}
                            >
                              {updatingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              Marquer livré
                            </motion.button>
                          )}
                          {order.status !== 'annulé' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={e => { e.stopPropagation(); updateStatus(order.id, 'annulé'); }}
                              disabled={updatingId === order.id}
                              className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                              style={{ background: '#FEE2E2', color: '#991B1B' }}
                            >
                              <XCircle size={12} /> Annuler
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={e => { e.stopPropagation(); contactWhatsApp(order.customer_phone, order.customer_name); }}
                            className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-white"
                            style={{ background: '#25D366' }}
                          >
                            <ExternalLink size={12} /> WhatsApp
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* ── DETAIL PANEL ── */}
          <div className="lg:sticky lg:top-28 h-fit">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.97 }}
                  transition={{ type: 'spring', damping: 25 }}
                  className="rounded-[3rem] overflow-hidden border"
                  style={{ borderColor: '#F5E6D3', background: '#FFFDFB', boxShadow: '0 20px 60px rgba(45,27,8,0.08)' }}
                >
                  <div className="p-8 border-b border-[#EAD8C0]" style={{ background: 'linear-gradient(135deg, #FDF8F2, #FAF0E8)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-[#C9A84C]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A84C]">Détails commande</span>
                    </div>
                    <h2 className="text-2xl font-serif font-black italic text-[#2D1B08]">{selectedOrder.customer_name}</h2>
                    {/* ✅ Prix en euros */}
                    <span className="text-3xl font-black text-[#C9A84C] mt-2 block">{fmt(selectedOrder.total_price)}</span>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-3">
                      {[
                        { icon: Phone, label: selectedOrder.customer_phone },
                        { icon: MapPin, label: selectedOrder.delivery_address || 'Non renseignée' },
                      ].map(({ icon: Icon, label }, i) => (
                        <motion.div
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: '#FDF8F2' }}
                        >
                          <Icon size={16} className="text-[#C9A84C] mt-0.5 shrink-0" />
                          <span className="text-sm font-bold text-[#2D1B08]">{label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8B5E34]/50 mb-3">Articles commandés</h4>
                      <div className="space-y-2">
                        {selectedOrder.items?.map((item, i) => (
                          <motion.div
                            key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex justify-between items-center py-3 border-b border-[#F5E6D3] last:border-0"
                          >
                            <div>
                              <p className="font-black text-sm text-[#2D1B08]">{item.product?.name || 'Article'}</p>
                              <p className="text-[10px] text-[#8B5E34]/60 font-bold mt-0.5">Qté : {item.quantity}</p>
                            </div>
                            {/* ✅ Prix en euros */}
                            <span className="font-black text-[#C9A84C]">{fmt(item.unit_price * item.quantity)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      {selectedOrder.status !== 'livré' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => updateStatus(selectedOrder.id, 'livré')}
                          disabled={updatingId === selectedOrder.id}
                          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                          style={{ background: '#D1FAE5', color: '#065F46' }}
                        >
                          {updatingId === selectedOrder.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Marquer comme livré
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => contactWhatsApp(selectedOrder.customer_phone, selectedOrder.customer_name)}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white flex items-center justify-center gap-2 shadow-lg"
                        style={{ background: '#25D366' }}
                      >
                        <ExternalLink size={14} /> Contacter sur WhatsApp
                      </motion.button>
                      {selectedOrder.status !== 'annulé' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => updateStatus(selectedOrder.id, 'annulé')}
                          className="w-full py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                          style={{ background: '#FEE2E2', color: '#991B1B' }}
                        >
                          <XCircle size={12} /> Annuler la commande
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-[3rem] border-2 border-dashed border-[#EAD8C0] p-16 text-center"
                  style={{ background: '#FDF8F2' }}
                >
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="text-5xl mb-4">
                    📋
                  </motion.div>
                  <p className="text-[#8B5E34] italic font-medium opacity-60 text-sm">
                    Sélectionnez une commande pour voir les détails
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
