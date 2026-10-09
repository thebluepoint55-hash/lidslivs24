import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, SendHorizontal, Sparkles, X } from 'lucide-react';
import { isInstalled, managerName, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { APP } from '../../../data/appIds';
import { Button } from '../../ui';
import { CHANNELS, ChannelAvatar, TEMPLATES, contactName, dayTitle, useTwoTicks } from './chatUtil';
import { autoRepliesFor } from '../../appEffects';

const time = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function Conversation({
  threadId,
  onClose,
  mobile,
}: {
  threadId: string;
  onClose: () => void;
  /** на телефоне — кнопка «назад», а не крестик */
  mobile?: boolean;
}) {
  const demo = useDemo();
  const readChat = useStore((s) => s.readChat);
  const sendChat = useStore((s) => s.sendChat);
  const ignoreChat = useStore((s) => s.ignoreChat);
  const generateExcuse = useStore((s) => s.generateExcuse);
  const twoTicks = useTwoTicks();
  const excusesOn = isInstalled(demo, APP.excuses);
  const thread = demo.chats.find((c) => c.id === threadId);
  const [text, setText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  // открыли диалог — значит прочитали
  useEffect(() => {
    if (thread && thread.unread > 0) readChat(thread.id);
    setText('');
  }, [threadId]);

  const count = thread?.messages.length ?? 0;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [threadId, count, thread?.ignored]);

  // авторост поля ввода до 5 строк
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  if (!thread) {
    return (
      <section className="chats-conv chats-conv--empty">
        <p>Диалог не найден. Возможно, клиент сдался сам.</p>
      </section>
    );
  }

  const name = contactName(demo, thread);
  // «Режим отпуска» и «Отговаривающий бот» отвечают клиенту за вас
  const replies = autoRepliesFor(demo, thread);
  const deal = thread.dealId ? demo.deals.find((d) => d.id === thread.dealId) : undefined;
  const channel = CHANNELS[thread.channel] ?? CHANNELS.site;

  const fill = (v: string) => {
    setText(v);
    requestAnimationFrame(() => input.current?.focus());
  };

  const send = () => {
    if (!text.trim()) return;
    sendChat(thread.id, text);
    setText('');
    toast('Сообщение отправлено. Теперь клиент может ответить, будьте начеку');
  };

  return (
    <section className="chats-conv" aria-label={`Диалог: ${name}`}>
      <header className="chats-conv__head">
        {mobile && (
          <button type="button" className="chats-iconbtn" onClick={onClose} aria-label="Назад к диалогам">
            <ArrowLeft aria-hidden="true" />
          </button>
        )}
        <ChannelAvatar name={name} channel={thread.channel} size={36} />
        <div className="chats-conv__who">
          <span className="chats-conv__name">{name}</span>
          <span className="chats-conv__sub">
            {channel.label}
            {deal && (
              <>
                {' · '}
                <Link to={`/app/leads/${deal.id}`}>{deal.title}</Link>
              </>
            )}
          </span>
        </div>
        {!mobile && (
          <button type="button" className="chats-iconbtn" onClick={onClose} aria-label="Закрыть диалог">
            <X aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="chats-conv__scroll" ref={scroller}>
        {thread.messages.map((m, i) => {
          const prev = thread.messages[i - 1];
          const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
          const client = m.from === 'client';
          const robot = m.from === 'robot';
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="chats-day">
                  <span>{dayTitle(m.at)}</span>
                </div>
              )}
              {robot ? (
                <p className="chats-sys">{m.text}</p>
              ) : (
                <div className={`chats-msg ${client ? 'chats-msg--in' : 'chats-msg--out'}`}>
                  {!client && m.from !== 'you' && <span className="chats-msg__author">{managerName(demo, m.from)}</span>}
                  <p className="chats-msg__text">{m.text}</p>
                  <span className="chats-msg__meta tabular">
                    {time(m.at)}
                    {!client && <CheckCheck className="chats-msg__ticks" aria-label="Прочитано" />}
                  </span>
                </div>
              )}
              {replies.get(m.id)?.map((r, k) => (
                <div key={k} className="chats-msg chats-msg--out chats-msg--auto">
                  <span className="chats-msg__author">{r.author}</span>
                  <p className="chats-msg__text">{r.text}</p>
                  <span className="chats-msg__meta tabular">
                    {time(m.at)}
                    <CheckCheck className="chats-msg__ticks" aria-label="Прочитано" />
                  </span>
                </div>
              ))}
            </Fragment>
          );
        })}
        {thread.messages.length === 0 && <p className="chats-sys">Клиент пока ничего не написал. Не торопите его.</p>}
        {thread.ignored && (
          <p className="chats-sys chats-sys--ticks">
            <CheckCheck aria-hidden="true" />
            Вы прочитали и не ответили. Клиент видит две синие галочки
          </p>
        )}
        {twoTicks && !thread.ignored && (
          <p className="chats-sys">
            <Check aria-hidden="true" size={13} /> «Две галочки» прочитали диалог за вас
          </p>
        )}
      </div>

      <div className="chats-composer">
        <div className="chats-composer__hero">
          <Button
            variant="anti"
            size="sm"
            icon={<CheckCheck />}
            disabled={thread.ignored}
            onClick={() => ignoreChat(thread.id)}
          >
            {thread.ignored ? 'Прочитано, без ответа' : 'Прочитать и не ответить'}
          </Button>
        </div>
        <div className="chats-chips" role="group" aria-label="Шаблоны отмазок">
          {TEMPLATES.map((t) => (
            <button key={t} type="button" className="chats-chip" onClick={() => fill(t)}>
              {t}
            </button>
          ))}
          {excusesOn && (
            <button type="button" className="chats-chip chats-chip--gen" onClick={() => fill(generateExcuse())}>
              <Sparkles aria-hidden="true" />
              Сгенерировать отмазку
            </button>
          )}
        </div>
        <form
          className="chats-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="sr-only" htmlFor={`chat-input-${thread.id}`}>
            Сообщение
          </label>
          <textarea
            id={`chat-input-${thread.id}`}
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Написать сообщение… или не писать"
          />
          <button type="submit" className="chats-send" disabled={!text.trim()} aria-label="Отправить">
            <SendHorizontal aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
