import { useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { useDemo } from '../../../store/store';
import { Empty, PageHeader, plural, useIsMobile } from '../../ui';
import { ChatList } from './ChatList';
import { Conversation } from './Conversation';
import { useTwoTicks } from './chatUtil';
import './chats.css';

/** Вкладка «Чаты»: на телефоне — список и переписка на весь экран, на десктопе — две колонки */
export default function ChatsPage() {
  const demo = useDemo();
  const isMobile = useIsMobile();
  const twoTicks = useTwoTicks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const unread = twoTicks ? 0 : demo.chats.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="chats-page">
      <PageHeader
        title="Чаты"
        meta={unread > 0 ? `${unread} ${plural(unread, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}` : `${demo.chats.length} ${plural(demo.chats.length, ['диалог', 'диалога', 'диалогов'])}`}
      />
      <div className="chats-page__body">
        <ChatList activeId={isMobile ? null : activeId} onOpen={setActiveId} />
        {!isMobile &&
          (activeId ? (
            <Conversation key={activeId} threadId={activeId} onClose={() => setActiveId(null)} />
          ) : (
            <div className="chats-page__placeholder">
              <Empty icon={<MessagesSquare size={40} aria-hidden="true" />} title="Выберите диалог">
                <p>Или не выбирайте. Клиенты подождут.</p>
              </Empty>
            </div>
          ))}
      </div>
      {isMobile && activeId && (
        <div className="chats-mscreen">
          <Conversation key={activeId} threadId={activeId} onClose={() => setActiveId(null)} mobile />
        </div>
      )}
    </div>
  );
}
