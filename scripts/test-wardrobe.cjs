const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
const { act } = React;
global.IS_REACT_ACT_ENVIRONMENT = true;
const farmer = { inventoryId: 52, skinCloverStage: "STAGE_1", skinUrl: "farmer.png" };
const skin = (stage, status = "RECEIVED") => ({ skinId: stage, cloverStage: `STAGE_${stage}`, url: `${stage}.png`, status });
const inventory = (id, isEquipped = false) => ({ inventoryItemId: id, isEquipped, acquiredAt: `2026-11-${id === 52 ? "13" : "14"}T00:00:00Z` });
const failed = () => Promise.reject(Error("offline"));
function service(overrides = {}) {
  return load("services/wardrobeService.ts", {
    "@/api/skinAPI": { SkinAPI: {
      getSkinStatusList: async () => ({ skins: [skin(1)] }),
      getEquippedSkin: async () => farmer,
      ...overrides,
    } },
    "@/api/inventoryAPI": { InventoryAPI: { getUserInventories: overrides.getUserInventories ?? (async () => ({ inventories: [inventory(52)] })) } },
  }).loadWardrobe;
}
test("equipped appearance restores the owned item even if rewards omit it and the inventory flag is false", async () => {
  const result = await service({ getSkinStatusList: async () => ({ skins: [] }) })();
  assert.deepEqual(result, { items: [{ inventoryItemId: 52, stage: 1, url: "farmer.png" }], equippedId: 52, equippedResolved: true, complete: true });
});
test("equipped item is anchored by its ID rather than acquisition order", async () => {
  const result = await service({ getSkinStatusList: async () => ({ skins: [skin(2), skin(1)] }), getUserInventories: async () => ({ inventories: [inventory(99), inventory(52)] }) })();
  assert.deepEqual(result.items.map((i) => [i.inventoryItemId, i.stage]), [[52, 1], [99, 2]]);
});
test("a failed list still returns the known equipped appearance and a load error", async () => {
  const result = await service({ getUserInventories: failed })();
  assert.equal(result.equippedId, 52);
  assert.equal(result.items[0].stage, 1);
  assert.equal(result.complete, false);
});
test("missing inventory rows never create fake IDs or an apparently successful empty result", async () => {
  const result = await service({ getSkinStatusList: async () => ({ skins: [skin(1), skin(2)] }) })();
  assert.deepEqual(result.items.map((i) => i.inventoryItemId), [52]);
  assert.equal(result.complete, false);
});
test("all failed lookups are distinguished from a confirmed empty wardrobe", async () => {
  const failedResult = await service({ getSkinStatusList: failed, getEquippedSkin: failed, getUserInventories: failed })();
  const emptyResult = await service({ getSkinStatusList: async () => ({ skins: [] }), getEquippedSkin: async () => ({ inventoryId: null }), getUserInventories: async () => ({ inventories: [] }) })();
  assert.equal(failedResult.complete, false);
  assert.equal(emptyResult.complete, true);
  assert.deepEqual(emptyResult.items, []);
});

function environment(t, loader, equip = async () => {}) {
  const Focus = React.createContext(true);
  const useFocusEffect = (callback) => {
    const focused = React.useContext(Focus);
    React.useEffect(() => focused ? callback() : undefined, [focused, callback]);
  };
  const hookModule = load("shared/skins/useWardrobe.ts", { "expo-router": { useFocusEffect }, "@/services/wardrobeService": { loadWardrobe: loader } });
  const saves = [], navigations = [];
  const Screen = load("app/(home)/storage.tsx", {
    "react-native": { ActivityIndicator: "Spinner", FlatList: (p) => React.createElement("List", null, p.data.map((item) => React.createElement(React.Fragment, { key: item.inventoryItemId }, p.renderItem({ item })))), Image: "Image", ImageBackground: "Background", Pressable: "Button", StyleSheet: { create: (v) => v }, Text: "Text", View: "View" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) },
    "expo-image": { Image: "SkinImage" },
    "expo-linear-gradient": { LinearGradient: "Gradient" },
    "expo-router": { useRouter: () => ({ back() {}, replace: (path) => navigations.push(path) }) },
    "@/store/useStorageStore": { useStorageStore: (select) => select({ setShouldReopenReward() {} }) },
    "@/app/i18n/i18n": { t: (key) => key },
    ...Object.fromEntries(["back", "farmer", "princess", "devil"].map((name) => [`@/assets/icons/ic_${name}.svg`, `Icon-${name}`])),
    "@/services/wardrobeService": { saveWardrobeSelection: async (id) => { saves.push(id); await equip(id); } },
    "@/shared/theme/palette": load("shared/theme/palette.ts"),
    "@/shared/theme/typography": load("shared/theme/typography.ts"),
    "@/shared/skins/useWardrobe": hookModule,
    "@/shared/skins/skinAppearance": { getSkinCharacterSource: (stage) => `outfit-${stage}` },
    "@/assets/images/bg_default.png": "background", "@/assets/images/lody_default.png": "bare",
  }).default;
  let root;
  let current;
  function Probe() { current = hookModule.useWardrobe(); return null; }
  const render = async (focused = true, screen = false) => act(async () => {
    const element = React.createElement(Focus.Provider, { value: focused }, React.createElement(screen ? Screen : Probe));
    if (root) root.update(element); else root = Renderer.create(element);
  });
  t.after(() => act(() => root?.unmount()));
  return { render, value: () => current, root: () => root.root, saves, navigations };
}
const result = (id = 52, stage = 1) => ({ items: [{ inventoryItemId: id, stage, url: "skin.png" }], equippedId: id, equippedResolved: true, complete: true });
test("real wardrobe screen initially selects the equipped item, previews its outfit and disables unchanged save", async (t) => {
  const env = environment(t, async () => result());
  await env.render(true, true);
  assert.equal(env.root().findByType("SkinImage").props.source, "outfit-1");
  const item = env.root().findAllByType("Button").find((b) => b.props.accessibilityState?.selected);
  assert.equal(item.props.accessibilityLabel, "skin.level");
  const save = env.root().findAllByType("Button").find((b) => b.props.disabled === true && !b.props.accessibilityState);
  assert.ok(save);
  await act(async () => save.props.onPress());
  assert.deepEqual(env.saves, []);
});
test("returning to the wardrobe refreshes the equipped selection", async (t) => {
  let next = result();
  const env = environment(t, async () => next);
  await env.render();
  assert.equal(env.value().selectedId, 52);
  await env.render(false);
  next = result(99, 2);
  await env.render(true);
  assert.equal(env.value().selectedId, 99);
});
test("a failed refresh preserves the confirmed appearance and supports retry", async (t) => {
  let next = result();
  const env = environment(t, async () => next);
  await env.render();
  await env.render(false);
  next = { items: [], equippedId: null, equippedResolved: false, complete: false };
  await env.render(true);
  assert.equal(env.value().selectedId, 52);
  assert.equal(env.value().items[0].stage, 1);
  assert.equal(env.value().error, true);
  next = result(99, 2);
  await act(async () => env.value().retry());
  assert.equal(env.value().selectedId, 99);
  assert.equal(env.value().error, false);
});
test("a late response from a blurred wardrobe cannot overwrite a newer selection", async (t) => {
  let resolve;
  let calls = 0;
  const env = environment(t, () => ++calls === 1 ? new Promise((r) => { resolve = r; }) : Promise.resolve(result(99, 2)));
  await env.render();
  assert.equal(env.value().loading, true);
  await env.render(false);
  await env.render(true);
  await act(async () => resolve(result()));
  assert.equal(env.value().selectedId, 99);
});
test("failed initial load shows retry instead of the empty-wardrobe message", async (t) => {
  const env = environment(t, async () => ({ items: [], equippedId: null, equippedResolved: false, complete: false }));
  await env.render(true, true);
  const texts = env.root().findAllByType("Text").map((n) => n.props.children);
  assert.ok(texts.includes("storage.loadError"));
  assert.ok(texts.includes("storage.retry"));
  assert.ok(!texts.includes("storage.empty"));
});

test("a successful unequip lookup clears an old selection even when a list fails", async (t) => {
  let next = result();
  const env = environment(t, async () => next);
  await env.render();
  await env.render(false);
  next = { items: [], equippedId: null, equippedResolved: true, complete: false };
  await env.render(true);
  assert.equal(env.value().selectedId, null);
  assert.equal(env.value().error, true);
});
test("saving a changed outfit uses its inventory ID once despite repeated presses", async (t) => {
  let resolve;
  const pending = new Promise((r) => { resolve = r; });
  const data = result();
  data.items.push({ inventoryItemId: 99, stage: 2, url: "princess.png" });
  const env = environment(t, async () => data, () => pending);
  await env.render(true, true);
  const items = env.root().findAllByType("Button").filter((b) => b.props.accessibilityState);
  await act(async () => items[1].props.onPress());
  const save = env.root().findAllByType("Button").at(-1);
  assert.equal(save.props.disabled, false);
  await act(async () => { void save.props.onPress(); void save.props.onPress(); });
  assert.deepEqual(env.saves, [99]);
  await act(async () => resolve());
  assert.deepEqual(env.navigations, ["/(home)/(tabs)/main"]);
});

test("deselecting the equipped outfit enables save and persists the bare selection", async (t) => {
  const env = environment(t, async () => result());
  await env.render(true, true);
  const item = env.root().findAllByType("Button").find((b) => b.props.accessibilityState?.selected);
  await act(async () => item.props.onPress());
  const save = env.root().findAllByType("Button").at(-1);
  assert.equal(save.props.disabled, false);
  assert.equal(env.root().findByType("SkinImage").props.source, "bare");
  await act(async () => save.props.onPress());
  assert.deepEqual(env.saves, [null]);
});

function selectionService(initialId, options = {}) {
  let equippedId = initialId;
  const writes = [];
  const { saveWardrobeSelection } = load("services/wardrobeService.ts", {
    "@/api/skinAPI": { SkinAPI: { getEquippedSkin: async () => ({ inventoryId: equippedId }), equipSkin: async (id) => {
      writes.push(id);
      if (!options.ignoreWrite) equippedId = equippedId === id ? null : id;
      if (options.loseResponse) throw Error("response lost");
    } } }, "@/api/inventoryAPI": { InventoryAPI: {} },
  });
  return { save: saveWardrobeSelection, writes, id: () => equippedId };
}
test("saving bare toggles the actual equipped ID and retry does not put it back on", async () => {
  const env = selectionService(52);
  await env.save(null);
  await env.save(null);
  assert.equal(env.id(), null);
  assert.deepEqual(env.writes, [52]);
});
test("an already applied target never toggles off during an equip retry", async () => {
  const env = selectionService(52);
  await env.save(99);
  await env.save(99);
  assert.deepEqual(env.writes, [99]);
});
test("a lost unequip response is safely retried using the server state", async () => {
  const env = selectionService(52, { loseResponse: true });
  await assert.rejects(env.save(null));
  await env.save(null);
  assert.deepEqual(env.writes, [52]);
});
test("a server that ignores a selection change is not reported as saved", async () => {
  const env = selectionService(52, { ignoreWrite: true });
  await assert.rejects(env.save(null), /not saved/);
});

test("multiple unlinked inventory rows are not paired to costumes by acquisition order", async () => {
  const result = await service({
    getSkinStatusList: async () => ({ skins: [skin(3), skin(1), skin(2)] }),
    getUserInventories: async () => ({ inventories: [inventory(44), inventory(99), inventory(52)] }),
  })();
  assert.deepEqual(result.items.map((i) => i.inventoryItemId), [52]);
  assert.equal(result.complete, false);
});
