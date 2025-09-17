import { useEffect } from 'react';

const DEFAULT_DEPENDENCIES = [];

export default function useRevealOnScroll(...deps) {
  const dependencies = deps.length > 0 ? deps : DEFAULT_DEPENDENCIES;
  const trigger = dependencies.length
    ? dependencies.map((dep) => String(dep ?? 'null')).join('|')
    : 'static';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const elements = Array.from(document.querySelectorAll('[data-animate]'));
    if (!elements.length) return undefined;

    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    if (prefersReducedMotion) {
      elements.forEach((el) => el.setAttribute('data-animate-ready', ''));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            entry.target.setAttribute('data-animate-ready', '');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    elements.forEach((el) => {
      if (el.hasAttribute('data-animate-ready')) return;
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [trigger]);
}
