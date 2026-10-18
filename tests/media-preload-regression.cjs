// A slow comic transfer must not gate boot or starting the game. Once warmed,
// the first visible comic frame must use cache, with bounded animation decoding.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/media-preload');fs.mkdirSync(out,{recursive:true});
const fixture=()=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:true,hp:1,coins:15,shopOrigin:'city',player:{x:552,y:290,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild','city','grove','library'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8000/dist-cloudflare/',checks:[],errors:[],measurements:[]};const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 try{for(const [width,height]of [[1280,800],[390,844]]){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'});let active=0,peak=0,requests=0;
  await context.addInitScript(()=>{window.__mediaLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__mediaLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});document.addEventListener('keydown',e=>{if(e.code==='KeyE'&&typeof guildGame!=='undefined'&&guildGame.getState().phase==='free'&&guildGame.getState().location==='library'){const at=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>{const i=document.querySelector('.archive-comic img');window.__comicFrameProbe={ms:performance.now()-at,firstReady:!!i&&i.complete&&i.naturalWidth>0}}))}},true)});
  await context.route('**/assets/webtoon/**',async route=>{active++;peak=Math.max(peak,active);requests++;await new Promise(r=>setTimeout(r,800));try{await route.continue()}catch{}finally{active--}});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));await p.goto(report.url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>typeof webtoonMedia!=='undefined'&&!document.documentElement.classList.contains('is-loading'));
  await p.waitForFunction(()=>webtoonMedia.getStatus().started);
  const boot=await p.evaluate(()=>({title:performance.getEntriesByName('greenstoa-title-ready')[0].startTime,preload:webtoonMedia.getStatus()}));
  check(tag+' title becomes interactive before comic downloads begin',boot.preload.startedAt>=boot.title&&boot.preload.loaded<9);
  await p.evaluate(()=>{settings.sound=false;gameAudio.configure({enabled:false,volume:35})});await p.locator('#start-button').click();await p.locator('#story-screen').waitFor();
  check(tag+' game starts while slow comic downloads are pending',await p.evaluate(()=>webtoonMedia.getStatus().loaded<9));
  const ready=await p.evaluate(()=>webtoonMedia.preload());
  check(tag+' all nine originals are cached at startup',ready.loaded===9&&ready.failed===0&&ready.cachedBytes>60_000_000);
  check(tag+' background transfer concurrency is bounded',peak<=ready.concurrency&&ready.peakActive<=ready.concurrency&&ready.peakActive>0);
  check(tag+' only the first two static pages are decoded in advance',ready.warmed.length===2&&ready.activeImages===2);
  await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture());
  const before=requests;await p.keyboard.press('e');await p.waitForFunction(()=>window.__comicFrameProbe);
  const opened=await p.evaluate(()=>window.__comicFrameProbe);
  check(tag+' cached first comic frame appears within 250ms',opened.firstReady&&opened.ms<250);
  await p.waitForTimeout(150);check(tag+' opening the comic makes no repeat source downloads',requests===before&&before===9);
  check(tag+' distant animations are not decoded together',await p.locator('.archive-comic img:not([src])').count()>=4);
  for(const number of [3,5,7,10]){const image=p.locator('.archive-comic img[data-page="'+number+'"]');await image.evaluate(i=>document.querySelector('#archive-scroll').scrollTop=i.offsetTop);await p.waitForFunction(n=>{const i=document.querySelector('.archive-comic img[data-page="'+n+'"]');return i.complete&&i.naturalWidth>0},number)}
  check(tag+' reading animated pages reuses the cached originals',requests===9);
  await p.locator('#archive-close').click();check(tag+' closing keeps only the two static previews decoded',await p.evaluate(()=>webtoonMedia.getStatus().activeImages===2));
  const tasks=await p.evaluate(({start,end})=>window.__mediaLongTasks.filter(t=>t.start>=start&&t.start<=end),{start:ready.startedAt,end:ready.completedAt}),maxTask=Math.max(0,...tasks.map(t=>t.duration));
  check(tag+' background preparation avoids main-thread stalls above 200ms',maxTask<200);
  report.measurements.push({tag,titleReadyMs:boot.title,preloadStartMs:ready.startedAt,preloadReadyMs:ready.completedAt,simulatedLatencyPerFileMs:800,peakTransfers:peak,cacheBytes:ready.cachedBytes,firstComicFrameMs:opened.ms,maxPreparationLongTaskMs:maxTask});
  await context.close();
 }check('no preload browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'media-preload-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
