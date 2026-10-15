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
  return {
    setEnabled(value) {
      if (enabled === value) return;
      enabled = value;
      refresh();
    },
  };
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
    ? "SOUND ON"
    : "SOUND OFF";
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
document
  .querySelector("#options-button")
  .addEventListener("click", () => optionsDialog.showModal());
document.querySelector("#start-button").addEventListener("click", () => {
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
document.addEventListener("keydown", (event) => {
  if (
    optionsDialog.open ||
    journeyDialog.open ||
    !["ArrowDown", "ArrowUp"].includes(event.key)
  )
    return;
  event.preventDefault();
  const current = menuButtons.indexOf(document.activeElement);
  const next =
    current < 0
      ? 0
      : (current + (event.key === "ArrowDown" ? 1 : -1) + menuButtons.length) %
        menuButtons.length;
  menuButtons[next].focus();
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
