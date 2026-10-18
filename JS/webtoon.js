// Download the original strips after the game artwork, without gating the title.
// Keep encoded animation data cached; only nearby panels need decoded frames.
const webtoonMedia = (() => {
  const holder = document.querySelector("#webtoon-assets");
  const pages = [
    [1,1080,2044], [2,1080,8306], [3,1080,5713],
    [4,1080,5213], [5,1080,4305], [6,1080,5376],
    [7,1080,3939], [8,1080,3167], [10,826,1905],
  ].map(([number,width,height]) => Object.freeze({number,width,height,source:holder.dataset["web"+number+"Src"]}));
  const entries = new Map(pages.map(page => [page.number,{...page,status:"queued",url:null,image:null,wanted:false}]));
  const firstPages = new Set([1,2]), warmed = new Set();
  const local = location.protocol === "file:";
  const concurrency = local || matchMedia("(pointer: coarse)").matches || navigator.connection?.saveData ? 1 : 2;
  let task = null, observer = null, startedAt = null, completedAt = null,
    active = 0, peakActive = 0, loaded = 0, failed = 0, cachedBytes = 0;
  const idle = () => new Promise(resolve => {
    if (window.requestIdleCallback) requestIdleCallback(resolve,{timeout:500});
    else setTimeout(resolve,0);
  });
  function attach(entry) {
    if (!entry.image || !entry.url || (!firstPages.has(entry.number) && !entry.wanted)) return;
    if (entry.image.getAttribute("src") !== entry.url) entry.image.src = entry.url;
  }
  function imageFor(entry) {
    if (!entry.image) {
      const image = new Image();
      image.alt = "프롤로그 웹툰 " + entry.number;
      image.dataset.page = String(entry.number);
      image.dataset.source = entry.source;
      image.width = entry.width;
      image.height = entry.height;
      image.decoding = "async";
      image.style.maxWidth = entry.width + "px";
      image.style.aspectRatio = entry.width + " / " + entry.height;
      entry.image = image;
    }
    attach(entry);
    return entry.image;
  }
  async function warm(entry) {
    await idle();
    const image = imageFor(entry);
    try { await image.decode(); warmed.add(entry.number); } catch {}
  }
  async function load(entry,warmJobs) {
    entry.status = "loading";
    active++; peakActive = Math.max(peakActive,active);
    try {
      if (local) {
        // file:// fetch is blocked by browsers; image loading still works offline.
        entry.url = entry.source;
        if (firstPages.has(entry.number)) {
          await imageFor(entry).decode(); warmed.add(entry.number);
        } else {
          const probe = new Image(); probe.decoding = "async"; probe.src = entry.source;
          await probe.decode(); probe.removeAttribute("src"); attach(entry);
        }
      } else {
        const response = await fetch(entry.source,{priority:"low",cache:"default",signal:AbortSignal.timeout(90000)});
        if (!response.ok) throw new Error("Webtoon HTTP " + response.status);
        const blob = await response.blob();
        cachedBytes += blob.size;
        entry.url = URL.createObjectURL(blob);
        attach(entry);
        if (firstPages.has(entry.number)) warmJobs.push(warm(entry));
      }
      entry.status = "ready"; loaded++;
    } catch {
      entry.status = "error"; failed++;
      // A transient preload failure must not prevent opening the book later.
      entry.url = entry.source;
      attach(entry);
    } finally { active--; }
  }
  function status() {
    return {started:startedAt!==null,startedAt,completedAt,total:pages.length,loaded,failed,
      active,peakActive,concurrency,cachedBytes,warmed:[...warmed],
      activeImages:[...entries.values()].filter(e=>e.image?.hasAttribute("src")).length};
  }
  function preload() {
    if (task) return task;
    startedAt = performance.now();
    performance.mark("webtoon-prefetch-start");
    const queue = [...entries.values()], warmJobs = [];
    const worker = async () => { while (queue.length) await load(queue.shift(),warmJobs); };
    task = Promise.all(Array.from({length:concurrency},worker)).then(async () => {
      await Promise.all(warmJobs);
      completedAt = performance.now();
      performance.mark("webtoon-prefetch-ready");
      return status();
    });
    return task;
  }
  function releaseView() {
    observer?.disconnect(); observer = null;
    for (const entry of entries.values()) if (!firstPages.has(entry.number)) {
      entry.wanted = false;
      entry.image?.removeAttribute("src");
      entry.image = null;
    }
  }
  function mount(strip,scroll) {
    preload();
    if (!window.IntersectionObserver) {
      for (const entry of entries.values()) { entry.wanted=true; attach(entry); }
      return;
    }
    observer = new IntersectionObserver(changes => {
      for (const change of changes) {
        const entry = entries.get(Number(change.target.dataset.page));
        entry.wanted = change.isIntersecting;
        if (entry.wanted) attach(entry);
        else if (!firstPages.has(entry.number)) entry.image?.removeAttribute("src");
      }
    },{root:scroll,rootMargin:"800px 0px"});
    for (const image of strip.children) observer.observe(image);
  }
  return {pages:Object.freeze(pages),preload,getStatus:status,releaseView,mount,
    image(number) { preload(); return imageFor(entries.get(number)); }};
})();
