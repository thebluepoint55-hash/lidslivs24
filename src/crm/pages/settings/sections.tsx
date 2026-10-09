import { useEffect, useState, type ReactNode } from 'react';
import {
  Check,
  Globe,
  GripVertical,
  Lock,
  MessageCircle,
  MessageSquare,
  PhoneOff,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { Settings as SettingsT, Stage } from '../../../store/types';
import { pipelineStages, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Avatar, Button, Modal, Switch } from '../../ui';
import { YOU } from '../../../data/base';
import { excuses } from '../../../data/excuses';
import { TONE_LABEL, withFlair } from '../assistant/answers';

type Patch = (p: Partial<SettingsT>) => void;

function Panel({ title, aside, children, className = '' }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`set-panel ${className}`}>
      {(title || aside) && (
        <header className="set-panel__head">
          {title && <h2 className="set-panel__title">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

function Row({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="set-row">
      <label className="set-row__label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="set-row__control">
        {children}
        {hint && <p className="set-row__hint">{hint}</p>}
      </div>
    </div>
  );
}

const withCurrent = (opts: string[], cur: string) => (opts.includes(cur) ? opts : [cur, ...opts]);

// ---------- Обновление ОСЕНЬ 2026 ----------

const RELEASE: { kind: 'new' | 'better' | 'fix' | 'removed'; text: string }[] = [
  { kind: 'new', text: 'Кнопку «Выставить счёт» спрятали ещё глубже. Теперь до неё три подтверждения и одно меню «…».' },
  { kind: 'better', text: 'Задачи переносятся на 40% быстрее. Перенос на после праздников занимает один клик вместо двух.' },
  { kind: 'new', text: 'Отмаз AI научился отвечать «перезвоню» тремя разными тонами, включая уклончивый.' },
  { kind: 'fix', text: 'Исправили редкую ошибку, из-за которой клиент мог дозвониться с первого раза.' },
  { kind: 'better', text: 'Этап «Оплата» свёрнут по умолчанию. Развернуть можно, но не нужно.' },
  { kind: 'new', text: 'В СливМаркете появился «Холодильник лидов». Охлаждает горячие сделки до −18 °C без участия менеджера.' },
  { kind: 'fix', text: 'Уведомление «Клиент хочет купить» больше не будит менеджера. Оно приходит после обеда.' },
  { kind: 'removed', text: 'Убрали кнопку «Перезвонить сейчас». За полгода её нажали дважды, оба раза случайно.' },
  { kind: 'better', text: 'Воронка стала шире на входе и уже у оплаты.' },
];

const RELEASE_LABEL = { new: 'Новое', better: 'Улучшено', fix: 'Исправлено', removed: 'Удалено' } as const;

export function UpdatesSection() {
  return (
    <>
      <Panel className="set-release">
        <p className="set-release__date">Выпуск от 1 октября 2026</p>
        <h2 className="set-release__title">Обновление ОСЕНЬ 2026</h2>
        <p className="set-release__lead">
          Осенью клиенты возвращаются из отпусков и хотят покупать. Мы подготовились: в этом выпуске девять изменений, и ни одно не
          помогает продавать.
        </p>
      </Panel>
      <Panel title="Что изменилось">
        <ul className="set-notes">
          {RELEASE.map((r, i) => (
            <li key={i}>
              <span className={`set-notes__kind set-notes__kind--${r.kind}`}>{RELEASE_LABEL[r.kind]}</span>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Что дальше">
        <p className="set-muted-p">
          Зимнее обновление выйдет после праздников. Каких именно, решим ближе к делу.
        </p>
      </Panel>
    </>
  );
}

// ---------- Общие настройки ----------

const TZ = [
  '(GMT +02:00) Калининград',
  '(GMT +03:00) Москва',
  '(GMT +04:00) Самара',
  '(GMT +05:00) Екатеринбург',
  '(GMT +07:00) Новосибирск',
  '(GMT +10:00) Владивосток',
  '(GMT +03:00) Москва, мысленно в отпуске',
];
const DATE_FORMATS = ['31.12.2026', '2026-12-31', '12/31/2026', 'После праздников'];
const CURRENCIES = ['Российский рубль', 'Казахстанский тенге', 'Доллар США', 'Обещания'];

export function GeneralSection({ draft, patch }: { draft: SettingsT; patch: Patch }) {
  return (
    <Panel title="Аккаунт">
      <Row label="Название аккаунта" htmlFor="set-name">
        <input
          id="set-name"
          className="input"
          value={draft.accountName}
          maxLength={60}
          onChange={(e) => patch({ accountName: e.target.value })}
        />
      </Row>
      <Row label="Адрес аккаунта" htmlFor="set-addr" hint="Адрес изменить нельзя. Клиенты всё равно его не найдут.">
        <div className="set-addr">
          <input id="set-addr" className="input" value="lidslivs24" readOnly />
          <span>.demo</span>
        </div>
      </Row>
      <Row label="Страна" htmlFor="set-country" hint="Страну меняет только Арсений Согласуев.">
        <select id="set-country" className="select" value="ru" disabled>
          <option value="ru">Россия</option>
        </select>
      </Row>
      <Row label="Часовой пояс" htmlFor="set-tz">
        <select id="set-tz" className="select" value={draft.timezone} onChange={(e) => patch({ timezone: e.target.value })}>
          {withCurrent(TZ, draft.timezone).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Row>
      <Row label="Формат даты" htmlFor="set-df">
        <select id="set-df" className="select" value={draft.dateFormat} onChange={(e) => patch({ dateFormat: e.target.value })}>
          {withCurrent(DATE_FORMATS, draft.dateFormat).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Row>
      <Row label="Валюта" htmlFor="set-cur">
        <select id="set-cur" className="select" value={draft.currency} onChange={(e) => patch({ currency: e.target.value })}>
          {withCurrent(CURRENCIES, draft.currency).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </Row>
      <Row label="Рабочие часы" htmlFor="set-wh" hint="Всё остальное время отдел на перекуре.">
        <input
          id="set-wh"
          className="input set-input--short tabular"
          value={draft.workHours}
          maxLength={20}
          onChange={(e) => patch({ workHours: e.target.value })}
        />
      </Row>
    </Panel>
  );
}

// ---------- Счёт и оплата ----------

const TARIFFS = [
  {
    id: 'base',
    name: 'Базовый слив',
    price: '0 ₽',
    per: 'за пользователя в месяц',
    features: ['Перенос задач на завтра', 'Воронка до 7 этапов слива', '20 шаблонов отмазок', 'Поддержка по почте, ответ в понедельник'],
  },
  {
    id: 'pro',
    name: 'Расширенный',
    price: '0 ₽',
    per: 'но с обязательствами',
    popular: true,
    features: [
      'Всё из «Базового слива»',
      'Автоперенос Pro и Холодильник лидов',
      'Отмаз AI с тоном «перезвоню»',
      'Отчёт «Конверсия в отказ»',
    ],
  },
  {
    id: 'total',
    name: 'Тотальный',
    price: 'Договорная',
    per: 'не договоримся',
    features: [
      'Всё из «Расширенного»',
      'Интеграция с конкурентом',
      'Личный менеджер, который не берёт трубку',
      'Этап «Оплата» не показывается никому',
    ],
  },
];

export function BillingSection() {
  const [asked, setAsked] = useState<string | null>(null);
  const tariff = TARIFFS.find((t) => t.id === asked);
  return (
    <>
      <Panel title="Ваш тариф: Вечный демо">
        <dl className="set-facts">
          <div>
            <dt>Действует до</dt>
            <dd>Бессрочно</dd>
          </div>
          <div>
            <dt>Следующее списание</dt>
            <dd>Никогда</dd>
          </div>
          <div>
            <dt>Пользователей</dt>
            <dd className="tabular">6 из 6</dd>
          </div>
          <div>
            <dt>Продлить или отменить</dt>
            <dd>Нельзя</dd>
          </div>
        </dl>
      </Panel>
      <div className="set-tariffs">
        {TARIFFS.map((t) => (
          <article key={t.id} className={`set-tariff${t.popular ? ' is-popular' : ''}`}>
            {t.popular && <span className="set-tariff__flag">Популярный</span>}
            <h3 className="set-tariff__name">{t.name}</h3>
            <p className="set-tariff__price">
              <strong className="tabular">{t.price}</strong>
              <span>{t.per}</span>
            </p>
            <ul className="set-tariff__list">
              {t.features.map((f) => (
                <li key={f}>
                  <Check size={15} aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={t.popular ? 'primary' : 'secondary'} block onClick={() => setAsked(t.id)}>
              Перейти
            </Button>
          </article>
        ))}
      </div>
      <Panel title="История платежей">
        <p className="set-muted-p">Платежей не было. Отдел этим гордится.</p>
      </Panel>
      <Modal
        open={!!tariff}
        onClose={() => setAsked(null)}
        title="Мы вам перезвоним"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setAsked(null);
              toast('Ждите звонка. Мы тоже подождём');
            }}
          >
            Буду ждать
          </Button>
        }
      >
        <div className="set-callback">
          <PhoneOff size={28} strokeWidth={1.6} aria-hidden="true" />
          <p>
            Заявка на тариф «{tariff?.name}» принята. Менеджер свяжется с вами в течение 3–5 рабочих кварталов. Не позвонил? Значит,
            тариф вам уже подошёл.
          </p>
        </div>
      </Modal>
    </>
  );
}

// ---------- Пользователи ----------

const RIGHTS = [
  { id: 'slit', label: 'Сливать сделки' },
  { id: 'postpone', label: 'Переносить задачи' },
  { id: 'ignore', label: 'Игнорировать чаты' },
  { id: 'pay', label: 'Видеть этап «Оплата»' },
  { id: 'invoice', label: 'Может выставлять счета', locked: true },
] as const;
type RightId = (typeof RIGHTS)[number]['id'];

const LAST_SEEN = ['вчера, 11:14', 'сегодня, 11:02', 'сегодня, 13:40 (на перекуре)', 'неделю назад', 'на согласовании'];

export function UsersSection() {
  const demo = useDemo();
  const users = [
    ...demo.managers.map((m, i) => ({ id: m.id, name: m.name, role: m.role, color: m.color, seen: LAST_SEEN[i % LAST_SEEN.length] })),
    { id: 'you', name: YOU.fullName, role: YOU.role, color: YOU.color, seen: 'сейчас' },
  ];
  const [rights, setRights] = useState<Record<string, Record<RightId, boolean>>>(() =>
    Object.fromEntries(
      users.map((u) => [u.id, { slit: true, postpone: true, ignore: true, pay: u.id === 'm-perezvonov', invoice: false }]),
    ),
  );

  const toggle = (uid: string, r: RightId) => {
    if (uid === 'you' && r === 'pay') {
      toast('Стажёрам этап «Оплата» не показываем, чтобы не расстраивать');
      return;
    }
    setRights((s) => {
      const next = { ...s, [uid]: { ...s[uid], [r]: !s[uid][r] } };
      return next;
    });
    const now = !rights[uid][r];
    toast(now ? 'Право выдано. Согласуев согласует до пятницы' : 'Право отозвано. Сотрудник узнает последним');
  };

  return (
    <>
      <Panel
        title="Пользователи"
        aside={
          <Button size="sm" icon={<Plus />} onClick={() => toast('Лимит: один стажёр на отдел. Стажёр уже есть, это вы')}>
            Добавить
          </Button>
        }
      >
        <div className="set-table-wrap">
          <table className="table set-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Группа</th>
                <th>Последний вход</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.id === 'you' ? 'is-you' : ''}>
                  <td>
                    <span className="set-user">
                      <Avatar name={u.id === 'you' ? 'Вы Стажёр' : u.name} color={u.color} size={28} />
                      {u.name}
                    </span>
                  </td>
                  <td>{u.role}</td>
                  <td>Отдел слива</td>
                  <td className="set-muted-td">{u.seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Права доступа">
        <div className="set-table-wrap">
          <table className="table set-table set-rights">
            <thead>
              <tr>
                <th>Пользователь</th>
                {RIGHTS.map((r) => (
                  <th key={r.id} className="set-rights__col">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  {RIGHTS.map((r) => {
                    const locked = 'locked' in r && r.locked;
                    return (
                      <td key={r.id} className="set-rights__cell">
                        {locked ? (
                          <span className="set-tip" data-tip="Запрещено политикой компании" title="Запрещено политикой компании">
                            <input type="checkbox" checked={false} disabled aria-label={`${r.label}: ${u.name}. Запрещено политикой компании`} readOnly />
                            <Lock size={12} aria-hidden="true" />
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={rights[u.id]?.[r.id] ?? false}
                            onChange={() => toggle(u.id, r.id)}
                            aria-label={`${r.label}: ${u.name}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

// ---------- Воронки и этапы ----------

const AMO_COLORS = ['#99ccff', '#ffff99', '#87f2c0', '#ffcc66', '#f3beff', '#ffcccc', '#ff8f92', '#fffeb2', '#f9deff', '#fffd7f', '#d0d0d0'];

const KIND_LABEL: Record<Stage['kind'], string> = {
  open: 'Рабочий этап',
  payment: 'Не рекомендуется',
  lost: 'Финал: успех',
  won: 'Инцидент',
};

function StageRow({ stage }: { stage: Stage }) {
  const updateStage = useStore((s) => s.updateStage);
  const [name, setName] = useState(stage.name);
  const [palette, setPalette] = useState(false);
  useEffect(() => setName(stage.name), [stage.name]);

  const commit = () => {
    const v = name.trim();
    if (!v) {
      setName(stage.name);
      toast('Этап без названия? Так клиенты точно догадаются', 'danger');
      return;
    }
    if (v === stage.name) return;
    updateStage(stage.id, { name: v });
    toast(`Этап переименован: «${v}»`);
  };

  const remove = () => {
    const msg: Record<Stage['kind'], string> = {
      lost: `«${stage.name}» удалить нельзя. На этом этапе держится весь отдел`,
      won: 'Этап инцидентов удалить нельзя: разборы должны где-то храниться',
      payment: '«Оплату» удалить нельзя. Её можно только не открывать',
      open: 'Удаление этапа отправлено на согласование Согласуеву',
    };
    toast(msg[stage.kind], stage.kind === 'lost' ? 'danger' : 'default');
  };

  return (
    <li className={`set-stage set-stage--${stage.kind}`}>
      <div className="set-stage__line">
        <GripVertical size={16} className="set-stage__grip" aria-hidden="true" />
        <button
          className="set-stage__swatch"
          style={{ background: stage.color }}
          onClick={() => setPalette((v) => !v)}
          aria-expanded={palette}
          aria-label={`Цвет этапа «${stage.name}»`}
        />
        <input
          className="input set-stage__name"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setName(stage.name);
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label="Название этапа"
        />
        <span className="set-stage__kind">{KIND_LABEL[stage.kind]}</span>
        <button className="set-icon-btn" onClick={remove} aria-label={`Удалить этап «${stage.name}»`} title="Удалить этап">
          <Trash2 size={16} />
        </button>
      </div>
      {palette && (
        <div className="set-palette" role="group" aria-label="Цвета этапа">
          {AMO_COLORS.map((c) => (
            <button
              key={c}
              className={`set-palette__c${c === stage.color ? ' is-on' : ''}`}
              style={{ background: c }}
              aria-label={c}
              aria-pressed={c === stage.color}
              onClick={() => {
                updateStage(stage.id, { color: c });
                setPalette(false);
                if (c !== stage.color) toast('Цвет этапа изменён. Клиенты не заметят');
              }}
            >
              {c === stage.color && <Check size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

export function PipelinesSection() {
  const demo = useDemo();
  const [pid, setPid] = useState(demo.pipelines[0]?.id ?? '');
  const stages = pipelineStages(demo, pid);
  return (
    <Panel
      title="Воронки и этапы"
      aside={
        <Button size="sm" icon={<Plus />} onClick={() => toast('Новые этапы слива добавляем после праздников')}>
          Добавить этап
        </Button>
      }
    >
      <div className="set-seg" role="tablist" aria-label="Воронки">
        {demo.pipelines.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === pid} className={p.id === pid ? 'is-on' : ''} onClick={() => setPid(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <ul className="set-stages">
        {stages.map((s) => (
          <StageRow key={s.id} stage={s} />
        ))}
      </ul>
      <p className="set-row__hint">Порядок этапов меняется после согласования. Цвета взяты из стандартной палитры.</p>
    </Panel>
  );
}

// ---------- Чаты и мессенджеры ----------

export const DEFAULT_TEMPLATES = [
  'Перезвоню после обеда',
  'Уточню у руководства',
  'Сейчас не сезон',
  'Счёт будет завтра',
  'Актуально? Уточню и вернусь',
  'Менеджер в отпуске до 2027 года',
];

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', note: 'Читаем, не отвечаем', icon: MessageCircle, on: true },
  { id: 'telegram', name: 'Telegram', note: 'Две синие галочки с 2024 года', icon: Send, on: true },
  { id: 'avito', name: 'Авито', note: 'Отвечаем «актуально» через неделю', icon: ShoppingBag, on: true },
  { id: 'site', name: 'Чат на сайте', note: 'Оператор всегда «отошёл»', icon: Globe, on: true },
  { id: 'max', name: 'MAX', note: 'Подключим после праздников', icon: MessageSquare, on: false },
];

export function ChatsSection({ templates, setTemplates }: { templates: string[]; setTemplates: (t: string[]) => void }) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(CHANNELS.map((c) => [c.id, c.on])));
  const [fresh, setFresh] = useState('');

  const add = () => {
    const v = fresh.trim();
    if (!v) return;
    setTemplates([...templates, v]);
    setFresh('');
  };

  return (
    <>
      <Panel title="Подключённые каналы">
        <ul className="set-switches">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.id}>
                <span className="set-switches__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="set-switches__text">
                  <strong>{c.name}</strong>
                  <span>{c.note}</span>
                </div>
                <Switch
                  checked={on[c.id]}
                  label={c.name}
                  onChange={(v) => {
                    setOn((s) => ({ ...s, [c.id]: v }));
                    toast(v ? `${c.name} подключён. Отвечать по-прежнему не обязательно` : `${c.name} отключён. Клиенты пишут в пустоту`);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="Шаблоны отмазок" aside={<span className="set-count tabular">{templates.length}</span>}>
        <p className="set-muted-p">Шаблоны появляются над полем ввода в каждом чате. Сохраните изменения кнопкой вверху.</p>
        <ul className="set-templates">
          {templates.map((t, i) => (
            <li key={i}>
              <input
                className="input"
                value={t}
                maxLength={120}
                onChange={(e) => setTemplates(templates.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Шаблон ${i + 1}`}
              />
              <button
                className="set-icon-btn"
                aria-label={`Удалить шаблон «${t}»`}
                onClick={() => setTemplates(templates.filter((_, j) => j !== i))}
              >
                <X size={16} />
              </button>
            </li>
          ))}
          {templates.length === 0 && <li className="set-muted-p">Шаблонов нет. Придётся придумывать отмазки самому.</li>}
        </ul>
        <form
          className="set-templates__add"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            className="input"
            value={fresh}
            maxLength={120}
            placeholder="Например: «Скину КП вечером»"
            onChange={(e) => setFresh(e.target.value)}
            aria-label="Новый шаблон"
          />
          <Button type="submit" icon={<Plus />} disabled={!fresh.trim()}>
            Добавить
          </Button>
        </form>
      </Panel>
    </>
  );
}

// ---------- Отмаз AI ----------

const TONES: { id: SettingsT['otmazTone']; title: string; text: string }[] = [
  { id: 'polite', title: 'Вежливый', text: 'Благодарит, обещает, не делает' },
  { id: 'evasive', title: 'Уклончивый', text: 'Отвечает так, что вопрос забывается' },
  { id: 'callback', title: '«Перезвоню»', text: 'Коротко, на бегу, с обещанием звонка' },
];

function creativityNote(v: number) {
  if (v < 35) return 'Шаблонно: клиент узнает отмазку с первого слова.';
  if (v < 70) return 'Сбалансированно: звучит как правда, если не вчитываться.';
  return 'Вдохновенно: Отмаз добавит убедительную деталь вроде магнитных бурь.';
}

export function OtmazSection({ draft, patch }: { draft: SettingsT; patch: Patch }) {
  const [n, setN] = useState(0);
  const list = excuses[draft.otmazTone];
  const preview = withFlair(list[n % list.length], draft.otmazCreativity, n);
  return (
    <>
      <Panel title="Модель">
        <dl className="set-facts">
          <div>
            <dt>Версия</dt>
            <dd>Отмаз-4 Turbo (уклончивая)</dd>
          </div>
          <div>
            <dt>Обучена на</dt>
            <dd className="tabular">12 000 переписок без единой продажи</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Тон отмазок">
        <div className="set-tones" role="radiogroup" aria-label="Тон отмазок">
          {TONES.map((t) => (
            <label key={t.id} className={`set-tone${draft.otmazTone === t.id ? ' is-on' : ''}`}>
              <input
                type="radio"
                name="otmaz-tone"
                value={t.id}
                checked={draft.otmazTone === t.id}
                onChange={() => {
                  patch({ otmazTone: t.id });
                  setN(0);
                }}
              />
              <strong>{t.title}</strong>
              <span>{t.text}</span>
              <em>«{excuses[t.id][0]}»</em>
            </label>
          ))}
        </div>
      </Panel>
      <Panel title="Креативность">
        <div className="set-slider">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft.otmazCreativity}
            onChange={(e) => patch({ otmazCreativity: Number(e.target.value) })}
            aria-label="Креативность"
            style={{ ['--val' as string]: `${draft.otmazCreativity}%` }}
          />
          <output className="set-slider__val tabular">{draft.otmazCreativity}%</output>
        </div>
        <p className="set-row__hint">{creativityNote(draft.otmazCreativity)}</p>
      </Panel>
      <Panel
        title="Пример отмазки"
        aside={
          <Button size="sm" onClick={() => setN((v) => v + 1)}>
            Другой вариант
          </Button>
        }
      >
        <div className="set-preview">
          <Sparkles size={18} aria-hidden="true" />
          <p>
            <span className="set-preview__tone">Тон: {TONE_LABEL[draft.otmazTone]}</span>
            {preview}
          </p>
        </div>
      </Panel>
    </>
  );
}

// ---------- Уведомления ----------

export function NotificationsSection({ draft, patch }: { draft: SettingsT; patch: Patch }) {
  return (
    <Panel title="Уведомления">
      <ul className="set-switches">
        <li>
          <div className="set-switches__text">
            <strong>Сообщать, если клиент хочет купить</strong>
            <span>Чтобы вы успели перенести задачу до того, как он позвонит.</span>
          </div>
          <Switch
            checked={draft.notifyBuyIntent}
            label="Сообщать, если клиент хочет купить"
            onChange={(v) => patch({ notifyBuyIntent: v })}
          />
        </li>
        <li className="is-locked">
          <div className="set-switches__text">
            <strong>
              Сообщать о новых заказах <span className="set-locked">заблокировано</span>
            </strong>
            <span>Заказов не бывает, поэтому и уведомлять не о чем.</span>
          </div>
          <span className="set-tip" data-tip="Запрещено политикой компании">
            <Switch checked={false} disabled label="Сообщать о новых заказах (заблокировано)" />
          </span>
        </li>
        <li>
          <div className="set-switches__text">
            <strong>Сообщать, если лид остывает слишком медленно</strong>
            <span>Подскажем, когда остывающему лиду пора помочь.</span>
          </div>
          <Switch
            checked={draft.notifyCooling}
            label="Сообщать, если лид остывает слишком медленно"
            onChange={(v) => patch({ notifyCooling: v })}
          />
        </li>
      </ul>
    </Panel>
  );
}
