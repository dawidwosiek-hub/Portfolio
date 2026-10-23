// Private client for the Render bridge. Never prints credentials or publishes outputs.
import {randomBytes,randomUUID} from 'node:crypto';
import {open,readFile,mkdir,rename,rm} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const [command='status',promptFile,output,aspectRatio='3:4']=process.argv.slice(2);
if (command==='init') {
  const key=randomBytes(32).toString('hex');
  const file=await open('.env.vertex-review','wx',0o600);
  let renderFile;
  try {
    renderFile=await open('.env.vertex-render','wx',0o600);
    await file.writeFile(`VERTEX_STUDIO_URL=https://portfolio-a3dl.onrender.com/api/studio\nVERTEX_BRIDGE_KEY=${key}\n`);
    await renderFile.writeFile(`VERTEX_BRIDGE_KEY=${key}\nVERTEX_PROJECT_ID=pro-landing-512512-v7\nVERTEX_REGION=us-central1\nVERTEX_SERVICE_ACCOUNT_EMAIL=nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com\nVERTEX_SERVICE_ACCOUNT_FILE=/etc/secrets/nadx-vertex.json\nVERTEX_IMAGE_MODEL=imagen-4.0-generate-001\nVERTEX_GENERATION_ENABLED=false\nVERTEX_IMAGES_PER_HOUR=3\n`);
  } catch (error) {
    await file.close();if(renderFile)await renderFile.close();
    await rm('.env.vertex-review',{force:true});if(renderFile)await rm('.env.vertex-render',{force:true});
    throw error;
  }
  await file.close();await renderFile.close();
  console.log('Utworzono dwa prywatne pliki: .env.vertex-review dla środowiska i .env.vertex-render do importu w Renderze. Nie publikuj ich ani nie wklejaj sekretów na czacie.');
  process.exit(0);
}
if (!['status','generate'].includes(command)) throw new Error('Dostępne polecenia: init, status, generate PLIK_OPISU PLIK_WYNIKOWY [PROPORCJE].');
const key=process.env.VERTEX_BRIDGE_KEY, endpoint=process.env.VERTEX_STUDIO_URL;
if (!key || !endpoint) throw new Error('Wczytaj prywatną konfigurację przez --env-file=.env.vertex-review.');
const url=new URL(endpoint);
if (url.protocol!=='https:' && !['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Wymagane HTTPS.');
if (url.username || url.password || url.search || url.hash) throw new Error('Adres nie może zawierać sekretów ani parametrów.');
let target,temporary,payload;
if (command==='generate') {
  if (!promptFile || !output) throw new Error('Podaj plik z opisem i prywatną ścieżkę zapisu PNG.');
  target=resolve(output);
  for (const directory of ['public','dist']) {
    const inside=relative(resolve(directory),target);
    if (!inside || (inside!=='..' && !inside.startsWith('../') && !isAbsolute(inside))) throw new Error('Zapisz wynik poza public/ i dist/.');
  }
  const prompt=await readFile(promptFile,'utf8');
  if (prompt.trim().length<20 || prompt.length>4000 || !['1:1','3:4','4:3','9:16','16:9'].includes(aspectRatio)) throw new Error('Nieprawidłowy opis lub proporcje.');
  const requestId=randomUUID();
  payload={prompt,aspectRatio,requestId};
  console.log(`Operacja ${requestId}. Jedno wywołanie modelu, bez automatycznego ponawiania.`);
}
const response=await fetch(url,{
  method:payload?'POST':'GET',headers:{Authorization:`Bearer ${key}`,...(payload?{'Content-Type':'application/json'}:{})},
  ...(payload?{body:JSON.stringify(payload)}:{}),redirect:'error',signal:AbortSignal.timeout(240000)
});
if (!response.ok) {
  let message='Nie udało się potwierdzić wyniku. Sprawdź zużycie w Google Cloud przed kolejną próbą.';
  try {message=(await response.json()).message || message;} catch {}
  throw new Error(`HTTP ${response.status}: ${message}`);
}
if (command==='status') console.log(JSON.stringify(await response.json(),null,2));
else {
  if (!response.body || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error('Serwer nie zwrócił obrazu PNG.');
  temporary=`${target}.${randomBytes(8).toString('hex')}.part`;
  await mkdir(resolve(target,'..'),{recursive:true});
  const file=await open(temporary,'wx',0o600);let bytes=0;
  const limit=new Transform({transform(chunk,_encoding,callback){bytes+=chunk.length;callback(bytes>20*1024*1024?new Error('Zbyt duży obraz.'):null,chunk);}});
  try {
    await pipeline(Readable.fromWeb(response.body),limit,file.createWriteStream());
    await rename(temporary,target);
    console.log(`Zapisano prywatny podgląd PNG (${bytes} bajtów). Nie opublikowano go na stronie.`);
  } catch (error) {await file.close().catch(()=>{});await rm(temporary,{force:true});throw error;}
}
