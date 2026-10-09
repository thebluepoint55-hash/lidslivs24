import type { Company, Contact, Deal, DemoState, Task, TaskType } from '../../../store/types';
import { nextHoliday } from '../../../store/store';

export const DAY = 86400_000;

/** Короткая подпись типа — в карточке «Связаться: текст» */
export const TYPE_SHORT: Record<TaskType, string> = {
  call: 'Связаться',
  meeting: 'Встреча',
  kp: 'Отправить КП',
  think: 'Подумать',
  followup: 'Напомнить о себе',
};

/** Полная подпись — в выборе типа */
export const TYPE_LONG: Record<TaskType, string> = {
  call: 'Связаться (не будем)',
  meeting: 'Встреча (перенести)',
  kp: 'Отправить КП (в пятницу вечером)',
  think: 'Подумать о клиенте',
  followup: 'Напомнить о себе (потом)',
};

export const TYPE_ORDER: TaskType[] = ['call', 'meeting', 'kp', 'think', 'followup'];

/** Результаты закрытия задачи — только отмазки */
export const RESULTS = [
  'Не дозвонились (не звонили)',
  'Клиент думает, не будем мешать',
  'Перезвоню после обеда',
  'Уточню у руководства',
  'Сейчас не сезон',
  'КП отправлено (в спам)',
  'Договорились созвониться после праздников',
];

export type Bucket = 'overdue' | 'today' | 'tomorrow' | 'later';

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());

export function bucketOf(t: Task, now = Date.now()): Bucket {
  const due = new Date(t.due);
  if (due.getTime() < now) return 'overdue';
  const today = new Date(now);
  if (sameDay(due, today)) return 'today';
  if (sameDay(due, addDays(today, 1))) return 'tomorrow';
  return 'later';
}

export const isOverdue = (t: Task) => !t.done && new Date(t.due).getTime() < Date.now();

export interface TaskCtx {
  deal?: Deal;
  contact?: Contact;
  company?: Company;
}

export function taskCtx(demo: DemoState, t: Task): TaskCtx {
  const deal = t.dealId ? demo.deals.find((d) => d.id === t.dealId) : undefined;
  const contactId = t.contactId ?? deal?.contactId;
  const contact = contactId ? demo.contacts.find((c) => c.id === contactId) : undefined;
  const companyId = deal?.companyId ?? contact?.companyId;
  const company = companyId ? demo.companies.find((c) => c.id === companyId) : undefined;
  return { deal, contact, company };
}

/** «Сегодня», «Вчера», «Завтра» или дата */
export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, addDays(today, -1))) return 'Вчера';
  if (sameDay(d, addDays(today, 1))) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return 'Весь день';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export const forWhom = (demo: DemoState, id: Task['responsibleId']) =>
  id === 'you' ? 'вас' : demo.managers.find((m) => m.id === id)?.name ?? '—';

/** Сколько дней до «после праздников» от текущего срока задачи */
export function daysToHoliday(t: Task) {
  const h = nextHoliday();
  const base = Math.max(Date.now(), new Date(t.due).getTime());
  return { days: Math.max(1, Math.ceil((h.date.getTime() - base) / DAY)), name: h.name };
}
