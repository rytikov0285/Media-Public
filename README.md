# MediaPlatforma

Публичный статический сайт MediaPlatforma.

## Публикация через GitHub Pages

- Исходники сайта находятся в каталоге `site/`.
- Основная ветка: `main`.
- GitHub Actions проверяет сайт и публикует его в GitHub Pages после изменений в `site/**` или в workflow.
- Cloudflare Pages не используется.

### Однократная настройка репозитория

До первого deployment необходимо включить GitHub Pages:

1. Открыть **Settings → Pages** в репозитории.
2. В разделе **Build and deployment** выбрать **Source: GitHub Actions**.
3. После сохранения повторно запустить workflow **Deploy MediaPlatforma to GitHub Pages** в разделе Actions.

Это действие требуется один раз. `GITHUB_TOKEN` имеет право публиковать Pages, но не может самостоятельно создать/включить Pages site через административный API. Поэтому workflow не пытается включать Pages автоматически.

## Структура

- `site/index.html` — главная страница.
- `site/articles/` — публикации.
- `site/topics/` — тематические разделы.
- `site/assets/` — стили, JavaScript и favicon.
- `site/about.html`, `site/editorial-policy.html`, `site/privacy.html` — информационные страницы.
- `site/robots.txt`, `site/sitemap.xml` — файлы поисковой индексации.
- `site/404.html` — страница ошибки.

## Адрес сайта

После включения GitHub Pages и успешного выполнения workflow:
https://rytikov0285.github.io/Media-Public/

## Как опубликовать изменение

1. Изменить или добавить файл в `site/`.
2. Зафиксировать изменение в `main`.
3. Проверить выполнение workflow **Deploy MediaPlatforma to GitHub Pages** в разделе Actions.
4. После успешного deployment проверить опубликованную страницу.

## Контроль качества\n\nПеред публикацией GitHub Actions проверяет HTML, метаданные, локальные ссылки и якоря, JSON-LD, CSP, sitemap.xml, robots.txt и синтаксис JavaScript. Затем Playwright запускает браузерные проверки всех страниц, мобильной навигации, поиска и горизонтального переполнения на распространённых ширинах экрана.\n\n## Технические ограничения первой версии

Сайт статический: серверная CMS, база данных, аккаунты, комментарии и собственный API не входят в текущую реализацию. Поиск выполняется в браузере по встроенному каталогу публикаций.
