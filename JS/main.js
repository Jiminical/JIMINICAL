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
// Keep one original drawing. Only local pixel coordinates and eyelids change.
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
  const frameCount = 192;
  const loopMs = 6400;
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

    // Tiny feathered eyelid patches. The rest of the second portrait is never drawn.
    const eyes = [
      { x: 0.295, y: 0.33, rx: 0.044, ry: 0.034 },
      { x: 0.429, y: 0.362, rx: 0.061, ry: 0.032 },
    ];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let mask = 0;
        for (const eye of eyes) {
          const distance = Math.hypot(
            ((x - inset) / contentWidth - eye.x) / eye.rx,
            (y / height - eye.y) / eye.ry,
          );
          mask = Math.max(mask, 1 - smooth(0.7, 1, distance));
        }
        if (mask > 0) eyePixels.push({ index: (y * width + x) * 4, mask });
      }
    }
  }

  function draw(frame) {
    if (!loaded || frame === lastFrame) return;
    const phase = (frame / frameCount) * Math.PI * 2;
    const breeze = Math.sin(phase);
    const ripple = Math.sin(phase * 2);
    // A quiet 3.2-second inhale/exhale, capped at two source pixels.
    const inhale = (1 - Math.cos(phase * 2)) / 2;
    outputPixels.set(stillPixels);

    for (const pixel of movingPixels) {
      const dx =
        pixel.hair * (2.3 * breeze + 0.45 * ripple) +
        pixel.cloth * 0.8 * Math.sin(phase * 2);
      const dy =
        pixel.hair * 1.2 * breeze +
        pixel.cloth * 0.7 * breeze -
        pixel.breath * 1.8 * inhale;
      const sx = Math.round(pixel.x - dx);
      const sy = Math.round(pixel.y - dy);
      outputPixels[pixel.index] =
        sx >= 0 && sx < width && sy >= 0 && sy < height
          ? stillPixels[sy * width + sx]
          : 0;
    }

    const blinkTime = (frame / frameCount) * loopMs - 4600;
    let blink = 0;
    if (blinkTime >= 0 && blinkTime < 90) blink = smooth(0, 90, blinkTime);
    else if (blinkTime >= 90 && blinkTime < 140) blink = 1;
    else if (blinkTime >= 140 && blinkTime < 280)
      blink = 1 - smooth(140, 280, blinkTime);
    if (blink > 0) {
      for (const eye of eyePixels) {
        const mix = blink * eye.mask;
        for (let channel = 0; channel < 3; channel++) {
          const index = eye.index + channel;
          output.data[index] = Math.round(
            still.data[index] * (1 - mix) + closed.data[index] * mix,
          );
        }
      }
    }
    context.putImageData(output, 0, 0);
    lastFrame = frame;
    canvas.dataset.frame = String(frame);
  }

  function tick(now) {
    const frame = Math.floor(
      (((now - started) % loopMs) / loopMs) * frameCount,
    );
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
      let alpha = output.data[(y * width + x) * 4 + 3];
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
      ? "pointer"
      : "default";
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
