'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { apiCall } from '@/lib/api';

export type Category = { id: number; name: string; slug?: string | null };

type Props = { categories: Category[]; onChange: (categories: Category[]) => void };

export default function CategoryManager({ categories, onChange }: Props) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: data.session?.access_token ? `Bearer ${data.session.access_token}` : '' };
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const headers = await authHeaders();
        const rows = await apiCall('/api/categories?scope=admin', { headers });
        if (mounted && Array.isArray(rows)) onChange(rows);
      } catch {
        // Le catalogue conserve ses catégories de secours si la migration n'est pas encore active.
      }
    })();
    return () => { mounted = false; };
    // Le chargement ne doit se faire qu’à l’ouverture du panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => { setName(''); setEditing(null); setError(''); };

  const save = async () => {
    const value = name.trim();
    if (value.length < 2) { setError('Le nom doit contenir au moins 2 caractères.'); return; }
    setBusy(true); setError('');
    try {
      const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
      const row = await apiCall(editing ? `/api/categories/${editing.id}` : '/api/categories', {
        method: editing ? 'PATCH' : 'POST', headers, body: JSON.stringify({ name: value }),
      });
      onChange(editing ? categories.map((category) => category.id === editing.id ? row : category) : [...categories, row]);
      reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’enregistrer la catégorie.'); }
    finally { setBusy(false); }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`Supprimer « ${category.name} » ? Les produits associés devront être recatégorisés.`)) return;
    setBusy(true); setError('');
    try {
      const headers = await authHeaders();
      await apiCall(`/api/categories/${category.id}`, { method: 'DELETE', headers });
      onChange(categories.filter((item) => item.id !== category.id));
      if (editing?.id === category.id) reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Impossible de supprimer la catégorie.'); }
    finally { setBusy(false); }
  };

  return <section className="mt-8 border border-[var(--line)] bg-white p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="eyebrow">Organisation</p><h2 className="display mt-2 text-3xl">Catégories</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">Créez autant de familles de produits que nécessaire. Elles seront disponibles immédiatement dans le formulaire produit.</p></div>
      <span className="w-fit bg-[var(--paper)] px-3 py-2 text-xs font-bold">{categories.length} catégorie{categories.length > 1 ? 's' : ''}</span>
    </div>
    <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <div key={category.id} className="flex min-w-0 items-center justify-between gap-3 border border-[var(--line)] px-3 py-3"><span className="min-w-0 truncate text-sm font-semibold">{category.name}</span><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Renommer ${category.name}`} onClick={() => { setEditing(category); setName(category.name); setError(''); }} className="grid h-9 w-9 place-items-center text-[var(--muted)] hover:bg-[var(--paper)]"><Pencil size={15}/></button><button type="button" aria-label={`Supprimer ${category.name}`} onClick={() => void remove(category)} disabled={busy} className="grid h-9 w-9 place-items-center text-[var(--coral)] hover:bg-[#f9e8e4] disabled:opacity-40"><Trash2 size={15}/></button></div></div>)}</div>
    <div className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="flex min-w-0 flex-1 items-center border-b border-[var(--line)]"><span className="sr-only">Nom de la catégorie</span><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void save(); } }} placeholder={editing ? 'Nouveau nom…' : 'Ex. Bijoux, Chaussures…'} className="min-w-0 w-full bg-transparent px-1 py-3 text-base outline-none" /></label><div className="flex gap-2"><button type="button" onClick={() => void save()} disabled={busy} className="btn-primary flex-1 sm:flex-none">{busy ? <Loader2 size={15} className="animate-spin"/> : editing ? <Check size={15}/> : <Plus size={15}/>} {editing ? 'Enregistrer' : 'Ajouter'}</button>{editing && <button type="button" onClick={reset} className="grid h-11 w-11 place-items-center border border-[var(--line)]" aria-label="Annuler"><X size={16}/></button>}</div></div>
    {error && <p role="alert" className="mt-3 bg-[#f9e8e4] p-3 text-xs text-[var(--coral)]">{error}</p>}
  </section>;
}
