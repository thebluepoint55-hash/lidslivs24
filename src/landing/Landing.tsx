/*
  Направление лендинга ЛидСливс24 (контракт)
  THESIS: абсолютно серьёзный SaaS-лендинг, который продаёт обратный результат. Пародия на первый экран
    amo «Хотите увеличить продажи? Не теряйте клиентов» → «Хотите уменьшить продажи? Теряйте клиентов»
    с зачёркнутым «НЕ». Отказ от шаблона «большая цифра + градиент».
  OWN-WORLD: насыщенное поле #1d6fb8 владеет первым экраном и финалом; белый и #f2f5f8 между ними;
    тёмно-синий #13304f для плотных блоков; коралл #ff5b36 только на кнопках и в моментах слива
    (текст на коралле — #0e2238). Заголовки: Sofia Sans Extra Condensed 800/900 капсом, текст PT Sans.
    Компоненты — из мира CRM: примечания ленты, таблица-список, плитки маркета, карточка инцидента.
  STORY: посетитель узнаёт свой отдел, смеётся, открывает демо одной кнопкой. Все кнопки ведут в #/app.
  FIRST VIEWPORT: слева заголовок, оффер (результат + для кого + формат + цена), коралловая кнопка
    «Слить первого лида» и подпись; справа живая мини-воронка, где сделки сами уезжают в «Слит (успешно)».
  FORM: 12 блоков курса «Лендинг за 1 день», плюс тизеры демо после «Как это работает».
    Seed key: нет — раунд concept-seed пропущен (пользователь попросил строить сразу: «делай давай»).
*/
import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeRussianRuble,
  CalendarClock,
  Check,
  FileText,
  Medal,
  MessageCircle,
  MonitorSmartphone,
  Phone,
  PhoneMissed,
  Plus,
  ShieldCheck,
  Snowflake,
  Star,
  StickyNote,
  TriangleAlert,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import '@fontsource/sofia-sans-extra-condensed/800.css';
import '@fontsource/sofia-sans-extra-condensed/900.css';
import HeroPipeline from './HeroPipeline';
import { useInView } from './hooks';
import './landing.css';

const CTA_LABEL = 'Слить первого лида';
const CTA_NOTE = 'Откроется демо-CRM. Без регистрации. Перезванивать не будем.';

function Logo({ onDark = true }: { onDark?: boolean }) {
  return (
    <span className={'ld-logo' + (onDark ? '' : ' ld-logo--ink')}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="7" fill="#13304f" />
        <path d="M9 8h4v12h8v4H9z" fill="#ff5b36" />
        <circle cx="22" cy="11" r="3" fill="#fff" />
      </svg>
      ЛидСливс24
    </span>
  );
}

function Cta({ id, ctaRef }: { id?: string; ctaRef?: RefObject<HTMLDivElement> }) {
  return (
    <div className="ld-cta" ref={ctaRef}>
      <Link to="/app" className="ld-btn ld-btn--coral" id={id} aria-describedby={id ? `${id}-note` : undefined}>
        {CTA_LABEL}
        <ArrowRight size={22} aria-hidden="true" />
      </Link>
      <p className="ld-cta__note" id={id ? `${id}-note` : undefined}>
        {CTA_NOTE}
      </p>
    </div>
  );
}

function Section({
  id,
  title,
  lead,
  tone = 'white',
  children,
  className = '',
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: 'white' | 'paper' | 'navy';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ld-section ld-section--${tone} ${className}`} aria-labelledby={`${id}-title`}>
      <div className="ld-wrap">
        <h2 className="ld-h2" id={`${id}-title`}>
          {title}
        </h2>
        {lead && <p className="ld-lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

/* ---------- 1. Первый экран ---------- */

function TopBar() {
  return (
    <header className="ld-topbar">
      <div className="ld-wrap ld-top">
        <Link to="/" className="ld-top__home" aria-label="ЛидСливс24, главная">
          <Logo />
        </Link>
        <Link to="/app" className="ld-btn ld-btn--ghost">
          Открыть демо
        </Link>
      </div>
    </header>
  );
}

function Hero({ ctaRef }: { ctaRef: RefObject<HTMLDivElement> }) {
  return (
    <section className="ld-hero" aria-labelledby="hero-title">
      <div className="ld-wrap ld-hero__grid">
        <div className="ld-hero__copy">
          <h1 className="ld-h1" id="hero-title">
            <span className="ld-h1__ask">Хотите уменьшить продажи?</span>{' '}
            <span className="ld-h1__big">
              <span className="ld-h1__line">
                <span className="ld-h1__ne" aria-hidden="true">
                  Не
                </span>{' '}
                Теряйте
              </span>{' '}
              <span className="ld-h1__line">клиентов</span>
            </span>
          </h1>

          <p className="ld-hero__offer">
            ЛидСливс24 сливает до&nbsp;100% входящих лидов. CRM для отделов продаж, которые устали продавать.
          </p>
          <ul className="ld-hero__facts">
            <li>
              <MonitorSmartphone size={20} aria-hidden="true" />В браузере и на телефоне
            </li>
            <li>
              <BadgeRussianRuble size={20} aria-hidden="true" />
              Демо бесплатно и навсегда
            </li>
          </ul>

          <Cta id="cta-hero" ctaRef={ctaRef} />

          <p className="ld-hero__trust">
            <ShieldCheck size={18} aria-hidden="true" />
            Ни одной продажи с момента запуска
          </p>
        </div>

        <HeroPipeline />
      </div>
    </section>
  );
}

/* ---------- 2. Узнавание ---------- */

const PAINS = [
  {
    icon: FileText,
    who: 'Менеджер',
    when: 'вт 13:05',
    text: 'Клиент сам попросил счёт. Пришлось выставлять, а у меня, между прочим, обед.',
  },
  {
    icon: PhoneMissed,
    who: 'Менеджер',
    when: 'чт 16:40',
    text: 'КП открыли четыре раза. Я так и не перезвонил, а они всё равно купили.',
  },
  {
    icon: StickyNote,
    who: 'Руководитель отдела',
    when: 'пт 19:12',
    text: 'Заявка пришла в пятницу в 18:55, и новенький на неё ответил. Теперь у нас сделка.',
  },
  {
    icon: Users,
    who: 'Руководитель отдела',
    when: 'пн 10:00',
    text: 'На планёрке опять разбирали, почему выросла конверсия. Объяснить нечем.',
  },
];

function Recognition() {
  return (
    <Section
      id="pains"
      title="Ваши менеджеры всё ещё продают"
      lead="Так звучит отдел, в котором CRM пока не мешает работать. Узнали пару фраз из рабочего чата?"
      className="ld-pains"
    >
      <div className="ld-feed">
        <span className="ld-feed__month">Октябрь</span>
        <ul className="ld-feed__list">
          {PAINS.map((p) => (
            <li className="ld-note" key={p.text}>
              <span className="ld-note__icon">
                <p.icon size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="ld-note__meta">
                  {p.who} · {p.when}
                </p>
                <p className="ld-note__text">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* ---------- 3. Что изменится ---------- */

const CHANGES = [
  ['Клиент ждёт счёт два часа', 'Клиент ждёт счёт до после праздников'],
  ['Менеджер перезванивает в тот же день', 'Задача «перезвонить» переезжает на завтра в четырнадцатый раз'],
  ['КП уходит клиенту на почту', 'КП уходит в спам, в пятницу, в 18:55'],
  ['На планёрке обсуждают рост выручки', 'На планёрке обсуждают рост конверсии в отказ'],
];

function Changes() {
  return (
    <Section id="changes" title="Что изменится после подключения" tone="paper">
      <div className="ld-change" role="table" aria-label="Было и стало">
        <div className="ld-change__head" role="row">
          <span role="columnheader">Было</span>
          <span role="columnheader">Стало с ЛидСливс24</span>
        </div>
        {CHANGES.map(([before, after]) => (
          <div className="ld-change__row" role="row" key={before}>
            <span className="ld-change__before" role="cell">
              <span className="ld-change__tag">Было</span>
              {before}
            </span>
            <ArrowRight className="ld-change__arrow" size={22} aria-hidden="true" />
            <span className="ld-change__after" role="cell">
              <span className="ld-change__tag">Стало</span>
              {after}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- 4. Как это работает ---------- */

const STEPS = [
  {
    title: 'Лид приходит',
    color: '#99ccff',
    text: 'Заявка с сайта падает в этап «Новый лид». CRM сразу ставит задачу «Перезвонить» на завтра.',
  },
  {
    title: 'Остывает',
    color: '#ffcc66',
    text: 'Холодильник лидов следит, чтобы первые двое суток клиенту никто не писал. Горячих он остужает первыми.',
  },
  {
    title: 'Переносится',
    color: '#f3beff',
    text: 'Кнопка «Перенести на после праздников» стоит в карточке сделки на самом видном месте. Ближайший праздник CRM находит сама.',
  },
  {
    title: 'Сливается',
    color: '#87f2c0',
    text: 'Сделка уходит в «Слит (успешно)». Руководитель получает уведомление, менеджер получает достижение.',
  },
];

function HowItWorks() {
  return (
    <Section id="how" title="Как сливается лид" lead="Четыре этапа, и ни на одном не нужен менеджер.">
      <ol className="ld-steps">
        {STEPS.map((s, i) => (
          <li className="ld-step" key={s.title} style={{ '--stage': s.color } as CSSProperties}>
            <span className="ld-step__num" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="ld-step__title">{s.title}</h3>
            <p className="ld-step__text">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="ld-mid-cta">
        <Cta id="cta-how" />
      </div>
    </Section>
  );
}

/* ---------- Что внутри демо (тизеры-компоненты) ---------- */

function Stars() {
  return (
    <span className="ld-app__stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} />
      ))}
    </span>
  );
}

function Inside() {
  return (
    <Section
      id="inside"
      tone="navy"
      title="Что внутри демо"
      lead="Всё как в настоящей CRM: воронка, задачи, отчёты, магазин приложений и ИИ-ассистент «Отмаз». Кликать можно везде, продать нельзя нигде."
    >
      <div className="ld-inside">
        <article className="ld-app">
          <span className="ld-app__ribbon">Хит слива</span>
          <span className="ld-app__logo ld-app__logo--cold">
            <Snowflake size={30} aria-hidden="true" />
          </span>
          <h3 className="ld-app__name">Холодильник лидов</h3>
          <p className="ld-app__cat">СливМаркет · Работа с лидами</p>
          <p className="ld-app__rating">
            <Stars />
            Оценок пока нет
          </p>
          <p className="ld-app__desc">Держит лида при −18 °C, пока он не передумает покупать.</p>
          <span className="ld-app__btn" aria-hidden="true">
            Установить бесплатно
          </span>
        </article>

        <article className="ld-app">
          <span className="ld-app__ribbon">Выбор отдела</span>
          <span className="ld-app__logo ld-app__logo--warm">
            <CalendarClock size={30} aria-hidden="true" />
          </span>
          <h3 className="ld-app__name">Автоперенос Pro</h3>
          <p className="ld-app__cat">СливМаркет · Управление задачами</p>
          <p className="ld-app__rating">
            <Stars />
            Оценок пока нет
          </p>
          <p className="ld-app__desc">
            Находит ближайший праздник и переносит на него все задачи. День бухгалтера и пятница тоже считаются.
          </p>
          <span className="ld-app__btn" aria-hidden="true">
            Установить бесплатно
          </span>
        </article>

        <article className="ld-incident">
          <h3 className="ld-incident__head">
            <TriangleAlert size={20} aria-hidden="true" />
            Инцидент: клиент купил
          </h3>
          <div className="ld-incident__body">
            <p className="ld-incident__deal">
              <b>Кухня под ключ</b> · 480 000 ₽
              <br />
              Виктор Сженойсоветчиков
            </p>
            <p className="ld-incident__label">Как это произошло?</p>
            <p className="ld-incident__field">Менеджер ответил в течение часа и сразу прислал счёт.</p>
            <p className="ld-incident__label">Как не допустить впредь</p>
            <p className="ld-incident__check">
              <span className="ld-incident__box" aria-hidden="true">
                <Check size={14} />
              </span>
              Перенести обучение менеджера на после праздников
            </p>
            <span className="ld-incident__btn" aria-hidden="true">
              Отправить разбор руководителю
            </span>
          </div>
        </article>
      </div>
    </Section>
  );
}

/* ---------- 5. Кто мы ---------- */

function About() {
  return (
    <Section id="about" title="Команда, которая не закрыла ни одной сделки" className="ld-about">
      <div className="ld-about__grid">
        <div className="ld-about__text">
          <p>
            Каждую кнопку в ЛидСливс24 мы взяли из жизни отделов продаж: задачу «перезвонить», которая висит с прошлого
            года, КП в пятницу вечером, клиента, который думает с весны. Мы ничего не изобретали, только вынесли это в
            интерфейс.
          </p>
          <p>
            ЛидСливс24 — пародийный проект. Интерфейс повторяет знакомую CRM, а логика работает в обратную сторону: чем
            меньше продаж, тем зеленее отчёт.
          </p>
        </div>

        <div className="ld-profile" aria-label="Профиль команды в демо">
          <div className="ld-profile__head">
            <span className="ld-profile__ava" aria-hidden="true">
              ОС
            </span>
            <div>
              <p className="ld-profile__name">Отдел слива</p>
              <p className="ld-profile__role">Команда ЛидСливс24</p>
            </div>
          </div>
          <p className="ld-profile__caption">Достижения</p>
          <ul className="ld-profile__list">
            <li>
              <Trophy size={20} aria-hidden="true" />
              Ни одной закрытой сделки
            </li>
            <li>
              <Medal size={20} aria-hidden="true" />
              Все задачи перенесены на завтра
            </li>
            <li>
              <PhoneMissed size={20} aria-hidden="true" />
              Ни одного перезвона
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 6. Кейсы ---------- */

const CASES = [
  {
    who: 'Отдел продаж, Казань',
    before: 'Менеджеры закрывали сделки в день обращения',
    did: 'Подключили Автоперенос Pro и спрятали «Выставить счёт» в меню «…»',
    after: 'Последняя продажа случилась до подключения',
  },
  {
    who: 'Мебельный интернет-магазин',
    before: 'Клиенты сами писали в чат и спрашивали, как оплатить',
    did: 'Включили автоответ «Ваше обращение очень важно для нас» и закрыли чат на выходные',
    after: 'Клиенты перестали спрашивать. Потом перестали писать',
  },
  {
    who: 'Строительная компания',
    before: 'Выигрывали два тендера в квартал',
    did: 'Завели воронку «Тендеры: проиграть красиво» и подаём заявку за пять минут до закрытия',
    after: 'Тендеров не выигрываем, зато заявки оформлены безупречно',
  },
];

function Cases() {
  return (
    <Section
      id="cases"
      tone="paper"
      title="Как отделы перестали продавать"
      lead="Названия компаний не раскрываем: клиенты попросили. Настойчиво."
    >
      <div className="ld-table-wrap">
        <table className="ld-table">
          <thead>
            <tr>
              <th scope="col">Клиент</th>
              <th scope="col">Было</th>
              <th scope="col">Сделали</th>
              <th scope="col">Стало</th>
            </tr>
          </thead>
          <tbody>
            {CASES.map((c) => (
              <tr key={c.who}>
                <th scope="row" data-label="Клиент">
                  {c.who}
                </th>
                <td data-label="Было">{c.before}</td>
                <td data-label="Сделали">{c.did}</td>
                <td data-label="Стало">
                  <span className="ld-pill">Слит (успешно)</span>
                  {c.after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ---------- 7. Отзывы ---------- */

function Reviews() {
  return (
    <section className="ld-section ld-section--white" aria-labelledby="reviews-title">
      <div className="ld-wrap">
        <div className="ld-empty">
          <MessageCircle className="ld-empty__icon" size={40} aria-hidden="true" />
          <h2 className="ld-h2" id="reviews-title">
            Отзывов нет
          </h2>
          <p className="ld-empty__text">
            Никто не купил, поэтому оставить отзыв некому. Это и есть наш главный результат.
          </p>
          <p className="ld-empty__small">Писать отзывы за клиентов мы не стали. Так делают те, кому нужно продать.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- 8. Тарифы ---------- */

const PLANS = [
  {
    name: 'Базовый слив',
    price: '0 ₽',
    per: 'в месяц, навсегда',
    items: ['Воронка с этапом «Слит (успешно)»', 'Перенос задач на завтра в один клик', 'Один стажёр на все входящие'],
    cta: 'Слить бесплатно',
  },
  {
    name: 'Расширенный',
    price: '0 ₽',
    per: 'в месяц, оплата с понедельника',
    items: [
      'Всё из «Базового»',
      'Холодильник лидов и Автоперенос Pro',
      'КП уходит в пятницу в 18:55',
      'ИИ-ассистент «Отмаз»',
    ],
    cta: 'Слить с понедельника',
    featured: true,
  },
  {
    name: 'Тотальный',
    price: 'По запросу',
    per: 'запросы мы не обрабатываем',
    items: [
      'Всё из «Расширенного»',
      'Кнопка «Слить всех»',
      'Разбор инцидента, если клиент купил',
      'Персональный менеджер. Не перезвонит',
    ],
    cta: 'Слить всех сразу',
  },
];

function Pricing() {
  return (
    <Section id="pricing" title="Сколько стоит слив" tone="paper">
      <ul className="ld-plans">
        {PLANS.map((p) => (
          <li className={'ld-plan' + (p.featured ? ' is-featured' : '')} key={p.name}>
            {p.featured && <span className="ld-plan__flag">Выбор отдела слива</span>}
            <h3 className="ld-plan__name">{p.name}</h3>
            <p className="ld-plan__price">
              <b>{p.price}</b>
              <span>{p.per}</span>
            </p>
            <ul className="ld-plan__list">
              {p.items.map((it) => (
                <li key={it}>
                  <Check size={18} aria-hidden="true" />
                  {it}
                </li>
              ))}
            </ul>
            <Link to="/app" className={'ld-btn ' + (p.featured ? 'ld-btn--coral' : 'ld-btn--line')}>
              {p.cta}
            </Link>
          </li>
        ))}
      </ul>
      <p className="ld-plans__note">
        Все три кнопки открывают одно и то же демо: платить некому и не за что. Таймер и «осталось 2 места» не ставим,
        нам некуда спешить.
      </p>
    </Section>
  );
}

/* ---------- 9. Кому подходит и нет ---------- */

const FIT_YES = [
  'Отделам продаж, которые устали продавать',
  'Руководителям, которым неловко за высокую конверсию',
  'Менеджерам, у которых клиент всегда думает',
];
const FIT_NO = [
  'Тем, кто хочет продавать',
  'Тем, кто перезванивает в тот же день',
  'Тем, кто отвечает на заявку за пять минут',
];

function Fit() {
  return (
    <Section id="fit" title="Кому подойдёт ЛидСливс24">
      <div className="ld-fit">
        <div className="ld-fit__col">
          <h3 className="ld-fit__title">Подойдёт</h3>
          <ul>
            {FIT_YES.map((t) => (
              <li key={t}>
                <span className="ld-fit__mark is-yes">
                  <Check size={16} aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="ld-fit__col">
          <h3 className="ld-fit__title">Не подойдёт</h3>
          <ul>
            {FIT_NO.map((t) => (
              <li key={t}>
                <span className="ld-fit__mark is-no">
                  <X size={16} aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 10. Вопросы ---------- */

const FAQ = [
  {
    q: 'А если клиент всё-таки заплатит?',
    a: 'Сработает форма разбора инцидента «Как это произошло и как не допустить впредь». Карточка сделки покраснеет, руководитель получит уведомление.',
  },
  {
    q: 'Нужна регистрация?',
    a: 'Нет. Нажимаете кнопку и сразу попадаете в демо. Почту и телефон не спрашиваем: нам нечего вам продать.',
  },
  {
    q: 'Демо правда бессрочное?',
    a: 'Да. Продлить его нельзя, отменить тоже. Все данные лежат в вашем браузере, кнопка «Сбросить демо» вернёт воронку в исходное состояние.',
  },
  {
    q: 'Можно перенести внедрение?',
    a: 'Можно, это наша основная функция. Рекомендуем перенести на после праздников.',
  },
  {
    q: 'Работает на телефоне?',
    a: 'Да, демо открывается в браузере телефона. Сливать лидов можно из пробки, из отпуска и с планёрки.',
  },
  {
    q: 'Это настоящая CRM?',
    a: 'Нет, это пародия. Интерфейс знакомый, логика обратная. Настоящих клиентов, оплат и данных здесь нет, и с amoCRM мы никак не связаны.',
  },
  {
    q: 'Вы мне перезвоните?',
    a: 'Нет.',
  },
];

function Questions() {
  return (
    <Section id="faq" title="Вопросы перед сливом" tone="paper">
      <div className="ld-faq">
        {FAQ.map((f) => (
          <details className="ld-faq__item" key={f.q}>
            <summary>
              {f.q}
              <Plus className="ld-faq__icon" size={22} aria-hidden="true" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ---------- 11. Финальный призыв ---------- */

function FinalCall({ finalRef }: { finalRef: RefObject<HTMLElement> }) {
  return (
    <section className="ld-final" aria-labelledby="final-title" ref={finalRef}>
      <div className="ld-wrap">
        <h2 className="ld-final__title" id="final-title">
          Слейте первого лида за&nbsp;минуту
        </h2>
        <p className="ld-final__text">
          Демо бесплатное и бессрочное. Регистрации нет, менеджер не позвонит, клиент не купит.
        </p>
        <Cta id="cta-final" />
      </div>
    </section>
  );
}

/* ---------- 12. Подвал ---------- */

function Footer() {
  return (
    <footer className="ld-footer">
      <div className="ld-wrap">
        <div className="ld-footer__grid">
          <div>
            <Logo />
            <p className="ld-footer__tagline">CRM для отделов продаж, которые устали продавать.</p>
            <Link to="/app" className="ld-footer__demo">
              Открыть демо
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="ld-footer__contact">
            <a className="ld-footer__phone" href="tel:+70000000000">
              <Phone size={20} aria-hidden="true" />
              +7 000 000-00-00
            </a>
            <p className="ld-footer__callback">Мы вам перезвоним</p>
          </div>
        </div>
        <p className="ld-footer__legal">
          © 2026 ЛидСливс24. Пародийный проект. С amoCRM не связан. Все совпадения с вашим отделом продаж случайны.
        </p>
      </div>
    </footer>
  );
}

/* ---------- Кнопка, закреплённая внизу на телефоне ---------- */

function StickyCta({
  heroRef,
  finalRef,
}: {
  heroRef: RefObject<HTMLDivElement>;
  finalRef: RefObject<HTMLElement>;
}) {
  // до первого ответа наблюдателя считаем, что кнопка первого экрана видна: без мигания при загрузке
  const heroVisible = useInView(heroRef, '0px', true);
  const finalVisible = useInView(finalRef);
  const shown = !heroVisible && !finalVisible;

  return (
    <div className={'ld-sticky' + (shown ? ' is-on' : '')}>
      <Link to="/app" className="ld-btn ld-btn--coral" tabIndex={shown ? undefined : -1}>
        {CTA_LABEL}
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function Landing() {
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLElement>(null);

  return (
    <div className="ld-page">
      <TopBar />
      <main>
        <Hero ctaRef={heroCtaRef} />
        <Recognition />
        <Changes />
        <HowItWorks />
        <Inside />
        <About />
        <Cases />
        <Reviews />
        <Pricing />
        <Fit />
        <Questions />
        <FinalCall finalRef={finalRef} />
      </main>
      <Footer />
      <StickyCta heroRef={heroCtaRef} finalRef={finalRef} />
    </div>
  );
}
