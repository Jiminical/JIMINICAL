// Small story moments share a prepared backdrop and a cancellable clock.
const eventScenes = (() => {
  const root = document.querySelector("#game-event");
  const stage = document.querySelector("#event-stage");
  const canvas = document.querySelector("#event-art"),
    context = canvas.getContext("2d");
  const fx = document.querySelector("#event-fx"),
    light = fx.getContext("2d");
  const paper = document.querySelector("#event-document");
  const seal = document.querySelector("#credential-seal");
  const stamp = document.querySelector("#event-stamper");
  const stampShadow = document.querySelector("#event-stamp-shadow");
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
      duration: 3.9,
      title: "의뢰 접수",
      before: "접수대 위로 모험가증이 밀려온다.",
      after: "쾅. 기사단의 파견 인장이 찍혔다.",
    },
    departure: {
      frame: 1,
      duration: 4.2,
      title: "동쪽 숲으로",
      before: "묵직한 문이 닫히고, 바퀴가 천천히 구르기 시작한다.",
      after: "제르디아의 소음이 뒤로 멀어진다.",
    },
    credentials: {
      frame: 2,
      duration: 3.8,
      title: "성역 검문소",
      before: "초록빛이 모험가증의 인장을 훑는다.",
      after: "신원 확인. 성역으로 들어가는 길이 열린다.",
    },
    map: {
      frame: 3,
      duration: 3.2,
      title: "낡은 여행 지도",
      before: "지도 위, 동쪽으로 이어진 길을 짚어 본다.",
      after: "제르디아에서 동쪽 숲을 지나, 그린스토아로.",
    },
  };
  let state = null,
    request = 0,
    previous = 0,
    propsImage;
  const wheel = document.createElement("canvas");
  wheel.width = wheel.height = 256;
  const sigil = document.createElement("canvas");
  sigil.width = sigil.height = 256;
  const motion = () =>
    !reduced.matches && !document.body.classList.contains("no-motion");
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
  const stampAt = 1.55;
  function prepareProps(image) {
    if (!image) return;
    propsImage = image;
    // These transparent props have separate bounds, preserving their proportions.
    for (const [target, bounds] of [
      [document.querySelector("#credential-paper"), [0, 24, 816, 464]],
      [stamp, [1000, 0, 320, 512]],
      [wheel, [142, 492, 512, 512]],
      [sigil, [896, 512, 512, 512]],
    ]) {
      const c = target.getContext("2d");
      c.clearRect(0, 0, target.width, target.height);
      c.imageSmoothingEnabled = false;
      c.drawImage(image, ...bounds, 0, 0, target.width, target.height);
    }
  }
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
      top = Math.min(62, Math.max(28, root.clientHeight * 0.08)),
      available = Math.max(1, root.clientHeight - 106 - top),
      ratio = state.kind === "map" ? 1.5 : 2.15;
    const fitted = Math.min(
        width - (state.kind === "map" ? 24 : 0),
        available * ratio,
      ),
      height = fitted / ratio;
    stage.style.width = fitted + "px";
    stage.style.height = height + "px";
    stage.style.left = (width - fitted) / 2 + "px";
    stage.style.top = top + (available - height) / 2 + "px";
    canvas.width = Math.max(
      1,
      Math.min(1200, Math.round(fitted * Math.min(devicePixelRatio || 1, 1.5))),
    );
    canvas.height = Math.max(1, Math.round((canvas.width * height) / fitted));
    fx.width = Math.min(960, Math.round(fitted));
    fx.height = Math.max(1, Math.round((fx.width * height) / fitted));
    state.paperScale = Math.max(
      0.1,
      Math.min(
        1,
        (height - 40) / paper.offsetHeight,
        (fitted - 40) / paper.offsetWidth,
      ),
    );
    render(true);
  }
  function backdrop(settings, progress, seconds, animated) {
    const image = state.atlas,
      sw = image.naturalWidth / 2,
      sh = image.naturalHeight / 2,
      sx = (settings.frame % 2) * sw,
      sy = Math.floor(settings.frame / 2) * sh;
    const departure = state.kind === "departure";
    const zoom =
      state.kind === "map" || !animated ? 1 : 1.025 + progress * 0.025;
    const scale = Math.max(canvas.width / sw, canvas.height / sh) * zoom;
    const focus = departure ? 400 : sw / 2;
    const cameraX = Math.max(
      0,
      Math.min(sw - canvas.width / scale, focus - canvas.width / scale / 2),
    );
    const cameraY = (sh - canvas.height / scale) / 2;
    const jolt =
      animated && departure ? [0, -1, 0, 1][Math.floor(seconds * 18) % 4] : 0;
    context.imageSmoothingEnabled = false;
    context.save();
    context.scale(scale, scale);
    context.translate(-cameraX, -cameraY);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    if (state.natureBackdrop)
      livingNature.draw(context,state.natureBackdrop,state.kind === "departure" ? "eventDeparture" : "eventCredentials",seconds,animated);
    if (departure && propsImage) {
      // The wheel is an independent transparent layer, anchored to the axle.
      // The camera travels with the carriage; ground-level dust trails behind.
      const moving = animated ? Math.max(0, seconds - 0.4) : 0;
      const angle =
        moving < 1.3 ? moving * moving * 0.42 : 0.71 + (moving - 1.3) * 1.09;
      context.fillStyle = "#16192166";
      context.fillRect(258, 443, 290, 5);
      context.fillRect(282, 448, 245, 4);
      context.save();
      context.translate(400, 247 + jolt);
      context.rotate(angle);
      context.drawImage(wheel, -208, -208, 416, 416);
      context.restore();
      if (animated && moving > 0.25) {
        for (let i = 0; i < 26; i++) {
          const age = (moving * 0.65 + i * 0.173) % 1;
          context.globalAlpha = (1 - age) * 0.38 * clamp(moving);
          context.fillStyle = i % 3 ? "#f2d3a0" : "#aa956b";
          const size = 2 + (i % 4) + age * 9;
          context.fillRect(
            Math.round(395 - age * (95 + i * 4)),
            Math.round(451 - Math.sin(age * Math.PI) * (8 + (i % 6))),
            size,
            Math.max(2, size / 2),
          );
        }
        context.globalAlpha = 1;
        // Close leaves pass faster than the distant treeline.
        for (let i = 0; i < 5; i++) {
          const x = sw - ((moving * 205 + i * 211) % (sw + 160));
          context.fillStyle = i % 2 ? "#223f32c4" : "#527347ab";
          context.fillRect(Math.round(x), 493 + (i % 3) * 5, 26 + i * 5, 12);
          context.fillRect(Math.round(x + 8), 487 + (i % 3) * 5, 17, 7);
        }
      }
    }
    context.restore();
    // Restrained edge shade leaves the subject and paper in warm light.
    const shade = context.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.45,
      canvas.width * 0.12,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.65,
    );
    shade.addColorStop(0, "#07101900");
    shade.addColorStop(
      1,
      state.kind === "credentials" ? "#061c254a" : "#130f214f",
    );
    context.fillStyle = shade;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  function effects(seconds, animated, landed) {
    const w = fx.width,
      h = fx.height;
    light.clearRect(0, 0, w, h);
    const ratio = w / stage.clientWidth;
    const pw = paper.offsetWidth * state.paperScale * ratio;
    const ph = paper.offsetHeight * state.paperScale * ratio;
    const x = w / 2 + pw * 0.27,
      y = h / 2 + ph * 0.28 - pw * 0.12;
    if (
      state.kind === "stamp" &&
      animated &&
      landed &&
      seconds < stampAt + 0.5
    ) {
      const age = (seconds - stampAt) / 0.5;
      light.globalAlpha = (1 - age) * 0.65;
      for (let i = 0; i < 22; i++) {
        const a = i * 2.399;
        const radius = pw * (0.08 + age * (0.08 + (i % 4) * 0.014));
        light.fillStyle = i % 4 ? "#854334" : "#ffedc1";
        light.fillRect(
          Math.round(x + Math.cos(a) * radius),
          Math.round(y + Math.sin(a) * radius * 0.65 + age * age * 12),
          (i % 3) + 1,
          (i % 2) + 1,
        );
      }
    }
    if (state.kind === "credentials") {
      const opening = ease((seconds - 0.25) / 0.65);
      const closing = 1 - ease((seconds - 2.05) / 0.7);
      const amount = animated ? opening * closing : 0;
      const r = Math.min(pw * 0.29, h * 0.3);
      light.save();
      light.globalCompositeOperation = "lighter";
      light.globalAlpha = amount * 0.85;
      light.translate(w / 2, h / 2 - ph * 0.06);
      light.rotate(animated ? Math.floor(seconds * 12) * 0.006 : 0);
      light.shadowColor = "#91ffbb";
      light.shadowBlur = 12;
      light.drawImage(sigil, -r, -r, r * 2, r * 2);
      light.restore();
      if (animated) {
        const release = clamp((seconds - 1.85) / 0.85);
        for (let i = 0; i < 24; i++) {
          const a = i * 2.399 + seconds * 0.24;
          const radius = r * (0.6 + (i % 5) * 0.16 + release * 0.7);
          light.globalAlpha = Math.max(
            amount * 0.75,
            (1 - release) * clamp((seconds - 1.7) / 0.2),
          );
          light.fillStyle = i % 3 ? "#b1e9b2" : "#f1ffe1";
          light.fillRect(
            Math.round(w / 2 + Math.cos(a) * radius),
            Math.round(h / 2 + Math.sin(a) * radius * 0.65 - release * 22),
            (i % 3) + 1,
            (i % 3) + 1,
          );
        }
      }
      if (landed) {
        light.globalAlpha = animated
          ? clamp((seconds - 1.85) / 0.4) * 0.8
          : 0.55;
        light.strokeStyle = "#ceefc7";
        light.lineWidth = 2;
        light.beginPath();
        light.moveTo(x - pw * 0.034, y);
        light.lineTo(x - pw * 0.012, y + pw * 0.023);
        light.lineTo(x + pw * 0.04, y - pw * 0.034);
        light.stroke();
      }
    }
    if (state.kind === "map") {
      const progress = clamp(seconds / 2.4);
      const point = routePath.getPointAtLength(progress * state.routeLength);
      const px = (point.x / 1000) * w,
        py = (point.y / 666) * h;
      light.globalAlpha = 0.9;
      light.fillStyle = "#faf0bd";
      light.fillRect(Math.round(px - 3), Math.round(py - 3), 6, 6);
      light.fillStyle = "#a24336";
      light.fillRect(Math.round(px - 1), Math.round(py - 1), 2, 2);
    }
    light.globalAlpha = 1;
  }
  function render(quiet = false) {
    if (!state) return;
    const settings = definitions[state.kind],
      animated = motion();
    const seconds = animated ? state.elapsed : settings.duration;
    const progress = clamp(seconds / settings.duration);
    root.dataset.progress = progress.toFixed(3);
    const frameTime = animated ? Math.floor(seconds * 24) / 24 : seconds;
    backdrop(settings, progress, frameTime, animated);
    const impactAt = state.kind === "stamp" ? stampAt : 1.85;
    const landed = seconds >= impactAt;
    if (state.started && landed) commit();
    const sinceStamp = seconds - stampAt;
    const jolt =
      animated && state.kind === "stamp" && sinceStamp >= 0 && sinceStamp < 0.25
        ? [0, 3, -2, 2, -1, 0][Math.min(5, Math.floor(sinceStamp * 24))]
        : 0;
    const entry = animated ? ease(seconds / 0.65) : 1;
    const room = Math.max(
      0,
      stage.clientHeight - paper.offsetHeight * state.paperScale,
    );
    const drop = (1 - entry) * Math.min(14, room / 6);
    const tilt = state.kind === "stamp" ? -1.2 : 1;
    paper.style.transform = `translate(0, ${Math.round(drop + jolt)}px) rotate(${tilt - (1 - entry) * 1.5}deg) scale(${state.paperScale})`;
    seal.style.opacity = String(
      landed ? (animated ? clamp((seconds - impactAt) / 0.07) : 1) : 0,
    );
    seal.style.transform = `rotate(-13deg) scale(${landed && animated ? 1 + Math.max(0, impactAt + 0.18 - seconds) * 0.2 : 1})`;
    const handVisible =
      state.kind === "stamp" && seconds > 0.45 && seconds < 2.65 && animated;
    stamp.style.opacity = handVisible
      ? String(ease((seconds - 0.45) / 0.2))
      : "0";
    let travel = -125;
    if (seconds < 0.95) travel = -160 + ease((seconds - 0.45) / 0.5) * 65;
    else if (seconds < 1.25) travel = -95 - ease((seconds - 0.95) / 0.3) * 30;
    else if (seconds < stampAt)
      travel = -125 * (1 - Math.pow(clamp((seconds - 1.25) / 0.3), 3));
    else if (seconds < 1.72)
      travel = -8 * Math.sin(clamp((seconds - stampAt) / 0.17) * Math.PI);
    else travel = -ease((seconds - 1.95) / 0.7) * 290;
    const handScale = paper.offsetWidth / 660;
    stamp.style.transform = `translateY(${Math.round(travel * handScale)}px) rotate(-8deg)`;
    stampShadow.style.opacity = handVisible
      ? String(clamp(1 + travel / 190) * 0.32)
      : "0";
    stampShadow.style.transform = `rotate(-8deg) scale(${0.65 + clamp(1 + travel / 190) * 0.35})`;
    scan.style.opacity =
      state.kind === "credentials" &&
      seconds > 0.35 &&
      seconds < 1.85 &&
      animated
        ? "0.85"
        : "0";
    scan.style.left = 9 + clamp((seconds - 0.35) / 1.5) * 82 + "%";
    impact.style.opacity =
      animated && state.kind === "stamp"
        ? String(
            Math.max(0, 1 - Math.abs(seconds - stampAt - 0.025) / 0.075) * 0.18,
          )
        : "0";
    routePath.style.strokeDashoffset = String(
      (1 - clamp(seconds / 2.4)) * state.routeLength,
    );
    destination.style.opacity = String(clamp((seconds - 2.0) / 0.4));
    effects(frameTime, animated, landed);
    setCaption(seconds > impactAt ? settings.after : settings.before);
    if (state.started) {
      cue(
        "paper",
        0,
        state.kind === "departure" ? "door" : "paper",
        seconds,
        quiet,
      );
      if (state.kind === "stamp") {
        cue("impact", stampAt, "stamp", seconds, quiet);
        cue("success", 2.05, "registered", seconds, quiet);
      }
      if (state.kind === "departure") {
        cue("wheel1", 0.6, "wheel", seconds, quiet);
        cue("wheel2", 1.6, "wheel", seconds, quiet);
        cue("wheel3", 2.6, "wheel", seconds, quiet);
        cue("wheel4", 3.6, "wheel", seconds, quiet);
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
    prepareProps(options.props || propsImage);
    if (["departure","credentials"].includes(kind)) {
      const image=state.atlas,sw=image.naturalWidth/2,sh=image.naturalHeight/2,
        frame=definitions[kind].frame,backdrop=document.createElement("canvas");
      backdrop.width=sw;backdrop.height=sh;
      backdrop.getContext("2d").drawImage(image,(frame%2)*sw,Math.floor(frame/2)*sh,sw,sh,0,0,sw,sh);
      state.natureBackdrop=backdrop;
      livingNature.prepare(backdrop,kind === "departure" ? "eventDeparture" : "eventCredentials");
    }
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
