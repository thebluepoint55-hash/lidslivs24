import type { Task, TaskType } from '../store/types';
import { deals } from './deals';
import { daysAgo, inDays } from './time';

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
];

export const tasks: Task[] = seeds.map((s) => {
  const deal = s.deal ? deals.find((x) => x.id === s.deal) : undefined;
  const task: Task = {
    id: s.id,
    type: s.type,
    text: s.text,
    due: s.due,
    responsibleId: s.r,
    done: s.result !== undefined,
    postpones: s.pp,
    createdAt: d(s.cr, 9, 30),
  };
  if (s.deal) task.dealId = s.deal;
  const contactId = s.contact ?? deal?.contactId;
  if (contactId) task.contactId = contactId;
  if (s.result) task.result = s.result;
  return task;
});
