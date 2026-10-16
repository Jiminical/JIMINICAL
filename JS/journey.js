// Three continuous camera passages over Zerdia, drawn on the game's pixel grid.
const journeyCinematic = (() => {
  const duration = 24;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const route = [[.76,1.015,1.55],[.82,.93,1.17],[.885,.85,.88],[.907,.795,.7],
    [.88,.75,.57],[.852,.711,.49],[.888,.67,.38],[.866,.641,.31],
    [.825,.615,.25],[.85,.585,.19],[.826,.56,.13]];
  let artwork = null, water = null, flow = null, coach = null;
  function prepare(image, carriageImage) {
    if (artwork === image) return;
    artwork = image;
    const w = image.naturalWidth, h = image.naturalHeight;
    water = document.createElement("canvas"); water.width = w; water.height = h;
    const c = water.getContext("2d", { willReadFrequently: true });
    c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, w, h);
    const data = pixels.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, r = data[i], g = data[i+1], b = data[i+2];
      if (!(y > h * .51 && x > w * .25 && x < w * .80 && b > r * 1.15 && g > r * 1.23 && b > 70))
        pixels.data[i + 3] = 0;
    }
    c.putImageData(pixels, 0, 0);
    flow = document.createElement("canvas"); flow.width = w; flow.height = h;
    const sprite = document.createElement("canvas");
    sprite.width = carriageImage.naturalWidth; sprite.height = carriageImage.naturalHeight;
    const p = sprite.getContext("2d", { willReadFrequently:true });
    p.drawImage(carriageImage,0,0);
    const alpha = p.getImageData(0,0,sprite.width,sprite.height).data;
    let left=sprite.width,top=sprite.height,right=0,bottom=0;
    for(let y=0;y<sprite.height;y++)for(let x=0;x<sprite.width;x++)if(alpha[(y*sprite.width+x)*4+3]>100){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    coach = document.createElement("canvas"); coach.width=80; coach.height=Math.round(80*(bottom-top+1)/(right-left+1));
    const painter=coach.getContext("2d");painter.imageSmoothingEnabled=false;
    painter.drawImage(carriageImage,left,top,right-left+1,bottom-top+1,0,0,coach.width,coach.height);
  }
  function waterFlow(seconds) {
    const c = flow.getContext("2d"), w = flow.width, h = flow.height;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    c.drawImage(water, -((seconds * 9) % 18), 0);
    c.globalCompositeOperation = "destination-in";
    c.drawImage(water, 0, 0);
    c.globalCompositeOperation = "source-over";
  }
  function fallingWater(c, seconds, w, h) {
    const alpha = c.globalAlpha;
    for (const [x,y,width,height] of [[.1,.286,.018,.30],[.228,.425,.012,.225],[.296,.547,.015,.18],[.38,.427,.009,.13]]) {
      c.save(); c.beginPath(); c.rect(x*w,y*h,width*w,height*h); c.clip();
      for (let i = 0; i < 12; i++) {
        c.globalAlpha = alpha * (.12 + i % 3 * .035);
        c.fillStyle = i % 2 ? "#ecffff" : "#b9e2ed";
        c.fillRect(Math.round(x*w+(i*7)%(width*w)), Math.round(y*h+((seconds*75+i*29)%(height*h+32))-32), 1+i%2, 13+i%5*4);
      }
      c.restore();
    }
  }
  function birds(c, seconds, w, h) {
    for (let i = 0; i < 8; i++) {
      const x = w * (.29 + i * .018) + seconds * w * .0045,
        y = h * (.31 + i % 3 * .015) + Math.sin(seconds * .8 + i) * 3,
        flap = Math.floor(seconds * 5 + i) % 3;
      c.fillStyle = "#e5eeef";
      c.fillRect(Math.round(x), Math.round(y), 2, 1);
      c.fillRect(Math.round(x-3), Math.round(y+(flap===0?-2:0)), 3, 1);
      c.fillRect(Math.round(x+2), Math.round(y+(flap===0?-2:0)), 3, 1);
    }
  }
  function carriage(c, progress, seconds, w, h) {
    const step = clamp(progress) * (route.length - 1), index = Math.min(route.length - 2, Math.floor(step)),
      t = step - index, a = route[index], b = route[index + 1],
      prev = route[Math.max(0,index-1)], next = route[Math.min(route.length-1,index+2)],
      curve = axis => .5*((2*a[axis])+(-prev[axis]+b[axis])*t+(2*prev[axis]-5*a[axis]+4*b[axis]-next[axis])*t*t+(-prev[axis]+3*a[axis]-3*b[axis]+next[axis])*t*t*t),
      x = curve(0)*w, y = curve(1)*h,
      scale = mix(a[2], b[2], t);
    const alpha = c.globalAlpha;
    const width=scale*w*.036,height=width*coach.height/coach.width;
    c.save(); c.translate(Math.round(x), Math.round(y));
    c.fillStyle = "#2b2a2c55"; c.fillRect(-width*.35, -height*.08, width*.7, height*.12);
    for (let i = 0; i < 5; i++) {
      c.globalAlpha = .12*alpha; c.fillStyle = "#e8d2a4";
      c.fillRect(Math.round(Math.sin(seconds*1.5+i)*width*.18), (seconds*9+i*6)%Math.max(1,height*.4), width*.12, Math.max(1,width*.02));
    }
    c.globalAlpha = alpha;
    const bob=scale>.4?Math.round(Math.sin(seconds*10)*scale):0;
    c.drawImage(coach,Math.round(-width*.68),Math.round(-height*.91+bob),Math.round(width),Math.round(height));
    c.restore();
    return scale;
  }
  function camera(shot, seconds) {
    if (shot === 0) {
      const t = smooth(seconds/8);
      return { span:mix(.54,.67,t), cx:mix(.49,.54,t), cy:mix(.70,.63,t) };
    }
    if (shot === 1) {
      const t = smooth((seconds-6.7)/9);
      return { span:.99, cx:mix(.52,.48,t), cy:.5 };
    }
    const t = smooth((seconds-13.7)/10.3);
    return { span:mix(.63,1,t), cx:mix(.77,.5,t), cy:mix(.71,.5,t) };
  }
  function paintShot(c, shot, seconds, box, moving) {
    const w = artwork.naturalWidth, h = artwork.naturalHeight, view = camera(shot,seconds), ratio = box.w/box.h;
    let sw = w*view.span, sh = sw/ratio;
    if (sh > h) { sh = h; sw = sh*ratio; }
    const sx = Math.max(0,Math.min(w-sw,view.cx*w-sw/2)), sy = Math.max(0,Math.min(h-sh,view.cy*h-sh/2));
    c.save(); c.beginPath(); c.rect(box.x,box.y,box.w,box.h); c.clip();
    c.translate(box.x,box.y); c.scale(box.w/sw,box.h/sh); c.translate(-sx,-sy);
    c.drawImage(artwork,0,0);
    if (moving) {
      c.save(); c.globalAlpha *= .24; c.drawImage(flow,0,0); c.restore();
      fallingWater(c,seconds,w,h); birds(c,seconds,w,h);
    }
    if (shot === 2) carriage(c,smooth((seconds-13.7)/10.3),moving?seconds:0,w,h);
    c.restore();
  }
  function draw(c, seconds, moving = true) {
    const w = c.canvas.width, h = c.canvas.height, portrait = w/h < 1,
      bandH = Math.min(h*.78,w/(portrait?1.35:2.35)),
      box = { x:0, y:Math.round((h-bandH)/2-h*.025), w, h:Math.round(bandH) },
      time = moving ? Math.min(duration,Math.max(0,seconds)) : duration;
    c.imageSmoothingEnabled = false; c.fillStyle = "#000"; c.fillRect(0,0,w,h);
    if (moving) waterFlow(time);
    let shot = time < 7.7 ? 0 : time < 14.9 ? 1 : 2;
    const blend1 = smooth((time-6.7)/1.2), blend2 = smooth((time-13.7)/1.2);
    if (time < 7.9) {
      paintShot(c,0,time,box,moving);
      if (blend1 > 0) { c.save(); c.globalAlpha=blend1; paintShot(c,1,time,box,moving); c.restore(); }
    } else if (time < 14.9) {
      paintShot(c,1,time,box,moving);
      if (blend2 > 0) { c.save(); c.globalAlpha=blend2; paintShot(c,2,time,box,moving); c.restore(); }
    } else paintShot(c,2,time,box,moving);
    if (moving && time < 1.35) { c.fillStyle=`rgba(0,0,0,${1-smooth(time/1.35)})`; c.fillRect(0,0,w,h); }
    return { shot:["lakes","kingdom","departure"][shot], progress:time/duration,
      opening: moving ? smooth((time-1.8)/1.2)*(1-smooth((time-5.4)/1.2)) : 0,
      title: moving ? smooth((time-19)/2.1) : 1, box };
  }
  return { prepare, draw, duration };
})();
