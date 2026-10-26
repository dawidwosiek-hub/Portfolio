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

for (const width of [390, 768, 1440]) test(`process review keeps artwork visible and usable at ${width}px`, async ({page, request}) => {
  const errors:string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width, height:1000});
  await page.goto(preview);
  await expect(page.locator('h1')).toContainText('Wyrazisty projekt.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => {image.loading='eager'; await image.decode();}));
  });

  // Every supplied design view is already visible in the story, without expanding a disclosure.
  await expect(page.locator('.process-case details')).toHaveCount(0);
  const artworks = page.locator('.process-case [data-artwork]');
  await expect(artworks).toHaveCount(10);
  for (const artwork of await artworks.all()) {
    await artwork.scrollIntoViewIfNeeded();
    await expect(artwork).toBeVisible();
    const box = await artwork.boundingBox();
    expect(box?.height).toBeGreaterThan(25);
    await expect(artwork.locator('svg image')).toHaveCount(1);
  }
  const artworkURLs = await page.locator('.process-case [data-artwork] svg image').evaluateAll(images =>
    [...new Set(images.map(image => image.getAttribute('href') || image.getAttribute('xlink:href') || ''))],
  );
  for (const url of artworkURLs) {
    expect(url).toMatch(/^\/media\//);
    const resource = await request.get(url);
    expect(resource.status()).toBe(200);
    expect(resource.headers()['content-type']).toContain('image/');
  }

  // Stage links must reach the matching, visible content, including the last link on small screens.
  const navigation = page.getByRole('navigation', {name:'Etapy projektu'});
  for (const id of ['kierunek', 'samochod', 'przestrzen', 'lodz', 'zastosowanie']) {
    await navigation.locator(`a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }

  // Both films are visible and playable without opening anything or starting sound automatically.
  const videos = page.locator('.process-case video');
  await expect(videos).toHaveCount(2);
  for (const video of await videos.all()) {
    await expect(video).toBeVisible();
    expect(await video.getAttribute('autoplay')).toBeNull();
    expect(await video.evaluate((v:HTMLVideoElement) => v.controls && v.muted && v.paused)).toBe(true);
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((v:HTMLVideoElement) => v.play());
    await expect.poll(() => video.evaluate((v:HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
    await page.locator('#zastosowanie').scrollIntoViewIfNeeded();
    await expect.poll(() => video.evaluate((v:HTMLVideoElement) => v.paused)).toBe(true);
  }

  // Enlarging keeps the same artwork crop; both ways of closing return focus to its trigger.
  const trigger = artworks.first();
  const sourceViewBox = await trigger.locator('svg').getAttribute('viewBox');
  const sourceImage = await trigger.locator('svg image').getAttribute('href');
  const dialog = page.getByRole('dialog');
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dialog-artwork svg')).toHaveAttribute('viewBox', sourceViewBox!);
  await expect(dialog.locator('svg image')).toHaveAttribute('href', sourceImage!);
  const clipTargets = await dialog.locator('[clip-path]').evaluateAll(elements => elements.map(element => {
    const id = element.getAttribute('clip-path')?.match(/^url\(#(.+)\)$/)?.[1];
    return Boolean(id && element.closest('svg')?.querySelector(`[id="${id}"]`));
  }));
  expect(clipTargets.length).toBeGreaterThan(0);
  expect(clipTargets.every(Boolean)).toBe(true);
  await dialog.getByRole('button', {name:/Zamknij/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  expect(errors).toEqual([]);
});
