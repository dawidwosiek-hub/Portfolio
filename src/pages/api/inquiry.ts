import type {APIRoute} from 'astro';
import {env,validate,validChallenge,rateLimit} from '../../lib/form';
export const prerender=false;
const response=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(status===429?{'Retry-After':'900'}:{})}});
export const POST:APIRoute=async({request,clientAddress})=>{
 const siteURL=env('SITE_URL');const expected=siteURL?new URL(siteURL).origin:new URL(request.url).origin;
 if(request.headers.get('origin')!==expected)return response(403,{message:'Odśwież stronę i spróbuj ponownie.'});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return response(415,{message:'Nieobsługiwany format zapytania.'});
 // Bound stream size even when Content-Length is absent or falsified.
 const reader=request.body?.getReader();if(!reader)return response(400,{message:'Brak treści zapytania.'});let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();return response(413,{message:'Zapytanie jest zbyt długie.'});}chunks.push(value);}
 let data:Record<string,unknown>;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!data||Array.isArray(data)||typeof data!=='object')throw new Error();}catch{return response(400,{message:'Nieprawidłowe zapytanie.'});}
 if(data.website || !validChallenge(data.challenge))return response(400,{message:'Nie udało się zweryfikować formularza. Odśwież stronę, odczekaj chwilę i spróbuj ponownie.'});
 const result=validate(data);if(Object.keys(result.errors).length)return response(422,{message:'Sprawdź zaznaczone pola.',errors:result.errors});
 const header=env('TRUSTED_IP_HEADER');const ip=header?request.headers.get(header)?.split(',')[0]?.trim():clientAddress;
 try{if(!await rateLimit(ip||'unknown'))return response(429,{message:'Zbyt wiele prób. Spróbuj ponownie za 15 minut.'});}catch{return response(503,{message:'Ochrona formularza jest chwilowo niedostępna. Spróbuj ponownie później.'});}
 if(!env('RESEND_API_KEY')||!env('CONTACT_FROM')||!env('CONTACT_TO')||!env('FORM_SECRET')||!siteURL)return response(503,{message:'Wysyłanie zapytań nie jest jeszcze skonfigurowane. Treść pozostaje w formularzu. Spróbuj ponownie po uruchomieniu kontaktu.'});
 const d=result.data;
 const text=`Zapytanie ze strony NADX\n\nUsługa: ${d.service}\nRealizacja: ${d.project||'—'}\nImię: ${d.name}\nE-mail: ${d.email}\nTelefon: ${d.phone||'—'}\nTermin: ${d.deadline}\nBudżet: ${d.budget||'—'}\nMateriały: ${d.reference||'—'}\n\n${d.description}\n\nPotwierdzono zapoznanie się z informacją o prywatności.`;
 try{
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':`nadx-${String(data.challenge).split('.')[1]}`},body:JSON.stringify({from:env('CONTACT_FROM'),to:[env('CONTACT_TO')],reply_to:d.email,subject:'Nowe zapytanie — NADX',text}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)return response(502,{message:'Nie udało się przyjąć wiadomości. Spróbuj ponownie — treść jest zachowana.'});
 const accepted=await r.json();if(!accepted.id)return response(502,{message:'Brak potwierdzenia przyjęcia wiadomości. Spróbuj ponownie.'});
 return response(200,{message:'Zapytanie zostało przyjęte przez usługę pocztową. Dziękuję — wrócę z odpowiedzią na podany e-mail.'});
 }catch{return response(502,{message:'Usługa pocztowa nie odpowiada. Spróbuj ponownie bez zmieniania treści.'});}
};
