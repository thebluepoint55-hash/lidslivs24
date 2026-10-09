import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, PartyPopper } from 'lucide-react';
import type { Task, TaskType } from '../../../store/types';
import { managerName, useDemo, useStore } from '../../../store/store';
import { Button, Modal, fmtDateTime, plural } from '../../ui';
import {
  RESULTS,
  TYPE_LONG,
  TYPE_ORDER,
  TYPE_SHORT,
  addDays,
  dayLabel,
  daysToHoliday,
  isOverdue,
  taskCtx,
  timeLabel,
} from './taskUtil';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ---------- новая задача ----------

export function AddTaskModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate?: Date }) {
  const demo = useDemo();
  const addTask = useStore((s) => s.addTask);
  const [type, setType] = useState<TaskType>('call');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [dealId, setDealId] = useState('');

  useEffect(() => {
    if (!open) return;
    setType('call');
    setText('');
    setDate(toDateInput(defaultDate ?? addDays(new Date(), 1)));
    setTime(defaultDate && defaultDate.getHours() ? `${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}` : '10:00');
    setDealId('');
  }, [open, defaultDate]);

  const openDeals = useMemo(() => {
    const live = new Set(demo.stages.filter((s) => s.kind === 'open' || s.kind === 'payment').map((s) => s.id));
    return demo.deals.filter((d) => live.has(d.stageId));
  }, [demo.deals, demo.stages]);

  const submit = () => {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const due = y ? new Date(y, m - 1, d, hh || 10, mm || 0) : addDays(new Date(), 1);
    addTask({ type, text, due: due.toISOString(), dealId: dealId || undefined });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новая задача"
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>
            Поставить
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
          <span className="field__label">Тип задачи</span>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {TYPE_LONG[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Что сделать</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Подумать о клиенте" autoFocus />
        </label>
        <div className="tasks-form-row">
          <label className="field">
            <span className="field__label">Срок</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Время</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <p className="tasks-hint">По умолчанию ставим на завтра. Сегодня вы всё равно не успеете.</p>
        <label className="field">
          <span className="field__label">Сделка (необязательно)</span>
          <select className="select" value={dealId} onChange={(e) => setDealId(e.target.value)}>
            <option value="">Без сделки</option>
            {openDeals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} · #{d.num}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// ---------- закрытие задачи ----------

export function CompleteTaskModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const completeTask = useStore((s) => s.completeTask);
  const [choice, setChoice] = useState(RESULTS[0]);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (task) {
      setChoice(RESULTS[0]);
      setCustom('');
    }
  }, [task]);

  const result = choice === '__custom' ? custom.trim() || 'Без результата' : choice;

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title="Результат задачи"
      footer={
        <>
          <Button onClick={onClose}>Не выполнять</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (task) completeTask(task.id, result);
              onClose();
            }}
          >
            Да, выполнить
          </Button>
        </>
      }
    >
      {task && (
        <>
          <p className="tasks-complete__task">
            <b>{TYPE_SHORT[task.type]}:</b> {task.text}
          </p>
          <fieldset className="tasks-results">
            <legend className="field__label">Выберите результат</legend>
            {RESULTS.map((r) => (
              <label key={r} className="tasks-result">
                <input type="radio" name="task-result" checked={choice === r} onChange={() => setChoice(r)} />
                <span>{r}</span>
              </label>
            ))}
            <label className="tasks-result">
              <input type="radio" name="task-result" checked={choice === '__custom'} onChange={() => setChoice('__custom')} />
              <span>Своя отмазка</span>
            </label>
            {choice === '__custom' && (
              <input
                className="input tasks-result__custom"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Например: клиент сам не перезвонил"
                autoFocus
              />
            )}
          </fieldset>
          <div className="tasks-warn" role="alert">
            <AlertTriangle aria-hidden="true" />
            <span>Точно? Это может привести к продаже</span>
          </div>
        </>
      )}
    </Modal>
  );
}

// ---------- шторка задачи (телефон, календарь, список) ----------

export function TaskSheet({
  task,
  onClose,
  onComplete,
}: {
  task: Task | null;
  onClose: () => void;
  onComplete: (t: Task) => void;
}) {
  const demo = useDemo();
  const postponeTask = useStore((s) => s.postponeTask);
  if (!task) return null;
  const { deal, contact, company } = taskCtx(demo, task);
  const overdue = isOverdue(task);
  const holiday = daysToHoliday(task);

  return (
    <Modal open onClose={onClose} title={`${TYPE_SHORT[task.type]}: ${task.text}`}>
      <dl className="tasks-sheet__list">
        <dt>Срок</dt>
        <dd className={overdue ? 'tasks-red' : undefined}>
          {dayLabel(task.due)} {timeLabel(task.due)}
          {overdue && ' · просрочена'}
        </dd>
        <dt>Ответственный</dt>
        <dd>{managerName(demo, task.responsibleId)}</dd>
        {deal && (
          <>
            <dt>Сделка</dt>
            <dd>
              <Link to={`/app/leads/${deal.id}`} onClick={onClose}>
                {deal.title}
              </Link>
            </dd>
          </>
        )}
        {(contact || company) && (
          <>
            <dt>Контакт</dt>
            <dd>
              {contact?.name}
              {company && <span className="tasks-muted">{contact ? ', ' : ''}{company.name}</span>}
            </dd>
          </>
        )}
        <dt>Переносов</dt>
        <dd>
          {task.postpones} {plural(task.postpones, ['раз', 'раза', 'раз'])}
        </dd>
        <dt>Создана</dt>
        <dd>{fmtDateTime(task.createdAt)}</dd>
        {task.done && (
          <>
            <dt>Результат</dt>
            <dd>{task.result}</dd>
          </>
        )}
      </dl>
      {!task.done && (
        <div className="tasks-sheet__actions">
          <Button
            variant="anti"
            block
            icon={<CalendarClock />}
            onClick={() => {
              postponeTask(task.id);
              onClose();
            }}
          >
            Перенести на завтра
          </Button>
          <Button
            block
            icon={<PartyPopper />}
            onClick={() => {
              postponeTask(task.id, holiday.days);
              onClose();
            }}
          >
            После праздника «{holiday.name}»
          </Button>
          <button
            type="button"
            className="linkbtn linkbtn--muted tasks-sheet__done"
            onClick={() => {
              onClose();
              onComplete(task);
            }}
          >
            <CheckCircle2 aria-hidden="true" size={15} />
            Выполнить
          </button>
        </div>
      )}
    </Modal>
  );
}
