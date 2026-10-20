import {test,expect} from '@playwright/test';
const routes=['/','/realizacje','/realizacje/shiro-logo-i-wizytowki','/oferta','/o-mnie','/kontakt','/prywatnosc','/oferta/logo-i-identyfikacja','/oferta/druk-i-reklama','/oferta/film-i-social-media','/oferta/odziez-i-nadruki'];
for(const width of [375,768,1440])test(`navigation and responsive layout ${width}px`,async({page})=>{await page.setViewportSize({width,height:1000});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});for(const route of routes){const r=await page.goto(route);expect(r?.status()).toBe(200);await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();for(const img of await page.locator('img').all()){if(!await img.isVisible())continue;await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0),{message:`Image must load on ${route}: ${await img.getAttribute('src')}`}).toBe(true);}}expect(errors).toEqual([]);await page.goto('/');if(width<760){await page.getByRole('button',{name:'Menu'}).click();await expect(page.getByRole('navigation')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Menu'})).toBeFocused();}await page.locator('.hero-actions a').first().click();await expect(page).toHaveURL(/realizacje/);});
test('service selection, validation, unavailable mail preserves text',async({page})=>{await page.goto('/oferta/film-i-social-media');await page.getByRole('link',{name:'Zapytaj o ten projekt'}).click();await expect(page.locator('#service')).toHaveValue('film-i-social-media');await page.getByRole('button',{name:'Wyślij zapytanie'}).click();await expect(page.locator('#description')).toBeFocused();await page.locator('#description').fill('Potrzebuję montażu filmu reklamowego dla swojej firmy.');await page.locator('#deadline').fill('Do ustalenia');await page.locator('#name').fill('Test');await page.locator('#email').fill('test@example.com');await page.locator('#privacy').check();await page.waitForTimeout(1600);await page.getByRole('button',{name:'Wyślij zapytanie'}).click();await expect(page.locator('.form-status')).toContainText('nie jest jeszcze skonfigurowane');await expect(page.locator('#description')).toHaveValue('Potrzebuję montażu filmu reklamowego dla swojej firmy.');await expect(page.getByRole('button',{name:'Wyślij zapytanie'})).toBeEnabled();});
test('confirmed success UX (mocked API, not email delivery)',async({page})=>{await page.route('**/api/inquiry',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'Zapytanie zostało przyjęte przez usługę pocztową.'})}));await page.goto('/kontakt?usluga=druk-i-reklama');await page.locator('#description').fill('Potrzebuję projektu wizytówek do drukarni.');await page.locator('#deadline').fill('Do ustalenia');await page.locator('#name').fill('Test');await page.locator('#email').fill('test@example.com');await page.locator('#privacy').check();await page.getByRole('button',{name:'Wyślij zapytanie'}).click();await expect(page.locator('.form-status')).toContainText('zostało przyjęte');await expect(page.locator('#description')).toHaveValue('');});
test('404, SEO, keyboard and reduced motion',async({page,request})=>{expect((await request.get('/nie-ma-takiej-strony')).status()).toBe(404);await page.goto('/nie-ma-takiej-strony');await expect(page.locator('h1')).toContainText('wypadł z kadru');await page.goto('/');await page.keyboard.press('Tab');await expect(page.locator('.skip')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();await page.emulateMedia({reducedMotion:'reduce'});expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','http://127.0.0.1:4321/');expect((await request.get('/sitemap.xml')).status()).toBe(200);expect(await(await request.get('/robots.txt')).text()).toContain('Sitemap:');});
test('API rejects origin, malformed body, untrusted token',async({request})=>{expect((await request.post('/api/inquiry',{data:{}})).status()).toBe(403);expect((await request.post('/api/inquiry',{headers:{Origin:'http://127.0.0.1:4321'},data:{}})).status()).toBe(400);expect((await request.post('/api/inquiry',{headers:{Origin:'http://127.0.0.1:4321','Content-Type':'application/json'},data:'x'.repeat(17000)})).status()).toBe(413);});
test('SHIRO spans logo and print filters, shows source logo and preserves inquiry context',async({page,request})=>{
 await page.goto('/');
 await page.locator('.work-section').getByRole('link',{name:/SHIRO/}).click();
 await expect(page).toHaveURL(/\/realizacje\/shiro-logo-i-wizytowki$/);
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
 const logo=page.getByRole('img',{name:/Logo SHIRO: autorskie/});
 await expect(logo).toBeVisible();
 expect(await logo.evaluate((i:HTMLImageElement)=>i.naturalWidth)).toBe(1871);
 await expect(page.locator('.case-hero figcaption')).toContainText('prezentacja oryginalnych projektów');
 await expect(page.locator('.case-hero .print-card img')).toHaveCount(2);
 await expect(page.locator('.case-hero .mechanic-card img')).toHaveAttribute('src','/media/shiro/mechanic-1536.webp');
 await expect(page.locator('.case-hero .rental-card img')).toHaveAttribute('src','/media/shiro/car-rental-1536.webp');
 await expect(page.locator('.case-print .source-item[data-kind="original"] img')).toHaveCount(2);
 await expect(page.getByRole('heading',{name:'Red Hat Display',exact:true})).toBeVisible();
 await expect(page.locator('.application-section')).toHaveCount(6);
 await page.getByRole('navigation',{name:'W tej realizacji'}).getByRole('link',{name:'Flagi',exact:true}).click();
 await expect(page).toHaveURL(/#application-flagi$/);
 await expect(page.locator('#application-flagi img')).toBeVisible();
 await expect(page.locator('#application-obuwie .application-rule')).toContainText('Projekt koncepcyjny');
 await expect(page.locator('.application-section .source-item img')).toHaveCount(4);
 await expect(page.locator('#application-vouchery .source-item img')).toHaveCount(2);
 await expect(page.locator('#application-baner figcaption')).toContainText(/wizualizacja AI/i);
 const garmentVideos=page.locator('#application-odziez video');
 await expect(garmentVideos).toHaveCount(2);
 for(const dialog of await page.locator('.film-dialog').all())await expect(dialog).not.toBeVisible();
 for(const title of ['Koszulka SHIRO','Bluza SHIRO']){
  const button=page.getByRole('button',{name:`Obejrzyj film: ${title}`,exact:true});
  const dialog=page.locator(`#${await button.getAttribute('aria-controls')}`);
  await button.click();
  await expect(dialog).toBeVisible();
  const video=dialog.locator('video');
  await expect(video).toHaveAttribute('controls','');
  await expect(video).toHaveAttribute('preload','none');
  expect(await video.getAttribute('autoplay')).toBeNull();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.duration)).toBeGreaterThan(8);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(button).toBeFocused();
  expect(await video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await button.click();
  await dialog.getByRole('button',{name:'Zamknij film'}).click();
  await expect(dialog).not.toBeVisible();
 }
 for(const details of await page.locator('.source-disclosure').all()){
  await expect(details).not.toHaveAttribute('open','');
  const summary=details.locator('summary');await summary.focus();await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open','');
  for(const img of await details.locator('img').all()){
   await img.scrollIntoViewIfNeeded();
   await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
  for(const link of await details.locator('a').all())expect((await request.get((await link.getAttribute('href'))!)).status()).toBe(200);
  await summary.focus();await page.keyboard.press('Enter');await expect(details).not.toHaveAttribute('open','');
 }
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/media\/shiro\/wizytowki-original-share-1536.webp$/);
 await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
 await expect(page.locator('[name="project"]')).toHaveValue('SHIRO');
 await expect(page.locator('#service')).toHaveValue('logo-i-identyfikacja');
 await page.goto('/realizacje');
 for(const category of ['logo i identyfikacja','druk i reklama','odzież i nadruki']){
  await page.getByRole('button',{name:category,exact:true}).click();
  await expect(page.locator('.project:visible')).toHaveCount(1);
  await expect(page.locator('.project:visible h3')).toHaveText('SHIRO');
 }
 await page.getByRole('button',{name:'oklejenia',exact:true}).click();
 await expect(page.locator('.project:visible')).toHaveCount(0);
 await expect(page.locator('.filter-empty')).toBeVisible();
 for(const service of ['logo-i-identyfikacja','druk-i-reklama','odziez-i-nadruki']){
  await page.goto(`/oferta/${service}`);
  await expect(page.getByRole('link',{name:/SHIRO/})).toBeVisible();
 }
 expect(await(await request.get('/sitemap.xml')).text()).toContain('/realizacje/shiro-logo-i-wizytowki');
});
