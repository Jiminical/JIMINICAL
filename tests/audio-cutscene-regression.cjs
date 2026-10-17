// Verify the real checkpoint cutscene and music transitions, including old saves.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/audio-cutscene');fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'grove',storyStep:'arrived',questAccepted:true,hp:1,coins:18,shopOrigin:'city',player:{x:529,y:213,dir:'up'},npcs:[],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild','city','checkpoint','gate','grove'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},journeyMusic:{active:true,offset:24},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/',checks:[],errors:[],measurements:[]};
 const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);console.log('PASS '+label)};
 try{for(const [width,height]of [[1280,800],[320,568],[844,390]]){
  const tag=width+'x'+height,ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'});
  await ctx.addInitScript(()=>{const Audio=window.AudioContext||window.webkitAudioContext,create=Audio.prototype.createMediaElementSource;window.__musicProbes={};Audio.prototype.createMediaElementSource=function(element){const source=create.call(this,element),connect=source.connect.bind(source);source.connect=(destination,...args)=>{const result=connect(destination,...args);if(['battle-music','greenstoa-music'].includes(element.id)){const analyser=this.createAnalyser();analyser.fftSize=2048;destination.connect(analyser);window.__musicProbes[element.id]=analyser}return result};return source}});
  const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': '+r.status()+' '+r.url())});
  await p.goto(report.url);await p.evaluate(()=>guildGame.ready);await p.locator('#game-sound-toggle').evaluate(e=>e.click());await p.evaluate(async()=>{settings.sound=true;gameAudio.configure({enabled:true,volume:35});await gameAudio.unlock()});
  const state=()=>p.evaluate(()=>guildGame.getState()),press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(65)};
  const start=async save=>{await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},save);await p.waitForTimeout(130)};
  const until=async predicate=>{const end=Date.now()+90000;while(Date.now()<end){if(await predicate(await state()))return;await press()}throw Error('Scene timeout '+JSON.stringify(await state()))};
  const signal=async id=>p.evaluate(id=>{const d=new Float32Array(2048);window.__musicProbes[id].getFloatTimeDomainData(d);return Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length)},id);
  check(tag+' Greenstoa reuses original Pixel Memories URL',await p.evaluate(()=>document.querySelector('#greenstoa-music').src===document.querySelector('#opening-music').src));
  check(tag+' battle selects Makai Toppa Sen',await p.evaluate(()=>document.querySelector('#battle-music').getAttribute('src').endsWith('makai-toppa-sen.mp3')));
  // Prime the city exactly as a player does before traveling to the checkpoint.
  await start(fixture({location:'city',storyStep:'accepted',player:{x:350,y:280,dir:'down'}}));
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{settings.motion=true;document.body.classList.remove('no-motion');window.__rogueNature=[];const draw=livingNature.draw;livingNature.draw=function(c,image,key,...rest){if(c.canvas.id==='action-art'){window.__rogueNature.push({key,width:image.width,height:image.height});if(!window.__rogueBackground)window.__rogueBackground=image.toDataURL()}return draw.call(this,c,image,key,...rest)}});
  await start(fixture({location:'carriage',storyStep:'carriage',player:{x:250,y:326,dir:'right'},npcs:[{id:'rogue',x:466,y:326,dir:'left',talkCount:0}]}));
  await until(s=>s.action==='rogue');await p.waitForTimeout(650);
  check(tag+' crying scene uses checkpoint effects',await p.evaluate(()=>window.__rogueNature.length>0&&window.__rogueNature.every(r=>r.key==='checkpoint'&&r.width===720&&r.height===480)));
  const painting=await p.evaluate(async()=>{const real=new Image(),expected=new Image();real.src=window.__rogueBackground;expected.src=document.querySelector('#guild-assets').dataset.checkpointSrc;await Promise.all([real.decode(),expected.decode()]);const cv=document.createElement('canvas');cv.width=720;cv.height=480;const c=cv.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(real,0,0);const a=c.getImageData(0,0,720,480).data;c.clearRect(0,0,720,480);const scale=Math.min(720/expected.naturalWidth,480/expected.naturalHeight);c.fillStyle='#121d26';c.fillRect(0,0,720,480);c.drawImage(expected,0,0,expected.naturalWidth,expected.naturalHeight,(720-expected.naturalWidth*scale)/2,(480-expected.naturalHeight*scale)/2,expected.naturalWidth*scale,expected.naturalHeight*scale);const b=c.getImageData(0,0,720,480).data;let difference=0;for(let by=0;by<480;by+=16)for(let bx=0;bx<720;bx+=16)for(let ch=0;ch<3;ch++){let aa=0,bb=0;for(let y=by;y<by+16;y++)for(let x=bx;x<bx+16;x++){const i=(y*720+x)*4+ch;aa+=a[i];bb+=b[i]}difference+=Math.abs(aa-bb)/256}return{mean:difference/(45*30*3),actual:real.src,expected:cv.toDataURL()}});
  for(const name of ['actual','expected'])fs.writeFileSync(path.join(out,tag+'-checkpoint-'+name+'.png'),Buffer.from(painting[name].split(',')[1],'base64'));
  // Chrome GPU/CPU nearest-neighbor sampling can choose adjacent source pixels.
  // Compare block averages to verify the painting, not that sampling phase.
  report.measurements.push({tag,checkpointBlockMeanDifference:painting.mean});
  check(tag+' crying scene retains the actual checkpoint painting',painting.mean<4);
  await p.screenshot({path:path.join(out,tag+'-rogue.png')});await until(s=>s.phase==='free'&&s.location==='checkpoint');
  check(tag+' rogue departure and quest progress remain intact',!(await state()).npcs.some(n=>n.id==='rogue')&&(await state()).questAccepted);
  await p.emulateMedia({reducedMotion:'reduce'});
  check(tag+' Greenstoa theme is silent before its introduction',await p.evaluate(()=>!gameAudio.getGreenstoaState().ready&&!gameAudio.getGreenstoaState().active&&document.querySelector('#greenstoa-music').paused));
  await start(fixture({location:'gate',storyStep:'arrival',player:{x:360,y:384,dir:'up'},npcs:[{id:'scout',x:360,y:305,dir:'down',talkCount:0}]}));
  await until(s=>s.phase==='vista'&&s.vista==='sanctuary');
  check(tag+' new theme waits until Mother Tree cutscene ends',await p.evaluate(()=>!gameAudio.getGreenstoaState().active&&document.querySelector('#greenstoa-music').paused));
  await press();await until(s=>s.phase==='free'&&s.location==='gate');
  await p.waitForFunction(()=>gameAudio.getGreenstoaState().active&&gameAudio.getGreenstoaState().offset>1.3&&gameAudio.getGreenstoaState().gain>.7);
  check(tag+' new theme plays real decoded audio after the cutscene',await signal('greenstoa-music')>1e-5);
  check(tag+' journey, town, opening and battle are silent after arrival',await p.evaluate(()=>['journey','town','opening','battle'].every(id=>document.querySelector('#'+id+'-music').paused)));
  // The actual north entrance goes from the gate into the grove.
  const arrival=fixture({location:'gate',player:{x:360,y:315,dir:'up'},fieldFlags:{...fixture().fieldFlags,libraryAmbushCleared:true}});
  await start(arrival);await press();await until(s=>s.location==='grove'&&s.phase==='free');
  check(tag+' theme continues into the grove',await p.evaluate(()=>gameAudio.getGreenstoaState().active));
  // Old saves may still mark the journey music active: they must choose the new theme.
  const old=fixture({location:'library',player:{x:360,y:320,dir:'up'},fieldFlags:{...fixture().fieldFlags,libraryLetterRead:true,libraryAmbushCleared:true}});await start(old);await p.waitForTimeout(1400);
  check(tag+' legacy library save selects Greenstoa instead of journey',await p.evaluate(()=>gameAudio.getGreenstoaState().active&&!document.querySelector('#greenstoa-music').paused&&!gameAudio.getJourneyState().active&&document.querySelector('#journey-music').paused));
  await p.evaluate(()=>gameAudio.configure({enabled:false,volume:35}));check(tag+' mute pauses the new track',await p.locator('#greenstoa-music').evaluate(e=>e.paused));
  await p.evaluate(()=>gameAudio.configure({enabled:true,volume:0}));check(tag+' zero volume keeps new track paused',await p.locator('#greenstoa-music').evaluate(e=>e.paused));
  await p.evaluate(()=>gameAudio.configure({enabled:true,volume:35}));await p.waitForFunction(()=>!document.querySelector('#greenstoa-music').paused);
  // Original HP1 encounter exercises command/dodge/finale and its music return.
  await start(fixture());await press();await until(s=>s.battle?.stage==='command');await p.waitForFunction(()=>!document.querySelector('#battle-music').paused&&document.querySelector('#battle-music').currentTime>.4);
  check(tag+' battle plays Makai Toppa Sen through the combat bus',await signal('battle-music')>1e-5&&await p.evaluate(()=>gameAudio.getCombatState().active&&document.querySelector('#greenstoa-music').paused&&document.querySelector('#opening-music').paused));
  await p.screenshot({path:path.join(out,tag+'-battle.png')});
  if(width===1280){
   await p.locator('[data-battle-command="attack"]').click();await until(async s=>{if(s.battle?.stage==='command')await p.locator('[data-battle-command="attack"]').click();return s.battle?.stage==='won'});
   await p.waitForFunction(()=>!document.querySelector('#greenstoa-music').paused&&document.querySelector('#battle-music').paused);
   check('battle rescue restores Greenstoa theme',await p.evaluate(()=>gameAudio.getGreenstoaState().active&&!gameAudio.getCombatState().active));
  }
  await p.evaluate(()=>guildGame.stop());await p.waitForTimeout(400);
  check(tag+' title stops and resets the new theme',await p.evaluate(()=>!gameAudio.getGreenstoaState().ready&&!gameAudio.getGreenstoaState().active&&document.querySelector('#greenstoa-music').paused&&document.querySelector('#greenstoa-music').currentTime===0));
  check(tag+' viewport remains inside mobile bounds',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await ctx.close();
 }
 check('no audio or cutscene browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'audio-cutscene-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
