// Read the supplied strips through the actual library, with touch and keyboard.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/webtoon');fs.mkdirSync(out,{recursive:true});
const order=[1,2,3,4,5,6,7,8,10];
const fixture=()=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:true,hp:1,coins:15,shopOrigin:'city',player:{x:552,y:290,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:3}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'libraryLetter',name:'편지',description:'도착 편지',count:1}],visited:['guild','city','gate','grove','library'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/',checks:[],errors:[],measurements:[]};
 const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 const sizes=process.env.WEBTOON_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]];
 try{for(const [width,height]of sizes){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await context.newPage(),requested=new Set();
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': '+r.status()+' '+r.url())});p.on('request',r=>{if(r.url().includes('/assets/webtoon/'))requested.add(r.url())});
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  await p.waitForFunction(()=>webtoonMedia.getStatus().started);
  const prepared=await p.evaluate(()=>webtoonMedia.preload());
  check(tag+' startup prepares all nine strips before opening the book',prepared.loaded===9&&prepared.failed===0&&prepared.warmed.length===2);
  await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture());
  await p.waitForTimeout(150);check(tag+' startup cache does not open the library reader',!await p.locator('#library-reader').isVisible());
  const before=await p.evaluate(()=>guildGame.getState());await p.keyboard.press('e');await p.waitForFunction(()=>guildGame.getState().archive==='comic');
  check(tag+' bookshelf opens the new comic directly',await p.locator('.archive-comic img').count()===9);
  check(tag+' image order is 1 through 8 then 10',await p.locator('.archive-comic img').evaluateAll((images,order)=>JSON.stringify(images.map(i=>Number(i.dataset.page)))===JSON.stringify(order),order));
  check(tag+' note is the only page text',await p.locator('#archive-page').innerText().then(t=>t.trim()==='프롤로그를 웹툰으로 다시 복기하세요'));
  check(tag+' old generated panels and captions are removed',await p.locator('#archive-page canvas, #archive-page figure, #archive-page figcaption, #archive-page h3').count()===0);
  check(tag+' old chapter index and footer are hidden',!await p.locator('#archive-index').isVisible()&&!await p.locator('.archive-window > footer').isVisible());
  await p.locator('.archive-comic img').first().evaluate(i=>i.decode());
  check(tag+' offscreen animation decoding stays deferred',await p.locator('.archive-comic img:not([src])').count()>=4);
  await p.screenshot({path:path.join(out,tag+'-first.png')});
  const stripBounds=await p.locator('.archive-comic').boundingBox(),scrollBounds=await p.locator('#archive-scroll').boundingBox();
  check(tag+' comic uses the reader width with no chapter sidebar',stripBounds.width>=scrollBounds.width-24&&stripBounds.x>=scrollBounds.x-1);
  for(const number of order){
   const img=p.locator('.archive-comic img[data-page="'+number+'"]');
   await img.evaluate(i=>{const sc=document.querySelector('#archive-scroll');sc.scrollTop=i.offsetTop});await p.waitForFunction(number=>{const i=document.querySelector('.archive-comic img[data-page="'+number+'"]');return i.complete&&i.naturalWidth>0},number);await img.evaluate(i=>i.decode());
   const metrics=await img.evaluate(i=>{const r=i.getBoundingClientRect(),s=document.querySelector('#archive-scroll');return{number:Number(i.dataset.page),naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:r.width,height:r.height,scrollWidth:s.scrollWidth,clientWidth:s.clientWidth,source:i.dataset.source}});
   check(tag+' original strip '+number+' loads without cropping or stretching',metrics.naturalWidth>0&&metrics.naturalHeight>0&&Math.abs(metrics.width/metrics.height-metrics.naturalWidth/metrics.naturalHeight)<.001&&metrics.scrollWidth<=metrics.clientWidth+1&&metrics.source.endsWith('web'+number+(number===10?'.png':'.webp')));
   report.measurements.push({tag,...metrics});
  }
  await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:path.join(out,tag+'-last.png')});
  check(tag+' final image can be read to the bottom',await p.locator('#archive-scroll').evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2));
  // Native touch scrolling must stay inside the reader, never move the world.
  if(width!==1280){const cdp=await context.newCDPSession(p);await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);const r=await p.locator('#archive-scroll').boundingBox(),x=r.x+r.width/2,y=r.y+r.height*.8;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*18,id:1}]});await p.waitForTimeout(20)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
   check(tag+' touch swipe scrolls the images',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>60));
  }
  await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);await p.keyboard.press('s');
  check(tag+' keyboard scrolls the comic',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>=90));
  for(const tab of ['world','people']){await p.locator('[data-archive-tab="'+tab+'"]').click();check(tag+' '+tab+' retains its existing index and content',await p.locator('#archive-index').isVisible()&&await p.locator('#archive-index button').count()>0&&await p.locator('#archive-page canvas').count()===1)}
  await p.locator('[data-archive-tab="comic"]').click();check(tag+' reopening comic starts at the top with only images',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop===0)&&await p.locator('.archive-comic img').count()===9);
  check(tag+' page stays inside the mobile viewport',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await p.locator('#archive-close').click();const after=await p.evaluate(()=>guildGame.getState());
  check(tag+' closing restores field position, quest and inventory',after.phase==='free'&&JSON.stringify(after.player)===JSON.stringify(before.player)&&after.hp===before.hp&&after.coins===before.coins&&after.questAccepted===before.questAccepted&&JSON.stringify(after.items)===JSON.stringify(before.items));
  check(tag+' closing releases distant animation players',await p.evaluate(()=>webtoonMedia.getStatus().activeImages===2));
  check(tag+' v1 save remains valid',await p.evaluate(()=>journeySave.valid(journeySave.read())));
  await p.keyboard.press('e');await p.waitForFunction(()=>guildGame.getState().archive==='comic');await p.locator('#archive-close').click();
  check(tag+' explicit close works immediately after opening',await p.evaluate(()=>guildGame.getState().phase==='free'));
  await context.close();
 }
 check('no webtoon browser or loading errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'webtoon-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
