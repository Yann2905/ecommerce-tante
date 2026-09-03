'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

type Props = { country: CountryCode; phone: string; onCountryChange: (country: CountryCode) => void; onPhoneChange: (phone: string) => void };

const displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });
const countries = getCountries().map((code) => ({ code, name: displayNames.of(code) || code, dial: `+${getCountryCallingCode(code)}` })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export default function CountryPhoneField({ country, phone, onCountryChange, onPhoneChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = countries.find((item) => item.code === country) || countries.find((item) => item.code === 'FR')!;
  const filtered = useMemo(() => countries.filter((item) => `${item.name} ${item.dial} ${item.code}`.toLowerCase().includes(query.toLowerCase())).slice(0, 80), [query]);
  const parsed = phone ? parsePhoneNumberFromString(phone, country) : null;
  const invalid = Boolean(phone && (!parsed || !parsed.isValid()));

  return <div className="grid gap-3"><span className="eyebrow">Pays et téléphone / WhatsApp</span><div className="relative"><button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between border-b border-[var(--line)] bg-transparent py-3 text-left text-sm"><span>{selected.name} <span className="text-[var(--muted)]">({selected.dial})</span></span><ChevronDown size={16} className="text-[var(--muted)]"/></button>{open && <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-hidden border border-[var(--line)] bg-white shadow-lg"><div className="flex items-center gap-2 border-b border-[var(--line)] p-3"><Search size={15} className="text-[var(--muted)]"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un pays…" className="w-full bg-transparent text-sm outline-none"/></div><div className="max-h-56 overflow-y-auto p-1">{filtered.map((item) => <button type="button" key={item.code} onClick={() => { onCountryChange(item.code); setQuery(''); setOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-[var(--paper)]"><span>{item.name} <span className="text-xs text-[var(--muted)]">{item.dial}</span></span>{item.code === country && <Check size={15} className="text-[var(--olive)]"/>}</button>)}</div></div>}</div><div className="flex items-center gap-3 border-b border-[var(--line)]"><span className="shrink-0 text-sm font-semibold text-[var(--muted)]">{selected.dial}</span><input required value={phone} onChange={(event) => onPhoneChange(event.target.value)} inputMode="tel" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" placeholder="Votre numéro national" /></div><p className={`text-[11px] ${invalid ? 'text-[var(--coral)]' : 'text-[var(--muted)]'}`}>{invalid ? 'Numéro invalide pour ce pays.' : 'Saisissez uniquement votre numéro national, avec ou sans le 0 initial.'}</p></div>;
}
