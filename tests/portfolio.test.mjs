// All demonstration data stays in an isolated temporary copy, never in the actual portfolio.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,symlink,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';
const root=process.cwd();
test('project pages, filters, query transfer, comparison and video in isolated fixture',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'nadx-test-'));let server,browser;
 try{
 for(const name of ['src','public','astro.config.mjs','package.json','package-lock.json','tsconfig.json'])await cp(path.join(root,name),path.join(dir,name),{recursive:true});
 await symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
 const file=path.join(dir,'src/content/site.json');const content=JSON.parse(await readFile(file,'utf8'));
 const project=(slug,name,category)=>({slug,name,category,scope:'TEST techniczny — nie realizacja NADX',image:'/favicon.svg',alt:'Test',client:'Test',need:'Test',solution:'Test',gallery:[{src:'/favicon.svg',alt:'Test'}],published:true,featured:true});
 content.projects=[project('test-logo','TEST logo','logo i identyfikacja'),{...project('test-film','TEST film','filmy i social media'),video:{src:'/media/test.mp4',poster:'/favicon.svg'}}];
 content.comparisons=[{title:'TEST',before:'/favicon.svg',after:'/favicon.svg',beforeAlt:'Przed test',afterAlt:'Po test',published:true}];await writeFile(file,JSON.stringify(content));await cp(path.join(root,'tests/fixtures/clip.mp4'),path.join(dir,'public/media/test.mp4'));
 await new Promise((resolve,reject)=>{const p=spawn('npm',['run','build'],{cwd:dir,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:'pipe'});let output='';p.stderr.on('data',c=>output+=c);p.on('exit',code=>code===0?resolve():reject(new Error(output)));});
 server=spawn(process.execPath,['dist/server/entry.mjs'],{cwd:dir,env:{...process.env,HOST:'127.0.0.1',PORT:'4333'},stdio:'pipe'});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4333')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,'Fixture server ready');
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage();
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:4333/realizacje');assert.equal(await page.locator('.project:visible').count(),2);await page.getByRole('button',{name:'filmy i social media',exact:true}).click();assert.equal(await page.locator('.project:visible').count(),1);await page.getByRole('button',{name:'oklejenia',exact:true}).click();assert.equal(await page.locator('.project:visible').count(),0);assert.ok(await page.locator('.filter-empty').isVisible());await page.getByRole('button',{name:'Wszystkie',exact:true}).click();await page.getByRole('link',{name:/TEST logo/}).click();assert.equal(await page.locator('h1').innerText(),'TEST logo.');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('link',{name:'Chcę podobny projekt'}).click();assert.equal(await page.locator('[name="project"]').inputValue(),'TEST logo');}
 await page.goto('http://127.0.0.1:4333');const range=page.getByRole('slider');await range.focus();await page.keyboard.press('ArrowRight');assert.equal(await range.inputValue(),'51');assert.match(await page.locator('.compare-after').getAttribute('style'),/49%/);
 await page.goto('http://127.0.0.1:4333/realizacje/test-film');await page.locator('video').evaluate(v=>v.play());await page.waitForTimeout(400);assert.ok(await page.locator('video').evaluate(v=>v.currentTime>0));assert.equal(await page.locator('video').getAttribute('autoplay'),null);
 }finally{await browser?.close();server?.kill();await rm(dir,{recursive:true,force:true});}
});
