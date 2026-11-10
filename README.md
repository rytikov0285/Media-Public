# MediaPlatforma

Публичный статический сайт MediaPlatforma.

## Публикация

- Исходники сайта находятся в каталоге `site/`.
- Основная ветка: `main`.
- GitHub Actions автоматически проверяет и публикует сайт в GitHub Pages после изменений в `site/**` или в workflow.
- Публикация выполняется через GitHub Pages Actions: `actions/upload-pages-artifact` и `actions/deploy-pages`.
- Cloudflare Pages не используется.

## Структура

- `site/index.html` — главная страница.
- `site/articles/` — публикации.
- `site/topics/` — тематические разделы.
- `site/assets/` — стили, JavaScript и favicon.
- `site/about.html`, `site/editorial-policy.html`, `site/privacy.html` — информационные страницы.
- `site/robots.txt`, `site/sitemap.xml` — файлы поисковой индексации.
- `site/404.html` — страница ошибки.

## Адрес сайта

После успешного включения GitHub Pages и выполнения workflow:
https://rytikov0285.github.io/Media-Public/

## Как опубликовать изменение

1. Изменить или добавить файл в `site/`.
2. Зафиксировать изменение в `main`.
3. Проверить выполнение workflow **Deploy MediaPlatforma to GitHub Pages** в разделе Actions.
4. После успешного deployment проверить опубликованную страницу.

## Технические ограничения первой версии

Сайт статический: серверная CMS, база данных, аккаунты, комментарии и собственный API не входят в текущую реализацию. Поиск выполняется в браузере по встроенному каталогу публикаций.
