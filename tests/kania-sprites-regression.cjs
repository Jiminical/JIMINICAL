const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/kania-sprites');fs.mkdirSync(out,{recursive:true});
const fixture=()=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'checkpoint',storyStep:'checkpoint',questAccepted:true,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:285,dir:'up'},npcs:[{id:'scout',x:360,y:261,dir:'down',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'dispatch',name:'의뢰서',description:'조사 의뢰서',count:1}],visited:['guild','city','checkpoint'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},regionIntroductions:['zerdia']});
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL,checks:[],errors:[]};const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
try{for(const [width,height]of [[1280,800],[390,844],[320,568],[844,390]]){
 const tag=width+'x'+height,c=await b.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
 // Expose only the existing private painter in this test page, without shipping a debug API.
 await p.route('**/JS/game.js',async route=>{const response=await route.fetch({maxRetries:2}),source=(await response.text()).replace(/\r\n/g,'\n'),needle='  return {\n    ready,';assert.ok(source.includes(needle));await route.fulfill({response,body:source.replace(needle,'  window.__paintKaniaForRegression = expression => portraitFor("scout",expression);\n'+needle)})});
 await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
 await p.evaluate(async s=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;await guildGame.start(s.name,()=>{},s);guildGame.unlock()},fixture());
 const press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(55)};
 await press();for(let i=0;i<6&&await p.evaluate(()=>guildGame.getState().speaker!=='scout');i++)await press();await p.screenshot({path:path.join(out,tag+'-checkpoint-ld.png')});
 check(tag+' checkpoint dialogue reads the new Kania atlas',await p.locator('#dialogue-portrait').getAttribute('data-sheet')==='kania');
 const opaque=await p.locator('#dialogue-portrait').evaluate(e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>200)n++;return n});check(tag+' new LD is visible and fits above the dialogue',opaque>20000&&await p.evaluate(()=>{const a=document.querySelector('#dialogue-portrait-frame').getBoundingClientRect(),d=document.querySelector('#game-dialogue').getBoundingClientRect();return a.top>=0&&a.bottom<=d.top+1}));
 for(const expression of ['neutral','warning','skeptical','explaining','welcoming','flustered']){
  await p.evaluate(expression=>window.__paintKaniaForRegression(expression),expression);await p.waitForTimeout(30);
  const pieces=await p.locator('#dialogue-portrait').evaluate(e=>{const w=e.width,h=e.height,d=e.getContext('2d').getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),areas=[];let clipped=false;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=y*w+x;if(d[k*4+3]<96||seen[k])continue;if(x===0||x===w-1||y===0)clipped=true;const q=[k];seen[k]=1;let n=0;while(q.length){const at=q.pop(),xx=at%w,yy=Math.floor(at/w);n++;for(const [nx,ny]of [[xx-1,yy],[xx+1,yy],[xx,yy-1],[xx,yy+1],[xx-1,yy-1],[xx+1,yy-1],[xx-1,yy+1],[xx+1,yy+1]])if(nx>=0&&nx<w&&ny>=0&&ny<h){const j=ny*w+nx;if(!seen[j]&&d[j*4+3]>=96){seen[j]=1;q.push(j)}}}areas.push(n)}return{areas:areas.sort((a,b)=>b-a),clipped}});
  await p.screenshot({path:path.join(out,tag+'-'+expression+'.png')});
  check(tag+' '+expression+' has no detached neighboring sprite or clipped head '+JSON.stringify(pieces),pieces.areas[0]>20000&&(pieces.areas[1]||0)<=4&&!pieces.clipped);
 }
 for(let i=0;i<32&&!await p.locator('#game-choices').isVisible();i++)await press();
 check(tag+' credentials lead to the original Kania walking conversation',await p.evaluate(()=>guildGame.getState().action==='guide')&&await p.locator('#game-choices button').count()===4);
 check(tag+' walking shot retains the upper-body framing',await p.locator('#story-action').getAttribute('data-framing')==='upper-body');
 await p.screenshot({path:path.join(out,tag+'-guide.png')});
 const atlas=await p.evaluate(async()=>{const image=new Image();image.src=document.querySelector('#guild-assets').dataset.kaniaSrc;await image.decode();const cv=document.createElement('canvas');cv.width=image.naturalWidth/3;cv.height=image.naturalHeight/2;const ctx=cv.getContext('2d'),counts=[];for(let i=0;i<6;i++){ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(image,i%3*cv.width,Math.floor(i/3)*cv.height,cv.width,cv.height,0,0,cv.width,cv.height);const d=ctx.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let k=3;k<d.length;k+=4)if(d[k]>128)n++;counts.push(n)}return counts});
 check(tag+' all six new expression cells contain complete artwork',atlas.length===6&&atlas.every(n=>n>15000));
 for(const label of ['하이엘프인데','아까부터','좋아하는 사람']){
  const button=p.locator('#game-choices button').filter({hasText:label});await button.click();
  for(let i=0;i<30&&!(await p.locator('#game-choices').isVisible())&&(await p.evaluate(()=>guildGame.getState().location))!=='gate';i++)await press();
 }
 await p.waitForFunction(()=>guildGame.getState().location==='gate');check(tag+' all three walking chats still lead to the gate',await p.evaluate(()=>guildGame.getState().location==='gate'));
 await c.close();
}check('no new Kania sprite browser errors',report.errors.length===0)}finally{await b.close();fs.writeFileSync(path.join(out,'kania-sprites-report.json'),JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
