import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CalendarClock, Check, ChevronDown, Columns3, Flame, List, Snowflake, Thermometer, ThermometerSnowflake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemo, useStore } from '../../../store/store';
import { toast, useUI, type ToastTone } from '../../../store/ui';
import type { DemoState, ID, Stage, Task, TaskType, Temperature } from '../../../store/types';
import { lossReasons } from '../../../data/excuses';
import { Button, Menu, Modal, money, plural } from '../../ui';

// ---------- выбор воронки (запоминаем у зрителя в браузере) ----------

const PIPE_KEY = 'ls24-pipeline';

export function usePipelineChoice(fallback: ID): [ID, (id: ID) => void] {
  const [id, setId] = useState<ID>(() => {
    try {
      return localStorage.getItem(PIPE_KEY) || fallback;
    } catch {
      return fallback;
    }
  });
  const set = useCallback((v: ID) => {
    setId(v);
    try {
      localStorage.setItem(PIPE_KEY, v);
    } catch {
      /* без сохранения */
    }
  }, []);
  return [id, set];
}

// ---------- задачи сделки: точка как у amo ----------

export type TaskState = 'overdue' | 'today' | 'future' | 'none';

export function buildTaskStates(tasks: Task[]): Map<ID, TaskState> {
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const rank: Record<TaskState, number> = { none: 0, future: 1, today: 2, overdue: 3 };
  const map = new Map<ID, TaskState>();
  for (const t of tasks) {
    if (t.done || !t.dealId) continue;
    const due = new Date(t.due).getTime();
    const st: TaskState = due < now ? 'overdue' : due <= todayEnd.getTime() ? 'today' : 'future';
    const prev = map.get(t.dealId) ?? 'none';
    if (rank[st] > rank[prev]) map.set(t.dealId, st);
  }
  return map;
}

const taskTitle: Record<TaskState, string> = {
  overdue: 'Задача просрочена. Всё по плану',
  today: 'Задача на сегодня. Можно перенести',
  future: 'Задача запланирована',
  none: 'Нет задач. Клиент может подумать, что о нём забыли (так и есть)',
};

export function TaskDot({ state }: { state: TaskState }) {
  return <span className={`task-dot task-dot--${state}`} title={taskTitle[state]} aria-label={taskTitle[state]} role="img" />;
}

// ---------- температура ----------

export const tempLabel: Record<Temperature, string> = {
  hot: 'Горячий',
  warm: 'Тёплый',
  cold: 'Холодный',
  ice: 'Лёд',
};

export const tempDegrees: Record<Temperature, string> = {
  hot: '+38 °C',
  warm: '+21 °C',
  cold: '+4 °C',
  ice: '−18 °C',
};

export function TempBadge({ temp, compact }: { temp: Temperature; compact?: boolean }) {
  const Icon = temp === 'hot' ? Flame : temp === 'ice' ? Snowflake : temp === 'cold' ? ThermometerSnowflake : Thermometer;
  return (
    <span className={`temp temp--${temp}`} title={`Температура: ${tempLabel[temp]}`}>
      <Icon aria-hidden="true" />
      {!compact && tempLabel[temp]}
    </span>
  );
}

/** «горячий — остудить» и похожие теги подсвечиваем */
export const isHotTag = (t: string) => /горяч|остуд|опасн|готов|счёт|платит/i.test(t);

export function JokeLine({ postpones, tags }: { postpones: number; tags: string[] }) {
  if (!postpones && tags.length === 0) return null;
  const tag = tags[0];
  return (
    <div className="deal-card__joke">
      {postpones > 0 && (
        <span className="deal-card__pp">
          <CalendarClock aria-hidden="true" />
          Перенесено {postpones} {plural(postpones, ['раз', 'раза', 'раз'])}
        </span>
      )}
      {tag && <span className={`tag${isHotTag(tag) ? ' tag--hot' : ''}`}>{tag}</span>}
    </div>
  );
}

// ---------- цвет этапа ----------

export function StagePill({ stage }: { stage?: Stage }) {
  if (!stage) return <span className="pill">—</span>;
  return (
    <span className="pill stage-pill" style={{ background: stage.color }}>
      {stage.name}
    </span>
  );
}

/** Палитра этапов amoCRM */
export const AMO_PALETTE = ['#99ccff', '#ffff99', '#87f2c0', '#ffcc66', '#f3beff', '#ffcccc', '#ff8f92', '#fffeb2', '#f9deff', '#fffd7f', '#d0d0d0'];

// ---------- тосты пачкой: одна строка вместо десяти одинаковых ----------

export function batchWithToast(fn: () => void, summary: string, tone: ToastTone = 'success') {
  const before = new Set(useUI.getState().toasts.map((t) => t.id));
  fn();
  useUI.setState((s) => ({ toasts: s.toasts.filter((t) => before.has(t.id)) }));
  toast(summary, tone);
}

// ---------- окна ----------

export function LossReasonModal({
  open,
  title = 'Причина слива',
  onClose,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [choice, setChoice] = useState(0);
  const [own, setOwn] = useState('');
  const isOwn = choice === lossReasons.length;
  const reason = isOwn ? own.trim() : lossReasons[choice];
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Оставить в работе
          </Button>
          <Button
            variant="anti"
            disabled={!reason}
            onClick={() => {
              onConfirm(reason);
              setOwn('');
              setChoice(0);
            }}
          >
            Слить
          </Button>
        </>
      }
    >
      <p className="modal-lead">Укажите причину. Отдел аналитики соберёт из них красивую диаграмму.</p>
      <div className="radio-list" role="radiogroup" aria-label="Причина слива">
        {lossReasons.map((r, i) => (
          <label key={r} className={`radio-row${choice === i ? ' is-on' : ''}`}>
            <input type="radio" name="loss" checked={choice === i} onChange={() => setChoice(i)} />
            <span>{r}</span>
          </label>
        ))}
        <label className={`radio-row${isOwn ? ' is-on' : ''}`}>
          <input type="radio" name="loss" checked={isOwn} onChange={() => setChoice(lossReasons.length)} />
          <span>Своя причина</span>
        </label>
        {isOwn && (
          <input
            className="input"
            autoFocus
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            placeholder="Например: клиент назвал нас по имени"
          />
        )}
      </div>
    </Modal>
  );
}

export function IncidentModal({ dealId, onClose }: { dealId: ID | null; onClose: () => void }) {
  const demo = useDemo();
  const reportIncident = useStore((s) => s.reportIncident);
  const deal = dealId ? demo.deals.find((d) => d.id === dealId) : undefined;
  const [what, setWhat] = useState('');
  const [who, setWho] = useState('');
  const [how, setHow] = useState('');
  const suspects = useMemo(
    () => ['Вы (стажёр)', ...demo.managers.map((m) => m.name), 'Клиент (слишком настойчив)', 'Ретроградный Меркурий'],
    [demo.managers],
  );
  const close = () => {
    setWhat('');
    setWho('');
    setHow('');
    onClose();
  };
  return (
    <Modal
      open={!!deal}
      danger
      title="Инцидент: клиент купил"
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Заполню после праздников
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deal) reportIncident(deal.id, { what, who, how });
              close();
            }}
          >
            Отправить разбор
          </Button>
        </>
      }
    >
      {deal && (
        <>
          <p className="modal-lead">
            Сделка «{deal.title}» на {money(deal.budget)} дошла до оплаты. Руководитель уже знает. Опишите, как это
            случилось, чтобы отдел не повторил ошибку.
          </p>
          <label className="field">
            <span className="field__label">Что пошло не так?</span>
            <textarea
              className="textarea"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="Например: взял трубку с первого гудка"
            />
          </label>
          <label className="field">
            <span className="field__label">Кто виноват?</span>
            <select className="select" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Выберите виновного</option>
              {suspects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Как не допустить впредь?</span>
            <textarea
              className="textarea"
              value={how}
              onChange={(e) => setHow(e.target.value)}
              placeholder="Например: не открывать письма с темой «Счёт»"
            />
          </label>
        </>
      )}
    </Modal>
  );
}

export function PaymentConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Вы уверены? Клиент может заплатить"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onConfirm}>
            Да, в оплату
          </Button>
          <Button variant="anti" onClick={onCancel} autoFocus>
            Нет, остудить
          </Button>
        </>
      }
    >
      <p className="modal-lead" style={{ marginBottom: 0 }}>
        В этапе «Оплата» клиент получает реквизиты и может перевести деньги. Отделу придётся отгружать товар, а
        руководитель получит уведомление.
      </p>
    </Modal>
  );
}

const TASK_TYPES: { id: TaskType; label: string }[] = [
  { id: 'call', label: 'Связаться (не будем)' },
  { id: 'meeting', label: 'Встреча (перенести)' },
  { id: 'kp', label: 'Отправить КП (в пятницу вечером)' },
  { id: 'think', label: 'Подумать о клиенте' },
  { id: 'followup', label: 'Напомнить о себе' },
];
export { TASK_TYPES };

export function NewDealModal({
  open,
  onClose,
  pipelineId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  pipelineId: ID;
  onCreated?: (id: ID) => void;
}) {
  const demo = useDemo();
  const addDeal = useStore((s) => s.addDeal);
  const stages = demo.stages.filter((s) => s.pipelineId === pipelineId && s.kind === 'open');
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [budget, setBudget] = useState('');
  const [stageId, setStageId] = useState('');
  const [sendOut, setSendOut] = useState(true);
  const reset = () => {
    setTitle('');
    setContact('');
    setBudget('');
    setStageId('');
    setSendOut(true);
  };
  const close = () => {
    reset();
    onClose();
  };
  const submit = () => {
    const id = addDeal({
      title,
      contactName: contact,
      budget: Math.max(0, Number(budget.replace(/\s/g, '')) || 0),
      stageId: stageId || stages[0]?.id || '',
      sendOut,
    });
    reset();
    onClose();
    if (id) onCreated?.(id);
  };
  return (
    <Modal
      open={open}
      title="Новая сделка"
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} disabled={stages.length === 0}>
            Создать
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="field">
          <span className="field__label">Название</span>
          <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Сделка #…" />
        </label>
        <label className="field">
          <span className="field__label">Контакт</span>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Имя клиента" />
        </label>
        <div className="field-row">
          <label className="field">
            <span className="field__label">Бюджет, ₽</span>
            <input
              className="input tabular"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="0"
            />
          </label>
          <label className="field">
            <span className="field__label">Этап</span>
            <select className="select" value={stageId || stages[0]?.id} onChange={(e) => setStageId(e.target.value)}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={sendOut} onChange={(e) => setSendOut(e.target.checked)} />
          Сразу отправить в аут
        </label>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function MoveStageSheet({
  dealId,
  onClose,
  onPick,
}: {
  dealId: ID | null;
  onClose: () => void;
  onPick: (dealId: ID, stageId: ID) => void;
}) {
  const demo = useDemo();
  const deal = dealId ? demo.deals.find((d) => d.id === dealId) : undefined;
  const stages = deal ? demo.stages.filter((s) => s.pipelineId === deal.pipelineId) : [];
  return (
    <Modal open={!!deal} title="Переместить в этап" onClose={onClose}>
      {deal && (
        <>
          <p className="modal-lead">«{deal.title}»</p>
          <div className="stage-pick">
            {stages.map((s) => {
              const cur = s.id === deal.stageId;
              return (
                <button
                  key={s.id}
                  className={`stage-pick__item${cur ? ' is-current' : ''} stage-pick__item--${s.kind}`}
                  disabled={cur}
                  onClick={() => {
                    onClose();
                    onPick(deal.id, s.id);
                  }}
                >
                  <span className="stage-pick__dot" style={{ background: s.color }} />
                  <span className="stage-pick__name">
                    {s.name}
                    {s.kind === 'payment' && <small> · не рекомендуется</small>}
                  </span>
                  {cur && <Check aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}

// ---------- единая логика перемещения между этапами ----------

/**
 * Возвращает request(dealId, stageId) и узел с окнами.
 * Оплата → «Вы уверены?», Слит → «Причина слива», Инцидент → разбор.
 */
export function useStageMove() {
  const moveDeal = useStore((s) => s.moveDeal);
  const slitDeal = useStore((s) => s.slitDeal);
  const [payment, setPayment] = useState<{ dealId: ID; stageId: ID } | null>(null);
  const [loss, setLoss] = useState<ID | null>(null);
  const [incident, setIncident] = useState<ID | null>(null);

  const request = useCallback(
    (dealId: ID, stageId: ID) => {
      const demo = useStore.getState().demo as DemoState;
      const deal = demo.deals.find((d) => d.id === dealId);
      const stage = demo.stages.find((s) => s.id === stageId);
      if (!deal || !stage || deal.stageId === stageId) return;
      if (stage.kind === 'payment') setPayment({ dealId, stageId });
      else if (stage.kind === 'lost') setLoss(dealId);
      else if (stage.kind === 'won') {
        moveDeal(dealId, stageId);
        setIncident(dealId);
      } else moveDeal(dealId, stageId);
    },
    [moveDeal],
  );

  const closePayment = useCallback(() => {
    setPayment(null);
    toast('Правильное решение. Клиент остаётся без реквизитов', 'success');
  }, []);
  const closeLoss = useCallback(() => setLoss(null), []);
  const closeIncident = useCallback(() => setIncident(null), []);

  const modals: ReactNode = (
    <>
      <PaymentConfirmModal
        open={!!payment}
        onCancel={closePayment}
        onConfirm={() => {
          if (payment) moveDeal(payment.dealId, payment.stageId);
          setPayment(null);
        }}
      />
      <LossReasonModal
        open={!!loss}
        onClose={closeLoss}
        onConfirm={(reason) => {
          if (loss) slitDeal(loss, reason);
          setLoss(null);
        }}
      />
      <IncidentModal dealId={incident} onClose={closeIncident} />
    </>
  );

  return { request, modals, openLoss: setLoss, openIncident: setIncident };
}

// ---------- переключатели в шапке ----------

export const ALL_PIPELINES = 'all';

export function PipelineSwitch({
  value,
  onChange,
  allowAll,
}: {
  value: ID;
  onChange: (id: ID) => void;
  allowAll?: boolean;
}) {
  const demo = useDemo();
  const cur = demo.pipelines.find((p) => p.id === value);
  const label = cur?.name ?? (allowAll ? 'Все воронки' : demo.pipelines[0]?.name ?? 'Воронка');
  const items = [
    ...(allowAll ? [{ label: 'Все воронки', onClick: () => onChange(ALL_PIPELINES) }] : []),
    ...demo.pipelines.map((p) => ({
      label: p.name,
      icon: p.id === value ? <Check /> : <span style={{ width: 16 }} />,
      onClick: () => onChange(p.id),
    })),
  ];
  return (
    <Menu
      items={items}
      trigger={(p) => (
        <button {...p} className="pipe-switch" aria-haspopup="menu" title="Сменить воронку">
          <span className="pipe-switch__name">{label}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      )}
    />
  );
}

export function ViewToggle({ view }: { view: 'kanban' | 'list' }) {
  return (
    <div className="view-toggle" role="group" aria-label="Вид">
      <Link to="/app/leads" className={view === 'kanban' ? 'is-on' : ''} aria-label="Воронка" title="Воронка" aria-current={view === 'kanban' ? 'page' : undefined}>
        <Columns3 aria-hidden="true" />
      </Link>
      <Link to="/app/leads/list" className={view === 'list' ? 'is-on' : ''} aria-label="Список" title="Список" aria-current={view === 'list' ? 'page' : undefined}>
        <List aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Совпадение по названию, контакту и компании */
export function dealMatches(demo: DemoState, d: { title: string; contactId?: ID; companyId?: ID }, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (d.title.toLowerCase().includes(s)) return true;
  const c = d.contactId ? demo.contacts.find((x) => x.id === d.contactId) : undefined;
  if (c?.name.toLowerCase().includes(s)) return true;
  const coId = d.companyId ?? c?.companyId;
  const co = coId ? demo.companies.find((x) => x.id === coId) : undefined;
  return !!co?.name.toLowerCase().includes(s);
}
