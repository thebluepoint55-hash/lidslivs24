import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Bell, Droplet, Menu as MenuIcon, Medal, Search, Settings2, Snowflake, X } from 'lucide-react';
import { displayBudget, displayTemperature, managerName, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import type { DemoState } from '../../../store/types';
import { Avatar, fmtDate, fmtRelDay, money, plural } from '../../ui';
import { ChartTip } from '../stats/charts';
import {
  callStatus,
  defaultCustom,
  inRange,
  isActive,
  isLost,
  isWon,
  lastIncident,
  lossBuckets,
  nf,
  pct,
  people,
  periodRange,
  type CustomRange,
  type PeriodKey,
} from '../stats/metrics';
import './dashboard.css';

type DashPeriod = Extract<PeriodKey, 'today' | 'yesterday' | 'week' | 'month' | 'custom'>;
type Who = 'all' | 'mine';

const PERIODS: { id: DashPeriod; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'yesterday', label: 'Вчера' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'custom', label: 'Период' },
];

const SETUP_JOKES = [
  'Рабочий стол уже настроен оптимально: на нём нет ни одной продажи',
  'Настройки виджетов на согласовании у Арсения Согласуева',
  'Добавить виджет «Выручка» нельзя: такого показателя в системе нет',
];

export default function Dashboard() {
  const demo = useDemo();
  const [period, setPeriod] = useState<DashPeriod>('month');
  const [custom, setCustom] = useState<CustomRange>(defaultCustom);
  const [who, setWho] = useState<Who>('all');
  const [drawer, setDrawer] = useState(false);
  const jokeIdx = useRef(0);

  const m = useMemo(() => compute(demo, period, custom, who), [demo, period, custom, who]);
  const unread = demo.notifications.filter((n) => !n.read).length;

  return (
    <div className="dash">
      <div className="dash-scene" aria-hidden="true" />
      <header className="dash-top">
        <Link to="/app/dashboard" className="dash-logo" aria-label="ЛидСливс24, рабочий стол">
          <Droplet aria-hidden="true" />
          <span>
            ЛидСливс<b>24</b>
          </span>
        </Link>
        <DealSearch />
        <button type="button" className="dash-events-btn" onClick={() => setDrawer(true)} aria-haspopup="dialog">
          <MenuIcon aria-hidden="true" />
          <span className="dash-events-btn__text">События</span>
          {unread > 0 && (
            <span className="dash-events-btn__badge" aria-label={`${unread} непрочитанных`}>
              {unread}
            </span>
          )}
        </button>
      </header>

      <div className="dash-hero">
        <h1 className="dash-account">{demo.settings.accountName}</h1>
        <div className="dash-controls">
          <div className="dash-pills" role="group" aria-label="Период">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`dash-pill${period === p.id ? ' is-active' : ''}`}
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="dash-pills" role="group" aria-label="Чьи сделки">
            <button
              type="button"
              className={`dash-pill${who === 'all' ? ' is-active' : ''}`}
              aria-pressed={who === 'all'}
              onClick={() => setWho('all')}
            >
              Все
            </button>
            <button
              type="button"
              className={`dash-pill${who === 'mine' ? ' is-active' : ''}`}
              aria-pressed={who === 'mine'}
              onClick={() => setWho('mine')}
            >
              Мои
            </button>
          </div>
          <button
            type="button"
            className="dash-setup"
            onClick={() => {
              toast(SETUP_JOKES[jokeIdx.current % SETUP_JOKES.length]);
              jokeIdx.current += 1;
            }}
          >
            <Settings2 aria-hidden="true" />
            Настроить
          </button>
        </div>
        {period === 'custom' && (
          <div className="dash-dates">
            <label>
              <span>с</span>
              <input
                type="date"
                value={custom.from}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
              />
            </label>
            <label>
              <span>по</span>
              <input type="date" value={custom.to} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))} />
            </label>
          </div>
        )}
      </div>

      <div className="dash-grid">
        <Tile title="Просроченные задачи" className="dash-tile--num">
          <BigNum value={m.overdue} tone="violet" />
          <p className="dash-sub">рекорд отдела</p>
        </Tile>

        <Tile title="Перенесено задач" className="dash-tile--num">
          <BigNum value={m.postponed} tone="violet" />
          <p className="dash-sub">{m.youPostponed > 0 ? `из них вами: ${nf(m.youPostponed)}` : 'вы пока не переносили. Пора начать'}</p>
        </Tile>

        <Tile title="Лидов слито" className="dash-tile--num">
          <BigNum value={m.slit} tone="green" />
          <p className="dash-sub">{m.slit > 0 ? `на ${money(m.slitSum)}` : 'за период никого. Подозрительно'}</p>
        </Tile>

        <Tile title="Конверсия в отказ" className="dash-tile--num">
          <BigNum value={m.conversion} tone="green" suffix="%" />
          <p className="dash-sub">
            {m.closed === 0
              ? 'никто не купил, значит 100%'
              : `${nf(m.slit)} из ${nf(m.closed)} ${plural(m.closed, ['закрытой', 'закрытых', 'закрытых'])}`}
          </p>
        </Tile>

        <Tile title="Источники слива" className="dash-tile--donut">
          {m.reasons.length === 0 ? (
            <p className="dash-empty">За период никого не слили. Руководитель ждёт объяснений.</p>
          ) : (
            <div className="dash-donut">
              <div className="dash-donut__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.reasons.map((r) => ({ name: r.bucket.label, value: r.count, color: r.bucket.color }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="66%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="#10243c"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {m.reasons.map((r) => (
                        <Cell key={r.bucket.id} fill={r.bucket.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTip dark format={(v) => `${nf(v)} · ${pct((v / m.slit) * 100)}`} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-donut__center">
                  <span className="dash-donut__num">{nf(m.slit)}</span>
                  <span className="dash-donut__cap">{plural(m.slit, ['лид', 'лида', 'лидов'])}</span>
                </div>
              </div>
              <ul className="dash-legend">
                {m.reasons.map((r) => (
                  <li key={r.bucket.id} title={r.examples.join('\n')}>
                    <span className="dash-legend__key" style={{ background: r.bucket.color }} aria-hidden="true" />
                    <span className="dash-legend__name">{r.bucket.label}</span>
                    <span className="dash-legend__val">{nf(r.count)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tile>

        <Tile title="Сделки по менеджерам" className="dash-tile--tall" aside={<span className="dash-tile__hint">слито</span>}>
          <ol className="dash-rank">
            {m.ranking.map((r, i) => (
              <li key={r.id} className={r.id === 'you' ? 'is-you' : undefined}>
                <span className="dash-rank__pos">
                  {i === 0 && r.count > 0 ? (
                    <Medal aria-label="Первое место" className="dash-rank__medal" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <Avatar name={r.name} color={r.color} size={28} />
                <span className="dash-rank__body">
                  <span className="dash-rank__name">{r.name}</span>
                  <span className="dash-rank__track">
                    <span className="dash-rank__fill" style={{ transform: `scaleX(${m.rankMax ? r.count / m.rankMax : 0})` }} />
                  </span>
                </span>
                <span className="dash-rank__val">{nf(r.count)}</span>
              </li>
            ))}
          </ol>
        </Tile>

        <Tile
          title="Опасные сделки"
          className="dash-tile--tall"
          aside={m.danger.length > 0 ? <span className="dash-tile__alert">{nf(m.danger.length)}</span> : undefined}
        >
          {m.danger.length === 0 ? (
            <p className="dash-empty">Опасных сделок нет. Все клиенты остыли, можно выдохнуть.</p>
          ) : (
            <ul className="dash-danger">
              {m.danger.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <div className="dash-danger__top">
                    <Link to={`/app/leads/${d.id}`} className="dash-danger__title">
                      {d.title}
                    </Link>
                    <span className="dash-danger__chance" title="Вероятность покупки">
                      {d.buyChance}%
                    </span>
                  </div>
                  <div className="dash-danger__meta">
                    <span>
                      {money(displayBudget(demo, d))} · {managerName(demo, d.responsibleId)}
                    </span>
                    <Link to={`/app/leads/${d.id}`} className="dash-danger__cool">
                      <Snowflake aria-hidden="true" />
                      Срочно остудить
                    </Link>
                  </div>
                </li>
              ))}
              {m.danger.length > 5 && (
                <li className="dash-danger__more">
                  <Link to="/app/leads">
                    И ещё {nf(m.danger.length - 5)} {plural(m.danger.length - 5, ['сделка', 'сделки', 'сделок'])} хотят купить
                  </Link>
                </li>
              )}
            </ul>
          )}
        </Tile>

        <Tile title="Пропущенные звонки" className="dash-tile--wide">
          <div className="dash-calls">
            <div>
              <BigNum value={m.missed} tone="violet" />
              <p className="dash-sub">{m.missed > 0 ? 'цель выполнена' : 'ни одного пропущенного. Тревожно'}</p>
            </div>
            <dl className="dash-calls__list">
              <div>
                <dt>Входящих</dt>
                <dd>{nf(m.incoming)}</dd>
              </div>
              <div>
                <dt>Сброшено вежливо</dt>
                <dd>{nf(m.dropped)}</dd>
              </div>
              <div>
                <dt>Принято (к сожалению)</dt>
                <dd>{nf(m.answered)}</dd>
              </div>
            </dl>
          </div>
          <Link to="/app/stats/calls" className="dash-tile__link">
            Отчёт по звонкам
          </Link>
        </Tile>

        <Tile title="Дней без инцидентов" className="dash-tile--wide">
          <div className="dash-calls">
            <div>
              <BigNum value={m.incident.days} tone={m.incident.days === 0 ? 'red' : 'green'} />
              <p className="dash-sub">
                {m.incident.days === 0 ? 'счётчик обнулили сегодня. Разбор уже ждёт' : 'держим строй'}
              </p>
            </div>
            {m.incident.deal && (
              <p className="dash-incident">
                Последний инцидент:{' '}
                <Link to={`/app/leads/${m.incident.deal.id}`}>«{m.incident.deal.title}»</Link>
                {m.incident.deal.closedAt && <>, {fmtDate(m.incident.deal.closedAt)}</>}. Клиент купил, менеджер получил выговор.
              </p>
            )}
          </div>
        </Tile>
      </div>

      <EventsDrawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}

// ---------- расчёты ----------

function compute(demo: DemoState, period: DashPeriod, custom: CustomRange, who: Who) {
  const range = periodRange(period, custom);
  const mine = (id: string) => who === 'all' || id === 'you';
  const deals = demo.deals.filter((d) => mine(d.responsibleId));
  const tasks = demo.tasks.filter((t) => mine(t.responsibleId));
  const now = Date.now();

  const overdue = tasks.filter((t) => !t.done && new Date(t.due).getTime() < now).length;
  const postponed = tasks.reduce((a, t) => a + t.postpones, 0);

  const lost = deals.filter((d) => isLost(demo, d) && inRange(d.closedAt, range));
  const won = deals.filter((d) => isWon(demo, d) && inRange(d.closedAt, range));
  const closed = lost.length + won.length;
  const conversion = closed === 0 ? 100 : Math.round((lost.length / closed) * 100);

  const calls = demo.calls
    .filter((c) => mine(c.managerId) && inRange(c.at, range))
    .map((c) => ({ ...c, eff: callStatus(demo, c) }));
  const incoming = calls.filter((c) => c.direction === 'in');

  const ranking = people(demo)
    .filter((p) => mine(p.id))
    .map((p) => ({ ...p, count: lost.filter((d) => d.responsibleId === p.id).length }))
    .sort((a, b) => b.count - a.count);

  const danger = deals
    .filter((d) => isActive(demo, d) && (d.buyChance >= 80 || displayTemperature(demo, d) === 'hot'))
    .sort((a, b) => b.buyChance - a.buyChance || displayBudget(demo, b) - displayBudget(demo, a));

  return {
    overdue,
    postponed,
    youPostponed: demo.stats.postponed,
    slit: lost.length,
    slitSum: lost.reduce((a, d) => a + displayBudget(demo, d), 0),
    closed,
    conversion,
    reasons: lossBuckets(lost),
    missed: incoming.filter((c) => c.eff !== 'answered').length,
    incoming: incoming.length,
    dropped: calls.filter((c) => c.eff === 'dropped').length,
    answered: calls.filter((c) => c.eff === 'answered').length,
    ranking,
    rankMax: Math.max(0, ...ranking.map((r) => r.count)),
    danger,
    incident: lastIncident(demo),
  };
}

// ---------- плитки ----------

function Tile({
  title,
  className = '',
  aside,
  children,
}: {
  title: string;
  className?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`dash-tile ${className}`} aria-label={title}>
      <header className="dash-tile__head">
        <h2 className="dash-tile__title">{title}</h2>
        {aside}
      </header>
      <div className="dash-tile__body">{children}</div>
    </section>
  );
}

function BigNum({ value, tone, suffix }: { value: number; tone: 'violet' | 'green' | 'red'; suffix?: string }) {
  return (
    <span className={`dash-num dash-num--${tone}`}>
      {nf(value)}
      {suffix && <small>{suffix}</small>}
    </span>
  );
}

// ---------- поиск ----------

function DealSearch() {
  const demo = useDemo();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return demo.deals
      .filter((d) => {
        const contact = demo.contacts.find((c) => c.id === d.contactId)?.name ?? '';
        return d.title.toLowerCase().includes(s) || contact.toLowerCase().includes(s) || String(d.num).includes(s);
      })
      .slice(0, 6);
  }, [demo, q]);

  useEffect(() => {
    if (!focus) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setFocus(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [focus]);

  return (
    <div className="dash-search" ref={box}>
      <Search aria-hidden="true" />
      <label className="sr-only" htmlFor="dash-search">
        Поиск сделок
      </label>
      <input
        id="dash-search"
        value={q}
        placeholder="Поиск сделок"
        autoComplete="off"
        onFocus={() => setFocus(true)}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQ('');
            setFocus(false);
          }
          if (e.key === 'Enter' && results[0]) navigate(`/app/leads/${results[0].id}`);
        }}
      />
      {focus && q.trim() && (
        <div className="dash-search__pop" role="listbox" aria-label="Найденные сделки">
          {results.length === 0 ? (
            <p className="dash-search__empty">К счастью, ничего не нашлось</p>
          ) : (
            results.map((d) => (
              <Link key={d.id} to={`/app/leads/${d.id}`} className="dash-search__item" role="option" aria-selected="false">
                <span className="dash-search__title">{d.title}</span>
                <span className="dash-search__meta">
                  #{d.num} · {money(displayBudget(demo, d))}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------- шторка «События» ----------

function EventsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const demo = useDemo();
  const markRead = useStore((s) => s.markNotificationsRead);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const unread = demo.notifications.filter((n) => !n.read).map((n) => n.id);
    setFresh(new Set(unread));
    if (unread.length) markRead();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // при открытии фиксируем, какие уведомления были новыми
  }, [open]);

  if (!open) return null;
  const notes = demo.notifications.slice(0, 20);
  const events = [...demo.events].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 25);

  return createPortal(
    <div className="dash-drawer-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="dash-drawer" role="dialog" aria-modal="true" aria-label="События">
        <header className="dash-drawer__head">
          <h2>События</h2>
          <button type="button" className="dash-drawer__close" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </header>
        <div className="dash-drawer__body">
          <h3 className="dash-drawer__section">Уведомления</h3>
          {notes.length === 0 ? (
            <p className="dash-drawer__empty">Уведомлений нет. Клиенты пока не пытаются купить.</p>
          ) : (
            <ul className="dash-notes">
              {notes.map((n) => {
                const body = (
                  <>
                    <Bell aria-hidden="true" />
                    <span className="dash-notes__text">
                      {n.text}
                      <time>{fmtRelDay(n.at)}</time>
                    </span>
                  </>
                );
                return (
                  <li key={n.id} className={fresh.has(n.id) ? 'is-new' : undefined}>
                    {n.link ? (
                      <Link to={n.link} onClick={onClose}>
                        {body}
                      </Link>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="dash-drawer__section">Последние действия</h3>
          {events.length === 0 ? (
            <p className="dash-drawer__empty">В отделе тихо. Все на перекуре.</p>
          ) : (
            <ul className="dash-feed">
              {events.map((e) => (
                <li key={e.id}>
                  <time>{fmtRelDay(e.at)}</time>
                  <span>
                    <b>{managerName(demo, e.authorId)}</b> · {e.event}
                    {e.after ? `: ${e.after}` : ''}
                  </span>
                  <span className="dash-feed__obj">
                    {e.object}: {e.objectName}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/stats/events" className="dash-drawer__all" onClick={onClose}>
            Весь список событий
          </Link>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
