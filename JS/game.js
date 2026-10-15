// A self-contained 30 × 20 tile guild room. World coordinates are pixels at 720 × 480.
const guildGame = (() => {
  const root = document.querySelector("#game-screen");
  const canvas = document.querySelector("#guild-world");
  const ctx = canvas.getContext("2d");
  const assets = document.querySelector("#guild-assets");
  const portrait = document.querySelector("#dialogue-portrait");
  const portraitContext = portrait.getContext("2d");
  const dialogueBox = document.querySelector("#game-dialogue");
  const dialogueText = document.querySelector("#game-dialogue-text");
  const dialogueLive = document.querySelector("#game-dialogue-live");
  const speakerLabel = document.querySelector("#game-speaker");
  const nextLabel = document.querySelector("#game-dialogue-next");
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
  const wallBounds = { left: 32, right: 688, top: 178, bottom: 446 };
  const collisions = [
    { x: 224, y: 130, w: 304, h: 40 },
    { x: 24, y: 174, w: 38, h: 100 },
    { x: 100, y: 294, w: 112, h: 50 },
    { x: 62, y: 394, w: 134, h: 25 },
    { x: 548, y: 326, w: 102, h: 48 },
    { x: 648, y: 178, w: 48, h: 89 },
    { x: 660, y: 310, w: 35, h: 96 },
    ...[
      [115, 268],
      [171, 268],
      [116, 356],
      [171, 356],
      [564, 301],
      [610, 301],
      [564, 386],
      [610, 386],
    ].map(([x, y]) => ({ x, y: y + 8, w: 18, h: 16 })),
    ...[210, 242, 274].flatMap((y) => [
      { x: 319, y, w: 5, h: 7 },
      { x: 407, y, w: 5, h: 7 },
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
      coat: "#795144",
      trim: "#b38b69",
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
  ]);
  // Attach rejection handling before a player chooses to enter the room.
  ready.catch(() => {});
  let active = false,
    phase = "idle",
    request = 0,
    previous = 0,
    elapsed = 0;
  let inputLocked = true;
  let player,
    npcs = [],
    playerName = "",
    onExit,
    dialogue = null,
    queueTime = 0;
  let questAccepted = false,
    inventory = [],
    hp = 18,
    coins = 18;
  let menuTab = "items",
    selectedItem = 0,
    selectedChoice = 0;
  let typingTimer = 0,
    toastTimer = 0;
  const background = document.createElement("canvas");
  background.width = W;
  background.height = H;
  const map = background.getContext("2d");
  const spriteBank = new Map();
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
  function shelf(x, y, w, h) {
    panel(map, x, y, w, h, "#66472f");
    for (let row = 0; row < h - 12; row += 22) {
      rect(map, x + 4, y + 6 + row, w - 8, 16, "#352e2b");
      for (let col = 0; col < w - 12; col += 7) {
        const colors = ["#7a6b63", "#69516e", "#6a815c", "#ac8c5c"];
        rect(map, x + 5 + col, y + 9 + row, 5, 12, colors[hash(col, row) % 4]);
        rect(map, x + 6 + col, y + 11 + row, 3, 1, "#c9b788");
      }
      rect(map, x + 2, y + 23 + row, w - 4, 3, "#ad794b");
    }
  }
  function chair(x, y) {
    panel(map, x, y, 18, 19, "#795136");
    rect(map, x + 2, y + 2, 14, 5, "#b98a58");
    rect(map, x + 1, y + 17, 3, 7, "#362c2a");
    rect(map, x + 14, y + 17, 3, 7, "#362c2a");
  }
  function table(x, y, w, h) {
    rect(map, x + 6, y + h - 3, w - 10, 8, "#302b26");
    panel(map, x, y, w, h, "#a3774b");
    for (let i = 8; i < h - 5; i += 9)
      rect(map, x + 4, y + i, w - 8, 1, "#805535");
    rect(map, x + 8, y + 7, w - 16, 2, "#c89b66");
  }
  function cup(x, y) {
    rect(map, x, y, 6, 7, "#352f31");
    rect(map, x + 1, y + 1, 4, 4, "#b99e72");
    rect(map, x + 6, y + 2, 2, 3, "#98865e");
  }
  function plant(x, y) {
    rect(map, x + 3, y + 12, 14, 10, "#473b36");
    rect(map, x + 4, y + 12, 12, 4, "#bb7850");
    rect(map, x + 9, y, 3, 14, "#546a3b");
    rect(map, x, y + 3, 8, 5, "#758c4c");
    rect(map, x + 11, y + 1, 10, 6, "#859c53");
    rect(map, x + 4, y + 7, 8, 5, "#47623b");
    rect(map, x + 12, y + 8, 9, 5, "#607d40");
  }
  function banner(x, y) {
    rect(map, x - 2, y - 3, 32, 4, "#b29764");
    rect(map, x, y, 28, 52, "#302a42");
    rect(map, x + 3, y, 22, 45, "#64516f");
    rect(map, x + 5, y + 5, 18, 2, "#bba679");
    rect(map, x + 12, y + 15, 4, 20, "#d5c28c");
    rect(map, x + 7, y + 22, 14, 4, "#d5c28c");
    rect(map, x + 7, y + 41, 14, 5, "#807087");
    rect(map, x + 10, y + 46, 8, 5, "#64516f");
  }
  function buildMap() {
    rect(map, 0, 0, W, H, "#171b25");
    for (let y = 120; y < 480; y += 24)
      for (let x = 0; x < 720; x += 48) {
        const offset = (Math.floor(y / 24) % 2) * 24,
          xx = x - offset;
        rect(
          map,
          xx,
          y,
          47,
          23,
          ["#87633f", "#89633f", "#916d46"][hash(x, y) % 3],
        );
        rect(map, xx + 2, y + 2, 43, 1, "#ab8256");
        rect(map, xx + 3, y + 19, 40, 1, "#765337");
        rect(map, xx + 6 + hash(x, y), y + 8, 16, 1, "#7b593a");
        rect(map, xx + 35, y + 5, 1, 2, "#654c35");
      }
    // Stone back wall with wooden beams and a raised reception floor.
    rect(map, 18, 12, 684, 112, "#4a4650");
    for (let y = 16; y < 116; y += 18)
      for (let x = 22; x < 700; x += 40) {
        const dx = ((y / 18) % 2) * 16;
        rect(
          map,
          x - dx,
          y,
          37,
          15,
          ["#57545d", "#625b61", "#59545b"][hash(x, y) % 3],
        );
        rect(map, x - dx + 2, y + 1, 33, 1, "#71686b");
      }
    rect(map, 18, 116, 684, 12, "#a0784e");
    rect(map, 18, 128, 684, 5, "#392e2d");
    for (const x of [18, 192, 516, 688]) {
      rect(map, x, 12, 14, 122, "#3b302f");
      rect(map, x + 3, 12, 4, 120, "#8d6548");
    }
    for (const x of [72, 582]) {
      panel(map, x, 32, 60, 65, "#9daaa3");
      rect(map, x + 5, 37, 50, 51, "#8aabb0");
      rect(map, x + 8, 40, 18, 23, "#b4c3b9");
      rect(map, x + 32, 40, 18, 23, "#aec7c4");
      rect(map, x + 28, 35, 4, 57, "#524640");
      rect(map, x + 3, 64, 54, 4, "#524640");
      rect(map, x - 3, 96, 66, 5, "#b08a61");
    }
    banner(242, 35);
    banner(454, 35);
    panel(map, 318, 27, 84, 62, "#393344", "#b28f5d");
    rect(map, 353, 37, 10, 35, "#c7b17c");
    rect(map, 337, 50, 43, 7, "#c7b17c");
    rect(map, 342, 43, 7, 23, "#7b6979");
    rect(map, 369, 43, 7, 23, "#7b6979");
    rect(map, 338, 78, 43, 2, "#918064");
    // Woven red runner down the center aisle.
    rect(map, 292, 167, 136, 276, "#46343a");
    rect(map, 296, 169, 128, 272, "#8b5c56");
    rect(map, 302, 170, 116, 270, "#75464a");
    for (let y = 176; y < 438; y += 12) {
      rect(map, 298, y, 2, 6, "#c3a477");
      rect(map, 420, y, 2, 6, "#c3a477");
    }
    for (let y = 184; y < 436; y += 40) {
      rect(map, 355, y, 10, 2, "#9d6d5b");
      rect(map, 359, y - 4, 2, 10, "#9d6d5b");
    }
    // Reception counter: papers and a small brass bell.
    table(224, 130, 304, 38);
    rect(map, 229, 157, 294, 12, "#5b3c2e");
    for (let x = 237; x < 520; x += 39) {
      rect(map, x, 160, 31, 7, "#805536");
      rect(map, x + 3, 161, 25, 1, "#a97948");
    }
    panel(map, 270, 137, 24, 14, "#ddd2ad", "#5e4b36");
    rect(map, 275, 141, 14, 1, "#93816b");
    rect(map, 275, 145, 11, 1, "#93816b");
    panel(map, 440, 137, 28, 15, "#685c58");
    rect(map, 444, 139, 20, 10, "#b9aa8b");
    rect(map, 394, 142, 12, 5, "#725332");
    rect(map, 397, 138, 6, 5, "#d9bd75");
    rect(map, 399, 136, 2, 2, "#e5cd8d");
    // Walls and tactile room props.
    rect(map, 16, 132, 12, 336, "#332d2c");
    rect(map, 692, 132, 12, 336, "#332d2c");
    rect(map, 22, 132, 7, 336, "#a1764f");
    rect(map, 692, 132, 6, 336, "#9c734c");
    shelf(27, 174, 34, 100);
    shelf(661, 310, 32, 96);
    panel(map, 78, 135, 96, 50, "#785336");
    for (const [x, y, a] of [
      [85, 142, 0],
      [107, 149, 1],
      [134, 140, 0],
      [150, 155, 1],
    ]) {
      rect(map, x, y, 15, 22, "#d1bb8c");
      rect(map, x + 3, y + 6, 9, 1, "#927c58");
      rect(map, x + 3, y + 10, 7, 1, "#927c58");
      rect(map, x + 6, y + 2, 3, 3, a ? "#775b61" : "#7c805b");
    }
    table(100, 294, 112, 50);
    chair(115, 268);
    chair(171, 268);
    chair(116, 356);
    chair(171, 356);
    cup(119, 310);
    cup(181, 318);
    rect(map, 145, 306, 21, 16, "#d3be93");
    rect(map, 149, 311, 12, 1, "#9b8361");
    table(548, 326, 102, 48);
    chair(564, 301);
    chair(610, 301);
    chair(564, 386);
    chair(610, 386);
    cup(568, 341);
    rect(map, 592, 340, 26, 17, "#625675");
    rect(map, 596, 342, 21, 13, "#b9aa88");
    table(62, 394, 134, 25);
    plant(206, 144);
    plant(604, 141);
    plant(45, 426);
    plant(648, 430);
    // Fireplace at the east wall, with a fixed dark opening for animated fire.
    panel(map, 647, 174, 50, 91, "#5a5450");
    rect(map, 643, 174, 57, 8, "#8b8170");
    rect(map, 653, 194, 37, 46, "#292727");
    rect(map, 657, 199, 29, 36, "#17191f");
    rect(map, 646, 244, 53, 10, "#a08966");
    rect(map, 651, 254, 44, 6, "#504741");
    rect(map, 660, 232, 24, 5, "#6c4434");
    for (const y of [210, 242, 274])
      for (const x of [319, 407]) {
        rect(map, x - 1, y - 20, 7, 22, "#40352b");
        rect(map, x, y - 20, 5, 3, "#d2b47b");
        rect(map, x + 1, y - 16, 3, 18, "#a27a4b");
        if (y !== 274) rect(map, x + 2, y - 11, 2, 32, "#655044");
      }
    // Front wall and open doorway.
    rect(map, 18, 457, 684, 18, "#3a3030");
    rect(map, 18, 457, 684, 4, "#b48956");
    rect(map, 324, 449, 72, 26, "#302c2c");
    rect(map, 330, 453, 60, 22, "#5b5149");
    for (let i = 0; i < 3; i++) rect(map, 331, 456 + i * 6, 58, 2, "#ad9271");
  }

  function makeSprite(kind, direction, frame) {
    const key = kind + direction + frame;
    if (spriteBank.has(key)) return spriteBank.get(key);
    const image = document.createElement("canvas");
    image.width = 32;
    image.height = 42;
    const c = image.getContext("2d");
    const p = cast[kind],
      bob = frame === 1 || frame === 3 ? 1 : 0,
      step = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    const q = (x, y, w, h, color) => rect(c, x, y + bob, w, h, color);
    // Boots and independently alternating legs.
    rect(c, 10, 33 + Math.max(0, step), 5, 7 - Math.max(0, step), "#302b31");
    rect(c, 18, 33 + Math.max(0, -step), 5, 7 - Math.max(0, -step), "#302b31");
    rect(c, 9, 38 + Math.min(0, step), 7, 3, "#5b4538");
    rect(c, 17, 38 + Math.min(0, -step), 7, 3, "#5b4538");
    if (kind === "hero") {
      q(8, 14, 17, 20, "#222d39");
      q(6, 23, 21, 13, "#293747");
      q(8, 21, 17, 14, p.coat);
      q(10, 19, 3, 15, "#596976");
      q(23, 22, 2, 11, "#1e2936");
      q(7, 30, 20, 5, "#354351");
      q(9, 4, 15, 4, "#263442");
      q(6, 8, 21, 13, "#263442");
      q(8, 6, 17, 17, p.coat);
      if (direction !== "up") {
        q(
          direction === "left" ? 8 : direction === "right" ? 13 : 10,
          10,
          12,
          10,
          "#101820",
        );
        q(11, 10, 9, 8, "#090f15");
      }
      q(8, 18, 19, 4, "#64717a");
      q(11, 20, 3, 8, "#485c69");
      q(9, 30, 16, 2, "#785b43");
      q(18, 28, 7, 7, "#8b6c4b");
      q(6, 25, 3, 6, "#293039");
      q(25, 25, 3, 6, "#293039");
    } else {
      const dwarf = kind === "tobin";
      if (kind === "lucy" || kind === "mia" || kind === "nara") {
        q(8, 9, 18, 16, p.hair);
        q(23, 13, 5, 16, p.hair);
        q(25, 22, 4, 7, "#8c9567");
      }
      q(8, 20, dwarf ? 19 : 17, 14, "#262a2c");
      q(9, 20, dwarf ? 17 : 15, 13, p.coat);
      q(7, 23, 4, 10, p.coat);
      q(23, 23, 4, 10, p.coat);
      q(10, 21, 2, 10, p.trim);
      q(21, 21, 2, 10, p.trim);
      q(11, 33, 11, 2, "#3e3633");
      q(9, 5, 15, 4, p.hair);
      q(7, 9, 19, 10, p.hair);
      if (direction !== "up") {
        const side = direction === "left" ? -2 : direction === "right" ? 2 : 0;
        q(10 + side, 9, 13, 10, p.skin);
        q(10 + side, 8, 13, 4, p.hair);
        q(9 + side, 9, 4, 7, p.hair);
        q(12 + side, 14, 2, 2, kind === "lucy" ? "#8b4b77" : "#2c3032");
        if (direction === "down")
          q(20, 14, 2, 2, kind === "lucy" ? "#8b4b77" : "#2c3032");
        q(15 + side, 19, 5, 1, "#b48172");
        if (kind === "tobin") {
          q(10, 16, 15, 8, p.hair);
          q(13, 22, 9, 4, p.hair);
          q(13, 18, 8, 1, "#b18457");
        }
        if (kind === "leon") {
          q(10, 13, 6, 5, "#b4aea0");
          q(18, 13, 6, 5, "#b4aea0");
          q(12, 14, 3, 2, "#3f485b");
          q(20, 14, 3, 2, "#3f485b");
        }
      }
      if (kind === "lucy") {
        q(14, 22, 6, 10, "#e9e5d6");
        q(15, 22, 4, 3, "#705281");
        q(16, 25, 2, 5, "#705281");
        q(7, 31, 4, 3, "#34303b");
        q(24, 31, 4, 3, "#34303b");
      }
      if (kind === "bran") {
        q(10, 20, 15, 3, "#a15c49");
        q(12, 23, 3, 6, "#a15c49");
      }
      if (kind === "nara") {
        q(7, 3, 5, 8, p.hair);
        q(21, 3, 5, 8, p.hair);
        q(8, 4, 2, 4, "#b38a80");
        q(22, 4, 2, 4, "#b38a80");
        q(20, 28, 7, 6, "#8b6947");
      }
      if (kind === "mia") {
        q(23, 13, 3, 19, "#8c6848");
        q(23, 29, 3, 3, "#b3a76b");
      }
    }
    spriteBank.set(key, image);
    return image;
  }
  buildMap();
  for (const kind of Object.keys(cast))
    for (const dir of ["up", "down", "left", "right"])
      for (let f = 0; f < 4; f++) makeSprite(kind, dir, f);

  function actor(id, x, y, dir = "down") {
    return { id, x, y, dir, moving: false, path: [], pathDelay: 0 };
  }
  function updateObjective() {
    objective.textContent = questAccepted
      ? "봉인된 서신을 챙기고 출발을 준비하자."
      : phase === "queue"
        ? "접수 순서를 기다리자."
        : "루시에게 그린스토아행 의뢰를 확인하자.";
  }
  function notify(text) {
    const toast = document.querySelector("#game-toast");
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2600);
  }
  function portraitFor(kind) {
    portraitContext.clearRect(0, 0, portrait.width, portrait.height);
    portrait.hidden = !kind;
    if (!kind) return;
    const entry = cast[kind],
      image = pictures[entry.portrait === "lucy" ? "lucy" : "cast"];
    const cellW =
      entry.portrait === "lucy" ? image.naturalWidth : image.naturalWidth / 3;
    const cellH =
      entry.portrait === "lucy" ? image.naturalHeight : image.naturalHeight / 2;
    const col = entry.portrait === "lucy" ? 0 : entry.portrait % 3,
      row = entry.portrait === "lucy" ? 0 : Math.floor(entry.portrait / 3);
    // Ignore the atlas gutters so a neighbouring coat cannot bleed into a portrait.
    const gutter = entry.portrait === "lucy" ? 0 : cellW * 0.07;
    const portraitWidth = cellW - gutter * 2;
    const scale = Math.min(
      portrait.width / portraitWidth,
      portrait.height / cellH,
    );
    portraitContext.imageSmoothingEnabled = false;
    portraitContext.drawImage(
      image,
      col * cellW + gutter,
      row * cellH,
      portraitWidth,
      cellH,
      (portrait.width - portraitWidth * scale) / 2,
      portrait.height - cellH * scale,
      portraitWidth * scale,
      cellH * scale,
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
    typingTimer = setTimeout(typeLetter, /[.!?…]/u.test(last) ? 190 : 30);
  }
  function paintLine() {
    clearTimeout(typingTimer);
    choicesBox.replaceChildren();
    choicesBox.hidden = true;
    const line = dialogue.lines[dialogue.index];
    const person = line.kind ? cast[line.kind] : null;
    speakerLabel.textContent = person
      ? line.kind === "hero"
        ? playerName
        : person.name
      : "제르디아 왕국 · 모험가 길드";
    portraitFor(line.kind);
    dialogue.letters = Array.from(line.text);
    dialogue.shown = 0;
    dialogueText.textContent = "";
    dialogueLive.textContent = line.text;
    nextLabel.textContent = "E 모두 보기";
    if (!inputLocked) typeLetter();
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
    closeDialogue();
    action();
  }
  function closeDialogue() {
    clearTimeout(typingTimer);
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
    if (dialogue.shown < dialogue.letters.length) {
      clearTimeout(typingTimer);
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
  function beginQueue() {
    phase = "queue";
    root.dataset.phase = phase;
    queueTime = 0;
    keys.clear();
    const bran = npcs.find((n) => n.id === "bran"),
      mia = npcs.find((n) => n.id === "mia");
    bran.path = [
      { x: 448, y: 188 },
      { x: 448, y: 267 },
      { x: 552, y: 267 },
    ];
    bran.pathDelay = 0;
    mia.path = [
      { x: 360, y: 188 },
      { x: 448, y: 188 },
      { x: 448, y: 244 },
      { x: 208, y: 244 },
      { x: 208, y: 222 },
    ];
    mia.pathDelay = 0.65;
    player.path = [
      { x: 360, y: 222 },
      { x: 360, y: 188 },
    ];
    player.pathDelay = 1.4;
    if (!motion())
      for (const a of [bran, mia, player]) {
        const end = a.path.at(-1);
        a.x = end.x;
        a.y = end.y;
        a.path = [];
        a.dir = a === player ? "up" : "down";
      }
    updateObjective();
  }
  function lucyConversation() {
    if (questAccepted) {
      speak([
        {
          kind: "lucy",
          text: `${playerName} 모험가님, 서신은 그린스토아의 연합 길드에 전해 주세요.\n봉인은 그대로 두시고요. …조심해서 다녀오세요.`,
        },
      ]);
      return;
    }
    speak(
      [
        {
          kind: "lucy",
          text: "다음 분. …아, 오래 기다리셨죠?\n제르디아 왕국 모험가 길드의 접수원, 루시예요.",
        },
        {
          kind: "lucy",
          text: `등록된 이름은… ${playerName}. 맞으시죠?\n오늘은 어떤 의뢰를 찾으세요?`,
        },
        { kind: "hero", text: "그린스토아로 가는 의뢰를 찾고 있어." },
        {
          kind: "lucy",
          text: "그린스토아요? 마침 연합 길드에 전할 서신이 하나 있어요.\n성역 주변에서 이상한 기운이 감돈다는 보고가 들어왔거든요.",
        },
        {
          kind: "lucy",
          text: "일은 간단해요. 이 서신을 봉인된 채로 전해 주시면 돼요.\n그린스토아까지 가실 생각이라면, 맡아 보시겠어요?",
        },
      ],
      null,
      [
        {
          label: "의뢰를 맡는다",
          action: () => {
            questAccepted = true;
            inventory.push({
              id: "letter",
              name: "봉인된 서신",
              count: 1,
              description:
                "제르디아 왕국 길드의 인장이 찍힌 서신.\n그린스토아 연합 길드에 봉인된 채로 전달해야 한다.",
            });
            updateObjective();
            speak(
              [
                {
                  kind: "lucy",
                  text: "여기요. 의뢰서를 함께 넣어 두었어요.\n출발 전에 필요한 게 있으면 길드를 둘러보세요.",
                },
                {
                  kind: "lucy",
                  text: `…${playerName} 모험가님.\n그린스토아에서는 익숙한 길도 조심하는 게 좋을 거예요.`,
                },
              ],
              () => notify("의뢰 수락 · 그린스토아로 보내는 서신"),
            );
          },
        },
        {
          label: "조금 더 둘러본다",
          action: () =>
            speak([
              {
                kind: "lucy",
                text: "좋아요. 준비되시면 다시 말씀해 주세요.\n서신은 제가 맡아 둘게요.",
              },
            ]),
        },
      ],
    );
  }
  function npcTalk(id) {
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
    return [
      ...npcs.map((n) => ({
        id: n.id,
        name: cast[n.id].name,
        x: n.id === "lucy" ? 360 : n.x,
        y: n.id === "lucy" ? 176 : n.y,
        kind: "npc",
      })),
      { id: "board", name: "의뢰 게시판", x: 125, y: 193, kind: "prop" },
      { id: "door", name: "길드 출입문", x: 360, y: 442, kind: "prop" },
      { id: "books", name: "길드 기록장", x: 650, y: 359, kind: "prop" },
    ];
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
    if (target.kind === "npc") {
      npcTalk(target.id);
      return;
    }
    if (target.id === "board")
      speak([
        {
          text: "약초 채집, 호위, 분실물 수색…\n여러 의뢰서가 겹겹이 붙어 있다. 그린스토아행 연락 의뢰에는 길드의 인장이 찍혀 있다.",
        },
      ]);
    if (target.id === "door")
      speak([
        {
          text: questAccepted
            ? "문틈으로 서늘한 바람이 스며든다.\n그린스토아로 보낼 서신을 챙겼다. 이제 출발할 준비를 마저 하자."
            : "문밖으로 제르디아의 분주한 거리가 보인다.\n그린스토아행 의뢰부터 접수원에게 확인해야겠다.",
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
      collisions.some(overlap) ||
      npcs.some(
        (n) =>
          n.id !== "lucy" && overlap({ x: n.x - 7, y: n.y - 5, w: 14, h: 9 }),
      )
    );
  }
  function movePlayer(dt) {
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
  }
  function followPath(a, dt, speed) {
    if (queueTime < a.pathDelay || !a.path.length) {
      a.moving = false;
      return;
    }
    const goal = a.path[0],
      dx = goal.x - a.x,
      dy = goal.y - a.y,
      d = Math.hypot(dx, dy);
    a.moving = true;
    a.dir =
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down";
    if (d <= speed * dt) {
      a.x = goal.x;
      a.y = goal.y;
      a.path.shift();
      a.moving = !!a.path.length;
    } else {
      a.x += (dx / d) * speed * dt;
      a.y += (dy / d) * speed * dt;
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
    ctx.drawImage(makeSprite(a.id, a.dir, frame), x - 16, y - 40);
  }
  function drawWorld() {
    const menuUnavailable = phase !== "free" || inputLocked;
    if (menuButton.disabled !== menuUnavailable)
      menuButton.disabled = menuUnavailable;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(background, 0, 0);
    // A few deliberately square fire pixels; the room's collision remains static.
    const f = motion() ? Math.floor(elapsed * 5) % 3 : 1;
    rect(ctx, 662, 220 - f * 2, 5, 12 + f * 2, "#c17b3d");
    rect(ctx, 668, 214 + f, 7, 18 - f, "#e9ac53");
    rect(ctx, 676, 221 - f, 5, 11 + f, "#d28e42");
    rect(ctx, 671, 222, 3, 9, "#f3d17c");
    [...npcs, player].sort((a, b) => a.y - b.y).forEach(drawActor);
    if (phase === "free") {
      const target = nearby();
      prompt.textContent = target ? `E · ${target.name}` : "";
      prompt.hidden = !target;
      if (target) {
        const x = Math.round(target.x),
          y = Math.round(target.y) - 49;
        panel(ctx, x - 7, y, 14, 13, "#252c35", "#cbbd91");
        ctx.fillStyle = "#eee4c8";
        ctx.font = "9px monospace";
        ctx.fillText("E", x - 3, y + 10);
      }
    } else prompt.hidden = true;
  }
  function tick(now) {
    if (!active) return;
    const dt = Math.min(0.04, Math.max(0, (now - previous) / 1000));
    previous = now;
    elapsed += dt;
    if (phase === "free") movePlayer(dt);
    else player.moving = false;
    if (phase === "queue") {
      queueTime += dt;
      for (const a of [
        npcs.find((n) => n.id === "bran"),
        npcs.find((n) => n.id === "mia"),
        player,
      ])
        followPath(a, dt, 108);
      if ([player, ...npcs].every((a) => !a.path.length)) {
        player.dir = "up";
        lucyConversation();
      }
    }
    drawWorld();
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
        action.textContent = item.id === "bread" ? "먹기 · E" : "살펴보기 · E";
      }
    } else if (menuTab === "quest") {
      const h = document.createElement("p");
      h.className = "quest-entry";
      h.textContent = questAccepted
        ? "▸ 그린스토아로 보내는 서신"
        : "아직 수락한 의뢰가 없다.";
      itemList.append(h);
      itemDetail.textContent = questAccepted
        ? "의뢰인: 제르디아 왕국 모험가 길드\n목적지: 그린스토아 연합 길드\n\n봉인된 서신을 훼손하지 않고 전달한다.\n길드에서 출발 준비를 마치자."
        : "접수원 루시에게 말을 걸어 보자.";
    } else {
      itemDetail.textContent =
        "W A S D  이동\n왼쪽 Shift  달리기\nE  대화 · 조사 · 대사 넘기기\nC  메뉴 열기 · 닫기\n\n메뉴 안에서는 W/S로 소지품을, A/D로 탭을 선택한다.\nE로 결정하고 C 또는 Esc로 돌아간다.";
    }
  }
  function openMenu() {
    if (phase !== "free") return;
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
    if (item.id === "bread") {
      if (hp === 24) {
        itemDetail.textContent =
          "아직 배가 고프지 않다. 빵은 길 위에서 먹도록 하자.";
        return;
      }
      hp = Math.min(24, hp + 6);
      item.count--;
      if (!item.count) inventory.splice(selectedItem, 1);
      renderMenu();
      itemDetail.textContent = "마른 빵을 천천히 먹었다.\n체력이 6 회복되었다.";
    } else itemDetail.textContent = item.description;
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
        renderChoices();
      } else if (code === "KeyE" || code === "Enter") advanceDialogue();
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
      menuTab = b.dataset.menuTab;
      renderMenu();
    });
  canvas.addEventListener("pointerdown", () =>
    canvas.focus({ preventScroll: true }),
  );
  for (const b of document.querySelectorAll("[data-game-key]")) {
    b.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (inputLocked) return;
      b.setPointerCapture(event.pointerId);
      const code = b.dataset.gameKey;
      if (code === "KeyE") {
        if (phase === "dialogue") advanceDialogue();
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
    player = actor("hero", 360, 268, "up");
    npcs = [
      actor("lucy", 360, 129),
      actor("bran", 360, 188),
      actor("mia", 360, 222),
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
    speak(
      [
        {
          text: "잉크 냄새와 사람들의 웅성거림.\n눈을 뜨자, 낯선 길드의 접수 줄 한가운데 서 있었다.",
        },
        {
          kind: "bran",
          text: "거기, 후드 쓴 양반. 정신이 드나?\n마침 줄이 줄었군. 이제 당신 차례요.",
        },
      ],
      beginQueue,
    );
  }
  function stop() {
    active = false;
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
    if (dialogue) typeLetter();
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
