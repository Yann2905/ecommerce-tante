'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingCart, Search, X, Trash2, ArrowRight,
  CheckCircle2, Loader2, ChevronRight, Sparkles, Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';
import Link from 'next/link';

const COUNTRY_CODES = [
  { code: '225', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { code: '33', flag: '🇫🇷', label: 'France' },
  { code: '221', flag: '🇸🇳', label: 'Sénégal' },
  { code: '377', flag: '🇲🇨', label: 'Monaco' },
  { code: '352', flag: '🇱🇺', label: 'Luxembourg' },
  { code: '223', flag: '🇲🇱', label: 'Mali' },
  { code: '226', flag: '🇧🇫', label: 'Burkina Faso' },
  { code: '32', flag: '🇧🇪', label: 'Belgique' },
  { code: '41', flag: '🇨🇭', label: 'Suisse' },
  { code: '229', flag: '🇧🇯', label: 'Bénin' },
  { code: '228', flag: '🇹🇬', label: 'Togo' },
  { code: '237', flag: '🇨🇲', label: 'Cameroun' },
  { code: '212', flag: '🇲🇦', label: 'Maroc' },
  { code: '49', flag: '🇩🇪', label: 'Allemagne' },
  { code: '34', flag: '🇪🇸', label: 'Espagne' },
  { code: '44', flag: '🇬🇧', label: 'Royaume-Uni' },
  { code: '1', flag: '🇺🇸', label: 'États-Unis' },
];

const EURO_PREFIXES = ['33', '377', '352', '32', '41', '49', '34', '44'];

const formatToE164 = (dialCode: string, localNumber: string): string => {
  const digits = localNumber.replace(/\D/g, '');
  const stripped = (EURO_PREFIXES.includes(dialCode) && digits.startsWith('0'))
    ? digits.slice(1)
    : digits;
  return `${dialCode}${stripped}`;
};

// ─── PARTICLES ───────────────────────────────────────────────────────────────
const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#8B5E34' : '#FFFDFB',
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{ y: [0, -30, 0], x: [0, Math.random() * 20 - 10, 0], opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: Math.random() * 4 + 3, repeat: Infinity, delay: Math.random() * 3, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <motion.div
    initial={{ y: 80, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: 80, opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 20 }}
    className="fixed bottom-24 sm:bottom-8 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[999] flex items-center gap-3 px-5 sm:px-6 py-4 rounded-2xl shadow-2xl border"
    style={{ background: '#1A0800', borderColor: '#C9A84C33' }}
  >
    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5 }}>
      <CheckCircle2 size={18} className="text-[#C9A84C]" />
    </motion.div>
    <span className="text-[#FFFDFB] text-sm font-bold flex-1">{message}</span>
    <button onClick={onClose} className="text-[#8B5E34] hover:text-[#C9A84C] transition-colors ml-2">
      <X size={14} />
    </button>
  </motion.div>
);

// ─── PRODUCT DETAILS MODAL ────────────────────────────────────────────────────
const ProductDetails = ({ product, isOpen, onClose, addItem }: any) => {
  const [activeImg, setActiveImg] = useState(product?.image_url);
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (product) setActiveImg(product.image_url); }, [product]);
  if (!product) return null;

  const handleAdd = async () => {
    setAdding(true);
    await new Promise(r => setTimeout(r, 500));
    addItem(product);
    setAdding(false);
    onClose();
  };

  const gallery = [product.image_url, ...(product.gallery || [])].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 backdrop-blur-xl"
            style={{ background: 'rgba(10,4,0,0.85)' }} />

          {/* Drag indicator on mobile */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28 }}
            className="relative w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col sm:grid sm:grid-cols-2"
            style={{ background: '#FFFDFB' }}
          >
            {/* Barre drag mobile */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[#EAD8C0]" />
            </div>

            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-[#F5E6D3]">
              <X size={18} className="text-[#5C3D2E]" />
            </motion.button>

            {/* Images */}
            <div className="p-4 sm:p-8 space-y-4" style={{ background: 'linear-gradient(135deg, #FDF8F2, #FAF0E6)' }}>
              <motion.div key={activeImg} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
                className="aspect-[4/3] sm:aspect-[4/5] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                <img src={activeImg} className="w-full h-full object-cover" alt={product.name} />
              </motion.div>
              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {gallery.map((img: string, i: number) => (
                    <motion.button key={i} whileHover={{ scale: 1.08 }} onClick={() => setActiveImg(img)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImg === img ? 'border-[#C9A84C] shadow-lg' : 'border-transparent opacity-50 hover:opacity-90'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 sm:p-10 flex flex-col justify-center bg-white">
              <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-[#C9A84C] font-black uppercase tracking-[0.35em] text-[10px] mb-4 flex items-center gap-2">
                <Sparkles size={10} /> Collection Privée Emma-Shop
              </motion.span>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-2xl sm:text-4xl font-serif font-black text-[#1A0800] mb-3 leading-tight">{product.name}</motion.h2>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl sm:text-4xl font-black text-[#C9A84C]">{product.price} €</span>
                {product.discount_price && <span className="text-lg sm:text-xl text-[#B48446]/40 line-through">{product.discount_price} €</span>}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
                className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-400' : product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="text-xs font-bold text-[#8B5E34]">
                  {product.stock > 5 ? 'En stock' : product.stock > 0 ? `Plus que ${product.stock} disponibles` : 'Épuisé'}
                </span>
              </motion.div>
              {product.description && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="text-[#5C3D2E] leading-relaxed italic text-sm sm:text-base opacity-80 mb-6 sm:mb-8 border-t border-[#F5E6D3] pt-4 sm:pt-6">
                  {product.description}
                </motion.p>
              )}
              <motion.button whileHover={{ scale: 1.02, backgroundColor: '#8B5E34' }} whileTap={{ scale: 0.97 }}
                onClick={handleAdd} disabled={adding || product.stock === 0}
                className="w-full text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
                style={{ background: '#2D1B08' }}>
                {adding
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={20} /></motion.div>
                  : <><ShoppingCart size={20} /><span>{product.stock === 0 ? 'Épuisé' : 'Ajouter au panier'}</span></>
                }
              </motion.button>

              {/* Safe area bottom on mobile */}
              <div className="h-4 sm:h-0" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── CART DRAWER ──────────────────────────────────────────────────────────────
const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { items, totalPrice, removeItem, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dialCode, setDialCode] = useState('225');
  const [customer, setCustomer] = useState({ name: '', localPhone: '', address: '' });

  const handleOrder = async () => {
    if (!customer.name.trim() || !customer.localPhone.trim()) {
      return alert('Veuillez remplir votre nom et téléphone');
    }
    setLoading(true);
    try {
      const e164Phone = formatToE164(dialCode, customer.localPhone);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: customer.name.trim(),
          customer_phone: e164Phone,
          delivery_address: customer.address.trim(),
          total_price: totalPrice(),
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items.map(i => ({
          order_id: order.id,
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
        })));

      if (itemsError) throw itemsError;

      for (const item of items) {
        await supabase.rpc('decrement_stock', {
          product_id: item.id,
          qty: item.quantity,
        });
      }

      setStep(3);
      setTimeout(() => clearCart(), 800);
    } catch (err: any) {
      console.error('Erreur commande:', err);
      alert(err.message || 'Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full p-4 rounded-2xl border font-medium text-sm outline-none transition-all focus:border-[#C9A84C] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.12)]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(10,4,0,0.65)', backdropFilter: 'blur(8px)' }} />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-full sm:max-w-md z-[101] flex flex-col text-[#2D1B08] shadow-2xl"
            style={{ background: '#FFFDFB' }}>

            {/* Header */}
            <div className="p-5 sm:p-6 flex justify-between items-center border-b border-[#EAD8C0]"
              style={{ background: 'linear-gradient(135deg, #2D1B08, #4A2810)' }}>
              <div>
                <h2 className="text-xl font-serif font-black text-[#FFFDFB] italic">Mon Panier</h2>
                <p className="text-[10px] text-[#C9A84C] font-black uppercase tracking-widest mt-0.5">
                  {items.length} article{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
                </p>
              </div>
              <motion.button whileHover={{ rotate: 90, scale: 1.1 }} onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} className="text-[#FFFDFB]" />
              </motion.button>
            </div>

            {/* Steps */}
            <div className="flex border-b border-[#EAD8C0]">
              {['Panier', 'Livraison', 'Confirmé'].map((s, i) => (
                <div key={i} className={`flex-1 py-2.5 text-center text-[9px] font-black uppercase tracking-widest transition-all ${step === i + 1 ? 'text-[#C9A84C] border-b-2 border-[#C9A84C]' : step > i + 1 ? 'text-[#8B5E34]' : 'text-[#C9A84C]/30'}`}>{s}</div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
              <AnimatePresence mode="wait">

                {/* ÉTAPE 1 — Panier */}
                {step === 1 && (
                  <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3 sm:space-y-4">
                    {items.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-4">🛍️</motion.div>
                        <p className="text-[#8B5E34] italic font-medium opacity-60">Votre chariot est vide...</p>
                        <p className="text-[10px] text-[#C9A84C] mt-2 uppercase tracking-widest">Explorez la collection</p>
                      </motion.div>
                    ) : items.map((item, idx) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }} transition={{ delay: idx * 0.05 }}
                        className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-[#F5E6D3] bg-white group hover:border-[#C9A84C]/40 transition-all hover:shadow-md">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-[#F5E6D3]">
                          <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-xs uppercase truncate text-[#2D1B08]">{item.name}</h4>
                          <p className="text-[#C9A84C] font-black mt-1">{item.price} €</p>
                          <span className="text-[10px] bg-[#FDF8F2] px-2 py-0.5 rounded-full font-bold text-[#8B5E34] inline-block mt-1.5">Qté: {item.quantity}</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)}
                          className="text-red-200 hover:text-red-500 transition-colors p-2 self-start">
                          <Trash2 size={16} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* ÉTAPE 2 — Livraison */}
                {step === 2 && (
                  <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <h3 className="font-black text-lg text-[#2D1B08] mb-4 font-serif italic">Détails de livraison</h3>

                    {/* Nom */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E34] mb-2 block pl-1">Nom complet *</label>
                      <input type="text" placeholder="Ex : Aya Koné"
                        className={inputCls} style={{ background: '#FDF8F2', borderColor: '#EAD8C0' }}
                        onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                    </div>

                    {/* WhatsApp — indicatif + numéro local */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E34] mb-2 block pl-1">WhatsApp *</label>
                      <div className="flex gap-2 items-stretch">
                        {/* Select pays — largeur fixe pour ne pas déborder */}
                        <div className="relative shrink-0" style={{ width: 110 }}>
                          <select
                            value={dialCode}
                            onChange={e => setDialCode(e.target.value)}
                            className="w-full h-full appearance-none pl-2 pr-6 py-4 rounded-2xl border border-[#EAD8C0] bg-[#FDF8F2] font-bold text-sm outline-none focus:border-[#C9A84C] transition-colors cursor-pointer"
                          >
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#C9A84C] text-[10px]">▾</div>
                        </div>
                        {/* Numéro local — min-w-0 pour ne pas dépasser */}
                        <input
                          type="tel"
                          placeholder={dialCode === '33' ? '06 12 34 56 78' : '07 00 00 00 00'}
                          className={`${inputCls} flex-1 min-w-0`}
                          style={{ background: '#FDF8F2', borderColor: '#EAD8C0' }}
                          onChange={e => setCustomer({ ...customer, localPhone: e.target.value })}
                        />
                      </div>
                      <AnimatePresence>
                        {customer.localPhone.replace(/\D/g, '').length >= 6 && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="text-[10px] text-[#C9A84C] font-bold mt-2 pl-1 flex items-center gap-1"
                          >
                            <CheckCircle2 size={10} />
                            Sera enregistré : +{formatToE164(dialCode, customer.localPhone)}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Adresse */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E34] mb-2 block pl-1">Adresse de livraison</label>
                      <textarea
                        placeholder="Votre adresse complète..."
                        className={`${inputCls} h-24 resize-none`}
                        style={{ background: '#FDF8F2', borderColor: '#EAD8C0' }}
                        onChange={e => setCustomer({ ...customer, address: e.target.value })}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#FDF8F2' }}>
                      <Phone size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                      <p className="text-[11px] text-[#8B5E34] font-medium">
                        Emma-Shop vous contactera sur WhatsApp pour confirmer votre commande.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 3 — Confirmation */}
                {step === 3 && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 2, duration: 0.4 }}
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #C9A84C33, #C9A84C11)' }}>
                      <CheckCircle2 size={52} className="text-[#C9A84C]" />
                    </motion.div>
                    <div>
                      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black italic font-serif">Merci !</motion.h3>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-[#8B5E34] mt-2 text-sm font-medium">
                        Votre commande a été transmise avec succès.
                      </motion.p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="p-4 rounded-2xl border border-[#EAD8C0] w-full" style={{ background: '#FDF8F2' }}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] mb-1">Prochaine étape</p>
                      <p className="text-sm font-bold text-[#2D1B08]">📱 Emma-Shop vous contacte sur WhatsApp</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer panier */}
            {items.length > 0 && step < 3 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="p-4 sm:p-6 border-t border-[#EAD8C0] bg-white"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <div className="flex justify-between items-end mb-4 px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5E34]/60">Total</span>
                  <motion.span key={totalPrice()} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                    className="text-3xl font-black text-[#2D1B08]">{totalPrice()} €</motion.span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => step === 1 ? setStep(2) : handleOrder()}
                  disabled={loading}
                  className="w-full py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #8B5E34, #C9A84C)' }}>
                  <motion.div className="absolute inset-0 opacity-30"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                    animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
                  {loading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={18} /></motion.div>
                    : <><span className="relative">{step === 1 ? 'Suivant' : 'Confirmer la commande'}</span><ArrowRight size={16} className="relative" /></>
                  }
                </motion.button>
                {step === 2 && (
                  <button onClick={() => setStep(1)}
                    className="w-full mt-3 text-[10px] font-bold uppercase tracking-widest text-[#8B5E34]/60 hover:text-[#8B5E34] transition-colors py-2">
                    ← Retour au panier
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['Tous']);
  const { items, addItem } = useCart();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const cartCount = items.reduce((t, i) => t + i.quantity, 0);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data } = await supabase
          .from('products').select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (data) {
          setProducts(data);
          const cats = ['Tous', ...new Set(data.map((p: any) => p.category).filter(Boolean))];
          setCategories(cats as string[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (product: any) => {
    addItem(product);
    showToast(`${product.name} ajouté au panier ✨`);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Tous' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen text-[#2D1B08]" style={{ background: '#FFFDFB' }}>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProductDetails product={selectedProduct} isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)} addItem={handleAddToCart} />
      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* ── NAVBAR ── */}
      <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20 }}
        className="fixed top-0 left-0 w-full z-[90] border-b px-4 sm:px-6"
        style={{ background: 'rgba(255,253,251,0.92)', backdropFilter: 'blur(20px)', borderColor: '#F5E6D3', boxShadow: '0 4px 30px rgba(45,27,8,0.06)' }}>
        <div className="max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.03 }}>
            <div className="text-lg sm:text-xl font-black tracking-tighter text-[#8B5E34] font-serif italic">Emma-Shop</div>
            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C9A84C] -mt-0.5">Boutique Exclusive</div>
          </motion.div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 rounded-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2D1B08, #4A2810)' }}>
            <ShoppingCart size={20} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white text-white"
                  style={{ background: '#C9A84C' }}>{cartCount}</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1A0800 0%, #2D1B08 50%, #3D2010 100%)' }} />
        <FloatingParticles />
        <div className="absolute right-0 top-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] opacity-10">
          {[...Array(4)].map((_, i) => (
            <motion.div key={i} className="absolute inset-0 rounded-full border border-[#C9A84C]"
              style={{ scale: 0.6 + i * 0.15 }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 xl:gap-24 items-center relative z-10 w-full">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }} className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A84C]/30 mb-4 sm:mb-6"
                style={{ background: 'rgba(201,168,76,0.08)' }}>
                <Sparkles size={10} className="text-[#C9A84C]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A84C]">Collection Exclusive</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="font-serif font-black tracking-tighter text-[#FFFDFB] leading-none"
                style={{ fontSize: 'clamp(36px, 7vw, 88px)' }}>
                BIEN<span className="text-[#C9A84C] italic">VENUE</span><span className="text-[#C9A84C]">.</span>
              </motion.h1>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="p-5 sm:p-8 rounded-[2rem] border-l-8 border-[#C9A84C]"
              style={{ background: 'rgba(255,253,251,0.06)', backdropFilter: 'blur(10px)' }}>
              <p className="text-base sm:text-lg font-serif italic text-[#FFFDFB]/85 leading-relaxed">
                "Je suis <strong className="text-[#C9A84C]">Sonya Carlach Épouse Kané</strong>, votre référence en mode et élégance africaine."
              </p>
            </motion.div>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-3 px-7 sm:px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-[#1A0800] shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C56A)' }}>
              Voir la collection <ChevronRight size={16} />
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{ y: heroY }} className="flex justify-center lg:justify-end">
            <div className="relative">
              <motion.div animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="aspect-[3/4] w-full max-w-[260px] sm:max-w-sm bg-white p-2 sm:p-3 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 border-[#C9A84C]/30">
                <img src="/tante-avec-fond.jpg" alt="Emma-Shop" className="w-full h-full object-cover rounded-[1.5rem] sm:rounded-[2.5rem]" />
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}
                className="absolute -bottom-4 -left-4 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-[#C9A84C]/30 shadow-xl"
                style={{ background: 'rgba(45,27,8,0.95)', backdropFilter: 'blur(10px)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]">Collection</p>
                <p className="text-white font-black text-sm">{products.length} Pièces</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ opacity: heroOpacity }}
          className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A84C]/60">Défiler</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}
            className="w-0.5 h-8 rounded-full bg-gradient-to-b from-[#C9A84C] to-transparent" />
        </motion.div>
      </section>

      {/* ── RECHERCHE + FILTRES ── */}
      <motion.section id="collection"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-4 sm:pb-6">
        <div className="flex items-baseline gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-[#2D1B08]">
            La Collection<span className="text-[#C9A84C]">.</span>
          </h2>
          <span className="text-sm font-bold text-[#8B5E34]/50">{filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
        </div>

        <div className="relative mb-5 sm:mb-6">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#C9A84C]" size={18} />
          <motion.input whileFocus={{ boxShadow: '0 0 0 3px rgba(201,168,76,0.2)' }}
            type="text" placeholder="Rechercher une pièce, un style..."
            className="w-full pl-12 sm:pl-14 pr-6 py-4 rounded-2xl border-2 text-sm font-medium outline-none transition-all"
            style={{ background: '#FDF8F2', borderColor: '#EAD8C0' }}
            value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[#8B5E34] hover:text-[#C9A84C] transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
          {categories.map((cat, i) => (
            <motion.button key={cat}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden shrink-0 whitespace-nowrap ${activeCategory === cat ? 'text-white shadow-lg' : 'text-[#8B5E34] border border-[#F5E6D3] bg-white hover:border-[#C9A84C]/40'}`}>
              {activeCategory === cat && (
                <motion.div layoutId="activePill" className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #8B5E34)' }} />
              )}
              <span className="relative z-10">{cat}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── GRILLE PRODUITS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-20">
        {loading ? (
          <div className="flex justify-center py-32">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={32} className="text-[#C9A84C]" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[#8B5E34] italic text-lg">Aucun article trouvé{search ? ` pour "${search}"` : ''}</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 text-[#C9A84C] font-bold text-sm underline">
                Effacer la recherche
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div layout key={p.id}
                  initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i * 0.06, 0.4), type: 'spring', damping: 20 }}
                  className="group cursor-pointer" onClick={() => setSelectedProduct(p)}>
                  <div className="relative aspect-[3/4] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border-2 sm:border-4 border-white shadow-lg group-hover:-translate-y-2 sm:group-hover:-translate-y-4 group-hover:shadow-2xl transition-all duration-500"
                    style={{ boxShadow: '0 8px 32px rgba(45,27,8,0.08)' }}>
                    <img src={p.image_url} className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(to top, rgba(45,27,8,0.9) 0%, transparent 60%)' }} />
                    {p.stock <= 3 && p.stock > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase text-white"
                        style={{ background: '#E07B39' }}>Plus que {p.stock} !</motion.div>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(45,27,8,0.65)' }}>
                        <span className="text-white font-black uppercase tracking-widest text-xs">Épuisé</span>
                      </div>
                    )}
                    {/* Actions : toujours visible sur mobile, hover sur desktop */}
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 sm:translate-y-12 sm:group-hover:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-400">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={e => { e.stopPropagation(); if (p.stock > 0) handleAddToCart(p); }}
                        disabled={p.stock === 0}
                        className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #8B5E34)' }}>
                        <ShoppingCart size={13} /> Ajouter
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }}
                        onClick={e => { e.stopPropagation(); setSelectedProduct(p); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,253,251,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <ChevronRight size={14} className="text-white" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-5 px-1 sm:px-2">
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A84C]/70 mb-0.5 sm:mb-1">{p.category}</p>
                    <h3 className="font-black text-[#2D1B08] text-xs sm:text-sm uppercase tracking-tight truncate group-hover:text-[#8B5E34] transition-colors">{p.name}</h3>
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                      <p className="text-xl sm:text-2xl font-black text-[#C9A84C]">{p.price} €</p>
                      {p.discount_price && <span className="text-xs sm:text-sm text-[#8B5E34]/40 line-through">{p.discount_price} €</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="rounded-t-[3rem] sm:rounded-t-[4rem] mt-8 sm:mt-12 px-4 sm:px-6 py-14 sm:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A0800, #2D1B08)' }}>
        <FloatingParticles />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-10 relative z-10">
          <div className="text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-serif font-black italic text-[#FFFDFB]">
              Emma-Shop
              <Link href="/login">
                <span className="text-[#C9A84C] cursor-default hover:opacity-80 transition-opacity" title="">.</span>
              </Link>
            </div>
            <p className="text-[#8B5E34] text-xs mt-1">Mode & Élégance Africaine</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-4 text-[#FFFDFB]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)' }}>
              <Phone size={20} className="text-[#C9A84C]" />
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}