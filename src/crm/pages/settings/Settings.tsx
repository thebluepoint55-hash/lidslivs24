import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Settings as SettingsT } from '../../../store/types';
import { useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Button, PageHeader, useIsMobile } from '../../ui';
import { AppLogo } from '../market/appIcon';
import {
  BillingSection,
  ChatsSection,
  GeneralSection,
  NotificationsSection,
  OtmazSection,
  PipelinesSection,
  UpdatesSection,
  UsersSection,
  DEFAULT_TEMPLATES,
} from './sections';
import './settings.css';

export const SECTIONS = [
  { id: 'updates', label: 'Обновление ОСЕНЬ 2026' },
  { id: 'general', label: 'Общие настройки' },
  { id: 'billing', label: 'Счёт и оплата' },
  { id: 'users', label: 'Пользователи' },
  { id: 'pipelines', label: 'Воронки и этапы' },
  { id: 'chats', label: 'Чаты и мессенджеры' },
  { id: 'otmaz', label: 'Отмаз AI' },
  { id: 'notifications', label: 'Уведомления' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const isSection = (v?: string): v is SectionId => SECTIONS.some((s) => s.id === v);

/** разделы с кнопкой «Сохранить» и какие поля настроек они правят */
const SAVE_FIELDS: Partial<Record<SectionId, (keyof SettingsT)[]>> = {
  general: ['accountName', 'timezone', 'currency', 'workHours', 'dateFormat'],
  otmaz: ['otmazTone', 'otmazCreativity'],
  notifications: ['notifyBuyIntent', 'notifyCooling'],
  chats: [],
};

function SideMenu({ asList }: { asList?: boolean }) {
  const demo = useDemo();
  const installed = demo.apps.filter((a) => a.installed);
  return (
    <nav className={asList ? 'set-list' : 'set-nav'} aria-label="Разделы настроек">
      {!asList && <div className="set-nav__title">Настройки</div>}
      <ul>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <NavLink to={`/app/settings/${s.id}`} className="set-nav__item">
              <span>{s.label}</span>
              {asList && <ChevronRight size={16} aria-hidden="true" />}
            </NavLink>
          </li>
        ))}
      </ul>
      {installed.length > 0 && (
        <>
          <div className="set-nav__group">Виджеты</div>
          <ul>
            {installed.map((a) => (
              <li key={a.id}>
                <Link to={`/app/market?tab=installed&app=${a.id}`} className="set-nav__item set-nav__item--app">
                  <AppLogo app={a} size={18} />
                  <span>{a.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

export default function Settings() {
  const { section } = useParams();
  const isMobile = useIsMobile();
  const demo = useDemo();
  const updateSettings = useStore((s) => s.updateSettings);

  const settingsKey = JSON.stringify(demo.settings);
  const [draft, setDraft] = useState<SettingsT>(demo.settings);
  useEffect(() => {
    setDraft(JSON.parse(settingsKey) as SettingsT);
  }, [settingsKey]);

  const [templates, setTemplates] = useState<string[]>(DEFAULT_TEMPLATES);
  const [savedTemplates, setSavedTemplates] = useState<string[]>(DEFAULT_TEMPLATES);

  const patch = (p: Partial<SettingsT>) => setDraft((d) => ({ ...d, ...p }));

  const current = isSection(section) ? section : null;

  const dirty = useMemo(() => {
    if (!current) return false;
    if (current === 'chats') return JSON.stringify(templates) !== JSON.stringify(savedTemplates);
    const fields = SAVE_FIELDS[current];
    if (!fields) return false;
    return fields.some((f) => draft[f] !== demo.settings[f]);
  }, [current, draft, demo.settings, templates, savedTemplates]);

  if (section === 'menu') {
    if (!isMobile) return <Navigate to="/app/settings/general" replace />;
    return (
      <div className="set set--list">
        <PageHeader title="Настройки" />
        <SideMenu asList />
      </div>
    );
  }
  if (!current) return <Navigate to="/app/settings/general" replace />;

  const meta = SECTIONS.find((s) => s.id === current)!;
  const savable = current in SAVE_FIELDS;

  const save = () => {
    if (!dirty) {
      toast('Сохранять нечего. Отличный повод ничего не делать');
      return;
    }
    if (current === 'chats') {
      const clean = templates.map((t) => t.trim()).filter(Boolean);
      setTemplates(clean);
      setSavedTemplates(clean);
      toast('Шаблоны сохранены. Клиенты узнают их с первого слова', 'success');
      return;
    }
    const fields = SAVE_FIELDS[current] ?? [];
    const p: Partial<SettingsT> = {};
    for (const f of fields) (p as Record<string, unknown>)[f] = draft[f];
    if (current === 'general' && !String(p.accountName ?? '').trim()) {
      toast('Название аккаунта не может быть пустым. Даже у нас', 'danger');
      return;
    }
    updateSettings(p);
  };

  let body;
  switch (current) {
    case 'updates':
      body = <UpdatesSection />;
      break;
    case 'general':
      body = <GeneralSection draft={draft} patch={patch} />;
      break;
    case 'billing':
      body = <BillingSection />;
      break;
    case 'users':
      body = <UsersSection />;
      break;
    case 'pipelines':
      body = <PipelinesSection />;
      break;
    case 'chats':
      body = <ChatsSection templates={templates} setTemplates={setTemplates} />;
      break;
    case 'otmaz':
      body = <OtmazSection draft={draft} patch={patch} />;
      break;
    case 'notifications':
      body = <NotificationsSection draft={draft} patch={patch} />;
      break;
  }

  return (
    <div className="set">
      {!isMobile && <SideMenu />}
      <div className="set-main">
        <PageHeader
          title={
            isMobile ? (
              <Link to="/app/settings/menu" className="set-back">
                <ChevronLeft size={20} aria-hidden="true" />
                <span>{meta.label}</span>
              </Link>
            ) : (
              meta.label
            )
          }
          actions={
            savable ? (
              <Button variant="primary" keepMobile onClick={save} className={dirty ? 'set-save is-dirty' : 'set-save'}>
                Сохранить
              </Button>
            ) : undefined
          }
        />
        <div className="set-content">{body}</div>
      </div>
    </div>
  );
}
