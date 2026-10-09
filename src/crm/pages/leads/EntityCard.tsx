import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Menu, useIsMobile, type MenuItem } from '../../ui';
import './leads.css';

// Общий каркас карточки (сделка, контакт, компания) — три колонки как у amo.

export type MobileTab = 'main' | 'feed' | 'widgets';

export function CardShell({
  back,
  title,
  menu,
  sub,
  stage,
  deskTabs,
  main,
  feed,
  widgets,
  hero,
  mobileTab,
  onMobileTab,
}: {
  back: string;
  title: ReactNode;
  menu: MenuItem[];
  sub?: ReactNode;
  stage?: ReactNode;
  /** вкладки десктопа: «Основное · Статистика · …» */
  deskTabs?: ReactNode;
  main: ReactNode;
  feed: ReactNode;
  widgets: ReactNode;
  hero?: ReactNode;
  mobileTab: MobileTab;
  onMobileTab: (t: MobileTab) => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div className={`ec${hero ? ' ec--hero' : ''}`}>
      <aside className="ec-left">
        <div className="ec-head">
          <div className="ec-head__row">
            <Link to={back} className="ec-back" aria-label="Назад">
              <ChevronLeft />
            </Link>
            <h1 className="ec-title">{title}</h1>
            <Menu
              align="right"
              items={menu}
              trigger={(p) => (
                <button {...p} className="ec-more" aria-label="Действия">
                  <MoreHorizontal />
                </button>
              )}
            />
          </div>
          {sub && <div className="ec-sub">{sub}</div>}
          {stage}
          {isMobile ? (
            <div className="ec-tabs" role="tablist">
              {(
                [
                  ['main', 'Основное'],
                  ['feed', 'Лента'],
                  ['widgets', 'Виджеты'],
                ] as [MobileTab, string][]
              ).map(([id, label]) => (
                <button key={id} role="tab" aria-selected={mobileTab === id} className={mobileTab === id ? 'is-on' : ''} onClick={() => onMobileTab(id)}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            deskTabs
          )}
        </div>
        {(!isMobile || mobileTab === 'main') && <div className="ec-left__body">{main}</div>}
        {hero && (!isMobile || mobileTab !== 'widgets') && <div className="ec-hero">{hero}</div>}
      </aside>
      {(!isMobile || mobileTab === 'feed') && <section className="ec-feed" aria-label="Лента">{feed}</section>}
      {(!isMobile || mobileTab === 'widgets') && (
        <aside className="ec-widgets" aria-label="Виджеты">
          {widgets}
        </aside>
      )}
    </div>
  );
}

/** Вкладки в тёмной шапке (десктоп) */
export function HeadTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="ec-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'is-on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Строка поля: подпись слева, значение справа */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ec-field">
      <dt className="ec-field__label">{label}</dt>
      <dd className="ec-field__value">{children}</dd>
    </div>
  );
}

/** Значение, которое правится по клику (как поля в amo) */
export function InlineEdit({
  value,
  display,
  onSave,
  numeric,
  label,
}: {
  value: string;
  display?: ReactNode;
  onSave: (v: string) => void;
  numeric?: boolean;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        className="inline-edit"
        onClick={() => {
          setV(value);
          setEditing(true);
        }}
        aria-label={`${label}: изменить`}
      >
        {display ?? (value || <span className="muted">Не указано</span>)}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    if (v.trim() !== value) onSave(v.trim());
  };
  return (
    <input
      ref={input}
      className={`inline-edit__input${numeric ? ' tabular' : ''}`}
      value={v}
      inputMode={numeric ? 'numeric' : undefined}
      aria-label={label}
      onChange={(e) => setV(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
}
