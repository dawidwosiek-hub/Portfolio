// Export the owner's SVG to browser icons and the share image without redrawing the mark.
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const source=Buffer.from((await readFile(new URL('../public/brand/nadx-logo.svg',import.meta.url))).toString('utf8').replace(/\r\n/g,'\n'));
await writeFile(new URL('../public/favicon.svg',import.meta.url),source);
const logoURI=`data:image/svg+xml;base64,${source.toString('base64')}`;
const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#101010"/><path d="M65 63H1135" stroke="#FFCC00" stroke-width="4"/><g font-family="Arial,Helvetica,sans-serif" fill="#F5F3ED"><text x="65" y="122" font-size="18" letter-spacing="3">NADX / GRAFIKA I WIDEO</text><text x="60" y="248" font-size="94" font-weight="700" letter-spacing="-4">Grafika.</text><text x="60" y="347" font-size="94" font-weight="700" letter-spacing="-4">Film.</text><text x="60" y="446" font-size="94" font-weight="700" letter-spacing="-4">Produkcja.</text><text x="65" y="560" font-size="19">KRAKÓW · ZDALNIE W CAŁEJ POLSCE</text></g><image x="695" y="140" width="440" height="445" href="${logoURI}"/></svg>`;
await writeFile(new URL('../public/og.svg',import.meta.url),og+'\n');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const [size,name]of [[32,'favicon-32.png'],[180,'apple-touch-icon.png']]){
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:#ffcc00}img{display:block;width:100%;height:100%;object-fit:contain}</style><img src="${logoURI}" alt="NADX"/>`);
  await page.locator('img').evaluate(i=>i.decode());
  await page.screenshot({path:new URL(`../public/${name}`,import.meta.url).pathname});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.setContent(`<style>body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(og).toString('base64')}" style="display:block" alt="NADX"/>`);
 await page.locator('img').evaluate(i=>i.decode());
 await page.screenshot({path:new URL('../public/og.png',import.meta.url).pathname});await page.close();
}finally{await browser.close();}
console.log('Official SVG exported: favicon.svg, favicon-32.png, apple-touch-icon.png, og.svg, og.png.');
