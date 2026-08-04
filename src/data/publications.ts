/**
 * Single source of truth for the publications index and the article pages.
 * The index page and each article read their kicker, title, lede and facts
 * from here, so the two can never drift apart.
 *
 * Only facts that are actually true of the text belong here. `parts` is the
 * number of numbered sections in the body, `sources` the number of works in
 * its literature list, `cites` the surnames of those works and `minutes` a
 * reading estimate at ~140 wpm, the rate this kind of prose actually reads at.
 * There is no publication date and no declared evidence level for these
 * pieces, so neither is listed — an invented one would be exactly what the
 * method forbids.
 */
export interface Publication {
  /** URL segment under /publikacii/ */
  slug: string;
  /** Sequence number as shown in the kicker */
  no: string;
  title: string;
  /** Standfirst on the index and the article */
  lede: string;
  /** Section of the index this piece is filed under */
  group: string;
  /** Numbered sections in the body */
  parts: number;
  /** Works cited */
  sources: number;
  /** Reading estimate at ~140 wpm */
  minutes: number;
  /** Surnames cited, for the index card */
  cites: string[];
}

/** Index sections, in the order the Institute files them. */
export const groups: string[] = [
  "Основания и границы",
  "Современные вызовы",
  "Человек и роль",
];

export const publications: Publication[] = [
  {
    slug: "granicy-predskazuemosti",
    no: "02",
    title: "Границы предсказуемости",
    lede:
      "Что метод может и чего не может. Пределы, установленные не Институтом.",
    group: "Основания и границы",
    parts: 8,
    sources: 5,
    minutes: 7,
    cites: ["Лоренц", "Эшби", "Конант", "Ллойд", "Салганик"],
  },
  {
    slug: "upravlenie-opiraetsya-na-model",
    no: "07",
    title: "Управление уже опирается на модель. Вопрос — какую",
    lede:
      "Наличие модели системы у того, кто ею управляет, не является преимуществом одних управленцев перед другими. Это доказанное необходимое условие управления как такового. Различаются не те, у кого модель есть, и те, у кого её нет, — различаются явные модели и неявные.",
    group: "Основания и границы",
    parts: 6,
    sources: 3,
    minutes: 4,
    cites: ["Конант", "Эшби", "Фрэнсис"],
  },
  {
    slug: "mera-stavshaya-celyu",
    no: "06",
    title: "Мера, ставшая целью: где проходит граница применения",
    lede:
      "Закон Гудхарта — единственное серьёзное возражение против регулярного измерения архитектуры. Он применим, и Институт обозначает, при каком режиме использования метод перестаёт работать.",
    group: "Основания и границы",
    parts: 6,
    sources: 5,
    minutes: 5,
    cites: ["Гудхарт", "Кэмпбелл", "Стратерн", "Манхейм", "Мюллер"],
  },
  {
    slug: "prigodnost-i-odin-ball",
    no: "08",
    title: "Почему пригодность нельзя свести к одному баллу",
    lede:
      "Соответствие человека работе, организации, группе и руководителю — различные виды соответствия с различными последствиями. Оценка, сводящая их в единый показатель, теряет именно ту информацию, ради которой проводится.",
    group: "Основания и границы",
    parts: 5,
    sources: 3,
    minutes: 4,
    cites: ["Кристоф-Браун", "Фогель", "Эдвардс"],
  },
  {
    slug: "ii-i-upravlencheskiy-haos",
    no: "11",
    title: "Почему искусственный интеллект не устраняет управленческий хаос",
    lede:
      "Инструмент ускоряет то, что уже происходит. Если система рассогласована, ускорение делает рассогласование быстрее, а не меньше. Это не прогноз — это уже измерено на первых волнах внедрения.",
    group: "Современные вызовы",
    parts: 6,
    sources: 4,
    minutes: 5,
    cites: ["Бриньольфсон", "Аджемоглу", "DORA", "MIT Sloan"],
  },
  {
    slug: "masshtabirovanie-razrushaet",
    no: "09",
    title: "Почему масштабирование разрушает то, что сделало компанию успешной",
    lede:
      "Рост не добавляет к работающей системе новую нагрузку. Он разрушает условие, на котором система работала. Механизм этого разрушения посчитан и известен более полувека.",
    group: "Современные вызовы",
    parts: 6,
    sources: 3,
    minutes: 5,
    cites: ["Брукс", "Схолтес", "Чжоу"],
  },
  {
    slug: "deficit-kadrov",
    no: "10",
    title: "Почему дефицит кадров чаще оказывается дефектом конструкции, а не нехваткой людей",
    lede:
      "Открытая вакансия не доказывает, что подходящих людей нет. Она доказывает лишь, что роль в её нынешнем виде не заполняется. Это разные утверждения, и различие между ними имеет цену.",
    group: "Современные вызовы",
    parts: 6,
    sources: 3,
    minutes: 5,
    cites: ["Каппелли", "Лазир", "Макгиннесс"],
  },
  {
    slug: "skorost-izmeneniy",
    no: "12",
    title: "Почему скорость изменений становится выше способности организаций адаптироваться",
    lede:
      "Проблема не в том, что среда меняется. Проблема в том, что разнообразие ответов системы набирается медленнее, чем среда порождает новые состояния. Соотношение этих двух скоростей подчиняется закону, доказанному как математическая неизбежность.",
    group: "Современные вызовы",
    parts: 6,
    sources: 3,
    minutes: 5,
    cites: ["Эшби", "Бир", "Конант"],
  },
  {
    slug: "chto-platit-nositel",
    no: "01",
    title: "Что платит носитель за разрыв, созданный системой",
    lede:
      "Разрыв между тем, что роль требует, и тем, что система для неё обеспечила, не исчезает. Его закрывает носитель. Цена этого измерена.",
    group: "Человек и роль",
    parts: 7,
    sources: 4,
    minutes: 6,
    cites: ["Карасек", "Босма", "Купер", "Кристоф-Браун"],
  },
  {
    slug: "sootvetstvie-roli",
    no: "03",
    title: "Соответствие роли: результат, установленный до нас",
    lede:
      "Тезис о том, что исход определяется соответствием, а не компетентностью, установлен шестьюдесятью годами эмпирических исследований. Институт наследует этот результат и обозначает, где проходит граница меры, которой он получен.",
    group: "Человек и роль",
    parts: 6,
    sources: 5,
    minutes: 5,
    cites: ["Жак", "Кристоф-Браун"],
  },
  {
    slug: "verhniy-uroven-cherez-nizhniy",
    no: "05",
    title: "Верхний уровень действует только через нижний",
    lede:
      "Положение о том, что уровень является функцией для вышестоящего и ограничением для нижестоящего, установлено независимо от Института — в исследованиях соответствия человека и среды. Из него следует, почему усиление работающего уровня не устраняет отказ соседнего.",
    group: "Человек и роль",
    parts: 6,
    sources: 3,
    minutes: 5,
    cites: ["Фогель", "Кристоф-Браун", "Эдвардс"],
  },
  {
    slug: "arhitektura-sozdatelya",
    no: "04",
    title: "Архитектура системы повторяет архитектуру её создателя",
    lede:
      "Наблюдение, сделанное в 1968 году, проверено на ста сорока двух эмпирических исследованиях. Оно распространено, но не универсально — и механизм исключений важнее самого правила.",
    group: "Человек и роль",
    parts: 6,
    sources: 4,
    minutes: 4,
    cites: ["Конвей", "Саймон", "Болдуин", "Колфер"],
  },
];

export const bySlug = (slug: string) => publications.find((p) => p.slug === slug);

export const inGroup = (group: string) => publications.filter((p) => p.group === group);

/** 1 часть / 2 части / 5 частей — the count forms the meta lines need. */
export const plural = (n: number, forms: [string, string, string]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
};

export const partsLabel = (n: number) => `${n} ${plural(n, ["часть", "части", "частей"])}`;
export const sourcesLabel = (n: number) => `${n} ${plural(n, ["источник", "источника", "источников"])}`;
