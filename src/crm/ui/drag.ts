import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

/**
 * Перетаскивание карточек мышью, как в amoCRM: карточка поднимается и едет за курсором,
 * на старом месте остаётся след, цель под курсором подсвечивается.
 *
 * Цели помечаются атрибутом data-drop="<ключ>". Клик без движения работает как обычно,
 * клик после перетаскивания гасится. Касания не обрабатываются — на телефоне свои жесты.
 */

const THRESHOLD = 5;
const EDGE = 70;
const SPEED = 18;

interface Session {
  id: string;
  el: HTMLElement;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  px: number;
  py: number;
  started: boolean;
  float?: HTMLElement;
  raf?: number;
}

export function useBoardDrag({
  onDrop,
  scrollRef,
  disabled,
}: {
  onDrop: (id: string, target: string) => void;
  /** контейнер, который прокручивается по горизонтали, когда курсор у края */
  scrollRef?: RefObject<HTMLElement>;
  disabled?: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const session = useRef<Session | null>(null);
  const overRef = useRef<string | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const handlers = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void; key: (e: KeyboardEvent) => void }>();

  const setOverKey = (k: string | null) => {
    if (overRef.current === k) return;
    overRef.current = k;
    setOver(k);
  };

  const finish = () => {
    const s = session.current;
    if (h()) {
      window.removeEventListener('pointermove', h()!.move);
      window.removeEventListener('pointerup', h()!.up);
      window.removeEventListener('pointercancel', h()!.up);
      window.removeEventListener('keydown', h()!.key);
    }
    if (s?.raf) cancelAnimationFrame(s.raf);
    s?.float?.remove();
    document.body.classList.remove('is-board-dragging');
    session.current = null;
    overRef.current = null;
    setDragId(null);
    setOver(null);
  };
  const h = () => handlers.current;

  const hitTest = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return el?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
  };

  // автопрокрутка доски и колонок, пока курсор у края
  const tick = () => {
    const s = session.current;
    if (!s?.started) return;
    const board = scrollRef?.current;
    if (board) {
      const r = board.getBoundingClientRect();
      if (s.px < r.left + EDGE) board.scrollLeft -= SPEED;
      else if (s.px > r.right - EDGE) board.scrollLeft += SPEED;
    }
    const col = (document.elementFromPoint(s.px, s.py) as HTMLElement | null)?.closest<HTMLElement>('[data-drop-scroll]');
    if (col) {
      const r = col.getBoundingClientRect();
      if (s.py < r.top + EDGE) col.scrollTop -= SPEED * 0.7;
      else if (s.py > r.bottom - EDGE) col.scrollTop += SPEED * 0.7;
    }
    setOverKey(hitTest(s.px, s.py));
    s.raf = requestAnimationFrame(tick);
  };

  const start = (s: Session) => {
    s.started = true;
    const r = s.el.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'board-drag';
    const card = s.el.cloneNode(true) as HTMLElement;
    card.classList.add('board-drag__card');
    card.style.width = `${r.width}px`;
    float.appendChild(card);
    document.body.appendChild(float);
    s.float = float;
    document.body.classList.add('is-board-dragging');
    setDragId(s.id);
    s.raf = requestAnimationFrame(tick);
  };

  handlers.current = {
    move: (e) => {
      const s = session.current;
      if (!s) return;
      s.px = e.clientX;
      s.py = e.clientY;
      if (!s.started) {
        if (Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < THRESHOLD) return;
        start(s);
      }
      if (s.float) s.float.style.transform = `translate3d(${s.px - s.ox}px, ${s.py - s.oy}px, 0)`;
    },
    up: (e) => {
      const s = session.current;
      if (!s) return;
      if (!s.started) {
        finish();
        return;
      }
      // клик, который браузер пришлёт после отпускания, не должен открыть карточку
      const stop = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', stop, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
      const target = e.type === 'pointercancel' ? null : hitTest(e.clientX, e.clientY);
      const id = s.id;
      finish();
      if (target) onDropRef.current(id, target);
    },
    key: (e) => {
      if (e.key === 'Escape') finish();
    },
  };

  useEffect(() => () => finish(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const bind = (id: string) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0 || e.pointerType === 'touch') return;
      // за кнопки и ссылки внутри карточки тоже можно тащить (клик без движения работает как обычно),
      // а поля ввода и элементы с data-no-drag — нет
      if ((e.target as HTMLElement).closest('input, textarea, select, [data-no-drag]')) return;
      // без этого браузер начнёт выделять текст или потащит ссылку
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      session.current = {
        id,
        el: e.currentTarget,
        sx: e.clientX,
        sy: e.clientY,
        ox: e.clientX - r.left,
        oy: e.clientY - r.top,
        px: e.clientX,
        py: e.clientY,
        started: false,
      };
      window.addEventListener('pointermove', h()!.move);
      window.addEventListener('pointerup', h()!.up);
      window.addEventListener('pointercancel', h()!.up);
      window.addEventListener('keydown', h()!.key);
    },
  });

  return { dragId, over, bind };
}
