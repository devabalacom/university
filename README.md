# PSAI · Институт предиктивной архитектуры систем

Сайт-визитка института, построенный на [Astro](https://astro.build) как статический сайт (без клиентского фреймворка, минимум JS).

## Структура

```text
/
├── public/
│   ├── img/            генеративные иллюстрации (hero, метод, институт)
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── components/      Header, Footer, Mark (SVG-логотип)
    ├── layouts/         Base.astro: head/meta/тема/reveal-скрипт
    ├── styles/          global.css: дизайн-токены + компонентные стили
    └── pages/
        ├── index.astro                              Главная
        ├── metod/index.astro                         Метод
        ├── primenenie/index.astro                    Применение
        ├── institut/index.astro                      Институт
        └── publikacii/
            ├── index.astro                           Список публикаций
            └── granitsy-predskazuemosti/index.astro  Публикация 01
```

## Что нужно поменять перед запуском в продакшен

- `astro.config.mjs`: `site` указывает на `https://psai-institute.ru` (плейсхолдер) — заменить на реальный домен.
- `public/robots.txt` и `public/sitemap.xml`: обновить домен там же.
- `src/components/Footer.astro` и `src/layouts/Base.astro`: контактный email `info@psai-institute.ru` — плейсхолдер, заменить на реальный адрес (или форму).

## Команды

| Команда         | Действие                                   |
| :-------------- | :------------------------------------------ |
| `bun install`    | установка зависимостей                      |
| `bun dev`        | dev-сервер на `localhost:4321`               |
| `bun run build`  | сборка в `./dist/`                           |
| `bun run preview`| локальный просмотр собранной версии          |

## Дизайн

Тёмно-синий (`navy`) + золото (`gold`) на бумажном фоне, serif `Literata` для текста и mono `IBM Plex Mono` для лейблов/навигации. Поддержаны светлая и тёмная темы (переключатель в шапке, сохраняется в `localStorage`). Анимация ограничена мягким появлением секций при скролле и уважает `prefers-reduced-motion`.
