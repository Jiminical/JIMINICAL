// Short outdoor loops, supplies and descriptions shared by the field and shops.
const fieldWorld = (() => {
  const maps = {
    city: {
      names: ["제르디아 왕국", "길드 앞 광장"],
      npcs: [["edan", 452, 309, "left"]],
      targets: [
        { id: "guild-entry", name: "모험가 길드", x: 140, y: 219 },
        { id: "shop-entry", name: "로제의 잡화점", x: 568, y: 244 },
        { id: "carriage-stop", name: "그린스토아행 마차", x: 539, y: 389 },
        { id: "city-board", name: "광장 안내판", x: 84, y: 335 },
        { id: "fountain", name: "광장의 분수", x: 363, y: 307 },
      ],
    },
    grove: {
      names: ["그린스토아 입구", "이슬잎 숲길"],
      npcs: [["sena", 143, 280, "left"]],
      targets: [
        { id: "gate-return", name: "그린스토아 정문", x: 395, y: 444 },
        { id: "library-entry", name: "이슬잎 도서관", x: 529, y: 191 },
        { id: "river-leaf", name: "강가에 내려앉은 잎", x: 116, y: 298 },
        { id: "spring", name: "작은 샘", x: 73, y: 266 },
        { id: "grove-sign", name: "숲길 비석", x: 456, y: 326 },
      ],
    },
    shop: {
      names: ["여행자의 쉼터", "작은 잡화점"],
      targets: [{ id: "shop-exit", name: "가게 밖으로", x: 360, y: 444 }],
    },
    library: {
      names: ["이종족연합국 그린스토아", "이슬잎 도서관"],
      targets: [
        { id: "library-exit", name: "숲길로 돌아가기", x: 360, y: 439 },
        { id: "archive-world", name: "세계관의 기록", x: 174, y: 269 },
        { id: "archive-people", name: "인물 도감", x: 360, y: 312 },
        { id: "archive-comic", name: "프롤로그 삽화집", x: 552, y: 269 },
      ],
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
