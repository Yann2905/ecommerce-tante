'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIosDevice());
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      setShowHelp(true);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (installed) return null;

  return <>
    <button type="button" onClick={install} className="flex items-center gap-2 border border-[var(--olive)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--olive)] transition hover:bg-[var(--olive)] hover:text-white">
      {ios ? <Share2 size={14} /> : <Download size={14} />}
      <span className="hidden sm:inline">Installer l’app</span>
      <span className="sm:hidden">Installer</span>
    </button>
    {showHelp && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="w-full max-w-sm bg-[var(--paper)] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Accès rapide</p><h2 id="install-title" className="display mt-2 text-3xl">Installer Emmaashop.</h2></div><button type="button" onClick={() => setShowHelp(false)} aria-label="Fermer" className="text-[var(--muted)]"><X size={18}/></button></div>
        {ios ? <p className="mt-6 text-sm leading-7 text-[var(--muted)]">Dans Safari, appuie sur <strong className="text-[var(--ink)]">Partager</strong>, puis choisis <strong className="text-[var(--ink)]">Sur l’écran d’accueil</strong> et confirme avec <strong className="text-[var(--ink)]">Ajouter</strong>.</p> : <p className="mt-6 text-sm leading-7 text-[var(--muted)]">Ouvre le menu de ton navigateur, puis choisis <strong className="text-[var(--ink)]">Installer l’application</strong> ou <strong className="text-[var(--ink)]">Ajouter à l’écran d’accueil</strong>.</p>}
        <button type="button" onClick={() => setShowHelp(false)} className="btn-primary mt-6 w-full">J’ai compris</button>
      </div>
    </div>}
  </>;
}
