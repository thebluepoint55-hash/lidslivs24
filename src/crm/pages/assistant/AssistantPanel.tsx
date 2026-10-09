import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Copy, RotateCcw, SendHorizontal, Sparkles, X } from 'lucide-react';
import { useStore } from '../../../store/store';
import { toast, useUI } from '../../../store/ui';
import { GREETING, SUGGESTIONS, TONE_LABEL, answer, withFlair, type Tone } from './answers';
import './assistant.css';

interface Msg {
  id: number;
  from: 'bot' | 'you';
  text: string;
  copyable?: boolean;
}

let msgId = 1;

export default function AssistantPanel() {
  const open = useUI((s) => s.assistantOpen);
  const setOpen = useUI((s) => s.setAssistantOpen);
  const tone: Tone = useStore((s) => s.demo?.settings.otmazTone ?? 'polite');
  const creativity = useStore((s) => s.demo?.settings.otmazCreativity ?? 50);
  const generateExcuse = useStore((s) => s.generateExcuse);

  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: msgId++, from: 'bot', text: GREETING[tone] }]);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const panel = useRef<HTMLElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number>();

  // недоступность закрытой панели для клавиатуры и скринридеров
  useLayoutEffect(() => {
    if (panel.current) panel.current.inert = !open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus({ preventScroll: true }), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.modal-backdrop')) return; // сначала закрывается модальное окно
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  // вернуть фокус на кнопку «Отмаз» после закрытия
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const fab = document.querySelector<HTMLButtonElement>('.otmaz-fab');
      if (fab && (document.activeElement === document.body || panel.current?.contains(document.activeElement))) fab.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || typing) return;
    setMsgs((m) => [...m, { id: msgId++, from: 'you', text: question }]);
    setText('');
    setTyping(true);
    const delay = 650 + Math.round(Math.random() * 350);
    timer.current = window.setTimeout(() => {
      const res = answer(question, {
        tone,
        excuse: () => withFlair(generateExcuse(), creativity, msgId),
      });
      setMsgs((m) => [...m, { id: msgId++, from: 'bot', text: res.text, copyable: res.copyable }]);
      setTyping(false);
    }, delay);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setTyping(false);
    setMsgs([{ id: msgId++, from: 'bot', text: GREETING[tone] }]);
  };

  const copy = (t: string) => {
    const done = () => toast('Скопировано. Отправлять не обязательно');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(done, () => toast('Не скопировалось. Значит, не судьба'));
    else toast('Буфер обмена недоступен. Значит, не судьба');
  };

  const onlyGreeting = msgs.length === 1;

  return (
    <aside
      ref={panel}
      className={`otmaz${open ? ' is-open' : ''}`}
      role="dialog"
      aria-label="Ассистент Отмаз"
      aria-hidden={!open}
    >
      <header className="otmaz__head">
        <span className="otmaz__avatar" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div className="otmaz__who">
          <strong>Отмаз AI</strong>
          <span>
            Тон:{' '}
            <Link to="/app/settings/otmaz" onClick={() => setOpen(false)} className="otmaz__tone">
              {TONE_LABEL[tone]}
            </Link>
          </span>
        </div>
        <button className="otmaz__icon" onClick={reset} aria-label="Начать заново" title="Начать заново">
          <RotateCcw size={17} />
        </button>
        <button className="otmaz__icon" onClick={() => setOpen(false)} aria-label="Закрыть ассистента">
          <X size={20} />
        </button>
      </header>

      <div className="otmaz__log" ref={log} aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`otmaz-msg otmaz-msg--${m.from}`}>
            <div className="otmaz-msg__bubble">{m.text}</div>
            {m.copyable && (
              <button className="otmaz-msg__copy" onClick={() => copy(m.text)}>
                <Copy size={13} aria-hidden="true" />
                Скопировать
              </button>
            )}
          </div>
        ))}
        {onlyGreeting && (
          <div className="otmaz__starters" aria-label="Готовые вопросы">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button key={s} className="otmaz-chip otmaz-chip--big" onClick={() => ask(s)} disabled={typing}>
                {s}
              </button>
            ))}
          </div>
        )}
        {typing && (
          <div className="otmaz-msg otmaz-msg--bot">
            <div className="otmaz-msg__bubble otmaz-typing" aria-label="Отмаз печатает">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {!onlyGreeting && (
        <div className="otmaz__chips" aria-label="Подсказки">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="otmaz-chip" onClick={() => ask(s)} disabled={typing}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="otmaz__form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="otmaz-input">
          Вопрос ассистенту
        </label>
        <textarea
          id="otmaz-input"
          ref={input}
          rows={1}
          value={text}
          placeholder="Спросите, как не продать…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(text);
            }
          }}
        />
        <button type="submit" className="otmaz__send" disabled={!text.trim() || typing} aria-label="Отправить">
          <SendHorizontal size={18} />
        </button>
      </form>
    </aside>
  );
}
