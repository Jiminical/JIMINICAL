const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/region-intro');fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'guild',storyStep:'lucy',questAccepted:false,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:408,dir:'down'},npcs:[],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},regionIntroductions:[],...patch});
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL,checks:[],errors:[],measurements:[]};
 const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 try{for(const [width,height]of (process.env.REGION_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]])){
  const tag=width+'x'+height,c=await b.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'no-preference'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  const start=async s=>{await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},s);await p.waitForTimeout(80)};
  const press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(45)};
  const capture=async(id,title,subtitle)=>{
   await p.waitForFunction(id=>guildGame.getState().regionIntro===id,id);
   const metrics=await p.evaluate(async()=>{const e=document.querySelector('#region-introduction'),a=e.getAnimations()[0],values=[];a.pause();for(const phase of [0,.1,.5,.9]){a.currentTime=3000*phase;await new Promise(requestAnimationFrame);values.push(Number(getComputedStyle(e).opacity))}a.currentTime=1500;await new Promise(requestAnimationFrame);const t=e.querySelector('h2').getBoundingClientRect(),r=document.querySelector('#game-screen').getBoundingClientRect();return{values,titleBounds:{x:t.x,y:t.y,right:t.right,bottom:t.bottom},centerError:Math.abs((t.x+t.right)/2-(r.x+r.right)/2),fontSize:parseFloat(getComputedStyle(e.querySelector('h2')).fontSize)}});
   report.measurements.push({tag,id,...metrics});
   check(tag+' '+id+' shows exact regional title and subtitle',await p.locator('#region-introduction h2').innerText()===title&&await p.locator('#region-introduction p').innerText()===subtitle);
   check(tag+' '+id+' has a real non-looping fade in and fade out',metrics.values[0]===0&&metrics.values[1]>0&&metrics.values[1]<metrics.values[2]&&metrics.values[2]===1&&metrics.values[3]>0&&metrics.values[3]<1);
   check(tag+' '+id+' large centered text fits the viewport',metrics.fontSize>=26&&metrics.centerError<2&&metrics.titleBounds.x>=0&&metrics.titleBounds.right<=width+1&&metrics.titleBounds.y>=0&&metrics.titleBounds.bottom<=height);
   check(tag+' '+id+' marker is saved before the title completes',await p.evaluate(id=>journeySave.read().regionIntroductions.includes(id),id));
   await p.screenshot({path:path.join(out,tag+'-'+id+'.png')});
  };
  await start(fixture());await press();await capture('zerdia','- 제르디아 왕국 -','제루스 대륙의 초강대국');await press();await p.waitForFunction(()=>guildGame.getState().phase==='free');
  check(tag+' city introduction returns control safely',await p.evaluate(()=>guildGame.getState().location==='city'&&!regionIntroduction.active));
  const saved=await p.evaluate(()=>journeySave.read());saved.player={x:140,y:239,dir:'up'};await start(saved);await press();await p.waitForFunction(()=>guildGame.getState().location==='guild'&&guildGame.getState().phase==='free');
  await p.keyboard.down('s');await p.waitForTimeout(45);await p.keyboard.up('s');await press();await p.waitForFunction(()=>guildGame.getState().location==='city'&&guildGame.getState().phase==='free');
  check(tag+' re-entering the city does not repeat its introduction',await p.locator('#region-introduction').isHidden()&&await p.evaluate(()=>JSON.stringify(guildGame.getState().regionIntroductions)==='["zerdia"]'));
  const old={...saved};delete old.regionIntroductions;await start(old);check(tag+' old city saves migrate without replaying a title',await p.evaluate(()=>guildGame.getState().regionIntroductions.includes('zerdia')&&!regionIntroduction.active));
  await start(fixture({location:'gate',storyStep:'arrival',questAccepted:true,player:{x:360,y:384,dir:'up'},npcs:[{id:'scout',x:360,y:305,dir:'down',talkCount:0}],visited:['guild','city','gate'],regionIntroductions:['zerdia']}));
  check(tag+' Greenstoa title waits for Kania to introduce the country',await p.evaluate(()=>guildGame.getState().speaker==='scout'&&!regionIntroduction.active));
  for(let i=0;i<8&&(await p.evaluate(()=>guildGame.getState().phase))==='dialogue';i++)await press();
  await p.waitForFunction(()=>guildGame.getState().vista==='sanctuary'&&guildGame.getState().phase==='vista');
  check(tag+' Mother Tree cutscene plays before the Greenstoa title',await p.evaluate(()=>!regionIntroduction.active&&!guildGame.getState().regionIntroductions.includes('greenstoa')));
  await press();await press();await capture('greenstoa','- 그린스토아 -','이종족연합국');
  check(tag+' Greenstoa title appears on the gate field after the cutscene',await p.evaluate(()=>guildGame.getState().vista===null&&guildGame.getState().location==='gate'&&guildGame.getState().storyStep==='arrived'));
  const arrival=await p.evaluate(()=>journeySave.read());await press();await p.waitForFunction(()=>guildGame.getState().phase==='free');await start(arrival);
  check(tag+' reload after the cutscene cannot repeat Greenstoa title',await p.locator('#region-introduction').isHidden()&&await p.evaluate(()=>guildGame.getState().storyStep==='arrived'&&guildGame.getState().phase==='free'));
  const dirs=await p.evaluate(()=>['down','left','right','up'].map(dir=>{const e=fieldSprites.make('scout',dir,0),d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let count=0;for(let i=3;i<d.length;i+=4)if(d[i])count++;return{dir,count,width:e.width,height:e.height}}));
  check(tag+' all four new Kania field directions remain readable',dirs.every(d=>d.count>400&&d.width===56&&d.height===80));
  await p.emulateMedia({reducedMotion:'reduce'});await start(fixture());await press();await p.waitForFunction(()=>regionIntroduction.active);
  check(tag+' reduced motion keeps the title readable without animated fading',await p.locator('#region-introduction').evaluate(e=>e.getAnimations().length===0&&getComputedStyle(e).opacity==='1'));
  await p.waitForFunction(()=>guildGame.getState().phase==='free');check(tag+' reduced-motion introduction completes automatically',await p.locator('#region-introduction').isHidden());
  await p.evaluate(()=>guildGame.stop());check(tag+' stopping the game releases the title overlay',await p.evaluate(()=>!regionIntroduction.active)&&await p.locator('#region-introduction').isHidden());
  await c.close();
 }
 check('no region introduction browser errors',report.errors.length===0);
 }finally{await b.close();fs.writeFileSync(path.join(out,'region-intro-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
