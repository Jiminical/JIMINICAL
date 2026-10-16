const defaults = {
  sound: true,
  audioPreferenceVersion: 1,
  volume: 35,
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
};
let settings = { ...defaults };
try {
  const saved = JSON.parse(
    localStorage.getItem("greenstoa-settings") || "null",
  );
  if (saved && typeof saved === "object") {
    // Earlier versions defaulted to mute. Migrate that default once; new choices persist.
    if (saved.sound === true || (saved.audioPreferenceVersion === 1 && typeof saved.sound === "boolean"))
      settings.sound = saved.sound;
    if (typeof saved.motion === "boolean") settings.motion = saved.motion;
    if (Number.isFinite(saved.volume))
      settings.volume = Math.max(0, Math.min(100, saved.volume));
  }
} catch {}
const soundButton = document.querySelector(".sound-toggle");
const soundSwitch = document.querySelector("#ambient-toggle");
const motionSwitch = document.querySelector("#motion-toggle");
const volumeSlider = document.querySelector("#volume");
const volumeLabel = document.querySelector("#volume-label");
const optionsDialog = document.querySelector("#options-dialog");
// Build registered pixel cels once, then hold/swap those drawings at 10 fps.
const spriteAnimation = (() => {
  const canvas = document.querySelector(".character-sprite");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const source = new Image();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const width = canvas.width;
  const height = canvas.height;
  // Transparent overscan lets hair tips move beyond the source cell safely.
  const inset = 16;
  const contentWidth = width - inset * 2;
  const frameCount = 64;
  const loopMs = 6400;
  const windCels = [
    [0, 0],
    [0.5, 0],
    [1, 0],
    [1.5, 0.5],
    [2, 0.5],
    [2.5, 1],
    [2.5, 1],
    [2, 1],
    [1.5, 0.5],
    [1, 0.5],
    [0.5, 0],
    [0, 0],
    [-0.5, 0],
    [-1, -0.5],
    [-1.5, -0.5],
    [-2, -1],
    [-2.5, -1],
    [-2.5, -1],
    [-2, -0.5],
    [-1.5, -0.5],
    [-1, 0],
    [-0.5, 0],
    [0, 0],
    [0.5, 0.5],
    [1, 0.5],
    [1, 0.5],
    [0.5, 0],
    [0, 0],
    [-0.5, 0],
    [-0.5, 0],
    [0, 0],
    [0, 0],
  ];
  const breathCels = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0];
  const cloakCels = [
    0, 0, 0, 0.5, 1, 1, 0.5, 0, -0.5, -1, -1, -0.5, 0, 0, 0, 0,
  ];
  const idleFrames = [];
  let enabled = false;
  let loaded = false;
  let request = 0;
  let started = 0;
  let lastFrame = -1;
  let still;
  let closed;
  let output;
  let stillPixels;
  let outputPixels;
  let closedPixels;
  let paintedFrame;
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const movingPixels = [];
  const eyePixels = [];

  const smooth = (start, end, value) => {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };

  function prepare() {
    const cellWidth = source.naturalWidth / 2;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);
    context.drawImage(
      source,
      0,
      0,
      cellWidth,
      source.naturalHeight,
      inset,
      0,
      contentWidth,
      height,
    );
    still = context.getImageData(0, 0, width, height);
    context.clearRect(0, 0, width, height);
    context.drawImage(
      source,
      cellWidth,
      0,
      cellWidth,
      source.naturalHeight,
      inset,
      0,
      contentWidth,
      height,
    );
    closed = context.getImageData(0, 0, width, height);
    output = context.createImageData(width, height);
    stillPixels = new Uint32Array(still.data.buffer);
    outputPixels = new Uint32Array(output.data.buffer);
    closedPixels = new Uint32Array(closed.data.buffer);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x - inset) / contentWidth;
        const ny = y / height;
        // Keep the face anchored; let the shoulders rise gently from the torso.
        const hair =
          smooth(0.58, 0.88, nx) *
          smooth(0.4, 0.58, ny) *
          (1 - smooth(0.78, 0.9, ny));
        const cloth = smooth(0.68, 0.94, nx) * smooth(0.78, 1, ny);
        const breath = smooth(0.4, 0.58, ny) * (1 - smooth(0.7, 1, ny));
        if (hair + cloth + breath > 0)
          movingPixels.push({
            x,
            y,
            index: y * width + x,
            hair,
            cloth,
            breath,
          });
      }
    }

    // Small eyelid patches. The rest of the second portrait is never drawn.
    const eyes = [
      { x: 0.295, y: 0.33, rx: 0.044, ry: 0.034 },
      { x: 0.429, y: 0.362, rx: 0.061, ry: 0.032 },
    ];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let mask = 0;
        let eyelidRow = 0;
        for (const eye of eyes) {
          const distance = Math.hypot(
            ((x - inset) / contentWidth - eye.x) / eye.rx,
            (y / height - eye.y) / eye.ry,
          );
          const candidate = 1 - smooth(0.7, 1, distance);
          if (candidate > mask) {
            mask = candidate;
            eyelidRow = (y / height - eye.y + eye.ry) / (eye.ry * 2);
          }
        }
        if (mask >= 0.2) eyePixels.push({ index: y * width + x, eyelidRow });
      }
    }

    const cache = new Map();
    for (let frame = 0; frame < frameCount; frame++) {
      const wind = windCels[Math.floor(frame / 2)];
      const pose = {
        hairX: wind[0],
        hairY: wind[1],
        cloth: cloakCels[Math.floor(frame / 4)],
        breath: breathCels[Math.floor(frame / 2) % breathCels.length],
        blink: frame === 47 ? 1 : frame === 46 || frame === 48 ? 0.64 : 0,
      };
      const key = JSON.stringify(pose);
      if (!cache.has(key)) cache.set(key, makeCel(pose));
      idleFrames.push(cache.get(key));
    }
  }

  function makeCel(pose) {
    outputPixels.set(stillPixels);

    for (const pixel of movingPixels) {
      const dx = pixel.hair * pose.hairX + pixel.cloth * pose.cloth;
      const dy =
        pixel.hair * pose.hairY +
        pixel.cloth * pose.cloth * 0.5 -
        pixel.breath * pose.breath;
      const sx = Math.round(pixel.x - dx);
      const sy = Math.round(pixel.y - dy);
      outputPixels[pixel.index] =
        sx >= 0 && sx < width && sy >= 0 && sy < height
          ? stillPixels[sy * width + sx]
          : 0;
    }

    if (pose.blink > 0) {
      for (const eye of eyePixels) {
        // Draw open / half-closed / closed eyelids as solid pixel cels, never a dissolve.
        if (eye.eyelidRow <= pose.blink)
          outputPixels[eye.index] = closedPixels[eye.index];
      }
    }
    return new ImageData(new Uint8ClampedArray(output.data), width, height);
  }

  function draw(frame) {
    if (!loaded || frame === lastFrame) return;
    const cel = idleFrames[frame];
    if (cel !== paintedFrame) {
      context.putImageData(cel, 0, 0);
      paintedFrame = cel;
    }
    lastFrame = frame;
    canvas.dataset.frame = String(frame);
  }

  function tick(now) {
    // A restarted loop can receive the current display tick's earlier timestamp.
    const elapsed = Math.max(0, now - started);
    const frame = Math.floor(((elapsed % loopMs) / loopMs) * frameCount);
    draw(frame);
    request = requestAnimationFrame(tick);
  }

  function refresh() {
    cancelAnimationFrame(request);
    request = 0;
    draw(0);
    if (!loaded || !enabled || reducedMotion.matches || document.hidden) return;
    started = performance.now();
    request = requestAnimationFrame(tick);
  }

  source.onload = () => {
    try {
      prepare();
      loaded = true;
      refresh();
      canvas.dataset.ready = "true";
      resolveReady();
    } catch (error) {
      rejectReady(error);
    }
  };
  source.onerror = () =>
    rejectReady(new Error("Character artwork could not load."));
  source.src = canvas.dataset.spriteSrc;
  reducedMotion.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
  function paintedBounds() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / width, bounds.height / height);
    return {
      left: bounds.left + (bounds.width - width * scale) / 2,
      top: bounds.bottom - height * scale,
      scale,
      element: bounds,
    };
  }
  return {
    ready,
    setEnabled(value) {
      if (enabled === value) return;
      enabled = value;
      refresh();
    },
    hitTest(clientX, clientY) {
      if (!loaded) return false;
      const bounds = paintedBounds();
      if (!bounds.scale) return false;
      const x = Math.floor((clientX - bounds.left) / bounds.scale);
      const y = Math.floor((clientY - bounds.top) / bounds.scale);
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      let alpha = paintedFrame.data[(y * width + x) * 4 + 3];
      if (getComputedStyle(canvas).maskImage !== "none") {
        const relativeY =
          (clientY - bounds.element.top) / bounds.element.height;
        alpha *= Math.max(0, Math.min(1, (1 - relativeY) / 0.35));
      }
      return alpha >= 64;
    },
    anchorPoint() {
      const bounds = paintedBounds();
      return {
        x: bounds.left + (inset + contentWidth * 0.43) * bounds.scale,
        y: bounds.top + height * 0.36 * bounds.scale,
      };
    },
  };
})();
const characterSpeech = (() => {
  const scene = document.querySelector(".scene");
  const character = document.querySelector(".character-sprite");
  const popup = document.querySelector("#character-speech");
  const line = document.querySelector("#speech-line");
  const nextButton = document.querySelector("#speech-next");
  const dialogues = [
    "마르에리야.\n이름은 기억해 둬. 길 잃으면 또 나부터 찾을 테니까.",
    "모험하러 왔다더니, 아직 여기네.\n…쉬다 가. 바람은 좀 괜찮거든.",
    "여긴 종족을 안 따져.\n간식 취향은 조금 따지지만.",
    "길 잃었어?\n그럴 줄 알았… 아니, 같이 찾아보자.",
    "오늘은 아무 일도 없었으면 좋겠어.\n대단한 포부지. 나도 알아.",
    "머리의 꽃? 그냥 꽂았어.\n…예쁘다는 말까지 막은 건 아닌데.",
    "또 말 걸어?\n뭐, 딱히 바쁜 건 아니야. 조금만 더 있어도 돼.",
    "모험도 좋지만, 밥은 먹고 가.\n배에서 소리 나면 숲이 다 듣거든.",
  ];
  let dialogueIndex = -1;
  let anchor = { x: 0, y: 0 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function position() {
    if (popup.hidden) return;
    const bounds = scene.getBoundingClientRect();
    const safe = {
      left: Math.max(12, 12 - bounds.left),
      right: Math.min(bounds.width - 12, innerWidth - bounds.left - 12),
      top: Math.max(12, 12 - bounds.top),
      bottom: Math.min(bounds.height - 12, innerHeight - bounds.top - 12),
    };
    const x = anchor.x - bounds.left;
    const y = anchor.y - bounds.top;
    const width = popup.offsetWidth;
    const height = popup.offsetHeight;
    const left = clamp(x - width * 0.66, safe.left, safe.right - width);
    const below = y - height - 12 < safe.top && y + height + 12 <= safe.bottom;
    const top = clamp(
      below ? y + 12 : y - height - 12,
      safe.top,
      safe.bottom - height,
    );
    popup.style.left = Math.round(left) + "px";
    popup.style.top = Math.round(top) + "px";
    popup.style.setProperty(
      "--tail-x",
      Math.round(clamp(x - left - 7, 12, width - 26)) + "px",
    );
    popup.classList.toggle("speech-below", below);
  }

  function nextLine() {
    dialogueIndex = (dialogueIndex + 1) % dialogues.length;
    line.textContent = dialogues[dialogueIndex];
    gameAudio.stopVoice();
    gameAudio.voice("guide", "가", dialogueIndex);
  }

  function close(returnFocus = false) {
    if (popup.hidden) return;
    popup.hidden = true;
    character.setAttribute("aria-expanded", "false");
    if (returnFocus) character.focus({ preventScroll: true });
  }

  function openAt(x, y, keyboard = false) {
    if (character.dataset.ready !== "true") return;
    anchor = { x, y };
    nextLine();
    popup.hidden = false;
    character.setAttribute("aria-expanded", "true");
    position();
    popup.style.animation = "none";
    void popup.offsetWidth;
    popup.style.animation = "";
    if (keyboard) nextButton.focus({ preventScroll: true });
  }

  character.addEventListener("pointermove", (event) => {
    const hovering = spriteAnimation.hitTest(event.clientX, event.clientY);
    character.classList.toggle("is-character-hovered", hovering);
    character.style.cursor = hovering
      ? "var(--cursor-quill-active, pointer)"
      : "var(--cursor-quill, default)";
  });
  character.addEventListener("pointerleave", () => {
    character.classList.remove("is-character-hovered");
  });
  character.addEventListener("click", (event) => {
    if (event.detail === 0) {
      const point = spriteAnimation.anchorPoint();
      openAt(point.x, point.y, true);
    } else if (spriteAnimation.hitTest(event.clientX, event.clientY)) {
      openAt(event.clientX, event.clientY);
    }
  });
  character.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) {
        const point = spriteAnimation.anchorPoint();
        openAt(point.x, point.y, true);
      }
    }
  });
  nextButton.addEventListener("click", () => {
    nextLine();
    position();
  });
  document
    .querySelector("#speech-close")
    .addEventListener("click", () => close(true));
  document.addEventListener("pointerdown", (event) => {
    if (popup.hidden || popup.contains(event.target)) return;
    if (
      event.target === character &&
      spriteAnimation.hitTest(event.clientX, event.clientY)
    )
      return;
    close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.hidden)
      close(popup.contains(document.activeElement));
  });
  window.addEventListener("resize", () => close());
  window.addEventListener("scroll", () => close(), { passive: true });
  document.fonts.ready.then(position);
  return { close };
})();
let audioUnlocked = false;
function saveSettings() {
  try {
    localStorage.setItem("greenstoa-settings", JSON.stringify(settings));
  } catch {}
}
function updateInterface() {
  gameAudio.configure({ enabled: settings.sound, volume: settings.volume });
  audioUnlocked = gameAudio.unlocked;
  const playing = settings.sound;
  soundButton.setAttribute("aria-pressed", String(playing));
  soundButton.setAttribute("aria-label", playing ? "소리 끄기" : "소리 켜기");
  soundButton.querySelector("span").textContent = playing
    ? "소리 켜짐"
    : "소리 꺼짐";
  soundSwitch.checked = settings.sound;
  motionSwitch.checked = settings.motion;
  volumeSlider.value = settings.volume;
  volumeLabel.textContent = settings.volume + "%";
  document.body.classList.toggle("no-motion", !settings.motion);
  spriteAnimation.setEnabled(settings.motion && !storyJourney.active);
  for (const button of document.querySelectorAll("[data-audio-toggle]")) {
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute("aria-label", playing ? "소리 끄기" : "소리 켜기");
    button.querySelector("span").textContent = playing ? "켜짐" : "꺼짐";
  }
}

async function activateAudio() {
  updateInterface();
  if (!settings.sound) return;
  audioUnlocked = await gameAudio.unlock();
  updateInterface();
}
for (const button of [
  soundButton,
  ...document.querySelectorAll("[data-audio-toggle]"),
]) {
  button.addEventListener("click", async () => {
    settings.sound = !settings.sound;
    saveSettings();
    await activateAudio();
    if (settings.sound) gameAudio.sfx("confirm");
  });
}
soundSwitch.addEventListener("change", async () => {
  settings.sound = soundSwitch.checked;
  saveSettings();
  await activateAudio();
});
volumeSlider.addEventListener("input", () => {
  settings.volume = Number(volumeSlider.value);
  saveSettings();
  updateInterface();
});
motionSwitch.addEventListener("change", () => {
  settings.motion = motionSwitch.checked;
  saveSettings();
  updateInterface();
});
document.querySelector("#options-button").addEventListener("click", () => {
  characterSpeech.close();
  optionsDialog.showModal();
});
document.querySelector("#start-button").addEventListener("click", () => {
  characterSpeech.close();
  activateAudio();
  storyJourney.start();
});
document.querySelector("#continue-button").addEventListener("click", () => {
  characterSpeech.close();
  activateAudio();
  storyJourney.continue();
});
document.addEventListener("greenstoa:storychange", updateInterface);
document.addEventListener("greenstoa:audiochange", updateInterface);
for (const dialog of [optionsDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
}
const menuButtons = [...document.querySelectorAll(".main-menu button")];
let selectedMenuIndex = 0;
function selectMenu(index) {
  if (selectedMenuIndex !== index) gameAudio.sfx("select");
  const visible = menuButtons.filter(button => !button.hidden);
  selectedMenuIndex = Math.max(0, Math.min(index, visible.length - 1));
  menuButtons.forEach((button) => {
    button.classList.toggle("is-selected", button === visible[selectedMenuIndex]);
  });
}
menuButtons.forEach((button) => {
  const select = () => selectMenu(menuButtons.filter(item => !item.hidden).indexOf(button));
  button.addEventListener("pointerenter", select);
  button.addEventListener("focus", select);
});
function updateContinue() {
  const saved = journeySave.read(), button = document.querySelector("#continue-button");
  button.hidden = !saved;
  if (saved) {
    const places = { guild: "모험가 길드", city: "길드 앞 광장", shop: "잡화점", carriage: "동쪽 숲길", checkpoint: "성역 검문소", gate: "그린스토아 정문", grove: "이슬잎 숲길", library: "이슬잎 도서관" };
    document.querySelector("#continue-summary").textContent = `${saved.name} · ${places[saved.location]}`;
  }
  selectMenu(0);
}
document.addEventListener("greenstoa:savechange", updateContinue);
window.addEventListener("storage", event => { if (event.key === journeySave.key || event.key === null) updateContinue(); });
updateContinue();
document.addEventListener("keydown", (event) => {
  if (optionsDialog.open || storyJourney.active) return;
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    const visible = menuButtons.filter(button => !button.hidden);
    event.preventDefault();
    const next =
      (selectedMenuIndex +
        (event.key === "ArrowDown" ? 1 : -1) +
        visible.length) %
      visible.length;
    selectMenu(next);
    visible[next].focus();
  } else if (
    event.key === "Enter" &&
    !event.repeat &&
    (event.target === document.body || menuButtons.includes(event.target))
  ) {
    event.preventDefault();
    menuButtons.filter(button => !button.hidden)[selectedMenuIndex].click();
  }
});
document.addEventListener(
  "pointerdown",
  (event) => {
    if (
      !event.target.closest(".sound-toggle,#ambient-toggle") &&
      settings.sound &&
      !audioUnlocked
    )
      activateAudio();
  },
  { passive: true },
);
document.addEventListener(
  "keydown",
  () => {
    if (settings.sound && !audioUnlocked) activateAudio();
  },
  { passive: true },
);
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.closest("#game-screen") || button === soundButton)
    return;
  gameAudio.sfx(
    button.matches(".close-button,#story-return,#name-edit,#name-rewrite")
      ? "cancel"
      : "confirm",
  );
});
// A temporary top-layer overlay also renders above native settings dialogs.
(() => {
  const layer = document.querySelector("#interaction-effects");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const pressTimers = new WeakMap();
  const colors = ["#fff9dd", "#ffe4a0", "#bce8cb"];

  function clearBursts() {
    layer.replaceChildren();
    if (layer.matches(":popover-open")) layer.hidePopover();
  }

  function burstAt(x, y) {
    if (!settings.motion || reducedMotion.matches) return;
    if (typeof layer.showPopover === "function") {
      if (layer.matches(":popover-open")) layer.hidePopover();
      layer.showPopover();
    }
    if (layer.childElementCount >= 12) layer.firstElementChild.remove();
    const burst = document.createElement("span");
    burst.className = "click-burst";
    burst.style.left = Math.round(x) + "px";
    burst.style.top = Math.round(y) + "px";
    const core = document.createElement("i");
    core.className = "burst-core";
    burst.append(core);
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement("i");
      const angle = (i / 12) * Math.PI * 2;
      const distance = i % 2 ? 24 : 38;
      spark.style.setProperty(
        "--dx",
        Math.round((Math.cos(angle) * distance) / 2) * 2 + "px",
      );
      spark.style.setProperty(
        "--dy",
        Math.round((Math.sin(angle) * distance) / 2) * 2 + "px",
      );
      spark.style.setProperty("--size", (i % 3 ? 4 : 6) + "px");
      spark.style.setProperty("--spark-color", colors[i % colors.length]);
      burst.append(spark);
    }
    layer.append(burst);
    // Timed cleanup also runs if motion is disabled during the animation.
    setTimeout(() => {
      burst.remove();
      if (!layer.childElementCount && layer.matches(":popover-open"))
        layer.hidePopover();
    }, 460);
  }

  document.addEventListener(
    "click",
    (event) => {
      // An opening fade should stay quiet instead of flashing the click burst over it.
      if (
        event.target.closest(
          "#start-button,#continue-button,#story-return,#name-finish,#name-begin,#guild-exit-title",
        )
      )
        return;
      if (event.button !== 0 || !settings.motion || reducedMotion.matches)
        return;
      const button = event.target.closest("button:enabled");
      const control = button || event.target.closest("input, [role='button']");
      let x = event.clientX;
      let y = event.clientY;
      if (event.detail === 0) {
        if (!control) return;
        const bounds = control.getBoundingClientRect();
        x = bounds.left + bounds.width / 2;
        y = bounds.top + bounds.height / 2;
      }
      // Run after the control's action so a newly opened dialog stays below the sparks.
      setTimeout(() => burstAt(x, y), 0);
      if (!button) return;
      clearTimeout(pressTimers.get(button));
      button.classList.remove("is-pressed");
      void button.offsetWidth;
      button.classList.add("is-pressed");
      pressTimers.set(
        button,
        setTimeout(() => button.classList.remove("is-pressed"), 270),
      );
    },
    { capture: true },
  );
  motionSwitch.addEventListener("change", () => {
    if (!settings.motion) clearBursts();
  });
  reducedMotion.addEventListener("change", clearBursts);
  document.addEventListener("greenstoa:storychange", clearBursts);
  window.addEventListener("scroll", clearBursts, { passive: true });
  window.addEventListener("blur", clearBursts);
})();
const particles = document.querySelector(".particles");
for (let i = 0; i < 18; i++) {
  const petal = document.createElement("i");
  petal.className = "particle";
  petal.style.setProperty("--x", 10 + Math.random() * 90 + "%");
  petal.style.setProperty("--size", 2 + Math.floor(Math.random() * 3) + "px");
  petal.style.setProperty("--duration", 18 + Math.random() * 15 + "s");
  petal.style.setProperty("--delay", -Math.random() * 30 + "s");
  particles.append(petal);
}
updateInterface();
// Reveal one complete title frame: decoded background, painted character and fonts.
(() => {
  const landscape = new Image();
  const background = getComputedStyle(
    document.querySelector(".landscape"),
  ).backgroundImage;
  landscape.src = background.slice(4, -1).replace(/^["']|["']$/g, "");
  Promise.all([spriteAnimation.ready, landscape.decode(), document.fonts.ready])
    .then(() => {
      requestAnimationFrame(() => {
        const scene = document.querySelector(".scene");
        scene.inert = false;
        scene.setAttribute("aria-busy", "false");
        document.documentElement.classList.remove("is-loading");
      });
    })
    .catch(() => {
      const status = document.querySelector("#boot-status");
      status.textContent = "화면을 불러오지 못했어요. 새로고침해 주세요.";
      status.hidden = false;
    });
})();
