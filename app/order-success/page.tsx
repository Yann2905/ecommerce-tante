'use client';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#FFFDFB] flex items-center justify-center p-6 text-[#2D1B08]">

      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9A84C, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #8B5E34, transparent)', transform: 'translate(-30%, 30%)' }} />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full bg-white p-12 rounded-[4rem] shadow-2xl border border-[#F5E6D3] text-center space-y-8 relative z-10"
      >
        {/* Icône */}
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: 2, duration: 0.4, delay: 0.3 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'linear-gradient(135deg, #C9A84C22, #C9A84C08)' }}
        >
          <CheckCircle2 size={50} className="text-[#B48446]" />
        </motion.div>

        {/* Texte */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl font-serif font-black italic"
          >
            Merci !
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-[#5C3D2E] font-medium leading-relaxed italic opacity-70"
          >
            Votre commande a bien été transmise à Emma-Shop.<br />
            Préparez-vous à briller avec élégance !
          </motion.p>
        </div>

        {/* Prochaine étape */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-6 rounded-3xl space-y-2"
          style={{ background: '#FDF8F2', border: '1px solid #EAD8C0' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-[#B48446]">Prochaine étape</p>
          <p className="text-sm font-bold flex items-center justify-center gap-2 text-[#2D1B08]">
            <Smartphone size={16} className="text-[#C9A84C]" />
            Emma-Shop vous contactera sur WhatsApp
          </p>
        </motion.div>

        {/* Retour */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#8B5E34] font-black uppercase tracking-widest text-[10px] border-b-2 border-[#B48446] pb-1 hover:text-[#B48446] transition-colors"
          >
            <ArrowLeft size={14} /> Retourner à la collection
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
