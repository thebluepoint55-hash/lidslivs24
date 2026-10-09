import { Link } from 'react-router-dom';
import { Award, Lock, MessageSquare, Puzzle, Settings2 } from 'lucide-react';
import type { Achievement } from '../../../store/types';
import { useDemo } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Avatar, Button, PageHeader, fmtDate, plural } from '../../ui';
import { YOU } from '../../../data/base';
import { iconByName } from '../market/appIcon';
import './profile.css';

const ACH_COLOR: Record<string, string> = {
  'no-incidents': '#27ae60',
  'first-slit': '#2f80ed',
  fridge: '#3aa0d8',
  'postpone-master': '#e4a72f',
  elusive: '#9b6dd7',
  'friday-kp': '#ff5b36',
  bureaucrat: '#6b7c8c',
  'excuse-gen': '#d9578a',
  'app-tycoon': '#2bb38a',
};

function AchievementTile({ a }: { a: Achievement }) {
  const Icon = iconByName(a.icon, Award);
  const unlocked = !!a.unlockedAt;
  const black = a.id === 'black-mark';
  const progress = a.goal ? Math.min(a.progress ?? 0, a.goal) : 0;
  const pct = a.goal ? Math.round((progress / a.goal) * 100) : 0;

  if (black) {
    return (
      <li className={`prof-ach prof-ach--black${unlocked ? ' is-on' : ''}`}>
        <span className="prof-ach__icon" aria-hidden="true">
          <Icon size={24} strokeWidth={1.6} />
        </span>
        <div className="prof-ach__text">
          <strong>{a.title}</strong>
          {unlocked ? (
            <>
              <span>Вы допустили продажу. Это останется в личном деле.</span>
              <span className="prof-ach__date tabular">Выдана {fmtDate(a.unlockedAt!)}</span>
            </>
          ) : (
            <span>{a.description}</span>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className={`prof-ach${unlocked ? ' is-on' : ''}`} style={{ ['--ach' as string]: ACH_COLOR[a.id] ?? 'var(--accent)' }}>
      <span className="prof-ach__icon" aria-hidden="true">
        {unlocked ? <Icon size={24} strokeWidth={1.7} /> : <Lock size={20} strokeWidth={1.7} />}
      </span>
      <div className="prof-ach__text">
        <strong>{a.title}</strong>
        <span>{a.description}</span>
        {unlocked ? (
          <span className="prof-ach__date tabular">Получено {fmtDate(a.unlockedAt!)}</span>
        ) : a.goal ? (
          <span className="prof-ach__progress">
            <span className="prof-bar" role="progressbar" aria-valuemin={0} aria-valuemax={a.goal} aria-valuenow={progress} aria-label={a.title}>
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular">
              {progress} из {a.goal}
            </span>
          </span>
        ) : (
          <span className="prof-ach__date">Пока не получено</span>
        )}
      </div>
    </li>
  );
}

export default function Profile() {
  const demo = useDemo();
  const s = demo.stats;
  const mentor = demo.managers.find((m) => m.id === 'm-perezvonov') ?? demo.managers[0];
  const plan = demo.goals.find((g) => g.managerId === 'you')?.plan ?? 10;
  const planPct = Math.min(100, Math.round((s.slit / plan) * 100));
  const unlocked = demo.achievements.filter((a) => a.unlockedAt && a.id !== 'black-mark').length;
  const total = demo.achievements.filter((a) => a.id !== 'black-mark').length;

  const stats = [
    { label: 'Слито лидов', value: s.slit },
    { label: 'Перенесено задач', value: s.postponed },
    { label: 'Проигнорировано чатов', value: s.ignoredChats },
    { label: 'Сгенерировано отмазок', value: s.excusesGenerated },
    { label: 'Попыток выставить счёт', value: s.invoicesAttempted, warn: s.invoicesAttempted > 0 },
    { label: 'Инцидентов', value: s.incidents, danger: s.incidents > 0 },
  ];

  // «Чёрная метка» всегда в конце полки
  const shelf = [...demo.achievements].sort((a, b) => Number(a.id === 'black-mark') - Number(b.id === 'black-mark'));

  return (
    <div className="prof">
      <PageHeader title="Профиль" />
      <div className="prof-body">
        <section className="prof-card">
          <Avatar name="Вы Стажёр" color={YOU.color} size={84} />
          <div className="prof-card__main">
            <h2 className="prof-card__name">{YOU.fullName}</h2>
            <p className="prof-card__role">{YOU.role}</p>
            <p className="prof-card__motto">«{YOU.motto}»</p>
            <p className="prof-card__since">
              В отделе слива с {fmtDate(demo.seededAt)}. Испытательный срок: бессрочно.
            </p>
          </div>
          <div className="prof-plan">
            <div className="prof-plan__head">
              <span>План по сливу на месяц</span>
              <strong className="tabular">
                {s.slit} из {plan}
              </strong>
            </div>
            <span className="prof-bar prof-bar--plan" role="progressbar" aria-valuemin={0} aria-valuemax={plan} aria-valuenow={s.slit} aria-label="План по сливу">
              <span style={{ width: `${planPct}%` }} />
            </span>
            <p>{planPct >= 100 ? 'План выполнен. Геннадий доволен, но виду не подаёт.' : 'Слейте ещё пару лидов, и наставник вами загордится.'}</p>
          </div>
        </section>

        <section className="prof-stats" aria-label="Статистика слива">
          {stats.map((st) => (
            <div key={st.label} className={`prof-stat${st.danger ? ' is-danger' : ''}${st.warn ? ' is-warn' : ''}`}>
              <span className="prof-stat__value tabular">{st.value}</span>
              <span className="prof-stat__label">{st.label}</span>
            </div>
          ))}
        </section>

        <div className="prof-cols">
          <section className="prof-panel">
            <header className="prof-panel__head">
              <h2>Достижения</h2>
              <span className="prof-muted tabular">
                {unlocked} из {total}
              </span>
            </header>
            {shelf.length === 0 ? (
              <p className="prof-muted">Достижений пока нет. Зато нет и продаж.</p>
            ) : (
              <ul className="prof-shelf">
                {shelf.map((a) => (
                  <AchievementTile key={a.id} a={a} />
                ))}
              </ul>
            )}
          </section>

          <aside className="prof-side">
            {mentor && (
              <section className="prof-panel prof-mentor">
                <header className="prof-panel__head">
                  <h2>Наставник</h2>
                </header>
                <div className="prof-mentor__who">
                  <Avatar name={mentor.name} color={mentor.color} size={48} />
                  <div>
                    <strong>{mentor.name}</strong>
                    <span>{mentor.role}</span>
                  </div>
                </div>
                <blockquote className="prof-mentor__quote">{mentor.motto}</blockquote>
                <p className="prof-muted">
                  Закрепил за вами {demo.deals.filter((d) => d.responsibleId === 'you').length}{' '}
                  {plural(demo.deals.filter((d) => d.responsibleId === 'you').length, ['сделку', 'сделки', 'сделок'])}. Проверяет
                  вашу работу раз в квартал, если не перенесёт.
                </p>
                <Button
                  block
                  icon={<MessageSquare />}
                  onClick={() => toast(`${mentor.name.split(' ')[0]} прочитал и не ответил. Учитесь у лучших`)}
                >
                  Написать наставнику
                </Button>
              </section>
            )}
            <section className="prof-panel prof-links">
              <Link to="/app/settings/otmaz">
                <Settings2 size={16} aria-hidden="true" />
                Настроить Отмаз AI
              </Link>
              <Link to="/app/market?tab=installed">
                <Puzzle size={16} aria-hidden="true" />
                Мои приложения: {demo.apps.filter((a) => a.installed).length}
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
