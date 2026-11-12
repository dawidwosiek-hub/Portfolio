import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';

// Editorial film from supplied project footage and the existing case-study assets.
// No generated lettering, invented production footage, or browser 3D dependency.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const edit=JSON.parse(await readFile(resolve(root,'assets/nadx-cinematic/edit.json'),'utf8'));
const work=process.env.NADX_FILM_WORK||'/tmp/nadx-cinematic-render';
const output=resolve(root,'public/media/nadx');
await mkdir(work,{recursive:true});await mkdir(output,{recursive:true});
const {fps,width,height}=edit;
const run=(args)=>execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-filter_threads','1','-filter_complex_threads','1',...args],{stdio:'inherit'});
const htmlEscape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const fonts=await Promise.all(['inter-latin-wght-normal.woff2','inter-latin-ext-wght-normal.woff2'].map(async name=>(await readFile(resolve(root,'public/fonts',name))).toString('base64')));
const logo=await readFile(resolve(root,'public/brand/nadx-logo.svg'),'utf8');
const css=`
@font-face{font-family:NADX;src:url(data:font/woff2;base64,${fonts[0]});font-weight:100 900}
@font-face{font-family:NADX;src:url(data:font/woff2;base64,${fonts[1]});font-weight:100 900;unicode-range:U+0100-02BA,U+1E00-1E9F,U+2020-206F}
*{box-sizing:border-box}html,body{width:${width}px;height:${height}px;margin:0;background:transparent;font-family:NADX,sans-serif;color:white}
.top{position:absolute;left:40px;right:40px;top:12px;display:flex;align-items:center;justify-content:space-between;font-size:15px;font-weight:550;letter-spacing:2.4px}
.top i{width:7px;height:7px;display:inline-block;background:#fc0;margin-right:12px}
.bottom{position:absolute;left:40px;right:40px;bottom:17px;display:flex;justify-content:space-between;align-items:center;font-size:22px;font-weight:600;letter-spacing:.8px}
.bottom small{font-size:13px;letter-spacing:2px;color:#c8c8c8}
.signature{position:absolute;inset:0;background:#111;padding:58px 64px;overflow:hidden}
.signature .kicker{font-size:17px;letter-spacing:3px;font-weight:500;color:#ddd}
.signature h1{position:absolute;left:64px;top:190px;font-size:105px;line-height:1.01;letter-spacing:-6px;font-weight:750;margin:0}
.signature h1 span{color:#fc0}
.signature svg{position:absolute;right:66px;top:219px;width:222px;height:225px}
.signature .footer{position:absolute;left:64px;right:64px;bottom:54px;border-top:1px solid #4b4b4b;padding-top:22px;display:flex;justify-content:space-between;font-size:17px;letter-spacing:.6px}
`;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  for(const shot of edit.shots){
    const content=shot.type==='signature'
      ?`<div class="signature"><div class="kicker">NADX / DAWID WOSIEK</div><h1>POKAŻ SWOJĄ<br/><span>MARKĘ.</span></h1>${logo}<div class="footer"><span>Grafika · identyfikacja · wizualizacje</span><span>nadx.pl</span></div></div>`
      :`<div class="top"><span><i></i>PROJEKT W RUCHU</span><span>NADX</span></div><div class="bottom"><span>${htmlEscape(shot.chapter)}</span><small>WIZUALIZACJE PROJEKTU</small></div>`;
    await page.setContent(`<html lang="pl"><head><meta charset="utf-8"><style>${css}</style></head><body>${content}</body></html>`);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:resolve(work,`${shot.id}-overlay.png`),omitBackground:true});
  }
}finally{await browser.close();}

// Actual camera moves come from the supplied car films. Still study/boat shots
// use slow, eased reframing; they are not represented as newly modelled 3D scenes.
for(const shot of edit.shots){
  const shotPath=resolve(work,`${shot.id}.mkv`);
  const label=resolve(work,`${shot.id}-overlay.png`);
  if(shot.type==='signature'){
    run(['-loop','1','-framerate',String(fps),'-i',label,'-frames:v',String(shot.frames),'-vf','format=yuv420p','-c:v','ffv1','-level','3','-threads','3',shotPath]);
  }else{
    let inputs,base;
    if(shot.type==='video'){
      inputs=['-ss',String(shot.start),'-i',resolve(root,shot.source)];
      base=`fps=${fps},setpts=PTS-STARTPTS,scale=${width}:${height}:flags=lanczos,crop=${width}:620:0:30,eq=contrast=1.035:brightness=-0.006:saturation=1.015,pad=${width}:${height}:0:42:color=0x111111,setsar=1`;
    }else if(shot.type==='still'){
      inputs=['-i',resolve(root,shot.source)];
      const zoom=`${shot.zoomFrom}+(${shot.zoomTo}-${shot.zoomFrom})*(0.5-0.5*cos(PI*on/${shot.frames-1}))`;
      base=`scale=3072:-2:flags=lanczos,crop=3072:1488:0:156,zoompan=z='${zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${shot.frames}:s=${width}x620:fps=${fps},pad=${width}:${height}:0:42:color=0x111111,setsar=1`;
    }else{
      inputs=['-loop','1','-framerate',String(fps),'-i',resolve(work,'opening-frame.png')];
      base='setsar=1';
    }
    if(shot.type!=='return')inputs.push('-loop','1','-framerate',String(fps),'-i',label);
    const filter=shot.type==='return'?`[0:v]${base},format=yuv420p[out]`:`[0:v]${base}[base];[base][1:v]overlay=0:0:format=auto,format=yuv420p[out]`;
    run([...inputs,'-filter_complex',filter,'-map','[out]','-an','-frames:v',String(shot.frames),'-c:v','ffv1','-level','3','-threads','3',shotPath]);
  }
  if(shot.id==='reveal')run(['-i',shotPath,'-frames:v','1',resolve(work,'opening-frame.png')]);
  console.log(`Rendered ${shot.id}: ${shot.frames} frames`);
}

const filters=[];
let current='v0',frames=edit.shots[0].frames;
edit.shots.forEach((_,index)=>filters.push(`[${index}:v]setpts=PTS-STARTPTS,fps=${fps},settb=AVTB[v${index}]`));
for(let index=1;index<edit.shots.length;index++){
  const shot=edit.shots[index],next=`edit${index}`;
  if(shot.overlap){
    filters.push(`[${current}][v${index}]xfade=transition=${shot.transition}:duration=${shot.overlap/fps}:offset=${(frames-shot.overlap)/fps}[${next}]`);
  }else filters.push(`[${current}][v${index}]concat=n=2:v=1:a=0,fps=${fps},settb=AVTB[${next}]`);
  frames+=shot.frames-shot.overlap;current=next;
}
filters.push(`[${current}]format=yuv420p[film]`);
const inputs=edit.shots.flatMap(shot=>['-i',resolve(work,`${shot.id}.mkv`)]);
const master=resolve(output,`${edit.version}.mp4`);
run([...inputs,'-filter_complex',filters.join(';'),'-map','[film]','-frames:v',String(frames),'-r',String(fps),'-an','-c:v','libx264','-preset','slow','-crf','21','-profile:v','high','-level','3.1','-threads','3','-movflags','+faststart',master]);
run(['-i',master,'-vf','scale=768:432:flags=lanczos','-an','-c:v','libx264','-preset','slow','-crf','23','-profile:v','high','-level','3.1','-threads','3','-movflags','+faststart',resolve(output,`${edit.version}-mobile.mp4`)]);
for(const size of [1280,768])run(['-ss','0.5','-i',master,'-vf',`scale=${size}:-2:flags=lanczos`,'-frames:v','1','-c:v','libwebp','-quality','92','-threads','1',resolve(output,`${edit.version}-poster${size===768?'-768':''}.webp`)]);
const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height,nb_frames,duration','-of','json',master],{encoding:'utf8'}));
if(metadata.streams.length!==1||Number(metadata.streams[0].nb_frames)!==frames)throw new Error('Unexpected film streams/frame count');
await writeFile(resolve(work,'edit-report.json'),JSON.stringify({version:edit.version,frames,duration:frames/fps,metadata},null,2));
console.log(`Completed ${edit.version}: ${frames/fps}s, ${frames} frames; master, mobile and posters exported.`);
