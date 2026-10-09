import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing } from 'lucide-react';
import { isInstalled, managerName, useDemo } from '../../../store/store';
import { APP } from '../../../data/appIds';
import type { CallStatus } from '../../../store/types';
import { Empty, fmtDateTime } from '../../ui';
import { AXIS_TICK, ChartTip, GRID_STROKE, Legend, Toggle } from './charts';
import {
  CALL_COLORS,
  CALL_ORDER,
  callStatus,
  GROUP_LABEL,
  inGroup,
  inRange,
  nf,
  people,
  periodRange,
  STATUS_LABEL,
  type Group,
  type ReportProps,
} from './metrics';

type Measure = 'count' | 'duration';
type Dir = 'all' | 'in' | 'out';
const PAGE = 20;

const fmtDur = (sec: number) => {
  if (sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function CallsReport({ filter }: ReportProps) {
  const demo = useDemo();
  const [group, setGroup] = useState<Group>('all');
  const [measure, setMeasure] = useState<Measure>('count');
  const [dir, setDir] = useState<Dir>('all');
  const [limit, setLimit] = useState(PAGE);
  const unavailable = isInstalled(demo, APP.unavailable);

  const calls = useMemo(() => {
    const range = periodRange(filter.period, filter.custom);
    return demo.calls
      .filter(
        (c) =>
          inRange(c.at, range) &&
          inGroup(c.managerId, group) &&
          (filter.managerId === 'all' || c.managerId === filter.managerId),
      )
      .map((c) => ({ ...c, eff: callStatus(demo, c) }));
  }, [demo, filter, group]);

  const unit = measure === 'count' ? (v: number) => `${nf(v)} зв.` : (v: number) => `${nf(v)} мин`;
  const weight = (c: { duration: number }) => (measure === 'count' ? 1 : c.duration / 60);

  // ---------- по часам ----------
  const hours = useMemo(() => {
    const used = calls.map((c) => new Date(c.at).getHours());
    const lo = Math.min(8, ...used);
    const hi = Math.max(20, ...used);
    const rows: { hour: number; label: string; missed: number; answered: number; dropped: number }[] = [];
    for (let h = lo; h <= hi; h++) rows.push({ hour: h, label: `${h}:00`, missed: 0, answered: 0, dropped: 0 });
    for (const c of calls) {
      const r = rows.find((x) => x.hour === new Date(c.at).getHours());
      if (r) r[c.eff] += weight(c);
    }
    return rows.map((r) => ({ ...r, missed: round1(r.missed), answered: round1(r.answered), dropped: round1(r.dropped) }));
  }, [calls, measure]);

  // пик пропущенных: окно в два часа с наибольшим числом пропущенных и сброшенных
  const peak = useMemo(() => {
    let best = -1;
    let at = -1;
    for (let i = 0; i + 1 < hours.length; i++) {
      const v = hours[i].missed + hours[i].dropped + hours[i + 1].missed + hours[i + 1].dropped;
      if (v > best) {
        best = v;
        at = i;
      }
    }
    if (at < 0 || best <= 0) return null;
    const h = hours[at].hour;
    const why =
      h >= 12 && h <= 14
        ? 'обед плавно переходит в перекур'
        : h < 12
          ? 'утренний кофе важнее клиентов'
          : 'рабочий день формально ещё идёт';
    return { from: hours[at].label, to: hours[at + 1].label, text: `Пик пропущенных: ${h}:00–${h + 2}:00 (${why})` };
  }, [hours]);

  // ---------- по сотрудникам ----------
  const perPerson = people(demo)
    .filter((p) => inGroup(p.id, group) && (filter.managerId === 'all' || p.id === filter.managerId))
    .map((p) => {
      const mine = calls.filter((c) => c.managerId === p.id);
      const row = { name: p.name, missed: 0, answered: 0, dropped: 0 };
      for (const c of mine) row[c.eff] += weight(c);
      return { ...row, missed: round1(row.missed), answered: round1(row.answered), dropped: round1(row.dropped) };
    })
    .sort((a, b) => b.missed + b.dropped - (a.missed + a.dropped));

  // ---------- недавние звонки ----------
  const recent = calls
    .filter((c) => dir === 'all' || c.direction === dir)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const totals = CALL_ORDER.map((s) => ({ s, v: calls.filter((c) => c.eff === s).reduce((a, c) => a + weight(c), 0) }));
  const legend = CALL_ORDER.map((s) => ({ label: STATUS_LABEL[s], color: CALL_COLORS[s] }));

  return (
    <div className="stats-report">
      <section className="stats-intro">
        <p>
          Отчёт показывает, как отдел избегает разговоров с клиентами. Каждый пропущенный звонок экономит менеджеру в среднем
          четыре минуты и одну продажу. Сброшенные вежливо считаются отдельно: так тоже можно, просто дольше.
        </p>
        {unavailable && (
          <p className="stats-intro__app">
            Подключена телефония «Абонент недоступен»: все входящие помечены как «Сброшен вежливо».
          </p>
        )}
      </section>

      <div className="stats-report__head">
        <label className="stats-inline-select">
          <span className="sr-only">Группа пользователей</span>
          <select className="select" value={group} onChange={(e) => setGroup(e.target.value as Group)}>
            {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
              <option key={g} value={g}>
                {GROUP_LABEL[g]}
              </option>
            ))}
          </select>
        </label>
        <Toggle
          label="Мера"
          value={measure}
          onChange={setMeasure}
          options={[
            { id: 'count', label: 'По количеству' },
            { id: 'duration', label: 'По длительности' },
          ]}
        />
        <span className="stats-report__meta tabular">
          {totals.map((t) => `${STATUS_LABEL[t.s]}: ${unit(round1(t.v))}`).join(' · ')}
        </span>
      </div>

      {calls.length === 0 ? (
        <div className="stats-card">
          <Empty icon={<PhoneOff size={36} aria-hidden="true" />} title="Звонков не было">
            За этот период никто не звонил. Или звонил, но мы не узнали.
          </Empty>
        </div>
      ) : (
        <>
          <section className="stats-card" aria-label="Звонки по часам">
            <div className="stats-card__bar">
              <h2 className="stats-card__title">Звонки по времени суток</h2>
              {peak && <span className="stats-peak">{peak.text}</span>}
            </div>
            <Legend items={legend} />
            <div className="stats-chart" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap="22%">
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  {peak && (
                    <ReferenceArea x1={peak.from} x2={peak.to} fill="#fdecea" fillOpacity={0.7} stroke="none" />
                  )}
                  <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#dfe2e4' }} interval="preserveStartEnd" minTickGap={8} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                  <Tooltip
                    cursor={{ fill: 'rgba(47, 128, 237, 0.06)' }}
                    content={<ChartTip format={(v) => unit(v)} labelFormat={(l) => `${l}–${String(l).replace(/^(\d+)/, (m) => String(Number(m) + 1))}`} />}
                  />
                  {CALL_ORDER.map((s, i) => (
                    <Bar
                      key={s}
                      dataKey={s}
                      name={STATUS_LABEL[s]}
                      stackId="h"
                      fill={CALL_COLORS[s]}
                      stroke="#fff"
                      strokeWidth={1}
                      maxBarSize={24}
                      radius={i === CALL_ORDER.length - 1 ? [4, 4, 0, 0] : 0}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="stats-card" aria-label="Звонки по сотрудникам">
            <h2 className="stats-card__title">По сотрудникам</h2>
            <div className="stats-chart" style={{ height: perPerson.length * 44 + 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perPerson} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barCategoryGap="30%">
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={150} />
                  <Tooltip cursor={{ fill: 'rgba(47, 128, 237, 0.06)' }} content={<ChartTip format={(v) => unit(v)} />} />
                  {CALL_ORDER.map((s, i) => (
                    <Bar
                      key={s}
                      dataKey={s}
                      name={STATUS_LABEL[s]}
                      stackId="p"
                      fill={CALL_COLORS[s]}
                      stroke="#fff"
                      strokeWidth={1}
                      maxBarSize={20}
                      radius={i === CALL_ORDER.length - 1 ? [0, 4, 4, 0] : 0}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      <section className="stats-card stats-card--flush" aria-label="Недавние звонки">
        <div className="stats-card__bar stats-card__bar--pad">
          <h2 className="stats-card__title">Недавние звонки</h2>
          <Toggle
            label="Направление"
            value={dir}
            onChange={(v) => {
              setDir(v);
              setLimit(PAGE);
            }}
            options={[
              { id: 'all', label: 'Все' },
              { id: 'in', label: 'Входящие' },
              { id: 'out', label: 'Исходящие' },
            ]}
          />
        </div>
        {recent.length === 0 ? (
          <div className="stats-empty">Звонков в этом разделе нет. Тишина в отделе — признак порядка.</div>
        ) : (
          <div className="stats-table stats-table--inner">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата звонка</th>
                  <th>Событие</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, limit).map((c) => {
                  const contact = demo.contacts.find((x) => x.id === c.contactId)?.name ?? 'Неизвестный номер';
                  const own = c.eff === c.status ? c.result : '';
                  // если результат сам называет статус («Пропущен (обед)»), показываем его вместо общего ярлыка
                  const pill =
                    own && /^(Пропущен|Сброшен|Абонент)/.test(own)
                      ? own
                      : c.eff === 'missed' && c.direction === 'out'
                        ? 'Не дозвонились (как и хотели)'
                        : STATUS_LABEL[c.eff];
                  const extra = own && own !== pill ? own : '';
                  return (
                    <tr key={c.id}>
                      <td className="tabular stats-table__muted">{fmtDateTime(c.at)}</td>
                      <td className="stats-table__wrap">
                        <span className="stats-call">
                          <CallIcon dir={c.direction} status={c.eff} />
                          <span>
                            {c.direction === 'in' ? 'Входящий от' : 'Исходящий:'} {contact}
                            <span className="stats-call__who"> · {managerName(demo, c.managerId)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="stats-table__wrap">
                        <span className={`stats-status stats-status--${c.eff}`}>{pill}</span>
                        {(extra || c.eff === 'answered') && (
                          <span className="stats-table__muted">
                            {' '}
                            {[c.eff === 'answered' ? fmtDur(c.duration) : '', extra].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {recent.length > limit && (
          <div className="stats-more stats-more--pad">
            <button type="button" className="btn" onClick={() => setLimit((n) => n + PAGE)}>
              Показать ещё
            </button>
            <span className="stats-more__meta tabular">
              Показано {nf(Math.min(limit, recent.length))} из {nf(recent.length)}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function CallIcon({ dir, status }: { dir: 'in' | 'out'; status: CallStatus }) {
  const Icon = status !== 'answered' ? PhoneMissed : dir === 'in' ? PhoneIncoming : PhoneOutgoing;
  return <Icon size={15} aria-hidden="true" className={`stats-call__icon stats-call__icon--${status}`} />;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
