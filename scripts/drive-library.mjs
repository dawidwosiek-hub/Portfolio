// Private workstation helper. Never stores downloaded files in the public website.
import {randomBytes} from 'node:crypto';
import {open, mkdir, rename, rm} from 'node:fs/promises';
import {resolve, basename, relative, isAbsolute} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const [command='roots', id, output] = process.argv.slice(2);
if (command==='init') {
  const file=await open('.env.drive-review','wx',0o600);
  try {
    await file.writeFile(`DRIVE_LIBRARY_URL=https://portfolio-a3dl.onrender.com/api/library\nDRIVE_LIBRARY_KEY=${randomBytes(32).toString('hex')}\n`);
  } finally {await file.close();}
  console.log('Utworzono prywatny plik .env.drive-review (poza Git). Skopiuj jego klucz do zmiennej DRIVE_LIBRARY_KEY w Renderze. Nie przesyłaj klucza na czacie.');
  process.exit(0);
}
const key=process.env.DRIVE_LIBRARY_KEY;
const endpoint=process.env.DRIVE_LIBRARY_URL;
if (!key || !endpoint) throw new Error('Brak konfiguracji. Użyj node --env-file=.env.drive-review scripts/drive-library.mjs roots');
const url=new URL(endpoint);
if (url.protocol!=='https:' && !['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Biblioteka wymaga HTTPS.');
if (url.username || url.password) throw new Error('Nie umieszczaj sekretów w adresie.');
if (!['roots','list','download'].includes(command)) throw new Error('Dostępne polecenia: init, roots, list ID_FOLDERU, download ID_PLIKU ŚCIEŻKA.');
if (command!=='roots' && !id) throw new Error('Podaj identyfikator folderu lub pliku.');
if (command==='download' && !output) throw new Error('Podaj ścieżkę docelową poza publiczną stroną.');
url.searchParams.set('action',command);
if (id) url.searchParams.set('id',id);

async function request() {
  const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`},redirect:'error',signal:AbortSignal.timeout(120000)});
  if (!response.ok) {
    let message='Nie udało się odczytać biblioteki.';
    try {message=(await response.json()).message || message;} catch {}
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return response;
}
if (command!=='download') {
  const combined={files:[]};
  do {
    const result=await (await request()).json();
    if (command==='roots') {console.log(JSON.stringify(result,null,2)); break;}
    combined.files.push(...result.files);
    if (result.nextPageToken) url.searchParams.set('pageToken',result.nextPageToken);
    else {console.log(JSON.stringify(combined,null,2)); break;}
  } while (true);
} else {
  const target=resolve(output);
  for (const directory of ['public','dist']) {
    const inside=relative(resolve(directory),target);
    if (!inside || (inside!=='..' && !inside.startsWith('../') && !isAbsolute(inside))) {
      throw new Error('Materiały źródłowe zapisuj poza public/ i dist/. Publikacja wymaga osobnego przygotowania.');
    }
  }
  // A filename from Drive is never used as a local path; the caller chooses it.
  const temporary=resolve(target+'.'+randomBytes(8).toString('hex')+'.part');
  const response=await request();
  if (!response.body) throw new Error('Brak pliku w odpowiedzi.');
  await mkdir(resolve(target,'..'),{recursive:true});
  let bytes=0;
  const limit=new Transform({transform(chunk,_encoding,callback){
    bytes+=chunk.length;
    callback(bytes>100*1024*1024?new Error('Plik przekracza 100 MB.'):null,chunk);
  }});
  const file=await open(temporary,'wx',0o600);
  try {
    await pipeline(Readable.fromWeb(response.body),limit,file.createWriteStream());
    await rename(temporary,target);
    console.log(`Pobrano ${basename(target)} (${bytes} bajtów). Materiał nie został opublikowany.`);
  } catch (error) {await file.close().catch(()=>{}); await rm(temporary,{force:true}); throw error;}
}
