// Reading stays in the library; closing a book restores the same field position.
const libraryArchive = (() => {
  const root = document.querySelector("#library-reader"),
    list = document.querySelector("#archive-index"),
    page = document.querySelector("#archive-page"),
    scroll = document.querySelector("#archive-scroll"),
    scrollMore = document.querySelector("#archive-scroll-more"),
    pane = scroll.parentElement,
    tabs = [...document.querySelectorAll("[data-archive-tab]")];
  let state = null,
    tab = "world",
    selected = 0,
    inputAfter = 0;
  let scrollFrame = 0;
  function updateScrollCue() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const more = Boolean(state) && scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 6;
      scrollMore.hidden = !more;
      pane.classList.toggle("has-more", more);
      pane.classList.toggle("is-scrolled", Boolean(state) && scroll.scrollTop > 6);
    });
  }
  function scrollPage(delta, smooth = false) {
    scroll.scrollBy({top:delta,behavior:smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant"});
    updateScrollCue();
  }
  const counts = {
    world: () => greenstoaLore.articles.length,
    people: () => greenstoaLore.people.length,
    comic: () => 1,
  };
  function paragraph(text, className = "") {
    const p = document.createElement("p");
    p.textContent = text;
    p.className = className;
    return p;
  }
  function heading(text) {
    const h = document.createElement("h3");
    h.textContent = text;
    return h;
  }
  function canvas(width, height) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }
  function choose(index, focus = false) {
    selected = index;
    gameAudio.sfx("paper");
    render();
    if (focus) {
      list.children[index]?.focus({ preventScroll: true });
      list.children[index]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }
  function renderIndex() {
    list.replaceChildren();
    if (tab === "comic") return;
    const entries =
      tab === "world"
        ? greenstoaLore.articles
        : greenstoaLore.people;
    entries.forEach((item, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent =
        (index === selected ? "▸ " : "　") + (item.title || item.name);
      b.className = index === selected ? "is-current" : "";
      b.setAttribute("aria-pressed", String(index === selected));
      b.addEventListener("click", () => choose(index, true));
      list.append(b);
    });
    if (selected === 0) {
      list.scrollTop = 0;
      list.scrollLeft = 0;
    }
  }
  function render() {
    if (!state) return;
    root.dataset.tab = tab;
    tabs.forEach((b) => {
      const current = b.dataset.archiveTab === tab;
      b.classList.toggle("is-current", current);
      b.setAttribute("aria-pressed", String(current));
    });
    renderIndex();
    webtoonMedia.releaseView();
    page.replaceChildren();
    scroll.scrollTop = 0;
    if (tab === "world") {
      const item = greenstoaLore.articles[selected];
      page.append(paragraph(item.tag, "archive-kicker"), heading(item.title));
      item.body.forEach((text) => page.append(paragraph(text)));
      const art = canvas(768, 342);
      art.className = "archive-world-art";
      greenstoaLore.paintChapter(art, item.chapter);
      page.append(art);
    } else if (tab === "people") {
      const person = greenstoaLore.people[selected];
      const portrait = document.createElement("figure");
      portrait.className = "archive-person-photo";
      function fallbackPortrait() {
        const art = canvas(640, 560);
        art.className = "archive-person";
        art.setAttribute("role", "img");
        art.setAttribute("aria-label", person.name + "의 상반신 초상화");
        state.drawPortrait(art, person.id);
        portrait.replaceChildren(art);
      }
      if (person.portraitSrc) {
        const photo = new Image();
        photo.className = "archive-person-image";
        photo.alt = person.name + "의 인물 사진";
        photo.decoding = "async";
        photo.addEventListener("load", updateScrollCue);
        photo.addEventListener("error", () => { fallbackPortrait(); updateScrollCue(); }, {once:true});
        photo.src = person.portraitSrc;
        portrait.append(photo);
      } else fallbackPortrait();
      const copy = document.createElement("div");
      copy.className = "archive-person-copy";
      const tags = document.createElement("ul");
      tags.className = "archive-person-tags";
      tags.setAttribute("aria-label", "인물 특징");
      (person.tags || []).forEach(text => {
        const tag = document.createElement("li");
        tag.textContent = "#" + text.replace(/^#+/, "").replace(/\s+/g, "_");
        tags.append(tag);
      });
      const biography = document.createElement("section");
      biography.className = "archive-person-biography";
      biography.setAttribute("aria-label", "자세한 설명");
      (Array.isArray(person.body) ? person.body : [person.body]).forEach(text => biography.append(paragraph(text)));
      copy.append(
        paragraph(person.role, "archive-kicker archive-person-role"),
        heading(person.id === "hero" ? state.playerName : person.name),
        tags,
        biography,
      );
      page.append(portrait, copy);
    } else {
      // 프롤로그를 웹툰으로 다시 복기하세요
      page.append(paragraph("프롤로그를 웹툰으로 다시 복기하세요", "archive-comic-note"));
      const strip = document.createElement("div");
      strip.className = "archive-comic";
      webtoonMedia.pages.forEach(({number}) => strip.append(webtoonMedia.image(number)));
      page.append(strip);
      webtoonMedia.mount(strip,scroll);
    }
    document.querySelector("#archive-page-count").textContent =
      String(selected + 1).padStart(2, "0") +
      " / " +
      String(counts[tab]()).padStart(2, "0");
    updateScrollCue();
  }
  function changeTab(next) {
    tab = next;
    selected = 0;
    gameAudio.sfx("select");
    render();
  }
  function show(options) {
    state = options;
    tab = options.tab || "world";
    selected = 0;
    inputAfter = performance.now() + 180;
    root.hidden = false;
    render();
    tabs
      .find((b) => b.dataset.archiveTab === tab)
      .focus({ preventScroll: true });
  }
  function hide() {
    state = null;
    root.hidden = true;
    webtoonMedia.releaseView();
    page.replaceChildren();
    list.replaceChildren();
    updateScrollCue();
  }
  function close(immediate = false) {
    if (!state || (!immediate && performance.now() < inputAfter)) return;
    const after = state.close;
    hide();
    after();
  }
  function handle(code, repeat = false, shift = false) {
    if (!state) return false;
    if (code === "Tab") {
      const focusable = [
        ...root.querySelectorAll("button:not([disabled]),[tabindex='0']"),
        document.querySelector("#game-sound-toggle"),
      ].filter((e) => e.getClientRects().length);
      const index = focusable.indexOf(document.activeElement),
        next = (index + (shift ? -1 : 1) + focusable.length) % focusable.length;
      focusable[next].focus({ preventScroll: true });
      return true;
    }
    if (["Escape", "KeyC"].includes(code)) {
      if (!repeat) close();
      return true;
    }
    if (["PageDown", "PageUp", "Home", "End"].includes(code)) {
      if (code === "Home") scroll.scrollTop = 0;
      else if (code === "End") scroll.scrollTop = scroll.scrollHeight;
      else scrollPage((code === "PageUp" ? -1 : 1) * scroll.clientHeight * 0.75);
      updateScrollCue();
      return true;
    }
    if (["KeyA", "ArrowLeft", "KeyD", "ArrowRight"].includes(code)) {
      if (!repeat) {
        const names = ["world", "people", "comic"],
          delta = ["KeyA", "ArrowLeft"].includes(code) ? -1 : 1;
        changeTab(names[(names.indexOf(tab) + delta + 3) % 3]);
      }
      return true;
    }
    if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(code)) {
      const delta = ["KeyW", "ArrowUp"].includes(code) ? -1 : 1;
      if (tab === "comic" || document.activeElement === scroll || document.activeElement === scrollMore) scrollPage(delta * 100);
      else if (!repeat)
        choose((selected + delta + counts[tab]()) % counts[tab](), true);
      return true;
    }
    return false;
  }
  tabs.forEach((b) =>
    b.addEventListener("click", () => changeTab(b.dataset.archiveTab)),
  );
  document.querySelector("#archive-close").addEventListener("click", () => close(true));
  scroll.addEventListener("scroll", updateScrollCue, {passive:true});
  scrollMore.addEventListener("click", () => scrollPage(Math.max(120,scroll.clientHeight * 0.65), true));
  const resizeObserver = new ResizeObserver(updateScrollCue);
  resizeObserver.observe(scroll);
  resizeObserver.observe(page);
  return {
    show,
    hide,
    handle,
    close,
    get active() {
      return Boolean(state);
    },
    get tab() {
      return tab;
    },
  };
})();
