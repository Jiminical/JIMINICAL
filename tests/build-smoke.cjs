const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('url');
const {decodePortable}=require('../scripts/portable-codec.cjs');
const {gunzipSync}=require('zlib');
(async()=>{
 const root=path.join(__dirname,'..'),raw=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const payload=raw.split('<script id="portable-payload" type="application/octet-stream">')[1].split('</script>')[0];
 const length=Number(raw.match(/\.textContent,(\d+)\)/)[1]);
 const html=gunzipSync(decodePortable(payload,length)).toString('utf8');
 for(const attr of ['lucy','iboria','hanari','aina','munia','girus','tobi']) {
  const encoded=html.match(new RegExp('data-'+attr+'-src="data:image/webp;base64,([^" ]+)"'))[1];
  assert.deepEqual(Buffer.from(encoded,'base64'),fs.readFileSync(path.join(root,'assets/ld-'+attr+'.webp')));
 }
 assert.ok(Buffer.byteLength(raw)<100*1024**2);console.log('PASS portable payload: all seven portraits byte-identical, below 100 MiB');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 try {
 for(const url of [pathToFileURL(path.join(root,'index.html')).href,'http://127.0.0.1:8765/dist-cloudflare-compact/']) {
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});
  await page.evaluate(()=>guildGame.ready);
  await page.evaluate(async()=>{document.querySelector('#title-screen').hidden=true;await guildGame.start('여행자',()=>{});guildGame.unlock();});
  assert.equal(await page.locator('#dialogue-portrait').getAttribute('data-character'),'lucy');
  assert.deepEqual(errors,[]);console.log('PASS loaded original opening and all game assets: '+url);
  await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
