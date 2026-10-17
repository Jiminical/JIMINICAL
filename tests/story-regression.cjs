// Preserve the existing journey through real interactions, starting from v1 saves.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews');
const flags={lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false};
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'city',storyStep:'accepted',questAccepted:true,hp:18,coins:18,shopOrigin:'city',player:{x:500,y:341,dir:'down'},npcs:[{id:'edan',x:500,y:365,dir:'right',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'dispatch',name:'의뢰서',description:'조사 의뢰서',count:1}],visited:['guild','city'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:flags,objectiveGuide:{unlocked:true,dismissed:false},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const checks=[],errors=[],record=(label,condition)=>{assert.ok(condition,label);checks.push(label);console.log('PASS '+label);};
 try {
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/dist-cloudflare/');await page.evaluate(()=>guildGame.ready);
 const state=()=>page.evaluate(()=>guildGame.getState());
 const start=async save=>{await page.evaluate(async save=>{document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock();},save);await page.waitForTimeout(150);};
 const press=async()=>{await page.keyboard.press('e');await page.waitForTimeout(90);};
 const until=async(predicate,timeout=90000)=>{const end=Date.now()+timeout;while(Date.now()<end){const s=await state();if(await predicate(s))return s;await press();}throw Error('Story timeout '+JSON.stringify(await state()));};
 const hub=()=>until(async()=>page.locator('#game-choices').isVisible());
 const free=()=>until(s=>s.phase==='free');
 const pick=async label=>{await page.locator('#game-choices button').filter({hasText:label}).click();await page.waitForTimeout(150);};
 await start(fixture({questAccepted:false,storyStep:'lucy'}));await press();await hub();await pick('마차에 탑승');await free();record('unaccepted quest blocks carriage',(await state()).location==='city');
 await start(fixture());await press();await hub();await pick('마차에 탑승');await hub();await pick('조금 더');await free();record('boarding cancellation restores city',(await state()).location==='city');
 await press();await hub();await pick('마차에 탑승');await hub();await pick('출발한다');
 const seen=new Set();await until(s=>{seen.add(s.phase);if(s.vista)seen.add(s.vista);return s.location==='checkpoint'&&s.phase==='free';});
 record('departure reaches checkpoint with original carriage and forest vista',seen.has('event')&&seen.has('forest')&&(await state()).storyStep==='checkpoint');
 const checkpoint=await page.evaluate(()=>journeySave.read());checkpoint.player={x:360,y:285,dir:'up'};
 await start(checkpoint);await press();await until(async s=>{if(await page.locator('#game-choices').isVisible()){await pick('풍경');}return s.location==='gate'&&s.phase==='free';});
 record('credentials and Kania escort reach Greenstoa gate',(await state()).storyStep==='arrived');
 await start(fixture({location:'grove',storyStep:'arrived',hp:1,player:{x:529,y:213,dir:'up'},npcs:[]}));await press();
 await until(s=>s.phase==='battle'&&s.battle.stage==='command');
 record('forest ambush hides objective',!(await page.locator('#game-objective').isVisible()));
 await page.locator('[data-battle-command="info"]').click();record('battle detail inspection works',(await state()).battle.stage==='info');await until(s=>s.battle?.stage==='command');
 await page.locator('[data-battle-command="attack"]').click();
 const stages=new Set();await until(async s=>{if(s.battle){stages.add(s.battle.stage);assert.ok(s.battle.hp>=1);if(s.battle.stage==='command')await page.keyboard.press('Digit1');}return s.battle?.stage==='won';},120000);
 record('HP1 bullet phase and Kania rescue arrow complete',stages.has('desperation')&&stages.has('arrow')&&(await state()).battle.rescued);
 await page.screenshot({path:path.join(out,'story-rescue.png')});await free();record('rescue restores world and HP1 save',(await state()).hp===1&&(await state()).fieldFlags.libraryAmbushCleared);
 const rescued=await page.evaluate(()=>journeySave.read());rescued.player={x:529,y:213,dir:'up'};rescued.npcs=[];
 await start(rescued);await press();await until(s=>s.location==='library'&&s.letter==='reading');
 record('library letter hides objective',!(await page.locator('#game-objective').isVisible()));await page.screenshot({path:path.join(out,'story-letter.png')});await free();
 record('letter stored once',(await state()).items.filter(i=>i.id==='libraryLetter').length===1);
 const saved=await page.evaluate(()=>journeySave.read());await start(saved);record('library save reload preserves HP1, letter and completed ambush',(await state()).hp===1&&(await state()).fieldFlags.libraryAmbushCleared&&(await state()).items.find(i=>i.id==='libraryLetter').count===1);
 record('no story browser errors',errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'story-report.json'),JSON.stringify({checks,errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
