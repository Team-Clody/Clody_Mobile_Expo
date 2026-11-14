import type { ImageSourcePropType, ImageStyle } from "react-native";

export const HOME_CHARACTER_FRAME = { width: 128, height: 183 } as const;

const COSTUME_CHARACTERS: Record<number, ImageSourcePropType> = {
  1: require("@/assets/images/farmer.png"),
  2: require("@/assets/images/princess.png"),
  3: require("@/assets/images/devil.png"),
};

/** Known skins use the full character artwork shared with the wardrobe. */
export function getSkinCharacterSource(stage: string | number | null, url: string | null) {
  const stageNumber = Number(String(stage ?? "").match(/\d+/)?.[0]);
  return COSTUME_CHARACTERS[stageNumber] ?? (url ? { uri: url } : null);
}

/** Align padded 200×210 costume canvases with the base SVG's 118×167 body. */
export function getHomeSkinImageStyle(stage: string | number | null): ImageStyle {
  const stageNumber = Number(String(stage ?? "").match(/\d+/)?.[0]);
  if (!COSTUME_CHARACTERS[stageNumber]) return { ...HOME_CHARACTER_FRAME, left: 0, top: 0 };

  const scale = Math.min(HOME_CHARACTER_FRAME.width / 118, HOME_CHARACTER_FRAME.height / 167);
  return {
    width: 200 * scale,
    height: 210 * scale,
    left: (HOME_CHARACTER_FRAME.width - 200 * scale) / 2,
    top: (HOME_CHARACTER_FRAME.height - 167 * scale) / 2 - 40 * scale,
  };
}
