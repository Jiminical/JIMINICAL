const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/joystick');
fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'guild',storyStep:'lucy',questAccepted:false,hp:18,coins:18,shopOrigin:'city',player:{x:350,y:270,dir:'down'},npcs:[],inventory:[{id:'credentials',name:'모험가증',description:'등록 증명서',count:1}],visited:['guild'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={checks:[],errors:[]};
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
 try{
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  const tag=viewport.width+'x'+viewport.height,ctx=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce'}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/dist-cloudflare/');await page.evaluate(()=>guildGame.ready);
  const session=await ctx.newCDPSession(page);let activePoints=[];
  const touch=async(type,points)=>{if(!activePoints.length&&!points.length)return;const lifted=type==='touchEnd'&&points.length?activePoints.filter(p=>!points.some(q=>q.id===p.id)):points;await session.send('Input.dispatchTouchEvent',{type,touchPoints:lifted});activePoints=points;await page.waitForTimeout(25);};
  const state=()=>page.evaluate(()=>guildGame.getState());
  const start=async(save=fixture())=>{await touch('touchEnd',[]);await page.evaluate(async s=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(s.name,()=>{},s);guildGame.unlock()},save);await page.waitForTimeout(80);};
  await start();
  const pad=await page.locator('#game-joystick').boundingBox(),r=await page.locator('[data-game-key="ShiftLeft"]').boundingBox(),e=await page.locator('[data-game-key="KeyE"]').boundingBox();
  const centre={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1},run={x:r.x+r.width/2,y:r.y+r.height/2,id:2},interact={x:e.x+e.width/2,y:e.y+e.height/2,id:2};
  check(tag+' joystick fits viewport',pad.x>=0&&pad.y>=0&&pad.y+pad.height<=viewport.height);
  const hold=async(dx,dy,ms=280)=>{await start();await touch('touchStart',[centre]);const point={...centre,x:centre.x+dx,y:centre.y+dy};await touch('touchMove',[point]);await page.waitForTimeout(ms);const p=(await state()).player;await touch('touchEnd',[]);return{x:p.x-350,y:p.y-270};};
  const dead=await hold(2,1);check(tag+' centre dead zone prevents drift',Math.hypot(dead.x,dead.y)<0.1);
  const slow=await hold(13,0),full=await hold(42,0);check(tag+' tilt controls walking speed',full.x>slow.x*2&&slow.x>2);
  const oblique=await hold(36,-12);check(tag+' continuous angles beyond eight directions '+JSON.stringify(oblique),oblique.x>6&&oblique.y<-1&&Math.abs(oblique.x/oblique.y+3)<0.25);
  const diagonal=await hold(28,-28);check(tag+' diagonal speed capped',Math.abs(Math.hypot(diagonal.x,diagonal.y)/full.x-1)<0.2);
  const released=(await state()).player;await page.waitForTimeout(160);const stopped=(await state()).player;check(tag+' release stops and recentres',Math.hypot(stopped.x-released.x,stopped.y-released.y)<0.1&&!await page.locator('#game-joystick').evaluate(e=>e.classList.contains('is-held')));
  await start();const point={...centre,y:centre.y+42};await touch('touchStart',[centre]);await touch('touchMove',[point]);await touch('touchStart',[point,run]);await page.waitForTimeout(280);const running=(await state()).player;check(tag+' separate finger enables running',running.y-270>full.x*1.35);
  await touch('touchEnd',[point]);await page.waitForTimeout(160);check(tag+' releasing run keeps movement',(await state()).player.y>running.y+5&&!await page.locator('[data-game-key="ShiftLeft"]').evaluate(e=>e.classList.contains('is-held')));
  await touch('touchStart',[point,run]);await touch('touchEnd',[run]);const noStick=(await state()).player;await page.waitForTimeout(120);check(tag+' releasing stick stops even with run held',Math.abs((await state()).player.y-noStick.y)<0.1);await touch('touchEnd',[]);
  await start();await touch('touchStart',[centre]);await touch('touchMove',[point]);await touch('touchStart',[point,interact]);await touch('touchEnd',[point]);const afterE=(await state()).player;await page.waitForTimeout(150);check(tag+' E finger does not interrupt movement',(await state()).phase==='free'&&(await state()).player.y>afterE.y+4);await touch('touchEnd',[]);
  await start();await touch('touchStart',[centre]);await touch('touchMove',[point]);await touch('touchCancel',[]);const cancel=(await state()).player;await page.waitForTimeout(130);check(tag+' interrupted gesture cannot stick',Math.abs((await state()).player.y-cancel.y)<0.1);
  await start();await touch('touchStart',[centre]);await touch('touchMove',[point]);await page.keyboard.press('c');await page.waitForTimeout(80);check(tag+' menu resets joystick',!(await page.locator('#game-joystick').evaluate(e=>e.classList.contains('is-held'))));await page.keyboard.press('c');const closed=(await state()).player;await page.waitForTimeout(120);check(tag+' no drift after closing menu',Math.abs((await state()).player.y-closed.y)<0.1);await touch('touchEnd',[]);
  await start(fixture({player:{x:360,y:188,dir:'up'},npcs:[{id:'lucy',x:360,y:100,dir:'down',talkCount:0}]}));await touch('touchStart',[centre]);await touch('touchStart',[centre,interact]);await touch('touchEnd',[centre]);await page.waitForTimeout(80);check(tag+' dialogue resets joystick',(await state()).phase==='dialogue'&&!await page.locator('#game-joystick').evaluate(e=>e.classList.contains('is-held')));await touch('touchEnd',[]);
  await start();await touch('touchStart',[centre]);await page.waitForTimeout(900);check(tag+' long hold selects no text',await page.evaluate(()=>getSelection().toString()===''));
  check(tag+' selection and context menu blocked',await page.locator('#game-joystick').evaluate(e=>getComputedStyle(e).userSelect==='none'&&!e.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))&&!e.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true}))));await touch('touchEnd',[]);
  await start();await touch('touchStart',[centre]);await touch('touchMove',[{...centre,x:centre.x+26,y:centre.y-15}]);await page.screenshot({path:path.join(out,tag+'-joystick.png')});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blur=(await state()).player;await page.waitForTimeout(130);check(tag+' app blur clears movement',Math.hypot((await state()).player.x-blur.x,(await state()).player.y-blur.y)<0.1);
  await ctx.close();
 }
 check('no browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'joystick-report.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
