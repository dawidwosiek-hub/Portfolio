import {test, expect} from '@playwright/test';

const previousPreview = '/podglad/odwroceni-c0ec4c60be97';
const projectPath = '/realizacje/odwroceni-projekty-oklejen';

test('approved Odwróceni is published, discoverable and keeps the old shared link', async ({page, request}) => {
  const redirect = await request.get(previousPreview, {maxRedirects:0});
  expect(redirect.status()).toBe(301);
  expect(redirect.headers()['location']).toBe(projectPath);
  const response = await request.get(projectPath);
  expect(response.status()).toBe(200);
  expect(response.headers()['x-robots-tag'] || '').not.toContain('noindex');
  const html = await response.text();
  expect(html).not.toContain('PODGLĄD DO OCENY');
  for (const path of ['/', '/realizacje', '/sitemap.xml', '/oferta/druk-i-reklama']) {
    const html = await (await request.get(path)).text();
    expect(html).toContain(projectPath);
    expect(html).not.toContain('href="'+previousPreview+'"');
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await expect(page.locator('.hero-work a')).toHaveAttribute('href',projectPath);
  const cards = page.locator('.work-section .project');
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll(cards=>cards.map(card=>{const r=card.getBoundingClientRect();return {x:r.x,y:r.y};}));
  expect(boxes[0].y).toBeCloseTo(boxes[1].y,0);
  expect(boxes[2].y).toBeCloseTo(boxes[3].y,0);
  expect(boxes[0].x).toBeCloseTo(boxes[2].x,0);
  await page.goto('/realizacje');
  await page.getByRole('button',{name:'oklejenia',exact:true}).click();
  await expect(page.locator('.project:visible h3')).toHaveText(['Odwróceni']);
  await page.locator('.project:visible').click();
  await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
  await expect(page.locator('[name="project"]')).toHaveValue('Odwróceni');
  await expect(page.locator('#service')).toHaveValue('druk-i-reklama');
});

for (const width of [390, 768, 1440]) test(`published process keeps artwork visible and usable at ${width}px`, async ({page, request}) => {
  const errors:string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width, height:1000});
  await page.goto(projectPath);
  await expect(page.locator('h1')).toContainText('Odwróceni.');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','http://127.0.0.1:4321'+projectPath);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => {image.loading='eager'; await image.decode();}));
  });

  // Every supplied design view is already visible in the story, without expanding a disclosure.
  await expect(page.locator('.process-case details')).toHaveCount(0);
  const artworks = page.locator('.process-case [data-artwork]');
  await expect(artworks).toHaveCount(9);
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

  // New scene compositions stay fully visible in their original 3:2 aspect ratio.
  const scenes = page.locator('.process-case [data-scene],.process-case [data-scene-src]');
  await expect(scenes).toHaveCount(3);
  for (const scene of await scenes.all()) {
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toBeVisible();
    const image = scene.locator('img');
    if(await image.count()){
     await image.evaluate((i:HTMLImageElement)=>i.decode());
     const size=await image.evaluate((i:HTMLImageElement)=>({natural:i.naturalWidth/i.naturalHeight,display:i.getBoundingClientRect().width/i.getBoundingClientRect().height}));expect(size.display).toBeCloseTo(size.natural,2);
    }else{expect(await scene.getAttribute('data-scene-src')).toContain('car-editorial-v2.webp');}

  }
  await expect(page.locator('#boat-detail')).toHaveCount(0);
  await expect(page.locator('.composition-study figcaption')).toContainText('Szkic poglądowy przygotowany na potrzeby prezentacji projektu.');
  const study = page.getByRole('button',{name:'Powiększ: szkic poglądowy kompozycji oklejenia',exact:true});
  await study.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.dialog-artwork img')).toHaveAttribute('src','/media/odwroceni/studium-kompozycji.webp');
  await page.keyboard.press('Escape');await expect(study).toBeFocused();

  // Stage links must reach the matching, visible content, including the last link on small screens.
  const navigation = page.getByRole('navigation', {name:'Etapy projektu'});
  for (const id of ['kierunek', 'samochod', 'przestrzen', 'lodz', 'zastosowanie']) {
    await navigation.locator(`a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }

  // The combined presentation is visible and playable without opening anything or starting sound automatically.
  const videos = page.locator('.process-case video');
  await expect(videos).toHaveCount(1);
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

  const film=videos.first();
  await page.getByRole('button',{name:'Widoki bryły'}).click();
  await expect.poll(()=>film.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(11.6);
  await expect(page.locator('[data-story-time="11.6"]')).toHaveAttribute('aria-pressed','true');
  expect(await film.evaluate((v:HTMLVideoElement)=>v.duration)).toBeGreaterThan(21);
  await page.getByRole('button',{name:'Projekt na planszy'}).click();await expect(page.locator('[data-story-time="0"]')).toHaveAttribute('aria-pressed','true');await film.evaluate((v:HTMLVideoElement)=>v.pause());
  await expect(page.locator('.story-sources a')).toHaveCount(2);
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
  // The new scene enlarges as an image, not as a blank SVG-only viewer.
  const scene = page.locator('[data-scene-src]');
  await scene.click();
  await expect(dialog).toBeVisible();
  const zoomImage = dialog.locator('.dialog-artwork img');
  await expect(zoomImage).toHaveAttribute('src', (await scene.getAttribute('data-scene-src'))!);
  await zoomImage.evaluate((image:HTMLImageElement) => image.decode());
  await dialog.getByRole('button', {name:/Zamknij/}).click();
  await expect(dialog).not.toBeVisible();
  await expect(scene).toBeFocused();
  expect(errors).toEqual([]);
});
