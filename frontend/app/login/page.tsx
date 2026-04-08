'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, Leaf } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // Pour corriger l'erreur d'hydratation
  const router = useRouter();

  // On attend que le composant soit monté pour afficher les éléments aléatoires (feuilles)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      setLoading(false);
    } else {
      // On rafraîchit les cookies pour le middleware et on redirige
      router.refresh();
      setTimeout(() => {
        router.push('/admin');
      }, 150);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0a160a]">

      {/* ── PHOTO DE FOND ── */}
      <div className="absolute inset-0">
        <img
          src="/matante.jpg"
          alt="Emma-Shop"
          className="w-full h-full object-cover object-top"
          style={{ filter: 'brightness(0.4) saturate(1.2)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, rgba(18,42,18,0.2) 0%, rgba(18,42,18,0.7) 45%, rgba(8,20,8,0.98) 100%)'
          }}
        />
      </div>

      {/* ── PARTICULES FEUILLES (Protégées contre l'Hydratation) ── */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${40 + Math.random() * 60}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.1,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 20 - 10, 0],
                rotate: [0, 45, 0],
              }}
              transition={{
                duration: Math.random() * 6 + 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Leaf size={Math.random() * 12 + 8} color="#4ADE80" />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── CONTENU GAUCHE (Desktop) ── */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col justify-end pb-20 pl-20 absolute left-0 bottom-0 z-10 max-w-xl"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 w-fit mb-8">
          <Leaf size={12} className="text-green-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-400">Administration</span>
        </div>
        <h1 className="font-serif text-7xl font-black text-white leading-none mb-6">
          Mme <span className="text-green-400">KANE</span>.
        </h1>
        <p className="text-white/40 italic text-lg border-l-4 border-green-500/50 pl-6">
          "L'élégance est la seule beauté qui ne se fane jamais."
        </p>
      </motion.div>

      {/* ── FORMULAIRE DE CONNEXION ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-20 w-full max-w-[420px] mx-6 lg:mr-24 lg:ml-auto"
      >
        <div 
          className="rounded-[3rem] p-1 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.2), transparent)' }}
        >
          <div className="bg-[#081908]/80 backdrop-blur-3xl rounded-[2.8rem] p-10 md:p-12 border border-white/5">
            <div className="mb-10 text-center lg:text-left">
               <h2 className="text-3xl font-serif font-black text-white italic">Bon retour.</h2>
               <p className="text-white/30 text-sm mt-2 font-medium">Identifiez-vous pour gérer vos collections.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
                <div className={`flex items-center bg-white/5 border rounded-2xl px-4 py-1 transition-all ${focused === 'email' ? 'border-green-400 ring-4 ring-green-400/10' : 'border-white/10'}`}>
                  <Mail size={18} className="text-white/20" />
                  <input 
                    type="email" 
                    required 
                    className="w-full p-4 bg-transparent outline-none text-white text-sm" 
                    placeholder="admin@kane.com"
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* MOT DE PASSE */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Mot de passe</label>
                <div className={`flex items-center bg-white/5 border rounded-2xl px-4 py-1 transition-all ${focused === 'password' ? 'border-green-400 ring-4 ring-green-400/10' : 'border-white/10'}`}>
                  <Lock size={18} className="text-white/20" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="w-full p-4 bg-transparent outline-none text-white text-sm tracking-widest" 
                    placeholder="••••••••"
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 hover:text-green-400 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* ERREUR */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-xs font-bold flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOUTON */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-green-600 to-green-400 text-[#081908] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Accéder au Panel <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">
              Accès Privé Emma-Shop Boutique
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
