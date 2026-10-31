import {test,expect} from '@playwright/test';
const routes=['/','/realizacje','/realizacje/odwroceni-projekty-oklejen','/realizacje/shiro-logo-i-wizytowki','/realizacje/diverto-materialy-promocyjne','/realizacje/olsen-odziez-firmowa','/oferta','/o-mnie','/kontakt','/prywatnosc','/oferta/logo-i-identyfikacja','/oferta/druk-i-reklama','/oferta/film-i-social-media','/oferta/odziez-i-nadruki'];
for(const width of [375,768,1440])test(`navigation and responsive layout ${width}px`,async({page})=>{await page.setViewportSize({width,height:1000});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});for(const route of routes){const r=await page.goto(route);expect(r?.status()).toBe(200);await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();for(const img of await page.locator('img').all()){if(!await img.isVisible())continue;await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0),{message:`Image must load on ${route}: ${await img.getAttribute('src')}`}).toBe(true);}}expect(errors).toEqual([]);await page.goto('/');if(width<760){await page.getByRole('button',{name:'Menu'}).click();await expect(page.getByRole('navigation')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Menu'})).toBeFocused();}await page.locator('.hero-actions a').first().click();await expect(page).toHaveURL(/realizacje/);});
test('contact prepares a real email brief without pretending it was sent',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 let posts=0;page.on('request',r=>{if(r.url().endsWith('/api/inquiry')&&r.method()==='POST')posts++;});
 await page.goto('/oferta/film-i-social-media');await page.getByRole('link',{name:'Zapytaj o ten projekt'}).click();
 await expect(page.locator('#service')).toHaveValue('film-i-social-media');
 const submit=page.locator('#inquiry button[type=submit]');await expect(submit).toContainText('Przygotuj wiadomość');await submit.click();await expect(page.locator('#description')).toBeFocused();
 const text='Potrzebuję montażu filmu reklamowego dla swojej firmy.';
 await page.locator('#description').fill(text);await page.locator('#name').fill('Test');await page.locator('#email').fill('test@example.com');await page.locator('#privacy').check();
 await submit.click();await expect(page.locator('.mail-draft')).toBeVisible();await expect(page.locator('#description')).toHaveValue(text);
 const draft=await page.locator('#mail-text').inputValue();expect(draft).toContain(text);expect(draft).toContain('Termin: Do ustalenia');expect(draft).toContain('test@example.com');
 const mail=new URL((await page.locator('#mail-open').getAttribute('href'))!);expect(mail.protocol).toBe('mailto:');expect(mail.pathname).toBe('DawidWosiek@gmail.com');expect(mail.searchParams.get('body')).toBe(draft);
 await expect(page.locator('.mail-draft')).toContainText('nie została jeszcze wysłana');expect(posts).toBe(0);
 await page.getByRole('button',{name:'Skopiuj treść',exact:true}).click();await expect(page.locator('.copy-status')).toContainText('Skopiowano');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(draft);
 await page.locator('#description').fill(text+' Nowa wersja.');await expect(page.locator('.mail-draft')).toBeHidden();
 await page.locator('.contact-extra summary').click();await page.locator('#reference').fill('http://example.com/brief');await page.locator('.contact-extra summary').click();await submit.click();await expect(page.locator('.contact-extra')).toHaveAttribute('open','');await expect(page.locator('#reference')).toBeFocused();await expect(page.locator('#error-reference')).toContainText('HTTPS');
});
test('configured API success UX (mocked configuration and API, not email delivery)',async({page})=>{
 await page.route('**/api/inquiry',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'Zapytanie zostało przyjęte przez usługę pocztową.'})}));
 await page.goto('/kontakt?usluga=druk-i-reklama');await page.locator('#inquiry').evaluate(f=>{(f as HTMLFormElement).dataset.delivery='api';});
 await page.locator('#description').fill('Potrzebuję projektu wizytówek do drukarni.');await page.locator('#name').fill('Test');await page.locator('#email').fill('test@example.com');await page.locator('#privacy').check();await page.locator('#inquiry button[type=submit]').click();
 await expect(page.locator('.form-status')).toContainText('zostało przyjęte');await expect(page.locator('#description')).toHaveValue('');
});
test('API outage preserves the brief and offers email instead',async({page})=>{
 await page.route('**/api/inquiry',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Chwilowy brak usługi.'})}));
 await page.goto('/kontakt?temat=oklejenia');await expect(page.locator('#service')).toHaveValue('druk-i-reklama');await expect(page.locator('.project-selection')).toContainText('Projekt oklejenia');
 await page.locator('#inquiry').evaluate(f=>{(f as HTMLFormElement).dataset.delivery='api';});await page.locator('#description').fill('Projekt oklejenia samochodu dla mojej firmy.');await page.locator('#name').fill('Test');await page.locator('#email').fill('test@example.com');await page.locator('#privacy').check();await page.locator('#inquiry button[type=submit]').click();
 await expect(page.locator('.mail-draft')).toBeVisible();await expect(page.locator('#description')).toHaveValue('Projekt oklejenia samochodu dla mojej firmy.');await expect(page.locator('.form-status')).toContainText('nie przekazał wiadomości');
});
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
 await expect(page.locator('.shiro-case .card-stage')).toHaveCount(0);
 for(const source of ['/media/shiro/mechanic-source.png','/media/shiro/car-rental-source.png'])await expect(page.locator(`.case-print img[src="${source}"]`)).toBeVisible();
 await expect(page.locator('.case-print .source-item[data-kind="original"] img')).toHaveCount(2);
 await expect(page.getByRole('heading',{name:'Red Hat Display',exact:true})).toBeVisible();
 await expect(page.locator('.application-section')).toHaveCount(6);
 await page.getByRole('navigation',{name:'W tej realizacji'}).getByRole('link',{name:'Flagi',exact:true}).click();
 await expect(page).toHaveURL(/#application-flagi$/);
 await expect(page.locator('#application-flagi svg[role="img"]')).toBeVisible();
 await expect(page.locator('#application-obuwie .application-rule')).toContainText('Projekt koncepcyjny');
 await expect(page.locator('.application-section .source-item img')).toHaveCount(3);
 await expect(page.locator('#application-obuwie .shoe-original svg[role="img"]')).toBeVisible();
 await expect(page.locator('#application-vouchery .source-item img')).toHaveCount(2);
 await expect(page.locator('#application-baner figcaption')).toContainText(/wizualizacja projektu/i);
 const garmentVideos=page.locator('#application-odziez video');
 await expect(garmentVideos).toHaveCount(2);
 for(const title of ['Koszulka SHIRO','Bluza SHIRO']){
  const video=page.getByLabel(title,{exact:true});await video.scrollIntoViewIfNeeded();await expect(video).toBeVisible();
  const box=await video.boundingBox();expect(box?.height).toBeGreaterThan(200);expect(await video.getAttribute('autoplay')).toBeNull();expect(await video.evaluate((v:HTMLVideoElement)=>v.muted&&v.controls)).toBe(true);
  await video.evaluate((v:HTMLVideoElement)=>v.play());await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await page.locator('#scope-title').scrollIntoViewIfNeeded();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 }
 // Original source artwork is part of the page, with optional enlargement rather than hidden disclosures.
 await expect(page.locator('.shiro-case .source-disclosure')).toHaveCount(0);
 for(const original of await page.locator('.shiro-case .source-item').all()){
  await original.scrollIntoViewIfNeeded();await expect(original).toBeVisible();
 }
 const source=page.getByRole('button',{name:'Powiększ projekt wizytówki: Mechanic & Chiptuning',exact:true});
 await source.click();
 const zoom=page.locator('.shiro-zoom');
 await expect(zoom).toBeVisible();
 await expect(zoom.locator('img')).toHaveAttribute('src','/media/shiro/mechanic-source.png');
 await zoom.locator('img').evaluate((image:HTMLImageElement)=>image.decode());
 await page.keyboard.press('Escape');await expect(zoom).not.toBeVisible();await expect(source).toBeFocused();
 for(const image of await page.locator('.shiro-case svg[role="img"] image').all()){
  const resource=await request.get((await image.getAttribute('href'))!);
  expect(resource.status()).toBe(200);expect(resource.headers()['content-type']).toContain('image/');
 }
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/\/media\/shiro\/shiro-mark-presentation-share-1536.webp$/);
 await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
 await expect(page.locator('[name="project"]')).toHaveValue('SHIRO');
 await expect(page.locator('#service')).toHaveValue('logo-i-identyfikacja');
 await page.goto('/realizacje');
 for(const category of ['logo i identyfikacja','druk i reklama','odzież i nadruki']){
  await page.getByRole('button',{name:category,exact:true}).click();
  await expect(page.locator('.project:visible h3')).toHaveText(category==='druk i reklama'?['Odwróceni','SHIRO','Diverto']:category==='odzież i nadruki'?['SHIRO','OLSEN']:['SHIRO']);
 }
 await page.getByRole('button',{name:'oklejenia',exact:true}).click();
 await expect(page.locator('.project:visible h3')).toHaveText(['Odwróceni']);
 await page.getByRole('button',{name:'filmy i social media',exact:true}).click();
 await expect(page.locator('.project:visible')).toHaveCount(0);
 await expect(page.locator('.filter-empty')).toBeVisible();
 for(const service of ['logo-i-identyfikacja','druk-i-reklama','odziez-i-nadruki']){
  await page.goto(`/oferta/${service}`);
  await expect(page.getByRole('link',{name:/SHIRO/})).toBeVisible();
 }
 expect(await(await request.get('/sitemap.xml')).text()).toContain('/realizacje/shiro-logo-i-wizytowki');
});

test('Diverto appears in print portfolio and preserves project and service in inquiry',async({page,request})=>{
 await page.goto('/realizacje');
 await page.getByRole('button',{name:'druk i reklama',exact:true}).click();
 await page.getByRole('link',{name:/Diverto/}).click();
 await expect(page).toHaveURL(/\/realizacje\/diverto-materialy-promocyjne$/);
 await expect(page.locator('h1')).toHaveText('Diverto.');
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
 await page.getByRole('navigation',{name:'W tej realizacji'}).getByRole('link',{name:'Roll-up',exact:true}).click();
 await expect(page).toHaveURL(/#application-rollup$/);
 await expect(page.locator('#application-rollup .rollup-print img')).toBeVisible();
 for(const details of await page.locator('.source-disclosure').all()){
  await details.locator('summary').focus();await page.keyboard.press('Enter');
  for(const image of await details.locator('img').all()){
   await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  }
 }
 await expect(page.locator('.case-print .source-item')).toHaveCount(5);
 await expect(page.locator('#application-rollup .source-item')).toHaveCount(1);
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/album-preview-share-1536.webp$/);
 await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
 await expect(page.locator('[name="project"]')).toHaveValue('Diverto');
 await expect(page.locator('#service')).toHaveValue('druk-i-reklama');
 await page.goto('/oferta/druk-i-reklama');
 await expect(page.getByRole('link',{name:/Diverto/})).toBeVisible();
 expect(await(await request.get('/sitemap.xml')).text()).toContain('/realizacje/diverto-materialy-promocyjne');
});

test('OLSEN apparel preserves original artwork, source sheets and inquiry context',async({page,request})=>{
 await page.goto('/realizacje');
 await page.getByRole('button',{name:'odzież i nadruki',exact:true}).click();
 await expect(page.locator('.project:visible h3')).toHaveText(['SHIRO','OLSEN']);
 await page.getByRole('link',{name:/OLSEN/}).click();
 await expect(page).toHaveURL(/\/realizacje\/olsen-odziez-firmowa$/);
 await expect(page.locator('h1')).toHaveText('OLSEN.');
 await expect(page.locator('.case-hero figcaption')).toContainText('wizualizacja projektu');
 await expect(page.locator('.application-section')).toHaveCount(3);
 for(const name of ['Bluza / haft','Koszulki / DTF','Czapka / haft']){
  await page.getByRole('navigation',{name:'W tej realizacji'}).getByRole('link',{name,exact:true}).click();
 }
 for(const details of await page.locator('.source-disclosure').all()){
  await details.locator('summary').focus();await page.keyboard.press('Enter');
  for(const link of await details.locator('a').all()){
   const response=await request.get((await link.getAttribute('href'))!);
   expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/svg+xml');
   const svg=await response.text();expect(svg).toContain('<svg');expect(svg).not.toMatch(/<script|javascript:/i);
  }
 }
 await expect(page.locator('.source-item')).toHaveCount(5);
 await expect(page.locator('#application-koszulki .source-item')).toHaveCount(2);
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/ulozenie-share-1536.webp$/);
 await page.getByRole('link',{name:'Chcę podobny projekt'}).click();
 await expect(page.locator('[name="project"]')).toHaveValue('OLSEN');
 await expect(page.locator('#service')).toHaveValue('odziez-i-nadruki');
 await page.goto('/oferta/odziez-i-nadruki');await expect(page.getByRole('link',{name:/OLSEN/})).toBeVisible();
 expect(await(await request.get('/sitemap.xml')).text()).toContain('/realizacje/olsen-odziez-firmowa');
});

for(const width of [390,768,1440])test(`SHIRO scene images and source artwork remain visible at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.goto('/realizacje/shiro-logo-i-wizytowki');
 await expect(page.locator('h1')).toHaveText('SHIRO.');
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const selector of ['.brand-mark img','.apparel-scene img']){
  const image=page.locator(selector);
  await image.scrollIntoViewIfNeeded();await expect(image).toBeVisible();
  await image.evaluate((i:HTMLImageElement)=>i.decode());
  const size=await image.evaluate(async(i:HTMLImageElement)=>{const source=new Image();source.src=i.currentSrc;await source.decode();return {width:source.naturalWidth,height:source.naturalHeight};});
  expect(size.width).toBeGreaterThanOrEqual(768);expect(size.width/size.height).toBeCloseTo(selector==='.brand-mark img'?1871/821:1.5,2);
 }
 for(const selector of ['#application-vouchery','#application-naklejki','#application-baner','#application-flagi','#application-obuwie']){
  await page.locator(selector).scrollIntoViewIfNeeded();await expect(page.locator(selector)).toBeVisible();
 }
 await expect(page.locator('.shiro-case details')).toHaveCount(0);
});


test('rejected SHIRO stationery hero is replaced throughout the public portfolio',async({request})=>{
 for(const path of ['/', '/realizacje', '/realizacje/shiro-logo-i-wizytowki']){
  const html=await(await request.get(path)).text();
  expect(html).not.toContain('shiro-brand-scene');
  expect(html).toContain('/media/shiro/logo.webp');
 }
});
