import {test,expect} from '@playwright/test';

for(const width of [390,768,1440])test(`project index keeps consistent covers and readable links at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  for(const path of ['/','/realizacje']){
    await page.goto(path);
    const rows=page.locator('.project-index .project');
    await expect(rows).toHaveCount(4);
    await rows.locator('img').evaluateAll(images=>images.forEach(image=>(image as HTMLImageElement).loading='eager'));
    await rows.locator('img').evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode())));
    const geometry=await rows.evaluateAll(rows=>rows.map(row=>{
      const cover=row.querySelector<HTMLElement>('[data-project-cover]')!.getBoundingClientRect();
      const link=row.querySelector('.project-action')!.getBoundingClientRect();
      const title=row.querySelector('h3')!.getBoundingClientRect();
      return {x:cover.x,width:cover.width,height:cover.height,right:cover.right,link:{left:link.left,right:link.right,top:link.top,bottom:link.bottom},title:{left:title.left,right:title.right,top:title.top,bottom:title.bottom}};
    }));
    for(const item of geometry){
      expect(item.width/item.height).toBeCloseTo(1.5,2);
      expect(item.x).toBeCloseTo(geometry[0].x,0);
      expect(item.width).toBeCloseTo(geometry[0].width,0);
      expect(item.link.right).toBeLessThanOrEqual(width);
      expect(item.link.right<=item.title.left||item.link.left>=item.title.right||item.link.bottom<=item.title.top||item.link.top>=item.title.bottom).toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    // Keep each complete original within its cover, including during pointer interaction.
    for(const image of await rows.locator('.cover-brandmark img,.cover-album-art img,.cover-disc img,.cover-garments img').all()){
      await image.scrollIntoViewIfNeeded();await expect(image).toBeVisible();
      await expect(image).toHaveCSS('object-fit','contain');
      const fits=await image.evaluate(image=>{const r=image.getBoundingClientRect(),cover=image.closest('[data-project-cover]')!.getBoundingClientRect();return r.left>=cover.left&&r.top>=cover.top&&r.right<=cover.right&&r.bottom<=cover.bottom;});
      expect(fits).toBe(true);
    }
    await rows.first().hover();
    await expect(rows.first().locator('img')).toHaveCSS('transform','none');
  }
  await page.getByRole('button',{name:'druk i reklama',exact:true}).click();
  await expect(page.locator('.project:visible h3')).toHaveText(['Odwróceni','SHIRO','Diverto']);
  const shiro=page.locator('.project:visible').filter({has:page.getByRole('heading',{name:'SHIRO',exact:true})});
  await shiro.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/realizacje\/shiro-logo-i-wizytowki$/);
});
