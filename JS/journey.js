// Three separate locations, with a coach travelling one straight, grounded road.
const journeyCinematic = (() => {
  const duration = 30;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const cuts = [8.6, 17.3], dissolve = 1.3;
  const names = ["kingdom", "gorge", "departure"];
  let shots = [], coach = null;

  function prepare(pictures) {
    if (shots[0]?.image === pictures.journey) return;
    shots = [pictures.journey,pictures.journeyGorge,pictures.journeyRoad].map(image=>({image}));
    shots.forEach((shot,i)=>livingNature.prepare(shot.image,["journeyKingdom","journeyGorge","journeyRoad"][i]));
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
    coach = document.createElement("canvas"); coach.width = 240;
    coach.height = Math.round(240 * (bottom - top + 1) / (right - left + 1));
    const p = coach.getContext("2d"); p.imageSmoothingEnabled = false;
    p.drawImage(image, left, top, right - left + 1, bottom - top + 1, 0, 0, coach.width, coach.height);
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
    return { x: .65 + (ground - .46) * .4, y: ground, width: .141 / depth };
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
    if (moving) {
      livingNature.draw(c,image,["journeyKingdom","journeyGorge","journeyRoad"][index],seconds);
      birds(c,seconds,w,h,index);
    }
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
