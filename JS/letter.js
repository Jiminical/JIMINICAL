// The final-area letter stays open until the player has finished reading it.
const libraryLetter = (() => {
  const root = document.querySelector("#library-letter"),
    paper = document.querySelector("#library-letter-paper"),
    next = document.querySelector("#library-letter-next");
  let state = null;
  function arrive(current) {
    if (state !== current) return;
    root.dataset.arrived = "true";
    current.arrived = true;
    next.textContent = "편지 접기 · E";
    next.focus({ preventScroll: true });
  }
  function show(options) {
    hide();
    const current = (state = {
      ...options,
      arrived: false,
      inputAfter: performance.now() + 220,
    });
    root.hidden = false;
    root.dataset.arrived = "false";
    next.textContent = "편지 펼치기 · E";
    gameAudio.sfx("paper");
    next.focus({ preventScroll: true });
    if (!options.motion) return arrive(current);
    current.flight = paper.animate(
      [
        { transform: "translate(95vw, -65vh) rotate(32deg) scale(0.28)", opacity: 0 },
        { transform: "translate(28vw, -12vh) rotate(-12deg) scale(0.7)", opacity: 1, offset: 0.5 },
        { transform: "translate(-2vw, 2vh) rotate(3deg) scale(1.02)", opacity: 1, offset: 0.84 },
        { transform: "translate(0, 0) rotate(0) scale(1)", opacity: 1 },
      ],
      { duration: 1250, easing: "cubic-bezier(.22,.7,.28,1)" },
    );
    current.flight.finished.then(() => arrive(current)).catch(() => {});
  }
  function finish() {
    if (!state || performance.now() < state.inputAfter) return;
    if (!state.arrived) {
      state.flight?.finish();
      arrive(state);
      state.inputAfter = performance.now() + 180;
      return;
    }
    const after = state.after;
    hide();
    gameAudio.sfx("paper");
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
    state?.flight?.cancel();
    state = null;
    root.hidden = true;
    delete root.dataset.arrived;
  }
  next.addEventListener("click", finish);
  return { show, hide, finish, handle };
})();
