import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createPublicKey,verify} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handleStudio} from '../src/lib/vertex-studio.ts';

test('Vertex bridge authenticates, validates, checks without generation and bounds billed attempts',async()=>{
  const realFetch=globalThis.fetch,now=Date.now;
  const directory=await mkdtemp(join(tmpdir(),'nadx-vertex-test-'));
  const path=join(directory,'service.json');
  const names=['VERTEX_BRIDGE_KEY','VERTEX_PROJECT_ID','VERTEX_REGION','VERTEX_SERVICE_ACCOUNT_EMAIL','VERTEX_IMAGE_MODEL','VERTEX_IMAGES_PER_HOUR','VERTEX_SERVICE_ACCOUNT_FILE','VERTEX_GENERATION_ENABLED'];
  const previous=names.map(name=>process.env[name]);
  const key='mock-bridge-key-not-a-real-credential';
  const account='nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com';
  const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const credentials={type:'service_account',client_email:account,private_key:privateKey.export({type:'pkcs8',format:'pem'})};
  let requests=0,predictions=0,mode='success';
  let signalStarted:()=>void=()=>{},release:()=>void=()=>{};
  const png=Buffer.from([137,80,78,71,13,10,26,10]);
  const valid={prompt:'A blank business card on a pure white seamless background.',aspectRatio:'3:4',requestId:'test-operation-first-001'};
  const call=(method='GET',data?:unknown,token=key,contentType='application/json')=>handleStudio(new Request('https://nadx.example/api/studio',{
    method,headers:{Authorization:`Bearer ${token}`,'Content-Type':contentType},...(data===undefined?{}:{body:typeof data==='string'?data:JSON.stringify(data)})
  }));
  try {
    names.forEach(name=>delete process.env[name]);
    globalThis.fetch=async()=>{requests++;throw new Error('Unexpected request');};
    assert.equal((await call()).status,404);
    process.env.VERTEX_BRIDGE_KEY=key;
    assert.equal((await call('GET',undefined,'wrong')).status,401);
    assert.equal(requests,0);
    assert.equal((await call('DELETE')).status,405);
    process.env.VERTEX_SERVICE_ACCOUNT_FILE=path;
    assert.equal((await call()).status,503);
    assert.equal((await call('POST',valid)).status,409);
    await writeFile(path,JSON.stringify({...credentials,client_email:'wrong@example.com'}));
    assert.equal((await call()).status,503);
    await writeFile(path,JSON.stringify(credentials));
    globalThis.fetch=async(input,options)=>{
      requests++;
      const url=new URL(String(input));
      if(url.hostname==='oauth2.googleapis.com'){
        const assertion=new URLSearchParams(String(options?.body)).get('assertion')!;
        const [header,payload,signature]=assertion.split('.');
        assert.ok(verify('RSA-SHA256',Buffer.from(`${header}.${payload}`),createPublicKey(privateKey),Buffer.from(signature,'base64url')));
        const claims=JSON.parse(Buffer.from(payload,'base64url').toString());
        assert.equal(claims.iss,account);assert.equal(claims.scope,'https://www.googleapis.com/auth/cloud-platform');
        return Response.json({access_token:'mock-google-token',expires_in:3600});
      }
      assert.equal(url.hostname,'us-central1-aiplatform.googleapis.com');
      assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer mock-google-token');
      if(options?.method==='GET'){
        assert.equal(url.pathname,'/v1/projects/pro-landing-512512-v7/locations/us-central1');
        return Response.json({name:'location'});
      }
      predictions++;
      assert.equal(url.pathname,'/v1/projects/pro-landing-512512-v7/locations/us-central1/publishers/google/models/imagen-4.0-generate-001:predict');
      const payload=JSON.parse(String(options?.body));assert.equal(payload.parameters.sampleCount,1);assert.equal(payload.parameters.addWatermark,true);
      if(mode==='denied')return new Response('private provider details',{status:403});
      if(mode==='network')throw new Error('private network details');
      if(mode==='filtered')return Response.json({predictions:[{raiFilteredReason:'private reason'}]});
      if(mode==='hold'){signalStarted();await new Promise<void>(resolve=>{release=resolve;});}
      return Response.json({predictions:[{mimeType:'image/png',bytesBase64Encoded:png.toString('base64')}]});
    };
    const status=await call();assert.equal(status.status,200);assert.match(status.headers.get('cache-control')!,/no-store/);
    assert.equal((await status.json()).generationEnabled,false);assert.equal(predictions,0);
    process.env.VERTEX_GENERATION_ENABLED='true';
    assert.equal((await call('POST',valid,key,'text/plain')).status,415);
    assert.equal((await call('POST','{')).status,400);
    assert.equal((await call('POST','x'.repeat(20001))).status,413);
    assert.equal((await call('POST',{...valid,sampleCount:100})).status,422);
    assert.equal((await call('POST',{...valid,prompt:'short'})).status,422);
    assert.equal((await call('POST',{...valid,aspectRatio:'invalid'})).status,422);
    assert.equal((await call('POST',{...valid,requestId:'bad'})).status,422);
    assert.equal(predictions,0);
    const generated=await call('POST',valid);assert.equal(generated.status,200);assert.equal(generated.headers.get('content-type'),'image/png');
    assert.deepEqual(Buffer.from(await generated.arrayBuffer()),png);
    assert.equal((await call('POST',valid)).status,409);assert.equal(predictions,1);
    mode='denied';const denied=await call('POST',{...valid,requestId:'test-operation-denied-001'});
    assert.equal(denied.status,502);assert.match(await denied.text(),/Vertex AI User/);
    assert.equal((await call('POST',{...valid,requestId:'test-operation-denied-001'})).status,409);
    mode='network';const uncertain=await call('POST',{...valid,requestId:'test-operation-unknown-001'});
    assert.equal(uncertain.status,502);assert.doesNotMatch(await uncertain.text(),/private network details/);
    assert.equal((await call('POST',{...valid,requestId:'test-operation-limit-001'})).status,429);
    assert.equal(predictions,3);
    Date.now=()=>now()+3600001;
    mode='filtered';const filtered=await call('POST',{...valid,requestId:'test-operation-filtered-001'});
    assert.equal(filtered.status,502);assert.match(await filtered.text(),/filtr/);
    assert.equal((await call('POST',{...valid,requestId:'test-operation-filtered-001'})).status,409);
    mode='hold';const started=new Promise<void>(resolve=>{signalStarted=resolve;});
    const pending=call('POST',{...valid,requestId:'test-operation-concurrent-001'});
    await started;
    try {assert.equal((await call('POST',{...valid,requestId:'test-operation-concurrent-002'})).status,429);}
    finally {release();}
    assert.equal((await pending).status,200);
  } finally {
    globalThis.fetch=realFetch;Date.now=now;
    names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});
    await rm(directory,{recursive:true,force:true});
  }
});
