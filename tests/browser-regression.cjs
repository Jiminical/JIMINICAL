// Run against a built HTTP preview. Uses public save/start API for reproducible
// scene fixtures, then exercises the actual keyboard/touch and UI event paths.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.TEST_OUTPUT || path.join(__dirname,'../../previews');
fs.mkdirSync(out,{recursive:true});
const base=process.env.TEST_URL || 'http://127.0.0.1:8765/dist-cloudflare/';
const report={url:base,checks:[],errors:[],screens:[]};
const check=(label,condition)=>{assert.ok(condition,label);report.checks.push(label);console.log('PASS '+label);};
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'guild',storyStep:'lucy',questAccepted:false,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:188,dir:'up'},npcs:[{id:'lucy',x:360,y:100,dir:'down',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록 증명서',count:1},{id:'bread',name:'마른 빵',description:'끼니',count:2}],visited:['guild'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 try {
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
  const tag=size.width+'x'+size.height;
  const context=await browser.newContext({viewport:size,hasTouch:size.width!==1280,reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': HTTP '+r.status()+' '+r.url());});
  await page.goto(base,{waitUntil:'load'});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('is-loading'));
  await page.evaluate(()=>guildGame.ready);
  const state=()=>page.evaluate(()=>guildGame.getState());
  const start=async save=>{await page.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save?.name||'여행자',()=>{},save);guildGame.unlock();},save);await page.waitForTimeout(100);};
  const press=async(key='e')=>{await page.keyboard.press(key);await page.waitForTimeout(40);};
  const hub=async()=>{for(let i=0;i<25;i++){if(await page.locator('#game-choices').isVisible())return;const s=await state();if(s.phase==='event')await page.waitForTimeout(250);await press();}throw Error('No hub '+JSON.stringify(await state()));};
  const free=async()=>{for(let i=0;i<45;i++){if((await state()).phase==='free')return;if(await page.locator('#game-choices').isVisible())throw Error('Unexpected choice while finishing');await press();await page.waitForTimeout(60);}throw Error('No free phase '+JSON.stringify(await state()));};
  const shot=async name=>{const file=tag+'-'+name+'.png';await page.screenshot({path:path.join(out,file)});report.screens.push(file);};
  const portraitAbove=async label=>{
   const portrait=await page.locator('#dialogue-portrait-frame').boundingBox(),box=await page.locator('#game-dialogue').boundingBox();
   check(tag+' '+label+' portrait above dialogue',portrait.height>60&&portrait.y>=0&&portrait.y+portrait.height<=box.y+1);
   check(tag+' '+label+' dialogue fits viewport',box.y>=0&&box.y+box.height<=size.height+1);
  };
  const pick=async label=>{await page.locator('#game-choices button').filter({hasText:label}).click();await page.waitForTimeout(50);};
  await start(fixture());await press();await hub();
  check(tag+' Lucy 5 options',await page.locator('#game-choices button').count()===5);
  await shot('lucy-hub');
  await portraitAbove('Lucy hub');
  const layout=await page.locator('#dialogue-portrait-frame').boundingBox();check(tag+' portrait visible and in viewport',layout.width>60&&layout.height>60&&layout.y>=0&&layout.y+layout.height<=size.height+2);
  await press('ArrowDown');check(tag+' one arrow advances one option',await page.locator('#game-choices .is-current').innerText().then(t=>t.includes('25관왕')));
  await page.keyboard.down('e');await page.keyboard.down('e');await page.waitForTimeout(150);check(tag+' held E does not skip lines',(await state()).line===0);await page.keyboard.up('e');
  await hub();check(tag+' answered topic disappears',!(await page.locator('#game-choices').innerText()).includes('25관왕'));
  await pick('다른 의뢰');await hub();await pick('밥은');await hub();check(tag+' all three Lucy topics consumed',await page.locator('#game-choices button').count()===2);await press('c');check(tag+' exit restores world',(await state()).phase==='free');
  // Read-only notices via actual E interaction.
  for(const accepted of [false,true]){
   const save=fixture({questAccepted:accepted,storyStep:accepted?'accepted':'lucy',player:{x:155,y:192,dir:'up'},npcs:[],objectiveGuide:{unlocked:true,dismissed:false}});
   await start(save);await press();check(tag+' board opens '+accepted,(await state()).phase==='board');check(tag+' HUD hidden on board',!(await page.locator('#game-objective').isVisible()));
   check(tag+' board acceptance '+accepted,(await page.locator('.notice-status').innerText()).includes(accepted?'수락 완료':'미수락'));
   for(let i=1;i<4;i++){await page.locator('#notice-board-list button').nth(i).click();check(tag+' notice '+i+' read only '+accepted,(await state()).questAccepted===accepted&&(await state()).items.length===2);}
   await shot('board-'+accepted);await press('Escape');check(tag+' board closes and releases focus '+accepted,(await state()).phase==='free'&&await page.locator('#guild-world').evaluate(e=>!e.inert));
  }
  // Munia unlocks only at the end of the briefing, then persists dismissal.
  const munia=fixture({player:{x:592,y:380,dir:'down'},npcs:[{id:'leon',x:592,y:404,dir:'up',talkCount:0}]});
  await start(munia);await press();check(tag+' briefing not prematurely unlocked',!(await state()).objectiveGuide.unlocked);await hub();check(tag+' completed briefing unlocks guide',(await state()).objectiveGuide.unlocked);await press('c');
  check(tag+' objective appears in free world',await page.locator('#game-objective').isVisible());await shot('objective');await page.locator('.objective-close').click();
  check(tag+' dismissal saved',await page.evaluate(()=>journeySave.read().objectiveGuide.dismissed));
  const saved=await page.evaluate(()=>journeySave.read());await start(saved);check(tag+' dismissal restored',!(await page.locator('#game-objective').isVisible()));
  await press('c');await page.locator('[data-menu-tab="quest"]').click();await page.locator('#objective-menu-toggle').click();check(tag+' objective stays hidden inside menu',!(await page.locator('#game-objective').isVisible()));await press('c');check(tag+' quest tab reopens guide',await page.locator('#game-objective').isVisible());
  // All other NPCs: three topics, no rewards, no implicit party or boarding.
  for(const [id,xy] of Object.entries({bran:[552,230],mia:[208,222],nara:[83,330],tobin:[620,268],edan:[500,365],leon:[592,404]})){
   const city=id==='edan',save=fixture({location:city?'city':'guild',player:{x:xy[0],y:xy[1]-24,dir:'down'},npcs:[{id,x:xy[0],y:xy[1],dir:'down',talkCount:0}],objectiveGuide:{unlocked:true,dismissed:false}});
   await start(save);await press();await hub();
   const labels=await page.evaluate(id=>characterChats[id].topics.map(t=>t.label),id);
   await shot(id+'-hub');
   await portraitAbove(id+' hub');
   for(const label of labels){await pick(label);await hub();check(tag+' '+id+' consumed '+label,!(await page.locator('#game-choices').innerText()).includes(label));}
   await press('c');check(tag+' '+id+' safe exit',(await state()).phase==='free'&&!(await state()).questAccepted&&(await state()).items.length===2);
  }
  // Complete Lucy's original seal event and ensure dispatch cannot duplicate.
  await start(fixture());await press();await hub();await pick('조사 의뢰');await hub();await pick('조사 의뢰를 맡는다');await free();
  check(tag+' seal grants exactly one dispatch',(await state()).questAccepted&&(await state()).items.filter(i=>i.id==='dispatch').length===1);
  await press();await hub();await pick('맡은 의뢰');await free();check(tag+' repeat quest grants no second dispatch',(await state()).items.find(i=>i.id==='dispatch').count===1);
  // Held keyboard movement survives E; joystick and run pointers are independent.
  await start(fixture({player:{x:360,y:270,dir:'down'},npcs:[]}));const before=(await state()).player;await page.keyboard.down('s');await page.waitForTimeout(150);await press();await page.waitForTimeout(150);await page.keyboard.up('s');check(tag+' held movement survives E',(await state()).player.y>before.y+12);
  if(size.width!==1280){
    await start(fixture({player:{x:350,y:270,dir:'down'},npcs:[]}));
    const session=await context.newCDPSession(page);
    const pad=await page.locator('#game-joystick').boundingBox(),run=await page.locator('[data-game-key="ShiftLeft"]').boundingBox();
    const centre={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1},a={...centre,x:centre.x+26,y:centre.y-26},b={x:run.x+run.width/2,y:run.y+run.height/2,id:2};
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[centre]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a]});await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await page.waitForTimeout(180);
    const diagonal=(await state()).player;check(tag+' touch diagonal',diagonal.x>350&&diagonal.y<270);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[b]});await page.waitForTimeout(150);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check(tag+' releasing run preserves joystick',(await state()).player.x>diagonal.x);
  }
  await context.close();
 }
 check('no browser errors',report.errors.length===0);
 } finally {await browser.close();fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
