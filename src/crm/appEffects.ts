import type { ChatThread, Deal, DemoState } from '../store/types';
import { APP } from '../data/appIds';
import { isInstalled, stageOf } from '../store/store';

/**
 * Видимые эффекты приложений СливМаркета, которые не меняют данные:
 * метки на карточках сделок и автоответы в чатах.
 * Эффекты, меняющие данные (переносы, теги, сообщения), живут в store.ts.
 */

/** Стабильное псевдослучайное число из строки — чтобы метки не прыгали при каждом рендере */
export function hashOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type ChipTone = 'neutral' | 'danger' | 'muted' | 'info';

export interface AppChip {
  key: string;
  label: string;
  tone: ChipTone;
  title: string;
}

/** Метки, которые установленные приложения вешают на карточку сделки */
export function appChipsForDeal(demo: DemoState, deal: Deal): AppChip[] {
  const stage = stageOf(demo, deal);
  if (!stage || stage.kind !== 'open') return [];
  const chips: AppChip[] = [];
  const h = hashOf(deal.id);

  if (isInstalled(demo, APP.solvency) && deal.buyChance >= 85) {
    chips.push({ key: 'solvency', label: 'Сирена: готов платить', tone: 'danger', title: 'Детектор платёжеспособности' });
  }
  if (deal.tags.includes('передан конкуренту')) {
    chips.push({ key: 'competitor', label: 'Передан конкуренту', tone: 'muted', title: 'Интеграция с конкурентом' });
  }
  if (isInstalled(demo, APP.notOurClient)) {
    chips.push({ key: 'notours', label: `Не наш клиент · ${95 + (h % 5)}%`, tone: 'muted', title: 'Квалификатор «Не наш клиент»' });
  }
  if (isInstalled(demo, APP.questForm) && stage.id === demo.stages.find((s) => s.pipelineId === deal.pipelineId)?.id) {
    chips.push({ key: 'quest', label: `Квест: шаг ${3 + (h % 41)} из 47`, tone: 'info', title: 'Форма заявки «Квест»' });
  }
  return chips;
}

const DISSUADE = [
  'Бот: Вы уверены, что вам это нужно? Многие наши клиенты отлично живут без этого.',
  'Бот: Предлагаем подумать до понедельника. Лучше до следующего.',
  'Бот: По статистике, 9 из 10 клиентов потом жалеют. Десятый не пишет.',
  'Бот: Цена может вырасти. А может и не вырасти. Подождите и узнаете.',
  'Бот: Посмотрите ещё варианты у конкурентов. Ссылки прислать?',
  'Бот: Прежде чем покупать, посоветуйтесь с семьёй, юристом и астрологом.',
  'Бот: Покупка — большой шаг. Давайте начнём с маленького: с паузы.',
  'Бот: Мы бы не торопились. Мы, собственно, и не торопимся.',
];

const VACATION = 'Автоответ: Я в отпуске до 2027 года. По срочным вопросам обращайтесь после отпуска.';

/**
 * Виртуальные ответы, которые показываются после последнего сообщения клиента в серии.
 * Ключ — id сообщения клиента, после которого их нарисовать.
 */
export function autoRepliesFor(demo: DemoState, thread: ChatThread): Map<string, { author: string; text: string }[]> {
  const out = new Map<string, { author: string; text: string }[]>();
  const vacation = isInstalled(demo, APP.vacation);
  const bot = isInstalled(demo, APP.dissuadeBot);
  if (!vacation && !bot) return out;
  thread.messages.forEach((m, i) => {
    if (m.from !== 'client') return;
    const next = thread.messages[i + 1];
    if (next && next.from === 'client') return; // отвечаем на серию целиком
    const list: { author: string; text: string }[] = [];
    if (vacation) list.push({ author: 'Режим отпуска', text: VACATION });
    if (bot) list.push({ author: 'Отговаривающий бот', text: DISSUADE[hashOf(m.id) % DISSUADE.length] });
    out.set(m.id, list);
  });
  return out;
}

/** Минут до следующего перекура (каждый час в :00 и :30) — для виджета «Синхронизация с перекуром» */
export function minutesToSmoke(now = new Date()) {
  const m = now.getMinutes();
  return m < 30 ? 30 - m : 60 - m;
}
