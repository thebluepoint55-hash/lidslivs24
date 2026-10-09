import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useDemo } from '../../../store/store';
import { people, periodText, defaultCustom, type PeriodKey, type StatsFilter } from './metrics';
import PipelineReport from './PipelineReport';
import Consolidated from './Consolidated';
import Employees from './Employees';
import EventsReport from './EventsReport';
import CallsReport from './CallsReport';
import GoalsReport from './GoalsReport';
import './stats.css';

const REPORTS = [
  { id: 'pipeline', label: 'Анализ слива', title: 'Анализ слива', C: PipelineReport },
  { id: 'consolidated', label: 'Сводный отчёт', title: 'Сводный отчёт', C: Consolidated },
  { id: 'employees', label: 'Отчёт по сотрудникам', title: 'Отчёт по сотрудникам', C: Employees },
  { id: 'events', label: 'Список событий', title: 'Список событий', C: EventsReport },
  { id: 'calls', label: 'Звонки', title: 'Звонки', C: CallsReport },
  { id: 'goals', label: 'Цели', title: 'Цели', C: GoalsReport },
] as const;

const PERIODS: PeriodKey[] = ['today', 'yesterday', 'week', 'month', 'quarter', 'all', 'custom'];
const PERIOD_OPTION: Record<PeriodKey, string> = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  week: 'За неделю',
  month: 'За месяц',
  quarter: 'За квартал',
  all: 'За всё время',
  custom: 'Свой период',
};

const DEFAULT_FILTER: StatsFilter = { pipelineId: 'all', managerId: 'all', period: 'quarter', custom: defaultCustom() };

export default function Stats() {
  const { report } = useParams();
  const [filter, setFilter] = useState<StatsFilter>(DEFAULT_FILTER);
  const r = REPORTS.find((x) => x.id === report);
  if (!r) return <Navigate to="/app/stats/pipeline" replace />;
  const Report = r.C;

  return (
    <div className="stats">
      <nav className="stats-nav" aria-label="Отчёты аналитики">
        <div className="stats-nav__title">Аналитика</div>
        {REPORTS.map((x) => (
          <NavLink key={x.id} to={`/app/stats/${x.id}`} className="stats-nav__item">
            {x.label}
          </NavLink>
        ))}
      </nav>
      <section className="stats-main">
        <header className="stats-top">
          <FilterButton filter={filter} onChange={setFilter} />
          <h1 className="stats-top__title">{r.title}</h1>
          <FilterSummary filter={filter} />
        </header>
        <div className="stats-body">
          <Report filter={filter} />
        </div>
      </section>
    </div>
  );
}

function FilterSummary({ filter }: { filter: StatsFilter }) {
  const demo = useDemo();
  const pipelineName =
    filter.pipelineId === 'all' ? 'Все воронки' : (demo.pipelines.find((p) => p.id === filter.pipelineId)?.name ?? '—');
  const managerText =
    filter.managerId === 'all' ? 'Все сотрудники' : (people(demo).find((p) => p.id === filter.managerId)?.name ?? '—');
  const text = `${pipelineName} · ${managerText} · ${periodText(filter.period, filter.custom)}`;
  return (
    <span className="stats-top__summary" title={text}>
      {text}
    </span>
  );
}

function FilterButton({ filter, onChange }: { filter: StatsFilter; onChange: (f: StatsFilter) => void }) {
  const demo = useDemo();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changed =
    filter.pipelineId !== DEFAULT_FILTER.pipelineId ||
    filter.managerId !== DEFAULT_FILTER.managerId ||
    filter.period !== DEFAULT_FILTER.period;

  const set = (patch: Partial<StatsFilter>) => onChange({ ...filter, ...patch });

  return (
    <div className="stats-filter" ref={box}>
      <button
        type="button"
        className={`stats-filter__btn${changed ? ' is-changed' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={15} aria-hidden="true" />
        Фильтр
        <ChevronRight size={15} aria-hidden="true" className="stats-filter__chev" />
      </button>
      {open && (
        <div className="stats-filter__pop" role="dialog" aria-label="Фильтр отчёта">
          <div className="stats-filter__head">
            <span className="caps">Фильтр</span>
            <button type="button" className="stats-filter__close" onClick={() => setOpen(false)} aria-label="Закрыть фильтр">
              <X size={16} />
            </button>
          </div>
          <label className="field">
            <span className="field__label">Воронка</span>
            <select className="select" value={filter.pipelineId} onChange={(e) => set({ pipelineId: e.target.value })}>
              <option value="all">Все воронки</option>
              {demo.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Безответственный</span>
            <select className="select" value={filter.managerId} onChange={(e) => set({ managerId: e.target.value })}>
              <option value="all">Все сотрудники</option>
              {people(demo).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Период</span>
            <select className="select" value={filter.period} onChange={(e) => set({ period: e.target.value as PeriodKey })}>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_OPTION[p]}
                </option>
              ))}
            </select>
          </label>
          {filter.period === 'custom' && (
            <div className="stats-filter__dates">
              <label className="field">
                <span className="field__label">С</span>
                <input
                  type="date"
                  className="input"
                  value={filter.custom.from}
                  onChange={(e) => e.target.value && set({ custom: { ...filter.custom, from: e.target.value } })}
                />
              </label>
              <label className="field">
                <span className="field__label">По</span>
                <input
                  type="date"
                  className="input"
                  value={filter.custom.to}
                  onChange={(e) => e.target.value && set({ custom: { ...filter.custom, to: e.target.value } })}
                />
              </label>
            </div>
          )}
          <div className="stats-filter__foot">
            <button type="button" className="linkbtn linkbtn--muted" onClick={() => onChange(DEFAULT_FILTER)} disabled={!changed}>
              Сбросить
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
