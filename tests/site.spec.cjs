const { test, expect } = require('@playwright/test');
const pages = ['/', '/404.html', '/about.html', '/editorial-policy.html', '/privacy.html', '/articles/household-budget.html', '/articles/protect-accounts.html', '/articles/travel-checklist.html', '/articles/verify-information.html', '/topics/everyday-life.html', '/topics/guides.html', '/topics/technology.html'];
const navigationPages = pages.filter((path) => path !== '/404.html');

test.describe('Published page routes and runtime', () => {
  for (const route of pages) test(`loads ${route} with document metadata`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(route);
    expect(response, route).not.toBeNull();
    expect(response.status(), route).toBe(200);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    expect(errors, `JavaScript errors on ${route}`).toEqual([]);
  });

  test('all local pages and assets have no failed network responses', async ({ page }) => {
    const failures = [];
    page.on('response', (response) => {
      if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    for (const route of pages) await page.goto(route);
    expect(failures).toEqual([]);
  });
});

test('mobile primary navigation opens, exposes links and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of navigationPages) {
    await page.goto(route);
    const toggle = page.locator('#menuToggle'), nav = page.locator('#primaryNav');
    await expect(toggle, route).toBeVisible();
    await expect(nav, route).toBeHidden();
    await toggle.click();
    await expect(nav, route).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.locator('a').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
});

test('search dialog returns focus, supports Escape and finds indexed articles', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Открыть поиск' });
  await open.click();
  const panel = page.locator('#searchPanel');
  await expect(panel).toHaveAttribute('aria-hidden', 'false');
  await page.locator('#siteSearch').fill('бюджет');
  await expect(page.locator('.search-result')).toContainText('Личный бюджет');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('aria-hidden', 'true');
  await expect(open).toBeFocused();
  const principles = page.getByRole('link', { name: /Как мы работаем/ });
  await principles.focus();
  await page.keyboard.press('Escape');
  await expect(principles).toBeFocused();
});

test('no horizontal page overflow at common viewport widths', async ({ page }) => {
  for (const route of pages) {
    await page.goto(route);
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(dimensions.content, `${route} overflows at ${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport);
    }
  }
});

test('sitemap and robots are served and mutually consistent', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml');
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toHaveLength(11);
  expect(new Set(urls).size).toBe(urls.length);
  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.status()).toBe(200);
  const robots = await robotsResponse.text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain('Sitemap: https://news4me.ru/sitemap.xml');
});

test('search is available across the site and matches all query terms', async ({ page }) => {
  await page.goto('/articles/protect-accounts.html');
  const open = page.getByRole('button', { name: 'Открыть поиск' });
  await expect(open).toBeVisible();
  await open.click();
  await page.locator('#siteSearch').fill('цифровая защита');
  await expect(page.locator('.search-result')).toHaveCount(1);
  await expect(page.locator('.search-result')).toContainText('защиты личных аккаунтов');
  await page.keyboard.press('Escape');
  await expect(page.locator('#searchPanel')).toHaveAttribute('aria-hidden', 'true');
});

test('home filters articles by topic and restores the complete list', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#latest .feature-card');
  await expect(cards).toHaveCount(4);
  await page.getByRole('button', { name: 'Технологии', exact: true }).click();
  await expect(cards.filter({ hasText: 'Цифровая гигиена' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Личный бюджет' })).toBeHidden();
  await page.getByRole('button', { name: 'Все материалы' }).click();
  await expect(cards).toHaveCount(4);
  await expect(cards.filter({ hasText: 'Личный бюджет' })).toBeVisible();
});

test('saved articles persist locally and appear in the home collection', async ({ page }) => {
  await page.goto('/articles/household-budget.html');
  const save = page.getByRole('button', { name: 'Сохранить материал' });
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await save.click();
  await expect(page.getByRole('button', { name: 'Сохранено' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('mediaplatforma:saved:v1') || '[]'))).toContain('household-budget');
  await page.goto('/');
  await expect(page.locator('#savedSection .saved-card')).toHaveCount(1);
  await expect(page.locator('#savedSection')).toContainText('Личный бюджет');
  await page.goto('/articles/household-budget.html');
  await page.getByRole('button', { name: 'Сохранено' }).click();
  await expect(page.getByRole('button', { name: 'Сохранить материал' })).toHaveAttribute('aria-pressed', 'false');
});

test('article tools expose reading progress, share and active contents navigation', async ({ page }) => {
  await page.goto('/articles/verify-information.html');
  await expect(page.locator('.reading-progress')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Сохранить материал' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible();
  await expect(page.locator('.article-aside a[href="#section-1"]')).toBeVisible();
  await page.locator('#section-3').scrollIntoViewIfNeeded();
  await expect(page.locator('.reading-progress').evaluate(el => el.value)).resolves.toBeGreaterThan(0);
});
