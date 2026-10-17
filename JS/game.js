// A self-contained opening journey. Each room uses a 720 × 480 pixel world.
const guildGame = (() => {
  const root = document.querySelector("#game-screen");
  const canvas = document.querySelector("#guild-world");
  const ctx = canvas.getContext("2d");
  const assets = document.querySelector("#guild-assets");
  const portrait = document.querySelector("#dialogue-portrait");
  const portraitFrame = document.querySelector("#dialogue-portrait-frame");
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
  const dialogueScroll = document.querySelector("#game-dialogue-scroll");
  const dialogueScrollMedia = matchMedia("(pointer: coarse), (max-width: 700px)");
  const menu = document.querySelector("#guild-menu");
  const itemList = document.querySelector("#guild-item-list");
  const itemDetail = document.querySelector("#guild-item-detail");
  const itemInspection = document.querySelector("#item-inspection");
  let inspectionInputAfter = 0;
  const menuButton = document.querySelector("#guild-menu-open");
  const prompt = document.querySelector("#game-interaction");
  const keys = new Set();
  const movementCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft"]);
  const keyboardMovement = new Set();
  const keyboardPressed = new Set();
  const touchMovement = new Map();
  const touchButtons = [...document.querySelectorAll("[data-game-key]")];
  const joystick = document.querySelector("#game-joystick");
  const stick = { pointerId: null, x: 0, y: 0 };
  function resetJoystick() {
    const pointerId = stick.pointerId;
    stick.pointerId = null;
    stick.x = stick.y = 0;
    joystick.classList.remove("is-held");
    joystick.style.setProperty("--stick-x", "0px");
    joystick.style.setProperty("--stick-y", "0px");
    if (pointerId !== null && joystick.hasPointerCapture(pointerId))
      joystick.releasePointerCapture(pointerId);
  }
  function moveJoystick(event) {
    const box = joystick.getBoundingClientRect(),
      radius = (box.width - 48) / 2,
      x = event.clientX - box.left - box.width / 2,
      y = event.clientY - box.top - box.height / 2,
      distance = Math.hypot(x, y),
      travel = Math.min(radius, distance),
      strength = Math.max(0, (Math.min(1, distance / radius) - 0.12) / 0.88);
    stick.x = x / (distance || 1) * strength;
    stick.y = y / (distance || 1) * strength;
    joystick.style.setProperty("--stick-x", x / (distance || 1) * travel + "px");
    joystick.style.setProperty("--stick-y", y / (distance || 1) * travel + "px");
  }
  function syncMovementKeys() {
    keys.clear();
    for (const code of keyboardMovement) keys.add(code);
    for (const { codes } of touchMovement.values())
      for (const code of codes) keys.add(code);
  }
  function updateTouchButtons() {
    const held = new Set([...touchMovement.values()].map(({ button }) => button));
    for (const button of touchButtons)
      button.classList.toggle("is-held", held.has(button));
  }
  const W = 720,
    H = 480;
  const cast = {
    hero: {
      name: "",
      portrait: 0,
    },
    lucy: {
      name: "루시",
      portrait: "lucy",
    },
    bran: {
      name: "이보리아",
      portrait: 1,
    },
    mia: {
      name: "하나리",
      portrait: 2,
    },
    nara: {
      name: "아이나",
      portrait: 3,
    },
    tobin: {
      name: "토비",
      portrait: 4,
    },
    leon: {
      name: "무니아",
      portrait: 5,
    },
    rogue: {
      name: "노란 머리 도적",
      portrait: 6,
    },
    scout: {
      name: "카니아",
      portrait: 7,
    },
    // Keep the original actor key so existing saves and codex entries survive.
    rose: { name: "아르다", portrait: 0, fieldPortrait: true },
    rael: { name: "라엘", portrait: 1, fieldPortrait: true },
    edan: { name: "기루스", portrait: 2, fieldPortrait: true },
    sena: { name: "새나", portrait: 3, fieldPortrait: true },
  };
  for (const [id, person] of Object.entries(characterChats)) cast[id].name = person.name;
  const pictures = {};
  function loadPicture(key, src) {
    const image = new Image();
    image.src = src;
    pictures[key] = image;
    return image.decode();
  }
  const ready = Promise.all([
    greenstoaLore.ready,
    ...Object.values(characterChats).map(person => loadPicture(person.asset, assets.dataset[person.asset + "Src"])),
    ...Object.values(characterChats).map(person => loadPicture("sd" + person.asset, assets.dataset["sd" + person.asset[0].toUpperCase() + person.asset.slice(1) + "Src"])),
    loadPicture("cast", assets.dataset.castSrc),
    loadPicture("kania", assets.dataset.kaniaSrc),
    loadPicture("rogue", assets.dataset.rogueSrc),
    ...[
      "guild",
      "carriage",
      "checkpoint",
      "gate",
      "forest",
      "journey",
      "journeyGorge",
      "journeyRoad",
      "journeyCarriage",
      "sanctuary",
      "events",
      "eventProps",
      "sdHero",
      "sdLeads",
      "city",
      "cliff",
      "grove",
      "shop",
      "fieldCast",
      "sdField",
      "arda",
      "sdArda",
      "library",
      "guideForest",
      "guideKania",
      "sdKania",
      "demonActions",
      "firstPersonArms",
      "itemSpecimens",
      "forestAmbush",
    ].map((key) => loadPicture(key, assets.dataset[key + "Src"])),
  ]).then(() => {
    fieldSprites.prepare({
      hero: pictures.sdHero,
      leads: pictures.sdLeads,
      field: pictures.sdField,
      arda: pictures.sdArda,
      kania: pictures.sdKania,
      ...Object.fromEntries(Object.entries(characterChats).map(([id, person]) => [id, pictures["sd" + person.asset]])),
    });
    // Decode and clean the animation frames during loading, before an encounter.
    pixelAtlases.make(pictures.demonActions, 4, 2);
    kaniaWalk.prepare(pictures.guideKania);
    firstPersonArms.prepare(pictures.firstPersonArms);
    itemSpecimens.prepare(pictures.itemSpecimens);
    journeyCinematic.prepare(pictures);
    livingNature.prepare(pictures.sanctuary,"sanctuary");
    livingNature.prepare(pictures.guideForest,"overlook");
  });
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
  let shopOrigin = "city",
    shopStocks = fieldWorld.freshStock(),
    fieldFlags = {
      lucyFarewell: false,
      leafTaken: false,
      springUsed: false,
      libraryReached: false,
      libraryLetterRead: false,
      libraryAmbushCleared: false,
    };
  const visited = new Set(["guild"]);
  let typingTimer = 0,
    toastTimer = 0;
  let footDistance = 0;
  let nextAutosave = 0;
  let resumingSave = false;
  let restoredMusic = null;
  let boundaryContact = null;
  const background = document.createElement("canvas");
  background.width = W;
  background.height = H;
  const map = background.getContext("2d");
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
    ...Object.fromEntries(
      Object.entries(fieldWorld.maps).map(([key, value]) => [key, value.names]),
    ),
  };
  function buildMap() {
    visited.add(location);
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
    const names =
      location === "shop"
        ? [
            shopOrigin === "city" ? "제르디아 시내" : "그린스토아 입구",
            fieldWorld.shops[shopOrigin].title,
          ]
        : placeNames[location];
    livingNature.prepare(background,location);
    document.querySelector(".game-place").textContent = names[0];
    document.querySelector(".game-hud strong").textContent = names[1];
    root.dataset.location = location;
    gameAudio.scene(location);
    root.setAttribute("aria-label", names.join(" · "));
    canvas.setAttribute(
      "aria-label",
      names[1] + ". WASD 이동, 왼쪽 Shift 달리기, E 상호작용, C 메뉴.",
    );
  }
  function drawScenery() {
    if (!motion()) return;
    livingNature.draw(ctx,background,location,elapsed);
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
    vista.classList.remove("is-journey");
    delete vista.dataset.shot;
    delete vista.dataset.pan;
    root.classList.remove("is-vista");
    delete root.dataset.vista;
    document.querySelector(".world-viewport").inert = false;
  }
  async function transitionTo(prepare, after) {
    saveProgress();
    const token = ++transitionSerial;
    phase = "transition";
    root.dataset.phase = phase;
    keys.clear();
    dialogueBox.hidden = true;
    prompt.hidden = true;
    menu.hidden = true;
    hideItemInspection();
    hideTrading();
    hideReading();
    hideLibraryLetter();
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
    try {
      if (!(await fade(0, 1))) return;
      prepare();
      if (!(await fade(1, 0))) return;
      transition.hidden = true;
      phase = "free";
      root.dataset.phase = phase;
      if (after) after();
    } finally {
      // A failed scene must never leave an opaque curtain over the whole game.
      if (token === transitionSerial && active) {
        transitionAnimation?.cancel();
        transition.hidden = true;
        if (phase === "transition") {
          phase = "free";
          root.dataset.phase = phase;
        }
      }
    }
  }
  function travelTo(destination, setup, after) {
    return transitionTo(() => {
      noticeBoard.hide();
      hideVista();
      hideEvent();
      hideAction();
      location = destination;
      boundaryContact = null;
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
        if (kind === "departure") gameAudio.scene("departure");
        document.querySelector(".world-viewport").inert = true;
        eventScenes.prepare(kind, {
          atlas: pictures.events,
          props: pictures.eventProps,
          name: playerName,
          avatar: fieldSprites.badge(),
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
      kicker: "제르디아 · 흐르는 호수의 왕국",
      title: "여정의 시작",
      text: "그린스토아를 향하여",
    },
    sanctuary: {
      kicker: "어머니 나무의 품 아래",
      title: "이종족연합국\n그린스토아",
      text: "수없이 많은 종족이\n하나의 이름 아래 살아가는 성역",
    },
  };
  function showVista(key, after) {
    if (key === "forest") gameAudio.startJourney();
    return transitionTo(
      () => {
        cinematic = { key, after, started: null, frame: -1, revealed: false };
        vista.classList.toggle("is-sanctuary", key === "sanctuary");
        vista.classList.toggle("is-journey", key === "forest");
        const art = pictures[key === "forest" ? "journey" : key],
          ratio =
            key === "forest" ? 2.15 : art.naturalWidth / art.naturalHeight;
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
        gameAudio.scene(key);
        if (key === "sanctuary") gameAudio.sfx("sanctuary");
        document.querySelector("#vista-next").focus({ preventScroll: true });
      },
    );
  }
  function fitVista() {
    if (root.hidden || vista.hidden || !cinematic) return;
    if (["sanctuary", "forest"].includes(cinematic.key)) {
      const holder = document.querySelector(".vista-image");
      holder.style.width = "100%";
      holder.style.height = "100%";
      vistaArt.width = Math.max(
        1,
        Math.min(
          cinematic.key === "forest" ? 960 : 1440,
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
      cinematic.key === "forest"
        ? 2.15
        : pictures[cinematic.key].naturalWidth /
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
    if (cinematic.key === "forest") {
      const frame = motion() ? Math.floor(seconds * 30) : "still";
      if (frame === cinematic.frame) return;
      cinematic.frame = frame;
      const view = journeyCinematic.draw(vistaContext, seconds, motion());
      vista.dataset.shot = view.shot;
      vista.dataset.pan = view.progress.toFixed(3);
      vista.style.setProperty("--journey-top", (view.box.y / vistaArt.height * 100) + "%");
      document.querySelector("#vista-kicker").style.opacity = String(view.opening);
      document.querySelector("#vista-title").style.opacity = String(view.title);
      document.querySelector("#vista-caption").style.opacity = String(view.title);
      document.querySelector("#vista-next").textContent = "E · 건너뛰기";
      return;
    }
    const frame = motion() ? Math.floor(seconds * 12) : 0;
    if (frame === cinematic.frame) return;
    cinematic.frame = frame;
    const art = pictures[cinematic.key],
      t = motion() ? Math.min(1, seconds / 18) : 0;
    const zoom = motion() ? 1.025 : 1;
    const aspect = vistaArt.width / vistaArt.height;
    const sw = Math.min(art.naturalWidth, art.naturalHeight * aspect) / zoom,
      sh = sw / aspect;
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
    const frame = motion() ? Math.floor(seconds * 24) : "complete";
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
    vistaContext.save();
    vistaContext.scale(vistaArt.width/sw,vistaArt.height/sh);
    vistaContext.translate(-(art.naturalWidth-sw)/2,-Math.min(art.naturalHeight-sh,Math.round((art.naturalHeight-sh)*ease)));
    vistaContext.drawImage(art,0,0);
    livingNature.draw(vistaContext,art,"sanctuary",seconds,motion());
    vistaContext.restore();
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
        gameAudio.scene(location);
        drawWorld();
      },
      () => {
        canvas.focus({ preventScroll: true });
        if (after) after();
      },
    );
  }

  const makeSprite = fieldSprites.make;

  function actor(id, x, y, dir = "down") {
    return { id, x, y, dir, moving: false };
  }
  function guildPeople() {
    return [
      actor("lucy", 360, 100),
      actor("bran", 552, 230),
      actor("mia", 208, 222),
      actor("nara", 83, 330, "right"),
      actor("tobin", 620, 268, "left"),
      actor("leon", 592, 404, "up"),
    ];
  }
  function fieldPeople(region) {
    return (fieldWorld.maps[region].npcs || []).map((person) =>
      actor(...person),
    );
  }
  function visitCity(fromGuild = true) {
    travelTo(
      "city",
      () => {
        player = actor(
          "hero",
          fromGuild ? 140 : 568,
          fromGuild ? 239 : 266,
          "down",
        );
        npcs = fieldPeople("city");
      },
      () => notify("길드 · 잡화점 · 광장 · 마차  /  가까이에서 E"),
    );
  }
  function visitGuild() {
    travelTo("guild", () => {
      player = actor("hero", 360, 408, "up");
      npcs = guildPeople();
    });
  }
  function visitGrove() {
    travelTo(
      "grove",
      () => {
        player = actor("hero", 395, 420, "up");
        npcs = fieldPeople("grove");
      },
      () => notify("다리 너머 강가와 도서관을 둘러보자."),
    );
  }
  function returnGate() {
    travelTo("gate", () => {
      player = actor("hero", 360, 326, "down");
      npcs = [actor("scout", 442, 312, "left")];
    });
  }
  function enterShop() {
    shopOrigin = "city";
    travelTo("shop", () => {
      player = actor("hero", 360, 375, "up");
      npcs = [actor("rose", 360, 106)];
    });
  }
  function exitShop() {
    visitCity(false);
  }
  function welcomeLibrary() {
    const welcome = () =>
      speak([
        {
          kind: "rael",
          text: "어서 와요. 이슬잎 도서관에 오신 걸 환영해요.\n먼 길의 끝에서는 잠깐 책을 읽으며 쉬어 가셔도 좋아요.",
        },
        {
          kind: "rael",
          text: "왼편에는 세계의 기록, 가운데에는 인물 도감, 오른편에는 건국 이야기를 담은 삽화집이 있어요.\n언제든 펼쳐 보세요. 이곳의 책은 모든 이에게 열려 있으니까요.",
        },
      ]);
    if (!fieldFlags.libraryLetterRead)
      libraryLetter.deliver({
        motion: motion(),
        after: () => {
          fieldFlags.libraryLetterRead = true;
          inventory.push({
            id: "libraryLetter",
            name: "추광더리우스 3세의 편지",
            count: 1,
            description: document.querySelector("#library-letter-message").textContent +
              "\n\n" + document.querySelector("#library-letter-signature").textContent,
          });
          welcome();
        },
      });
    else notify("도서관에 도착했다 · 빛나는 책 가까이에서 E");
  }
  function enterLibrary() {
    travelTo(
      "library",
      () => {
        player = actor("hero", 360, 380, "up");
        npcs = [actor("rael", 360, 108)];
        fieldFlags.libraryReached = true;
      },
      welcomeLibrary,
    );
  }
  function hideBattle() {
    battleScenes.stop();
    root.classList.remove("is-battle");
    document.querySelector(".world-viewport").inert = false;
  }
  function approachLibrary() {
    if (fieldFlags.libraryAmbushCleared) return enterLibrary();
    startForestAmbush();
  }
  function startForestAmbush() {
    if (phase !== "free" || fieldFlags.libraryAmbushCleared) return;
    saveProgress();
    keys.clear();
    player.moving = false;
    phase = "battle";
    root.dataset.phase = phase;
    root.classList.add("is-battle");
    prompt.hidden = true;
    document.querySelector(".world-viewport").inert = true;
    gameAudio.scene("ambush");
    drawWorld();
    battleScenes.prepare({
      world: canvas,
      pictures,
      origin: { x: player.x - 70, y: player.y - 55 },
      name: playerName,
      hp,
      motion: motion(),
      items: () => inventory.filter(item => fieldWorld.items[item.id]?.heal)
        .map(item => ({ ...item, heal: fieldWorld.items[item.id].heal })),
      useItem: (id, currentHp) => {
        const item = inventory.find(item => item.id === id),
          heal = fieldWorld.items[id]?.heal;
        if (!item || !heal || item.count < 1) return { ok: false, message: "사용할 수 없는 소지품이다." };
        if (currentHp >= 24) return { ok: false, message: "체력이 가득하다. 소지품을 아껴 두자." };
        item.count--;
        if (!item.count) inventory.splice(inventory.indexOf(item), 1);
        const restored = Math.min(24 - currentHp, heal);
        return { ok: true, hp: currentHp + restored, message: `${item.name}을(를) 사용했다. 체력 ${restored} 회복.` };
      },
      after: result => {
        if (!active) return;
        hp = result.hp;
        fieldFlags.libraryAmbushCleared = true;
        transitionTo(() => {
          hideBattle();
          gameAudio.scene(location);
          npcs = fieldPeople("grove");
          npcs.push(actor("scout", Math.min(660, player.x + 44), player.y + 4, "left"));
          drawWorld();
        }, () => speak([
          { kind: "scout", expression: "concerned", text: "괜찮아? 다행히 늦지는 않았네.\n조금만 더 늦었으면 위험했어." },
          { kind: "scout", expression: "warning", text: "중급 마족이야. 성역의 문턱까지 숨어들었군.\n보통이라면 이곳에 발을 들일 수 없는 놈인데……." },
          { kind: "scout", expression: "explaining", text: "네가 조사하러 온 ‘불미스러운 일’. 바로 이런 일이야.\n요즘 성역 안팎에서 이질적인 마력이 감지되고 있어." },
          { kind: "scout", expression: "warning", text: "도서관으로 들어가. 기록을 확인하면 실마리를 찾을 수 있을 거야.\n주변은 내가 살펴볼게." },
        ], () => notify("마족의 기척이 사라졌다. 숲길 너머 도서관으로 향하자.")));
      },
    });
    battleScenes.play();
  }
  function leaveLibrary() {
    travelTo("grove", () => {
      player = actor("hero", 529, 211, "down");
      npcs = fieldPeople("grove");
    });
  }
  function hideReading() {
    libraryArchive.hide();
    root.classList.remove("is-reading");
    document.querySelector(".world-viewport").inert = false;
  }
  function hideLibraryLetter(reset = false) {
    if (reset) libraryLetter.reset();
    else libraryLetter.hide();
    root.classList.remove("is-letter");
    document.querySelector(".world-viewport").inert = false;
  }
  function showLibraryLetter() {
    if (!libraryLetter.waiting) return;
    keys.clear();
    phase = "letter";
    root.dataset.phase = phase;
    root.classList.add("is-letter");
    document.querySelector(".world-viewport").inert = true;
    libraryLetter.open({
      close: () => {
        if (!active) return;
        hideLibraryLetter();
        phase = "free";
        root.dataset.phase = phase;
        canvas.focus({ preventScroll: true });
      },
    });
  }
  function openArchive(tab = "world") {
    keys.clear();
    phase = "archive";
    root.dataset.phase = phase;
    root.classList.add("is-reading");
    document.querySelector(".world-viewport").inert = true;
    libraryArchive.show({
      tab,
      playerName,
      drawPortrait: (target, kind) => paintPortrait(target, kind),
      close: () => {
        hideReading();
        phase = "free";
        root.dataset.phase = phase;
        keys.clear();
        canvas.focus({ preventScroll: true });
        gameAudio.sfx("menuClose");
      },
    });
  }
  function hideAction() {
    if (actionScenes.kind === "guide") gameAudio.scene(location);
    actionScenes.stop();
    root.classList.remove("is-action");
    root.classList.remove("is-guide-chat");
    document.querySelector(".world-viewport").inert = false;
  }
  function playAction(kind, after) {
    const start = () => {
      actionScenes.play();
      if (kind === "guide") {
        root.classList.add("is-guide-chat");
        kaniaConversation({ walking: true });
      }
    };
    const prepare = () => {
      keys.clear();
      phase = "action";
      root.dataset.phase = phase;
      root.classList.add("is-action");
      if (kind === "guide") gameAudio.scene("guide");
      document.querySelector(".world-viewport").inert = true;
      actionScenes.prepare({
        kind,
        interactive: kind === "guide",
        world: background,
        pictures,
        motion: motion(),
        actors: [...npcs, player].map((a) => ({ ...a })),
        after: () => {
          if (!active) return;
          hideAction();
          phase = "free";
          root.dataset.phase = phase;
          keys.clear();
          if (after) after();
        },
      });
    };
    if (kind === "guide")
      return transitionTo(prepare, () => {
        phase = "action";
        root.dataset.phase = phase;
        start();
      });
    prepare();
    start();
  }
  function giveItem(id) {
    const found = inventory.find((item) => item.id === id);
    if (found) found.count++;
    else inventory.push({ id, ...fieldWorld.items[id], count: 1 });
  }
  function hideTrading() {
    shopView.hide();
    root.classList.remove("is-shopping");
    document.querySelector(".world-viewport").inert = false;
  }
  function trade() {
    phase = "shop";
    root.dataset.phase = phase;
    keys.clear();
    root.classList.add("is-shopping");
    document.querySelector(".world-viewport").inert = true;
    shopView.show({
      region: shopOrigin,
      snapshot: () => ({
        coins,
        stock: shopStocks[shopOrigin],
        owned: Object.fromEntries(
          inventory.map((item) => [item.id, item.count]),
        ),
      }),
      buy: (id) => {
        const product = fieldWorld.shops[shopOrigin].stock.find(
          (item) => item.id === id,
        );
        if (!product || shopStocks[shopOrigin][id] <= 0)
          return { ok: false, message: "이 물건은 모두 팔렸어용. 다른 것도 구경해 보세용!" };
        if (coins < product.price)
          return {
            ok: false,
            message: "금화가 조금 부족해용. 다른 물건도 구경해 보세용!",
          };
        coins -= product.price;
        shopStocks[shopOrigin][id]--;
        giveItem(id);
        return {
          ok: true,
          message:
            fieldWorld.items[id].name +
            " 1개를 챙겼다. (-" +
            product.price +
            " G)",
        };
      },
      close: () => {
        hideTrading();
        phase = "free";
        root.dataset.phase = phase;
        keys.clear();
        gameAudio.sfx("menuClose");
        canvas.focus({ preventScroll: true });
      },
    });
  }
  function objectiveWorld() { return { active, inputLocked, phase, location, questAccepted, shopOrigin, fieldFlags }; }
  function updateObjective() { objectiveGuide.update(objectiveWorld()); }
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
    portraitFrame.hidden = !kind;
    paintPortrait(portrait, kind, expression);
  }
  function paintPortrait(target, kind, expression = "neutral") {
    const c = target.getContext("2d");
    c.clearRect(0, 0, target.width, target.height);
    target.hidden = !kind;
    target.dataset.character = kind || "";
    target.dataset.expression = expression;
    if (!kind) return;
    const sheets = {
      rose: {
        image: "arda", columns: 3, rows: 2,
        columnEdges: [0,268,524,768],
        poses: {neutral:0,smile:1,curious:2,surprised:3,excited:4,thoughtful:5},
      },
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
        columnEdges: [0, 542, 1064, 1536],
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
    const sheet =
      (characterChats[kind] && { image: characterChats[kind].asset, columns: 3, rows: 2, poses: characterChats[kind].poses }) ||
      sheets[kind] ||
      (cast[kind].fieldPortrait
        ? {
            image: "fieldCast",
            columns: 2,
            rows: 2,
            columnEdges: [0, 800, 1536],
            rowEdges: [0, 519, 1024],
          }
        : { image: "cast", columns: 3, rows: 2 });
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
    if (sheet.rowEdges) {
      const row = Math.floor(index / sheet.columns);
      sy = sheet.rowEdges[row];
      ch = sheet.rowEdges[row + 1] - sy;
    }
    target.dataset.sheet = sheet.image;
    target.dataset.frame = String(index);
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
    const scale = Math.min((target.width - 12) / cw, (target.height - 12) / ch);
    c.imageSmoothingEnabled = false;
    // Fit the full width of the portrait and remove only its transparent padding.
    c.drawImage(
      image,
      sx,
      sy,
      cw,
      ch,
      (target.width - cw * scale) / 2,
      target.height - ch * scale,
      cw * scale,
      ch * scale,
    );
    if (kind === "scout") {
      // Kania's extracted dark cloak must stay opaque in dialogue and the codex
      // as well as in her walking scene.
      const pixels = c.getImageData(0, 0, target.width, target.height);
      for (let i = 3; i < pixels.data.length; i += 4)
        pixels.data[i] = pixels.data[i] >= 96 ? 255 : 0;
      c.putImageData(pixels, 0, 0);
    }
  }
  function lineComplete() {
    if (!dialogue) return;
    dialogue.shown = dialogue.letters.length;
    dialogueText.textContent = dialogue.letters.join("");
    nextLabel.textContent =
      dialogue.index === dialogue.lines.length - 1 && dialogue.choices
        ? dialogue.choices.some(choice => choice.cancel) ? "E 선택 · C 대화 마치기" : "E 선택"
        : "E 다음";
    if (dialogue.index === dialogue.lines.length - 1 && dialogue.choices)
      renderChoices();
    updateDialogueScroll();
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
    root.classList.remove("is-dialogue-choices");
    dialogueScroll.hidden = true;
    dialogueText.parentElement.scrollTop = 0;
    choicesBox.scrollTop = 0;
    const line = dialogue.lines[dialogue.index];
    const person = line.kind ? cast[line.kind] : null;
    speakerLabel.textContent = person
      ? line.kind === "hero"
        ? playerName
        : person.name
      : line.voice
        ? "어디선가 들려오는 목소리"
        : placeNames[location][1];
    // The tracking shot already frames Kania; keep the scenery visible behind her words.
    portraitFor(root.classList.contains("is-guide-chat") ? null : line.kind, line.expression);
    cancelPortraitMotion();
    dialogue.pulses = 0;
    reactPortrait(line);
    dialogueText.parentElement.dataset.fullText = line.text;
    dialogueText.parentElement.dataset.emotion = line.emotion || "";
    dialogueText.classList.remove("is-emoting");
    if (line.emotion && motion()) {
      // Restart once per line, leaving the window and reading area still.
      void dialogueText.offsetWidth;
      dialogueText.classList.add("is-emoting");
    }
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
    clearTimeout(toastTimer);
    document.querySelector("#game-toast").hidden = true;
    saveProgress();
    keys.clear();
    noticeBoard.hide();
    phase = "dialogue";
    dialogue = { lines, index: 0, shown: 0, letters: [], after, choices };
    selectedChoice = 0;
    dialogueBox.hidden = false;
    root.dataset.phase = phase;
    paintLine();
    updateObjective();
  }
  function renderChoices() {
    const owner = dialogue;
    choicesBox.hidden = false;
    root.classList.toggle("is-dialogue-choices", dialogue.choices.length >= 3);
    choicesBox.replaceChildren();
    dialogue.choices.forEach((choice, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.addEventListener("click", () => { if (dialogue === owner) choose(i); });
      b.addEventListener("focus", () => {
        if (dialogue === owner && selectedChoice !== i) selectChoice(i);
      });
      choicesBox.append(b);
    });
    selectChoice(selectedChoice);
    fitPortrait();
  }
  function selectChoice(index, focus = false) {
    if (!dialogue?.choices || choicesBox.hidden) return;
    selectedChoice = (index + dialogue.choices.length) % dialogue.choices.length;
    [...choicesBox.children].forEach((button, i) => {
      const current = i === selectedChoice;
      button.textContent = (current ? "▸ " : "  ") + dialogue.choices[i].label;
      button.classList.toggle("is-current", current);
      button.tabIndex = current ? 0 : -1;
    });
    const selected = choicesBox.children[selectedChoice];
    if (focus) selected.focus({ preventScroll: true });
    selected.scrollIntoView({ block: "nearest" });
    updateDialogueScroll();
  }
  function followFieldPath(path) {
    boundaryContact = path.id;
    clearKeys();
    player.moving = false;
    if (path.destination === "cliff") {
      travelTo("cliff", () => {
        player = actor("hero", 360, 108, "down");
        npcs = [];
      }, () => speak([{text: fieldPaths.text(fieldPaths.targets("cliff").find(path=>path.id==="river-cliff"))}]));
    } else if (path.destination === "city") {
      travelTo("city", () => {
        player = actor("hero", 360, 432, "up");
        npcs = fieldPeople("city");
      });
    } else speak([{text: fieldPaths.text(path, fieldFlags)}]);
  }
  // Both long replies and clipped choices use the same visible way to read on.
  function dialogueScrollTarget() {
    if (!dialogueScrollMedia.matches || dialogueBox.hidden || !dialogue ||
      dialogue.shown < dialogue.letters.length) return null;
    return [dialogueText.parentElement, choicesBox].find(panel =>
      !panel.hidden && panel.clientHeight > 0 &&
      panel.scrollHeight - panel.clientHeight - panel.scrollTop > 2);
  }
  function updateDialogueScroll() {
    dialogueScroll.hidden = !dialogueScrollTarget();
  }
  dialogueScroll.addEventListener("click", event => {
    event.stopPropagation();
    const panel = dialogueScrollTarget();
    if (panel) panel.scrollBy({ top: Math.max(32, panel.clientHeight * 0.75),
      behavior: motion() ? "smooth" : "instant" });
  });
  for (const panel of [dialogueText.parentElement, choicesBox])
    panel.addEventListener("scroll", updateDialogueScroll, { passive: true });
  dialogueScrollMedia.addEventListener("change", updateDialogueScroll);
  function choose(index) {
    if (
      !dialogue ||
      !dialogue.choices?.[index] ||
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
    dialogueText.parentElement.dataset.emotion = "";
    dialogueText.classList.remove("is-emoting");
    root.classList.remove("is-dialogue-choices");
    dialogueBox.hidden = true;
    choicesBox.hidden = true;
    dialogueScroll.hidden = true;
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
      lucyQuestConversation,
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
  function lucyQuestConversation() {
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
                  emotion: "surprise",
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
    if (questAccepted && !fieldFlags.lucyFarewell) {
      fieldFlags.lucyFarewell = true;
      speak(
        [
          {
            kind: "lucy",
            expression: "concerned",
            text: "…나 참, 위험하다는 말을 해줘도.\n……멀쩡히 돌아오기나 하세요.",
          },
        ],
        visitCity,
      );
    } else visitCity();
  }
  function boardCarriage() {
    if (!questAccepted) {
      speak(characterChats.edan.boardingBlocked);
      return;
    }
    speak(
      characterChats.edan.boardingReady,
      null,
      [
        {
          label: "그린스토아로 출발한다",
          action: () => {
            storyStep = "departure";
            showEvent("departure", {
              destination: "carriage",
              setup: () => {
                player = actor("hero", 250, 326, "right");
                npcs = [actor("rogue", 466, 326, "left")];
                storyStep = "carriage";
              },
              after: carriageConversation,
            });
          },
        },
        {
          label: "조금 더 둘러본다",
          action: () => speak(characterChats.edan.boardingCancel),
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
          emotion: "shout",
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
          emotion: "shout",
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
          emotion: "firm",
        },
        {
          kind: "rogue",
          expression: "embarrassed",
          text: "에…?\n……그, 그럴 수가…….",
          emotion: "tremble",
        },
      ],
      () =>
        playAction("rogue", () => {
          npcs = npcs.filter((n) => n.id !== "rogue");
          speak(
            [
              {
                text: "정찰병이 도적의 뒷모습을 잠시 바라보다가, 이쪽으로 시선을 돌린다.",
              },
            ],
            () => notify("카니아에게 다가가 E · 모험가증 제시"),
          );
        }),
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
        playAction("guide", () =>
          travelTo(
            "gate",
            () => {
              player = actor("hero", 360, 384, "up");
              npcs = [actor("scout", 360, 305, "down")];
              storyStep = "arrival";
            },
            welcomeAtGate,
          ),
        ),
    );
  }

  function welcomeAtGate() {
    speak([
      { kind: "scout", expression: "welcoming", text: "다시 한번, 환영한다.\n네가 지금부터 들어갈 곳은—" },
      { kind: "scout", expression: "welcoming", text: "어머니 나무의 품 아래 자리 잡은 안식처.\n수없이 많은 종족이 하나의 이름 아래 살아가는 제루스의 성역—" },
      { kind: "scout", expression: "welcoming", text: "이종족연합국, 그린스토아다." },
    ], () => showVista("sanctuary", () => resumeWorld(() => {
      storyStep = "arrived";
      npcs = [actor("scout", 442, 312, "left")];
      updateObjective();
      notify("그린스토아에 도착했다.");
    })));
  }

  function kaniaConversation({ walking = false } = {}) {
    if (!walking) {
      const scout = npcs.find(person => person.id === "scout"), first = !scout?.talkCount;
      if (scout) scout.talkCount = Math.min(999999, (scout.talkCount || 0) + 1);
      if (fieldFlags.libraryAmbushCleared && first) speak([
        { kind: "hero", text: "그 초록빛 화살… 네가 쏜 거지?\n정말 끝인 줄 알았어. 고마워." },
        { kind: "scout", expression: "explaining", text: "화살촉에 마력을 모았어.\n빗나갈 수 없는 한 발이 필요했으니까." },
        { kind: "scout", expression: "welcoming", text: "살아 돌아왔잖아. 그걸로 됐어.\n도서관으로 가. 주변은 내가 살펴볼게." },
      ]);
      else speak([{ kind: "scout", expression: "welcoming", text: fieldFlags.libraryAmbushCleared
        ? "도서관은 다리 너머에 있어.\n뒤는 내가 지킬 테니, 천천히 가."
        : "천천히 둘러봐.\n길을 잃거나 이상한 낌새가 느껴지면 나를 부르고." }]);
      return;
    }
    const asked = new Set();
    const topics = [
      {
        label: "하이엘프인데, 왜 정찰병이야?",
        lines: [
          { kind: "hero", text: "하이엘프라고 들었어.\n그런데 정찰병은… 네가 원해서 하는 일이야?" },
          { kind: "scout", expression: "explaining", text: "그래. 내가 지원했다.\n안전한 곳에서 소식만 기다리는 건 성미에 안 맞아서." },
          { kind: "hero", text: "바깥은 위험할 텐데." },
          { kind: "scout", expression: "neutral", text: "내가 먼저 수상한 발자국을 찾으면,\n누군가는 무사히 집에 돌아갈 수 있지." },
          { kind: "scout", expression: "welcoming", text: "이 귀와 활이 쓸모 있는 곳에 있고 싶어.\n네가 돌아올 길도, 내가 봐 둘 테니." },
        ],
      },
      {
        label: "아까부터 무슨 소리를 듣는 거야?",
        lines: [
          { kind: "hero", text: "아까부터 자꾸 옆을 보네.\n무슨 소리를 듣는 거야?" },
          { kind: "scout", expression: "warning", text: "잠깐. 오른쪽 가지 위에…" },
          { text: "잠시 뒤, 잎사귀 사이에서 작은 새 한 마리가 고개를 내민다." },
          { kind: "scout", expression: "explaining", text: "…새였군. 잎이 스치는 소리가 달라졌어.\n소리도 냄새도, 평소와 다르면 신경이 쓰이거든." },
          { kind: "hero", text: "늘 그렇게 신경 쓰면 안 피곤해?" },
          { kind: "scout", expression: "welcoming", text: "익숙해. 너까지 긴장할 필요는 없어.\n내가 멈추라고 할 때만 멈춰 주면 돼." },
        ],
      },
      {
        label: "좋아하는 사람 앞에서도 침착해?",
        lines: [
          { kind: "hero", text: "좋아하는 사람 앞에서도 그렇게 침착해?" },
          { kind: "scout", expression: "flustered", text: "…그건 정찰과 무슨 관계가 있지?" },
          { kind: "hero", text: "그냥 궁금해서.\n누가 좋아한다고 하면 뭐라고 답할 거야?" },
          { kind: "scout", expression: "flustered", text: "그… 먼저 진심인지 확인해야겠지.\n그다음에는… 잠깐. 보통은 뭐라고 답하지?" },
          { kind: "hero", text: "마음에 들면 웃어 주는 것부터?" },
          { kind: "scout", expression: "flustered", text: "웃는 것부터… 그렇군.\n활시위를 당기는 쪽이 훨씬 쉽네." },
        ],
      },
    ];
    const finish = () => {
      phase = "action";
      root.dataset.phase = phase;
      actionScenes.finish();
    };
    const questions = (first = false) => {
      if (asked.size === topics.length) { finish(); return; }
      speak(
        [{ kind: "scout", expression: "welcoming", text: first
          ? "정문까지는 조금 걸어야 해.\n궁금한 게 있으면 물어봐. 길은 내가 보고 있으니."
          : "…더 궁금한 게 있어?" }],
        null,
        [...topics.filter(topic => !asked.has(topic)).map(topic => ({
          label: topic.label,
          action: () => {
            asked.add(topic);
            speak(topic.lines, () => questions());
          },
        })), { label: "풍경을 보며 정문까지 함께 걷는다", cancel: true, action: finish }],
      );
    };
    questions(true);
  }

  function openNoticeBoard() {
    if (phase !== "free" || location !== "guild") return;
    clearTimeout(toastTimer);
    document.querySelector("#game-toast").hidden = true;
    saveProgress();
    phase = "board";
    root.dataset.phase = phase;
    keys.clear();
    updateObjective();
    noticeBoard.show({ image: pictures.guild, accepted: questAccepted, onClose: () => {
      if (!active || phase !== "board") return;
      phase = "free";
      root.dataset.phase = phase;
      syncMovementKeys();
      canvas.focus({ preventScroll: true });
      updateObjective();
    }});
  }
  function characterConversation(id) {
    const person = characterChats[id], asked = new Set();
    const actor = npcs.find(npc => npc.id === id);
    if (actor) actor.talkCount = Math.min(999999, (actor.talkCount || 0) + 1);
    const hub = (first = false) => {
      const actions = [];
      if (id === "lucy") actions.push({ label: questAccepted ? "맡은 의뢰 확인" : "그린스토아 조사 의뢰", action: lucyQuestConversation });
      if (id === "edan") {
        actions.push({ label: "출발 안내", action: () => speak(questAccepted ? person.afterAccepted : person.beforeAccepted, () => hub()) });
        actions.push({ label: "마차에 탑승하기", action: boardCarriage });
      }
      if (id === "leon") actions.push({ label: "현재 목표 안내 · 다시 표시", action: () => {
        const topic = person.helpTopic;
        const goal = objectiveGuide.describe(objectiveWorld());
        speak([...topic.lines, { kind: id, expression: "pointing", text: (questAccepted ? "네 임무는 성역의 이상 징후를 확인하는 거야.\n" : "의뢰를 맡을 생각이면 접수부터 해야지.\n") + goal.step + "." }, ...topic.ending], () => { objectiveGuide.reveal(); hub(); });
      }});
      actions.push(...person.topics.filter(topic => !asked.has(topic)).map(topic => ({ label: topic.label, action: () => {
        asked.add(topic);
        // Do not claim the player accepted a quest when they have not.
        const lines = topic.lines.map(line => line.text === "그린스토아로. 조사 의뢰를 받았어." && !questAccepted
          ? { ...line, text: "그린스토아로. 조사 의뢰를 알아보는 중이야." } : line);
        speak(lines, () => hub());
      }})));
      actions.push({ label: "대화 마치기", cancel: true, action: () => { saveProgress(); } });
      speak(first ? person.greeting : [{ kind: id, expression: "neutral", text: id === "lucy" ? "더 궁금한 게 있으세요?" : id === "edan" ? "더 궁금하신 점이 있으십니까?" : id === "tobin" ? "더 물어볼 게 있나?" : "더 궁금한 게 있어?" }], null, actions);
    };
    if (id === "leon" && !objectiveGuide.snapshot().unlocked) {
      const briefing = person.briefing;
      speak([...person.greeting, ...briefing.common, ...(questAccepted ? briefing.afterAccepted : briefing.beforeAccepted), ...briefing.close], () => { objectiveGuide.reveal(); hub(); });
    } else hub(true);
  }

  function npcTalk(id) {
    if (characterChats[id]) { characterConversation(id); return; }
    if (id === "rael") {
      speak(
        [
          {
            kind: "rael",
            text: "어떤 기록이 궁금하세요?\n세계의 이야기와, 길에서 만난 사람들의 이야기를 함께 모아 두었어요.",
          },
        ],
        () => openArchive("world"),
      );
      return;
    }
    if (id === "rose") {
      speak(
        fieldWorld.shops.city.greeting.map((text,i) => ({ kind: id, expression: i ? "smile" : "curious", text })),
        trade,
      );
      return;
    }

    if (id === "scout") {
      if (location === "checkpoint") showCredentials();
      else kaniaConversation();
      return;
    }
    if (id === "lucy") {
      characterConversation("lucy");
      return;
    }
    const texts = {
      sena: [
        "처음 오셨어요? 저는 새나예요. 다리 건너 도서관에서는 라엘 씨가 기다리고 있고요.\n여긴 앉아서 물소리를 듣기만 해도 시간이 잘 가요.",
        "저기 작은 샘은 마셔도 괜찮아요. 긴 여행 뒤엔 잠깐 쉬어 가세요.\n강가에 떨어진 잎도 하나쯤은 기념으로 가져가셔도 돼요.",
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
      y:
        location === "guild" && n.id === "lucy"
          ? 176
          : location === "shop"
            ? 190
            : location === "library"
              ? 212
              : n.y,
      kind: "npc",
    }));
    people.push(...fieldPaths.targets(location));
    if (fieldWorld.maps[location])
      return [
        ...people,
        ...fieldWorld.maps[location].targets.map((target) => ({
          ...target,
          kind: "prop",
        })),
      ];
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
        { id: "sign", name: "성역 푯말", x: 565, y: 316, kind: "prop" },
      ];
    if (location === "gate")
      return [
        ...people,
        { id: "gate", name: "그린스토아 정문", x: 360, y: 280, kind: "prop" },
      ];
    return people;
  }
  function nearby() {
    if (location === "library" && libraryLetter.waiting)
      return { id: "library-letter", name: "머리 위의 편지 살펴보기",
        ...libraryLetter.position(player), kind: "letter" };
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
    if (target.kind === "letter") {
      showLibraryLetter();
      return;
    }
    if (target.kind === "path") {
      followFieldPath(target);
      return;
    }
    const doors = [
      "door",
      "guild-entry",
      "shop-entry",
      "shop-exit",
      "library-entry",
      "library-exit",
    ];
    gameAudio.sfx(
      target.kind === "npc"
        ? "next"
        : doors.includes(target.id)
          ? "door"
          : "paper",
    );
    if (["shop-entry", "library-entry"].includes(target.id))
      gameAudio.sfx("bell");
    if (target.kind === "npc") {
      npcTalk(target.id);
      return;
    }
    if (target.id === "board") openNoticeBoard();
    if (target.id === "door") leaveGuild();
    if (target.id === "guild-entry") visitGuild();
    if (target.id === "shop-entry") enterShop();
    if (target.id === "library-entry") approachLibrary();
    if (target.id === "library-exit") leaveLibrary();
    if (target.id === "archive-world") openArchive("world");
    if (target.id === "archive-people") openArchive("people");
    if (target.id === "archive-comic") openArchive("comic");
    if (target.id === "shop-exit") exitShop();
    if (target.id === "carriage-stop") boardCarriage();
    if (target.id === "gate-return") returnGate();
    if (target.id === "gate" && storyStep === "arrived") visitGrove();
    if (target.id === "city-board")
      speak([
        {
          text: "‘동쪽 숲길의 통행은 기사단 파견 마차를 이용해 주십시오.’\n그 아래에 아르다의 잡화점 전단이 조그맣게 붙어 있다. ‘여행 준비는 여기서 해용! 신기한 여행 이야기도 들려주세용.’",
        },
      ]);
    if (target.id === "fountain") {
      gameAudio.sfx("water");
      speak([
        {
          text: "맑은 물이 돌그릇을 타고 쏟아진다.\n물속에는 소원을 빌며 던진 동전이 몇 개 반짝인다.",
        },
      ]);
    }
    if (target.id === "grove-sign")
      speak([
        {
          text: "‘이슬잎 숲길 — 강 건너 쉼터, 동쪽에 도서관.’\n낯선 종족의 글자 아래에 공용어가 한 줄 더 적혀 있다.",
        },
      ]);
    if (target.id === "river-leaf") {
      if (!fieldFlags.leafTaken) {
        fieldFlags.leafTaken = true;
        giveItem("riverLeaf");
        gameAudio.sfx("registered");
        speak([
          {
            text: "작은 잎 하나가 물가에 내려앉았다.\n손바닥에 올리니 숲의 향이 희미하게 남는다.\n[강가의 잎 ×1을 챙겼다.]",
          },
        ]);
      } else
        speak([
          {
            text: "물은 계속 흘러간다.\n주워 든 잎은 여행 가방 안에서 바스락거린다.",
          },
        ]);
    }
    if (target.id === "spring") {
      let text =
        "맑은 샘물이 바위 틈으로 흘러나온다.\n손을 담그자 기분 좋은 서늘함이 번진다.";
      if (!fieldFlags.springUsed && hp < 24) {
        const amount = 24 - hp;
        hp = 24;
        fieldFlags.springUsed = true;
        gameAudio.sfx("water");
        text =
          "샘물을 한 모금 마시고 잠시 쉬었다.\n숲바람에 먼 길의 피로가 풀린다. [체력 +" +
          amount +
          "]";
      }
      speak([{ text }]);
    }
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
    if (fieldPaths.blocked(location, x, y)) return true;
    if (fieldTerrain.blocked(location, x, y)) return true;
    return npcs.some((n) => Math.abs(n.x - x) < 14 && Math.abs(n.y - y) < 9);
  }
  function movePlayer(dt) {
    // Keep keyboard holds independent from the continuous joystick vector.
    syncMovementKeys();
    const oldX = player.x,
      oldY = player.y;
    let dx = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0) + stick.x,
      dy = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0) + stick.y;
    if (boundaryContact && !fieldPaths.near(location, boundaryContact, player)) boundaryContact = null;
    player.moving = !!(dx || dy);
    if (!player.moving) return;
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? "left" : "right";
    else player.dir = dy < 0 ? "up" : "down";
    const speed = keys.has("ShiftLeft") ? 126 : 76,
      length = Math.max(1, Math.hypot(dx, dy));
    dx = (dx / length) * speed * dt;
    dy = (dy / length) * speed * dt;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2),
    );
    for (let i = 0; i < steps; i++) {
      if (!blocked(player.x + dx / steps, player.y)) player.x += dx / steps;
      if (!blocked(player.x, player.y + dy / steps)) player.y += dy / steps;
    }
    const path = fieldPaths.contact(location, player, dy);
    if (path && path.id !== boundaryContact) { followFieldPath(path); return; }
    footDistance += Math.hypot(player.x - oldX, player.y - oldY);
    if (footDistance >= (keys.has("ShiftLeft") ? 24 : 22)) {
      footDistance = 0;
      const surface =
        location === "grove" && player.x < 165 && player.y > 237
          ? "grass"
          : location;
      gameAudio.sfx(
        "footstep",
        surface + (keys.has("ShiftLeft") ? "-run" : ""),
      );
    }
  }
  function drawPropOutlines() {
    if (phase !== "free") return;
    const nearest = nearby(),
      pulse = motion() ? (Math.sin(elapsed * 1.8) + 1) / 2 : 0.5;
    for (const target of targets()) {
      if (target.kind === "npc") continue;
      const shape = fieldTerrain.outline(location, target.id);
      if (!shape) continue;
      ctx.save();
      const near = nearest?.id === target.id;
      ctx.globalAlpha = near ? 0.9 + pulse * 0.08 : 0.3 + pulse * 0.05;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = near ? 4 : 2;
      ctx.drawImage(shape, 0, 0);
      ctx.restore();
    }
  }
  const patrols = {
    sena: [
      [143, 280],
      [127, 280],
      [127, 299],
      [143, 299],
    ],
  };
  function movePeople(dt) {
    for (const person of npcs) {
      person.moving = false;
      if (
        !motion() ||
        !patrols[person.id] ||
        Math.hypot(person.x - player.x, person.y - player.y) < 65
      )
        continue;
      person.patrolWait = Math.max(0, (person.patrolWait || 0) - dt);
      if (person.patrolWait) continue;
      const path = patrols[person.id],
        target = path[person.patrolIndex || 0],
        dx = target[0] - person.x,
        dy = target[1] - person.y,
        distance = Math.hypot(dx, dy);
      if (distance < 1) {
        person.patrolIndex = ((person.patrolIndex || 0) + 1) % path.length;
        person.patrolWait = 1.8;
        continue;
      }
      const amount = Math.min(distance, dt * 19),
        x = person.x + (dx / distance) * amount,
        y = person.y + (dy / distance) * amount;
      if (
        fieldTerrain.blocked(location, x, y) ||
        npcs.some(
          (other) =>
            other !== person &&
            Math.abs(other.x - x) < 16 &&
            Math.abs(other.y - y) < 10,
        )
      ) {
        person.patrolWait = 1;
        continue;
      }
      person.dir =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
      person.x = x;
      person.y = y;
      person.moving = true;
    }
  }
  function counterFor(a) {
    if (location === "guild" && a.id === "lucy") return { shift: 30, edge: 98 };
    if (location === "shop" && a.id !== "hero") return { shift: 30, edge: 104 };
    if (location === "library" && a.id === "rael")
      return { shift: 41, edge: 126 };
    return null;
  }
  function drawActor(a) {
    const x = Math.round(a.x),
      receptionist = counterFor(a),
      y = Math.round(a.y + (receptionist?.shift || 0));
    // A low, warm contact shadow ties the shared foot anchor to each floor.
    if (!receptionist) {
      rect(ctx, x - 6, y - 1, 12, 3, "#303b324a");
      rect(ctx, x - 8, y, 16, 1, "#303b3233");
    }
    const frame = a.moving
      ? Math.floor(elapsed * (a === player && keys.has("ShiftLeft") ? 12 : 8)) %
        4
      : 0;
    ctx.save();
    if (receptionist) {
      // The desk's back edge covers her lower body while she is at reception.
      ctx.beginPath();
      ctx.rect(0, 0, W, receptionist.edge);
      ctx.clip();
    }
    if (phase === "free" && a !== player) {
      const near = nearby()?.id === a.id,
        pulse = motion() ? (Math.sin(elapsed * 1.8) + 1) / 2 : 0.5;
      ctx.globalAlpha = near ? 0.9 + pulse * 0.08 : 0.3 + pulse * 0.05;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = near ? 4 : 2;
      ctx.drawImage(
        fieldSprites.outline(a.id, a.dir, frame),
        x - fieldSprites.width / 2,
        y - fieldSprites.anchorY,
      );
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    ctx.drawImage(
      makeSprite(a.id, a.dir, frame),
      x - fieldSprites.width / 2,
      y - fieldSprites.anchorY,
    );
    ctx.restore();
  }
  function drawWorld() {
    if ((phase !== "free" || inputLocked) && stick.pointerId !== null) resetJoystick();
    updateObjective();
    const menuUnavailable = phase !== "free" || inputLocked;
    if (menuButton.disabled !== menuUnavailable)
      menuButton.disabled = menuUnavailable;
    ctx.imageSmoothingEnabled = false;
    rect(ctx, 0, 0, W, H, "#121d26");
    ctx.save();
    if (location === "carriage" && motion())
      ctx.translate(0, [0, -1, 0, 1][Math.floor(elapsed * 5) % 4]);
    ctx.drawImage(background, 0, 0);
    if (location === "grove" && !fieldFlags.leafTaken)
      ctx.drawImage(fieldTerrain.leafArt(), 0, 0);
    if (location === "carriage") {
      // Extend the edge rows through the tiny carriage shake, with no bare rim.
      ctx.drawImage(background, 0, 0, W, 1, 0, -2, W, 2);
      ctx.drawImage(background, 0, H - 1, W, 1, 0, H, W, 2);
    }
    drawScenery();
    fieldPaths.draw(ctx, location, elapsed, motion());
    drawPropOutlines();
    [...npcs, player].sort((a, b) => a.y - b.y).forEach(drawActor);
    if (phase === "free") {
      if (location === "library") libraryLetter.draw(ctx, player);
      const target = nearby();
      prompt.textContent = target ? `E · ${target.name}` : "";
      prompt.hidden = !target;
      if (target) {
        const x = Math.round(target.x) + (target.kind === "path" ? 18 : 0),
          person =
            target.kind === "npc" ? npcs.find((n) => n.id === target.id) : null,
          y = target.kind === "path" ? Math.max(2, Math.round(target.y) - 18) : target.kind === "letter" ? Math.round(target.y) - 27 : person
            ? Math.max(
                2,
                Math.round(person.y + (counterFor(person)?.shift || 0)) -
                  fieldSprites.bodyHeight(person.id) -
                  18,
              )
            : Math.round(target.y) - 65;
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
    if (phase === "free") {
      movePlayer(dt);
      if (phase === "free" && location === "grove" && player.y < 312 && player.x > 360 && !fieldFlags.libraryAmbushCleared)
        startForestAmbush();
      if (phase === "free") movePeople(dt);
      if (location === "library" && !document.hidden)
        libraryLetter.update(dt, motion());
      if (elapsed >= nextAutosave) {
        saveProgress();
        nextAutosave = elapsed + 2;
      }
    } else player.moving = false;
    if (phase !== "battle") {
      drawWorld();
      drawVista();
    }
    if (phase === "vista" && cinematic?.key === "forest" && cinematic.started !== null &&
      elapsed - cinematic.started >= (motion() ? journeyCinematic.duration : 6)) finishVista();
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
    document.querySelector("#guild-item-inspect").hidden = true;
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
        action.textContent = fieldWorld.items[item.id]?.heal
          ? "사용 · E"
          : item.id === "map"
            ? "지도 펼치기 · E"
            : "살펴보기 · E";
        document.querySelector("#guild-item-inspect").hidden =
          !fieldWorld.items[item.id]?.heal && item.id !== "map";
      }
    } else if (menuTab === "quest") {
      const h = document.createElement("p");
      h.className = "quest-entry";
      h.textContent = questAccepted
        ? "▸ 성역의 이상 징후 사전 조사"
        : "아직 수락한 의뢰가 없다.";
      itemList.append(h);
      if (objectiveGuide.snapshot().unlocked) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.id = "objective-menu-toggle";
        toggle.textContent = objectiveGuide.snapshot().dismissed ? "목표 표시 · E" : "목표 숨기기 · E";
        toggle.addEventListener("click", toggleObjective);
        itemList.append(toggle);
      }
      itemDetail.textContent = questAccepted
        ? `의뢰인: 제르디아 기사단\n목적지: 성역 그린스토아\n\n성역에 감도는 이상 징후를 사전 조사한다.\n${["guild", "city", "cliff"].includes(location) || (location === "shop" && shopOrigin === "city") ? "광장의 기사단 마차로 출발하자." : ["gate", "grove", "library"].includes(location) || (location === "shop" && shopOrigin === "grove") ? "정문 통과 완료 · 이슬잎 도서관에서 성역의 기록을 읽어 보자." : "그린스토아로 이동 중이다."}`
        : "접수원 루시에게 말을 걸어 보자.";
    } else {
      itemDetail.textContent =
        matchMedia("(pointer: coarse)").matches
          ? "왼쪽 조이스틱을 원하는 방향으로 밀어 이동한다.\n조금 밀면 천천히, 끝까지 밀면 빠르게 걷는다.\n달리기 버튼을 함께 누르면 달린다.\nE 버튼으로 대화 · 조사 · 대사를 넘긴다.\n\n위쪽 메뉴 버튼으로 기록을 열고,\n탭과 항목을 터치해 선택한다. 닫기 버튼으로 돌아간다."
          : "W A S D  이동\n왼쪽 Shift  달리기\nE  대화 · 조사 · 대사 넘기기\nC  메뉴 열기 · 닫기\n\n메뉴 안에서는 W/S로 소지품을, A/D로 탭을 선택한다.\nE로 결정하고 C 또는 Esc로 돌아간다.";
    }
  }
  function toggleObjective() {
    if (phase !== "menu" || !objectiveGuide.snapshot().unlocked) return;
    if (objectiveGuide.snapshot().dismissed) objectiveGuide.reveal(); else objectiveGuide.dismiss();
    renderMenu();
    document.querySelector("#objective-menu-toggle")?.focus({ preventScroll: true });
  }
  function openMenu() {
    if (phase !== "free") return;
    saveProgress();
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
  function hideItemInspection() {
    itemSpecimens.hide();
    itemInspection.hidden = true;
    document.querySelector(".guild-menu-panel").inert = false;
  }
  function inspectItem() {
    if (phase !== "menu" || menuTab !== "items") return;
    const item = inventory[selectedItem];
    if (!item) return;
    keys.clear();
    phase = "inspect";
    root.dataset.phase = phase;
    itemInspection.dataset.item = item.id;
    document.querySelector("#item-inspection-title").textContent = item.name;
    const heal = fieldWorld.items[item.id]?.heal;
    document.querySelector("#item-inspection-meta").textContent =
      (heal ? `소모품 · 체력 ${heal} 회복` :
        ["dispatch", "credentials", "libraryLetter"].includes(item.id) ? "문서" :
          item.id === "map" ? "지도" : "여행의 소지품") + ` · 소지 ${item.count}개`;
    document.querySelector("#item-inspection-description").textContent =
      item.description || fieldWorld.items[item.id]?.description || "여행 중에 챙긴 소지품이다.";
    document.querySelector(".guild-menu-panel").inert = true;
    itemInspection.hidden = false;
    itemSpecimens.show(item, {container: document.querySelector("#item-inspection-visual")});
    inspectionInputAfter = performance.now() + 180;
    gameAudio.sfx("paper");
    document.querySelector("#item-inspection-close").focus({ preventScroll: true });
  }
  function closeItemInspection() {
    if (phase !== "inspect" || performance.now() < inspectionInputAfter) return;
    hideItemInspection();
    phase = "menu";
    root.dataset.phase = phase;
    gameAudio.sfx("menuClose");
    const inspect = document.querySelector("#guild-item-inspect");
    (inspect.hidden ? document.querySelector("#guild-item-action") : inspect)
      .focus({ preventScroll: true });
  }
  function useItem() {
    if (menuTab !== "items") return;
    const item = inventory[selectedItem];
    if (!item) return;
    if (item.id === "map") {
      showEvent("map", { after: openMenu });
      return;
    }
    const healing = fieldWorld.items[item.id]?.heal;
    if (healing) {
      if (hp === 24) {
        itemDetail.textContent = "체력이 가득하다. 필요할 때 사용하자.";
        return;
      }
      const restored = Math.min(24 - hp, healing);
      hp += restored;
      gameAudio.sfx(item.id === "bread" ? "eat" : "drink");
      item.count--;
      if (!item.count) inventory.splice(selectedItem, 1);
      renderMenu();
      itemDetail.textContent =
        item.name + "을(를) 사용했다.\n체력이 " + restored + " 회복되었다.";
    } else {
      inspectItem();
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
    // Some keyboards emit another keydown without repeat=true. A release is
    // required before the same physical key can advance dialogue again.
    const repeat = event.repeat || (event.type === "keydown" && keyboardPressed.has(code));
    if (event.type === "keydown") keyboardPressed.add(code);
    if (movementCodes.has(code)) {
      keyboardMovement.add(code);
      syncMovementKeys();
    }
    // Let the native sound button handle its own keyboard activation.
    if (["Enter", "Space"].includes(code) && event.target.closest?.("#game-sound-toggle"))
      return;
    if (["Enter", "Space"].includes(code) && event.target.closest?.("#game-dialogue-scroll"))
      return;
    if (phase === "board") {
      if (noticeBoard.handle(event, repeat)) event.preventDefault();
      return;
    }
    if (phase === "battle") {
      if (["Enter", "Space"].includes(code) &&
        event.target.closest?.("#battle-screen button:not([disabled])")) return;
      if (battleScenes.handle(code, repeat, event.shiftKey)) event.preventDefault();
      return;
    }
    if (phase === "inspect") {
      if (["Enter", "Space"].includes(code) && event.target.closest?.("#item-inspection button"))
        return;
      if(itemSpecimens.handle(code,event)){event.preventDefault();return;}
      if (code === "Tab") {
        event.preventDefault();
        const buttons = [...itemInspection.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter(node=>node.getClientRects().length),
          index = buttons.indexOf(document.activeElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      } else if (["KeyE", "KeyC", "Enter", "Escape"].includes(code)) {
        event.preventDefault();
        if (!repeat) closeItemInspection();
      } else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Space"].includes(code)) {
        const card = itemInspection.querySelector("article");
        event.preventDefault();
        if (code === "Home") card.scrollTop = 0;
        else if (code === "End") card.scrollTop = card.scrollHeight;
        else card.scrollTop += (code === "ArrowUp" || code === "PageUp" ? -1 : 1) *
          (code.startsWith("Page") || code === "Space" ? card.clientHeight * 0.75 : 40);
      }
      return;
    }
    if (phase === "letter") {
      if (libraryLetter.handle(code, repeat, event.shiftKey))
        event.preventDefault();
      return;
    }
    if (phase === "archive") {
      if (
        ["Enter", "Space"].includes(code) &&
        event.target.closest?.("#library-reader button")
      )
        return;
      if (libraryArchive.handle(code, repeat, event.shiftKey))
        event.preventDefault();
      return;
    }
    if (phase === "action") {
      if (code === "Tab") {
        event.preventDefault();
        document
          .querySelector(
            document.activeElement.id === "action-next"
              ? "#game-sound-toggle"
              : "#action-next",
          )
          .focus({ preventScroll: true });
      } else if (["KeyE", "Enter", "Escape"].includes(code)) {
        event.preventDefault();
        if (!repeat) actionScenes.finish();
      } else if (
        ["KeyW", "KeyA", "KeyS", "KeyD", "KeyC", "ShiftLeft"].includes(code)
      )
        event.preventDefault();
      return;
    }
    if (phase === "shop") {
      // Preserve native keyboard activation for the focused shop buttons.
      if (
        ["Enter", "Space"].includes(code) &&
        event.target.closest?.("#field-shop button")
      )
        return;
      if (
        [
          "Tab",
          "KeyW",
          "KeyS",
          "KeyE",
          "KeyC",
          "Escape",
          "Enter",
          "ArrowUp",
          "ArrowDown",
        ].includes(code)
      ) {
        event.preventDefault();
        shopView.handle(code, repeat, event.shiftKey);
      }
      return;
    }
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
    if (phase === "menu" && ["Enter", "Space"].includes(code) &&
      event.target.closest?.("#guild-menu button")) return;
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
      if (!repeat && ["KeyE", "Enter", "Escape"].includes(code))
        eventScenes.finish();
      return;
    }
    if (phase === "menu") {
      if (repeat) return;
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
      } else if (code === "KeyE" || code === "Enter") { if (menuTab === "quest") toggleObjective(); else useItem(); }
      return;
    }
    if (phase === "dialogue") {
      if (repeat) return;
      if (
        dialogue?.choices &&
        !choicesBox.hidden &&
        (code === "KeyW" ||
          code === "ArrowUp" ||
          code === "KeyS" ||
          code === "ArrowDown")
      ) {
        const offset = code === "KeyW" || code === "ArrowUp" ? -1 : 1;
        gameAudio.sfx("select");
        selectChoice(selectedChoice + offset, true);
      } else if (["KeyC", "Escape"].includes(code) && dialogue?.choices && !choicesBox.hidden) {
        const cancel = dialogue.choices.findIndex(choice => choice.cancel);
        if (cancel !== -1) choose(cancel);
      } else if (code === "KeyE" || code === "Enter") advanceDialogue();
      return;
    }
    if (phase === "vista") {
      if (!repeat && (code === "KeyE" || code === "Enter")) finishVista();
      return;
    }
    if (phase !== "free") return;
    if (code === "KeyC" && !repeat) {
      openMenu();
      return;
    }
    if (code === "KeyE") {
      if (!repeat) interact();
      return;
    }
  }
  document.addEventListener("keydown", handleKey);
  document.addEventListener("keyup", (event) => {
    keyboardPressed.delete(event.code);
    keyboardMovement.delete(event.code);
    syncMovementKeys();
    battleScenes.release(event.code);
  });
  function clearKeys() {
    keyboardPressed.clear();
    keyboardMovement.clear();
    touchMovement.clear();
    resetJoystick();
    keys.clear();
    updateTouchButtons();
    battleScenes.clearInput();
    if (player) player.moving = false;
  }
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveProgress();
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
  window.addEventListener("pagehide", () => saveProgress());
  document.querySelector("#guild-save").addEventListener("click", () => saveProgress({ manual: true }));
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
  document.querySelector("#guild-item-inspect").addEventListener("click", inspectItem);
  document.querySelector("#item-inspection-close").addEventListener("click", closeItemInspection);
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
    if (portrait.hidden) return;
    const box = dialogueBox.getBoundingClientRect();
    const mobile = view.width <= 700,
      ratio = portrait.width / portrait.height;
    const headerSpace = mobile ? 64 : view.height < 500 ? 56 : 104;
    const available = Math.max(0, box.top - view.top - headerSpace);
    const desired = Math.min(
      view.height * (mobile ? 0.48 : 0.58),
      mobile ? 350 : 450,
    );
    const widthLimit = box.width * (mobile ? 0.96 : 0.54);
    const height = Math.min(available, desired, widthLimit / ratio);
    // Set both dimensions together so max-width never silently shrinks the bust.
    portraitFrame.style.height = height + "px";
    portraitFrame.style.width = height * ratio + "px";
    portraitFrame.style.maxHeight = "none";
  }
  const dialogueLayout = new ResizeObserver(() => { fitPortrait(); updateDialogueScroll(); });
  dialogueLayout.observe(dialogueBox);
  dialogueLayout.observe(root);
  dialogueLayout.observe(dialogueText.parentElement);
  dialogueLayout.observe(choicesBox);
  const vistaLayout = new ResizeObserver(fitVista);
  vistaLayout.observe(root);
  vistaLayout.observe(document.querySelector(".vista-copy"));
  for (const surface of [document.querySelector(".game-touch"), document.querySelector("#battle-touch-pad")])
    for (const name of ["contextmenu", "selectstart", "touchstart"])
      surface.addEventListener(name, event => event.preventDefault(), { passive: false });
  joystick.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (!active || inputLocked || phase !== "free" || document.hidden || event.button !== 0 || stick.pointerId !== null) return;
    stick.pointerId = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    joystick.classList.add("is-held");
    moveJoystick(event);
  });
  joystick.addEventListener("pointermove", event => {
    if (event.pointerId !== stick.pointerId) return;
    event.preventDefault();
    if (phase !== "free" || inputLocked) { resetJoystick(); return; }
    moveJoystick(event);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    joystick.addEventListener(name, event => { if (event.pointerId === stick.pointerId) resetJoystick(); });
  window.addEventListener("resize", resetJoystick);
  for (const b of touchButtons) {
    b.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (!active || inputLocked || document.hidden || event.button !== 0) return;
      b.setPointerCapture(event.pointerId);
      const code = b.dataset.gameKey;
      if (code === "KeyE") {
        handleKey({ code, target: b, repeat: false, preventDefault() {} });
      } else {
        touchMovement.set(event.pointerId, { button: b, codes: code.split(" ") });
        syncMovementKeys();
        updateTouchButtons();
      }
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      b.addEventListener(name, (event) => {
        touchMovement.delete(event.pointerId);
        syncMovementKeys();
        updateTouchButtons();
      });
  }
  function saveProgress({ manual = false, opening = false } = {}) {
    if (!active || inputLocked || (!opening && !["free", "menu"].includes(phase))) return false;
    const saved = journeySave.write({
      name: playerName,
      resume: opening ? "opening" : "world",
      location, storyStep, questAccepted, hp, coins, shopOrigin,
      player: { x: player.x, y: player.y, dir: player.dir },
      npcs: npcs.map(person => ({
        id: person.id, x: person.x, y: person.y, dir: person.dir,
        talkCount: person.talkCount || 0,
      })),
      inventory: inventory.map(item => ({ ...item })),
      shopStocks,
      fieldFlags: { ...fieldFlags },
      visited: [...visited],
      journeyMusic: gameAudio.getJourneyState(),
      objectiveGuide: objectiveGuide.snapshot(),
    });
    const label = document.querySelector("#guild-save-status");
    label.textContent = saved
      ? `저장 완료 · ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
      : "저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.";
    if (manual) {
      if (saved) gameAudio.sfx("registered");
      notify(saved ? "여정을 저장했다. 타이틀에서 이어할 수 있다." : label.textContent);
    }
    return saved;
  }
  async function start(name, exit, saved = null) {
    if (saved && !journeySave.valid(saved)) throw new Error("Invalid journey save");
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
    nextAutosave = 0;
    resumingSave = !!saved;
    boundaryContact = null;
    restoredMusic = saved?.journeyMusic ?? null;
    objectiveGuide.reset(saved?.objectiveGuide);
    objectiveGuide.bind({ onSettingsChange: () => saveProgress() });
    location = "guild";
    storyStep = "lucy";
    shopOrigin = "city";
    shopStocks = fieldWorld.freshStock();
    fieldFlags = {
      lucyFarewell: false,
      leafTaken: false,
      springUsed: false,
      libraryReached: false,
      libraryLetterRead: false,
      libraryAmbushCleared: false,
    };
    visited.clear();
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
    npcs = guildPeople();
    if (saved) {
      playerName = saved.name;
      cast.hero.name = saved.name;
      location = saved.location;
      storyStep = saved.storyStep;
      questAccepted = saved.questAccepted;
      hp = saved.hp;
      coins = saved.coins;
      shopOrigin = saved.shopOrigin;
      shopStocks = JSON.parse(JSON.stringify(saved.shopStocks));
      fieldFlags = { ...saved.fieldFlags };
      inventory = saved.inventory.map(item => ({ ...item }));
      player = actor("hero", saved.player.x, saved.player.y, saved.player.dir);
      fieldPaths.settle(location, player);
      npcs = saved.npcs.map(person => ({ ...actor(person.id, person.x, person.y, person.dir), talkCount: person.talkCount }));
      // Older saves may contain the previous plaza patrol position.
      if (location === "city") for (const npc of npcs) if (npc.id === "edan") { npc.x = 500; npc.y = 365; npc.dir = "right"; }
      visited.clear();
      saved.visited.forEach(place => visited.add(place));
      buildMap();
      updateObjective();
    }
    root.hidden = false;
    menu.hidden = true;
    document.querySelector("#game-toast").hidden = true;
    previous = performance.now();
    drawWorld();
    request = requestAnimationFrame(tick);
    canvas.focus({ preventScroll: true });
    if (!saved || saved.resume === "opening") wakeAtCounter();
    else if (location === "carriage") carriageConversation();
    else if (location === "gate" && storyStep === "arrival") welcomeAtGate();
    else {
      phase = "free";
      root.dataset.phase = phase;
    }
  }
  function stop() {
    saveProgress();
    active = false;
    noticeBoard.hide();
    updateObjective();
    ++transitionSerial;
    transitionAnimation?.cancel();
    transition.hidden = true;
    cancelPortraitMotion();
    hideVista();
    hideEvent();
    hideTrading();
    hideReading();
    hideLibraryLetter(true);
    hideItemInspection();
    hideAction();
    hideBattle();
    gameAudio.stopTransient();
    gameAudio.scene("title");
    cancelAnimationFrame(request);
    clearTimeout(typingTimer);
    clearTimeout(toastTimer);
    clearKeys();
    dialogue = null;
    root.hidden = true;
    menu.hidden = true;
    dialogueBox.hidden = true;
    dialogueScroll.hidden = true;
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
    if (!resumingSave) saveProgress({ opening: true });
    else if (location === "library" && !fieldFlags.libraryLetterRead) welcomeLibrary();
    if (resumingSave && !fieldFlags.libraryAmbushCleared && ["checkpoint", "gate", "grove"].includes(location) &&
      (restoredMusic?.active ?? true)) gameAudio.startJourney(restoredMusic?.offset ?? 0);
    if (resumingSave && phase === "free") notify("저장된 여정에서 이어간다.");
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
        action: actionScenes.kind,
        archive: libraryArchive.active ? libraryArchive.tab : null,
        letter: libraryLetter.delivery,
        battle: battleScenes.getState(),
        inspectedItem: phase === "inspect" ? inventory[selectedItem]?.id : null,
        vista: cinematic?.key || null,
        expression: dialogue?.lines[dialogue.index].expression || "neutral",
        player: player
          ? { x: player.x, y: player.y, direction: player.dir }
          : null,
        questAccepted,
        objectiveGuide: objectiveGuide.snapshot(),
        hp,
        coins,
        shop: shopView.active ? shopOrigin : null,
        stock: Object.fromEntries(
          Object.entries(shopStocks).map(([key, value]) => [key, { ...value }]),
        ),
        visited: [...visited],
        fieldFlags: { ...fieldFlags },
        items: inventory.map((i) => ({ id: i.id, count: i.count })),
        npcs: npcs.map((n) => ({ id: n.id, x: n.x, y: n.y })),
        speaker: dialogue ? dialogue.lines[dialogue.index].kind : null,
        line: dialogue?.index,
      };
    },
  };
})();
