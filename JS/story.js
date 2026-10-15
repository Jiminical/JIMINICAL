// Title → illustrated chronicle → name entry. All transitions can be cancelled.
const storyJourney = (() => {
  const screen = document.querySelector("#story-screen");
  const title = document.querySelector("#title-screen");
  const scene = document.querySelector(".scene");
  const curtain = document.querySelector("#scene-curtain");
  const content = screen.querySelector(".story-content");
  const art = document.querySelector("#chronicle-art");
  const artContext = art.getContext("2d");
  const narration = document.querySelector("#story-narration");
  const accessibleNarration = document.querySelector(
    "#story-narration-accessible",
  );
  const count = document.querySelector("#story-count");
  const autoButton = document.querySelector("#story-auto");
  const nextButton = document.querySelector("#story-next");
  const nextLabel = document.querySelector("#story-next-label");
  const skipButton = document.querySelector("#story-skip");
  const nameInput = document.querySelector("#player-name");
  const nameError = document.querySelector("#name-error");
  const pages = {
    prologue: document.querySelector("#prologue-page"),
    name: document.querySelector("#name-page"),
    confirm: document.querySelector("#name-confirmation"),
    complete: document.querySelector("#name-complete"),
  };
  const scenes = [
    {
      panel: 0,
      text: "먼 옛날, 아직 나라와 국경조차 없던 시대.\n제루스 대륙은 끝없는 혼돈에 휩싸여 있었다.",
      art: "폭풍과 어둠에 뒤덮인 고대 제루스 대륙의 기록화.",
    },
    {
      panel: 1,
      text: "들끓는 마족과 포악한 짐승, 사악한 악령들.\n약탈과 죽음이 끊이지 않았고, 어디에도 안전한 땅은 없었다.",
      art: "마족과 짐승, 악령이 여행자의 길을 가로막는 기록화.",
    },
    {
      panel: 2,
      text: "그러나 대륙이 제루스라 불리기 수천 년 전부터, 생명의 거목 ‘어머니 나무’는 굳건히 서 있었다.\n순수한 생명력이 깃든 그 성역만큼은 누구도 감히 침범하지 못했다.",
      art: "어둠 속에서도 빛나는 성역을 지키는 거대한 어머니 나무.",
    },
    {
      panel: 2,
      text: "어머니 나무로부터 태어나 그 힘을 나눠 받고, 성역을 지키며 살아가는 이들.\n세상은 그 종족을 ‘엘프’라 불렀다.",
      art: "어머니 나무의 생명력으로 빛나는 고대 성역의 기록화.",
    },
    {
      panel: 3,
      text: "하지만 어머니 나무의 힘을 나눠 받은 고대 엘프들조차 대륙의 혼란을 잠재우기에는 역부족이었다.\n마침내 그들은 나라의 필요성을 깨닫고, 평등과 자유를 기치로 성역 주변에 중립 국가를 세웠다.",
      art: "어머니 나무 아래에 모여 새로운 나라의 터를 닦는 고대 엘프들.",
    },
    {
      panel: 4,
      text: "그 나라의 이름은 그린스토아.\n인간들의 차별을 피해 자유를 갈망하던 이종족들이 대륙 각지에서 모여들었다.\n그들은 평등과 보금자리에 보답하며, 시민이자 성역을 지키는 힘이 되었다.",
      art: "어머니 나무와 강을 둘러싼 도시, 함께 살아가는 여러 종족들.",
    },
    {
      panel: 4,
      text: "그리고 마침내 나타난 최초의 용사, 제르.\n당대 최강의 인간들과 그린스토아는 동맹을 맺고 선대 마왕을 격퇴했다.\n흩어진 대륙이 하나로 이어지고, 이 땅에는 긴 평화가 찾아왔다.",
      art: "여러 종족이 나란히 바라보는 평화로운 성역의 도시.",
    },
    {
      panel: 4,
      text: "오늘날 그린스토아는 제루스 대륙의 허파이자, 수려한 대자연을 품은 이종족들의 연합국.\n종족도 신분도 묻지 않는 중립 지대, 열정으로 꿈을 현실로 만들 수 있는 땅이다.",
      art: "강과 숲, 어머니 나무의 품 아래 살아가는 그린스토아.",
    },
    {
      panel: 5,
      text: "그러나 최근, 이 신성한 땅에도 불길한 기운이 감돈다는 소문이 들려온다.\n제르디아 기사단은 성역을 조사할 모험가를 찾기 시작했다.\n그리고 지금, 한 모험가가 길드의 접수대 앞에 서 있다…",
      art: "고요한 성역의 나무 뿌리 사이로 스며드는 불길한 그림자.",
    },
  ];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter("ko", { granularity: "grapheme" })
      : null;
  const animations = new Set();
  let phase = "title";
  let index = 0;
  let automatic = true;
  let busy = false;
  let sequence = 0;
  let advanceTimer = 0;
  let typingTimer = 0;
  let draftName = "";
  let glyphs = [];
  let revealed = 0;
  let typing = false;
  const artwork = new Image();
  artwork.src = art.dataset.artSrc;
  const artworkReady = artwork
    .decode()
    .then(() => true)
    .catch(() => false);

  function motionEnabled() {
    return (
      !reducedMotion.matches && !document.body.classList.contains("no-motion")
    );
  }
  function notify() {
    document.dispatchEvent(new Event("greenstoa:storychange"));
  }
  function stopTimer() {
    clearTimeout(advanceTimer);
  }
  function cancelWork() {
    sequence++;
    stopTimer();
    clearTimeout(typingTimer);
    typing = false;
    for (const animation of animations) animation.cancel();
    return sequence;
  }
  async function fade(element, opacity, duration) {
    if (!motionEnabled()) {
      element.style.opacity = String(opacity);
      return true;
    }
    const animation = element.animate(
      [{ opacity: getComputedStyle(element).opacity }, { opacity }],
      { duration, easing: "ease-in-out", fill: "forwards" },
    );
    animations.add(animation);
    try {
      await animation.finished;
      element.style.opacity = String(opacity);
      return true;
    } catch {
      return false;
    } finally {
      animations.delete(animation);
      animation.cancel();
    }
  }
  function schedule() {
    stopTimer();
    if (
      phase === "prologue" &&
      automatic &&
      !busy &&
      !typing &&
      !document.hidden
    )
      advanceTimer = setTimeout(
        next,
        Math.max(2800, scenes[index].text.length * 26 + 1300),
      );
  }
  function updateNext() {
    const final = index === scenes.length - 1;
    nextLabel.textContent = typing
      ? "모두 보기"
      : final
        ? "이름 정하기"
        : "다음";
    nextButton.setAttribute(
      "aria-label",
      typing ? "문장 모두 보기" : final ? "이름 정하기로" : "다음 장면",
    );
    screen.dataset.typing = String(typing);
    narration.dataset.revealed = String(revealed);
  }
  function finishTyping() {
    clearTimeout(typingTimer);
    for (const glyph of glyphs) glyph.classList.add("is-visible");
    revealed = glyphs.length;
    typing = false;
    updateNext();
    schedule();
  }
  function revealNext() {
    if (!typing || phase !== "prologue" || document.hidden) return;
    if (revealed >= glyphs.length) {
      finishTyping();
      return;
    }
    const glyph = glyphs[revealed++];
    glyph.classList.add("is-visible");
    narration.dataset.revealed = String(revealed);
    const letter = glyph.textContent;
    const delay = /[.!?…]/u.test(letter)
      ? 330
      : /[,，]/u.test(letter)
        ? 150
        : letter === "\n"
          ? 240
          : /\s/u.test(letter)
            ? 25
            : 48;
    typingTimer = setTimeout(revealNext, delay);
  }
  function startTyping() {
    typing = true;
    updateNext();
    if (!motionEnabled()) finishTyping();
    else revealNext();
  }
  function drawArtwork() {
    if (phase !== "prologue" || !artwork.complete || !artwork.naturalWidth)
      return;
    const bounds = art.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    art.width = Math.round(bounds.width * density);
    art.height = Math.round(bounds.height * density);
    const tileWidth = artwork.naturalWidth / 2;
    const tileHeight = artwork.naturalHeight / 3;
    // Fit the entire panel uniformly; no crop or independent X/Y stretching.
    const scale = Math.min(art.width / tileWidth, art.height / tileHeight);
    const drawWidth = tileWidth * scale;
    const drawHeight = tileHeight * scale;
    artContext.imageSmoothingEnabled = false;
    artContext.clearRect(0, 0, art.width, art.height);
    artContext.drawImage(
      artwork,
      (scenes[index].panel % 2) * tileWidth,
      Math.floor(scenes[index].panel / 2) * tileHeight,
      tileWidth,
      tileHeight,
      (art.width - drawWidth) / 2,
      (art.height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  }
  function showPage(nextPhase) {
    phase = nextPhase;
    screen.dataset.phase = phase;
    for (const [key, page] of Object.entries(pages))
      page.hidden = key !== phase;
    const reading = phase === "prologue";
    scene.setAttribute(
      "aria-label",
      reading ? "그린스토아 프롤로그" : "그린스토아 이름 설정",
    );
    screen.querySelector(".story-footer").hidden = !reading;
    skipButton.hidden = !reading;
    screen.querySelector(".chronicle-label").textContent = reading
      ? "제루스의 기록"
      : "이름 없는 기록";
  }
  function paintScene() {
    showPage("prologue");
    screen.dataset.storyIndex = String(index);
    art.setAttribute("aria-label", scenes[index].art);
    drawArtwork();
    const letters = segmenter
      ? Array.from(
          segmenter.segment(scenes[index].text),
          (item) => item.segment,
        )
      : Array.from(scenes[index].text);
    glyphs = letters.map((letter) => {
      const span = document.createElement("span");
      span.className = "narration-glyph";
      span.textContent = letter;
      return span;
    });
    narration.replaceChildren(...glyphs);
    accessibleNarration.textContent = scenes[index].text;
    revealed = 0;
    typing = false;
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
    updateNext();
  }
  async function transition(render, focusTarget) {
    if (busy || phase === "title") return;
    const token = cancelWork();
    busy = true;
    content.classList.add("is-fading");
    if (!(await fade(content, 0, 340)) || token !== sequence) return;
    render();
    if (!(await fade(content, 1, 440)) || token !== sequence) return;
    content.classList.remove("is-fading");
    busy = false;
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    if (phase === "prologue") startTyping();
  }
  function clearError() {
    nameError.textContent = "";
    nameInput.removeAttribute("aria-invalid");
  }
  function showName() {
    transition(() => {
      showPage("name");
      clearError();
    }, nameInput);
  }
  function next() {
    if (phase !== "prologue" || busy) return;
    if (typing) {
      finishTyping();
      return;
    }
    if (index === scenes.length - 1) {
      showName();
      return;
    }
    transition(() => {
      index++;
      paintScene();
    });
  }
  async function returnToTitle() {
    if (phase === "title" || phase === "closing") return;
    const token = cancelWork();
    phase = "closing";
    busy = true;
    curtain.hidden = false;
    if (!(await fade(curtain, 1, 360)) || token !== sequence) return;
    guildGame.stop();
    scene.classList.remove("is-game-active");
    screen.hidden = true;
    content.style.opacity = "1";
    content.classList.remove("is-fading");
    title.hidden = false;
    scene.classList.remove("is-story-active");
    scene.setAttribute("aria-label", "그린스토아 타이틀 화면");
    if (!(await fade(curtain, 0, 480)) || token !== sequence) return;
    curtain.hidden = true;
    title.inert = false;
    phase = "title";
    busy = false;
    notify();
    document.querySelector("#start-button").focus({ preventScroll: true });
  }
  async function start() {
    if (phase !== "title") return;
    const token = cancelWork();
    phase = "opening";
    busy = true;
    index = 0;
    automatic = true;
    autoButton.setAttribute("aria-pressed", "true");
    autoButton.textContent = "자동 넘김 · 켜짐";
    try {
      const saved = JSON.parse(
        localStorage.getItem("greenstoa-player") || "null",
      );
      if (saved && typeof saved.name === "string") nameInput.value = saved.name;
    } catch {}
    title.inert = true;
    curtain.style.opacity = "0";
    curtain.hidden = false;
    notify();
    // Hold an opaque curtain while the art and font are decoded; the green scene never flashes through.
    await Promise.all([
      fade(curtain, 1, 420),
      artworkReady,
      document.fonts.ready,
    ]);
    if (token !== sequence) return;
    screen.hidden = false;
    title.hidden = true;
    scene.classList.add("is-story-active");
    content.style.opacity = "1";
    paintScene();
    screen.scrollTop = 0;
    if (!(await fade(curtain, 0, 620)) || token !== sequence) return;
    curtain.hidden = true;
    busy = false;
    nextButton.focus({ preventScroll: true });
    startTyping();
  }
  async function beginGame() {
    if (busy || phase !== "complete") return;
    const token = cancelWork();
    busy = true;
    phase = "game-opening";
    curtain.hidden = false;
    try {
      await Promise.all([fade(curtain, 1, 420), guildGame.ready]);
      if (token !== sequence) return;
      screen.hidden = true;
      scene.classList.add("is-game-active");
      scene.setAttribute("aria-label", "제르디아 왕국 모험가 길드");
      phase = "game";
      await guildGame.start(draftName, returnToTitle);
      notify();
      if (!(await fade(curtain, 0, 620)) || token !== sequence) return;
      curtain.hidden = true;
      busy = false;
      guildGame.unlock();
    } catch {
      if (token !== sequence) return;
      guildGame.stop();
      scene.classList.remove("is-game-active");
      showPage("complete");
      screen.hidden = false;
      document.querySelector("#record-note").textContent =
        "길드의 그림을 불러오지 못했어요. 다시 시작해 주세요.";
      await fade(curtain, 0, 240);
      curtain.hidden = true;
      busy = false;
    }
  }
  nextButton.addEventListener("click", next);
  skipButton.addEventListener("click", showName);
  document
    .querySelector("#story-return")
    .addEventListener("click", returnToTitle);
  document
    .querySelector("#name-finish")
    .addEventListener("click", returnToTitle);
  document.querySelector("#name-begin").addEventListener("click", beginGame);
  autoButton.addEventListener("click", () => {
    automatic = !automatic;
    autoButton.setAttribute("aria-pressed", String(automatic));
    autoButton.textContent = `자동 넘김 · ${automatic ? "켜짐" : "꺼짐"}`;
    schedule();
  });
  document.querySelector("#name-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy || phase !== "name" || event.isComposing) return;
    draftName = nameInput.value.normalize("NFC").replace(/\s+/gu, " ").trim();
    const count = Array.from(draftName).length;
    if (!count || count > 12 || /[\p{Cc}\p{Cf}]/u.test(draftName)) {
      nameError.textContent = !count
        ? "기록할 이름을 적어 주세요."
        : "이름은 보이는 글자로 12자 이내로 적어 주세요.";
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return;
    }
    clearError();
    nameInput.value = draftName;
    transition(() => {
      document.querySelector("#confirmed-name").textContent = draftName;
      showPage("confirm");
    }, document.querySelector("#name-accept"));
  });
  // Let Korean IME finish composing a syllable without submitting the form.
  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || event.keyCode === 229))
      event.preventDefault();
  });
  nameInput.addEventListener("input", clearError);
  for (const id of ["name-edit", "name-rewrite"])
    document.querySelector("#" + id).addEventListener("click", showName);
  document.querySelector("#name-accept").addEventListener("click", () => {
    if (busy || phase !== "confirm") return;
    let saved = true;
    try {
      localStorage.setItem(
        "greenstoa-player",
        JSON.stringify({ name: draftName }),
      );
    } catch {
      saved = false;
    }
    transition(() => {
      document.querySelector("#recorded-name").textContent = draftName;
      document.querySelector("#record-note").textContent = saved
        ? "이곳에서, 당신의 이야기가 시작됩니다."
        : "브라우저에 저장하지 못했어요. 화면을 닫으면 이름이 지워질 수 있어요.";
      showPage("complete");
    }, document.querySelector("#name-finish"));
  });
  document.addEventListener("visibilitychange", () => {
    clearTimeout(typingTimer);
    if (document.hidden) stopTimer();
    else if (typing) revealNext();
    else schedule();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      for (const animation of animations) animation.finish();
      if (typing) finishTyping();
    }
  });
  new ResizeObserver(drawArtwork).observe(art);
  return {
    start,
    get active() {
      return phase !== "title";
    },
  };
})();
