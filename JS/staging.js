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
      state.cells = pixelAtlases.make(state.pictures.kaniaWalk, 4, 2);
    draw();
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
    const stepRate = 2.4,
      frame = state.motion ? Math.floor(seconds * stepRate * 4) % 8 : 0;
    // A visible path and planted boots give the walk a stable ground plane.
    c.save(); c.beginPath(); c.rect(0, 58, 720, 344); c.clip();
    const ground = c.createLinearGradient(0, 331, 0, 402);
    ground.addColorStop(0, "#36553a00"); ground.addColorStop(.3, "#3c4a2c"); ground.addColorStop(1, "#1c3023");
    c.fillStyle = ground; c.fillRect(0, 331, 720, 71);
    for (let i = 0; i < 16; i++) {
      const x = ((i * 64 - (state.motion ? seconds * 72 : 0)) % 960 + 960) % 960 - 96;
      rect(x, 382 + i % 3 * 5, 27, 2, "#8b94654a");
      rect(x + 31, 365 + i % 4 * 7, 4, 2, "#b3bb7838");
    }
    c.fillStyle = "#091c2260"; c.beginPath(); c.ellipse(227, 388, 49, 6, 0, 0, Math.PI * 2); c.fill();
    pixelAtlases.draw(c, state.cells, frame, 225, 388, 222);
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
