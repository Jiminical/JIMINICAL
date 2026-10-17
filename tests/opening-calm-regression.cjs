const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/opening-calm');fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'grove',storyStep:'arrived',questAccepted:true,hp:18,coins:18,shopOrigin:'city',player:{x:360,y:320,dir:'down'},npcs:[],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild','city','gate','grove'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true},journeyMusic:{active:false,offset:0},...patch});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/',checks:[],errors:[],measurements:[]};
 const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);console.log('PASS '+label)};
 try{for(const [width,height]of [[1280,800],[320,568],[844,390]]){
  const tag=width+'x'+height,ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'});
  await ctx.addInitScript(()=>{const Audio=window.AudioContext||window.webkitAudioContext,create=Audio.prototype.createMediaElementSource;
   Audio.prototype.createMediaElementSource=function(element){const source=create.call(this,element),connect=source.connect.bind(source);source.connect=(destination,...args)=>{const result=connect(destination,...args);if(element.id==='opening-music'){const analyser=this.createAnalyser();analyser.fftSize=2048;destination.connect(analyser);window.__openingProbe={analyser}}return result};return source};
  });
  const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(tag+': '+e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': '+r.status()+' '+r.url())});
  await p.goto(report.url);await p.evaluate(()=>guildGame.ready);await p.locator('#start-button').click();
  await p.locator('#story-auto').click();
  // play() clears paused before a network stream actually starts. Measure the
  // fade from the advancing media clock, rather than from the download request.
  await p.waitForFunction(()=>gameAudio.getOpeningState().active&&gameAudio.getOpeningState().offset>0&&gameAudio.getOpeningState().gain>0);
  const early=await p.evaluate(()=>gameAudio.getOpeningState());await p.waitForTimeout(650);const mid=await p.evaluate(()=>gameAudio.getOpeningState());await p.waitForFunction(()=>gameAudio.getOpeningState().offset>2.65&&gameAudio.getOpeningState().gain>.8);const full=await p.evaluate(()=>{const d=new Float32Array(2048);window.__openingProbe.analyser.getFloatTimeDomainData(d);return{...gameAudio.getOpeningState(),rms:Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length),duration:document.querySelector('#opening-music').duration}});
  report.measurements.push({tag,early,mid,full});
  check(tag+' opening song starts with a real fade in',early.gain<.2&&mid.gain>early.gain+.08&&full.gain>.8&&full.offset>2.5);
  check(tag+' decoded opening song reaches its audio bus',full.rms>1e-5&&full.duration>30);
  const offset=full.offset;await p.locator('#story-next').click();await p.waitForFunction(()=>document.querySelector('#story-screen').dataset.storyIndex==='1');
  check(tag+' narration pages keep the same music clock',await p.evaluate(offset=>gameAudio.getOpeningState().offset>=offset&&gameAudio.getOpeningState().active,offset));
  await p.evaluate(()=>{settings.volume=0;gameAudio.configure({enabled:true,volume:0})});check(tag+' zero volume pauses the opening song',await p.locator('#opening-music').evaluate(e=>e.paused));
  await p.evaluate(()=>{settings.volume=35;gameAudio.configure({enabled:true,volume:35})});await p.waitForFunction(()=>!document.querySelector('#opening-music').paused);
  await p.locator('#story-skip').click();await p.locator('#name-page').waitFor();
  check(tag+' skipping narration keeps music through name entry',await p.evaluate(()=>gameAudio.getOpeningState().active&&!document.querySelector('#opening-music').paused));
  await p.locator('#player-name').fill('여행자');await p.locator('#name-form button[type=submit]').click();await p.locator('#name-accept').click();await p.locator('#name-complete').waitFor();
  check(tag+' music remains before entering Zerdia',await p.evaluate(()=>gameAudio.getOpeningState().active));
  if(width===1280){await p.waitForTimeout(2700);await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{settings.motion=true;document.body.classList.remove('no-motion')})}
  await p.locator('#name-begin').click();
  if(width===1280){await p.waitForTimeout(110);const fade=await p.evaluate(()=>gameAudio.getOpeningState());check('Zerdia transition fades music out under the curtain',!fade.active&&fade.gain>0&&fade.gain<.8)}
  await p.waitForFunction(()=>guildGame.active&&document.querySelector('#game-screen').dataset.ready==='true');await p.waitForTimeout(120);
  check(tag+' opening music is stopped and reset in Zerdia',await p.evaluate(()=>{const t=document.querySelector('#opening-music'),s=gameAudio.getOpeningState();return!s.active&&t.paused&&t.currentTime===0&&s.gain===0}));
  check(tag+' town music takes over',await p.evaluate(()=>gameAudio.getTownState().active&&!document.querySelector('#town-music').paused));
  await p.reload();await p.evaluate(()=>guildGame.ready);await p.locator('#continue-button').click();await p.waitForFunction(()=>guildGame.active&&document.querySelector('#game-screen').dataset.ready==='true');
  check(tag+' resuming a v1 save never replays the opening song',await p.evaluate(()=>!gameAudio.getOpeningState().active&&document.querySelector('#opening-music').paused&&gameAudio.getTownState().active));
  const start=async save=>{await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},save);await p.waitForTimeout(100)};
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{settings.motion=true;document.body.classList.remove('no-motion')});
  const layers=await p.evaluate(async()=>{const a=document.querySelector('#guild-assets').dataset,results=[];for(const key of ['gate','grove','sanctuary']){const image=new Image();image.src=a[key+'Src'];await image.decode();const scene=livingNature.prepare(image,key),canvas=document.createElement('canvas');canvas.width=scene.sourceW;canvas.height=scene.sourceH;livingNature.draw(canvas.getContext('2d'),image,key,1,true);const first=scene.fx.toDataURL();livingNature.draw(canvas.getContext('2d'),image,key,1.5,true);const d=scene.fx.getContext('2d').getImageData(0,0,scene.width,scene.height).data,m=scene.water.getContext('2d').getImageData(0,0,scene.width,scene.height).data;let outside=0,active=0;for(let i=3;i<d.length;i+=4)if(d[i]){active++;if(!m[i])outside++}results.push({key,outside,active,trees:scene.leaves.length,motes:!!scene.config.motes,changed:first!==scene.fx.toDataURL()})}return results});
  for(const r of layers)check(tag+' '+r.key+' animates water only',r.active>100&&r.changed&&r.outside===0&&r.trees===0&&!r.motes);
  for(const place of ['gate','grove']){await start(fixture({location:place}));const delta=await p.locator('#guild-world').evaluate(async canvas=>{const c=canvas.getContext('2d');const get=()=>c.getImageData(5,5,345,60).data;c.getImageData(0,0,1,1);const a=get();await new Promise(r=>setTimeout(r,450));const b=get();let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n});check(tag+' '+place+' canopy stays fixed in the real field',delta===0)}
  await start(fixture({location:'gate',storyStep:'arrival'}));
  for(let i=0;i<80&&(await p.evaluate(()=>guildGame.getState().phase))!=='vista';i++){await p.keyboard.press('e');await p.waitForTimeout(60)}
  await p.waitForFunction(()=>guildGame.getState().phase==='vista'&&guildGame.getState().vista==='sanctuary');await p.waitForTimeout(150);
  const moving=await p.locator('#vista-art').evaluate(async canvas=>{const before=canvas.toDataURL(),pan=Number(document.querySelector('#game-vista').dataset.pan);await new Promise(r=>setTimeout(r,1200));return{changed:before!==canvas.toDataURL(),from:pan,to:Number(document.querySelector('#game-vista').dataset.pan)}});
  check(tag+' Mother Tree camera advances through the painting',moving.to>moving.from+.02&&moving.changed);
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(120);
  const still=await p.locator('#vista-art').evaluate(async canvas=>{const before=canvas.toDataURL(),pan=document.querySelector('#game-vista').dataset.pan;await new Promise(r=>setTimeout(r,200));return{same:before===canvas.toDataURL(),pan}});
  check(tag+' reduced motion holds final Mother Tree framing',still.same&&still.pan==='1.000');await p.screenshot({path:path.join(out,tag+'-mother-tree.png')});
  check(tag+' viewport stays within mobile bounds',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await ctx.close();
 }
 // Keep the old atlas files intact; verify every retained visible pixel exactly.
 const p=await browser.newPage();await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
 const crops=await p.evaluate(async()=>{const cases=[['ld-guild','ld-hero',0,0,512,512],['ld-fields','ld-librarians',800,0,736,1024]],results=[];for(const [oldName,newName,x,y,w,h]of cases){const a=new Image(),b=new Image();a.src='assets/'+oldName+'.webp';b.src='assets/'+newName+'.webp';await Promise.all([a.decode(),b.decode()]);const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(a,x,y,w,h,0,0,w,h);const old=c.getImageData(0,0,w,h).data;c.clearRect(0,0,w,h);c.drawImage(b,0,0);const next=c.getImageData(0,0,w,h).data;let changes=0;for(let i=0;i<old.length;i+=4)if(old[i+3]!==next[i+3]||(old[i+3]&&(old[i]!==next[i]||old[i+1]!==next[i+1]||old[i+2]!==next[i+2])))changes++;results.push({newName,changes})}return results});
 for(const r of crops)check(r.newName+' preserves all used portrait pixels',r.changes===0);
 await p.locator('#start-button').click();await p.waitForFunction(()=>!document.querySelector('#opening-music').paused);await p.locator('#story-return').click();await p.locator('#title-screen').waitFor();await p.waitForTimeout(350);
 check('returning to title stops and rewinds opening music',await p.evaluate(()=>!gameAudio.getOpeningState().active&&document.querySelector('#opening-music').paused&&document.querySelector('#opening-music').currentTime===0));
 await p.locator('#start-button').click();await p.waitForFunction(()=>!document.querySelector('#opening-music').paused);check('restarting the prologue starts music from the beginning',await p.evaluate(()=>gameAudio.getOpeningState().offset<1));
 check('no opening or calm-scene browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'opening-calm-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
