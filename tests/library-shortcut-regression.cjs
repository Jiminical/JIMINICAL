const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/library-shortcut');fs.mkdirSync(out,{recursive:true});
const legacy={version:1,savedAt:Date.now(),name:'기존여행자',resume:'world',location:'guild',storyStep:'accepted',questAccepted:true,hp:13,coins:25,shopOrigin:'city',player:{x:360,y:270,dir:'down'},npcs:[{id:'lucy',x:360,y:100,dir:'down',talkCount:3}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false}};
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL,checks:[],errors:[]};
 const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 try{for(const [width,height]of (process.env.SHORTCUT_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]])){
  const tag=width+'x'+height,c=await b.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  check(tag+' new title shows a reachable skip button',await p.locator('#library-skip-button').isVisible()&&await p.locator('#library-skip-button').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));
  await p.locator('#library-skip-button').click();check(tag+' one click opens exactly one confirmation',await p.locator('dialog[open]').count()===1);
  check(tag+' confirmation contains the exact request and signature',await p.locator('#library-skip-question').innerText()==='5분 내외의 게임을 스킵하고 바로 세계관 설정으로 이동합니다. 스킵하시겠습니까?'&&await p.locator('#library-skip-signature').innerText()==='-추광더리우스 3세');
  check(tag+' confirmation and both actions fit the screen',await p.locator('#library-skip-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1})&&await p.locator('#library-skip-dialog button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight+1})));
  await p.screenshot({path:path.join(out,tag+'-confirmation.png')});await p.keyboard.press('Escape');check(tag+' escape cancels without leaving title or creating a save',!await p.locator('#library-skip-dialog').isVisible()&&await p.locator('#title-screen').isVisible()&&await p.evaluate(()=>journeySave.read()===null));
  await p.evaluate(s=>journeySave.write(s),legacy);const before=await p.evaluate(()=>localStorage.getItem(journeySave.key));
  await p.locator('#library-skip-button').click();await p.locator('#library-skip-dialog button[value="cancel"]').click();check(tag+' cancel preserves the existing journey',await p.evaluate(()=>localStorage.getItem(journeySave.key))===before);
  await p.locator('#library-skip-button').click();await p.locator('#library-skip-dialog button[value="confirm"]').click();await p.waitForFunction(()=>guildGame.getState().archive==='world');
  check(tag+' confirm opens library world lore directly',await p.evaluate(()=>guildGame.getState().location==='library'&&guildGame.getState().libraryShortcut&&guildGame.getState().archive==='world'));
  check(tag+' no letter is delivered or added to inventory',await p.evaluate(()=>!libraryLetter.waiting&&guildGame.getState().letter===null&&!guildGame.getState().items.some(i=>i.id==='libraryLetter')));
  const groups=await p.locator('.archive-index-group').evaluateAll(es=>es.map(e=>({title:e.querySelector('h4').textContent,count:e.querySelectorAll('button').length})));
  check(tag+' world sections group four background and three present topics',JSON.stringify(groups)===JSON.stringify([{title:'배경 이야기',count:4},{title:'지금 알아야 할 것',count:3}]));
  for(let i=0;i<7;i++){await p.locator('#archive-index button').nth(i).click();check(tag+' grouped topic '+i+' remains selectable',await p.locator('#archive-index button').nth(i).getAttribute('aria-pressed')==='true')}
  await p.screenshot({path:path.join(out,tag+'-grouped-world.png')});
  await p.locator('#archive-close').click();check(tag+' library visit preserves exact previous save bytes',await p.evaluate(()=>localStorage.getItem(journeySave.key))===before);
  await p.keyboard.press('c');await p.locator('#guild-save').click();check(tag+' manual save during the reading visit preserves the original slot',await p.evaluate(()=>localStorage.getItem(journeySave.key))===before);
  await p.locator('#guild-exit-title').click();await p.waitForFunction(()=>!storyJourney.active);
  check(tag+' returning to title keeps the original continue summary',await p.locator('#title-screen').isVisible()&&await p.locator('#continue-summary').innerText().then(t=>t.includes('기존여행자')&&t.includes('모험가 길드'))&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===before);
  await p.locator('#library-skip-button').click();await p.locator('#library-skip-dialog button[value="confirm"]').click();await p.waitForFunction(()=>guildGame.getState().archive==='world');
  await p.evaluate(async()=>{const s={version:1,savedAt:Date.now(),name:'기존여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:false,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:198,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:0}],inventory:[],visited:['library'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:false,libraryAmbushCleared:true}};await guildGame.start(s.name,()=>{},s,{libraryShortcut:true});guildGame.unlock()});
  await p.locator('#archive-close').click();await p.keyboard.press('e');await p.waitForFunction(()=>guildGame.getState().speaker==='rael');
  check(tag+' Muirshu uses a natural alternate greeting without a fourth-wall reference',await p.locator('#game-dialogue-live').innerText().then(t=>t.includes('기록을 살펴보러 왔나?')&&!/스킵|게임|플레이어|5분/.test(t)));
  check(tag+' new portrait uses the six-expression Muirshu atlas',await p.locator('#dialogue-portrait').getAttribute('data-sheet')==='muirshu');
  await p.screenshot({path:path.join(out,tag+'-muirshu.png')});
  await p.evaluate(()=>guildGame.stop());check(tag+' ending the visit still leaves the real journey untouched',await p.evaluate(()=>localStorage.getItem(journeySave.key))===before);
  // Normal arrivals keep their original letter sequence.
  await p.evaluate(async()=>{const s=journeySave.read();s.location='library';s.storyStep='arrived';s.player={x:360,y:380,dir:'up'};s.npcs=[{id:'rael',x:360,y:108,dir:'down',talkCount:0}];s.fieldFlags.libraryReached=true;s.fieldFlags.libraryAmbushCleared=true;await guildGame.start(s.name,()=>{},s);guildGame.unlock()});
  check(tag+' ordinary play still delivers the letter',await p.evaluate(()=>!guildGame.getState().libraryShortcut&&libraryLetter.delivery!==null));
  check(tag+' mobile viewport has no outer overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await c.close();
 }
 check('no shortcut browser errors',report.errors.length===0);
 }finally{await b.close();fs.writeFileSync(path.join(out,'shortcut-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
