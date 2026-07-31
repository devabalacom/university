/**
 * Single source of truth for the publications index and the article pages.
 * The index page and each article read their kicker, title, lede and facts
 * from here, so the two can never drift apart.
 *
 * Only facts that are actually true of the text belong here. There is no
 * publication date and no declared evidence level for this piece, so neither
 * is listed — an invented one would be exactly what the method forbids.
 */
export interface Publication {
  /** URL segment under /publikacii/ */
  slug: string;
  /** Sequence number as shown in the kicker */
  no: string;
  title: string;
  /** Standfirst on the index */
  lede: string;
  /** Category as the Institute classifies it */
  kind: string;
  /** Numbered sections in the body */
  parts: number;
  /** Works cited */
  sources: number;
  /** Reading estimate at ~140 wpm, the rate this kind of prose actually reads at */
  minutes: number;
  /** Surnames cited, for the index card */
  cites: string[];
}

export const publications: Publication[] = [
  {
    slug: "granicy-predskazuemosti",
    no: "01",
    title: "Границы предсказуемости",
    lede:
      "Что метод может и чего не может. Почему точечный прогноз сложной системы ограничен, а структурная тенденция остаётся предметом исследования.",
    kind: "Теоретическая публикация",
    parts: 8,
    sources: 5,
    minutes: 7,
    cites: ["Лоренц", "Эшби", "Конант", "Ллойд", "Салганик"],
  },
];

export const bySlug = (slug: string) => publications.find((p) => p.slug === slug);
