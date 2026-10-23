import {createHash, createSign, timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';

// Private server bridge. No Google credentials, tokens or prompts enter public pages.
const projectDefault='pro-landing-512512-v7';
const accountDefault='nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com';
const ratios=['1:1','3:4','4:3','9:16','16:9'];
const maximumImage=20*1024*1024;
type Config={key:string; project:string; region:string; account:string; model:string; enabled:boolean; limit:number};
type Credentials={type:string; client_email:string; private_key:string};
class StudioError extends Error {
  constructor(public status:number,message:string) {super(message);}
}
let tokenCache:{fingerprint:string; token:string; expires:number}|undefined;
let hourStart=0, generations=0, active=false;
// An id is never retried against Google: even uncertain failures can have consumed credit.
const attempts=new Map<string,number>();
let statusWindow=0,statusCount=0;

function config():Config|undefined {
  const key=process.env.VERTEX_BRIDGE_KEY || '';
  if (key.length<32) return;
  const project=process.env.VERTEX_PROJECT_ID || projectDefault;
  const region=process.env.VERTEX_REGION || 'us-central1';
  const account=process.env.VERTEX_SERVICE_ACCOUNT_EMAIL || accountDefault;
  const model=process.env.VERTEX_IMAGE_MODEL || 'imagen-4.0-generate-001';
  const limit=Number(process.env.VERTEX_IMAGES_PER_HOUR || 3);
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project) || !/^[a-z]+-[a-z]+\d$/.test(region) ||
      !/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.iam\.gserviceaccount\.com$/.test(account) ||
      !/^imagen-[a-z0-9.-]{1,80}$/.test(model) || !Number.isInteger(limit) || limit<1 || limit>20) return;
  return {key,project,region,account,model,enabled:process.env.VERTEX_GENERATION_ENABLED==='true',limit};
}
function json(status:number,body:unknown) {
  return new Response(JSON.stringify(body),{status,headers:{
    'Content-Type':'application/json','Cache-Control':'private, no-store',
    'X-Robots-Tag':'noindex, nofollow, noarchive',...(status===429?{'Retry-After':'60'}:{})
  }});
}
function authenticated(request:Request,key:string) {
  const header=request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ') || header.length>1024) return false;
  const hash=(value:string)=>createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(header.slice(7)),hash(key));
}
async function credentials(configuration:Config):Promise<Credentials> {
  try {
    const text=await readFile(process.env.VERTEX_SERVICE_ACCOUNT_FILE || '/etc/secrets/nadx-vertex.json','utf8');
    const data=JSON.parse(text) as Credentials;
    if (data.type!=='service_account' || data.client_email!==configuration.account || typeof data.private_key!=='string') throw new Error();
    return data;
  } catch {throw new StudioError(503,'Dodaj poprawny prywatny plik nadx-vertex.json w Secret Files usługi Render.');}
}
async function token(configuration:Config) {
  const data=await credentials(configuration);
  const fingerprint=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  if (tokenCache?.fingerprint===fingerprint && tokenCache.expires>Date.now()+60000) return tokenCache.token;
  const now=Math.floor(Date.now()/1000);
  const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload=`${encode({alg:'RS256',typ:'JWT'})}.${encode({
    iss:data.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',
    aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600
  })}`;
  const signature=createSign('RSA-SHA256').update(payload).sign(data.private_key,'base64url');
  const response=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${payload}.${signature}`}),
    signal:AbortSignal.timeout(15000),redirect:'error'
  });
  if (!response.ok) throw new StudioError(502,'Google odrzucił uwierzytelnienie konta usługi.');
  const result=await response.json();
  if (typeof result.access_token!=='string' || typeof result.expires_in!=='number') throw new StudioError(502,'Nieprawidłowa odpowiedź uwierzytelnienia Google.');
  tokenCache={fingerprint,token:result.access_token,expires:Date.now()+Math.min(result.expires_in,3600)*1000};
  return tokenCache.token;
}
async function vertex(configuration:Config,path:string,body?:unknown) {
  const response=await fetch(`https://${configuration.region}-aiplatform.googleapis.com/v1/projects/${configuration.project}/locations/${configuration.region}${path}`,{
    method:body?'POST':'GET',headers:{Authorization:`Bearer ${await token(configuration)}`,...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000),redirect:'error'
  });
  if (response.ok) return response;
  if (response.status===401) tokenCache=undefined;
  const messages:Record<number,string>={
    400:'Google odrzucił parametry lub model. Sprawdź obsługę modelu w wybranym regionie.',
    401:'Google odrzucił uwierzytelnienie konta usługi.',
    403:'Google nie przyznał dostępu. Sprawdź rolę Vertex AI User, włączenie API i ograniczenia konta próbnego.',
    404:'Projekt, region lub wybrany model nie jest dostępny.',
    429:'Google zgłasza wyczerpany limit. Nie ponawiam automatycznie generowania.'
  };
  throw new StudioError(502,messages[response.status] || 'Google jest chwilowo niedostępny. Sprawdź historię użycia przed kolejną próbą.');
}
async function body(request:Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new StudioError(415,'Wymagany format JSON.');
  const reader=request.body?.getReader();
  if (!reader) throw new StudioError(400,'Brak treści.');
  let size=0;const chunks:Uint8Array[]=[];
  while (true) {
    const part=await reader.read();if(part.done) break;
    size+=part.value.length;
    if (size>20000) {await reader.cancel();throw new StudioError(413,'Zapytanie jest za duże.');}
    chunks.push(part.value);
  }
  try {
    const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value!=='object' || Array.isArray(value)) throw new Error();
    return value as Record<string,unknown>;
  } catch {throw new StudioError(400,'Nieprawidłowy JSON.');}
}
export async function handleStudio(request:Request):Promise<Response> {
  const configuration=config();
  if (!configuration) return json(404,{message:'Nie znaleziono.'});
  if (!authenticated(request,configuration.key)) return json(401,{message:'Brak dostępu.'});
  try {
    if (request.method==='GET') {
      if (Date.now()-statusWindow>=60000) {statusWindow=Date.now();statusCount=0;}
      if (++statusCount>20) return json(429,{message:'Odczekaj minutę przed kolejnym sprawdzeniem.'});
      // GET checks OAuth, the API and region access. It never calls a generative model.
      await (await vertex(configuration,'')).body?.cancel();
      return json(200,{connected:true,project:configuration.project,region:configuration.region,account:configuration.account,
        model:configuration.model,generationEnabled:configuration.enabled,imagesPerHour:configuration.limit,
        message:'Uwierzytelnienie i odczyt lokalizacji Vertex AI działają. Nie wykonano generowania; dostęp do modelu i saldo kredytu nie zostały zweryfikowane.'});
    }
    if (request.method!=='POST') return json(405,{message:'Dostępne metody: GET i POST.'});
    if (!configuration.enabled) return json(409,{message:'Generowanie jest wyłączone. Najpierw sprawdź połączenie i warunki wykorzystania kredytu.'});
    const data=await body(request);
    if (Object.keys(data).some(key=>!['prompt','aspectRatio','requestId'].includes(key))) return json(422,{message:'Nieobsługiwane pole. Jeden wniosek generuje wyłącznie jeden obraz.'});
    if (typeof data.prompt!=='string' || data.prompt.trim().length<20 || data.prompt.length>4000 ||
        typeof data.aspectRatio!=='string' || !ratios.includes(data.aspectRatio) ||
        typeof data.requestId!=='string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(data.requestId)) return json(422,{message:'Sprawdź opis, proporcje i identyfikator operacji.'});
    const now=Date.now();
    if (now-hourStart>=3600000) {hourStart=now;generations=0;}
    for (const [id,time] of attempts) if (now-time>86400000) attempts.delete(id);
    if (attempts.has(data.requestId)) return json(409,{message:'Ten identyfikator był już użyty. Sprawdź poprzedni wynik i zużycie; ponowne generowanie wymaga nowej operacji.'});
    if (active || generations>=configuration.limit) return json(429,{message:'Trwa generowanie albo osiągnięto godzinny limit obrazów.'});
    active=true;
    try {
      // Validate credentials before reserving a billed attempt; no automatic retries.
      await token(configuration);
      attempts.set(data.requestId,now);generations++;
      const response=await vertex(configuration,`/publishers/google/models/${configuration.model}:predict`,{
        instances:[{prompt:data.prompt.trim()}],parameters:{sampleCount:1,aspectRatio:data.aspectRatio,
          personGeneration:'dont_allow',addWatermark:true,outputOptions:{mimeType:'image/png'}}
      });
      // Bound provider response memory before parsing base64.
      const reader=response.body?.getReader();if(!reader) throw new StudioError(502,'Google nie zwrócił obrazu.');
      let size=0;const chunks:Uint8Array[]=[];
      while (true) {
        const part=await reader.read();if(part.done) break;
        size+=part.value.length;
        if (size>30*1024*1024) {await reader.cancel();throw new StudioError(502,'Odpowiedź Google przekracza limit rozmiaru.');}
        chunks.push(part.value);
      }
      const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const prediction=result.predictions?.[0];
      if (typeof prediction?.bytesBase64Encoded!=='string' || prediction.mimeType!=='image/png') throw new StudioError(502,'Google nie zwrócił obrazu PNG. Opis mógł zostać odrzucony przez filtr.');
      const image=Buffer.from(prediction.bytesBase64Encoded,'base64');
      if (image.length>maximumImage || !image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new StudioError(502,'Nieprawidłowy obraz w odpowiedzi Google.');
      return new Response(image,{headers:{'Content-Type':'image/png','Content-Disposition':'attachment; filename="nadx-visualization.png"',
        'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}});
    } finally {active=false;}
  } catch (error) {
    return json(error instanceof StudioError?error.status:502,{message:error instanceof StudioError?error.message:
      'Nie udało się potwierdzić wyniku. Nie ponawiam automatycznie operacji; sprawdź użycie w Google Cloud.'});
  }
}
