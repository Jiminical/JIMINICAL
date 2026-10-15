// All audio is synthesized locally. Nothing is fetched or started before a gesture.
const gameAudio = (() => {
  let context, master, ambience, ambienceFilter, noiseBuffer;
  let enabled = false,
    volume = 35,
    place = "title",
    lastVoice = -Infinity;
  const playing = new Set();
  const recent = new Map();
  const voices = {
    hero: {
      hz: 128,
      wave: "triangle",
      filter: 780,
      length: 0.065,
      level: 0.16,
    },
    lucy: {
      hz: 228,
      wave: "triangle",
      filter: 1350,
      length: 0.056,
      level: 0.17,
    },
    scout: {
      hz: 352,
      wave: "square",
      filter: 1850,
      length: 0.044,
      level: 0.08,
    },
    rogue: {
      hz: 176,
      wave: "sawtooth",
      filter: 1250,
      length: 0.06,
      level: 0.11,
    },
    bran: { hz: 156, wave: "square", filter: 1100, length: 0.054, level: 0.08 },
    mia: {
      hz: 438,
      wave: "triangle",
      filter: 2300,
      length: 0.048,
      level: 0.13,
    },
    nara: { hz: 556, wave: "square", filter: 2200, length: 0.035, level: 0.06 },
    tobin: { hz: 96, wave: "triangle", filter: 640, length: 0.07, level: 0.21 },
    leon: { hz: 286, wave: "sine", filter: 2100, length: 0.059, level: 0.18 },
    guide: { hz: 512, wave: "sine", filter: 2600, length: 0.06, level: 0.13 },
  };
  function usable() {
    return (
      enabled && volume > 0 && !document.hidden && context?.state === "running"
    );
  }
  function track(node, group, gain) {
    const entry = { node, group, gain };
    playing.add(entry);
    node.onended = () => {
      playing.delete(entry);
      node.disconnect();
    };
  }
  function stopTransient(group) {
    for (const entry of [...playing]) {
      if (group && entry.group !== group) continue;
      try {
        const now = context.currentTime;
        entry.gain.gain.cancelScheduledValues(now);
        entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
        entry.gain.gain.linearRampToValueAtTime(0, now + 0.012);
        entry.node.stop(now + 0.014);
      } catch {}
      playing.delete(entry);
    }
    if (!group || group === "voice") lastVoice = -Infinity;
  }
  function applyVolume() {
    if (!master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(
      usable() ? (volume / 100) * 0.58 : 0,
      now,
      0.012,
    );
  }
  function scene(next) {
    place = next;
    if (!ambience) return;
    const indoor = next === "guild";
    ambience.gain.setTargetAtTime(
      indoor ? 0.055 : next === "carriage" ? 0.11 : 0.15,
      context.currentTime,
      0.7,
    );
    ambienceFilter.frequency.setTargetAtTime(
      indoor ? 420 : next === "carriage" ? 260 : 1100,
      context.currentTime,
      0.6,
    );
  }
  async function unlock() {
    if (!enabled) return false;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -15;
        limiter.knee.value = 12;
        limiter.ratio.value = 5;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.13;
        master.connect(limiter);
        limiter.connect(context.destination);
        noiseBuffer = context.createBuffer(
          1,
          context.sampleRate * 3,
          context.sampleRate,
        );
        const samples = noiseBuffer.getChannelData(0);
        let value = 0;
        for (let i = 0; i < samples.length; i++) {
          value = (value + (Math.random() * 2 - 1) * 0.035) / 1.035;
          samples[i] = value * 4;
        }
        const wind = context.createBufferSource();
        wind.buffer = noiseBuffer;
        wind.loop = true;
        ambienceFilter = context.createBiquadFilter();
        ambienceFilter.type = "lowpass";
        ambience = context.createGain();
        wind.connect(ambienceFilter);
        ambienceFilter.connect(ambience);
        ambience.connect(master);
        scene(place);
        wind.start();
        context.onstatechange = () => {
          applyVolume();
          document.dispatchEvent(new Event("greenstoa:audiochange"));
        };
      }
      await context.resume();
      applyVolume();
      return context.state === "running";
    } catch {
      return false;
    }
  }
  function configure(options) {
    enabled = Boolean(options.enabled);
    volume = Math.max(0, Math.min(100, Number(options.volume) || 0));
    if (!enabled || !volume) stopTransient();
    applyVolume();
  }
  function tone(hz, length, options = {}) {
    if (!usable() || playing.size >= 28) return;
    const {
      wave = "triangle",
      level = 0.12,
      delay = 0,
      end = hz,
      filter = 3000,
      group = "effect",
    } = options;
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      lowpass = context.createBiquadFilter();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(hz, at);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      at + length,
    );
    lowpass.type = "lowpass";
    lowpass.frequency.value = filter;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(master);
    oscillator.start(at);
    oscillator.stop(at + length + 0.006);
    track(oscillator, group, gain);
    oscillator.addEventListener("ended", () => {
      lowpass.disconnect();
      gain.disconnect();
    });
  }
  function noise(length, level = 0.2, frequency = 800, delay = 0) {
    if (!usable() || playing.size >= 28) return;
    const source = context.createBufferSource(),
      gain = context.createGain(),
      filter = context.createBiquadFilter();
    const at = context.currentTime + delay;
    source.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.65;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(at, Math.random());
    source.stop(at + length + 0.006);
    track(source, "effect", gain);
    source.addEventListener("ended", () => {
      filter.disconnect();
      gain.disconnect();
    });
  }
  function voice(kind, glyph, index = 0, expression = "neutral") {
    if (!usable() || !/[\p{L}\p{N}]/u.test(glyph)) return;
    const profile = voices[kind];
    if (!profile || context.currentTime - lastVoice < 0.064) return;
    lastVoice = context.currentTime;
    const mood = ["concerned", "weary", "embarrassed"].includes(expression)
      ? 0.92
      : ["boasting", "incredulous", "warning"].includes(expression)
        ? 1.08
        : 1;
    const semitone = [0, 1, -1, 2, 0, -2][index % 6];
    const hz = profile.hz * mood * Math.pow(2, semitone / 12);
    tone(hz, profile.length, {
      ...profile,
      group: "voice",
      end: hz * (kind === "rogue" ? 0.88 : 0.98),
    });
    if (["lucy", "leon", "guide"].includes(kind))
      tone(hz * 2, profile.length * 0.65, {
        wave: "sine",
        level: 0.023,
        filter: profile.filter,
        group: "voice",
      });
  }
  function sfx(name, variant = "") {
    if (!usable()) return;
    const now = context.currentTime;
    const key = name === "footstep" ? "footstep" : name;
    const minimum =
      name === "footstep" ? 0.13 : name === "select" ? 0.045 : 0.065;
    if (now - (recent.get(key) ?? -Infinity) < minimum) return;
    recent.set(key, now);
    switch (name) {
      case "select":
        tone(860, 0.035, { wave: "square", level: 0.035, end: 1050 });
        break;
      case "next":
        tone(610, 0.028, { level: 0.055, end: 760 });
        break;
      case "confirm":
        tone(523, 0.065, { level: 0.13 });
        tone(784, 0.11, { level: 0.1, delay: 0.06 });
        break;
      case "cancel":
        tone(392, 0.06, { level: 0.09 });
        tone(261, 0.08, { level: 0.09, delay: 0.055 });
        break;
      case "menuOpen":
        [330, 440, 554].forEach((hz, i) =>
          tone(hz, 0.085, { level: 0.085, delay: i * 0.035 }),
        );
        break;
      case "menuClose":
        tone(330, 0.09, { level: 0.09, end: 196 });
        break;
      case "paper":
        noise(0.16, 0.28, 1500);
        break;
      case "stamp":
        tone(155, 0.18, {
          wave: "triangle",
          level: 0.56,
          end: 42,
          filter: 900,
        });
        noise(0.105, 0.9, 420);
        noise(0.04, 0.26, 1700);
        break;
      case "registered":
        [392, 494, 587, 784].forEach((hz, i) =>
          tone(hz, 0.2, { wave: "triangle", level: 0.13, delay: i * 0.085 }),
        );
        break;
      case "door":
        tone(105, 0.23, { level: 0.32, end: 48 });
        noise(0.16, 0.4, 370);
        break;
      case "wheel":
        [0, 0.13, 0.28].forEach((delay, i) => {
          tone(83 + i * 12, 0.1, { level: 0.13, delay, end: 48 });
          noise(0.08, 0.22, 320, delay);
        });
        break;
      case "scan":
        [440, 554, 659, 880].forEach((hz, i) =>
          tone(hz, 0.16, { wave: "sine", level: 0.12, delay: i * 0.1 }),
        );
        break;
      case "admitted":
        tone(659, 0.25, { wave: "sine", level: 0.17 });
        tone(988, 0.45, { wave: "sine", level: 0.12, delay: 0.12 });
        break;
      case "route":
        tone(660, 0.09, { wave: "sine", level: 0.1, end: 880 });
        break;
      case "eat":
        noise(0.12, 0.3, 1500);
        noise(0.09, 0.24, 1100, 0.14);
        break;
      case "footstep":
        tone(variant === "guild" || variant === "carriage" ? 115 : 175, 0.047, {
          level: 0.09,
          end: 65,
          filter: 750,
        });
        noise(0.045, 0.13, variant === "guild" ? 370 : 1000);
        break;
      case "sanctuary":
        [196, 294, 392, 588].forEach((hz, i) =>
          tone(hz, 1.4, { wave: "sine", level: 0.07, delay: i * 0.16 }),
        );
        break;
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTransient();
    applyVolume();
  });
  return {
    configure,
    unlock,
    voice,
    sfx,
    scene,
    stopVoice: () => stopTransient("voice"),
    stopTransient,
    get unlocked() {
      return context?.state === "running";
    },
  };
})();
