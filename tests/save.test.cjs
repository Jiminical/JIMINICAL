const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../JS/save.js'), 'utf8');
function setup() {
  const values = new Map(), document = new EventTarget();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const save = vm.runInNewContext(source + '\njourneySave;', { localStorage: storage, document, Event });
  const state = {
    name: '여행자', resume: 'world', location: 'grove', storyStep: 'arrived',
    questAccepted: true, hp: 1, coins: 11, shopOrigin: 'city',
    player: { x: 450, y: 340, dir: 'up' },
    npcs: [{ id: 'sena', x: 143, y: 280, dir: 'left', talkCount: 2 }],
    inventory: [{ id: 'bread', name: '마른 빵', description: '체력 회복', count: 1 }],
    visited: ['guild', 'city', 'grove'], shopStocks: { city: { bread: 4, tonic: 2, bandage: 3 } },
    fieldFlags: { lucyFarewell: true, leafTaken: false, springUsed: true,
      libraryReached: false, libraryLetterRead: false, libraryAmbushCleared: true },
  };
  return { save, state, values, storage, document };
}
test('round-trip retains HP 1, progress, positions, inventory and stock', () => {
  const { save, state } = setup();
  assert.equal(save.write(state), true);
  const restored = JSON.parse(JSON.stringify(save.read()));
  assert.equal(restored.version, 1); assert.equal(typeof restored.savedAt, 'number');
  delete restored.version; delete restored.savedAt;
  assert.deepEqual(restored, state);
});
test('a successful write announces the new save', () => {
  const { save, state, document } = setup(); let events = 0;
  document.addEventListener('greenstoa:savechange', () => events++);
  save.write(state); assert.equal(events, 1);
});
test('journey music position round-trips while older saves remain loadable', () => {
  const { save, state } = setup();
  assert.equal(save.write(state), true);
  assert.equal(save.read().journeyMusic, undefined);
  assert.equal(save.write({ ...state, journeyMusic: { active: true, offset: 73.25 } }), true);
  assert.equal(save.read().journeyMusic.offset, 73.25);
  for (const music of [null, { active: 'yes', offset: 0 }, { active: true, offset: -1 }, { active: true, offset: NaN }])
    assert.equal(save.write({ ...state, journeyMusic: music }), false);
});
test('opening checkpoints remain valid and restricted to the guild', () => {
  const { save, state } = setup();
  assert.equal(save.write({ ...state, resume: 'opening', location: 'guild' }), true);
  assert.equal(save.write({ ...state, resume: 'opening' }), false);
});
test('invalid gameplay values cannot replace the current save', () => {
  const { save, state, values } = setup(); save.write(state);
  const original = values.get(save.key);
  for (const patch of [
    { hp: 0 }, { hp: 25 }, { coins: -1 }, { coins: NaN }, { location: 'missing' },
    { storyStep: 'unknown' }, { player: { x: Infinity, y: 200, dir: 'up' } },
    { player: { x: 361, y: -2, dir: 'up' } }, { inventory: null },
    { inventory: [{ ...state.inventory[0], count: -1 }] },
    { inventory: [state.inventory[0], state.inventory[0]] },
    { npcs: [null] }, { visited: ['unknown'] }, { fieldFlags: {} },
    { shopStocks: { city: { bread: -1, tonic: 2, bandage: 3 } } },
  ]) {
    assert.equal(save.write({ ...state, ...patch }), false, JSON.stringify(patch));
    assert.equal(values.get(save.key), original);
  }
});
test('corrupt, oversized, incomplete or unsupported records are ignored', () => {
  const { save, state, values } = setup(); save.write(state);
  const valid = JSON.parse(values.get(save.key));
  for (const raw of ['broken', 'null', '{"version":1}', 'x'.repeat(64001), JSON.stringify({ ...valid, version: 2 })]) {
    values.set(save.key, raw); assert.equal(save.read(), null);
  }
});
test('blocked storage and full storage fail safely without replacing a save', () => {
  const { save, state, storage, values, document } = setup(); save.write(state);
  const original = values.get(save.key); let events = 0;
  document.addEventListener('greenstoa:savechange', () => events++);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(save.write({ ...state, hp: 24 }), false);
  assert.equal(values.get(save.key), original); assert.equal(events, 0);
  storage.getItem = () => { throw new Error('SecurityError'); };
  assert.equal(save.read(), null);
});
