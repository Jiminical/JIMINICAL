// Exercise the actual archive, future portrait photos, and long biographies.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/archive-layout');fs.mkdirSync(out,{recursive:true});
const titles=['세계와 국가들','어머니 나무와 엘프들','마왕과 대혼란','이어져온 평화, 그리고 위기','그린스토아 조사 의뢰','엘프 외의 종족','그린스토아의 행정','외부'];
const fixture={version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:true,hp:1,coins:15,shopOrigin:'city',player:{x:552,y:290,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:3}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'libraryLetter',name:'편지',description:'도착 편지',count:1}],visited:['guild','city','gate','grove','library'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const report={url:process.env.TEST_URL,checks:[],errors:[]};
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);console.log('PASS '+name)};
 try{for(const [width,height]of (process.env.ARCHIVE_SINGLE_VIEW?[[390,844]]:[[1280,800],[390,844],[320,568],[844,390]])){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),p=await context.newPage();
  const worldImageRequests=[],personImageRequests=[];
  p.on('request',request=>{if(/\/assets\/world-(overview|greenstoa|zerdia|demon-king|zer-alliance|mother-tree|high-elf|half-elf|wood-elf|peace|crisis|investigation-lucy|investigation-greenstoa)\.webp/.test(request.url()))worldImageRequests.push(request.url())});
  p.on('request',request=>{if(/\/assets\/person-[a-z]+\.webp/.test(request.url()))personImageRequests.push(request.url())});
  p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  await p.goto(report.url,{timeout:120000});await p.waitForFunction(()=>typeof guildGame!=='undefined'&&!document.documentElement.classList.contains('is-loading'),{},{timeout:120000});await p.evaluate(()=>guildGame.ready);
  check(tag+' new world illustrations do not delay game startup',worldImageRequests.length===0);
  check(tag+' person cards do not load before the library is opened',personImageRequests.length===0);
  // Resume from a real saved slot instead of depending on an autosave frame before opening the book.
  await p.evaluate(async save=>{if(!journeySave.write(save))throw new Error('Unable to prepare the existing journey save');document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture);
  const before=await p.evaluate(()=>guildGame.getState());await p.keyboard.press('e');await p.waitForFunction(()=>guildGame.getState().archive==='comic');
  await p.locator('[data-archive-tab="world"]').click();
  check(tag+' eight world topics match the requested titles',await p.evaluate(t=>JSON.stringify(greenstoaLore.articles.map(a=>a.title))===JSON.stringify(t),titles));
  check(tag+' background subcategories group two setting and two history topics in order',await p.locator('.archive-index-subgroup').evaluateAll(groups=>JSON.stringify(groups.map(group=>({title:group.querySelector('h5').textContent,topics:[...group.querySelectorAll('button')].map(button=>button.textContent.replace(/^[▸　 ]+/,''))}))))===JSON.stringify([{title:'세계관',topics:titles.slice(0,2)},{title:'역사',topics:titles.slice(2,4)}]));
  check(tag+' subcategory labels are smaller than the parent background heading',await p.locator('.archive-index-subgroup h5').evaluateAll(labels=>labels.every(label=>parseFloat(getComputedStyle(label).fontSize)<parseFloat(getComputedStyle(label.closest('.archive-index-group').querySelector('h4')).fontSize))));
  check(tag+' current topics retain their own four-entry group',await p.locator('.archive-index-group[data-group="present"] button').allTextContents().then(names=>JSON.stringify(names.map(name=>name.replace(/^[▸　 ]+/,'')))===JSON.stringify(titles.slice(4))));
  for(let i=0;i<titles.length;i++){
   await p.locator('#archive-index button').nth(i).click();
   if(i<4)check(tag+' active background topic '+i+' keeps its subcategory label visible',await p.locator('#archive-index button').nth(i).evaluate(button=>{const label=button.closest('.archive-index-subgroup').querySelector('h5').getBoundingClientRect(),viewport=button.closest('.archive-index-entries').getBoundingClientRect();return label.top>=viewport.top-1&&label.bottom<=viewport.bottom+1&&label.left>=viewport.left-1&&label.right<=viewport.right+1}));
   if(i===0){
    for(const image of await p.locator('.archive-world-image').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode())}
    check(tag+' article '+titles[i]+' has matching copy and valid art',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('#archive-page p:not(.archive-kicker)').count()===3&&await p.locator('.archive-world-image').count()===3);
    check(tag+' overview image precedes the title and the two countries keep the requested image-title-copy order',await p.evaluate(()=>{
     const page=document.querySelector('#archive-page'),sections=[...page.querySelectorAll('.archive-world-section')];
     return page.firstElementChild.dataset.illustration==='worldOverview'&&JSON.stringify(sections.map(section=>({image:section.firstElementChild.dataset.illustration,title:section.children[1].textContent,copy:section.lastElementChild.tagName})))===JSON.stringify([{image:'greenstoa',title:'이종족연합국 그린스토아',copy:'P'},{image:'zerdia',title:'제르디아 왕국',copy:'P'}])&&[...page.querySelectorAll('p:not(.archive-kicker)')].map(p=>p.textContent).join('\n')===[...greenstoaLore.articles[0].body,...greenstoaLore.articles[0].sections.flatMap(section=>section.body)].join('\n');
    }));
    check(tag+' all supplied images remain complete and fit the reading width',await p.locator('.archive-world-image').evaluateAll(images=>{const viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return images.every(image=>{const rect=image.getBoundingClientRect();return image.naturalWidth===1216&&image.naturalHeight===448&&Math.abs(rect.width/rect.height-1216/448)<.01&&rect.left>=viewport.left&&rect.right<=viewport.right&&getComputedStyle(image).imageRendering==='auto'})}));
    check(tag+' country subtitles are visibly larger than their paragraphs',await p.locator('.archive-world-section').evaluateAll(sections=>sections.every(section=>parseFloat(getComputedStyle(section.querySelector('h4')).fontSize)>=parseFloat(getComputedStyle(section.querySelector('p')).fontSize)+4)));
    await p.locator('#archive-scroll').evaluate(element=>element.scrollTop=0);await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);
    await p.screenshot({path:path.join(out,tag+'-world-top.png')});
    await p.locator('#archive-scroll-more').click();check(tag+' world article scroll hint advances the long introduction',await p.locator('#archive-scroll').evaluate(element=>element.scrollTop>0));
    await p.locator('.archive-world-section h4').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-world-greenstoa.png')});
    await p.locator('#archive-scroll').focus();await p.keyboard.press('End');await p.waitForFunction(()=>document.querySelector('#archive-scroll-more').hidden);
    check(tag+' Zerdia final paragraph is reachable without horizontal overflow',await p.locator('.archive-world-section p').last().evaluate(element=>element.getBoundingClientRect().bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1)&&await p.locator('#archive-scroll').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
    await p.screenshot({path:path.join(out,tag+'-world-zerdia.png')});
   }else if(i===1){
    for(const image of await p.locator('.archive-world-image').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode())}
    check(tag+' elf article uses four uploaded images and removes the old chapter artwork',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('#archive-page p:not(.archive-kicker)').count()===3&&await p.locator('.archive-world-image').count()===4&&await p.locator('canvas.archive-world-art').count()===0);
    check(tag+' uploaded files 1 2 3 4 precede the title and matching elf headings',await p.evaluate(()=>{
     const page=document.querySelector('#archive-page'),sections=[...page.querySelectorAll('.archive-world-section')];
     return page.firstElementChild.dataset.illustration==='motherTree'&&JSON.stringify(sections.map(s=>[s.firstElementChild.dataset.illustration,s.children[1].textContent]))===JSON.stringify([['highElf','하이엘프'],['halfElf','하프엘프'],['woodElf','우드엘프']]);
    }));
    check(tag+' all four elf images preserve original dimensions and full composition',await p.locator('.archive-world-image').evaluateAll(images=>{const viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return images.every((image,index)=>{const height=index===0?640:832,r=image.getBoundingClientRect();return image.naturalWidth===1216&&image.naturalHeight===height&&Math.abs(r.width/r.height-1216/height)<.01&&r.left>=viewport.left&&r.right<=viewport.right})}));
    check(tag+' high half and wood elves each have three semantic list items in order',await p.evaluate(()=>{
     const sections=[...document.querySelectorAll('.archive-world-section')],item=greenstoaLore.articles[1];
     return JSON.stringify(sections.map(section=>section.querySelector('h4').textContent))===JSON.stringify(['하이엘프','하프엘프','우드엘프'])&&sections.every((section,index)=>{const list=section.querySelector('ul.archive-world-points');return list&&list.children.length===3&&[...list.children].every(child=>child.tagName==='LI')&&JSON.stringify([...list.children].map(child=>child.textContent))===JSON.stringify(item.sections[index].bullets)})&&![...document.querySelectorAll('#archive-page p,#archive-page li')].some(element=>/보디|일부을|업으나|&#x20;/.test(element.textContent));
    }));
    check(tag+' elf lists use readable body text and stay inside the reading width',await p.locator('.archive-world-points').evaluateAll(lists=>{const viewport=document.querySelector('#archive-scroll').getBoundingClientRect(),bodySize=parseFloat(getComputedStyle(document.querySelector('#archive-page p:not(.archive-kicker)')).fontSize);return lists.every(list=>{const bounds=list.getBoundingClientRect();return getComputedStyle(list).listStyleType==='disc'&&parseFloat(getComputedStyle(list).fontSize)===bodySize&&bounds.left>=viewport.left&&bounds.right<=viewport.right&&list.scrollWidth<=list.clientWidth+1})}));
    await p.locator('#archive-scroll').evaluate(element=>element.scrollTop=0);await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);await p.screenshot({path:path.join(out,tag+'-elves-top.png')});
    await p.locator('#archive-scroll-more').click();check(tag+' elf article scroll hint advances the long lore',await p.locator('#archive-scroll').evaluate(element=>element.scrollTop>0));
    for(const [index,name]of ['high','half','wood'].entries()){await p.locator('.archive-world-section .archive-world-image').nth(index).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-elves-'+name+'.png')})}
    await p.locator('.archive-world-points li').last().scrollIntoViewIfNeeded();
    check(tag+' final wood elf tattoo description is reachable',await p.locator('.archive-world-points li').last().evaluate(element=>{const bounds=element.getBoundingClientRect(),viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return bounds.top>=viewport.top&&bounds.bottom<=viewport.bottom+1&&element.textContent.includes('원 모양 문신')}));
    await p.locator('#archive-scroll').focus();await p.keyboard.press('End');await p.waitForFunction(()=>document.querySelector('#archive-scroll-more').hidden);
    check(tag+' elf article ends with the original wood elf text without overflow',await p.locator('.archive-world-points li').last().evaluate(element=>element.getBoundingClientRect().bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1)&&await p.locator('#archive-scroll').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
    await p.screenshot({path:path.join(out,tag+'-elves-end.png')});
   }else if(i===2){
    for(const image of await p.locator('.archive-world-image').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode())}
    check(tag+' article '+titles[i]+' has matching copy and valid art',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('#archive-page p:not(.archive-kicker)').count()===4&&await p.locator('.archive-world-image').count()===2);
    check(tag+' demon image leads the article and Zer image is followed by his subtitle and two paragraphs',await p.evaluate(()=>{
     const page=document.querySelector('#archive-page'),parts=[...page.children],item=greenstoaLore.articles[2],section=page.querySelector('.archive-world-section');
     return parts[0].dataset.illustration==='demonKing'&&parts[3].tagName==='P'&&parts[4].tagName==='P'&&parts[5]===section&&section.firstElementChild.dataset.illustration==='zerAlliance'&&section.children[1].tagName==='H4'&&section.children[1].textContent==='용사 제르'&&section.querySelectorAll('p').length===2&&section.lastElementChild.tagName==='P'&&!page.querySelector('canvas.archive-world-art')&&[...page.querySelectorAll('p:not(.archive-kicker)')].map(p=>p.textContent).join('\n')===[...item.body,...item.sections[0].body].join('\n')&&!page.textContent.includes('&#x20;');
    }));
    check(tag+' both chaos images preserve their complete 1216 by 640 composition',await p.locator('.archive-world-image').evaluateAll(images=>{const viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return images.every(image=>{const rect=image.getBoundingClientRect();return image.naturalWidth===1216&&image.naturalHeight===640&&image.width>0&&Number(image.getAttribute('height'))===640&&Math.abs(rect.width/rect.height-1216/640)<.01&&rect.left>=viewport.left&&rect.right<=viewport.right})}));
    await p.locator('#archive-scroll').evaluate(element=>element.scrollTop=0);await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);await p.screenshot({path:path.join(out,tag+'-chaos-top.png')});
    await p.locator('#archive-scroll-more').click();check(tag+' chaos article scroll hint advances the content',await p.locator('#archive-scroll').evaluate(element=>element.scrollTop>0));
    await p.locator('[data-illustration="zerAlliance"]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-chaos-zer.png')});
    await p.locator('#archive-scroll').focus();await p.keyboard.press('End');await p.waitForFunction(()=>document.querySelector('#archive-scroll-more').hidden);
    check(tag+' chaos final paragraph is reachable and the article has no horizontal overflow',await p.locator('.archive-world-section p').last().evaluate(element=>element.getBoundingClientRect().bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1)&&await p.locator('#archive-scroll').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
    await p.screenshot({path:path.join(out,tag+'-chaos-end.png')});
   }else if(i===3){
    for(const image of await p.locator('.archive-world-image').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode())}
    check(tag+' peace image leads the article and crisis image precedes present day',await p.evaluate(()=>document.querySelector('#archive-page').firstElementChild.dataset.illustration==='peace'&&document.querySelector('.archive-world-section').firstElementChild.dataset.illustration==='crisis'&&document.querySelectorAll('.archive-world-image').length===2&&!document.querySelector('canvas.archive-world-art')));
    check(tag+' peace and crisis images preserve full 1216 by 704 composition',await p.locator('.archive-world-image').evaluateAll(images=>{const viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return images.every(image=>{const r=image.getBoundingClientRect();return image.naturalWidth===1216&&image.naturalHeight===704&&Math.abs(r.width/r.height-1216/704)<.01&&r.left>=viewport.left&&r.right<=viewport.right})}));
    await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);
    check(tag+' peace and crisis article has the requested present-day subtitle and three paragraphs',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('.archive-world-section h4').innerText()==='953년 10월 1일, 현 시점'&&await p.locator('#archive-page p:not(.archive-kicker)').count()===3&&await p.evaluate(()=>{const item=greenstoaLore.articles[3],section=document.querySelector('.archive-world-section');return section.firstElementChild.dataset.illustration==='crisis'&&section.children[1].tagName==='H4'&&[...document.querySelectorAll('#archive-page p:not(.archive-kicker)')].map(p=>p.textContent).join('\n')===[...item.body,...item.sections[0].body].join('\n')}));
    await p.screenshot({path:path.join(out,tag+'-crisis-top.png')});
    await p.locator('.archive-world-section .archive-world-image').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-crisis-present.png')});
    await p.locator('.archive-world-section p').last().scrollIntoViewIfNeeded();
    check(tag+' present-day epilogue is readable without horizontal overflow',await p.locator('.archive-world-section p').last().evaluate(element=>{const rect=element.getBoundingClientRect(),viewport=document.querySelector('#archive-scroll').getBoundingClientRect();return rect.top>=viewport.top-1&&rect.bottom<=viewport.bottom+1&&element.textContent==='다행히도 바로 지금, 제르디아의 한 모험가 또한 이 현상에 흥미를 붙였습니다...'})&&await p.locator('#archive-scroll').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
    await p.screenshot({path:path.join(out,tag+'-crisis-epilogue.png')});
   }else if(i===4){
    for(const image of await p.locator('.archive-world-image').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode())}
    check(tag+' investigation image one leads and image two precedes the decision',await p.evaluate(()=>{const page=document.querySelector('#archive-page'),images=[...page.querySelectorAll('.archive-world-image')];return images.length===2&&page.firstElementChild===images[0]&&images[0].dataset.illustration==='investigationLucy'&&images[1].dataset.illustration==='investigationGreenstoa'&&images[1].nextElementSibling.textContent.startsWith('허나 위험을')&&!page.querySelector('canvas.archive-world-art')}));
    check(tag+' investigation images preserve original dimensions and complete composition',await p.locator('.archive-world-image').evaluateAll(images=>{const v=document.querySelector('#archive-scroll').getBoundingClientRect();return images.every((image,index)=>{const [w,h]=index===0?[1300,700]:[1920,1088],r=image.getBoundingClientRect();return image.naturalWidth===w&&image.naturalHeight===h&&Math.abs(r.width/r.height-w/h)<.01&&r.left>=v.left&&r.right<=v.right})}));
    await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);await p.screenshot({path:path.join(out,tag+'-investigation-top.png')});
    await p.locator('[data-illustration="investigationGreenstoa"]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-investigation-decision.png')});
    check(tag+' investigation has four complete paragraphs and a Lucy link',await p.locator('#archive-page p:not(.archive-kicker)').count()===4&&await p.locator('.archive-person-link').innerText()==='루시'&&await p.evaluate(()=>[...document.querySelectorAll('#archive-page p:not(.archive-kicker)')].map(p=>p.textContent).join('\n')===greenstoaLore.articles[4].body.join('\n')));
    check(tag+' investigation divider separates the unclaimed request from the decision',await p.locator('hr.archive-world-divider').count()===1&&await p.locator('hr.archive-world-divider').evaluate(e=>e.previousElementSibling.textContent.endsWith('수주하지 않았습니다.')&&e.nextElementSibling.dataset.illustration==='investigationGreenstoa'&&e.nextElementSibling.nextElementSibling.textContent.startsWith('허나 위험을')));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key));
    await p.locator('.archive-person-link').click();
    check(tag+' Lucy link opens her biography and focuses her selected index',await p.locator('#archive-page h3').innerText()==='루시'&&await p.locator('[data-archive-tab="people"]').getAttribute('aria-pressed')==='true'&&await p.locator('#archive-index button[aria-pressed="true"]').evaluate(e=>e===document.activeElement&&e.textContent.includes('루시')));
    check(tag+' Lucy navigation preserves the save and URL',await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved&&new URL(p.url()).hash==='');
    await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(4).click();
    await p.locator('.archive-person-link').focus();await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');
    check(tag+' Lucy link participates in the keyboard focus cycle',await p.locator('.archive-person-link').evaluate(e=>e===document.activeElement));
    await p.keyboard.press('Enter');
    check(tag+' Enter opens Lucy biography',await p.locator('#archive-page h3').innerText()==='루시');
    await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(4).click();
    await p.locator('#archive-page p:not(.archive-kicker)').last().scrollIntoViewIfNeeded();
    check(tag+' investigation ending is reachable without horizontal overflow',await p.locator('#archive-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)&&await p.locator('#archive-page p:not(.archive-kicker)').last().evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1));
    await p.screenshot({path:path.join(out,tag+'-investigation.png')});
   }else if(i===5){
    const expected=[['seia','shunya','runya','rael','carola','sif'],['ellen','bran','unrevealed'],['sena','remu','seia','ellen'],['lucy','rose','edan','bord','godric','mia','aiherde']];
    check(tag+' four race sections preserve requested member order and overlap',await p.locator('.archive-world-section').evaluateAll((sections,expected)=>JSON.stringify(sections.map(s=>[...s.querySelectorAll('.archive-race-members a')].map(a=>a.dataset.person)))===JSON.stringify(expected),expected));
    check(tag+' each race has its full paragraph and names under square icons',await p.locator('.archive-world-section').evaluateAll(sections=>sections.length===4&&sections.every(s=>s.querySelector('h4')&&s.querySelector('p')&&[...s.querySelectorAll('.archive-race-members a')].every(a=>a.querySelector('.archive-race-icon').getBoundingClientRect().width===64&&a.querySelector('.archive-race-name').textContent))));
    check(tag+' Iboria is labelled as Main',await p.locator('[data-person="bran"] small').innerText()==='마인');
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key));
    for(const [label,id] of [['헬렌','helen'],['캐롤라','carola']]){
     await p.locator('#archive-page a.archive-person-link').filter({hasText:label}).click();
     check(tag+' inline '+label+' link opens correct biography',await p.locator('#archive-page h3').innerText()===label);
     await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(5).click();
    }
    for(const id of [...new Set(expected.flat())]){
     const link=p.locator('.archive-race-members a[data-person="'+id+'"]').first();
     const label=await link.locator('.archive-race-name').innerText();await link.click();
     check(tag+' race icon '+id+' opens matching biography',await p.locator('#archive-page h3').innerText()===label&&await p.locator('#archive-index button[aria-pressed="true"]').evaluate(e=>e===document.activeElement));
     await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(5).click();
    }
    const link=p.locator('.archive-race-members a[data-person="lucy"]');await link.focus();await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');
    check(tag+' race icons are reachable with keyboard Tab',await link.evaluate(e=>e===document.activeElement));await p.keyboard.press('Enter');
    check(tag+' keyboard opens race biography without changing save bytes',await p.locator('#archive-page h3').innerText()==='루시'&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(5).click();
    for(const [index,name]of ['beast','demon','undead','human'].entries()){
     const section=p.locator('.archive-world-section').nth(index);await section.locator('h4').scrollIntoViewIfNeeded();
     check(tag+' '+name+' race cards fit reading width',await section.locator('.archive-race-members').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().right<=document.querySelector('#archive-scroll').getBoundingClientRect().right+1));
     await p.screenshot({path:path.join(out,tag+'-races-'+name+'.png')});
    }
   }else if(i===6){
    const headings=['지도자','그린스토아 본청','힐리아스 여관','동부','서부','남부','북부','중심 상권','정찰대'];
    check(tag+' administration has nine requested sections and complete paragraphs',await p.locator('.archive-world-section').evaluateAll((sections,headings)=>JSON.stringify(sections.map(s=>s.querySelector('h4').textContent))===JSON.stringify(headings)&&sections.every(s=>s.querySelectorAll('p').length===1),headings)&&await p.evaluate(()=>[...document.querySelectorAll('.archive-world-section p')].map(p=>p.textContent).join('\n')===greenstoaLore.articles[6].sections.flatMap(s=>s.body).join('\n')));
    check(tag+' leader cards show former Helen and current Aran',await p.locator('.archive-race-members a').evaluateAll(links=>JSON.stringify(links.map(a=>[a.dataset.person,a.querySelector('small').textContent]))===JSON.stringify([['helen','전임'],['aran','현임']])));
    check(tag+' inn hobby phrase is bold without literal markdown',await p.locator('.archive-world-section strong').innerText()==='취미 삼아'&&!await p.locator('#archive-page').innerText().then(t=>t.includes('**')));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key));
    for(const [id,name]of [['helen','헬렌'],['aran','아란']]){
     await p.locator('.archive-race-members a[data-person="'+id+'"]').focus();await p.keyboard.press('Enter');
     check(tag+' '+name+' leader icon opens the correct biography',await p.locator('#archive-page h3').innerText()===name);
     await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(6).click();
    }
    check(tag+' leader navigation preserves the existing save',await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    for(let j=0;j<headings.length;j++){
     const section=p.locator('.archive-world-section').nth(j);await section.locator('p').scrollIntoViewIfNeeded();
     check(tag+' administration '+headings[j]+' is reachable without overflow',await section.evaluate(e=>{const r=e.getBoundingClientRect(),v=document.querySelector('#archive-scroll').getBoundingClientRect();return r.top<v.bottom&&r.bottom>v.top&&e.scrollWidth<=e.clientWidth+1}));
    }
    await p.locator('.archive-world-section').last().locator('p').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-administration-end.png')});
    await p.locator('#archive-scroll').evaluate(e=>e.scrollTop=0);await p.screenshot({path:path.join(out,tag+'-administration-leaders.png')});
   }else if(i===7){
    check(tag+' exterior introduces the journey and four requested sections',await p.locator('.archive-world-section h4').evaluateAll(es=>JSON.stringify(es.map(e=>e.textContent))===JSON.stringify(['제르디아 모험가 길드','아이리스 제국','월화국','염뢰혈']))&&await p.evaluate(()=>[...document.querySelectorAll('#archive-page p:not(.archive-kicker)')].map(e=>e.textContent).join('\n')===[...greenstoaLore.articles[7].body,...greenstoaLore.articles[7].sections.flatMap(s=>s.body)].join('\n')));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key));
    const hanari=p.locator('.archive-race-members a[data-person="mia"]');
    await hanari.locator('.archive-person-icon img').evaluate(image=>image.decode());
    check(tag+' Wolhwa has a named Hanari dot icon',await hanari.locator('.archive-race-name').innerText()==='하나리'&&await hanari.locator('.archive-person-icon[data-person="mia"] img').count()===1);
    await hanari.focus();await p.keyboard.press('Enter');
    check(tag+' Hanari icon opens her biography without changing the save',await p.locator('#archive-page h3').innerText()==='하나리'&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(7).click();
    const muirshu=p.locator('.archive-world-section').nth(3).locator('.archive-race-members a[data-person="rael"]'),url=p.url();
    await muirshu.locator('.archive-person-icon img').evaluate(image=>image.decode());
    check(tag+' dragon homeland has a named Muirshu dot icon',await muirshu.locator('.archive-race-name').innerText()==='뮈르슈'&&await muirshu.locator('.archive-person-icon[data-person="rael"] img').count()===1);
    await muirshu.focus();await p.keyboard.press('Enter');
    check(tag+' dragon homeland icon opens Muirshu without changing URL or save',await p.locator('#archive-page h3').innerText()==='뮈르슈'&&p.url()===url&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.locator('[data-archive-tab="world"]').click();await p.locator('#archive-index button').nth(7).click();
    for(let j=0;j<4;j++){
     const section=p.locator('.archive-world-section').nth(j);await section.locator('p').scrollIntoViewIfNeeded();
     check(tag+' exterior section '+j+' is reachable without overflow',await section.evaluate(e=>{const r=e.getBoundingClientRect(),v=document.querySelector('#archive-scroll').getBoundingClientRect();return r.top<v.bottom&&r.bottom>v.top&&e.scrollWidth<=e.clientWidth+1}));
    }
    await p.locator('.archive-world-section').nth(2).locator('.archive-race-members').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-exterior-hanari.png')});
    await p.locator('.archive-world-section').nth(3).locator('.archive-race-members').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-exterior-muirshu.png')});
   }else check(tag+' article '+titles[i]+' has matching copy and valid art',await p.locator('#archive-page h3').innerText()===titles[i]&&await p.locator('#archive-page p:not(.archive-kicker)').count()>=2&&await p.locator('canvas.archive-world-art').getAttribute('data-chapter')!==null);
  }
  check(tag+' opening scenes remain intact',await p.evaluate(()=>greenstoaLore.scenes.length===9&&greenstoaLore.scenes[0].title==='나라 이전의 시대'&&greenstoaLore.scenes[8].title==='성역에 스미는 그림자'));
  await p.locator('[data-archive-tab="people"]').click();
  const leadNames=['마르에리','카니아','헤니아','헬렌','아란','클로네','레무','루냐','슈냐','시프','뮈르슈','엘레나','캐롤라','세이아','장위','???'];
  const supportNames=['루시','아르다','하나리','이보리아','아이헤르데','기루스','보르드','고드릭'],names=[...leadNames,...supportNames];
  const relationships={'마르에리':['헤니아','헬렌','아란'],'헤니아':['카니아','클로네','헬렌'],'카니아':['헤니아','클로네','레무','헬렌','아란'],'헬렌':['아란','카니아','헤니아','클로네','마르에리'],'아란':['헬렌','카니아','클로네','레무','헤니아'],'클로네':['헬렌','헤니아','뮈르슈'],'레무':['엘레나','카니아','장위'],'루냐':['슈냐','헬렌','엘레나'],'슈냐':['루냐'],'시프':['당신(플레이어)','아란','헬렌','캐롤라'],'엘레나':['레무']};
  relationships['뮈르슈']=['클로네','장위'];
  relationships['엘레나']=['레무','장위'];
  const copy={
    '엘레나':{'레무':['반응 재밌는 슬라임. 이번엔 어떻게 놀려먹어야 할까나~?','neutral'],'장위':['몸매 좋은 겁쟁이. 흉악한 걸 달고 다니면서, 겁은 엄청 많다니까~','neutral']},
    '뮈르슈':{'클로네':['흥미로운 학자. 여러가지 지식과 마법식이 눈에 띄는군, 만나봐도 좋을 사람이지.','neutral'],'장위':['정문 근처에서 떠도는 언데드 녀석. 쓸데없는 걱정을 하는 것 같더군.','neutral']},
    '시프':{'당신(플레이어)':['모험가 님. 혹시, 괜찮으시면 대화라도...!','flustered'],'아란':['이 곳의 지도자. 명성은 알고 있어요...','neutral'],'헬렌':['이 곳의 지도자. 명성은 알고 있어요...','neutral'],'캐롤라':['목장 주인. 목장의 우유에 관심이 있어요. 그리고 저한텐 없는 활력도 느껴져요.','neutral']},
    '슈냐':{'루냐':['친한 친구. 답답하다냐! 내 손에 들어오면 내 거다냐.','annoyed']},
    '루냐':{'슈냐':['친한 친구. 사람들 물건 좀 그만 훔치란 말이야...! 점찍는 것도 안 돼!','annoyed'],'헬렌':['전임 지도자님. 만나볼 기회는 많이 없지만... 월광 마법을 정말 잘 다루세요.','neutral'],'엘레나':['소문의 주인공...? 저, 저는 직접 보기까지는 안 믿을래요.','puzzled']},
    '레무':{'엘레나':['무서운 사람. 자꾸 대장간에 찾아와서 놀린다니까요!','flustered'],'카니아':['정찰병 님. 이따금씩 활을 손질해달라고 찾아오시는데, 저는 금속 외에는 잘...','puzzled'],'장위':['정문의 강시. 상권까지 오지는 않지만... 분명 좋은 사람일 거에요!','neutral']},
    '클로네':{'헬렌':['대화가 잘 통하는 전 지도자. 헬렌 님의 지원 덕에 많은 마법식을 만들고 개량했다.','neutral'],'헤니아':['피곤하게 사는 영애. 다른 문화를 비난할 생각은 없다만, 귀찮은 껍데기 안에서 살아가는 건 분명하군.','neutral'],'뮈르슈':['흥미로운 용족. 용족의 지능과 압도적인 마력에 관심이 가는군. 기회가 된다면 만남을 가지고 싶다.','neutral']},
    '아란':{'헬렌':['존경하는 어머니. 기대에 부응할 수 있었으면 좋겠다.','neutral'],'카니아':['신뢰하는 동료. 발빠르게 움직이며 소식을 빠르게 알려준다.','neutral'],'클로네':['뛰어난 마법탐구자. 정말 유능하지만 그... 그 옷차림 만큼은! 어떻게 안 되겠나앗...','flustered'],'레무':['믿을 수 있는 대장장이. 직접적 만남은 뜸하지만 정찰대의 무기를 수리해주는 고마운 녀석이다.','neutral'],'헤니아':['마법은 뛰어난 영애. 카니아와 티격대는 것을 많이 봤는데, 서로 친한가...?','puzzled']},
    '헬렌':{'아란':['딸. 기특하게 잘 해주고 있어~','neutral'],'카니아':['믿음직한 아이. 놀리는게 재밌고 귀여워~.','neutral'],'헤니아':['고양이같은 아이. 틱틱대면서도 주눅드는게 귀여워~','neutral'],'클로네':['똑똑한 마법탐구자. 옷차림 덕분에 시민들을 놀래키곤 하지만... 말은 잘 통해~','neutral'],'마르에리':['술친구. 허울없는 모습이 맘에 들어~','neutral']},
    '마르에리':{'헤니아':['고지식한 녀석','neutral'],'헬렌':['술친구','neutral'],'아란':['어리버리.','neutral']},
    '카니아':{'헤니아':['악우. 온실 속 화초 주제에 정찰대를 흉본다!','annoyed'],'클로네':['신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...','flustered'],'레무':['신뢰하는 대장장이. 능률이 대단하군.','neutral'],'헬렌':['존경하는 전임 지도자. 헬렌 님께는 예를 갖춰라!','neutral'],'아란':['현임 지도자. 신뢰한다만... 아니, 아니!','flustered']},
    '헤니아':{'카니아':['악우. 정말 안타깝구나, 카니아. 하이엘프라면 응당 품위를 차리는게 종족에 대한 예의 아니겠니? 정찰대같은 진흙탕이 아니라.','puzzled'],'클로네':['이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?','annoyed'],'헬렌':['인정하는 전임 지도자. 헬렌 님의 체면을 생각해서 순순히 지내는 거란다. 절대 내가 무시당하는 게 아니고!','flustered']},
  };
  check(tag+' roster contains exactly the requested 24 names in order',await p.locator('#archive-index button').evaluateAll(es=>es.map(e=>e.textContent.replace(/^[▸　 ]+/,''))).then(actual=>JSON.stringify(actual)===JSON.stringify(names)));
  const sections=await p.locator('.archive-index-group').evaluateAll(es=>es.map(e=>({title:e.querySelector('h4').textContent,count:e.querySelectorAll('button').length})));
  check(tag+' people are split into 16 leads and 8 supporting characters',JSON.stringify(sections)===JSON.stringify([{title:'주연',count:16},{title:'조연',count:8}]));
  await p.locator('#archive-index .archive-person-icon img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  check(tag+' all 24 people have independent icons with 20 dot faces and four unknown placeholders',await p.locator('#archive-index .archive-person-icon').evaluateAll(icons=>icons.length===24&&icons.filter(icon=>icon.querySelector('img')).length===20&&icons.filter(icon=>icon.classList.contains('is-unrevealed')).length===4&&icons.every((icon,index)=>icon.dataset.person===greenstoaLore.people[index].id&&icon.getAttribute('aria-hidden')==='true')));
  check(tag+' cast icons fit their buttons without changing the accessible names',await p.locator('#archive-index button').evaluateAll(buttons=>buttons.every(button=>{const icon=button.querySelector('.archive-person-icon'),r=icon.getBoundingClientRect(),b=button.getBoundingClientRect();return r.width===32&&r.height===32&&r.left>=b.left&&r.right<=b.right&&button.textContent.trim().length>0})));
  check(tag+' Mareri has the requested role and exact six hashtags',await p.locator('.archive-person-role').innerText()==='주정뱅이 정령사'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#하프엘프','#정령술사','#애주가','#앳된_외견','#시니컬','#251세'])));
  for(let i=0;i<names.length;i++){
   await p.locator('#archive-index button').nth(i).click();
   if(names[i]==='카니아')check(tag+' Kania has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='그린스토아 정찰대 궁병'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#정찰대','#하이엘프','#츤_70%_데레_30%','#길잡이','#197세'])));
   if(names[i]==='아란')check(tag+' Aran has the requested role and six hashtags',await p.locator('.archive-person-role').innerText()==='얼렁뚱땅 현임 지도자'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#허당','#하프엘프','#현임_지도자','#품위_연기','#백치미','#160세'])));
   if(names[i]==='레무')check(tag+' Remu has the requested role and six hashtags',await p.locator('.archive-person-role').innerText()==='슬라임 대장장이'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#몬스터','#슬라임','#대장장이','#신체변형','#활기참','#나이불명'])));
   if(names[i]==='루냐')check(tag+' Runya has the requested role and six hashtags',await p.locator('.archive-person-role').innerText()==='슈냐의 억제기'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#고양이_수인','#온순함','#예의범절','#슈냐의_친구','#마법사','#20세'])));
   if(names[i]==='슈냐')check(tag+' Shunya has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='루냐의 애물단지'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#고양이_수인','#자유분방','#루냐의_친구','#도적','#20세'])));
   if(names[i]==='클로네'){
    check(tag+' Klone has the requested role and six hashtags',await p.locator('.archive-person-role').innerText()==='천재 마법탐구자'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#고지능','#우드엘프','#현실적','#개방적_생활문화','#마법탐구자','#311세'])));
    check(tag+' Klone clarification follows the common-sense sentence',await p.locator('.archive-person-biography').innerText().then(text=>text.endsWith('그녀에겐 그것이 상식입니다. 때와 장소를 가리지 않는 것도 아닙니다.')));
   }
   if(names[i]==='헬렌')check(tag+' Helen has the requested role and six hashtags',await p.locator('.archive-person-role').innerText()==='전임 지도자, 현임 여관 주인'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#너그러움','#나긋나긋','#전임_지도자','#여관_주인','#하프엘프','#417세'])));
   if(names[i]==='헤니아'){
    check(tag+' Henia has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='나르시시즘 영애님'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#오만함','#귀족','#영애','#온실_속_화초','#197세'])));
    check(tag+' Henia citizen sentence follows the idle reveal before the closing description',await p.locator('.archive-person-biography').innerText().then(text=>text.includes('헤니아는 사실 놀고 있습니다! 시민들은 이 사실에 은근히 헤니아를 무시하지만, 본인은 인정하지 않는 것 같습니다. 고압적이지만, 칭찬과 반격에 약한 영애님입니다.')&&!text.includes('(하이퍼링크)')));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key)),url=p.url(),inn=p.locator('.archive-person-biography a').filter({hasText:'힐리아스 여관'});
    check(tag+' Henia biography contains an accessible inn link',await inn.count()===1&&await inn.getAttribute('aria-label')==='힐리아스 여관 설명 보기');
    await inn.focus();await p.keyboard.press('Enter');
    check(tag+' inn link opens administration directly at the inn section',await p.locator('[data-archive-tab="world"]').getAttribute('aria-pressed')==='true'&&await p.locator('#archive-page h3').innerText()==='그린스토아의 행정'&&await p.getByRole('heading',{name:'힐리아스 여관',exact:true}).evaluate(heading=>{const r=heading.getBoundingClientRect(),v=document.querySelector('#archive-scroll').getBoundingClientRect();return r.top>=v.top-1&&r.bottom<=v.bottom+1}));
    check(tag+' inn navigation keeps URL and save unchanged',p.url()===url&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.screenshot({path:path.join(out,tag+'-henia-inn-link.png')});
    await p.locator('[data-archive-tab="people"]').click();await p.locator('#archive-index button').nth(i).click();
   }
   if(names[i]==='엘레나'){
    check(tag+' Elena has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='밤의 마녀'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#서큐버스','#몬스터','#마족','#매혹적','#100세'])));
    check(tag+' Elena introduction has two paragraphs with only the opening sentence in bold',await p.locator('.archive-person-biography').evaluate(section=>{const paragraphs=[...section.querySelectorAll('p')],bold=section.querySelectorAll('strong'),opening='감언이설과 매혹 마법으로 남성을 유혹하고, 정기를 흡수하는 몽마!';return paragraphs.length===2&&bold.length===1&&paragraphs[0].textContent===opening&&bold[0].textContent===opening&&bold[0].parentElement===paragraphs[0]&&Number(getComputedStyle(bold[0]).fontWeight)>Number(getComputedStyle(paragraphs[1]).fontWeight)&&!paragraphs[1].querySelector('strong')&&paragraphs[1].textContent.startsWith('...일 뻔한 서큐버스입니다.')&&paragraphs[1].textContent.endsWith('진위여부는 불명이지만요.')&&!section.textContent.includes('(볼드)')}));
    await p.locator('.archive-person-biography strong').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,tag+'-elena-bold-introduction.png')});
    await p.locator('#archive-scroll').evaluate(scroll=>scroll.scrollTop=0);
   }
   if(names[i]==='뮈르슈'){
    check(tag+' Muirshu has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='깐깐한 도서관 사서'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#드래곤_수인','#염뢰혈_출신','#용족','#사서','#나이_불명'])));
    check(tag+' Muirshu biography keeps both requested paragraphs without link annotations',await p.locator('.archive-person-biography p').count()===2&&await p.evaluate(i=>[...document.querySelectorAll('.archive-person-biography p')].map(p=>p.textContent).join('\n')===greenstoaLore.people[i].body.join('\n')&&!document.querySelector('.archive-person-biography').textContent.includes('(하이퍼링크)'),i));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key)),url=p.url(),homeland=p.locator('.archive-person-biography a').filter({hasText:'염뢰혈'});
    check(tag+' Muirshu biography contains a named homeland link',await homeland.count()===1&&await homeland.getAttribute('aria-label')==='염뢰혈 설명 보기');
    await homeland.focus();await p.keyboard.press('Enter');
    check(tag+' Muirshu homeland link opens the external world topic directly at the dragon homeland',await p.locator('[data-archive-tab="world"]').getAttribute('aria-pressed')==='true'&&await p.locator('#archive-page h3').innerText()==='외부'&&await p.getByRole('heading',{name:'염뢰혈',exact:true}).evaluate(heading=>{const r=heading.getBoundingClientRect(),s=document.querySelector('#archive-scroll').getBoundingClientRect();return r.top>=s.top-1&&r.bottom<=s.bottom+1}));
    check(tag+' Muirshu homeland navigation preserves URL and save',p.url()===url&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.screenshot({path:path.join(out,tag+'-muirshu-homeland-link.png')});
    await p.locator('[data-archive-tab="people"]').click();await p.locator('#archive-index button').nth(i).click();
   }
   if(names[i]==='시프')check(tag+' Sif has the requested role and five hashtags',await p.locator('.archive-person-role').innerText()==='털 날리는 여행객'&&await p.locator('.archive-person-tags li').allTextContents().then(tags=>JSON.stringify(tags)===JSON.stringify(['#양_수인','#여행객','#제르디아_출신','#모험가_선망','#21세'])));
   const person=await p.evaluate(i=>({kind:greenstoaLore.people[i].portraitKind,src:greenstoaLore.people[i].portraitSrc,id:greenstoaLore.people[i].id}),i);
   let portraitOk;
   if(person.src){
    await p.locator('.archive-person-image').evaluate(image=>image.decode());
    portraitOk=await p.locator('.archive-person-image').evaluate(image=>image.naturalWidth===1300&&image.naturalHeight===700&&getComputedStyle(image).objectFit==='contain');
    check(tag+' '+names[i]+' card is landscape and fully visible above its description',await p.locator('.archive-person-photo').evaluate(photo=>{const r=photo.getBoundingClientRect(),page=document.querySelector('#archive-page').getBoundingClientRect(),copy=document.querySelector('.archive-person-copy').getBoundingClientRect();return Math.abs(r.width/r.height-13/7)<.02&&r.width<=page.width+1&&r.top>=document.querySelector('#archive-scroll').getBoundingClientRect().top-1&&r.bottom<=document.querySelector('#archive-scroll').getBoundingClientRect().bottom+1&&copy.top>=r.bottom-1&&copy.right<=page.right+1}));
    await p.screenshot({path:path.join(out,tag+'-person-'+person.id+'.png')});
   }else if(person.kind==='unrevealed')portraitOk=await p.locator('.archive-person-unrevealed').count()===1;
   else portraitOk=await p.locator('.archive-person-photo canvas').evaluate(e=>{const d=e.getContext('2d').getImageData(0,0,e.width,e.height).data;return d.some((v,i)=>i%4===3&&v>96)});
   check(tag+' profile '+(i+1)+' '+names[i]+' renders with the correct portrait and count',await p.locator('.archive-person-copy h3').innerText()===names[i]&&await p.locator('#archive-page-count').innerText()===String(i+1).padStart(2,'0')+' / 24'&&portraitOk);
   const targets=relationships[names[i]]||[];
   const rowTargets=names[i]==='시프'?['당신(플레이어)','아란','캐롤라']:targets;
   check(tag+' '+names[i]+' relationship section is limited to the requested people',await p.locator('.archive-person-relationships').count()===(targets.length?1:0)&&await p.locator('.archive-person-relationships .archive-relationship-target').allTextContents().then(actual=>JSON.stringify(actual)===JSON.stringify(targets))&&await p.locator('.archive-relationship-detail').allTextContents().then(actual=>JSON.stringify(actual)===JSON.stringify(rowTargets.map(t=>copy[names[i]]?.[t]?.[0]||'미공개'))));
   if(targets.length){
    check(tag+' '+names[i]+' relationship targets have their own dot icons',await p.locator('.archive-relationship-target .archive-person-icon').evaluateAll((icons,targets)=>icons.length===targets.length&&icons.every((icon,index)=>targets[index]==='당신(플레이어)'?icon.dataset.person==='hero'&&icon.querySelector('canvas'):icon.dataset.person===greenstoaLore.people.find(person=>person.name===targets[index]).id&&icon.querySelector('img')),targets));
    await p.locator('.archive-relationship-detail .archive-relationship-reaction img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    const faces=await p.locator('.archive-relationship-detail .archive-relationship-reaction').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img'),s=document.querySelector('#archive-scroll').getBoundingClientRect();return {person:e.dataset.person,emotion:e.dataset.emotion,label:e.getAttribute('aria-label'),width:r.width,height:r.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,columns:Number(e.dataset.columns),rows:Number(e.dataset.rows),frame:Number(e.dataset.frame),renderedWidth:i.getBoundingClientRect().width,renderedHeight:i.getBoundingClientRect().height,pixelated:getComputedStyle(i).imageRendering,overflow:getComputedStyle(e).overflow,fits:r.left>=s.left&&r.right<=s.right}}));
    const id=await p.evaluate(i=>greenstoaLore.people[i].id,i);
    check(tag+' '+names[i]+' shows the correct owner and expression in unclipped compact face sprites',faces.length===rowTargets.length&&faces.every((f,j)=>f.person===id&&f.emotion===(copy[names[i]]?.[rowTargets[j]]?.[1]||'neutral')&&f.label.includes(names[i])&&f.width===64&&f.height===64&&Math.abs(f.naturalWidth/f.columns-f.naturalHeight/f.rows)<.1&&f.renderedWidth===64*f.columns&&f.renderedHeight===64*f.rows&&f.pixelated==='pixelated'&&f.overflow==='hidden'&&f.fits));
    if(names[i]==='시프'){
     const group=p.locator('.archive-person-relationships li.is-grouped-relationship');await group.scrollIntoViewIfNeeded();
     check(tag+' only Sif shares one relationship row and reaction for Aran and Helen',await p.locator('.archive-person-relationships li').count()===3&&await group.count()===1&&await group.evaluate(row=>{const buttons=[...row.querySelectorAll('button')],rects=buttons.map(button=>button.getBoundingClientRect()),scroll=document.querySelector('#archive-scroll').getBoundingClientRect();return buttons.map(button=>button.dataset.target).join(',')==='aran,helen'&&rects[0].top===rects[1].top&&rects.every(r=>r.left>=scroll.left&&r.right<=scroll.right)&&row.querySelectorAll('.archive-relationship-detail').length===1&&row.querySelectorAll('.archive-relationship-detail .archive-relationship-reaction').length===1&&document.querySelector('#archive-scroll').scrollWidth<=document.querySelector('#archive-scroll').clientWidth+1}));
     await p.screenshot({path:path.join(out,tag+'-sif-grouped-leaders.png')});
    }else check(tag+' '+names[i]+' retains separate relationship rows',await p.locator('.is-grouped-relationship').count()===0&&await p.locator('.archive-person-relationships li').count()===targets.length);
   }
  }
  await p.screenshot({path:path.join(out,tag+'-supporting-last.png')});
  for(const [source,targets]of Object.entries(relationships))for(const target of targets){
   await p.locator('#archive-index button').nth(names.indexOf(source)).click();
   if(target==='당신(플레이어)'){
    const player=p.locator('.archive-relationship-player[data-target="hero"]');await player.scrollIntoViewIfNeeded();
    check(tag+' Sif player relationship uses the existing hero portrait',await player.evaluate(element=>{const canvas=element.querySelector('canvas'),pixels=canvas?.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;return element.tagName==='SPAN'&&!element.matches('button,a')&&pixels?.some((value,index)=>index%4===3&&value>96)}));
    const saved=await p.evaluate(()=>localStorage.getItem(journeySave.key)),url=p.url();await player.click();
    check(tag+' player label keeps the cast roster save and selected Sif intact',await p.locator('.archive-person-copy h3').innerText()==='시프'&&await p.locator('#archive-index button').count()===24&&p.url()===url&&await p.evaluate(()=>localStorage.getItem(journeySave.key))===saved);
    await p.screenshot({path:path.join(out,tag+'-sif-player-relationship.png')});
    continue;
   }
   const link=p.locator('.archive-person-relationships button').filter({hasText:target});
   await link.scrollIntoViewIfNeeded();
   check(tag+' '+source+' to '+target+' relationship link is a reachable touch target',await link.evaluate(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('#archive-scroll').getBoundingClientRect();return r.height>=44&&r.left>=s.left&&r.right<=s.right}));
   if(source==='헤니아'&&target==='카니아'||source==='엘레나'||source==='카니아')await p.screenshot({path:path.join(out,tag+'-relationships-'+(source==='헤니아'?'henia':source==='엘레나'?'elena':'kania-'+target)+'.png')});
   await link.click();
   check(tag+' relationship opens '+target+' without losing archive state',await p.locator('.archive-person-copy h3').innerText()===target&&await p.locator('#archive-scroll').evaluate(e=>e.scrollTop===0)&&await p.evaluate(()=>guildGame.getState().archive==='people'));
  }
  check(tag+' eighteen unique supplied cards include one Seia entry',await p.evaluate(()=>greenstoaLore.people.filter(p=>p.portraitSrc).length===18&&greenstoaLore.people.filter(p=>p.name==='세이아').length===1));
  const seiaSource=await p.evaluate(()=>{const person=greenstoaLore.people.find(p=>p.id==='seia'),original=person.portraitSrc;person.portraitSrc='data:image/png;base64,bm90YW5pbWFnZQ==';return original});
  await p.locator('#archive-index button').filter({hasText:'세이아'}).click();await p.waitForFunction(()=>document.querySelector('.archive-person-unrevealed'));
  check(tag+' an unavailable supplied card falls back safely without borrowing an actor',await p.locator('.archive-person-photo canvas').count()===0&&await p.locator('.archive-person-unrevealed').innerText().then(t=>t.includes('이미지 없음')));
  await p.evaluate(src=>greenstoaLore.people.find(p=>p.id==='seia').portraitSrc=src,seiaSource);
  if(width<=700)check(tag+' both cast section headings remain visible on mobile',await p.locator('.archive-index-group h4').evaluateAll(es=>{const r=document.querySelector('#archive-index').getBoundingClientRect();return es.every(e=>{const b=e.getBoundingClientRect();return b.top>=r.top-1&&b.bottom<=r.bottom+1})}));
  await p.locator('#archive-index button').first().click();
  await p.locator('.archive-person-image').evaluate(image=>image.decode());
  check(tag+' portrait slot defaults to the supplied Mareri card',await p.locator('.archive-person-image').evaluate(image=>image.src.endsWith('/assets/person-mareri.webp')&&image.naturalWidth===1300&&image.naturalHeight===700));
  check(tag+' changing tabs brings the selected first entry into view',await p.locator('#archive-index').evaluate(e=>e.scrollLeft===0&&e.scrollTop===0));
  check(tag+' short introduction is larger than the old kicker',await p.locator('.archive-person-role').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12));
  check(tag+' name and multiple hashtag features are separate',await p.locator('.archive-person-copy h3').innerText()==='마르에리'&&await p.locator('.archive-person-tags li').count()>=3&&await p.locator('.archive-person-tags li').evaluateAll(es=>es.every(e=>e.textContent.startsWith('#'))));
  check(tag+' all people have independent photo paths and known profiles retain multiple tags',await p.evaluate(()=>greenstoaLore.people.every(p=>'portraitSrc'in p&&Array.isArray(p.tags)&&(p.portraitKind==='unrevealed'||p.tags.length>=3))));
  await p.screenshot({path:path.join(out,tag+'-people.png')});
  if(width===1280){
   await p.evaluate(()=>{const gallery=document.createElement('section');gallery.id='dot-icon-test-gallery';gallery.style.cssText='position:fixed;top:0;left:0;width:996px;height:512px;z-index:999999;background:#203329;display:grid;grid-template-columns:repeat(6,1fr);padding:16px;box-sizing:border-box;color:#f1e6bf;font:14px sans-serif';for(const button of document.querySelectorAll('#archive-index button')){const card=document.createElement('div'),icon=button.querySelector('.archive-person-icon').cloneNode(true),name=document.createElement('div');card.style.cssText='text-align:center';icon.style.cssText='width:64px;height:64px';name.textContent=button.textContent.replace(/^[▸　 ]+/,'');card.append(icon,name);gallery.append(card)}document.body.append(gallery)});
   await p.locator('#dot-icon-test-gallery img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
   await p.locator('#dot-icon-test-gallery').screenshot({path:path.join(out,tag+'-all-dot-icons.png')});
   await p.locator('#dot-icon-test-gallery').evaluate(element=>element.remove());
  }
  const original=await p.evaluate(()=>{const person=greenstoaLore.people[0];const saved={body:person.body,tags:person.tags,portraitSrc:person.portraitSrc};person.body=Array.from({length:18},(_,i)=>'상세 설명 '+(i+1)+'. '+person.body);person.tags=[...person.tags,'아주긴특징설명'.repeat(14)];const c=document.createElement('canvas');c.width=120;c.height=180;c.getContext('2d').fillRect(0,0,120,180);person.portraitSrc=c.toDataURL('image/png');return saved});
  await p.locator('#archive-index button').first().click();await p.locator('.archive-person-image').evaluate(i=>i.decode());
  check(tag+' supplied portrait photo replaces fallback without stretching',await p.locator('.archive-person-image').evaluate(i=>i.naturalWidth===120&&getComputedStyle(i).objectFit==='contain')&&await p.locator('.archive-person-photo canvas').count()===0);
  await p.waitForFunction(()=>!document.querySelector('#archive-scroll-more').hidden);
  check(tag+' long details show an obvious scroll button and scrollbar',await p.locator('#archive-scroll-more').isVisible()&&await p.locator('#archive-scroll').evaluate(e=>e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto'));
  check(tag+' long hashtag wraps within the viewport',await p.evaluate(()=>document.querySelector('#archive-scroll').scrollWidth<=document.querySelector('#archive-scroll').clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1));
  await p.locator('#archive-scroll-more').click();check(tag+' scroll hint button moves down the content',await p.locator('#archive-scroll').evaluate(e=>e.scrollTop>0));
  check(tag+' landscape photo and long biography stay in one readable column',await p.evaluate(()=>{const a=document.querySelector('.archive-person-photo').getBoundingClientRect(),b=document.querySelector('.archive-person-copy').getBoundingClientRect();return Math.abs(a.width/a.height-13/7)<.02&&b.top>=a.bottom-1&&a.left>=b.left-1&&a.right<=b.right+1}));
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
  await p.evaluate(src=>greenstoaLore.people[0].portraitSrc=src,original.portraitSrc);
  check(tag+' archive fits the screen without outer scrolling',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));
  await p.locator('#archive-close').click();const after=await p.evaluate(()=>guildGame.getState());
  check(tag+' closing preserves position, quest and save data',after.phase==='free'&&JSON.stringify(after.player)===JSON.stringify(before.player)&&after.hp===before.hp&&after.questAccepted===before.questAccepted&&JSON.stringify(after.items)===JSON.stringify(before.items)&&await p.evaluate(()=>journeySave.valid(journeySave.read())));
  await context.close();
 }
 check('no archive browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'archive-layout-report.json'),JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
