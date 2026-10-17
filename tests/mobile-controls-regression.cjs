// Exercise the visible scroll cue, enlarged dialogue and battle touch controls.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.TEST_OUTPUT || path.join(__dirname, '../../previews/mobile-controls');
fs.mkdirSync(out, {recursive:true});
const fixture = (patch={}) => ({version:1,savedAt:Date.now(),name:'여행자',resume:'world',location:'guild',storyStep:'lucy',questAccepted:false,hp:24,coins:18,shopOrigin:'city',player:{x:360,y:188,dir:'up'},npcs:[{id:'lucy',x:360,y:100,dir:'down',talkCount:0}],inventory:[{id:'credentials',name:'모험가증',description:'등록증',count:1},{id:'bread',name:'마른 빵',description:'끼니',count:2}],visited:['guild'],shopStocks:{city:{bread:6,tonic:3,bandage:4}},fieldFlags:{lucyFarewell:false,leafTaken:false,springUsed:false,libraryReached:false,libraryLetterRead:false,libraryAmbushCleared:false},...patch});
(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  const report = {url:process.env.TEST_URL || 'http://127.0.0.1:8765/dist-cloudflare/',checks:[],errors:[]};
  const check = (name, ok) => { assert.ok(ok, name); report.checks.push(name); console.log('PASS '+name); };
  try {
    for (const [width,height] of [[320,568],[390,844],[667,375],[844,390],[1280,800]]) {
      const tag = width+'x'+height, mobile = width!==1280;
      const ctx = await browser.newContext({viewport:{width,height},hasTouch:mobile,reducedMotion:'reduce'});
      const p = await ctx.newPage();
      p.on('pageerror', e => report.errors.push(tag+': '+e.message));
      await p.goto(report.url); await p.evaluate(() => guildGame.ready);
      const state = () => p.evaluate(() => guildGame.getState());
      const start = async save => {
        await p.evaluate(async save => {
          document.querySelector('.scene').classList.add('is-game-active','is-story-active');
          document.querySelector('#title-screen').hidden=true; document.querySelector('#story-screen').hidden=true;
          await guildGame.start(save.name,()=>{},save); guildGame.unlock();
        }, save);
        await p.waitForTimeout(80);
      };
      const cue = p.locator('#game-dialogue-scroll');
      await start(fixture());
      const menu = p.locator('#guild-menu-open');
      if(mobile) {
        const r = await menu.boundingBox();
        check(tag+' menu has a 44px touch target',r.width>=76&&r.height>=44);
        check(tag+' menu has a visible glowing stroke',await menu.evaluate(e=>getComputedStyle(e,'::after').borderTopStyle==='solid'));
        await menu.tap(); check(tag+' menu opens inventory by touch',await p.locator('#guild-item-list').isVisible());
        await p.locator('#guild-menu-close').tap();
      }
      await p.keyboard.press('e'); await p.locator('#game-choices').waitFor();
      const remaining = () => p.locator('#game-choices').evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop>2);
      check(tag+' scroll cue matches remaining choices',(await cue.isVisible())===(mobile&&await remaining()));
      if(mobile && await remaining()) {
        await p.screenshot({path:path.join(out,tag+'-chat-cue.png')});
        const count = await p.locator('#game-choices button').count(), line = (await state()).line;
        await cue.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
        check(tag+' keyboard cue scrolls without choosing',(await state()).line===line&&await p.locator('#game-choices button').count()===count);
        for(let i=0;i<10&&await cue.isVisible();i++) { await cue.tap(); await p.waitForTimeout(40); }
        check(tag+' cue disappears at the end',!await remaining()&&!await cue.isVisible());
        await p.locator('#game-choices').evaluate(e=>e.scrollTop=0); await p.waitForTimeout(60);
        check(tag+' cue returns when scrolled up',await cue.isVisible());
      }
      await p.locator('#game-choices button').filter({hasText:'다른 의뢰'}).click();
      let foundLongReply = false;
      for(let i=0;i<6;i++) {
        const textOverflow = await p.locator('#game-dialogue-text').evaluate(e=>e.scrollHeight-e.clientHeight>2);
        if(mobile&&textOverflow) {
          foundLongReply=true;
          check(tag+' long reply has scroll cue',await cue.isVisible());
          const text = await p.locator('#game-dialogue-glyphs').innerText(), line = (await state()).line;
          for(let j=0;j<10&&await cue.isVisible();j++){await cue.tap();await p.waitForTimeout(40);}
          check(tag+' long reply can be read without advancing',!await cue.isVisible()&&(await state()).line===line&&await p.locator('#game-dialogue-glyphs').innerText()===text);
        }
        await p.keyboard.press('e'); await p.waitForTimeout(40);
      }
      if(width===320) check(tag+' tested an actual overflowing reply',foundLongReply);
      await start(fixture({location:'carriage',storyStep:'carriage',questAccepted:true,player:{x:250,y:326,dir:'right'},npcs:[{id:'rogue',x:466,y:326,dir:'left',talkCount:0}]}));
      await p.keyboard.press('e'); await p.waitForTimeout(100);
      const emotional = await p.locator('#game-dialogue-text').evaluate(e=>{
        const s=getComputedStyle(e),r=e.getBoundingClientRect();
        return {emotion:e.dataset.emotion,size:parseFloat(s.fontSize),base:parseFloat(s.getPropertyValue('--dialogue-font-size')),fits:e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1,top:r.top,bottom:r.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,maxHeight:s.maxHeight,rootClass:document.querySelector('#game-screen').className};
      });
      check(tag+' emotional text stays enlarged',emotional.emotion==='shout'&&emotional.size>emotional.base);
      if(mobile) await p.screenshot({path:path.join(out,tag+'-emotional-dialogue.png')});
      check(tag+' emotional text fits without clipping '+JSON.stringify(emotional),emotional.fits&&emotional.top>=0&&emotional.bottom<=height);
      if(!mobile){check(tag+' desktop has no mobile cue',!await cue.isVisible());await ctx.close();continue;}

      const battleSave = hp => fixture({location:'grove',storyStep:'arrived',questAccepted:true,hp,player:{x:529,y:213,dir:'up'},npcs:[]});
      const enterBattle = async hp => {
        await start(battleSave(hp)); await p.keyboard.press('e');
        await p.waitForFunction(()=>guildGame.getState().battle?.stage==='command');
        check(tag+' battle stick hidden while choosing',!await p.locator('#battle-joystick').isVisible());
        await p.locator('[data-battle-command="attack"]').tap();
        await p.waitForFunction(()=>guildGame.getState().battle?.stage==='dodge');
      };
      await enterBattle(24);
      const pad = p.locator('#battle-joystick'), r=await pad.boundingBox();
      const healthClear = async () => {
        const a=await pad.boundingBox(),b=await p.locator('.battle-bottom').boundingBox();
        return a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y;
      };
      check(tag+' battle joystick visible and within viewport',r&&r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height);
      check(tag+' battle health and joystick do not overlap',await healthClear());
      check(tag+' battle joystick can receive touches',await pad.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
      const session = await ctx.newCDPSession(p), centre={x:r.x+r.width/2,y:r.y+r.height/2,id:1};
      const touch = (type,points) => session.send('Input.dispatchTouchEvent',{type,touchPoints:points});
      const hold = async (dx,dy) => {
        const before=(await state()).battle.soul;
        await touch('touchStart',[centre]);await touch('touchMove',[{...centre,x:centre.x+dx,y:centre.y+dy}]);await p.waitForTimeout(140);
        const after=(await state()).battle.soul;await touch('touchEnd',[]);
        return {x:after.x-before.x,y:after.y-before.y};
      };
      const dead=await hold(2,1);check(tag+' battle stick dead zone',Math.hypot(dead.x,dead.y)<.1);
      const slow=await hold(11,0),full=await hold(34,0);
      check(tag+' battle tilt controls speed',full.x>slow.x*2&&slow.x>1);
      const angle=await hold(27,-9);
      check(tag+' battle supports continuous angles',angle.x>2&&angle.y<0&&Math.abs(angle.x/angle.y+3)<.25);
      const stopped=(await state()).battle.soul;await p.waitForTimeout(100);
      check(tag+' releasing battle stick stops movement',Math.hypot((await state()).battle.soul.x-stopped.x,(await state()).battle.soul.y-stopped.y)<.1);
      await touch('touchStart',[centre]);await touch('touchMove',[{...centre,x:centre.x+20}]);await touch('touchCancel',[]);
      check(tag+' battle cancellation recentres',!await pad.evaluate(e=>e.classList.contains('is-held')));
      await touch('touchStart',[centre]);await touch('touchMove',[{...centre,x:centre.x+20}]);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
      check(tag+' battle blur clears input',!await pad.evaluate(e=>e.classList.contains('is-held')));await touch('touchEnd',[]);
      check(tag+' battle long press cannot select text',await pad.evaluate(e=>getComputedStyle(e).userSelect==='none'&&!e.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))));
      await p.screenshot({path:path.join(out,tag+'-battle-joystick.png')});
      if(width===320||width===667){
        await enterBattle(1);
        await p.waitForFunction(()=>guildGame.getState().battle?.stage==='desperation',{},{timeout:30000});
        check(tag+' joystick remains during final resistance',await pad.isVisible());
        check(tag+' final health and joystick do not overlap',await healthClear());
        await p.screenshot({path:path.join(out,tag+'-final-resistance.png')});
        const b=(await state()).battle.soul;await hold(-22,0);
        check(tag+' final resistance is controllable',(await state()).battle.soul.x<b.x-2);
      }
      await start(fixture());check(tag+' leaving battle clears joystick',!await pad.evaluate(e=>e.classList.contains('is-held')));
      await ctx.close();
    }
    check('no browser errors',report.errors.length===0);
  } finally {await browser.close();fs.writeFileSync(path.join(out,'mobile-controls-report.json'),JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
