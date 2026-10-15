// Field art is authored on a 22 × 30 grid, enlarged exactly twice.
// o: charcoal, h/j: hair, f/s: skin, c/v: cloth, a/g: identifying accents.
const fieldSprites = (() => {
  const palettes = {
    hero: {
      h: "#65778e",
      j: "#43536e",
      c: "#536781",
      v: "#3b4964",
      a: "#b49162",
      g: "#d4bb83",
      n: "#19252e",
    },
    lucy: {
      h: "#c7cc9b",
      j: "#939f7d",
      c: "#eee6cf",
      v: "#b9bcb6",
      a: "#7b608a",
      g: "#b5a078",
      f: "#edc5ae",
      s: "#c58e85",
    },
    bran: {
      h: "#b96f50",
      j: "#894f42",
      c: "#8e715a",
      v: "#655849",
      a: "#aa514c",
      g: "#c4aa77",
      f: "#dbad8c",
      s: "#b78070",
    },
    mia: {
      h: "#947254",
      j: "#6c5746",
      c: "#738365",
      v: "#4f6255",
      a: "#e4d9bd",
      g: "#bca26b",
      f: "#e7bc99",
      s: "#bb8974",
    },
    nara: {
      h: "#e0dfcf",
      j: "#adb7b9",
      c: "#596d84",
      v: "#424f68",
      a: "#8ba6b6",
      g: "#c2b182",
      f: "#e7c7af",
      s: "#c48e91",
    },
    tobin: {
      h: "#b96b48",
      j: "#85503d",
      c: "#697b5f",
      v: "#4e6050",
      a: "#e1d6b9",
      g: "#c7ad6f",
      f: "#d9a383",
      s: "#ad7767",
    },
    leon: {
      h: "#4b526b",
      j: "#393f56",
      c: "#736781",
      v: "#514c67",
      a: "#ded6be",
      g: "#b9a779",
      f: "#e1bca2",
      s: "#bc8d7c",
    },
    rogue: {
      h: "#d9bc6b",
      j: "#ad945c",
      c: "#4c4e56",
      v: "#353d46",
      a: "#a9adb0",
      g: "#c7a778",
      f: "#d9ae8d",
      s: "#ac7f70",
    },
    scout: {
      h: "#c1d6a0",
      j: "#8ea87f",
      c: "#5c806d",
      v: "#3f6057",
      a: "#a48768",
      g: "#c3d1bc",
      f: "#e8c6aa",
      s: "#c19185",
      n: "#69bba4",
    },
  };
  // Rows are separated by /. Profiles and rear heads are drawn separately.
  const heads = {
    hero: {
      down: "......oo/.....ocoo/....ochcoo/...ochhccoo/..ochhccccoo/..ochhnnccco/.ochhnnnnccco/.ochhnnnnncco/.occhnnnnncco/..occnnnncco/..occcnnccco/...occcccco/....ovvvo",
      up: "......oo/.....ocoo/....ochcoo/...ochhccoo/..ochhccccoo/..ochhcccccco/.ochhhccccccco/.ochhcccccccco/.occhcccccccco/..occccccccco/..occccccccco/...occcccco/....ovvvo",
      side: "......oo/.....ocoo/....ochcoo/...ochhccoo/..ochhccccoo/..onnnhccccco/.onnnnhcccccco/.onnnnhcccccco/..onnnccccccco/...onncccccco/....occcccco/.....ovvvo",
    },
    lucy: {
      down: ".....oooooo/...oohhhhhhoo/..ohhhhhhhhhho/.ohhhhjjhhhhhho/.ohhffhhfffhhho/.ohffhfffffhhho/.ohfoofffoofhho/.ohffffffffffho/.ohhffffffffhho/..ohhffffffhho/...ohhsssshhho/....oohhhhooo",
      up: ".....oooooo/...oohhhhhhoo/..ohhhhhhhhhho/.ohhhhhhhhhhhho/.ohhhhhhhhhhhho/.ohhhhhhhhhhjho/.ohhhhhhhhhhjho/.ohhhhhhhhhjjho/.ohhhhhhhhjjhho/..ohhhhhhhjjho/..ohhhhhhhhho/...ohhhhhho",
      side: ".....oooooo/....ohhhhhhoo/...ohhhhhhhhho/..ohhhhhhhhhho/..offhhhhhjjhho/.offfhhhhhhjhho/.offoffhhhhjhho/..offfffhhjjhho/...offfhhhjjho/....offhhhjho/.....oshhhho/......ohhho",
    },
    bran: {
      down: ".....oo...oo/...oohhooohho/..ohhhhhhhhhhoo/.ohhhjjhhhhhhho/.ohhfffhhfffhho/..offfffhffffo/..ofoofffooffo/..offffffffffo/...offfffffso/....osfffsso/.....osffso/......oooo",
      up: ".....oo...oo/...oohhooohho/..ohhhhhhhhhhoo/.ohhhhhhhhhhhho/.ohhhhhhhhhhhho/..ohhhhhhhhhho/..ohhhhhhhjjho/...ohhhhhjjho/....ohhhjjho/.....ohhjho/......ohho/.......oo",
      side: ".......oo/.....oohhoo/....ohhhhhhhoo/...ohhhhhhhhho/..offhhhhhjjho/.offffhhhhhho/.offofffhhhhho/..offffffhhho/...osffffhho/....osfssoo/.....osso/......oo",
    },
    mia: {
      down: ".....oooooo/...oohhhhhhoo/..ohhhhhhhhhhho/.ohhhhhhjjhhhho/.ohhffhhhfffhho/.ohfffffffffhho/.ohfoofffoofhho/.ohfffffffffhho/..ohfffffffhho/...ohfffffhho/....oossshhho/......ooohho",
      up: ".....oooooo/...oohhhhhhoo/..ohhhhhhhhhhho/.ohhhhhhhhhhhho/.ohhhhhhhhhjhho/.ohhhhhhhjjhhho/.ohhhhhjjjhhhho/..ohhhjjhhhhho/...ohhhhhhho/....ohhhhho/.....ohhho/......ooo",
      side: ".....oooooo/....ohhhhhhoo/...ohhhhhhhhho/..ohhhhhhhjjhho/..offhhhhhjjhho/.offffhhhhjjhho/.offoffhhhjjhho/..offffffhjjho/...offffhhjho/....offhhjho/.....oshhho/......ohho",
    },
    nara: {
      down: "..oo........oo/..oho......oho/..ohho....ohho/..ohhhoooohhho/..ohhhhhhhhhho/.ohhhjjhhhhhho/.ohhffhhfffhhho/.ohfoofffoofhho/.ohfffffffffhho/.ohhfffffffhhho/..ohhfffffhhho/...ohhssshhho/....oohhhoo",
      up: "..oo........oo/..oho......oho/..ohho....ohho/..ohhhoooohhho/..ohhhhhhhhhho/.ohhhhhhhhhhho/.ohhhhhhhhhhhho/.ohhhhhhhhhjjho/.ohhhhhhhhjjhho/.ohhhhhhhhjjhho/..ohhhhhhhjhho/...ohhhhhhho/....oohhhoo",
      side: "....oo.....oo/....oho..ohho/....ohho.ohhho/...ohhhhhhhhho/..ohhhhhhhhjjho/..offhhhhhjjhho/.offffhhhhjjhho/.offoffhhhjjhho/..offfffhhjjho/...offfhhhjho/....oshhhjho/.....ohhhho/......ohho",
    },
    tobin: {
      down: ".....oo...oo/...oohhooohhoo/..ohhhhhhhhhhhho/.ohhhjjjjjjhhhhho/.ohhffffffffhhho/.ohffoofffooffho/.ohfffffsfffffho/.ohhffhhhhffhhho/.ohhhhhffhhhhhho/..ohhhhjjhhhhho/...ohhhjjhhhho/....ohhhhhhho/.....ohhhhho/......oooo",
      up: ".....oo...oo/...oohhooohhoo/..ohhhhhhhhhhhho/.ohhhhhhhhhhhhho/.ohhhhhhhhhhhhho/.ohhhhhhhhhhjjho/.ohhhhhhhhjjhhho/.ohhhhhhjjhhhhho/..ohhhhhhhhhho/...ohhhhhhhho/....ohhhhhho/.....ohhhho/......oooo",
      side: "......ooooo/....oohhhhhhoo/...ohhhhhhhhhho/..ohhhhhhhhhjho/..offhhhhhhjjho/.offfofffhhjjho/.offfffffhjjjho/..ohhffhhhhhho/..ohhhhhhhhho/...ohhhhhhhho/....ohhjjhho/.....ohhhho/......oooo",
    },
    leon: {
      down: ".......oo/.....oohhooo/...oohhhhhhhoo/..ohhhhhhhhhho/.ohhhhjjhhhhho/.ohhfffhhhffhho/..offffffhfffo/..oooofooooffo/..ofooofoofffo/...offfffffso/....offfffso/.....osssso/......oooo",
      up: ".......oo/.....oohhooo/...oohhhhhhhoo/..ohhhhhhhhhho/.ohhhhhhhhhhhho/.ohhhhhhhhhhhho/..ohhhhhhhhjjho/..ohhhhhhhjjhho/...ohhhhhjjhho/....ohhhjjhho/.....ohhhho/......oooo",
      side: ".......oo/.....oohhooo/....ohhhhhhhoo/...ohhhhhhhhhho/..ohhhhhhhhjjho/..offhhhhhhjjho/.oaaoaffhhhjjho/.oaoaofffhhjho/..offffffhjho/...offfffhho/....osffso/.....oooo",
    },
    rogue: {
      down: ".......oo..o/......ohhoohho/.....ohhhhhhhhoo/....ohhhhhhhhhho/...offjjhhhhhhho/..offfffjjhhhhhho/..offffffffhhho/..ofoofffooffho/..offfffffffso/...offaooafso/....offaafso/.....osssso/......oooo",
      up: ".......oo..o/......ohhoohho/.....ohhhhhhhhoo/....ohhhhhhhhhho/...ossjjhhhhhhho/..ossssjjhhhhhho/..osssssjhhhhhho/..osssssjjhhhhho/...ossssjjhhhho/....osssjjhhho/.....ossjjhho/......oooooo",
      side: ".......oo..o/......ohhoohho/.....ohhhhhhhhoo/....ohhhhhhhhhho/...offjjhhhhhhho/..offffjjhhhjjho/.offofffjjhjjjho/..offffffjjjjho/...offfffjjjho/....offaassso/.....osssso/......oooo",
    },
    scout: {
      down: "......oooo/.....ohhhho/......ojjo/....oohhhhoo/...ohhhhhhhhoo/..ohhhjjjhhhho/.ohhffhhfffhhho/ofhhffffffffhhfo/offhoofffoofhffo/.oshffffffffhso/..ohhffffffhho/...ohhffffhhho/....ohssshho/.....ohhhho",
      up: "......oooo/.....ohhhho/......ojjo/....oohhhhoo/...ohhhhhhhhoo/..ohhhhhhhhhho/.ohhhhhhhhhhhho/ofhhhhhhhhhhhhfo/offhhhhhhhhhffo/.oshhhhhhhhhhso/..ohhhhhhhjhho/...ohhhhhhjhho/....ohhhhjjho/.....ohhhho",
      side: "......oooo/.....ohhhho/......ojjo/....oohhhhoo/...ohhhhhhhhoo/..ohhhhhhhjjho/..offhhhhjjjho/.offffhhhjjfffoo/.offoffhhjjffffo/..offfffhhjjhho/...offfhhjjhho/....oshhhjhho/.....ohhhhho/......ohhho",
    },
  };
  const bodies = {
    cloak: {
      down: "....oooooo/..ooccccccoo/.occcccgccccco/.ovccccccccvo/ovvcccccccvvvo/ovvcccccccvvvo/.ovcccccccvvo/..ovvcccvvvo/...ovvvvvo/....ooooo",
      up: "....oooooo/..ooccccccoo/.occcccccccco/.ovccccccccvo/ovvcccccccvvvo/ovvcccccccvvvo/.ovvcccccvvvo/..ovvcccvvvo/...ovvvvvo/....ooooo",
      side: ".....ooooo/....occccco/...occccccvo/..occcccccvvo/.ovcccccccvvo/.ovcccccccvvo/..ovccccccvvo/...ovccccvvo/....ovvvvo/.....oooo",
    },
    blouse: {
      down: "....oooooo/...occaacco/..occcaacccco/.occcccccccco/.ovccccccccvo/.ovccccccccvo/..ovccccccvo/...obbbbbbo/...obbbbbbo/....oooooo",
      up: "....oooooo/...occcccco/..occccccccco/.occcccccccco/.ovccccccccvo/.ovccccccccvo/..ovccccccvo/...obbbbbbo/...obbbbbbo/....oooooo",
      side: ".....ooooo/....occccco/...occccccvo/..occcccccvvo/..ovccccccvvo/..ovccccccvvo/...ovccccvvo/....obbbbbo/....obbbbbo/.....ooooo",
    },
    jacket: {
      down: "....oooooo/..oocaaaaccoo/.occcaaaacccco/.occccaaccccvo/.ovcccaacccvvo/.ovccccccccvvo/..ovccccccvvo/...ovvggvvvo/....ovvvvvo/.....ooooo",
      up: "....oooooo/..oocaaaaccoo/.occccccccccco/.occcccccccvvo/.ovcccccccvvvo/.ovcccccccvvvo/..ovccccccvvo/...ovvvvvvvo/....ovvvvvo/.....ooooo",
      side: ".....ooooo/...oocaaaco/..occcaaacvo/..occcccccvvo/..ovccccccvvo/..ovccccccvvo/...ovccccvvo/....ovggvvo/.....ovvvo/......ooo",
    },
    vest: {
      down: "....oooooo/..ooaccccaaoo/.oaccccccccaao/.oaccvvvvccavo/.oaccvvvvccavo/..occvvvvccvo/..occvvvvccvo/...ocggcccco/....occccco/.....ooooo",
      up: "....oooooo/..ooacccccaoo/.oaccccccccaao/.oaccccccccaao/.oaccccccccavo/..ovccccccvvo/..ovccccccvvo/...ovvvvvvvo/....ovvvvvo/.....ooooo",
      side: ".....ooooo/...ooccccao/..occccccaao/..occcvvccavo/..occcvvccavo/...occvvccvo/...ovccccvvo/....ovggvvo/.....ovvvo/......ooo",
    },
  };
  const cache = new Map();
  function paint(c, pattern, x, y, palette) {
    pattern.split("/").forEach((row, dy) => {
      [...row].forEach((mark, dx) => {
        if (mark === ".") return;
        c.fillStyle = palette[mark];
        c.fillRect(x + dx, y + dy, 1, 1);
      });
    });
  }
  function legs(c, kind, side, frame, p) {
    const wide = kind === "tobin",
      step = [0, 1, 0, -1][frame];
    const leg = (x, end, toe = 0) => {
      c.fillStyle = p.o;
      c.fillRect(x, 23, 3, end - 22);
      c.fillStyle = p.b;
      c.fillRect(x + 1, 23, 1, end - 23);
      c.fillStyle = p.o;
      c.fillRect(x + toe, end, 4, 1);
    };
    if (side) {
      leg(10 + step, frame % 2 ? 26 : 27, -1);
      leg(9 - step, 27, frame === 2 ? -2 : -1);
    } else {
      leg(
        (wide ? 6 : 7) - Math.max(0, step),
        step < 0 ? 26 : 27,
        frame === 2 ? -1 : 0,
      );
      leg(
        (wide ? 13 : 12) + Math.max(0, -step),
        step > 0 ? 26 : 27,
        frame === 2 ? 1 : 0,
      );
    }
  }
  function make(kind, direction = "down", frame = 0) {
    const key = kind + ":" + direction + ":" + frame;
    if (cache.has(key)) return cache.get(key);
    const p = { o: "#303438", b: "#38363d", ...palettes[kind] };
    const native = document.createElement("canvas");
    native.width = 22;
    native.height = 30;
    const c = native.getContext("2d"),
      side = ["left", "right"].includes(direction);
    const view = side ? "side" : direction,
      bob = frame % 2;
    if (direction === "right") {
      c.translate(22, 0);
      c.scale(-1, 1);
    }
    if (["lucy", "mia", "nara", "scout"].includes(kind))
      paint(
        c,
        ".oooooooooooooo/ohjjjjjjjjjjjjho/ohjjjjjjjjjjjjho/ohjjjjjjjjjjjjho/ohjjjjjjjjjjjjho/ohjjjjjjjjjjjjho/ohhjjjjjjjjjjhho/.ohhjjjjjjjjhho/..ohhjjjjjjhho/...ooo..oooo",
        3,
        10 + bob,
        p,
      );
    if (kind === "nara")
      paint(
        c,
        "ho/hho/.hho/..hho/..hho/.hjho/ohjho/ohho/.oo",
        2 + [0, 1, 0, -1][frame],
        18,
        p,
      );
    if (kind === "bran")
      paint(c, "oo/ohho/ohho/.ohho/.ohho/..oo", 16, 9 + bob, p);
    legs(c, kind, side, frame, p);
    const type =
      kind === "lucy"
        ? "blouse"
        : ["bran", "leon"].includes(kind)
          ? "jacket"
          : ["tobin", "rogue"].includes(kind)
            ? "vest"
            : "cloak";
    const bodyY = kind === "tobin" ? 17 : 14;
    let body = bodies[type][view];
    if (kind === "tobin")
      body =
        body.split("/").slice(0, 6).join("/") +
        (side ? "/...ovggvvo/....ooooo" : "/..ocggggccco/...ooooooo");
    paint(c, body, 4, bodyY + bob, p);
    if (kind === "lucy") {
      // Long blouse sleeves end in her dark gloves, not a brown jacket.
      paint(c, "bb/bb", side ? 8 : 5, 20 + bob, p);
      if (!side) paint(c, "bb/bb", 16, 20 + bob, p);
    }
    if (kind === "hero") {
      paint(c, "a/a/a/aa/.aa", side ? 8 : 9, 15 + bob, p);
      paint(
        c,
        "ooo/aago/aaao/.oo",
        direction === "up" ? 4 : side ? 13 : 16,
        20 + bob,
        p,
      );
    }
    if (kind === "lucy" && direction !== "up")
      paint(c, "a.a/.a/.a", side ? 7 : 10, 14 + bob, p);
    if (kind === "mia") {
      const braidX = side ? 14 : 16;
      paint(c, "oho/hhho/ojho/hhho", braidX, 13 + bob, p);
      paint(c, "ojho/hhho/ogo/.o", braidX + [0, 0, 0, -1][frame], 17 + bob, p);
    }
    if (kind === "leon")
      paint(c, "ooooo/oaggo/oaaao/oaaao/ooooo", side ? 7 : 14, 20 + bob, p);
    if (kind === "scout") {
      if (!side) {
        paint(c, "of/ffo/.so", 1, 7 + bob, p);
        paint(c, "fo/off/os", 18, 7 + bob, p);
      }
      paint(c, "gggo/ggggo/.ggo", side ? 14 : 15, 15 + bob, p);
      if (direction !== "up")
        paint(
          c,
          "aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa/aaaaaaa/ovvvvvo",
          side ? 9 : 8,
          17 + bob,
          p,
        );
      else paint(c, "a/.a/..a/...a", 9, 16 + bob, p);
      if (direction !== "up") paint(c, ".g/gng/.g", side ? 7 : 10, 15 + bob, p);
      if (direction === "up" || side)
        paint(c, "g.g/aoa/aoa/aaa/aaa", 15, 12 + bob, p);
    }
    if (kind === "rogue")
      paint(c, side ? "a/vo" : "a...a/ovvvo", side ? 7 : 5, 15 + bob, p);
    const headY =
      kind === "scout" || kind === "nara" ? 0 : kind === "tobin" ? 5 : 2;
    let head = heads[kind][view];
    if (kind === "rogue" && direction === "right")
      head = head.replace(
        "..offffjjhhhjjho/.offofffjjhjjjho",
        "..offffsshhhjjho/.offofffsshhjjho",
      );
    paint(c, head, kind === "tobin" ? 2 : 3, headY + bob, p);
    const image = document.createElement("canvas");
    image.width = 44;
    image.height = 60;
    const out = image.getContext("2d");
    out.imageSmoothingEnabled = false;
    out.drawImage(native, 0, 0, 44, 60);
    cache.set(key, image);
    return image;
  }
  return { make };
})();
