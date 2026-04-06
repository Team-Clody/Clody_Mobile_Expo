import { create } from "zustand";

interface UseStorage {
  claimedLevels: number[];
  equippedLevel: number | null;
  shouldReopenReward: boolean;
  claim: (level: number) => void;
  setEquipped: (level: number | null) => void;
  setShouldReopenReward: (value: boolean) => void;
}

export const useStorageStore = create<UseStorage>((set) => ({
  claimedLevels: [],
  equippedLevel: null,
  shouldReopenReward: false,
  claim: (level) =>
    set((state) => ({
      claimedLevels: state.claimedLevels.includes(level)
        ? state.claimedLevels
        : [...state.claimedLevels, level],
    })),
  setEquipped: (level) => set({ equippedLevel: level }),
  setShouldReopenReward: (value) => set({ shouldReopenReward: value }),
}));
