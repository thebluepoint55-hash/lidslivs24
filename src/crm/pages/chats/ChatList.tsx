import { useMemo, useState, type Ref } from 'react';
import { Check, CheckCheck, Ellipsis, MessagesSquare, Search, Settings2 } from 'lucide-react';
import { useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Empty, Menu } from '../../ui';
import { ChannelAvatar, contactName, listDate, sortThreads, useTwoTicks } from './chatUtil';

export function ChatList({
  activeId,
  onOpen,
  searchRef,
}: {
  activeId: string | null;
  onOpen: (id: string) => void;
  searchRef?: Ref<HTMLInputElement>;
}) {
  const demo = useDemo();
  const readChat = useStore((s) => s.readChat);
  const twoTicks = useTwoTicks();
  const [query, setQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const threads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortThreads(demo.chats).filter((t) => {
      if (onlyUnread && t.unread === 0) return false;
      if (!q) return true;
      return contactName(demo, t).toLowerCase().includes(q) || t.messages.some((m) => m.text.toLowerCase().includes(q));
    });
  }, [demo, query, onlyUnread]);

  const readAll = () => {
    const ids = demo.chats.filter((c) => c.unread > 0).map((c) => c.id);
    ids.forEach((id) => readChat(id));
    toast(ids.length ? 'Все диалоги прочитаны. Отвечать не будем' : 'Непрочитанных нет. Клиенты затихли', 'success');
  };

  return (
    <div className="chats-list">
      <div className="chats-list__head">
        <label className="chats-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Найти диалог</span>
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти" />
        </label>
        <Menu
          align="right"
          items={[
            { label: 'Прочитать все', icon: <CheckCheck />, onClick: readAll },
            {
              label: 'Только непрочитанные',
              icon: onlyUnread ? <Check /> : <span style={{ width: 16 }} />,
              onClick: () => setOnlyUnread((v) => !v),
            },
            { separator: true, label: '' },
            { label: 'Настроить каналы', icon: <Settings2 />, onClick: () => toast('Каналы подключены. Отвечать в них по-прежнему необязательно') },
          ]}
          trigger={(p) => (
            <button type="button" className="chats-iconbtn" aria-label="Ещё" {...p}>
              <Ellipsis aria-hidden="true" />
            </button>
          )}
        />
      </div>

      {twoTicks && (
        <p className="chats-note">
          <CheckCheck aria-hidden="true" />
          Две галочки: сообщения читаются автоматически
        </p>
      )}

      {threads.length === 0 ? (
        <Empty icon={<MessagesSquare size={36} aria-hidden="true" />} title="К счастью, диалогов не найдено">
          {onlyUnread && <p>Все прочитаны. Отвечать по-прежнему не нужно.</p>}
        </Empty>
      ) : (
        <ul className="chats-rows" role="list">
          {threads.map((t) => {
            const name = contactName(demo, t);
            const last = t.messages[t.messages.length - 1];
            const unread = twoTicks ? 0 : t.unread;
            const ours = last && last.from !== 'client';
            const cls = ['chats-row', t.id === activeId && 'is-active', unread > 0 && 'is-unread', t.ignored && 'is-ignored']
              .filter(Boolean)
              .join(' ');
            return (
              <li key={t.id}>
                <button type="button" className={cls} onClick={() => onOpen(t.id)} aria-current={t.id === activeId ? 'true' : undefined}>
                  <ChannelAvatar name={name} channel={t.channel} />
                  <span className="chats-row__main">
                    <span className="chats-row__top">
                      <span className="chats-row__name">{name}</span>
                      {last && <span className="chats-row__date tabular">{listDate(last.at)}</span>}
                    </span>
                    <span className="chats-row__bottom">
                      <span className="chats-row__preview">
                        {t.ignored && <CheckCheck className="chats-row__ticks" aria-label="Прочитано, без ответа" />}
                        {ours && <span className="chats-row__you">Вы: </span>}
                        {last?.text ?? 'Нет сообщений'}
                      </span>
                      {unread > 0 && <span className="chats-row__count tabular">{unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
