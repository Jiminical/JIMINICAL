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
    label.dataset.emotion = "";
    next.textContent = state.kind === "guide" ? "E · 정문으로" : "E · 계속";
    root.dataset.interactive = String(!!state.interactive);
    if (state.kind === "guide")
      state.cells = kaniaWalk.prepare(state.pictures.guideKania);
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
    livingNature.draw(c,state.world,"city",seconds,state.motion);
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
    label.dataset.emotion = seconds < 1.65 ? "tremble" : "";
    cue("jump", 0.8, state.motion ? "jump" : null);
    cue("cry", 1.1, "cry");
    if (state.motion && moving && seconds < 3.9)
      cue("step" + Math.floor(seconds * 6), 0, "footstep", "stone-run");
  }
  function drawGuide() {
    const vista=scenicLandscape.draw(c,state.pictures.guideForest,seconds,state.motion);
    c.save();c.beginPath();c.rect(0,58,720,344);c.clip();
    const walk=kaniaWalk.draw(c,state.cells,seconds,0,58,state.motion);
    c.restore();
    if(state.motion){
      const stride=kaniaWalk.period/2;
      if(seconds>=stride)
        cue("step"+Math.floor((seconds-stride)/stride),0,"footstep","stone");
      cue("birds",2.6,"birds");
    }
    label.textContent=seconds<3?"카니아를 따라 걷자, 나무 사이로 거대한 경관이 펼쳐졌다.":seconds<6.5?"끝없이 쏟아지는 폭포. 새 떼가 물안개 위를 가르고, 작은 페어리들이 빛났다.":"구름과 산맥 사이로 이어진 길 너머, 성역이 기다리고 있었다.";
    root.dataset.pan=vista.pan.toFixed(3);root.dataset.cel=String(walk.frame);
    root.dataset.framing="upper-body";root.dataset.waterFlow=vista.flow.toFixed(2);
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
    // Motion preferences change the picture, never the time available to read it.
    const duration = state.kind === "rogue" ? 4.4 : 10.5;
    if (!state.interactive && seconds >= duration) {
      finish(true);
      return;
    }
    request = requestAnimationFrame(loop);
  }
  function play() {
    if (!state) return;
    previous = performance.now();
    request = requestAnimationFrame(loop);
    if (!state.interactive) next.focus({ preventScroll: true });
  }
  function finish(automatic = false) {
    // An interactive guide ends through its own question/exit choice. That
    // explicit choice must work even when reduced motion reveals it at once.
    if (!state || (!automatic && !state.interactive && performance.now() < inputAfter)) return;
    const after = state.after;
    stop();
    after();
  }
  function stop() {
    cancelAnimationFrame(request);
    if(state?.kind === "rogue")gameAudio.stopTransient("comic");
    state = null;
    root.hidden = true;
    delete root.dataset.interactive;
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
