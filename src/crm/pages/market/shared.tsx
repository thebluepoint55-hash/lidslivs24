import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CircleDashed, Clock3, Loader2, Star, Zap } from 'lucide-react';
import type { MarketApp, MarketCategory } from '../../../store/types';
import { useStore } from '../../../store/store';
import { APP } from '../../../data/appIds';
import { managers } from '../../../data/base';
import { Avatar, Button, Modal } from '../../ui';
import { AppLogo } from './appIcon';

export const CATEGORY_LABEL: Record<MarketCategory, string> = {
  messengers: 'Чаты и мессенджеры',
  telephony: 'Телефония',
  email: 'Email и SMS рассылки',
  website: 'Интеграция с веб-сайтом',
  tasks: 'Управление задачами',
  ai: 'ИИ',
  analytics: 'Аналитика',
  billing: 'Счета и эквайринги',
};

export const CATEGORY_ORDER: MarketCategory[] = [
  'messengers',
  'telephony',
  'email',
  'website',
  'tasks',
  'ai',
  'analytics',
  'billing',
];

export const BADGE_LABEL: Record<NonNullable<MarketApp['badge']>, string> = {
  hit: 'Хит слива',
  new: 'Новинка',
  beta: 'Beta',
};

export const fmtCount = (n: number) => n.toLocaleString('ru-RU');

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="mkt-stars" aria-label={`Рейтинг ${value.toFixed(1).replace('.', ',')} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= full ? 'is-on' : ''} aria-hidden="true" />
      ))}
    </span>
  );
}

export function DemoMark() {
  return (
    <span className="mkt-demo" title="Приложение по-настоящему меняет поведение демо">
      <Zap size={12} aria-hidden="true" />
      Работает в демо
    </span>
  );
}

// ---------- что меняется после установки ----------

const EFFECTS: Record<string, { text: string; to: string; cta: string }> = {
  [APP.autoPostpone]: {
    text: 'При каждом входе в CRM незакрытые задачи сами переедут на завтра. Вам останется только прийти.',
    to: '/app/tasks',
    cta: 'Открыть задачи',
  },
  [APP.fridge]: {
    text: 'Все открытые сделки заледенели. Загляните в воронку: там теперь −18 °C.',
    to: '/app/leads',
    cta: 'Открыть воронку',
  },
  [APP.priceX3]: {
    text: 'Бюджеты горячих и тёплых сделок утроены. Клиент узнает об этом из КП.',
    to: '/app/leads/list',
    cta: 'Посмотреть бюджеты',
  },
  [APP.excuses]: {
    text: 'В ленте сделки и в чатах появилась кнопка «Сгенерировать отмазку». Пользуйтесь без стеснения.',
    to: '/app/leads',
    cta: 'Открыть сделки',
  },
  [APP.unavailable]: {
    text: 'Входящие звонки теперь отмечаются как «Сброшен вежливо». Клиент слышит длинные гудки и думает, что вы заняты.',
    to: '/app/stats',
    cta: 'Открыть аналитику',
  },
  [APP.twoTicks]: {
    text: 'Мессенджер сам читает сообщения клиентов и не отвечает. У клиента горят две синие галочки.',
    to: '/app/chats',
    cta: 'Открыть чаты',
  },
  [APP.invoice]: {
    text: 'Счёт теперь можно выставить. Технически. Кнопка по-прежнему в меню «…» карточки сделки, за тремя подтверждениями.',
    to: '/app/leads',
    cta: 'Поискать кнопку',
  },
};

// ---------- согласование установки «Счёт на оплату (beta)» ----------

type ApproverState = 'wait' | 'busy' | 'done';

const approvers = [
  {
    name: managers.find((m) => m.id === 'm-soglasuev')?.name ?? 'Арсений Согласуев',
    role: 'Менеджер по согласованиям',
    color: '#e2574c',
    busy: 'Согласовывает с руководством…',
    done: 'Согласовано. Под мою ответственность, но без подписи',
    delay: 1900,
  },
  {
    name: managers.find((m) => m.id === 'm-perezvonov')?.name ?? 'Геннадий Перезвонов',
    role: 'Руководитель отдела слива',
    color: '#4c8bf7',
    busy: 'Обещал перезвонить…',
    done: 'Перезвонил. Разрешаю установить, но пользоваться не советую',
    delay: 2300,
  },
  {
    name: 'Бухгалтерия',
    role: 'Отдел, где выставляют счета',
    color: '#7d8a96',
    busy: 'На обеде. Потом совещание…',
    done: 'Согласовано. Оригинал заявки принесите на бумаге',
    delay: 2700,
  },
];

function ApprovalModal({ app, onClose, onApproved }: { app: MarketApp | null; onClose: () => void; onApproved: () => void }) {
  const [states, setStates] = useState<ApproverState[]>(['wait', 'wait', 'wait']);
  const [started, setStarted] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!app) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setStates(['wait', 'wait', 'wait']);
      setStarted(false);
    }
  }, [app]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    setStarted(true);
    let t = 300;
    approvers.forEach((a, i) => {
      timers.current.push(
        window.setTimeout(() => setStates((s) => s.map((v, j) => (j === i ? 'busy' : v))), t),
      );
      t += a.delay;
      timers.current.push(
        window.setTimeout(() => setStates((s) => s.map((v, j) => (j === i ? 'done' : v))), t),
      );
      t += 250;
    });
  };

  const allDone = states.every((s) => s === 'done');

  return (
    <Modal
      open={!!app}
      onClose={onClose}
      title="Требуется согласование трёх руководителей"
      footer={
        <>
          <Button onClick={onClose}>{allDone ? 'Передумать' : 'Отозвать заявку'}</Button>
          {allDone ? (
            <Button variant="primary" onClick={onApproved}>
              Установить
            </Button>
          ) : (
            <Button variant="primary" onClick={start} disabled={started}>
              {started ? 'Согласовывается…' : 'Отправить на согласование'}
            </Button>
          )}
        </>
      }
    >
      <p className="mkt-approve__lead">
        «{app?.name}» умеет выставлять счета клиентам. По регламенту отдела установку согласуют три человека. По очереди.
      </p>
      <ol className="mkt-approve">
        {approvers.map((a, i) => {
          const st = states[i];
          return (
            <li key={a.name} className={`mkt-approve__row is-${st}`}>
              <Avatar name={a.name} color={a.color} size={36} />
              <div className="mkt-approve__who">
                <strong>{a.name}</strong>
                <span>{a.role}</span>
              </div>
              <div className="mkt-approve__status" aria-live="polite">
                {st === 'wait' && (
                  <>
                    {started ? <Clock3 size={15} aria-hidden="true" /> : <CircleDashed size={15} aria-hidden="true" />}
                    {started ? 'В очереди' : 'Не отправлено'}
                  </>
                )}
                {st === 'busy' && (
                  <>
                    <Loader2 size={15} className="mkt-spin" aria-hidden="true" />
                    {a.busy}
                  </>
                )}
                {st === 'done' && (
                  <>
                    <Check size={15} aria-hidden="true" />
                    {a.done}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {allDone && (
        <p className="mkt-approve__final">
          Все трое согласовали. Такого в отделе не было с 2019 года. Установка займёт секунду, последствия могут быть необратимыми.
        </p>
      )}
    </Modal>
  );
}

// ---------- хук установки ----------

export function useInstallFlow(apps: MarketApp[]) {
  const installApp = useStore((s) => s.installApp);
  const uninstallApp = useStore((s) => s.uninstallApp);
  const navigate = useNavigate();
  const [approveId, setApproveId] = useState<string | null>(null);
  const [effectId, setEffectId] = useState<string | null>(null);

  const approveApp = apps.find((a) => a.id === approveId) ?? null;
  const effectApp = apps.find((a) => a.id === effectId) ?? null;
  const effect = effectApp
    ? EFFECTS[effectApp.id] ?? {
        text: 'Приложение уже работает. Разницу заметить сложно: продаж не было и до него.',
        to: '/app/leads',
        cta: 'Открыть воронку',
      }
    : null;

  const finishInstall = (app: MarketApp) => {
    installApp(app.id);
    if (app.worksInDemo) setEffectId(app.id);
  };

  const install = (app: MarketApp) => {
    if (app.installed) return;
    if (app.id === APP.invoice) {
      setApproveId(app.id);
      return;
    }
    finishInstall(app);
  };

  const uninstall = (app: MarketApp) => uninstallApp(app.id);

  const ui = (
    <>
      <ApprovalModal
        app={approveApp}
        onClose={() => setApproveId(null)}
        onApproved={() => {
          const a = approveApp;
          setApproveId(null);
          if (a) finishInstall(a);
        }}
      />
      <Modal
        open={!!effectApp}
        onClose={() => setEffectId(null)}
        title={effectApp ? `«${effectApp.name}» работает` : ''}
        footer={
          <>
            <Button onClick={() => setEffectId(null)}>Остаться в маркете</Button>
            {effect && (
              <Button
                variant="primary"
                onClick={() => {
                  setEffectId(null);
                  navigate(effect.to);
                }}
              >
                {effect.cta}
              </Button>
            )}
          </>
        }
      >
        {effectApp && effect && (
          <div className="mkt-effect">
            <AppLogo app={effectApp} size={48} />
            <p>{effect.text}</p>
          </div>
        )}
      </Modal>
    </>
  );

  return { install, uninstall, ui };
}
