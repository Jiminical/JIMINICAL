const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/kania-sprites');fs.mkdirSync(out,{recursive:true});
const fixture=()=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'checkpoint',storyStep:'checkpoint',questAccepted:true,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:285,dir:'up'},npcs:[{id:'scout',x:360,y:261,dir:'down',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'dispatch',name:'의뢰서',description:'조사 의뢰서',count:1}],visited:['guild','city','checkpoint'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},regionIntroductions:['zerdia']});
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL,checks:[],errors:[]};const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
try{for(const [width,height]of [[1280,800],[390,844],[320,568],[844,390]]){
 const tag=width+'x'+height,c=await b.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
 await p.evaluate(async s=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;await guildGame.start(s.name,()=>{},s);guildGame.unlock()},fixture());
 const press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(55)};
 await press();for(let i=0;i<6&&await p.evaluate(()=>guildGame.getState().speaker!=='scout');i++)await press();await p.screenshot({path:path.join(out,tag+'-checkpoint-ld.png')});
 check(tag+' checkpoint dialogue reads the new Kania atlas',await p.locator('#dialogue-portrait').getAttribute('data-sheet')==='kania');
 const opaque=await p.locator('#dialogue-portrait').evaluate(e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>200)n++;return n});check(tag+' new LD is visible and fits above the dialogue',opaque>20000&&await p.evaluate(()=>{const a=document.querySelector('#dialogue-portrait-frame').getBoundingClientRect(),d=document.querySelector('#game-dialogue').getBoundingClientRect();return a.top>=0&&a.bottom<=d.top+1}));
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
