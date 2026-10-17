const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/field-paths');fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'city',storyStep:'accepted',questAccepted:true,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:104,dir:'up'},npcs:[],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'dispatch',name:'의뢰서',description:'조사 의뢰서',count:1}],visited:['guild','city'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8765/dist-cloudflare/',checks:[],errors:[]};
 const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);console.log('PASS '+label)};
 try{for(const [width,height]of [[1280,800],[320,568],[844,390]]){
  const tag=width+'x'+height,ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
  const state=()=>p.evaluate(()=>guildGame.getState());
  const start=async s=>{await p.evaluate(async s=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(s.name,()=>{},s);guildGame.unlock()},s);await p.waitForTimeout(60)};
  const session=width===1280?null:await ctx.newCDPSession(p);
  const walk=async(direction,ms=550)=>{
    if(session){const r=await p.locator('#game-joystick').boundingBox(),centre={x:r.x+r.width/2,y:r.y+r.height/2,id:1};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[centre]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...centre,y:centre.y+(direction==='up'?-42:42)}]});await p.waitForTimeout(ms);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else{const key=direction==='up'?'w':'s';await p.keyboard.down(key);await p.waitForTimeout(ms);await p.keyboard.up(key);}
    await p.waitForTimeout(80);
  };
  const text=()=>p.locator('#game-dialogue-glyphs').innerText();
  const close=async()=>{await p.keyboard.press('e');await p.waitForTimeout(60)};
  const shot=async name=>p.screenshot({path:path.join(out,tag+'-'+name+'.png')});
  await start(fixture());await walk('up');check(tag+' palace door explains lock',(await state()).phase==='dialogue'&&(await text()).includes('왕궁')&&(await text()).includes('굳게 잠겨'));
  check(tag+' lock does not change quest or inventory',(await state()).questAccepted&&(await state()).items.length===2&&(await state()).coins===18);await shot('palace');
  await close();await walk('up',250);check(tag+' holding at same boundary does not spam',(await state()).phase==='free'&&(await state()).player.y>=63);
  await walk('down',900);await walk('up',950);check(tag+' returning to boundary shows narration again',(await state()).phase==='dialogue');
  await start(fixture({player:{x:360,y:440,dir:'down'},objectiveGuide:{unlocked:true,dismissed:false}}));await walk('down');
  check(tag+' southern road enters the new cliff',(await state()).location==='cliff'&&(await state()).phase==='dialogue');
  check(tag+' cliff describes river and impassable drop',(await text()).includes('큰 강')&&(await text()).includes('더 이상 나아갈 수 없'));
  await shot('cliff-narration');await close();check(tag+' lookout updates the objective to return to square',(await p.locator('#game-objective').innerText()).includes('광장으로 돌아가'));await shot('cliff-field');
  await p.keyboard.press('c');await p.locator('#guild-save').click();const saved=await p.evaluate(()=>journeySave.read());
  check(tag+' cliff saves in v1 without changing progress',saved.version===1&&saved.location==='cliff'&&saved.questAccepted&&saved.hp===18&&saved.inventory.length===2);
  await start(saved);check(tag+' cliff save resumes safely',(await state()).location==='cliff'&&(await state()).phase==='free');
  await walk('down',400);check(tag+' railing explains dead end',(await state()).phase==='dialogue'&&(await state()).player.y<=137);
  await start(fixture({location:'cliff',player:{x:360,y:61,dir:'up'},visited:['guild','city','cliff']}));await walk('up');
  check(tag+' cliff returns to original square',(await state()).location==='city'&&(await state()).phase==='free'&&(await state()).player.y===432);
  await start(fixture({location:'checkpoint',storyStep:'checkpoint',player:{x:374,y:246,dir:'up'}}));await walk('up');
  check(tag+' checkpoint asks for credentials',(await state()).phase==='dialogue'&&(await text()).includes('카니아에게 모험가증'));
  check(tag+' checkpoint cannot be bypassed',(await state()).location==='checkpoint'&&(await state()).storyStep==='checkpoint'&&(await state()).player.y>=207);await shot('checkpoint');
  await start(fixture({location:'checkpoint',storyStep:'checkpoint',player:{x:374,y:100,dir:'up'}}));
  check(tag+' old save beyond checkpoint stays playable',(await state()).player.y===228);await walk('down',200);check(tag+' restored player can retreat',(await state()).player.y>228);
  await start(fixture({location:'gate',storyStep:'arrived',player:{x:360,y:400,dir:'down'}}));await walk('down');
  check(tag+' gate southern path has magical seal',(await state()).phase==='dialogue'&&(await text()).includes('마법 잠금')&&(await state()).player.y<=440);await shot('sealed-road');
  await start(fixture({location:'gate',storyStep:'arrived',player:{x:360,y:306,dir:'up'}}));await p.keyboard.press('e');await p.waitForTimeout(150);
  check(tag+' actual Greenstoa entrance remains open',(await state()).location==='grove');
  for(const read of [false,true]){
    await start(fixture({location:'grove',storyStep:'arrived',player:{x:391,y:245,dir:'up'},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:read,libraryLetterRead:read,libraryAmbushCleared:true}}));await walk('up');
    check(tag+' northern grove directs to library '+read,(await state()).phase==='dialogue'&&(await text()).includes('도서관')&&(await state()).player.y>=203);
    if(!read)check(tag+' narration asks for basic information',(await text()).includes('대략적인 정보'));
    check(tag+' boundary does not grant library progress '+read,(await state()).fieldFlags.libraryLetterRead===read);
    if(!read)await shot('grove-north');
  }
  check(tag+' mobile page has no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await ctx.close();
 }
 check('no browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'field-paths-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
