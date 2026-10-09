import { useEffect, useMemo, useState } from 'react';
import { ListX } from 'lucide-react';
import { managerName, useDemo } from '../../../store/store';
import type { EventLogItem } from '../../../store/types';
import { Empty, fmtDateTime, plural } from '../../ui';
import { inRange, nf, periodRange, type ReportProps } from './metrics';

const OBJECTS: EventLogItem['object'][] = ['Сделка', 'Задача', 'Контакт', 'Чат', 'Письмо', 'Приложение', 'Настройки'];
const PAGE = 50;

export default function EventsReport({ filter }: ReportProps) {
  const demo = useDemo();
  const [object, setObject] = useState<string>('all');
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const range = periodRange(filter.period, filter.custom);
    return demo.events
      .filter(
        (e) =>
          inRange(e.at, range) &&
          (object === 'all' || e.object === object) &&
          (filter.managerId === 'all' || e.authorId === filter.managerId),
      )
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }, [demo.events, filter, object]);

  useEffect(() => setLimit(PAGE), [filter, object]);

  const shown = list.slice(0, limit);
  const people = new Map<string, string>();
  const author = (id: string) => {
    if (!people.has(id)) people.set(id, managerName(demo, id));
    return people.get(id)!;
  };

  return (
    <div className="stats-report">
      <div className="stats-report__head">
        <label className="stats-inline-select">
          <span className="sr-only">Тип объекта</span>
          <select className="select" value={object} onChange={(e) => setObject(e.target.value)}>
            <option value="all">Все объекты</option>
            {OBJECTS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <span className="stats-report__meta tabular">
          {nf(list.length)} {plural(list.length, ['событие', 'события', 'событий'])}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="stats-card">
          <Empty icon={<ListX size={36} aria-hidden="true" />} title="К счастью, событий не найдено">
            За этот период отдел ничего не сделал. Обычно это лучший результат.
          </Empty>
        </div>
      ) : (
        <>
          <div className="table-wrap stats-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Автор</th>
                  <th>Объект</th>
                  <th>Название</th>
                  <th>Событие</th>
                  <th>Значение до</th>
                  <th>Значение после</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className={e.authorId === 'you' ? 'stats-table__you' : undefined}>
                    <td className="tabular stats-table__muted">{fmtDateTime(e.at)}</td>
                    <td>{author(e.authorId)}</td>
                    <td className="stats-table__muted">{e.object}</td>
                    <td className="stats-table__wrap">{e.objectName}</td>
                    <td className="stats-table__wrap">{e.event}</td>
                    <td className="stats-table__muted stats-table__wrap">{e.before ?? ''}</td>
                    <td className="stats-table__wrap">{e.after ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length > limit && (
            <div className="stats-more">
              <button type="button" className="btn" onClick={() => setLimit((n) => n + PAGE)}>
                Показать ещё {nf(Math.min(PAGE, list.length - limit))}
              </button>
              <span className="stats-more__meta tabular">
                Показано {nf(shown.length)} из {nf(list.length)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
