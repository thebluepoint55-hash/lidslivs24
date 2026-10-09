import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Settings2 } from 'lucide-react';
import { displayBudget, useDemo } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Avatar, Button, fmtDate, Modal, money } from '../../ui';
import { Toggle } from './charts';
import {
  GROUP_LABEL,
  inGroup,
  inRange,
  isLost,
  isWon,
  lastIncident,
  nf,
  pct,
  people,
  periodRange,
  scopeDeals,
  type Group,
  type ReportProps,
} from './metrics';

type Measure = 'budget' | 'count';
/** Сколько стоит одна слитая сделка в плане по бюджету */
const PLAN_DEAL_BUDGET = 100_000;

export default function GoalsReport({ filter }: ReportProps) {
  const demo = useDemo();
  const [group, setGroup] = useState<Group>('all');
  const [measure, setMeasure] = useState<Measure>('count');
  const [plans, setPlans] = useState<Record<string, number>>(() =>
    Object.fromEntries(demo.goals.map((g) => [g.managerId, g.plan])),
  );
  const [editing, setEditing] = useState(false);

  const range = periodRange(filter.period, filter.custom);
  const deals = scopeDeals(demo, { ...filter, managerId: 'all' });

  const rows = people(demo)
    .filter((p) => inGroup(p.id, group) && (filter.managerId === 'all' || p.id === filter.managerId))
    .map((p) => {
      const mine = deals.filter((d) => d.responsibleId === p.id);
      const lost = mine.filter((d) => isLost(demo, d) && inRange(d.closedAt, range));
      const sold = mine.filter((d) => isWon(demo, d) && inRange(d.closedAt, range));
      const planCount = plans[p.id] ?? 0;
      const fact = measure === 'count' ? lost.length : lost.reduce((a, d) => a + displayBudget(demo, d), 0);
      const plan = measure === 'count' ? planCount : planCount * PLAN_DEAL_BUDGET;
      const state: 'sold' | 'done' | 'progress' = sold.length > 0 ? 'sold' : plan > 0 && fact >= plan ? 'done' : 'progress';
      return { p, fact, plan, sold: sold.length, state };
    });

  const totalFact = rows.reduce((a, r) => a + r.fact, 0);
  const totalPlan = rows.reduce((a, r) => a + r.plan, 0);
  const totalSold = rows.reduce((a, r) => a + r.sold, 0);
  const totalState: 'sold' | 'done' | 'progress' = totalSold > 0 ? 'sold' : totalPlan > 0 && totalFact >= totalPlan ? 'done' : 'progress';
  const fmt = (v: number) => (measure === 'count' ? nf(v) : money(v));
  const incident = lastIncident(demo);

  return (
    <div className="stats-report">
      <div className="stats-goals__top">
        <div>
          <h2 className="stats-goals__title">Цели по сделкам</h2>
          <p className="stats-goals__intro">
            План здесь один: слить. Зелёная полоса значит, что сотрудник выполнил план по сливу за период. Красная значит, что
            он что-то продал, и с ним уже поговорили.
          </p>
        </div>
        <Button icon={<Settings2 />} onClick={() => setEditing(true)}>
          Настройки целей
        </Button>
      </div>

      <div className="stats-goals__layout">
        <section className="stats-card" aria-label="Выполнение целей">
          <div className="stats-card__bar">
            <label className="stats-inline-select">
              <span className="sr-only">Группа пользователей</span>
              <select className="select" value={group} onChange={(e) => setGroup(e.target.value as Group)}>
                {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
                  <option key={g} value={g}>
                    {g === 'all' ? 'Все группы' : GROUP_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>
            <Toggle
              label="Мера"
              value={measure}
              onChange={setMeasure}
              options={[
                { id: 'budget', label: 'По бюджету' },
                { id: 'count', label: 'По количеству' },
              ]}
            />
          </div>

          <ul className="stats-goals">
            {rows.map((r) => (
              <GoalRow
                key={r.p.id}
                name={r.p.name}
                avatar={<Avatar name={r.p.name} color={r.p.color} size={28} />}
                fact={r.fact}
                plan={r.plan}
                sold={r.sold}
                state={r.state}
                fmt={fmt}
              />
            ))}
            <GoalRow name="Всего" total fact={totalFact} plan={totalPlan} sold={totalSold} state={totalState} fmt={fmt} />
          </ul>
        </section>

        <aside className="stats-card stats-board" aria-label="Дней без инцидентов">
          <span className="stats-board__label caps">Дней без инцидентов</span>
          <span className={`stats-board__num${incident.days === 0 ? ' is-zero' : ''}`}>{nf(incident.days)}</span>
          {incident.deal ? (
            <span className="stats-board__meta">
              {incident.days === 0 ? 'Счётчик обнулён сегодня. ' : 'Последний инцидент: '}
              <Link to={`/app/leads/${incident.deal.id}`}>«{incident.deal.title}»</Link>
              {incident.deal.closedAt && <>, {fmtDate(incident.deal.closedAt)}</>}
            </span>
          ) : (
            <span className="stats-board__meta">Инцидентов не было ни разу. Держим строй.</span>
          )}
        </aside>
      </div>

      <GoalsModal
        open={editing}
        plans={plans}
        onClose={() => setEditing(false)}
        onSave={(next) => {
          setPlans(next);
          setEditing(false);
          toast('Цели сохранены. План по сливу утверждён без согласования, впервые в истории отдела', 'success');
        }}
      />
    </div>
  );
}

function GoalRow({
  name,
  avatar,
  fact,
  plan,
  sold,
  state,
  fmt,
  total,
}: {
  name: string;
  avatar?: ReactNode;
  fact: number;
  plan: number;
  sold: number;
  state: 'sold' | 'done' | 'progress';
  fmt: (v: number) => string;
  total?: boolean;
}) {
  const share = plan > 0 ? (fact / plan) * 100 : 0;
  const Icon = state === 'sold' ? AlertTriangle : state === 'done' ? CheckCircle2 : Clock3;
  const status = state === 'sold' ? `Продано: ${nf(sold)}` : state === 'done' ? 'План по сливу выполнен' : 'В процессе слива';
  return (
    <li className={`stats-goal stats-goal--${state}${total ? ' stats-goal--total' : ''}`}>
      <div className="stats-goal__who">
        {avatar}
        <span className="stats-goal__name">{name}</span>
      </div>
      <div className="stats-goal__bar">
        <div className="stats-goal__track">
          <div className="stats-goal__fill" style={{ width: `${Math.min(100, share)}%` }} />
        </div>
        <div className="stats-goal__meta">
          <span className="stats-goal__status">
            <Icon size={14} aria-hidden="true" /> {status}
          </span>
          <span className="tabular">
            {fmt(fact)} из {fmt(plan)} · {pct(share)}
          </span>
        </div>
      </div>
    </li>
  );
}

function GoalsModal({
  open,
  plans,
  onClose,
  onSave,
}: {
  open: boolean;
  plans: Record<string, number>;
  onClose: () => void;
  onSave: (p: Record<string, number>) => void;
}) {
  const demo = useDemo();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const value = (id: string) => draft[id] ?? String(plans[id] ?? 0);

  return (
    <Modal
      open={open}
      title="Настройки целей"
      onClose={() => {
        setDraft({});
        onClose();
      }}
      footer={
        <>
          <Button
            onClick={() => {
              setDraft({});
              onClose();
            }}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const next = { ...plans };
              for (const [k, v] of Object.entries(draft)) next[k] = Math.max(0, Math.round(Number(v) || 0));
              setDraft({});
              onSave(next);
            }}
          >
            Сохранить
          </Button>
        </>
      }
    >
      <p className="stats-goals__hint">План по сливу на период, в сделках. Поставить план продаж нельзя: такой цели в системе нет.</p>
      <div className="stats-goals__form">
        {people(demo).map((p) => (
          <label key={p.id} className="stats-goals__field">
            <Avatar name={p.name} color={p.color} size={26} />
            <span className="stats-goals__fname">{p.name}</span>
            <input
              className="input tabular"
              type="number"
              min={0}
              inputMode="numeric"
              value={value(p.id)}
              onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
              aria-label={`План по сливу: ${p.name}`}
            />
          </label>
        ))}
      </div>
    </Modal>
  );
}
