// Exercise the actual archive, future portrait photos, and long biographies.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/archive-layout');fs.mkdirSync(out,{recursive:true});
const titles=['세계와 국가들','마왕과 대혼란','어머니 나무와 그린스토아','용사 그리고 동맹','그린스토아 조사 의뢰','종족 탐구','도구들'];
const fixture={version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:true,hp:1,coins:15,shopOrigin:'city',player:{x:552,y:290,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:3}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'libraryLetter',name:'편지',description:'도착 편지',count:1}],visited:['guild','city','gate','grove','library'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const report={url:process.env.TEST_URL,checks:[],errors:[]};
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);console.log('PASS '+name)};
 try{for(const [width,height]of (process.env.ARCHIVE_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]])){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  await p.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture);
  const before=await p.evaluate(()=>guildGame.getState());await p.keyboard.press('e');await p.waitForFunction(()=>guildGame.getState().archive==='comic');
  await p.locator('[data-archive-tab="world"]').click();
  check(tag+' seven world topics match the requested titles',await p.evaluate(t=>JSON.stringify(greenstoaLore.articles.map(a=>a.title))===JSON.stringify(t),titles));
  for(let i=0;i<titles.length;i++){await p.locator('#archive-index button').nth(i).click();check(tag+' article '+titles[i]+' has matching copy and valid art',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('#archive-page p:not(.archive-kicker)').count()>=2&&await p.locator('canvas.archive-world-art').getAttribute('data-chapter')!==null)}
  check(tag+' opening scenes remain intact',await p.evaluate(()=>greenstoaLore.scenes.length===9&&greenstoaLore.scenes[0].title==='나라 이전의 시대'&&greenstoaLore.scenes[8].title==='성역에 스미는 그림자'));
  await p.locator('[data-archive-tab="people"]').click();
  check(tag+' portrait slot defaults to the current Lucy artwork',await p.locator('.archive-person-photo canvas[role="img"]').count()===1);
  check(tag+' changing tabs brings the selected first entry into view',await p.locator('#archive-index').evaluate(e=>e.scrollLeft===0&&e.scrollTop===0));
  check(tag+' short introduction is larger than the old kicker',await p.locator('.archive-person-role').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12));
  check(tag+' name and multiple hashtag features are separate',await p.locator('.archive-person-copy h3').innerText()==='루시'&&await p.locator('.archive-person-tags li').count()>=3&&await p.locator('.archive-person-tags li').evaluateAll(es=>es.every(e=>e.textContent.startsWith('#'))));
  check(tag+' all people have independent photo paths and multiple tags',await p.evaluate(()=>greenstoaLore.people.every(p=>'portraitSrc'in p&&p.tags.length>=3)));
  await p.screenshot({path:path.join(out,tag+'-people.png')});
  const original=await p.evaluate(()=>{const person=greenstoaLore.people[0];const saved={body:person.body,tags:person.tags,portraitSrc:person.portraitSrc};person.body=Array.from({length:18},(_,i)=>'상세 설명 '+(i+1)+'. '+person.body);person.tags=[...person.tags,'아주긴특징설명'.repeat(14)];const c=document.createElement('canvas');c.width=120;c.height=180;c.getContext('2d').fillRect(0,0,120,180);person.portraitSrc=c.toDataURL('image/png');return saved});
  await p.locator('#archive-index button').first().click();await p.locator('.archive-person-image').evaluate(i=>i.decode());
  check(tag+' supplied portrait photo replaces fallback without stretching',await p.locator('.archive-person-image').evaluate(i=>i.naturalWidth===120&&getComputedStyle(i).objectFit==='contain')&&await p.locator('.archive-person-photo canvas').count()===0);
  await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);
  check(tag+' long details show an obvious scroll button and scrollbar',await p.locator('#archive-scroll-more').isVisible()&&await p.locator('#archive-scroll').evaluate(e=>e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto'));
  check(tag+' long hashtag wraps within the viewport',await p.evaluate(()=>document.querySelector('#archive-scroll').scrollWidth<=document.querySelector('#archive-scroll').clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1));
  await p.locator('#archive-scroll-more').click();check(tag+' scroll hint button moves down the content',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>0));
  if(width===1280)check(tag+' desktop photo remains visible while biography scrolls',await p.locator('.archive-person-photo').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('#archive-scroll').getBoundingClientRect().top-1));
  if(width!==1280){
   await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);const r=await p.locator('#archive-scroll').boundingBox(),x=r.x+20,y=r.y+r.height*.8,cdp=await context.newCDPSession(p);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*Math.min(14,r.height/12),id:1}]});await p.waitForTimeout(20)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
   check(tag+' mobile touch swipe reaches further details',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>25));
  }
  await p.locator('#archive-scroll').focus();await p.keyboard.press('End');await p.waitForFunction(()=>document.querySelector('#archive-scroll-more').hidden);
  check(tag+' last biography paragraph is reachable and bottom hint disappears',await p.locator('.archive-person-biography p').last().evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1));
  await p.screenshot({path:path.join(out,tag+'-long-biography-end.png')});
  await p.keyboard.press('Home');await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);await p.keyboard.press('PageDown');
  check(tag+' keyboard can scroll without switching the person',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>0)&&await p.locator('.archive-person-copy h3').innerText()==='루시');
  await p.evaluate(saved=>Object.assign(greenstoaLore.people[0],saved),original);await p.locator('#archive-index button').nth(1).click();
  check(tag+' selecting another person resets reading position',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop===0)&&await p.locator('.archive-person-copy h3').innerText()==='카니아');
  await p.evaluate(()=>{greenstoaLore.people[0].portraitSrc='data:image/png;base64,bm90YW5pbWFnZQ=='});await p.locator('#archive-index button').first().click();await p.waitForFunction(()=>document.querySelector('.archive-person-photo canvas'));
  check(tag+' a failed photo gracefully returns to the existing portrait',await p.locator('.archive-person-photo canvas').count()===1);
  await p.evaluate(()=>greenstoaLore.people[0].portraitSrc='');
  check(tag+' archive fits the screen without outer scrolling',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await p.locator('#archive-close').click();const after=await p.evaluate(()=>guildGame.getState());
  check(tag+' closing preserves position, quest and save data',after.phase==='free'&&JSON.stringify(after.player)===JSON.stringify(before.player)&&after.hp===before.hp&&after.questAccepted===before.questAccepted&&JSON.stringify(after.items)===JSON.stringify(before.items)&&await p.evaluate(()=>journeySave.valid(journeySave.read())));
  await context.close();
 }
 check('no archive browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'archive-layout-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
