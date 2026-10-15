// The title, six illustrated pages and name entry share one reversible flow.
const storyJourney = (() => {
  const screen = document.querySelector("#story-screen");
  const title = document.querySelector("#title-screen");
  const content = screen.querySelector(".story-content");
  const art = document.querySelector("#chronicle-art");
  const narration = document.querySelector("#story-narration");
  const count = document.querySelector("#story-count");
  const autoButton = document.querySelector("#story-auto");
  const nextButton = document.querySelector("#story-next");
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
      text: "먼 옛날, 제루스 대륙은 그야말로 혼돈 그 자체였다.",
      art: "폭풍과 어둠에 뒤덮인 고대 제루스 대륙의 기록화.",
    },
    {
      text: "들끓는 마족, 포악한 짐승, 사악한 악령. 어디서든 죽음의 위협이 도사리고 있었다.",
      art: "마족과 짐승, 악령이 여행자의 길을 가로막는 기록화.",
    },
    {
      text: "하지만, 그 지옥도 속에서도 수 천 년 전부터 존재해온 생명의 거목 '어머니 나무'는 굳건히 서있었고, 그 누구도 함부로 어머니 나무의 성역을 침범할 수 없었다.",
      art: "어둠 속에서도 빛나는 성역을 지키는 거대한 어머니 나무.",
    },
    {
      text: "어머니 나무로부터 힘을 나눠받았지만 그럼에도 혼란을 진압하기 역부족이었던 고대의 엘프들은, 마침내 국가의 필요성을 느끼고 성역 주변으로 평등과 자유를 표방하는 중립 국가를 세운다.",
      art: "어머니 나무 아래에 모여 새로운 나라의 터를 닦는 고대 엘프들.",
    },
    {
      text: "이 곳이 바로 그린스토아. 수많은 종족들이 하나의 이름 아래 살아가는 곳. 열정으로 실체를 거머쥘 수 있는 유일한 지대.",
      art: "어머니 나무와 강을 둘러싼 도시, 함께 살아가는 여러 종족들.",
    },
    {
      text: "하지만 최근, 이 신성한 지역에서도 불미스러운 기운이 감돌고 있다는데...",
      art: "고요한 성역의 나무 뿌리 사이로 스며드는 불길한 그림자.",
    },
  ];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let phase = "title";
  let index = 0;
  let automatic = true;
  let busy = false;
  let advanceTimer = 0;
  let transitionTimer = 0;
  let draftName = "";

  function stopTimer() {
    clearTimeout(advanceTimer);
  }
  function notify() {
    document.dispatchEvent(new Event("greenstoa:storychange"));
  }
  function delayForScene() {
    // Leave even the longest passage enough time to read before fading out.
    return Math.max(6500, scenes[index].text.length * 95 + 1800);
  }
  function schedule() {
    stopTimer();
    if (phase === "prologue" && automatic && !busy && !document.hidden)
      advanceTimer = setTimeout(next, delayForScene());
  }
  function showPage(nextPhase) {
    phase = nextPhase;
    screen.dataset.phase = phase;
    for (const [key, page] of Object.entries(pages))
      page.hidden = key !== phase;
    const reading = phase === "prologue";
    document
      .querySelector(".scene")
      .setAttribute(
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
    art.style.backgroundPosition = `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`;
    art.setAttribute("aria-label", scenes[index].art);
    narration.textContent = scenes[index].text;
    count.textContent = `${String(index + 1).padStart(2, "0")} / 06`;
    nextButton.setAttribute(
      "aria-label",
      index === scenes.length - 1 ? "이름 정하기로" : "다음 장면",
    );
  }
  function transition(render, focusTarget) {
    if (busy || phase === "title") return;
    busy = true;
    stopTimer();
    content.classList.add("is-fading");
    const duration =
      reducedMotion.matches || document.body.classList.contains("no-motion")
        ? 0
        : 420;
    transitionTimer = setTimeout(() => {
      render();
      content.classList.remove("is-fading");
      busy = false;
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      schedule();
    }, duration);
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
    if (index === scenes.length - 1) {
      showName();
      return;
    }
    transition(() => {
      index++;
      paintScene();
    });
  }
  function returnToTitle() {
    stopTimer();
    clearTimeout(transitionTimer);
    phase = "title";
    busy = false;
    screen.hidden = true;
    content.classList.remove("is-fading");
    title.hidden = false;
    title.inert = false;
    document.querySelector(".scene").classList.remove("is-story-active");
    document
      .querySelector(".scene")
      .setAttribute("aria-label", "그린스토아 타이틀 화면");
    notify();
    document.querySelector("#start-button").focus({ preventScroll: true });
  }
  function start() {
    if (phase !== "title") return;
    index = 0;
    automatic = true;
    busy = false;
    autoButton.setAttribute("aria-pressed", "true");
    autoButton.textContent = "자동 넘김 · 켜짐";
    try {
      const saved = JSON.parse(
        localStorage.getItem("greenstoa-player") || "null",
      );
      if (saved && typeof saved.name === "string") nameInput.value = saved.name;
    } catch {}
    title.inert = true;
    title.hidden = true;
    screen.hidden = false;
    document.querySelector(".scene").classList.add("is-story-active");
    paintScene();
    notify();
    screen.scrollTop = 0;
    nextButton.focus({ preventScroll: true });
    schedule();
  }
  nextButton.addEventListener("click", next);
  skipButton.addEventListener("click", showName);
  document
    .querySelector("#story-return")
    .addEventListener("click", returnToTitle);
  document
    .querySelector("#name-finish")
    .addEventListener("click", returnToTitle);
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
  document.addEventListener("visibilitychange", schedule);
  return {
    start,
    get active() {
      return phase !== "title";
    },
  };
})();
