// Verify rendered pixels, real merchant interactions and legacy saves in Chrome.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/scenery-arda');fs.mkdirSync(out,{recursive:true});
const fixture=(patch={})=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'shop',storyStep:'accepted',questAccepted:true,hp:13,coins:18,shopOrigin:'city',player:{x:360,y:214,dir:'up'},npcs:[{id:'rose',x:360,y:106,dir:'down',talkCount:1}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'bread',name:'마른 빵',description:'끼니',count:2}],visited:['guild','city','shop'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},...patch});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/',checks:[],errors:[],measurements:[]};
 const check=(s,ok)=>{assert.ok(ok,s);report.checks.push(s);console.log('PASS '+s)};
 try {for(const [width,height]of [[1280,800],[320,568],[844,390]]){
  const tag=width+'x'+height,ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': HTTP '+r.status()+' '+r.url())});
  await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
  const start=async save=>{await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},save);await p.waitForTimeout(80)};
  const state=()=>p.evaluate(()=>guildGame.getState());
  const press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(60)};
  check(tag+' legacy rose shop save is accepted',await p.evaluate(s=>journeySave.valid(s),fixture()));
  await start(fixture());await press();
  check(tag+' shopkeeper displays Arda and her curious voice',(await p.locator('#game-speaker').innerText())==='아르다'&&(await p.locator('#game-dialogue-live').innerText()).includes('어디로 모험'));
  check(tag+' curious portrait uses the new pixel sheet',await p.locator('#dialogue-portrait').evaluate(e=>e.dataset.sheet==='arda'&&e.dataset.frame==='2'));
  const portrait=await p.locator('#dialogue-portrait-frame').boundingBox(),box=await p.locator('#game-dialogue').boundingBox();
  check(tag+' full portrait stays above the dialogue',portrait.y>=0&&portrait.y+portrait.height<=box.y+1);
  await p.screenshot({path:path.join(out,tag+'-arda.png')});await press();
  check(tag+' second line uses smile and curious speech',await p.locator('#dialogue-portrait').evaluate(e=>e.dataset.frame==='1')&&(await p.locator('#game-dialogue-live').innerText()).includes('궁금한 게 너무 많아용'));
  for(let i=0;i<8&&(await state()).phase!=='shop';i++)await press();
  check(tag+' original trade flow opens renamed shop',(await state()).phase==='shop'&&(await p.locator('#shop-title').innerText())==='아르다의 잡화점');
  await p.waitForTimeout(200);await p.locator('#shop-buy').click();
  const bought=await state();check(tag+' purchase preserves prices, stock and inventory',bought.coins===15&&bought.stock.city.bread===5&&bought.items.find(i=>i.id==='bread').count===3&&bought.hp===13);
  await p.locator('#shop-close').click();await p.keyboard.press('c');await p.locator('#guild-save').click();
  const saved=await p.evaluate(()=>journeySave.read());check(tag+' new shop save keeps v1 and original actor ID',saved.version===1&&saved.npcs[0].id==='rose'&&saved.coins===15&&saved.shopStocks.city.bread===5);
  await start(saved);check(tag+' merchant save reload keeps purchases',(await state()).coins===15&&(await state()).items.find(i=>i.id==='bread').count===3);
  const sprites=await p.evaluate(()=>['down','left','right','up'].map(dir=>{const a=fieldSprites.make('rose',dir,0),d=a.getContext('2d').getImageData(0,0,a.width,a.height).data;let n=0,l=56,r=0,t=80,b=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)if(d[(y*a.width+x)*4+3]){n++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return {dir,n,l,r,t,b,pixels:a.toDataURL()}}));
  check(tag+' four field views are opaque, distinct and fully inside sprite cells',sprites.every(s=>s.n>400&&s.l>=2&&s.r<54&&s.t>=0&&s.b<80)&&new Set(sprites.map(s=>s.pixels)).size===4);
  check(tag+' codex uses the new identity',await p.evaluate(()=>{const a=greenstoaLore.people.find(p=>p.id==='rose');return a.name==='아르다'&&a.body.includes('호박빛')&&a.summary.includes('호기심')}));
  check(tag+' mobile page has no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  // Test the actual shared renderer with original backgrounds, including masks.
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>document.body.classList.remove('no-motion'));
  if(width===1280){
   const motion=await p.evaluate(async()=>{
    const assets=document.querySelector('#guild-assets').dataset;
    const cases=[['city','city'],['cliff','cliff'],['grove','grove'],['checkpoint','checkpoint'],['gate','gate'],['journeyKingdom','journey'],['journeyGorge','journeyGorge'],['journeyRoad','journeyRoad'],['sanctuary','sanctuary'],['overlook','guideForest']];
    const results=[];
    for(const [key,asset]of cases){const image=new Image();image.src=assets[asset+'Src'];await image.decode();const canvas=document.createElement('canvas');canvas.width=720;canvas.height=Math.round(720*image.naturalHeight/image.naturalWidth);const c=canvas.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;
     // Inspect the painted effects layer directly, avoiding WebP base-image
     // resampling differences between Chrome's GPU and CPU canvas readbacks.
     const render=(t,on)=>{c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);livingNature.draw(c,image,key,t,on);c.restore();return c.getImageData(0,0,canvas.width,canvas.height).data};
     const delta=(a,b,region)=>{let count=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(region&&!(x>=region[0]&&x<region[2]&&y>=region[1]&&y<region[3]))continue;const i=(y*canvas.width+x)*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])count++}return count};
     livingNature.prepare(image,key);
     const a=render(1,true),b=render(3,true),still=delta(render(1,false),render(3,false));
     const fixed=key==='city'?delta(a,b,[240,55,390,145]):0;
     const scene=livingNature.prepare(image,key),samples=20,begin=performance.now();for(let i=0;i<samples;i++)render(10+i/18,true);
     results.push({key,changed:delta(a,b),still,fixed,meanMs:(performance.now()-begin)/samples,water:scene.points.length,leaves:scene.leaves.length});
    }return results;
   });report.measurements.push(...motion);
   for(const item of motion){check(item.key+' natural motion changes painted scenery',item.changed>15);check(item.key+' motion-off frames remain identical',item.still===0);check(item.key+' frames fit a 30 fps rendering budget',item.meanMs<33)}
   check('city palace architecture remains fixed',motion.find(m=>m.key==='city').fixed===0);
   for(const key of ['city','cliff','grove','checkpoint','gate','journeyRoad'])check(key+' water glints come from real water pixels',motion.find(m=>m.key===key).water>0);
   // Record the transformed carriage's actual draw bounds, at near/mid/far depth.
   const coach=await p.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=650;const c=canvas.getContext('2d'),draw=c.drawImage.bind(c),bounds=[];let time;
    c.drawImage=(...a)=>{if(a.length===5&&a[0].width===240){const m=c.getTransform(),[image,x,y,w,h]=a,p=m.transformPoint(new DOMPoint(x,y)),q=m.transformPoint(new DOMPoint(x+w,y+h));bounds.push({time,x:p.x,y:p.y,w:q.x-p.x,h:q.y-p.y})}return draw(...a)};
    for(time of [18.7,23,30])journeyCinematic.draw(c,time,true);
    const a=journeyCinematic.draw(c,0,false),first=canvas.toDataURL();journeyCinematic.draw(c,30,false);return {bounds,still:first===canvas.toDataURL(),image:canvas.toDataURL(),box:a.box};
   });report.measurements.push({coach:coach.bounds});
   for(const b of coach.bounds)check('coach stays grounded and visible at '+b.time,b.x>=0&&b.x+b.w<=1201&&b.y>=coach.box.y-1&&b.y+b.h<=coach.box.y+coach.box.h+2);
   check('far coach remains larger than 8.5 percent of the image',coach.bounds.at(-1).w>1200*.085);check('journey motion-off view is stable',coach.still);
   fs.writeFileSync(path.join(out,'journey-larger-coach.png'),Buffer.from(coach.image.split(',')[1],'base64'));
   const events=await p.evaluate(async()=>{
    const a=document.querySelector('#guild-assets').dataset,atlas=new Image(),props=new Image();atlas.src=a.eventsSrc;props.src=a.eventPropsSrc;await Promise.all([atlas.decode(),props.decode()]);const avatar=document.createElement('canvas');avatar.width=avatar.height=100;
    const results=[];for(const kind of ['departure','credentials']){eventScenes.prepare(kind,{atlas,props,avatar,name:'여행자',onImpact(){},onFinish(){}});eventScenes.play();await new Promise(r=>setTimeout(r,180));const canvas=document.querySelector('#event-art'),before=canvas.toDataURL();await new Promise(r=>setTimeout(r,300));results.push({kind,changed:before!==canvas.toDataURL()});eventScenes.hide()}return results;
   });for(const e of events)check(e.kind+' outdoor event animates without errors',e.changed);
   await p.emulateMedia({reducedMotion:'reduce'});
   check('system reduced-motion suppresses ambient effects',await p.evaluate(async()=>{const im=new Image();im.src=document.querySelector('#guild-assets').dataset.citySrc;await im.decode();const a=document.createElement('canvas');a.width=720;a.height=480;livingNature.draw(a.getContext('2d'),im,'city',3,true);return a.getContext('2d').getImageData(0,0,720,480).data.every(v=>v===0)}));
  }
  // Exercise actual free-field render loops in normal motion on every viewport.
  for(const place of ['city','cliff','grove','checkpoint','gate']){
   await p.emulateMedia({reducedMotion:'no-preference'});await start(fixture({location:place,player:{x:360,y:place==='cliff'?80:320,dir:'down'},npcs:[],fieldFlags:{...fixture().fieldFlags,libraryAmbushCleared:true}}));
   const before=await p.locator('#guild-world').evaluate(e=>e.toDataURL());await p.waitForTimeout(450);
   check(tag+' live '+place+' field animates',before!==await p.locator('#guild-world').evaluate(e=>e.toDataURL()));
   if(place==='cliff')await p.screenshot({path:path.join(out,tag+'-river.png')});
   await p.evaluate(()=>document.body.classList.add('no-motion'));await p.waitForTimeout(100);
   const stopped=await p.locator('#guild-world').evaluate(e=>e.toDataURL());await p.waitForTimeout(200);
   check(tag+' setting stops '+place+' ambient movement',stopped===await p.locator('#guild-world').evaluate(e=>e.toDataURL()));
   await p.evaluate(()=>document.body.classList.remove('no-motion'));
  }
  await ctx.close();
 }
 check('no browser or asset errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'scenery-arda-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
