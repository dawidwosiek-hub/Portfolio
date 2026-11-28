import type {APIRoute} from 'astro';
import {env,validate,validChallenge,rateLimit} from '../../lib/form';
export const prerender=false;
const response=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(status===429?{'Retry-After':'900'}:{})}});
export const POST:APIRoute=async({request,clientAddress})=>{
 const siteURL=env('SITE_URL')||'https://nadx.pl';const allowed=new Set([new URL(siteURL).origin,'https://nadx.pl','https://www.nadx.pl',new URL(request.url).origin]);
 if(!allowed.has(request.headers.get('origin')||''))return response(403,{message:'Odśwież stronę i spróbuj ponownie.'});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return response(415,{message:'Nieobsługiwany format zapytania.'});
 // Bound stream size even when Content-Length is absent or falsified.
 const reader=request.body?.getReader();if(!reader)return response(400,{message:'Brak treści zapytania.'});let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();return response(413,{message:'Zapytanie jest zbyt długie.'});}chunks.push(value);}
 let data:Record<string,unknown>;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!data||Array.isArray(data)||typeof data!=='object')throw new Error();}catch{return response(400,{message:'Nieprawidłowe zapytanie.'});}
 if(data.website || !validChallenge(data.challenge))return response(400,{message:'Nie udało się zweryfikować formularza. Odśwież stronę, odczekaj chwilę i spróbuj ponownie.'});
 const result=validate(data);if(Object.keys(result.errors).length)return response(422,{message:'Sprawdź zaznaczone pola.',errors:result.errors});
 const header=env('TRUSTED_IP_HEADER');const ip=header?request.headers.get(header)?.split(',')[0]?.trim():clientAddress;
 try{if(!await rateLimit(ip||'unknown'))return response(429,{message:'Zbyt wiele prób. Spróbuj ponownie za 15 minut.'});}catch{return response(503,{message:'Ochrona formularza jest chwilowo niedostępna. Spróbuj ponownie później.'});}
 const d=result.data;
 const text=`Zapytanie ze strony NADX\n\nUsługa: ${d.service}\nRealizacja: ${d.project||'—'}\nImię: ${d.name}\nE-mail: ${d.email}\nTelefon: ${d.phone||'—'}\nTermin: ${d.deadline}\nBudżet: ${d.budget||'—'}\nMateriały: ${d.reference||'—'}\n\n${d.description}\n\nPotwierdzono zapoznanie się z informacją o prywatności.`;
 const ok={message:'Dziękuję! Zapytanie dotarło — odpowiem na podany e-mail.'};
 if(env('RESEND_API_KEY')&&env('CONTACT_FROM')&&env('CONTACT_TO')){
 try{
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':`nadx-${String(data.challenge).split('.')[1]}`},body:JSON.stringify({from:env('CONTACT_FROM'),to:[env('CONTACT_TO')],reply_to:d.email,subject:'Nowe zapytanie — NADX',text}),signal:AbortSignal.timeout(12000)});
 const accepted=r.ok?await r.json():null;if(accepted?.id)return response(200,ok);
 }catch{}
 }
 // Bez konfiguracji Resend: FormSubmit przekazuje zapytanie prosto na skrzynkę właściciela.
 const to=env('CONTACT_TO')||'DawidWosiek@gmail.com';
 try{
 const r=await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:'https://nadx.pl',Referer:'https://nadx.pl/kontakt'},
  body:JSON.stringify({_subject:`Nowe zapytanie NADX — ${d.name}`,_replyto:d.email,_template:'table',_captcha:'false',Usluga:d.service,Realizacja:d.project||'—',Imie:d.name,Email:d.email,Telefon:d.phone||'—',Termin:d.deadline,Budzet:d.budget||'—',Materialy:d.reference||'—',Wiadomosc:d.description}),signal:AbortSignal.timeout(15000)});
 const j:any=await r.json().catch(()=>({}));
 if(r.ok&&String(j.success)==='true')return response(200,ok);
 return response(502,{message:'Nie udało się przekazać wiadomości. Spróbuj ponownie — treść jest zachowana.',detail:String(j.message||r.status).slice(0,200)});
 }catch{return response(502,{message:'Usługa pocztowa nie odpowiada. Spróbuj ponownie bez zmieniania treści.'});}
};
