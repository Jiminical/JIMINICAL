// The field atlas preserves the character models at roughly 3–3.5 heads tall.
// Sources are cropped at their transparent margins, never stretched to a square.
const fieldSprites = (() => {
  const width = 56,
    height = 80,
    anchorY = 76;
  const cast = {
    hero: { sheet: "hero", row: 0, height: 72 },
    lucy: { sheet: "leads", row: 0, height: 70 },
    scout: { sheet: "leads", row: 1, height: 74 },
    rogue: { sheet: "leads", row: 2, height: 72 },
    leon: { sheet: "leads", row: 3, height: 72 },
    bran: { sheet: "guild", row: 0, height: 72 },
    mia: { sheet: "guild", row: 1, height: 70 },
    nara: { sheet: "guild", row: 2, height: 72 },
    tobin: { sheet: "guild", row: 3, height: 60 },
  };
  const directions = ["down", "left", "right", "up"];
  const cache = new Map(),
    bases = new Map();
  let sheets = {};
  function analyse(image) {
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
    for (let row = 1; row < 4; row++) {
      const nominal = Math.round((c.height * row) / 4),
        radius = Math.floor((c.height / 4) * 0.16);
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
    for (let row = 0; row < 4; row++) {
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
    cache.clear();
    bases.clear();
    sheets = Object.fromEntries(
      Object.entries(images).map(([name, image]) => [name, analyse(image)]),
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
    badge,
    width,
    height,
    anchorY,
    bodyHeight: (kind) => cast[kind].drawnHeight,
  };
})();
