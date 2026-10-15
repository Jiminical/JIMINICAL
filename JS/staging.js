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
    // Keep the relaxed arm-down drawing throughout the walk. The old four
    // independently drawn poses changed the face, shoulders and arm silhouette.
    const cell = portraitCells(image)[1],
      scale = 280 / cell.h;
    const base = document.createElement("canvas");
    base.width = 720;
    base.height = 344;
    const b = base.getContext("2d");
    b.imageSmoothingEnabled = false;
    b.drawImage(
      image,
      cell.x,
      cell.y,
      cell.w,
      cell.h,
      Math.round(160 - cell.head * scale),
      82,
      cell.w * scale,
      280,
    );
    const lifts = [0, 0, -1, -1, 0, 0, -1, -1],
      sways = [0, 0, 1, 1, 0, 0, -1, -1];
    // Eight discrete pixel cels: a one-pixel footfall and a delayed one-pixel
    // shift through the cloak/hair. Head size and the face drawing stay fixed.
    return lifts.map((lift, frame) => {
      const cel = document.createElement("canvas");
      cel.width = 720;
      cel.height = 344;
      const paint = cel.getContext("2d");
      paint.imageSmoothingEnabled = false;
      for (let y = 0; y < 344; y++) {
        const sway = Math.round(sways[frame] * clamp((y - 190) / 120));
        paint.drawImage(base, 0, y, 720, 1, sway, y + lift, 720, 1);
      }
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
      moving = seconds >= 1.65;
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
    const run = state.motion ? clamp((seconds - 1.65) / 2.3) : 1;
    const runner = {
      ...rogue,
      x: rogue.x + (360 - rogue.x) * ease(run),
      y: rogue.y + 190 * run,
      dir: moving ? "down" : "down",
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
    if (state.motion)
      for (let i = 0; i < 4; i++) {
        const fall = (Math.floor(seconds * 10) + i * 3) % 12;
        const x = runner.x + (i % 2 ? 9 : -9),
          y = runner.y - 51 - jump + fall;
        rect(x, y, 2, 3, "#dbffff");
        rect(x, y + 3, 2, 2, "#6dd6e7");
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
    const sw = art.naturalWidth * 0.9,
      sh = (sw * 344) / 720;
    c.drawImage(
      art,
      Math.round((art.naturalWidth - sw) * ease(t)),
      Math.round((art.naturalHeight - sh) * 0.4),
      sw,
      sh,
      0,
      58,
      720,
      344,
    );
    const frame = state.motion ? Math.floor(seconds * 8.8) % 8 : 0;
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
      cue("step" + Math.floor(seconds * 2.2), 0, "footstep", "earth");
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
