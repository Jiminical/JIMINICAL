const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/opening-art');fs.mkdirSync(out,{recursive:true});
const fixture={version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'library',storyStep:'arrived',questAccepted:true,hp:1,coins:15,shopOrigin:'city',player:{x:360,y:198,dir:'up'},npcs:[{id:'rael',x:360,y:108,dir:'down',talkCount:42}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1}],visited:['guild','city','gate','grove','library'],shopStocks:{city:{bread:5,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:true,leafTaken:false,springUsed:false,libraryReached:true,libraryLetterRead:true,libraryAmbushCleared:true}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const report={url:process.env.TEST_URL,checks:[],errors:[]};
 const check=(message,ok)=>{assert.ok(ok,message);report.checks.push(message);console.log('PASS '+message)};
 try{for(const [width,height]of (process.env.OPENING_SINGLE_VIEW?[[390,844]]:[[1280,800],[320,568],[390,844],[844,390],[667,375],[768,1024]])){
  const tag=width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:width!==1280,reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(tag+': '+error.message));
  await page.route('**/JS/game.js',async route=>{
   const response=await route.fetch(),source=(await response.text()).replace(/\r\n/g,'\n'),needle='  return {\n    ready,';
   assert.ok(source.includes(needle));
   await route.fulfill({response,body:source.replace(needle,'  window.__paintMuirshuForRegression=expression=>{portraitFor("rael",expression);fitPortrait();};\n'+needle)});
  });
  await page.goto(report.url,{timeout:120000});await page.evaluate(()=>guildGame.ready);
  await page.locator('#start-button').click();await page.locator('#story-screen[data-phase="prologue"]').waitFor();await page.locator('#story-auto').click();
  for(let chapter=0;chapter<9;chapter++){
   await page.waitForFunction(index=>document.querySelector('#chronicle-art').dataset.chapter===String(index),chapter);
   const metrics=await page.evaluate(()=>{
    const art=document.querySelector('#chronicle-art'),bounds=art.getBoundingClientRect(),footer=document.querySelector('.story-footer').getBoundingClientRect(),narration=document.querySelector('.narration-block'),reading=narration.getBoundingClientRect(),pixels=art.getContext('2d').getImageData(0,0,art.width,art.height).data;
    return {index:Number(art.dataset.chapter),width:bounds.width,height:bounds.height,top:bounds.top,left:bounds.left,right:bounds.right,bottom:bounds.bottom,footerTop:footer.top,footerBottom:footer.bottom,readingHeight:reading.height,readingBottom:reading.bottom,scroll: getComputedStyle(narration).overflowY,visible:pixels.some((value,i)=>i%4===3&&value>200),narration:document.querySelector('#story-narration-accessible').textContent,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   check(tag+' chapter '+(chapter+1)+' complete image fits above the footer',metrics.index===chapter&&metrics.visible&&metrics.width>100&&metrics.height>60&&Math.abs(metrics.width/metrics.height-16/9)<.03&&metrics.left>=0&&metrics.right<=width+1&&metrics.top>=48&&metrics.bottom<=metrics.footerTop+1&&!metrics.overflow);
   check(tag+' chapter '+(chapter+1)+' narration and controls remain readable',metrics.narration.length>20&&metrics.readingHeight>=40&&metrics.readingBottom<=metrics.footerTop+1&&metrics.footerBottom<=height+1&&metrics.scroll==='auto');
   if([0,2,7,8].includes(chapter))await page.screenshot({path:path.join(out,tag+'-opening-'+String(chapter+1).padStart(2,'0')+'.png')});
   if(chapter<8)await page.locator('#story-next').click();
  }
  await page.locator('#story-next').click();await page.locator('#name-page').waitFor();
  check(tag+' all nine chapters still lead to name entry',await page.locator('#player-name').isVisible());
  await page.locator('#story-return').click();
  await page.evaluate(async save=>{document.querySelector('.scene').classList.add('is-game-active','is-story-active');document.querySelector('#title-screen').hidden=true;document.querySelector('#story-screen').hidden=true;await guildGame.start(save.name,()=>{},save);guildGame.unlock()},fixture);
  await page.keyboard.press('e');await page.waitForFunction(()=>!document.querySelector('#game-dialogue').hidden);
  for(const expression of ['neutral','playful','explaining','laughing','annoyed','calm']){
   await page.evaluate(expression=>window.__paintMuirshuForRegression(expression),expression);
   const parts=await page.locator('#dialogue-portrait').evaluate(canvas=>{
    const w=canvas.width,h=canvas.height,data=canvas.getContext('2d').getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),areas=[];let clipped=false;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const key=y*w+x;if(seen[key]||data[key*4+3]<96)continue;if(x===0||x===w-1||y===0)clipped=true;
     let count=0;const queue=[key];seen[key]=1;
     while(queue.length){const at=queue.pop(),xx=at%w,yy=Math.floor(at/w);count++;
      for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){const nx=xx+dx,ny=yy+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;const next=ny*w+nx;if(!seen[next]&&data[next*4+3]>=96){seen[next]=1;queue.push(next)}}
     }areas.push(count);
    }
    const portrait=document.querySelector('#dialogue-portrait-frame').getBoundingClientRect(),dialogue=document.querySelector('#game-dialogue').getBoundingClientRect();
    return {areas:areas.sort((a,b)=>b-a),clipped,fits:portrait.top>=0&&portrait.bottom<=dialogue.top+1};
   });
   check(tag+' Muirshu '+expression+' has no detached neighboring wing '+JSON.stringify(parts),parts.areas[0]>20000&&(parts.areas[1]||0)<=4&&!parts.clipped&&parts.fits);
   if(expression==='calm')await page.screenshot({path:path.join(out,tag+'-muirshu-calm.png')});
  }
  await context.close();
 }
 check('no opening art or Muirshu browser errors',report.errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'opening-art-report.json'),JSON.stringify(report,null,2))}
})().catch(error=>{console.error(error);process.exitCode=1});
