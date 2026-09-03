'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ShopChrome';

/**
 * Rangée de produits qui défile horizontalement.
 *
 * - Mobile : défilement tactile natif, avec accroche (scroll-snap).
 * - Desktop : glisser à la souris + flèches, masquées quand il n'y a rien à
 *   faire défiler.
 *
 * Le glisser souris ne doit pas déclencher la navigation de la carte produit :
 * au-delà de quelques pixels de déplacement, le clic qui suit est annulé.
 */
const DRAG_THRESHOLD_PX = 6;

export default function ProductCarousel({ products, eyebrow, title }: { products: any[]; eyebrow: string; title: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });

  const refreshArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    refreshArrows();
    // La largeur disponible change au redimensionnement comme au chargement des images.
    const observer = new ResizeObserver(refreshArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [refreshArrows, products]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    // Le tactile a déjà un défilement natif bien meilleur : on ne s'en mêle pas.
    if (event.pointerType === 'touch' || !trackRef.current) return;
    drag.current = { active: true, startX: event.clientX, startScroll: trackRef.current.scrollLeft, moved: 0 };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const track = trackRef.current;
    if (!drag.current.active || !track) return;
    const delta = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(delta));
    track.scrollLeft = drag.current.startScroll - delta;
  };

  const endDrag = () => { drag.current.active = false; };

  // Annule le clic qui suit un glisser, sinon relâcher la souris ouvrirait la fiche.
  const onClickCapture = (event: React.MouseEvent) => {
    if (drag.current.moved > DRAG_THRESHOLD_PX) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current.moved = 0;
  };

  if (!products.length) return null;

  return (
    <section className="mt-20 border-t border-[var(--line)] pt-12 md:mt-24 md:pt-14">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display mt-3 text-3xl md:text-4xl">{title}</h2>
        </div>
      </div>

      {/* Enveloppe positionnée : les flèches ne doivent pas défiler avec la rangée. */}
      <div className="relative mt-8">
      <div
        ref={trackRef}
        onScroll={refreshArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 md:gap-6"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23%] lg:w-[19%]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Même vocabulaire visuel que les flèches de la galerie photo, plus haut sur
          la page. Elles disparaissent au bout de la liste plutôt que de rester
          grisées : rien ne masque une image quand ça ne sert à rien. Le calage
          vertical vise la photo, pas la carte entière, pour épargner nom et prix. */}
      {canScrollLeft && (
        <button type="button" onClick={() => scrollByPage(-1)} aria-label="Voir les articles précédents"
          className="absolute left-2 top-1/3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-md transition hover:bg-white">
          <ChevronLeft size={19} />
        </button>
      )}
      {canScrollRight && (
        <button type="button" onClick={() => scrollByPage(1)} aria-label="Voir les articles suivants"
          className="absolute right-2 top-1/3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--ink)] shadow-md transition hover:bg-white">
          <ChevronRight size={19} />
        </button>
      )}
      </div>
    </section>
  );
}
