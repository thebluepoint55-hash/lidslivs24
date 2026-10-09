import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronDown, ChevronRight, PhoneOff, Plus, UserRound } from 'lucide-react';
import type { Company, Contact, DemoState } from '../../../store/types';
import { managerName, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import { Avatar, Button, Empty, Menu, Modal, PageHeader, plural, useIsMobile } from '../../ui';
import './lists.css';

type Mode = 'all' | 'contacts' | 'companies';

const MODE_TITLE: Record<Mode, string> = {
  all: 'Все контакты и компании',
  contacts: 'Контакты',
  companies: 'Компании',
};

interface Row {
  kind: 'contact' | 'company';
  id: string;
  name: string;
  company?: Company;
  phone?: string;
  email?: string;
  selfCalls: number;
  lastReply: string;
  responsible: string;
  color: string;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

function buildRows(demo: DemoState, mode: Mode): Row[] {
  const colorOf = (id: Contact['responsibleId']) => (id === 'you' ? '#ff5b36' : demo.managers.find((m) => m.id === id)?.color ?? '#8aa0b4');
  const contacts: Row[] = demo.contacts.map((c) => ({
    kind: 'contact',
    id: c.id,
    name: c.name,
    company: c.companyId ? demo.companies.find((x) => x.id === c.companyId) : undefined,
    phone: c.phone,
    email: c.email,
    selfCalls: c.selfCalls,
    lastReply: c.lastReply,
    responsible: managerName(demo, c.responsibleId),
    color: colorOf(c.responsibleId),
  }));
  const companies: Row[] = demo.companies.map((co) => {
    const people = demo.contacts.filter((c) => c.companyId === co.id);
    return {
      kind: 'company',
      id: co.id,
      name: co.name,
      phone: co.phone,
      email: co.web,
      selfCalls: people.reduce((n, c) => n + c.selfCalls, 0),
      lastReply: people.some((c) => c.lastReply !== 'никогда') ? 'по ситуации' : 'никогда',
      responsible: people[0] ? managerName(demo, people[0].responsibleId) : '—',
      color: '#8aa0b4',
    };
  });
  if (mode === 'contacts') return contacts;
  if (mode === 'companies') return companies;
  return [...contacts, ...companies];
}

/** «никогда» и пустые ответы подсвечиваем как достижение */
const isNever = (s: string) => /никогда|ещё нет|не узнали/i.test(s);

export default function Contacts() {
  const demo = useDemo();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = buildRows(demo, mode);
    if (!q) return all;
    const digits = q.replace(/\D/g, '');
    return all.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.company?.name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        (digits.length > 2 && r.phone?.replace(/\D/g, '').includes(digits)),
    );
  }, [demo, mode, query]);

  useEffect(() => setSelected(new Set()), [mode]);

  const key = (r: Row) => `${r.kind}:${r.id}`;
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(key(r)));
  const toggle = (k: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const call = (r: Row) => toast(`Звонок ${r.name} отменён: вдруг возьмут трубку`, 'success');

  const titleMenu = (
    <Menu
      items={(Object.keys(MODE_TITLE) as Mode[]).map((m) => ({
        label: MODE_TITLE[m],
        icon: m === mode ? <Check /> : <span style={{ width: 16 }} />,
        onClick: () => setMode(m),
      }))}
      trigger={(p) => (
        <button type="button" className="lists-title" {...p}>
          {MODE_TITLE[mode]}
          <ChevronDown aria-hidden="true" />
        </button>
      )}
    />
  );

  const addLabel = mode === 'companies' ? 'Добавить компанию' : 'Добавить контакт';

  return (
    <div className="lists-page">
      <PageHeader
        title={titleMenu}
        search={query}
        onSearch={setQuery}
        meta={`${rows.length} ${plural(rows.length, ['элемент', 'элемента', 'элементов'])}`}
        actions={
          <Button variant="primary" icon={<Plus />} keepMobile onClick={() => setAdding(true)} aria-label={addLabel}>
            {isMobile ? null : addLabel}
          </Button>
        }
      />

      {isMobile && (
        <label className="lists-msearch">
          <span className="sr-only">Поиск</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени, телефону, почте" />
        </label>
      )}

      {selected.size > 0 && !isMobile && (
        <div className="lists-bulk" role="region" aria-label="Действия с выбранными">
          <span className="tabular">
            Выбрано: {selected.size}
          </span>
          <Button
            size="sm"
            icon={<PhoneOff />}
            onClick={() => {
              toast(`${selected.size} ${plural(selected.size, ['контакт внесён', 'контакта внесены', 'контактов внесены'])} в список «Не перезванивать»`, 'success');
              setSelected(new Set());
            }}
          >
            Не перезванивать
          </Button>
          <button type="button" className="linkbtn linkbtn--muted" onClick={() => setSelected(new Set())}>
            Снять выделение
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty icon={<UserRound size={40} aria-hidden="true" />} title="К счастью, клиентов не найдено">
          {query && <p>Попробуйте не искать.</p>}
        </Empty>
      ) : isMobile ? (
        <ul className="lists-mlist">
          {rows.map((r) => (
            <li key={key(r)}>
              <Link className="lists-mrow" to={`/app/contacts/${r.kind}/${r.id}`}>
                {r.kind === 'company' ? (
                  <span className="lists-coavatar" aria-hidden="true">
                    <Building2 />
                  </span>
                ) : (
                  <Avatar name={r.name} color={r.color} size={40} />
                )}
                <span className="lists-mrow__main">
                  <span className="lists-mrow__name">{r.name}</span>
                  <span className="lists-mrow__sub">
                    {[r.company?.name, r.phone].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="lists-mrow__side tabular">
                  {r.selfCalls > 0 && (
                    <span className="lists-calls">
                      звонил {r.selfCalls} {plural(r.selfCalls, ['раз', 'раза', 'раз'])}
                    </span>
                  )}
                  <ChevronRight aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="table-wrap">
          <table className="table lists-table">
            <thead>
              <tr>
                <th className="lists-check">
                  <input
                    type="checkbox"
                    aria-label="Выбрать все"
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map(key)))}
                  />
                </th>
                <th>Наименование</th>
                <th>Компания</th>
                <th>Телефон</th>
                <th>Email</th>
                <th className="num">Звонил сам (раз)</th>
                <th>Наш последний ответ</th>
                <th>Ответственный</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const k = key(r);
                return (
                  <tr key={k} className={selected.has(k) ? 'is-selected' : undefined}>
                    <td className="lists-check">
                      <input type="checkbox" aria-label={`Выбрать ${r.name}`} checked={selected.has(k)} onChange={() => toggle(k)} />
                    </td>
                    <td className="lists-name">
                      <Link to={`/app/contacts/${r.kind}/${r.id}`}>{r.name}</Link>
                    </td>
                    <td className="lists-company">
                      {r.company ? (
                        <Link to={`/app/contacts/company/${r.company.id}`}>{r.company.name}</Link>
                      ) : r.kind === 'company' ? (
                        <span className="lists-muted">Компания</span>
                      ) : (
                        <span className="lists-muted">—</span>
                      )}
                    </td>
                    <td>
                      {r.phone ? (
                        <button type="button" className="lists-phone tabular" onClick={() => call(r)} title="Позвонить">
                          {r.phone}
                        </button>
                      ) : (
                        <span className="lists-muted">—</span>
                      )}
                    </td>
                    <td className="lists-email">{r.email ?? <span className="lists-muted">—</span>}</td>
                    <td className="num">{r.selfCalls}</td>
                    <td className={isNever(r.lastReply) ? 'lists-never' : undefined}>{r.lastReply}</td>
                    <td>{r.responsible}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddModal open={adding} kind={mode === 'companies' ? 'company' : 'contact'} onClose={() => setAdding(false)} />
    </div>
  );
}

// ---------- добавление ----------

function AddModal({ open, kind, onClose }: { open: boolean; kind: 'contact' | 'company'; onClose: () => void }) {
  const demo = useDemo();
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setCompanyId('');
    setPhone('');
    setEmail('');
    setIndustry('');
    setError('');
  }, [open]);

  const submit = () => {
    if (!name.trim()) {
      setError(kind === 'company' ? 'Укажите название. Без него компанию не получится игнорировать' : 'Укажите имя. Без него контакт не получится игнорировать');
      return;
    }
    const cur = useStore.getState().demo;
    if (!cur) return;
    const next = structuredClone(cur);
    const now = new Date().toISOString();
    if (kind === 'company') {
      next.companies.unshift({ id: uid('co'), name: name.trim(), industry: industry.trim() || 'Не уточняли', phone: phone.trim() || undefined });
    } else {
      next.contacts.unshift({
        id: uid('c'),
        name: name.trim(),
        companyId: companyId || undefined,
        phone: phone.trim() || '+7 (900) 000-00-00',
        email: email.trim() || undefined,
        selfCalls: 0,
        lastReply: 'никогда',
        status: 'Хочет купить (опасно)',
        responsibleId: 'you',
      });
    }
    next.events.unshift({
      id: uid('ev'),
      at: now,
      authorId: 'you',
      object: 'Контакт',
      objectName: name.trim(),
      event: kind === 'company' ? 'Компания добавлена' : 'Контакт добавлен',
    });
    useStore.setState({ demo: next });
    toast(kind === 'company' ? 'Компания добавлена. Звонить туда необязательно' : 'Контакт добавлен. Перезванивать ему необязательно', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === 'company' ? 'Новая компания' : 'Новый контакт'}
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>
            Добавить
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
          <span className="field__label">{kind === 'company' ? 'Название' : 'Имя и фамилия'}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={kind === 'company' ? 'ООО «Готовы платить»' : 'Иван Хочукупить'}
            aria-invalid={!!error}
            autoFocus
          />
          {error && <span className="field__error">{error}</span>}
        </label>
        {kind === 'contact' ? (
          <label className="field">
            <span className="field__label">Компания</span>
            <select className="select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Без компании</option>
              {demo.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span className="field__label">Сфера</span>
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Оптовая торговля" />
          </label>
        )}
        <label className="field">
          <span className="field__label">Телефон</span>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (900) 000-00-00" />
        </label>
        {kind === 'contact' && (
          <label className="field">
            <span className="field__label">Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.ru" />
          </label>
        )}
        <p className="lists-hint">Статус по умолчанию: «Хочет купить (опасно)». Ответственный: вы.</p>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
