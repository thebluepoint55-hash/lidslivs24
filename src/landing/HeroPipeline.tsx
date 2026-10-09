import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  BarChart3,
  Briefcase,
  CheckSquare,
  CircleCheck,
  LayoutGrid,
  Mail,
  Pause,
  Play,
  Search,
  Settings,
  Store,
} from 'lucide-react';
import { money, plural, useInView, useMediaQuery, usePageVisible, useReducedMotion } from './hooks';

/* Мини-воронка первого экрана: сделки сами переезжают из «Новый лид»
   в «Слит (успешно)». Единственный анимированный момент страницы. */

type Stage = { name: string; color: string };

const STAGE_NEW: Stage = { name: 'Новый лид', color: '#99ccff' };
const STAGE_THINK: Stage = { name: 'Клиент думает', color: '#ffcc66' };
const STAGE_HOLIDAY: Stage = { name: 'После праздников', color: '#f3beff' };
const STAGE_DONE: Stage = { name: 'Слит (успешно)', color: '#87f2c0' };

const STAGES_WIDE = [STAGE_NEW, STAGE_THINK, STAGE_HOLIDAY, STAGE_DONE];
const STAGES_NARROW = [STAGE_NEW, STAGE_THINK, STAGE_DONE];

type Lead = { who: string; title: string; note: string; date: string; sum: number; dot: 'late' | 'today' | 'none' };

const LEADS: Lead[] = [
  { who: 'Виктор Сженойсоветчиков', title: 'Кухня под ключ', note: 'Посоветуется с женой', date: 'вчера', sum: 480000, dot: 'late' },
  { who: 'Дмитрий Послепраздников', title: 'Окна на дачу', note: 'Перенесено 14 раз', date: '31.12', sum: 96000, dot: 'late' },
  { who: 'Марина Согласуева', title: 'Обучение отдела', note: 'Согласует с руководством', date: 'пн', sum: 210000, dot: 'today' },
  { who: 'Константин Недозвонов', title: 'Просил счёт до 12:00', note: 'Звонок: не набрали', date: 'сегодня', sum: 64000, dot: 'late' },
  { who: 'Светлана Напочтову', title: 'Скиньте КП на почту', note: 'КП ушло в спам', date: 'пт 18:55', sum: 150000, dot: 'none' },
  { who: 'Игорь Подумайкин', title: 'Горячий: остудить', note: 'Думает с апреля', date: '12.04', sum: 320000, dot: 'late' },
  { who: 'Павел Квартальнов', title: 'Лицензии на 40 мест', note: 'В следующем квартале', date: 'вт', sum: 560000, dot: 'today' },
  { who: 'Ирина Отпускова', title: 'Готова платить сегодня', note: 'Без задачи 9 дней', date: 'ср', sum: 88000, dot: 'none' },
  { who: 'Ольга Дороговатова', title: 'Сравнивает три КП', note: 'Сказали, что дорого', date: 'чт', sum: 130000, dot: 'late' },
  { who: 'Елена Нашладешевле', title: 'Повторный заказ', note: 'Передана стажёру', date: 'вчера', sum: 47000, dot: 'today' },
  { who: 'Андрей Неактуальнов', title: 'Доставка по области', note: 'Пока неактуально', date: '03.09', sum: 72000, dot: 'none' },
  { who: 'Сергей Бюджетнетов', title: 'Сайт с каталогом', note: 'Бюджет на следующий год', date: 'пн', sum: 260000, dot: 'late' },
  { who: 'Алла Перезвонова', title: 'Ждёт договор', note: 'Перезвонить через год', date: 'сегодня', sum: 115000, dot: 'today' },
  { who: 'Роман Вотпускебезсвязи', title: 'Аренда техники', note: 'Задача перенесена', date: 'вт', sum: 54000, dot: 'late' },
];

type Card = Lead & { id: number; stage: number; seq: number; leaving: boolean };

type State = {
  n: number;
  cards: Card[];
  step: number;
  seq: number;
  nextId: number;
  slit: number;
  toast: number;
  moved: number | null;
};

type Action = { type: 'reset'; n: number } | { type: 'tick' } | { type: 'purge' };

const FINAL_CAP = 3;
const START_SLIT = 7;

function makeCard(id: number, stage: number, seq: number): Card {
  return { ...LEADS[id % LEADS.length], id, stage, seq, leaving: false };
}

function init(n: number): State {
  const cards: Card[] = [];
  let seq = 0;
  let id = 0;
  // по две сделки в каждом этапе, самые старые справа
  for (let s = n - 1; s >= 0; s--) {
    for (let k = 0; k < 2; k++) cards.push(makeCard(id++, s, seq++));
  }
  return { n, cards, step: 0, seq, nextId: id, slit: START_SLIT, toast: 0, moved: null };
}

function live(cards: Card[]) {
  return cards.filter((c) => !c.leaving);
}

function move(st: State, card: Card): State {
  const to = card.stage + 1;
  const last = st.n - 1;
  let cards = st.cards.map((c) => (c.id === card.id ? { ...c, stage: to, seq: st.seq } : c));
  let { slit, toast } = st;

  if (to === last) {
    slit += 1;
    if (slit % 3 === 0) toast += 1;
    const done = live(cards)
      .filter((c) => c.stage === last)
      .sort((a, b) => a.seq - b.seq);
    if (done.length > FINAL_CAP) {
      const oldest = done[0].id;
      cards = cards.map((c) => (c.id === oldest ? { ...c, leaving: true } : c));
    }
  }

  return { ...st, cards, seq: st.seq + 1, slit, toast, moved: card.id };
}

function spawn(st: State): State {
  const card = makeCard(st.nextId, 0, st.seq);
  return { ...st, cards: [...st.cards, card], seq: st.seq + 1, nextId: st.nextId + 1, moved: null };
}

/* Цикл из n шагов: сначала двигаем самую старую сделку из предпоследнего
   этапа в «Слит», потом из этапа левее… последним шагом приходит новый лид. */
function tick(st: State): State {
  const { n } = st;
  let next = st;
  for (let tries = 0; tries < n; tries++) {
    const pos = next.step % n;
    next = { ...next, step: next.step + 1 };
    if (pos === n - 1) return spawn(next);
    const from = n - 2 - pos;
    const oldest = live(next.cards)
      .filter((c) => c.stage === from)
      .sort((a, b) => a.seq - b.seq)[0];
    if (oldest) return move(next, oldest);
  }
  return next;
}

function reducer(st: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return action.n === st.n ? st : init(action.n);
    case 'tick':
      return tick(st);
    case 'purge':
      return { ...st, cards: st.cards.filter((c) => !c.leaving) };
  }
}

const TICK_MS = 1500;
const TOAST_MS = 2600;

export default function HeroPipeline() {
  const wide = useMediaQuery('(min-width: 600px)');
  const n = wide ? 4 : 3;
  const stages = wide ? STAGES_WIDE : STAGES_NARROW;

  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const boardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boardRef);
  const [hover, setHover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const [st, dispatch] = useReducer(reducer, n, init);
  const running = !reduced && !userPaused && !hover && inView && pageVisible;

  useEffect(() => {
    dispatch({ type: 'reset', n });
  }, [n]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => window.clearInterval(t);
  }, [running]);

  const hasLeaving = st.cards.some((c) => c.leaving);
  useEffect(() => {
    if (!hasLeaving) return;
    const t = window.setTimeout(() => dispatch({ type: 'purge' }), 520);
    return () => window.clearTimeout(t);
  }, [hasLeaving]);

  const [toastOn, setToastOn] = useState(false);
  useEffect(() => {
    if (st.toast === 0) return;
    setToastOn(true);
    const t = window.setTimeout(() => setToastOn(false), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [st.toast]);
  // без анимации тост просто висит: так экран читается целиком
  const showToast = reduced || toastOn;

  // строка карточки внутри этапа: новые сверху, как в CRM
  const rows = new Map<number, number>();
  for (let s = 0; s < n; s++) {
    st.cards
      .filter((c) => c.stage === s)
      .sort((a, b) => b.seq - a.seq)
      .forEach((c, i) => rows.set(c.id, i));
  }

  const lanesStyle = { '--cols': n } as CSSProperties;

  return (
    <div className="ld-demo">
      <div
        ref={boardRef}
        className="ld-board"
        role="img"
        aria-label="Демонстрация воронки: сделки сами переезжают из этапа «Новый лид» через «Клиент думает» в «Слит (успешно)», счётчик слитых сделок растёт."
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        <div className="ld-board__side" aria-hidden="true">
          <span className="ld-board__acc">ЛС</span>
          <LayoutGrid size={18} />
          <Briefcase size={18} className="is-on" />
          <CheckSquare size={18} />
          <Mail size={18} />
          <BarChart3 size={18} />
          <Store size={18} />
          <Settings size={18} />
        </div>

        <div className="ld-board__main">
          <div className="ld-board__head">
            <span className="ld-board__title">Сделки</span>
            <span className="ld-board__search">
              <Search size={14} aria-hidden="true" />
              Поиск и фильтр
            </span>
            <span className="ld-board__count">
              Слито за сегодня:{' '}
              <b key={st.slit} className={running ? 'ld-bump' : undefined}>
                {st.slit}
              </b>
            </span>
            <span className="ld-board__anti">Слить всех</span>
          </div>

          <div className="ld-board__body">
            <div className="ld-board__cols" style={lanesStyle}>
              {stages.map((s, i) => {
                const inStage = live(st.cards).filter((c) => c.stage === i);
                const sum = inStage.reduce((acc, c) => acc + c.sum, 0);
                return (
                  <div className="ld-col" key={s.name} style={{ '--stage': s.color } as CSSProperties}>
                    <span className="ld-col__name">{s.name}</span>
                    <span className="ld-col__sum">
                      {inStage.length} {plural(inStage.length, 'сделка', 'сделки', 'сделок')}
                      <span className="ld-col__money">: {money(sum)}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="ld-board__lanes" style={lanesStyle}>
              {stages.map((s) => (
                <span className="ld-lane" key={s.name} />
              ))}
              {st.cards.map((c) => (
                <div
                  key={c.id}
                  className={
                    'ld-deal' +
                    (c.leaving ? ' is-leaving' : '') +
                    (c.id === st.moved && running ? ' is-moving' : '') +
                    (c.stage === n - 1 ? ' is-done' : '')
                  }
                  style={{ '--col': c.stage, '--row': rows.get(c.id) ?? 0 } as CSSProperties}
                >
                  <span className="ld-deal__who">{c.who}</span>
                  <span className="ld-deal__title">{c.title}</span>
                  <span className="ld-deal__meta">
                    <i className={`ld-deal__dot is-${c.dot}`} />
                    <span className="ld-deal__note">{c.note}</span>
                    <span className="ld-deal__date">{c.date}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={'ld-toast' + (showToast ? ' is-on' : '')} key={reduced ? 'static' : st.toast}>
            <CircleCheck size={18} aria-hidden="true" />
            Лид слит. Отличная работа
          </div>
        </div>
      </div>

      {!reduced && (
        <button type="button" className="ld-demo__pause" onClick={() => setUserPaused((p) => !p)}>
          {userPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {userPaused ? 'Продолжить слив' : 'Остановить слив'}
        </button>
      )}
    </div>
  );
}
