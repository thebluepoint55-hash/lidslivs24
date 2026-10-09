import { Suspense, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LayoutGrid,
  Mail,
  MessagesSquare,
  Puzzle,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useDemo, useStore } from '../../store/store';
import { useUI } from '../../store/ui';
import { Avatar, Toasts } from '../ui';
import { YOU } from '../../data/base';
import ChatsPanel from '../pages/chats/ChatsPanel';
import AssistantPanel from '../pages/assistant/AssistantPanel';
import Tour from '../pages/onboarding/Tour';
import './layout.css';

const NAV = [
  { to: '/app/dashboard', label: 'Рабочий стол', icon: Gauge },
  { to: '/app/leads', label: 'Сделки', icon: CircleDollarSign },
  { to: '/app/tasks', label: 'Задачи', icon: CircleCheck, badge: 'tasks' as const },
  { to: '/app/contacts', label: 'Списки', icon: ClipboardList },
  { to: '/app/mail', label: 'Почта', icon: Mail, badge: 'mail' as const },
  { to: '/app/stats', label: 'Аналитика', icon: BarChart3 },
  { to: '/app/market', label: 'СливМаркет', icon: Puzzle },
  { to: '/app/settings', label: 'Настройки', icon: Wrench },
];

function useBadges() {
  const demo = useDemo();
  const overdue = demo.tasks.filter((t) => !t.done && new Date(t.due).getTime() < Date.now()).length;
  const mail = demo.emails.filter((e) => !e.read).length;
  const chats = demo.chats.reduce((n, c) => n + c.unread, 0);
  return { tasks: overdue, mail, chats };
}

export default function AppShell() {
  const enterDemo = useStore((s) => s.enterDemo);
  const resetDemo = useStore((s) => s.resetDemo);
  const badges = useBadges();
  const setChatsOpen = useUI((s) => s.setChatsOpen);
  const chatsOpen = useUI((s) => s.chatsOpen);
  const setAssistantOpen = useUI((s) => s.setAssistantOpen);
  const loc = useLocation();

  useEffect(() => {
    enterDemo();
  }, [enterDemo]);

  // закрываем панели при переходе
  useEffect(() => {
    useUI.setState({ chatsOpen: false });
  }, [loc.pathname]);

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Главное меню">
        <Link to="/app/profile" className="sidebar__account" title="Профиль">
          <Avatar name="Вы Стажёр" color={YOU.color} size={30} />
          Аккаунт
        </Link>
        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className="navitem">
              <Icon aria-hidden="true" />
              {label}
              {badge && badges[badge] > 0 && <span className="badge">{badges[badge]}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          className="sidebar__chats"
          onClick={() => setChatsOpen(!chatsOpen)}
          aria-label="Чаты"
          aria-expanded={chatsOpen}
        >
          <MessagesSquare size={20} />
          {badges.chats > 0 && <span className="badge">{badges.chats}</span>}
        </button>
      </aside>

      <div className="shell__main">
        <div className="demobar" role="note">
          <span>
            <strong>Демо-доступ: бессрочно.</strong> Продлить нельзя, отменить тоже. Ваши сливы живут до закрытия вкладки.
          </span>
          <span className="demobar__spacer" />
          <button onClick={() => window.confirm('Сбросить демо? Все ваши сливы пропадут, лиды снова захотят купить.') && resetDemo()}>
            Сбросить демо
          </button>
          <Link to="/">О продукте</Link>
        </div>
        <main className="shell__content" id="main">
          <Suspense fallback={<div style={{ padding: 24, color: 'var(--muted)' }}>Загружаем… не торопимся</div>}>
            <Outlet />
          </Suspense>
        </main>
        <button className="otmaz-fab" onClick={() => setAssistantOpen(true)} aria-label="Ассистент Отмаз">
          <Sparkles size={18} />
          <span>Отмаз</span>
        </button>
      </div>

      <nav className="tabbar" aria-label="Разделы">
        <NavLink to="/app/leads" className="tabbar__item">
          <CircleDollarSign aria-hidden="true" />
          Сделки
        </NavLink>
        <NavLink to="/app/tasks" className="tabbar__item">
          <CircleCheck aria-hidden="true" />
          Задачи
          {badges.tasks > 0 && <span className="badge">{badges.tasks}</span>}
        </NavLink>
        <NavLink to="/app/chats" className="tabbar__item">
          <MessagesSquare aria-hidden="true" />
          Чаты
          {badges.chats > 0 && <span className="badge">{badges.chats}</span>}
        </NavLink>
        <NavLink to="/app/stats" className="tabbar__item">
          <BarChart3 aria-hidden="true" />
          Аналитика
        </NavLink>
        <NavLink to="/app/more" className="tabbar__item">
          <LayoutGrid aria-hidden="true" />
          Ещё
        </NavLink>
      </nav>

      <ChatsPanel />
      <AssistantPanel />
      <Tour />
      <Toasts />
    </div>
  );
}
