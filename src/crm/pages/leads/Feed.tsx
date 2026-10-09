import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  CircleCheck,
  FileText,
  Mail,
  MessageCircle,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { isInstalled, managerName, useDemo, useStore } from '../../../store/store';
import type { FeedItem, ID, TaskType } from '../../../store/types';
import { APP } from '../../../data/appIds';
import { Button, Empty, Menu, fmtDateTime } from '../../ui';
import { TASK_TYPES } from './shared';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const LINE_KINDS = new Set(['system', 'robot', 'stage', 'created', 'task']);

const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const callStatus: Record<string, string> = {
  missed: 'Пропущен',
  dropped: 'Сброшен вежливо',
  answered: 'Принят (случайно)',
};

type Row = { type: 'month'; key: string; label: string } | { type: 'item'; item: FeedItem } | { type: 'run'; key: string; items: FeedItem[] };

/** Лента событий как у amo: плашка-месяц, серые строки, белые блоки */
export function FeedView({ items, emptyText = 'Событий нет. Клиент пока не успел ничего попросить' }: { items: FeedItem[]; emptyText?: string }) {
  const demo = useDemo();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => [...items].sort((a, b) => +new Date(a.at) - +new Date(b.at)), [items]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    let month = '';
    let run: FeedItem[] = [];
    const flush = () => {
      if (run.length >= 4) out.push({ type: 'run', key: run[0].id, items: run });
      else run.forEach((item) => out.push({ type: 'item', item }));
      run = [];
    };
    for (const it of sorted) {
      const d = new Date(it.at);
      const m = `${d.getFullYear()}-${d.getMonth()}`;
      if (m !== month) {
        flush();
        month = m;
        out.push({ type: 'month', key: m, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
      }
      if (LINE_KINDS.has(it.kind)) run.push(it);
      else {
        flush();
        out.push({ type: 'item', item: it });
      }
    }
    flush();
    return out;
  }, [sorted]);

  // свежие записи внизу, как в amo: при открытии и при новой записи прокручиваем ленту к низу
  const count = items.length;
  const firstRun = useRef(true);
  useEffect(() => {
    const end = endRef.current;
    if (!end) return;
    const scroller = end.closest('.ec-feed__scroll');
    const ownScroll = scroller && scroller.scrollHeight > scroller.clientHeight + 1;
    if (ownScroll) scroller.scrollTop = scroller.scrollHeight;
    else if (!firstRun.current) end.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    firstRun.current = false;
  }, [count]);

  if (sorted.length === 0) {
    return (
      <div className="feed">
        <Empty icon={<StickyNote size={28} />} title="Лента пуста">
          {emptyText}
        </Empty>
      </div>
    );
  }

  const author = (it: FeedItem) => managerName(demo, it.authorId);

  return (
    <div className="feed">
      {rows.map((r) => {
        if (r.type === 'month')
          return (
            <div key={`m-${r.key}`} className="feed__month">
              <span>{r.label}</span>
            </div>
          );
        if (r.type === 'item') return <FeedEntry key={r.item.id} it={r.item} author={author(r.item)} />;
        const open = expanded.has(r.key);
        const shown = open ? r.items : r.items.slice(0, 2);
        return (
          <div key={`r-${r.key}`} className="feed__run">
            {shown.map((it) => (
              <FeedEntry key={it.id} it={it} author={author(it)} />
            ))}
            <button
              className="feed__expand"
              onClick={() =>
                setExpanded((s) => {
                  const n = new Set(s);
                  if (open) n.delete(r.key);
                  else n.add(r.key);
                  return n;
                })
              }
            >
              {open ? 'Свернуть' : `Ещё ${r.items.length - 2} событий · Развернуть`}
            </button>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function FeedEntry({ it, author }: { it: FeedItem; author: string }) {
  if (LINE_KINDS.has(it.kind)) {
    const Icon = it.kind === 'robot' ? Bot : it.kind === 'task' ? CircleCheck : null;
    return (
      <div className={`feed-line feed-line--${it.kind}`}>
        <span className="feed-line__time tabular">{fmtDateTime(it.at)}</span>
        <span className="feed-line__author">{author}</span>
        {Icon && <Icon aria-hidden="true" className="feed-line__icon" />}
        <span className="feed-line__text">{it.text}</span>
      </div>
    );
  }

  let icon: ReactNode = <StickyNote aria-hidden="true" />;
  let label = 'Примечание';
  let extra: ReactNode = null;
  const meta = it.meta ?? {};

  if (it.kind === 'call') {
    const dir = meta.direction === 'out' ? 'out' : 'in';
    const status = String(meta.status ?? 'missed');
    icon = status === 'missed' ? <PhoneMissed aria-hidden="true" /> : dir === 'out' ? <PhoneOutgoing aria-hidden="true" /> : <PhoneIncoming aria-hidden="true" />;
    label = dir === 'out' ? 'Исходящий звонок' : 'Входящий звонок';
    extra = (
      <>
        <span className={`feed-chip feed-chip--${status}`}>{callStatus[status] ?? status}</span>
        {Number(meta.duration) > 0 && <span className="tabular">{fmtDur(Number(meta.duration))}</span>}
      </>
    );
  } else if (it.kind === 'email') {
    icon = <Mail aria-hidden="true" />;
    label = it.authorId === 'client' ? 'Входящее письмо' : 'Письмо';
  } else if (it.kind === 'chat') {
    icon = <MessageCircle aria-hidden="true" />;
    label = it.authorId === 'client' ? 'Сообщение клиента' : 'Сообщение в чат';
  } else if (it.kind === 'incident') {
    icon = <AlertTriangle aria-hidden="true" />;
    label = 'Инцидент';
  } else if (it.kind === 'invoice') {
    icon = <FileText aria-hidden="true" />;
    label = 'Счёт';
  }

  return (
    <article className={`feed-note feed-note--${it.kind}${it.authorId === 'client' ? ' feed-note--client' : ''}`}>
      <span className="feed-note__icon">{icon}</span>
      <div className="feed-note__body">
        <div className="feed-note__head">
          <span className="tabular">{fmtDateTime(it.at)}</span>
          <strong>{author}</strong>
          <span>{label}</span>
          {extra}
        </div>
        <p className="feed-note__text">{it.text}</p>
      </div>
    </article>
  );
}

// ---------- поле ввода внизу ленты ----------

type Mode = 'note' | 'task' | 'chat';
const MODE_LABEL: Record<Mode, string> = { note: 'Примечание', task: 'Задача', chat: 'Чат' };

const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function Composer({
  dealId,
  text,
  setText,
  hint,
}: {
  dealId?: ID;
  text: string;
  setText: (v: string) => void;
  /** подпись, куда уйдёт запись (для карточки контакта) */
  hint?: string;
}) {
  const demo = useDemo();
  const addNote = useStore((s) => s.addNote);
  const addTask = useStore((s) => s.addTask);
  const generateExcuse = useStore((s) => s.generateExcuse);
  const [mode, setMode] = useState<Mode>('note');
  const [taskType, setTaskType] = useState<TaskType>('call');
  const [due, setDue] = useState(tomorrowStr);
  const [focused, setFocused] = useState(false);
  const excusesOn = isInstalled(demo, APP.excuses);

  if (!dealId) {
    return (
      <div className="composer composer--off">
        Сделок нет, записать примечание некуда. Это хорошо.
      </div>
    );
  }

  const placeholder =
    mode === 'note'
      ? 'Примечание для всех: введите текст…'
      : mode === 'chat'
        ? 'Чат с клиентом: введите текст (ответ можно не ждать)…'
        : 'Текст задачи: например, «Подумать о клиенте»';

  const submit = () => {
    if (mode === 'task') {
      const typeLabel = TASK_TYPES.find((t) => t.id === taskType)?.label ?? '';
      addTask({ dealId, type: taskType, text: text.trim() || typeLabel, due: new Date(`${due}T10:00`).toISOString() });
      setText('');
      return;
    }
    if (!text.trim()) return;
    addNote(dealId, text, mode);
    setText('');
  };

  const active = focused || text.length > 0 || mode === 'task';

  return (
    <div className={`composer${active ? ' is-active' : ''}`}>
      <div className="composer__top">
        <Menu
          items={(Object.keys(MODE_LABEL) as Mode[]).map((m) => ({ label: MODE_LABEL[m], onClick: () => setMode(m) }))}
          trigger={(p) => (
            <button {...p} className="composer__mode">
              {MODE_LABEL[mode]}
              <ChevronDown aria-hidden="true" />
            </button>
          )}
        />
        {mode === 'task' && (
          <>
            <select className="select composer__select" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)} aria-label="Тип задачи">
              {TASK_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input className="input composer__date" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Срок" />
          </>
        )}
        {hint && <span className="composer__hint">{hint}</span>}
      </div>
      <textarea
        className="composer__input"
        rows={active ? 3 : 1}
        value={text}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
        }}
        aria-label={MODE_LABEL[mode]}
      />
      {active && (
        <div className="composer__actions">
          <Button variant="primary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={submit} disabled={mode !== 'task' && !text.trim()}>
            {mode === 'task' ? 'Поставить' : 'Отправить'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText('');
              setMode('note');
              (document.activeElement as HTMLElement | null)?.blur();
            }}
          >
            Отмена
          </Button>
          <span style={{ flex: 1 }} />
          {excusesOn && (
            <Button
              size="sm"
              icon={<Sparkles />}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setText(generateExcuse())}
            >
              Сгенерировать отмазку
            </Button>
          )}
          <span className="composer__kbd">Ctrl + Enter</span>
        </div>
      )}
      {!active && excusesOn && (
        <button className="composer__quick" onClick={() => setText(generateExcuse())}>
          <Sparkles aria-hidden="true" />
          Сгенерировать отмазку
        </button>
      )}
    </div>
  );
}

