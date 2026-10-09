import type { Deal, Temperature } from '../store/types';
import { daysAgo, hoursAgo } from './time';

/** Короткая запись сделки; разворачивается в Deal ниже */
interface S {
  id: string;
  num: number;
  title: string;
  st: string;
  c?: string;
  co?: string;
  b: number;
  r: string;
  /** дней назад или готовая ISO-строка */
  cr: number | string;
  since?: number | string;
  closed?: number;
  t: Temperature;
  ch: number;
  pp: number;
  tags: string[];
  fl: string;
  src: string;
  lr?: string;
}

const pipelineOf = (st: string) => (st.startsWith('t-') ? 'p-tender' : st.startsWith('r-') ? 'p-repeat' : 'p-main');
const at = (v: number | string, num: number) => (typeof v === 'string' ? v : daysAgo(v, 9 + (num % 9), (num * 7) % 60));

const seeds: S[] = [
  // ───── Основная воронка: Новый лид
  { id: 'd-hochu-segodnya', num: 4991, title: 'Готов оплатить сегодня', st: 's-new', c: 'c-hochukupit', co: 'co-segodnya', b: 480000, r: 'you', cr: hoursAgo(5), since: hoursAgo(5), t: 'hot', ch: 97, pp: 0, tags: ['горячий — остудить', 'звонил сам', 'просил счёт'], fl: 'Скажем, что склад закрыт на учёт', src: 'Звонок (случайно взяли трубку)' },
  { id: 'd-4988', num: 4988, title: 'Заявка с сайта', st: 's-new', c: 'c-zayavkina', co: 'co-segodnya', b: 64000, r: 'm-perekurov', cr: 1, t: 'hot', ch: 88, pp: 1, tags: ['заявка с сайта'], fl: 'Не дозвонимся', src: 'Сайт' },
  { id: 'd-4985', num: 4985, title: 'Хочет 300 штук до пятницы', st: 's-new', c: 'c-tristashtuk', co: 'co-zakaz', b: 312000, r: 'm-zavtrakova', cr: 2, t: 'hot', ch: 94, pp: 3, tags: ['срочно (не для нас)', 'горячий — остудить'], fl: 'До пятницы не успеем, предложим после праздников', src: 'Рекомендация (как так вышло)' },
  { id: 'd-4983', num: 4983, title: 'Ещё актуально?', st: 's-new', c: 'c-avitov', b: 27500, r: 'm-nedozvonova', cr: 1, t: 'warm', ch: 76, pp: 0, tags: ['avito'], fl: 'Ответим через неделю: «Уже продано»', src: 'Avito' },
  { id: 'd-4980', num: 4980, title: 'Просит прайс', st: 's-new', c: 'c-belova', co: 'co-predoplata', b: 45000, r: 'you', cr: 3, t: 'warm', ch: 81, pp: 1, tags: ['просил прайс'], fl: 'Прайс в разработке', src: 'WhatsApp' },
  { id: 'd-4978', num: 4978, title: 'Можно картой?', st: 's-new', c: 'c-kartoy', b: 18900, r: 'm-soglasuev', cr: 2, t: 'hot', ch: 91, pp: 2, tags: ['готов платить', 'горячий — остудить'], fl: 'Терминал на согласовании', src: 'Сайт' },

  // ───── Не дозвонились
  { id: 'd-zvonkova', num: 4902, title: 'Звонила 23 раза', st: 's-noanswer', c: 'c-zvonkova', co: 'co-buket', b: 156000, r: 'm-nedozvonova', cr: 47, since: 41, t: 'warm', ch: 84, pp: 17, tags: ['звонил сам', 'не брать трубку'], fl: 'Не дозвонилась до нас', src: 'Звонок (случайно взяли трубку)' },
  { id: 'd-4951', num: 4951, title: 'Перезвонить клиенту', st: 's-noanswer', c: 'c-ivanov', b: 88000, r: 'm-perekurov', cr: 14, since: 12, t: 'warm', ch: 72, pp: 6, tags: ['ждёт звонка'], fl: 'Перезвоним, когда он перестанет ждать', src: 'Яндекс.Директ' },
  { id: 'd-4966', num: 4966, title: 'Оставил заявку ночью', st: 's-noanswer', c: 'c-zakharov', b: 39000, r: 'm-nedozvonova', cr: 9, since: 8, t: 'warm', ch: 70, pp: 4, tags: ['ночная заявка'], fl: 'Звонили днём, он спал (наверное)', src: 'Сайт' },
  { id: 'd-4930', num: 4930, title: 'Опт, 40 позиций', st: 's-noanswer', c: 'c-optovikov', co: 'co-srochno', b: 740000, r: 'm-perezvonov', cr: 36, since: 33, t: 'hot', ch: 89, pp: 11, tags: ['опт', 'VIP (опасно)'], fl: 'Минималка не сошлась (мы так решили)', src: 'Выставка (зря ездили)' },
  { id: 'd-4944', num: 4944, title: 'Не дозвонились (мы)', st: 's-noanswer', c: 'c-bystrov', co: 'co-bystro', b: 52000, r: 'm-nedozvonova', cr: 21, since: 19, t: 'warm', ch: 78, pp: 9, tags: ['звонил сам'], fl: 'Номер был занят нами', src: 'Сайт' },
  { id: 'd-4970', num: 4970, title: 'Входящий, пропущен', st: 's-noanswer', c: 'c-zhdanova', b: 23000, r: 'you', cr: 6, since: 5, t: 'warm', ch: 74, pp: 2, tags: ['пропущенный'], fl: 'Незнакомые номера не берём', src: 'Звонок' },
  { id: 'd-4938', num: 4938, title: 'Обратный звонок с сайта', st: 's-noanswer', c: 'c-petrov', b: 71000, r: 'm-zavtrakova', cr: 28, since: 26, t: 'warm', ch: 66, pp: 8, tags: ['обратный звонок'], fl: 'Обратный звонок — завтра с утра', src: 'Виджет обратного звонка' },
  { id: 'd-4870', num: 4870, title: 'Клиент ждёт на линии', st: 's-noanswer', c: 'c-terpeliva', co: 'co-severstroy', b: 96000, r: 'm-nedozvonova', cr: 70, since: 64, t: 'cold', ch: 61, pp: 22, tags: ['ждёт на линии'], fl: 'Музыка на линии ей понравится больше', src: 'Звонок' },

  // ───── КП отправлено (в спам)
  { id: 'd-kp-spam', num: 4893, title: 'КП в пятницу, 18:55', st: 's-kp', c: 'c-kpvspame', co: 'co-gotovy', b: 420000, r: 'm-zavtrakova', cr: 45, since: 37, t: 'warm', ch: 86, pp: 12, tags: ['КП в спаме', 'открыл КП 4 раза'], fl: 'КП не дошло (так задумано)', src: 'Рекомендация (как так вышло)' },
  { id: 'd-4911', num: 4911, title: 'КП на 120 000 (отправили на 360 000)', st: 's-kp', c: 'c-dorogova', b: 360000, r: 'm-soglasuev', cr: 31, since: 29, t: 'warm', ch: 63, pp: 5, tags: ['прайс ×3', 'дорого'], fl: 'Скажем, что дорого', src: 'Instagram' },
  { id: 'd-4855', num: 4855, title: 'Просил КП в Word', st: 's-kp', c: 'c-sokolov', co: 'co-severstroy', b: 215000, r: 'm-perezvonov', cr: 60, since: 54, t: 'cold', ch: 58, pp: 14, tags: ['КП только в PDF'], fl: 'Word у нас не согласован', src: 'Тендерная площадка' },
  { id: 'd-4925', num: 4925, title: 'КП открыли 4 раза', st: 's-kp', c: 'c-reshilov', co: 'co-dogovor', b: 133000, r: 'm-perekurov', cr: 25, since: 22, t: 'hot', ch: 92, pp: 7, tags: ['открыл КП 4 раза', 'горячий — остудить'], fl: 'Не позвоним, пусть откроет пятый', src: 'Сайт' },
  { id: 'd-4948', num: 4948, title: 'Нужно КП до обеда', st: 's-kp', c: 'c-srochnaya', co: 'co-srochno', b: 89000, r: 'm-zavtrakova', cr: 17, since: 15, t: 'warm', ch: 80, pp: 9, tags: ['срочно (не для нас)'], fl: 'Обед уже прошёл', src: 'Email' },
  { id: 'd-4812', num: 4812, title: 'КП (версия 7)', st: 's-kp', c: 'c-kuznetsova', co: 'co-gotovy', b: 270000, r: 'm-soglasuev', cr: 82, since: 71, t: 'cold', ch: 54, pp: 19, tags: ['на согласовании'], fl: 'Версию 8 не согласуют', src: 'Сайт' },
  { id: 'd-4974', num: 4974, title: 'КП для кофейни', st: 's-kp', c: 'c-predoplatin', co: 'co-predoplata', b: 48000, r: 'you', cr: 7, since: 6, t: 'hot', ch: 95, pp: 1, tags: ['предоплата 100%', 'горячий — остудить'], fl: 'Предоплату не принимаем', src: 'Рекомендация (как так вышло)' },

  // ───── Клиент думает
  { id: 'd-sovetchikov', num: 4721, title: 'Советуется с женой', st: 's-think', c: 'c-sovetchikov', b: 185000, r: 'm-perezvonov', cr: 110, since: 96, t: 'cold', ch: 79, pp: 24, tags: ['жена одобрила', 'не верим'], fl: 'Пусть посоветуется ещё раз', src: 'Сарафан' },
  { id: 'd-schet-3', num: 4840, title: 'Просит счёт (третий раз)', st: 's-think', c: 'c-gdeschetova', co: 'co-platezh', b: 264000, r: 'm-perekurov', cr: 66, since: 58, t: 'hot', ch: 99, pp: 21, tags: ['просил счёт', 'звонил сам', 'горячий — остудить'], fl: 'Счёт в работе', src: 'Сайт' },
  { id: 'd-4880', num: 4880, title: 'Думает (мы так решили)', st: 's-think', c: 'c-uzhepodumal', co: 'co-gotovy', b: 76000, r: 'm-zavtrakova', cr: 50, since: 44, t: 'warm', ch: 83, pp: 10, tags: ['уже подумал'], fl: 'Подумает ещё', src: 'Конференция' },
  { id: 'd-vip', num: 4602, title: 'Согласую с руководством', st: 's-think', c: 'c-direktorov', co: 'co-budget', b: 2400000, r: 'm-soglasuev', cr: 150, since: 133, t: 'warm', ch: 87, pp: 31, tags: ['VIP (опасно)', 'бюджет утверждён'], fl: 'Руководство не согласовало (наше)', src: 'Звонок (случайно взяли трубку)' },
  { id: 'd-4790', num: 4790, title: 'Пробная партия', st: 's-think', c: 'c-lesnikov', co: 'co-vorota', b: 58000, r: 'm-perezvonov', cr: 90, since: 81, t: 'cold', ch: 64, pp: 15, tags: ['пробная партия'], fl: 'Пробных партий не делаем', src: 'Выставка (зря ездили)' },
  { id: 'd-4904', num: 4904, title: 'Сравнивает с конкурентами (мы помогли)', st: 's-think', c: 'c-morozova', b: 112000, r: 'm-perekurov', cr: 42, since: 39, t: 'cold', ch: 52, pp: 6, tags: ['сравнивает'], fl: 'Сами дали контакты конкурентов', src: 'Яндекс.Директ' },
  { id: 'd-4688', num: 4688, title: 'Ремонт офиса, 3 этажа', st: 's-think', c: 'c-beznalov', co: 'co-severstroy', b: 1150000, r: 'm-soglasuev', cr: 118, since: 102, t: 'warm', ch: 77, pp: 26, tags: ['бюджет согласован', 'безнал'], fl: 'Безнал у нас не согласован', src: 'Тендерная площадка' },
  { id: 'd-4931', num: 4931, title: 'Хочет скидку 0%', st: 's-think', c: 'c-bezskidkin', b: 94000, r: 'm-zavtrakova', cr: 30, since: 27, t: 'hot', ch: 90, pp: 4, tags: ['без скидки', 'горячий — остудить'], fl: 'Предложим скидку, чтобы засомневался', src: 'Сайт' },
  { id: 'd-4962', num: 4962, title: 'Ждёт договор', st: 's-think', c: 'c-dopyatnicy', co: 'co-tender', b: 168000, r: 'you', cr: 13, since: 11, t: 'hot', ch: 93, pp: 3, tags: ['договор', 'до пятницы'], fl: 'Договор у юриста, юрист в отпуске', src: 'Email' },

  // ───── Перенесено на после праздников
  { id: 'd-poslepraznikov', num: 4410, title: 'Перезвонить после праздников', st: 's-holidays', c: 'c-poslepraznikov', co: 'co-vorota', b: 340000, r: 'm-perezvonov', cr: 290, since: 214, t: 'cold', ch: 81, pp: 38, tags: ['после праздников', 'звонил сам'], fl: 'Праздники не закончатся', src: 'Сайт' },
  { id: 'd-4560', num: 4560, title: 'Вернуться в январе', st: 's-holidays', c: 'c-perevedu', co: 'co-nalichnye', b: 128000, r: 'm-zavtrakova', cr: 140, since: 120, t: 'cold', ch: 73, pp: 18, tags: ['январь'], fl: 'В январе все отдыхают', src: 'Звонок' },
  { id: 'd-4705', num: 4705, title: 'После майских', st: 's-holidays', c: 'c-nalichkin', co: 'co-nalichnye', b: 205000, r: 'm-perekurov', cr: 170, since: 155, t: 'ice', ch: 68, pp: 20, tags: ['майские'], fl: 'Майские прошли, ждём следующих', src: 'Рекомендация (как так вышло)' },
  { id: 'd-4815', num: 4815, title: 'После Дня работника леса', st: 's-holidays', c: 'c-lesnikov', co: 'co-vorota', b: 87000, r: 'm-perezvonov', cr: 63, since: 52, t: 'cold', ch: 70, pp: 9, tags: ['21 сентября'], fl: 'Следующий праздник — День таможенника', src: 'Сайт' },
  { id: 'd-4760', num: 4760, title: 'Когда вернётся бухгалтер', st: 's-holidays', c: 'c-zhduscheta', co: 'co-bystro', b: 64000, r: 'm-perekurov', cr: 101, since: 88, t: 'cold', ch: 75, pp: 13, tags: ['бухгалтер в отпуске'], fl: 'Бухгалтер вернулся, ушёл наш', src: 'Email' },
  { id: 'd-4890', num: 4890, title: 'Новогодний корпоратив (на 2027)', st: 's-holidays', c: 'c-zayavkina', co: 'co-segodnya', b: 390000, r: 'you', cr: 40, since: 34, t: 'warm', ch: 82, pp: 5, tags: ['после праздников', 'корпоратив'], fl: 'Перезвоним после Нового года', src: 'Сайт' },

  // ───── Остыл
  { id: 'd-4612', num: 4612, title: 'Был горячий', st: 's-cold', c: 'c-ivanov', b: 117000, r: 'm-perekurov', cr: 160, since: 70, t: 'ice', ch: 33, pp: 16, tags: ['был горячий'], fl: 'Остыл (наша заслуга)', src: 'Сайт' },
  { id: 'd-4655', num: 4655, title: 'Ждал КП 3 месяца', st: 's-cold', c: 'c-nedozhdalsya', b: 230000, r: 'm-perezvonov', cr: 130, since: 40, t: 'ice', ch: 24, pp: 27, tags: ['КП не отправили'], fl: 'КП почти готово', src: 'Email' },
  { id: 'd-4730', num: 4730, title: 'Писал в WhatsApp', st: 's-cold', c: 'c-snova', b: 41000, r: 'm-nedozvonova', cr: 95, since: 60, t: 'ice', ch: 19, pp: 11, tags: ['две галочки'], fl: 'Прочитано', src: 'WhatsApp' },
  { id: 'd-4801', num: 4801, title: 'Остыл сам (без нашей помощи)', st: 's-cold', c: 'c-ushla', co: 'co-predoplata', b: 56000, r: 'm-zavtrakova', cr: 75, since: 48, t: 'cold', ch: 28, pp: 3, tags: ['остыл сам'], fl: 'Обидно, что без нас', src: 'Instagram' },
  { id: 'd-4588', num: 4588, title: 'Хотел 2 000 штук', st: 's-cold', c: 'c-tristashtuk', co: 'co-zakaz', b: 1640000, r: 'm-soglasuev', cr: 180, since: 77, t: 'ice', ch: 31, pp: 29, tags: ['опт', 'VIP (опасно)'], fl: 'Согласовываем минималку', src: 'Выставка (зря ездили)' },

  // ───── Слит (успешно)
  { id: 'd-ushel', num: 4650, title: 'Ищет поставщика срочно', st: 's-lost', c: 'c-ushel', co: 'co-nalichnye', b: 520000, r: 'm-perekurov', cr: 70, closed: 52, t: 'ice', ch: 0, pp: 8, tags: ['дали номер конкурента'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Ушёл к конкурентам по нашей рекомендации' },
  { id: 'd-tretiy', num: 4700, title: 'Прислала подписанный договор', st: 's-lost', c: 'c-tretiyraz', co: 'co-dogovor', b: 310000, r: 'm-zavtrakova', cr: 64, closed: 23, t: 'ice', ch: 0, pp: 11, tags: ['договор потерян'], fl: 'Уже не нужно', src: 'Email', lr: 'Потеряли подписанный договор' },
  { id: 'd-oplatilby', num: 4310, title: 'Хочет оплатить', st: 's-lost', c: 'c-oplatilby', co: 'co-schetov', b: 97000, r: 'm-soglasuev', cr: 196, closed: 9, t: 'ice', ch: 0, pp: 40, tags: ['просил счёт', 'звонил сам'], fl: 'Уже не нужно', src: 'Звонок (случайно взяли трубку)', lr: 'Полгода пытался оплатить и устал' },
  { id: 'd-4540', num: 4540, title: 'Заказ на 50 000', st: 's-lost', c: 'c-dorogova', b: 50000, r: 'm-soglasuev', cr: 20, closed: 3, t: 'ice', ch: 0, pp: 2, tags: ['дорого'], fl: 'Уже не нужно', src: 'Instagram', lr: 'Сказали, что дорого (клиент не спрашивал)' },
  { id: 'd-4502', num: 4502, title: 'Перезвоните мне', st: 's-lost', c: 'c-petrov', b: 34000, r: 'm-nedozvonova', cr: 49, closed: 7, t: 'ice', ch: 0, pp: 14, tags: ['перезвонили'], fl: 'Уже не нужно', src: 'Виджет обратного звонка', lr: 'Перезвонили через 41 день' },
  { id: 'd-4577', num: 4577, title: 'Счёт для бухгалтерии', st: 's-lost', c: 'c-zhduscheta', co: 'co-bystro', b: 76000, r: 'm-perekurov', cr: 40, closed: 14, t: 'ice', ch: 0, pp: 9, tags: ['просил счёт'], fl: 'Уже не нужно', src: 'Email', lr: 'Счёт согласовывали дольше, чем клиент ждал' },
  { id: 'd-4519', num: 4519, title: 'Звонок с сайта', st: 's-lost', c: 'c-zakharov', b: 29000, r: 'm-perekurov', cr: 22, closed: 19, t: 'ice', ch: 0, pp: 1, tags: ['перекур'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Менеджер был на перекуре' },
  { id: 'd-4490', num: 4490, title: 'Комплект оборудования', st: 's-lost', c: 'c-optovikov', co: 'co-srochno', b: 410000, r: 'm-zavtrakova', cr: 45, closed: 27, t: 'ice', ch: 0, pp: 6, tags: ['не то вложение'], fl: 'Уже не нужно', src: 'Выставка (зря ездили)', lr: 'Отправили КП конкурента (перепутали вложение)' },
  { id: 'd-4466', num: 4466, title: 'Готов подписать', st: 's-lost', c: 'c-dogovorov', co: 'co-dogovor', b: 188000, r: 'm-soglasuev', cr: 60, closed: 33, t: 'ice', ch: 0, pp: 12, tags: ['просил счёт'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Не нашли кнопку «Выставить счёт»' },
  { id: 'd-4455', num: 4455, title: 'Подарочные наборы к 8 Марта', st: 's-lost', c: 'c-perezvonyusama', co: 'co-buket', b: 143000, r: 'm-nedozvonova', cr: 65, closed: 41, t: 'ice', ch: 0, pp: 15, tags: ['сезон'], fl: 'Уже не нужно', src: 'Звонок', lr: 'Перезвонили после 8 Марта' },
  { id: 'd-4431', num: 4431, title: 'Хочет на этой неделе', st: 's-lost', c: 'c-bystrov', co: 'co-bystro', b: 61000, r: 'm-zavtrakova', cr: 55, closed: 48, t: 'ice', ch: 0, pp: 5, tags: ['срочно (не для нас)'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Предложили подождать до весны' },
  { id: 'd-4418', num: 4418, title: 'Входящий звонок', st: 's-lost', c: 'c-kartoy', b: 22000, r: 'm-nedozvonova', cr: 58, closed: 57, t: 'ice', ch: 0, pp: 0, tags: ['взяли трубку'], fl: 'Уже не нужно', src: 'Звонок (случайно взяли трубку)', lr: 'Взяли трубку и сказали «вас не слышно»' },
  { id: 'd-4395', num: 4395, title: 'Мебель в офис', st: 's-lost', c: 'c-hochukupit', co: 'co-segodnya', b: 265000, r: 'm-perekurov', cr: 80, closed: 64, t: 'ice', ch: 0, pp: 7, tags: ['перепутали имя'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Назвали клиента чужим именем (три раза)' },
  { id: 'd-4377', num: 4377, title: 'Закупка на квартал', st: 's-lost', c: 'c-nalichkin', co: 'co-nalichnye', b: 640000, r: 'm-soglasuev', cr: 104, closed: 76, t: 'ice', ch: 0, pp: 18, tags: ['на согласовании'], fl: 'Уже не нужно', src: 'Рекомендация (как так вышло)', lr: 'Цена выросла, пока согласовывали скидку' },
  { id: 'd-4351', num: 4351, title: 'Профильный запрос', st: 's-lost', c: 'c-reshilov', co: 'co-dogovor', b: 99000, r: 'm-perezvonov', cr: 92, closed: 88, t: 'ice', ch: 0, pp: 2, tags: ['не наш профиль'], fl: 'Уже не нужно', src: 'Сайт', lr: 'Ответили «не наш профиль» на профильный запрос' },

  // ───── Инцидент: клиент купил
  { id: 'd-incident-1', num: 3920, title: 'Купила, пока менеджер был в отпуске', st: 's-won', c: 'c-kupilova', co: 'co-schetov', b: 84000, r: 'm-zavtrakova', cr: 230, closed: 211, t: 'hot', ch: 100, pp: 4, tags: ['инцидент', 'разобран'], fl: 'Не повторится', src: 'Сайт' },
  { id: 'd-incident-2', num: 3577, title: 'Оплатил по реквизитам с сайта', st: 's-won', c: 'c-vsezhekupil', co: 'co-segodnya', b: 152000, r: 'm-perekurov', cr: 420, closed: 402, t: 'hot', ch: 100, pp: 9, tags: ['инцидент', 'реквизиты удалены'], fl: 'Не повторится', src: 'Сайт' },

  // ───── Тендеры
  { id: 'd-tender-5min', num: 4775, title: 'Поставка спецодежды, 44-ФЗ', st: 't-lost', c: 'c-tenderov', co: 'co-tender', b: 1870000, r: 'm-soglasuev', cr: 60, closed: 18, t: 'ice', ch: 0, pp: 6, tags: ['44-ФЗ', 'опоздали'], fl: 'Опоздаем', src: 'Тендерная площадка', lr: 'Опоздали с подачей на 5 минут' },
  { id: 'd-t-4972', num: 4972, title: 'Поставка офисной бумаги', st: 't-new', c: 'c-tenderov', co: 'co-tender', b: 380000, r: 'm-perezvonov', cr: 4, t: 'hot', ch: 82, pp: 1, tags: ['44-ФЗ'], fl: 'Не успеем прочитать ТЗ', src: 'Тендерная площадка' },
  { id: 'd-t-4955', num: 4955, title: 'Тендер на клининг, 12 объектов', st: 't-new', c: 'c-bystrov', co: 'co-bystro', b: 940000, r: 'm-zavtrakova', cr: 10, t: 'warm', ch: 74, pp: 3, tags: ['223-ФЗ'], fl: 'Подадим завтра (срок сегодня)', src: 'Тендерная площадка' },
  { id: 'd-t-4921', num: 4921, title: 'ТЗ на 214 страниц', st: 't-unread', c: 'c-beznalov', co: 'co-severstroy', b: 2100000, r: 'm-soglasuev', cr: 26, since: 25, t: 'warm', ch: 71, pp: 8, tags: ['ТЗ не открывали'], fl: 'Дочитаем после срока подачи', src: 'Тендерная площадка' },
  { id: 'd-t-4940', num: 4940, title: 'Запрос котировок', st: 't-unread', c: 'c-direktorov', co: 'co-budget', b: 450000, r: 'm-perekurov', cr: 20, since: 19, t: 'warm', ch: 69, pp: 5, tags: ['котировки'], fl: 'Котировки устарели', src: 'Email' },
  { id: 'd-t-4860', num: 4860, title: 'Подали без выписки ЕГРЮЛ', st: 't-nodocs', c: 'c-dopyatnicy', co: 'co-tender', b: 760000, r: 'm-soglasuev', cr: 55, since: 30, t: 'cold', ch: 40, pp: 9, tags: ['нет документов'], fl: 'Заявку отклонят, всё по плану', src: 'Тендерная площадка' },
  { id: 'd-t-4872', num: 4872, title: 'Забыли подписать ЭЦП', st: 't-nodocs', c: 'c-sokolov', co: 'co-severstroy', b: 515000, r: 'm-perekurov', cr: 49, since: 28, t: 'cold', ch: 37, pp: 7, tags: ['ЭЦП на флешке', 'флешка дома'], fl: 'Флешка с ЭЦП осталась дома', src: 'Тендерная площадка' },
  { id: 'd-t-4833', num: 4833, title: 'Электронный аукцион: мебель', st: 't-late', c: 'c-zayavkina', co: 'co-segodnya', b: 1320000, r: 'm-nedozvonova', cr: 58, since: 21, t: 'cold', ch: 22, pp: 4, tags: ['опоздали'], fl: 'Часы на площадке спешат', src: 'Тендерная площадка' },
  { id: 'd-t-4610', num: 4610, title: 'Аукцион со снижением 0%', st: 't-lost', c: 'c-direktorov', co: 'co-budget', b: 880000, r: 'm-soglasuev', cr: 100, closed: 61, t: 'ice', ch: 0, pp: 10, tags: ['принципиально'], fl: 'Не снизим', src: 'Тендерная площадка', lr: 'Снизили цену на 0%, из принципа' },
  { id: 'd-t-3810', num: 3810, title: 'Случайно выиграли аукцион', st: 't-won', c: 'c-tenderov', co: 'co-tender', b: 1240000, r: 'm-perezvonov', cr: 330, closed: 300, t: 'hot', ch: 100, pp: 2, tags: ['инцидент', 'единственный участник'], fl: 'Не повторится', src: 'Тендерная площадка' },

  // ───── Повторные продажи
  { id: 'd-r-4977', num: 4977, title: 'Хочет ещё 200 штук', st: 'r-new', c: 'c-povtornokupin', co: 'co-zakaz', b: 210000, r: 'm-zavtrakova', cr: 5, t: 'hot', ch: 96, pp: 2, tags: ['повторный', 'горячий — остудить'], fl: 'Сделаем вид, что не помним', src: 'Повторное обращение (недосмотрели)' },
  { id: 'd-r-4964', num: 4964, title: 'Третий заказ (не допустить)', st: 'r-new', c: 'c-eshchehochu', co: 'co-buket', b: 67000, r: 'you', cr: 8, t: 'hot', ch: 94, pp: 1, tags: ['повторный', 'VIP (опасно)'], fl: 'Предложим подождать до весны', src: 'Повторное обращение (недосмотрели)' },
  { id: 'd-r-4910', num: 4910, title: 'Постоянный клиент вернулся', st: 'r-forgot', c: 'c-snova', b: 45000, r: 'm-perekurov', cr: 24, since: 22, t: 'warm', ch: 85, pp: 6, tags: ['не узнали'], fl: '«Вы у нас впервые?»', src: 'WhatsApp' },
  { id: 'd-r-4876', num: 4876, title: 'Как в прошлый раз', st: 'r-forgot', c: 'c-kupilova', co: 'co-schetov', b: 84000, r: 'm-zavtrakova', cr: 38, since: 36, t: 'warm', ch: 88, pp: 9, tags: ['повторный', 'после инцидента'], fl: 'Прошлый раз не помним', src: 'Звонок' },
  { id: 'd-r-4799', num: 4799, title: 'Подождите до следующего квартала', st: 'r-wait', c: 'c-vsezhekupil', co: 'co-segodnya', b: 152000, r: 'm-perekurov', cr: 70, since: 65, t: 'cold', ch: 71, pp: 14, tags: ['квартал'], fl: 'Квартал перенесём', src: 'Email' },
  { id: 'd-r-4520', num: 4520, title: 'Ушёл навсегда (наконец)', st: 'r-lost', c: 'c-ushla', co: 'co-predoplata', b: 39000, r: 'm-nedozvonova', cr: 90, closed: 44, t: 'ice', ch: 0, pp: 12, tags: ['навсегда'], fl: 'Уже не нужно', src: 'Повторное обращение (недосмотрели)', lr: 'Сделали вид, что не узнали. Клиент поверил' },
  { id: 'd-r-4100', num: 4100, title: 'Купил повторно', st: 'r-won', c: 'c-povtornokupin', co: 'co-zakaz', b: 198000, r: 'm-zavtrakova', cr: 160, closed: 150, t: 'hot', ch: 100, pp: 3, tags: ['инцидент', 'повторный'], fl: 'Не повторится (повторно)', src: 'Повторное обращение (недосмотрели)' },
];

export const deals: Deal[] = seeds.map((s) => {
  const createdAt = at(s.cr, s.num);
  const closedAt = s.closed !== undefined ? daysAgo(s.closed, 10 + (s.num % 8), (s.num * 13) % 60) : undefined;
  const deal: Deal = {
    id: s.id,
    num: s.num,
    title: s.title,
    pipelineId: pipelineOf(s.st),
    stageId: s.st,
    contactId: s.c,
    companyId: s.co,
    budget: s.b,
    responsibleId: s.r,
    createdAt,
    stageSince: closedAt ?? (s.since !== undefined ? at(s.since, s.num + 3) : createdAt),
    tags: s.tags,
    temperature: s.t,
    buyChance: s.ch,
    futureLossReason: s.fl,
    source: s.src,
    postpones: s.pp,
  };
  if (closedAt) deal.closedAt = closedAt;
  if (s.lr) deal.lossReason = s.lr;
  return deal;
});
