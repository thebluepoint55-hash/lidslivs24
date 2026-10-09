import { useEffect, useRef, useState } from 'react';
import { useUI } from '../../../store/ui';
import { useIsMobile } from '../../ui';
import { ChatList } from './ChatList';
import { Conversation } from './Conversation';
import { useTwoTicksAutoRead } from './chatUtil';
import './chats.css';

/**
 * Выезжающая слева панель диалогов (десктоп). AppShell рендерит её всегда;
 * на телефоне чаты живут на отдельной вкладке /app/chats.
 */
export default function ChatsPanel() {
  useTwoTicksAutoRead();
  const open = useUI((s) => s.chatsOpen);
  const setChatsOpen = useUI((s) => s.setChatsOpen);
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => search.current?.focus({ preventScroll: true }), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.modal-backdrop, .menu')) return;
      setChatsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setChatsOpen]);

  // закрытая панель возвращается к списку
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setActiveId(null), 260);
    return () => window.clearTimeout(t);
  }, [open]);

  if (isMobile) return null;

  return (
    <div className={`chats-layer${open ? ' is-open' : ''}`}>
      <div className="chats-backdrop" onClick={() => setChatsOpen(false)} aria-hidden="true" />
      <aside className={`chats-panel${activeId ? ' has-thread' : ''}`} aria-label="Чаты" aria-hidden={!open}>
        <ChatList activeId={activeId} onOpen={setActiveId} searchRef={search} />
        {activeId && <Conversation key={activeId} threadId={activeId} onClose={() => setActiveId(null)} />}
      </aside>
    </div>
  );
}
