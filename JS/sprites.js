// The field atlas preserves the character models at roughly 3–3.5 heads tall.
// Sources are cropped at their transparent margins, never stretched to a square.
const fieldSprites = (() => {
  const width = 56,
    height = 80,
    anchorY = 76;
  const cast = {
    hero: { sheet: "hero", row: 0, height: 72 },
    lucy: { sheet: "leads", row: 0, height: 70 },
    scout: { sheet: "kania", row: 0, height: 74 },
    rogue: { sheet: "leads", row: 2, height: 72 },
    leon: { sheet: "leads", row: 3, height: 72 },
    bran: { sheet: "guild", row: 0, height: 72 },
    mia: { sheet: "guild", row: 1, height: 70 },
    nara: { sheet: "guild", row: 2, height: 72 },
    tobin: { sheet: "guild", row: 3, height: 60 },
    rose: { sheet: "field", row: 0, height: 70 },
    rael: { sheet: "field", row: 1, height: 70 },
    edan: { sheet: "field", row: 2, height: 72 },
    sena: { sheet: "field", row: 3, height: 70 },
  };
  const directions = ["down", "left", "right", "up"];
  const outlines = new Map();
  const cache = new Map(),
    bases = new Map();
  let sheets = {};
  function analyse(image, rowCount = 4) {
    const c = document.createElement("canvas");
    c.width = image.naturalWidth;
    c.height = image.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
    const counts = new Uint32Array(c.height);
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (pixels[(y * c.width + x) * 4 + 3] > 160) counts[y]++;
    const edges = [0];
    // Generated sheets can leave unequal blank gutters between rows.
    // Split on the clear gap nearest each nominal quarter, keeping boot tips.
    for (let row = 1; row < rowCount; row++) {
      const nominal = Math.round((c.height * row) / rowCount),
        radius = Math.floor((c.height / rowCount) * 0.16);
      let best = nominal,
        bestScore = Infinity;
      for (let y = nominal - radius; y <= nominal + radius; y++) {
        const score = counts[y] * 1000 + Math.abs(y - nominal);
        if (score < bestScore) {
          best = y;
          bestScore = score;
        }
      }
      edges.push(best);
    }
    edges.push(c.height);
    const cells = [];
    for (let row = 0; row < rowCount; row++) {
      const columns = new Uint32Array(c.width);
      for (let y = edges[row]; y < edges[row + 1]; y++)
        for (let x = 0; x < c.width; x++)
          if (pixels[(y * c.width + x) * 4 + 3] > 160) columns[x]++;
      const groups = [];
      for (let x = 0; x < c.width; x++) {
        if (!columns[x]) continue;
        const last = groups.at(-1);
        if (last && x - last.end < 24) last.end = x;
        else groups.push({ start: x, end: x });
      }
      while (groups.length > 4) {
        let index = 0,
          gap = Infinity;
        for (let i = 0; i < groups.length - 1; i++)
          if (groups[i + 1].start - groups[i].end < gap) {
            index = i;
            gap = groups[i + 1].start - groups[i].end;
          }
        groups[index].end = groups[index + 1].end;
        groups.splice(index + 1, 1);
      }
      if (groups.length !== 4)
        throw Error("The field atlas must have four separate poses per row.");
      for (let column = 0; column < 4; column++) {
        const x0 = groups[column].start,
          x1 = groups[column].end + 1;
        let left = x1,
          right = x0,
          top = edges[row + 1],
          bottom = edges[row];
        for (let y = edges[row]; y < edges[row + 1]; y++)
          for (let x = x0; x < x1; x++) {
            if (pixels[(y * c.width + x) * 4 + 3] <= 160) continue;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        if (right < left || bottom < top)
          throw Error("The field atlas is missing a pose.");
        let sum = 0,
          count = 0;
        const headBottom = top + Math.round((bottom - top + 1) * 0.31);
        for (let y = top; y < headBottom; y++)
          for (let x = left; x <= right; x++) {
            if (pixels[(y * c.width + x) * 4 + 3] > 160) {
              sum += x;
              count++;
            }
          }
        cells.push({
          x: left,
          y: top,
          w: right - left + 1,
          h: bottom - top + 1,
          centre: count ? sum / count : (left + right) / 2,
        });
      }
    }
    return { image, cells };
  }
  function clean(canvas) {
    const c = canvas.getContext("2d", { willReadFrequently: true });
    const data = c.getImageData(0, 0, width, height);
    for (let i = 3; i < data.data.length; i += 4)
      data.data[i] = data.data[i] < 128 ? 0 : 255;
    c.putImageData(data, 0, 0);
  }
  function prepare(images) {
    for (const id of Object.keys(characterChats)) {
      cast[id] = { ...cast[id], sheet: id, row: 0 };
    }
    cache.clear();
    outlines.clear();
    bases.clear();
    sheets = Object.fromEntries(
      Object.entries(images).map(([name, image]) => [
        name,
        analyse(image, name === "kania" || characterChats[name] ? 1 : 4),
      ]),
    );
    for (const [kind, person] of Object.entries(cast)) {
      const cells =
        person.sheet === "hero"
          ? sheets.hero.cells
          : sheets[person.sheet].cells.slice(
              person.row * 4,
              person.row * 4 + 4,
            );
      person.scale = Math.min(
        person.height / Math.max(...cells.map((c) => c.h)),
        (width - 6) / Math.max(...cells.map((c) => c.w)),
      );
      person.drawnHeight = Math.round(
        Math.max(...cells.map((c) => c.h)) * person.scale,
      );
      for (const direction of directions)
        for (let frame = 0; frame < 4; frame++) make(kind, direction, frame);
    }
  }
  function standing(kind, direction, frame) {
    const person = cast[kind],
      sheet = sheets[person.sheet];
    const index =
      person.sheet === "hero"
        ? directions.indexOf(direction) * 4 + frame
        : person.row * 4 + directions.indexOf(direction);
    const pose = sheet.cells[index];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const w = Math.round(pose.w * person.scale),
      h = Math.round(pose.h * person.scale);
    const centre = (pose.centre - pose.x) * person.scale;
    const x = Math.max(
      2,
      Math.min(width - 2 - w, Math.round(width / 2 - centre)),
    );
    c.drawImage(
      sheet.image,
      pose.x,
      pose.y,
      pose.w,
      pose.h,
      x,
      anchorY - h,
      w,
      h,
    );
    clean(canvas);
    return canvas;
  }
  function make(kind, direction = "down", frame = 0) {
    const key = kind + ":" + direction + ":" + frame;
    if (cache.has(key)) return cache.get(key);
    const person = cast[kind];
    if (!sheets[person.sheet])
      throw Error("Field character art has not loaded yet.");
    let image;
    if (kind === "hero" || frame === 0)
      image = standing(kind, direction, frame);
    else {
      const baseKey = kind + ":" + direction;
      if (!bases.has(baseKey)) bases.set(baseKey, standing(kind, direction, 0));
      const base = bases.get(baseKey);
      image = document.createElement("canvas");
      image.width = width;
      image.height = height;
      const c = image.getContext("2d");
      c.imageSmoothingEnabled = false;
      const knee = Math.round(anchorY - person.drawnHeight * 0.27),
        half = width / 2;
      c.drawImage(base, 0, 0);
      c.clearRect(0, knee, width, height - knee);
      const stride = frame === 1 ? -1 : frame === 3 ? 1 : 0;
      c.drawImage(
        base,
        0,
        knee,
        half,
        height - knee,
        frame === 2 ? -1 : stride,
        knee + (stride < 0 ? -1 : 0),
        half,
        height - knee,
      );
      c.drawImage(
        base,
        half,
        knee,
        half,
        height - knee,
        half + (frame === 2 ? 1 : stride),
        knee + (stride > 0 ? -1 : 0),
        half,
        height - knee,
      );
    }
    cache.set(key, image);
    return image;
  }
  function outline(kind, direction = "down", frame = 0) {
    const key = kind + direction + frame;
    if (outlines.has(key)) return outlines.get(key);
    const source = make(kind, direction, frame),
      mask = document.createElement("canvas");
    mask.width = width;
    mask.height = height;
    const m = mask.getContext("2d");
    m.drawImage(source, 0, 0);
    m.globalCompositeOperation = "source-in";
    m.fillStyle = "#ffffff";
    m.fillRect(0, 0, width, height);
    const edge = document.createElement("canvas");
    edge.width = width;
    edge.height = height;
    const c = edge.getContext("2d");
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].forEach(([x, y]) => c.drawImage(mask, x, y));
    c.globalCompositeOperation = "destination-out";
    c.drawImage(source, 0, 0);
    outlines.set(key, edge);
    return edge;
  }
  function badge() {
    const canvas = document.createElement("canvas");
    canvas.width = 44;
    canvas.height = 60;
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const scale = 58 / height;
    c.drawImage(
      make("hero", "down", 0),
      (44 - width * scale) / 2,
      0,
      width * scale,
      58,
    );
    return canvas;
  }
  return {
    prepare,
    make,
    outline,
    badge,
    width,
    height,
    anchorY,
    bodyHeight: (kind) => cast[kind].drawnHeight,
  };
})();

// Generated animation atlases share a ground anchor and retain one scale across poses.
const pixelAtlases = (() => {
  const cache = new WeakMap();
  function make(image, columns, rows) {
    if (cache.has(image)) return cache.get(image);
    const source = document.createElement('canvas');
    source.width = image.naturalWidth; source.height = image.naturalHeight;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const frames = [];
    for (let i = 0; i < columns * rows; i++) {
      const x = Math.round(i % columns * source.width / columns),
        y = Math.round(Math.floor(i / columns) * source.height / rows),
        w = Math.round((i % columns + 1) * source.width / columns) - x,
        h = Math.round((Math.floor(i / columns) + 1) * source.height / rows) - y,
        pixels = ctx.getImageData(x, y, w, h);
      let left = w, right = 0, top = h, bottom = 0;
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const offset = (py * w + px) * 4 + 3;
        pixels.data[offset] = pixels.data[offset] >= 112 ? 255 : 0;
        if (pixels.data[offset]) {
          left = Math.min(left, px); right = Math.max(right, px);
          top = Math.min(top, py); bottom = Math.max(bottom, py);
        }
      }
      // A generated frame may include a disconnected sliver of its neighbour.
      // Remove only small edge-connected components; preserve fine interior bow strings.
      const labels = new Int32Array(w * h), queue = new Int32Array(w * h), components = [];
      let label = 0;
      for (let start = 0; start < labels.length; start++) {
        if (labels[start] || !pixels.data[start * 4 + 3]) continue;
        label++; let read = 0, write = 1, edge = false; queue[0] = start; labels[start] = label;
        while (read < write) {
          const pos = queue[read++], px = pos % w, py = Math.floor(pos / w);
          if (px < 2 || px > w - 3 || py < 2 || py > h - 3) edge = true;
          const neighbours = [px ? pos - 1 : -1, px < w - 1 ? pos + 1 : -1, py ? pos - w : -1, py < h - 1 ? pos + w : -1];
          for (const n of neighbours) if (n >= 0 && !labels[n] && pixels.data[n * 4 + 3]) { labels[n] = label; queue[write++] = n; }
        }
        components.push({ label, size: write, edge });
      }
      const largest = Math.max(...components.map(part => part.size)), remove = new Set(components.filter(part => part.edge && part.size < largest * .3).map(part => part.label));
      left = w; right = 0; top = h; bottom = 0;
      for (let pos = 0; pos < labels.length; pos++) {
        if (remove.has(labels[pos])) pixels.data[pos * 4 + 3] = 0;
        if (pixels.data[pos * 4 + 3]) {
          const px = pos % w, py = Math.floor(pos / w);
          left = Math.min(left, px); right = Math.max(right, px);
          top = Math.min(top, py); bottom = Math.max(bottom, py);
        }
      }
      const art = document.createElement('canvas'); art.width = w; art.height = h;
      art.getContext('2d').putImageData(pixels, 0, 0);
      let sum = 0, count = 0;
      for (let py = Math.round(bottom - (bottom - top) * .18); py <= bottom; py++)
        for (let px = left; px <= right; px++) if (pixels.data[(py * w + px) * 4 + 3]) { sum += px; count++; }
      frames.push({ art, anchor: count ? sum / count : w / 2, bottom, height: bottom - top + 1 });
    }
    const sheet = { frames, height: Math.max(...frames.map(f => f.height)) };
    cache.set(image, sheet); return sheet;
  }
  function draw(ctx, sheet, frame, x, ground, height, opacity = 1) {
    if (!sheet) return;
    const f = sheet.frames[frame % sheet.frames.length], scale = height / sheet.height;
    ctx.save(); ctx.globalAlpha *= opacity;
    ctx.drawImage(f.art, Math.round(x - f.anchor * scale), Math.round(ground - f.bottom * scale), f.art.width * scale, f.art.height * scale);
    ctx.restore();
  }
  return { make, draw };
})();
