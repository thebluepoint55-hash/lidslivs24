import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type {
  AuthorId,
  Deal,
  DemoState,
  EventLogItem,
  FeedItem,
  FeedKind,
  ID,
  Settings,
  Stage,
  Task,
  TaskType,
  Temperature,
} from './types';
import { buildSeed, SEED_VERSION } from '../data';
import { APP } from '../data/appIds';
import { excuses, holidays, type AntiActionId } from '../data/excuses';
import { toast } from './ui';

// ---------- утилиты ----------

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
const nowIso = () => new Date().toISOString();
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

/** Ближайший праздник после сегодняшнего дня */
export function nextHoliday(from = new Date()): { date: Date; name: string } {
  const y = from.getFullYear();
  const candidates = [y, y + 1].flatMap((year) =>
    holidays.map((h) => ({ date: new Date(year, h.month - 1, h.day, 10), name: h.name })),
  );
  const after = candidates.filter((c) => c.date.getTime() > from.getTime() + 86400_000).sort((a, b) => +a.date - +b.date);
  const h = after[0];
  // «после праздников» — на следующий день после праздника
  return { date: new Date(h.date.getTime() + 86400_000), name: h.name };
}

const coolDown: Record<Temperature, Temperature> = { hot: 'warm', warm: 'cold', cold: 'ice', ice: 'ice' };

// Демо живёт в рамках одной вкладки: sessionStorage переживает перезагрузку страницы,
// но очищается при закрытии вкладки. Каждое новое открытие начинается с исходных данных.
// Обёртка безопасна: в приватном режиме хранилище может бросать исключения.
const LEGACY_KEY = 'lidslivs24-demo';
try {
  // старые версии хранили демо в localStorage — подчищаем, чтобы оно не возвращалось
  localStorage.removeItem(LEGACY_KEY);
} catch {
  /* ignore */
}

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* демо продолжит работать без сохранения */
    }
  },
  removeItem: (k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

// ---------- селекторы с учётом установленных приложений ----------

export const isInstalled = (s: DemoState, appId: string) => s.apps.some((a) => a.id === appId && a.installed);

export const displayTemperature = (s: DemoState, d: Deal): Temperature =>
  isInstalled(s, APP.fridge) && stageOf(s, d)?.kind === 'open' ? 'ice' : d.temperature;

export const displayBudget = (s: DemoState, d: Deal): number =>
  isInstalled(s, APP.priceX3) && (d.temperature === 'hot' || d.temperature === 'warm') ? d.budget * 3 : d.budget;

export const stageOf = (s: DemoState, d: Deal): Stage | undefined => s.stages.find((st) => st.id === d.stageId);

export const pipelineStages = (s: DemoState, pipelineId: ID) => s.stages.filter((st) => st.pipelineId === pipelineId);

export const managerName = (s: DemoState, id: AuthorId | undefined): string => {
  if (id === 'you') return 'Вы (стажёр)';
  if (id === 'robot') return 'Робот';
  if (id === 'client') return 'Клиент';
  return s.managers.find((m) => m.id === id)?.name ?? '—';
};

// ---------- стор ----------

export interface Store {
  demo: DemoState | null;
  hydrated: boolean;

  ensureSeed: () => Promise<void>;
  resetDemo: () => Promise<void>;
  enterDemo: () => void;
  finishTour: () => void;

  // сделки
  addDeal: (p: { title: string; contactName?: string; budget: number; stageId: ID; sendOut: boolean }) => ID | null;
  updateDeal: (id: ID, patch: Partial<Deal>, label?: string) => void;
  moveDeal: (id: ID, stageId: ID) => void;
  postponeDeal: (id: ID) => void;
  antiAction: (id: ID, action: AntiActionId) => void;
  slitDeal: (id: ID, reason: string) => void;
  reportIncident: (id: ID, answers: { what: string; who: string; how: string }) => void;
  issueInvoice: (id: ID) => void;
  addNote: (dealId: ID, text: string, kind?: FeedKind) => void;
  generateExcuse: () => string;

  // задачи
  addTask: (p: { dealId?: ID; type: TaskType; text: string; due: string }) => void;
  postponeTask: (id: ID, days?: number) => void;
  /** перетаскивание задачи: новый срок и шутливый тост */
  moveTask: (id: ID, due: string, message: string) => void;
  postponeAllTasks: () => number;
  completeTask: (id: ID, result: string) => void;

  // чаты и почта
  readChat: (id: ID) => void;
  sendChat: (id: ID, text: string) => void;
  ignoreChat: (id: ID) => void;
  readEmail: (id: ID) => void;
  replyEmail: (id: ID, text: string) => void;

  // маркет, настройки, уведомления
  installApp: (id: ID) => void;
  uninstallApp: (id: ID) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateStage: (id: ID, patch: Partial<Pick<Stage, 'name' | 'color'>>) => void;
  markNotificationsRead: () => void;
}

type Draft = DemoState;

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Применить изменение к demo и пересчитать достижения */
      const mutate = (fn: (d: Draft) => void) => {
        const cur = get().demo;
        if (!cur) return;
        const next: Draft = structuredClone(cur);
        fn(next);
        syncAchievements(next);
        set({ demo: next });
      };

      const log = (d: Draft, e: Omit<EventLogItem, 'id' | 'at' | 'authorId'> & { authorId?: AuthorId }) => {
        d.events.unshift({ id: uid('ev'), at: nowIso(), authorId: e.authorId ?? 'you', ...e });
      };

      const feed = (d: Draft, item: Omit<FeedItem, 'id' | 'at'> & { at?: string }) => {
        d.feed.push({ id: uid('f'), at: item.at ?? nowIso(), ...item });
      };

      const notify = (d: Draft, text: string, link?: string) => {
        d.notifications.unshift({ id: uid('n'), at: nowIso(), text, read: false, link });
      };

      const findDeal = (d: Draft, id: ID) => d.deals.find((x) => x.id === id);

      const moveToStage = (d: Draft, deal: Deal, stage: Stage, by: AuthorId = 'you') => {
        const from = d.stages.find((s) => s.id === deal.stageId);
        if (!from || from.id === stage.id) return;
        deal.stageId = stage.id;
        deal.stageSince = nowIso();
        if (stage.kind === 'lost' || stage.kind === 'won') deal.closedAt = nowIso();
        else delete deal.closedAt;
        feed(d, { dealId: deal.id, kind: 'stage', authorId: by, text: `Этап изменён: ${from.name} → ${stage.name}` });
        log(d, { object: 'Сделка', objectName: deal.title, event: 'Этап изменён', before: from.name, after: stage.name, authorId: by });
      };

      return {
        demo: null,
        hydrated: false,

        ensureSeed: async () => {
          const cur = get().demo;
          if (cur && cur.version === SEED_VERSION && cur.deals.length > 0) return;
          const seed = await buildSeed();
          set({ demo: seed });
        },

        resetDemo: async () => {
          const seed = await buildSeed();
          set({ demo: seed });
          toast('Демо сброшено. Все лиды снова хотят купить — разберитесь с этим');
        },

        enterDemo: () => {
          mutate((d) => {
            d.ui.entered = true;
            const today = new Date().toDateString();
            if (isInstalled(d, APP.autoPostpone) && d.ui.lastAutoPostpone !== today) {
              d.ui.lastAutoPostpone = today;
              let n = 0;
              for (const t of d.tasks) {
                if (t.done) continue;
                t.due = new Date(new Date(t.due).getTime() + 86400_000).toISOString();
                t.postpones += 1;
                n++;
              }
              if (n) {
                d.stats.postponed += n;
                log(d, { object: 'Приложение', objectName: 'Автоперенос Pro', event: `Перенесено задач: ${n}`, authorId: 'robot' });
                setTimeout(() => toast(`Автоперенос Pro: ${n} задач перенесено на завтра. Доброе утро!`, 'success'), 600);
              }
            }
          });
        },

        finishTour: () => mutate((d) => void (d.ui.tourDone = true)),

        addDeal: ({ title, contactName, budget, stageId, sendOut }) => {
          let newId: ID | null = null;
          mutate((d) => {
            const stage = d.stages.find((s) => s.id === stageId);
            if (!stage) return;
            let contactId: ID | undefined;
            if (contactName?.trim()) {
              contactId = uid('c');
              d.contacts.unshift({
                id: contactId,
                name: contactName.trim(),
                phone: '+7 (900) 000-00-00',
                selfCalls: 0,
                lastReply: 'никогда',
                status: 'Хочет купить (опасно)',
                responsibleId: 'you',
              });
            }
            const num = Math.max(0, ...d.deals.map((x) => x.num)) + 1;
            const deal: Deal = {
              id: uid('d'),
              num,
              title: title.trim() || `Сделка #${num}`,
              pipelineId: stage.pipelineId,
              stageId: stage.id,
              contactId,
              budget,
              responsibleId: 'you',
              createdAt: nowIso(),
              stageSince: nowIso(),
              tags: ['горячий — остудить'],
              temperature: 'hot',
              buyChance: 92,
              futureLossReason: 'Скажем, что дорого',
              source: 'Быстрое добавление',
              postpones: 0,
            };
            d.deals.unshift(deal);
            newId = deal.id;
            feed(d, { dealId: deal.id, kind: 'created', authorId: 'you', text: 'Сделка создана' });
            log(d, { object: 'Сделка', objectName: deal.title, event: 'Сделка создана' });
            if (sendOut) {
              const lost = d.stages.find((s) => s.pipelineId === stage.pipelineId && s.kind === 'lost');
              if (lost) {
                moveToStage(d, deal, lost);
                deal.lossReason = 'Сразу в аут (галочка стояла по умолчанию)';
                d.stats.slit += 1;
              }
            }
          });
          toast(sendOut ? 'Сделка создана и сразу слита. Рекорд скорости' : 'Сделка создана. Не торопитесь с ней');
          return newId;
        },

        updateDeal: (id, patch, label) =>
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            Object.assign(deal, patch);
            if (label) {
              feed(d, { dealId: id, kind: 'system', authorId: 'you', text: label });
              log(d, { object: 'Сделка', objectName: deal.title, event: label });
            }
          }),

        moveDeal: (id, stageId) => {
          let tone: 'default' | 'success' | 'danger' = 'default';
          let msg = '';
          mutate((d) => {
            const deal = findDeal(d, id);
            const stage = d.stages.find((s) => s.id === stageId);
            if (!deal || !stage || deal.stageId === stageId) return;
            moveToStage(d, deal, stage);
            if (stage.kind === 'lost') {
              d.stats.slit += 1;
              deal.lossReason ??= 'Слит вручную';
              tone = 'success';
              msg = 'Лид слит. Отличная работа';
            } else if (stage.kind === 'won') {
              d.stats.incidents += 1;
              tone = 'danger';
              msg = 'Зафиксирован инцидент: клиент купил. Руководитель уведомлён';
              notify(d, `Инцидент в сделке «${deal.title}»: клиент купил. Требуется разбор`, `/app/leads/${deal.id}`);
            } else if (stage.kind === 'payment') {
              tone = 'danger';
              msg = 'Сделка в этапе «Оплата». Руководитель уже в курсе и очень расстроен';
              notify(d, `Сделка «${deal.title}» дошла до оплаты. Срочно остудите`, `/app/leads/${deal.id}`);
            } else {
              msg = `Этап: ${stage.name}`;
            }
          });
          if (msg) toast(msg, tone);
        },

        postponeDeal: (id) => {
          const h = nextHoliday();
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            deal.postpones += 1;
            d.stats.postponed += 1;
            const target = d.stages.find(
              (s) => s.pipelineId === deal.pipelineId && /праздник/i.test(s.name) && s.kind === 'open',
            );
            if (target) moveToStage(d, deal, target);
            for (const t of d.tasks) {
              if (t.dealId === id && !t.done) {
                t.due = h.date.toISOString();
                t.postpones += 1;
              }
            }
            feed(d, {
              dealId: id,
              kind: 'robot',
              authorId: 'robot',
              text: `Задачи перенесены на ${fmtDay(h.date.toISOString())} — после праздника «${h.name}». Клиента предупреждать не стали`,
            });
            log(d, { object: 'Сделка', objectName: deal.title, event: 'Перенесено на после праздников', after: fmtDay(h.date.toISOString()) });
          });
          toast(`Перенесено на после праздника «${h.name}». Так держать`, 'success');
        },

        antiAction: (id, action) => {
          if (action === 'out') {
            get().slitDeal(id, 'Отправлен в аут');
            return;
          }
          const messages: Record<Exclude<AntiActionId, 'out'>, string> = {
            expensive: 'Клиенту сообщили, что дорого. Он не спрашивал',
            'friday-kp': 'КП уйдёт в пятницу в 18:55. Идеальное время, чтобы его не прочитали',
            intern: 'Сделка передана стажёру. То есть вам',
            cool: 'Лид остужен на один градус',
          };
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            if (action === 'expensive') {
              deal.buyChance = Math.max(3, deal.buyChance - 15);
              deal.temperature = coolDown[deal.temperature];
              feed(d, { dealId: id, kind: 'note', authorId: 'you', text: 'Позвонил клиенту и сказал, что у нас дорого. Клиент про цену не спрашивал, но теперь знает' });
            }
            if (action === 'friday-kp') {
              const kpStage = d.stages.find((s) => s.pipelineId === deal.pipelineId && /КП/.test(s.name));
              if (kpStage) moveToStage(d, deal, kpStage);
              feed(d, { dealId: id, kind: 'email', authorId: 'you', text: 'Коммерческое предложение запланировано на пятницу, 18:55. Тема письма: «Re: Fwd: КП (финал) (2)»' });
              const a = d.achievements.find((x) => x.id === 'friday-kp');
              if (a) a.progress = 1;
            }
            if (action === 'intern') {
              const before = managerName(d, deal.responsibleId);
              deal.responsibleId = 'you';
              feed(d, { dealId: id, kind: 'system', authorId: 'robot', text: `Для поля «Ответственный» установлено значение «Вы (стажёр)». Было: «${before}»` });
            }
            if (action === 'cool') {
              deal.temperature = coolDown[deal.temperature];
              deal.buyChance = Math.max(3, deal.buyChance - 8);
              feed(d, { dealId: id, kind: 'robot', authorId: 'robot', text: 'Лид остужен. Вероятность покупки снижена' });
            }
            log(d, { object: 'Сделка', objectName: deal.title, event: messages[action] });
          });
          toast(messages[action], 'success');
        },

        slitDeal: (id, reason) => {
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            const lost = d.stages.find((s) => s.pipelineId === deal.pipelineId && s.kind === 'lost');
            if (!lost || deal.stageId === lost.id) return;
            deal.lossReason = reason;
            moveToStage(d, deal, lost);
            d.stats.slit += 1;
            feed(d, { dealId: id, kind: 'robot', authorId: 'robot', text: `Причина слива: ${reason}` });
          });
          toast('Лид слит. Отличная работа', 'success');
        },

        reportIncident: (id, { what, who, how }) => {
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            feed(d, {
              dealId: id,
              kind: 'incident',
              authorId: 'you',
              text: `Разбор инцидента. Что пошло не так: ${what || '—'}. Кто виноват: ${who || '—'}. Как не допустить впредь: ${how || '—'}`,
            });
            notify(d, `Разбор инцидента по сделке «${deal.title}» отправлен руководителю`);
            log(d, { object: 'Сделка', objectName: deal.title, event: 'Отправлен разбор инцидента' });
          });
          toast('Разбор отправлен Геннадию Перезвонову. Он перезвонит');
        },

        issueInvoice: (id) => {
          const withApp = isInstalled(get().demo!, APP.invoice);
          mutate((d) => {
            const deal = findDeal(d, id);
            if (!deal) return;
            d.stats.invoicesAttempted += 1;
            feed(d, {
              dealId: id,
              kind: 'invoice',
              authorId: withApp ? 'robot' : 'you',
              text: withApp
                ? `Счёт на ${deal.budget.toLocaleString('ru-RU')} ₽ сформирован приложением «Счёт на оплату (beta)» и отправлен на согласование. Ожидаемый срок согласования: 2–3 квартала`
                : 'Счёт отправлен на согласование: Согласуев → Перезвонов → бухгалтерия → снова Согласуев',
            });
            notify(d, `Счёт по сделке «${deal.title}» на согласовании у 4 руководителей`);
            log(d, { object: 'Сделка', objectName: deal.title, event: 'Счёт отправлен на согласование' });
          });
          toast('Счёт на согласовании у 4 руководителей. Клиент подождёт');
        },

        addNote: (dealId, text, kind = 'note') =>
          mutate((d) => {
            if (!text.trim()) return;
            feed(d, { dealId, kind, authorId: 'you', text: text.trim() });
            const deal = findDeal(d, dealId);
            if (deal) log(d, { object: 'Сделка', objectName: deal.title, event: kind === 'chat' ? 'Сообщение в чат' : 'Добавлено примечание' });
          }),

        generateExcuse: () => {
          const tone = get().demo?.settings.otmazTone ?? 'polite';
          const text = pick(excuses[tone]);
          mutate((d) => void (d.stats.excusesGenerated += 1));
          return text;
        },

        addTask: ({ dealId, type, text, due }) => {
          mutate((d) => {
            const t: Task = {
              id: uid('t'),
              dealId,
              type,
              text: text.trim() || 'Подумать о клиенте',
              due,
              responsibleId: 'you',
              done: false,
              postpones: 0,
              createdAt: nowIso(),
            };
            d.tasks.unshift(t);
            if (dealId) feed(d, { dealId, kind: 'task', authorId: 'you', text: `Поставлена задача: ${t.text}, срок ${fmtDay(due)}` });
            log(d, { object: 'Задача', objectName: t.text, event: 'Задача создана', after: fmtDay(due) });
          });
          toast('Задача создана. Перенести её можно в любой момент');
        },

        postponeTask: (id, days = 1) => {
          mutate((d) => {
            const t = d.tasks.find((x) => x.id === id);
            if (!t || t.done) return;
            const before = fmtDay(t.due);
            const base = Math.max(Date.now(), new Date(t.due).getTime());
            t.due = new Date(base + days * 86400_000).toISOString();
            t.postpones += 1;
            d.stats.postponed += 1;
            log(d, { object: 'Задача', objectName: t.text, event: 'Срок изменён', before, after: fmtDay(t.due) });
            if (t.dealId) {
              const deal = findDeal(d, t.dealId);
              if (deal) deal.postpones += 1;
            }
          });
          toast('Задача перенесена. Так держать', 'success');
        },

        moveTask: (id, due, message) => {
          let moved = false;
          mutate((d) => {
            const t = d.tasks.find((x) => x.id === id);
            if (!t || t.done || new Date(t.due).toDateString() === new Date(due).toDateString()) return;
            const before = fmtDay(t.due);
            const later = new Date(due).getTime() > new Date(t.due).getTime();
            t.due = due;
            moved = true;
            if (later) {
              t.postpones += 1;
              d.stats.postponed += 1;
              if (t.dealId) {
                const deal = findDeal(d, t.dealId);
                if (deal) deal.postpones += 1;
              }
            }
            log(d, { object: 'Задача', objectName: t.text, event: 'Срок изменён', before, after: fmtDay(due) });
          });
          if (moved) toast(message, 'success');
        },

        postponeAllTasks: () => {
          let n = 0;
          mutate((d) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            for (const t of d.tasks) {
              if (t.done) continue;
              if (new Date(t.due).getTime() < tomorrow.getTime()) {
                t.due = tomorrow.toISOString();
                t.postpones += 1;
                n++;
              }
            }
            d.stats.postponed += n;
            if (n) log(d, { object: 'Задача', objectName: `${n} задач`, event: 'Массовый перенос на завтра' });
          });
          toast(n ? `${n} задач перенесено на завтра. Сегодня свободны` : 'Переносить нечего: всё уже на завтра', 'success');
          return n;
        },

        completeTask: (id, result) => {
          mutate((d) => {
            const t = d.tasks.find((x) => x.id === id);
            if (!t) return;
            t.done = true;
            t.result = result;
            if (t.dealId) feed(d, { dealId: t.dealId, kind: 'task', authorId: 'you', text: `Задача «${t.text}» выполнена. Результат: ${result}` });
            log(d, { object: 'Задача', objectName: t.text, event: 'Задача выполнена', after: result });
          });
          toast('Задача закрыта. Надеемся, это ни к чему не приведёт');
        },

        readChat: (id) =>
          mutate((d) => {
            const c = d.chats.find((x) => x.id === id);
            if (c) c.unread = 0;
          }),

        sendChat: (id, text) =>
          mutate((d) => {
            const c = d.chats.find((x) => x.id === id);
            if (!c || !text.trim()) return;
            c.messages.push({ id: uid('m'), from: 'you', text: text.trim(), at: nowIso() });
            c.ignored = false;
            if (c.dealId) feed(d, { dealId: c.dealId, kind: 'chat', authorId: 'you', text: text.trim() });
            log(d, { object: 'Чат', objectName: d.contacts.find((x) => x.id === c.contactId)?.name ?? 'Чат', event: 'Отправлено сообщение' });
          }),

        ignoreChat: (id) => {
          mutate((d) => {
            const c = d.chats.find((x) => x.id === id);
            if (!c || c.ignored) return;
            c.unread = 0;
            c.ignored = true;
            d.stats.ignoredChats += 1;
            log(d, { object: 'Чат', objectName: d.contacts.find((x) => x.id === c.contactId)?.name ?? 'Чат', event: 'Прочитано, ответ не требуется' });
          });
          toast('Две синие галочки. Клиент видит, что вы прочитали', 'success');
        },

        readEmail: (id) =>
          mutate((d) => {
            const e = d.emails.find((x) => x.id === id);
            if (e) e.read = true;
          }),

        replyEmail: (id, text) => {
          mutate((d) => {
            const e = d.emails.find((x) => x.id === id);
            if (!e) return;
            e.reply = text;
            if (e.dealId) feed(d, { dealId: e.dealId, kind: 'email', authorId: 'you', text: `Ответ на письмо «${e.subject}»: ${text}` });
            log(d, { object: 'Письмо', objectName: e.subject, event: 'Ответ запланирован' });
          });
          toast(/понедельник/i.test(text) ? 'Ответ поставлен в очередь на понедельник' : 'Ответ отправлен. Надеемся, клиент его не дочитает');
        },

        installApp: (id) => {
          let name = '';
          mutate((d) => {
            const a = d.apps.find((x) => x.id === id);
            if (!a || a.installed) return;
            a.installed = true;
            a.installedAt = nowIso();
            name = a.name;
            log(d, { object: 'Приложение', objectName: a.name, event: 'Установлено' });
          });
          if (name) toast(`«${name}» установлено`, 'success');
        },

        uninstallApp: (id) => {
          let name = '';
          mutate((d) => {
            const a = d.apps.find((x) => x.id === id);
            if (!a || !a.installed) return;
            a.installed = false;
            delete a.installedAt;
            name = a.name;
            log(d, { object: 'Приложение', objectName: a.name, event: 'Отключено' });
          });
          if (name) toast(`«${name}» отключено`);
        },

        updateSettings: (patch) => {
          mutate((d) => {
            Object.assign(d.settings, patch);
            log(d, { object: 'Настройки', objectName: 'Общие настройки', event: 'Настройки сохранены' });
          });
          toast('Настройки сохранены. Работать от этого больше не придётся');
        },

        updateStage: (id, patch) =>
          mutate((d) => {
            const s = d.stages.find((x) => x.id === id);
            if (s) Object.assign(s, patch);
          }),

        markNotificationsRead: () =>
          mutate((d) => {
            d.notifications.forEach((n) => (n.read = true));
          }),
      };
    },
    {
      name: 'lidslivs24-demo',
      version: SEED_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ demo: s.demo }) as Store,
      // старая версия демо просто пересоздаётся из свежих данных
      migrate: () => ({ demo: null }) as unknown as Store,
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

// ---------- достижения ----------

function syncAchievements(d: DemoState) {
  const installed = d.apps.filter((a) => a.installed).length;
  const progress: Record<string, number> = {
    'first-slit': d.stats.slit,
    fridge: d.stats.slit,
    'postpone-master': d.stats.postponed,
    elusive: d.stats.ignoredChats,
    bureaucrat: d.stats.invoicesAttempted,
    'excuse-gen': d.stats.excusesGenerated,
    'app-tycoon': installed,
    'black-mark': d.stats.incidents,
  };
  for (const a of d.achievements) {
    if (a.id in progress) a.progress = Math.min(progress[a.id], a.goal ?? Infinity);
    if (a.goal && (a.progress ?? 0) >= a.goal && !a.unlockedAt) {
      a.unlockedAt = nowIso();
      setTimeout(() => toast(`Достижение получено: «${a.title}»`, 'achievement'), 300);
    }
  }
  // Продажа отбирает «Ни одного инцидента»
  if (d.stats.incidents > 0) {
    const ni = d.achievements.find((a) => a.id === 'no-incidents');
    if (ni) delete ni.unlockedAt;
  }
}

/** Удобный хук: состояние демо (после ensureSeed всегда не null) */
export const useDemo = () => useStore((s) => s.demo) as DemoState;
