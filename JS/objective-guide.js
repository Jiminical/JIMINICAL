// Optional persistent objective guide. Legacy saves start with the guide locked.
function createObjectiveGuideModel() {
  let settings = {unlocked:false,dismissed:false};
  const valid = value => !!value && typeof value.unlocked === "boolean" &&
    typeof value.dismissed === "boolean";
  function describe(world) {
    const mission = world.questAccepted ? "성역의 이상 징후 사전 조사" : "그린스토아행 의뢰";
    if (!world.questAccepted) return {id:"accept",mission,step:"루시에게 그린스토아 사전 조사 의뢰 받기"};
    const flags = world.fieldFlags || {};
    const stages = {
      guild:["leave-guild","길드에서 나와 광장의 기사단 마차로 가기"],
      city:["board-carriage","여행 준비를 마치고 광장 아래쪽 마차에 탑승하기"],
      cliff:["return-to-city","광장으로 돌아가 기사단 마차에 탑승하기"],
      carriage:["journey","동쪽 숲길을 지나 그린스토아로 향하기"],
      checkpoint:["checkpoint","카니아에게 모험가증과 의뢰서 보여 주기"],
      gate:["enter-grove","정문을 지나 그린스토아 숲길로 들어가기"],
      grove: flags.libraryAmbushCleared
        ? ["enter-library","이슬잎 도서관에 들어가 성역의 기록 확인하기"]
        : ["reach-library","숲길을 따라 다리 너머 도서관으로 향하기"],
      library: flags.libraryLetterRead
        ? ["read-records","세계의 기록과 인물 도감, 프롤로그 웹툰 살펴보기"]
        : ["read-letter","머리 위에 도착한 편지에 E · 자세히 읽기"],
      shop: world.shopOrigin === "grove"
        ? ["return-to-grove","준비를 마치고 도서관으로 향하기"]
        : ["finish-preparation","여행 준비를 마치고 광장의 마차에 탑승하기"]
    };
    const stage = stages[world.location];
    return stage ? {id:stage[0],mission,step:stage[1]} : null;
  }
  return {
    valid,
    reset(saved) {
      settings = valid(saved) ? {...saved} : {unlocked:false,dismissed:false};
    },
    reveal() { settings = {unlocked:true,dismissed:false}; },
    dismiss() { if (settings.unlocked) settings.dismissed = true; },
    snapshot() { return {...settings}; },
    describe,
    view(world) {
      const objective = describe(world);
      return {
        visible: !!(objective && settings.unlocked && !settings.dismissed &&
          world.active && !world.inputLocked && world.phase === "free" &&
          world.location !== "carriage"),
        objective
      };
    }
  };
}

const objectiveGuide = (() => {
  const model = createObjectiveGuideModel();
  let panel, copy, close, canvas, onChange = () => {}, lastWorld = null, textKey = "";
  function update(world = lastWorld) {
    if (world) lastWorld = world;
    if (!panel || !lastWorld) return;
    const view = model.view(lastWorld);
    if (panel.hidden === view.visible) panel.hidden = !view.visible;
    if (!view.objective) return;
    const key = view.objective.id + ":" + view.objective.mission;
    if (key !== textKey) {
      textKey = key;
      copy.querySelector(".objective-title").textContent = view.objective.mission;
      copy.querySelector(".objective-step").textContent = view.objective.step;
    }
  }
  function bind({onSettingsChange = () => {}} = {}) {
    onChange = onSettingsChange;
    if (panel) return;
    panel = document.querySelector("#game-objective");
    copy = panel.querySelector(".objective-copy");
    close = panel.querySelector(".objective-close");
    canvas = document.querySelector("#guild-world");
    close.addEventListener("click", event => {
      event.stopPropagation();
      if (!lastWorld || !model.view(lastWorld).visible) return;
      model.dismiss();
      update();
      canvas.focus({preventScroll:true});
      onChange();
    });
    close.addEventListener("keydown", event => {
      // Keep button activation from reaching the game's dialogue/action keys.
      if (["Enter","Space","KeyE"].includes(event.code)) event.stopPropagation();
    });
    update();
  }
  return {
    bind, update,
    describe: model.describe,
    snapshot: model.snapshot,
    valid: model.valid,
    reset(saved) { model.reset(saved); textKey = ""; lastWorld = null; if (panel) panel.hidden = true; },
    reveal() { model.reveal(); update(); onChange(); },
    dismiss() { model.dismiss(); update(); onChange(); }
  };
})();
