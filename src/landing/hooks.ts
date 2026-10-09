import { useEffect, useState, type RefObject } from 'react';

function readMedia(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

/** Подписка на media query */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => readMedia(query));

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** true, пока элемент хотя бы частично на экране */
export function useInView(ref: RefObject<Element>, rootMargin = '0px', initial = false): boolean {
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

/** true, пока вкладка видима */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

/** Склонение: 1 сделка, 2 сделки, 5 сделок */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const rub = new Intl.NumberFormat('ru-RU');
export function money(n: number): string {
  return `${rub.format(n)} ₽`;
}
