'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, ShoppingBag, Loader2, Phone, MapPin, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

// --- COMPOSANT PARTICULES (CORRIGÉ POUR L'HYDRATATION) ---
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null; // Ne rend rien côté serveur pour éviter Math.random() mismatch

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 5 + 2,
            height: Math.random() * 5 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: Math.random() > 0.5 ? '#C9A84C' : '#8B5E34',
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            y: [0, Math.random() * -100, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// --- PAGE PRINCIPALE DU PANIER ---
export default function CartPage() {
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Fix pour l'hydratation globale de la page
  useEffect(() => { setIsMounted(true); }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      // ✅ NETTOYAGE DE L'URL : On enlève un éventuel "/api" à la fin de la variable d'env
      const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
      const finalUrl = `${BASE_URL}/api/orders`;

      console.log("🚀 Tentative de commande vers :", finalUrl);

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    customer.name,
          customer_phone:   customer.phone,
          delivery_address: customer.address,
          total_price:      totalPrice(),
          items: items.map(i => ({
            product_id: i.id,
            quantity:   i.quantity,
            unit_price: i.price,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors de la commande');
      }

      // Succès
      clearCart();
      router.push('/order-success');
    } catch (err: any) {
      console.error("Erreur détectée :", err);
      alert(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  const fields = [
    { key: 'name',    label: 'Nom complet',          placeholder: 'Ex: Aya Koné',           icon: User,   type: 'text' },
    { key: 'phone',   label: 'WhatsApp',               placeholder: '07 00 00 00 00',         icon: Phone,  type: 'tel'  },
    { key: 'address', label: 'Adresse de livraison',  placeholder: 'Daloa, Quartier...',      icon: MapPin, type: 'text' },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: '#FFFDFB' }}>
      
      <FloatingParticles />

      {/* HEADER */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="border-b sticky top-0 z-50 bg-white/80 backdrop-blur-md"
        style={{ borderColor: '#F5E6D3' }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-5">
          <Link href="/">
            <div className="flex items-center gap-2 text-[#8B5E34] font-black text-xs uppercase tracking-widest">
              <ArrowLeft size={16} /> Retour Boutique
            </div>
          </Link>
          <div className="text-right">
            <h1 className="font-serif font-black italic text-[#2D1B08] text-xl">Mon Panier</h1>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto mb-4 text-[#C9A84C] opacity-30" />
            <p className="font-serif italic text-xl text-[#8B5E34]">Votre panier est vide...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
            
            {/* LISTE DES ARTICLES */}
            <div className="space-y-4">
              {items.map((item) => (
                <motion.div 
                  layout key={item.id}
                  className="flex gap-5 p-5 rounded-[2rem] bg-white border border-[#F5E6D3] shadow-sm items-center"
                >
                  <img src={item.image_url} className="w-20 h-20 rounded-2xl object-cover" alt={item.name} />
                  <div className="flex-1">
                    <h3 className="font-black text-[#2D1B08] text-sm uppercase">{item.name}</h3>
                    <p className="text-[#C9A84C] font-black">{item.price} € x {item.quantity}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-3 text-red-200 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* FORMULAIRE DE COMMANDE */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <form onSubmit={handleCheckout} className="p-8 rounded-[3rem] bg-white border border-[#EAD8C0] shadow-2xl sticky top-28">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-[#C9A84C]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A84C]">Validation</span>
                  </div>
                  <h3 className="text-2xl font-serif font-black italic text-[#2D1B08]">Commande.</h3>
                </div>

                <div className="space-y-5">
                  {fields.map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] font-black uppercase text-[#8B5E34] mb-2 block ml-1">{f.label}</label>
                      <input 
                        type={f.type} required placeholder={f.placeholder}
                        className="w-full p-4 bg-[#FDF8F2] rounded-2xl outline-none border border-transparent focus:border-[#C9A84C] font-bold text-sm"
                        onChange={e => setCustomer({...customer, [f.key]: e.target.value})}
                      />
                    </div>
                  ))}

                  <div className="pt-6 border-t border-[#F5E6D3] mt-6">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[10px] font-black uppercase text-[#8B5E34]/50">Total à payer</span>
                      <span className="text-4xl font-black text-[#2D1B08]">{totalPrice()} €</span>
                    </div>

                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full py-5 bg-[#2D1B08] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-50 flex justify-center items-center gap-3"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <><ShoppingBag size={18}/> Confirmer</>}
                    </button>
                    
                    <p className="mt-4 text-[10px] text-center text-[#8B5E34] italic">
                      Paiement en espèces à la livraison.
                    </p>
                  </div>
                </div>
              </form>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}