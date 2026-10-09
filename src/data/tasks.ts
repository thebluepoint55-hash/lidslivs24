import type { Task, TaskType } from '../store/types';
import { stages } from './base';
import { deals } from './deals';
import { FEMALE, PATHS, fill, mulberry32 } from './feedLib';
import { daysAgo, hoursAgo, inDays, minutesAgo } from './time';

interface T {
  id: string;
  deal?: string;
  contact?: string;
  type: TaskType;
  text: string;
  due: string;
  r: string;
  pp: number;
  /** дней назад */
  cr: number;
  result?: string;
}

const d = daysAgo;

const seeds: T[] = [
  // Сегодня
  { id: 't-1', deal: 'd-hochu-segodnya', type: 'followup', text: 'Выставить счёт до 17:00', due: inDays(0, 17, 0), r: 'you', pp: 0, cr: 0 },
  { id: 't-2', deal: 'd-kp-spam', type: 'kp', text: 'Отправить КП в пятницу вечером', due: inDays(0, 18, 55), r: 'm-zavtrakova', pp: 12, cr: 44 },
  { id: 't-3', deal: 'd-r-4964', type: 'call', text: 'Сделать вид, что не узнали', due: inDays(0, 15, 0), r: 'you', pp: 1, cr: 8 },
  { id: 't-4', deal: 'd-4985', type: 'followup', text: 'Объяснить, что до пятницы не успеем', due: inDays(0, 12, 0), r: 'm-zavtrakova', pp: 3, cr: 2 },

  // Завтра и позже
  { id: 't-5', deal: 'd-4974', type: 'think', text: 'Подумать о клиенте', due: inDays(1, 11, 0), r: 'you', pp: 1, cr: 6 },
  { id: 't-6', deal: 'd-4962', type: 'followup', text: 'Передать договор юристу (юрист в отпуске)', due: inDays(1, 11, 0), r: 'you', pp: 3, cr: 11 },
  { id: 't-7', deal: 'd-r-4977', type: 'call', text: 'Перезвонить и не узнать клиента', due: inDays(1, 14, 0), r: 'm-zavtrakova', pp: 2, cr: 5 },
  { id: 't-8', deal: 'd-4978', type: 'followup', text: 'Согласовать оплату картой', due: inDays(2, 10, 0), r: 'm-soglasuev', pp: 2, cr: 2 },
  { id: 't-9', deal: 'd-poslepraznikov', type: 'call', text: 'Позвонить после Дня таможенника', due: inDays(16, 10, 0), r: 'm-perezvonov', pp: 38, cr: 288 },
  { id: 't-10', deal: 'd-4560', type: 'call', text: 'Вернуться к клиенту в январе', due: inDays(95, 10, 0), r: 'm-zavtrakova', pp: 18, cr: 120 },
  { id: 't-11', deal: 'd-4890', type: 'meeting', text: 'Обсудить корпоратив (после Нового года)', due: inDays(97, 12, 0), r: 'you', pp: 5, cr: 34 },
  { id: 't-12', deal: 'd-4705', type: 'call', text: 'Позвонить после следующих майских', due: inDays(215, 10, 0), r: 'm-perekurov', pp: 20, cr: 155 },

  // Просроченные (гордость отдела)
  { id: 't-13', deal: 'd-schet-3', type: 'followup', text: 'Выставить счёт (завтра)', due: d(1, 10, 0), r: 'm-perekurov', pp: 21, cr: 66 },
  { id: 't-14', deal: 'd-zvonkova', type: 'call', text: 'Перезвонить (не будем)', due: d(12, 13, 30), r: 'm-nedozvonova', pp: 17, cr: 46 },
  { id: 't-15', deal: 'd-sovetchikov', type: 'call', text: 'Узнать, что решила жена', due: d(30, 19, 0), r: 'm-perezvonov', pp: 24, cr: 110 },
  { id: 't-16', deal: 'd-vip', type: 'meeting', text: 'Встреча по договору (перенести)', due: d(5, 11, 0), r: 'm-soglasuev', pp: 31, cr: 149 },
  { id: 't-17', deal: 'd-4980', type: 'kp', text: 'Отправить прайс (когда будет)', due: d(2, 16, 0), r: 'you', pp: 1, cr: 3 },
  { id: 't-18', deal: 'd-4970', type: 'call', text: 'Перезвонить на пропущенный', due: d(4, 12, 0), r: 'you', pp: 2, cr: 5 },
  { id: 't-19', deal: 'd-4930', type: 'call', text: 'Связаться: напомнить о себе (не будем)', due: d(20, 10, 0), r: 'm-perezvonov', pp: 11, cr: 33 },
  { id: 't-20', deal: 'd-4951', type: 'call', text: 'Перезвонить клиенту', due: d(9, 15, 0), r: 'm-perekurov', pp: 6, cr: 12 },
  { id: 't-21', deal: 'd-4966', type: 'call', text: 'Позвонить днём (клиент, наверное, спит)', due: d(6, 14, 0), r: 'm-nedozvonova', pp: 4, cr: 8 },
  { id: 't-22', deal: 'd-4944', type: 'call', text: 'Перезвонить', due: d(15, 13, 0), r: 'm-nedozvonova', pp: 9, cr: 19 },
  { id: 't-23', deal: 'd-4938', type: 'call', text: 'Обратный звонок (завтра с утра)', due: d(20, 9, 0), r: 'm-zavtrakova', pp: 8, cr: 26 },
  { id: 't-24', deal: 'd-4870', type: 'call', text: 'Снять клиента с удержания на линии', due: d(60, 11, 0), r: 'm-nedozvonova', pp: 22, cr: 64 },
  { id: 't-25', deal: 'd-4911', type: 'kp', text: 'Пересчитать КП ×3', due: d(25, 17, 0), r: 'm-soglasuev', pp: 5, cr: 29 },
  { id: 't-26', deal: 'd-4855', type: 'kp', text: 'Сохранить КП в Word (найти Word)', due: d(50, 10, 0), r: 'm-perezvonov', pp: 14, cr: 54 },
  { id: 't-27', deal: 'd-4925', type: 'think', text: 'Подумать, зачем клиент открыл КП 4 раза', due: d(18, 16, 0), r: 'm-perekurov', pp: 7, cr: 22 },
  { id: 't-28', deal: 'd-4948', type: 'kp', text: 'Отправить КП до обеда', due: d(15, 13, 0), r: 'm-zavtrakova', pp: 9, cr: 15 },
  { id: 't-29', deal: 'd-4812', type: 'kp', text: 'Согласовать КП (версия 8)', due: d(40, 12, 0), r: 'm-soglasuev', pp: 19, cr: 71 },
  { id: 't-30', deal: 'd-4880', type: 'think', text: 'Дать клиенту подумать ещё', due: d(10, 10, 0), r: 'm-zavtrakova', pp: 10, cr: 44 },
  { id: 't-31', deal: 'd-4688', type: 'meeting', text: 'Встреча на объекте (перенести)', due: d(70, 11, 0), r: 'm-soglasuev', pp: 26, cr: 102 },
  { id: 't-32', deal: 'd-4931', type: 'followup', text: 'Предложить скидку, чтобы засомневался', due: d(3, 15, 0), r: 'm-zavtrakova', pp: 4, cr: 27 },
  { id: 't-33', deal: 'd-4760', type: 'followup', text: 'Узнать, вернулся ли бухгалтер', due: d(40, 10, 0), r: 'm-perekurov', pp: 13, cr: 88 },
  { id: 't-34', deal: 'd-4655', type: 'kp', text: 'Доделать КП (почти готово)', due: d(35, 18, 0), r: 'm-perezvonov', pp: 27, cr: 130 },
  { id: 't-35', deal: 'd-t-4921', type: 'think', text: 'Прочитать ТЗ (214 страниц)', due: d(3, 10, 0), r: 'm-soglasuev', pp: 8, cr: 25 },
  { id: 't-36', deal: 'd-t-4872', type: 'followup', text: 'Привезти флешку с ЭЦП из дома', due: d(28, 9, 0), r: 'm-perekurov', pp: 7, cr: 30 },
  { id: 't-37', contact: 'c-perezvonyusama', type: 'call', text: 'Напомнить о себе', due: d(7, 11, 0), r: 'm-nedozvonova', pp: 6, cr: 20 },

  // Выполненные
  { id: 't-38', deal: 'd-4519', type: 'call', text: 'Перезвонить после перекура', due: d(21, 13, 5), r: 'm-perekurov', pp: 3, cr: 22, result: 'Перезвонил через 19 дней. Клиент удивился' },
  { id: 't-39', deal: 'd-4540', type: 'kp', text: 'Сказать, что дорого', due: d(4, 12, 0), r: 'm-soglasuev', pp: 0, cr: 15, result: 'Сказал. Клиент про цену не спрашивал, но спорить не стал' },
  { id: 't-40', deal: 'd-4418', type: 'call', text: 'Взять трубку', due: d(57, 14, 0), r: 'm-nedozvonova', pp: 0, cr: 58, result: 'Взяла, сказала «вас не слышно». Выполнено' },
  { id: 't-41', deal: 'd-4431', type: 'followup', text: 'Предложить подождать до весны', due: d(49, 10, 0), r: 'm-zavtrakova', pp: 1, cr: 54, result: 'Клиент подождёт до весны у конкурентов' },
  { id: 't-42', deal: 'd-ushel', type: 'followup', text: 'Отправить контакты конкурентов', due: d(66, 18, 0), r: 'm-perekurov', pp: 0, cr: 69, result: 'Отправил три. Клиенту понравился второй' },

  // ───── Новые открытые задачи: у каждой открытой сделки есть хотя бы одна
  { id: 't2-1', deal: 'd-4988', type: 'call', text: 'Перезвонить по заявке (после перекура)', due: d(1, 12, 0), r: 'm-perekurov', pp: 1, cr: 1 },
  { id: 't2-2', deal: 'd-4983', type: 'followup', text: 'Ответить в Avito «Уже продано»', due: inDays(6, 10, 0), r: 'm-nedozvonova', pp: 0, cr: 1 },
  { id: 't2-3', deal: 'd-4790', type: 'call', text: 'Мягко объяснить, что пробных партий не делаем', due: d(12, 11, 0), r: 'm-perezvonov', pp: 6, cr: 80 },
  { id: 't2-4', deal: 'd-4904', type: 'followup', text: 'Скинуть клиенту ещё пару конкурентов', due: d(8, 15, 0), r: 'm-perekurov', pp: 3, cr: 38 },
  { id: 't2-5', deal: 'd-4815', type: 'call', text: 'Поздравить с Днём работника леса (прошёл)', due: d(18, 10, 0), r: 'm-perezvonov', pp: 9, cr: 50 },
  { id: 't2-6', deal: 'd-4612', type: 'call', text: 'Позвонить и убедиться, что точно остыл', due: d(30, 14, 0), r: 'm-perekurov', pp: 16, cr: 68 },
  { id: 't2-7', deal: 'd-4730', type: 'followup', text: 'Прочитать сообщения в WhatsApp (не отвечать)', due: d(25, 12, 0), r: 'm-nedozvonova', pp: 5, cr: 58 },
  { id: 't2-8', deal: 'd-4801', type: 'think', text: 'Разобраться, как он остыл без нас', due: d(20, 11, 0), r: 'm-zavtrakova', pp: 3, cr: 47 },
  { id: 't2-9', deal: 'd-4588', type: 'followup', text: 'Согласовать минималку (2 000 штук мало?)', due: d(45, 10, 0), r: 'm-soglasuev', pp: 29, cr: 170 },
  { id: 't2-10', deal: 'd-t-4972', type: 'think', text: 'Открыть ТЗ (не спешить)', due: inDays(1, 11, 0), r: 'm-perezvonov', pp: 1, cr: 4 },
  { id: 't2-11', deal: 'd-t-4955', type: 'followup', text: 'Подать заявку завтра (срок сегодня)', due: inDays(1, 10, 0), r: 'm-zavtrakova', pp: 3, cr: 9 },
  { id: 't2-12', deal: 'd-t-4940', type: 'kp', text: 'Обновить котировки (устарели)', due: d(6, 16, 0), r: 'm-perekurov', pp: 5, cr: 19 },
  { id: 't2-13', deal: 'd-t-4860', type: 'followup', text: 'Дослать выписку ЕГРЮЛ (не досылать)', due: d(29, 12, 0), r: 'm-soglasuev', pp: 9, cr: 31 },
  { id: 't2-14', deal: 'd-t-4833', type: 'followup', text: 'Написать жалобу на часы площадки', due: d(19, 15, 0), r: 'm-nedozvonova', pp: 4, cr: 21 },
  { id: 't2-15', deal: 'd-r-4910', type: 'call', text: 'Спросить, откуда клиент о нас узнал', due: d(20, 11, 0), r: 'm-perekurov', pp: 6, cr: 22 },
  { id: 't2-16', deal: 'd-r-4876', type: 'call', text: 'Уточнить, что было «в прошлый раз» (не уточнять)', due: d(33, 14, 0), r: 'm-zavtrakova', pp: 9, cr: 36 },
  { id: 't2-17', deal: 'd-r-4799', type: 'followup', text: 'Перенести квартал', due: inDays(83, 10, 0), r: 'm-perekurov', pp: 14, cr: 65 },

  // ───── Вторые задачи
  { id: 't2-18', deal: 'd-hochu-segodnya', type: 'think', text: 'Спросить наставника, можно ли брать деньги', due: hoursAgo(-3), r: 'you', pp: 0, cr: 0 },
  { id: 't2-19', deal: 'd-4980', type: 'followup', text: 'Узнать, есть ли у нас прайс', due: inDays(2, 12, 0), r: 'you', pp: 0, cr: 2 },
  { id: 't2-20', deal: 'd-4970', type: 'call', text: 'Выяснить, чей это был номер', due: d(2, 15, 0), r: 'you', pp: 1, cr: 4 },
  { id: 't2-21', deal: 'd-4974', type: 'think', text: 'Спросить наставника, почему предоплату брать нельзя', due: d(1, 17, 0), r: 'you', pp: 0, cr: 6 },
  { id: 't2-22', deal: 'd-4962', type: 'followup', text: 'Найти юриста (в отпуске)', due: d(3, 11, 0), r: 'you', pp: 2, cr: 10 },
  { id: 't2-23', deal: 'd-4890', type: 'followup', text: 'Отправить открытку к Новому году (без цены)', due: inDays(78, 12, 0), r: 'you', pp: 0, cr: 30 },
  { id: 't2-24', deal: 'd-r-4964', type: 'followup', text: 'Найти прошлый заказ и спрятать', due: d(2, 16, 0), r: 'you', pp: 1, cr: 7 },
  { id: 't2-25', deal: 'd-schet-3', type: 'followup', text: 'Найти программу, в которой выставляют счета', due: d(5, 12, 0), r: 'm-perekurov', pp: 8, cr: 40 },
  { id: 't2-26', deal: 'd-zvonkova', type: 'call', text: 'Включить звук на телефоне (не включать)', due: d(9, 13, 0), r: 'm-nedozvonova', pp: 4, cr: 30 },
  { id: 't2-27', deal: 'd-kp-spam', type: 'followup', text: 'Проверить, дошло ли КП (не проверять)', due: d(20, 10, 0), r: 'm-zavtrakova', pp: 6, cr: 36 },
  { id: 't2-28', deal: 'd-vip', type: 'meeting', text: 'Согласовать согласование', due: d(14, 11, 0), r: 'm-soglasuev', pp: 12, cr: 60 },
  { id: 't2-29', deal: 'd-sovetchikov', type: 'followup', text: 'Предложить посоветоваться с тёщей', due: inDays(3, 19, 0), r: 'm-perezvonov', pp: 0, cr: 8 },
  { id: 't2-30', deal: 'd-4985', type: 'think', text: 'Посчитать, сколько штук успеем к пятнице (утром, после кофе)', due: d(1, 10, 0), r: 'm-zavtrakova', pp: 1, cr: 1 },
  { id: 't2-31', deal: 'd-4978', type: 'followup', text: 'Найти, у кого ключ от терминала', due: d(1, 15, 0), r: 'm-soglasuev', pp: 1, cr: 2 },
  { id: 't2-32', deal: 'd-4951', type: 'think', text: 'Найти номер клиента (был записан на пачке)', due: d(11, 12, 0), r: 'm-perekurov', pp: 4, cr: 13 },
  { id: 't2-33', deal: 'd-4930', type: 'call', text: 'Не забыть про опт (через месяц)', due: inDays(24, 11, 0), r: 'm-perezvonov', pp: 3, cr: 30 },
  { id: 't2-34', deal: 'd-4870', type: 'think', text: 'Узнать, кто поставил клиента на удержание', due: d(50, 10, 0), r: 'm-nedozvonova', pp: 7, cr: 63 },
  { id: 't2-35', deal: 'd-4925', type: 'call', text: 'Позвонить, когда клиент откроет КП в пятый раз', due: d(9, 18, 0), r: 'm-perekurov', pp: 2, cr: 21 },
  { id: 't2-36', deal: 'd-4948', type: 'call', text: 'Узнать, когда у клиента обед', due: d(14, 12, 0), r: 'm-zavtrakova', pp: 3, cr: 15 },
  { id: 't2-37', deal: 'd-4812', type: 'kp', text: 'Собрать подписи под версией 7', due: d(55, 15, 0), r: 'm-soglasuev', pp: 11, cr: 70 },
  { id: 't2-38', deal: 'd-4688', type: 'followup', text: 'Согласовать безнал', due: d(60, 11, 0), r: 'm-soglasuev', pp: 18, cr: 100 },
  { id: 't2-39', deal: 'd-4931', type: 'think', text: 'Придумать, за что дать скидку', due: d(5, 16, 0), r: 'm-zavtrakova', pp: 2, cr: 26 },
  { id: 't2-40', deal: 'd-4655', type: 'kp', text: 'Найти, где лежит КП', due: d(45, 12, 0), r: 'm-perezvonov', pp: 9, cr: 90 },
  { id: 't2-41', deal: 'd-4560', type: 'call', text: 'Объяснить клиенту, почему нельзя просто перевести', due: d(5, 11, 0), r: 'm-zavtrakova', pp: 2, cr: 6 },
  { id: 't2-42', deal: 'd-t-4921', type: 'followup', text: 'Распечатать ТЗ (согласовать 214 листов бумаги)', due: d(12, 10, 0), r: 'm-soglasuev', pp: 5, cr: 24 },
  { id: 't2-43', deal: 'd-t-4872', type: 'think', text: 'Найти флешку', due: d(26, 10, 0), r: 'm-perekurov', pp: 6, cr: 28 },
  { id: 't2-44', deal: 'd-r-4977', type: 'followup', text: 'Найти прошлый счёт (не найти)', due: d(3, 12, 0), r: 'm-zavtrakova', pp: 1, cr: 4 },
];

const seedTasks: Task[] = seeds.map((s) => {
  const deal = s.deal ? deals.find((x) => x.id === s.deal) : undefined;
  const task: Task = {
    id: s.id,
    type: s.type,
    text: s.text,
    due: s.due,
    responsibleId: s.r,
    done: s.result !== undefined,
    postpones: s.pp,
    createdAt: s.cr === 0 ? minutesAgo(200) : d(s.cr, 9, 30),
  };
  if (s.deal) task.dealId = s.deal;
  const contactId = s.contact ?? deal?.contactId;
  if (contactId) task.contactId = contactId;
  if (s.result) task.result = s.result;
  return task;
});

// ───────────── Выполненные задачи в прошлом открытых сделок ─────────────
// [тип, текст, результат]; родовые формы — по безответственному

const DONE: Record<string, [TaskType, string, string][]> = {
  's-new': [
    ['call', 'Связаться с клиентом в течение 5 минут', 'Связал{ся|ась} через 3 дня. Клиент помнит, что что-то хотел'],
    ['followup', 'Разобрать неразобранное', 'Разобрал{а}. Две заявки переложил{а} в «Разобрать потом»'],
    ['call', 'Квалифицировать лида', 'Квалифицировал{а}: «клиент норм»'],
    ['followup', 'Ответить на заявку с сайта', 'Ответил{а} в WhatsApp. Клиент писал на почту. Связь установлена частично'],
    ['think', 'Понять, чего хочет клиент', 'Клиент хочет купить. Подозрения подтвердились'],
    ['call', 'Позвонить в выходной, пока клиент свободен', 'Позвонил{а} в субботу в 8:00. Клиент был свободен, но не рад'],
    ['followup', 'Внести контакт в CRM', '{Внёс|Внесла}. Телефон записал{а} без последней цифры, для интриги'],
  ],
  's-noanswer': [
    ['call', 'Перезвонить клиенту', 'Перезвонил{а}. Занято, у клиента тоже обед'],
    ['call', 'Дозвониться', '{Дозвонился|Дозвонилась} до однофамильца. Поговорили хорошо'],
    ['call', 'Выяснить бюджет', 'Не выяснил{а}. Неудобно спрашивать про деньги'],
    ['call', 'Выяснить, кто принимает решение', 'Решение принимает клиент. Записал{а}'],
    ['followup', 'Написать «Не смогли до вас дозвониться»', 'Написал{а}. Клиент ответил, что сам звонил 6 раз'],
    ['call', 'Перезвонить на пропущенный', 'Перезвонил{а} через 2 дня. Звонил клиент из другой сделки'],
    ['call', 'Позвонить до обеда', 'Позвонил{а} после обеда. Клиент ушёл на обед'],
    ['think', 'Внести результат звонка в CRM', '{Внёс|Внесла}: «поговорили»'],
  ],
  's-kp': [
    ['meeting', 'Встреча с клиентом', 'Перенесли. Третий раз, традиция'],
    ['meeting', 'Встреча в офисе клиента', '{Приехал|Приехала} без презентации. Рассказал{а} по памяти, клиент поправлял'],
    ['kp', 'Подготовить КП', 'Подготовил{а} из КП для другого клиента. Имя заменил{а} не везде'],
    ['kp', 'Отправить КП', 'Отправил{а}. Без вложения'],
    ['kp', 'Отправить КП с вложением', 'Отправил{а} с вложением. Вложение от другого клиента'],
    ['kp', 'Обновить цены в КП', 'Обновил{а} на прошлогодние'],
    ['kp', 'Отправить КП в пятницу', 'Отправил{а} в 18:55. Клиент прочитал в понедельник, в спаме'],
    ['think', 'Зафиксировать договорённости встречи', 'Зафиксировал{а}: «договорились»'],
    ['kp', 'Согласовать КП с Арсением', 'Арсений согласовал согласование. КП ждёт следующего круга'],
    ['call', 'Узнать, получил ли клиент КП', 'Получил. Спросил, почему цена в три раза выше'],
  ],
  's-think': [
    ['followup', 'Напомнить о себе', 'Написал{а} «Ну что там?». Клиент спросил то же самое'],
    ['think', 'Дать клиенту подумать', 'Дал{а}. Клиент подумал и спросил, где счёт'],
    ['followup', 'Отправить договор', 'Отправил{а} юристу. Юрист в отпуске, автоответ пришёл вовремя'],
    ['followup', 'Выставить счёт', 'Выставил{а} на 0 ₽. Клиент оплатить не смог'],
    ['followup', 'Выставить счёт заново', 'Выставил{а} на реквизиты другой компании. Почти получилось'],
    ['followup', 'Проверить оплату', 'Оплату не {нашёл|нашла}. Искал{а} в почте'],
    ['call', 'Отработать возражение «дорого»', 'Клиент не возражал. Возразил{а} за него'],
    ['followup', 'Получить оригиналы договора', 'Ждём Почтой России. Трек с прошлого месяца показывает «прибыло в сортировочный центр»'],
    ['call', 'Позвонить и дожать', 'Позвонил{а}, не дожал{а}. Клиент сам хотел, давить было неудобно'],
    ['followup', 'Согласовать скидку', 'Пообещал{а} 10%. Согласовали 0%. Клиенту пока не говорил{а}'],
    ['followup', 'Передать дела перед отпуском', 'Передал{а} себе же. Вернусь, разберусь'],
    ['think', 'Решить, что делать со сделкой', 'Решили подумать'],
    ['followup', 'Отправить платёжные реквизиты', 'Отправил{а} старые. Банк вернул платёж, клиент удивился'],
    ['call', 'Сообщить клиенту, пришли ли деньги', 'Сообщил{а}, что не пришли. Деньги пришли'],
  ],
  's-holidays': [
    ['call', 'Позвонить после праздников', 'Праздники продолжаются. Перенесено'],
    ['followup', 'Поздравить клиента с праздником', 'Поздравил{а}. О заказе в открытке ни слова'],
    ['call', 'Уточнить планы клиента на праздники', 'Клиент работает все праздники. Мы нет'],
    ['think', 'Выбрать следующий праздник', 'Выбран День работника леса. Запасной: День таможенника'],
  ],
  's-cold': [
    ['call', 'Проверить, не остыл ли клиент', 'Остыл. Проверка подтвердилась'],
    ['followup', 'Реанимировать сделку', 'Написал{а} «Вы ещё с нами?». Прочитано, не отвечено. Теперь мы квиты'],
    ['followup', 'Отправить клиенту полезную рассылку', 'Отправил{а} прайс 2023 года'],
  ],
  't-new': [
    ['think', 'Скачать документацию', 'Скачал{а}. Открыть нечем'],
    ['followup', 'Зарегистрироваться на площадке', 'Регистрация на согласовании'],
    ['think', 'Решить, участвуем ли', 'Участвуем, но не сильно'],
  ],
  't-unread': [
    ['think', 'Прочитать ТЗ', 'Прочитал{а} первую и последнюю страницу. В середине, говорят, ничего важного'],
    ['think', 'Задать заказчику вопрос по ТЗ', 'Задал{а}. Ответ был на 3-й странице ТЗ'],
  ],
  't-nodocs': [
    ['followup', 'Собрать документы на подачу', 'Собрал{а} 9 из 14. Остальные, наверное, не обязательные'],
    ['followup', 'Подписать заявку ЭЦП', 'ЭЦП на флешке, флешка в куртке, куртка в химчистке'],
    ['followup', 'Заказать выписку ЕГРЮЛ', 'Заказал{а}. Изготовят после окончания подачи'],
  ],
  't-late': [
    ['followup', 'Подать заявку до 12:00', 'Подал{а} в 12:03. Почти'],
    ['think', 'Сверить часы с площадкой', 'Сверил{а}. Наши отстают на 5 минут, оставили как есть'],
  ],
  'r-new': [
    ['think', 'Вспомнить клиента', 'Не вспомнил{а}. Записал{а} как нового'],
    ['call', 'Перезвонить по повторному заказу', 'Перезвонил{а}, спросил{а}, откуда клиент о нас узнал'],
    ['followup', 'Найти прошлый заказ', '{Нашёл|Нашла} и спрятал{а} обратно'],
  ],
  'r-forgot': [
    ['call', 'Сделать вид, что не узнали', 'Сделал{а}. Клиент назвал номер прошлого счёта'],
    ['followup', 'Отправить анкету нового клиента', 'Отправил{а}. Клиент заполнил её третий раз'],
  ],
  'r-wait': [
    ['followup', 'Предложить подождать до следующего квартала', 'Предложил{а}. Клиент спросил, какого года'],
    ['call', 'Напомнить, что ещё рано', 'Напомнил{а}. Клиент начал искать других'],
  ],
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const NOW = Date.parse(minutesAgo(0));
const openKinds = new Set(['open', 'payment']);
let doneCounter = 0;

const doneTasks: Task[] = deals
  .filter((deal) => openKinds.has(stages.find((s) => s.id === deal.stageId)?.kind ?? '') && PATHS[deal.id])
  .flatMap((deal) => {
    const path = PATHS[deal.id];
    const rnd = mulberry32(deal.num * 31 + 5);
    const rint = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
    const start = Date.parse(deal.createdAt);
    const since = Date.parse(deal.stageSince);
    const end = NOW - 2 * HOUR;
    if (end - start < 2 * HOUR) return [];
    const k = path.length;
    // окно этапа: последний этап — от stageSince, остальные делят время до него поровну
    const windowOf = (i: number): [number, number] => {
      if (k === 1) return [start, end];
      if (i === k - 1) return [since, end];
      const span = since - start;
      return [start + (span * i) / (k - 1), start + (span * (i + 1)) / (k - 1)];
    };
    const life = (end - start) / DAY;
    const count = Math.min(2 + (rnd() < 0.45 ? 1 : 0) + (life > 60 && rnd() < 0.4 ? 1 : 0), 5);
    const female = FEMALE.has(deal.responsibleId);
    const used = new Set<string>();
    const out: Task[] = [];
    for (let j = 0; j < count; j++) {
      const i = (j + rint(0, k - 1)) % k;
      const lib = DONE[path[i]] ?? [];
      const choices = lib.filter(([, text]) => !used.has(text));
      if (!choices.length) continue;
      const [type, text, result] = choices[rint(0, choices.length - 1)];
      used.add(text);
      const [a, b] = windowOf(i);
      let due = a + (b - a) * (0.2 + rnd() * 0.7);
      const day = new Date(due);
      day.setHours(rint(10, 18), rint(0, 59), 0, 0);
      if (+day > a && +day < Math.min(b, end)) due = +day;
      const created = Math.max(start + 10 * 60_000, due - rint(1, 6) * DAY);
      doneCounter += 1;
      out.push({
        id: `t2d-${doneCounter}`,
        dealId: deal.id,
        contactId: deal.contactId,
        type,
        text,
        due: new Date(due).toISOString(),
        responsibleId: deal.responsibleId,
        done: true,
        result: fill(result, {}, female),
        postpones: rint(0, 7),
        createdAt: new Date(Math.min(created, due - 30 * 60_000)).toISOString(),
      });
    }
    return out;
  });

export const tasks: Task[] = [...seedTasks, ...doneTasks];
