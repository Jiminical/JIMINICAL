const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/portrait-breath');fs.mkdirSync(out,{recursive:true});
const fixture=(id)=>{const location=id==='edan'?'city':id==='rose'?'shop':id==='sena'?'grove':id==='rael'?'library':'guild';const [x,y]=({lucy:[360,100],bran:[552,230],mia:[208,222],nara:[83,330],tobin:[620,268],edan:[500,365],leon:[592,404],rose:[360,106],sena:[143,280],rael:[360,108]})[id];return {version:1,savedAt:Date.now(),name:'여행자',resume:'world',location,storyStep:['grove','library'].includes(location)?'arrived':'lucy',questAccepted:id!=='lucy',hp:18,coins:18,shopOrigin:'city',player:{x,y:y+(id==='lucy'||id==='rose'||id==='rael'?90:-24),dir:(id==='lucy'||id==='rose'||id==='rael')?'up':'down'},npcs:[{id,x,y,dir:'down',talkCount:42}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild','city','gate','grove','library'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL,checks:[],errors:[],measurements:[]};
 const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 try{for(const [width,height]of (process.env.BREATH_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]])){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'no-preference'}),p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  const start=async id=>{await p.evaluate(async save=>{document.body.classList.remove('no-motion');document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture(id));await p.waitForTimeout(100);await p.keyboard.press('e');await p.waitForFunction(id=>document.querySelector('#dialogue-portrait').dataset.character===id&&!document.querySelector('#game-dialogue').hidden,id);await p.waitForTimeout(400)};
  for(const id of (width===1280?['lucy','bran','mia','nara','tobin','edan','leon','rose','sena','rael']:['lucy','mia'])){
   await start(id);
   check(tag+' '+id+' breathes on its own layer during dialogue',await p.locator('#dialogue-portrait-breath').evaluate(e=>e.getAnimations().length===1&&e.getAnimations()[0].playState==='running'&&getComputedStyle(e).animationIterationCount==='infinite'));
  }
  await start('lucy');
  const samples=await p.evaluate(async()=>{const layer=document.querySelector('#dialogue-portrait-breath'),canvas=document.querySelector('#dialogue-portrait'),frame=document.querySelector('#dialogue-portrait-frame'),text=document.querySelector('#game-dialogue-text'),a=layer.getAnimations()[0],duration=a.effect.getTiming().duration,original=canvas.toDataURL(),before=frame.getBoundingClientRect(),textY=text.getBoundingClientRect().top,ys=[];window.breathUnderTest=a;a.pause();for(const phase of [0,.24,.44,.6,.76,.88,.96]){a.currentTime=duration*phase;await new Promise(requestAnimationFrame);const m=new DOMMatrix(getComputedStyle(layer).transform);ys.push(m.m42)}const after=frame.getBoundingClientRect();return {ys,duration,unscaled:getComputedStyle(layer).transform.startsWith('matrix(1, 0, 0, 1,'),samePixels:original===canvas.toDataURL(),sameLayout:before.top===after.top&&before.height===after.height&&textY===text.getBoundingClientRect().top,above:before.top>=0&&before.bottom<=document.querySelector('#game-dialogue').getBoundingClientRect().top+1}});
  report.measurements.push({tag,...samples});
  check(tag+' breathing uses a small reversible integer-pixel cycle',new Set(samples.ys).size>=2&&samples.ys.every(y=>Number.isInteger(y)&&y>=-3&&y<=0)&&samples.ys[0]===0&&samples.ys.at(-1)===0);
  check(tag+' breathing never scales, redraws or shifts the dialogue layout',samples.unscaled&&samples.samePixels&&samples.sameLayout&&samples.above);
  await p.evaluate(()=>{const a=window.breathUnderTest;a.currentTime=a.effect.getTiming().duration*.6});await p.screenshot({path:path.join(out,tag+'-inhale.png')});
  await p.evaluate(()=>{const a=window.breathUnderTest;a.currentTime=0});await p.screenshot({path:path.join(out,tag+'-exhale.png')});
  await p.evaluate(()=>window.breathUnderTest.play());
  await p.keyboard.press('e');await p.waitForFunction(()=>!document.querySelector('#game-choices').hidden);
  check(tag+' waiting for choices preserves the existing breath cycle',await p.evaluate(()=>document.querySelector('#dialogue-portrait-breath').getAnimations()[0]===window.breathUnderTest));
  await p.locator('#game-choices button').filter({hasText:'그린스토아 조사 의뢰'}).click();await p.waitForTimeout(50);
  await p.evaluate(()=>window.sameLineBreath=document.querySelector('#dialogue-portrait-breath').getAnimations()[0]);
  await p.keyboard.press('e');await p.waitForTimeout(60);await p.keyboard.press('e');await p.waitForTimeout(60);
  check(tag+' same-person line changes preserve the existing breath cycle',await p.evaluate(()=>guildGame.getState().line===1&&guildGame.getState().speaker==='lucy'&&document.querySelector('#dialogue-portrait-breath').getAnimations()[0]===window.sameLineBreath));
  await p.evaluate(()=>document.body.classList.add('no-motion'));await p.waitForTimeout(30);
  check(tag+' disabling game motion stops breathing immediately',await p.locator('#dialogue-portrait-breath').evaluate(e=>e.getAnimations().length===0&&getComputedStyle(e).transform==='none'));
  await p.evaluate(()=>document.body.classList.remove('no-motion'));await p.emulateMedia({reducedMotion:'reduce'});
  check(tag+' operating-system reduced motion also stops breathing',await p.locator('#dialogue-portrait-breath').evaluate(e=>e.getAnimations().length===0&&getComputedStyle(e).transform==='none'));
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(30);
  check(tag+' breathing resumes when motion is restored',await p.locator('#dialogue-portrait-breath').evaluate(e=>e.getAnimations().length===1));
  await start('lucy');await p.keyboard.press('e');await p.waitForFunction(()=>!document.querySelector('#game-choices').hidden);await p.keyboard.press('c');
  check(tag+' ending dialogue releases the breathing animation',await p.evaluate(()=>guildGame.getState().phase==='free'&&document.querySelector('#dialogue-portrait-breath').getAnimations().length===0));
  await start('mia');await p.evaluate(()=>guildGame.stop());
  check(tag+' leaving the game releases the breathing animation',await p.locator('#dialogue-portrait-breath').evaluate(e=>e.getAnimations().length===0));
  await context.close();
 }
 check('no portrait animation browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'portrait-breath-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});


