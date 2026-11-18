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
      page.style.setProperty("--archive-card-max-width", Math.floor(Math.max(96, scroll.clientHeight - 48) * 13 / 7) + "px");
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
  function worldParagraph(text, links = [], emphasis = []) {
    const p = paragraph(text);
    for (const { name, targetId } of links) {
      const targetIndex = greenstoaLore.people.findIndex(person => person.id === targetId);
      if (targetIndex < 0) continue;
      for (const node of [...p.childNodes]) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const offset = node.textContent.indexOf(name);
        if (offset < 0) continue;
        const link = document.createElement("a");
        link.href = "#archive-person-" + targetId;
        link.className = "archive-person-link";
        link.textContent = name;
        link.setAttribute("aria-label", name + " 인물 소개 보기");
        link.addEventListener("click", event => {
          event.preventDefault();
          tab = "people";
          choose(targetIndex, true);
        });
        const text = node.textContent;
        node.replaceWith(document.createTextNode(text.slice(0, offset)), link, document.createTextNode(text.slice(offset + name.length)));
      }
    }
    for (const phrase of emphasis) {
      for (const node of [...p.childNodes]) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const text = node.textContent, offset = text.indexOf(phrase);
        if (offset < 0) continue;
        const strong = document.createElement("strong");
        strong.textContent = phrase;
        node.replaceWith(document.createTextNode(text.slice(0, offset)), strong, document.createTextNode(text.slice(offset + phrase.length)));
      }
    }
    return p;
  }
  function personCards(members) {
    const list = document.createElement("ul");
    list.className = "archive-race-members";
    for (const member of members) {
      const { id, note } = typeof member === "string" ? { id: member } : member;
      const targetIndex = greenstoaLore.people.findIndex(person => person.id === id);
      if (targetIndex < 0) continue;
      const person = greenstoaLore.people[targetIndex];
      const row = document.createElement("li"), link = document.createElement("a");
      link.href = "#archive-person-" + id;
      link.dataset.person = id;
      link.setAttribute("aria-label", person.name + (note ? " · " + note : "") + " 인물 소개 보기");
      link.addEventListener("click", event => {
        event.preventDefault();
        tab = "people";
        choose(targetIndex, true);
      });
      const icon = document.createElement("span");
      icon.className = "archive-race-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.append(personIcon(person));
      const name = document.createElement("span");
      name.className = "archive-race-name";
      name.textContent = person.name;
      link.append(icon, name);
      if (note) {
        const label = document.createElement("small");
        label.textContent = note;
        link.append(label);
      }
      row.append(link);
      list.append(row);
    }
    return list;
  }
  function heading(text) {
    const h = document.createElement("h3");
    h.textContent = text;
    return h;
  }
  function articleImage(illustration, lazy = false) {
    const image = new Image();
    image.className = "archive-world-image";
    image.dataset.illustration = illustration.asset;
    image.alt = illustration.alt;
    image.width = illustration.width || 1216;
    image.height = illustration.height || 448;
    image.decoding = "async";
    image.loading = lazy ? "lazy" : "eager";
    image.addEventListener("load", updateScrollCue);
    image.src = document.querySelector("#archive-illustrations").dataset[illustration.asset + "Src"];
    return image;
  }
  function canvas(width, height) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }
  function personIcon(person) {
    const icon = document.createElement("span");
    icon.className = "archive-person-icon";
    icon.dataset.person = person.id;
    icon.setAttribute("aria-hidden", "true");
    const face = person.reactionAsset && reactionIcon(person);
    if (face) {
      face.querySelector("img").addEventListener("error", () => {
        face.remove();
        icon.classList.add("is-unrevealed");
      }, { once: true });
      icon.append(face);
    } else icon.classList.add("is-unrevealed");
    return icon;
  }
  function reactionIcon(person, emotion = "neutral") {
    const source = document.querySelector("#relationship-reactions").dataset[person.reactionAsset + "Src"];
    if (!source) return null;
    const frames = {neutral:0,annoyed:1,puzzled:2,flustered:3};
    const labels = {neutral:"기본",annoyed:"짜증",puzzled:"의아함",flustered:"당황"};
    const { columns, rows, start } = person.reactionGrid || { columns: 2, rows: 2, start: 0 };
    const frame = start + (frames[emotion] ?? 0), icon = document.createElement("span"), image = new Image();
    icon.className = "archive-relationship-reaction";
    icon.dataset.person = person.id;
    icon.dataset.emotion = emotion;
    icon.dataset.columns = String(columns);
    icon.dataset.rows = String(rows);
    icon.dataset.frame = String(frame);
    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", person.name + ": " + (labels[emotion] || labels.neutral) + " 표정");
    icon.title = icon.getAttribute("aria-label");
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.style.width = columns * 100 + "%";
    image.style.height = rows * 100 + "%";
    image.style.left = -(frame % columns) * 100 + "%";
    image.style.top = -Math.floor(frame / columns) * 100 + "%";
    image.addEventListener("error", () => { icon.hidden = true; }, {once:true});
    image.src = source;
    icon.append(image);
    return icon;
  }
  function choose(index, focus = false) {
    selected = index;
    gameAudio.sfx("paper");
    render();
    if (focus) {
      const button = list.querySelectorAll("button")[index];
      button?.focus({ preventScroll: true });
      button?.scrollIntoView({
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
    let target = list, groupEntries = list, currentGroup = null, currentSubgroup = null;
    entries.forEach((item, index) => {
      const section = tab === "world"
        ? {id:index < 4 ? "background" : "present", title:index < 4 ? "배경 이야기" : "지금 알아야 할 것"}
        : greenstoaLore.peopleGroups.find(group => group.id === item.group);
      if (section && section.id !== currentGroup) {
        currentGroup = section.id;
        const group = document.createElement("section");
        group.className = "archive-index-group";
        group.dataset.group = section.id;
        const label = document.createElement("h4");
        label.textContent = section.title;
        label.id = "archive-" + tab + "-group-" + section.id;
        group.setAttribute("aria-labelledby", label.id);
        target = document.createElement("div");
        target.className = "archive-index-entries";
        groupEntries = target;
        currentSubgroup = null;
        group.append(label, target);
        list.append(group);
      }
      if (tab === "world" && index < 4) {
        const subgroup = index < 2
          ? { id: "setting", title: "세계관" }
          : { id: "history", title: "역사" };
        if (subgroup.id !== currentSubgroup) {
          currentSubgroup = subgroup.id;
          groupEntries.classList.add("has-subgroups");
          const group = document.createElement("section");
          group.className = "archive-index-subgroup";
          group.dataset.subgroup = subgroup.id;
          const label = document.createElement("h5");
          label.textContent = subgroup.title;
          label.id = "archive-world-subgroup-" + subgroup.id;
          group.setAttribute("aria-labelledby", label.id);
          target = document.createElement("div");
          target.className = "archive-index-subentries";
          group.append(label, target);
          groupEntries.append(group);
        }
      }
      const b = document.createElement("button");
      b.type = "button";
      b.textContent =
        (index === selected ? "▸ " : "　") + (item.title || item.name);
      b.className = index === selected ? "is-current" : "";
      if (tab === "people") {
        b.classList.add("archive-person-index");
        b.prepend(personIcon(item));
      }
      b.setAttribute("aria-pressed", String(index === selected));
      b.addEventListener("click", () => choose(index, true));
      target.append(b);
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
      if (item.hero) page.append(articleImage(item.hero));
      page.append(paragraph(item.tag, "archive-kicker"), heading(item.title));
      item.body.forEach((text, index) => {
        if (index === item.dividerBefore) {
          const divider = document.createElement("hr");
          divider.className = "archive-world-divider";
          page.append(divider);
        }
        if (item.bodyImages?.[index]) page.append(articleImage(item.bodyImages[index], true));
        page.append(worldParagraph(text, item.personLinks));
      });
      item.sections?.forEach((section, index) => {
        const block = document.createElement(section.title ? "section" : "div");
        block.className = "archive-world-section";
        if (section.image) block.append(articleImage(section.image, true));
        if (section.title) {
          const label = document.createElement("h4");
          label.id = "archive-world-section-" + index;
          label.textContent = section.title;
          block.setAttribute("aria-labelledby", label.id);
          block.append(label);
        }
        section.body?.forEach(text => block.append(worldParagraph(text, section.personLinks, section.emphasis)));
        if (section.bullets?.length) {
          const points = document.createElement("ul");
          points.className = "archive-world-points";
          section.bullets.forEach(text => {
            const point = document.createElement("li");
            point.textContent = text;
            points.append(point);
          });
          block.append(points);
        }
        if (section.members?.length) block.append(personCards(section.members));
        page.append(block);
      });
      if (!item.hero) {
        const art = canvas(768, 342);
        art.className = "archive-world-art";
        greenstoaLore.paintChapter(art, item.chapter);
        page.append(art);
      }
    } else if (tab === "people") {
      const person = greenstoaLore.people[selected];
      const portrait = document.createElement("figure");
      portrait.className = "archive-person-photo";
      function fallbackPortrait() {
        if (person.portraitKind === "unrevealed" || person.portraitKind === "photo") {
          const unrevealed = person.portraitKind === "unrevealed";
          const placeholder = document.createElement("div");
          placeholder.className = "archive-person-unrevealed";
          placeholder.setAttribute("role", "img");
          placeholder.setAttribute("aria-label", person.name + (unrevealed ? "의 모습은 아직 미공개" : "의 이미지를 불러오지 못했습니다"));
          const mark = document.createElement("span");
          mark.textContent = "?";
          mark.setAttribute("aria-hidden", "true");
          placeholder.append(mark, paragraph(unrevealed ? "미공개" : "이미지 없음"));
          portrait.replaceChildren(placeholder);
          return;
        }
        const art = canvas(640, 560);
        art.className = "archive-person";
        art.setAttribute("role", "img");
        art.setAttribute("aria-label", person.name + "의 상반신 초상화");
        if (person.portraitKind === "title") {
          // Reuse Mareri's already-loaded title sprite without a duplicate image download.
          const source = document.querySelector(".character-sprite"), c = art.getContext("2d");
          const scale = Math.min(art.width / source.width, art.height / source.height);
          c.imageSmoothingEnabled = false;
          c.drawImage(source, (art.width - source.width * scale) / 2, art.height - source.height * scale, source.width * scale, source.height * scale);
        } else if (state) state.drawPortrait(art, person.id);
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
        heading(person.name),
        tags,
        biography,
      );
      if (person.relationships?.length) {
        const relationships = document.createElement("section"), label = document.createElement("h4"), links = document.createElement("ul");
        relationships.className = "archive-person-relationships";
        label.id = "archive-relationships-" + person.id;
        label.textContent = "관계도";
        relationships.setAttribute("aria-labelledby", label.id);
        person.relationships.forEach(({targetId, relation, emotion}) => {
          const targetIndex = greenstoaLore.people.findIndex(target => target.id === targetId);
          if (targetIndex < 0) return;
          const target = greenstoaLore.people[targetIndex], row = document.createElement("li"), name = document.createElement("button"), arrow = document.createElement("span"), detail = document.createElement("span");
          name.type = "button";
          name.dataset.target = target.id;
          name.textContent = target.name;
          name.className = "archive-relationship-target";
          name.prepend(personIcon(target));
          name.setAttribute("aria-label", target.name + " 인물 소개 보기");
          name.addEventListener("click", () => choose(targetIndex, true));
          arrow.textContent = "→";
          arrow.setAttribute("aria-hidden", "true");
          detail.className = "archive-relationship-detail";
          detail.textContent = relation;
          const reaction = reactionIcon(person, emotion);
          if (reaction) detail.append(reaction);
          row.append(name, arrow, detail);
          links.append(row);
        });
        relationships.append(label, links);
        copy.append(relationships);
      }
      page.append(portrait, copy);
    } else {
      // 프롤로그를 웹툰으로 다시 복기하세요
      page.append(paragraph("프롤로그를 웹툰으로 다시 복기하세요", "archive-comic-note"));
      const strip = document.createElement("div");
      strip.className = "archive-comic";
      webtoonMedia.pages.forEach(({number}) => {
        const image = webtoonMedia.image(number);
        if (number === 10) {
          // The final illustration ends at row 1660; the rest is blank paper.
          const ending = document.createElement("div");
          ending.className = "archive-comic-ending";
          ending.append(image);
          strip.append(ending);
        } else strip.append(image);
      });
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
        ...root.querySelectorAll("button:not([disabled]),a[href],[tabindex='0']"),
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
