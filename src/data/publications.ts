/**
 * Single source of truth for the publications index and the article pages.
 * The index page and each article read their kicker, title and lede from here,
 * so the two can never drift apart.
 */
export interface Publication {
  /** URL segment under /publikacii/ */
  slug: string;
  /** Sequence number as shown in the kicker */
  no: string;
  title: string;
  lede: string;
  /** Category as the Institute classifies it */
  kind: string;
}

export const publications: Publication[] = [
  {
    slug: "granicy-predskazuemosti",
    no: "01",
    title: "Границы предсказуемости",
    lede:
      "Что метод может и чего не может. Почему точечный прогноз сложной системы ограничен, а структурная тенденция остаётся предметом исследования.",
    kind: "Теоретическая публикация",
  },
];

export const bySlug = (slug: string) => publications.find((p) => p.slug === slug);
