// Small movements sampled from the painting itself. Masks are prepared once,
// never read back during animation, and leave architecture and paths untouched.
const livingNature = (() => {
  const profiles = {
    city: { water: [[.45,.42,.55,.56]], leaves: [[0,0,.09,1],[.9,0,1,1],[.12,0,.24,.18],[.62,0,.7,.14]] },
    cliff: { water: [[0,.58,1,.86]], current: 1, leaves: [[0,.87,1,1],[0,.1,.12,.51],[.91,.08,1,.55]] },
    grove: { water: [[.23,.02,.49,.99],[.04,.43,.19,.6]], falls: [[.28,.15,.05,.11],[.295,.51,.07,.075],[.285,.73,.065,.09]], leaves: [[0,0,.2,1],[.86,0,1,1],[.48,0,.86,.19]] },
    checkpoint: { water: [[.02,.13,.17,1]], falls: [[.055,.19,.052,.1],[.06,.39,.045,.11],[.09,.66,.06,.12]], leaves: [[.28,0,.61,.22],[.85,0,1,1],[.02,0,.16,.12]] },
    gate: { water: [[0,.21,.2,1],[.81,.3,1,1]], falls: [[.073,.39,.045,.09],[.875,.52,.05,.11]], leaves: [[0,0,.18,.44],[.83,0,1,.54],[.35,0,.66,.12]] },
    journeyKingdom: { water: [[.25,.51,.8,.98]], falls: [[.1,.286,.018,.3],[.228,.425,.012,.225],[.296,.547,.015,.18]], leaves: [[.02,.77,.22,1],[.83,.62,1,1]], sky: true },
    journeyGorge: { water: [[.14,.59,.98,.98]], falls: [[.12,.045,.065,.55],[.357,.34,.023,.22],[.855,.265,.023,.21]], leaves: [[0,.15,.09,.93],[.91,.41,1,1]], sky: true },
    journeyRoad: { water: [[.01,.33,.62,.69]], falls: [[.081,.59,.014,.23],[.18,.63,.018,.21],[.261,.67,.014,.22]], leaves: [[0,.74,.31,1],[.94,.05,1,.91],[.57,.65,.65,.93]], sky: true },
    sanctuary: { water: [[0,.67,.3,1],[.76,.72,1,1],[.3,.94,.76,1]], falls: [[.084,.455,.05,.13],[.89,.46,.05,.15],[.155,.84,.06,.035],[.416,.867,.05,.047],[.73,.85,.06,.047]], leaves: [[0,0,.25,.4],[.76,.02,1,.39],[.29,.02,.7,.15]], motes: true },
    overlook: { leaves: [[.02,.12,.19,.64],[.78,.08,1,.23],[.52,.64,.72,.92]] },
    eventDeparture: { leaves: [[0,0,.33,.82],[.54,.43,1,.88]] },
    eventCredentials: { leaves: [[0,0,.23,.65],[.79,0,1,.72],[.27,0,.72,.18]], motes: true },
  };
  const cache = new WeakMap();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const inside = (x,y,regions=[]) => regions.some(([l,t,r,b]) => x>=l && x<=r && y>=t && y<=b);
  function prepare(image, key) {
    const config = profiles[key];
    if (!config) return null;
    let entries = cache.get(image);
    if (!entries) cache.set(image, entries = new Map());
    if (entries.has(key)) return entries.get(key);
    const width = 720, sourceW = image.naturalWidth || image.width,
      sourceH = image.naturalHeight || image.height, height = Math.round(width*sourceH/sourceW);
    const sample = document.createElement('canvas'); sample.width=width; sample.height=height;
    const c=sample.getContext('2d',{willReadFrequently:true}); c.imageSmoothingEnabled=false;
    c.drawImage(image,0,0,width,height);
    const original=c.getImageData(0,0,width,height), water=c.createImageData(width,height),
      leafPixels=(config.leaves||[]).map(()=>c.createImageData(width,height)), points=[],
      fallRegions=(config.falls||[]).map(([l,t,w,h])=>[l,t,l+w,t+h]);
    for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const i=(y*width+x)*4, r=original.data[i],g=original.data[i+1],b=original.data[i+2],a=original.data[i+3],nx=x/width,ny=y/height;
      const blue=b>r*1.07 && g>r*1.1 && b>70;
      const falling=inside(nx,ny,fallRegions);
      if(a && ((blue && inside(nx,ny,config.water)) || (falling && b>r*.97 && g>r*.99 && b>140))) {
        water.data.set(original.data.subarray(i,i+4),i);
        if(x%9===0 && y%9===0 && blue) points.push([x,y]);
      }
      if(a && g>r*1.08 && g>b*1.12 && g>55)
        (config.leaves||[]).forEach((region,index)=>{
          if(inside(nx,ny,[region])) leafPixels[index].data.set(original.data.subarray(i,i+4),i);
        });
    }
    const layer = pixels => {const out=document.createElement('canvas');out.width=width;out.height=height;out.getContext('2d').putImageData(pixels,0,0);return out;};
    const leaves=leafPixels.map((pixels,i)=>{
      const [l,t,r,b]=config.leaves[i],x=Math.floor(l*width),y=Math.floor(t*height),
        w=Math.ceil(r*width)-x,h=Math.ceil(b*height)-y,full=layer(pixels),part=document.createElement('canvas');
      part.width=w;part.height=h;part.getContext('2d').drawImage(full,x,y,w,h,0,0,w,h);
      return {image:part,x,y,w,h};
    });
    const result={config,width,height,sourceW,sourceH,water:layer(water),leaves,fx:layer(c.createImageData(width,height)),frame:null,
      points:Array.from({length:Math.min(28,points.length)},(_,i)=>points[Math.floor(i*points.length/Math.min(28,points.length))])};
    entries.set(key,result);return result;
  }
  function draw(target,image,key,seconds,moving=true) {
    if(!moving || reduced.matches || document.body.classList.contains('no-motion') || !profiles[key]) return;
    const scene=prepare(image,key),{width:w,height:h,config}=scene,t=Math.floor(seconds*18)/18;
    if(scene.frame===t) {target.drawImage(scene.fx,0,0,scene.sourceW,scene.sourceH);return;}
    scene.frame=t;
    const c=scene.fx.getContext('2d');c.clearRect(0,0,w,h);c.save();c.imageSmoothingEnabled=false;
    // Thin rows drift at different rates, creating ripples without moving banks.
    if(config.water) {
      c.save();c.globalAlpha*=.3;
      for(let y=0;y<h;y+=4) {
        const dx=Math.round(Math.sin(t*1.15+y*.09)*1.4+(config.current?Math.sin(t*.6)*1.2:0));
        c.drawImage(scene.water,0,y,w,Math.min(4,h-y),dx,y,w,Math.min(4,h-y));
      }
      c.restore();
      scene.points.forEach(([x,y],i)=>{
        const glow=(Math.sin(t*1.7+i*2.3)+1)/2;
        c.save();c.globalAlpha*=.08+glow*.24;c.fillStyle='#d9faff';
        c.fillRect(x+Math.round(Math.sin(t*.9+i)*2),y,2+Math.round(glow*3),1);c.restore();
      });
    }
    for(const [index,fall] of (config.falls||[]).entries()) {
      const [x,y,width,height]=fall.map((v,i)=>v*(i%2?h:w));
      c.save();c.beginPath();c.rect(x,y,width,height);c.clip();c.globalAlpha*=.2;
      c.drawImage(scene.water,0,Math.round((t*36+index*7)%12));
      c.fillStyle='#eaffff';
      for(let i=0;i<7;i++)c.fillRect(Math.round(x+(i*7.3)%width),Math.round(y+(t*40+i*11)%(height+12)-12),1,3+i%3*3);
      c.restore();
      c.save();c.globalAlpha*=.08;c.fillStyle='#e3fcff';
      for(let i=0;i<3;i++)c.fillRect(Math.round(x+width*.5+Math.sin(t*.65+i*2)*width*.5-5),Math.round(y+height-2+Math.sin(t*.8+i)*2),9+i*2,2);
      c.restore();
    }
    scene.leaves.forEach((patch,i)=>{
      // A gust travels through the crown in strips; trunks never move.
      c.save();c.globalAlpha*=.42;
      for(let y=0;y<patch.h;y+=12) {
        const dx=Math.round(Math.sin(t*1.25+i*1.8-y*.018)*1.25),dy=Math.round(Math.sin(t*.85+i)*.55);
        c.drawImage(patch.image,0,y,patch.w,Math.min(12,patch.h-y),patch.x+dx,patch.y+y+dy,patch.w,Math.min(12,patch.h-y));
      }
      c.restore();
    });
    // Occasional tiny leaves follow a downward arc near the outer canopy only.
    scene.leaves.slice(0,2).forEach((patch,i)=>{
      const age=(t*.055+i*.47)%1;
      c.save();c.globalAlpha*=Math.sin(age*Math.PI)*.5;c.fillStyle=i%2?'#a3b45a':'#bdcb75';
      c.fillRect(Math.round(patch.x+patch.w*.5+Math.sin(age*5+i)*8+age*10),Math.round(patch.y+patch.h*.3+age*Math.min(70,patch.h*.5)),Math.sin(t*2+i)>0?2:1,1);c.restore();
    });
    if(config.motes)for(let i=0;i<7;i++) {
      c.save();c.globalAlpha*=(.15+.12*Math.sin(t+i))*Math.sin(((t*.025+i*.143)%1)*Math.PI);
      c.fillStyle='#edf8b1';c.fillRect(Math.round(w*(.1+i*.13)+Math.sin(t*.5+i)*5),Math.round(h*(.3+i%3*.18)-((t*2+i*5)%22)),1,1);c.restore();
    }
    c.restore();
    target.drawImage(scene.fx,0,0,scene.sourceW,scene.sourceH);
  }
  return {prepare,draw};
})();
