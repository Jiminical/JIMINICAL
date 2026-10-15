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
