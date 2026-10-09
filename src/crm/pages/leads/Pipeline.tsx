import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, MoreHorizontal, Plus, Search, Trash2, X } from 'lucide-react';
import { displayBudget, displayTemperature, pipelineStages, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import type { Deal, ID, Stage } from '../../../store/types';
import { Button, Menu, Modal, PageHeader, fmtRelDay, money, plural, useIsMobile } from '../../ui';
import {
  AMO_PALETTE,
  JokeLine,
  MoveStageSheet,
  NewDealModal,
  PipelineSwitch,
  TaskDot,
  TempBadge,
  ViewToggle,
  batchWithToast,
  buildTaskStates,
  dealMatches,
  usePipelineChoice,
  useStageMove,
  type TaskState,
} from './shared';
import './leads.css';

const dealsWord = (n: number) => plural(n, ['сделка', 'сделки', 'сделок']);

export default function Pipeline() {
  const demo = useDemo();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const slitDeal = useStore((s) => s.slitDeal);

  const [pipelineId, setPipelineId] = usePipelineChoice(demo.pipelines[0]?.id ?? 'p-main');
  const pipeline = demo.pipelines.find((p) => p.id === pipelineId) ?? demo.pipelines[0];
  const stages = useMemo(() => (pipeline ? pipelineStages(demo, pipeline.id) : []), [demo, pipeline]);

  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [slitAllOpen, setSlitAllOpen] = useState(false);
  const [moveId, setMoveId] = useState<ID | null>(null);
  const [expanded, setExpanded] = useState<Set<ID>>(() => new Set());
  const [dragId, setDragId] = useState<ID | null>(null);
  const [over, setOver] = useState<ID | null>(null);
  const [landed, setLanded] = useState<ID | null>(null);
  const { request, modals } = useStageMove();

  const taskStates = useMemo(() => buildTaskStates(demo.tasks), [demo.tasks]);
  const contactName = useMemo(() => new Map(demo.contacts.map((c) => [c.id, c.name])), [demo.contacts]);
  const companyName = useMemo(() => new Map(demo.companies.map((c) => [c.id, c.name])), [demo.companies]);

  const deals = useMemo(
    () => (pipeline ? demo.deals.filter((d) => d.pipelineId === pipeline.id && dealMatches(demo, d, q)) : []),
    [demo, pipeline, q],
  );
  const byStage = useMemo(() => {
    const m = new Map<ID, Deal[]>();
    for (const s of stages) m.set(s.id, []);
    for (const d of deals) m.get(d.stageId)?.push(d);
    for (const list of m.values()) list.sort((a, b) => +new Date(b.stageSince) - +new Date(a.stageSince));
    return m;
  }, [deals, stages]);

  const total = deals.reduce((s, d) => s + displayBudget(demo, d), 0);
  const firstOpen = stages.find((s) => s.kind === 'open');
  const firstOpenDeals = firstOpen ? demo.deals.filter((d) => d.stageId === firstOpen.id) : [];

  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => setLanded(null), 900);
    return () => window.clearTimeout(t);
  }, [landed]);

  // ---------- перетаскивание ----------

  const onCardDragStart = (e: DragEvent<HTMLDivElement>, id: ID) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    // «приподнятая» карточка вместо стандартного полупрозрачного призрака
    const src = e.currentTarget;
    const rect = src.getBoundingClientRect();
    const card = src.cloneNode(true) as HTMLElement;
    card.style.width = `${rect.width}px`;
    // обёртка с отступом, чтобы тень и наклон не обрезались в снимке
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.appendChild(card);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.clientX - rect.left + 14, e.clientY - rect.top + 14);
    window.setTimeout(() => ghost.remove(), 0);
    window.setTimeout(() => setDragId(id), 0);
  };
  const endDrag = () => {
    setDragId(null);
    setOver(null);
  };
  const dropTo = (e: DragEvent, stageId: ID) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    endDrag();
    if (!id) return;
    const target = demo.stages.find((s) => s.id === stageId);
    const moved = demo.deals.find((d) => d.id === id)?.stageId !== stageId;
    request(id, stageId);
    if (moved && target?.kind === 'open') setLanded(id);
  };
  const colDnD = (stageId: ID) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (over !== stageId) setOver(stageId);
    },
    onDragLeave: (e: DragEvent) => {
      if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOver((o) => (o === stageId ? null : o));
    },
    onDrop: (e: DragEvent) => dropTo(e, stageId),
  });

  const openDeal = (id: ID) => navigate(`/app/leads/${id}`);

  const cardProps = (d: Deal) => ({
    deal: d,
    contact: d.contactId ? contactName.get(d.contactId) : undefined,
    company: d.companyId ? companyName.get(d.companyId) : undefined,
    taskState: taskStates.get(d.id) ?? ('none' as TaskState),
    temp: displayTemperature(demo, d),
    budget: displayBudget(demo, d),
    dragging: dragId === d.id,
    landed: landed === d.id,
    onOpen: () => openDeal(d.id),
    onMenu: () => setMoveId(d.id),
    onDragStart: (e: DragEvent<HTMLDivElement>) => onCardDragStart(e, d.id),
    onDragEnd: endDrag,
    mobile: isMobile,
  });

  const slitAll = () => {
    const ids = firstOpenDeals.map((d) => d.id);
    setSlitAllOpen(false);
    if (!ids.length) return;
    batchWithToast(
      () => ids.forEach((id) => slitDeal(id, 'Массовый слив: кнопка «Слить всех»')),
      `Слито ${ids.length} ${dealsWord(ids.length)}. Этап «${firstOpen?.name}» чист`,
    );
  };

  const moreItems = [
    { label: 'Перейти к списку', onClick: () => navigate('/app/leads/list') },
    ...(isMobile
      ? [
          { label: 'Слить всех', tone: 'anti' as const, onClick: () => setSlitAllOpen(true) },
          { label: edit ? 'Завершить настройку' : 'Настроить воронку', onClick: () => setEdit((v) => !v) },
        ]
      : []),
    { label: 'Импорт', onClick: () => toast('Импорт лидов отключён: их и так слишком много') },
    { label: 'Экспорт', onClick: () => toast('Экспорт поставлен в очередь. Файл придёт после праздников') },
    { label: 'Печать', onClick: () => toast('Принтер на согласовании у Арсения Согласуева') },
  ];

  if (!pipeline) {
    return (
      <div className="leads-page">
        <PageHeader title="Сделки" />
        <div className="empty">
          <p className="empty__title">Воронок нет</p>
          К счастью, продавать пока некуда.
        </div>
      </div>
    );
  }

  const header = (
    <PageHeader
      title={isMobile ? <PipelineSwitch value={pipeline.id} onChange={setPipelineId} /> : 'Сделки'}
      titleExtra={
        !isMobile && (
          <div className="leads-head-extra">
            <ViewToggle view="kanban" />
            <PipelineSwitch value={pipeline.id} onChange={setPipelineId} />
          </div>
        )
      }
      search={q}
      onSearch={setQ}
      meta={`${deals.length} ${dealsWord(deals.length)}: ${money(total)}`}
      actions={
        <>
          {isMobile && (
            <Button
              variant="ghost"
              keepMobile
              icon={<Search />}
              aria-label="Поиск"
              aria-pressed={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            />
          )}
          <Menu
            align="right"
            items={moreItems}
            trigger={(p) => (
              <button {...p} className={`btn btn--icon${isMobile ? ' btn--ghost btn--keep-mobile' : ''}`} aria-label="Ещё действия">
                <MoreHorizontal />
              </button>
            )}
          />
          <Button onClick={() => setEdit((v) => !v)} aria-pressed={edit}>
            {edit ? 'Готово' : 'Настроить'}
          </Button>
          <Button variant="anti" onClick={() => setSlitAllOpen(true)}>
            Слить всех
          </Button>
          {isMobile ? (
            <Button variant="primary" keepMobile icon={<Plus />} aria-label="Новая сделка" onClick={() => setNewOpen(true)} />
          ) : (
            <Button variant="primary" icon={<Plus />} onClick={() => setNewOpen(true)}>
              Новая сделка
            </Button>
          )}
        </>
      }
    />
  );

  const editBanner = edit && (
    <div className="pipe-edit-bar" role="status">
      <span>
        <strong>Настройка воронки.</strong> Переименуйте этапы и выберите цвет. Этап «Слит (успешно)» удалить нельзя: на нём
        держится вся отчётность.
      </span>
      <Button variant="primary" size="sm" onClick={() => setEdit(false)}>
        Готово
      </Button>
    </div>
  );

  return (
    <div className="leads-page">
      {header}
      {isMobile && searchOpen && (
        <div className="m-search">
          <Search aria-hidden="true" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск и фильтр" aria-label="Поиск сделок" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Очистить">
              <X />
            </button>
          )}
        </div>
      )}
      {editBanner}

      {isMobile ? (
        <MobileBoard
          stages={stages}
          byStage={byStage}
          demoBudget={(d) => displayBudget(demo, d)}
          cardProps={cardProps}
          firstOpenId={firstOpen?.id}
          edit={edit}
        />
      ) : (
        <div className={`pipe${dragId ? ' is-dragging' : ''}`}>
          {stages.map((s) => {
            const list = byStage.get(s.id) ?? [];
            const sum = list.reduce((a, d) => a + displayBudget(demo, d), 0);
            const collapsible = s.kind === 'payment' || s.kind === 'won';
            const collapsed = collapsible && !expanded.has(s.id) && !edit;
            const toggle = () =>
              setExpanded((prev) => {
                const n = new Set(prev);
                if (n.has(s.id)) n.delete(s.id);
                else n.add(s.id);
                return n;
              });
            if (collapsed) {
              return (
                <button
                  key={s.id}
                  className={`col col--collapsed col--${s.kind}${over === s.id ? ' is-over' : ''}`}
                  style={{ ['--stage' as string]: s.color }}
                  onClick={toggle}
                  title={`${s.name}: ${list.length} ${dealsWord(list.length)}. Нажмите, чтобы развернуть`}
                  {...colDnD(s.id)}
                >
                  <span className="col__count tabular">{list.length}</span>
                  <span className="col__vlabel">{s.kind === 'payment' ? `${s.name} · не рекомендуется` : s.name}</span>
                </button>
              );
            }
            return (
              <section
                key={s.id}
                className={`col col--${s.kind}${over === s.id ? ' is-over' : ''}`}
                style={{ ['--stage' as string]: s.color }}
                aria-label={s.name}
                {...colDnD(s.id)}
              >
                <StageHead
                  stage={s}
                  count={list.length}
                  sum={sum}
                  edit={edit}
                  onCollapse={collapsible ? toggle : undefined}
                />
                <div className="col__body">
                  {s.id === firstOpen?.id && <QuickAdd stageId={s.id} />}
                  {list.map((d) => (
                    <DealCard key={d.id} {...cardProps(d)} />
                  ))}
                  {list.length === 0 && <ColEmpty stage={s} searching={!!q} />}
                </div>
              </section>
            );
          })}
          <div className="pipe__tail" aria-hidden="true" />
        </div>
      )}

      {dragId && !isMobile && (
        <div className="drop-bar" role="presentation">
          <div
            className={`drop-zone drop-zone--delete${over === '__delete' ? ' is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (over !== '__delete') setOver('__delete');
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              endDrag();
              toast('Удалять сделки нельзя: по ним считается конверсия в отказ');
            }}
          >
            <Trash2 aria-hidden="true" />
            Удалить
          </div>
          {stages
            .filter((s) => s.kind === 'lost' || s.kind === 'won')
            .map((s) => (
              <div
                key={s.id}
                className={`drop-zone drop-zone--${s.kind}${over === `z-${s.id}` ? ' is-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (over !== `z-${s.id}`) setOver(`z-${s.id}`);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => dropTo(e, s.id)}
              >
                {s.name}
              </div>
            ))}
        </div>
      )}

      <NewDealModal open={newOpen} onClose={() => setNewOpen(false)} pipelineId={pipeline.id} />
      <MoveStageSheet dealId={moveId} onClose={() => setMoveId(null)} onPick={request} />
      <Modal
        open={slitAllOpen}
        title="Слить всех?"
        onClose={() => setSlitAllOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSlitAllOpen(false)}>
              Пусть ещё полежат
            </Button>
            <Button variant="anti" onClick={slitAll} disabled={firstOpenDeals.length === 0}>
              Слить {firstOpenDeals.length} {dealsWord(firstOpenDeals.length)}
            </Button>
          </>
        }
      >
        <p className="modal-lead" style={{ marginBottom: 0 }}>
          {firstOpenDeals.length > 0
            ? `Все сделки этапа «${firstOpen?.name}» (${firstOpenDeals.length} шт., ${money(
                firstOpenDeals.reduce((a, d) => a + d.budget, 0),
              )}) уйдут в «Слит (успешно)» с причиной «Массовый слив». Клиентов предупреждать не будем.`
            : `В этапе «${firstOpen?.name ?? 'Новый лид'}» пусто. Все уже слиты, отдел может идти на перекур.`}
        </p>
      </Modal>
      {modals}
    </div>
  );
}

// ---------- шапка этапа ----------

function StageHead({
  stage,
  count,
  sum,
  edit,
  onCollapse,
}: {
  stage: Stage;
  count: number;
  sum: number;
  edit: boolean;
  onCollapse?: () => void;
}) {
  const updateStage = useStore((s) => s.updateStage);
  const [name, setName] = useState(stage.name);
  useEffect(() => setName(stage.name), [stage.name]);

  const save = () => {
    const v = name.trim();
    if (!v) {
      setName(stage.name);
      return;
    }
    if (v !== stage.name) {
      updateStage(stage.id, { name: v });
      toast(`Этап переименован: «${v}»`);
    }
  };

  return (
    <header className="col__head">
      {edit ? (
        <div className="col__edit">
          <input
            className="col__name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setName(stage.name);
            }}
            aria-label="Название этапа"
          />
          <div className="swatches" role="radiogroup" aria-label="Цвет этапа">
            {AMO_PALETTE.map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={c === stage.color}
                aria-label={c}
                className="swatch"
                style={{ background: c }}
                onClick={() => updateStage(stage.id, { color: c })}
              />
            ))}
          </div>
          {stage.kind === 'lost' && (
            <span className="col__lock">
              <Lock aria-hidden="true" /> Удалить нельзя
            </span>
          )}
        </div>
      ) : (
        <>
          <h2 className="col__name">
            {stage.name}
            {stage.kind === 'payment' && <span className="col__warn"> · не рекомендуется</span>}
          </h2>
          <div className="col__meta tabular">
            {count} {dealsWord(count)}: {money(sum)}
          </div>
          {onCollapse && (
            <button className="col__collapse" onClick={onCollapse} aria-label="Свернуть этап" title="Свернуть">
              <X />
            </button>
          )}
        </>
      )}
      <span className="col__line" />
    </header>
  );
}

function ColEmpty({ stage, searching }: { stage: Stage; searching: boolean }) {
  const text = searching
    ? 'Ничего не нашлось'
    : stage.kind === 'lost'
      ? 'Пока никого не слили. Это поправимо'
      : stage.kind === 'won'
        ? 'Инцидентов нет. Так держать'
        : stage.kind === 'payment'
          ? 'До оплаты никто не дошёл'
          : 'Пусто. Лиды сюда ещё не дошли';
  return <p className="col__empty">{text}</p>;
}

// ---------- быстрое добавление ----------

function QuickAdd({ stageId }: { stageId: ID }) {
  const addDeal = useStore((s) => s.addDeal);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [budget, setBudget] = useState('');
  const [sendOut, setSendOut] = useState(true);

  if (!open) {
    return (
      <button className="quick-add" onClick={() => setOpen(true)}>
        Быстрое добавление
      </button>
    );
  }
  const reset = () => {
    setTitle('');
    setContact('');
    setBudget('');
    setSendOut(true);
    setOpen(false);
  };
  return (
    <form
      className="quick-form"
      onSubmit={(e) => {
        e.preventDefault();
        addDeal({ title, contactName: contact, budget: Number(budget) || 0, stageId, sendOut });
        reset();
      }}
      onKeyDown={(e) => e.key === 'Escape' && reset()}
    >
      <input className="quick-form__input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название сделки" aria-label="Название сделки" />
      <input className="quick-form__input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Контакт: имя" aria-label="Контакт" />
      <input
        className="quick-form__input tabular"
        inputMode="numeric"
        value={budget}
        onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))}
        placeholder="Бюджет, ₽"
        aria-label="Бюджет"
      />
      <label className="check quick-form__check">
        <input type="checkbox" checked={sendOut} onChange={(e) => setSendOut(e.target.checked)} />
        Сразу отправить в аут
      </label>
      <div className="quick-form__actions">
        <Button variant="primary" size="sm" type="submit">
          Добавить
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

// ---------- карточка сделки в воронке ----------

interface CardProps {
  deal: Deal;
  contact?: string;
  company?: string;
  taskState: TaskState;
  temp: Deal['temperature'];
  budget: number;
  dragging: boolean;
  landed: boolean;
  onOpen: () => void;
  onMenu: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  mobile: boolean;
}

function DealCard(p: CardProps) {
  const { deal } = p;
  const press = useRef<{ t: number; x: number; y: number; fired: boolean } | null>(null);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.t);
  };

  return (
    <div
      className={`deal-card${p.dragging ? ' is-dragging' : ''}${p.landed ? ' is-landed' : ''}`}
      draggable={!p.mobile}
      onDragStart={p.onDragStart}
      onDragEnd={p.onDragEnd}
      onClick={(e) => {
        if (press.current?.fired) {
          press.current = null;
          return;
        }
        if ((e.target as HTMLElement).closest('a,button')) return;
        p.onOpen();
      }}
      onContextMenu={(e) => p.mobile && e.preventDefault()}
      onTouchStart={(e) => {
        const t0 = e.touches[0];
        const t = window.setTimeout(() => {
          if (press.current) press.current.fired = true;
          if (navigator.vibrate) navigator.vibrate(12);
          p.onMenu();
        }, 450);
        press.current = { t, x: t0.clientX, y: t0.clientY, fired: false };
      }}
      onTouchMove={(e) => {
        const c = press.current;
        if (!c) return;
        const t0 = e.touches[0];
        if (Math.abs(t0.clientX - c.x) > 8 || Math.abs(t0.clientY - c.y) > 8) cancelPress();
      }}
      onTouchEnd={(e) => {
        cancelPress();
        // шторка уже открыта: гасим «призрачный» клик, иначе он закроет её сразу
        if (press.current?.fired) {
          e.preventDefault();
          press.current = null;
        }
      }}
      onTouchCancel={cancelPress}
    >
      <div className="deal-card__top">
        <span className="deal-card__contact">{p.contact ?? p.company ?? 'Без контакта'}</span>
        <span className="deal-card__date tabular">{fmtRelDay(deal.createdAt)}</span>
      </div>
      <Link to={`/app/leads/${deal.id}`} className="deal-card__title" draggable={false}>
        {deal.title}
      </Link>
      <JokeLine postpones={deal.postpones} tags={deal.tags} />
      <div className="deal-card__bottom">
        <TaskDot state={p.taskState} />
        <span className="deal-card__budget tabular">{money(p.budget)}</span>
        <span style={{ flex: 1 }} />
        <TempBadge temp={p.temp} />
      </div>
      <button
        className="deal-card__more"
        aria-label={`Переместить «${deal.title}» в этап`}
        title="Переместить в этап"
        onClick={(e) => {
          e.stopPropagation();
          p.onMenu();
        }}
      >
        <MoreHorizontal />
      </button>
    </div>
  );
}

// ---------- телефон: один этап на экран ----------

function MobileBoard({
  stages,
  byStage,
  demoBudget,
  cardProps,
  firstOpenId,
  edit,
}: {
  stages: Stage[];
  byStage: Map<ID, Deal[]>;
  demoBudget: (d: Deal) => number;
  cardProps: (d: Deal) => CardProps;
  firstOpenId?: ID;
  edit: boolean;
}) {
  const board = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    chips.current[active]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  const go = (i: number) => {
    const el = board.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setActive(i);
  };

  return (
    <>
      <div className="stage-tabs" role="tablist" aria-label="Этапы">
        {stages.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => (chips.current[i] = el)}
            role="tab"
            aria-selected={i === active}
            className={`stage-chip stage-chip--${s.kind}${i === active ? ' is-on' : ''}`}
            style={{ ['--stage' as string]: s.color }}
            onClick={() => go(i)}
          >
            <span className="stage-chip__dot" />
            {s.name}
            <span className="stage-chip__n tabular">{byStage.get(s.id)?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <div
        className="pipe pipe--mobile"
        ref={board}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== active) setActive(i);
        }}
      >
        {stages.map((s) => {
          const list = byStage.get(s.id) ?? [];
          const sum = list.reduce((a, d) => a + demoBudget(d), 0);
          return (
            <section key={s.id} className={`col col--m col--${s.kind}`} style={{ ['--stage' as string]: s.color }} aria-label={s.name}>
              <StageHead stage={s} count={list.length} sum={sum} edit={edit} />
              <div className="col__body">
                {s.id === firstOpenId && <QuickAdd stageId={s.id} />}
                {list.map((d) => (
                  <DealCard key={d.id} {...cardProps(d)} />
                ))}
                {list.length === 0 && <ColEmpty stage={s} searching={false} />}
                {list.length > 0 && <p className="col__hint">Удерживайте карточку, чтобы переместить</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
