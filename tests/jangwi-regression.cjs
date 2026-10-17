// Exercise both replaced residents through the existing v1 save and UI.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/jangwi');fs.mkdirSync(out,{recursive:true});
const fixture=()=>({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'grove',storyStep:'arrived',questAccepted:true,hp:13,coins:18,shopOrigin:'city',player:{x:143,y:250,dir:'down'},npcs:[{id:'sena',x:143,y:280,dir:'left',talkCount:42}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'bread',name:'마른 빵',description:'끼니',count:2}],visited:['guild','city','gate','grove'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:false,libraryAmbushCleared:true}});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),report={url:process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/',checks:[],errors:[],screens:[]};
 const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);console.log('PASS '+label)};
 try{for(const [width,height]of [[1280,800],[390,844],[320,568],[844,390]])for(const [id,name,asset]of [['sena','장위','jangwi'],['rael','뮈르슈','muirshu']]){
  const tag=width+'x'+height+' '+name,ctx=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(tag+': '+r.status()+' '+r.url())});
  await p.goto(report.url);await p.evaluate(()=>guildGame.ready);
  const start=async save=>{await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},save);await p.waitForTimeout(100)};
  const press=async()=>{await p.keyboard.press('e');await p.waitForTimeout(45)};
  const seen=new Set(),hub=async()=>{for(let i=0;i<30;i++){if(await p.locator('#game-choices').isVisible())return;const kind=await p.locator('#dialogue-portrait').getAttribute('data-character');if(kind===id)seen.add(await p.locator('#dialogue-portrait').getAttribute('data-frame'));await press()}throw Error('No resident hub')};
  const legacy=fixture();if(id==='rael')Object.assign(legacy,{location:'library',player:{x:360,y:214,dir:'up'},npcs:[{id,x:360,y:108,dir:'down',talkCount:42}],fieldFlags:{...legacy.fieldFlags,libraryLetterRead:true}});
  check(tag+' legacy v1 fixture is valid',await p.evaluate(s=>journeySave.valid(s),legacy));
  await start(legacy);await press();await hub();
  check(tag+' legacy actor save resolves to new identity',await p.locator('#game-speaker').innerText().then(t=>t===name));
  check(tag+' resident has three chat topics and exit',await p.locator('#game-choices button').count()===(id==='rael'?5:4));
  check(tag+' portrait uses the new atlas',await p.locator('#dialogue-portrait').getAttribute('data-sheet')===asset);
  const portrait=await p.locator('#dialogue-portrait-frame').boundingBox(),dialogue=await p.locator('#game-dialogue').boundingBox();
  check(tag+' whole portrait sits above the dialogue in viewport',portrait.y>=0&&portrait.height>60&&portrait.y+portrait.height<=dialogue.y+1&&dialogue.y+dialogue.height<=height+1);
  const filename=width+'x'+height+'-'+asset+'.png';await p.screenshot({path:path.join(out,filename)});report.screens.push(filename);
  const topics=await p.evaluate(id=>characterChats[id].topics.map(t=>t.label),id);
  for(const label of topics){await p.locator('#game-choices button').filter({hasText:label}).click();await hub();check(tag+' completed topic disappears: '+label,!(await p.locator('#game-choices').innerText()).includes(label))}
  check(tag+' all six dialogue expressions are used',seen.size===6);
  check(tag+' finished chats leave a finite exit',await p.locator('#game-choices button').count()===(id==='rael'?2:1));
  if(id==='rael'){
   await p.locator('#game-choices button').filter({hasText:'도서관 기록 보기'}).click();
   check(tag+' librarian retains world record access',(await p.evaluate(()=>guildGame.getState())).archive==='world');
   for(const tab of ['people','comic','world']){await p.locator('[data-archive-tab="'+tab+'"]').click();check(tag+' existing library category opens: '+tab,(await p.evaluate(()=>guildGame.getState())).archive===tab)}
   await p.locator('#archive-close').click();await press();await hub();
  }
  await p.locator('#game-choices button').filter({hasText:'대화 마치기'}).click();
  const state=await p.evaluate(()=>guildGame.getState()),save=await p.evaluate(()=>journeySave.read());
  check(tag+' chats preserve quest, health, money and inventory',state.phase==='free'&&state.questAccepted&&state.hp===13&&state.coins===18&&state.items.length===2);
  check(tag+' save remains v1 with legacy ID and prior talk count',save.version===1&&save.npcs.find(n=>n.id===id).talkCount===(id==='rael'?44:43)&&!save.npcs.some(n=>n.id===asset));
  await start(save);await press();await hub();check(tag+' loaded save can reopen all three chats',await p.locator('#game-choices button').count()===(id==='rael'?5:4));
  const sprites=await p.evaluate(id=>['down','left','right','up'].map(dir=>{const a=fieldSprites.make(id,dir,0),d=a.getContext('2d').getImageData(0,0,a.width,a.height).data;let n=0,l=56,r=0,t=80,b=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)if(d[(y*a.width+x)*4+3]){n++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return{n,l,r,t,b,pixels:a.toDataURL()}}),id);
  check(tag+' four field directions fit their sprite bounds',sprites.every(s=>s.n>400&&s.l>=2&&s.r<54&&s.t>=0&&s.b<80)&&new Set(sprites.map(s=>s.pixels)).size===4);
  check(tag+' character codex records the new identity and backstory',await p.evaluate(({id,name})=>{const a=greenstoaLore.people.find(p=>p.id===id);return a.name===name&&(id==='sena'?a.body.includes('언데드')&&a.body.includes('중심지')&&a.summary.includes('호기심'):a.body.includes('크라슈')&&a.body.includes('염뢰혈')&&a.body.includes('역린'))},{id,name}));
  check(tag+' mobile page stays inside viewport',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await ctx.close();
 }
 check('no character browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'jangwi-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
