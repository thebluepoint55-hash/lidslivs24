import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check } from 'lucide-react';
import type { Task } from '../../../store/types';
import { useDemo, useStore } from '../../../store/store';
import { plural } from '../../ui';
import { TYPE_SHORT, dayLabel, forWhom, isOverdue, taskCtx, timeLabel } from './taskUtil';

export function Postpones({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="tasks-pp tabular">
      перенесено {n} {plural(n, ['раз', 'раза', 'раз'])}
    </span>
  );
}

// ---------- карточка задачи в канбане ----------

export function TaskCard({
  task,
  onComplete,
  onOpen,
  dragging,
  onPointerDown,
}: {
  task: Task;
  onComplete: (t: Task) => void;
  onOpen: (t: Task) => void;
  dragging?: boolean;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
}) {
  const demo = useDemo();
  const postponeTask = useStore((s) => s.postponeTask);
  const { deal, contact, company } = taskCtx(demo, task);
  const overdue = isOverdue(task);

  return (
    <article
      className={`tasks-card${task.done ? ' is-done' : ''}${dragging ? ' is-dragging' : ''}${onPointerDown && !task.done ? ' is-draggable' : ''}`}
      onPointerDown={task.done ? undefined : onPointerDown}
    >
      <div className="tasks-card__top">
        <span className={`tasks-card__date${overdue ? ' tasks-red' : ''}`}>{dayLabel(task.due)}</span>
        <span className="tasks-card__for">
          {timeLabel(task.due)}, для {forWhom(demo, task.responsibleId)}
        </span>
      </div>
      {(contact || company) && (
        <div className="tasks-card__who">
          {contact?.name}
          {company && (
            <span className="tasks-muted">
              {contact ? ', ' : ''}
              {company.name}
            </span>
          )}
        </div>
      )}
      {deal && (
        <Link className="tasks-card__deal" to={`/app/leads/${deal.id}`}>
          {deal.title}
        </Link>
      )}
      <button type="button" className="tasks-card__text" onClick={() => onOpen(task)}>
        <b>{TYPE_SHORT[task.type]}:</b> {task.text}
      </button>
      {task.done && task.result && <p className="tasks-card__result">Результат: {task.result}</p>}
      {(task.postpones > 0 || !task.done) && (
        <div className="tasks-card__foot">
          <Postpones n={task.postpones} />
          {!task.done && (
            <div className="tasks-card__actions" data-no-drag>
              <button type="button" className="tasks-qa" onClick={() => postponeTask(task.id)}>
                <CalendarClock aria-hidden="true" />
                Перенести
              </button>
              <button type="button" className="tasks-qa tasks-qa--muted" onClick={() => onComplete(task)}>
                <Check aria-hidden="true" />
                Выполнить
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ---------- строка со свайпом (телефон) ----------

const THRESHOLD = 84;
const MAX_FREE = 110;

export function SwipeRow({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  label,
  children,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  label: string;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const fg = useRef<HTMLDivElement>(null);
  const g = useRef({ id: -1, x0: 0, y0: 0, t0: 0, dx: 0, lock: null as null | 'x' | 'y' });

  const setX = (x: number, animate: boolean) => {
    const el = fg.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
    el.style.transform = x ? `translate3d(${x}px,0,0)` : '';
    const w = wrap.current;
    if (w) {
      w.dataset.dir = x < 0 ? 'left' : x > 0 ? 'right' : '';
      w.dataset.armed = Math.abs(x) >= THRESHOLD ? '1' : '';
    }
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (g.current.id !== -1 || (e.pointerType === 'mouse' && e.button !== 0)) return; // второй палец игнорируем
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, lock: null };
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (!s.lock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      s.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.lock === 'x') fg.current?.setPointerCapture(e.pointerId);
    }
    if (s.lock !== 'x') return;
    // после MAX_FREE — сопротивление, а не стена
    const a = Math.abs(dx);
    const damped = a <= MAX_FREE ? a : MAX_FREE + (a - MAX_FREE) * 0.3;
    s.dx = Math.sign(dx) * damped;
    setX(s.dx, false);
  };

  const end = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const s = g.current;
    if (e.pointerId !== s.id) return;
    g.current.id = -1;
    if (s.lock === 'x' && !cancelled) {
      const dt = Math.max(1, performance.now() - s.t0);
      const v = Math.abs(s.dx) / dt;
      const fire = Math.abs(s.dx) >= THRESHOLD || (v > 0.11 && Math.abs(s.dx) > 28);
      if (fire) (s.dx < 0 ? onSwipeLeft : onSwipeRight)();
    } else if (!s.lock && !cancelled) {
      onTap();
    }
    setX(0, true);
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap();
    }
  };

  return (
    <div className="tasks-swipe" ref={wrap}>
      <div className="tasks-swipe__bg tasks-swipe__bg--done" aria-hidden="true">
        <Check />
        Выполнить
      </div>
      <div className="tasks-swipe__bg tasks-swipe__bg--postpone" aria-hidden="true">
        Перенести
        <CalendarClock />
      </div>
      <div
        ref={fg}
        className="tasks-swipe__fg"
        role="button"
        tabIndex={0}
        aria-label={label}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => end(e)}
        onPointerCancel={(e) => end(e, true)}
        onKeyDown={key}
      >
        {children}
      </div>
    </div>
  );
}

export function MobileTaskRow({ task }: { task: Task }) {
  const demo = useDemo();
  const { deal, contact, company } = taskCtx(demo, task);
  const overdue = isOverdue(task);
  const who = [contact?.name, company?.name].filter(Boolean).join(', ');
  return (
    <div className="tasks-mrow">
      <div className="tasks-mrow__main">
        <p className="tasks-mrow__text">
          <b>{TYPE_SHORT[task.type]}:</b> {task.text}
        </p>
        {deal && <p className="tasks-mrow__deal">{deal.title}</p>}
        {who && <p className="tasks-mrow__who">{who}</p>}
      </div>
      <div className="tasks-mrow__side">
        <span className={overdue ? 'tasks-red' : undefined}>{dayLabel(task.due)}</span>
        <span className="tasks-muted">{timeLabel(task.due)}</span>
        <Postpones n={task.postpones} />
      </div>
    </div>
  );
}
