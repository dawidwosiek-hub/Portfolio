// Export the real studio mockup component after placing the original production artwork.
// Usage: npm run mockups:render -- http://127.0.0.1:4322 [shiro diverto olsen]
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {portfolioMockups} from '../src/lib/portfolio-mockups.ts';

const [baseURL='http://127.0.0.1:4322',...names]=process.argv.slice(2);
const scenes=names.length?names:Object.keys(portfolioMockups);
const outputs=[];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:2});
  await mkdir('public/media/mockups',{recursive:true});
  await mkdir('/tmp/nadx-mockup-review',{recursive:true});
  for(const name of scenes){
    if(!portfolioMockups[name])throw new Error(`Unknown scene: ${name}`);
    const response=await page.goto(new URL(`/podglad-studio/${name}`,baseURL).href,{waitUntil:'networkidle'});
    if(!response?.ok())throw new Error('Studio preview requires the local Astro development server.');
    const scene=page.locator('.portfolio-mockup');
    await scene.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    const png=await scene.screenshot({path:`/tmp/nadx-mockup-review/${name}.png`});
    for(const width of [768,1536]){
      const url=await page.evaluate(async({png,width})=>{
        const bitmap=await createImageBitmap(await(await fetch(`data:image/png;base64,${png}`)).blob());
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width/1.5);
        const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
        context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(bitmap,0,0,canvas.width,canvas.height);
        bitmap.close();return canvas.toDataURL('image/webp',.96);
      },{png:png.toString('base64'),width});
      const output=`public/media/mockups/${name}-studio-v1${width===768?'-768':''}.webp`;
      outputs.push([output,Buffer.from(url.split(',')[1],'base64')]);
    }
  }
}finally{await browser.close();}
// Write after capture so a development-server file watcher cannot reload an active scene.
for(const [output,bytes] of outputs){await writeFile(output,bytes);console.log(output);}
