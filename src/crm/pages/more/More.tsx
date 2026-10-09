import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ClipboardList,
  Gauge,
  Info,
  Mail,
  Puzzle,
  RotateCcw,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useDemo, useStore } from '../../../store/store';
import { useUI } from '../../../store/ui';
import { Avatar, Button, Modal, PageHeader, useIsMobile } from '../../ui';
import { YOU } from '../../../data/base';
import './more.css';

function Item({ to, icon, label, note, onClick }: { to?: string; icon: ReactNode; label: string; note?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="more-item__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="more-item__label">{label}</span>
      {note && <span className="more-item__note">{note}</span>}
      <ChevronRight size={16} className="more-item__chev" aria-hidden="true" />
    </>
  );
  return (
    <li>
      {to ? (
        <Link to={to} className="more-item">
          {inner}
        </Link>
      ) : (
        <button className="more-item" onClick={onClick}>
          {inner}
        </button>
      )}
    </li>
  );
}

export default function More() {
  const demo = useDemo();
  const resetDemo = useStore((s) => s.resetDemo);
  const setAssistantOpen = useUI((s) => s.setAssistantOpen);
  const isMobile = useIsMobile();
  const [confirm, setConfirm] = useState(false);

  const unreadMail = demo.emails.filter((e) => !e.read).length;
  const installed = demo.apps.filter((a) => a.installed).length;

  return (
    <div className="more">
      <PageHeader title="Ещё" />
      <div className="more-body">
        <Link to="/app/profile" className="more-me">
          <Avatar name="Вы Стажёр" color={YOU.color} size={48} />
          <span className="more-me__text">
            <strong>{YOU.fullName}</strong>
            <span>{YOU.role}</span>
          </span>
          <ChevronRight size={18} className="more-item__chev" aria-hidden="true" />
        </Link>

        <ul className="more-group">
          <Item to="/app/dashboard" icon={<Gauge size={20} />} label="Рабочий стол" />
          <Item to="/app/contacts" icon={<ClipboardList size={20} />} label="Списки" />
          <Item
            to="/app/mail"
            icon={<Mail size={20} />}
            label="Почта"
            note={unreadMail > 0 ? <span className="more-badge tabular">{unreadMail}</span> : undefined}
          />
          <Item
            to="/app/market"
            icon={<Puzzle size={20} />}
            label="СливМаркет"
            note={installed > 0 ? <span className="tabular">{installed} уст.</span> : undefined}
          />
          <Item to={isMobile ? '/app/settings/menu' : '/app/settings/general'} icon={<Wrench size={20} />} label="Настройки" />
          <Item to="/app/profile" icon={<UserRound size={20} />} label="Профиль и достижения" />
        </ul>

        <ul className="more-group">
          <Item icon={<Sparkles size={20} />} label="Ассистент «Отмаз»" onClick={() => setAssistantOpen(true)} />
          <Item to="/" icon={<Info size={20} />} label="О продукте" />
          <li>
            <button className="more-item more-item--danger" onClick={() => setConfirm(true)}>
              <span className="more-item__icon" aria-hidden="true">
                <RotateCcw size={20} />
              </span>
              <span className="more-item__label">Сбросить демо</span>
            </button>
          </li>
        </ul>

        <p className="more-note">
          <strong>Демо-доступ: бессрочно.</strong> Продлить нельзя, отменить тоже.
        </p>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Сбросить демо?"
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Оставить как есть</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirm(false);
                void resetDemo();
              }}
            >
              Сбросить
            </Button>
          </>
        }
      >
        <p className="more-confirm">
          Все ваши сливы, переносы и достижения пропадут. Лиды снова захотят купить, и разбираться с этим придётся заново.
        </p>
      </Modal>
    </div>
  );
}
