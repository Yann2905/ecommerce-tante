'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/ShopChrome';
import { lockHomeView, readHomeView, saveHomeView, unlockHomeView } from '@/lib/home-scroll';

/**
 * Catalogue interactif : recherche, filtre par catégorie, grille.
 *
 * Les produits arrivent du serveur en props — ils sont donc déjà dans le HTML au
 * premier affichage. C'est ce qui permet de rejouer la position de défilement
 * AVANT que le navigateur ne peigne : la page a sa hauteur définitive dès le
 * premier rendu. Quand le catalogue était chargé côté client, la page restait
 * courte une seconde et la reprise de position se voyait comme un saut.
 */
export default function Catalogue({ products }: { products: any[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tout');
  const [viewReady, setViewReady] = useState(false);

  const categories = useMemo(() => ['Tout', ...Array.from(new Set(products.map((p) => p.categories?.name || p.category).filter(Boolean)))], [products]);
  const filtered = products.filter((p) => (category === 'Tout' || (p.categories?.name || p.category) === category) && `${p.name} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase()));

  // useLayoutEffect et non useEffect : le repositionnement doit avoir lieu avant
  // la peinture, sinon l'utilisatrice voit le haut de page puis le saut.
  useLayoutEffect(() => {
    if (viewReady) return;
    unlockHomeView();
    const anchored = Boolean(window.location.hash);
    const saved = anchored ? null : readHomeView();
    if (!saved) {
      if (!anchored) window.scrollTo(0, 0);
      setViewReady(true);
      return;
    }
    setQuery(saved.query);
    setCategory(saved.category);
    // globals.css applique scroll-behavior:smooth : neutralisé le temps du saut,
    // sans quoi la reprise serait une glissade animée et interruptible.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, saved.scrollY);
    root.style.scrollBehavior = previous;
    setViewReady(true);
  }, [viewReady]);

  useLayoutEffect(() => {
    if (!viewReady) return;
    let frame = 0;
    const remember = () => saveHomeView({ scrollY: window.scrollY, query, category });
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(remember); };
    // Au clic vers une fiche produit, on fige la position AVANT que le routeur ne
    // remonte la page en haut : ce défilement automatique l'écrasait sinon.
    const onLeave = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.('a[href^="/produit/"]')) return;
      cancelAnimationFrame(frame);
      remember();
      lockHomeView();
    };
    remember();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerdown', onLeave, true);
    document.addEventListener('click', onLeave, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerdown', onLeave, true);
      document.removeEventListener('click', onLeave, true);
    };
  }, [viewReady, query, category]);

  return <section id="nouveautes" className="container-shop scroll-mt-28 py-20 md:py-28"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="eyebrow mb-4">À découvrir maintenant</p><h2 className="display text-4xl md:text-5xl">Les pièces du moment</h2></div><p className="max-w-xs text-sm leading-6 text-[var(--muted)]">Une sélection de vêtements qui accompagnent les jours ordinaires comme les grandes occasions.</p></div><div className="mt-10 flex flex-col gap-4 border-y border-[var(--line)] py-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-5 overflow-x-auto">{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-[.12em] ${category === c ? 'border-b-2 border-[var(--ink)] pb-2' : 'text-[var(--muted)]'}`}>{c}</button>)}</div><label className="flex items-center gap-2 border-b border-[var(--line)] pb-2 text-sm md:w-48"><Search size={15} className="text-[var(--muted)]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]"/></label></div>{filtered.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">{filtered.map((p) => <ProductCard key={p.id} product={p}/>)}</div> : <div className="py-20 text-center text-sm text-[var(--muted)]">Aucune pièce ne correspond à votre recherche.</div>}</section>;
}
