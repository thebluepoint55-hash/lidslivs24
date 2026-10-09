// Типы данных демо-CRM. Даты — ISO-строки.

export type ID = string;

/** 'you' — пользователь демо, 'robot' — системные действия, остальное — id менеджера */
export type AuthorId = ID | 'you' | 'robot' | 'client';

export interface Manager {
  id: ID;
  name: string;
  role: string; // «Старший сливщик»
  /** короткая характеристика, всплывает в профиле и рейтинге */
  motto: string;
  color: string; // цвет аватара
}

export interface Pipeline {
  id: ID;
  name: string;
}

/**
 * open — рабочий этап; payment — свёрнутая «Оплата» (не рекомендуется);
 * lost — финальный «Слит (успешно)»; won — «Инцидент: клиент купил»
 */
export type StageKind = 'open' | 'payment' | 'lost' | 'won';

export interface Stage {
  id: ID;
  pipelineId: ID;
  name: string;
  color: string;
  kind: StageKind;
}

export type Temperature = 'hot' | 'warm' | 'cold' | 'ice';

export interface Deal {
  id: ID;
  num: number;
  title: string;
  pipelineId: ID;
  stageId: ID;
  contactId?: ID;
  companyId?: ID;
  budget: number;
  responsibleId: ID | 'you';
  createdAt: string;
  stageSince: string;
  closedAt?: string;
  tags: string[];
  temperature: Temperature;
  /** вероятность покупки, %; чем ниже — тем лучше */
  buyChance: number;
  futureLossReason: string;
  source: string;
  /** сколько раз сделку / её задачи переносили */
  postpones: number;
  lossReason?: string;
}

export interface Contact {
  id: ID;
  name: string;
  companyId?: ID;
  position?: string;
  phone: string;
  email?: string;
  /** сколько раз клиент звонил сам */
  selfCalls: number;
  /** «наш последний ответ», обычно «никогда» */
  lastReply: string;
  status: string;
  responsibleId: ID | 'you';
}

export interface Company {
  id: ID;
  name: string;
  industry: string;
  phone?: string;
  web?: string;
}

export type TaskType = 'call' | 'meeting' | 'kp' | 'think' | 'followup';

export interface Task {
  id: ID;
  dealId?: ID;
  contactId?: ID;
  type: TaskType;
  text: string;
  due: string;
  responsibleId: ID | 'you';
  done: boolean;
  result?: string;
  postpones: number;
  createdAt: string;
}

export type FeedKind =
  | 'created'
  | 'system' // изменение поля
  | 'robot' // действие «робота»
  | 'note' // примечание менеджера
  | 'call'
  | 'email'
  | 'chat'
  | 'task'
  | 'stage'
  | 'incident'
  | 'invoice';

export interface FeedItem {
  id: ID;
  dealId?: ID;
  contactId?: ID;
  at: string;
  kind: FeedKind;
  authorId: AuthorId;
  text: string;
  /** для звонков — длительность, для задач — тип и т.п. */
  meta?: Record<string, string | number | boolean>;
}

export type Channel = 'whatsapp' | 'telegram' | 'avito' | 'site' | 'max';

export interface ChatMessage {
  id: ID;
  from: 'client' | AuthorId;
  text: string;
  at: string;
}

export interface ChatThread {
  id: ID;
  contactId: ID;
  dealId?: ID;
  channel: Channel;
  unread: number;
  /** «прочитано и не отвечено» — две галочки */
  ignored: boolean;
  messages: ChatMessage[];
}

export interface Email {
  id: ID;
  contactId: ID;
  dealId?: ID;
  subject: string;
  body: string;
  at: string;
  read: boolean;
  /** что ответили (или «Ответ запланирован на понедельник») */
  reply?: string;
}

export type CallStatus = 'missed' | 'dropped' | 'answered';

export interface Call {
  id: ID;
  at: string;
  managerId: ID | 'you';
  contactId: ID;
  dealId?: ID;
  direction: 'in' | 'out';
  status: CallStatus;
  /** секунды */
  duration: number;
  result: string;
}

export type MarketCategory =
  | 'messengers'
  | 'telephony'
  | 'email'
  | 'website'
  | 'tasks'
  | 'ai'
  | 'analytics'
  | 'billing';

export interface MarketReview {
  author: string;
  stars: number;
  text: string;
}

export interface MarketApp {
  id: ID;
  name: string;
  developer: string;
  category: MarketCategory;
  rating: number; // 1..5
  reviewsCount: number;
  installsCount: number;
  short: string;
  description: string;
  /** шуточная «инструкция по настройке» в окне приложения */
  setup: string[];
  reviews: MarketReview[];
  /** реально меняет поведение демо */
  worksInDemo: boolean;
  badge?: 'hit' | 'new' | 'beta';
  /** цвет плитки-логотипа и иконка lucide (имя в PascalCase) */
  color: string;
  icon: string;
  installed: boolean;
  installedAt?: string;
}

export interface EventLogItem {
  id: ID;
  at: string;
  authorId: AuthorId;
  object: 'Сделка' | 'Задача' | 'Контакт' | 'Чат' | 'Письмо' | 'Приложение' | 'Настройки';
  objectName: string;
  event: string;
  before?: string;
  after?: string;
}

export interface Notification {
  id: ID;
  at: string;
  text: string;
  read: boolean;
  link?: string;
}

export interface Achievement {
  id: ID;
  title: string;
  description: string;
  icon: string; // lucide
  unlockedAt?: string;
  /** текущий прогресс и цель, если ачивка счётная */
  progress?: number;
  goal?: number;
}

export interface Goal {
  managerId: ID | 'you';
  /** план по сливу на месяц */
  plan: number;
}

export interface Settings {
  accountName: string;
  timezone: string;
  currency: string;
  workHours: string;
  dateFormat: string;
  otmazTone: 'polite' | 'evasive' | 'callback';
  otmazCreativity: number; // 0..100
  notifyBuyIntent: boolean;
  notifyOrders: boolean; // всегда false, заблокировано
  notifyCooling: boolean;
}

export interface DemoState {
  version: number;
  seededAt: string;
  managers: Manager[];
  pipelines: Pipeline[];
  stages: Stage[];
  deals: Deal[];
  contacts: Contact[];
  companies: Company[];
  tasks: Task[];
  feed: FeedItem[];
  chats: ChatThread[];
  emails: Email[];
  calls: Call[];
  apps: MarketApp[];
  events: EventLogItem[];
  notifications: Notification[];
  achievements: Achievement[];
  goals: Goal[];
  settings: Settings;
  /** счётчики действий пользователя — для достижений и рабочего стола */
  stats: {
    postponed: number;
    slit: number;
    incidents: number;
    ignoredChats: number;
    invoicesAttempted: number;
    excusesGenerated: number;
  };
  ui: {
    tourDone: boolean;
    entered: boolean;
    lastAutoPostpone?: string;
  };
}
