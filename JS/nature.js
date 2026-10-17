// Flowing water and wind sampled from the painting. Masks are prepared once,
// never read back during animation, and leave architecture and paths untouched.
const livingNature = (() => {
  const profiles = {
    city: { water: [[.45,.42,.55,.56]], flow:[3,1], fountain:true, leaves: [[0,0,.09,1],[.9,0,1,1],[.12,0,.24,.18],[.62,0,.7,.14]] },
    cliff: { water: [[0,.58,1,.86]], flow:[-24,3], leaves: [[0,.87,1,1],[0,.1,.12,.51],[.91,.08,1,.55]] },
    grove: { waterOnly:true, water: [[.23,.02,.49,.99],[.04,.43,.19,.6]], flow:[-1,22], falls: [[.28,.15,.05,.11],[.295,.51,.07,.075],[.285,.73,.065,.09]] },
    checkpoint: { water: [[.02,.13,.17,1]], flow:[0,25], falls: [[.055,.19,.052,.1],[.06,.39,.045,.11],[.09,.66,.06,.12]], leaves: [[.28,0,.61,.22],[.85,0,1,1],[.02,0,.16,.12]] },
    gate: { waterOnly:true, water: [[0,.45,.25,1],[.8,.44,1,.86]], flow:[-2,18], falls: [[.0556,.469,.025,.073],[.894,.517,.024,.065],[.84,.765,.025,.048]] },
    journeyKingdom: { water: [[.25,.51,.8,.98]], flow:[8,1], falls: [[.1,.286,.018,.3],[.228,.425,.012,.225],[.296,.547,.015,.18]], leaves: [[.02,.77,.22,1],[.83,.62,1,1]] },
    journeyGorge: { water: [[.14,.59,.98,.98]], flow:[0,20], falls: [[.12,.045,.065,.55],[.357,.34,.023,.22],[.855,.265,.023,.21]], leaves: [[0,.15,.09,.93],[.91,.41,1,1]] },
    journeyRoad: { water: [[.01,.33,.62,.69]], flow:[8,0], falls: [[.081,.59,.014,.23],[.18,.63,.018,.21],[.261,.67,.014,.22]], leaves: [[0,.74,.31,1],[.94,.05,1,.91],[.57,.65,.65,.93]] },
    sanctuary: { waterOnly:true, water: [[0,.67,.3,1],[.76,.72,1,1],[.3,.94,.76,1]], flow:[-9,3], falls: [[.084,.455,.05,.13],[.89,.46,.05,.15],[.155,.84,.06,.035],[.416,.867,.05,.047],[.73,.85,.06,.047]] },
    overlook: { leaves: [[.02,.12,.19,.64],[.78,.08,1,.23],[.52,.64,.72,.92]] },
    eventDeparture: { leaves: [[0,0,.33,.82],[.54,.43,1,.88]] },
    eventCredentials: { leaves: [[0,0,.23,.65],[.79,0,1,.72],[.27,0,.72,.18]], motes: true },
  };
  // Calm scenes use the actual channels, rather than broad blue/green regions.
  // In particular, turquoise leaves and distant sky are never treated as water.
  // Coordinates are relative to a 720 × 480 view of each painting.
  const waterShapes = {
    grove: [
      [[175,70],[218,74],[230,121],[270,139],[296,163],[285,173],[216,172],[185,141],[170,111]],
      [[213,216],[262,216],[269,238],[273,264],[277,294],[261,320],[257,343],[273,364],[264,390],[277,411],[265,442],[263,480],[182,480],[175,451],[174,426],[180,402],[193,379],[195,353],[189,330],[200,305],[202,279],[204,259],[210,242]],
      [[40,230],[59,230],[65,252],[92,262],[87,281],[35,279],[23,262],[39,251]],
    ],
    gate: [
      [[42,222],[57,222],[56,250],[77,269],[86,291],[102,312],[101,331],[126,352],[128,383],[147,408],[151,429],[174,459],[172,480],[125,480],[123,450],[102,429],[98,405],[79,386],[74,359],[65,340],[49,329],[44,306],[23,286],[22,258],[38,249]],
      [[647,218],[682,218],[680,248],[665,275],[649,310],[649,325],[625,356],[627,374],[608,395],[590,399],[587,377],[599,354],[609,330],[602,312],[623,295],[620,275],[633,251],[640,241]],
    ],
    sanctuary: [[[0,480],[0,474],[92,474],[158,451],[277,451],[389,452],[520,451],[616,459],[720,475],[720,480]]],
  };
  function inWaterShape(key, x, y) {
    return (waterShapes[key]||[]).some(points=>{
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++) {
        const [xi,yi]=points[i],[xj,yj]=points[j];
        if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
      }
      return inside;
    });
  }
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
      const blue=b>r*1.07 && g>r*1.1 && b>70 && (!config.waterOnly || b>g*.96);
      const falling=inside(nx,ny,fallRegions);
      if(a && ((blue && inside(nx,ny,config.water)) || (falling && b>r*.97 && g>r*.99 && b>140)) &&
        (!config.waterOnly || falling || inWaterShape(key,nx*720,ny*480))) {
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
    const count=Math.min(config.fountain?28:90,points.length);
    const result={config,width,height,sourceW,sourceH,water:layer(water),leaves,
      flow:layer(c.createImageData(width,height)),fx:layer(c.createImageData(width,height)),frame:null,
      points:Array.from({length:count},(_,i)=>points[Math.floor(i*points.length/count)])};
    entries.set(key,result);return result;
  }
  function draw(target,image,key,seconds,moving=true) {
    if(!moving || reduced.matches || document.body.classList.contains('no-motion') || !profiles[key]) return;
    const scene=prepare(image,key),{width:w,height:h,config}=scene,t=Math.floor(seconds*24)/24;
    if(scene.frame===t) {target.drawImage(scene.fx,0,0,scene.sourceW,scene.sourceH);return;}
    scene.frame=t;
    const c=scene.fx.getContext('2d');c.clearRect(0,0,w,h);c.save();c.imageSmoothingEnabled=false;
    // Advect two overlapping texture phases in one direction. Each phase fades
    // out before wrapping, so the current keeps flowing without a visible reset.
    const water=scene.flow.getContext('2d');water.clearRect(0,0,w,h);water.save();water.imageSmoothingEnabled=false;
    if(config.water) {
      const [vx,vy]=config.flow||[6,1],cycle=1.8;
      water.globalCompositeOperation='lighter';
      for(let phase=0;phase<2;phase++) {
        const age=(t/cycle+phase*.5)%1,dy=Math.round((age-.5)*vy*cycle);
        water.globalAlpha=Math.sin(age*Math.PI)**2*.86;
        for(let y=0;y<h;y+=4) {
          const wave=Math.sin(t*2.2+y*.11)*(config.waterOnly?1:config.fountain?2:4),
            dx=Math.round((age-.5)*vx*cycle+wave);
          water.drawImage(scene.water,0,y-dy,w,Math.min(4,h-y),dx,y,w,Math.min(4,h-y));
        }
      }
      water.globalCompositeOperation='source-over';
      scene.points.forEach(([x,y],i)=>{
        const age=(t/(1.6+i%3*.3)+i*.173)%1,crest=Math.sin(age*Math.PI),
          px=Math.round(x+(age-.5)*vx*2+Math.sin(t*2+i)*3),py=Math.round(y+(age-.5)*vy*2),length=4+i%4*2;
        water.globalAlpha=crest*(.35+i%3*.12);water.fillStyle=i%3?'#d7f8ff':'#8ad7e8';
        water.fillRect(px,py,length,i%5===0?2:1);
        water.fillRect(px+length-2,py-1,3,1);
      });
      if(config.fountain)for(let i=0;i<3;i++) {
        const age=(t*.6+i/3)%1,r=5+age*29;
        water.globalAlpha=Math.sin(age*Math.PI)*.68;water.strokeStyle='#dcffff';water.lineWidth=1;
        water.beginPath();water.ellipse(w*.5,h*.5,r,r*.32,0,0,Math.PI*2);water.stroke();
      }
    }
    for(const [index,fall] of (config.falls||[]).entries()) {
      const [x,y,width,height]=fall.map((v,i)=>v*(i%2?h:w));
      water.save();water.beginPath();water.rect(x,y,width,height);water.clip();water.globalAlpha=.64;
      water.drawImage(scene.water,Math.round(Math.sin(t*2+index)*2),Math.round((t*85+index*7)%18));
      water.fillStyle='#edffff';
      for(let i=0;i<12;i++)water.fillRect(Math.round(x+(i*7.3)%width),Math.round(y+(t*85+i*11)%(height+20)-20),i%3===0?2:1,6+i%3*5);
      water.restore();
      if(!config.waterOnly){
        c.save();c.globalAlpha*=.18;c.fillStyle='#e3fcff';
        for(let i=0;i<4;i++)c.fillRect(Math.round(x+width*.5+Math.sin(t*.9+i*2)*width*.6-7),Math.round(y+height-2+Math.sin(t*1.2+i)*3),13+i*3,3);
        c.restore();
      }
    }
    // A stationary destination mask confines even the stronger current/foam
    // to painted water; the bank, bridge and nearby buildings cannot drift.
    water.globalCompositeOperation='destination-in';water.globalAlpha=1;water.drawImage(scene.water,0,0);water.restore();
    c.drawImage(scene.flow,0,0);
    scene.leaves.forEach((patch,i)=>{
      // A gust travels through the crown in strips; trunks never move.
      c.save();c.globalAlpha*=.86;
      for(let y=0;y<patch.h;y+=12) {
        const gust=3.6+1.6*(.5+.5*Math.sin(t*.7+i)),
          dx=Math.round(Math.sin(t*1.5+i*1.8-y*.018)*gust),dy=Math.round(Math.sin(t*1.15+i+y*.01)*1.6);
        c.drawImage(patch.image,0,y,patch.w,Math.min(12,patch.h-y),patch.x+dx,patch.y+y+dy,patch.w,Math.min(12,patch.h-y));
      }
      c.restore();
    });
    // Occasional tiny leaves follow a downward arc near the outer canopy only.
    scene.leaves.slice(0,2).forEach((patch,index)=>{for(let i=0;i<2;i++){
      const age=(t*.1+index*.47+i*.43)%1;
      c.save();c.globalAlpha*=Math.sin(age*Math.PI)*.7;c.fillStyle=i%2?'#a3b45a':'#bdcb75';
      c.fillRect(Math.round(patch.x+patch.w*(.3+i*.35)+Math.sin(age*6+index)*12+age*22),Math.round(patch.y+patch.h*.3+age*Math.min(100,patch.h*.5)),Math.sin(t*3+i)>0?3:1,2);c.restore();
    }});
    if(config.motes)for(let i=0;i<7;i++) {
      c.save();c.globalAlpha*=(.15+.12*Math.sin(t+i))*Math.sin(((t*.025+i*.143)%1)*Math.PI);
      c.fillStyle='#edf8b1';c.fillRect(Math.round(w*(.1+i*.13)+Math.sin(t*.5+i)*5),Math.round(h*(.3+i%3*.18)-((t*2+i*5)%22)),1,1);c.restore();
    }
    c.restore();
    target.drawImage(scene.fx,0,0,scene.sourceW,scene.sourceH);
  }
  return {prepare,draw};
})();
