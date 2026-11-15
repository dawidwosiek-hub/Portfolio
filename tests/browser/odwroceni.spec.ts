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
  const boxes = await cards.evaluateAll(cards=>cards.map(card=>{const r=card.getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom};}));
  for(let i=1;i<boxes.length;i++){
    expect(boxes[i].x).toBeCloseTo(boxes[0].x,0);
    expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i-1].bottom);
  }
  await page.goto('/realizacje');
  await page.getByRole('button',{name:'oklejenia',exact:true}).click();
  await expect(page.locator('.project:visible h3')).toHaveText(['Odwróceni']);
  await page.locator('.project:visible').click();
  await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
  await expect(page.locator('[name="project"]')).toHaveValue('Odwróceni');
  await expect(page.locator('#service')).toHaveValue('druk-i-reklama');
});

for (const width of [390,768,1440]) test(`boat-only studio case is complete and usable at ${width}px`,async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:1000});await page.goto(projectPath);
 await expect(page.locator('h1')).toHaveText('Odwróceni.');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','http://127.0.0.1:4321'+projectPath);
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const article=page.locator('.boat-case');await expect(article).toBeVisible();
 const html=await article.innerHTML();expect(html).not.toMatch(/Lamborghini|Urus|7c50e11d794032fc|963120ff2f667c01/);
 await expect(article.locator('details')).toHaveCount(0);
 const views=article.locator('.view-grid [data-artwork]');await expect(views).toHaveCount(3);
 for(const view of await views.all()){
  await view.scrollIntoViewIfNeeded();await expect(view).toBeVisible();
  const img=view.locator('img');await img.evaluate((i:HTMLImageElement)=>i.decode());
  expect(await img.evaluate(async(i:HTMLImageElement)=>{const source=new Image();source.src=i.currentSrc;await source.decode();return source.naturalWidth;})).toBeGreaterThanOrEqual(768);
  const url=await view.getAttribute('data-boat-zoom');expect(url).toMatch(/^\/media\/odwroceni\/odwroceni-/);
  expect((await request.get(url!)).status()).toBe(200);
 }
 for(const img of await article.locator('img').all()){
  await img.scrollIntoViewIfNeeded();await img.evaluate((i:HTMLImageElement)=>i.decode());
  const ratios=await img.evaluate((i:HTMLImageElement)=>({natural:i.naturalWidth/i.naturalHeight,display:i.getBoundingClientRect().width/i.getBoundingClientRect().height}));
  expect(ratios.display).toBeCloseTo(ratios.natural,2);
 }
 const nav=page.getByRole('navigation',{name:'Etapy projektu'});
 for(const id of ['kierunek','rozmieszczenie','lodz','zastosowanie']){
  await nav.locator(`a[href="#${id}"]`).click();await expect(page).toHaveURL(new RegExp(`#${id}$`));await expect(page.locator(`#${id} h2`)).toBeVisible();
 }
 const first=views.first();await first.click();const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();await expect(dialog.locator('img')).toHaveAttribute('src',(await first.getAttribute('data-boat-zoom'))!);
 await dialog.locator('img').evaluate((i:HTMLImageElement)=>i.decode());
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(first).toBeFocused();
 await first.press('Enter');await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Zamknij podgląd'}).click();await expect(first).toBeFocused();
 for(const button of await article.locator('[data-boat-zoom^="/media/originals/"]').all()){
  expect((await request.get((await button.getAttribute('data-boat-zoom'))!)).status()).toBe(200);
  await button.click();await expect(dialog).toBeVisible();await dialog.locator('img').evaluate((i:HTMLImageElement)=>i.decode());await page.keyboard.press('Escape');await expect(button).toBeFocused();
 }
 const video=article.locator('video');await expect(video).toHaveCount(1);expect(await video.getAttribute('autoplay')).toBeNull();
 await video.scrollIntoViewIfNeeded();await video.evaluate((v:HTMLVideoElement)=>v.play());
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
 expect(await video.evaluate((v:HTMLVideoElement)=>v.controls&&v.muted&&v.duration===22)).toBe(true);
 await page.locator('.intro').scrollIntoViewIfNeeded();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 expect(errors).toEqual([]);
});
