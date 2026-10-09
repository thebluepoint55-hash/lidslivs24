import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, Check, ChevronRight, Code2, Handshake, MoreHorizontal, Plus, SearchX, Store } from 'lucide-react';
import type { MarketApp, MarketCategory } from '../../../store/types';
import { useDemo } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Avatar, Button, Empty, Menu, Modal, PageHeader, fmtDate, plural } from '../../ui';
import { APP } from '../../../data/appIds';
import { AppLogo } from './appIcon';
import { Banners } from './Banners';
import {
  BADGE_LABEL,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  DemoMark,
  Stars,
  fmtCount,
  useInstallFlow,
} from './shared';
import './market.css';

type Tab = 'installed' | 'featured' | MarketCategory;

const TABS: { id: Tab; label: string }[] = [
  { id: 'installed', label: 'Установленные' },
  { id: 'featured', label: 'Выбор ЛидСливс24' },
  ...CATEGORY_ORDER.map((c) => ({ id: c as Tab, label: CATEGORY_LABEL[c] })),
];

const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.id === v);

const byPopularity = (a: MarketApp, b: MarketApp) => b.installsCount - a.installsCount;

// ---------- плитка ----------

function AppTile({ app, onOpen, onInstall }: { app: MarketApp; onOpen: () => void; onInstall: () => void }) {
  return (
    <article className={`mkt-tile${app.installed ? ' is-installed' : ''}`}>
      {app.badge && <span className={`mkt-ribbon mkt-ribbon--${app.badge}`}>{BADGE_LABEL[app.badge]}</span>}
      <AppLogo app={app} size={64} />
      <div className="mkt-tile__body">
        <h3 className="mkt-tile__name">
          <button className="mkt-tile__open" onClick={onOpen}>
            {app.name}
          </button>
        </h3>
        <div className="mkt-tile__rating">
          <Stars value={app.rating} />
          <span className="tabular">{fmtCount(app.reviewsCount)}</span>
        </div>
        <p className="mkt-tile__short">{app.short}</p>
        <div className="mkt-tile__foot">
          {app.installed ? (
            <span className="mkt-installed-btn">
              <Check size={14} aria-hidden="true" />
              Установлено
            </span>
          ) : (
            <button className="mkt-install-btn" onClick={onInstall}>
              {app.id === APP.invoice ? 'Запросить согласование' : 'Установить бесплатно'}
            </button>
          )}
          {app.worksInDemo && <DemoMark />}
        </div>
      </div>
    </article>
  );
}

function TileGrid({ apps, open, install }: { apps: MarketApp[]; open: (a: MarketApp) => void; install: (a: MarketApp) => void }) {
  return (
    <div className="mkt-grid">
      {apps.map((a) => (
        <AppTile key={a.id} app={a} onOpen={() => open(a)} onInstall={() => install(a)} />
      ))}
    </div>
  );
}

// ---------- окно приложения ----------

function AppModal({
  app,
  onClose,
  onInstall,
  onUninstall,
}: {
  app: MarketApp | null;
  onClose: () => void;
  onInstall: (a: MarketApp) => void;
  onUninstall: (a: MarketApp) => void;
}) {
  const demo = useDemo();
  const [owner, setOwner] = useState('you');
  if (!app) return null;

  const paragraphs = app.description.split(/\n{2,}|\n/).filter(Boolean);

  return (
    <Modal open wide title={CATEGORY_LABEL[app.category] ?? 'Приложение'} onClose={onClose}>
      <div className="mkt-app">
        <aside className="mkt-app__side">
          <div className="mkt-app__logo">
            <AppLogo app={app} size={96} />
            {app.badge && <span className={`mkt-chip mkt-chip--${app.badge}`}>{BADGE_LABEL[app.badge]}</span>}
          </div>
          <h3 className="mkt-app__name">{app.name}</h3>
          <p className="mkt-app__dev">Разработчик: {app.developer}</p>
          <div className="mkt-app__rating">
            <Stars value={app.rating} size={15} />
            <span className="tabular">{app.rating.toFixed(1).replace('.', ',')}</span>
            <span className="mkt-muted tabular">
              {fmtCount(app.reviewsCount)} {plural(app.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}
            </span>
          </div>
          <p className="mkt-app__installs tabular">
            Установок: {fmtCount(app.installsCount)}
          </p>
          <p className="mkt-app__short">{app.short}</p>
          {app.worksInDemo && <DemoMark />}
          <div className="mkt-app__status">
            {app.installed ? (
              <>
                <span className="mkt-lime">
                  <Check size={14} aria-hidden="true" />
                  Установлен{app.installedAt ? ` ${fmtDate(app.installedAt)}` : ''}
                </span>
                <Button block onClick={() => onUninstall(app)}>
                  Отключить
                </Button>
              </>
            ) : (
              <Button variant="primary" block onClick={() => onInstall(app)}>
                {app.id === APP.invoice ? 'Запросить согласование' : 'Установить'}
              </Button>
            )}
          </div>
        </aside>

        <div className="mkt-app__main">
          <h4 className="mkt-app__h caps">Настройки</h4>
          {app.setup.length > 0 ? (
            <ol className="mkt-steps">
              {app.setup.map((s, i) => (
                <li key={i}>
                  <span className="mkt-steps__n tabular">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mkt-muted">Настраивать нечего. Приложение и так всё испортит.</p>
          )}
          <label className="mkt-field">
            <span className="mkt-field__label">Безответственный за слив</span>
            <select
              className="select"
              value={owner}
              disabled={!app.installed}
              onChange={(e) => {
                setOwner(e.target.value);
                toast('Безответственный назначен. Он пока не в курсе');
              }}
            >
              <option value="you">Вы (стажёр)</option>
              {demo.managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {!app.installed && <span className="mkt-field__hint">Поле станет доступно после установки</span>}
          </label>

          <h4 className="mkt-app__h caps">Описание</h4>
          <div className="mkt-app__desc">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <h4 className="mkt-app__h caps">
            Отзывы <span className="mkt-muted tabular">{app.reviews.length}</span>
          </h4>
          {app.reviews.length === 0 ? (
            <p className="mkt-muted">Отзывов нет. Пользователи ещё думают.</p>
          ) : (
            <ul className="mkt-reviews">
              {app.reviews.map((r, i) => (
                <li key={i} className="mkt-review">
                  <Avatar name={r.author} color="#8aa0b4" size={32} />
                  <div>
                    <div className="mkt-review__head">
                      <strong>{r.author}</strong>
                      <Stars value={r.stars} size={12} />
                    </div>
                    <p>{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------- строки «Установленные» ----------

function InstalledList({ apps, open, uninstall, toFeatured }: { apps: MarketApp[]; open: (a: MarketApp) => void; uninstall: (a: MarketApp) => void; toFeatured: () => void }) {
  if (apps.length === 0)
    return (
      <Empty icon={<Store size={40} strokeWidth={1.3} />} title="Пока ничего не установлено">
        <p className="mkt-empty-text">Клиенты покупают без помех. Начните с «Холодильника лидов» в подборке.</p>
        <Button variant="primary" onClick={toFeatured}>
          Открыть подборку
        </Button>
      </Empty>
    );
  return (
    <ul className="mkt-rows">
      {apps.map((a) => (
        <li key={a.id} className="mkt-row">
          <AppLogo app={a} size={48} />
          <div className="mkt-row__main">
            <button className="mkt-row__name" onClick={() => open(a)}>
              {a.name}
            </button>
            <span className="mkt-muted">{CATEGORY_LABEL[a.category]}</span>
          </div>
          <span className="mkt-lime tabular">Установлено {a.installedAt ? fmtDate(a.installedAt) : 'давно'}</span>
          <span className="mkt-row__dev">Разработчик: {a.developer}</span>
          <Button size="sm" onClick={() => uninstall(a)}>
            Отключить
          </Button>
        </li>
      ))}
    </ul>
  );
}

// ---------- страница ----------

export default function Market() {
  const demo = useDemo();
  const apps = demo.apps;
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const tabParam = params.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'featured';
  const openId = params.get('app');
  const openApp = apps.find((a) => a.id === openId) ?? null;
  const flow = useInstallFlow(apps);
  const tabsRef = useRef<HTMLElement>(null);

  // на телефоне вкладки листаются: активную держим в поле зрения
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>('.is-active');
    if (!el || !tabsRef.current) return;
    const nav = tabsRef.current;
    const left = el.offsetLeft - nav.clientWidth / 2 + el.offsetWidth / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [tab]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    // открытие окна приложения — новая запись истории («Назад» закрывает окно), остальное — замена
    setParams(next, { replace: !(key === 'app' && value) });
  };
  const setTab = (t: Tab) => {
    setQ('');
    setParam('tab', t);
  };
  const open = (a: MarketApp) => setParam('app', a.id);
  const close = () => setParam('app', null);

  const installed = useMemo(
    () => apps.filter((a) => a.installed).sort((a, b) => (b.installedAt ?? '').localeCompare(a.installedAt ?? '')),
    [apps],
  );

  const byCat = useMemo(() => {
    const m = new Map<MarketCategory, MarketApp[]>();
    for (const c of CATEGORY_ORDER) m.set(c, apps.filter((a) => a.category === c).sort(byPopularity));
    return m;
  }, [apps]);

  const picks = useMemo(
    () =>
      apps
        .filter((a) => (a.worksInDemo || a.badge === 'hit') && a.id !== APP.invoice)
        .sort((a, b) => Number(b.worksInDemo) - Number(a.worksInDemo) || byPopularity(a, b))
        .slice(0, 6),
    [apps],
  );

  const query = q.trim().toLowerCase();
  const found = query
    ? apps.filter((a) =>
        [a.name, a.short, a.developer, a.description, CATEGORY_LABEL[a.category]].some((s) => s?.toLowerCase().includes(query)),
      )
    : [];

  const counter = (n: number) => `${n} ${plural(n, ['приложение', 'приложения', 'приложений'])}`;

  let content;
  if (apps.length === 0) {
    content = (
      <Empty icon={<Store size={40} strokeWidth={1.3} />} title="Магазин закрыт на переучёт">
        <p className="mkt-empty-text">Приложения скоро вернутся. Мы им перезвоним.</p>
      </Empty>
    );
  } else if (query) {
    content =
      found.length === 0 ? (
        <Empty icon={<SearchX size={40} strokeWidth={1.3} />} title="К счастью, ничего не найдено">
          <p className="mkt-empty-text">Попробуйте другой запрос или просто ничего не ищите.</p>
        </Empty>
      ) : (
        <section className="mkt-section">
          <h2 className="mkt-section__title">
            Результаты поиска <span className="mkt-muted tabular">· {counter(found.length)}</span>
          </h2>
          <TileGrid apps={found} open={open} install={flow.install} />
        </section>
      );
  } else if (tab === 'installed') {
    content = (
      <section className="mkt-section">
        <InstalledList apps={installed} open={open} uninstall={flow.uninstall} toFeatured={() => setTab('featured')} />
      </section>
    );
  } else if (tab === 'featured') {
    content = (
      <>
        <Banners
          hasApp={(id) => apps.some((a) => a.id === id)}
          onOpenApp={(id) => {
            const a = apps.find((x) => x.id === id);
            if (a) open(a);
          }}
        />
        {picks.length > 0 && (
          <section className="mkt-section">
            <h2 className="mkt-section__title">Выбор ЛидСливс24</h2>
            <TileGrid apps={picks} open={open} install={flow.install} />
          </section>
        )}
        {CATEGORY_ORDER.map((c) => {
          const list = byCat.get(c) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={c} className="mkt-section">
              <h2 className="mkt-section__title">
                {CATEGORY_LABEL[c]}
                <button className="mkt-section__all" onClick={() => setTab(c)}>
                  Смотреть все ({list.length})
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </h2>
              <TileGrid apps={list.slice(0, 3)} open={open} install={flow.install} />
            </section>
          );
        })}
      </>
    );
  } else {
    const list = byCat.get(tab) ?? [];
    content = (
      <section className="mkt-section">
        <h2 className="mkt-section__title">
          {CATEGORY_LABEL[tab]} <span className="mkt-muted tabular">· {counter(list.length)}</span>
        </h2>
        {list.length > 0 && <TileGrid apps={list} open={open} install={flow.install} />}
        {tab === 'billing' ? (
          <div className="mkt-note">
            <Ban size={18} aria-hidden="true" />
            <p>
              Других приложений для приёма оплаты в СливМаркете нет.
              <br />
              <strong>…и это правильно.</strong>
            </p>
          </div>
        ) : (
          list.length === 0 && (
            <Empty title="К счастью, приложений не найдено">
              <p className="mkt-empty-text">В этой категории пока ничего не мешает продажам.</p>
            </Empty>
          )
        )}
      </section>
    );
  }

  return (
    <div className="mkt">
      <PageHeader
        title="СливМаркет"
        search={q}
        onSearch={setQ}
        searchPlaceholder="Поиск приложений"
        actions={
          <>
            <Menu
              align="right"
              items={[
                {
                  label: 'Мои разработки',
                  icon: <Code2 />,
                  onClick: () => toast('Разработок нет. Это тоже результат'),
                },
                {
                  label: 'Стать партнёром',
                  icon: <Handshake />,
                  onClick: () => toast('Заявка на партнёрство отправлена Согласуеву. Ждите после праздников'),
                },
              ]}
              trigger={(p) => (
                <button className="btn btn--icon btn--keep-mobile" aria-label="Ещё" {...p}>
                  <MoreHorizontal size={18} />
                </button>
              )}
            />
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => toast('Вебхук создан. Заявки уходят на адрес /dev/null, доставка гарантирована')}
            >
              Web hooks
            </Button>
          </>
        }
      />
      <nav className="mkt-tabs" aria-label="Категории" ref={tabsRef}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mkt-tabs__item${!query && t.id === tab ? ' is-active' : ''}`}
            aria-current={!query && t.id === tab ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'installed' && installed.length > 0 && <span className="mkt-tabs__count tabular">{installed.length}</span>}
          </button>
        ))}
      </nav>
      <div className="mkt-body">{content}</div>

      <AppModal
        app={openApp}
        onClose={close}
        onInstall={(a) => {
          // согласование и «что изменилось» показываем отдельным окном, без стопки модалок
          if (a.id === APP.invoice || a.worksInDemo) close();
          flow.install(a);
        }}
        onUninstall={flow.uninstall}
      />
      {flow.ui}
    </div>
  );
}
