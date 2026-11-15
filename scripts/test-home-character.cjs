const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
global.IS_REACT_ACT_ENVIRONMENT = true;

const art = load("shared/skins/skinAppearance.ts", {
  "@/assets/images/farmer.png": 101,
  "@/assets/images/princess.png": 102,
  "@/assets/images/devil.png": 103,
});
const { getCloverProgress } = load("shared/clover/cloverProgress.ts");

test("costume canvases share the padded dimensions used by the layout at every pixel density", () => {
  const root = path.dirname(require.resolve("../package.json"));
  for (const name of ["lody_default", "farmer", "princess", "devil"]) {
    for (const density of [1, 2, 3]) {
      const filename = `${name}${density > 1 ? `@${density}x` : ""}.png`;
      const bytes = fs.readFileSync(path.join(root, "assets/images", filename));
      assert.equal(bytes.readUInt32BE(16) / density, 200, filename);
      assert.equal(bytes.readUInt32BE(20) / density, 210, filename);
    }
  }
});

test("dressed bodies keep the base character's visible height, center, and foot baseline", () => {
  const frame = art.HOME_CHARACTER_FRAME;
  const baseScale = Math.min(frame.width / 118, frame.height / 167);
  const baseTop = (frame.height - 167 * baseScale) / 2;
  for (const stage of ["STAGE_1", "STAGE_2", "STAGE_3"]) {
    const image = art.getHomeSkinImageStyle(stage);
    const scale = image.width / 200;
    assert.ok(167 * scale > 180, "Body must fill the frame rather than shrink with the 200px canvas");
    assert.ok(Math.abs(scale - baseScale) < 0.001);
    assert.ok(Math.abs(image.left + 100 * scale - frame.width / 2) < 0.001);
    assert.ok(Math.abs(image.top + 40 * scale - baseTop) < 0.001);
    assert.ok(Math.abs(image.top + 207 * scale - (baseTop + 167 * baseScale)) < 0.001);
  }
});

test("unknown remote artwork keeps its own full frame instead of assuming local padding", () => {
  assert.deepEqual(art.getHomeSkinImageStyle("STAGE_4"), { width: 128, height: 183, left: 0, top: 0 });
});

test("home advances cumulative targets at stage boundaries instead of keeping a denominator of two", () => {
  for (const [count, level, target] of [
    [0, 1, 2], [1, 1, 2], [2, 2, 4], [3, 2, 4], [4, 3, 6],
    [6, 4, 8], [8, 5, 10], [10, 6, 24], [23, 6, 24],
    [24, 7, 38], [234, 21, 234],
  ]) {
    const progress = getCloverProgress(count);
    assert.equal(progress.level, level);
    assert.equal(progress.total, count);
    assert.equal(progress.target, target);
  }
});

const { CharacterScene } = load("app/(home)/(tabs)/main/_components/CharacterScene.tsx", {
  "react-native": {
    Image: "BackgroundImage", Pressable: "Pressable", Text: "Text", View: "View",
    Platform: { OS: "android" }, StyleSheet: { absoluteFillObject: {} },
  },
  "@/app/i18n/i18n": { t: (key) => key },
  "expo-image": { Image: "SkinImage" },
  "@/assets/icons/Vector_bk.svg": "Chevron",
  "@/assets/images/Group.svg": "BaseCharacter",
  "@/shared/skins/skinAppearance": art,
  "../_constants": { BG_CENTER_TRANSLATE_Y: 0, BG_DEFAULT_ASPECT_RATIO: 1, bgDefaultPng: 1 },
});

function properties(count = 2, isKo = true) {
  const progress = getCloverProgress(count);
  return {
    equippedSkin: null, characterTop: 20, isKo,
    currentLevel: progress.level, effectiveTotalCloverCount: progress.total, cloverTarget: progress.target,
    levelChipTextStyle: [], cloverCountTextStyle: [], onOpenReward() {}, onLayout() {},
  };
}

function text(node) {
  if (node == null) return "";
  if (typeof node !== "object") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return text(node.children);
}

test("switching from the base character to a skin preserves the outer layout and level-chip position", (t) => {
  let root;
  React.act(() => { root = Renderer.create(React.createElement(CharacterScene, properties())); });
  t.after(() => React.act(() => root.unmount()));
  const baseFrame = root.root.findByType("BaseCharacter").parent.props.style;
  React.act(() => root.update(React.createElement(CharacterScene, {
    ...properties(), equippedSkin: { inventoryId: 101, skinCloverStage: "STAGE_1", skinUrl: "icon.png" },
  })));
  const dressedFrame = root.root.findByType("SkinImage").parent.props.style;
  assert.deepEqual(dressedFrame, baseFrame);
  assert.equal(dressedFrame.overflow, "visible", "Wide accessories must not be clipped by the body frame");
  const imageStyle = Object.assign({}, ...root.root.findByType("SkinImage").props.style);
  assert.ok(imageStyle.width > dressedFrame.width * 1.5);
});

test("the home chip renders cumulative ratios and pluralizes using the displayed total", (t) => {
  let root;
  t.after(() => React.act(() => root?.unmount()));
  for (const [count, isKo, expected] of [[2, true, "2단계2 / 4 클로버"], [4, true, "3단계4 / 6 클로버"], [1, false, "Lv.11 / 2 Clover"], [3, false, "Lv.23 / 4 Clovers"], [234, true, "21단계skin.maxLevel"]]) {
    React.act(() => {
      const element = React.createElement(CharacterScene, properties(count, isKo));
      if (root) root.update(element); else root = Renderer.create(element);
    });
    assert.equal(text(root.toJSON()), expected);
  }
});
