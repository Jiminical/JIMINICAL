// A self-contained opening journey. Each room uses a 720 × 480 pixel world.
const guildGame = (() => {
  const root = document.querySelector("#game-screen");
  const canvas = document.querySelector("#guild-world");
  const ctx = canvas.getContext("2d");
  const assets = document.querySelector("#guild-assets");
  const portrait = document.querySelector("#dialogue-portrait");
  const portraitFrame = document.querySelector("#dialogue-portrait-frame");
  const portraitContext = portrait.getContext("2d");
  const dialogueBox = document.querySelector("#game-dialogue");
  const dialogueText = document.querySelector("#game-dialogue-glyphs");
  const dialogueLive = document.querySelector("#game-dialogue-live");
  const speakerLabel = document.querySelector("#game-speaker");
  const nextLabel = document.querySelector("#game-dialogue-next");
  const vista = document.querySelector("#game-vista");
  const vistaArt = document.querySelector("#vista-art");
  const vistaContext = vistaArt.getContext("2d");
  let cinematic = null,
    portraitAnimation;
  const choicesBox = document.querySelector("#game-choices");
  const menu = document.querySelector("#guild-menu");
  const itemList = document.querySelector("#guild-item-list");
  const itemDetail = document.querySelector("#guild-item-detail");
  const objective = document.querySelector("#game-objective");
  const menuButton = document.querySelector("#guild-menu-open");
  const prompt = document.querySelector("#game-interaction");
  const keys = new Set();
  const W = 720,
    H = 480;
  let wallBounds = { left: 32, right: 688, top: 178, bottom: 446 };
  const guildCollisions = [
    { x: 0, y: 422, w: 300, h: 58 },
    { x: 414, y: 422, w: 306, h: 58 },
    { x: 230, y: 123, w: 260, h: 36 },
    { x: 10, y: 132, w: 47, h: 92 },
    { x: 84, y: 250, w: 151, h: 58 },
    { x: 90, y: 394, w: 82, h: 20 },
    { x: 510, y: 269, w: 98, h: 61 },
    { x: 650, y: 145, w: 55, h: 89 },
    { x: 662, y: 253, w: 43, h: 92 },
    ...[
      [108, 228],
      [173, 228],
      [108, 326],
      [179, 326],
      [545, 263],
      [545, 344],
    ].map(([x, y]) => ({ x, y, w: 22, h: 15 })),
    ...[233, 295, 361].flatMap((y) => [
      { x: 311, y, w: 6, h: 7 },
      { x: 403, y, w: 6, h: 7 },
    ]),
  ];
  const cast = {
    hero: {
      name: "",
      portrait: 0,
      coat: "#465563",
      trim: "#829398",
      hair: "#303a45",
      skin: "#000000",
    },
    lucy: {
      name: "루시",
      portrait: "lucy",
      coat: "#eee9df",
      trim: "#c4c7cf",
      hair: "#bec58b",
      skin: "#f3c9b1",
    },
    bran: {
      name: "브란",
      portrait: 1,
      coat: "#795b43",
      trim: "#b58d61",
      hair: "#9a4f36",
      skin: "#d6a380",
    },
    mia: {
      name: "미아",
      portrait: 2,
      coat: "#526845",
      trim: "#a2ae78",
      hair: "#775038",
      skin: "#ebbb93",
    },
    nara: {
      name: "나라",
      portrait: 3,
      coat: "#414e68",
      trim: "#9aabc0",
      hair: "#ded7bd",
      skin: "#e8c3a3",
    },
    tobin: {
      name: "토빈",
      portrait: 4,
      coat: "#52624c",
      trim: "#b2ac81",
      hair: "#875038",
      skin: "#d7a67e",
    },
    leon: {
      name: "레온",
      portrait: 5,
      coat: "#4b4b6c",
      trim: "#bca86c",
      hair: "#353b53",
      skin: "#e1bea3",
    },
    rogue: {
      name: "노란 머리 도적",
      portrait: 6,
      coat: "#30333d",
      trim: "#8c929e",
      hair: "#ecd16e",
      skin: "#e1ac87",
    },
    scout: {
      name: "카니아",
      portrait: 7,
      coat: "#355e53",
      trim: "#b0b88c",
      hair: "#b9d79f",
      skin: "#edd3bc",
    },
  };
  const pictures = {};
  function loadPicture(key, src) {
    const image = new Image();
    image.src = src;
    pictures[key] = image;
    return image.decode();
  }
  const ready = Promise.all([
    loadPicture("lucy", assets.dataset.lucySrc),
    loadPicture("cast", assets.dataset.castSrc),
    loadPicture("kania", assets.dataset.kaniaSrc),
    loadPicture("rogue", assets.dataset.rogueSrc),
    ...[
      "guild",
      "carriage",
      "checkpoint",
      "gate",
      "forest",
      "sanctuary",
      "events",
      "eventProps",
    ].map((key) => loadPicture(key, assets.dataset[key + "Src"])),
  ]);
  // Attach rejection handling before a player chooses to enter the room.
  ready.catch(() => {});
  let active = false,
    phase = "idle",
    request = 0,
    previous = 0,
    elapsed = 0;
  let inputLocked = true;
  let location = "guild",
    storyStep = "lucy";
  let transitionSerial = 0,
    transitionAnimation;
  const transition = document.querySelector("#game-transition");
  let player,
    npcs = [],
    playerName = "",
    onExit,
    dialogue = null;
  let questAccepted = false,
    inventory = [],
    hp = 18,
    coins = 18;
  let menuTab = "items",
    selectedItem = 0,
    selectedChoice = 0;
  let typingTimer = 0,
    toastTimer = 0;
  let footDistance = 0;
  const background = document.createElement("canvas");
  background.width = W;
  background.height = H;
  const map = background.getContext("2d");
  const spriteBank = new Map();
  const portraitFrames = new Map();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motion = () =>
    !reduced.matches && !document.body.classList.contains("no-motion");
  const rect = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const hash = (x, y) => (((x * 41 + y * 73 + 29) % 17) + 17) % 17;

  function panel(c, x, y, w, h, fill, edge = "#332932") {
    rect(c, x, y, w, h, edge);
    rect(c, x + 2, y + 2, w - 4, h - 4, fill);
    rect(c, x + 3, y + 3, w - 6, 1, "#b88d5e");
  }
  const placeNames = {
    guild: ["제르디아 왕국", "모험가 길드"],
    carriage: ["제르디아 기사단 파견 마차", "동쪽 숲길"],
    checkpoint: ["그린스토아 외곽", "성역 검문소"],
    gate: ["이종족연합국 그린스토아", "어머니 나무의 품 아래"],
  };
  const fieldCollisions = {
    carriage: [
      { x: 90, y: 220, w: 110, h: 150 },
      { x: 520, y: 220, w: 110, h: 150 },
    ],
    checkpoint: [
      { x: 0, y: 0, w: 136, h: 480 },
      { x: 632, y: 0, w: 88, h: 480 },
      { x: 100, y: 140, w: 155, h: 135 },
      { x: 270, y: 115, w: 55, h: 148 },
      { x: 540, y: 160, w: 140, h: 120 },
      { x: 0, y: 416, w: 270, h: 64 },
      { x: 455, y: 420, w: 265, h: 60 },
    ],
    gate: [
      { x: 40, y: 130, w: 260, h: 115 },
      { x: 430, y: 130, w: 250, h: 115 },
      { x: 0, y: 416, w: 215, h: 64 },
      { x: 510, y: 421, w: 210, h: 59 },
    ],
  };
  function buildMap() {
    const bounds = {
      guild: { left: 32, right: 688, top: 178, bottom: 446 },
      carriage: { left: 210, right: 510, top: 252, bottom: 418 },
      checkpoint: { left: 136, right: 632, top: 204, bottom: 446 },
      gate: { left: 135, right: 585, top: 258, bottom: 446 },
    };
    wallBounds = bounds[location];
    const art = pictures[location];
    map.imageSmoothingEnabled = false;
    map.clearRect(0, 0, W, H);
    // The map paintings share a 3:2 composition. Uniform fitting preserves every
    // architectural proportion; actors and collisions use the same world coordinates.
    const scale = Math.min(W / art.naturalWidth, H / art.naturalHeight);
    rect(map, 0, 0, W, H, "#121d26");
    map.drawImage(
      art,
      0,
      0,
      art.naturalWidth,
      art.naturalHeight,
      (W - art.naturalWidth * scale) / 2,
      (H - art.naturalHeight * scale) / 2,
      art.naturalWidth * scale,
      art.naturalHeight * scale,
    );
    document.querySelector(".game-place").textContent = placeNames[location][0];
    document.querySelector(".game-hud strong").textContent =
      placeNames[location][1];
    root.dataset.location = location;
    gameAudio.scene(location);
    root.setAttribute("aria-label", placeNames[location].join(" · "));
    canvas.setAttribute(
      "aria-label",
      placeNames[location][1] +
        ". WASD 이동, 왼쪽 Shift 달리기, E 상호작용, C 메뉴.",
    );
  }
  function drawScenery() {
    if (!motion()) return;
    const frame = Math.floor(elapsed * 8);
    // Sparse individual pollen/dust pixels leave the environment painting legible.
    for (let i = 0; i < 8; i++) {
      const x = (93 + i * 79 + Math.floor(frame / 7)) % W;
      const y = (147 + i * 43 - Math.floor(frame / 5) + H * 100) % H;
      ctx.globalAlpha = 0.18 + ((frame + i * 5) % 24) / 100;
      rect(
        ctx,
        x,
        y,
        i % 3 === 0 ? 2 : 1,
        1,
        location === "guild" ? "#f0cd91" : "#e4edbd",
      );
    }
    ctx.globalAlpha = 1;
  }
  function hideVista() {
    cinematic = null;
    vista.hidden = true;
    vista.classList.remove("is-sanctuary");
    delete vista.dataset.pan;
    root.classList.remove("is-vista");
    delete root.dataset.vista;
    document.querySelector(".world-viewport").inert = false;
  }
  async function transitionTo(prepare, after) {
    const token = ++transitionSerial;
    phase = "transition";
    root.dataset.phase = phase;
    keys.clear();
    dialogueBox.hidden = true;
    prompt.hidden = true;
    menu.hidden = true;
    cancelPortraitMotion();
    gameAudio.stopVoice();
    clearTimeout(typingTimer);
    clearTimeout(toastTimer);
    document.querySelector("#game-toast").hidden = true;
    dialogue = null;
    transition.hidden = false;
    const fade = async (from, to) => {
      if (!motion()) {
        transition.style.opacity = String(to);
        return token === transitionSerial && active;
      }
      transitionAnimation = transition.animate(
        [{ opacity: from }, { opacity: to }],
        { duration: 460, fill: "forwards", easing: "ease-in-out" },
      );
      await transitionAnimation.finished.catch(() => {});
      if (token !== transitionSerial || !active) return false;
      transition.style.opacity = String(to);
      transitionAnimation.cancel();
      return true;
    };
    if (!(await fade(0, 1))) return;
    prepare();
    if (!(await fade(1, 0))) return;
    transition.hidden = true;
    phase = "free";
    root.dataset.phase = phase;
    if (after) after();
  }
  function travelTo(destination, setup, after) {
    return transitionTo(() => {
      hideVista();
      hideEvent();
      location = destination;
      setup();
      buildMap();
      updateObjective();
      drawWorld();
    }, after);
  }
  function hideEvent() {
    eventScenes.hide();
    root.classList.remove("is-event");
    document.querySelector(".world-viewport").inert = false;
  }
  function showEvent(kind, options = {}) {
    return transitionTo(
      () => {
        hideVista();
        root.classList.add("is-event");
        document.querySelector(".world-viewport").inert = true;
        eventScenes.prepare(kind, {
          atlas: pictures.events,
          props: pictures.eventProps,
          name: playerName,
          avatar: makeSprite("hero", "down", 0),
          onImpact: options.onImpact,
          onFinish: () => {
            if (options.destination)
              return travelTo(
                options.destination,
                options.setup,
                options.after,
              );
            return transitionTo(() => {
              hideEvent();
              drawWorld();
            }, options.after);
          },
        });
      },
      () => {
        phase = "event";
        root.dataset.phase = phase;
        eventScenes.play();
      },
    );
  }
  const vistas = {
    forest: {
      kicker: "제르디아 동쪽 · 성역으로 향하는 길",
      title: "숲이 깊어질수록",
      text: "바퀴 소리가 물소리에 묻혔다.\n끝을 가늠할 수 없는 나무들이 길 위로 그늘을 드리웠다.",
    },
    sanctuary: {
      kicker: "어머니 나무의 품 아래",
      title: "이종족연합국\n그린스토아",
      text: "수없이 많은 종족이\n하나의 이름 아래 살아가는 성역",
    },
  };
  function showVista(key, after) {
    return transitionTo(
      () => {
        cinematic = { key, after, started: null, frame: -1, revealed: false };
        vista.classList.toggle("is-sanctuary", key === "sanctuary");
        const art = pictures[key],
          ratio = art.naturalWidth / art.naturalHeight;
        vistaArt.width = Math.min(960, art.naturalWidth);
        vistaArt.height = Math.round(vistaArt.width / ratio);
        vista.style.setProperty("--vista-ratio", String(ratio));
        document.querySelector("#vista-kicker").textContent =
          vistas[key].kicker;
        document.querySelector("#vista-title").textContent = vistas[key].title;
        document.querySelector("#vista-caption").textContent = vistas[key].text;
        for (const id of ["vista-kicker", "vista-title", "vista-caption"])
          document.querySelector("#" + id).style.removeProperty("opacity");
        document.querySelector("#vista-next").textContent = "E · 계속";
        root.dataset.vista = key;
        root.classList.add("is-vista");
        vista.hidden = false;
        document.querySelector(".world-viewport").inert = true;
        fitVista();
        drawVista();
      },
      () => {
        cinematic.started = elapsed;
        phase = "vista";
        root.dataset.phase = phase;
        if (key === "sanctuary") gameAudio.sfx("sanctuary");
        document.querySelector("#vista-next").focus({ preventScroll: true });
      },
    );
  }
  function fitVista() {
    if (root.hidden || vista.hidden || !cinematic) return;
    if (cinematic.key === "sanctuary") {
      const holder = document.querySelector(".vista-image");
      holder.style.width = "100%";
      holder.style.height = "100%";
      vistaArt.width = Math.max(
        1,
        Math.min(
          1440,
          Math.round(vista.clientWidth * Math.min(devicePixelRatio || 1, 1.5)),
        ),
      );
      vistaArt.height = Math.max(
        1,
        Math.round(
          (vistaArt.width * vista.clientHeight) /
            Math.max(1, vista.clientWidth),
        ),
      );
      cinematic.frame = -1;
      drawVista();
      return;
    }
    const style = getComputedStyle(vista),
      copy = document.querySelector(".vista-copy");
    const innerWidth =
      vista.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const innerHeight =
      vista.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
    const gap = parseFloat(style.gap),
      row = style.flexDirection === "row";
    const ratio =
      pictures[cinematic.key].naturalWidth /
      pictures[cinematic.key].naturalHeight;
    const availableWidth = row
      ? innerWidth - copy.getBoundingClientRect().width - gap
      : innerWidth;
    const availableHeight = row
      ? innerHeight
      : innerHeight - copy.getBoundingClientRect().height - gap;
    const width = Math.max(
      1,
      Math.min(availableWidth, availableHeight * ratio),
    );
    const holder = document.querySelector(".vista-image");
    holder.style.width = width + "px";
    holder.style.height = width / ratio + "px";
  }
  function drawVista() {
    if (!cinematic) return;
    const seconds =
      cinematic.started === null ? 0 : Math.max(0, elapsed - cinematic.started);
    if (cinematic.key === "sanctuary") {
      drawSanctuary(seconds);
      return;
    }
    const frame = motion() ? Math.floor(seconds * 12) : 0;
    if (frame === cinematic.frame) return;
    cinematic.frame = frame;
    const art = pictures[cinematic.key],
      t = motion() ? Math.min(1, seconds / 18) : 0;
    const zoom = motion() ? 1.025 : 1;
    const sw = art.naturalWidth / zoom,
      sh = art.naturalHeight / zoom;
    vistaContext.imageSmoothingEnabled = false;
    vistaContext.drawImage(
      art,
      Math.floor((art.naturalWidth - sw) * (0.2 + 0.6 * t)),
      Math.floor((art.naturalHeight - sh) * (0.65 - 0.3 * t)),
      sw,
      sh,
      0,
      0,
      vistaArt.width,
      vistaArt.height,
    );
    if (motion())
      for (let i = 0; i < 10; i++) {
        const x = (i * 113 + Math.floor(frame / 3)) % vistaArt.width;
        const y =
          (i * 79 - Math.floor(frame / 5) + vistaArt.height * 100) %
          vistaArt.height;
        vistaContext.globalAlpha = 0.18 + ((frame + i * 7) % 28) / 100;
        rect(vistaContext, x, y, 1 + (i % 2), 1, "#f0edbf");
      }
    vistaContext.globalAlpha = 1;
  }
  function drawSanctuary(seconds) {
    if (!motion()) cinematic.revealed = true;
    const complete = cinematic.revealed || seconds >= 32;
    const frame = complete ? "complete" : Math.floor(seconds * 24);
    if (frame === cinematic.frame) return;
    cinematic.frame = frame;
    const progress = complete ? 1 : Math.min(1, seconds / 32);
    const ease = progress * progress * (3 - 2 * progress);
    const art = pictures.sanctuary;
    // One tall painting, uniformly scaled. Keep at least half a screen of vertical
    // travel on portrait phones as well as on wide desktop displays.
    const scale = Math.max(
      vistaArt.width / art.naturalWidth,
      (vistaArt.height * 1.5) / art.naturalHeight,
    );
    const sw = vistaArt.width / scale,
      sh = vistaArt.height / scale;
    vistaContext.imageSmoothingEnabled = false;
    vistaContext.drawImage(
      art,
      (art.naturalWidth - sw) / 2,
      Math.min(
        art.naturalHeight - sh,
        Math.round((art.naturalHeight - sh) * ease),
      ),
      sw,
      sh,
      0,
      0,
      vistaArt.width,
      vistaArt.height,
    );
    vista.dataset.pan = progress.toFixed(3);
    const cue = (start, end) =>
      complete
        ? 0
        : Math.max(
            0,
            Math.min(1, (seconds - start) / 1.6, (end - seconds) / 1.6),
          );
    document.querySelector("#vista-kicker").style.opacity = String(cue(2, 10));
    document.querySelector("#vista-caption").style.opacity = String(cue(9, 17));
    document.querySelector("#vista-title").style.opacity = String(
      complete ? 1 : Math.max(0, Math.min(1, (seconds - 17) / 2.5)),
    );
    document.querySelector("#vista-next").textContent = complete
      ? "E · 성역으로"
      : "E · 연출 모두 보기";
  }
  function finishVista() {
    if (!active || inputLocked || phase !== "vista" || !cinematic) return;
    keys.clear();
    if (
      cinematic.key === "sanctuary" &&
      motion() &&
      !cinematic.revealed &&
      elapsed - cinematic.started < 32
    ) {
      cinematic.revealed = true;
      cinematic.frame = -1;
      drawVista();
      return;
    }
    cinematic.after();
  }
  function resumeWorld(after) {
    return transitionTo(
      () => {
        hideVista();
        drawWorld();
      },
      () => {
        canvas.focus({ preventScroll: true });
        if (after) after();
      },
    );
  }

  // 44 × 60 SD cels add hair, cloth and equipment detail at a shared foot anchor.
  function makeSprite(kind, direction, frame) {
    const key = kind + direction + frame;
    if (spriteBank.has(key)) return spriteBank.get(key);
    const image = document.createElement("canvas");
    image.width = 44;
    image.height = 60;
    const c = image.getContext("2d"),
      p = cast[kind];
    const bob = frame % 2,
      step = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    const q = (x, y, w, h, color) => rect(c, x, y + bob, w, h, color);
    const side = direction === "left" ? -3 : direction === "right" ? 3 : 0;
    const front = direction !== "up",
      ink = "#232634";
    // Separate feet and trousers keep the four walking cels legible.
    for (const [x, offset] of [
      [13, step],
      [25, -step],
    ]) {
      rect(c, x, 46 + Math.max(0, offset), 7, 10 - Math.max(0, offset), ink);
      rect(c, x + 1, 47 + Math.max(0, offset), 4, 5, "#4c4650");
      rect(c, x - 1, 54 + Math.min(0, offset), 9, 3, "#332e32");
      rect(c, x, 54 + Math.min(0, offset), 6, 1, "#957350");
    }
    if (kind === "hero") {
      q(10, 23, 25, 25, "#243142");
      q(7, 32, 31, 16, "#293b50");
      q(10, 29, 25, 17, "#4d6375");
      q(11, 31, 3, 13, "#80939c");
      q(16, 31, 3, 16, "#3c5065");
      q(28, 32, 4, 14, "#304355");
      q(9, 45, 28, 3, "#1f2e3e");
      q(11, 45, 5, 1, "#a7afa7");
      q(13, 5, 19, 3, "#455969");
      q(9, 8, 27, 20, "#354b5e");
      q(11, 7, 23, 22, "#607788");
      q(14, 7, 14, 2, "#91a5ac");
      q(10, 13, 3, 13, "#41566b");
      q(32, 13, 3, 12, "#2e4055");
      if (front) {
        q(14 + side, 12, 17, 15, "#14202b");
        q(16 + side, 13, 12, 12, "#080e17");
        q(13 + side, 12, 3, 11, "#99a6ab");
        q(16 + side, 11, 12, 2, "#7c929d");
      } else {
        q(17, 10, 2, 13, "#7c919a");
        q(19, 22, 11, 3, "#4b6177");
      }
      q(10, 27, 25, 4, "#81949c");
      q(16, 29, 4, 10, "#566f7d");
      q(22, 30, 3, 3, "#d9c189");
      q(13, 34, 20, 2, "#967550");
      q(29, 38, 9, 10, "#a58254");
      q(30, 39, 7, 2, "#d6b37b");
      q(32, 43, 3, 2, "#43352e");
      q(8, 38, 4, 7, "#2b303b");
    } else {
      const longHair = ["lucy", "mia", "nara", "scout"].includes(kind);
      if (longHair) {
        q(9, 13, 27, 24, p.hair);
        q(33, 20, 5, 21, p.hair);
        q(35, 23, 2, 15, "#7e8c72");
        q(10, 20, 2, 14, "#8e9874");
      }
      q(10, 29, 25, 19, ink);
      q(11, 30, 23, 16, p.coat);
      q(7, 32, 6, 14, p.coat);
      q(32, 32, 6, 14, p.coat);
      q(9, 32, 2, 11, p.trim);
      q(33, 33, 2, 10, p.trim);
      q(14, 30, 3, 15, p.trim);
      q(28, 30, 2, 15, p.trim);
      q(12, 46, 22, 2, "#302f3a");
      q(7, 44, 5, 3, "#33313c");
      q(34, 44, 5, 3, "#33313c");
      // Stepped hair silhouette, highlights and individual bangs.
      q(14, 5, 18, 3, p.hair);
      q(10, 8, 26, 17, p.hair);
      q(12, 7, 22, 3, kind === "lucy" ? "#d5d5a8" : p.trim);
      q(16, 7, 10, 2, "#ded3ad");
      if (front) {
        q(13 + side, 12, 18, 15, p.skin);
        q(15 + side, 25, 14, 3, p.skin);
        q(13 + side, 11, 19, 5, p.hair);
        q(12 + side, 13, 4, 10, p.hair);
        q(20 + side, 14, 3, 3, p.hair);
        q(28 + side, 13, 3, 6, p.hair);
        const eyes =
          kind === "lucy"
            ? "#95537f"
            : kind === "scout"
              ? "#397c78"
              : "#343644";
        q(17 + side, 20, 3, 3, "#faf1df");
        q(18 + side, 20, 2, 3, eyes);
        q(17 + side, 19, 4, 1, ink);
        if (direction === "down") {
          q(27, 20, 3, 3, "#faf1df");
          q(27, 20, 2, 3, eyes);
          q(26, 19, 4, 1, ink);
        }
        q(23 + side, 24, 2, 1, "#cc9786");
        q(21 + side, 27, 4, 1, "#ac786d");
      } else {
        q(16, 12, 2, 11, p.trim);
        q(27, 14, 2, 10, p.trim);
      }
      if (kind === "lucy") {
        q(19, 30, 8, 15, "#eee9dd");
        q(19, 31, 3, 3, "#8c65a1");
        q(24, 31, 4, 3, "#563e76");
        q(22, 33, 3, 7, "#6e4d8b");
        q(23, 40, 1, 1, "#9ea6b4");
        q(23, 43, 1, 1, "#9ea6b4");
        q(34, 30, 4, 9, p.hair);
        q(33, 33, 2, 7, "#d6d5a9");
        q(15, 43, 16, 5, "#5d423c");
        q(16, 43, 14, 1, "#c6a477");
      }
      if (kind === "bran") {
        q(12, 29, 23, 4, "#a65f50");
        q(15, 32, 4, 8, "#c17d5e");
        if (front) {
          q(16 + side, 25, 4, 1, "#a97961");
          q(26 + side, 25, 3, 1, "#a97961");
        }
      }
      if (kind === "nara") {
        q(9, 2, 6, 10, p.hair);
        q(30, 2, 6, 10, p.hair);
        q(11, 4, 2, 5, "#bd8a8c");
        q(31, 4, 2, 5, "#bd8a8c");
        q(14, 29, 20, 4, "#6b91ad");
        q(18, 32, 4, 7, "#8bacbe");
        q(29, 41, 8, 7, "#886d4b");
      }
      if (kind === "mia") {
        for (let y = 17; y < 43; y += 4) {
          q(32, y, 5, 4, p.hair);
          q(33, y, 2, 1, "#ac8960");
        }
        q(33, 43, 3, 3, "#d6c183");
        q(15, 33, 18, 2, "#9b825a");
      }
      if (kind === "tobin") {
        q(9, 33, 28, 12, p.coat);
        if (front) {
          q(13, 23, 21, 12, p.hair);
          q(17, 34, 13, 4, p.hair);
          q(16, 24, 3, 8, "#b17650");
          q(27, 25, 2, 9, "#a96c45");
          q(18, 28, 11, 2, "#e0b98c");
          q(18, 35, 3, 2, "#d7ba70");
        }
        q(16, 40, 16, 2, "#b4a174");
      }
      if (kind === "leon") {
        if (front) {
          q(14 + side, 18, 9, 7, "#d6cebb");
          q(25 + side, 18, 9, 7, "#d6cebb");
          q(16 + side, 19, 5, 4, "#4a576c");
          q(27 + side, 19, 5, 4, "#4a576c");
          q(23 + side, 20, 2, 1, "#c7bfa7");
        }
        q(18, 30, 9, 4, "#a194ba");
        q(25, 39, 11, 8, "#60506f");
        q(26, 40, 8, 1, "#d2bb7d");
      }
      if (kind === "rogue") {
        q(9, 32, 8, 7, "#252832");
        q(29, 32, 9, 7, "#252832");
        for (const x of [8, 13, 30, 35]) q(x, 29, 2, 5, "#b4bbc4");
        q(17, 29, 14, 3, "#171d28");
        q(22, 31, 2, 2, "#bfc4ca");
        q(10, 8, 9, 10, "#c39179");
        q(11, 11, 2, 5, "#a67b6f");
        q(18, 4, 14, 4, p.hair);
        q(25, 7, 11, 5, p.hair);
        q(30, 11, 6, 6, p.hair);
        q(17, 3, 6, 2, "#fff0a4");
        q(25, 6, 7, 1, "#fff0a4");
        if (front) {
          q(10 + side, 19, 2, 2, "#d6dadd");
          q(11 + side, 23, 2, 1, "#e0e2e0");
        }
        q(15, 38, 2, 5, "#6f7280");
        q(28, 43, 7, 2, "#191f2a");
      }
      if (kind === "scout") {
        q(6, 17, 7, 4, p.skin);
        q(32, 17, 8, 4, p.skin);
        q(5, 16, 4, 2, p.skin);
        q(37, 15, 4, 3, p.skin);
        q(18, 1, 11, 5, p.hair);
        q(20, 0, 7, 2, "#d9e5b8");
        q(12, 29, 23, 5, "#315d4a");
        q(17, 33, 14, 12, "#79604a");
        q(17, 31, 4, 14, "#91b187");
        q(25, 32, 4, 4, "#b5e2d4");
        q(26, 33, 2, 2, "#3b9c8c");
        q(30, 29, 8, 6, "#b8c9c6");
        q(33, 31, 5, 5, "#718d91");
        q(32, 30, 3, 2, "#e1e7d6");
        q(8, 27, 3, 12, "#827455");
        q(9, 23, 1, 8, "#dce5ca");
      }
    }
    // Cache a crisp dark contour with a restrained light rim for floor contrast.
    const mask = document.createElement("canvas");
    mask.width = 44;
    mask.height = 60;
    const m = mask.getContext("2d");
    m.drawImage(image, 0, 0);
    m.globalCompositeOperation = "source-in";
    m.fillStyle = "#e3d3ac";
    m.fillRect(0, 0, 44, 60);
    const outlined = document.createElement("canvas");
    outlined.width = 44;
    outlined.height = 60;
    const o = outlined.getContext("2d");
    o.globalAlpha = 0.55;
    o.drawImage(mask, -1, -1);
    o.globalAlpha = 1;
    m.fillStyle = "#17202d";
    m.fillRect(0, 0, 44, 60);
    for (const [x, y] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ])
      o.drawImage(mask, x, y);
    o.drawImage(image, 0, 0);
    spriteBank.set(key, outlined);
    return outlined;
  }
  for (const kind of Object.keys(cast))
    for (const dir of ["up", "down", "left", "right"])
      for (let f = 0; f < 4; f++) makeSprite(kind, dir, f);

  function actor(id, x, y, dir = "down") {
    return { id, x, y, dir, moving: false };
  }
  function updateObjective() {
    objective.textContent =
      location === "carriage"
        ? "여정 · 동쪽 숲을 지나 성역으로"
        : location === "checkpoint"
          ? "카니아에게 모험가증을 보여 주자."
          : location === "gate"
            ? "어머니 나무의 품 아래, 그린스토아에 도착했다."
            : questAccepted
              ? "길드 출입문으로 나가 기사단의 마차에 타자."
              : "루시에게 그린스토아행 의뢰를 확인하자.";
  }
  function notify(text) {
    const toast = document.querySelector("#game-toast");
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2600);
  }
  function cancelPortraitMotion() {
    portraitAnimation?.cancel();
    portraitAnimation = undefined;
  }
  function reactPortrait(line, pulse = false) {
    if (!line.kind || !motion() || inputLocked || portrait.hidden) return;
    if (pulse && portraitAnimation?.playState === "running") return;
    cancelPortraitMotion();
    const height = pulse
      ? 2
      : line.kind === "rogue"
        ? 7
        : line.expression === "incredulous"
          ? 5
          : line.expression === "concerned"
            ? 2
            : 4;
    const rebound = pulse ? 1 : Math.max(1, Math.floor(height / 3));
    const cels = [
      [0, 0],
      [0.12, Math.ceil(height / 2)],
      [0.25, height],
      [0.4, Math.floor(height / 2)],
      [0.55, 0],
      [0.7, rebound],
      [0.85, 0],
      [1, 0],
    ];
    portraitAnimation = portrait.animate(
      cels.map(([offset, y]) => ({
        transform: `translate(0,-${y}px)`,
        offset,
        easing: "steps(1,end)",
      })),
      { duration: pulse ? 180 : 360, easing: "linear" },
    );
  }
  function portraitFor(kind, expression = "neutral") {
    portraitContext.clearRect(0, 0, portrait.width, portrait.height);
    portrait.hidden = !kind;
    portraitFrame.hidden = !kind;
    portrait.dataset.character = kind || "";
    portrait.dataset.expression = expression;
    if (!kind) return;
    const sheets = {
      lucy: {
        image: "lucy",
        columns: 3,
        rows: 2,
        // The hand-drawn gutters are slightly offset; keep every hair strand.
        columnEdges: [0, 530, 1038, 1536],
        poses: {
          neutral: 0,
          reading: 1,
          incredulous: 2,
          concerned: 3,
          weary: 4,
          soft: 5,
        },
      },
      scout: {
        image: "kania",
        columns: 3,
        rows: 2,
        poses: {
          neutral: 0,
          warning: 1,
          skeptical: 2,
          explaining: 3,
          welcoming: 4,
          flustered: 5,
        },
      },
      rogue: {
        image: "rogue",
        columns: 2,
        rows: 2,
        poses: { neutral: 0, boasting: 1, offended: 2, embarrassed: 3 },
      },
    };
    const sheet = sheets[kind] || { image: "cast", columns: 3, rows: 2 };
    const image = pictures[sheet.image],
      index = sheet.poses
        ? (sheet.poses[expression] ?? 0)
        : cast[kind].portrait;
    let cw = image.naturalWidth / sheet.columns,
      ch = image.naturalHeight / sheet.rows;
    let sx = (index % sheet.columns) * cw,
      sy = Math.floor(index / sheet.columns) * ch;
    if (sheet.columnEdges) {
      const column = index % sheet.columns;
      sx = sheet.columnEdges[column];
      cw = sheet.columnEdges[column + 1] - sx;
    }
    portrait.dataset.sheet = sheet.image;
    portrait.dataset.frame = String(index);
    const frameKey = kind + expression;
    if (!portraitFrames.has(frameKey)) {
      const sample = document.createElement("canvas");
      sample.width = Math.ceil(cw);
      sample.height = Math.ceil(ch);
      const c = sample.getContext("2d", { willReadFrequently: true });
      c.drawImage(image, sx, sy, cw, ch, 0, 0, cw, ch);
      const pixels = c.getImageData(0, 0, sample.width, sample.height).data;
      let l = sample.width,
        r = 0,
        t = sample.height,
        b = 0;
      for (let y = 0; y < sample.height; y++)
        for (let x = 0; x < sample.width; x++) {
          if (pixels[(y * sample.width + x) * 4 + 3] > 8) {
            l = Math.min(l, x);
            r = Math.max(r, x);
            t = Math.min(t, y);
            b = Math.max(b, y);
          }
        }
      if (r >= l)
        portraitFrames.set(frameKey, [
          sx + Math.max(0, l - 8),
          sy + Math.max(0, t - 4),
          Math.min(cw, r + 9) - Math.max(0, l - 8),
          Math.min(ch, b + 2) - Math.max(0, t - 4),
        ]);
      else portraitFrames.set(frameKey, [sx, sy, cw, ch]);
    }
    [sx, sy, cw, ch] = portraitFrames.get(frameKey);
    const scale = Math.min(
      (portrait.width - 12) / cw,
      (portrait.height - 12) / ch,
    );
    portraitContext.imageSmoothingEnabled = false;
    // Fit the full width of the portrait and remove only its transparent padding.
    portraitContext.drawImage(
      image,
      sx,
      sy,
      cw,
      ch,
      (portrait.width - cw * scale) / 2,
      portrait.height - ch * scale,
      cw * scale,
      ch * scale,
    );
  }
  function lineComplete() {
    if (!dialogue) return;
    dialogue.shown = dialogue.letters.length;
    dialogueText.textContent = dialogue.letters.join("");
    nextLabel.textContent =
      dialogue.index === dialogue.lines.length - 1 && dialogue.choices
        ? "E 선택"
        : "E 다음";
    if (dialogue.index === dialogue.lines.length - 1 && dialogue.choices)
      renderChoices();
  }
  function typeLetter() {
    if (!dialogue || !active) return;
    if (!motion()) {
      lineComplete();
      return;
    }
    if (dialogue.shown >= dialogue.letters.length) {
      lineComplete();
      return;
    }
    dialogueText.textContent = dialogue.letters
      .slice(0, ++dialogue.shown)
      .join("");
    const last = dialogue.letters[dialogue.shown - 1];
    const line = dialogue.lines[dialogue.index];
    if (line.kind)
      gameAudio.voice(line.kind, last, dialogue.shown - 1, line.expression);
    if (dialogue.shown % 16 === 0 && dialogue.pulses < 3) {
      dialogue.pulses++;
      reactPortrait(dialogue.lines[dialogue.index], true);
    }
    typingTimer = setTimeout(typeLetter, /[.!?…]/u.test(last) ? 190 : 30);
  }
  function paintLine() {
    clearTimeout(typingTimer);
    gameAudio.stopVoice();
    choicesBox.replaceChildren();
    choicesBox.hidden = true;
    const line = dialogue.lines[dialogue.index];
    const person = line.kind ? cast[line.kind] : null;
    speakerLabel.textContent = person
      ? line.kind === "hero"
        ? playerName
        : person.name
      : line.voice
        ? "어디선가 들려오는 목소리"
        : placeNames[location][1];
    portraitFor(line.kind, line.expression);
    cancelPortraitMotion();
    dialogue.pulses = 0;
    reactPortrait(line);
    dialogueText.parentElement.dataset.fullText = line.text;
    dialogue.letters = Array.from(line.text);
    dialogue.shown = 0;
    dialogueText.textContent = "";
    dialogueLive.textContent = line.text;
    nextLabel.textContent = "E 모두 보기";
    if (!inputLocked && !motion() && line.kind)
      gameAudio.voice(line.kind, "가", 0, line.expression);
    if (!inputLocked) typeLetter();
    fitPortrait();
  }
  function speak(lines, after, choices) {
    keys.clear();
    phase = "dialogue";
    dialogue = { lines, index: 0, shown: 0, letters: [], after, choices };
    selectedChoice = 0;
    dialogueBox.hidden = false;
    root.dataset.phase = phase;
    paintLine();
    updateObjective();
  }
  function renderChoices() {
    choicesBox.hidden = false;
    choicesBox.replaceChildren();
    dialogue.choices.forEach((choice, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = (i === selectedChoice ? "▸ " : "  ") + choice.label;
      b.className = i === selectedChoice ? "is-current" : "";
      b.addEventListener("click", () => choose(i));
      choicesBox.append(b);
    });
  }
  function choose(index) {
    if (
      !dialogue ||
      !dialogue.choices ||
      dialogue.shown < dialogue.letters.length
    )
      return;
    const action = dialogue.choices[index].action;
    gameAudio.sfx("confirm");
    closeDialogue();
    action();
  }
  function closeDialogue() {
    cancelPortraitMotion();
    clearTimeout(typingTimer);
    gameAudio.stopVoice();
    dialogue = null;
    dialogueBox.hidden = true;
    choicesBox.hidden = true;
    phase = "free";
    root.dataset.phase = phase;
    keys.clear();
    canvas.focus({ preventScroll: true });
  }
  function advanceDialogue() {
    if (!dialogue) return;
    gameAudio.sfx("next");
    if (dialogue.shown < dialogue.letters.length) {
      clearTimeout(typingTimer);
      gameAudio.stopVoice();
      lineComplete();
      return;
    }
    if (dialogue.index < dialogue.lines.length - 1) {
      dialogue.index++;
      paintLine();
      return;
    }
    if (dialogue.choices) {
      choose(selectedChoice);
      return;
    }
    const after = dialogue.after;
    closeDialogue();
    if (after) after();
  }
  function wakeAtCounter() {
    storyStep = "lucy";
    speak(
      [
        { kind: "lucy", text: "모험가 님, 정신 차리세요~" },
        {
          kind: "lucy",
          expression: "incredulous",
          text: "아. 드디어 이쪽을 보시네.\n몇 분 동안 말이 없으셨다고요. 기절하셨던 건 아니죠?",
        },
        { kind: "hero", text: "…잠깐, 생각을 좀 했어." },
        {
          kind: "lucy",
          text: "네, 뭐. 숨은 쉬고 계셨으니까요.\n그린스토아로 가시는 거, 맞죠?",
        },
      ],
      lucyConversation,
    );
  }
  function registerQuest() {
    if (questAccepted) return;
    questAccepted = true;
    storyStep = "accepted";
    inventory.push({
      id: "dispatch",
      name: "기사단 조사 의뢰서",
      count: 1,
      description:
        "제르디아 기사단 직속 파견 의뢰.\n목적: 성역 그린스토아의 이상 징후 사전 조사.\n정문 검문소에 제시할 수 있도록 기사단 인장이 찍혀 있다.",
    });
  }
  function lucyConversation() {
    if (questAccepted) {
      speak([
        {
          kind: "lucy",
          expression: "concerned",
          text: `${playerName} 모험가 님. 마차는 길드 앞에 와 있을 거예요.\n…조사 의뢰예요. 무슨 일이 생기면 혼자 해결하려 들지 마시고요.`,
        },
      ]);
      return;
    }
    speak(
      [
        {
          kind: "lucy",
          text: "관광이 아니라 의뢰라면… 일반적인 건 없어요.\n제르디아 기사단이 직접 공표한 건 하나 있는데.",
        },
        {
          kind: "lucy",
          expression: "reading",
          text: "영 꺼림칙해서, 아직 신청자가 없는 상태예요.\n어디 보자… 공문에는 이렇게 적혀 있네요.",
        },
        {
          kind: "lucy",
          expression: "reading",
          text: "‘최근 성역 그린스토아에 불미스러운 기운이 감돌고 있으니,\n파견을 통한 사전 조사를 맡길 모험가를 구한다.’",
        },
        {
          kind: "lucy",
          expression: "concerned",
          text: "어머니 나무가 있는 구역을 노릴 배짱이라면,\n보통내기는 아닐 테니까요.",
        },
        {
          kind: "lucy",
          text: "…굳이 골라서 고생할 필요는 없잖아요.\n그래도 이 의뢰, 맡으시겠어요?",
        },
      ],
      null,
      [
        {
          label: "조사 의뢰를 맡는다",
          action: () =>
            speak(
              [
                {
                  kind: "lucy",
                  expression: "incredulous",
                  text: "…하신다고요?\n…….",
                },
              ],
              () =>
                showEvent("stamp", {
                  onImpact: registerQuest,
                  after: () =>
                    speak(
                      [
                        {
                          kind: "lucy",
                          expression: "reading",
                          text: `${playerName} 님. 수주 완료되었습니다.\n기사단 직속 의뢰이니, 예정된 시간에 마차가 직접 올 거예요.`,
                        },
                        {
                          kind: "lucy",
                          expression: "soft",
                          text: "의뢰서는 챙겨 두세요. 모험가증도 잃어버리지 마시고.\n…가시기 전에 빵이라도 드세요. 빈속에 떠나지 마시고.",
                        },
                      ],
                      () => {
                        updateObjective();
                        notify("의뢰 수락 · 성역의 이상 징후 사전 조사");
                      },
                    ),
                }),
            ),
        },
        {
          label: "조금 더 둘러본다",
          action: () =>
            speak([
              {
                kind: "lucy",
                expression: "weary",
                text: "현명하시네요. …비꼬는 거 아니에요.\n천천히 생각하고 오세요. 저는 어차피 여기 있을 테니까.",
              },
            ]),
        },
      ],
    );
  }
  function leaveGuild() {
    speak(
      [
        {
          text: "길드 문밖에 기사단의 인장이 찍힌 마차가 기다리고 있다.\n그린스토아로 출발할까?",
        },
      ],
      null,
      [
        {
          label: "그린스토아로 출발한다",
          action: () => {
            storyStep = "departure";
            speak(
              [
                {
                  kind: "lucy",
                  expression: "concerned",
                  text: "…나 참, 위험하다는 말을 해줘도.\n……멀쩡히 돌아오기나 하세요.",
                },
              ],
              () =>
                showEvent("departure", {
                  destination: "carriage",
                  setup: () => {
                    player = actor("hero", 250, 326, "right");
                    npcs = [actor("rogue", 466, 326, "left")];
                    storyStep = "carriage";
                  },
                  after: carriageConversation,
                }),
            );
          },
        },
        {
          label: "아직 준비가 덜 됐다",
          action: () => notify("필요한 준비를 마치고 다시 오자."),
        },
      ],
    );
  }
  function carriageConversation() {
    speak(
      [
        {
          text: "덜컹, 덜컹.\n마차는 제르디아의 성벽을 지나 동쪽 숲으로 접어들었다.",
        },
        {
          kind: "rogue",
          expression: "boasting",
          text: "우헤켈켈켈! 형씨, 그린스토아는 나 혼자 갈 줄 알았는데 말야!\n나처럼 짜릿한 위협을 즐기는 용자가 아직 남아 있었구만?!",
        },
        {
          kind: "rogue",
          expression: "boasting",
          text: "뭐, 마족이든 악마든 목을 따서 기사단에 바치면,\n그걸로 인생 날먹 아니겠어?!",
        },
        { kind: "hero", text: "…조사 의뢰라고 들었는데." },
        {
          kind: "rogue",
          expression: "boasting",
          text: "에이, 조사하다 보면 뭐든 나오겠지!\n게다가… 형씨도 들었겠지만 말야…",
        },
        {
          kind: "rogue",
          expression: "boasting",
          text: "지금 그린스토아에는 남자가 없다잖아…? 킥킥.\n미인 엘프들하고 한탕 거하게 놀아 볼 거라구~",
        },
        {
          text: "대꾸하지 않자, 그는 혼자서도 한참을 떠들었다.\n숲은 점점 깊어졌다. 창밖으로 흐르는 강이 보였다.",
        },
      ],
      () =>
        showVista("forest", () =>
          travelTo(
            "checkpoint",
            () => {
              player = actor("hero", 343, 380, "up");
              npcs = [actor("scout", 360, 261), actor("rogue", 414, 328, "up")];
              storyStep = "checkpoint";
            },
            checkpointConversation,
          ),
        ),
    );
  }
  function checkpointConversation() {
    speak(
      [
        {
          kind: "scout",
          expression: "warning",
          text: "거기, 노란 머리 도적은 돌아가라.",
        },
        {
          kind: "rogue",
          expression: "offended",
          text: "어…? 나? 방금 도착했는데?!\n평등한 나라라면서 이래도 되는 거냐고!",
        },
        {
          kind: "scout",
          text: "평등을 침해하려는 것은 아니다.\n현재 그린스토아에는 불미스러운 기운이 감돌고 있다.",
        },
        {
          kind: "scout",
          expression: "explaining",
          text: "그래서 마기와 음기를 철저히 단속하고 있지.\n너는 엄청난 음기를 뿜는 데다, 제대로 된 모험가증조차 없군.",
        },
        {
          kind: "scout",
          expression: "warning",
          text: "네놈을 들일 수는 없다. 돌아가라.",
        },
        {
          kind: "rogue",
          expression: "embarrassed",
          text: "에…?\n……그, 그럴 수가…….",
        },
        {
          text: "노란 머리 도적은 눈물을 훔치며 마차 쪽으로 돌아갔다.\n정찰병이 이쪽으로 시선을 돌린다.",
        },
      ],
      () => {
        npcs = npcs.filter((n) => n.id !== "rogue");
        notify("카니아에게 다가가 E · 모험가증 제시");
      },
    );
  }
  function showCredentials() {
    speak(
      [
        {
          kind: "hero",
          text: "제르디아에서 조사 의뢰를 받고 왔어.\n모험가증과 기사단 의뢰서야.",
        },
      ],
      () => showEvent("credentials", { after: admitCredentials }),
    );
  }
  function admitCredentials() {
    speak(
      [
        {
          kind: "scout",
          expression: "skeptical",
          text: `…${playerName}. 확인했다. 어서 와라.\n의뢰를 받아 왔겠지만, 당장 터질 위협이 있는 것은 아니다.`,
        },
        {
          kind: "scout",
          expression: "explaining",
          text: "의뢰 내용도 조사일 테고.\n그러니 있는 동안에는 서두르지 말고 편히 지내도 된다.",
        },
        {
          kind: "scout",
          expression: "neutral",
          text: "조사원이 편안한 것이 우리에게도 좋으니.\n따라와라. 정문까지 안내하지.",
        },
      ],
      () =>
        travelTo(
          "gate",
          () => {
            player = actor("hero", 360, 384, "up");
            npcs = [actor("scout", 360, 305, "down")];
            storyStep = "arrival";
          },
          () =>
            speak(
              [
                {
                  kind: "scout",
                  expression: "welcoming",
                  text: "다시 한번, 환영한다.\n네가 지금부터 들어갈 곳은—",
                },
                {
                  kind: "scout",
                  expression: "welcoming",
                  text: "어머니 나무의 품 아래 자리 잡은 안식처.\n수없이 많은 종족이 하나의 이름 아래 살아가는 제루스의 성역—",
                },
                {
                  kind: "scout",
                  expression: "welcoming",
                  text: "이종족연합국, 그린스토아다.",
                },
              ],
              () =>
                showVista("sanctuary", () =>
                  resumeWorld(() => {
                    storyStep = "arrived";
                    updateObjective();
                    notify("그린스토아에 도착했다.");
                  }),
                ),
            ),
        ),
    );
  }

  function npcTalk(id) {
    if (id === "scout") {
      if (location === "checkpoint") showCredentials();
      else
        speak([
          {
            kind: "scout",
            expression: "welcoming",
            text: "먼 길 오느라 수고했다.\n낯선 곳이겠지만, 이곳에서는 네 종족도 신분도 묻지 않는다.",
          },
        ]);
      return;
    }
    if (id === "lucy") {
      lucyConversation();
      return;
    }
    const texts = {
      bran: [
        "아까는 아주 곤히 서 있더군. 후드 덕에 티는 덜 났지만.\n먼 길에서 온 모양이지?",
        "그린스토아로 간다고? 숲에서는 길보다 소리를 잘 듣게.\n조용하던 새들이 갑자기 날아오르면, 대개 이유가 있거든.",
      ],
      mia: [
        "나도 오늘 첫 의뢰를 받았어요. 약초를 세 다발 구해 오라는데…\n이름이 비슷한 독초가 있어서 벌써 걱정이에요.",
        "그린스토아에서는 종족이 달라도 함께 일한다면서요?\n언젠가는 저도 가 보고 싶어요.",
      ],
      nara: [
        "우편은 발이 빨라야 해요. 그래도 봉인은 건드리면 안 되죠!\n내용이 궁금할수록 더더욱.",
        "그린스토아 가는 길? 동쪽 숲길로 쭉 가세요.\n…쭉이라는 말이 숲에서도 쭉일지는 모르겠지만요.",
      ],
      tobin: [
        "흠, 그 망토. 바람은 잘 막겠군.\n비 오기 전에 장화에도 기름 좀 먹여 두게.",
        "그린스토아 물건들은 오래 쓰기 좋지.\n서로 다른 손들이 만들다 보니 생각 못 한 구석까지 튼튼하거든.",
      ],
      leon: [
        "성역의 어머니 나무는 단순히 오래된 나무가 아닙니다.\n뿌리가 어디까지 뻗어 있는지조차 아직 밝혀지지 않았지요.",
        "그린스토아의 이상 징후라… 소문은 여러 갈래입니다.\n들었다는 사람은 많은데, 보았다는 사람은 드물더군요.",
      ],
    };
    const npc = npcs.find((n) => n.id === id);
    npc.talkCount = (npc.talkCount || 0) + 1;
    speak([{ kind: id, text: texts[id][(npc.talkCount - 1) % 2] }]);
  }
  function targets() {
    const people = npcs.map((n) => ({
      id: n.id,
      name: cast[n.id].name,
      x: n.x,
      y: n.id === "lucy" ? 176 : n.y,
      kind: "npc",
    }));
    if (location === "guild")
      return [
        ...people,
        { id: "board", name: "의뢰 게시판", x: 155, y: 174, kind: "prop" },
        { id: "door", name: "길드 출입문", x: 360, y: 442, kind: "prop" },
        { id: "books", name: "길드 기록장", x: 650, y: 327, kind: "prop" },
      ];
    if (location === "checkpoint")
      return [
        ...people,
        { id: "sign", name: "성역 푯말", x: 559, y: 292, kind: "prop" },
      ];
    if (location === "gate")
      return [
        ...people,
        { id: "gate", name: "그린스토아 정문", x: 360, y: 280, kind: "prop" },
      ];
    return people;
  }
  function nearby() {
    let best = null,
      dist = 48;
    const directions = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0],
      },
      f = directions[player.dir];
    for (const target of targets()) {
      const dx = target.x - player.x,
        dy = target.y - player.y,
        d = Math.hypot(dx, dy);
      if (d < dist && (d < 15 || (dx * f[0] + dy * f[1]) / d > -0.15)) {
        best = target;
        dist = d;
      }
    }
    return best;
  }
  function interact() {
    const target = nearby();
    if (!target) {
      notify("이야기할 사람이나 물건 가까이에서 E");
      return;
    }
    gameAudio.sfx(target.kind === "npc" ? "next" : "paper");
    if (target.kind === "npc") {
      npcTalk(target.id);
      return;
    }
    if (target.id === "board")
      speak([
        {
          text: "약초 채집, 호위, 분실물 수색…\n여러 의뢰서가 겹겹이 붙어 있다. 그린스토아 사전 조사 의뢰에는 제르디아 기사단의 인장이 찍혀 있다.",
        },
      ]);
    if (target.id === "door") {
      if (questAccepted) leaveGuild();
      else
        speak([
          {
            text: "문밖으로 제르디아의 분주한 거리가 보인다.\n그린스토아행 의뢰부터 접수원에게 확인해야겠다.",
          },
        ]);
    }
    if (target.id === "gate")
      speak([
        {
          text: "열린 문 너머로 잎사귀 스치는 소리가 들려온다.\n어머니 나무의 그늘 아래, 새로운 이야기가 기다리고 있다.",
        },
      ]);
    if (target.id === "sign")
      speak([
        {
          text: "‘성역 그린스토아. 모든 종족에게 평등을, 모든 생명에게 자유를.’\n이끼 낀 푯말에 깊게 새겨진 문장이다.",
        },
      ]);
    if (target.id === "books")
      speak([
        {
          text: "서가에는 길드의 오래된 기록장이 가득하다.\n책등 사이에 「제루스 대륙의 길과 성역」이라는 제목이 보인다.",
        },
      ]);
  }
  function blocked(x, y) {
    const box = { x: x - 7, y: y - 6, w: 14, h: 9 };
    if (
      x < wallBounds.left ||
      x > wallBounds.right ||
      y < wallBounds.top ||
      y > wallBounds.bottom
    )
      return true;
    const overlap = (r) =>
      box.x < r.x + r.w &&
      box.x + box.w > r.x &&
      box.y < r.y + r.h &&
      box.y + box.h > r.y;
    return (
      (location === "guild" ? guildCollisions : fieldCollisions[location]).some(
        overlap,
      ) ||
      npcs.some(
        (n) =>
          n.id !== "lucy" && overlap({ x: n.x - 7, y: n.y - 5, w: 14, h: 9 }),
      )
    );
  }
  function movePlayer(dt) {
    const oldX = player.x,
      oldY = player.y;
    let dx = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      dy = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
    player.moving = !!(dx || dy);
    if (!player.moving) return;
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? "left" : "right";
    else player.dir = dy < 0 ? "up" : "down";
    const speed = keys.has("ShiftLeft") ? 126 : 76,
      length = Math.hypot(dx, dy);
    dx = (dx / length) * speed * dt;
    dy = (dy / length) * speed * dt;
    if (!blocked(player.x + dx, player.y)) player.x += dx;
    if (!blocked(player.x, player.y + dy)) player.y += dy;
    footDistance += Math.hypot(player.x - oldX, player.y - oldY);
    if (footDistance >= (keys.has("ShiftLeft") ? 24 : 22)) {
      footDistance = 0;
      gameAudio.sfx("footstep", location);
    }
  }
  function drawActor(a) {
    const x = Math.round(a.x),
      y = Math.round(a.y);
    rect(ctx, x - 8, y - 1, 16, 3, "#352c2e80");
    const frame = a.moving
      ? Math.floor(elapsed * (a === player && keys.has("ShiftLeft") ? 12 : 8)) %
        4
      : 0;
    ctx.drawImage(makeSprite(a.id, a.dir, frame), x - 22, y - 56);
  }
  function drawWorld() {
    const menuUnavailable = phase !== "free" || inputLocked;
    if (menuButton.disabled !== menuUnavailable)
      menuButton.disabled = menuUnavailable;
    ctx.imageSmoothingEnabled = false;
    rect(ctx, 0, 0, W, H, "#121d26");
    ctx.save();
    if (location === "carriage" && motion())
      ctx.translate(0, [0, -1, 0, 1][Math.floor(elapsed * 5) % 4]);
    ctx.drawImage(background, 0, 0);
    if (location === "carriage") {
      // Extend the edge rows through the tiny carriage shake, with no bare rim.
      ctx.drawImage(background, 0, 0, W, 1, 0, -2, W, 2);
      ctx.drawImage(background, 0, H - 1, W, 1, 0, H, W, 2);
    }
    drawScenery();
    [...npcs, player].sort((a, b) => a.y - b.y).forEach(drawActor);
    if (phase === "free") {
      const target = nearby();
      prompt.textContent = target ? `E · ${target.name}` : "";
      prompt.hidden = !target;
      if (target) {
        const x = Math.round(target.x),
          y = Math.round(target.y) - 65;
        panel(ctx, x - 7, y, 14, 13, "#252c35", "#cbbd91");
        ctx.fillStyle = "#eee4c8";
        ctx.font = "9px monospace";
        ctx.fillText("E", x - 3, y + 10);
      }
    } else prompt.hidden = true;
    ctx.restore();
  }
  function tick(now) {
    if (!active) return;
    const dt = Math.min(0.04, Math.max(0, (now - previous) / 1000));
    previous = now;
    elapsed += dt;
    if (phase === "free") movePlayer(dt);
    else player.moving = false;
    drawWorld();
    drawVista();
    request = requestAnimationFrame(tick);
  }
  function renderMenu() {
    document.querySelector("#guild-player-name").textContent = playerName;
    document.querySelector("#guild-player-status").textContent =
      `체력 ${hp} / 24     금화 ${coins} G`;
    document
      .querySelectorAll("[data-menu-tab]")
      .forEach((b) =>
        b.classList.toggle("is-current", b.dataset.menuTab === menuTab),
      );
    itemList.replaceChildren();
    itemDetail.textContent = "";
    document.querySelector("#guild-item-action").hidden = true;
    if (menuTab === "items") {
      selectedItem = Math.max(0, Math.min(selectedItem, inventory.length - 1));
      inventory.forEach((item, i) => {
        const b = document.createElement("button");
        b.textContent = `${i === selectedItem ? "▸" : "　"} ${item.name}  ×${item.count}`;
        b.className = i === selectedItem ? "is-current" : "";
        b.addEventListener("click", () => {
          gameAudio.sfx("select");
          selectedItem = i;
          renderMenu();
        });
        itemList.append(b);
      });
      const item = inventory[selectedItem];
      if (item) {
        itemDetail.textContent = item.description;
        const action = document.querySelector("#guild-item-action");
        action.hidden = false;
        action.textContent =
          item.id === "bread"
            ? "먹기 · E"
            : item.id === "map"
              ? "지도 펼치기 · E"
              : "살펴보기 · E";
      }
    } else if (menuTab === "quest") {
      const h = document.createElement("p");
      h.className = "quest-entry";
      h.textContent = questAccepted
        ? "▸ 성역의 이상 징후 사전 조사"
        : "아직 수락한 의뢰가 없다.";
      itemList.append(h);
      itemDetail.textContent = questAccepted
        ? `의뢰인: 제르디아 기사단\n목적지: 성역 그린스토아\n\n성역에 감도는 이상 징후를 사전 조사한다.\n${location === "guild" ? "길드 앞 마차로 출발하자." : location === "gate" ? "그린스토아 도착 · 정문 통과 허가" : "그린스토아로 이동 중이다."}`
        : "접수원 루시에게 말을 걸어 보자.";
    } else {
      itemDetail.textContent =
        "W A S D  이동\n왼쪽 Shift  달리기\nE  대화 · 조사 · 대사 넘기기\nC  메뉴 열기 · 닫기\n\n메뉴 안에서는 W/S로 소지품을, A/D로 탭을 선택한다.\nE로 결정하고 C 또는 Esc로 돌아간다.";
    }
  }
  function openMenu() {
    if (phase !== "free") return;
    gameAudio.sfx("menuOpen");
    phase = "menu";
    root.dataset.phase = phase;
    keys.clear();
    menu.hidden = false;
    menuTab = "items";
    selectedItem = 0;
    renderMenu();
    document.querySelector("#guild-menu-close").focus({ preventScroll: true });
  }
  function closeMenu() {
    gameAudio.sfx("menuClose");
    menu.hidden = true;
    phase = "free";
    root.dataset.phase = phase;
    keys.clear();
    canvas.focus({ preventScroll: true });
  }
  function useItem() {
    if (menuTab !== "items") return;
    const item = inventory[selectedItem];
    if (!item) return;
    if (item.id === "map") {
      showEvent("map", { after: openMenu });
      return;
    }
    if (item.id === "bread") {
      if (hp === 24) {
        itemDetail.textContent =
          "아직 배가 고프지 않다. 빵은 길 위에서 먹도록 하자.";
        return;
      }
      hp = Math.min(24, hp + 6);
      gameAudio.sfx("eat");
      item.count--;
      if (!item.count) inventory.splice(selectedItem, 1);
      renderMenu();
      itemDetail.textContent = "마른 빵을 천천히 먹었다.\n체력이 6 회복되었다.";
    } else {
      gameAudio.sfx("paper");
      itemDetail.textContent = item.description;
    }
  }
  function handleKey(event) {
    if (
      !active ||
      inputLocked ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      document.hidden
    )
      return;
    const code = event.code;
    // Let the native sound button handle its own Enter activation.
    if (code === "Enter" && event.target.closest?.("#game-sound-toggle"))
      return;
    if (phase === "event" && code === "Tab") {
      event.preventDefault();
      const button = document.querySelector(
        document.activeElement.id === "event-next"
          ? "#game-sound-toggle"
          : "#event-next",
      );
      button.focus({ preventScroll: true });
      return;
    }
    if (phase === "menu" && code === "Tab") {
      const focusable = [
        ...menu.querySelectorAll("button:not([disabled])"),
      ].filter((button) => !button.hidden && button.getClientRects().length);
      const index = focusable.indexOf(document.activeElement);
      const next =
        (index + (event.shiftKey ? -1 : 1) + focusable.length) %
        focusable.length;
      event.preventDefault();
      focusable[next].focus();
      return;
    }
    if (
      ![
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "KeyE",
        "KeyC",
        "ShiftLeft",
        "Escape",
        "Enter",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(code)
    )
      return;
    event.preventDefault();
    if (phase === "event") {
      if (!event.repeat && ["KeyE", "Enter", "Escape"].includes(code))
        eventScenes.finish();
      return;
    }
    if (phase === "menu") {
      if (event.repeat) return;
      if (code === "KeyC" || code === "Escape") {
        closeMenu();
        return;
      }
      if (
        code === "KeyA" ||
        code === "ArrowLeft" ||
        code === "KeyD" ||
        code === "ArrowRight"
      ) {
        const tabs = ["items", "quest", "controls"],
          offset = code === "KeyA" || code === "ArrowLeft" ? -1 : 1;
        menuTab = tabs[(tabs.indexOf(menuTab) + offset + 3) % 3];
        gameAudio.sfx("select");
        renderMenu();
      } else if (
        code === "KeyW" ||
        code === "ArrowUp" ||
        code === "KeyS" ||
        code === "ArrowDown"
      ) {
        const offset = code === "KeyW" || code === "ArrowUp" ? -1 : 1;
        selectedItem =
          (selectedItem + offset + inventory.length) % inventory.length;
        gameAudio.sfx("select");
        renderMenu();
      } else if (code === "KeyE" || code === "Enter") useItem();
      return;
    }
    if (phase === "dialogue") {
      if (event.repeat) return;
      if (
        dialogue?.choices &&
        !choicesBox.hidden &&
        (code === "KeyW" ||
          code === "ArrowUp" ||
          code === "KeyS" ||
          code === "ArrowDown")
      ) {
        selectedChoice = (selectedChoice + 1) % dialogue.choices.length;
        gameAudio.sfx("select");
        renderChoices();
      } else if (code === "KeyE" || code === "Enter") advanceDialogue();
      return;
    }
    if (phase === "vista") {
      if (!event.repeat && (code === "KeyE" || code === "Enter")) finishVista();
      return;
    }
    if (phase !== "free") return;
    if (code === "KeyC" && !event.repeat) {
      openMenu();
      return;
    }
    if (code === "KeyE" && !event.repeat) {
      keys.clear();
      interact();
      return;
    }
    keys.add(code);
  }
  document.addEventListener("keydown", handleKey);
  document.addEventListener("keyup", (event) => keys.delete(event.code));
  function clearKeys() {
    keys.clear();
    if (player) player.moving = false;
  }
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", () => {
    clearKeys();
    previous = performance.now();
    if (document.hidden) clearTimeout(typingTimer);
    else if (
      active &&
      !inputLocked &&
      dialogue &&
      dialogue.shown < dialogue.letters.length
    )
      typeLetter();
  });
  document.querySelector("#vista-next").addEventListener("click", finishVista);
  document
    .querySelector("#game-dialogue-next")
    .addEventListener("click", advanceDialogue);
  document
    .querySelector("#guild-menu-open")
    .addEventListener("click", openMenu);
  document
    .querySelector("#guild-menu-close")
    .addEventListener("click", closeMenu);
  document
    .querySelector("#guild-item-action")
    .addEventListener("click", useItem);
  document.querySelector("#guild-exit-title").addEventListener("click", () => {
    if (onExit) onExit();
  });
  for (const b of document.querySelectorAll("[data-menu-tab]"))
    b.addEventListener("click", () => {
      gameAudio.sfx("select");
      menuTab = b.dataset.menuTab;
      renderMenu();
    });
  canvas.addEventListener("pointerdown", () =>
    canvas.focus({ preventScroll: true }),
  );
  // The dialogue grows with Korean wrapping and choices. Keep the entire
  // portrait below the HUD, even on a narrow phone, without squeezing its width.
  function fitPortrait() {
    if (root.hidden || dialogueBox.hidden) return;
    const view = root.getBoundingClientRect();
    const compact = view.height < 500 && view.width > 700;
    root.classList.toggle("is-dialogue-compact", compact);
    if (portrait.hidden) return;
    const box = dialogueBox.getBoundingClientRect();
    const mobile = view.width <= 700,
      ratio = portrait.width / portrait.height;
    const available = compact
      ? box.height - 16
      : Math.max(0, box.top - view.top - (mobile ? 64 : 104));
    const desired = Math.min(
      view.height * (mobile ? 0.48 : 0.58),
      mobile ? 350 : 450,
    );
    const widthLimit = compact
      ? parseFloat(getComputedStyle(dialogueBox).paddingLeft) - 24
      : box.width * (mobile ? 0.96 : 0.54);
    const height = Math.min(available, desired, widthLimit / ratio);
    // Set both dimensions together so max-width never silently shrinks the bust.
    portraitFrame.style.height = height + "px";
    portraitFrame.style.width = height * ratio + "px";
    portraitFrame.style.maxHeight = "none";
  }
  const dialogueLayout = new ResizeObserver(fitPortrait);
  dialogueLayout.observe(dialogueBox);
  dialogueLayout.observe(root);
  const vistaLayout = new ResizeObserver(fitVista);
  vistaLayout.observe(root);
  vistaLayout.observe(document.querySelector(".vista-copy"));
  for (const b of document.querySelectorAll("[data-game-key]")) {
    b.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (inputLocked) return;
      b.setPointerCapture(event.pointerId);
      const code = b.dataset.gameKey;
      if (code === "KeyE") {
        if (phase === "event") eventScenes.finish();
        else if (phase === "vista") finishVista();
        else if (phase === "dialogue") advanceDialogue();
        else if (phase === "free") interact();
      } else if (phase === "free") keys.add(code);
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      b.addEventListener(event, () => keys.delete(b.dataset.gameKey));
  }
  async function start(name, exit) {
    await ready;
    stop();
    inputLocked = true;
    root.dataset.ready = "false";
    playerName = name;
    cast.hero.name = name;
    onExit = exit;
    active = true;
    phase = "dialogue";
    elapsed = 0;
    footDistance = 0;
    location = "guild";
    storyStep = "lucy";
    buildMap();
    questAccepted = false;
    hp = 18;
    coins = 18;
    inventory = [
      {
        id: "map",
        name: "낡은 여행 지도",
        count: 1,
        description:
          "수없이 접어 모서리가 닳은 제루스 대륙 지도.\n동쪽 숲 너머, 그린스토아의 위치에 작은 표시가 있다.",
      },
      {
        id: "bread",
        name: "마른 빵",
        count: 2,
        description: "여행 가방에 넣어 둔 빵.\n먹으면 체력을 6 회복한다.",
      },
    ];
    inventory.push({
      id: "credentials",
      name: "모험가증",
      count: 1,
      description:
        "제르디아 모험가 길드에 등록된 증명서.\n성역에 들어가려면 정문에서 제시해야 한다.",
    });
    player = actor("hero", 360, 188, "up");
    npcs = [
      actor("lucy", 360, 100),
      actor("bran", 552, 230),
      actor("mia", 208, 222),
      actor("nara", 83, 330, "right"),
      actor("tobin", 620, 268, "left"),
      actor("leon", 592, 404, "up"),
    ];
    root.hidden = false;
    menu.hidden = true;
    document.querySelector("#game-toast").hidden = true;
    previous = performance.now();
    drawWorld();
    request = requestAnimationFrame(tick);
    canvas.focus({ preventScroll: true });
    wakeAtCounter();
  }
  function stop() {
    active = false;
    ++transitionSerial;
    transitionAnimation?.cancel();
    transition.hidden = true;
    cancelPortraitMotion();
    hideVista();
    hideEvent();
    gameAudio.stopTransient();
    gameAudio.scene("title");
    cancelAnimationFrame(request);
    clearTimeout(typingTimer);
    clearTimeout(toastTimer);
    keys.clear();
    dialogue = null;
    root.hidden = true;
    menu.hidden = true;
    dialogueBox.hidden = true;
  }
  function unlock() {
    inputLocked = false;
    root.dataset.ready = "true";
    canvas.focus({ preventScroll: true });
    if (dialogue) {
      reactPortrait(dialogue.lines[dialogue.index]);
      if (!motion()) gameAudio.voice(dialogue.lines[dialogue.index].kind, "가");
      typeLetter();
    }
  }
  return {
    ready,
    start,
    stop,
    unlock,
    get active() {
      return active;
    },
    getState() {
      return {
        phase,
        location,
        storyStep,
        event: eventScenes.kind,
        vista: cinematic?.key || null,
        expression: dialogue?.lines[dialogue.index].expression || "neutral",
        player: player
          ? { x: player.x, y: player.y, direction: player.dir }
          : null,
        questAccepted,
        hp,
        items: inventory.map((i) => ({ id: i.id, count: i.count })),
        npcs: npcs.map((n) => ({ id: n.id, x: n.x, y: n.y })),
        speaker: dialogue ? dialogue.lines[dialogue.index].kind : null,
        line: dialogue?.index,
      };
    },
  };
})();
