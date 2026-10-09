import { AlertTriangle, Medal } from 'lucide-react';
import { displayBudget, useDemo } from '../../../store/store';
import { Avatar, money } from '../../ui';
import { callStatus, inRange, isActive, isLost, isWon, nf, people, periodRange, periodText, scopeDeals, type ReportProps } from './metrics';

/** Среднее время ответа — честные цифры отдела */
const RESPONSE_TIME: Record<string, string> = {
  'm-perezvonov': 'после праздников',
  'm-zavtrakova': 'завтра с утра',
  'm-perekurov': '3 дня',
  'm-nedozvonova': 'не дозвонились узнать',
  'm-soglasuev': 'на согласовании',
};

export default function Employees({ filter }: ReportProps) {
  const demo = useDemo();
  const range = periodRange(filter.period, filter.custom);
  const deals = scopeDeals(demo, { ...filter, managerId: 'all' });

  const rows = people(demo)
    .filter((p) => filter.managerId === 'all' || p.id === filter.managerId)
    .map((p) => {
      const mine = deals.filter((d) => d.responsibleId === p.id);
      const slit = mine.filter((d) => isLost(demo, d) && inRange(d.closedAt, range)).length;
      const inWork = mine.filter((d) => isActive(demo, d)).length;
      const notes = demo.feed.filter((f) => f.kind === 'note' && f.authorId === p.id && inRange(f.at, range)).length;
      const tasks = demo.tasks.filter((t) => t.responsibleId === p.id);
      const tasksOpen = tasks.filter((t) => !t.done).length;
      const purchases = mine
        .filter((d) => isWon(demo, d) && inRange(d.closedAt, range))
        .reduce((a, d) => a + displayBudget(demo, d), 0);
      // у стажёра считаем его собственные переносы, у остальных — переносы их задач
      const postponed = p.id === 'you' ? demo.stats.postponed : tasks.reduce((a, t) => a + t.postpones, 0);
      const missed = demo.calls.filter(
        (c) => c.managerId === p.id && inRange(c.at, range) && callStatus(demo, c) !== 'answered',
      ).length;
      const response =
        p.id === 'you'
          ? demo.stats.ignoredChats > 0
            ? `не отвечаете в ${nf(demo.stats.ignoredChats)} чатах`
            : 'пока отвечаете. Зря'
          : (RESPONSE_TIME[p.id] ?? '3 дня');
      return { p, slit, inWork, notes, tasksOpen, purchases, postponed, missed, response };
    })
    .sort((a, b) => b.slit - a.slit || b.postponed - a.postponed);

  const total = rows.reduce(
    (a, r) => ({
      slit: a.slit + r.slit,
      inWork: a.inWork + r.inWork,
      notes: a.notes + r.notes,
      tasksOpen: a.tasksOpen + r.tasksOpen,
      purchases: a.purchases + r.purchases,
      postponed: a.postponed + r.postponed,
      missed: a.missed + r.missed,
    }),
    { slit: 0, inWork: 0, notes: 0, tasksOpen: 0, purchases: 0, postponed: 0, missed: 0 },
  );

  const who = filter.managerId === 'all' ? 'все сотрудники' : rows[0]?.p.name ?? '—';

  return (
    <div className="stats-report">
      <div className="stats-report__head">
        <h2 className="stats-report__caption">
          Отчёт по: <span>{who}</span> × <span>{periodText(filter.period, filter.custom).toLowerCase()}</span>
        </h2>
        <span className="stats-report__meta">Сортировка: лучшие сливщики сверху</span>
      </div>

      <div className="table-wrap stats-table">
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th className="num">Слито</th>
              <th className="num">Сделок в работе</th>
              <th className="num">Добавлено примечаний</th>
              <th className="num">Задач в работе</th>
              <th className="num">Сумма покупок</th>
              <th className="num">Перенесено задач</th>
              <th className="num">Пропущено звонков</th>
              <th>Среднее время ответа</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.p.id} className={r.p.id === 'you' ? 'stats-table__you' : undefined}>
                <td>
                  <span className="stats-person">
                    <Avatar name={r.p.name} color={r.p.color} size={26} />
                    <span className="stats-person__text">
                      <span className="stats-person__name">{r.p.name}</span>
                      <span className="stats-person__role">{r.p.role}</span>
                    </span>
                    {i === 0 && r.slit > 0 && (
                      <span className="stats-medal" title="Лучший сливщик периода">
                        <Medal size={16} aria-hidden="true" />
                        <span className="sr-only">Лучший сливщик периода</span>
                      </span>
                    )}
                  </span>
                </td>
                <td className="num stats-table__strong">{nf(r.slit)}</td>
                <td className="num">{nf(r.inWork)}</td>
                <td className="num">{nf(r.notes)}</td>
                <td className="num">{nf(r.tasksOpen)}</td>
                <td className={`num${r.purchases > 0 ? ' stats-table__bad' : ''}`}>
                  {r.purchases > 0 && <AlertTriangle size={14} aria-label="Инцидент" />} {money(r.purchases)}
                </td>
                <td className="num">{nf(r.postponed)}</td>
                <td className="num">{nf(r.missed)}</td>
                <td className="stats-table__muted">{r.response}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Итого</td>
              <td className="num">{nf(total.slit)}</td>
              <td className="num">{nf(total.inWork)}</td>
              <td className="num">{nf(total.notes)}</td>
              <td className="num">{nf(total.tasksOpen)}</td>
              <td className={`num${total.purchases > 0 ? ' stats-table__bad' : ''}`}>{money(total.purchases)}</td>
              <td className="num">{nf(total.postponed)}</td>
              <td className="num">{nf(total.missed)}</td>
              <td className="stats-table__muted">в среднем никогда</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
