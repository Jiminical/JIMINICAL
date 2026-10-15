// Small story moments share a prepared backdrop and a cancellable clock.
const eventScenes = (() => {
  const root = document.querySelector("#game-event");
  const stage = document.querySelector("#event-stage");
  const canvas = document.querySelector("#event-art"),
    context = canvas.getContext("2d");
  const paper = document.querySelector("#event-document");
  const seal = document.querySelector("#credential-seal");
  const stamp = document.querySelector("#event-stamper");
  const scan = document.querySelector("#event-scan-line");
  const impact = document.querySelector("#event-impact");
  const route = document.querySelector("#event-route"),
    routePath = document.querySelector("#event-route-path");
  const caption = document.querySelector("#event-caption"),
    next = document.querySelector("#event-next");
  const origin = document.querySelector("#route-origin"),
    destination = document.querySelector("#route-destination");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const definitions = {
    stamp: {
      frame: 0,
      duration: 3.3,
      title: "의뢰 접수",
      before: "접수대 위로 모험가증이 밀려온다.",
      after: "쾅. 기사단의 파견 인장이 찍혔다.",
    },
    departure: {
      frame: 1,
      duration: 2.8,
      title: "동쪽 숲으로",
      before: "묵직한 문이 닫히고, 바퀴가 천천히 구르기 시작한다.",
      after: "제르디아의 소음이 뒤로 멀어진다.",
    },
    credentials: {
      frame: 2,
      duration: 3.1,
      title: "성역 검문소",
      before: "초록빛이 모험가증의 인장을 훑는다.",
      after: "신원 확인. 성역으로 들어가는 길이 열린다.",
    },
    map: {
      frame: 3,
      duration: 2.9,
      title: "낡은 여행 지도",
      before: "지도 위, 동쪽으로 이어진 길을 짚어 본다.",
      after: "제르디아에서 동쪽 숲을 지나, 그린스토아로.",
    },
  };
  let state = null,
    request = 0,
    previous = 0;
  const motion = () =>
    !reduced.matches && !document.body.classList.contains("no-motion");
  const clamp = (v) => Math.max(0, Math.min(1, v));
  function setCaption(text) {
    if (caption.textContent !== text) caption.textContent = text;
  }
  function cue(id, at, sound, seconds, quiet) {
    if (seconds < at || state.cues.has(id)) return;
    state.cues.add(id);
    if (!quiet) gameAudio.sfx(sound);
  }
  function commit() {
    if (!state || state.committed) return;
    state.committed = true;
    state.onImpact?.();
  }
  function fit() {
    if (!state || root.hidden) return;
    const width = root.clientWidth,
      available = Math.max(1, root.clientHeight - 106);
    const fitted =
      state.kind === "map" ? Math.min(width - 24, available * 1.5) : width;
    const height = state.kind === "map" ? fitted / 1.5 : available;
    stage.style.width = fitted + "px";
    stage.style.height = height + "px";
    stage.style.left = (width - fitted) / 2 + "px";
    stage.style.top = (available - height) / 2 + "px";
    canvas.width = Math.max(
      1,
      Math.min(1200, Math.round(fitted * Math.min(devicePixelRatio || 1, 1.5))),
    );
    canvas.height = Math.max(1, Math.round((canvas.width * height) / fitted));
    state.paperScale = Math.max(
      0.1,
      Math.min(
        1,
        (height - 24) / paper.offsetHeight,
        (fitted - 24) / paper.offsetWidth,
      ),
    );
    render(true);
  }
  function render(quiet = false) {
    if (!state) return;
    const settings = definitions[state.kind],
      animated = motion();
    const seconds = animated ? state.elapsed : settings.duration;
    const progress = clamp(seconds / settings.duration);
    root.dataset.progress = progress.toFixed(3);
    const image = state.atlas,
      sw = image.naturalWidth / 2,
      sh = image.naturalHeight / 2;
    const sx = (settings.frame % 2) * sw,
      sy = Math.floor(settings.frame / 2) * sh;
    const scale = Math.max(canvas.width / sw, canvas.height / sh);
    const zoom =
      state.kind === "map" || !animated ? 1 : 1.035 + progress * 0.035;
    const cw = canvas.width / (scale * zoom),
      ch = canvas.height / (scale * zoom);
    const shake =
      animated && state.kind === "departure"
        ? [0, -1, 0, 1][Math.floor(seconds * 16) % 4]
        : 0;
    context.imageSmoothingEnabled = false;
    context.drawImage(
      image,
      sx + (sw - cw) / 2,
      sy + (sh - ch) / 2 + shake,
      cw,
      ch,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const landed = state.kind === "stamp" ? seconds >= 1.18 : seconds >= 1.85;
    if (state.started && landed) commit();
    const jolt =
      animated && state.kind === "stamp" && seconds >= 1.18 && seconds < 1.46
        ? [0, -3, 3, -2, 2, 0][Math.min(5, Math.floor((seconds - 1.18) * 25))]
        : 0;
    paper.style.transform = `translate(${jolt}px, 0) scale(${state.paperScale * (animated ? 0.88 + Math.min(1, seconds / 1.1) * 0.12 : 1)})`;
    seal.style.opacity = String(landed ? 1 : 0);
    seal.style.transform = `rotate(-9deg) scale(${landed && animated ? 1 + Math.max(0, 1.35 - seconds) * 0.8 : 1})`;
    stamp.style.opacity =
      state.kind === "stamp" && seconds < 1.72 && animated ? "1" : "0";
    const travel =
      seconds < 0.82
        ? -210
        : seconds < 1.18
          ? -210 * (1 - clamp((seconds - 0.82) / 0.36))
          : -Math.max(0, seconds - 1.32) * 650;
    stamp.style.transform = `translateY(${Math.round(travel)}px) rotate(-9deg)`;
    scan.style.opacity =
      state.kind === "credentials" && seconds > 0.35 && seconds < 1.85
        ? "1"
        : "0";
    scan.style.left = clamp((seconds - 0.35) / 1.5) * 100 + "%";
    impact.style.opacity =
      animated && state.kind === "stamp"
        ? String(Math.max(0, 1 - Math.abs(seconds - 1.2) / 0.08) * 0.22)
        : "0";
    routePath.style.strokeDashoffset = String(
      (1 - clamp(seconds / 2.4)) * state.routeLength,
    );
    destination.style.opacity = String(clamp((seconds - 2.0) / 0.4));
    setCaption(
      seconds > (state.kind === "stamp" ? 1.18 : 1.85)
        ? settings.after
        : settings.before,
    );
    if (state.started) {
      cue(
        "paper",
        0,
        state.kind === "departure" ? "door" : "paper",
        seconds,
        quiet,
      );
      if (state.kind === "stamp") {
        cue("impact", 1.18, "stamp", seconds, quiet);
        cue("success", 1.68, "registered", seconds, quiet);
      }
      if (state.kind === "departure") {
        cue("wheel1", 0.6, "wheel", seconds, quiet);
        cue("wheel2", 1.6, "wheel", seconds, quiet);
      }
      if (state.kind === "credentials") {
        cue("scan", 0.5, "scan", seconds, quiet);
        cue("approved", 1.85, "admitted", seconds, quiet);
      }
      if (state.kind === "map") cue("route", 2.0, "route", seconds, quiet);
    }
  }
  function tick(now) {
    if (!state || state.finishing) return;
    const dt = Math.min(0.06, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (!document.hidden) state.elapsed += dt;
    render();
    const duration = motion() ? definitions[state.kind].duration : 1.1;
    if (state.kind !== "map" && state.elapsed >= duration) {
      finish();
      return;
    }
    request = requestAnimationFrame(tick);
  }
  function prepare(kind, options) {
    hide();
    state = {
      ...options,
      kind,
      elapsed: 0,
      started: false,
      committed: false,
      finishing: false,
      cues: new Set(),
      routeLength: routePath.getTotalLength(),
    };
    root.dataset.kind = kind;
    root.dataset.progress = "0";
    root.hidden = false;
    paper.hidden = !["stamp", "credentials"].includes(kind);
    route.toggleAttribute("hidden", kind !== "map");
    origin.hidden = destination.hidden = kind !== "map";
    document.querySelector("#credential-name").textContent = options.name;
    document.querySelector("#credential-seal-text").textContent =
      kind === "credentials" ? "통과 확인" : "파견 승인";
    const avatar = document.querySelector("#credential-portrait"),
      c = avatar.getContext("2d");
    c.clearRect(0, 0, avatar.width, avatar.height);
    c.drawImage(options.avatar, 0, 0);
    document.querySelector("#event-title").textContent =
      definitions[kind].title;
    next.textContent = kind === "map" ? "E · 접기" : "E · 넘기기";
    routePath.style.strokeDasharray = String(state.routeLength);
    fit();
  }
  function play() {
    if (!state) return;
    state.started = true;
    state.inputAfter = performance.now() + 180;
    previous = performance.now();
    // Reduced motion still gets a short held final view and one quiet cue.
    if (!motion()) {
      render(true);
      gameAudio.sfx(
        state.kind === "stamp"
          ? "stamp"
          : state.kind === "credentials"
            ? "admitted"
            : "paper",
      );
    }
    request = requestAnimationFrame(tick);
    next.focus({ preventScroll: true });
  }
  function finish() {
    if (!state || !state.started || state.finishing) return;
    // A touch that advanced the previous line can emit a compatibility click
    // onto the newly revealed footer. Arm skipping after that same tap ends.
    if (performance.now() < state.inputAfter) return;
    state.finishing = true;
    cancelAnimationFrame(request);
    state.elapsed = definitions[state.kind].duration;
    render(true);
    commit();
    state.onFinish();
  }
  function hide() {
    cancelAnimationFrame(request);
    state = null;
    root.hidden = true;
    delete root.dataset.kind;
    delete root.dataset.progress;
  }
  next.addEventListener("click", finish);
  new ResizeObserver(fit).observe(document.querySelector("#game-screen"));
  return {
    prepare,
    play,
    finish,
    hide,
    get kind() {
      return state?.kind || null;
    },
  };
})();
