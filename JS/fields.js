// Short outdoor loops, supplies and descriptions shared by the field and shops.
const fieldWorld = (() => {
  const maps = {
    city: {
      names: ["제르디아 왕국", "길드 앞 광장"],
      bounds: { left: 52, right: 678, top: 206, bottom: 446 },
      collisions: [
        { x: 0, y: 0, w: 260, h: 214 },
        { x: 287, y: 0, w: 176, h: 184 },
        { x: 480, y: 0, w: 240, h: 236 },
        { x: 304, y: 211, w: 119, h: 78 },
        { x: 555, y: 317, w: 151, h: 86 },
        { x: 38, y: 257, w: 85, h: 63 },
        { x: 139, y: 276, w: 77, h: 31 },
        { x: 528, y: 276, w: 70, h: 32 },
      ],
      npcs: [["edan", 452, 309, "left"]],
      targets: [
        { id: "guild-entry", name: "모험가 길드", x: 140, y: 219 },
        { id: "shop-entry", name: "로제의 잡화점", x: 568, y: 244 },
        { id: "carriage-stop", name: "그린스토아행 마차", x: 623, y: 421 },
        { id: "city-board", name: "광장 안내판", x: 84, y: 335 },
        { id: "fountain", name: "광장의 분수", x: 363, y: 307 },
      ],
    },
    grove: {
      names: ["그린스토아 입구", "이슬잎 숲길"],
      bounds: { left: 58, right: 655, top: 191, bottom: 446 },
      collisions: [
        { x: 0, y: 0, w: 720, h: 178 },
        { x: 0, y: 0, w: 68, h: 480 },
        { x: 174, y: 243, w: 120, h: 237 },
        { x: 0, y: 352, w: 179, h: 128 },
        { x: 456, y: 0, w: 219, h: 181 },
        { x: 590, y: 180, w: 130, h: 55 },
        { x: 545, y: 300, w: 175, h: 180 },
      ],
      npcs: [["sena", 143, 280, "left"]],
      targets: [
        { id: "gate-return", name: "그린스토아 정문", x: 395, y: 444 },
        { id: "shop-entry", name: "이슬잎 약초점", x: 529, y: 191 },
        { id: "river-leaf", name: "강가에 내려앉은 잎", x: 116, y: 298 },
        { id: "spring", name: "작은 샘", x: 73, y: 266 },
        { id: "grove-sign", name: "숲길 푯말", x: 456, y: 326 },
      ],
    },
    shop: {
      names: ["여행자의 쉼터", "작은 잡화점"],
      bounds: { left: 62, right: 655, top: 174, bottom: 446 },
      collisions: [
        { x: 38, y: 195, w: 170, h: 110 },
        { x: 225, y: 103, w: 270, h: 60 },
        { x: 520, y: 203, w: 100, h: 85 },
        { x: 0, y: 405, w: 296, h: 75 },
        { x: 429, y: 405, w: 291, h: 75 },
      ],
      targets: [{ id: "shop-exit", name: "가게 밖으로", x: 360, y: 444 }],
    },
  };
  const items = {
    bread: {
      name: "마른 빵",
      description:
        "여행 가방에 넣어 두기 좋은 빵.\n천천히 먹으면 체력이 6 회복된다.",
      heal: 6,
    },
    tonic: {
      name: "여행자 물약",
      description: "길드 모험가들이 즐겨 찾는 작은 약병.\n체력이 8 회복된다.",
      heal: 8,
    },
    bandage: {
      name: "깨끗한 붕대",
      description: "작은 상처를 감쌀 수 있는 리넨 붕대.\n체력이 4 회복된다.",
      heal: 4,
    },
    tea: {
      name: "이슬잎 차",
      description: "숲의 향이 은은하게 남는 차.\n체력이 6 회복된다.",
      heal: 6,
    },
    dewPotion: {
      name: "숲이슬 물약",
      description: "약초상 라엘이 갓 만든 맑은 물약.\n체력이 10 회복된다.",
      heal: 10,
    },
    leafCharm: {
      name: "나뭇잎 책갈피",
      description:
        "고운 잎맥을 그대로 말려 만든 작은 책갈피.\n성역을 다녀온 기억으로 간직할 수 있다.",
    },
    riverLeaf: {
      name: "강가의 잎",
      description:
        "물가에 가만히 내려앉아 있던 푸른 잎.\n잎맥을 따라 햇빛이 희미하게 비친다. 은은한 풀 향이 난다.",
    },
  };
  const shops = {
    city: {
      title: "로제의 잡화점",
      merchant: "rose",
      note: "길드 앞에서 챙기는 작은 여행 준비",
      stock: [
        { id: "bread", price: 3, stock: 6 },
        { id: "tonic", price: 7, stock: 3 },
        { id: "bandage", price: 4, stock: 4 },
      ],
      greeting: [
        "어머, 길드에서 나오시는 길인가요?\n먼 길에는 가벼운 빵과 물약이 제일 오래 남는 법이죠.",
        "천천히 골라 보세요. 급한 마차라도\n물건 살 잠깐은 기다려 줄 테니까요.",
      ],
    },
    grove: {
      title: "이슬잎 약초점",
      merchant: "rael",
      note: "성역의 풀과 물로 빚은 물건들",
      stock: [
        { id: "tea", price: 3, stock: 4 },
        { id: "dewPotion", price: 6, stock: 4 },
        { id: "leafCharm", price: 5, stock: 1 },
      ],
      greeting: [
        "어서 와요. 숲길에서 풀 냄새를 묻혀 오셨네요.\n여기서는 급하게 걸을 필요 없어요.",
        "따뜻한 차도 있고, 길 위에서 쓰기 좋은 물약도 있어요.\n마음에 드는 걸 골라 보세요.",
      ],
    },
  };
  function freshStock() {
    return Object.fromEntries(
      Object.entries(shops).map(([region, shop]) => [
        region,
        Object.fromEntries(shop.stock.map((item) => [item.id, item.stock])),
      ]),
    );
  }
  return { maps, items, shops, freshStock };
})();
