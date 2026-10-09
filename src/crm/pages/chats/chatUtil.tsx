import { useEffect } from 'react';
import { Globe, MessageCircle, Phone, Send, Tag, type LucideIcon } from 'lucide-react';
import type { Channel, ChatThread, DemoState } from '../../../store/types';
import { isInstalled, useDemo, useStore } from '../../../store/store';
import { APP } from '../../../data/appIds';
import { Avatar } from '../../ui';

export const CHANNELS: Record<Channel, { label: string; color: string; icon: LucideIcon }> = {
  whatsapp: { label: 'WhatsApp', color: '#25b865', icon: Phone },
  telegram: { label: 'Telegram', color: '#2aa3e0', icon: Send },
  avito: { label: 'Avito', color: '#8f5be8', icon: Tag },
  site: { label: 'Сайт', color: '#7b8a96', icon: Globe },
  max: { label: 'MAX', color: '#4b5cf0', icon: MessageCircle },
};

export const TEMPLATES = ['Перезвоню после обеда', 'Уточню у руководства', 'Сейчас не сезон'];

const PALETTE = ['#6fa8dc', '#9b6dd7', '#2bb38a', '#e4a72f', '#4c8bf7', '#d97a5b', '#5aa9a0', '#8aa0b4'];
export function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function ChannelAvatar({ name, channel, size = 40 }: { name: string; channel: Channel; size?: number }) {
  const ch = CHANNELS[channel] ?? CHANNELS.site;
  const Icon = ch.icon;
  return (
    <span className="chats-ava" style={{ width: size, height: size }}>
      <Avatar name={name} color={colorFor(name)} size={size} />
      <span className="chats-ava__badge" style={{ background: ch.color }} title={ch.label}>
        <Icon aria-hidden="true" />
      </span>
    </span>
  );
}

export const contactName = (demo: DemoState, t: ChatThread) =>
  demo.contacts.find((c) => c.id === t.contactId)?.name ?? 'Клиент без имени';

export const lastAt = (t: ChatThread) => (t.messages.length ? +new Date(t.messages[t.messages.length - 1].at) : 0);

/** Непроигнорированные сверху, «прочитано и не отвечено» уходят вниз */
export const sortThreads = (list: ChatThread[]) =>
  [...list].sort((a, b) => Number(a.ignored) - Number(b.ignored) || lastAt(b) - lastAt(a));

export function listDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function dayTitle(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Сегодня';
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function useTwoTicks() {
  return useStore((s) => (s.demo ? isInstalled(s.demo, APP.twoTicks) : false));
}

/** «Две галочки»: читает все входящие сразу, отвечать не собирается */
export function useTwoTicksAutoRead() {
  const demo = useDemo();
  const readChat = useStore((s) => s.readChat);
  const on = useTwoTicks();
  const unreadIds = demo.chats
    .filter((c) => c.unread > 0)
    .map((c) => c.id)
    .join(',');
  useEffect(() => {
    if (!on || !unreadIds) return;
    unreadIds.split(',').forEach((id) => readChat(id));
  }, [on, unreadIds, readChat]);
}
