import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {services} from './content';
// Ephemeral fallback only allows a local preview. Production requires FORM_SECRET.
const previewSecret=randomBytes(32).toString('hex');
export function env(name:string){return process.env[name] || import.meta.env?.[name] || '';}
function secret(){return env('FORM_SECRET') || previewSecret;}
export function createChallenge(){const payload=`${Date.now()}.${randomBytes(12).toString('hex')}`;return `${payload}.${createHmac('sha256',secret()).update(payload).digest('hex')}`;}
export function validChallenge(token:unknown){if(typeof token!=='string'||token.length>200)return false;const [time,nonce,sig]=token.split('.');if(!time||!nonce||!sig||!/^\d+$/.test(time)||!/^[a-f0-9]{64}$/.test(sig))return false;const age=Date.now()-Number(time);if(age<1500||age>7200000)return false;const expected=createHmac('sha256',secret()).update(`${time}.${nonce}`).digest();return timingSafeEqual(Buffer.from(sig,'hex'),expected);}
export type Inquiry={service:string;project:string;description:string;deadline:string;budget:string;name:string;email:string;phone:string;reference:string;privacy:boolean};
export function validate(data:Record<string,unknown>){const errors:Record<string,string>={};const out={} as Inquiry;
const limits:Record<string,number>={service:100,project:160,description:5000,deadline:120,budget:120,name:120,email:254,phone:40,reference:2048};
for(const [key,max] of Object.entries(limits)){const v=data[key];(out as unknown as Record<string,unknown>)[key]=typeof v==='string'?v.trim():'';if(typeof v!=='string' && v!==undefined || typeof v==='string'&&v.length>max)errors[key]='Sprawdź długość i format tego pola.';}
if(!services.some(s=>s.slug===out.service))errors.service='Wybierz rodzaj usługi.';
if(out.description.length<20)errors.description='Opisz projekt w co najmniej 20 znakach.';
if(out.name.length<2)errors.name='Podaj imię (co najmniej 2 znaki).';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)||/[\r\n]/.test(out.email))errors.email='Podaj poprawny adres e-mail.';
if(!out.deadline)errors.deadline='Podaj oczekiwany termin lub wpisz „do ustalenia”.';
if(out.reference){try{const u=new URL(out.reference);if(u.protocol!=='https:'||u.username||u.password)throw new Error();}catch{errors.reference='Podaj pełny link HTTPS bez danych logowania.';}}
out.privacy=data.privacy===true;if(!out.privacy)errors.privacy='Potwierdź zapoznanie się z informacją o prywatności.';
return {data:out,errors};}
const attempts=new Map<string,{count:number,until:number}>();
export async function rateLimit(key:string){
 const url=env('UPSTASH_REDIS_REST_URL'), token=env('UPSTASH_REDIS_REST_TOKEN');
 if(url&&token){const hashed=createHmac('sha256',secret()).update(key).digest('hex');const redisKey=`nadx:rate:${hashed}:${Math.floor(Date.now()/900000)}`;
 const r=await fetch(`${url}/pipeline`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify([['INCR',redisKey],['EXPIRE',redisKey,900]]),signal:AbortSignal.timeout(6000)});if(!r.ok)throw new Error('Rate limiter unavailable');const result=await r.json();if(result[0]?.error||typeof result[0]?.result!=='number')throw new Error('Invalid limiter response');return result[0].result<=5;}
 const now=Date.now();for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);
 const current=attempts.get(key);if(current&&current.until>now){current.count++;return current.count<=5;}
 if(attempts.size>=10000)return false;const entry={count:1,until:now+900000};attempts.set(key,entry);const timer=setTimeout(()=>{if(attempts.get(key)===entry)attempts.delete(key);},900000);timer.unref();return true;
}
