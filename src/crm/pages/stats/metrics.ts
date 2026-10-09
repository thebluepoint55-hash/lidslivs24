// Общие расчёты для рабочего стола и аналитики.
// Всё считается из стора, поэтому действия пользователя сразу меняют отчёты.

import type { Call, CallStatus, Deal, DemoState, ID, Stage } from '../../../store/types';
import { isInstalled, stageOf } from '../../../store/store';
import { APP } from '../../../data/appIds';
import { YOU } from '../../../data/base';

// ---------- периоды ----------

export type PeriodKey = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'all' | 'custom';

export interface Range {
  from: number;
  to: number;
}

export interface CustomRange {
  from: string; // yyyy-mm-dd
  to: string;
}

const DAY = 86400_000;

export const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const toInputDate = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function defaultCustom(): CustomRange {
  const now = Date.now();
  return { from: toInputDate(now - 13 * DAY), to: toInputDate(now) };
}

export function periodRange(key: PeriodKey, custom?: CustomRange): Range {
  const now = Date.now();
  const today = startOfDay(now);
  switch (key) {
    case 'today':
      return { from: today, to: now };
    case 'yesterday':
      return { from: today - DAY, to: today - 1 };
    case 'week':
      return { from: today - 6 * DAY, to: now };
    case 'month':
      return { from: today - 29 * DAY, to: now };
    case 'quarter':
      return { from: today - 89 * DAY, to: now };
    case 'custom': {
      const c = custom ?? defaultCustom();
      const a = new Date(`${c.from}T00:00:00`).getTime();
      const b = new Date(`${c.to}T23:59:59`).getTime();
      if (Number.isNaN(a) || Number.isNaN(b)) return { from: today - 13 * DAY, to: now };
      return a <= b ? { from: a, to: b } : { from: startOfDay(b), to: a + DAY - 1 };
    }
    case 'all':
    default:
      return { from: 0, to: now };
  }
}

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  all: 'За всё время',
  custom: 'Период',
};

export function periodText(key: PeriodKey, custom?: CustomRange) {
  if (key !== 'custom') return PERIOD_LABEL[key];
  const r = periodRange(key, custom);
  const f = (ms: number) => new Date(ms).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  return `${f(r.from)}–${f(r.to)}`;
}

export const inRange = (iso: string | undefined, r: Range) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= r.from && t <= r.to;
};

/** Сделка «жила» в периоде: создана до его конца и не закрыта до его начала */
export const aliveIn = (d: Deal, r: Range) =>
  new Date(d.createdAt).getTime() <= r.to && (!d.closedAt || new Date(d.closedAt).getTime() >= r.from);

// ---------- люди ----------

export interface Person {
  id: ID | 'you';
  name: string;
  short: string;
  color: string;
  role: string;
}

export function people(s: DemoState): Person[] {
  return [
    ...s.managers.map((m) => ({ id: m.id, name: m.name, short: m.name, color: m.color, role: m.role })),
    { id: 'you', name: YOU.fullName, short: YOU.fullName, color: YOU.color, role: YOU.role },
  ];
}

export type Group = 'all' | 'team' | 'interns';

export const GROUP_LABEL: Record<Group, string> = {
  all: 'Все группы пользователей',
  team: 'Отдел слива',
  interns: 'Стажёры',
};

export const inGroup = (id: string, g: Group) => (g === 'all' ? true : g === 'interns' ? id === 'you' : id !== 'you');

// ---------- сделки ----------

export const kindOf = (s: DemoState, d: Deal) => stageOf(s, d)?.kind ?? 'open';
export const isLost = (s: DemoState, d: Deal) => kindOf(s, d) === 'lost';
export const isWon = (s: DemoState, d: Deal) => kindOf(s, d) === 'won';
export const isActive = (s: DemoState, d: Deal) => {
  const k = kindOf(s, d);
  return k === 'open' || k === 'payment';
};

/** День последнего инцидента (любая воронка) и сколько дней прошло */
export function lastIncident(s: DemoState): { days: number; deal?: Deal } {
  let best: Deal | undefined;
  for (const d of s.deals) {
    if (!isWon(s, d) || !d.closedAt) continue;
    if (!best || d.closedAt > (best.closedAt ?? '')) best = d;
  }
  if (!best?.closedAt) {
    // инцидентов не было ни разу: считаем от самой старой сделки
    const first = Math.min(Date.now(), ...s.deals.map((d) => new Date(d.createdAt).getTime()));
    return { days: Math.max(0, Math.floor((Date.now() - first) / DAY)) };
  }
  return { days: Math.max(0, Math.floor((Date.now() - new Date(best.closedAt).getTime()) / DAY)), deal: best };
}

/** Детерминированное «случайное» число для сделки — на каком этапе её потеряли */
export function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// ---------- причины слива ----------

export interface LossBucket {
  id: string;
  label: string;
  /** цвет для тёмной плитки рабочего стола (проверен валидатором для тёмного фона) */
  color: string;
  re?: RegExp;
}

export const LOSS_BUCKETS: LossBucket[] = [
  { id: 'competitor', label: 'Отдали конкурентам', color: '#3b8de6', re: /конкурент/i },
  { id: 'price', label: 'Сами сказали, что дорого', color: '#bd780c', re: /дорог|цен[аеуы]|скидк/i },
  { id: 'paper', label: 'Счёт и согласования', color: '#17a06c', re: /сч[её]т|соглас|договор|оплат|кнопк|юрист/i },
  { id: 'phone', label: 'Не взяли трубку', color: '#a46be3', re: /трубк|перекур|слышно|недоступ|не дозвон/i },
  { id: 'time', label: 'Тянули время', color: '#e0525a', re: /перезвон|подожд|опозд|после|через|ждал|весн|долго|завтра/i },
  { id: 'other', label: 'Прочее творчество', color: '#7d8b99' },
];

export const bucketOf = (reason?: string): LossBucket =>
  LOSS_BUCKETS.find((b) => b.re && reason && b.re.test(reason)) ?? LOSS_BUCKETS[LOSS_BUCKETS.length - 1];

export function lossBuckets(deals: Deal[]) {
  const map = new Map<string, { bucket: LossBucket; count: number; examples: string[] }>();
  for (const d of deals) {
    const b = bucketOf(d.lossReason);
    const cur = map.get(b.id) ?? { bucket: b, count: 0, examples: [] };
    cur.count += 1;
    if (d.lossReason && !cur.examples.includes(d.lossReason)) cur.examples.push(d.lossReason);
    map.set(b.id, cur);
  }
  // порядок фиксирован по сегменту, а не по рангу: цвет следует за сущностью
  return LOSS_BUCKETS.map((b) => map.get(b.id)).filter((x): x is NonNullable<typeof x> => !!x);
}

// ---------- звонки ----------

/** Статус звонка с учётом приложения «Абонент недоступен» */
export function callStatus(s: DemoState, c: Call): CallStatus {
  if (c.direction === 'in' && isInstalled(s, APP.unavailable)) return 'dropped';
  return c.status;
}

export const STATUS_LABEL: Record<CallStatus, string> = {
  missed: 'Пропущен',
  answered: 'Принят (к сожалению)',
  dropped: 'Сброшен вежливо',
};

// ---------- цвета графиков (проверены scripts/validate_palette.js) ----------

/** «Слито» и «Продано» на белом фоне */
export const SLIT_COLOR = '#0e9a8a';
export const SOLD_COLOR = '#e2574c';

/** Статусы звонков на белом фоне, порядок в стопке фиксирован */
export const CALL_COLORS: Record<CallStatus, string> = {
  missed: '#e2574c',
  answered: '#2f80ed',
  dropped: '#b7800f',
};
export const CALL_ORDER: CallStatus[] = ['missed', 'answered', 'dropped'];

// ---------- форматирование ----------

export const nf = (n: number) => Math.round(n).toLocaleString('ru-RU');

export function pct(n: number, digits?: number) {
  if (!Number.isFinite(n)) return '0%';
  const d = digits ?? (n > 0 && n < 1 ? 1 : 0);
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: d })}%`;
}

/** Сжатая сумма для подписей осей: 1,2 млн ₽ */
export function moneyShort(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₽`;
  if (a >= 1_000) return `${Math.round(n / 1_000).toLocaleString('ru-RU')} тыс. ₽`;
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

export const stageKindOrder = (st: Stage) => ({ open: 0, payment: 1, lost: 2, won: 3 })[st.kind];

// ---------- фильтр аналитики ----------

export interface StatsFilter {
  pipelineId: string; // 'all' | id
  managerId: string; // 'all' | id | 'you'
  period: PeriodKey;
  custom: CustomRange;
}

export interface ReportProps {
  filter: StatsFilter;
}

/** Сделки с учётом воронки и ответственного (без периода) */
export function scopeDeals(s: DemoState, f: StatsFilter): Deal[] {
  return s.deals.filter(
    (d) => (f.pipelineId === 'all' || d.pipelineId === f.pipelineId) && (f.managerId === 'all' || d.responsibleId === f.managerId),
  );
}

export const byManager = (f: StatsFilter, id: string) => f.managerId === 'all' || f.managerId === id;

/** Дней между датами (по умолчанию до «сейчас») */
export const daysBetween = (a: string, b?: string) =>
  Math.max(0, ((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / DAY);
