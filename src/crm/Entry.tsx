import { useEffect, useState } from 'react';
import './entry.css';

const STEPS = [
  'Готовим вам воронку слива…',
  'Охлаждаем горячих лидов…',
  'Переносим задачи на завтра…',
  'Прячем кнопку «Выставить счёт»…',
];

/** Экран входа в демо. Без регистрации: пару секунд «готовимся» и пускаем */
export default function Entry({ onDone, animate }: { onDone?: () => void; animate?: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 620);
    const done = setTimeout(() => {
      try {
        sessionStorage.setItem('ls24-entered', '1');
      } catch {
        /* приватный режим */
      }
      onDone?.();
    }, 2600);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [animate, onDone]);

  return (
    <div className="entry">
      <div className="entry__card">
        <div className="entry__logo" aria-hidden="true">
          <span>Лид</span>Сливс<sup>24</sup>
        </div>
        <p className="entry__step" aria-live="polite">
          {STEPS[step]}
        </p>
        <div className="entry__bar">
          <div className={`entry__fill${animate ? ' entry__fill--run' : ''}`} />
        </div>
        <p className="entry__note">Демо-доступ без регистрации. Бессрочно.</p>
      </div>
    </div>
  );
}
