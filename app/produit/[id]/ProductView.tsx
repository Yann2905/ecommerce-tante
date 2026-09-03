'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart, type CartVariant } from '@/lib/store';
import { ShopFooter, ShopHeader, ProductCard } from '@/components/ShopChrome';
import { IMAGE_WIDTHS, productImageSrcSet, productImageUrl } from '@/lib/images';

type Variant = { id: string; label: string; size?: string | null; color?: string | null; stock: number; is_active: boolean };

export default function ProductView({ id }: { id?: string }) {
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [added, setAdded] = useState(false);
  const [variantError, setVariantError] = useState('');
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const productId = id || window.location.pathname.split('/').pop();
    if (!productId) return;
    void (async () => {
      const [productResponse, variantsResponse, productsResponse] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch(`/api/products/${productId}/variants`).catch(() => null),
        fetch('/api/products').catch(() => null),
      ]);
      const data = productResponse.ok ? await productResponse.json() : null;
      setProduct(data);
      setActiveIndex(0);
      if (variantsResponse?.ok) setVariants(await variantsResponse.json());
      if (productsResponse?.ok && data?.category_id) {
        const allProducts = await productsResponse.json();
        setSimilar((allProducts || []).filter((item: any) => item.category_id === data.category_id && item.id !== productId).slice(0, 4));
      }
    })();
  }, [id]);

  const activeVariant = useMemo(() => variants.find((variant) => variant.id === selectedVariantId) ?? null, [variants, selectedVariantId]);
  const availableStock = activeVariant ? Number(activeVariant.stock) : Number(product?.stock ?? 0);

  if (!product) return <><ShopHeader/><div className="container-shop min-h-[60vh] grid place-items-center text-sm text-[var(--muted)]">Chargement de la pièce…</div><ShopFooter/></>;

  const gallery = [product.image_url, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter(Boolean) as string[];
  const activeImage = gallery[activeIndex] || gallery[0];
  const price = product.discount_price || product.price;
  const changeImage = (direction: number) => setActiveIndex((current) => gallery.length ? (current + direction + gallery.length) % gallery.length : 0);
  const add = () => {
    if (variants.length > 0 && !activeVariant) {
      setVariantError('Choisissez une taille ou une couleur avant d’ajouter la pièce.');
      return;
    }
    if (availableStock < 1) return;
    const variant: CartVariant | undefined = activeVariant ? { id: activeVariant.id, label: activeVariant.label, size: activeVariant.size ?? undefined, color: activeVariant.color ?? undefined } : undefined;
    for (let index = 0; index < qty; index += 1) addItem(product, variant);
    setVariantError('');
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return <div><ShopHeader/><main className="container-shop py-8 md:py-12"><Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={14}/> Retour à la boutique</Link><div className="mt-8 grid gap-10 md:grid-cols-[1.05fr_.95fr] md:gap-16"><div className="min-w-0"><div className="flex gap-3 md:gap-4"><div className="order-2 flex min-w-0 flex-1 flex-col"><div className="product-image relative aspect-[1/1.08] overflow-hidden bg-[#eeece5]">{activeImage ? <img src={productImageUrl(activeImage, 960)} srcSet={productImageSrcSet(activeImage, [...IMAGE_WIDTHS.detail])} sizes="(min-width:768px) 55vw, 100vw" alt={`${product.name} — vue ${activeIndex + 1}`} width={960} height={1037} fetchPriority="high" decoding="async" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-sm text-[var(--muted)]">Emmaashop</div>}{gallery.length > 1 && <><button type="button" onClick={() => changeImage(-1)} aria-label="Image précédente" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-sm transition hover:bg-white"><ChevronLeft size={19}/></button><button type="button" onClick={() => changeImage(1)} aria-label="Image suivante" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-sm transition hover:bg-white"><ChevronRight size={19}/></button><span className="absolute bottom-3 right-3 bg-[var(--ink)]/80 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white">{activeIndex + 1} / {gallery.length}</span></>}</div></div><div className="order-1 flex w-[72px] shrink-0 flex-col gap-3 overflow-y-auto md:w-[88px]">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`Afficher l'image ${index + 1}`} className={`product-image aspect-square w-full overflow-hidden border-2 bg-[#eeece5] transition ${activeIndex === index ? 'border-[var(--ink)]' : 'border-transparent opacity-65 hover:opacity-100'}`}><img src={productImageUrl(image, 96)} srcSet={productImageSrcSet(image, [...IMAGE_WIDTHS.thumb])} sizes="88px" alt="" width={88} height={88} loading="lazy" decoding="async" className="h-full w-full object-cover"/></button>)}</div></div><div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)] md:hidden"><span>Faites défiler les vues</span><span>{gallery.length} photo{gallery.length > 1 ? 's' : ''}</span></div></div><div className="md:pt-8"><p className="eyebrow">{product.categories?.name || product.category || 'Collection Emmaashop'}</p><h1 className="display mt-4 text-5xl leading-none md:text-6xl">{product.name}</h1><div className="mt-6 flex items-center gap-3 text-xl"><strong>{price} €</strong>{product.discount_price && <span className="text-sm text-[var(--muted)] line-through">{product.price} €</span>}</div><p className="mt-8 border-y border-[var(--line)] py-7 text-sm leading-7 text-[var(--muted)]">{product.description || 'Une pièce choisie pour son caractère, sa coupe et la sensation qu’elle laisse.'}</p>{variants.length > 0 && <div className="mt-7"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-widest">Choisir une variante</span><Link href="/guide-des-tailles" className="text-[11px] font-bold underline">Guide des tailles</Link></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{variants.map((variant) => <button key={variant.id} type="button" disabled={variant.stock < 1} onClick={() => { setSelectedVariantId(variant.id); setQty(1); setVariantError(''); }} className={`border px-3 py-3 text-left text-xs transition ${selectedVariantId === variant.id ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--line)] bg-white'} disabled:cursor-not-allowed disabled:opacity-40`}><span className="font-bold">{variant.label}</span><span className="mt-1 block text-[10px] opacity-70">{variant.stock > 0 ? `${variant.stock} disponible${variant.stock > 1 ? 's' : ''}` : 'Épuisée'}</span></button>)}</div></div>}<div className="mt-7 flex items-center justify-between text-sm"><span className="font-bold">{availableStock > 0 ? `${availableStock} pièce${availableStock > 1 ? 's' : ''} disponible${availableStock > 1 ? 's' : ''}` : 'Rupture de stock'}</span><Heart size={20} className="text-[var(--muted)]"/></div>{availableStock > 0 && <><div className="mt-7 flex items-center justify-between border border-[var(--line)] p-2"><span className="px-3 text-[11px] font-bold uppercase tracking-widest">Quantité</span><div className="flex items-center gap-5"><button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer"><Minus size={16}/></button><span className="w-4 text-center font-bold">{qty}</span><button type="button" onClick={() => setQty(Math.min(availableStock, qty + 1))} disabled={qty >= availableStock} aria-label="Augmenter"><Plus size={16}/></button></div></div><button type="button" onClick={add} className="btn-primary mt-4 w-full">{added ? 'Ajouté au panier' : 'Ajouter au panier'} <ShoppingBag size={17}/></button></>}{variantError && <p role="alert" className="mt-3 text-xs text-[var(--coral)]">{variantError}</p>}<div className="mt-8 grid gap-3 text-xs text-[var(--muted)]"><p><strong className="text-[var(--ink)]">Livraison.</strong> Expédition soignée dans toute la Côte d’Ivoire.</p><p><strong className="text-[var(--ink)]">Paiement.</strong> À la livraison, en toute simplicité.</p></div></div></div>{similar.length > 0 && <section className="mt-24 border-t border-[var(--line)] pt-14"><div className="flex items-end justify-between"><div><p className="eyebrow">Vous aimerez aussi</p><h2 className="display mt-3 text-4xl">Dans la même histoire</h2></div><Link href="/#nouveautes" className="hidden text-xs font-bold uppercase tracking-widest sm:block">Tout voir <ArrowRight size={14} className="ml-1 inline"/></Link></div><div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{similar.map((similarProduct) => <ProductCard key={similarProduct.id} product={similarProduct}/>)}</div></section>}</main><ShopFooter/></div>;
}
