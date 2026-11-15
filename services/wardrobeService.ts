import { SkinAPI } from "@/api/skinAPI";
import { InventoryAPI } from "@/api/inventoryAPI";

export interface WardrobeItem {
  inventoryItemId: number;
  stage: number;
  url: string;
}

const parseStage = (value: string | null) => Number(String(value ?? "").match(/\d+/)?.[0] ?? 0);

export async function loadWardrobe() {
  const [skins, inventories, equipped] = await Promise.allSettled([
    SkinAPI.getSkinStatusList(),
    InventoryAPI.getUserInventories(),
    SkinAPI.getEquippedSkin(),
  ]);
  const items: WardrobeItem[] = [];
  const appearance = equipped.status === "fulfilled" ? equipped.value : null;
  const equippedId = appearance?.inventoryId ?? null;
  const equippedStage = parseStage(appearance?.skinCloverStage ?? null);

  // The equipped endpoint identifies the appearance directly; it must not depend
  // on the reward status list containing the item or the inventory flag being set.
  if (appearance && equippedId !== null) {
    items.push({ inventoryItemId: equippedId, stage: equippedStage, url: appearance.skinUrl ?? "" });
  }

  if (skins.status === "fulfilled" && inventories.status === "fulfilled") {
    const received = skins.value.skins.filter((s) => s.status === "RECEIVED")
      .filter((s) => equippedId === null || parseStage(s.cloverStage) !== equippedStage)
      .sort((a, b) => parseStage(a.cloverStage) - parseStage(b.cloverStage));
    const remaining = inventories.value.inventories.filter((i) => i.inventoryItemId !== equippedId)
      .sort((a, b) => Date.parse(a.acquiredAt) - Date.parse(b.acquiredAt));
    // Inventory rows contain no skinId. One remaining pair is unambiguous;
    // with several pairs, acquisition order does not establish their identity.
    const canMatch = received.length === remaining.length && received.length <= 1;
    if (canMatch) {
      received.forEach((skin, index) => {
        items.push({ inventoryItemId: remaining[index].inventoryItemId, stage: parseStage(skin.cloverStage), url: skin.url });
      });
    }
    const complete = equipped.status === "fulfilled" && canMatch;
    return { items: items.sort((a, b) => a.stage - b.stage), equippedId, equippedResolved: equipped.status === "fulfilled", complete };
  }
  return { items, equippedId, equippedResolved: equipped.status === "fulfilled", complete: false };
}

/** The equip endpoint toggles an already equipped item. Read first so retries are safe. */
export async function saveWardrobeSelection(inventoryId: number | null) {
  const current = await SkinAPI.getEquippedSkin();
  if (current.inventoryId === inventoryId) return;
  const itemToToggle = inventoryId ?? current.inventoryId;
  if (itemToToggle === null) return;
  await SkinAPI.equipSkin(itemToToggle);
  const saved = await SkinAPI.getEquippedSkin();
  if (saved.inventoryId !== inventoryId) throw new Error("Skin selection was not saved");
}
