import { useMemo, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { displayBudget, pipelineStages, useDemo } from '../../../store/store';
import type { Deal, Stage } from '../../../store/types';
import { money, plural } from '../../ui';
import { Toggle } from './charts';
import { aliveIn, daysBetween, hashId, inRange, nf, pct, periodRange, scopeDeals, type ReportProps } from './metrics';

type Mode = 'all' | 'active' | 'closed';
type Metric = 'budget' | 'count';

interface Agg {
  count: number;
  sum: number;
}
const zero = (): Agg => ({ count: 0, sum: 0 });

export default function PipelineReport({ filter }: ReportProps) {
  const demo = useDemo();
  const [mode, setMode] = useState<Mode>('all');
  const [metric, setMetric] = useState<Metric>('count');

  const pid = filter.pipelineId === 'all' ? 'p-main' : filter.pipelineId;
  const pipeline = demo.pipelines.find((p) => p.id === pid);

  const data = useMemo(() => {
    const range = periodRange(filter.period, filter.custom);
    const stages = pipelineStages(demo, pid);
    const open = stages.filter((s) => s.kind === 'open');
    const pay = stages.find((s) => s.kind === 'payment');
    const lost = stages.find((s) => s.kind === 'lost');
    const won = stages.find((s) => s.kind === 'won');
    const kind = new Map(stages.map((s) => [s.id, s.kind]));

    const scoped = scopeDeals(demo, { ...filter, pipelineId: pid });
    const alive = scoped.filter((d) => aliveIn(d, range));
    const set = alive.filter((d) => {
      const k = kind.get(d.stageId);
      if (mode === 'active') return k === 'open' || k === 'payment';
      if (mode === 'closed') return k === 'lost' || k === 'won';
      return true;
    });

    const fresh = scoped.filter((d) => inRange(d.createdAt, range));
    const news: Agg = { count: fresh.length, sum: fresh.reduce((a, d) => a + displayBudget(demo, d), 0) };

    // Путь сделки по этапам. Историю переходов демо не хранит, поэтому для слитых
    // сделок этап потери выбирается детерминированно по id — числа стабильны между визитами.
    const openIdx = new Map(open.map((s, i) => [s.id, i]));
    const lostAt = (d: Deal) => hashId(d.id) % Math.max(1, open.length);
    const passed = (d: Deal, st: Stage): boolean => {
      const k = kind.get(d.stageId);
      if (st.kind === 'open') {
        const i = openIdx.get(st.id) ?? 0;
        if (k === 'open') return (openIdx.get(d.stageId) ?? 0) >= i;
        if (k === 'lost') return lostAt(d) >= i;
        return true; // оплата и инцидент прошли все рабочие этапы
      }
      if (st.kind === 'payment') return k === 'payment' || k === 'won';
      return d.stageId === st.id;
    };

    const add = (a: Agg, d: Deal) => {
      a.count += 1;
      a.sum += displayBudget(demo, d);
    };

    const cards = stages.map((st) => {
      const now = zero();
      const through = zero();
      const lostHere = zero();
      for (const d of set) {
        if (d.stageId === st.id) add(now, d);
        if (passed(d, st)) add(through, d);
        if (st.kind === 'open' && kind.get(d.stageId) === 'lost' && lostAt(d) === openIdx.get(st.id)) add(lostHere, d);
      }
      const inStage = set.filter((d) => d.stageId === st.id);
      const avgDays =
        st.kind === 'won' || st.kind === 'lost'
          ? inStage.length
            ? inStage.reduce((a, d) => a + daysBetween(d.createdAt, d.closedAt), 0) / inStage.length
            : null
          : inStage.length
            ? inStage.reduce((a, d) => a + daysBetween(d.stageSince), 0) / inStage.length
            : null;
      return { stage: st, now, through, lostHere, avgDays };
    });

    const funnelStages = [...open, ...(pay ? [pay] : []), ...(won ? [won] : [])];
    const funnel = funnelStages.map((st) => cards.find((c) => c.stage.id === st.id)!);
    return { cards, funnel, news, lost, total: set.length };
  }, [demo, filter, pid, mode]);

  const val = (a: Agg) => (metric === 'budget' ? a.sum : a.count);
  const base = data.funnel.length ? val(data.funnel[0].through) : 0;
  const rows = data.funnel.map((c) => ({ ...c, share: base > 0 ? (val(c.through) / base) * 100 : 0 }));

  const lostNow = data.lost ? (data.cards.find((c) => c.stage.id === data.lost!.id)?.now.count ?? 0) : 0;

  // самый большой провал между соседними этапами
  let dropAt = -1;
  let dropSize = 0;
  for (let i = 1; i < rows.length; i++) {
    const drop = rows[i - 1].share - rows[i].share;
    if (drop > dropSize + 0.01) {
      dropSize = drop;
      dropAt = i;
    }
  }

  return (
    <div className="stats-report">
      {filter.pipelineId === 'all' && (
        <p className="stats-note">
          Показана воронка «{pipeline?.name}». Другую можно выбрать в фильтре.
        </p>
      )}

      <section className="stats-card stats-deals" aria-label="Сделки по этапам">
        <div className="stats-deals__head caps">Сделки</div>
        <div className="stats-deals__row">
          <div className="stats-new">
            <div className="stats-new__label caps">Новые</div>
            <div className="stats-new__num">{nf(data.news.count)}</div>
            <div className="stats-new__sum tabular">{money(data.news.sum)}</div>
          </div>
          <div className="stats-stages" tabIndex={0} aria-label="Карточки этапов, прокручиваются горизонтально">
            {data.cards.map((c) => (
              <article key={c.stage.id} className={`stats-stage stats-stage--${c.stage.kind}`}>
                <div className="stats-stage__line" style={{ background: c.stage.color }} />
                <h3 className="stats-stage__name" title={c.stage.name}>
                  {c.stage.name}
                </h3>
                <StageRow label="Сейчас" a={c.now} />
                <StageRow label="Перешли в этап" a={c.through} />
                {c.stage.kind === 'open' ? (
                  <StageRow label="Потерянные" a={c.lostHere} tone="lost" />
                ) : (
                  <div className="stats-stage__row stats-stage__row--empty">
                    <span className="stats-stage__label">Потерянные</span>
                    <span className="stats-stage__val">—</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-card" aria-label="Воронка конверсии">
        <div className="stats-card__bar">
          <h2 className="stats-card__title">Конверсия по этапам</h2>
          <div className="stats-card__tools">
            <Toggle
              label="Какие сделки"
              value={mode}
              onChange={setMode}
              options={[
                { id: 'all', label: 'Все' },
                { id: 'active', label: 'Активные' },
                { id: 'closed', label: 'Закрытые' },
              ]}
            />
            <Toggle
              label="Мера"
              value={metric}
              onChange={setMetric}
              options={[
                { id: 'budget', label: 'По бюджету' },
                { id: 'count', label: 'По количеству' },
              ]}
            />
          </div>
        </div>

        {base === 0 ? (
          <div className="stats-empty">
            В этом срезе нет сделок. Терять некого, и это немного грустно.
          </div>
        ) : (
          <ol className="stats-funnel">
            {rows.map((r, i) => (
              <li key={r.stage.id} className="stats-funnel__item">
                {i === dropAt && (
                  <div className="stats-funnel__drop" role="note">
                    <TrendingDown size={15} aria-hidden="true" />
                    Здесь мы особенно хорошо теряем: −{pct(dropSize)}
                  </div>
                )}
                <div className="stats-funnel__row">
                  <span className="stats-funnel__days tabular" title="Среднее время в этапе">
                    {r.avgDays === null ? '—' : `${nf(r.avgDays)}д.`}
                  </span>
                  <div className="stats-funnel__track">
                    <div
                      className="stats-funnel__bar"
                      style={{ width: `${Math.max(r.share, 0.6)}%`, background: r.stage.color }}
                      title={`${r.stage.name}: ${pct(r.share)}`}
                    />
                    <span className="stats-funnel__pct tabular">{pct(r.share)}</span>
                  </div>
                  <div className="stats-funnel__info">
                    <span className="stats-funnel__name">{r.stage.name}</span>
                    <span className="stats-funnel__meta tabular">
                      {nf(r.through.count)} {plural(r.through.count, ['сделка', 'сделки', 'сделок'])} {money(r.through.sum)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        {data.lost && (
          <p className="stats-card__foot">
            Финал воронки «{data.lost.name}»: {nf(lostNow)} {plural(lostNow, ['сделка', 'сделки', 'сделок'])} в срезе. Конверсию в него
            не показываем, чтобы отдел не зазнался.
          </p>
        )}
      </section>
    </div>
  );
}

function StageRow({ label, a, tone }: { label: string; a: Agg; tone?: 'lost' }) {
  return (
    <div className={`stats-stage__row${tone ? ` stats-stage__row--${tone}` : ''}`}>
      <span className="stats-stage__label">{label}</span>
      <span className="stats-stage__val tabular">
        {nf(a.count)} <small>{plural(a.count, ['сделка', 'сделки', 'сделок'])}</small>
      </span>
      <span className="stats-stage__sum tabular">{money(a.sum)}</span>
    </div>
  );
}
