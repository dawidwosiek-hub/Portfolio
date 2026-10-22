import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, createPublicKey, verify} from 'node:crypto';
import {handleLibrary} from '../src/lib/drive-library.ts';

const root='portfolio_root_001', child='portfolio_child_001', file='portfolio_artwork_001';
const key='local-test-only-not-a-real-library-key';
const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const credentials={client_email:'portfolio@test.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})};
const folderType='application/vnd.google-apps.folder';
const call=(query='',token=key,method='GET')=>handleLibrary(new Request(`https://nadx.example/api/library?${query}`,{method,headers:{Authorization:`Bearer ${token}`}}));

test('library is disabled by default, authenticates before Google, and only reads allowed trees',async()=>{
  const realFetch=globalThis.fetch;
  const names=['DRIVE_LIBRARY_KEY','GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON','DRIVE_LIBRARY_FOLDERS'];
  const previous=names.map(name=>process.env[name]);
  let calls=0;
  try {
    names.forEach(name=>delete process.env[name]);
    globalThis.fetch=async()=>{calls++;throw new Error('Unexpected Google request');};
    assert.equal((await call()).status,404);
    process.env.DRIVE_LIBRARY_KEY=key;
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON=JSON.stringify(credentials);
    process.env.DRIVE_LIBRARY_FOLDERS=root;
    assert.equal((await call('','wrong')).status,401);
    assert.equal(calls,0);
    assert.equal((await call('',key,'POST')).status,405);
    assert.equal((await call('action=list&id=bad')).status,400);

    let tokenCalls=0, downloadCalls=0, mode='normal';
    globalThis.fetch=async(input,options)=>{
      calls++;
      const url=new URL(String(input));
      if (url.hostname==='oauth2.googleapis.com') {
        tokenCalls++;
        const assertion=new URLSearchParams(String(options?.body)).get('assertion')!;
        const [header,payload,signature]=assertion.split('.');
        assert.equal(verify('RSA-SHA256',Buffer.from(`${header}.${payload}`),createPublicKey(privateKey),Buffer.from(signature,'base64url')),true);
        const claims=JSON.parse(Buffer.from(payload,'base64url').toString());
        assert.equal(claims.scope,'https://www.googleapis.com/auth/drive.readonly');
        assert.equal(claims.exp-claims.iat,3600);
        return Response.json({access_token:'mock-google-token',expires_in:3600});
      }
      assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer mock-google-token');
      if (mode==='failure') return new Response('Google internal details must not leak',{status:500});
      if (url.searchParams.get('alt')==='media' || url.pathname.endsWith('/export')) {
        downloadCalls++;
        if (url.pathname.endsWith('/export')) assert.equal(url.searchParams.get('mimeType'),'application/pdf');
        return new Response(new Uint8Array([1,2,3]));
      }
      const id=url.pathname.split('/').pop();
      if (id==='files') {
        assert.equal(url.searchParams.get('q'),`'${child}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.shortcut'`);
        assert.equal(url.searchParams.get('pageToken'),'next-page');
        return Response.json({files:[{id:file,name:'Plakat.pdf',mimeType:'application/pdf',parents:[child]}]});
      }
      const objects:Record<string,unknown>={
        [root]:{id:root,name:'Portfolio',mimeType:folderType,parents:['not_shared_parent']},
        [child]:{id:child,name:'Projekt',mimeType:folderType,parents:[root]},
        [file]:{id:file,name:'Plakat.pdf',mimeType:'application/pdf',parents:[child],size:'3'},
        outside_material:{id:'outside_material',mimeType:'image/png',parents:[]},
        shortcut_material:{id:'shortcut_material',mimeType:'application/vnd.google-apps.shortcut',parents:[root]},
        trashed_material:{id:'trashed_material',mimeType:'image/png',parents:[root],trashed:true},
        huge_material:{id:'huge_material',mimeType:'image/vnd.adobe.photoshop',parents:[root],size:String(101*1024*1024)},
        google_document:{id:'google_document',name:'Opis',mimeType:'application/vnd.google-apps.document',parents:[root]},
        loop_material:{id:'loop_material',mimeType:'image/png',parents:['loop_material']}
      };
      assert.ok(objects[id!],`Unexpected file ${id}`);
      return Response.json(objects[id!]);
    };
    const roots=await call();
    assert.equal(roots.status,200);
    assert.equal(roots.headers.get('cache-control'),'private, no-store');
    assert.match(roots.headers.get('x-robots-tag')!,/noindex/);
    assert.deepEqual(await roots.json(),{folders:[{id:root,name:'Portfolio'}]});
    assert.equal((await call(`action=list&id=${child}&pageToken=next-page`)).status,200);
    const result=await call(`action=download&id=${file}`);
    assert.equal(result.status,200);
    assert.match(result.headers.get('content-disposition')!,/^attachment;/);
    assert.deepEqual([...new Uint8Array(await result.arrayBuffer())],[1,2,3]);
    for (const id of ['outside_material','shortcut_material','trashed_material','loop_material']) {
      assert.equal((await call(`action=download&id=${id}`)).status,403);
    }
    assert.equal((await call('action=download&id=huge_material')).status,413);
    assert.equal(downloadCalls,1);
    const exported=await call('action=download&id=google_document');
    assert.equal(exported.status,200);await exported.arrayBuffer();
    assert.equal(tokenCalls,1,'Google token should be reused without exposing it');
    mode='failure';
    const failure=await call();
    assert.equal(failure.status,502);
    assert.doesNotMatch(await failure.text(),/Google internal details/);
    for (let i=0;i<60;i++) await call('action=invalid');
    assert.equal((await call()).status,429);
  } finally {
    globalThis.fetch=realFetch;
    names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});
  }
});
