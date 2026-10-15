const defaults = {
  sound: false,
  volume: 35,
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
};
let settings = { ...defaults };
try {
  const saved = JSON.parse(
    localStorage.getItem("greenstoa-settings") || "null",
  );
  if (saved && typeof saved === "object") {
    if (typeof saved.sound === "boolean") settings.sound = saved.sound;
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
const journeyDialog = document.querySelector("#journey-dialog");
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
    prepare();
    loaded = true;
    canvas.dataset.ready = "true";
    refresh();
  };
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
    "처음 보는 얼굴이네요.\n그린스토아에 오신 걸 환영해요.",
    "조금 쉬었다 가실래요?\n강물 소리를 듣고 있으면 마음이 편해져요.",
    "이 숲엔 서로 다른 이들이 살아요.\n당신의 이야기도 궁금하네요.",
    "길을 잃으셨나요?\n괜찮아요. 천천히 둘러보세요.",
    "바람이 좋네요.\n이런 날엔 조금 멀리 걸어도 좋겠어요.",
    "제 머리에 꽃이요?\n…오늘 아침에 꽂았어요.",
    "계속 말을 걸어 주시네요.\n싫다는 뜻은 아니에요.",
    "숲이 조용하다고요?\n귀를 기울여 보면 그렇지만도 않답니다.",
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
    character.style.cursor = spriteAnimation.hitTest(
      event.clientX,
      event.clientY,
    )
      ? "var(--cursor-quill-active, pointer)"
      : "var(--cursor-quill, default)";
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
let audioContext, masterGain;
let audioUnlocked = false;
function saveSettings() {
  try {
    localStorage.setItem("greenstoa-settings", JSON.stringify(settings));
  } catch {}
}
function updateInterface() {
  const playing = settings.sound && audioUnlocked;
  soundButton.setAttribute("aria-pressed", String(playing));
  soundButton.setAttribute(
    "aria-label",
    playing ? "자연 소리 끄기" : "자연 소리 켜기",
  );
  soundButton.querySelector("span").textContent = playing
    ? "소리 켜짐"
    : "소리 꺼짐";
  soundSwitch.checked = settings.sound;
  motionSwitch.checked = settings.motion;
  volumeSlider.value = settings.volume;
  volumeLabel.textContent = settings.volume + "%";
  document.body.classList.toggle("no-motion", !settings.motion);
  spriteAnimation.setEnabled(settings.motion);
  if (masterGain)
    masterGain.gain.setTargetAtTime(
      playing ? (settings.volume / 100) * 0.12 : 0,
      audioContext.currentTime,
      0.35,
    );
}
async function activateAudio() {
  if (!settings.sound) {
    updateInterface();
    return;
  }
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioContext.destination);
      // Filtered brown noise provides a quiet wind and flowing water ambience.
      const buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 6,
        audioContext.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < samples.length; i++) {
        previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
        samples[i] = previous * 3.5;
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      source.connect(filter);
      filter.connect(masterGain);
      source.start();
    }
    await audioContext.resume();
    audioUnlocked = audioContext.state === "running";
  } catch {
    settings.sound = false;
    audioUnlocked = false;
    saveSettings();
  }
  updateInterface();
}
soundButton.addEventListener("click", async () => {
  settings.sound = !(settings.sound && audioUnlocked);
  saveSettings();
  await activateAudio();
});
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
  journeyDialog.showModal();
});
for (const dialog of [optionsDialog, journeyDialog]) {
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
  selectedMenuIndex = index;
  menuButtons.forEach((button, i) => {
    button.classList.toggle("is-selected", i === index);
  });
}
menuButtons.forEach((button, index) => {
  button.addEventListener("pointerenter", () => selectMenu(index));
  button.addEventListener("focus", () => selectMenu(index));
});
document.addEventListener("keydown", (event) => {
  if (optionsDialog.open || journeyDialog.open) return;
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    const next =
      (selectedMenuIndex +
        (event.key === "ArrowDown" ? 1 : -1) +
        menuButtons.length) %
      menuButtons.length;
    selectMenu(next);
    menuButtons[next].focus();
  } else if (
    event.key === "Enter" &&
    !event.repeat &&
    (event.target === document.body || menuButtons.includes(event.target))
  ) {
    event.preventDefault();
    menuButtons[selectedMenuIndex].click();
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
  { once: true },
);
document.addEventListener(
  "keydown",
  () => {
    if (settings.sound && !audioUnlocked) activateAudio();
  },
  { once: true },
);
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
