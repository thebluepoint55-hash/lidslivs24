import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Award, CheckCircle2, Info, Search, X, AlertTriangle } from 'lucide-react';
import { useUI } from '../../store/ui';
import './ui.css';

// ---------- Button ----------

type BtnVariant = 'primary' | 'anti' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  size,
  block,
  icon,
  keepMobile,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm';
  block?: boolean;
  icon?: ReactNode;
  /** не прятать кнопку в шапке на телефоне */
  keepMobile?: boolean;
}) {
  const cls = [
    'btn',
    variant !== 'secondary' && `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    !children && icon && 'btn--icon',
    keepMobile && 'btn--keep-mobile',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}

// ---------- Avatar ----------

export function initials(name: string) {
  const parts = name.replace(/[«»"()]/g, '').split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function Avatar({ name, color = '#8aa0b4', size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

// ---------- PageHeader ----------

export function PageHeader({
  title,
  titleExtra,
  search,
  onSearch,
  searchPlaceholder = 'Поиск и фильтр',
  meta,
  actions,
}: {
  title: ReactNode;
  titleExtra?: ReactNode;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <h1 className="page-header__title" style={{ margin: 0 }}>
        {title}
      </h1>
      {titleExtra}
      {onSearch ? (
        <label className="page-header__search">
          <Search aria-hidden="true" />
          <span className="sr-only">Поиск</span>
          <input value={search ?? ''} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} />
        </label>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      {meta && <div className="page-header__meta tabular">{meta}</div>}
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

// ---------- Modal (на телефоне — шторка снизу) ----------

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
  danger,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  danger?: boolean;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal${wide ? ' modal--wide' : ''}${danger ? ' modal--danger' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- Menu (выпадающее меню, позиционируется по кнопке) ----------

export interface MenuItem {
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  tone?: 'anti' | 'tiny';
  separator?: boolean;
}

export function Menu({
  trigger,
  items,
  align = 'left',
}: {
  trigger: (p: { onClick: () => void; 'aria-expanded': boolean; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const w = menu.current?.offsetWidth ?? 240;
    const h = menu.current?.offsetHeight ?? 200;
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    setPos({ top, left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => setOpen(false), { once: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {trigger({ onClick: () => setOpen((v) => !v), 'aria-expanded': open, ref: btn })}
      {open &&
        createPortal(
          <div className="menu" ref={menu} role="menu" style={{ top: pos.top, left: pos.left }}>
            {items.map((it, i) =>
              it.separator ? (
                <div key={i} className="menu__sep" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  className={`menu__item${it.tone ? ` menu__item--${it.tone}` : ''}`}
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                >
                  {it.icon}
                  {it.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ---------- Switch ----------

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    />
  );
}

// ---------- Toasts ----------

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} onClick={() => dismiss(t.id)}>
          {t.tone === 'achievement' ? (
            <Award aria-hidden="true" />
          ) : t.tone === 'danger' ? (
            <AlertTriangle aria-hidden="true" />
          ) : t.tone === 'success' ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <Info aria-hidden="true" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Empty ----------

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <p className="empty__title">{title}</p>
      {children}
    </div>
  );
}

// ---------- форматирование ----------

export const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const fmtDateTime = (iso: string) =>
  `${fmtDate(iso)} ${new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** «сегодня», «вчера» или дата — как в карточках amo */
export function fmtRelDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400_000);
  if (diff === 0) return `Сегодня ${fmtTime(iso)}`;
  if (diff === 1) return `Вчера ${fmtTime(iso)}`;
  if (diff === -1) return `Завтра ${fmtTime(iso)}`;
  return fmtDate(iso);
}

export const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000));

/** склонение: plural(5, ['сделка','сделки','сделок']) */
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function useIsMobile() {
  const q = '(max-width: 767px)';
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}
