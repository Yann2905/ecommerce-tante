'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ne rien rendre sur le serveur (évite le conflit Math.random())
  if (!mounted) return null;

  const particles = Array.from({ length: 15 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 5 + 2,
            height: Math.random() * 5 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: Math.random() > 0.5 ? '#C9A84C' : '#8B5E34',
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            y: [0, Math.random() * -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}