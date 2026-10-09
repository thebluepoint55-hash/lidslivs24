import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Check, ChevronDown, Inbox, PenLine, Reply, Send, Settings2, Sparkles, X } from 'lucide-react';
import type { DemoState, Email } from '../../../store/types';
import { isInstalled, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { APP } from '../../../data/appIds';
import { Avatar, Button, Empty, Menu, Modal, PageHeader, fmtDate, fmtDateTime, fmtTime, plural, useIsMobile } from '../../ui';
import './mail.css';

type Box = 'all' | 'unread' | 'waiting' | 'replied';

const BOXES: Record<Box, string> = {
  all: 'Все входящие',
  unread: 'Непрочитанные',
  waiting: 'Ждут ответа',
  replied: 'С ответом',
};

const MONDAY = 'Ответ запланирован на понедельник';

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? fmtTime(iso) : fmtDate(iso);
};

function ctx(demo: DemoState, e: Email) {
  const contact = demo.contacts.find((c) => c.id === e.contactId);
  const deal = e.dealId ? demo.deals.find((d) => d.id === e.dealId) : undefined;
  return { contact, deal, name: contact?.name ?? 'Неизвестный отправитель' };
}

export default function Mail() {
  const demo = useDemo();
  const readEmail = useStore((s) => s.readEmail);
  const isMobile = useIsMobile();
  const [box, setBox] = useState<Box>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const emails = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...demo.emails]
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .filter((e) => {
        if (box === 'unread') return !e.read;
        if (box === 'waiting') return !e.reply;
        if (box === 'replied') return !!e.reply;
        return true;
      })
      .filter((e) => {
        if (!q) return true;
        const { name, deal } = ctx(demo, e);
        return [e.subject, e.body, name, deal?.title].some((s) => s?.toLowerCase().includes(q));
      });
  }, [demo, box, query]);

  const unread = demo.emails.filter((e) => !e.read).length;
  const current = openId ? demo.emails.find((e) => e.id === openId) ?? null : null;

  const open = (e: Email) => {
    setOpenId(e.id);
    if (!e.read) readEmail(e.id);
  };

  const titleMenu = (
    <Menu
      items={(Object.keys(BOXES) as Box[]).map((b) => ({
        label: BOXES[b],
        icon: b === box ? <Check /> : <span style={{ width: 16 }} />,
        onClick: () => setBox(b),
      }))}
      trigger={(p) => (
        <button type="button" className="mail-title" {...p}>
          {BOXES[box]}
          <ChevronDown aria-hidden="true" />
        </button>
      )}
    />
  );

  const list =
    emails.length === 0 ? (
      <Empty icon={<Inbox size={40} aria-hidden="true" />} title="К счастью, писем не найдено">
        <p>Клиенты пока не пишут. Хороший знак.</p>
      </Empty>
    ) : isMobile ? (
      <ul className="mail-mlist">
        {emails.map((e) => {
          const { name } = ctx(demo, e);
          return (
            <li key={e.id}>
              <button type="button" className={`mail-mrow${e.read ? '' : ' is-unread'}`} onClick={() => open(e)}>
                <Avatar name={name} size={40} />
                <span className="mail-mrow__main">
                  <span className="mail-mrow__top">
                    <span className="mail-mrow__name">{name}</span>
                    <span className="mail-mrow__date tabular">{shortDate(e.at)}</span>
                  </span>
                  <span className="mail-mrow__subject">{e.subject}</span>
                  <span className="mail-mrow__snippet">{e.reply ? `Вы: ${e.reply}` : e.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="table-wrap mail-tablewrap">
        <table className="table mail-table">
          <thead>
            <tr>
              <th className="mail-col-from">От кого · Сделка</th>
              <th>Тема и сообщение</th>
              <th className="mail-col-date">Дата</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => {
              const { name, deal } = ctx(demo, e);
              const cls = [e.read ? '' : 'is-unread', e.id === openId ? 'is-open' : ''].filter(Boolean).join(' ');
              return (
                <tr key={e.id} className={cls || undefined} onClick={() => open(e)}>
                  <td className="mail-col-from">
                    <span className="mail-from">{name}</span>
                    {deal && (
                      <Link className="mail-deal" to={`/app/leads/${deal.id}`} onClick={(ev) => ev.stopPropagation()}>
                        {deal.title}
                      </Link>
                    )}
                  </td>
                  <td className="mail-col-msg">
                    <button
                      type="button"
                      className="mail-open"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        open(e);
                      }}
                    >
                      <span className="mail-subject">{e.subject}</span>
                      <span className="mail-snippet"> {e.body}</span>
                    </button>
                    {e.reply && (
                      <span className={`mail-status${e.reply === MONDAY ? ' mail-status--monday' : ''}`}>
                        {e.reply === MONDAY ? 'В понедельник' : 'Отвечено'}
                      </span>
                    )}
                  </td>
                  <td className="mail-col-date tabular">{shortDate(e.at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="mail-page">
      <PageHeader
        title={titleMenu}
        search={query}
        onSearch={setQuery}
        meta={unread > 0 ? `${unread} ${plural(unread, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}` : `${emails.length} ${plural(emails.length, ['письмо', 'письма', 'писем'])}`}
        actions={
          <>
            <Button icon={<Settings2 />} onClick={() => toast('Почта настроена: входящие проверяем по понедельникам')}>
              Настройки
            </Button>
            <Button variant="primary" icon={<PenLine />} keepMobile onClick={() => setComposing(true)} aria-label="Написать">
              {isMobile ? null : 'Написать'}
            </Button>
          </>
        }
      />

      {isMobile && (
        <label className="mail-msearch">
          <span className="sr-only">Поиск</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по письмам" />
        </label>
      )}

      {isMobile ? (
        <>
          {list}
          {current && (
            <div className="mail-mreader">
              <MailReader email={current} onClose={() => setOpenId(null)} mobile />
            </div>
          )}
        </>
      ) : (
        <div className={`mail-split${current ? ' has-reader' : ''}`}>
          <div className="mail-split__list">{list}</div>
          {current && <MailReader key={current.id} email={current} onClose={() => setOpenId(null)} />}
        </div>
      )}

      <ComposeModal open={composing} onClose={() => setComposing(false)} />
    </div>
  );
}

// ---------- просмотр письма ----------

function MailReader({ email, onClose, mobile }: { email: Email; onClose: () => void; mobile?: boolean }) {
  const demo = useDemo();
  const replyEmail = useStore((s) => s.replyEmail);
  const generateExcuse = useStore((s) => s.generateExcuse);
  const excusesOn = isInstalled(demo, APP.excuses);
  const { contact, deal, name } = ctx(demo, email);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setReplying(false);
    setText('');
  }, [email.id]);

  useEffect(() => {
    if (replying) area.current?.focus();
  }, [replying]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const monday = email.reply === MONDAY;

  return (
    <article className="mail-reader" aria-label={`Письмо: ${email.subject}`}>
      <header className="mail-reader__bar">
        <button type="button" className="mail-reader__close" onClick={onClose} aria-label={mobile ? 'Назад к письмам' : 'Закрыть письмо'}>
          {mobile ? <ArrowLeft /> : <X />}
        </button>
        <h2 className="mail-reader__subject">{email.subject}</h2>
      </header>

      <div className="mail-reader__scroll">
        <div className="mail-reader__meta">
          <Avatar name={name} size={40} />
          <div className="mail-reader__who">
            <span className="mail-reader__name">{name}</span>
            <span className="mail-reader__addr">{contact?.email ?? 'адрес скрыт'} → вам</span>
          </div>
          <time className="mail-reader__date tabular" dateTime={email.at}>
            {fmtDateTime(email.at)}
          </time>
        </div>
        {deal && (
          <p className="mail-reader__deal">
            Сделка: <Link to={`/app/leads/${deal.id}`}>{deal.title}</Link>
          </p>
        )}
        <div className="mail-reader__body">{email.body}</div>

        {email.reply && (
          <div className={`mail-reader__reply${monday ? ' is-monday' : ''}`}>
            <span className="mail-reader__reply-label">{monday ? 'Запланировано' : 'Ваш ответ'}</span>
            <p>{email.reply}</p>
          </div>
        )}

        {replying && (
          <div className="mail-compose">
            <label className="sr-only" htmlFor={`reply-${email.id}`}>
              Текст ответа
            </label>
            <textarea
              id={`reply-${email.id}`}
              ref={area}
              className="textarea"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Здравствуйте, ${contact?.name.split(' ')[0] ?? 'коллеги'}! Вернёмся к вашему вопросу…`}
            />
            <div className="mail-compose__row">
              {excusesOn && (
                <Button size="sm" icon={<Sparkles />} onClick={() => setText(generateExcuse())}>
                  Сгенерировать отмазку
                </Button>
              )}
              <span className="mail-compose__spacer" />
              <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                Отмена
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Send />}
                disabled={!text.trim()}
                onClick={() => {
                  replyEmail(email.id, text.trim());
                  setReplying(false);
                  setText('');
                }}
              >
                Отправить
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="mail-reader__actions">
        <Button variant="anti" icon={<CalendarClock />} disabled={monday} onClick={() => replyEmail(email.id, MONDAY)}>
          {monday ? 'Ответим в понедельник' : 'Ответить в понедельник'}
        </Button>
        {!replying && (
          <Button icon={<Reply />} onClick={() => setReplying(true)}>
            Ответить
          </Button>
        )}
      </footer>
    </article>
  );
}

// ---------- новое письмо ----------

function ComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const demo = useDemo();
  const generateExcuse = useStore((s) => s.generateExcuse);
  const excusesOn = isInstalled(demo, APP.excuses);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!open) return;
    setTo('');
    setSubject('');
    setBody('');
  }, [open]);

  const withEmail = demo.contacts.filter((c) => c.email);

  const send = () => {
    toast('Письмо сохранено в черновики. Навсегда', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое письмо"
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon={<Send />} onClick={send}>
            Отправить
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="field">
          <span className="field__label">Кому</span>
          <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Выберите контакт</option>
            {withEmail.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.email}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Тема</span>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Re: Fwd: КП (финал) (2)" />
        </label>
        <label className="field">
          <span className="field__label">Сообщение</span>
          <textarea className="textarea" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Добрый день! Вернёмся к вашему вопросу после согласования." />
        </label>
        {excusesOn && (
          <Button size="sm" icon={<Sparkles />} onClick={() => setBody(generateExcuse())}>
            Сгенерировать отмазку
          </Button>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
