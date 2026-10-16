// Every carried object has its own specimen; enlargement preserves its pixel grid.
const itemSpecimens = (() => {
  const cache = new WeakMap(), W = 480, H = 300;
  const catalogue = {
    credentials: { frame: 0, ink: '#829bbf', mark: 'GUILD · I', details: [
      ['길드 문장', '푸른 바탕 위에 작은 금빛 문장이 박혀 있다.', .51, .48],
      ['푸른 리본', '접힌 증명서를 푸른 리본이 단단하게 묶고 있다.', .53, .77],
      ['접힌 양피지', '여러 번 펼쳐 본 종이에 옅은 접힌 자국이 남아 있다.', .22, .33],
    ] },
    bread: { frame: 1, ink: '#c69861', mark: 'PROVISIONS · II', details: [
      ['빵 껍질', '잘 구워진 껍질 사이로 밝은 속살이 드러난다.', .55, .32],
      ['여행용 천', '빵을 감싼 작은 천에 푸른 실밥이 보인다.', .35, .78],
      ['작은 부스러기', '천 가장자리에 바삭한 빵 부스러기가 남아 있다.', .14, .82],
    ] },
    tonic: { frame: 2, ink: '#bc777b', mark: 'APOTHECARY · III', details: [
      ['붉은 약액', '유리 너머의 붉은 약액이 짙은 보석빛을 띤다.', .49, .72],
      ['유리 약병', '둥근 유리 표면에 가느다란 빛이 맺힌다.', .25, .56],
      ['코르크 마개', '약이 새지 않도록 마개를 깊이 눌러 끼웠다.', .45, .14],
    ] },
    bandage: { frame: 3, ink: '#c9bf9c', mark: 'FIELD KIT · IV', details: [
      ['리넨 결', '깨끗한 리넨에 촘촘한 천의 결이 보인다.', .38, .43],
      ['둥글게 만 천', '가방 안에서 풀리지 않도록 단정하게 말아 두었다.', .36, .18],
      ['풀린 끝자락', '필요한 만큼 끊어 쓰기 좋게 끝이 조금 나와 있다.', .76, .76],
    ] },
    riverLeaf: { frame: 4, ink: '#9bbca5', mark: 'RIVERBANK · V', details: [
      ['이슬방울', '맑은 이슬방울에 주변의 빛이 작게 비친다.', .43, .63],
      ['은빛 잎맥', '가느다란 잎맥을 따라 은은한 빛이 번진다.', .62, .40],
      ['굽은 잎자루', '길고 가느다란 잎자루가 부드럽게 휘어 있다.', .10, .90],
    ] },
    dispatch: { frame: 5, ink: '#c48673', mark: 'ROYAL DISPATCH · VI', details: [
      ['기사단 인장', '붉은 밀랍에 기사단의 문장이 깊이 새겨져 있다.', .56, .65],
      ['왕국 문장', '의뢰서 맨 위에 제르디아의 문장이 찍혀 있다.', .49, .16],
      ['공식 문서', '닳은 모서리 안쪽으로 조사 의뢰가 적혀 있다.', .28, .40],
    ] },
    libraryLetter: { frame: 6, ink: '#81ab99', mark: 'GREENSTOA · VII', details: [
      ['나무의 인장', '깊은 초록빛 밀랍 위에 금빛 나무가 새겨져 있다.', .53, .49],
      ['편지의 매듭', '가는 끈이 접힌 편지를 가로질러 묶고 있다.', .77, .46],
      ['접힌 모서리', '여행 끝에 도착한 편지. 종이 끝이 살짝 들려 있다.', .29, .27],
    ] },
    map: { frame: 7, ink: '#b5a77a', mark: 'CARTOGRAPHY · VIII', details: [
      ['흐르는 강', '작은 숲과 산맥 사이로 푸른 강줄기가 이어진다.', .51, .55],
      ['목적지 표시', '여행의 목적지를 붉은 표시로 남겨 두었다.', .79, .60],
      ['나침반', '낡은 종이 위의 작은 나침반이 방향을 가리킨다.', .17, .76],
    ] },
  };
  let sheet = null, state = null;
  function prepare(image) {
    if (!image?.naturalWidth) return null;
    if (cache.has(image)) { sheet = cache.get(image); return sheet; }
    const atlas = pixelAtlases.make(image, 4, 2);
    sheet = atlas.frames.map(frame => {
      const ctx = frame.art.getContext('2d', { willReadFrequently: true }),
        { width, height } = frame.art, pixels = ctx.getImageData(0, 0, width, height).data;
      let left = width, top = height, right = 0, bottom = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++)
        if (pixels[(y * width + x) * 4 + 3]) {
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
      const sw = Math.max(1, right - left + 1), sh = Math.max(1, bottom - top + 1),
        scale = Math.min(1, 224 / Math.max(sw, sh)), art = document.createElement('canvas');
      art.width = Math.max(1, Math.round(sw * scale)); art.height = Math.max(1, Math.round(sh * scale));
      const target = art.getContext('2d'); target.imageSmoothingEnabled = false;
      target.drawImage(frame.art, left, top, sw, sh, 0, 0, art.width, art.height);
      return art;
    });
    cache.set(image, sheet); return sheet;
  }
  function clampPan() {
    if (!state) return;
    const maxX = Math.max(0, (state.baseWidth * state.zoom - W + 64) / 2),
      maxY = Math.max(0, (state.baseHeight * state.zoom - H + 48) / 2);
    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));
  }
  function bounds() {
    const width = state.baseWidth * state.zoom, height = state.baseHeight * state.zoom;
    return { width, height, x: Math.round((W - width) / 2 + state.x), y: Math.round((H - height) / 2 + state.y) };
  }
  function draw() {
    if (!state) return;
    const { canvas, art, entry } = state, ctx = canvas.getContext('2d'), b = bounds();
    ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    // Light drafting marks keep the object readable without a checkerboard transparency grid.
    ctx.strokeStyle = '#c4b38113'; ctx.lineWidth = 1;
    for (let x = 24; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x + .5, 16); ctx.lineTo(x + .5, H - 16); ctx.stroke(); }
    for (let y = 18; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(16, y + .5); ctx.lineTo(W - 16, y + .5); ctx.stroke(); }
    ctx.fillStyle = '#d8c79845';
    for (const [x, y, dx, dy] of [[12, 12, 1, 1], [W - 12, 12, -1, 1], [12, H - 12, 1, -1], [W - 12, H - 12, -1, -1]]) {
      ctx.fillRect(Math.min(x, x + dx * 15), y, 16, 2);
      ctx.fillRect(x, Math.min(y, y + dy * 15), 2, 16);
    }
    ctx.save(); ctx.shadowColor = '#0009'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 9;
    ctx.drawImage(art, b.x, b.y, b.width, b.height); ctx.restore();
    if (state.detail >= 0) {
      const detail = entry.details[state.detail], x = Math.round(b.x + detail[2] * b.width),
        y = Math.round(b.y + detail[3] * b.height);
      ctx.fillStyle = '#141d23d9'; ctx.fillRect(x - 6, y - 6, 13, 13);
      ctx.fillStyle = '#f0d894';
      ctx.fillRect(x - 8, y - 1, 5, 2); ctx.fillRect(x + 4, y - 1, 5, 2);
      ctx.fillRect(x - 1, y - 8, 2, 5); ctx.fillRect(x - 1, y + 4, 2, 5);
    }
    state.readout.textContent = `${Math.round(state.zoom * 100)}%`;
    state.container.dataset.zoom = String(Math.round(state.zoom * 100));
    state.minus.disabled = state.zoom <= 1; state.plus.disabled = state.zoom >= 2.5;
    state.canvas.style.cursor = state.zoom > 1 ? (state.drag ? 'grabbing' : 'grab') : 'zoom-in';
  }
  function zoom(amount) {
    if (!state) return;
    state.zoom = Math.max(1, Math.min(2.5, Math.round((state.zoom + amount) * 100) / 100));
    clampPan(); draw();
  }
  function reset() {
    if (!state) return;
    state.zoom = 1; state.x = state.y = 0; state.detail = -1;
    state.details.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', 'false'));
    state.note.textContent = '그림을 확대해 물건의 결을 살펴보세요.'; draw();
  }
  function selectDetail(index) {
    if (!state) return;
    const detail = state.entry.details[index];
    state.detail = index; state.zoom = Math.max(1.5, state.zoom);
    state.x = (.5 - detail[2]) * state.baseWidth * state.zoom;
    state.y = (.5 - detail[3]) * state.baseHeight * state.zoom;
    clampPan();
    state.details.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    state.note.textContent = detail[1]; draw();
  }
  function button(label, name, action) {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = label; element.setAttribute('aria-label', name);
    element.addEventListener('click', action); return element;
  }
  function show(item, options = {}) {
    hide();
    const container = options.container || document.querySelector('#item-inspection-visual'),
      entry = catalogue[item.id];
    if (!container || !entry || !sheet) { if (container) container.hidden = true; return false; }
    container.hidden = false; container.replaceChildren(); container.dataset.specimen = item.id;
    const header = document.createElement('div'), label = document.createElement('span'), mark = document.createElement('span');
    header.className = 'item-specimen-heading'; label.textContent = '물건 자세히 보기'; mark.textContent = entry.mark;
    header.append(label, mark);
    const viewport = document.createElement('div'), canvas = document.createElement('canvas');
    viewport.className = 'item-specimen-viewport'; canvas.width = W; canvas.height = H;
    canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${item.name} 확대 그림. 더하기와 빼기로 확대하고, 확대한 뒤 방향키 또는 끌기로 이동합니다. 0으로 원래 크기로 돌아갑니다.`);
    viewport.append(canvas);
    const controls = document.createElement('div'), readout = document.createElement('output'),
      minus = button('−', '물건 축소', () => zoom(-.25)), plus = button('+', '물건 확대', () => zoom(.25)),
      restore = button('원래 크기', '원래 크기와 위치로 복원', reset), hint = document.createElement('span');
    controls.className = 'item-specimen-controls'; readout.setAttribute('aria-label', '확대 배율');
    hint.textContent = '확대 후 끌어 보기'; controls.append(minus, readout, plus, restore, hint);
    const details = document.createElement('div'), note = document.createElement('p');
    details.className = 'item-specimen-details'; details.setAttribute('aria-label', '물건의 세부 모습');
    entry.details.forEach((detail, i) => {
      const tab = button(detail[0], `${detail[0]} 자세히 보기`, () => selectDetail(i));
      tab.setAttribute('aria-pressed', 'false'); details.append(tab);
    });
    note.className = 'item-specimen-note'; note.setAttribute('aria-live', 'polite');
    note.textContent = '그림을 확대해 물건의 결을 살펴보세요.';
    container.append(header, viewport, controls, details, note);
    const art = sheet[entry.frame], scale = Math.min((W - 68) / art.width, (H - 44) / art.height);
    state = { container, canvas, entry, art, details, note, readout, minus, plus, zoom: 1,
      x: 0, y: 0, detail: -1, baseWidth: Math.round(art.width * scale), baseHeight: Math.round(art.height * scale), drag: null };
    container.style.setProperty('--specimen-ink', entry.ink);
    canvas.addEventListener('pointerdown', event => {
      if (!state || event.button > 0) return;
      canvas.focus({ preventScroll: true });
      state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: state.x, startY: state.y, moved: false };
      canvas.setPointerCapture(event.pointerId); draw();
    });
    canvas.addEventListener('pointermove', event => {
      if (!state?.drag || state.drag.id !== event.pointerId) return;
      const rect = canvas.getBoundingClientRect(), dx = event.clientX - state.drag.x, dy = event.clientY - state.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) state.drag.moved = true;
      const pointerScale = Math.max(W / rect.width, H / rect.height);
      state.x = state.drag.startX + dx * pointerScale;
      state.y = state.drag.startY + dy * pointerScale; clampPan(); draw();
    });
    const release = event => {
      if (!state?.drag || state.drag.id !== event.pointerId) return;
      const click = !state.drag.moved && event.type === 'pointerup'; state.drag = null;
      if (click) zoom(state.zoom === 1 ? .5 : -.5); else draw();
    };
    canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', event => { if (state?.drag?.id === event.pointerId) { state.drag = null; draw(); } });
    // Capture only viewer keys; the parent keeps its close and focus-trap shortcuts.
    container.onkeydown = event => {
      if (handle(event.code, event)) { event.preventDefault(); event.stopPropagation(); }
    };
    draw(); return true;
  }
  function handle(code, event = {}) {
    if (!state || !state.container.contains(document.activeElement)) return false;
    if (['Equal', 'NumpadAdd'].includes(code)) { zoom(.25); return true; }
    if (['Minus', 'NumpadSubtract'].includes(code)) { zoom(-.25); return true; }
    if (['Digit0', 'Numpad0'].includes(code)) { reset(); return true; }
    if (document.activeElement === state.canvas && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) {
      const step = event.shiftKey ? 36 : 18;
      if (code === 'ArrowLeft') state.x += step;
      if (code === 'ArrowRight') state.x -= step;
      if (code === 'ArrowUp') state.y += step;
      if (code === 'ArrowDown') state.y -= step;
      clampPan(); draw(); return true;
    }
    return false;
  }
  function hide() { if (state) { state.drag = null; state = null; } }
  return { prepare, show, hide, handle };
})();
