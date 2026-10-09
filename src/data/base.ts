import type { Achievement, Goal, Manager, Pipeline, Settings, Stage } from '../store/types';

export const YOU = {
  id: 'you' as const,
  name: 'Вы',
  fullName: 'Вы (стажёр)',
  role: 'Стажёр отдела слива',
  motto: 'Учусь не продавать у лучших',
  color: '#ff5b36',
};

export const managers: Manager[] = [
  {
    id: 'm-perezvonov',
    name: 'Геннадий Перезвонов',
    role: 'Руководитель отдела слива',
    motto: 'Главное — не торопить клиента. Никогда.',
    color: '#4c8bf7',
  },
  {
    id: 'm-zavtrakova',
    name: 'Алина Завтракова',
    role: 'Старший сливщик',
    motto: 'Всё сделаю завтра. С утра. После кофе.',
    color: '#9b6dd7',
  },
  {
    id: 'm-perekurov',
    name: 'Виталий Перекуров',
    role: 'Сливщик',
    motto: 'Вернусь через пять минут.',
    color: '#2bb38a',
  },
  {
    id: 'm-nedozvonova',
    name: 'Олеся Недозвонова',
    role: 'Сливщик',
    motto: 'Трубку не беру из принципа: вдруг купят.',
    color: '#e4a72f',
  },
  {
    id: 'm-soglasuev',
    name: 'Арсений Согласуев',
    role: 'Менеджер по согласованиям',
    motto: 'Надо согласовать с руководством.',
    color: '#e2574c',
  },
];

export const pipelines: Pipeline[] = [
  { id: 'p-main', name: 'Основная воронка слива' },
  { id: 'p-tender', name: 'Тендеры (проиграть красиво)' },
  { id: 'p-repeat', name: 'Повторные продажи (не допустить)' },
];

// Цвета этапов — стандартный набор amoCRM
export const stages: Stage[] = [
  { id: 's-new', pipelineId: 'p-main', name: 'Новый лид', color: '#99ccff', kind: 'open' },
  { id: 's-noanswer', pipelineId: 'p-main', name: 'Не дозвонились', color: '#ffff99', kind: 'open' },
  { id: 's-kp', pipelineId: 'p-main', name: 'КП отправлено (в спам)', color: '#ffcc66', kind: 'open' },
  { id: 's-think', pipelineId: 'p-main', name: 'Клиент думает', color: '#f3beff', kind: 'open' },
  { id: 's-holidays', pipelineId: 'p-main', name: 'Перенесено на после праздников', color: '#ffcccc', kind: 'open' },
  { id: 's-cold', pipelineId: 'p-main', name: 'Остыл', color: '#f9deff', kind: 'open' },
  { id: 's-pay', pipelineId: 'p-main', name: 'Оплата', color: '#d0d0d0', kind: 'payment' },
  { id: 's-lost', pipelineId: 'p-main', name: 'Слит (успешно)', color: '#87f2c0', kind: 'lost' },
  { id: 's-won', pipelineId: 'p-main', name: 'Инцидент: клиент купил', color: '#ff8f92', kind: 'won' },

  { id: 't-new', pipelineId: 'p-tender', name: 'Получили ТЗ', color: '#99ccff', kind: 'open' },
  { id: 't-unread', pipelineId: 'p-tender', name: 'Не прочитали ТЗ', color: '#ffff99', kind: 'open' },
  { id: 't-nodocs', pipelineId: 'p-tender', name: 'Подали без документов', color: '#ffcc66', kind: 'open' },
  { id: 't-late', pipelineId: 'p-tender', name: 'Опоздали на 5 минут', color: '#ffcccc', kind: 'open' },
  { id: 't-pay', pipelineId: 'p-tender', name: 'Оплата', color: '#d0d0d0', kind: 'payment' },
  { id: 't-lost', pipelineId: 'p-tender', name: 'Проиграли красиво', color: '#87f2c0', kind: 'lost' },
  { id: 't-won', pipelineId: 'p-tender', name: 'Инцидент: выиграли тендер', color: '#ff8f92', kind: 'won' },

  { id: 'r-new', pipelineId: 'p-repeat', name: 'Хочет купить ещё', color: '#99ccff', kind: 'open' },
  { id: 'r-forgot', pipelineId: 'p-repeat', name: 'Делаем вид, что не узнали', color: '#fffeb2', kind: 'open' },
  { id: 'r-wait', pipelineId: 'p-repeat', name: 'Предложили подождать', color: '#f3beff', kind: 'open' },
  { id: 'r-pay', pipelineId: 'p-repeat', name: 'Оплата', color: '#d0d0d0', kind: 'payment' },
  { id: 'r-lost', pipelineId: 'p-repeat', name: 'Ушёл навсегда', color: '#87f2c0', kind: 'lost' },
  { id: 'r-won', pipelineId: 'p-repeat', name: 'Инцидент: купил повторно', color: '#ff8f92', kind: 'won' },
];

export const settings: Settings = {
  accountName: 'ЛидСливс24',
  timezone: '(GMT +03:00) Москва',
  currency: 'Российский рубль',
  workHours: '11:00–11:15',
  dateFormat: '31.12.2026',
  otmazTone: 'polite',
  otmazCreativity: 70,
  notifyBuyIntent: true,
  notifyOrders: false,
  notifyCooling: true,
};

export const goals: Goal[] = [
  { managerId: 'm-perezvonov', plan: 5 },
  { managerId: 'm-zavtrakova', plan: 4 },
  { managerId: 'm-perekurov', plan: 4 },
  { managerId: 'm-nedozvonova', plan: 6 },
  { managerId: 'm-soglasuev', plan: 3 },
  { managerId: 'you', plan: 3 },
];

export const achievements: Achievement[] = [
  { id: 'no-incidents', title: 'Ни одного инцидента', description: 'Прожить в CRM день без единой продажи', icon: 'ShieldCheck' },
  { id: 'first-slit', title: 'Первый слив', description: 'Довести лида до этапа «Слит (успешно)»', icon: 'Droplets', progress: 0, goal: 1 },
  { id: 'fridge', title: 'Холодильник', description: 'Слить 10 лидов', icon: 'Snowflake', progress: 0, goal: 10 },
  { id: 'postpone-master', title: 'Мастер переноса', description: 'Перенести задачи 30 раз', icon: 'CalendarClock', progress: 0, goal: 30 },
  { id: 'elusive', title: 'Неуловимый', description: 'Прочитать и не ответить в 5 чатах', icon: 'CheckCheck', progress: 0, goal: 5 },
  { id: 'friday-kp', title: 'Пятничный КП', description: 'Отправить КП в пятницу в 18:55', icon: 'Mail', progress: 0, goal: 1 },
  { id: 'bureaucrat', title: 'Бюрократ', description: 'Пройти все три подтверждения счёта и отправить его на согласование', icon: 'FileStack', progress: 0, goal: 1 },
  { id: 'excuse-gen', title: 'Генератор отмазок', description: 'Сгенерировать 10 отмазок', icon: 'Sparkles', progress: 0, goal: 10 },
  { id: 'app-tycoon', title: 'Магнат слива', description: 'Установить 5 приложений из СливМаркета', icon: 'Store', progress: 0, goal: 5 },
  { id: 'black-mark', title: 'Чёрная метка', description: 'Допустить продажу. Лучше не открывать', icon: 'Skull', progress: 0, goal: 1 },
];
