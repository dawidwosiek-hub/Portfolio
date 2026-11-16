import {test,expect} from '@playwright/test';

test('the cinematic case film plays silently and respects pause and viewport visibility',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const motion=page.locator('[data-hero-motion]');
  const video=motion.locator('[data-motion-video]');
  await expect(motion.locator('img')).toBeVisible();
  expect(await video.getAttribute('autoplay')).toBeNull();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.muted&&v.loop&&!v.controls)).toBe(true);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.duration)).toBeCloseTo(16,1);
  await expect(video).toHaveAttribute('src','/media/nadx/portfolio-cinematic-v2.mp4');
  await page.getByRole('button',{name:'Wstrzymaj film',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.locator('#realizacje').scrollIntoViewIfNeeded();await motion.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Odtwórz film',exact:true})).toBeVisible();
  expect(await video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.getByRole('button',{name:'Odtwórz film',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
  await page.locator('#realizacje').scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await motion.scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
});

test('reduced motion starts with the project poster and loads mobile film only on request',async({page})=>{
  await page.setViewportSize({width:390,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  const downloads:string[]=[];
  page.on('request',request=>{if(/portfolio-cinematic.*\.mp4/.test(request.url()))downloads.push(request.url());});
  await page.goto('/');
  const motion=page.locator('[data-hero-motion]'),video=motion.locator('[data-motion-video]');
  await motion.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Odtwórz film',exact:true})).toBeVisible();
  await expect(motion.locator('img')).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await video.getAttribute('src')).toBeNull();expect(downloads).toEqual([]);
  await page.getByRole('button',{name:'Odtwórz film',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await expect(video).toHaveAttribute('src','/media/nadx/portfolio-cinematic-v2-mobile.mp4');
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Let the browser deliver the preference change before changing it again.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

test('data saver avoids video downloads until the visitor enables motion',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:Object.assign(new EventTarget(),{saveData:true}),configurable:true}));
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const video=page.locator('[data-motion-video]');
  await expect(page.getByRole('button',{name:'Odtwórz film',exact:true})).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await video.getAttribute('src')).toBeNull();
  await page.getByRole('button',{name:'Odtwórz film',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
});

test('the project poster and full case remain available when the film cannot load',async({page})=>{
  await page.route('**/media/nadx/*.mp4',route=>route.abort());
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const motion=page.locator('[data-hero-motion]');
  await expect(motion).toHaveAttribute('data-ready','false');
  await expect(motion.locator('img')).toBeVisible();
  expect(await motion.locator('img').evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(motion.locator('[data-motion-toggle]')).toBeHidden();
  await expect(page.locator('.hero-work a')).toHaveAttribute('href','/realizacje/odwroceni-projekty-oklejen');
});

test('the cinema view starts from the beginning, pauses the preview and preserves a manual pause',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const preview=page.locator('[data-motion-video]');
  await expect.poll(()=>preview.evaluate((v:HTMLVideoElement)=>!v.paused)).toBe(true);
  await page.getByRole('button',{name:'Wstrzymaj film',exact:true}).click();
  const opener=page.getByRole('button',{name:'Obejrzyj film',exact:true});
  await opener.click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button',{name:'Zamknij film',exact:true})).toBeFocused();
  const player=page.locator('[data-cinema-player]');
  await expect.poll(()=>player.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
  expect(await player.evaluate((v:HTMLVideoElement)=>v.controls&&v.currentTime<5)).toBe(true);
  expect(await preview.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
  expect(await player.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  expect(await preview.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

test('the mobile cinema view is an explicit opt-in when motion is reduced',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  const preview=page.locator('[data-motion-video]'),player=page.locator('[data-cinema-player]');
  await expect(page.getByRole('button',{name:'Obejrzyj film',exact:true})).toBeVisible();
  expect(await player.getAttribute('src')).toBeNull();expect(await preview.getAttribute('src')).toBeNull();
  await page.getByRole('button',{name:'Obejrzyj film',exact:true}).click();
  await expect.poll(()=>player.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await expect(player).toHaveAttribute('src','/media/nadx/portfolio-cinematic-v2.mp4');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Zamknij film',exact:true}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await player.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  expect(await preview.getAttribute('src')).toBeNull();
});
