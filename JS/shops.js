// A small keyboard/touch shop window. Currency and inventory remain in game.js.
const shopView = (() => {
  const root = document.querySelector("#field-shop");
  const list = document.querySelector("#shop-stock");
  const description = document.querySelector("#shop-description");
  const buyButton = document.querySelector("#shop-buy");
  const status = document.querySelector("#shop-status");
  let state = null,
    selected = 0,
    inputAfter = 0;
  function render() {
    if (!state) return;
    const snapshot = state.snapshot(),
      shop = fieldWorld.shops[state.region];
    document.querySelector("#shop-title").textContent = shop.title;
    document.querySelector("#shop-note").textContent = shop.note;
    document.querySelector("#shop-coins").textContent = snapshot.coins + " G";
    list.replaceChildren();
    shop.stock.forEach((product, index) => {
      const button = document.createElement("button");
      const item = fieldWorld.items[product.id],
        remaining = snapshot.stock[product.id];
      button.type = "button";
      button.className = "shop-row" + (index === selected ? " is-current" : "");
      button.setAttribute("aria-pressed", String(index === selected));
      button.dataset.item = product.id;
      const name = document.createElement("span");
      name.textContent = (index === selected ? "▸ " : "  ") + item.name;
      const price = document.createElement("span");
      price.textContent = remaining ? product.price + " G" : "품절";
      button.append(name, price);
      button.addEventListener("click", () => {
        selected = index;
        gameAudio.sfx("select");
        render();
        list.children[selected].focus({ preventScroll: true });
      });
      list.append(button);
    });
    const product = shop.stock[selected],
      item = fieldWorld.items[product.id];
    const remaining = snapshot.stock[product.id],
      owned = snapshot.owned[product.id] || 0;
    document.querySelector("#shop-item-title").textContent = item.name;
    description.textContent = item.description;
    document.querySelector("#shop-item-count").textContent =
      "남은 수량 " + remaining + "  ·  소지 " + owned;
    const affordable = snapshot.coins >= product.price;
    buyButton.disabled = !remaining || !affordable;
    buyButton.textContent = !remaining
      ? "모두 팔렸어요"
      : !affordable
        ? "금화가 부족해요"
        : "구매 · " + product.price + " G";
  }
  function buy() {
    if (!state || performance.now() < inputAfter) return;
    const product = fieldWorld.shops[state.region].stock[selected];
    const result = state.buy(product.id);
    status.textContent = result.message;
    gameAudio.sfx(result.ok ? "purchase" : "cancel");
    render();
    list.children[selected]?.focus({ preventScroll: true });
  }
  function show(options) {
    state = options;
    selected = 0;
    inputAfter = performance.now() + 180;
    root.hidden = false;
    status.textContent = "필요한 물건을 골라 주세요.";
    render();
    list.children[0].focus({ preventScroll: true });
  }
  function hide() {
    root.hidden = true;
    state = null;
  }
  function close() {
    if (!state || performance.now() < inputAfter) return;
    const after = state.close;
    hide();
    after();
  }
  function handle(code, repeat = false, shift = false) {
    if (!state) return;
    if (code === "Tab") {
      const focusable = [
        ...root.querySelectorAll("button:not([disabled])"),
        document.querySelector("#game-sound-toggle"),
      ].filter((e) => e.getClientRects().length);
      const index = focusable.indexOf(document.activeElement),
        next = (index + (shift ? -1 : 1) + focusable.length) % focusable.length;
      focusable[next].focus();
      return;
    }
    if (repeat) return;
    if (["KeyC", "Escape"].includes(code)) {
      close();
      return;
    }
    const products = fieldWorld.shops[state.region].stock;
    if (["KeyW", "ArrowUp", "KeyS", "ArrowDown"].includes(code)) {
      selected =
        (selected +
          (["KeyW", "ArrowUp"].includes(code) ? -1 : 1) +
          products.length) %
        products.length;
      gameAudio.sfx("select");
      render();
      list.children[selected].focus({ preventScroll: true });
    } else if (["KeyE", "Enter"].includes(code)) buy();
  }
  buyButton.addEventListener("click", buy);
  document.querySelector("#shop-close").addEventListener("click", close);
  return {
    show,
    hide,
    handle,
    close,
    get active() {
      return Boolean(state);
    },
  };
})();
