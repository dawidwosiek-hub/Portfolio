import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('http://127.0.0.1:4399/',{waitUntil:'load'});
let last=0;
for(const t of [2,6,12,22]){await pg.waitForTimeout((t-last)*1000);last=t;await pg.screenshot({path:`/tmp/c${t}.jpg`,type:'jpeg',quality:60});
console.log(t,await pg.evaluate(()=>({cls:document.getElementById('lx').className,h:document.getElementById('lx').offsetHeight,skip:document.getElementById('lx-skip').hidden,fin:document.getElementById('lx-final').className})));}
await pg.reload({waitUntil:'load'});await pg.waitForTimeout(2500);
console.log('reload',await pg.evaluate(()=>({cls:document.getElementById('lx').className,h:document.getElementById('lx').offsetHeight})));
await pg.screenshot({path:'/tmp/cR.jpg',type:'jpeg',quality:60});
await pg.click('#lx-replay');await pg.waitForTimeout(1500);await pg.mouse.wheel(0,400);await pg.waitForTimeout(1500);
console.log('after wheel',await pg.evaluate(()=>({cls:document.getElementById('lx').className,h:document.getElementById('lx').offsetHeight,y:scrollY})));
console.log(errs.slice(0,5));await b.close();
