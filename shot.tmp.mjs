import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-proxy-server']});
const pages=process.argv.slice(2);
const pg=await b.newPage({viewport:{width:1280,height:900}});
for(const s of pages){
 await pg.goto('http://127.0.0.1:4399/realizacje/'+s,{waitUntil:'networkidle'});
 await pg.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager'));
 await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}});
 await pg.waitForLoadState('networkidle');await pg.waitForTimeout(800);
 await pg.screenshot({path:`/tmp/s_${s}.jpg`,fullPage:true,quality:45,type:'jpeg'});
}
await b.close();
