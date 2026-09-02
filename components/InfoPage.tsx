import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ShopFooter, ShopHeader } from './ShopChrome';

export default function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <div><ShopHeader/><main className="container-shop max-w-4xl py-10 md:py-16"><Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={14}/> Retour à la boutique</Link><header className="mt-12 max-w-2xl border-b border-[var(--line)] pb-10"><p className="eyebrow">{eyebrow}</p><h1 className="display mt-4 text-5xl leading-none md:text-6xl">{title}</h1><p className="mt-6 text-base leading-7 text-[var(--muted)]">{intro}</p></header><article className="prose-shop mt-10 max-w-2xl text-sm leading-7 text-[var(--muted)]">{children}</article></main><ShopFooter/></div>;
}
