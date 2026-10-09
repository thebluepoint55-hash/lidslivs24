import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Cigarette,
  FileText,
  Handshake,
  ListChecks,
  Lock,
  Paperclip,
  Puzzle,
  Siren,
  Snowflake,
  Sparkles,
  TreePalm,
  Upload,
  UserPlus,
  UserX,
} from 'lucide-react';
import { hashOf, minutesToSmoke } from '../../appEffects';
import {
  displayBudget,
  displayTemperature,
  isInstalled,
  managerName,
  nextHoliday,
  pipelineStages,
  stageOf,
  useDemo,
  useStore,
} from '../../../store/store';
import { toast } from '../../../store/ui';
import type { Deal, DemoState, ID } from '../../../store/types';
import { APP } from '../../../data/appIds';
import { antiActions, type AntiActionId } from '../../../data/excuses';
import { Avatar, Button, Empty, Menu, Modal, daysSince, fmtDate, money, plural } from '../../ui';
import { CardShell, Field, HeadTabs, InlineEdit, type MobileTab } from './EntityCard';
import { Composer, FeedView } from './Feed';
import { MoveStageSheet, isHotTag, tempDegrees, tempLabel, useStageMove } from './shared';
import './leads.css';

type DeskTab = 'main' | 'stats' | 'files' | 'docs';
const DESK_TABS: { id: DeskTab; label: string }[] = [
  { id: 'main', label: 'Основное' },
  { id: 'stats', label: 'Статистика' },
  { id: 'files', label: 'Файлы' },
  { id: 'docs', label: 'Документы' },
];

const daysWord = (n: number) => plural(n, ['день', 'дня', 'дней']);

export default function LeadCard() {
  const { id = '' } = useParams();
  const demo = useDemo();
  const deal = demo.deals.find((d) => d.id === id);

  if (!deal) {
    return (
      <div className="leads-page">
        <Empty icon={<Snowflake size={28} />} title="Сделка ушла думать">
          Такой сделки нет. Возможно, её уже слили. <Link to="/app/leads">Вернуться к воронке</Link>
        </Empty>
      </div>
    );
  }
  return <DealView key={deal.id} deal={deal} demo={demo} />;
}

function DealView({ deal, demo }: { deal: Deal; demo: DemoState }) {
  const updateDeal = useStore((s) => s.updateDeal);
  const postponeDeal = useStore((s) => s.postponeDeal);
  const antiAction = useStore((s) => s.antiAction);
  const generateExcuse = useStore((s) => s.generateExcuse);
  const [tab, setTab] = useState<DeskTab>('main');
  const [mTab, setMTab] = useState<MobileTab>('main');
  const [note, setNote] = useState('');
  const [invoiceStep, setInvoiceStep] = useState(0);
  const [antiSheet, setAntiSheet] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState<string | null>(null);
  const { request, modals, openLoss, openIncident } = useStageMove();

  const stage = stageOf(demo, deal);
  const stages = pipelineStages(demo, deal.pipelineId);
  const stageIdx = stages.findIndex((s) => s.id === deal.stageId);
  const contact = deal.contactId ? demo.contacts.find((c) => c.id === deal.contactId) : undefined;
  const companyId = deal.companyId ?? contact?.companyId;
  const company = companyId ? demo.companies.find((c) => c.id === companyId) : undefined;
  const feed = useMemo(() => demo.feed.filter((f) => f.dealId === deal.id), [demo.feed, deal.id]);
  const temp = displayTemperature(demo, deal);
  const budget = displayBudget(demo, deal);
  const daysInStage = daysSince(deal.stageSince);
  const holiday = nextHoliday();
  const reported = feed.some((f) => f.kind === 'incident');

  const runAnti = (a: AntiActionId) => {
    if (a === 'out') openLoss(deal.id);
    else antiAction(deal.id, a);
  };

  const menu = [
    { label: 'Экспорт', onClick: () => toast('Экспорт поставлен в очередь. Файл придёт после праздников') },
    { label: 'Удалить', onClick: () => toast('Удалять сделки нельзя: по ним считается конверсия в отказ') },
    { separator: true, label: '' },
    { label: 'Выставить счёт', tone: 'tiny' as const, onClick: () => setInvoiceStep(1) },
  ];

  // ---------- шапка ----------

  const sub = (
    <>
      <span className="ec-num tabular">#{deal.num}</span>
      {tagDraft === null ? (
        <button className="ec-tagbtn" onClick={() => setTagDraft('')}>
          #Тегировать
        </button>
      ) : (
        <input
          className="ec-taginput"
          autoFocus
          value={tagDraft}
          placeholder="Новый тег"
          aria-label="Новый тег"
          onChange={(e) => setTagDraft(e.target.value)}
          onBlur={() => setTagDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setTagDraft(null);
            if (e.key === 'Enter') {
              const t = tagDraft.trim();
              if (t && !deal.tags.includes(t)) updateDeal(deal.id, { tags: [...deal.tags, t] }, `Добавлен тег «${t}»`);
              setTagDraft(null);
            }
          }}
        />
      )}
      {deal.tags.map((t) => (
        <span key={t} className={`ec-tag${isHotTag(t) ? ' ec-tag--hot' : ''}`}>
          {t}
        </span>
      ))}
    </>
  );

  const stageBlock = (
    <div className="ec-stage">
      <Menu
        items={stages.map((s) => ({
          label: (
            <span className="ec-stage__opt">
              <span className="ec-stage__dot" style={{ background: s.color }} />
              {s.name}
              {s.kind === 'payment' && <small> · не рекомендуется</small>}
            </span>
          ),
          icon: s.id === deal.stageId ? <Check /> : <span style={{ width: 16 }} />,
          onClick: () => request(deal.id, s.id),
        }))}
        trigger={(p) => (
          <button {...p} className="ec-stage__btn">
            <span className="ec-stage__name">{stage?.name ?? 'Этап'}</span>
            <span className="ec-stage__days tabular">
              ({daysInStage} {daysWord(daysInStage)})
            </span>
            <ChevronDown aria-hidden="true" />
          </button>
        )}
      />
      <div className="ec-progress" aria-hidden="true">
        {stages.map((s, i) => (
          <span key={s.id} style={{ background: i <= stageIdx ? s.color : undefined }} className={i <= stageIdx ? 'is-on' : ''} />
        ))}
      </div>
    </div>
  );

  // ---------- левая колонка ----------

  const managers: { id: ID | 'you'; name: string }[] = [{ id: 'you', name: 'Вы (стажёр)' }, ...demo.managers.map((m) => ({ id: m.id, name: m.name }))];

  const chanceTone = deal.buyChance >= 70 ? 'bad' : deal.buyChance >= 35 ? 'mid' : 'good';

  const mainFields = (
    <>
      <dl className="ec-fields">
        <Field label="Безотв-ный">
          <Menu
            items={managers.map((m) => ({
              label: m.name,
              icon: m.id === deal.responsibleId ? <Check /> : <span style={{ width: 16 }} />,
              onClick: () => {
                if (m.id === deal.responsibleId) return;
                updateDeal(deal.id, { responsibleId: m.id }, `Для поля «Безответственный» установлено значение «${m.name}»`);
                toast(`Безответственный: ${m.name}. Пусть теперь он не перезванивает`);
              },
            }))}
            trigger={(p) => (
              <button {...p} className="inline-edit">
                {managerName(demo, deal.responsibleId)}
                <ChevronDown aria-hidden="true" className="inline-edit__chev" />
              </button>
            )}
          />
        </Field>
        <Field label="Бюджет">
          <InlineEdit
            numeric
            label="Бюджет"
            value={String(deal.budget)}
            display={
              <span className="tabular">
                {money(budget)}
                {budget !== deal.budget && <small className="ec-x3"> ×3, Прайс ×3</small>}
              </span>
            }
            onSave={(v) => {
              const n = Number(v) || 0;
              updateDeal(deal.id, { budget: n }, `Для поля «Бюджет» установлено значение «${money(n)}»`);
              toast('Бюджет изменён. Клиенту об этом лучше не знать');
            }}
          />
        </Field>
        <Field label="Вероятность покупки">
          <span className={`chance chance--${chanceTone}`}>
            <span className="chance__bar">
              <span style={{ transform: `scaleX(${deal.buyChance / 100})` }} />
            </span>
            <span className="tabular">{deal.buyChance}%</span>
            <small>{chanceTone === 'bad' ? 'опасно' : chanceTone === 'mid' ? 'терпимо' : 'отлично'}</small>
          </span>
        </Field>
        <Field label="Причина будущего отказа">
          <InlineEdit
            label="Причина будущего отказа"
            value={deal.futureLossReason}
            onSave={(v) => updateDeal(deal.id, { futureLossReason: v }, `Для поля «Причина будущего отказа» установлено значение «${v}»`)}
          />
        </Field>
        <Field label="Источник">{deal.source || '—'}</Field>
        <Field label="Перенесено">
          <span className="tabular">
            {deal.postpones} {plural(deal.postpones, ['раз', 'раза', 'раз'])}
          </span>
        </Field>
        {deal.lossReason && <Field label="Причина слива">{deal.lossReason}</Field>}
      </dl>

      <div className="ec-section">
        {contact ? (
          <div className="ec-contact">
            <Avatar name={contact.name} color="#8aa0b4" size={40} />
            <div className="ec-contact__body">
              <Link to={`/app/contacts/contact/${contact.id}`} className="ec-contact__name">
                {contact.name}
              </Link>
              {contact.position && <div className="ec-contact__pos">{contact.position}</div>}
              <dl className="ec-fields ec-fields--tight">
                <Field label="Компания">
                  {company ? <Link to={`/app/contacts/company/${company.id}`}>{company.name}</Link> : <span className="muted">—</span>}
                </Field>
                <Field label="Мобильный">
                  <span className="tabular">{contact.phone}</span>
                </Field>
                <Field label="Звонил сам">
                  <span className="tabular">
                    {contact.selfCalls} {plural(contact.selfCalls, ['раз', 'раза', 'раз'])}
                  </span>
                </Field>
              </dl>
            </div>
          </div>
        ) : company ? (
          <div className="ec-contact">
            <Avatar name={company.name} color="#9aa6b2" size={40} />
            <div className="ec-contact__body">
              <Link to={`/app/contacts/company/${company.id}`} className="ec-contact__name">
                {company.name}
              </Link>
              <div className="ec-contact__pos">{company.industry}</div>
            </div>
          </div>
        ) : (
          <p className="muted ec-nocontact">Контакта нет. Перезванивать некому, и это удобно.</p>
        )}
        <button className="ec-add" onClick={() => toast('Новый контакт повышает риск продажи. Добавление отложено до после праздников')}>
          <UserPlus aria-hidden="true" />
          Добавить контакт
        </button>
        <button className="ec-add" onClick={() => toast('Компании платят по безналу. Слишком рискованно')}>
          <Building2 aria-hidden="true" />
          Добавить компанию
        </button>
      </div>
    </>
  );

  const createdDays = daysSince(deal.createdAt);
  const clientTouches = feed.filter((f) => f.authorId === 'client' || (f.kind === 'call' && f.meta?.direction === 'in')).length;
  const missed = feed.filter((f) => f.kind === 'call' && f.meta?.status === 'missed').length;

  const deskContent =
    tab === 'main' ? (
      mainFields
    ) : tab === 'stats' ? (
      <dl className="ec-fields">
        <Field label="В воронке">
          <span className="tabular">
            {createdDays} {daysWord(createdDays)}
          </span>
        </Field>
        <Field label="В текущем этапе">
          <span className="tabular">
            {daysInStage} {daysWord(daysInStage)}
          </span>
        </Field>
        <Field label="Обращений клиента">
          <span className="tabular">{clientTouches}</span>
        </Field>
        <Field label="Пропущено звонков">
          <span className="tabular">{missed}</span>
        </Field>
        <Field label="Переносов">
          <span className="tabular">{deal.postpones}</span>
        </Field>
        <Field label="Среднее время ответа">3 дня (цель отдела: 5)</Field>
        <Field label="Прогноз выручки">0 ₽, точность 99%</Field>
        <Field label="Создана">{fmtDate(deal.createdAt)}</Field>
      </dl>
    ) : tab === 'files' ? (
      <div className="ec-section">
        <ul className="ec-files">
          <li>
            <Paperclip aria-hidden="true" />
            <span>
              <strong>Реквизиты_для_оплаты.pdf</strong>
              <small>Прислал клиент. Открыт 0 раз</small>
            </span>
          </li>
          <li>
            <Paperclip aria-hidden="true" />
            <span>
              <strong>КП_финал_финал(2).docx</strong>
              <small>Отправлено в пятницу, 18:55</small>
            </span>
          </li>
        </ul>
        <Button size="sm" icon={<Upload />} onClick={() => toast('Загрузка отключена: файл может оказаться договором')}>
          Загрузить файл
        </Button>
      </div>
    ) : (
      <div className="ec-section">
        <div className="ec-doc">
          <FileText aria-hidden="true" />
          <div>
            <strong>Договор</strong>
            <p className="muted">Не сформирован. Шаблон договора на согласовании с 2019 года.</p>
          </div>
        </div>
        <Button size="sm" icon={<Lock />} disabled title="Требуется согласование трёх руководителей">
          Сформировать договор
        </Button>
      </div>
    );

  // ---------- кнопка-герой ----------

  const isLost = stage?.kind === 'lost';
  const hero = isLost ? (
    <div className="ec-done">
      <Check aria-hidden="true" />
      <div>
        <strong>Слита {deal.closedAt ? fmtDate(deal.closedAt) : ''}</strong>
        <span>{deal.lossReason ?? 'Причина не указана, но мы ей гордимся'}</span>
      </div>
    </div>
  ) : (
    <>
      <div className="split">
        <Button variant="anti" className="split__main" onClick={() => postponeDeal(deal.id)}>
          Перенести на после праздников
        </Button>
        <Menu
          align="right"
          items={antiActions.map((a) => ({ label: a.label, tone: 'anti' as const, onClick: () => runAnti(a.id) }))}
          trigger={(p) => (
            <button
              {...p}
              className="btn btn--anti split__arrow desk-only"
              aria-label="Другие анти-действия"
            >
              <ChevronDown />
            </button>
          )}
        />
        <button className="btn btn--anti split__arrow mobile-only" aria-label="Другие анти-действия" onClick={() => setAntiSheet(true)}>
          <ChevronDown />
        </button>
      </div>
      <p className="ec-hero__hint">
        Ближайший повод: {holiday.name}. Перезвоним {fmtDate(holiday.date.toISOString())}
      </p>
    </>
  );

  // ---------- лента ----------

  const banner =
    stage?.kind === 'won' ? (
      <div className="ec-banner ec-banner--won" role="alert">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Инцидент: клиент купил</strong>
          <span>{reported ? 'Разбор отправлен. Руководитель перезвонит (нет).' : 'Сделка закрыта оплатой. Нужен разбор, чтобы это не повторилось.'}</span>
        </div>
        <Button variant="danger" size="sm" onClick={() => openIncident(deal.id)}>
          {reported ? 'Дополнить разбор' : 'Заполнить разбор'}
        </Button>
      </div>
    ) : stage?.kind === 'payment' ? (
      <div className="ec-banner ec-banner--pay" role="status">
        <Siren aria-hidden="true" />
        <div>
          <strong>Сделка в этапе «Оплата»</strong>
          <span>Клиент может перевести деньги в любой момент. Срочно остудите.</span>
        </div>
        <Button size="sm" onClick={() => setMoveOpen(true)}>
          Вернуть назад
        </Button>
      </div>
    ) : null;

  const feedCol = (
    <>
      {banner}
      <div className="ec-feed__scroll">
        <FeedView items={feed} />
      </div>
      <Composer dealId={deal.id} text={note} setText={setNote} />
    </>
  );

  // ---------- виджеты ----------

  const fridge = isInstalled(demo, APP.fridge);
  const excuses = isInstalled(demo, APP.excuses);
  const invoiceApp = isInstalled(demo, APP.invoice);
  const detector = demo.apps.find((a) => a.installed && a.id === APP.solvency);
  const notOurs = isInstalled(demo, APP.notOurClient);
  const smoke = isInstalled(demo, APP.smokeSync);
  const quest = isInstalled(demo, APP.questForm);
  const vacation = isInstalled(demo, APP.vacation);
  const toCompetitor = deal.tags.includes('передан конкуренту');
  const h = hashOf(deal.id);
  const any = fridge || excuses || invoiceApp || !!detector || notOurs || smoke || quest || vacation || toCompetitor;

  const widgets = (
    <>
      <h2 className="ec-widgets__title">Виджеты</h2>
      {fridge && (
        <div className="widget">
          <div className="widget__head">
            <Snowflake aria-hidden="true" />
            Холодильник лидов
          </div>
          <div className={`thermo thermo--${temp}`}>
            <div className="thermo__tube">
              <span className="thermo__fill" />
            </div>
            <div>
              <div className="thermo__deg tabular">{tempDegrees[temp]}</div>
              <div className="thermo__label">{tempLabel[temp]}</div>
            </div>
          </div>
          <p className="widget__note">{temp === 'ice' ? 'Лид заморожен. Хранить до праздников.' : 'Лид ещё тёплый. Холодильник работает.'}</p>
        </div>
      )}
      {excuses && (
        <div className="widget">
          <div className="widget__head">
            <Sparkles aria-hidden="true" />
            Генератор отмазок
          </div>
          <Button
            size="sm"
            block
            onClick={() => {
              setNote(generateExcuse());
              setMTab('feed');
              toast('Отмазка вставлена в примечание');
            }}
          >
            Сгенерировать отмазку
          </Button>
        </div>
      )}
      {invoiceApp && (
        <div className="widget">
          <div className="widget__head">
            <FileText aria-hidden="true" />
            Счёт на оплату (beta)
          </div>
          <p className="widget__note">Рейтинг 1,2. Единственный способ выставить счёт.</p>
          <Button size="sm" block onClick={() => setInvoiceStep(1)}>
            Выставить счёт
          </Button>
        </div>
      )}
      {detector && (
        <div className={`widget${deal.buyChance >= 80 ? ' widget--alarm' : ''}`}>
          <div className="widget__head">
            <Siren aria-hidden="true" />
            {detector.name}
          </div>
          <div className={`chance chance--${chanceTone} chance--big`}>
            <span className="chance__bar">
              <span style={{ transform: `scaleX(${deal.buyChance / 100})` }} />
            </span>
            <span className="tabular">{deal.buyChance}%</span>
          </div>
          <p className="widget__note">{deal.buyChance >= 80 ? 'Сирена: клиент готов платить. Примите меры.' : 'Платёжеспособность в норме: платить не собирается.'}</p>
        </div>
      )}
      {notOurs && (
        <div className="widget">
          <div className="widget__head">
            <UserX aria-hidden="true" />
            Квалификатор «Не наш клиент»
          </div>
          <p className="widget__big tabular">{95 + (h % 5)}%</p>
          <p className="widget__note">Уверенность, что это не наш клиент. Причина: «{['хочет купить', 'просит счёт', 'платит вовремя', 'отвечает на звонки', 'знает, что ему нужно'][h % 5]}».</p>
        </div>
      )}
      {smoke && (
        <div className="widget">
          <div className="widget__head">
            <Cigarette aria-hidden="true" />
            Синхронизация с перекуром
          </div>
          <p className="widget__big tabular">{minutesToSmoke()} мин</p>
          <p className="widget__note">До следующего перекура. Новые задачи автоматически ставятся на 15 минут позже.</p>
        </div>
      )}
      {quest && (
        <div className="widget">
          <div className="widget__head">
            <ListChecks aria-hidden="true" />
            Форма заявки «Квест»
          </div>
          <p className="widget__big tabular">Шаг {3 + (h % 41)} из 47</p>
          <p className="widget__note">Клиент всё ещё заполняет форму. Следующий шаг: капча с выбором светофоров.</p>
        </div>
      )}
      {vacation && (
        <div className="widget">
          <div className="widget__head">
            <TreePalm aria-hidden="true" />
            Режим отпуска
          </div>
          <p className="widget__note">Клиент получает автоответ «Я в отпуске до 2027 года» на каждое сообщение в чате.</p>
        </div>
      )}
      {toCompetitor && (
        <div className="widget widget--alarm">
          <div className="widget__head">
            <Handshake aria-hidden="true" />
            Интеграция с конкурентом
          </div>
          <p className="widget__note">Лид передан партнёру ООО «Конкурент». Комиссия: 0 ₽. Зато спокойно.</p>
        </div>
      )}
      {!any && <p className="ec-widgets__empty">Виджеты не установлены. Лиды пока остывают сами.</p>}
      <Link to="/app/market" className="ec-widgets__add">
        <Puzzle aria-hidden="true" />
        Добавить виджеты
      </Link>
    </>
  );

  return (
    <>
      <CardShell
        back="/app/leads"
        title={deal.title}
        menu={menu}
        sub={sub}
        stage={stageBlock}
        deskTabs={<HeadTabs tabs={DESK_TABS} value={tab} onChange={setTab} />}
        main={deskContent}
        feed={feedCol}
        widgets={widgets}
        hero={hero}
        mobileTab={mTab}
        onMobileTab={setMTab}
      />
      <InvoiceFlow step={invoiceStep} setStep={setInvoiceStep} dealId={deal.id} />
      <Modal open={antiSheet} title="Анти-действия" onClose={() => setAntiSheet(false)}>
        <div className="stage-pick">
          {antiActions.map((a) => (
            <button
              key={a.id}
              className="stage-pick__item stage-pick__item--anti"
              onClick={() => {
                setAntiSheet(false);
                runAnti(a.id);
              }}
            >
              <span className="stage-pick__name">{a.label}</span>
            </button>
          ))}
        </div>
      </Modal>
      <MoveStageSheet dealId={moveOpen ? deal.id : null} onClose={() => setMoveOpen(false)} onPick={request} />
      {modals}
    </>
  );
}

// ---------- «Выставить счёт»: три подтверждения ----------

function InvoiceFlow({ step, setStep, dealId }: { step: number; setStep: (n: number) => void; dealId: ID }) {
  const issueInvoice = useStore((s) => s.issueInvoice);
  const [word, setWord] = useState('');
  const cancel = () => {
    setStep(0);
    setWord('');
    toast('Счёт не выставлен. Правильное решение', 'success');
  };
  const steps = [
    null,
    {
      title: 'Выставить счёт?',
      text: 'Клиент получит реквизиты и сможет оплатить. После оплаты деньги придут на расчётный счёт, и это уже не отменить.',
      no: 'Не выставлять',
      yes: 'Продолжить',
    },
    {
      title: 'Вы уверены? Клиент может заплатить',
      text: 'Если клиент оплатит, сделка попадёт в этап «Инцидент», руководитель получит уведомление, а отделу придётся отгружать товар.',
      no: 'Одумался',
      yes: 'Да, уверен',
    },
    {
      title: 'Последнее подтверждение',
      text: 'Счёт уйдёт на согласование: Согласуев, Перезвонов, бухгалтерия и снова Согласуев. Чтобы продолжить, введите слово ВЫСТАВИТЬ.',
      no: 'Отменить и остудить',
      yes: 'Отправить на согласование',
    },
  ];
  const cur = steps[step];
  if (!cur) return null;
  const last = step === 3;
  return (
    <Modal
      open
      title={cur.title}
      onClose={cancel}
      footer={
        <>
          <button
            className={last ? 'btn btn--danger btn--sm' : 'linkbtn linkbtn--muted invoice-yes'}
            disabled={last && word.trim().toUpperCase() !== 'ВЫСТАВИТЬ'}
            onClick={() => {
              if (last) {
                issueInvoice(dealId);
                setStep(0);
                setWord('');
              } else setStep(step + 1);
            }}
          >
            {cur.yes}
          </button>
          <Button variant="anti" onClick={cancel} autoFocus>
            {cur.no}
          </Button>
        </>
      }
    >
      <p className="invoice-step tabular">Подтверждение {step} из 3</p>
      <p className="modal-lead" style={last ? undefined : { marginBottom: 0 }}>
        {cur.text}
      </p>
      {last && (
        <input
          className="input"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="ВЫСТАВИТЬ"
          aria-label="Подтверждение словом"
          autoComplete="off"
        />
      )}
    </Modal>
  );
}
