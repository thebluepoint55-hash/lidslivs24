import { useMemo, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { displayBudget, useDemo } from '../../../store/store';
import { money, plural } from '../../ui';
import { AXIS_TICK, ChartTip, GRID_STROKE, Legend, Toggle } from './charts';
import {
  aliveIn,
  inRange,
  isLost,
  isWon,
  lossBuckets,
  moneyShort,
  nf,
  pct,
  people,
  periodRange,
  scopeDeals,
  SLIT_COLOR,
  SOLD_COLOR,
  startOfDay,
  type ReportProps,
} from './metrics';

type Gran = 'day' | 'week' | 'month';
const DAY = 86400_000;

export default function Consolidated({ filter }: ReportProps) {
  const demo = useDemo();
  const [gran, setGran] = useState<Gran>('day');

  const scoped = useMemo(() => scopeDeals(demo, filter), [demo, filter]);
  const range = periodRange(filter.period, filter.custom);

  // ---------- линия «Слито / Продано» нарастающим итогом ----------
  const series = useMemo(() => {
    const r = periodRange(filter.period, filter.custom);
    const from =
      filter.period === 'all'
        ? startOfDay(Math.min(Date.now(), ...scoped.map((d) => new Date(d.createdAt).getTime())))
        : startOfDay(r.from);
    const to = r.to;
    const starts: number[] = [];
    if (gran === 'day') {
      for (let t = from; t <= to; t += DAY) starts.push(t);
    } else if (gran === 'week') {
      const d = new Date(from);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // понедельник
      for (let t = d.getTime(); t <= to; t += 7 * DAY) starts.push(t);
    } else {
      const d = new Date(from);
      d.setDate(1);
      while (d.getTime() <= to) {
        starts.push(d.getTime());
        d.setMonth(d.getMonth() + 1);
      }
    }
    // защита от сотен тысяч точек при странном диапазоне
    const pts = starts.slice(-800);
    const closed = scoped
      .filter((d) => d.closedAt && (isLost(demo, d) || isWon(demo, d)))
      .map((d) => ({ t: new Date(d.closedAt!).getTime(), lost: isLost(demo, d) }));
    const fmt = (t: number) =>
      gran === 'month'
        ? new Date(t).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }).replace(' г.', '')
        : new Date(t).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    let slit = 0;
    let sold = 0;
    return pts.map((t, i) => {
      const end = i + 1 < pts.length ? pts[i + 1] : to + 1;
      for (const c of closed) {
        if (c.t >= Math.max(t, from) && c.t < end && c.t <= to) {
          if (c.lost) slit++;
          else sold++;
        }
      }
      return { t, label: fmt(t), slit, sold };
    });
  }, [demo, scoped, filter.period, filter.custom, gran]);

  const last = series[series.length - 1];
  // подписи на концах линий не должны налезать друг на друга
  const labelsApart = !!last && last.slit - last.sold >= Math.max(2, last.slit * 0.15);

  // ---------- кольцо «Этапы продаж» ----------
  const donut = useMemo(() => {
    const alive = scoped.filter((d) => aliveIn(d, range));
    const shownPipeline = filter.pipelineId === 'all' ? 'p-main' : filter.pipelineId;
    const groups = new Map<string, { name: string; color: string; count: number; sum: number; order: number }>();
    for (const d of alive) {
      const st = demo.stages.find((s) => s.id === d.stageId);
      if (!st) continue;
      let key: string;
      let name: string;
      let color = st.color;
      let order: number;
      if (st.kind === 'lost') {
        key = 'lost';
        name = 'Слит (успешно)';
        color = '#87f2c0';
        order = 100;
      } else if (st.kind === 'won') {
        key = 'won';
        name = 'Инцидент: продажа';
        color = '#ff8f92';
        order = 102;
      } else if (st.kind === 'payment') {
        key = 'pay';
        name = 'Оплата (не рекомендуется)';
        color = '#d0d0d0';
        order = 101;
      } else if (st.pipelineId === shownPipeline) {
        key = st.id;
        name = st.name;
        order = demo.stages.indexOf(st);
      } else {
        key = 'other';
        name = 'Другие воронки, в работе';
        color = '#c8d6e5';
        order = 99;
      }
      const g = groups.get(key) ?? { name, color, count: 0, sum: 0, order };
      g.count += 1;
      g.sum += displayBudget(demo, d);
      groups.set(key, g);
    }
    const list = [...groups.entries()].map(([key, g]) => ({ key, ...g })).sort((a, b) => a.order - b.order);
    const total = list.reduce((a, g) => a + g.count, 0);
    const sum = list.reduce((a, g) => a + g.sum, 0);
    return { list, total, sum };
  }, [demo, scoped, range.from, range.to, filter.pipelineId]);

  // ---------- менеджеры и причины ----------
  const lostInPeriod = scoped.filter((d) => isLost(demo, d) && inRange(d.closedAt, range));
  const soldInPeriod = scoped.filter((d) => isWon(demo, d) && inRange(d.closedAt, range));
  const byPerson = people(demo)
    .map((p) => ({ ...p, count: lostInPeriod.filter((d) => d.responsibleId === p.id).length }))
    .filter((p) => filter.managerId === 'all' || p.id === filter.managerId)
    .sort((a, b) => b.count - a.count);
  const reasons = lossBuckets(lostInPeriod).sort((a, b) => b.count - a.count);
  const maxReason = Math.max(1, ...reasons.map((r) => r.count));

  return (
    <div className="stats-report">
      <section className="stats-card" aria-label="Сделки по периодам">
        <div className="stats-card__bar">
          <h2 className="stats-card__title">Закрытые сделки нарастающим итогом</h2>
          <div className="stats-card__tools">
            <Toggle
              label="Шаг графика"
              value={gran}
              onChange={setGran}
              options={[
                { id: 'day', label: 'По дням' },
                { id: 'week', label: 'По неделям' },
                { id: 'month', label: 'По месяцам' },
              ]}
            />
          </div>
        </div>
        <Legend
          items={[
            { label: `Слито: ${nf(last?.slit ?? 0)}`, color: SLIT_COLOR, line: true },
            { label: `Продано: ${nf(last?.sold ?? 0)}`, color: SOLD_COLOR, line: true },
          ]}
        />
        <div className="stats-chart" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 12, right: 64, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: '#dfe2e4' }}
                minTickGap={24}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
              <Tooltip
                cursor={{ stroke: '#c5cacd', strokeWidth: 1 }}
                content={<ChartTip format={(v) => `${nf(v)} ${plural(v, ['сделка', 'сделки', 'сделок'])}`} />}
              />
              <Line
                type="monotone"
                dataKey="slit"
                name="Слито"
                stroke={SLIT_COLOR}
                strokeWidth={2}
                dot={series.length < 3 ? { r: 4, fill: SLIT_COLOR, stroke: '#fff', strokeWidth: 2 } : false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
                label={endLabel(series.length - 1, 'Слито', SLIT_COLOR)}
              />
              <Line
                type="monotone"
                dataKey="sold"
                name="Продано"
                stroke={SOLD_COLOR}
                strokeWidth={2}
                dot={series.length < 3 ? { r: 4, fill: SOLD_COLOR, stroke: '#fff', strokeWidth: 2 } : false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
                label={labelsApart ? endLabel(series.length - 1, 'Продано', SOLD_COLOR) : false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="stats-grid">
        <section className="stats-card stats-grid__wide" aria-label="Этапы продаж">
          <h2 className="stats-card__title">Этапы продаж</h2>
          {donut.total === 0 ? (
            <div className="stats-empty">В этом срезе сделок нет. Слили даже воронку.</div>
          ) : (
            <div className="stats-donut">
              <div className="stats-donut__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut.list}
                      dataKey="count"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="#fff"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {donut.list.map((g) => (
                        <Cell key={g.key} fill={g.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTip
                          format={(v) => `${nf(v)} ${plural(v, ['сделка', 'сделки', 'сделок'])} · ${pct((v / donut.total) * 100)}`}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="stats-donut__center">
                  <span className="stats-donut__sum">{moneyShort(donut.sum)}</span>
                  <span className="stats-donut__cap">бюджет {nf(donut.total)} {plural(donut.total, ['сделки', 'сделок', 'сделок'])}</span>
                </div>
              </div>
              <ul className="stats-donut__legend">
                {donut.list.map((g) => (
                  <li key={g.key} className={g.key === 'lost' ? 'is-hero' : undefined}>
                    <span className="stats-donut__key" style={{ background: g.color }} aria-hidden="true" />
                    <span className="stats-donut__name">{g.name}</span>
                    <span className="stats-donut__val tabular">{pct((g.count / donut.total) * 100)}</span>
                    <span className="stats-donut__cnt tabular">{nf(g.count)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="stats-card" aria-label="Сделки по менеджеру">
          <h2 className="stats-card__title">Сделки по менеджеру</h2>
          <p className="stats-card__sub">Слито за период: {nf(lostInPeriod.length)}</p>
          <ul className="stats-bars">
            {byPerson.map((p) => {
              const share = lostInPeriod.length ? (p.count / lostInPeriod.length) * 100 : 0;
              return (
                <li key={p.id}>
                  <div className="stats-bars__top">
                    <span className="stats-bars__name">{p.name}</span>
                    <span className="stats-bars__val tabular">
                      {nf(p.count)} · {pct(share)}
                    </span>
                  </div>
                  <div className="stats-bars__track">
                    <div className="stats-bars__fill" style={{ transform: `scaleX(${share / 100})`, background: SLIT_COLOR }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="stats-card" aria-label="Причины слива">
          <h2 className="stats-card__title">Причины слива</h2>
          {reasons.length === 0 ? (
            <div className="stats-empty stats-empty--sm">За период никого не слили. Руководитель ждёт объяснений.</div>
          ) : (
            <ul className="stats-bars">
              {reasons.map((r) => (
                <li key={r.bucket.id}>
                  <div className="stats-bars__top">
                    <span className="stats-bars__name">{r.bucket.label}</span>
                    <span className="stats-bars__val tabular">{nf(r.count)}</span>
                  </div>
                  <div className="stats-bars__track">
                    <div className="stats-bars__fill" style={{ transform: `scaleX(${r.count / maxReason})`, background: SLIT_COLOR }} />
                  </div>
                  <span className="stats-bars__ex" title={r.examples.join('\n')}>
                    Например: {r.examples[0]?.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="stats-forecast">
        <span>
          Прогноз выручки на квартал: <strong className="tabular">0 ₽</strong>
        </span>
        <span className="stats-forecast__sep" aria-hidden="true" />
        <span>точность прогноза 99%</span>
        {soldInPeriod.length > 0 && (
          <span className="stats-forecast__warn">
            Погрешность 1% уже случилась: {money(soldInPeriod.reduce((a, d) => a + displayBudget(demo, d), 0))} продаж за период
          </span>
        )}
      </p>
    </div>
  );
}

/** Подпись значения на конце линии — только у последней точки */
function endLabel(lastIndex: number, name: string, color: string) {
  return (p: any) => {
    if (p.index !== lastIndex || p.x === undefined) return <g key={`${name}-${p.index}`} />;
    return (
      <g key={`${name}-end`}>
        <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="#fff" strokeWidth={2} />
        <text x={p.x + 8} y={p.y} dy={4} fontSize={12} fill="#363b44" fontFamily="PT Sans, Arial, sans-serif">
          {name}: {nf(Number(p.value ?? 0))}
        </text>
      </g>
    );
  };
}
