'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/store';
import { ShopFooter, ShopHeader } from '@/components/ShopChrome';
import CountryPhoneField from '@/components/CountryPhoneField';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

const SHOP_WHATSAPP = process.env.NEXT_PUBLIC_SHOP_WHATSAPP;
const IDEMPOTENCY_STORAGE_KEY = 'emmaashop-pending-order-key';

function createIdempotencyKey() {
  const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof window !== 'undefined') sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, key);
  return key;
}

function getIdempotencyKey() {
  if (typeof window !== 'undefined') return sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY) || createIdempotencyKey();
  return createIdempotencyKey();
}

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQty, clearCart } = useCart();
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('FR');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [idempotencyKey] = useState(getIdempotencyKey);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!items.length || loading) return;
    setLoading(true);
    setError('');
    const parsedPhone = parsePhoneNumberFromString(customer.phone, phoneCountry);
    if (!parsedPhone || !parsedPhone.isValid()) {
      setError('Numéro de téléphone invalide pour le pays sélectionné.');
      setLoading(false);
      return;
    }

    try {
      const orderItems = items.map((item) => ({ product_id: item.productId, quantity: item.quantity, ...(item.variant?.id ? { variant_id: item.variant.id } : {}) }));
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name.trim(),
          customer_email: customer.email.trim(),
          customer_phone: parsedPhone.number,
          delivery_address: customer.address.trim(),
          items: orderItems,
          idempotency_key: idempotencyKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Impossible de confirmer la commande');

      const order = data.order ?? {};
      const orderId = order.id || '';
      const serverTotal = Number(order.total_price ?? 0);
      const lines = items.map((item) => `- ${item.name}${item.variant?.label ? ` (${item.variant.label})` : ''} × ${item.quantity}`).join('\n');
      const message = `Bonjour, j’ai passé une commande sur Emmaashop.\n\nNuméro de commande : #${orderId || 'à confirmer'}\nNom : ${customer.name.trim()}\nE-mail : ${customer.email.trim()}\nTéléphone : ${parsedPhone.number}\nAdresse de livraison : ${customer.address.trim() || 'Non précisée'}\n\nArticles commandés :\n${lines}\n\nTotal confirmé : ${serverTotal.toFixed(2)} €`;

      if (SHOP_WHATSAPP) {
        setWhatsappUrl(`https://wa.me/${SHOP_WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`);
      }
      setOrderNumber(orderId);
      clearCart();
      if (typeof window !== 'undefined') sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de confirmer la commande');
    } finally {
      setLoading(false);
    }
  };

  return <div><ShopHeader/><main className="container-shop py-8 md:py-14"><Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)]"><ArrowLeft size={14}/> Continuer mes achats</Link><div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_.8fr]"><section><div className="flex items-end justify-between border-b border-[var(--line)] pb-5"><div><p className="eyebrow">Votre sélection</p><h1 className="display mt-2 text-5xl">Le panier.</h1></div><span className="text-xs text-[var(--muted)]">{items.length} article{items.length > 1 ? 's' : ''}</span></div>{done ? <div className="border-b border-[var(--line)] py-16"><div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--olive)] text-white"><Check size={22}/></div><p className="eyebrow mt-7 text-[var(--olive)]">Commande enregistrée {orderNumber && `#${orderNumber}`}</p><h2 className="display mt-4 text-4xl">Merci pour votre confiance.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted)]">Votre commande est bien enregistrée. Notre équipe vous contactera pour confirmer la livraison.</p>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-xs font-bold text-white transition hover:brightness-95"><MessageCircle size={17}/> Envoyer le récapitulatif <ArrowRight size={15}/></a>}<Link href="/" className="ml-3 mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Retour boutique</Link></div> : items.length ? <div className="divide-y divide-[var(--line)]">{items.map((item) => <div key={item.lineId} className="flex gap-4 py-6"><div className="product-image h-28 w-24 shrink-0"><img src={item.image_url} alt={item.name}/></div><div className="flex flex-1 flex-col justify-between"><div className="flex justify-between gap-4"><div><p className="eyebrow">Collection{item.variant?.label ? ` · ${item.variant.label}` : ''}</p><h3 className="mt-1 font-semibold">{item.name}</h3></div><button type="button" onClick={() => removeItem(item.lineId)} aria-label={`Supprimer ${item.name}`}><Trash2 size={16} className="text-[var(--muted)]"/></button></div><div className="flex items-center justify-between"><div className="flex items-center gap-4 border border-[var(--line)] px-2 py-1.5"><button type="button" onClick={() => updateQty(item.lineId, item.quantity - 1)} aria-label="Diminuer"><Minus size={13}/></button><span className="w-5 text-center text-xs font-bold">{item.quantity}</span><button type="button" onClick={() => updateQty(item.lineId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Augmenter"><Plus size={13}/></button></div><strong>{(item.price * item.quantity).toFixed(2)} €</strong></div></div></div>)}</div> : <div className="py-24 text-center"><ShoppingBag size={32} className="mx-auto text-[var(--muted)]"/><p className="mt-5 text-sm text-[var(--muted)]">Votre panier est encore vide.</p><Link href="/#nouveautes" className="btn-secondary mt-7">Découvrir les pièces <ArrowRight size={15}/></Link></div>}</section>{!done && <aside><form onSubmit={submit} className="bg-white p-6 md:p-8"><div className="flex items-center justify-between border-b border-[var(--line)] pb-5"><h2 className="display text-3xl">Finaliser</h2><span className="eyebrow">01 / 01</span></div><div className="mt-7 flex justify-between text-sm"><span>Sous-total estimé</span><strong>{totalPrice().toFixed(2)} €</strong></div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Le total final est recalculé par le serveur au moment de la commande.</p><div className="mt-8 grid gap-5"><label className="grid gap-2"><span className="eyebrow">Nom complet</span><input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="border-b border-[var(--line)] bg-transparent py-3 text-sm outline-none focus:border-[var(--ink)]" placeholder="Votre nom"/></label><label className="grid gap-2"><span className="eyebrow">E-mail</span><input required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="border-b border-[var(--line)] bg-transparent py-3 text-sm outline-none focus:border-[var(--ink)]" placeholder="vous@exemple.com"/></label><CountryPhoneField country={phoneCountry} phone={customer.phone} onCountryChange={setPhoneCountry} onPhoneChange={(phone) => setCustomer({ ...customer, phone })}/><label className="grid gap-2"><span className="eyebrow">Adresse de livraison</span><textarea value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="min-h-20 resize-none border-b border-[var(--line)] bg-transparent py-3 text-sm outline-none" placeholder="Ville, quartier, repère…"/></label></div>{error && <p role="alert" className="mt-5 bg-[#f9e8e4] p-3 text-xs text-[var(--coral)]">{error}</p>}<button type="submit" disabled={loading || !items.length} className="btn-primary mt-8 w-full disabled:opacity-40">{loading ? 'Enregistrement…' : 'Confirmer la commande'} <ArrowRight size={16}/></button><p className="mt-4 text-center text-[10px] text-[var(--muted)]">Paiement à la livraison · Aucun paiement en ligne requis</p></form></aside>}</div></main><ShopFooter/></div>;
}
