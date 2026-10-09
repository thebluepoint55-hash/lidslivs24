import type { DemoState } from '../store/types';
import { setBaseNow } from './time';

export const SEED_VERSION = 3;

/**
 * Собирает свежее состояние демо. Модули с данными импортируются динамически
 * после setBaseNow, чтобы относительные даты считались от «сейчас».
 */
export async function buildSeed(): Promise<DemoState> {
  setBaseNow(Date.now());
  // Сбрасываем кэш модулей нельзя, поэтому данные описаны функциями-фабриками
  // там, где это важно; для остальных хватает момента первой загрузки.
  const [base, people, deals, tasks, feed, chats, emails, calls, apps, events] = await Promise.all([
    import('./base'),
    import('./people'),
    import('./deals'),
    import('./tasks'),
    import('./feed'),
    import('./chats'),
    import('./emails'),
    import('./calls'),
    import('./apps'),
    import('./events'),
  ]);

  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  return clone({
    version: SEED_VERSION,
    seededAt: new Date().toISOString(),
    managers: base.managers,
    pipelines: base.pipelines,
    stages: base.stages,
    deals: deals.deals,
    contacts: people.contacts,
    companies: people.companies,
    tasks: tasks.tasks,
    feed: feed.feed,
    chats: chats.chats,
    emails: emails.emails,
    calls: calls.calls,
    apps: apps.apps,
    events: events.events,
    notifications: events.notifications,
    achievements: base.achievements.map((a) =>
      a.id === 'no-incidents' ? { ...a, unlockedAt: new Date().toISOString() } : a,
    ),
    goals: base.goals,
    settings: base.settings,
    stats: { postponed: 0, slit: 0, incidents: 0, ignoredChats: 0, invoicesAttempted: 0, excusesGenerated: 0 },
    ui: { tourDone: false, entered: false },
  });
}
