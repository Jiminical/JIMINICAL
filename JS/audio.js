// Journey music, licensed battle music/samples, and synthesized pixel ambience.
const gameAudio = (() => {
  let context,
    master,
    effectsBus,
    voiceBus,
    sceneryBus,
    ambience,
    ambienceFilter,
    waterBed,
    noiseBuffer,
    crispBuffer;
  const journeyTrack = document.querySelector("#journey-music");
  let musicBus, journeyWanted = false, journeySeek = null, musicPlay = null,
    musicFadeTimer = 0, musicStopping = false;
  const musicLevel = 1.5;
  const battleTrack = document.querySelector("#battle-music"),
    combatAssets = document.querySelector("#combat-audio-assets"), samples = new Map();
  let battleBus, battleWanted = false, battleStopping = false, battlePlay = null,
    battleFadeTimer = 0, battleMode = "command", samplesLoading = null;
  const battleLevel = () => battleMode === "danger" ? .82 : battleMode === "dodge" ? .74 : .62;
  const townTrack = document.querySelector("#town-music"), townPlaces = new Set(["guild", "city", "cliff", "shop"]);
  const townLevel = .66;
  let townBus, townWanted = false, townStopping = false, townPlay = null, townFadeTimer = 0;
  const openingTrack = document.querySelector("#opening-music"), openingLevel = .82;
  let openingBus, openingWanted = false, openingStopping = false, openingPlay = null, openingFadeTimer = 0;
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
    prologue: { wind: 0.008, water: 0, cutoff: 360 },
    guild: { wind: 0.018, water: 0, cutoff: 300 },
    shop: { wind: 0.012, water: 0, cutoff: 260 },
    library: { wind: 0.008, water: 0, cutoff: 240 },
    ambush: { wind: 0.008, water: 0, cutoff: 160 },
    battle: { wind: 0.02, water: 0, cutoff: 390 },
    city: { wind: 0.035, water: 0.055, cutoff: 650 },
    cliff: { wind: 0.075, water: 0.16, cutoff: 850 },
    departure: { wind: 0.07, water: 0, cutoff: 290 },
    carriage: { wind: 0.12, water: 0, cutoff: 330 },
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
    syncJourney();
    syncBattle();
    syncTown();
    syncOpening();
  }
  function syncOpening() {
    if (!openingBus || !openingTrack) return;
    if (openingStopping) { if (!usable()) openingTrack.pause(); return; }
    if (!openingWanted || !usable()) {
      openingTrack.pause();
      openingBus.gain.cancelScheduledValues(context.currentTime);
      openingBus.gain.setValueAtTime(0, context.currentTime);
      return;
    }
    if (openingTrack.paused && !openingPlay) {
      openingBus.gain.cancelScheduledValues(context.currentTime);
      openingBus.gain.setValueAtTime(0, context.currentTime);
      openingPlay = openingTrack.play().then(() => {
        if (!openingWanted || !usable()) { openingTrack.pause(); return; }
        // Begin the fade when decoded audio actually starts, even on a slow link.
        const now = context.currentTime;
        openingBus.gain.cancelScheduledValues(now);
        openingBus.gain.setValueAtTime(0, now);
        openingBus.gain.linearRampToValueAtTime(openingLevel, now + 2.6);
      }).catch(() => {}).finally(() => { openingPlay = null; });
    }
  }
  function startOpening() {
    clearTimeout(openingFadeTimer);
    openingStopping = false;
    if (!openingWanted && openingTrack) openingTrack.currentTime = 0;
    openingWanted = true;
    syncOpening();
  }
  function stopOpening(fade = 0) {
    openingWanted = false;
    openingStopping = false;
    clearTimeout(openingFadeTimer);
    const finish = () => {
      openingStopping = false;
      openingTrack?.pause();
      if (openingTrack) openingTrack.currentTime = 0;
      if (openingBus) {
        openingBus.gain.cancelScheduledValues(context.currentTime);
        openingBus.gain.setValueAtTime(0, context.currentTime);
      }
    };
    if (fade > 0 && openingBus && !openingTrack.paused && usable()) {
      openingStopping = true;
      const now = context.currentTime;
      openingBus.gain.cancelScheduledValues(now);
      openingBus.gain.setValueAtTime(openingBus.gain.value, now);
      openingBus.gain.linearRampToValueAtTime(0, now + fade);
      openingFadeTimer = setTimeout(finish, fade * 1000);
    } else finish();
  }
  function syncTown() {
    if (!townBus || !townTrack) return;
    if (townStopping) { if (!usable()) townTrack.pause(); return; }
    if (!townWanted || !usable()) { townTrack.pause(); townBus.gain.setTargetAtTime(0, context.currentTime, .04); return; }
    if (townTrack.paused && !townPlay) {
      townBus.gain.cancelScheduledValues(context.currentTime);
      townBus.gain.setTargetAtTime(townLevel, context.currentTime, .65);
      townPlay = townTrack.play().catch(() => {}).finally(() => { townPlay = null; });
    }
  }
  function startTown() {
    clearTimeout(townFadeTimer); townStopping = false; townWanted = true;
    if (townBus && usable()) {
      townBus.gain.cancelScheduledValues(context.currentTime);
      townBus.gain.setTargetAtTime(townLevel, context.currentTime, .65);
    }
    syncTown();
  }
  function stopTown(fade = .75, reset = false) {
    townWanted = false; townStopping = false; clearTimeout(townFadeTimer);
    const finish = () => { townStopping = false; townTrack?.pause(); if (reset && townTrack) townTrack.currentTime = 0; };
    if (fade > 0 && townBus && !townTrack.paused && usable()) {
      townStopping = true; const now = context.currentTime;
      townBus.gain.cancelScheduledValues(now); townBus.gain.setValueAtTime(townBus.gain.value, now);
      townBus.gain.linearRampToValueAtTime(0, now+fade); townFadeTimer = setTimeout(finish, fade*1000);
    } else finish();
  }
  function preloadCombat() {
    if (!context || samplesLoading || !combatAssets) return samplesLoading;
    samplesLoading = Promise.all(Object.entries(combatAssets.dataset).map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        samples.set(key.replace(/Src$/, ""), buffer);
      } catch { /* Synthesized effects remain available if an asset is unavailable. */ }
    }));
    return samplesLoading;
  }
  function sample(name, level = 1, rate = 1, length = null) {
    const buffer = samples.get(name);
    if (!buffer || !usable()) return false;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.playbackRate.value = rate; gain.gain.value = level;
    source.connect(gain); gain.connect(effectsBus);
    track(source, "effect", gain);
    source.addEventListener("ended", () => gain.disconnect());
    if(length!==null){
      const at=context.currentTime,duration=Math.min(buffer.duration,length)/rate;
      gain.gain.setValueAtTime(level,at+Math.max(0,duration-.08));gain.gain.linearRampToValueAtTime(0,at+duration);
      source.start(at,0,Math.min(buffer.duration,length));
    }else source.start();
    return true;
  }
  function syncBattle() {
    if (!battleTrack || !battleBus) return;
    if (battleStopping) { if (!usable()) battleTrack.pause(); return; }
    if (!battleWanted || !usable()) {
      battleTrack.pause(); battleBus.gain.setTargetAtTime(0, context.currentTime, .025); return;
    }
    if (battleTrack.paused && !battlePlay) {
      battleBus.gain.cancelScheduledValues(context.currentTime);
      battleBus.gain.setTargetAtTime(battleLevel(), context.currentTime, .18);
      battlePlay = battleTrack.play().catch(() => {}).finally(() => { battlePlay = null; });
    }
  }
  function startBattle() {
    clearTimeout(battleFadeTimer); battleStopping = false;
    if (!battleWanted) { battleTrack.currentTime = 0; battleMode = "command"; }
    battleWanted = true;
    if (battleBus && usable()) {
      battleBus.gain.cancelScheduledValues(context.currentTime);
      battleBus.gain.setTargetAtTime(battleLevel(), context.currentTime, .16);
    }
    syncBattle();
  }
  function stopBattle(fade = 0) {
    battleWanted = false; clearTimeout(battleFadeTimer); battleStopping = false;
    const finish = () => {
      battleStopping = false; battleTrack?.pause();
      if (battleTrack) battleTrack.currentTime = 0;
    };
    if (fade > 0 && battleBus && !battleTrack.paused && usable()) {
      battleStopping = true;
      const now = context.currentTime; battleBus.gain.cancelScheduledValues(now);
      battleBus.gain.setValueAtTime(battleBus.gain.value, now);
      battleBus.gain.linearRampToValueAtTime(0, now + fade);
      battleFadeTimer = setTimeout(finish, fade * 1000);
    } else finish();
  }
  function battlePhase(phase) {
    if (phase === "lastStrike") { stopBattle(.45); return; }
    const nextMode = ["overload", "desperation"].includes(phase) ? "danger" : phase === "dodge" ? "dodge" : "command",
      changed = battleMode !== nextMode;
    battleMode = nextMode;
    if (changed && battleWanted && battleBus && !battleStopping && usable()) {
      const now = context.currentTime; battleBus.gain.cancelScheduledValues(now);
      battleBus.gain.setTargetAtTime(battleLevel(), now, .35);
    }
  }
  function syncJourney() {
    if (!journeyTrack || !musicBus) return;
    if (musicStopping) {
      if (!usable()) journeyTrack.pause();
      return;
    }
    if (!journeyWanted || !usable()) {
      journeyTrack.pause();
      musicBus.gain.setTargetAtTime(0, context.currentTime, 0.035);
      return;
    }
    if (!journeyTrack.paused && !musicPlay) seekJourney();
    if (journeyTrack.paused && !musicPlay) {
      musicBus.gain.cancelScheduledValues(context.currentTime);
      musicBus.gain.setTargetAtTime(musicLevel, context.currentTime, 0.7);
      musicPlay = journeyTrack.play().then(seekJourney).catch(() => {}).finally(() => { musicPlay = null; });
    }
  }
  function seekJourney() {
    // Metadata may arrive before the media clock is ready; seek after play starts.
    if (!journeyWanted || journeySeek === null || journeyTrack.readyState < 2 || !Number.isFinite(journeyTrack.duration)) return;
    const offset = journeySeek % journeyTrack.duration;
    journeySeek = null;
    journeyTrack.currentTime = offset;
  }
  function startJourney(offset = 0) {
    clearTimeout(musicFadeTimer);
    musicStopping = false;
    if (!journeyWanted) {
      journeySeek = Math.max(0, Number(offset) || 0);
      journeyWanted = true;
    }
    if (musicBus && usable()) {
      musicBus.gain.cancelScheduledValues(context.currentTime);
      musicBus.gain.setTargetAtTime(musicLevel, context.currentTime, 0.7);
    }
    syncJourney();
  }
  function stopJourney(fade = 0) {
    journeyWanted = false;
    journeySeek = null;
    clearTimeout(musicFadeTimer);
    musicStopping = false;
    const finish = () => {
      musicStopping = false;
      journeyTrack?.pause();
      if (journeyTrack) journeyTrack.currentTime = 0;
    };
    if (fade > 0 && musicBus && !journeyTrack.paused && usable()) {
      musicStopping = true;
      const now = context.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(0, now + fade);
      musicFadeTimer = setTimeout(finish, fade * 1000);
    } else finish();
  }
  function ambientLevel() {
    return (landscapes[place] || landscapes.title).wind;
  }
  function scene(next) {
    if (next === "prologue") startOpening();
    else if (openingWanted || openingStopping) stopOpening(next === "title" ? .2 : 0);
    if (townPlaces.has(next)) startTown();
    else if (townWanted || next === "title") stopTown(next === "title" ? .2 : .75, next === "title");
    if (["ambush", "battle", "title", "library"].includes(next) && journeyWanted)
      stopJourney(next === "ambush" ? 0.55 : 0.2);
    if (next === "ambush") {
      preloadCombat();
      if (battleTrack.preload !== "auto") { battleTrack.preload = "auto"; battleTrack.load(); }
    }
    if (next === "battle") startBattle();
    else if (battleWanted) stopBattle(.25);
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
    if (place === "ambush" || place === "prologue") return;
    if (place === "battle") {
      // The full chiptune carries the rhythm; avoid a second unsynchronised loop.
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
          level: 0.15,
          end: 48,
          filter: 700,
        });
        noise(0.045, 0.22, beat % 2 ? 720 : 460, delay, {
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
        if (beat % 4 === 1)
          carriageJolt(delay + 0.04, beat % 8 === 5 ? 1.2 : 0.85, "scene");
        nextBeat += place === "departure" ? 0.36 : 0.285;
        beat++;
      }
    }
    if (now < nextAccent) return;
    nextAccent = now + (rolling ? 1.8 : interiors.has(place) ? 8 : 5) + Math.random() * (rolling ? 1.2 : 4);
    if (rolling) {
      // The carriage body creaks over an uneven stretch of road.
      tone(165, 0.28, {
        group: "scene",
        level: 0.12,
        end: 112,
        wave: "triangle",
        filter: 550,
      });
      noise(0.24, 0.16, 580, 0.05, { group: "scene" });
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
        // Raise effects by about 4.3 dB without lifting music or dialogue.
        effectsBus = context.createGain(); effectsBus.gain.value = 1.65; effectsBus.connect(master);
        // Dialogue retains its own +9 dB bus.
        voiceBus = context.createGain();
        voiceBus.gain.value = 2.8;
        voiceBus.connect(master);
        sceneryBus = context.createGain();
        sceneryBus.gain.value = 1;
        sceneryBus.connect(master);
        musicBus = context.createGain();
        musicBus.gain.value = 0;
        musicBus.connect(master);
        context.createMediaElementSource(journeyTrack).connect(musicBus);
        battleBus = context.createGain(); battleBus.gain.value = 0; battleBus.connect(master);
        context.createMediaElementSource(battleTrack).connect(battleBus);
        townBus = context.createGain(); townBus.gain.value = 0; townBus.connect(master);
        context.createMediaElementSource(townTrack).connect(townBus);
        openingBus = context.createGain(); openingBus.gain.value = 0; openingBus.connect(master);
        context.createMediaElementSource(openingTrack).connect(openingBus);
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
      preloadCombat();
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
  function carriageJolt(delay = 0, strength = 1, group = "effect") {
    // A heavy axle impact, wooden rebound and brief metal rattle form one bump.
    tone(74, 0.22, { group, delay, level: 0.32 * strength, end: 29, filter: 420 });
    tone(184, 0.095, { group, delay: delay + 0.025, level: 0.18 * strength, end: 82, filter: 950 });
    noise(0.065, 0.36 * strength, 720, delay, { group, crisp: true });
    noise(0.18, 0.18 * strength, 360, delay + 0.06, { group });
    noise(0.045, 0.14 * strength, 2600, delay + 0.04, { group, crisp: true });
    tone(1370, 0.075, { group, delay: delay + 0.06, wave: "sine", level: 0.045 * strength, end: 890, filter: 2200 });
  }
  function comicCry() {
    // A nasal "wa, wa, waaa" with a drooping final note and cartoon vibrato.
    for (const [delay,hz,length] of [[.035,622,.19],[.29,466,.21],[.56,311,.58]]) {
      const at=context.currentTime+delay,osc=context.createOscillator(),vibrato=context.createOscillator(),
        depth=context.createGain(),filter=context.createBiquadFilter(),gain=context.createGain();
      osc.type="sawtooth";osc.frequency.setValueAtTime(hz,at);osc.frequency.exponentialRampToValueAtTime(hz*.55,at+length);
      vibrato.frequency.value=7;depth.gain.value=hz*.035;vibrato.connect(depth);depth.connect(osc.frequency);
      filter.type="bandpass";filter.Q.value=1.7;filter.frequency.setValueAtTime(1150,at);filter.frequency.exponentialRampToValueAtTime(430,at+length);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.19,at+.022);gain.gain.setTargetAtTime(0,at+length*.67,.055);
      osc.connect(filter);filter.connect(gain);gain.connect(effectsBus);
      track(osc,"comic",gain);track(vibrato,"comic",gain);
      osc.addEventListener("ended",()=>{filter.disconnect();depth.disconnect();gain.disconnect();});
      osc.start(at);vibrato.start(at);osc.stop(at+length+.08);vibrato.stop(at+length+.08);
    }
    noise(.06,.13,1250,0,{crisp:true,group:"comic"});noise(.055,.10,1000,.23,{crisp:true,group:"comic"});
    tone(155,.19,{wave:"triangle",level:.08,end:72,delay:1.04,filter:600,group:"comic"});
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
      group === "voice" ? voiceBus : group === "scene" ? sceneryBus : effectsBus,
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
    gain.connect(group === "scene" ? sceneryBus : effectsBus);
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
    if (journeyWanted && musicBus && !musicStopping) {
      musicBus.gain.cancelScheduledValues(lastVoice);
      musicBus.gain.setTargetAtTime(0.65, lastVoice, 0.045);
      musicBus.gain.setTargetAtTime(musicLevel, lastVoice + 0.2, 0.55);
    }
    if (battleWanted && battleBus && !battleStopping) {
      battleBus.gain.cancelScheduledValues(lastVoice);
      battleBus.gain.setTargetAtTime(battleLevel()*.5, lastVoice, .035);
      battleBus.gain.setTargetAtTime(battleLevel(), lastVoice+.2, .35);
    }
    if (townWanted && townBus && !townStopping) {
      townBus.gain.cancelScheduledValues(lastVoice);
      townBus.gain.setTargetAtTime(townLevel*.4,lastVoice,.04);
      townBus.gain.setTargetAtTime(townLevel,lastVoice+.2,.5);
    }
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
    if (battleWanted && battleBus && !battleStopping && ["demon","sword","parry","charge"].includes(name)) {
      battleBus.gain.cancelScheduledValues(now);
      battleBus.gain.setTargetAtTime(battleLevel()*.52,now,.012);
      battleBus.gain.setTargetAtTime(battleLevel(),now+(name==="demon"?.6:.2),.22);
    }
    switch (name) {
      case "select":
        tone(860, 0.035, { wave: "square", level: 0.035, end: 1050 });
        break;
      case "battleStart":
        [440,330,220,110].forEach((hz,i)=>tone(hz,.14,{wave:"square",level:.12,delay:i*.08,end:hz*.7}));
        noise(.32,.3,550); break;
      case "demon":
        sample("demon", variant === "short" ? .8 : .95, 1, variant === "short" ? 1.0 : null);
        tone(62,.75,{wave:"sawtooth",level:.11,end:38,filter:480});noise(.38,.22,380);break;
      case "volley":
        sample("volley", variant === "surge" ? .35 : .28, variant === "spiral" ? 1.35 : variant === "surge" ? .75 : 1.1);
        noise(.035,.12,variant === "surge" ? 1400 : 2800,0,{crisp:true});
        break;
      case "claw":
        sample("sword", .45, .75);noise(.09,.19,2100,0,{crisp:true});
        break;
      case "warning":
        tone(680,.10,{wave:"sine",level:.065,end:1100,filter:1800});
        break;
      case "sword":
        if (!sample("sword", 1.2)) noise(.12,.4,3500,0,{crisp:true});
        [2350,3525,4700].forEach((hz,i)=>tone(hz,.22-i*.04,{wave:"sine",level:.07/(i+1),end:hz*.93,filter:6500}));break;
      case "parry":
        sample("parry", .8, 1.35);
        [1160,1740].forEach(hz=>tone(hz,.19,{wave:"sine",level:.1}));break;
      case "hurt":
        if (!sample("hurt", .65)) noise(.13,.4,650);
        tone(147,.18,{wave:"square",level:.08,end:55});break;
      case "charge":
        sample("charge", .8, .85);
        tone(83,.9,{wave:"sawtooth",level:.1,end:260,filter:900});break;
      case "arrow":
        if (!sample("arrow", 1.2, 1.16)) noise(.15,.35,4400,0,{crisp:true});
        [0,.035,.082,.123].forEach((delay,i)=>noise(.025,.18-i*.02,3200+i*650,delay,{crisp:true}));
        tone(2200,.17,{wave:"sawtooth",level:.055,end:5400,filter:6500});
        tone(3600,.13,{wave:"sine",level:.065,end:1100,filter:7000});break;
      case "arrowHit":
        sample("arrowHit", 1.25, 1);
        noise(.035,.3,3700,0,{crisp:true});tone(118,.21,{level:.22,end:38,filter:520});
        [1760,2640].forEach((hz,i)=>tone(hz,.32+i*.09,{wave:"sine",level:.065/(i+1),end:hz*.72,filter:5000}));
        [0.045,.11,.19,.29].forEach((delay,i)=>noise(.022,.14-i*.025,4100-i*470,delay,{crisp:true}));break;
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
        carriageJolt(0, 1.25);
        carriageJolt(0.19, 0.72);
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
        comicCry();
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
  journeyTrack?.addEventListener("loadedmetadata", syncJourney);
  journeyTrack?.addEventListener("canplay", syncJourney);
  battleTrack?.addEventListener("canplay", syncBattle);
  townTrack?.addEventListener("canplay", syncTown);
  openingTrack?.addEventListener("canplay", syncOpening);
  const retryMusic = () => {
    if (journeyWanted && journeyTrack?.paused) syncJourney();
    if (battleWanted && battleTrack?.paused) syncBattle();
    if (townWanted && townTrack?.paused) syncTown();
    if (openingWanted && openingTrack?.paused) syncOpening();
  };
  document.addEventListener("pointerdown", retryMusic, { passive: true });
  document.addEventListener("keydown", retryMusic, { passive: true });
  return {
    configure,
    unlock,
    voice,
    sfx,
    scene,
    startJourney,
    stopJourney,
    stopOpening,
    stopBattle,
    battlePhase,
    getCombatState: () => ({ active: battleWanted, mode: battleMode, samples: samples.size }),
    getTownState: () => ({ active: townWanted, offset: townTrack?.currentTime ?? 0 }),
    getOpeningState: () => ({ active: openingWanted, offset: openingTrack?.currentTime ?? 0, gain: openingBus?.gain.value ?? 0 }),
    getJourneyState: () => ({ active: journeyWanted, offset: journeySeek ?? journeyTrack?.currentTime ?? 0 }),
    stopVoice: () => stopTransient("voice"),
    stopTransient,
    get unlocked() {
      return context?.state === "running";
    },
  };
})();
