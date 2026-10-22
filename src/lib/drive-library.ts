import {createHash, createSign, timingSafeEqual} from 'node:crypto';

// This integration is server-only and read-only. It is disabled until configured.
const folderType = 'application/vnd.google-apps.folder';
const shortcutType = 'application/vnd.google-apps.shortcut';
const metadataFields = 'id,name,mimeType,parents,size,modifiedTime,trashed';
const maximumDownload = 100 * 1024 * 1024;
type DriveFile = {id:string; name:string; mimeType:string; parents?:string[]; size?:string; modifiedTime?:string; trashed?:boolean};
type Credentials = {client_email:string; private_key:string};
type Config = {key:string; roots:string[]; credentials:Credentials};
export class LibraryError extends Error {
  constructor(public status:number, message:string) { super(message); }
}
let cachedToken:{fingerprint:string; value:string; expires:number}|undefined;
let windowStart = 0;
let requestCount = 0;

function configuration():Config|undefined {
  const key = process.env.DRIVE_LIBRARY_KEY || '';
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || '';
  const roots = (process.env.DRIVE_LIBRARY_FOLDERS || '').split(',').map(v=>v.trim()).filter(Boolean);
  if (key.length < 32 || !raw || !roots.length || roots.some(id=>!validId(id))) return;
  try {
    const credentials = JSON.parse(raw) as Credentials;
    if (!credentials.client_email?.endsWith('.gserviceaccount.com') || !credentials.private_key?.includes('PRIVATE KEY')) return;
    return {key, roots:[...new Set(roots)], credentials};
  } catch { return; }
}
function validId(value:string) { return /^[A-Za-z0-9_-]{10,150}$/.test(value); }
function json(status:number, body:unknown) {
  return new Response(JSON.stringify(body), {status, headers:{
    'Content-Type':'application/json', 'Cache-Control':'private, no-store',
    'X-Robots-Tag':'noindex, nofollow, noarchive',
    ...(status===429 ? {'Retry-After':'60'} : {})
  }});
}
function authorized(request:Request, key:string) {
  const provided = request.headers.get('authorization') || '';
  if (provided.length > 1024 || !provided.startsWith('Bearer ')) return false;
  const digest = (value:string)=>createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided.slice(7)), digest(key));
}
async function accessToken(credentials:Credentials) {
  const fingerprint = createHash('sha256').update(JSON.stringify(credentials)).digest('hex');
  if (cachedToken?.fingerprint===fingerprint && cachedToken.expires>Date.now()+60000) return cachedToken.value;
  const now = Math.floor(Date.now()/1000);
  const encode = (value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({alg:'RS256',typ:'JWT'})}.${encode({
    iss:credentials.client_email, scope:'https://www.googleapis.com/auth/drive.readonly',
    aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`}),
    signal:AbortSignal.timeout(15000), redirect:'error'
  });
  if (!response.ok) throw new LibraryError(502, 'Nie udało się uwierzytelnić konta Google.');
  const token = await response.json();
  if (typeof token.access_token!=='string' || typeof token.expires_in!=='number') throw new LibraryError(502, 'Nieprawidłowa odpowiedź Google.');
  cachedToken = {fingerprint, value:token.access_token, expires:Date.now()+Math.min(token.expires_in,3600)*1000};
  return cachedToken.value;
}
async function google(path:string, config:Config, query:Record<string,string>={}) {
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  for (const [key,value] of Object.entries(query)) url.searchParams.set(key,value);
  const response = await fetch(url, {
    headers:{Authorization:`Bearer ${await accessToken(config.credentials)}`},
    signal:AbortSignal.timeout(60000), redirect:'error'
  });
  if (!response.ok) {
    if (response.status===401) cachedToken=undefined;
    throw new LibraryError(response.status===404 ? 404 : 502, 'Nie można odczytać materiału z Google Drive. Sprawdź udostępnienie kontu usługi.');
  }
  return response;
}
async function metadata(id:string, config:Config):Promise<DriveFile> {
  const file = await (await google(`files/${id}`,config,{fields:metadataFields,supportsAllDrives:'true'})).json() as DriveFile;
  if (file.trashed || file.mimeType===shortcutType) throw new LibraryError(403,'Kosz i skróty nie są dostępne w bibliotece.');
  return file;
}
async function withinRoots(file:DriveFile, config:Config) {
  const seen = new Set<string>();
  let current = file;
  for (let depth=0; depth<40; depth++) {
    if (config.roots.includes(current.id)) return;
    if (seen.has(current.id) || current.parents?.length!==1) break;
    seen.add(current.id);
    current = await metadata(current.parents[0],config);
  }
  throw new LibraryError(403,'Materiał znajduje się poza wskazanymi folderami portfolio.');
}
async function download(file:DriveFile, config:Config) {
  if (file.mimeType===folderType) throw new LibraryError(400,'Wybierz plik, a nie folder.');
  if (file.size && Number(file.size)>maximumDownload) throw new LibraryError(413,'Limit pojedynczego pliku wynosi 100 MB.');
  const native = file.mimeType.startsWith('application/vnd.google-apps.');
  if (native && !['document','spreadsheet','presentation','drawing'].some(type=>file.mimeType===`application/vnd.google-apps.${type}`)) {
    throw new LibraryError(415,'Ten typ dokumentu Google nie obsługuje eksportu do PDF.');
  }
  const response = await google(`files/${file.id}${native?'/export':''}`,config,
    native ? {mimeType:'application/pdf'} : {alt:'media',supportsAllDrives:'true'});
  if (!response.body) throw new LibraryError(502,'Brak zawartości pliku.');
  const reader = response.body.getReader();
  let transferred = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const {done,value}=await reader.read();
        if (done) {controller.close(); return;}
        transferred+=value.length;
        if (transferred>maximumDownload) {await reader.cancel(); controller.error(new Error('Download size limit exceeded')); return;}
        controller.enqueue(value);
      } catch (error) {controller.error(error);}
    },
    cancel(reason) {return reader.cancel(reason);}
  });
  const filename = (file.name+(native?'.pdf':'')).replace(/[\r\n\x00-\x1f\x7f]/g,'').slice(0,220) || 'material';
  const encoded = encodeURIComponent(filename).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(stream,{headers:{
    'Content-Type':'application/octet-stream',
    'Content-Disposition':`attachment; filename="material"; filename*=UTF-8''${encoded}`,
    'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow, noarchive'
  }});
}

export async function handleLibrary(request:Request):Promise<Response> {
  const config = configuration();
  if (!config) return json(404,{message:'Nie znaleziono.'});
  if (!authorized(request,config.key)) return json(401,{message:'Brak dostępu.'});
  if (request.method!=='GET') return json(405,{message:'Biblioteka obsługuje wyłącznie odczyt.'});
  if (Date.now()-windowStart>=60000) {windowStart=Date.now(); requestCount=0;}
  if (++requestCount>60) return json(429,{message:'Odczekaj minutę przed kolejnymi odczytami.'});
  const params = new URL(request.url).searchParams;
  const action = params.get('action') || 'roots';
  try {
    if (action==='roots') {
      const folders=[];
      for (const id of config.roots) {
        const folder=await metadata(id,config);
        if (folder.mimeType!==folderType) throw new LibraryError(400,'Lista dozwolonych lokalizacji musi zawierać foldery.');
        folders.push({id:folder.id,name:folder.name});
      }
      return json(200,{folders});
    }
    if (action!=='list' && action!=='download') throw new LibraryError(400,'Nieprawidłowa operacja.');
    const id=params.get('id') || '';
    if (!validId(id)) throw new LibraryError(400,'Nieprawidłowy identyfikator.');
    const file=await metadata(id,config);
    await withinRoots(file,config);
    if (action==='download') return await download(file,config);
    if (file.mimeType!==folderType) throw new LibraryError(400,'Wybierz folder.');
    const pageToken=params.get('pageToken') || '';
    if (pageToken.length>2048) throw new LibraryError(400,'Nieprawidłowa strona wyników.');
    const query:Record<string,string>={
      q:`'${id}' in parents and trashed = false and mimeType != '${shortcutType}'`,
      fields:`nextPageToken,files(${metadataFields})`,pageSize:'100',orderBy:'folder,name',
      supportsAllDrives:'true',includeItemsFromAllDrives:'true'
    };
    if (pageToken) query.pageToken=pageToken;
    return json(200,await (await google('files',config,query)).json());
  } catch (error) {
    return json(error instanceof LibraryError?error.status:502,{
      message:error instanceof LibraryError?error.message:'Biblioteka jest chwilowo niedostępna. Sprawdź konfigurację i spróbuj ponownie.'
    });
  }
}
