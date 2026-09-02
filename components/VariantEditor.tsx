'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Variant = { id?: string; sku?: string | null; size?: string | null; color?: string | null; label: string; stock: number; is_active: boolean };

export default function VariantEditor({ variants, onChange }: { variants: Variant[]; onChange: (variants: Variant[]) => void }) {
  const [draft, setDraft] = useState({ size: '', color: '', sku: '', stock: 0 });
  const add = () => {
    const label = [draft.size, draft.color].filter(Boolean).join(' · ') || draft.sku.trim();
    if (!label) return;
    onChange([...variants, { label, size: draft.size || null, color: draft.color || null, sku: draft.sku || null, stock: Math.max(0, Number(draft.stock) || 0), is_active: true }]);
    setDraft({ size: '', color: '', sku: '', stock: 0 });
  };

  return <div className="border-t border-[var(--line)] pt-6"><div className="flex items-baseline justify-between gap-4"><div><p className="eyebrow">Variantes vêtements</p><p className="mt-1 text-xs text-[var(--muted)]">Une ligne par taille, couleur ou déclinaison.</p></div><span className="text-xs text-[var(--muted)]">{variants.length}/30</span></div>{variants.length > 0 && <div className="mt-4 grid gap-2">{variants.map((variant, index) => <div key={variant.id ?? `${variant.label}-${index}`} className="grid gap-2 border border-[var(--line)] bg-white p-3 sm:grid-cols-[1fr_1fr_90px_auto] sm:items-center"><div><p className="text-sm font-semibold">{variant.label}</p><p className="text-[10px] text-[var(--muted)]">{variant.sku || 'Sans SKU'}</p></div><p className="text-xs text-[var(--muted)]">{[variant.size, variant.color].filter(Boolean).join(' · ') || 'Attribut non précisé'}</p><input type="number" min="0" value={variant.stock} onChange={(event) => onChange(variants.map((item, itemIndex) => itemIndex === index ? { ...item, stock: Number(event.target.value) } : item))} className="border-b border-[var(--line)] bg-transparent py-2 text-sm outline-none" aria-label={`Stock ${variant.label}`}/><button type="button" onClick={() => onChange(variants.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-end text-[var(--coral)]" aria-label={`Supprimer ${variant.label}`}><Trash2 size={15}/></button></div>)}</div>}<div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_90px_auto]"><input value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })} placeholder="Taille (M)" className="border-b border-[var(--line)] bg-transparent py-2 text-sm outline-none"/><input value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} placeholder="Couleur" className="border-b border-[var(--line)] bg-transparent py-2 text-sm outline-none"/><input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} placeholder="SKU (optionnel)" className="border-b border-[var(--line)] bg-transparent py-2 text-sm outline-none"/><input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} placeholder="Stock" className="border-b border-[var(--line)] bg-transparent py-2 text-sm outline-none"/><button type="button" onClick={add} disabled={variants.length >= 30} className="flex items-center justify-center gap-2 border border-[var(--ink)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40"><Plus size={14}/> Ajouter</button></div></div>;
}
