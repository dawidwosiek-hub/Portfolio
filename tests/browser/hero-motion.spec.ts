import {test,expect} from '@playwright/test';

test('identity loop plays silently and respects pause and viewport visibility',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const motion=page.locator('[data-hero-motion]');
  const video=motion.locator('video');
  await expect(motion.locator('img')).toBeVisible();
  expect(await video.getAttribute('autoplay')).toBeNull();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.muted&&v.loop&&!v.controls)).toBe(true);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.duration)).toBeCloseTo(4,1);
  await expect(video).toHaveAttribute('src','/media/nadx/identity-motion-v1.mp4');
  await page.getByRole('button',{name:'Wstrzymaj animację 3D',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.locator('#realizacje').scrollIntoViewIfNeeded();await motion.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Odtwórz animację 3D',exact:true})).toBeVisible();
  expect(await video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await page.getByRole('button',{name:'Odtwórz animację 3D',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
  await page.locator('#realizacje').scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await motion.scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
});

test('reduced motion starts with a static identity and loads mobile video only on request',async({page})=>{
  await page.setViewportSize({width:390,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  const downloads:string[]=[];
  page.on('request',request=>{if(/identity-motion.*\.mp4/.test(request.url()))downloads.push(request.url());});
  await page.goto('/');
  const motion=page.locator('[data-hero-motion]'),video=motion.locator('video');
  await motion.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Odtwórz animację 3D',exact:true})).toBeVisible();
  await expect(motion.locator('img')).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await video.getAttribute('src')).toBeNull();expect(downloads).toEqual([]);
  await page.getByRole('button',{name:'Odtwórz animację 3D',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await expect(video).toHaveAttribute('src','/media/nadx/identity-motion-v1-mobile.mp4');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

test('data saver avoids video downloads until the visitor enables motion',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:Object.assign(new EventTarget(),{saveData:true}),configurable:true}));
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const video=page.locator('[data-hero-motion] video');
  await expect(page.getByRole('button',{name:'Odtwórz animację 3D',exact:true})).toBeVisible();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await video.getAttribute('src')).toBeNull();
  await page.getByRole('button',{name:'Odtwórz animację 3D',exact:true}).click();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
});

test('the static identity remains available when the animation cannot load',async({page})=>{
  await page.route('**/media/nadx/*.mp4',route=>route.abort());
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const motion=page.locator('[data-hero-motion]');
  await expect(motion).toHaveAttribute('data-ready','false');
  await expect(motion.locator('img')).toBeVisible();
  expect(await motion.locator('img').evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(motion.getByRole('button')).toHaveCount(0);
});
