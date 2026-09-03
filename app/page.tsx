'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, Search, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import heroFashion from '@/public/hero/hero-fashion.jpg';
import heroBag from '@/public/hero/hero-bag.jpg';
import heroBeauty from '@/public/hero/hero-beauty.jpg';
import heroAfrica from '@/public/hero/hero-africa.jpg';
import tanteDetouree from '@/public/tante-detouree.png';
import matante from '@/public/matante.jpg';
import { ProductCard, ShopFooter, ShopHeader } from '@/components/ShopChrome';
import { lockHomeView, readHomeView, saveHomeView, unlockHomeView } from '@/lib/home-scroll';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tout');
  useEffect(() => { fetch('/api/products').then((response) => { if (!response.ok) throw new Error('Catalogue indisponible'); return response.json(); }).then((data) => setProducts(data || [])).catch(() => setProducts([])).finally(() => setLoading(false)); }, []);

  // Restauration de la vue précédente : une seule fois, après l'affichage du
  // catalogue. Avant cela la grille est vide et la page n'a aucune hauteur.
  const [viewReady, setViewReady] = useState(false);
  useEffect(() => {
    if (loading || viewReady) return;
    // On revient sur l'accueil : l'écriture peut reprendre.
    unlockHomeView();
    // Une ancre explicite dans l'URL (/#nouveautes) exprime une intention : elle
    // prime sur la position mémorisée.
    const anchored = Boolean(window.location.hash);
    const saved = anchored ? null : readHomeView();
    if (!saved) {
      // Sans vue mémorisée, on repart du haut : le lien retour de la fiche produit
      // utilise scroll={false} et laisserait sinon le décalage de la page quittée.
      if (!anchored) window.scrollTo(0, 0);
      setViewReady(true);
      return;
    }
    setQuery(saved.query);
    setCategory(saved.category);
    // Deux frames : la première laisse React réappliquer les filtres, la seconde
    // laisse le navigateur mesurer la grille avant qu'on repositionne.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      // globals.css applique scroll-behavior:smooth : sans neutralisation, la
      // reprise de position serait une longue glissade animée, interruptible.
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, saved.scrollY);
      root.style.scrollBehavior = previous;
      setViewReady(true);
    }));
  }, [loading, viewReady]);

  // Mémorisation continue, seulement une fois la restauration terminée : sinon
  // on écraserait la position enregistrée par le 0 du premier rendu.
  useEffect(() => {
    if (!viewReady) return;
    let frame = 0;
    const remember = () => saveHomeView({ scrollY: window.scrollY, query, category });
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(remember); };
    // Au clic vers une fiche produit, on fige la position AVANT que le routeur ne
    // remonte la page en haut : ce scroll automatique écrasait sinon la valeur.
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
  const categories = useMemo(() => ['Tout', ...Array.from(new Set(products.map((p) => p.categories?.name || p.category).filter(Boolean)))], [products]);
  const filtered = products.filter((p) => (category === 'Tout' || (p.categories?.name || p.category) === category) && `${p.name} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div><ShopHeader/><main>
    <section className="container-shop pt-7 md:pt-10"><div className="relative overflow-hidden rounded-[4px] bg-[#e8e2d6] px-4 py-5 sm:px-8 sm:py-8 md:min-h-[620px] md:px-12 md:py-12"><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,.8),_transparent_50%)]"/><div className="relative grid min-h-[430px] grid-cols-2 gap-3 sm:min-h-[500px] sm:grid-cols-4 sm:gap-5"><div className="group relative mt-8 overflow-hidden bg-[#c9b7a5] sm:mt-14"><Image src={heroFashion} alt="Inspiration mode africaine" fill sizes="(min-width:640px) 25vw, 50vw" priority className="object-cover transition duration-700 group-hover:scale-105"/><span className="absolute bottom-3 left-3 text-[9px] font-bold uppercase tracking-widest text-white">Mode</span></div><div className="group relative mb-8 overflow-hidden bg-[#d4cbbb] sm:mb-14"><Image src={heroBag} alt="Inspiration sac et accessoires" fill sizes="(min-width:640px) 25vw, 50vw" priority className="object-cover transition duration-700 group-hover:scale-105"/><span className="absolute bottom-3 left-3 text-[9px] font-bold uppercase tracking-widest text-white">Accessoires</span></div><div className="group relative mt-8 overflow-hidden bg-[#d7c2c2] sm:mt-14"><Image src={heroBeauty} alt="Inspiration beauté" fill sizes="(min-width:640px) 25vw, 50vw" loading="eager" className="object-cover transition duration-700 group-hover:scale-105"/><span className="absolute bottom-3 left-3 text-[9px] font-bold uppercase tracking-widest text-white">Beauté</span></div><div className="group relative mb-8 overflow-hidden bg-[#c6cdbd] sm:mb-14"><Image src={heroAfrica} alt="Inspiration silhouettes africaines" fill sizes="(min-width:640px) 25vw, 50vw" loading="eager" className="object-cover object-top transition duration-700 group-hover:scale-105"/><span className="absolute bottom-3 left-3 text-[9px] font-bold uppercase tracking-widest text-white">Silhouettes</span></div><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="max-w-[245px] rounded-full border border-white/80 bg-[#f7f3eb]/95 px-7 py-9 text-center shadow-xl sm:max-w-[285px] sm:px-10 sm:py-11"><p className="eyebrow text-[var(--olive)]">L’univers</p><p className="display mt-2 text-4xl leading-[.9] sm:text-5xl">Emmaashop<span className="text-[var(--olive)]">.</span></p><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Mode, accessoires & beauté à découvrir.</p></div></div></div><div className="relative mt-7 text-center"><p className="eyebrow mb-3">Inspiration · 2026</p><h1 className="display text-4xl leading-none sm:text-5xl md:text-6xl">L’allure <em>en héritage.</em></h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">Un univers pensé pour vous donner envie de trouver la pièce qui vous ressemble.</p><a href="#nouveautes" className="btn-primary mt-6">Découvrir la collection <ArrowRight size={16}/></a><p className="mt-3 text-[10px] text-[var(--muted)]">Images d’inspiration · produits disponibles dans la collection ci-dessous</p></div></div></section>
    <section className="container-shop grid gap-5 border-b border-[var(--line)] py-7 text-center sm:grid-cols-3 sm:text-left"><div><p className="font-bold text-sm">Livraison soignée</p><p className="mt-1 text-xs text-[var(--muted)]">Partout dans le monde</p></div><div><p className="font-bold text-sm">Paiement à la livraison</p><p className="mt-1 text-xs text-[var(--muted)]">Simple, sûr, sans surprise</p></div><div><p className="font-bold text-sm">Une maison indépendante</p><p className="mt-1 text-xs text-[var(--muted)]">Des pièces choisies avec cœur</p></div></section>
    <section id="nouveautes" className="container-shop scroll-mt-28 py-20 md:py-28"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="eyebrow mb-4">À découvrir maintenant</p><h2 className="display text-4xl md:text-5xl">Les pièces du moment</h2></div><p className="max-w-xs text-sm leading-6 text-[var(--muted)]">Une sélection de vêtements qui accompagnent les jours ordinaires comme les grandes occasions.</p></div><div className="mt-10 flex flex-col gap-4 border-y border-[var(--line)] py-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-5 overflow-x-auto">{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-[.12em] ${category === c ? 'border-b-2 border-[var(--ink)] pb-2' : 'text-[var(--muted)]'}`}>{c}</button>)}</div><label className="flex items-center gap-2 border-b border-[var(--line)] pb-2 text-sm md:w-48"><Search size={15} className="text-[var(--muted)]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]"/></label></div>{loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[var(--olive)]"/></div> : filtered.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">{filtered.map((p) => <ProductCard key={p.id} product={p}/>)}</div> : <div className="py-20 text-center text-sm text-[var(--muted)]">Aucune pièce ne correspond à votre recherche.</div>}</section>
    <section id="collections" className="container-shop grid gap-4 md:grid-cols-3"><a className="group relative min-h-[330px] overflow-hidden bg-[#cfc8ba] md:col-span-2" href="#nouveautes"><Image src={tanteDetouree} alt="Collection essentielle" fill sizes="(min-width:768px) 66vw, 100vw" className="object-contain object-right-bottom transition-transform duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-r from-[#5b594d]/80 to-transparent"/><div className="relative flex h-full flex-col justify-end p-8 text-white"><p className="eyebrow !text-white/70">La sélection</p><h3 className="display mt-2 text-4xl">Les essentiels</h3><span className="mt-5 text-xs font-bold uppercase tracking-widest">Explorer <ArrowRight size={14} className="ml-1 inline"/></span></div></a><a className="group relative min-h-[330px] overflow-hidden bg-[#dce1d2] p-8" href="#nouveautes"><div className="flex h-full flex-col justify-between"><p className="eyebrow text-[var(--olive)]">Bientôt dans la maison</p><div><h3 className="display text-4xl leading-none">Beauté<br/><em>& cheveux.</em></h3><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Huiles, soins et rituels capillaires arrivent bientôt.</p><span className="mt-6 inline-flex text-xs font-bold uppercase tracking-widest">Être inspirée <ArrowRight size={14} className="ml-1"/></span></div></div></a></section>
    <section id="maison" className="container-shop grid gap-10 py-24 md:grid-cols-[.9fr_1.1fr] md:items-center md:py-32"><div className="relative min-h-[360px] overflow-hidden bg-[#d8c8bb]"><Image src={matante} alt="La fondatrice d’Emmaashop" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover object-top"/><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"/><p className="absolute bottom-6 left-6 eyebrow !text-white/80">Notre histoire</p></div><div className="max-w-xl"><p className="eyebrow mb-5">La maison</p><h2 className="display text-5xl leading-[.95] md:text-6xl">S’habiller<br/><em>de sens.</em></h2><p className="mt-7 text-lg leading-8">Emmaashop est née d’une envie simple : réunir des pièces qui donnent confiance, racontent une histoire et accompagnent chaque personnalité. La mode africaine y rencontre les accessoires, la beauté et les découvertes d’ici et d’ailleurs.</p><div className="mt-8 flex items-center gap-2 text-sm font-bold">Une maison indépendante, choisie avec cœur <ArrowRight size={16}/></div></div></section>
  </main><ShopFooter/></div>;
}
