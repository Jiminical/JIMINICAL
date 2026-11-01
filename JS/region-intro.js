// Two one-time field introductions. Progress and repeat suppression live in game.js.
const regionIntroduction = (() => {
  const root = document.querySelector("#region-introduction");
  const title = root.querySelector("h2"), subtitle = root.querySelector("p");
  const regions = {
    zerdia: ["- 제르디아 왕국 -", "제루스 대륙의 초강대국"],
    greenstoa: ["- 그린스토아 -", "이종족연합국"],
  };
  let animation = null, timer = 0, after = null, current = null;
  function hide() {
    clearTimeout(timer);
    animation?.cancel(); animation = null;
    after = null; current = null;
    root.hidden = true;
    root.style.opacity = "0";
  }
  function finish() {
    if (!current) return;
    const next = after;
    hide();
    next?.();
  }
  function show(id, motion, next) {
    hide();
    current = id; after = next;
    title.textContent = regions[id][0];
    subtitle.textContent = regions[id][1];
    root.dataset.region = id;
    root.hidden = false;
    root.style.opacity = motion ? "0" : "1";
    if (motion) {
      animation = root.animate([
        {opacity:0,offset:0}, {opacity:1,offset:.2},
        {opacity:1,offset:.75}, {opacity:0,offset:1},
      ], {duration:3000,easing:"ease-in-out",fill:"forwards"});
      animation.onfinish = finish;
    } else timer = setTimeout(finish,1200);
  }
  return {show,finish,hide,get active(){return current!==null},get id(){return current}};
})();
