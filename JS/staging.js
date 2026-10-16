// Small character-led scenes. No additional world map or external video is loaded.
const actionScenes = (() => {
  const root = document.querySelector("#story-action"),
    canvas = document.querySelector("#action-art"),
    c = canvas.getContext("2d"),
    label = document.querySelector("#action-label"),
    next = document.querySelector("#action-next");
  let state = null,
    request = 0,
    previous = 0,
    seconds = 0,
    inputAfter = 0;
  const clamp = (v) => Math.max(0, Math.min(1, v)),
    ease = (v) => {
      v = clamp(v);
      return v * v * (3 - 2 * v);
    };
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  function actor(a, frame = 0, lift = 0) {
    rect(a.x - 7, a.y, 14, 2, "#172e2940");
    c.drawImage(
      fieldSprites.make(a.id, a.dir, frame),
      Math.round(a.x - 28),
      Math.round(a.y - 76 - lift),
    );
  }
  function prepare(options) {
    stop();
    state = { ...options, cues: new Set(), cells: null };
    seconds = 0;
    root.hidden = false;
    root.dataset.kind = state.kind;
    inputAfter = performance.now() + 180;
    label.textContent = "";
    next.textContent = state.kind === "guide" ? "E · 정문으로" : "E · 계속";
    if (state.kind === "guide")
      state.cells = guideCels(state.pictures.guideKania);
    draw();
  }
  function portraitCells(image) {
    const sample = document.createElement("canvas");
    sample.width = image.naturalWidth;
    sample.height = image.naturalHeight;
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, sample.width, sample.height).data,
      w = sample.width / 2,
      h = sample.height / 2;
    return [0, 1, 2, 3].map((index) => {
      const sx = (index % 2) * w,
        sy = Math.floor(index / 2) * h;
      let l = w,
        r = 0,
        t = h,
        b = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (data[((y + sy) * sample.width + x + sx) * 4 + 3] > 128) {
            l = Math.min(l, x);
            r = Math.max(r, x);
            t = Math.min(t, y);
            b = Math.max(b, y);
          }
      let sum = 0,
        count = 0;
      for (let y = t; y < t + (b - t) * 0.26; y++)
        for (let x = l; x <= r; x++)
          if (data[((y + sy) * sample.width + x + sx) * 4 + 3] > 128) {
            sum += x;
            count++;
          }
      return {
        x: sx + l,
        y: sy + t,
        w: r - l + 1,
        h: b - t + 1,
        head: (count ? sum / count : (l + r) / 2) - l,
      };
    });
  }
  function guideCels(image) {
    // Keep one drawing so the face and body proportions stay consistent.
    // Overscan below the picture window prevents a gap at the upward footfall.
    const cell = portraitCells(image)[1],
      scale = 300 / cell.h;
    const base = document.createElement("canvas");
    base.width = 720;
    base.height = 376;
    const b = base.getContext("2d", { willReadFrequently: true });
    b.imageSmoothingEnabled = false;
    b.drawImage(
      image,
      cell.x,
      cell.y,
      cell.w,
      cell.h,
      Math.round(160 - cell.head * scale),
      64,
      cell.w * scale,
      300,
    );
    // The extracted art has translucent clothing pixels. Use the same solid
    // alpha treatment as field sprites, preserving only the outside silhouette.
    const pixels = b.getImageData(0, 0, base.width, base.height);
    for (let i = 3; i < pixels.data.length; i += 4)
      pixels.data[i] = pixels.data[i] >= 96 ? 255 : 0;
    b.putImageData(pixels, 0, 0);
    const mask = (points) => {
      const layer = document.createElement("canvas");
      layer.width = base.width; layer.height = base.height;
      const ctx = layer.getContext("2d");
      ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.closePath(); ctx.fill();
      return layer;
    };
    const armMask = mask([[154,247],[147,277],[134,299],[131,316],[140,337],[163,360],[179,376],[115,376],[104,353],[86,343],[63,333],[62,319],[73,296],[89,278],[120,266]]),
      tailMask = mask([[0,160],[65,110],[107,95],[111,145],[86,202],[40,247],[0,270]]);
    const cut = (shape) => {
      const layer = document.createElement("canvas"); layer.width=720; layer.height=376;
      const ctx=layer.getContext("2d");ctx.drawImage(base,0,0);
      ctx.globalCompositeOperation="destination-in";ctx.drawImage(shape,0,0);return layer;
    };
    const arm=cut(armMask), tail=cut(tailMask), body=cut(base), torso=body.getContext("2d");
    torso.globalCompositeOperation="destination-out";torso.drawImage(tailMask,0,0);
    // Cloth behind the near arm prevents a transparent seam when it swings.
    torso.globalCompositeOperation="source-over";
    const lining=cut(armMask), liningContext=lining.getContext("2d");
    liningContext.globalCompositeOperation="source-in";liningContext.fillStyle="#234632";
    liningContext.fillRect(0,0,720,376);torso.drawImage(lining,0,0);
    // Twelve rigid-body cels: two footfalls, opposite arm swing and a delayed
    // ponytail. The face is translated intact; no scanline warping or pose swaps.
    return Array.from({length:12}, (_,frame) => {
      const phase=frame/12*Math.PI*2,
        lift=Math.round(Math.cos(phase*2)-1);
      const cel = document.createElement("canvas");
      cel.width = 720;
      cel.height = 376;
      const paint = cel.getContext("2d");
      paint.imageSmoothingEnabled = false;
      paint.save();paint.translate(111,130+lift);paint.rotate(Math.sin(phase-.6)*.015);
      paint.drawImage(tail,-111,-130);paint.restore();
      paint.drawImage(body,0,lift);
      paint.save();paint.translate(145,260+lift);paint.rotate(Math.sin(phase)*.065);
      paint.drawImage(arm,-145,-260);paint.restore();
      const pixels=paint.getImageData(0,0,720,376);
      for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=96?255:0;
      paint.putImageData(pixels,0,0);
      return cel;
    });
  }
  function cue(name, at, sound, variant = "") {
    if (seconds < at || state.cues.has(name)) return;
    state.cues.add(name);
    if (sound) gameAudio.sfx(sound, variant);
  }
  function drawRogue() {
    const rogue = state.actors.find((a) => a.id === "rogue"),
      moving = state.motion && seconds >= 1.65;
    const zoom = state.motion
      ? 1 + 1.15 * ease(seconds / 0.65) * (1 - ease((seconds - 1.55) / 0.7))
      : 1;
    const centreX = 360 + (rogue.x - 360) * clamp((zoom - 1) / 1.15),
      centreY = 240 + (rogue.y - 40 - 240) * clamp((zoom - 1) / 1.15);
    c.save();
    c.translate(360, 240);
    c.scale(zoom, zoom);
    c.translate(-centreX, -centreY);
    c.drawImage(state.world, 0, 0);
    const jump =
      state.motion && seconds >= 0.8 && seconds <= 1.3
        ? Math.round(Math.sin(((seconds - 0.8) / 0.5) * Math.PI) * 13)
        : 0;
    const run = state.motion ? clamp((seconds - 1.65) / 2.3) : 0;
    const runner = {
      ...rogue,
      x: rogue.x + (360 - rogue.x) * ease(run),
      y: rogue.y + 190 * run,
      dir: "down",
    };
    [...state.actors.filter((a) => a.id !== "rogue"), runner]
      .sort((a, b) => a.y - b.y)
      .forEach((a) =>
        actor(
          a,
          a === runner && moving ? Math.floor(seconds * 12) % 4 : 0,
          a === runner ? jump : 0,
        ),
      );
    if (!state.motion || seconds >= 0.55)
      for (let i = 0; i < 2; i++) {
        const fall = state.motion ? (Math.floor((seconds - 0.55) * 12) + i * 3) % 6 : 1;
        // Front sprite eyes are at (23, 18) and (32, 18), relative to its
        // 56 × 80 canvas. Tears start just beneath them and stay on the cheeks.
        const x = runner.x + (i ? 4 : -5),
          y = runner.y - 56 - jump + fall;
        rect(x, runner.y - 56 - jump, 1, 2, "#b9f4ff");
        rect(x, y, 1, 2, "#dbffff");
        rect(x, y + 2, 1, 1, "#6dd6e7");
      }
    c.restore();
    root.dataset.jump = String(jump);
    root.dataset.zoom = zoom.toFixed(3);
    root.dataset.progress = run.toFixed(3);
    label.textContent =
      seconds < 1.65
        ? "…그, 그럴 수가……!"
        : "노란 머리 도적은 울음을 훔치며 마차 쪽으로 달아났다.";
    cue("jump", 0.8, state.motion ? "jump" : null);
    cue("cry", 1.1, "cry");
    if (state.motion && moving && seconds < 3.9)
      cue("step" + Math.floor(seconds * 6), 0, "footstep", "stone-run");
  }
  function drawGuide() {
    const art = state.pictures.guideForest,
      t = state.motion ? clamp(seconds / 10) : 1;
    const sw = art.naturalWidth * 0.74,
      sh = (sw * 344) / 720;
    c.drawImage(
      art,
      Math.round((art.naturalWidth - sw) * t),
      Math.round((art.naturalHeight - sh) * 0.4),
      sw,
      sh,
      0,
      58,
      720,
      344,
    );
    const stepRate = 2.2,
      frame = state.motion ? Math.floor(seconds * stepRate * 6) % 12 : 0;
    // The lower edge is hidden beneath the fixed caption bar, with overscan.
    c.save();
    c.beginPath();
    c.rect(0, 58, 720, 344);
    c.clip();
    c.drawImage(state.cells[frame], 0, 58);
    c.restore();
    if (state.motion) {
      for (let i = 0; i < 7; i++) {
        const x =
            ((((i * 151 - Math.floor(seconds * 34)) % 790) + 790) % 790) - 35,
          y = 73 + i * 44;
        rect(x, y, 3, 1, "#eff7c779");
      }
      cue("step" + Math.floor(seconds * stepRate), 0, "footstep", "earth");
      cue("birds", 2.6, "birds");
    }
    label.textContent =
      seconds < 3
        ? "카니아의 발걸음을 따라, 숲의 안쪽으로."
        : seconds < 6.5
          ? "물소리가 가까워졌다. 나뭇잎 사이로 오래된 다리와 폭포가 보였다."
          : "커다란 뿌리 너머로 성역의 문이 모습을 드러냈다.";
    root.dataset.pan = t.toFixed(3);
    root.dataset.cel = String(frame);
  }
  function draw() {
    if (!state) return;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#122721";
    c.fillRect(0, 0, 720, 480);
    if (state.kind === "rogue") drawRogue();
    else drawGuide();
    rect(0, 0, 720, 58, "#000000");
    rect(0, 402, 720, 78, "#000000");
  }
  function loop(now) {
    if (!state) return;
    if (!document.hidden)
      seconds += Math.min(0.05, Math.max(0, (now - previous) / 1000));
    previous = now;
    draw();
    const duration = state.motion ? (state.kind === "rogue" ? 4.4 : 10.5) : 0.8;
    if (seconds >= duration) {
      finish(true);
      return;
    }
    request = requestAnimationFrame(loop);
  }
  function play() {
    if (!state) return;
    previous = performance.now();
    request = requestAnimationFrame(loop);
    next.focus({ preventScroll: true });
  }
  function finish(automatic = false) {
    if (!state || (!automatic && performance.now() < inputAfter)) return;
    const after = state.after;
    stop();
    after();
  }
  function stop() {
    cancelAnimationFrame(request);
    state = null;
    root.hidden = true;
    label.textContent = "";
  }
  next.addEventListener("click", () => finish());
  return {
    prepare,
    play,
    finish,
    stop,
    get kind() {
      return state?.kind || null;
    },
  };
})();
