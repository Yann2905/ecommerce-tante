/**
 * Logo Emmaashop : emblème monogramme (E) + nom.
 * - `variant="dark"`  → texte foncé (pour fonds clairs, ex. navbar)
 * - `variant="light"` → texte crème (pour fonds sombres, ex. footer)
 * - `showText={false}` → emblème seul (favicon-like)
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="emmaGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EBCB74" />
          <stop offset="0.5" stopColor="#C9A84C" />
          <stop offset="1" stopColor="#A9863A" />
        </linearGradient>
        <linearGradient id="emmaBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2D1B08" />
          <stop offset="1" stopColor="#1A0800" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="118" fill="url(#emmaBg)" />
      <circle cx="256" cy="256" r="190" fill="none" stroke="url(#emmaGold)" strokeWidth="8" opacity="0.55" />
      <circle cx="256" cy="256" r="172" fill="none" stroke="url(#emmaGold)" strokeWidth="3" opacity="0.35" />
      <text x="258" y="272" textAnchor="middle" dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="700"
        fontSize="270" fill="url(#emmaGold)">E</text>
    </svg>
  );
}

export function Logo({
  size = 40,
  showText = true,
  variant = 'dark',
  className = '',
}: {
  size?: number;
  showText?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const nameColor = variant === 'light' ? '#FFFDFB' : '#8B5E34';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="leading-none">
          <span
            className="block font-serif italic font-black tracking-tight"
            style={{ fontSize: Math.round(size * 0.44), color: nameColor }}
          >
            Emmaashop
          </span>
          <span className="block font-black uppercase text-[#C9A84C]"
            style={{ fontSize: Math.max(7, Math.round(size * 0.17)), letterSpacing: '0.22em', marginTop: 2 }}>
            Boutique Exclusive
          </span>
        </span>
      )}
    </span>
  );
}
