// Reading stays in the library; closing a book restores the same field position.
const libraryArchive = (() => {
  const root = document.querySelector("#library-reader"),
    list = document.querySelector("#archive-index"),
    page = document.querySelector("#archive-page"),
    scroll = document.querySelector("#archive-scroll"),
    tabs = [...document.querySelectorAll("[data-archive-tab]")];
  let state = null,
    tab = "world",
    selected = 0,
    inputAfter = 0;
  const counts = {
    world: () => greenstoaLore.articles.length,
    people: () => greenstoaLore.people.length,
    comic: () => greenstoaLore.scenes.length,
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
    const entries =
      tab === "world"
        ? greenstoaLore.articles
        : tab === "people"
          ? greenstoaLore.people
          : greenstoaLore.scenes;
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
    page.replaceChildren();
    scroll.scrollTop = 0;
    if (tab === "world") {
      const item = greenstoaLore.articles[selected];
      page.append(paragraph(item.tag, "archive-kicker"), heading(item.title));
      item.body.forEach((text) => page.append(paragraph(text)));
      const art = canvas(768, 342);
      art.className = "archive-world-art";
      greenstoaLore.paintChapter(art, [0, 2, 7, 5, 6, 8][selected]);
      page.append(art);
    } else if (tab === "people") {
      const person = greenstoaLore.people[selected],
        art = canvas(640, 560);
      art.className = "archive-person";
      art.setAttribute("aria-label", person.name + "의 상반신 초상화");
      state.drawPortrait(art, person.id);
      const copy = document.createElement("div");
      copy.className = "archive-person-copy";
      copy.append(
        paragraph(person.role, "archive-kicker"),
        heading(person.id === "hero" ? state.playerName : person.name),
        paragraph(person.summary, "archive-summary"),
        paragraph(person.body),
      );
      page.append(art, copy);
    } else {
      const chapter = greenstoaLore.scenes[selected];
      page.append(
        paragraph(
          "제루스의 기록 · " + String(selected + 1).padStart(2, "0") + " / 09",
          "archive-kicker",
        ),
        heading(chapter.title),
      );
      const strip = document.createElement("div");
      strip.className = "archive-comic";
      // Read the whole illustrated chronicle as a continuous vertical scroll.
      greenstoaLore.scenes.forEach((scene, index) => {
        const figure = document.createElement("figure");
        figure.id = "archive-chapter-" + index;
        const art = canvas(768, 342);
        greenstoaLore.paintChapter(art, index);
        const caption = document.createElement("figcaption");
        caption.append(
          paragraph(
            String(index + 1).padStart(2, "0") + " · " + scene.title,
            "comic-chapter-name",
          ),
          paragraph(scene.text),
        );
        figure.append(art, caption);
        strip.append(figure);
      });
      page.append(strip);
      if (selected)
        requestAnimationFrame(() => {
          if (!state || tab !== "comic") return;
          const chapter = document.querySelector(
            "#archive-chapter-" + selected,
          );
          scroll.scrollTop = chapter.offsetTop - page.offsetTop - 12;
        });
    }
    document.querySelector("#archive-page-count").textContent =
      String(selected + 1).padStart(2, "0") +
      " / " +
      String(counts[tab]()).padStart(2, "0");
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
    page.replaceChildren();
    list.replaceChildren();
  }
  function close() {
    if (!state || performance.now() < inputAfter) return;
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
      if (tab === "comic") scroll.scrollTop += delta * 100;
      else if (!repeat)
        choose((selected + delta + counts[tab]()) % counts[tab](), true);
      return true;
    }
    return false;
  }
  tabs.forEach((b) =>
    b.addEventListener("click", () => changeTab(b.dataset.archiveTab)),
  );
  document.querySelector("#archive-close").addEventListener("click", close);
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
