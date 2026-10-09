import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileLock2 } from 'lucide-react';
import { useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import './tour.css';

interface Step {
  id: string;
  /** селекторы цели по приоритету; пусто — карточка по центру */
  selectors: string[];
  title: string;
  text: string;
  /** текст, если цель нашлась во вкладках телефона */
  mobileText?: string;
  navigate?: string;
  /** сколько ждать появления цели (ленивые страницы грузятся не сразу) */
  wait?: number;
}

const STEPS: Step[] = [
  {
    id: 'leads',
    selectors: ['.sidebar .navitem[href="#/app/leads"]', '.tabbar__item[href="#/app/leads"]'],
    title: 'Сделки',
    text: 'Это воронка. Лиды приходят сюда, чтобы уйти.',
    navigate: '/app/leads',
  },
  {
    id: 'anti',
    selectors: ['.shell__content .btn--anti'],
    title: 'Ваш главный инструмент',
    text: 'Коралловая кнопка уводит клиента от покупки. На экране она всегда одна. Нажимайте её чаще, чем синюю.',
    wait: 2500,
  },
  {
    id: 'otmaz',
    selectors: ['.otmaz-fab'],
    title: 'Ассистент «Отмаз»',
    text: 'Придумает, почему вы не перезвонили, и напишет письмо, на которое клиент не ответит.',
  },
  {
    id: 'market',
    selectors: ['.sidebar .navitem[href="#/app/market"]', '.tabbar__item[href="#/app/more"]'],
    title: 'СливМаркет',
    text: 'Приложения, которые теряют клиентов без вашего участия. Начните с «Холодильника лидов».',
    mobileText: 'СливМаркет живёт во вкладке «Ещё». Там приложения, которые теряют клиентов без вашего участия.',
  },
  {
    id: 'final',
    selectors: [],
    title: 'Счёт спрятан',
    text: 'Надеемся, вы его не найдёте.',
  },
];

const PAD = 6;
const GAP = 14;
const EDGE = 12;

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none';
}

function findTarget(selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    const els = Array.from(document.querySelectorAll<HTMLElement>(sel));
    const el = els.find(visible);
    if (el) return el;
  }
  return null;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const sameBox = (a: Box | null, b: Box | null) =>
  !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

export default function Tour() {
  const tourDone = useStore((s) => s.demo?.ui.tourDone ?? true);
  const finishTour = useStore((s) => s.finishTour);
  const navigate = useNavigate();
  const loc = useLocation();

  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [nonce, setNonce] = useState(0);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const pathRef = useRef(loc.pathname);
  pathRef.current = loc.pathname;

  const step = STEPS[idx];

  // старт с небольшой паузой, чтобы интерфейс успел отрисоваться
  useEffect(() => {
    if (tourDone) {
      setActive(false);
      return;
    }
    const t = window.setTimeout(() => setActive(true), 900);
    return () => clearTimeout(t);
  }, [tourDone]);

  const close = useCallback(
    (how: 'finish' | 'postpone') => {
      setActive(false);
      finishTour();
      toast(
        how === 'finish' ? 'Обучение пройдено. Теперь вы опасны для выручки' : 'Обучение перенесено на завтра. Завтра тоже перенесём',
        how === 'finish' ? 'success' : 'default',
      );
    },
    [finishTour],
  );

  const next = useCallback(() => {
    if (idx >= STEPS.length - 1) close('finish');
    else setIdx((i) => i + 1);
  }, [idx, close]);

  // поиск цели шага; если не нашлась — шаг пропускается
  useEffect(() => {
    if (!active) return;
    setTarget(null);
    if (step.navigate && pathRef.current !== step.navigate) navigate(step.navigate);
    if (step.selectors.length === 0) {
      setBox(null);
      return;
    }
    const started = Date.now();
    const limit = step.wait ?? 1200;
    let timer = 0;
    const tryFind = () => {
      const el = findTarget(step.selectors);
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        setTarget(el);
        return;
      }
      if (Date.now() - started > limit) {
        setIdx((i) => Math.min(i + 1, STEPS.length - 1));
        return;
      }
      timer = window.setTimeout(tryFind, 100);
    };
    tryFind();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idx, nonce]);

  // следим за положением цели (скролл, ресайз, перестройка страницы)
  useEffect(() => {
    if (!active || !target) return;
    let raf = 0;
    let last: Box | null = null;
    const tick = () => {
      if (!target.isConnected || !visible(target)) {
        setNonce((n) => n + 1);
        return;
      }
      const r = target.getBoundingClientRect();
      const b = {
        top: Math.round(r.top - PAD),
        left: Math.round(r.left - PAD),
        width: Math.round(r.width + PAD * 2),
        height: Math.round(r.height + PAD * 2),
      };
      if (!sameBox(b, last)) {
        last = b;
        setBox(b);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  // позиция карточки рядом с целью
  useLayoutEffect(() => {
    if (!active) return;
    const c = card.current;
    if (!c) return;
    const cw = c.offsetWidth;
    const ch = c.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clampX = (x: number) => Math.max(EDGE, Math.min(x, vw - cw - EDGE));
    const clampY = (y: number) => Math.max(EDGE, Math.min(y, vh - ch - EDGE));
    if (!box || step.selectors.length === 0) {
      setCardPos({ top: Math.round((vh - ch) / 2), left: Math.round((vw - cw) / 2) });
      return;
    }
    const right = box.left + box.width + GAP;
    const below = box.top + box.height + GAP;
    let pos: { top: number; left: number };
    if (right + cw <= vw - EDGE && box.width < vw / 3) {
      pos = { top: clampY(box.top + box.height / 2 - ch / 2), left: right };
    } else if (below + ch <= vh - EDGE) {
      pos = { top: below, left: clampX(box.left + box.width / 2 - cw / 2) };
    } else if (box.top - GAP - ch >= EDGE) {
      pos = { top: box.top - GAP - ch, left: clampX(box.left + box.width / 2 - cw / 2) };
    } else {
      pos = { top: clampY(box.top + box.height / 2 - ch / 2), left: clampX(box.left - GAP - cw) };
    }
    setCardPos((p) => (p && p.top === pos.top && p.left === pos.left ? p : pos));
  }, [active, box, idx, step.selectors.length]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) close('postpone');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, close]);

  useEffect(() => {
    if (active && (target || step.selectors.length === 0)) nextBtn.current?.focus({ preventScroll: true });
  }, [active, target, step.selectors.length]);

  if (!active || tourDone) return null;

  const isFinal = step.selectors.length === 0;
  const waiting = !isFinal && !target;
  const onTabbar = !!target?.classList.contains('tabbar__item');
  const text = onTabbar && step.mobileText ? step.mobileText : step.text;

  // финальный шаг: «прожектор» схлопывается в центр, затемняя весь экран
  const spot: Box =
    !isFinal && box
      ? box
      : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

  return createPortal(
    <div className={`tour${waiting ? ' is-waiting' : ''}`}>
      <div
        className={`tour-spot${isFinal ? ' is-final' : ''}`}
        style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        aria-hidden="true"
      />
      <div
        ref={card}
        className={`tour-card${isFinal ? ' tour-card--final' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { visibility: 'hidden' }}
      >
        {isFinal && (
          <span className="tour-card__seal" aria-hidden="true">
            <FileLock2 size={26} strokeWidth={1.6} />
          </span>
        )}
        <h2 className="tour-card__title" id="tour-title">
          {step.title}
        </h2>
        <p className="tour-card__text" id="tour-text">
          {text}
        </p>
        <span className="tour-dots" role="img" aria-label={`Шаг ${idx + 1} из ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <i key={s.id} className={i === idx ? 'is-on' : i < idx ? 'is-past' : ''} />
          ))}
        </span>
        <div className="tour-card__foot">
          <button className="tour-card__later" onClick={() => close('postpone')}>
            Перенести обучение на завтра
          </button>
          <button ref={nextBtn} className="btn btn--primary" onClick={next} disabled={waiting}>
            {isFinal ? 'Начать сливать' : 'Дальше'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
