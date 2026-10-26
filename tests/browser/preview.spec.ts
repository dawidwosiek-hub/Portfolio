import {test, expect} from '@playwright/test';

const preview = '/podglad/odwroceni-c0ec4c60be97';

test('review stays outside published portfolio and search indexes', async ({request}) => {
  const response = await request.get(preview);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
  expect(response.headers()['cache-control']).toContain('no-store');
  for (const path of ['/', '/realizacje', '/sitemap.xml']) {
    const html = await (await request.get(path)).text();
    expect(html).not.toContain(preview);
    expect(html).not.toContain('odwroceni-projekty-oklejen');
  }
  expect((await request.get('/realizacje/odwroceni-projekty-oklejen')).status()).toBe(404);
});

for (const width of [390, 1440]) test(`online review loads and plays supplied films at ${width}px`, async ({page}) => {
  const errors:string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width, height:1000});
  await page.goto(preview);
  await expect(page.locator('h1')).toHaveText('Odwróceni.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => {image.loading='eager'; await image.decode();}));
  });
  await expect(page.locator('video')).toHaveCount(2);
  for (const video of await page.locator('video').all()) {
    expect(await video.getAttribute('autoplay')).toBeNull();
    expect(await video.evaluate((v:HTMLVideoElement) => v.muted && v.paused)).toBe(true);
  }
  const main = page.locator('.main-film video');
  await main.scrollIntoViewIfNeeded();
  await main.evaluate((v:HTMLVideoElement) => v.play());
  await expect.poll(() => main.evaluate((v:HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
  await page.locator('#zakres').scrollIntoViewIfNeeded();
  await expect.poll(() => main.evaluate((v:HTMLVideoElement) => v.paused)).toBe(true);
  const alternate = page.locator('.alternate');
  await alternate.locator('summary').click();
  const film = alternate.locator('video');
  await film.scrollIntoViewIfNeeded();
  await film.evaluate((v:HTMLVideoElement) => v.play());
  await expect.poll(() => film.evaluate((v:HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
  await alternate.locator('summary').click();
  await expect.poll(() => film.evaluate((v:HTMLVideoElement) => v.paused)).toBe(true);
  const source = page.locator('.source-disclosure').first();
  await source.locator('summary').click();
  await source.locator('a').first().click();
  await expect(page.getByRole('dialog', {name:'Podgląd materiału'})).toBeVisible();
  await page.getByRole('dialog').locator('img').evaluate((image:HTMLImageElement) => image.decode());
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});
