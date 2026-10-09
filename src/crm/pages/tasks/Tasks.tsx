import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, ChevronDown, Columns3, List, Plus, SlidersHorizontal } from 'lucide-react';
import type { Task } from '../../../store/types';
import { fmtDay, managerName, nextHoliday, useDemo, useStore } from '../../../store/store';
import { Button, Empty, Menu, PageHeader, plural, useBoardDrag, useIsMobile } from '../../ui';
import { AddTaskModal, CompleteTaskModal, TaskSheet } from './TaskModals';
import { MobileTaskRow, Postpones, SwipeRow, TaskCard } from './TaskViews';
import { TaskCalendar, type CalMode } from './TaskCalendar';
import { TYPE_SHORT, bucketOf, dayLabel, isOverdue, taskCtx, timeLabel, type Bucket } from './taskUtil';
import './tasks.css';

type View = 'kanban' | 'list' | CalMode;
type Filter = 'open' | 'mine' | 'overdue' | 'done';

const FILTERS: Record<Filter, string> = {
  open: 'Открытые задачи',
  mine: 'Мои задачи',
  overdue: 'Просроченные',
  done: 'Выполненные',
};

const COLUMNS: { id: Bucket; title: string; mobile: string; color: string; sub?: string; empty: string }[] = [
  { id: 'overdue', title: 'Просроченные задачи', mobile: 'Просроченные', color: 'var(--danger)', sub: 'гордость отдела', empty: 'Просрочек нет. Непорядок' },
  { id: 'today', title: 'Задачи на сегодня', mobile: 'Сегодня', color: 'var(--success)', empty: 'На сегодня ничего. Так и задумано' },
  { id: 'tomorrow', title: 'Задачи на завтра', mobile: 'Завтра', color: '#99ccff', empty: 'Завтра пока свободно. Перенесите сюда что-нибудь' },
  { id: 'later', title: 'После праздников', mobile: 'Позже', color: '#ffcccc', empty: 'Праздники ещё не наступили' },
];

const byDue = (a: Task, b: Task) => +new Date(a.due) - +new Date(b.due);

/** Новый срок задачи по месту, куда её бросили: колонка канбана или день/час календаря */
function dueForDrop(task: Task, target: string): { due: string; message: string } | null {
  const cur = new Date(task.due);
  const at = (d: Date, h = cur.getHours(), m = cur.getMinutes()) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x;
  };
  const today = new Date();
  if (target === 'col-overdue') {
    const d = at(new Date(today.getTime() - 86400_000));
    return { due: d.toISOString(), message: 'Задача сразу просрочена. Экономим время на ожидании' };
  }
  if (target === 'col-today') {
    // 18:00, а если этот час уже прошёл — через час, но не позже конца дня
    let d = at(today, 18, 0);
    if (d.getTime() <= today.getTime()) {
      const endOfDay = at(today, 23, 59);
      d = new Date(Math.min(today.getTime() + 3600_000, endOfDay.getTime()));
    }
    return { due: d.toISOString(), message: 'Задача на сегодня. Смело, но её всегда можно перенести' };
  }
  if (target === 'col-tomorrow') {
    const d = at(new Date(today.getTime() + 86400_000), 10, 0);
    return { due: d.toISOString(), message: 'Перенесено на завтра. Классика жанра' };
  }
  if (target === 'col-later') {
    const h = nextHoliday();
    return { due: h.date.toISOString(), message: `Перенесено на после праздника «${h.name}». Так держать` };
  }
  const m = /^day-(\d{4})-(\d{2})-(\d{2})(?:-(\d{2}))?$/.exec(target);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    const due = m[4] ? at(d, +m[4], 0) : at(d);
    const later = due.getTime() > cur.getTime();
    return {
      due: due.toISOString(),
      message: later ? `Срок перенесён на ${fmtDay(due.toISOString())}. Клиент подождёт` : `Срок сдвинут на ${fmtDay(due.toISOString())}. Не перестарайтесь`,
    };
  }
  return null;
}

export default function Tasks() {
  const demo = useDemo();
  const postponeAllTasks = useStore((s) => s.postponeAllTasks);
  const postponeTask = useStore((s) => s.postponeTask);
  const moveTask = useStore((s) => s.moveTask);
  const isMobile = useIsMobile();

  // перетаскивание задач мышью между колонками и днями календаря
  const drag = useBoardDrag({
    disabled: isMobile,
    onDrop: (id, target) => {
      const t = demo.tasks.find((x) => x.id === id);
      if (!t || t.done) return;
      const r = dueForDrop(t, target);
      if (r) moveTask(id, r.due, r.message);
    },
  });

  const [view, setView] = useState<View>('kanban');
  const [filter, setFilter] = useState<Filter>('open');
  const [query, setQuery] = useState('');
  const [anchor, setAnchor] = useState(() => new Date());
  const [adding, setAdding] = useState<{ date?: Date } | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demo.tasks
      .filter((t) => {
        if (filter === 'done') return t.done;
        if (t.done) return false;
        if (filter === 'mine') return t.responsibleId === 'you';
        if (filter === 'overdue') return isOverdue(t);
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        const { deal, contact, company } = taskCtx(demo, t);
        return [t.text, deal?.title, contact?.name, company?.name].some((s) => s?.toLowerCase().includes(q));
      })
      .sort(byDue);
  }, [demo, filter, query]);

  const buckets = useMemo(() => {
    const now = Date.now();
    const b: Record<Bucket, Task[]> = { overdue: [], today: [], tomorrow: [], later: [] };
    for (const t of tasks) b[bucketOf(t, now)].push(t);
    return b;
  }, [tasks]);

  const sheetTask = demo.tasks.find((t) => t.id === sheetId) ?? null;
  const completeTaskObj = demo.tasks.find((t) => t.id === completeId) ?? null;
  const openSheet = (t: Task) => setSheetId(t.id);
  const askComplete = (t: Task) => setCompleteId(t.id);

  const viewSwitch = (
    <div className="tasks-switches">
      <div className="tasks-seg" role="group" aria-label="Вид">
        <button type="button" className="tasks-seg__btn tasks-seg__btn--icon" aria-pressed={view === 'kanban'} onClick={() => setView('kanban')} title="Канбан">
          <Columns3 aria-hidden="true" />
          <span className="sr-only">Канбан</span>
        </button>
        <button type="button" className="tasks-seg__btn tasks-seg__btn--icon" aria-pressed={view === 'list'} onClick={() => setView('list')} title="Список">
          <List aria-hidden="true" />
          <span className="sr-only">Список</span>
        </button>
      </div>
      <div className="tasks-seg" role="group" aria-label="Календарь">
        {(['day', 'week', 'month'] as CalMode[]).map((m) => (
          <button key={m} type="button" className="tasks-seg__btn" aria-pressed={view === m} onClick={() => setView(m)}>
            {m === 'day' ? 'День' : m === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>
      <Menu
        items={(Object.keys(FILTERS) as Filter[]).map((f) => ({
          label: FILTERS[f],
          icon: f === filter ? <Check /> : <span style={{ width: 16 }} />,
          onClick: () => setFilter(f),
        }))}
        trigger={(p) => (
          <button type="button" className="tasks-filter" {...p}>
            <SlidersHorizontal aria-hidden="true" />
            {filter === 'open' ? 'Фильтр' : FILTERS[filter]}
            <ChevronDown aria-hidden="true" className="tasks-filter__chev" />
          </button>
        )}
      />
    </div>
  );

  const count = `${tasks.length} ${plural(tasks.length, ['задача', 'задачи', 'задач'])}`;

  return (
    <div className="tasks-page">
      <PageHeader
        title="Задачи"
        titleExtra={!isMobile && viewSwitch}
        search={query}
        onSearch={setQuery}
        meta={count}
        actions={
          <>
            <Button variant="anti" icon={<CalendarClock />} onClick={() => postponeAllTasks()}>
              Перенести все на завтра
            </Button>
            <Button variant="primary" icon={<Plus />} keepMobile onClick={() => setAdding({})} aria-label="Добавить задачу">
              {isMobile ? null : 'Добавить задачу'}
            </Button>
          </>
        }
      />

      {isMobile ? (
        <MobileTasks
          buckets={buckets}
          filter={filter}
          setFilter={setFilter}
          onPostponeAll={() => postponeAllTasks()}
          onOpen={openSheet}
          onComplete={askComplete}
          onPostpone={(t) => postponeTask(t.id)}
        />
      ) : view === 'kanban' ? (
        <div className={`tasks-board${drag.dragId ? ' is-dragging' : ''}`}>
          {COLUMNS.map((col) => {
            const list = buckets[col.id];
            const key = `col-${col.id}`;
            return (
              <section
                key={col.id}
                className={`tasks-col${drag.over === key ? ' is-over' : ''}`}
                aria-label={col.title}
                data-drop={key}
              >
                <header className="tasks-col__head">
                  <h2 className="tasks-col__title">{col.title}</h2>
                  <p className="tasks-col__sub tabular">
                    {list.length} {plural(list.length, ['задача', 'задачи', 'задач'])}
                    {col.sub && list.length > 0 && <span className="tasks-col__pride"> · {col.sub}</span>}
                  </p>
                  <span className="tasks-col__line" style={{ background: col.color }} />
                </header>
                <div className="tasks-col__body" data-drop-scroll>
                  {list.length === 0 && <p className="tasks-col__empty">{col.empty}</p>}
                  {list.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={askComplete}
                      onOpen={openSheet}
                      dragging={drag.dragId === t.id}
                      onPointerDown={drag.bind(t.id).onPointerDown}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : view === 'list' ? (
        <TaskTable tasks={tasks} onOpen={openSheet} onComplete={askComplete} />
      ) : (
        <TaskCalendar
          mode={view}
          setMode={setView}
          anchor={anchor}
          setAnchor={setAnchor}
          tasks={tasks}
          onOpen={openSheet}
          onAdd={(d) => setAdding({ date: d })}
          drag={drag}
        />
      )}

      <AddTaskModal open={!!adding} defaultDate={adding?.date} onClose={() => setAdding(null)} />
      <TaskSheet task={sheetTask} onClose={() => setSheetId(null)} onComplete={askComplete} />
      <CompleteTaskModal task={completeTaskObj} onClose={() => setCompleteId(null)} />
    </div>
  );
}

// ---------- список (таблица) ----------

function TaskTable({ tasks, onOpen, onComplete }: { tasks: Task[]; onOpen: (t: Task) => void; onComplete: (t: Task) => void }) {
  const demo = useDemo();
  const postponeTask = useStore((s) => s.postponeTask);
  if (tasks.length === 0) {
    return <Empty icon={<CalendarClock size={40} aria-hidden="true" />} title="К счастью, задач не найдено" />;
  }
  return (
    <div className="table-wrap">
      <table className="table tasks-table">
        <thead>
          <tr>
            <th>Дата исполнения</th>
            <th>Безответственный</th>
            <th>Объект</th>
            <th>Тип и текст задачи</th>
            <th className="num">Переносов</th>
            <th aria-label="Действия" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const { deal, contact } = taskCtx(demo, t);
            const overdue = isOverdue(t);
            return (
              <tr key={t.id}>
                <td className={overdue ? 'tasks-red' : undefined}>
                  {dayLabel(t.due)} <span className={overdue ? undefined : 'tasks-muted'}>{timeLabel(t.due)}</span>
                </td>
                <td>{managerName(demo, t.responsibleId)}</td>
                <td className="tasks-table__obj">
                  {deal ? <Link to={`/app/leads/${deal.id}`}>{deal.title}</Link> : contact?.name ?? <span className="tasks-muted">—</span>}
                </td>
                <td className="tasks-table__text">
                  <button type="button" className="linkbtn tasks-table__open" onClick={() => onOpen(t)}>
                    <b>{TYPE_SHORT[t.type]}:</b> {t.text}
                  </button>
                  {t.done && t.result && <span className="tasks-muted"> · {t.result}</span>}
                </td>
                <td className="num">{t.postpones > 0 ? <Postpones n={t.postpones} /> : <span className="tasks-muted">0</span>}</td>
                <td className="tasks-table__actions">
                  {!t.done && (
                    <>
                      <button type="button" className="tasks-qa" onClick={() => postponeTask(t.id)}>
                        <CalendarClock aria-hidden="true" />
                        Перенести
                      </button>
                      <button type="button" className="tasks-qa tasks-qa--muted" onClick={() => onComplete(t)}>
                        <Check aria-hidden="true" />
                        Выполнить
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- телефон: список по группам со свайпами ----------

function MobileTasks({
  buckets,
  filter,
  setFilter,
  onPostponeAll,
  onOpen,
  onComplete,
  onPostpone,
}: {
  buckets: Record<Bucket, Task[]>;
  filter: Filter;
  setFilter: (f: Filter) => void;
  onPostponeAll: () => void;
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
  onPostpone: (t: Task) => void;
}) {
  const total = COLUMNS.reduce((n, c) => n + buckets[c.id].length, 0);
  return (
    <div className="tasks-mobile">
      <div className="tasks-mobile__filters" role="group" aria-label="Фильтр">
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <button key={f} type="button" className="tasks-pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {FILTERS[f]}
          </button>
        ))}
      </div>
      {filter !== 'done' && (
        <div className="tasks-mobile__hero">
          <Button variant="anti" block icon={<CalendarClock />} onClick={onPostponeAll}>
            Перенести все на завтра
          </Button>
          <p className="tasks-hint">Свайп влево переносит задачу, вправо закрывает её.</p>
        </div>
      )}
      {total === 0 && <Empty icon={<CalendarClock size={40} aria-hidden="true" />} title="К счастью, задач не найдено" />}
      {COLUMNS.map((col) => {
        const list = buckets[col.id];
        if (list.length === 0) return null;
        return (
          <section key={col.id} className="tasks-group" aria-label={col.mobile}>
            <h2 className="tasks-group__title">
              <span className="tasks-group__dot" style={{ background: col.color }} />
              {col.mobile}
              <span className="tasks-muted tabular">{list.length}</span>
              {col.sub && <span className="tasks-group__pride">{col.sub}</span>}
            </h2>
            <div className="tasks-group__list">
              {list.map((t) =>
                t.done ? (
                  <button key={t.id} type="button" className="tasks-mrow-btn" onClick={() => onOpen(t)}>
                    <MobileTaskRow task={t} />
                  </button>
                ) : (
                  <SwipeRow
                    key={t.id}
                    label={`${TYPE_SHORT[t.type]}: ${t.text}`}
                    onTap={() => onOpen(t)}
                    onSwipeLeft={() => onPostpone(t)}
                    onSwipeRight={() => onComplete(t)}
                  >
                    <MobileTaskRow task={t} />
                  </SwipeRow>
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
