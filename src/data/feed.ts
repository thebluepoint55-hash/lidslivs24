import type { AuthorId, Deal, FeedItem, FeedKind } from '../store/types';
import { managers, stages } from './base';
import { companies, contacts } from './people';
import { deals } from './deals';
import { chats } from './chats';
import { daysAgo, hoursAgo, minutesAgo } from './time';
import {
  AFTER_LOST,
  ASSIGN,
  BOSS_LOST,
  ENTRY,
  FEMALE,
  FINALES,
  HOLIDAYS,
  HOOKS,
  PATHS,
  POOLS,
  ROBOT,
  VOICE,
  fill,
  money,
  mulberry32,
  type BI,
  type Beat,
  type Ctx,
  type Meta,
  type Who,
} from './feedLib';
import { RICH, richItems } from './feedRich';

let counter = 0;

function f(dealId: string, at: string, kind: FeedKind, authorId: AuthorId, text: string, meta?: Meta): FeedItem {
  counter += 1;
  const item: FeedItem = { id: `f-${counter}`, dealId, at, kind, authorId, text };
  if (meta) item.meta = meta;
  return item;
}

const inMissed: Meta = { direction: 'in', status: 'missed', duration: 0 };
const call = (direction: 'in' | 'out', status: 'missed' | 'dropped' | 'answered', duration: number): Meta => ({
  direction,
  status,
  duration,
});
const d = daysAgo;

// ───────────────────────── Сюжетные сделки ─────────────────────────

const stories: FeedItem[] = [
  // «Просит счёт (третий раз)»
  f('d-schet-3', d(66, 10, 12), 'created', 'robot', 'Сделка создана: заявка с сайта. Комментарий клиента: «Нужен счёт на 264 000, оплатим в тот же день»'),
  f('d-schet-3', d(66, 10, 14), 'robot', 'robot', 'Робот назначил безответственного: Виталий Перекуров'),
  f('d-schet-3', d(66, 13, 40), 'call', 'm-perekurov', 'Входящий звонок от Марины Гдесчётовой. Пропущен', inMissed),
  f('d-schet-3', d(66, 14, 5), 'note', 'm-perekurov', 'Клиент просил выставить ему счет, но у меня был перекур, поэтому задачу перенес на завтра'),
  f('d-schet-3', d(65, 11, 20), 'task', 'm-perekurov', 'Задача «Выставить счёт» перенесена на завтра', { type: 'followup' }),
  f('d-schet-3', d(64, 16, 30), 'email', 'client', 'Входящее письмо «Счёт?»: «Добрый день! Вы обещали счёт вчера. Реквизиты нашей компании во вложении»'),
  f('d-schet-3', d(62, 10, 0), 'robot', 'robot', 'Письмо с реквизитами открыто 0 раз'),
  f('d-schet-3', d(58, 12, 10), 'stage', 'm-perekurov', 'Этап изменён: КП отправлено (в спам) → Клиент думает'),
  f('d-schet-3', d(58, 12, 11), 'note', 'm-perekurov', 'Перевёл в «Клиент думает». Клиент не думает, клиент ждёт счёт, но в этом этапе сделка смотрится спокойнее'),
  f('d-schet-3', d(41, 15, 0), 'call', 'm-perekurov', 'Входящий, 0:38. Клиент: «Второй раз прошу счёт». Ответ: «Он уже у бухгалтерии»', call('in', 'answered', 38)),
  f('d-schet-3', d(40, 9, 30), 'system', 'm-perekurov', 'Для поля «Причина будущего отказа» установлено значение «Счёт в работе»'),
  f('d-schet-3', d(27, 17, 45), 'invoice', 'm-perekurov', 'Попытка выставить счёт отменена на втором подтверждении («Вы уверены? Клиент может заплатить»)'),
  f('d-schet-3', d(12, 11, 2), 'chat', 'client', 'WhatsApp: «Я третий раз прошу счёт. Может, я просто переведу деньги по номеру карты?»'),
  f('d-schet-3', d(12, 14, 50), 'note', 'm-perekurov', 'Номер карты не дал. Вдруг переведёт'),
  f('d-schet-3', d(2, 9, 1), 'robot', 'robot', 'Робот перенёс задачу «Выставить счёт»: менеджер выглядел уставшим. Перенос № 21'),

  // «Хочет оплатить» — полгода попыток
  f('d-oplatilby', d(196, 11, 5), 'created', 'robot', 'Сделка создана: входящий звонок. Сумму клиент назвал сам'),
  f('d-oplatilby', d(196, 11, 6), 'call', 'm-soglasuev', 'Входящий, 1:04. Клиент: «Сколько с меня? Оплачу сегодня». Ответ: «Надо согласовать с руководством»', call('in', 'answered', 64)),
  f('d-oplatilby', d(195, 10, 20), 'note', 'm-soglasuev', 'Клиент знает сумму, деньги у него есть. Подозрительно. Согласую с руководством'),
  f('d-oplatilby', d(180, 9, 48), 'email', 'client', 'Входящее письмо «Реквизиты для оплаты?»: «Пришлите реквизиты, бухгалтер ждёт»'),
  f('d-oplatilby', d(170, 16, 0), 'note', 'm-soglasuev', 'Руководство на совещании. Совещание о том, когда собираться по согласованиям'),
  f('d-oplatilby', d(150, 12, 30), 'invoice', 'm-soglasuev', 'Счёт № 1 сформирован и отправлен на согласование. Согласующих: 4. Согласовали: 0'),
  f('d-oplatilby', d(120, 13, 15), 'call', 'm-soglasuev', 'Входящий от Эдуарда Оплатилбы в 13:15. Пропущен (обед)', inMissed),
  f('d-oplatilby', d(100, 10, 12), 'chat', 'client', 'Telegram: «Давайте я пришлю платёжку, а счёт вы потом оформите?»'),
  f('d-oplatilby', d(99, 17, 40), 'note', 'm-soglasuev', 'Деньги без счёта брать нельзя, счёт без согласования выставлять нельзя. Объяснил клиенту. Клиент долго молчал'),
  f('d-oplatilby', d(75, 11, 0), 'system', 'm-soglasuev', 'Для поля «Бюджет» установлено значение «97 000 ₽ (на согласовании)»'),
  f('d-oplatilby', d(45, 13, 20), 'robot', 'robot', 'Клиент приехал в офис с наличными. В офисе был перекур, дверь никто не открыл'),
  f('d-oplatilby', d(30, 15, 10), 'invoice', 'm-soglasuev', 'Счёт № 1 вернулся с согласования: реквизиты устарели. Сформирован счёт № 2, отправлен на согласование'),
  f('d-oplatilby', d(10, 18, 55), 'email', 'client', 'Входящее письмо «Последний раз»: «Скажите честно, у вас вообще можно что-то купить?»'),
  f('d-oplatilby', d(9, 10, 0), 'stage', 'm-soglasuev', 'Этап изменён: Клиент думает → Слит (успешно). Причина: полгода пытался оплатить и устал'),

  // «Прислала подписанный договор»
  f('d-tretiy', d(64, 9, 40), 'created', 'robot', 'Сделка создана: письмо «Пришлите договор, подпишем»'),
  f('d-tretiy', d(63, 10, 15), 'note', 'm-zavtrakova', 'Договор пришлю завтра. С утра. После кофе'),
  f('d-tretiy', d(58, 9, 0), 'task', 'robot', 'Задача «Отправить договор» перенесена в пятый раз', { type: 'followup' }),
  f('d-tretiy', d(55, 18, 50), 'email', 'm-zavtrakova', 'Исходящее письмо «Договор». Вложение: договор_финал_финал2_правки.docx'),
  f('d-tretiy', d(52, 11, 30), 'email', 'client', 'Входящее письмо: «Подписали, сканы во вложении. Оригиналы отправили курьером»'),
  f('d-tretiy', d(52, 11, 31), 'robot', 'robot', 'Вложение «договор_подписан.pdf» сохранено в папку «Разобрать потом»'),
  f('d-tretiy', d(50, 14, 10), 'robot', 'robot', 'Курьер доставил оригинал договора. Расписался Виталий Перекуров, по дороге на перекур'),
  f('d-tretiy', d(44, 12, 0), 'chat', 'client', 'WhatsApp: «Я третий раз пишу. Договор дошёл? Когда будет счёт?»'),
  f('d-tretiy', d(43, 16, 20), 'note', 'm-zavtrakova', 'Договора нет ни в почте, ни на столе. Виталий сначала сказал, что ничего не получал, потом вспомнил, что где-то расписывался'),
  f('d-tretiy', d(41, 10, 5), 'note', 'm-perekurov', 'Конверт лежал под кофемашиной. Вчера приходил клининг, теперь не лежит'),
  f('d-tretiy', d(40, 18, 55), 'email', 'm-zavtrakova', 'Исходящее письмо: «Тамара, добрый день! Пришлите, пожалуйста, договор ещё раз, мы его не получали»'),
  f('d-tretiy', d(30, 9, 12), 'email', 'client', 'Входящее письмо: «Пишу в четвёртый и последний раз. Мы нашли поставщика, у которого договоры не теряются»'),
  f('d-tretiy', d(23, 11, 0), 'stage', 'm-zavtrakova', 'Этап изменён: Клиент думает → Слит (успешно). Причина: потеряли подписанный договор'),

  // Тендер: опоздали на 5 минут
  f('d-tender-5min', d(60, 9, 0), 'created', 'robot', 'Сделка создана: извещение о закупке «Поставка спецодежды». Окончание подачи заявок: через 41 день'),
  f('d-tender-5min', d(59, 11, 30), 'note', 'm-soglasuev', 'Участвуем. Согласую с руководством скидку, обеспечение и цвет папки'),
  f('d-tender-5min', d(45, 10, 0), 'task', 'robot', 'Задача «Прочитать ТЗ» перенесена в четвёртый раз', { type: 'think' }),
  f('d-tender-5min', d(30, 15, 0), 'robot', 'robot', 'Документы собраны на 92%. Не хватает выписки из ЕГРЮЛ и решимости'),
  f('d-tender-5min', d(21, 12, 40), 'note', 'm-perezvonov', 'Подаём в последний день. Площадку не торопим'),
  f('d-tender-5min', d(19, 9, 20), 'note', 'm-soglasuev', 'Заявка готова. Отправлю в 11:50, приём до 12:00. Успеваем'),
  f('d-tender-5min', d(19, 11, 48), 'robot', 'robot', 'Электронная подпись не найдена. Последнее известное место флешки: карман Виталия Перекурова'),
  f('d-tender-5min', d(19, 11, 51), 'note', 'm-perekurov', 'Иду. Пять минут, только докурю'),
  f('d-tender-5min', d(19, 12, 0), 'system', 'robot', 'Приём заявок на площадке завершён'),
  f('d-tender-5min', d(19, 12, 5), 'system', 'm-soglasuev', 'Электронная подпись подключена. Заявка подписана в 12:05:14'),
  f('d-tender-5min', d(19, 12, 6), 'note', 'm-soglasuev', 'Опоздали на 5 минут. Руководство согласовало это задним числом'),
  f('d-tender-5min', d(18, 10, 0), 'stage', 'm-soglasuev', 'Этап изменён: Опоздали на 5 минут → Проиграли красиво'),
  f('d-tender-5min', d(18, 10, 30), 'robot', 'robot', 'Победитель снизил цену на 0,5%. Мы собирались снижать на 0%'),

  // «Перезвонить после праздников»
  f('d-poslepraznikov', d(290, 10, 30), 'created', 'robot', 'Сделка создана: заявка с сайта «Нужны ворота до зимы, бюджет есть»'),
  f('d-poslepraznikov', d(288, 12, 0), 'note', 'm-perezvonov', 'Клиента не торопим. До зимы ещё далеко'),
  f('d-poslepraznikov', d(285, 15, 0), 'stage', 'm-perezvonov', 'Этап изменён: Новый лид → Клиент думает'),
  f('d-poslepraznikov', d(270, 9, 0), 'robot', 'robot', 'Робот перенёс задачу «Позвонить» на после Рождества'),
  f('d-poslepraznikov', d(245, 9, 0), 'robot', 'robot', 'Задача «Позвонить» перенесена на после 23 Февраля'),
  f('d-poslepraznikov', d(230, 9, 0), 'robot', 'robot', 'Задача «Позвонить» перенесена на после 8 Марта'),
  f('d-poslepraznikov', d(214, 11, 0), 'stage', 'm-perezvonov', 'Этап изменён: Клиент думает → Перенесено на после праздников'),
  f('d-poslepraznikov', d(200, 14, 30), 'call', 'm-perezvonov', 'Входящий, 0:47. Клиент: «Праздники закончились?» Ответ: «Скоро майские»', call('in', 'answered', 47)),
  f('d-poslepraznikov', d(160, 16, 0), 'note', 'm-perezvonov', 'Майские прошли. До Дня России клиента не беспокою, неудобно'),
  f('d-poslepraznikov', d(120, 9, 0), 'robot', 'robot', 'Задача «Позвонить» перенесена на после Дня семьи, любви и верности'),
  f('d-poslepraznikov', d(50, 10, 40), 'email', 'client', 'Входящее письмо «Ворота»: «Зима скоро. Ворота будут?»'),
  f('d-poslepraznikov', d(18, 9, 0), 'robot', 'robot', 'Календарь праздников РФ+: ближайший повод — День работника леса (21 сентября). Задача перенесена'),
  f('d-poslepraznikov', d(17, 12, 30), 'note', 'm-perezvonov', 'Позвонил бы, но у клиента в роду могут быть лесники. Подожду'),
  f('d-poslepraznikov', d(1, 9, 0), 'robot', 'robot', 'Задача «Позвонить» перенесена на после Дня таможенника. Перенос № 38'),

  // «Советуется с женой»
  f('d-sovetchikov', d(110, 18, 10), 'created', 'robot', 'Сделка создана: входящий звонок. Клиент: «Беру, только с женой посоветуюсь»'),
  f('d-sovetchikov', d(110, 18, 30), 'note', 'm-perezvonov', 'Клиент советуется с женой. Не торопим'),
  f('d-sovetchikov', d(103, 19, 5), 'call', 'm-perezvonov', 'Входящий, 0:52. Клиент: «Жена одобрила, давайте счёт». Ответ: «А вы точно посоветовались?»', call('in', 'answered', 52)),
  f('d-sovetchikov', d(102, 10, 0), 'note', 'm-perezvonov', 'Жена одобрила слишком быстро. Предложил посоветоваться ещё раз, без спешки'),
  f('d-sovetchikov', d(96, 11, 0), 'stage', 'm-perezvonov', 'Этап изменён: Новый лид → Клиент думает'),
  f('d-sovetchikov', d(90, 20, 15), 'chat', 'client', 'WhatsApp: «Жена спрашивает, когда привезут»'),
  f('d-sovetchikov', d(89, 10, 30), 'note', 'm-perezvonov', 'Теперь думает и жена. Ждём, пока додумают оба'),
  f('d-sovetchikov', d(70, 21, 0), 'email', 'client', 'Входящее письмо «Голосовое от жены»: «Прикрепил голосовое, она за. Можно уже оплатить?»'),
  f('d-sovetchikov', d(69, 9, 5), 'robot', 'robot', 'Голосовое сообщение (0:41) отмечено как прочитанное. Прослушано: нет'),
  f('d-sovetchikov', d(45, 14, 10), 'call', 'm-perezvonov', 'Входящий от Виктора Сженойсоветчикова. Пропущен', inMissed),
  f('d-sovetchikov', d(30, 12, 0), 'note', 'm-perezvonov', 'Клиент предложил приехать вместе с женой и оплатить на месте. Сказал, что у нас в офисе ремонт'),
  f('d-sovetchikov', d(8, 9, 0), 'robot', 'robot', 'Робот предложил клиенту посоветоваться с тёщей. Сделка охлаждена на 4 °C'),

  // «КП в пятницу, 18:55»
  f('d-kp-spam', d(45, 10, 0), 'created', 'robot', 'Сделка создана: рекомендация. Кто нас порекомендовал, выясняем'),
  f('d-kp-spam', d(44, 17, 30), 'note', 'm-zavtrakova', 'КП сделаю завтра. С утра. После кофе'),
  f('d-kp-spam', d(41, 9, 0), 'task', 'm-zavtrakova', 'Задача «Отправить КП» перенесена на пятницу', { type: 'kp' }),
  f('d-kp-spam', d(37, 18, 55), 'email', 'm-zavtrakova', 'Исходящее письмо отправлено в пятницу в 18:55. Тема: «КП». Текст письма: нет'),
  f('d-kp-spam', d(37, 18, 56), 'robot', 'robot', 'Письмо попало в папку «Спам» у получателя. Доставка прошла успешно'),
  f('d-kp-spam', d(33, 10, 20), 'robot', 'robot', 'Клиент открыл КП 4 раза. Менеджер не заметил'),
  f('d-kp-spam', d(33, 10, 45), 'call', 'm-zavtrakova', 'Входящий от Аркадия Кпвспаме. Пропущен', inMissed),
  f('d-kp-spam', d(32, 9, 15), 'email', 'client', 'Входящее письмо: «Нашёл ваше КП в спаме. Всё устраивает, присылайте договор»'),
  f('d-kp-spam', d(31, 17, 0), 'note', 'm-zavtrakova', 'Клиенту понравилось КП. Наверное, я приложила не тот файл. Проверю завтра'),
  f('d-kp-spam', d(25, 11, 0), 'robot', 'robot', 'Клиент открыл КП ещё 3 раза и переслал директору'),
  f('d-kp-spam', d(20, 10, 0), 'system', 'robot', 'Для поля «Вероятность покупки» установлено значение «86%»'),
  f('d-kp-spam', d(6, 16, 40), 'note', 'm-zavtrakova', 'Подготовила новую версию КП с ценой ×3. Отправлю в пятницу в 18:55'),

  // «Звонила 23 раза»
  f('d-zvonkova', d(47, 13, 5), 'created', 'robot', 'Сделка создана: входящий звонок (пропущен)'),
  f('d-zvonkova', d(47, 13, 5), 'call', 'm-nedozvonova', 'Входящий от Светланы Звонковой. Пропущен', inMissed),
  f('d-zvonkova', d(46, 10, 0), 'note', 'm-nedozvonova', 'Номер незнакомый. Вдруг клиент'),
  f('d-zvonkova', d(45, 14, 20), 'call', 'm-nedozvonova', 'Входящий от Светланы Звонковой. Пропущен', inMissed),
  f('d-zvonkova', d(41, 9, 30), 'stage', 'm-nedozvonova', 'Этап изменён: Новый лид → Не дозвонились'),
  f('d-zvonkova', d(40, 16, 0), 'robot', 'robot', 'Клиент позвонил 9 раз за день. Телефония присвоила номеру метку «настойчивый»'),
  f('d-zvonkova', d(33, 15, 30), 'note', 'm-nedozvonova', 'Звонит с 13:00 до 15:00. У меня в это время обед, потом перекур'),
  f('d-zvonkova', d(28, 13, 40), 'call', 'm-nedozvonova', 'Входящий от Светланы Звонковой. Сброшен вежливо', call('in', 'dropped', 3)),
  f('d-zvonkova', d(21, 11, 10), 'chat', 'client', 'Telegram: «Вы вообще работаете? Хочу заказ на 156 000»'),
  f('d-zvonkova', d(21, 11, 11), 'robot', 'robot', 'Сообщение прочитано. Ответ не требуется'),
  f('d-zvonkova', d(12, 14, 2), 'call', 'm-nedozvonova', '23-й входящий от Светланы Звонковой. Пропущен. Рекорд отдела', inMissed),
  f('d-zvonkova', d(11, 10, 0), 'note', 'm-perezvonov', 'Олеся, отличная работа. 23 пропущенных от одного клиента повесим на доску почёта'),
  f('d-zvonkova', d(3, 9, 0), 'robot', 'robot', 'Робот перенёс задачу «Перезвонить»: клиент и так звонит сам'),

  // «Ищет поставщика срочно» — ушёл к конкурентам
  f('d-ushel', d(70, 10, 0), 'created', 'robot', 'Сделка создана: «Ищем поставщика срочно, объём на 520 000»'),
  f('d-ushel', d(70, 15, 10), 'call', 'm-perekurov', 'Исходящий, 1:35. Клиент: «Когда сможете отгрузить?» Ответ: «А вы у конкурентов смотрели?»', call('out', 'answered', 95)),
  f('d-ushel', d(69, 11, 0), 'note', 'm-perekurov', 'Сказал клиенту, что у конкурентов дешевле. Проверять не стал'),
  f('d-ushel', d(66, 18, 55), 'email', 'm-perekurov', 'Исходящее письмо: «Степан, высылаю контакты трёх поставщиков, сравните»'),
  f('d-ushel', d(63, 12, 30), 'chat', 'client', 'WhatsApp: «Спасибо за контакты. А у вас купить можно?»'),
  f('d-ushel', d(62, 16, 5), 'note', 'm-perekurov', 'Ответил, что можно, но у них быстрее. Клиент поблагодарил'),
  f('d-ushel', d(55, 10, 0), 'robot', 'robot', 'Конкурент выставил клиенту счёт за 40 минут'),
  f('d-ushel', d(52, 12, 0), 'stage', 'm-perekurov', 'Этап изменён: Клиент думает → Слит (успешно). Причина: ушёл к конкурентам по нашей рекомендации'),
  f('d-ushel', d(51, 11, 0), 'robot', 'robot', 'Конкурент прислал открытку «Спасибо за партнёрство»'),

  // Инцидент № 1: купила, пока менеджер был в отпуске
  f('d-incident-1', d(230, 10, 30), 'created', 'robot', 'Сделка создана: повторное обращение'),
  f('d-incident-1', d(229, 17, 50), 'note', 'm-zavtrakova', 'Ухожу в отпуск. Клиента предупредила, что все решения после двадцатого'),
  f('d-incident-1', d(226, 11, 15), 'chat', 'client', 'WhatsApp: «Оплатили по вашему прошлогоднему счёту, реквизиты те же. Привозите»'),
  f('d-incident-1', d(225, 9, 40), 'robot', 'robot', 'Поступление на расчётный счёт: 84 000 ₽. Отменить нельзя'),
  f('d-incident-1', d(225, 9, 41), 'system', 'robot', 'Для поля «Бюджет» установлено значение «84 000 ₽ (оплачено)»'),
  f('d-incident-1', d(224, 10, 0), 'note', 'm-perezvonov', 'Кто оставил клиенту старый счёт? Разбираемся'),
  f('d-incident-1', d(211, 12, 0), 'stage', 'm-perezvonov', 'Этап изменён: Клиент думает → Инцидент: клиент купил'),
  f('d-incident-1', d(211, 12, 30), 'incident', 'm-perezvonov', 'Разбор инцидента. Что пошло не так: менеджер ушла в отпуск, клиент нашёл в почте прошлогодний счёт. Кто виноват: почта. Как не допустить впредь: удалять счета сразу после отправки'),
  f('d-incident-1', d(210, 10, 0), 'note', 'm-zavtrakova', 'Вернулась из отпуска, а тут продажа. Больше в отпуск не пойду'),
  f('d-incident-1', d(209, 9, 0), 'robot', 'robot', 'Табло «Дней без инцидентов» сброшено на 0'),
  f('d-incident-1', d(205, 16, 0), 'incident', 'm-perezvonov', 'Распоряжение: удалить старые счета из всех почтовых ящиков отдела. Срок — вчера'),

  // Инцидент № 2: оплатил по реквизитам с сайта
  f('d-incident-2', d(420, 11, 0), 'created', 'robot', 'Сделка создана: заявка с сайта'),
  f('d-incident-2', d(419, 13, 5), 'note', 'm-perekurov', 'Клиент просит счёт. Схожу на перекур и выставлю'),
  f('d-incident-2', d(418, 9, 0), 'task', 'robot', 'Задача «Выставить счёт» перенесена на завтра', { type: 'followup' }),
  f('d-incident-2', d(412, 15, 20), 'chat', 'client', 'Сайт: «Нашёл ваши реквизиты внизу сайта и оплатил. Так можно было?»'),
  f('d-incident-2', d(411, 10, 0), 'robot', 'robot', 'Поступление на расчётный счёт: 152 000 ₽'),
  f('d-incident-2', d(402, 12, 0), 'stage', 'm-perezvonov', 'Этап изменён: Клиент думает → Инцидент: клиент купил'),
  f('d-incident-2', d(402, 12, 40), 'incident', 'm-perezvonov', 'Разбор инцидента. Что пошло не так: реквизиты на сайте. Кто виноват: подрядчик, который делал сайт. Как не допустить впредь: реквизиты убрать, телефон заменить на «Мы вам перезвоним»'),
  f('d-incident-2', d(401, 10, 0), 'system', 'robot', 'Для поля «Реквизиты на сайте» установлено значение «Удалены»'),
  f('d-incident-2', d(400, 14, 0), 'note', 'm-perekurov', 'Обиднее всего, что я даже не успел докурить'),

  // «Готов оплатить сегодня» — сегодняшняя горячая сделка стажёра
  f('d-hochu-segodnya', hoursAgo(5), 'created', 'robot', 'Сделка создана: входящий звонок. Трубку взяли случайно'),
  f('d-hochu-segodnya', hoursAgo(5), 'robot', 'robot', 'Безответственный: Вы (стажёр). Руководитель решил, что вам пора учиться'),
  f('d-hochu-segodnya', minutesAgo(292), 'call', 'you', 'Входящий, 2:12. Клиент: «Готов оплатить сегодня, пришлите счёт до 17:00»', call('in', 'answered', 132)),
  f('d-hochu-segodnya', minutesAgo(270), 'note', 'm-perezvonov', 'Стажёр, это твой первый горячий. Главное — не торопи клиента'),
  f('d-hochu-segodnya', hoursAgo(3), 'email', 'client', 'Входящее письмо «Счёт»: «Жду счёт. Бухгалтер на месте до 17:00»'),
  f('d-hochu-segodnya', hoursAgo(2), 'robot', 'robot', 'Детектор платёжеспособности: клиент готов платить. Рекомендуем перенести задачу'),
  f('d-hochu-segodnya', hoursAgo(1), 'chat', 'client', 'WhatsApp: «Ну что там?»'),
  f('d-hochu-segodnya', minutesAgo(20), 'robot', 'robot', 'Клиент открыл сайт и ищет кнопку «Оплатить». Кнопки нет, всё под контролем'),

  // «Согласую с руководством» — VIP на 2,4 млн
  f('d-vip', d(150, 11, 0), 'created', 'robot', 'Сделка создана: входящий звонок от генерального директора'),
  f('d-vip', d(149, 10, 0), 'note', 'm-soglasuev', 'Крупный клиент. Надо согласовать с руководством'),
  f('d-vip', d(140, 12, 0), 'note', 'm-perezvonov', 'Согласовывай, только не торопись'),
  f('d-vip', d(133, 15, 0), 'stage', 'm-soglasuev', 'Этап изменён: КП отправлено (в спам) → Клиент думает'),
  f('d-vip', d(120, 10, 10), 'email', 'client', 'Входящее письмо: «Бюджет утверждён советом директоров. Пришлите договор»'),
  f('d-vip', d(119, 16, 30), 'note', 'm-soglasuev', 'У них бюджет утверждён, у нас договор нет. Отправил на согласование'),
  f('d-vip', d(100, 12, 0), 'invoice', 'm-soglasuev', 'Счёт отправлен на согласование. Согласующих: 4, из них в отпуске: 3'),
  f('d-vip', d(80, 10, 0), 'robot', 'robot', 'Клиент открыл КП 11 раз'),
  f('d-vip', d(60, 14, 0), 'call', 'm-soglasuev', 'Входящий от Евгения Директорова. Пропущен (совещание по согласованию)', inMissed),
  f('d-vip', d(40, 17, 0), 'note', 'm-soglasuev', 'Руководство согласовало договор. Осталось согласовать согласование'),
  f('d-vip', d(20, 10, 0), 'system', 'robot', 'Для поля «Вероятность покупки» установлено значение «87%». Риск сделки: высокий'),
  f('d-vip', d(5, 9, 30), 'robot', 'robot', 'Робот перенёс встречу «Подписание договора»: переговорка занята под обед'),

  // Выигранный тендер и повторная покупка — короткие разборы
  f('d-t-3810', d(330, 10, 0), 'created', 'robot', 'Сделка создана: аукцион «Поставка офисной мебели»'),
  f('d-t-3810', d(301, 11, 59), 'note', 'm-perezvonov', 'Подали заявку, чтобы потренироваться. Других участников не было'),
  f('d-t-3810', d(300, 12, 0), 'stage', 'robot', 'Этап изменён: Подали без документов → Инцидент: выиграли тендер'),
  f('d-t-3810', d(299, 10, 0), 'incident', 'm-perezvonov', 'Разбор инцидента. Что пошло не так: мы были единственным участником. Как не допустить впредь: подавать только туда, где участников больше пяти'),

  f('d-r-4100', d(160, 10, 0), 'created', 'robot', 'Сделка создана: клиент вернулся за повторным заказом'),
  f('d-r-4100', d(158, 12, 0), 'note', 'm-zavtrakova', 'Сделала вид, что мы не знакомы. Клиент назвал номер прошлого заказа'),
  f('d-r-4100', d(151, 11, 0), 'robot', 'robot', 'Клиент оплатил по прошлому счёту ещё раз. Банк назначение платежа принял'),
  f('d-r-4100', d(150, 12, 0), 'stage', 'robot', 'Этап изменён: Предложили подождать → Инцидент: купил повторно'),
  f('d-r-4100', d(149, 16, 0), 'incident', 'm-perezvonov', 'Разбор инцидента. Кто виноват: хорошая память клиента. Меры: номера прошлых заказов клиентам не сообщать'),
];


// ───────────── Остальные сделки: цикл по этапам с типовыми косяками ─────────────

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const NOW = Date.parse(minutesAgo(0));
const CH_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', telegram: 'Telegram', avito: 'Avito', site: 'Сайт', max: 'MAX' };

const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? id;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const storyIds = new Set(stories.map((s) => s.dealId));

let gCounter = 0;

function channelFor(dealId: string, source: string, rnd: () => number): string {
  const thread = chats.find((c) => c.dealId === dealId);
  if (thread) return CH_LABEL[thread.channel];
  if (/avito/i.test(source)) return 'Avito';
  if (/whatsapp/i.test(source)) return 'WhatsApp';
  if (source === 'Сайт' || source.startsWith('Виджет')) return 'Сайт';
  return rnd() < 0.6 ? 'WhatsApp' : 'Telegram';
}

function generate(deal: Deal): FeedItem[] {
  const path = PATHS[deal.id];
  if (!path) return [];
  const rnd = mulberry32(deal.num * 7919 + 17);
  const rint = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const r = deal.responsibleId;
  const contact = contacts.find((c) => c.id === deal.contactId);
  const clientName = contact?.name ?? 'клиента';
  const first = clientName.split(' ')[0];
  const others = companies.filter((c) => c.id !== deal.companyId);
  const mgr = managers.find((m) => m.id === r);
  const ctx: Partial<Ctx> = {
    client: clientName,
    first,
    clientFemale: /[ая]$/.test(first),
    sum: money(deal.budget),
    sum3: money(deal.budget * 3),
    sumOld: money(Math.round((deal.budget * 0.78) / 100) * 100),
    other: pick(others).name,
    ch: channelFor(deal.id, deal.source, rnd),
    mgr: mgr?.name ?? 'Вы (стажёр)',
    mgrFirst: mgr ? mgr.name.split(' ')[0] : 'Стажёр',
    src: deal.source,
    fl: deal.futureLossReason,
  };

  const resolve = (who: Who): AuthorId | null => {
    if (who === 'r') return r;
    if (who === 'boss') return r === 'm-perezvonov' ? null : 'm-perezvonov';
    if (who === 'sogl') return r === 'm-soglasuev' ? null : 'm-soglasuev';
    return who;
  };
  const valid = (items: BI[]) => items.every((it) => resolve(it[1]) !== null);

  const out: FeedItem[] = [];
  const add = (t: number, kind: FeedKind, who: Who, text: string, meta?: Meta) => {
    const authorId = resolve(who);
    if (!authorId) return;
    const female = FEMALE.has(authorId) || (authorId === 'client' && Boolean(ctx.clientFemale));
    const local = { ...ctx, n: rint(3, 9), N: rint(11, 48), holiday: pick(HOLIDAYS) };
    gCounter += 1;
    const item: FeedItem = {
      id: `f2-${gCounter}`,
      dealId: deal.id,
      at: new Date(Math.round(t)).toISOString(),
      kind,
      authorId,
      text: fill(text, local, female),
    };
    if (meta) item.meta = meta;
    out.push(item);
  };

  /** Сдвигает момент в рабочие часы (9–19) того же или соседнего дня, если это укладывается в [lo, hi] */
  const workHours = (t: number, lo: number, hi: number) => {
    for (const shift of [0, 1, -1, 2, -2]) {
      const d = new Date(t + shift * DAY);
      d.setHours(rint(9, 19), rint(0, 59), 0, 0);
      if (+d >= lo && +d <= hi) return +d;
    }
    return t;
  };

  /** Раскладывает сцену внутри отрезка [a, b] */
  const placeBeat = (beat: Beat, a: number, b: number) => {
    const offs = beat.items.map((it) => (it[3] ?? 0) * MIN);
    const span = Math.max(0, ...offs);
    const lo = a + 5 * MIN;
    let scale = 1;
    let hi = b - 5 * MIN - span;
    if (hi <= lo) {
      const avail = Math.max(b - a - 10 * MIN, 0);
      scale = span > 0 ? Math.min(1, (avail * 0.5) / span) : 1;
      hi = Math.max(lo, b - 5 * MIN - span * scale);
    }
    let start = workHours(lo + (hi - lo) * rnd(), lo, hi);
    if (beat.clock) {
      const d = new Date(start);
      d.setHours(beat.clock[0], beat.clock[1], 0, 0);
      if (+d >= lo && +d <= hi) start = +d;
    }
    beat.items.forEach(([kind, who, text, , meta], i) => add(start + offs[i] * scale, kind, who, text, meta));
  };

  const closed = Boolean(deal.closedAt);
  const start = Date.parse(deal.createdAt);
  const openStages = closed ? path.slice(0, -1) : path;
  const k = openStages.length;
  const lastT = Date.parse(deal.closedAt ?? deal.stageSince);
  const end = closed ? lastT : NOW - 20 * MIN;

  // моменты входа в этапы
  const T: number[] = [start];
  const parts = closed ? k : k - 1;
  for (let i = 1; i < k; i++) {
    if (!closed && i === k - 1) {
      T.push(lastT);
      continue;
    }
    let t = start + ((lastT - start) * (i + (rnd() - 0.5) * 0.5)) / Math.max(parts, 1);
    const d = new Date(t);
    d.setHours(rint(10, 18), rint(0, 59), 0, 0);
    if (+d > T[i - 1] + 2 * HOUR && +d < lastT - 2 * HOUR) t = +d;
    T.push(Math.max(t, T[i - 1] + HOUR));
  }
  const seg = (i: number): [number, number] => [T[i], i + 1 < k ? T[i + 1] : end];

  // бюджет записей
  const young = end - start < 2.5 * DAY;
  const target = closed ? rint(12, 14) : young ? rint(14, 17) : rint(17, 20);

  add(start, 'created', 'robot', `Сделка создана. Источник: ${deal.source}`);
  add(start + rint(1, 4) * MIN, 'robot', 'robot', pick(ASSIGN));
  add(start + rint(15, 90) * MIN, 'system', 'r', `Для поля «Причина будущего отказа» установлено значение «${deal.futureLossReason}»`);

  for (let i = 1; i < k; i++) {
    add(T[i], 'stage', 'r', `Этап изменён: ${stageName(openStages[i - 1])} → ${stageName(openStages[i])}`);
    const entry = ENTRY[openStages[i]];
    if (entry && rnd() < 0.6) add(T[i] + rint(3, 40) * MIN, 'note', 'r', pick(entry));
  }

  (HOOKS[deal.id] ?? []).forEach((h) => {
    const i = openStages.indexOf(h.stage);
    if (i >= 0) placeBeat({ items: h.items }, ...seg(i));
  });

  if (closed) {
    const [a, b] = seg(k - 1);
    const finale = FINALES[deal.id];
    if (finale) placeBeat({ items: finale }, a + (b - a) * 0.7, b - 10 * MIN);
    const final = path[path.length - 1];
    const reason = deal.lossReason ? `. Причина: ${lowerFirst(deal.lossReason)}` : '';
    add(lastT, 'stage', 'r', `Этап изменён: ${stageName(openStages[k - 1])} → ${stageName(final)}${reason}`);
    const after = workHours(Math.min(lastT + rint(2, 30) * HOUR, NOW - 30 * MIN), lastT + HOUR, Math.min(lastT + 4 * DAY, NOW - 30 * MIN));
    add(after, 'robot', 'robot', pick(AFTER_LOST));
    if (rnd() < 0.6) {
      const t = workHours(Math.min(after + rint(1, 5) * HOUR, NOW - 25 * MIN), after + 30 * MIN, Math.min(after + 3 * DAY, NOW - 25 * MIN));
      add(t, 'note', 'boss', pick(BOSS_LOST));
    }
  }

  // остаток раскладываем по этапам сценами из библиотеки
  const remaining = Math.max(target - out.length, 2);
  const weights = openStages.map((_, i) => {
    const [a, b] = seg(i);
    return (1 + Math.log1p((b - a) / DAY)) * (!closed && i === k - 1 ? 1.4 : 1);
  });
  const wsum = weights.reduce((s, w) => s + w, 0);
  const voice = shuffle(VOICE[r] ?? VOICE['m-perezvonov']);
  const robots = shuffle(ROBOT);
  let left = remaining;

  openStages.forEach((st, i) => {
    const [a, b] = seg(i);
    const days = (b - a) / DAY;
    let quota = i === k - 1 ? left : Math.min(left, Math.max(1, Math.round((remaining * weights[i]) / wsum)));
    left -= quota;
    const beats = shuffle(POOLS[st] ?? []).filter((bt) => valid(bt.items) && (bt.min ?? 0) <= days);
    while (quota > 0) {
      const roll = rnd();
      const bi = beats.findIndex((bt) => bt.items.length <= quota);
      if (roll < 0.66 && bi >= 0) {
        const [beat] = beats.splice(bi, 1);
        placeBeat(beat, a, b);
        quota -= beat.items.length;
      } else if (roll < 0.86 && voice.length) {
        placeBeat({ items: [['note', 'r', voice.pop()!]] }, a, b);
        quota -= 1;
      } else if (robots.length) {
        placeBeat({ items: [['robot', 'robot', robots.pop()!]] }, a, b);
        quota -= 1;
      } else break;
    }
  });

  return out;
}

const generated: FeedItem[] = deals.filter((deal) => !storyIds.has(deal.id) && !RICH.has(deal.id)).flatMap(generate);

// Сюжетные записи писались по дням без учёта точного часа создания сделки:
// всё, что оказалось раньше createdAt, сдвигаем сразу за момент создания, сохраняя порядок.
const createdOf = new Map(deals.map((deal) => [deal.id, Date.parse(deal.createdAt)]));
const early = new Map<string, number>();
for (const item of stories) {
  const created = item.dealId ? createdOf.get(item.dealId) : undefined;
  if (created === undefined || Date.parse(item.at) >= created) continue;
  const k = early.get(item.dealId!) ?? 0;
  early.set(item.dealId!, k + 1);
  item.at = new Date(created + k * 2 * MIN).toISOString();
}

export const feed: FeedItem[] = [...stories, ...richItems, ...generated];
