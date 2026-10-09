import type { AuthorId, ChatMessage, ChatThread } from '../store/types';
import { daysAgo, hoursAgo } from './time';

const d = daysAgo;

function thread(
  id: string,
  contactId: string,
  dealId: string,
  channel: ChatThread['channel'],
  unread: number,
  ignored: boolean,
  msgs: [AuthorId, string, string][],
): ChatThread {
  const messages: ChatMessage[] = msgs.map(([from, text, at], i) => ({ id: `${id}-m${i + 1}`, from, text, at }));
  return { id, contactId, dealId, channel, unread, ignored, messages };
}

export const chats: ChatThread[] = [
  thread('ch-1', 'c-hochukupit', 'd-hochu-segodnya', 'whatsapp', 3, false, [
    ['client', 'Добрый день! Это Борис, я вам звонил. Жду счёт', hoursAgo(4)],
    ['client', 'Наши реквизиты отправил на почту', hoursAgo(2)],
    ['client', 'Ну что там?', hoursAgo(1)],
  ]),
  thread('ch-2', 'c-gdeschetova', 'd-schet-3', 'whatsapp', 2, false, [
    ['client', 'Добрый день! Я третий раз прошу счёт', d(12, 11, 2)],
    ['client', 'Можно я просто переведу деньги по номеру карты?', d(12, 11, 3)],
    ['m-perekurov', 'Марина, добрый день! Счёт почти готов, уточняю у бухгалтерии', d(12, 14, 50)],
    ['client', 'Добрый день, где счёт?', hoursAgo(26)],
    ['client', 'Виталий, вы на связи?', hoursAgo(3)],
  ]),
  thread('ch-3', 'c-oplatilby', 'd-oplatilby', 'telegram', 0, true, [
    ['client', 'Давайте я пришлю платёжку, а счёт вы потом оформите?', d(100, 10, 12)],
    ['m-soglasuev', 'Эдуард, добрый день. Без счёта, к сожалению, не можем. Счёт на согласовании', d(99, 17, 40)],
    ['client', 'Как там согласование?', d(60, 11, 0)],
    ['client', 'Можно я просто переведу деньги?', d(20, 9, 30)],
    ['client', 'Понял, всего доброго', d(10, 19, 2)],
  ]),
  thread('ch-4', 'c-zvonkova', 'd-zvonkova', 'telegram', 1, true, [
    ['client', 'Вы вообще работаете? Хочу заказ на 156 000', d(21, 11, 10)],
    ['client', 'Звоню вам каждый день с часу до трёх', d(14, 15, 5)],
    ['client', 'Возьмите трубку, пожалуйста. Это последняя попытка', d(2, 13, 45)],
  ]),
  thread('ch-5', 'c-avitov', 'd-4983', 'avito', 2, false, [
    ['client', 'Здравствуйте, ещё актуально?', d(1, 20, 14)],
    ['client', 'Заберу сегодня, могу сам подъехать', d(1, 20, 15)],
    ['client', 'Алло', hoursAgo(14)],
  ]),
  thread('ch-6', 'c-tretiyraz', 'd-tretiy', 'whatsapp', 0, false, [
    ['client', 'Отправили подписанный договор, сканы у вас на почте', d(52, 11, 35)],
    ['m-zavtrakova', 'Спасибо! Завтра посмотрю', d(51, 18, 40)],
    ['client', 'Я третий раз пишу. Договор дошёл?', d(44, 12, 0)],
    ['m-zavtrakova', 'Тамара, а вы точно его отправляли?', d(40, 18, 50)],
    ['client', 'Всего доброго', d(30, 9, 15)],
  ]),
  thread('ch-7', 'c-predoplatin', 'd-4974', 'max', 1, false, [
    ['client', 'Здравствуйте! Нужна кофемашина в кофейню. Готовы внести 100% предоплату', d(6, 10, 5)],
    ['you', 'Добрый день! Передал руководству, вернусь с ответом', d(5, 16, 0)],
    ['client', 'Предоплата в силе, если что', hoursAgo(20)],
  ]),
  thread('ch-8', 'c-sovetchikov', 'd-sovetchikov', 'whatsapp', 0, true, [
    ['client', 'Жена спрашивает, когда привезут', d(90, 20, 15)],
    ['m-perezvonov', 'Виктор, не торопитесь. Посоветуйтесь ещё', d(89, 10, 35)],
    ['client', 'Посоветовались. Голосовое от жены на почте', d(70, 21, 2)],
    ['client', 'Можем приехать вдвоём и оплатить на месте', d(31, 19, 40)],
  ]),
  thread('ch-9', 'c-zayavkina', 'd-4988', 'site', 1, false, [
    ['client', 'Оставила заявку на офисные столы, 12 штук. Перезвоните, пожалуйста', d(1, 11, 40)],
    ['robot', 'Спасибо за обращение! Мы ответим в течение 3–5 рабочих недель', d(1, 11, 40)],
    ['client', 'Скажите хотя бы цену', hoursAgo(6)],
  ]),
  thread('ch-10', 'c-eshchehochu', 'd-r-4964', 'telegram', 2, false, [
    ['client', 'Здравствуйте! Хотим повторить заказ, как в прошлый раз', d(8, 10, 0)],
    ['you', 'Добрый день! Подскажите, вы у нас уже заказывали?', d(7, 15, 20)],
    ['client', 'Да, два раза. Номер заказа 4100', d(7, 15, 22)],
    ['client', 'Можно оплатить по старому счёту?', hoursAgo(30)],
  ]),
  thread('ch-11', 'c-belova', 'd-4980', 'whatsapp', 1, false, [
    ['client', 'Пришлите прайс, пожалуйста', d(3, 9, 50)],
    ['client', 'Можно без прайса. Сколько стоит зерно, 10 кг?', hoursAgo(9)],
  ]),
  thread('ch-12', 'c-kartoy', 'd-4978', 'site', 0, false, [
    ['client', 'Можно оплатить картой прямо на сайте?', d(2, 12, 0)],
    ['m-soglasuev', 'Татьяна, добрый день! Уточню у руководства', d(2, 15, 30)],
    ['client', 'Уточнили?', d(1, 10, 0)],
    ['m-soglasuev', 'Пока согласовываем', d(1, 17, 55)],
  ]),
  thread('ch-13', 'c-dopyatnicy', 'd-4962', 'telegram', 1, false, [
    ['client', 'Договор нужен до пятницы, иначе бюджет сгорит', d(4, 11, 0)],
    ['you', 'Анна, договор у юриста', d(3, 17, 30)],
    ['client', 'Юрист ещё в отпуске? Напоминаю про пятницу', hoursAgo(2)],
  ]),
];
