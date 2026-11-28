import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(e.message));
const ts=process.argv.slice(2).map(Number);
for(const t of ts){
 await pg.goto('http://127.0.0.1:4399/podglad/intro-historia?t='+t,{waitUntil:'networkidle'});
 await pg.waitForTimeout(2500);
 await pg.screenshot({path:`/tmp/it_${t}.jpg`,type:'jpeg',quality:70});
}
console.log(errs.slice(0,8).join('\n'));
await b.close();
