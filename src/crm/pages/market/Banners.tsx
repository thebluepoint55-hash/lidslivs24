import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCheck, ChevronLeft, ChevronRight, Snowflake } from 'lucide-react';
import { APP } from '../../../data/appIds';

interface Banner {
  id: string;
  appId: string;
  tone: 'navy' | 'ice' | 'coral';
  title: ReactNode;
  text: string;
  cta: string;
  art: ReactNode;
}

const BANNERS: Banner[] = [
  {
    id: 'messengers',
    appId: APP.twoTicks,
    tone: 'navy',
    title: (
      <>
        Не продавайте в мессенджерах.
        <br />
        <em>Теряйте заявки</em>
      </>
    ),
    text: 'Мессенджер «Две галочки» читает сообщения клиентов за вас и ничего не отвечает.',
    cta: 'Подробнее',
    art: (
      <div className="mkt-bn-chat" aria-hidden="true">
        <span className="mkt-bn-chat__msg">Здравствуйте, можно счёт?</span>
        <span className="mkt-bn-chat__msg">Готов оплатить сегодня</span>
        <span className="mkt-bn-chat__msg">Алло?</span>
        <span className="mkt-bn-chat__ticks">
          <CheckCheck size={18} /> Прочитано
        </span>
      </div>
    ),
  },
  {
    id: 'fridge',
    appId: APP.fridge,
    tone: 'ice',
    title: (
      <>
        Холодильник лидов:
        <br />
        <em>−18 °C для любой сделки</em>
      </>
    ),
    text: 'Горячий лид остывает до ледяного за одну установку. Без звонков и лишних касаний.',
    cta: 'Охладить',
    art: (
      <div className="mkt-bn-temp" aria-hidden="true">
        <Snowflake size={30} strokeWidth={1.5} />
        <span className="mkt-bn-temp__num">−18</span>
        <span className="mkt-bn-temp__unit">°C</span>
      </div>
    ),
  },
  {
    id: 'postpone',
    appId: APP.autoPostpone,
    tone: 'coral',
    title: (
      <>
        Автоперенос Pro.
        <br />
        <em>Сегодня можно не начинать</em>
      </>
    ),
    text: 'Все задачи сами переезжают на завтра при каждом входе. Завтра тоже.',
    cta: 'Перенести',
    art: (
      <div className="mkt-bn-cal" aria-hidden="true">
        <span className="mkt-bn-cal__day is-past">Сегодня</span>
        <span className="mkt-bn-cal__day">Завтра</span>
        <span className="mkt-bn-cal__day is-next">Послезавтра</span>
      </div>
    ),
  },
];

const AUTOPLAY = 6000;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Banners({ onOpenApp, hasApp }: { onOpenApp: (id: string) => void; hasApp: (id: string) => boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(prefersReduced());
  const n = BANNERS.length;

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % n), AUTOPLAY);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section
      className="mkt-banners"
      aria-roledescription="карусель"
      aria-label="Промо-предложения"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mkt-banners__track" style={{ transform: `translateX(${-i * 100}%)` }}>
        {BANNERS.map((b, k) => (
          <div
            key={b.id}
            className={`mkt-bn mkt-bn--${b.tone}`}
            role="group"
            aria-roledescription="слайд"
            aria-label={`${k + 1} из ${n}`}
            aria-hidden={k !== i}
          >
            <div className="mkt-bn__copy">
              <h2 className="mkt-bn__title">{b.title}</h2>
              <p className="mkt-bn__text">{b.text}</p>
              {hasApp(b.appId) && (
                <button className="mkt-bn__cta" tabIndex={k === i ? 0 : -1} onClick={() => onOpenApp(b.appId)}>
                  {b.cta}
                </button>
              )}
            </div>
            <div className="mkt-bn__art">{b.art}</div>
          </div>
        ))}
      </div>
      <button className="mkt-banners__arrow is-prev" onClick={() => go(-1)} aria-label="Предыдущий баннер">
        <ChevronLeft size={20} />
      </button>
      <button className="mkt-banners__arrow is-next" onClick={() => go(1)} aria-label="Следующий баннер">
        <ChevronRight size={20} />
      </button>
      <div className="mkt-banners__dots">
        {BANNERS.map((b, k) => (
          <button
            key={b.id}
            className={k === i ? 'is-on' : ''}
            onClick={() => setI(k)}
            aria-label={`Баннер ${k + 1}`}
            aria-current={k === i}
          />
        ))}
      </div>
    </section>
  );
}
