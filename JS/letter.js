// A small parchment arrives in the world. Reading begins only after interaction.
const libraryLetter = (() => {
  const root = document.querySelector("#library-letter"),
    paper = document.querySelector("#library-letter-paper"),
    next = document.querySelector("#library-letter-next");
  let state = null;
  const duration = 1.8;
  function position(player) {
    return {
      x: player.x,
      y: Math.max(30, player.y - fieldSprites.bodyHeight("hero") - 17),
    };
  }
  function deliver(options) {
    reset();
    state = {
      ...options,
      stage: options.motion ? "flying" : "waiting",
      elapsed: 0,
    };
    root.dataset.delivery = state.stage;
    gameAudio.sfx("paper");
  }
  function update(dt, animated) {
    if (!state || state.stage === "reading") return;
    state.elapsed += dt;
    state.motion = animated;
    if (state.stage === "flying" && (!animated || state.elapsed >= duration)) {
      state.stage = "waiting";
      root.dataset.delivery = "waiting";
      gameAudio.sfx("paper");
    }
  }
  function draw(ctx, player) {
    if (!state || state.stage === "reading") return;
    const end = position(player),
      progress = Math.min(1, state.elapsed / duration),
      t = 1 - Math.pow(1 - progress, 2),
      u = 1 - t,
      flying = state.stage === "flying";
    const x = flying
        ? u * u * u * 752 + 3 * u * u * t * 620 + 3 * u * t * t * (end.x - 75) + t * t * t * end.x
        : end.x,
      y = flying
        ? u * u * u * 60 + 3 * u * u * t * 30 + 3 * u * t * t * (end.y - 70) + t * t * t * end.y
        : end.y + (state.motion ? Math.round(Math.sin(state.elapsed * 2.5)) : 0);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flying) ctx.rotate(Math.sin(t * Math.PI * 3) * (1 - t) * 0.55);
    ctx.shadowColor = "#fff0b6";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#ac8149";
    ctx.fillRect(-11, -8, 22, 16);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f5dfaa";
    ctx.fillRect(-10, -7, 20, 14);
    ctx.fillStyle = "#d2ac70";
    ctx.fillRect(-12, -8, 24, 3);
    ctx.fillRect(-12, 5, 24, 3);
    ctx.fillStyle = "#a08553";
    ctx.fillRect(-6, -3, 12, 1);
    ctx.fillRect(-6, 0, 8, 1);
    ctx.fillStyle = "#904936";
    ctx.fillRect(3, 0, 4, 4);
    ctx.fillStyle = "#dda273";
    ctx.fillRect(4, 1, 1, 1);
    ctx.restore();
  }
  function open(options) {
    if (state?.stage !== "waiting") return;
    state.stage = "reading";
    state.close = options.close;
    state.inputAfter = performance.now() + 220;
    root.hidden = false;
    root.dataset.delivery = "reading";
    root.dataset.arrived = "true";
    paper.scrollTop = 0;
    next.textContent = "편지 접기 · E";
    gameAudio.sfx("paper");
    next.focus({ preventScroll: true });
  }
  function finish() {
    if (state?.stage !== "reading" || performance.now() < state.inputAfter) return;
    const { close, after } = state;
    reset();
    gameAudio.sfx("paper");
    close?.();
    after?.();
  }
  function handle(code, repeat, shift) {
    if (!state) return false;
    if (code === "Tab") {
      const buttons = [next, document.querySelector("#game-sound-toggle")],
        index = buttons.indexOf(document.activeElement);
      buttons[(index + (shift ? -1 : 1) + buttons.length) % buttons.length]
        .focus({ preventScroll: true });
    } else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(code)) {
      if (code === "Home") paper.scrollTop = 0;
      else if (code === "End") paper.scrollTop = paper.scrollHeight;
      else paper.scrollTop += (code === "ArrowUp" || code === "PageUp" ? -1 : 1) *
        (code.startsWith("Page") ? paper.clientHeight * 0.75 : 40);
    } else if (["KeyE", "Enter", "Space", "Escape"].includes(code) && !repeat)
      finish();
    return true;
  }
  function hide() {
    root.hidden = true;
    delete root.dataset.arrived;
    if (state?.stage === "reading") {
      state.stage = "waiting";
      root.dataset.delivery = "waiting";
    }
  }
  function reset() {
    hide();
    state = null;
    delete root.dataset.delivery;
  }
  next.addEventListener("click", finish);
  return {
    deliver, update, draw, position, open, hide, reset, finish, handle,
    get waiting() { return state?.stage === "waiting"; },
    get delivery() { return state?.stage || null; },
  };
})();
