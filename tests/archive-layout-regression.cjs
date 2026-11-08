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
  const leadNames=['마르에리','카니아','헤니아','헬렌','아란','클로네','레무','루냐','슈냐','시프','뮈르슈','엘레나','캐롤라','세이아','장위','???'];
  const supportNames=['루시','아르다','하나리','이보리아','아이헤르데','기루스','보르드','고드릭'],names=[...leadNames,...supportNames];
  const relationships={'헤니아':['카니아','클로네'],'카니아':['헤니아','클로네'],'헬렌':['아란'],'아란':['헬렌'],'레무':['엘레나'],'엘레나':['레무']};
  const copy={
    '카니아':{'헤니아':['악우. 온실 속 화초 주제에 정찰대를 흉본다!','annoyed'],'클로네':['신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...','flustered']},
    '헤니아':{'카니아':['악우. 하이엘프인데도 정찰대를 자원하다니?','puzzled'],'클로네':['이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?','annoyed']},
  };
  check(tag+' roster contains exactly the requested 24 names in order',await p.locator('#archive-index button').evaluateAll(es=>es.map(e=>e.textContent.replace(/^[▸　 ]+/,''))).then(actual=>JSON.stringify(actual)===JSON.stringify(names)));
  const sections=await p.locator('.archive-index-group').evaluateAll(es=>es.map(e=>({title:e.querySelector('h4').textContent,count:e.querySelectorAll('button').length})));
  check(tag+' people are split into 16 leads and 8 supporting characters',JSON.stringify(sections)===JSON.stringify([{title:'주연',count:16},{title:'조연',count:8}]));
  for(let i=0;i<names.length;i++){
   await p.locator('#archive-index button').nth(i).click();
   const kind=await p.evaluate(i=>greenstoaLore.people[i].portraitKind,i);
   check(tag+' profile '+(i+1)+' '+names[i]+' renders with the correct portrait and count',await p.locator('.archive-person-copy h3').innerText()===names[i]&&await p.locator('#archive-page-count').innerText()===String(i+1).padStart(2,'0')+' / 24'&&(kind==='unrevealed'?await p.locator('.archive-person-unrevealed').count()===1:await p.locator('.archive-person-photo canvas').evaluate(e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;return d.some((v,i)=>i%4===3&&v>96)})));
   const targets=relationships[names[i]]||[];
   check(tag+' '+names[i]+' relationship section is limited to the requested people',await p.locator('.archive-person-relationships').count()===(targets.length?1:0)&&await p.locator('.archive-person-relationships button').allTextContents().then(actual=>JSON.stringify(actual)===JSON.stringify(targets))&&await p.locator('.archive-relationship-detail').allTextContents().then(actual=>JSON.stringify(actual)===JSON.stringify(targets.map(t=>copy[names[i]]?.[t]?.[0]||'미공개'))));
   if(targets.length){
    await p.locator('.archive-relationship-reaction img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    const faces=await p.locator('.archive-relationship-reaction').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img'),s=document.querySelector('#archive-scroll').getBoundingClientRect();return {person:e.dataset.person,emotion:e.dataset.emotion,label:e.getAttribute('aria-label'),width:r.width,height:r.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,renderedWidth:i.getBoundingClientRect().width,renderedHeight:i.getBoundingClientRect().height,pixelated:getComputedStyle(i).imageRendering,overflow:getComputedStyle(e).overflow,fits:r.left>=s.left&&r.right<=s.right}}));
    const id=await p.evaluate(i=>greenstoaLore.people[i].id,i);
    check(tag+' '+names[i]+' shows the correct owner and expression in unclipped compact face sprites',faces.length===targets.length&&faces.every((f,j)=>f.person===id&&f.emotion===(copy[names[i]]?.[targets[j]]?.[1]||'neutral')&&f.label.includes(names[i])&&f.width===64&&f.height===64&&f.naturalWidth===256&&f.naturalHeight===256&&f.renderedWidth===128&&f.renderedHeight===128&&f.pixelated==='pixelated'&&f.overflow==='hidden'&&f.fits));
   }
  }
  await p.screenshot({path:path.join(out,tag+'-supporting-last.png')});
  for(const [source,targets]of Object.entries(relationships))for(const target of targets){
   await p.locator('#archive-index button').nth(names.indexOf(source)).click();
   const link=p.locator('.archive-person-relationships button').filter({hasText:target});
   await link.scrollIntoViewIfNeeded();
   check(tag+' '+source+' to '+target+' relationship link is a reachable touch target',await link.evaluate(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('#archive-scroll').getBoundingClientRect();return r.height>=44&&r.left>=s.left&&r.right<=s.right}));
   if(source==='헤니아'&&target==='카니아'||source==='엘레나'||source==='카니아')await p.screenshot({path:path.join(out,tag+'-relationships-'+(source==='헤니아'?'henia':source==='엘레나'?'elena':'kania-'+target)+'.png')});
   await link.click();
   check(tag+' relationship opens '+target+' without losing archive state',await p.locator('.archive-person-copy h3').innerText()===target&&await p.locator('#archive-scroll').evaluate(e=>e.scrollTop===0)&&await p.evaluate(()=>guildGame.getState().archive==='people'));
  }
  if(width<=700)check(tag+' both cast section headings remain visible on mobile',await p.locator('.archive-index-group h4').evaluateAll(es=>{const r=document.querySelector('#archive-index').getBoundingClientRect();return es.every(e=>{const b=e.getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1})}));
  await p.locator('#archive-index button').first().click();
  check(tag+' portrait slot defaults to the current Mareri artwork',await p.locator('.archive-person-photo canvas[role="img"]').count()===1);
  check(tag+' changing tabs brings the selected first entry into view',await p.locator('#archive-index').evaluate(e=>e.scrollLeft===0&&e.scrollTop===0));
  check(tag+' short introduction is larger than the old kicker',await p.locator('.archive-person-role').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12));
  check(tag+' name and multiple hashtag features are separate',await p.locator('.archive-person-copy h3').innerText()==='마르에리'&&await p.locator('.archive-person-tags li').count()>=3&&await p.locator('.archive-person-tags li').evaluateAll(es=>es.every(e=>e.textContent.startsWith('#'))));
  check(tag+' all people have independent photo paths and known profiles retain multiple tags',await p.evaluate(()=>greenstoaLore.people.every(p=>'portraitSrc'in p&&Array.isArray(p.tags)&&(p.portraitKind==='unrevealed'||p.tags.length>=3))));
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
  check(tag+' keyboard can scroll without switching the person',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>0)&&await p.locator('.archive-person-copy h3').innerText()==='마르에리');
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
