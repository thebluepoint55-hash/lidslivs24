import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, CalendarClock, Columns3, Search, UserRound } from 'lucide-react';
import { displayBudget, useDemo, useStore } from '../../../store/store';
import type { Deal, ID } from '../../../store/types';
import { Button, Empty, PageHeader, money, plural, useIsMobile } from '../../ui';
import {
  ALL_PIPELINES,
  PipelineSwitch,
  StagePill,
  TaskDot,
  ViewToggle,
  batchWithToast,
  buildTaskStates,
  dealMatches,
  usePipelineChoice,
} from './shared';
import './leads.css';

type SortKey = 'title' | 'contact' | 'company' | 'stage' | 'budget' | 'postpones';

const dealsWord = (n: number) => plural(n, ['сделка', 'сделки', 'сделок']);

export default function LeadsList() {
  const demo = useDemo();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const postponeDeal = useStore((s) => s.postponeDeal);
  const slitDeal = useStore((s) => s.slitDeal);
  const antiAction = useStore((s) => s.antiAction);

  const [pipelineId, setPipelineId] = usePipelineChoice(demo.pipelines[0]?.id ?? 'p-main');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Set<ID>>(() => new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'postpones', dir: -1 });

  const contacts = useMemo(() => new Map(demo.contacts.map((c) => [c.id, c])), [demo.contacts]);
  const companies = useMemo(() => new Map(demo.companies.map((c) => [c.id, c])), [demo.companies]);
  const stages = useMemo(() => new Map(demo.stages.map((s) => [s.id, s])), [demo.stages]);
  const stageOrder = useMemo(() => new Map(demo.stages.map((s, i) => [s.id, i])), [demo.stages]);
  const taskStates = useMemo(() => buildTaskStates(demo.tasks), [demo.tasks]);

  const companyOf = (d: Deal) => {
    const coId = d.companyId ?? (d.contactId ? contacts.get(d.contactId)?.companyId : undefined);
    return coId ? companies.get(coId) : undefined;
  };

  const rows = useMemo(() => {
    const list = demo.deals.filter(
      (d) => (pipelineId === ALL_PIPELINES || d.pipelineId === pipelineId) && dealMatches(demo, d, q),
    );
    const val = (d: Deal): string | number => {
      switch (sort.key) {
        case 'title':
          return d.title.toLowerCase();
        case 'contact':
          return (d.contactId ? contacts.get(d.contactId)?.name : '')?.toLowerCase() ?? '';
        case 'company':
          return companyOf(d)?.name.toLowerCase() ?? '';
        case 'stage':
          return stageOrder.get(d.stageId) ?? 0;
        case 'budget':
          return displayBudget(demo, d);
        case 'postpones':
          return d.postpones;
      }
    };
    return [...list].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [demo, pipelineId, q, sort, contacts, companies, stageOrder]);

  const total = rows.reduce((s, d) => s + displayBudget(demo, d), 0);
  const selected = rows.filter((d) => sel.has(d.id));
  const allOn = rows.length > 0 && selected.length === rows.length;

  const toggle = (id: ID) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map((d) => d.id)));

  const bulk = (kind: 'postpone' | 'slit' | 'intern') => {
    const ids = selected.map((d) => d.id);
    const n = ids.length;
    if (!n) return;
    if (kind === 'postpone')
      batchWithToast(() => ids.forEach((id) => postponeDeal(id)), `${n} ${dealsWord(n)} перенесено на после праздников`);
    if (kind === 'slit')
      batchWithToast(() => ids.forEach((id) => slitDeal(id, 'Массовый слив из списка')), `Слито ${n} ${dealsWord(n)}. Отличная работа`);
    if (kind === 'intern')
      batchWithToast(() => ids.forEach((id) => antiAction(id, 'intern')), `${n} ${dealsWord(n)} передано стажёру. То есть вам`);
    setSel(new Set());
  };

  const th = (key: SortKey, label: string, cls = '') => {
    const on = sort.key === key;
    return (
      <th className={cls} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          className={`th-sort${on ? ' is-on' : ''}`}
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === 'title' ? 1 : -1 }))}
        >
          {label}
          {on && (sort.dir === 1 ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />)}
        </button>
      </th>
    );
  };

  return (
    <div className="leads-page leads-page--list">
      <PageHeader
        title={isMobile ? <PipelineSwitch value={pipelineId} onChange={setPipelineId} allowAll /> : 'Сделки'}
        titleExtra={
          !isMobile && (
            <div className="leads-head-extra">
              <ViewToggle view="list" />
              <PipelineSwitch value={pipelineId} onChange={setPipelineId} allowAll />
            </div>
          )
        }
        search={q}
        onSearch={setQ}
        meta={`${rows.length} ${dealsWord(rows.length)}: ${money(total)}`}
        actions={
          isMobile ? (
            <Button variant="ghost" keepMobile icon={<Columns3 />} aria-label="Воронка" onClick={() => navigate('/app/leads')} />
          ) : undefined
        }
      />
      {isMobile && (
        <div className="m-search">
          <Search aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск и фильтр" aria-label="Поиск сделок" />
        </div>
      )}

      {rows.length === 0 ? (
        <Empty icon={<Search size={28} />} title="К счастью, сделок не найдено">
          {q ? 'Попробуйте другой запрос или не пробуйте вовсе.' : 'Все клиенты уже ушли. Можно выдохнуть.'}
        </Empty>
      ) : isMobile ? (
        <ul className="m-list">
          {rows.map((d) => {
            const c = d.contactId ? contacts.get(d.contactId) : undefined;
            const st = stages.get(d.stageId);
            return (
              <li key={d.id} className={`m-row${sel.has(d.id) ? ' is-sel' : ''}`}>
                <input type="checkbox" checked={sel.has(d.id)} onChange={() => toggle(d.id)} aria-label={`Выбрать «${d.title}»`} />
                <Link to={`/app/leads/${d.id}`} className="m-row__main">
                  <span className="m-row__title">
                    <TaskDot state={taskStates.get(d.id) ?? 'none'} />
                    {d.title}
                  </span>
                  <span className="m-row__sub">{c?.name ?? companyOf(d)?.name ?? 'Без контакта'}</span>
                  <span className="m-row__meta">
                    <StagePill stage={st} />
                    <span className="tabular">{money(displayBudget(demo, d))}</span>
                    {d.postpones > 0 && (
                      <span className="m-row__pp">
                        <CalendarClock aria-hidden="true" />
                        {d.postpones}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="table-wrap leads-table">
          <table className="table">
            <thead>
              <tr>
                <th className="cell-check">
                  <input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Выбрать все" />
                </th>
                {th('title', 'Название сделки')}
                {th('contact', 'Основной контакт')}
                {th('company', 'Компания контакта')}
                {th('stage', 'Этап сделки')}
                {th('budget', 'Бюджет, ₽', 'num')}
                {th('postpones', 'Переносов', 'num')}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const c = d.contactId ? contacts.get(d.contactId) : undefined;
                const co = companyOf(d);
                return (
                  <tr key={d.id} className={sel.has(d.id) ? 'is-sel' : ''}>
                    <td className="cell-check">
                      <input type="checkbox" checked={sel.has(d.id)} onChange={() => toggle(d.id)} aria-label={`Выбрать «${d.title}»`} />
                    </td>
                    <td className="cell-title">
                      <TaskDot state={taskStates.get(d.id) ?? 'none'} />
                      <Link to={`/app/leads/${d.id}`}>{d.title}</Link>
                    </td>
                    <td>{c ? <Link to={`/app/contacts/contact/${c.id}`}>{c.name}</Link> : <span className="muted">—</span>}</td>
                    <td>{co ? <Link to={`/app/contacts/company/${co.id}`}>{co.name}</Link> : <span className="muted">—</span>}</td>
                    <td>
                      <StagePill stage={stages.get(d.stageId)} />
                    </td>
                    <td className="num">{displayBudget(demo, d).toLocaleString('ru-RU')}</td>
                    <td className={`num${d.postpones >= 10 ? ' pp-hi' : ''}`}>{d.postpones}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected.length > 0 && (
        <div className="bulk-bar" role="region" aria-label="Действия с выбранными">
          <span className="bulk-bar__n">
            Выбрано: <strong className="tabular">{selected.length}</strong>
          </span>
          <Button size="sm" icon={<CalendarClock />} onClick={() => bulk('postpone')}>
            Перенести все
          </Button>
          <Button size="sm" icon={<UserRound />} onClick={() => bulk('intern')}>
            Передать стажёру
          </Button>
          <Button size="sm" variant="anti" onClick={() => bulk('slit')}>
            Слить выбранные
          </Button>
          <span style={{ flex: 1 }} />
          <button className="linkbtn bulk-bar__clear" onClick={() => setSel(new Set())}>
            Снять выделение
          </button>
        </div>
      )}
    </div>
  );
}
