import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Puzzle, Siren, UserRound } from 'lucide-react';
import { displayBudget, managerName, stageOf, useDemo, useStore } from '../../../store/store';
import { toast } from '../../../store/ui';
import type { Company, Contact, DemoState } from '../../../store/types';
import { Avatar, Button, Empty, money, plural } from '../../ui';
import { CardShell, Field, HeadTabs, type MobileTab } from '../leads/EntityCard';
import { Composer, FeedView } from '../leads/Feed';
import { StagePill, batchWithToast } from '../leads/shared';
import '../leads/leads.css';

type Tab = 'main' | 'stats';
const TABS: { id: Tab; label: string }[] = [
  { id: 'main', label: 'Основное' },
  { id: 'stats', label: 'Статистика' },
];

export default function ContactCard() {
  const { kind = 'contact', id = '' } = useParams();
  const demo = useDemo();
  if (kind === 'company') {
    const co = demo.companies.find((c) => c.id === id);
    if (co) return <EntityView key={co.id} demo={demo} company={co} />;
  } else {
    const c = demo.contacts.find((x) => x.id === id);
    if (c) return <EntityView key={c.id} demo={demo} contact={c} />;
  }
  return (
    <div className="leads-page">
      <Empty icon={<UserRound size={28} />} title="К счастью, клиент не найден">
        Возможно, он ушёл к конкурентам. <Link to="/app/contacts">Вернуться к спискам</Link>
      </Empty>
    </div>
  );
}

function EntityView({ demo, contact, company }: { demo: DemoState; contact?: Contact; company?: Company }) {
  const postponeDeal = useStore((s) => s.postponeDeal);
  const [tab, setTab] = useState<Tab>('main');
  const [mTab, setMTab] = useState<MobileTab>('main');
  const [note, setNote] = useState('');

  const isCompany = !!company;
  const ownCompany = contact?.companyId ? demo.companies.find((c) => c.id === contact.companyId) : company;
  const members = useMemo(
    () => (company ? demo.contacts.filter((c) => c.companyId === company.id) : []),
    [demo.contacts, company],
  );
  const memberIds = useMemo(() => new Set(contact ? [contact.id] : members.map((m) => m.id)), [contact, members]);

  const deals = useMemo(
    () =>
      demo.deals
        .filter((d) =>
          company ? d.companyId === company.id || (d.contactId && memberIds.has(d.contactId)) : d.contactId === contact?.id,
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [demo.deals, company, contact, memberIds],
  );
  const dealIds = useMemo(() => new Set(deals.map((d) => d.id)), [deals]);
  const feed = useMemo(
    () => demo.feed.filter((f) => (f.dealId && dealIds.has(f.dealId)) || (f.contactId && memberIds.has(f.contactId))),
    [demo.feed, dealIds, memberIds],
  );
  const openDeals = deals.filter((d) => stageOf(demo, d)?.kind === 'open' || stageOf(demo, d)?.kind === 'payment');
  const target = openDeals[0] ?? deals[0];

  const name = contact?.name ?? company?.name ?? '';
  const selfCalls = contact ? contact.selfCalls : members.reduce((s, m) => s + m.selfCalls, 0);
  const dangerous = contact ? /купит|опасн|ждёт|платит/i.test(contact.status) : openDeals.some((d) => d.buyChance >= 80);
  const status = contact?.status ?? (dangerous ? 'Хочет купить (опасно)' : 'Спокойно, не покупает');
  const avgChance = openDeals.length ? Math.round(openDeals.reduce((s, d) => s + d.buyChance, 0) / openDeals.length) : 0;

  const menu = [
    { label: 'Экспорт', onClick: () => toast('Экспорт поставлен в очередь. Файл придёт после праздников') },
    { label: 'Удалить', onClick: () => toast('Удалить нельзя: клиент вернётся и снова захочет купить') },
    { separator: true, label: '' },
    { label: 'Позвонить', tone: 'tiny' as const, onClick: () => toast('Звонок запланирован на после обеда. Какого — уточним') },
  ];

  const main =
    tab === 'stats' ? (
      <dl className="ec-fields">
        <Field label="Сделок всего">
          <span className="tabular">{deals.length}</span>
        </Field>
        <Field label="Открытых (опасных)">
          <span className="tabular">{openDeals.length}</span>
        </Field>
        <Field label="Слито">
          <span className="tabular">{deals.filter((d) => stageOf(demo, d)?.kind === 'lost').length}</span>
        </Field>
        <Field label="Инцидентов">
          <span className="tabular">{deals.filter((d) => stageOf(demo, d)?.kind === 'won').length}</span>
        </Field>
        <Field label="Событий в ленте">
          <span className="tabular">{feed.length}</span>
        </Field>
        <Field label="Средний риск покупки">
          <span className="tabular">{avgChance}%</span>
        </Field>
      </dl>
    ) : (
      <>
        <dl className="ec-fields">
          {contact ? (
            <>
              <Field label="Телефон">
                <span className="tabular">{contact.phone}</span>
              </Field>
              <Field label="Email">{contact.email ?? <span className="muted">—</span>}</Field>
              <Field label="Должность">{contact.position ?? <span className="muted">—</span>}</Field>
              <Field label="Компания">
                {ownCompany ? <Link to={`/app/contacts/company/${ownCompany.id}`}>{ownCompany.name}</Link> : <span className="muted">—</span>}
              </Field>
            </>
          ) : (
            company && (
              <>
                <Field label="Телефон">
                  <span className="tabular">{company.phone ?? '—'}</span>
                </Field>
                <Field label="Сайт">{company.web ?? <span className="muted">—</span>}</Field>
                <Field label="Отрасль">{company.industry}</Field>
              </>
            )
          )}
          <Field label="Звонил сам (раз)">
            <span className="tabular">{selfCalls}</span>
          </Field>
          <Field label="Наш последний ответ">{contact?.lastReply ?? 'никогда'}</Field>
          <Field label="Статус">
            <span className={`ec-status${dangerous ? ' ec-status--danger' : ''}`}>
              {dangerous && <AlertTriangle aria-hidden="true" />}
              {status}
            </span>
          </Field>
          <Field label="Отв-ный">{managerName(demo, contact?.responsibleId ?? deals[0]?.responsibleId)}</Field>
        </dl>

        {isCompany && (
          <div className="ec-section">
            <h3 className="ec-section__title">
              Контакты · <span className="tabular">{members.length}</span>
            </h3>
            {members.length === 0 && <p className="muted">Контактов нет. Звонить некому.</p>}
            {members.map((m) => (
              <Link key={m.id} to={`/app/contacts/contact/${m.id}`} className="ec-person">
                <Avatar name={m.name} color="#8aa0b4" size={28} />
                <span>
                  <strong>{m.name}</strong>
                  <small>{m.position ?? 'Должность не указана'}</small>
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="ec-section">
          <h3 className="ec-section__title">
            Сделки · <span className="tabular">{deals.length}</span>
          </h3>
          {deals.length === 0 && <p className="muted">Сделок нет. Идеальный клиент.</p>}
          {deals.map((d) => (
            <Link key={d.id} to={`/app/leads/${d.id}`} className="ec-deal">
              <span className="ec-deal__title">{d.title}</span>
              <span className="ec-deal__meta">
                <StagePill stage={stageOf(demo, d)} />
                <span className="tabular">{money(displayBudget(demo, d))}</span>
              </span>
            </Link>
          ))}
        </div>
      </>
    );

  const hero =
    openDeals.length > 0 ? (
      <>
        <Button
          variant="anti"
          block
          onClick={() =>
            batchWithToast(
              () => openDeals.forEach((d) => postponeDeal(d.id)),
              `${openDeals.length} ${plural(openDeals.length, ['сделка перенесена', 'сделки перенесены', 'сделок перенесено'])} на после праздников`,
            )
          }
        >
          Перенести всё на после праздников
        </Button>
        <p className="ec-hero__hint">
          Открытых сделок: {openDeals.length}. Клиента предупреждать не будем
        </p>
      </>
    ) : undefined;

  const feedCol = (
    <>
      {dangerous && (
        <div className="ec-banner ec-banner--pay" role="status">
          <Siren aria-hidden="true" />
          <div>
            <strong>Клиент хочет купить</strong>
            <span>Статус «{status}». Не отвечайте резко, отвечайте медленно.</span>
          </div>
        </div>
      )}
      <div className="ec-feed__scroll">
        <FeedView items={feed} emptyText="Клиент пока молчит. Не провоцируйте" />
      </div>
      <Composer dealId={target?.id} text={note} setText={setNote} hint={target ? `в сделку «${target.title}»` : undefined} />
    </>
  );

  const widgets = (
    <>
      <h2 className="ec-widgets__title">Виджеты</h2>
      <div className={`widget${avgChance >= 80 ? ' widget--alarm' : ''}`}>
        <div className="widget__head">
          <Siren aria-hidden="true" />
          Риск покупки
        </div>
        <div className={`chance chance--${avgChance >= 70 ? 'bad' : avgChance >= 35 ? 'mid' : 'good'} chance--big`}>
          <span className="chance__bar">
            <span style={{ transform: `scaleX(${avgChance / 100})` }} />
          </span>
          <span className="tabular">{avgChance}%</span>
        </div>
        <p className="widget__note">Среднее по открытым сделкам. Чем меньше, тем спокойнее спит отдел.</p>
      </div>
      <Link to="/app/market" className="ec-widgets__add">
        <Puzzle aria-hidden="true" />
        Добавить виджеты
      </Link>
    </>
  );

  return (
    <CardShell
      back="/app/contacts"
      title={name}
      menu={menu}
      sub={
        <>
          <span className="ec-num">{isCompany ? 'Компания' : 'Контакт'}</span>
          {contact?.position && <span className="ec-tag">{contact.position}</span>}
          {company && <span className="ec-tag">{company.industry}</span>}
        </>
      }
      deskTabs={<HeadTabs tabs={TABS} value={tab} onChange={setTab} />}
      main={main}
      feed={feedCol}
      widgets={widgets}
      hero={hero}
      mobileTab={mTab}
      onMobileTab={setMTab}
    />
  );
}
