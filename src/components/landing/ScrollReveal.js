'use client';

import { useEffect } from 'react';

// Revela con una animación suave los elementos [data-reveal] al entrar en
// pantalla. No hace nada si el usuario pidió reducir movimiento; y si no hay JS,
// el contenido se ve normal (el CSS solo oculta cuando esta clase está puesta).
export default function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) return;

    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    document.documentElement.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    els.forEach((el) => {
      // Si ya está en pantalla al cargar, se muestra de una (sin parpadeo).
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) el.classList.add('is-visible');
      else io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return null;
}
