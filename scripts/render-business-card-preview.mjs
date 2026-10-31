// Render the actual website component, preserving the original artwork.
// Usage: node scripts/render-business-card-preview.mjs BASE_URL PROJECT_SLUG OUTPUT_PREFIX [STAGE_SELECTOR] [ASPECT_RATIO]
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

const [baseURL,slug,prefix,selector='.card-stage',aspect='1.5']=process.argv.slice(2);
if(!baseURL||!slug||!prefix)throw new Error('Provide BASE_URL, PROJECT_SLUG and OUTPUT_PREFIX.');
const ratio=Number(aspect);
if(!Number.isFinite(ratio)||ratio<=0)throw new Error('ASPECT_RATIO must be positive.');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:2});
 await page.goto(new URL(`/realizacje/${encodeURIComponent(slug)}`,baseURL).href);
 const stage=page.locator(selector).first();
 await stage.scrollIntoViewIfNeeded();
 await stage.locator('img').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
 await page.waitForFunction(selector=>[...document.querySelectorAll(`${selector} img`)].every(image=>image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0),selector);
 for(const img of await stage.locator('img').all())await img.evaluate(i=>i.decode());
 await stage.evaluate((node,ratio)=>{
  document.body.replaceChildren(node);
  node.setAttribute('data-preview-export','true');
  document.documentElement.style.cssText='background:transparent!important;scroll-behavior:auto';
  document.body.style.cssText='margin:0;padding:0;background:transparent!important;width:1536px';
  node.style.cssText=`width:1536px;aspect-ratio:${ratio};margin:0`;
 },ratio);
 await mkdir(dirname(prefix),{recursive:true});
 for(const opaque of [false,true]){
  await page.evaluate(white=>{document.body.style.background=white?'#fff':'transparent'},opaque);
  const png=await page.locator('[data-preview-export]').screenshot({omitBackground:!opaque});
  for(const width of opaque?[1536]:[768,1536,3072]){
   const url=await page.evaluate(async({data,width,opaque,ratio})=>{
    const bitmap=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width/ratio);
    const ctx=canvas.getContext('2d');
    if(opaque){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/webp',.98);
   },{data:png.toString('base64'),width,opaque,ratio});
   const path=`${prefix}${opaque?'-share':''}-${width}.webp`;
   await writeFile(path,Buffer.from(url.split(',')[1],'base64'));
   console.log(path);
  }
 }
}finally{await browser.close();}
