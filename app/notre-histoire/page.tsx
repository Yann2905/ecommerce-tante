import Link from 'next/link';
import Image from 'next/image';
import matante from '@/public/matante.jpg';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { ShopFooter, ShopHeader } from '@/components/ShopChrome';

export const metadata = { title: 'Notre histoire' };

export default function OurStoryPage() {
  return <div><ShopHeader/><main>
    <section className="container-shop grid gap-10 pt-10 md:grid-cols-[.95fr_1.05fr] md:items-center md:pt-16"><div className="relative min-h-[480px] overflow-hidden bg-[#d8c8bb] md:min-h-[620px]"><Image src={matante} alt="La fondatrice d’Emmaashop" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover object-top"/><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/><p className="absolute bottom-7 left-7 eyebrow !text-white/80">La maison Emmaashop</p></div><div className="max-w-xl"><p className="eyebrow mb-5">Notre histoire</p><h1 className="display text-5xl leading-[.92] md:text-7xl">S’habiller<br/><em>de sens.</em></h1><p className="mt-8 text-lg leading-8 text-[var(--muted)]">Emmaashop est née d’une envie simple : réunir des pièces qui donnent confiance, racontent une histoire et accompagnent chaque personnalité.</p><p className="mt-5 text-lg leading-8 text-[var(--muted)]">Entre l’élégance africaine, les découvertes d’ici et d’ailleurs, la mode, les accessoires et bientôt la beauté, notre maison imagine un vestiaire libre, généreux et profondément personnel.</p><Link href="/#nouveautes" className="btn-primary mt-8">Découvrir la collection <ArrowRight size={16}/></Link></div></section>
    <section className="container-shop grid gap-5 py-24 md:grid-cols-3 md:py-32"><div className="border-t border-[var(--line)] pt-5"><Heart size={19} className="text-[var(--olive)]"/><h2 className="display mt-5 text-3xl">Choisir avec cœur</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Chaque pièce est retenue pour sa coupe, son caractère et la sensation qu’elle laisse.</p></div><div className="border-t border-[var(--line)] pt-5"><Sparkles size={19} className="text-[var(--olive)]"/><h2 className="display mt-5 text-3xl">Créer l’envie</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Une boutique qui inspire, mélange les univers et vous aide à trouver la pièce qui vous ressemble.</p></div><div className="border-t border-[var(--line)] pt-5"><ArrowRight size={19} className="text-[var(--olive)]"/><h2 className="display mt-5 text-3xl">Grandir ensemble</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">De nouvelles collections, des accessoires et des rituels beauté viendront enrichir la maison.</p></div></section>
  </main><ShopFooter/></div>;
}
