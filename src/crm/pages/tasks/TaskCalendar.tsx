import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Task } from '../../../store/types';
import { Button } from '../../ui';
import { TYPE_SHORT, addDays, isOverdue, sameDay, startOfDay, timeLabel } from './taskUtil';

export type CalMode = 'day' | 'week' | 'month';

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00–20:00

const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const byDue = (a: Task, b: Task) => +new Date(a.due) - +new Date(b.due);

function Chip({ task, onOpen, compact }: { task: Task; onOpen: (t: Task) => void; compact?: boolean }) {
  const cls = ['tasks-chip', isOverdue(task) && 'is-overdue', task.done && 'is-done'].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={() => onOpen(task)} title={`${TYPE_SHORT[task.type]}: ${task.text}`}>
      {!compact && <span className="tasks-chip__time tabular">{timeLabel(task.due)}</span>}
      <span className="tasks-chip__text">
        {TYPE_SHORT[task.type]}: {task.text}
      </span>
    </button>
  );
}

export function TaskCalendar({
  mode,
  anchor,
  setAnchor,
  setMode,
  tasks,
  onOpen,
  onAdd,
}: {
  mode: CalMode;
  anchor: Date;
  setAnchor: (d: Date) => void;
  setMode: (m: CalMode) => void;
  tasks: Task[];
  onOpen: (t: Task) => void;
  onAdd: (d: Date) => void;
}) {
  const today = new Date();
  const tasksOn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of [...tasks].sort(byDue)) {
      const k = startOfDay(new Date(t.due)).toDateString();
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    return (d: Date) => map.get(startOfDay(d).toDateString()) ?? [];
  }, [tasks]);

  const shift = (dir: 1 | -1) => {
    if (mode === 'day') setAnchor(addDays(anchor, dir));
    else if (mode === 'week') setAnchor(addDays(anchor, dir * 7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
  };

  let label: string;
  if (mode === 'day') {
    label = anchor.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else if (mode === 'week') {
    const a = mondayOf(anchor);
    const b = addDays(a, 6);
    label = `${a.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} – ${b.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  } else {
    label = anchor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="tasks-cal">
      <div className="tasks-cal__bar">
        <Button size="sm" icon={<ChevronLeft />} aria-label="Назад" onClick={() => shift(-1)} />
        <Button size="sm" onClick={() => setAnchor(new Date())}>
          Сегодня
        </Button>
        <Button size="sm" icon={<ChevronRight />} aria-label="Вперёд" onClick={() => shift(1)} />
        <h2 className="tasks-cal__label">{label}</h2>
      </div>

      {mode === 'month' && <MonthGrid anchor={anchor} today={today} tasksOn={tasksOn} onOpen={onOpen} onAdd={onAdd} onDay={(d) => { setAnchor(d); setMode('day'); }} />}

      {mode === 'week' && (
        <div className="tasks-week">
          {Array.from({ length: 7 }, (_, i) => addDays(mondayOf(anchor), i)).map((d, i) => {
            const list = tasksOn(d);
            return (
              <section key={i} className={`tasks-week__col${sameDay(d, today) ? ' is-today' : ''}`}>
                <header className="tasks-week__head">
                  <span>{WEEKDAYS[i]}</span>
                  <button type="button" className="tasks-week__date tabular" onClick={() => { setAnchor(d); setMode('day'); }}>
                    {d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </button>
                </header>
                <div className="tasks-week__body">
                  {list.map((t) => (
                    <Chip key={t.id} task={t} onOpen={onOpen} />
                  ))}
                  <button type="button" className="tasks-cal__add" onClick={() => onAdd(d)} aria-label="Добавить задачу на этот день">
                    <Plus aria-hidden="true" />
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {mode === 'day' && <DayGrid day={anchor} tasks={tasksOn(anchor)} onOpen={onOpen} onAdd={onAdd} />}
    </div>
  );
}

function MonthGrid({
  anchor,
  today,
  tasksOn,
  onOpen,
  onAdd,
  onDay,
}: {
  anchor: Date;
  today: Date;
  tasksOn: (d: Date) => Task[];
  onOpen: (t: Task) => void;
  onAdd: (d: Date) => void;
  onDay: (d: Date) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = mondayOf(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="tasks-month">
      {WEEKDAYS.map((w) => (
        <div key={w} className="tasks-month__wd">
          {w}
        </div>
      ))}
      {cells.map((d, i) => {
        const list = tasksOn(d);
        const out = d.getMonth() !== anchor.getMonth();
        const cls = ['tasks-month__cell', out && 'is-out', sameDay(d, today) && 'is-today'].filter(Boolean).join(' ');
        return (
          <div key={i} className={cls}>
            <div className="tasks-month__top">
              <button type="button" className="tasks-month__num tabular" onClick={() => onDay(d)} aria-label={`Открыть ${d.toLocaleDateString('ru-RU')}`}>
                {d.getDate()}
              </button>
              <button type="button" className="tasks-cal__add tasks-cal__add--mini" onClick={() => onAdd(d)} aria-label="Добавить задачу на этот день">
                <Plus aria-hidden="true" />
              </button>
            </div>
            {list.slice(0, 3).map((t) => (
              <Chip key={t.id} task={t} onOpen={onOpen} compact />
            ))}
            {list.length > 3 && (
              <button type="button" className="tasks-month__more" onClick={() => onDay(d)}>
                ещё {list.length - 3}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayGrid({ day, tasks, onOpen, onAdd }: { day: Date; tasks: Task[]; onOpen: (t: Task) => void; onAdd: (d: Date) => void }) {
  const allDay = tasks.filter((t) => {
    const d = new Date(t.due);
    return d.getHours() === 0 && d.getMinutes() === 0;
  });
  const timed = tasks.filter((t) => !allDay.includes(t));
  const atHour = (h: number) =>
    timed.filter((t) => {
      const hh = new Date(t.due).getHours();
      return Math.min(20, Math.max(8, hh)) === h;
    });
  return (
    <div className="tasks-day">
      <div className="tasks-day__row">
        <div className="tasks-day__hour">Весь день</div>
        <div className="tasks-day__slot">
          {allDay.map((t) => (
            <Chip key={t.id} task={t} onOpen={onOpen} />
          ))}
        </div>
      </div>
      {HOURS.map((h) => (
        <div key={h} className="tasks-day__row">
          <div className="tasks-day__hour tabular">{String(h).padStart(2, '0')}:00</div>
          <div className="tasks-day__slot">
            {atHour(h).map((t) => (
              <Chip key={t.id} task={t} onOpen={onOpen} />
            ))}
            <button
              type="button"
              className="tasks-cal__add tasks-cal__add--slot"
              onClick={() => onAdd(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h))}
              aria-label={`Добавить задачу на ${h}:00`}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="tasks-day__empty">На этот день задач нет. Можно перенести сюда парочку.</p>}
    </div>
  );
}
