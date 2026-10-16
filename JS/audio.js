// All audio is synthesized locally. Nothing is fetched or started before a gesture.
const gameAudio = (() => {
  let context,
    master,
    voiceBus,
    sceneryBus,
    ambience,
    ambienceFilter,
    waterBed,
    noiseBuffer,
    crispBuffer;
  let enabled = false,
    volume = 35,
    place = "title",
    lastVoice = -Infinity;
  const playing = new Set();
  const recent = new Map();
  let sceneryClock = 0,
    nextBeat = 0,
    nextAccent = 0,
    beat = 0,
    step = 0;
  const interiors = new Set(["guild", "shop", "library"]);
  const landscapes = {
    title: { wind: 0.065, water: 0.035, cutoff: 1100 },
    guild: { wind: 0.018, water: 0, cutoff: 300 },
    shop: { wind: 0.012, water: 0, cutoff: 260 },
    library: { wind: 0.008, water: 0, cutoff: 240 },
    battle: { wind: 0.02, water: 0, cutoff: 390 },
    city: { wind: 0.035, water: 0.055, cutoff: 650 },
    departure: { wind: 0.07, water: 0, cutoff: 290 },
    carriage: { wind: 0.095, water: 0, cutoff: 250 },
    checkpoint: { wind: 0.08, water: 0.045, cutoff: 950 },
    gate: { wind: 0.065, water: 0.08, cutoff: 1100 },
    grove: { wind: 0.055, water: 0.14, cutoff: 1250 },
    forest: { wind: 0.075, water: 0.1, cutoff: 1200 },
    guide: { wind: 0.07, water: 0.14, cutoff: 1100 },
    sanctuary: { wind: 0.08, water: 0.055, cutoff: 850 },
  };
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
    rose: {
      hz: 268,
      wave: "triangle",
      filter: 1500,
      length: 0.059,
      level: 0.16,
    },
    rael: { hz: 410, wave: "sine", filter: 2100, length: 0.061, level: 0.17 },
    edan: {
      hz: 142,
      wave: "square",
      filter: 1000,
      length: 0.052,
      level: 0.085,
    },
    sena: {
      hz: 470,
      wave: "triangle",
      filter: 2300,
      length: 0.047,
      level: 0.13,
    },
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
    if (!group || group === "voice") {
      lastVoice = -Infinity;
      if (ambience) {
        const now = context.currentTime;
        ambience.gain.cancelScheduledValues(now);
        ambience.gain.setTargetAtTime(ambientLevel(), now, 0.1);
        sceneryBus.gain.cancelScheduledValues(now);
        sceneryBus.gain.setTargetAtTime(1, now, 0.1);
      }
    }
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
  function ambientLevel() {
    return (landscapes[place] || landscapes.title).wind;
  }
  function scene(next) {
    if (place === next && sceneryClock) return;
    place = next;
    if (!ambience) return;
    const profile = landscapes[next] || landscapes.title;
    ambience.gain.setTargetAtTime(ambientLevel(), context.currentTime, 0.7);
    waterBed.gain.setTargetAtTime(profile.water, context.currentTime, 0.7);
    ambienceFilter.frequency.setTargetAtTime(
      profile.cutoff,
      context.currentTime,
      0.6,
    );
    syncScenery();
  }
  function stopScenery() {
    clearInterval(sceneryClock);
    sceneryClock = 0;
    stopTransient("scene");
  }
  function syncScenery() {
    stopScenery();
    if (!usable()) return;
    beat = 0;
    nextBeat = context.currentTime + 0.07;
    nextAccent = context.currentTime + 1.2;
    sceneryTick();
    sceneryClock = setInterval(sceneryTick, 80);
  }
  function sceneryTick() {
    if (!usable()) {
      stopScenery();
      return;
    }
    const now = context.currentTime;
    const rolling = place === "carriage" || place === "departure";
    if (place === "battle") {
      if (nextBeat < now - .3) nextBeat = now + .03;
      const bass = [82.41,82.41,98,73.42,82.41,110,98,73.42];
      while (nextBeat < now + .12) {
        const delay = Math.max(0, nextBeat - now);
        tone(bass[beat % bass.length], .14, {group:"scene",delay,wave:"triangle",level:.13,filter:750});
        if (beat % 2 === 0) tone(bass[beat % bass.length] * 4, .08, {group:"scene",delay,wave:"square",level:.025,filter:1800});
        noise(.035,.055,beat % 2 ? 1800 : 450,delay,{group:"scene",crisp:true});
        beat++; nextBeat += .205;
      }
      return;
    }
    // A short lookahead keeps hoofbeats steady without queuing sounds after a cut.
    if (rolling) {
      if (nextBeat < now - 0.3) nextBeat = now + 0.04;
      while (nextBeat < now + 0.12) {
        const delay = Math.max(0, nextBeat - now),
          options = { group: "scene", delay };
        tone(beat % 2 ? 124 : 96, 0.075, {
          ...options,
          level: 0.115,
          end: 48,
          filter: 700,
        });
        noise(0.045, 0.16, beat % 2 ? 720 : 460, delay, {
          group: "scene",
          crisp: true,
        });
        // Paired hooves, loose metal fittings and an occasional deeper wheel joint.
        noise(0.032, 0.075, 1050, delay + 0.075, {
          group: "scene",
          crisp: true,
        });
        if (beat % 2 === 1)
          noise(0.085, 0.09, 2400, delay + 0.035, {
            group: "scene",
            crisp: true,
          });
        if (beat % 7 === 5)
          tone(68, 0.19, { ...options, level: 0.2, end: 30, filter: 400 });
        nextBeat += place === "departure" ? 0.36 : 0.285;
        beat++;
      }
    }
    if (now < nextAccent) return;
    nextAccent = now + (interiors.has(place) ? 8 : 5) + Math.random() * 4;
    if (rolling) {
      // The carriage body creaks over an uneven stretch of road.
      tone(165, 0.28, {
        group: "scene",
        level: 0.055,
        end: 112,
        wave: "triangle",
        filter: 550,
      });
      noise(0.16, 0.075, 580, 0.05, { group: "scene" });
    } else if (place === "guild") {
      noise(0.13, 0.07, 1700, 0, { group: "scene", crisp: true });
      tone(210, 0.055, { group: "scene", level: 0.026, end: 90, delay: 0.15 });
    } else if (place === "shop") {
      tone(1560, 0.14, { group: "scene", wave: "sine", level: 0.025 });
      tone(2110, 0.1, {
        group: "scene",
        wave: "sine",
        level: 0.015,
        delay: 0.09,
      });
    } else if (place === "library") {
      noise(0.22, 0.045, 2100, 0, { group: "scene", crisp: true });
    } else if (place === "city") {
      tone(640, 0.65, { group: "scene", wave: "sine", level: 0.022, end: 638 });
      tone(960, 0.45, {
        group: "scene",
        wave: "sine",
        level: 0.012,
        delay: 0.1,
      });
    } else {
      [0, 0.16, 0.4].forEach((delay, i) =>
        tone(1650 + i * 170, 0.09, {
          group: "scene",
          wave: "sine",
          level: 0.027,
          end: 2150 + i * 100,
          delay,
        }),
      );
      noise(0.65, 0.055, 1800, 0.5, { group: "scene" });
    }
  }
  async function unlock() {
    if (!enabled) return false;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        // Dialogue has its own +9 dB bus; UI and impact effects keep their mix.
        voiceBus = context.createGain();
        voiceBus.gain.value = 2.8;
        voiceBus.connect(master);
        sceneryBus = context.createGain();
        sceneryBus.gain.value = 1;
        sceneryBus.connect(master);
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
        crispBuffer = context.createBuffer(
          1,
          context.sampleRate * 2,
          context.sampleRate,
        );
        const grit = crispBuffer.getChannelData(0);
        for (let i = 0; i < grit.length; i++)
          grit[i] = (Math.random() * 2 - 1) * 0.65;
        const wind = context.createBufferSource();
        wind.buffer = noiseBuffer;
        wind.loop = true;
        ambienceFilter = context.createBiquadFilter();
        ambienceFilter.type = "lowpass";
        ambience = context.createGain();
        ambience.gain.value = ambientLevel();
        wind.connect(ambienceFilter);
        ambienceFilter.connect(ambience);
        ambience.connect(sceneryBus);
        const river = context.createBufferSource(),
          waterFilter = context.createBiquadFilter();
        river.buffer = crispBuffer;
        river.loop = true;
        waterFilter.type = "bandpass";
        waterFilter.frequency.value = 1500;
        waterFilter.Q.value = 0.55;
        waterBed = context.createGain();
        waterBed.gain.value = (landscapes[place] || landscapes.title).water;
        river.connect(waterFilter);
        waterFilter.connect(waterBed);
        waterBed.connect(sceneryBus);
        river.start();
        scene(place);
        wind.start();
        context.onstatechange = () => {
          applyVolume();
          syncScenery();
          document.dispatchEvent(new Event("greenstoa:audiochange"));
        };
      }
      await context.resume();
      applyVolume();
      if (!sceneryClock) syncScenery();
      return context.state === "running";
    } catch {
      return false;
    }
  }
  function configure(options) {
    enabled = Boolean(options.enabled);
    volume = Math.max(0, Math.min(100, Number(options.volume) || 0));
    if (!enabled || !volume) {
      stopScenery();
      stopTransient();
    } else if (!sceneryClock) syncScenery();
    applyVolume();
  }
  function tone(hz, length, options = {}) {
    if (!usable() || playing.size >= (options.group === "scene" ? 16 : 28))
      return;
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
    if (group === "voice") gain.gain.setValueAtTime(level, at + 0.013);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(
      group === "voice" ? voiceBus : group === "scene" ? sceneryBus : master,
    );
    oscillator.start(at);
    oscillator.stop(at + length + 0.006);
    track(oscillator, group, gain);
    oscillator.addEventListener("ended", () => {
      lowpass.disconnect();
      gain.disconnect();
    });
  }
  function noise(
    length,
    level = 0.2,
    frequency = 800,
    delay = 0,
    options = {},
  ) {
    const group = options.group || "effect";
    if (!usable() || playing.size >= (group === "scene" ? 16 : 28)) return;
    const source = context.createBufferSource(),
      gain = context.createGain(),
      filter = context.createBiquadFilter();
    const at = context.currentTime + delay;
    source.buffer = options.crisp ? crispBuffer : noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.65;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(group === "scene" ? sceneryBus : master);
    source.start(at, Math.random());
    source.stop(at + length + 0.006);
    track(source, group, gain);
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
    // Briefly make room for speech, then release smoothly between sentences.
    ambience.gain.cancelScheduledValues(lastVoice);
    ambience.gain.setTargetAtTime(ambientLevel() * 0.4, lastVoice, 0.018);
    ambience.gain.setTargetAtTime(ambientLevel(), lastVoice + 0.13, 0.12);
    sceneryBus.gain.cancelScheduledValues(lastVoice);
    sceneryBus.gain.setTargetAtTime(0.5, lastVoice, 0.018);
    sceneryBus.gain.setTargetAtTime(1, lastVoice + 0.14, 0.16);
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
      case "battleStart":
        [440,330,220,110].forEach((hz,i)=>tone(hz,.14,{wave:"square",level:.12,delay:i*.08,end:hz*.7}));
        noise(.32,.3,550); break;
      case "demon":
        tone(74,.38,{wave:"sawtooth",level:.16,end:48,filter:600});noise(.2,.2,340);break;
      case "sword":
        noise(.15,.4,2600,0,{crisp:true});tone(740,.17,{wave:"triangle",level:.1,end:180});break;
      case "parry":
        [1160,1740].forEach(hz=>tone(hz,.19,{wave:"sine",level:.1}));break;
      case "hurt":
        noise(.13,.4,650);tone(147,.18,{wave:"square",level:.1,end:55});break;
      case "charge":
        tone(83,.9,{wave:"sawtooth",level:.1,end:260,filter:900});break;
      case "arrow":
        noise(.18,.35,3200,0,{crisp:true});tone(1200,.12,{level:.08,end:340});break;
      case "arrowHit":
        noise(.09,.5,1050);tone(180,.2,{level:.16,end:48});break;
      case "rescued":
        [392,494,659,784].forEach((hz,i)=>tone(hz,.28,{wave:"triangle",level:.09,delay:i*.09}));break;
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
      case "bell":
        [1320, 1980, 2640].forEach((hz, i) =>
          tone(hz, 0.6 - i * 0.12, {
            wave: "sine",
            level: 0.065 / (i + 1),
            delay: i * 0.025,
          }),
        );
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
      case "jump":
        tone(300, 0.13, { wave: "square", level: 0.09, end: 620 });
        break;
      case "cry":
        [0, 0.18].forEach((delay) =>
          tone(460, 0.16, { wave: "triangle", level: 0.12, end: 180, delay }),
        );
        break;
      case "birds":
        [0, 0.14, 0.36].forEach((delay, i) =>
          tone(1500 + i * 240, 0.1, {
            wave: "sine",
            level: 0.032,
            end: 2100 + i * 120,
            delay,
          }),
        );
        break;
      case "purchase":
        [784, 988, 1175].forEach((hz, i) =>
          tone(hz, 0.095, { wave: "triangle", level: 0.12, delay: i * 0.045 }),
        );
        break;
      case "drink":
        tone(340, 0.13, { wave: "sine", level: 0.11, end: 510 });
        noise(0.09, 0.16, 1100, 0.08);
        break;
      case "water":
        noise(0.45, 0.2, 1600);
        [660, 880, 740].forEach((hz, i) =>
          tone(hz, 0.1, { wave: "sine", level: 0.055, delay: i * 0.09 }),
        );
        break;
      case "footstep": {
        const surface = variant.split("-")[0],
          wood =
            interiors.has(surface) || ["wood", "carriage"].includes(surface),
          grass = ["grass", "earth", "guide"].includes(surface),
          running = variant.endsWith("-run"),
          quiet = surface === "library" ? 0.62 : 1,
          weight = quiet * (running ? 1.25 : 1) * (++step % 2 ? 1 : 0.87);
        tone(
          (wood ? 118 : grass ? 95 : 220) * (step % 2 ? 1 : 0.93),
          wood ? 0.085 : 0.045,
          {
            level: (grass ? 0.05 : 0.12) * weight,
            end: wood ? 65 : 90,
            filter: wood ? 900 : 1300,
          },
        );
        noise(
          grass ? 0.12 : 0.055,
          (grass ? 0.16 : 0.19) * weight,
          wood ? 460 : grass ? 2600 : 1800,
          0,
          { crisp: true },
        );
        if (grass) noise(0.055, 0.07 * weight, 3500, 0.05, { crisp: true });
        else
          tone(wood ? 170 : 310, 0.025, {
            level: 0.032 * weight,
            end: 110,
            delay: 0.045,
          });
        break;
      }
      case "sanctuary":
        [196, 294, 392, 588].forEach((hz, i) =>
          tone(hz, 1.4, { wave: "sine", level: 0.07, delay: i * 0.16 }),
        );
        break;
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopScenery();
      stopTransient();
    } else syncScenery();
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
