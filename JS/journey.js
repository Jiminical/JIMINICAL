// Three separate locations, with a coach travelling one straight, grounded road.
const journeyCinematic = (() => {
  const duration = 30;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const cuts = [8.6, 17.3], dissolve = 1.3;
  const names = ["kingdom", "gorge", "departure"];
  let shots = [], coach = null;

  function waterLayer(image, region) {
    const layer = document.createElement("canvas");
    layer.width = image.naturalWidth; layer.height = image.naturalHeight;
    const c = layer.getContext("2d", { willReadFrequently: true });
    c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, layer.width, layer.height), data = pixels.data;
    for (let y = 0; y < layer.height; y++) for (let x = 0; x < layer.width; x++) {
      const i = (y * layer.width + x) * 4, r = data[i], g = data[i+1], b = data[i+2];
      if (!(x > layer.width * region[0] && x < layer.width * region[2] &&
        y > layer.height * region[1] && y < layer.height * region[3] &&
        b > r * 1.15 && g > r * 1.2 && b > 75)) data[i + 3] = 0;
    }
    c.putImageData(pixels, 0, 0);
    return layer;
  }
  function prepare(pictures) {
    if (shots[0]?.image === pictures.journey) return;
    shots = [
      { image: pictures.journey, region: [.25, .51, .80, .98],
        falls: [[.10,.286,.018,.30],[.228,.425,.012,.225],[.296,.547,.015,.18]] },
      { image: pictures.journeyGorge, region: [.14, .59, .98, .98],
        falls: [[.12,.045,.065,.55],[.357,.34,.023,.22],[.855,.265,.023,.21]] },
      { image: pictures.journeyRoad, region: [.01, .33, .62, .69],
        falls: [[.081,.59,.014,.23],[.18,.63,.018,.21],[.261,.67,.014,.22]] },
    ].map(shot => ({ ...shot, water: waterLayer(shot.image, shot.region) }));
    const image = pictures.journeyCarriage, full = document.createElement("canvas");
    full.width = image.naturalWidth; full.height = image.naturalHeight;
    const c = full.getContext("2d", { willReadFrequently: true }); c.drawImage(image, 0, 0);
    const alpha = c.getImageData(0, 0, full.width, full.height).data;
    let left = full.width, top = full.height, right = 0, bottom = 0;
    for (let y = 0; y < full.height; y++) for (let x = 0; x < full.width; x++)
      if (alpha[(y * full.width + x) * 4 + 3] > 100) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    coach = document.createElement("canvas"); coach.width = 160;
    coach.height = Math.round(160 * (bottom - top + 1) / (right - left + 1));
    const p = coach.getContext("2d"); p.imageSmoothingEnabled = false;
    p.drawImage(image, left, top, right - left + 1, bottom - top + 1, 0, 0, coach.width, coach.height);
  }
  function livingWater(c, shot, seconds) {
    const w = shot.image.naturalWidth, h = shot.image.naturalHeight;
    c.save(); c.globalAlpha *= .1;
    c.drawImage(shot.water, Math.round(Math.sin(seconds * .6) * 2), 0); c.restore();
    for (const [x, y, width, height] of shot.falls) {
      c.save(); c.beginPath(); c.rect(x*w, y*h, width*w, height*h); c.clip();
      c.globalAlpha *= .12; c.fillStyle = "#edffff";
      for (let i = 0; i < 10; i++) c.fillRect(Math.round(x*w+(i*13)%(width*w)),
        Math.round(y*h+(seconds*55+i*31)%(height*h+20)-20), 1+i%2, 7+i%4*3);
      c.restore();
    }
  }
  function birds(c, seconds, w, h, shot) {
    c.save(); c.fillStyle = shot === 2 ? "#7c8793" : "#e7edf1";
    for (let i = 0; i < 5; i++) {
      const x = w * (.37 + i * .013 + seconds * .003),
        y = h * (.28 + i % 3 * .014) + Math.sin(seconds*.8+i)*2,
        flap = Math.floor(seconds * 4 + i) % 3;
      c.fillRect(Math.round(x), Math.round(y), 2, 1);
      c.fillRect(Math.round(x-3), Math.round(y+(flap===0?-2:0)), 3, 1);
      c.fillRect(Math.round(x+2), Math.round(y+(flap===0?-2:0)), 3, 1);
    }
    c.restore();
  }
  function roadPosition(seconds) {
    // Perspective projection of constant forward travel. The same vanishing
    // point controls position and size; no turns or spline overshoot exist.
    const t = clamp((seconds - cuts[1]) / (duration - cuts[1])), depth = 1 + t * .53,
      ground = .46 + .49 / depth;
    return { x: .65 + (ground - .46) * .4, y: ground, width: .094 / depth };
  }
  function carriage(c, seconds, w, h, moving) {
    const position = roadPosition(seconds), width = position.width * w,
      height = width * coach.height / coach.width, x = position.x*w, y = position.y*h;
    c.save(); c.translate(x, y);
    // Shadows and the rear axle stay on the road. The coach never bobs upward.
    c.fillStyle = "#4c3a2850";
    c.beginPath(); c.ellipse(-width*.09,-height*.025,width*.37,height*.055,0,0,Math.PI*2); c.fill();
    if (moving) for (let i = 0; i < 7; i++) {
      const age = (seconds * .65 + i / 7) % 1;
      c.save(); c.globalAlpha *= (1-age) * .14; c.fillStyle = "#f7d89f";
      c.fillRect(Math.round(-width*.08 + Math.sin(i*2.4)*width*.12 + age*width*.18),
        Math.round(age*height*.13), Math.max(1,width*.045), Math.max(1,width*.02)); c.restore();
    }
    c.drawImage(coach, Math.round(-width*.68), Math.round(-height*.96), Math.round(width), Math.round(height));
    c.restore();
  }
  function camera(index, seconds) {
    const begin = index === 0 ? 0 : cuts[index-1], end = index === 2 ? duration : cuts[index],
      t = smooth((seconds - begin) / (end - begin));
    // Small, continuous lens moves preserve the actual scene and road layout.
    return index === 0 ? { span: mix(.95,1,t), cx:.5, cy:mix(.52,.5,t) }
      : index === 1 ? { span:mix(.96,1,t), cx:mix(.49,.5,t), cy:.51 }
      : { span:mix(.96,1,t), cx:.51, cy:.51 };
  }
  function paintShot(c, index, seconds, box, moving) {
    const shot = shots[index], image = shot.image, w = image.naturalWidth, h = image.naturalHeight,
      view = camera(index, seconds), ratio = box.w / box.h;
    let sw = w*view.span, sh = sw/ratio;
    if (sh > h) { sh = h; sw = sh*ratio; }
    const sx = Math.max(0,Math.min(w-sw,view.cx*w-sw/2)), sy = Math.max(0,Math.min(h-sh,view.cy*h-sh/2));
    c.save(); c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
    c.translate(box.x,box.y); c.scale(box.w/sw,box.h/sh); c.translate(-sx,-sy);
    c.drawImage(image,0,0);
    if (moving) { livingWater(c,shot,seconds); birds(c,seconds,w,h,index); }
    if (index === 2) carriage(c,seconds,w,h,moving);
    c.restore();
  }
  function draw(c, seconds, moving = true) {
    const w = c.canvas.width, h = c.canvas.height,
      bandH = Math.min(h*.78,w/2.35),
      box = { x:0, y:Math.round((h-bandH)/2-h*.025), w, h:Math.round(bandH) },
      time = moving ? Math.min(duration,Math.max(0,seconds)) : duration;
    c.imageSmoothingEnabled = false; c.fillStyle = "#000"; c.fillRect(0,0,w,h);
    const index = time < cuts[0] ? 0 : time < cuts[1] ? 1 : 2;
    paintShot(c,index,time,box,moving);
    for (let i = 0; i < cuts.length; i++) if (time >= cuts[i] && time < cuts[i]+dissolve) {
      // Fade the old shot over the new one without a dark dip between locations.
      c.save(); c.globalAlpha = 1-smooth((time-cuts[i])/dissolve);
      paintShot(c,i,time,box,moving); c.restore();
    }
    if (moving && time < 1.4) { c.fillStyle=`rgba(0,0,0,${1-smooth(time/1.4)})`; c.fillRect(0,0,w,h); }
    return { shot:names[index], progress:time/duration,
      opening:moving ? smooth((time-1.8)/1.2)*(1-smooth((time-6.3)/1.2)) : 0,
      title:moving ? smooth((time-25)/2.1) : 1, box };
  }
  return { prepare, draw, duration };
})();
