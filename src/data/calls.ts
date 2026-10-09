import type { Call, CallStatus } from '../store/types';
import { deals } from './deals';
import { daysAgo, minutesAgo } from './time';

// Детерминированный генератор (mulberry32): при каждом сбросе демо звонки одинаковые
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(24_2026);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

/** Кто сколько звонков «обрабатывает». У Недозвоновой больше всех */
const managerWeights: [string, number][] = [
  ['m-nedozvonova', 30],
  ['m-perekurov', 20],
  ['m-zavtrakova', 15],
  ['m-perezvonov', 13],
  ['m-soglasuev', 12],
  ['you', 10],
];
const totalWeight = managerWeights.reduce((s, [, w]) => s + w, 0);

function pickManager(): string {
  let x = rnd() * totalWeight;
  for (const [id, w] of managerWeights) {
    x -= w;
    if (x < 0) return id;
  }
  return 'm-nedozvonova';
}

const missedResults = [
  'Пропущен',
  'Пропущен (обед)',
  'Пропущен (перекур)',
  'Пропущен (совещание)',
  'Абонент (мы) недоступен',
  'Пропущен: телефон на беззвучном',
];
const droppedResults = ['Сброшен вежливо', 'Сброшен: «вас не слышно»', 'Сброшен на втором гудке'];
const answeredIn = [
  'Сказали, что перезвоним',
  'Пообещали счёт завтра',
  'Сказали, что дорого',
  'Попросили написать на почту',
  'Предложили подождать до после праздников',
  'Перевели на руководство, клиент не дождался',
];
const answeredOut = [
  'Спросили, актуально ли ещё. Клиент удивился',
  'Позвонили не тому клиенту',
  'Попросили перезвонить через месяц',
  'Сообщили, что цены выросли',
];
const outFailed = ['Клиент не ответил (звонили в 7:58)', 'Набрали и сразу положили трубку'];

const openDeals = deals.filter((x) => x.contactId && !x.closedAt);

export const calls: Call[] = Array.from({ length: 150 }, (_, i) => {
  const managerId = pickManager();
  const own = openDeals.filter((x) => x.responsibleId === managerId);
  const deal = pick(own.length ? own : openDeals);
  const direction: 'in' | 'out' = rnd() < 0.8 ? 'in' : 'out';

  let status: CallStatus;
  const r = rnd();
  if (direction === 'in') {
    const missedShare = managerId === 'm-nedozvonova' ? 0.88 : 0.68;
    status = r < missedShare ? 'missed' : r < missedShare + 0.18 ? 'dropped' : 'answered';
  } else {
    status = r < 0.45 ? 'answered' : r < 0.7 ? 'dropped' : 'missed';
  }

  // пик пропущенных: 13:00–15:00 (обед плавно переходит в перекур)
  const hour = status === 'missed' && rnd() < 0.5 ? between(13, 14) : between(9, 18);
  const minute = between(0, 59);
  const day = between(0, 29);
  const at = day === 0 ? minutesAgo(between(15, 420)) : daysAgo(day, hour, minute);

  let duration = 0;
  let result: string;
  if (status === 'missed') {
    result = direction === 'in' ? pick(missedResults) : pick(outFailed);
  } else if (status === 'dropped') {
    duration = between(1, 6);
    result = direction === 'in' ? pick(droppedResults) : 'Положили трубку после «Алло, это кто?»';
  } else {
    duration = between(14, 95);
    result = direction === 'in' ? pick(answeredIn) : pick(answeredOut);
  }

  const c: Call = {
    id: `call-${i + 1}`,
    at,
    managerId,
    contactId: deal.contactId as string,
    dealId: deal.id,
    direction,
    status,
    duration,
    result,
  };
  return c;
}).sort((a, b) => b.at.localeCompare(a.at));
