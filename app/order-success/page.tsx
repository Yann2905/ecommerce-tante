import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ShopFooter, ShopHeader } from '@/components/ShopChrome';

export const metadata: Metadata = { title: 'Commande confirmée · Emmaashop' };

export default async function OrderSuccess({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return <div><ShopHeader/><main className="container-shop min-h-[65vh] grid place-items-center py-20"><div className="max-w-xl text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--olive)] text-white"><Check size={28}/></div><p className="eyebrow mt-8 text-[var(--olive)]">Commande confirmée</p><h1 className="display mt-4 text-5xl md:text-6xl">Merci pour votre confiance.</h1>{order && <p className="mt-5 text-sm font-bold uppercase tracking-widest text-[var(--ink)]">Commande #{order}</p>}<p className="mx-auto mt-6 max-w-md text-sm leading-7 text-[var(--muted)]">Votre commande a bien été reçue. Notre équipe vous contactera prochainement pour confirmer les détails de la livraison.</p><Link href="/" className="btn-primary mt-9">Retour à la boutique <ArrowRight size={16}/></Link></div></main><ShopFooter/></div>;
}
