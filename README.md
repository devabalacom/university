# PSAI · Институт предиктивной архитектуры систем

Текст, дизайн и вёрстка — 1:1 порт исходного одностраничного макета (навигация на `#хэшах`), но разложенный на настоящие страницы/URL вместо хэш-роутинга. Astro, без клиентского фреймворка.

## Структура

```text
/
└── src/
    ├── components/      Header, Footer
    ├── layouts/         Base.astro: head/meta + подключение стилей
    ├── styles/          global.css — CSS исходного макета один в один
    └── pages/
        ├── index.astro                Главная
        ├── metod/index.astro          Метод
        ├── primenenie/index.astro     Применение
        ├── institut/index.astro       Институт
        └── publikacii/index.astro     Публикации (статья открывается на той же странице, как в исходнике)
```

## Деплой

GitHub Pages через `.github/workflows/deploy.yml`: пуш в `main` собирает и деплоит автоматически. Адрес: **https://devabalacom.github.io/university/**.

Сайт живёт под подпутём `/university/` (`base` в `astro.config.mjs`), поэтому внутренние ссылки собираются через `import.meta.env.BASE_URL`.

## Команды

| Команда         | Действие                                   |
| :-------------- | :------------------------------------------ |
| `bun install`    | установка зависимостей                      |
| `bun dev`        | dev-сервер на `localhost:4321`               |
| `bun run build`  | сборка в `./dist/`                           |
| `bun run preview`| локальный просмотр собранной версии          |
