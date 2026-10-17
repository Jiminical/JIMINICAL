// Strong currents must remain on the painted water, including in reduced motion.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||path.join(__dirname,'../../previews/nature-boundaries');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),checks=[],errors=[];
 const check=(label,ok)=>{assert.ok(ok,label);checks.push(label);console.log('PASS '+label)};
 try{const p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'no-preference'});p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/dist-cloudflare/');await p.evaluate(()=>guildGame.ready);
  const water=await p.evaluate(async()=>{document.body.classList.remove('no-motion');const attrs=document.querySelector('#guild-assets').dataset,results=[];
   for(const key of ['city','cliff','grove','checkpoint','gate','journeyRoad','sanctuary']){const image=new Image();image.src=attrs[key+'Src'];await image.decode();const scene=livingNature.prepare(image,key),canvas=document.createElement('canvas');canvas.width=scene.sourceW;canvas.height=scene.sourceH;
    const mask=scene.water.getContext('2d').getImageData(0,0,scene.width,scene.height).data;let outside=0,active=0;
    for(const t of [.15,.9,1.79,1.81,2.7]){livingNature.draw(canvas.getContext('2d'),image,key,t,true);const pixels=scene.flow.getContext('2d').getImageData(0,0,scene.width,scene.height).data;
     for(let i=3;i<pixels.length;i+=4)if(pixels[i]){active++;if(!mask[i])outside++}}
    results.push({key,outside,active});
   }return results;
  });for(const r of water){check(r.key+' visible current exists',r.active>100);check(r.key+' current and foam stay inside water',r.outside===0)}
  const guide=await p.evaluate(async()=>{const image=new Image();image.src=document.querySelector('#guild-assets').dataset.guideForestSrc;await image.decode();window.__guideTestImage=image;const canvas=document.createElement('canvas');canvas.width=720;canvas.height=480;window.__guideTestCanvas=canvas;return true});check('guide test image is ready',guide);
  const render=async mode=>p.evaluate(mode=>{const c=window.__guideTestCanvas.getContext('2d');document.body.classList.toggle('no-motion',mode==='setting');const a=scenicLandscape.draw(c,window.__guideTestImage,2,true),before=window.__guideTestCanvas.toDataURL(),b=scenicLandscape.draw(c,window.__guideTestImage,4,true);return{still:before===window.__guideTestCanvas.toDataURL(),a,b}},mode);
  check('guide waterfall visibly flows',(await render('normal')).a.flow>0);
  const off=await render('setting');check('in-scene setting stops guide water and trees',off.still&&off.a.flow===0&&off.b.flow===0&&off.a.pan===off.b.pan);
  await p.evaluate(()=>document.body.classList.remove('no-motion'));await p.emulateMedia({reducedMotion:'reduce'});
  const reduced=await render('system');check('system preference stops guide water and trees',reduced.still&&reduced.a.flow===0&&reduced.b.flow===0);
  check('no nature boundary browser errors',errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'nature-boundaries-report.json'),JSON.stringify({checks,errors},null,2))}
})().catch(e=>{console.error(e);process.exitCode=1});
