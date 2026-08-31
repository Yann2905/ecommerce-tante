'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { apiCall } from '@/lib/api';
import { Plus, Trash2, X, Loader2, Pencil, Eye, EyeOff, Search, Package } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Boubous' },
  { id: 2, name: 'Robes' },
  { id: 3, name: 'Ensembles' },
  { id: 4, name: 'Montres' },
  { id: 5, name: 'Accessoires' },
];

/**
 * Upload signé d'un fichier vers Cloudinary (direct navigateur → Cloudinary).
 * La signature vient de notre serveur (/api/cloudinary-signature, réservé admin).
 */
async function uploadToCloudinary(file: File): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const sigRes = await fetch('/api/cloudinary-signature', {
    method: 'POST',
    headers: { Authorization: token ? `Bearer ${token}` : '' },
  });
  if (!sigRes.ok) throw new Error('Signature Cloudinary refusée (reconnecte-toi ?).');
  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);

  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!upRes.ok) throw new Error("Échec de l'upload sur Cloudinary.");
  const data = await upRes.json();
  return data.secure_url as string;
}

export default function ManageProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]); // nouvelles photos à uploader
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]); // photos déjà en base (édition)
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | 'all'>('all');
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', price: 0, stock: 0, description: '',
    category_id: 1, discount_price: '', is_active: true,
  });

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
    setPageLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setMainFile(null);
    setPreview(null);
    setGalleryFiles([]);
    setGalleryUrls([]);
    setFormData({ name: '', price: 0, stock: 0, description: '', category_id: 1, discount_price: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setMainFile(null);
    setPreview(p.image_url || null);
    setGalleryFiles([]);
    setGalleryUrls(Array.isArray(p.gallery) ? p.gallery : []);
    setFormData({
      name: p.name, price: p.price, stock: p.stock,
      description: p.description || '', category_id: p.category_id || 1,
      discount_price: p.discount_price || '', is_active: p.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (file: File | null) => {
    setMainFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const MAX_GALLERY = 6;

  const addGalleryFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_GALLERY - (galleryUrls.length + galleryFiles.length);
    if (room <= 0) return;
    setGalleryFiles(prev => [...prev, ...Array.from(files).slice(0, room)]);
  };

  const removeGalleryFile = (idx: number) =>
    setGalleryFiles(prev => prev.filter((_, i) => i !== idx));

  const removeGalleryUrl = (url: string) =>
    setGalleryUrls(prev => prev.filter(u => u !== url));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let image_url = editProduct?.image_url || '';
      if (mainFile) {
        image_url = await uploadToCloudinary(mainFile);
      }

      // Upload des photos supplémentaires (galerie) puis fusion avec l'existant conservé
      const uploaded: string[] = [];
      for (const file of galleryFiles) {
        uploaded.push(await uploadToCloudinary(file));
      }
      const gallery = [...galleryUrls, ...uploaded];

      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category_id: Number(formData.category_id),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        image_url,
        gallery,
      };

      const method = editProduct ? 'PATCH' : 'POST';
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      await apiCall(url, { method, body: JSON.stringify(payload) });

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    setDeletingId(id);
    try {
      await apiCall(`/api/products/${id}`, { method: 'DELETE' });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (p: any) => {
    await apiCall(`/api/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    await fetchProducts();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

  const catName = (p: any) =>
    p.categories?.name || CATEGORIES.find(c => c.id === p.category_id)?.name || '—';

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const stats = [
    { label: 'Total', value: products.length, color: '#2D1B08' },
    { label: 'Visibles', value: products.filter(p => p.is_active).length, color: '#065F46' },
    { label: 'Masqués', value: products.filter(p => !p.is_active).length, color: '#92400E' },
    { label: 'Rupture', value: products.filter(p => p.stock === 0).length, color: '#991B1B' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB]">

      {/* ── TOP HEADER ── */}
      <div className="border-b border-[#F5E6D3] sticky top-0 z-40 bg-[#FFFDFB]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5">
          {/* Ligne 1 : logo + bouton */}
          <div className="flex items-center justify-between gap-4 mb-3 sm:mb-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#2D1B08]">
                STOCK<span className="text-[#B48446]">.</span>
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#8B5E34]/50 mt-0.5">
                Gestion des articles
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="bg-[#2D1B08] text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shrink-0"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Ajouter</span>
            </motion.button>
          </div>

          {/* Ligne 2 : recherche (pleine largeur sur mobile) */}
          <div className="relative sm:max-w-sm sm:mt-0 mt-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C]/50" size={15} />
            <input
              type="text" placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-3 bg-[#FDF8F2] border border-[#EAD8C0] rounded-xl text-sm font-medium outline-none focus:border-[#C9A84C] transition-colors"
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Sur desktop, réorganise en une ligne */}
        <style>{`
          @media (min-width: 640px) {
            .header-inner { flex-direction: row; align-items: center; }
          }
        `}</style>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-[#F5E6D3] rounded-3xl p-4 sm:p-5"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8B5E34]/50 mb-2">{s.label}</p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
          {[{ id: 'all', name: 'Tous' }, ...CATEGORIES].map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id as any)}
              className={`px-4 sm:px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${catFilter === c.id ? 'bg-[#2D1B08] text-white shadow-lg' : 'border border-[#EAD8C0] text-[#8B5E34] bg-white hover:border-[#C9A84C]/40'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* ── GRID ── */}
        {pageLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
            <Package size={48} className="text-[#EAD8C0] mx-auto mb-4" />
            <p className="text-[#8B5E34] italic font-medium opacity-60">Aucun article trouvé</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id} layout
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, type: 'spring', damping: 22 }}
                  className={`group bg-white rounded-[2rem] sm:rounded-[2.5rem] border overflow-hidden transition-all hover:shadow-2xl ${p.is_active ? 'border-[#F5E6D3]' : 'border-dashed border-[#EAD8C0] opacity-60'}`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#FDF8F2]">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl">👗</div>
                    }

                    {/* Overlay actions on hover — sur mobile toujours visible */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0800]/80 to-transparent sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity duration-300 flex items-end p-4 sm:p-5 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => openEdit(p)}
                        className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-[#1A0800]"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C56A)' }}
                      >
                        <Pencil size={13} /> Modifier
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => toggleActive(p)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(255,253,251,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
                        title={p.is_active ? 'Masquer' : 'Afficher'}
                      >
                        {p.is_active
                          ? <Eye size={15} className="text-green-400" />
                          : <EyeOff size={15} className="text-[#C9A84C]" />
                        }
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 border border-red-400/20"
                      >
                        {deletingId === p.id
                          ? <Loader2 size={14} className="animate-spin text-red-400" />
                          : <Trash2 size={14} className="text-red-400" />
                        }
                      </motion.button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      {!p.is_active && (
                        <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-[#2D1B08]/80 text-[#C9A84C] backdrop-blur-sm">
                          Masqué
                        </span>
                      )}
                      {p.stock === 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-red-500/80 text-white backdrop-blur-sm">
                          Rupture
                        </span>
                      )}
                      {p.stock > 0 && p.stock <= 3 && (
                        <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-orange-400/80 text-white backdrop-blur-sm">
                          Stock faible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#C9A84C]/70 mb-1">{catName(p)}</p>
                        <h3 className="font-serif font-black italic text-base sm:text-lg text-[#2D1B08] leading-tight truncate">{p.name}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-black text-[#B48446]">{fmt(p.price)}</p>
                        {p.discount_price && (
                          <p className="text-xs text-[#8B5E34]/40 line-through">{fmt(p.discount_price)}</p>
                        )}
                      </div>
                    </div>

                    {/* Stock bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#8B5E34]/50">Stock</span>
                        <span className={`text-[10px] font-black ${p.stock === 0 ? 'text-red-500' : p.stock <= 3 ? 'text-orange-400' : 'text-green-600'}`}>
                          {p.stock} unité{p.stock > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F5E6D3] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((p.stock / 20) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: p.stock === 0
                              ? '#EF4444'
                              : p.stock <= 3
                                ? '#F97316'
                                : 'linear-gradient(90deg, #C9A84C, #E8C56A)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── MODALE ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !loading && setIsModalOpen(false)}
              className="absolute inset-0 bg-[#1A0800]/75 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28 }}
              className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto scrollbar-hide"
              style={{
                background: '#FFFDFB',
                borderRadius: '2.5rem 2.5rem 0 0',
                boxShadow: '0 40px 100px rgba(10,4,0,.5)',
              }}
            >
              {/* Barre de drag sur mobile */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[#EAD8C0]" />
              </div>

              {/* Sur tablette/desktop, coins arrondis partout */}
              <style>{`
                @media (min-width: 640px) {
                  .modal-inner { border-radius: 3rem !important; }
                }
              `}</style>

              {/* Modal header */}
              <div className="p-6 sm:p-10 pb-0 flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#C9A84C] mb-2">
                    {editProduct ? '✦ Modification' : '✦ Nouveau'}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#2D1B08] italic">
                    {editProduct ? editProduct.name.toUpperCase().slice(0, 18) + (editProduct.name.length > 18 ? '…' : '') + '.' : 'AJOUTER.'}
                  </h2>
                </div>
                <button
                  onClick={() => !loading && setIsModalOpen(false)}
                  className="w-10 h-10 bg-[#FDF8F2] border border-[#EAD8C0] rounded-full flex items-center justify-center text-[#8B5E34] hover:text-[#2D1B08] transition-colors shrink-0 mt-1"
                >
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-5">

                {/* Preview image */}
                <label className="block cursor-pointer group/img">
                  <div className={`relative rounded-3xl overflow-hidden border-2 border-dashed transition-colors ${preview ? 'border-[#C9A84C]/40' : 'border-[#EAD8C0] hover:border-[#C9A84C]/40'}`}
                    style={{ background: '#FDF8F2' }}>
                    {preview ? (
                      <div className="aspect-video relative">
                        <img src={preview} className="w-full h-full object-cover" alt="preview" />
                        <div className="absolute inset-0 bg-[#1A0800]/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-black uppercase tracking-wider">Changer l'image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center gap-3">
                        <div className="text-4xl">📷</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5E34] text-center px-4">
                          Appuyer pour ajouter une image
                        </span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                </label>

                {/* Autres photos (galerie) */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">
                    Autres photos ({galleryUrls.length + galleryFiles.length}/{MAX_GALLERY})
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {/* Photos déjà en base */}
                    {galleryUrls.map((url) => (
                      <div key={url} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#EAD8C0] group/g">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeGalleryUrl(url)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#1A0800]/70 text-white flex items-center justify-center opacity-0 group-hover/g:opacity-100 transition-opacity">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {/* Nouvelles photos (pas encore uploadées) */}
                    {galleryFiles.map((file, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#C9A84C]/50 group/g">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeGalleryFile(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#1A0800]/70 text-white flex items-center justify-center opacity-0 group-hover/g:opacity-100 transition-opacity">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {/* Bouton d'ajout */}
                    {galleryUrls.length + galleryFiles.length < MAX_GALLERY && (
                      <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#EAD8C0] hover:border-[#C9A84C]/60 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#FDF8F2]">
                        <Plus size={18} className="text-[#C9A84C]" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#8B5E34]/60 mt-1">Ajouter</span>
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={e => { addGalleryFiles(e.target.files); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8B5E34]/50 font-medium mt-2">
                    Ces photos s'affichent sur la fiche produit (défilables). La photo principale reste la couverture.
                  </p>
                </div>

                {/* Nom */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Nom de l'article *</label>
                  <input
                    type="text" placeholder="Ex : Grand Boubou Royal" required
                    value={formData.name}
                    className="w-full p-4 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors"
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Catégorie</label>
                  <select
                    value={formData.category_id}
                    className="w-full p-4 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors appearance-none cursor-pointer"
                    onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Prix + Stock */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Prix *</label>
                    <div className="relative">
                      <input
                        type="number" placeholder="0" required min={0} step="0.01"
                        value={formData.price || ''}
                        className="w-full p-4 pr-10 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors"
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B48446] font-black">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Stock *</label>
                    <input
                      type="number" placeholder="0" required min={0}
                      value={formData.stock || ''}
                      className="w-full p-4 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors"
                      onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Prix promo */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Prix promo (optionnel)</label>
                  <div className="relative">
                    <input
                      type="number" placeholder="0" min={0} step="0.01"
                      value={formData.discount_price || ''}
                      className="w-full p-4 pr-10 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors"
                      onChange={e => setFormData({ ...formData, discount_price: e.target.value })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B48446] font-black">€</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B5E34]/60 mb-2 block">Description</label>
                  <textarea
                    placeholder="Décrivez l'article, les matières, les occasions..."
                    value={formData.description}
                    rows={3}
                    className="w-full p-4 bg-[#FDF8F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#C9A84C] transition-colors resize-none"
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Visibilité toggle */}
                <div
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="flex items-center justify-between p-4 bg-[#FDF8F2] rounded-2xl cursor-pointer hover:bg-[#F5E6D3]/60 transition-colors"
                >
                  <div className="pr-3">
                    <p className="text-sm font-black text-[#2D1B08]">
                      {formData.is_active ? 'Visible sur la boutique' : 'Masqué (brouillon)'}
                    </p>
                    <p className="text-[10px] text-[#8B5E34]/60 font-medium mt-0.5">
                      {formData.is_active ? 'Les clientes peuvent voir et commander cet article' : "Cet article n'apparaît pas sur la boutique"}
                    </p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${formData.is_active ? 'bg-[#C9A84C]' : 'bg-[#EAD8C0]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${formData.is_active ? 'left-6' : 'left-0.5'}`} />
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  type="submit" disabled={loading}
                  className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl disabled:opacity-60 transition-all"
                  style={{ background: loading ? '#EAD8C0' : 'linear-gradient(135deg, #2D1B08, #4A2810)', color: '#FFFDFB' }}
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Enregistrement en cours...</>
                    : editProduct ? '✓ Enregistrer les modifications' : '✓ Mettre en vente'
                  }
                </motion.button>

                {/* Espace bas pour éviter que le bouton soit caché par la barre nav mobile */}
                <div className="h-4 sm:h-0" />
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}