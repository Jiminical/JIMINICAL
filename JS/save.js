// One local save slot. Only settled world states are written by game.js.
const journeySave = (() => {
  const key = "greenstoa-journey-v1";
  const locations = new Set(["guild", "city", "shop", "carriage", "checkpoint", "gate", "grove", "library"]);
  const steps = new Set(["lucy", "accepted", "departure", "carriage", "checkpoint", "arrival", "arrived"]);
  const directions = new Set(["up", "down", "left", "right"]);
  const people = new Set(["lucy", "bran", "mia", "nara", "tobin", "leon", "rogue", "scout", "rose", "rael", "edan", "sena"]);
  const items = new Set(["map", "bread", "credentials", "dispatch", "tonic", "bandage", "riverLeaf", "libraryLetter"]);
  const flags = ["lucyFarewell", "leafTaken", "springUsed", "libraryReached", "libraryLetterRead", "libraryAmbushCleared"];
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const text = (value, max) => typeof value === "string" && value.length <= max;
  const point = value => value && Number.isFinite(value.x) && value.x >= 0 && value.x <= 720 &&
    Number.isFinite(value.y) && value.y >= 0 && value.y <= 480 && directions.has(value.dir);
  function valid(save) {
    return !!(save && save.version === 1 && Number.isFinite(save.savedAt) &&
      text(save.name, 40) && save.name.trim() && locations.has(save.location) && steps.has(save.storyStep) &&
      ["opening", "world"].includes(save.resume) && (save.resume !== "opening" || save.location === "guild") &&
      point(save.player) && integer(save.hp, 1, 24) && integer(save.coins, 0, 999999) &&
      typeof save.questAccepted === "boolean" && ["city", "grove"].includes(save.shopOrigin) &&
      save.fieldFlags && flags.every(flag => typeof save.fieldFlags[flag] === "boolean") &&
      Array.isArray(save.visited) && save.visited.length <= locations.size && save.visited.every(place => locations.has(place)) &&
      Array.isArray(save.inventory) && save.inventory.length <= items.size &&
      new Set(save.inventory.map(item => item?.id)).size === save.inventory.length &&
      save.inventory.every(item => item && items.has(item.id) && integer(item.count, 1, 999) && text(item.name, 80) && text(item.description, 5000)) &&
      Array.isArray(save.npcs) && save.npcs.length <= people.size &&
      save.npcs.every(person => person && people.has(person.id) && point(person) && integer(person.talkCount, 0, 999999)) &&
      save.shopStocks?.city && ["bread", "tonic", "bandage"].every(id => integer(save.shopStocks.city[id], 0, 999)));
  }
  function read() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length > 64000) return null;
      const save = JSON.parse(raw);
      return valid(save) ? save : null;
    } catch { return null; }
  }
  function write(state) {
    const save = { ...state, version: 1, savedAt: Date.now() };
    if (!valid(save)) return false;
    try {
      localStorage.setItem(key, JSON.stringify(save));
      document.dispatchEvent(new Event("greenstoa:savechange"));
      return true;
    } catch { return false; }
  }
  return { key, valid, read, write };
})();
