'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Loader2, ChevronLeft, ChevronRight,
  Sparkles, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store';

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: prod } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (!prod || prod.is_active === false) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setProduct(prod);
      setActiveImg(prod.image_url);

      // Produits similaires : même catégorie, actifs, hors produit courant.
      const { data: sim } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', prod.category_id)
        .neq('id', prod.id)
        .limit(12);

      if (!cancelled) {
        setSimilar(sim || []);
        setLoading(false);
        window.scrollTo({ top: 0 });
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  const handleAdd = () => {
    if (!product || product.stock === 0) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFDFB' }}>
        <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6" style={{ background: '#FFFDFB' }}>
        <p className="text-5xl">🧐</p>
        <p className="font-serif italic text-xl text-[#8B5E34]">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link href="/" className="mt-2 px-6 py-3 rounded-2xl bg-[#2D1B08] text-white font-black uppercase text-xs tracking-widest">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const gallery = [product.image_url, ...(product.gallery || [])].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: '#FFFDFB' }}>

      {/* HEADER */}
      <div className="border-b sticky top-0 z-50 bg-white/85 backdrop-blur-md" style={{ borderColor: '#F5E6D3' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between py-4">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#8B5E34] font-black text-xs uppercase tracking-widest">
            <ArrowLeft size={16} /> Boutique
          </button>
          <Link href="/cart" className="p-2.5 rounded-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2D1B08, #4A2810)' }}>
            <ShoppingCart size={18} />
          </Link>
        </div>
      </div>

      {/* DÉTAIL PRODUIT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">

        {/* Galerie */}
        <div className="space-y-4">
          <motion.div key={activeImg} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
            className="aspect-[4/5] rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-[#FDF8F2]">
            <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {gallery.map((img: string, i: number) => (
                <motion.button key={i} whileHover={{ scale: 1.06 }} onClick={() => setActiveImg(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${activeImg === img ? 'border-[#C9A84C] shadow-lg' : 'border-transparent opacity-50 hover:opacity-90'}`}>
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col justify-center">
          <span className="text-[#C9A84C] font-black uppercase tracking-[0.3em] text-[10px] mb-4 flex items-center gap-2">
            <Sparkles size={10} /> {product.categories?.name || 'Collection Emmaashop'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#1A0800] mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl sm:text-4xl font-black text-[#C9A84C]">{product.price} €</span>
            {product.discount_price && <span className="text-lg text-[#B48446]/40 line-through">{product.discount_price} €</span>}
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-400' : product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'}`} />
            <span className="text-xs font-bold text-[#8B5E34]">
              {product.stock > 5 ? 'En stock' : product.stock > 0 ? `Plus que ${product.stock} disponibles` : 'Épuisé'}
            </span>
          </div>
          {product.description && (
            <p className="text-[#5C3D2E] leading-relaxed italic text-sm sm:text-base opacity-80 mb-8 border-t border-[#F5E6D3] pt-6">
              {product.description}
            </p>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleAdd} disabled={product.stock === 0}
            className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
            style={{ background: added ? '#065F46' : '#2D1B08' }}>
            {added
              ? <><Check size={20} /> Ajouté au panier</>
              : <><ShoppingCart size={20} /> {product.stock === 0 ? 'Épuisé' : 'Ajouter au panier'}</>
            }
          </motion.button>
        </div>
      </div>

      {/* PRODUITS SIMILAIRES */}
      {similar.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A84C]">Vous aimerez aussi</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-[#2D1B08]">Produits similaires.</h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scrollRail(-1)}
                className="w-10 h-10 rounded-full border border-[#EAD8C0] flex items-center justify-center text-[#8B5E34] hover:bg-[#FDF8F2] transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scrollRail(1)}
                className="w-10 h-10 rounded-full border border-[#EAD8C0] flex items-center justify-center text-[#8B5E34] hover:bg-[#FDF8F2] transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div ref={railRef} className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-2 snap-x">
            {similar.map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`}
                className="group shrink-0 w-40 sm:w-56 snap-start">
                <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border-2 border-white shadow-lg">
                  <img src={p.image_url} alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(45,27,8,0.6)' }}>
                      <span className="text-white font-black uppercase tracking-widest text-[10px]">Épuisé</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 px-1">
                  <h3 className="font-black text-[#2D1B08] text-xs sm:text-sm uppercase truncate group-hover:text-[#8B5E34] transition-colors">{p.name}</h3>
                  <p className="text-lg sm:text-xl font-black text-[#C9A84C] mt-1">{p.price} €</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
