'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/lib/store';
import { useState } from 'react';

export function ShopHeader() {
  const count = useCart((state) => state.items.reduce((n, item) => n + item.quantity, 0));
  const [open, setOpen] = useState(false);
  return <>
    <div className="bg-[var(--ink)] text-white text-center py-2 text-[10px] uppercase tracking-[.18em] font-bold">Livraison offerte dès 75 € · Paiement à la livraison</div>
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
      <div className="container-shop h-[76px] flex items-center justify-between gap-6">
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={21}/> : <Menu size={21}/>}</button>
        <Link href="/" className="display text-[29px] font-semibold tracking-[-.07em]">Emmaashop<span className="text-[var(--olive)]">.</span></Link>
        <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[.12em]">
          <Link className="hover:text-[var(--olive)] transition-colors" href="/#nouveautes">Nouveautés</Link>
          <Link className="hover:text-[var(--olive)] transition-colors" href="/#collections">Collections</Link>
          <Link className="hover:text-[var(--olive)] transition-colors" href="/#maison">La maison</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="hidden sm:block hover:text-[var(--olive)]" aria-label="Rechercher"><Search size={19}/></button>
          <Link href="/cart" className="relative hover:text-[var(--olive)]" aria-label="Panier"><ShoppingBag size={20}/>{count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--coral)] px-1 text-[9px] text-white">{count}</span>}</Link>
        </div>
      </div>
      {open && <nav className="lg:hidden border-t border-[var(--line)] bg-[var(--paper)] px-5 py-5 grid gap-4 text-xs font-bold uppercase tracking-[.12em]">
        <Link href="/#nouveautes" onClick={() => setOpen(false)}>Nouveautés</Link><Link href="/#collections" onClick={() => setOpen(false)}>Collections</Link><Link href="/#maison" onClick={() => setOpen(false)}>La maison</Link>
      </nav>}
    </header>
  </>;
}

export function ShopFooter() {
  return <footer className="bg-[var(--ink)] text-white mt-24"><div className="container-shop py-14 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
    <div><Link href="/" className="display text-3xl">Emmaashop<span className="text-[var(--sand)]">.</span></Link><p className="text-white/55 text-sm leading-6 mt-5 max-w-xs">L’élégance africaine pensée pour aujourd’hui. Des pièces qui racontent une histoire, faites pour durer.</p></div>
    <div><p className="eyebrow !text-white/45 mb-5">Boutique</p><div className="grid gap-3 text-sm text-white/75"><Link href="/#nouveautes">Nouveautés</Link><Link href="/#collections">Collections</Link><Link href="/cart">Mon panier</Link></div></div>
    <div><p className="eyebrow !text-white/45 mb-5">Aide</p><div className="grid gap-3 text-sm text-white/75"><span>Livraison & retours</span><span>Guide des tailles</span><span>Nous contacter</span><Link href="/login" className="text-white hover:text-[var(--sand)]">Espace pro</Link></div></div>
    <div><p className="eyebrow !text-white/45 mb-5">La newsletter</p><p className="text-sm text-white/60 leading-6 mb-4">Recevez nos nouveautés et nos histoires de style.</p><div className="flex border-b border-white/30 pb-2"><input className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40" placeholder="Votre adresse e-mail"/><button aria-label="S’inscrire"><ArrowRight size={18}/></button></div></div>
  </div><div className="container-shop py-5 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-between text-[10px] uppercase tracking-[.15em] text-white/40"><span>© 2026 Emmaashop</span><span>Mode · Culture · Héritage</span></div></footer>;
}

export function ProductCard({ product }: { product: any }) {
  const addItem = useCart((state) => state.addItem);
  const price = product.discount_price || product.price;
  return <article className="product-card group flex h-full flex-col">
    <Link href={`/produit/${product.id}`} className="flex flex-1 flex-col">
      <div className="product-image aspect-[.82] rounded-[3px]">
        {product.image_url ? <img src={product.image_url} alt={product.name}/> : <div className="h-full grid place-items-center text-sm text-[var(--muted)]">Emmaashop</div>}
        {product.discount_price && <span className="absolute left-3 top-3 rounded-full bg-[var(--coral)] px-3 py-1 text-[10px] font-bold text-white">Offre</span>}
        {product.stock === 0 && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-2 text-center text-[10px] font-bold uppercase tracking-wider">Épuisé</span>}
      </div>
      <div className="pt-4"><p className="text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">{product.category || 'Collection'}</p><div className="mt-1 flex items-start justify-between gap-3"><h3 className="font-semibold text-sm leading-5">{product.name}</h3><Heart size={16} className="shrink-0 text-[var(--muted)]"/></div><div className="mt-2 flex gap-2 text-sm"><span className="font-bold">{price} €</span>{product.discount_price && <span className="text-[var(--muted)] line-through">{product.price} €</span>}</div></div>
    </Link>
    {product.stock > 0 && <button onClick={() => addItem(product)} className="btn-primary mt-4 w-full">Ajouter au panier <ShoppingBag size={15}/></button>}
  </article>;
}
